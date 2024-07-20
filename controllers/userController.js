const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/userModels");
const AppError = require("../utils/AppError");
const {
    deleteOne,
    updateOne,
    getOne,
    getAll,
    createOne,
} = require("./factoryController");

exports.createUser = createOne(User);
exports.getAllUsers = getAll(User);
exports.getUser = getOne(User);
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
        return cb(null, true);
    }
    cb(new AppError("Not an image! please upload images only.", 400), false);
};
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

exports.resizePhoto = async (req, res, next) => {
    if (!req.file) return next();
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`);
    next();
};

exports.uploadUserPhoto = upload.single("photo");
exports.deleteAllUsers = async (req, res) => {
    await User.deleteMany({ role: "user" });
    res.status(204).json({
        status: "success",
        data: {},
    });
};

exports.getMe = (req, res, next) => {
    req.params.id = req.user._id;
    next();
};

exports.updateMe = async (req, res) => {
    const { name, password, passwordConfirm, email } = req.body;

    if (password || passwordConfirm) {
        throw new AppError("This route is not for updating passwords.", 400);
    }
    const data = { name, password };
    if (req.file) data.photo = req.file.filename;

    const user = await User.findByIdAndUpdate(req.user._id, data, {
        new: true,
        runValidators: true,
    });

    res.status(201).json({
        status: "success",
        data: { user },
    });
};

exports.deleteMe = async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user._id, { active: false });
    res.status(204).json({
        status: "success",
        data: null,
    });
};

exports.deleteTestUsers = async (req, res) => {
    await User.deleteMany({ name: /mehrad/, role: "user" });
    await User.deleteMany({ name: /user/ });
    await User.deleteMany({ name: /test/ });
    res.status(204).json({
        status: "success",
        data: null,
    });
};
