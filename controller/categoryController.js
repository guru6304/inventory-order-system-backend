const pool = require("../config/db");

const getAllCategories = async (req, res,next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM categories");
    return res.status(200).json({
      message: "All Categories Get Successful",
      data: rows,
    });
  } catch (err) {
    next(err);
  }
};
const createCategory = async (req,res,next) => {
  try {
    const {name } = req.body;
    if (!name?.trim()){
      return res.status(400).json({
        message: "Name is Required",
      });
    }
    const [rows] = await pool.query(
        "SELECT id from  categories where name=?",
        [name],
      );
    if (rows.length !== 0) {
      return res.status(409).json({
        message: "Category with Same Name Already Exist",
      });
    }
    const [result] = await pool.query(
      "INSERT INTO categories (name) VALUES (?)",
      [name],
    );
    return res.status(201).json({
        message:"Category Created Successfully",
        data:{
            id:result.insertId,
            name,
        },
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "This category Name Already Available"
      });
    }
    next(err);
  }
};
module.exports = { getAllCategories,createCategory };
