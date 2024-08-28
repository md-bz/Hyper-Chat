const mongoose = require("mongoose");
const Room = require("./roomModels");
const { nanoid } = require("nanoid");

const permissionsSchema = new mongoose.Schema({
    user: { type: String, default: "all" },
    read: { type: Boolean, default: true },
    message: { type: Boolean, default: true },
    pin: { type: Boolean, default: true },
    add: { type: Boolean, default: true },
    changeChat: { type: Boolean, default: true },
    media: { type: Boolean, default: true },
});

const Group = Room.discriminator(
    "Group",
    new mongoose.Schema(
        {
            users: {
                type: [mongoose.Schema.ObjectId],
                ref: "User",
                maxlength: 1000,
            },
            inviteLink: {
                type: String,
                default: () => nanoid(21),
            },
            publicId: {
                type: String,
                default: () => nanoid(24),
            },
            admins: { type: [String], maxlength: 20 },
            permissions: permissionsSchema,
            permissionExceptions: [permissionsSchema],
        },
        { discriminatorKey: "baseRoom" }
    )
);

module.exports = Group;
