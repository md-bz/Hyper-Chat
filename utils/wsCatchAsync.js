const { sendError } = require("./wsFeatures");

function catchAsync(func) {
    return async function (ws) {
        try {
            return await func.apply(this, arguments);
        } catch (e) {
            console.log(e);

            sendError(ws, e);
        }
    };
}

module.exports = catchAsync;
