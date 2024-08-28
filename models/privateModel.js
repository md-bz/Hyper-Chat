const mongoose = require("mongoose");
const Room = require("./roomModels");
const { nanoid } = require("nanoid");

const Private = Room.discriminator(
    "Private",
    new mongoose.Schema(
        {
            users: {
                type: [mongoose.Schema.ObjectId],
                ref: "User",
                maxlength: 2,
            },
            publicId: {
                type: String,
                default: () => nanoid(23),
            },
        },
        { discriminatorKey: "baseRoom" }
    )
);

module.exports = Private;
