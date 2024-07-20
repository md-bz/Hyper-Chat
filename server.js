const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const HyperExpress = require("hyper-express");
const morgan = require("morgan");

const { errorHandler } = require("./controllers/errorController");
const userRouter = require("./routes/userRoutes");
const wsRouter = require("./controllers/wsController");

const server = new HyperExpress.Server();

server.set_error_handler(errorHandler);
server.use(morgan("dev"));

server.use(async (req, res, next) => {
    req.body = await req.json();
});

server.use("/api/v1/users/", userRouter);

server.use("/api/ws", wsRouter);

// server.use(errorHandler);
const db = mongoose.connect(process.env.DB_LOCAL).then(() => {
    console.log("Connection to local DB was successful");
});

const port = process.env.PORT;
server.listen(port, () => {
    console.log(`server listing on ${port}`);
});
