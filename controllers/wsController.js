const HyperExpress = require("hyper-express");
const { verifyToken } = require("./authController");
const User = require("../models/userModels");
const Room = require("../models/roomModels");

const wsRouter = new HyperExpress.Router();
const activeSockets = {};

function send(ws, name = "noting", content = {}) {
    return ws.send(
        JSON.stringify({
            name,
            content,
        })
    );
}

async function sendError(ws, reason = "") {
    return send(ws, "error", { reason });
}

function catchAsync(f) {
    return async function (ws) {
        try {
            return await f.apply(this, arguments);
        } catch (e) {
            sendError(ws, String(e));
        }
    };
}

const sendUpdate = catchAsync(async (ws, userId, latestUpdateDate) => {
    // latestUpdateDate ? latestUpdateDate : 0;
    // userId = String(userId);

    const rooms = await Room.find(
        {
            users: userId,
            // messages: { timestamp: { $gte: "1987-10-19" } },
        },
        {
            name: 1,
            messages: 1,
            publicId: 1,
        }
    );
    console.log(rooms);

    return send(ws, "update", {
        update: rooms,
        latestUpdateDate: Date.now(),
    });
});

const handleLogin = catchAsync(async (ws, content) => {
    const { token, latestUpdateDate } = content;
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
    ws.name = user.name;
    ws.subscribe(ws.publicId);
    activeSockets[ws.publicId] = ws;

    console.log("rooms is", user.rooms);

    user.rooms.forEach((room) => ws.subscribe(room));

    send(ws, "logged in", {
        publicId: ws.publicId,
        name: ws.name,
        usernameId: user.usernameId,
    });

    sendUpdate(ws, user._id, latestUpdateDate);
});

const handleTextMessage = catchAsync(async (ws, content) => {
    const { publicId, text } = content;
    if (!ws.is_subscribed(publicId)) return sendError(ws, "unauthorized");

    const room = await Room.findOneAndUpdate(
        { publicId },
        {
            $push: { messages: { text, from: ws.publicId } },
        },
        { new: true }
    );
    if (!room) return sendError(ws, "no chat with that id");
    const response = JSON.stringify({
        event: "text message",
        content: {
            publicId,
            sender: {
                publicId: ws.publicId,
                name: ws.name,
            },
            text,
        },

        latestUpdateDate: Date.now(),
    });

    ws.send(response);
    return ws.publish(content.publicId, response);
});

async function handleJoin(ws, content) {
    const { chatId } = content;
    if (!chatId) return sendError(ws, "no id provided");

    const chat = await Room.findOne({ chatId });
    if (!chat) return sendError(ws, "no chat with that id");

    const user = await User.findOne({
        privateId: ws.privateId,
    });

    chat.users.push(user._id);

    await chat.save();

    const { name, privateId, usernameID } = user;
    ws.publish(chat.publicId, {
        name: "new member",
        content: { name, privateId, usernameID },
    });
}

async function handleCreateChat(ws, content) {
    const { publicIds, type, name } = content; // public id of the other person
    const users = await User.find({
        publicId: { $in: [ws.publicId, ...publicIds] },
    });
    await Room.deleteMany();

    let usersId = [];
    let usersInfo = [];
    let creator = {};

    users.forEach((user) => {
        usersId.push(user._id);

        const { name, publicId, usernameId } = user;
        usersInfo.push({ name, publicId, usernameId });

        if (publicId === ws.publicId) creator = user;
    });

    const room = await Room.create({
        users: users.map((user) => user._id),
        creator: creator._id,
        type,
        name,
    });

    users.forEach(async (user) => {
        user.rooms.push(room.publicId);
        await user.save({ validateBeforeSave: false });
        if (activeSockets[user.publicId]) {
            activeSockets[user.publicId].subscribe(room.publicId);
        }
    });
    const response = JSON.stringify({
        name: "new chat created",
        content: {
            usersInfo,
            room: {
                type,
                publicId: room.publicId,
            },
        },
    });
    ws.send(response);
    return ws.publish(room.publicId, response);
}

wsRouter.ws(
    "/",
    {
        idle_timeout: 60,
        max_payload_length: 32 * 1024,
    },
    async (ws) => {
        console.log(ws.ip + " is now connected using websockets!");

        ws.send("login");

        let loginTimeout = setTimeout(() => {
            ws.close(1002, "login not received.");
        }, 5000);

        ws.on("message", async (message) => {
            console.log(message);

            try {
                const { name, content } = await JSON.parse(message);

                switch (name) {
                    case "login":
                        clearTimeout(loginTimeout);
                        return handleLogin(ws, content);

                    case "text message":
                        return handleTextMessage(ws, content);

                    case "join":
                        return handleJoin(ws, content);
                    case "create private chat":
                        return handleCreateChat(ws, content);
                    case "create public chat":

                    default:
                        break;
                }
            } catch (error) {
                console.log(error);
                sendError(ws, error);
            }
        });

        ws.on("close", () => {
            console.log(ws.ip + " has now disconnected!");
            delete activeSockets[ws.publicId];
        });
    }
);

module.exports = wsRouter;
