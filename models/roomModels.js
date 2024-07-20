const mongoose = require("mongoose");
const { nanoid } = require("nanoid");

const messageSchema = new mongoose.Schema({
    text: { type: String, required: true },
    from: { type: String, required: true }, // public id of sender
    seenStatus: { type: String, default: "unseen", enum: ["unseen", "seen"] },

    timeStamp: {
        type: Date,
        default: Date.now(),
    },
});

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: function () {
            if (this.type === "private") return false;
            return [true, "A room needs a name"];
        },
    },

    chatId: {
        type: String,
        default: function () {
            if (this.type === "private") return "";
            return nanoid(23);
        },
    },

    publicId: {
        type: String,
        default: () => nanoid(30),
    },

    creator: {
        type: mongoose.Schema.ObjectId,
        required: true,
    },
    type: {
        type: String,
        default: "private",
        enum: ["private", "group", "channel"],
    },

    users: {
        type: [mongoose.Schema.ObjectId],
        ref: "User",
        maxlength: function () {
            if (this.type === "private") return 2;
            return 100;
        },
    },
    messages: {
        type: [messageSchema],
        select: false,
    },
});

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
