const { getAllProducts, getProductById, createProducts, updateProducts, deleteProducts } = require("../controller/productsController");
const { verifyToken, verifyAdmin } = require("../middleware/authmiddleware");
const upload = require("../middleware/upload");

const router = require("express").Router();

router.get("/", getAllProducts);

router.get("/:id", getProductById);

router.post("/", verifyToken, verifyAdmin, upload.single("image"), createProducts);

router.put("/:id", verifyToken, verifyAdmin, updateProducts);

router.delete("/:id", verifyToken, verifyAdmin, deleteProducts);

module.exports = router;