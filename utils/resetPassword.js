const crypto = require("crypto");
exports.createResetToken = (size) => crypto.randomBytes(32).toString("hex");
exports.hashResetToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");
