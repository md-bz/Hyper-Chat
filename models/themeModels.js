const mongoose = require("mongoose");

const themeSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        minlength: 5,
        maxlength: 12,
        required: [true, "A theme needs a name "],
    },
    values: Object,
});

const Theme = mongoose.model("Theme", themeSchema);
