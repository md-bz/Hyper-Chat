const HyperExpress = require("hyper-express");
const wsController = require("../controllers/wsController");
const { send, sendError } = require("../utils/wsFeatures");

const wsRouter = new HyperExpress.Router();

const timeout = 5000; //ms
wsRouter.ws(
    "/",
    {
        idle_timeout: 60,
        max_payload_length: 32 * 1024,
    },
    async (ws) => {
        if (process.env.NODE_ENV === "development")
            console.log(ws.ip + " is now connected using websockets!");

        // ws.send("login");

        let loginTimeout = setTimeout(() => {
            ws.close(1002, "login not received.");
        }, timeout);

        ws.on("message", async (message) => {
            if (process.env.NODE_ENV === "development")
                console.log("new message:", message);

            let name, content;

            try {
                ({ name, content } = await JSON.parse(message));
            } catch (error) {
                return sendError(ws, "Wrong json format! failed to parse.");
            }

            if (!name || !content)
                return sendError(
                    ws,
                    "wrong format! 'name' and 'content' should be provided in json form."
                );

            if (loginTimeout) {
                clearTimeout(loginTimeout);
                loginTimeout = null;
                return wsController.handleLogin(ws, content);
            }

            switch (name) {
                case "text message":
                    return wsController.handleTextMessage(ws, content);
                case "seen message":
                    return wsController.seenMessage(ws, content);
                case "join":
                    return wsController.handleJoin(ws, content);
                case "create chat":
                    return wsController.handleCreateChat(ws, content);
                case "get updates":
                    return wsController.getUpdates(ws, content);
                case "test":
                    return wsController.test(ws, content);
                case "delete message":
                    return wsController.handleDeleteMessage(ws, content);

                default:
                    sendError(ws, "unknown action name");
                    break;
            }
        });

        ws.on("close", () => {
            wsController.handleClose(ws);
        });
    }
);

module.exports = wsRouter;
