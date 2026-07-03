const { createOrder, getMyOrders, getAllOrders, cancelOrder, confirmOrder } = require("../controller/orderController");
const { verifyToken, verifyAdmin } = require("../middleware/authmiddleware");

const router = require("express").Router();

router.post("/",verifyToken,createOrder);

router.get("/my",verifyToken,getMyOrders);

router.get("/",verifyToken,verifyAdmin,getAllOrders);

router.put("/:id/cancel",verifyToken, cancelOrder);

router.put("/:id/confirm",verifyToken,verifyAdmin, confirmOrder);

module.exports= router;
