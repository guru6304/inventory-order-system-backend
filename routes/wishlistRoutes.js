const { addToWishlist, getWishlist, deleteWishlist } = require("../controller/wishlistController");
const { verifyToken } = require("../middleware/authmiddleware");

const router = require("express").Router();

router.get("/",verifyToken,getWishlist);

router.post("/",verifyToken,addToWishlist);

router.delete("/:productId",verifyToken,deleteWishlist);

module.exports= router;