const mongoose = require("mongoose");
const { nanoid } = require("nanoid");
const User = require("./userModels");

const messageSchema = new mongoose.Schema({
    // server messages that save the changes in the chat for example someone leaving
    text: { type: String, required: true },
    from: { type: String, required: true }, // public id of sender

    numberId: {
        type: Number,
    },
    seenStatus: { type: String, default: "unseen", enum: ["unseen", "seen"] },

    timeStamp: {
        type: Date,
        default: Date.now(),
    },
});

const roomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },

        chatId: {
            type: String,
            default: () => nanoid(20),
        },

        // inviteLink: {
        //     type: String,
        //     default: () => nanoid(21),
        // },
        // publicId: {
        // type: String,
        // default: () => nanoid(30),
        // },

        creator: {
            type: mongoose.Schema.ObjectId,
            required: true,
        },
        // type: {
        //     type: String,
        //     default: "private",
        //     enum: ["private", "group", "channel"],
        // },

        // users: {
        //     type: [mongoose.Schema.ObjectId],
        //     ref: "User",
        //     maxlength: function () {
        //         if (this.type === "private") return 2;
        //         return 100;
        //     },
        // },
        messages: {
            type: [messageSchema],
            select: false,
        },
        messageCount: { type: Number, default: () => 1 }, // the first message is the group created message
        eventCount: {
            type: String,
            default: 0,
        },
    },
    { discriminatorKey: "baseRoom" }
);

roomSchema.pre(/delete/, async function (next) {
    await User.updateMany(
        { rooms: this.publicId },
        { $pull: { rooms: this.publicId } }
    );
    next();
});

roomSchema.pre("findOneAndUpdate", async function (next) {
    const update = this.getUpdate();
    if (
        !update ||
        !update["$push"] ||
        !update["$push"] ||
        !update["$push"].messages
    )
        return;

    const messageUpdate = update["$push"].messages;

    const room = await this.clone().findOne(this.getQuery());

    messageUpdate.numberId = room.messageCount + 1;
    update.$inc = { messageCount: 1 };
    this.setUpdate(update);
    next();
});

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
