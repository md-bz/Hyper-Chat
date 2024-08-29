const crypto = require("crypto");
// Generate asymmetric key pair for User 1
const user1KeyPair = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
});
// WebSocket connection URL
const wsURL = "ws://localhost:3000/api/ws"; // Replace with your actual WebSocket server URL
const wsUser1 = new WebSocket(wsURL);

let cipher, decipher;

function login(ws) {
    ws.send(
        JSON.stringify({
            name: "login",
            content: {
                token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2Y2Q5ZTkwNTljZTE0MzZjMDhkYTZhMSIsImlwIjoiMTI3LjAuMC4xIiwiaWF0IjoxNzI0NzUxNTA5LCJleHAiOjE3MjUzNTYzMDl9.XPfOhL08L38xiTVA3RPRYL2l6SMgdF_952ya8b8HJQY", // Replace with actual JWT creation logic
            },
        })
    );
}

function createChat(ws, publicIds) {
    ws.send(
        JSON.stringify({
            name: "create chat",
            content: {
                name: "test chat",
                type: "private",
                publicIds,
            },
        })
    );
}

wsUser1.onopen = () => {
    login(wsUser1, "User 1");
};

// Handle incoming messages
wsUser1.onmessage = (message) => {
    const data = JSON.parse(message.data);
    // console.log(data);

    if (data.name === "logged in")
        createChat(wsUser1, ["TvTMhYLIVy4D5ScKO1geelX8I"]);

    if (data.name === "new chat created") {
        console.log("Chat created with users:", data.content.usersInfo);
        const roomId = data.content.room.publicId;
        wsUser1.roomId = roomId;

        wsUser1.send(
            JSON.stringify({
                name: "text message",
                content: {
                    publicId: wsUser1.roomId,
                    text: "PublicKey",
                    publicKey: user1KeyPair.publicKey,
                },
            })
        );

        console.log("send public key");
    }

    if (!data.content) return;
    const content = data.content;

    if (
        data.name === "text message" &&
        content.symmetricKey &&
        content.symmetricIv
    ) {
        const key = crypto.privateDecrypt(
            user1KeyPair.privateKey,
            new Uint8Array(content.symmetricKey.data)
        );

        const iv = crypto.privateDecrypt(
            user1KeyPair.privateKey,
            new Uint8Array(content.symmetricIv.data)
        );

        cipher = crypto.createCipheriv("aes-192-gcm", key, iv);
        decipher = crypto.createDecipheriv("aes-192-gcm", key, iv);

        const encrypted = cipher.update(Buffer.from("this should work."));

        wsUser1.send(
            JSON.stringify({
                name: "text message",
                content: {
                    publicId: wsUser1.roomId,
                    text: "text",
                    encrypted,
                },
            })
        );
    }
};
