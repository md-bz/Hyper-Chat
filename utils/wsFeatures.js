function send(ws, name = "noting", content = {}) {
    return ws.send(
        JSON.stringify({
            name,
            content,
        })
    );
}

function sendError(ws, reason = "") {
    return send(ws, "error", { reason });
}

function sendFormatError(ws, args = []) {
    return sendError(
        ws,
        `Wrong Format content must provide ${args.join(", ")}.`
    );
}
module.exports = { send, sendError, sendFormatError };
