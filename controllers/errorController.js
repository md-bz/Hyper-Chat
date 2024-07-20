const AppError = require("../utils/AppError");

const sendDevError = (err, req, res) => {
    // API
    if (req.originalUrl.startsWith("/api")) {
        return res.status(err.statuscode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    }
    // Website
    res.status(err.statuscode).render("error", {
        title: "Something went very wrong",
        msg: err.message,
    });
};

const sendProdErr = (err, req, res) => {
    // API
    if (req.originalUrl.startsWith("/api")) {
        // Programming or unknown error, don't leak details
        if (!err.isOperational) {
            console.error("error", err);
            return res.status(500).json({
                status: "error",
                message: "Something went very wrong!",
            });
        }

        return res.status(err.statuscode).json({
            status: err.status,
            message: err.message,
        });
    }

    // Website
    if (!err.isOperational) {
        // Programming or unknown error, don't leak details
        console.error("Error", err);
        return res.status(err.statuscode).render("error", {
            title: "Something went wrong!",
            msg: "Please try Again later",
        });
    }

    res.status(err.statuscode).render("error", {
        title: "Something went very wrong",
        msg: err.message,
    });
};

const handleCastErrorDB = (err) => {
    return new AppError(`Invalid ${err.path}: ${err.value}.`, 400);
};

const handleDuplicateErrorDB = (err) => {
    const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];

    return new AppError(
        `Duplicate field value: ${value}, use another value.`,
        400
    );
};

const handleValidateErrorDB = (err) => {
    const errors = Object.values(err.errors).map((element) => element.message);

    const message = `Invalid input data. ${errors.join(". ")}`;
    return new AppError(message, 400);
};

const handleJWTError = (err) =>
    new AppError("Invalid token. Please log in again", 401);

const handleTokenExpiredError = (err) =>
    new AppError("Login timeout. Please log in again", 401);

exports.errorHandler = (req, res, err) => {
    err.status = err.status || "fail";
    err.statuscode = err.statuscode || 500;

    if (process.env.NODE_ENV === "production") {
        let error = { ...err };
        error.message = err.message;

        if (err.name === "CastError") error = handleCastErrorDB(err); // error.name isn't copied so err.name is checked
        if (err.code === 11000) error = handleDuplicateErrorDB(err);
        if (err.name === "ValidationError") error = handleValidateErrorDB(err);
        if (err.name === "JsonWebTokenError") error = handleJWTError(err);
        if (err.name === "TokenExpiredError")
            error = handleTokenExpiredError(err);

        return sendProdErr(error, req, res);
    }

    sendDevError(err, req, res);
};
