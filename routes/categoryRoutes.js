const { getAllCategories, createCategory } = require("../controller/categoryController");
const { verifyToken, verifyAdmin } = require("../middleware/authmiddleware");

const router = require("express").Router();

router.get("/", getAllCategories);

router.post("/",verifyToken,verifyAdmin, createCategory);

module.exports= router;
