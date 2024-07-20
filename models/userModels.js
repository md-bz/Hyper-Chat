const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { nanoid } = require("nanoid");

const userSchema = new mongoose.Schema({
    // name userID phto
    name: {
        type: String,
        unique: true,
        required: [true, "Name is required"],
        trim: true,
        minlength: [3, "Name must have more then 3 charters"],
        maxlength: [20, "Name must have less then 20 charters"],
    },
    email: {
        type: String,
        required: [true, "A user must have an email"],
        unique: true,
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, "Provide a valid email"],
        select: false,
    },
    privateId: {
        type: String,
        unique: true,
        default: () => nanoid(28),
    },
    publicId: {
        type: String,
        unique: true,
        default: () => nanoid(25),
    },

    usernameId: {
        type: String,
        minlength: [3, "Name must have more then 3 charters"],
        maxlength: [12, "Name must have less then 12 charters"],
    },

    profilePhoto: { type: String, default: "default.jpg" },
    photos: [String],
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    password: {
        type: String,
        required: [true, "A user must have a password"],
        trim: true,
        minlength: [10, "Password must be more then 10 charters"],
        validate: function (element) {
            validator.isAlphanumeric(element, "en-US", "_");
        },
    },

    passwordConfirm: {
        type: String,
        required: [true, "Confirm your password"],

        // only works on create and save
        validate: {
            validator: function (element) {
                return this.password === element;
            },
            message: "Passwords aren't matched!",
        },
    },
    rooms: {
        // type: [mongoose.Schema.ObjectId],
        // ref: "Room",
        type: [String],
    },

    online: {
        // for other users to see
        type: String,
        default: "Online",
        enum: ["Online", "last seen recently"],
    },

    status: {
        // for server
        type: String,
        default: "Online",
        enum: ["Online", "Offline"],
    },

    passwordChangedAt: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    if (!this.isNew) {
        this.passwordChangedAt = Date.now() - 1000;
    }

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});

userSchema.methods.isPasswordCorrect = async (
    candidatePassword,
    userPassword
) => await bcrypt.compare(candidatePassword, userPassword);

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        console.log(JWTTimestamp, changedTimestamp);

        return JWTTimestamp < changedTimestamp;
    }

    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = createResetToken(32);
    this.passwordResetToken = hashResetToken(resetToken);
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
