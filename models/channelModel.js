const mongoose = require("mongoose");
const Room = require("./roomModels");

const permissionsSchema = new mongoose.Schema({
    // for now this is the same as groupModel might change in feature
    user: { type: String, default: "all" },
    read: { type: Boolean, default: true },
    message: { type: Boolean, default: true },
    pin: { type: Boolean, default: true },
    add: { type: Boolean, default: true },
    changeChat: { type: Boolean, default: true },
    media: { type: Boolean, default: true },
});

const Channel = Room.discriminator(
    "Channel",
    new mongoose.Schema(
        {
            users: {
                type: [mongoose.Schema.ObjectId],
                ref: "User",
                maxlength: 100,
            },
            inviteLink: {
                type: String,
                default: () => nanoid(22),
            },
            publicId: {
                type: String,
                default: () => nanoid(25),
            },
            admins: { type: [String], maxlength: 20 },
            permissions: permissionsSchema, // for admins
            permissionExceptions: [permissionsSchema], // for admins
        },
        { discriminatorKey: "baseRoom" }
    )
);

module.exports = Channel;
