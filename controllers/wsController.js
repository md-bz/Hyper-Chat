const { verifyToken } = require("./authController");
const User = require("../models/userModels");
const Room = require("../models/roomModels");
const catchAsync = require("../utils/wsCatchAsync");
const { send, sendError, sendFormatError } = require("../utils/wsFeatures");

const fs = require("fs/promises");
const Private = require("../models/privateModel");
const Group = require("../models/groupModel");

const activeSockets = {};

const sendUpdate = catchAsync(async (ws, userId, latestUpdateDate) => {
    // latestUpdateDate ? latestUpdateDate : 0;
    // userId = String(userId);

    const rooms = await Room.find(
        {
            users: userId,
            // #TODO: updates based on timestamp
            // messages: { timestamp: { $gte: "1987-10-19" } },
        },
        {
            name: 1,
            messages: 1,
            publicId: 1,
        }
    );

    return send(ws, "update", {
        update: rooms,
        latestUpdateDate: Date.now(),
    });
});

exports.getUpdates = catchAsync(async (ws, content) => {
    const { chats } = content;
    const updates = [];

    for (let i = 0; i < chats.length; i++) {
        const chat = chats[i];

        const update = await Room.find(
            {
                publicId: chat.publicId,
            },
            {
                messages: { $slice: [chat.lastMessageId, 10000] },
            }
        );
        updates.push(update);
    }

    send(ws, "update", updates);
});

exports.handleLogin = catchAsync(async (ws, content) => {
    const { token } = content;

    if (!token) return ws.close(1002, "no token provided");

    let decoded;

    try {
        decoded = await verifyToken(token);
    } catch (error) {
        return ws.close(1002, "token not valid");
    }

    if (decoded.ip !== ws.ip) return ws.close(1002, "Ips aren't matched!");

    const user = await User.findById(decoded.id);

    if (!user) return ws.close(1002, "no user with that token");

    ws.publicId = user.publicId;
    ws.privateId = user.privateId;
    ws.mongoId = user._id;
    ws.name = user.name;
    ws.subscribe(ws.publicId);
    activeSockets[ws.publicId] = ws;

    user.rooms.forEach((room) => ws.subscribe(room));

    send(ws, "logged in", {
        publicId: ws.publicId,
        name: ws.name,
        usernameId: user.usernameId,
    });
});

exports.handleTextMessage = catchAsync(async (ws, content) => {
    const { publicId, text, publicKey, symmetricKey, symmetricIv, encrypted } =
        content;

    if (!publicId || !text) return sendFormatError(ws, ["publicId", "text"]);

    if (!ws.is_subscribed(publicId)) {
        const room = await Room.findOne({ publicId, users: ws.mongoId });

        if (!room) return sendError(ws, "unauthorized");
        ws.subscribe(publicId);
    }

    const room = await Room.findOneAndUpdate(
        { publicId },
        {
            $push: { messages: { text, from: ws.publicId } },
        },
        { new: true, projection: { messages: 1, messages: { $slice: -1 } } }
    );

    if (!room) return sendError(ws, "no chat with that id");

    const numberId = room.messages[0].numberId;
    console.log("room is ", room);

    const response = JSON.stringify({
        name: "text message",
        content: {
            publicId,
            numberId,
            sender: {
                publicId: ws.publicId,
                name: ws.name,
            },
            text,
            publicKey,
            symmetricKey,
            symmetricIv,
            encrypted,
        },
    });

    ws.send(response);
    return ws.publish(content.publicId, response);
});

exports.handleJoin = catchAsync(async (ws, content) => {
    const { inviteLink } = content;
    if (!inviteLink) return sendFormatError(ws, ["invite link"]);

    const user = await User.findOne({ publicId: ws.publicId });

    const text = `${user.name} joined the group by invite link.`;
    const room = await Room.findOneAndUpdate(
        { inviteLink },
        {
            $push: {
                users: user._id,
                messages: {
                    from: "server",
                    text,
                },
            },
        },
        { new: true, projection: { messages: 1, messages: { $slice: -1 } } }
    );
    if (!room) return sendError(ws, "no chat with that invite link");

    user.rooms.push(room.publicId);
    await user.save({ validateBeforeSave: false });
    ws.subscribe(room.publicId);

    const response = JSON.stringify({
        event: "text message",
        content: {
            publicId: room.publicId,
            numberId: room.messages[0].numberId,
            sender: {
                publicId: "Server",
                name: "Server",
            },
            text,
        },
    });

    ws.send(response);
    return ws.publish(room.publicId, response);
});

exports.handleCreateChat = catchAsync(async (ws, content) => {
    const { publicIds, type, name } = content; // public id of the other person
    const users = await User.find({
        publicId: { $in: [ws.publicId, ...publicIds] },
    });

    let usersId = [];
    let usersInfo = [];
    let creator = {};

    users.forEach((user) => {
        usersId.push(user._id);

        const { name, publicId, usernameId } = user;

        usersInfo.push({ name, publicId, usernameId });

        if (publicId === ws.publicId) creator = user;
    });

    let room;
    if (type === "private") {
        room = await Private.create({
            users: users.map((user) => user._id),
            creator: creator._id,
            name,

            messages: [{ from: "server", text: "chat created", numberId: 1 }],
        });
    } else if (type === "group") {
        room = await Group.create({
            users: users.map((user) => user._id),
            creator: creator._id,
            name,
        });
    }

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        user.rooms.push(room.publicId);
        user.seenMessages.push({
            publicId: room.publicId,
            lastSeenMessage: 0,
        });
        await user.save({ validateBeforeSave: false });

        if (activeSockets[user.publicId]) {
            await activeSockets[user.publicId].subscribe(room.publicId);
        }
    }

    const response = JSON.stringify({
        name: "new chat created",
        content: {
            usersInfo,
            room: {
                type,
                publicId: room.publicId,
                inviteLink: room.inviteLink,
            },
        },
    });

    ws.publish(room.publicId, response);
    return ws.send(response);
});

exports.seenMessage = catchAsync(async (ws, content) => {
    const { chat } = content;

    await User.findOneAndUpdate(
        { publicId: ws.publicId, "seenMessages.publicId": chat.publicId },
        { $set: { "seenMessages.$.lastSeenMessage": chat.numberId } }
    );

    await Room.findOneAndUpdate(
        {
            publicId: chat.publicId,
        },
        {
            $set: { "messages.$[i].seenStatus": "seen" },
        },
        {
            arrayFilters: [{ "i.numberId": { $lte: chat.numberId } }],
        }
    );

    send(ws, "seen", { response: "ok" });
});

exports.test = catchAsync(async (ws, content) => {
    const file = await fs.readFile("./controllers/authController.js", "utf-8");

    send(ws, "very large info", { file });
});

exports.handleClose = (ws) => {
    if (process.env.NODE_ENV === "development")
        console.log(ws.ip + " has now disconnected!");
    delete activeSockets[ws.publicId];
};

exports.handleDeleteMessage = catchAsync(async (ws, content) => {
    // TODO: decide how the delete works in pv (should u be able to delete the other person's shit)
    const { publicId, numberId } = content;

    const room = await Room.findOneAndUpdate(
        {
            publicId,
            messages: { numberId, from: ws.publicId },
        },
        { $pull: { "messages.numberId": numberId } }
    );

    console.log(room);
    send(ws, "ok", { info: "ok" });
});
