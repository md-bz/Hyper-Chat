const Room = require("../models/roomModels");
const factory = require("./factoryController");

exports.getAllRooms = factory.getAll(Room);
exports.deleteAllRooms = factory.deleteAll(Room);

exports.getRoom = async (req, res, next) => {
    const { roomID } = req.body;
    const room = await Room.findById(roomID, "messages").populate(
        "users",
        "name userID usernameID photos online"
    );

    // socket.emit("room details", room);
    res.status(200).json({ status: "success", data: room });
};

exports.addMessage = async (req, res, next) => {
    const { message, roomID } = req.body;

    const room = await Room.findByIdAndUpdate(
        roomID,
        {
            $push: { messages: { content: message, from: "postman" } },
        },
        { new: true }
    );

    const messages = room.messages;

    const update = [];
    for (let i = message.length - 1; i > 0; i--) {
        if (messages[i]._id == "662e28322ffd4b186f1c4cc2") break;
        update.push(messages[i]);
    }

    update.reverse();

    res.status(200).json({ status: "success", data: update });
};

exports.createRoom = async (req, res, next) => {
    const { name, type } = req.body;

    let users = req.body.users || [];
    users.push(req.user);

    const room = await Room.create({ name, type, users });

    res.status(200).json({ status: "success", data: room });
};

exports.joinRoom = async (req, res, next) => {
    const { roomLink } = req.body;
    const user = req.user;
    const room = await Room.findOne({ link: roomLink });
    room.users.push(user);
    room.save();
    res.status(200).json({ status: "success", data: room });
};
