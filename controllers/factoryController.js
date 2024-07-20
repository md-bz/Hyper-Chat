const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/AppError");

exports.deleteOne = (Model) => async (req, res) => {
    const document = await Model.findByIdAndDelete(req.params.id);
    if (!document) {
        throw new AppError("No document with that id", 404);
    }

    res.status(204).json({
        status: "success",
        data: {},
    });
};

exports.deleteAll = (Model) => async (req, res) => {
    await Model.deleteMany();
    res.status(204).json({
        status: "success",
        data: {},
    });
};

exports.updateOne = (Model) => async (req, res) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!document) {
        throw new AppError("No document with that id", 404);
    }
    res.status(200).json({
        status: "success",
        data: { document },
    });
};

exports.createOne = (Model) => async (req, res) => {
    const document = await Model.create(req.body);

    res.status(201).json({ status: "success", data: { document } });
};

exports.getOne = (Model, populateOptions) => async (req, res) => {
    const query = populateOptions
        ? Model.findById(req.params.id).populate(populateOptions)
        : Model.findById(req.params.id);
    const document = await query;

    if (!document) {
        throw new AppError("No document with that id", 404);
    }

    res.status(200).json({
        status: "success",
        data: { document },
    });
};

exports.getAll = (Model) => async (req, res) => {
    // For nested tour/:id/reviews
    const filter = req.params.tourId ? { tour: req.params.tourId } : {};

    const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const document = await features.query;

    res.status(200).json({
        status: "success",
        requestTime: req.responseTime,
        results: document.length,
        data: { document },
    });
};
