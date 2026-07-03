const { registerController, loginController, getMe } = require("../controller/authController");
const { verifyToken } = require("../middleware/authmiddleware");

const router= require("express").Router();

router.post("/register",registerController);

router.post("/login",loginController);

router.get("/me", verifyToken,getMe);

module.exports= router;
