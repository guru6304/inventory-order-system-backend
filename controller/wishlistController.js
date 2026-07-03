const pool = require("../config/db");
const addToWishlist = async (req, res,next) => {
  try {
    const user_id = req.user.id;
    const product_id = req.body.product_id;
    if (!product_id) {
      return res.status(400).json({
        message: "Invalid Product_id",
      });
    }
    const [rows] = await pool.query(
      "SELECT id,category_id,name FROM products where id=?",
      [product_id],
    );
    if (rows.length === 0) {
      return res.status(404).json({
        message: "Product Not Found",
      });
    }
    const [validateWishlistRows] = await pool.query(
      "SELECT id,product_id,user_id from wishlist where product_id=? AND user_id=?",
      [product_id, user_id],
    );
    if (validateWishlistRows.length !== 0) {
      return res.status(409).json({
        message: "Product Already exist in Wishlist",
      });
    }
    await pool.query("INSERT INTO wishlist (user_id,product_id) VALUES (?,?)", [
      user_id,
      product_id,
    ]);
    res.status(201).json({
      message: "Wishlist Created Successfully",
      data: { product_id },
    });
  } catch (err) {
    next(err);
  }
};

const getWishlist = async (req, res,next) => {
  try {
    const user_id = req.user.id;
    const [rows] = await pool.query(
      "SELECT w.product_id,p.category_id,p.name as product_name,p.price as product_price,p.stock_quantity FROM wishlist as w join products as p on w.product_id= p.id WHERE w.user_id =?",[user_id]
    );
    if (rows.length === 0) {
      return res.status(200).json({
        message: "Wishlist is empty",
        data: [],
      });
    }
    return res.status(200).json({
      message: "Wishlist fetched successfully",
      data: rows
    });
  } catch (err) {
    next(err);
  }
};

const deleteWishlist = async (req,res,next)=>{
    try{
        const user_id= req.user.id;
    const product_id = req.params.productId;
    if(!product_id){
        return res.status(400).json({
        message: "Invalid Product_id",
      });
    }
    const [rows]= await pool.query("SELECT user_id,product_id FROM wishlist where user_id=? AND product_id=?",[user_id,product_id]);
    if(rows.length===0){
        return res.status(404).json({
            message:"wishlist item not found"
        });
    }
    const [wishlistRows] = await pool.query("DELETE FROM wishlist where  user_id=? AND product_id=?",[user_id,product_id]);
    return res.status(200).json({
        message:"Wishlist item removed successfully",
        data: {product_id}
    });
    }catch(err){
        next(err);
    }
};
module.exports = { addToWishlist,getWishlist,deleteWishlist };
