const crypto = require("crypto");

const key = crypto.randomBytes(24);

const iv = crypto.randomBytes(12);

const cipher = crypto.createCipheriv("aes-192-gcm", key, iv);
const decipher = crypto.createCipheriv("aes-192-gcm", key, iv);

const wsURL = "ws://localhost:3000/api/ws";
const wsUser2 = new WebSocket(wsURL);

function login(ws) {
    ws.send(
        JSON.stringify({
            name: "login",
            content: {
                token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2Y2Q5ZTk4NTljZTE0MzZjMDhkYTZhMyIsImlwIjoiMTI3LjAuMC4xIiwiaWF0IjoxNzI0NzUxNTE3LCJleHAiOjE3MjUzNTYzMTd9.vcenO8IVQJp8NLMyMLSGKVykDUk1SSpR2V63Dyhgdt4", // Replace with actual JWT creation logic
            },
        })
    );
}

wsUser2.onopen = () => {
    login(wsUser2);
    console.log("user 2 logged in");
};

wsUser2.onmessage = (message) => {
    const data = JSON.parse(message.data);
    // console.log(data);

    if (data.name === "new chat created") {
        console.log("Chat created with users:", data.content.usersInfo);
        wsUser2.roomId = data.content.room.publicId;
    }

    if (!data.content) return;
    const content = data.content;
    if (data.name === "text message" && content.publicKey) {
        const symmetricKey = crypto.publicEncrypt(content.publicKey, key);
        const symmetricIv = crypto.publicEncrypt(content.publicKey, iv);

        wsUser2.send(
            JSON.stringify({
                name: "text message",
                content: {
                    publicId: wsUser2.roomId,
                    text: "symmetric",
                    symmetricKey,
                    symmetricIv,
                },
            })
        );

        console.log("User 2 sent encrypted symmetric key");
    }

    if (data.name === "text message" && content.encrypted) {
        let decryptedMessage = decipher.update(
            new Uint8Array(content.encrypted.data)
        );

        console.log(
            "User 2 received and decrypted message:",
            decryptedMessage.toString()
        );

        const encrypted = cipher.update(Buffer.from("this indeed works!"));
    }
};
