const HyperExpress = require("hyper-express");

const userController = require("../controllers/userController");

const authController = require("../controllers/authController");

const userRouter = new HyperExpress.Router();

userRouter.route("/signup").post(authController.signup);
userRouter.route("/login").post(authController.login);
userRouter.route("/logout").get(authController.logout);

// #TODO : the commented lines need to be redone somehow
// userRouter.use(authController.protect);

userRouter.route("/change-password").patch(authController.changePassword);
userRouter
    .route("/update-me")
    .patch(
        userController.uploadUserPhoto,
        userController.resizePhoto,
        userController.updateMe
    );
userRouter.route("/delete-me").delete(userController.deleteMe);
userRouter.route("/me").get(userController.getMe, userController.getUser);

// userRouter.use(authController.restrictTo("admin"));

userRouter.route("/delete-tests").delete(userController.deleteTestUsers);
userRouter
    .route("/")
    .get(authController.protect, userController.getAllUsers)
    .post(userController.createUser)
    .delete(userController.deleteAllUsers);
userRouter
    .route("/:id")
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = userRouter;
