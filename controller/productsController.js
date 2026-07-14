const pool = require("../config/db");

const getAllProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      "SELECT p.id, p.category_id,p.name,p.description,p.price,p.stock_quantity, p.file_name, p.folder_name, c.name as category_name from products p join categories c on p.category_id= c.id LIMIT ? OFFSET ?",
      [limit, offset]
    );

    const [totalRows] = await pool.query("SELECT COUNT(*) as count FROM products");
    const totalPages = Math.ceil(totalRows[0].count / limit);

    return res.status(200).json({
      message: "Products Fetch Successful",
      data: rows,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems: totalRows[0].count
      }
    });
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      " SELECT p.id, p.category_id,p.name,p.description,p.price,p.stock_quantity, p.file_name, p.folder_name, c.name as category_name from products p join categories c on p.category_id= c.id where p.id=?",
      [id],
    ); 
    if (rows.length === 0) {
      return res.status(404).json({
        message: "Product Not Available",
      });
    }
    return res.status(200).json({
      message: "Product Fetch Successful",
      data: rows[0],
    });
  } catch (err) {
    next(err);
  }
};

const createProducts = async (req, res, next) => {
  try {
    const { category_id, name, description, price, stock_quantity } = req.body;
    let file_name = null;
    let folder_name = 'uploads/products';

    if (req.file) {
      file_name = req.file.filename;
    }

    if (
      category_id == null ||
      !name?.trim() ||
      price == null ||
      stock_quantity == null
    ) {
      return res.status(400).json({
        message: "category_id,name,price,stock_quantity Fields are Required",
      });
    }
    const [getCategory] = await pool.query(
      "SELECT id from categories where id=?",
      [category_id],
    );
    if (getCategory.length === 0) {
      return res.status(400).json({
        message: "Category_id is not exist- category not found",
      });
    }
    const [rows] = await pool.query(
      "INSERT INTO products (category_id,name,description,price,stock_quantity,file_name,folder_name) VALUES (?,?,?,?,?,?,?)",
      [category_id, name, description, price, stock_quantity, file_name, folder_name],
    );

    return res.status(201).json({
      message: "Products Created Successful",
      data: {
        id: rows.insertId,
        category_id,
        name,
        description,
        price,
        stock_quantity,
        file_name,
        folder_name
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category_id, name, description, price, stock_quantity } = req.body;
    if (
      category_id == null ||
      price == null ||
      stock_quantity == null ||
      !name?.trim()
    ) {
      return res.status(400).json({
        message: "category_id,name,price,stock_quantity Fields are Required",
      });
    }
    const [getCategory] = await pool.query(
      "SELECT id from categories where id=?",
      [category_id],
    );
    if (getCategory.length === 0) {
      return res.status(400).json({
        message: "Category_id is not exist- category not found",
      });
    }
    const [rows] = await pool.query(
      "UPDATE products SET category_id=?, name=?, description=?,price=?,stock_quantity=? where id=?",
      [category_id, name, description, price, stock_quantity, id],
    );
    if (rows.affectedRows === 0) {
      return res.status(404).json({
        message: "Product Not Found",
      });
    }
    return res.status(200).json({
      message: "Product Updated Successfully",
      data: {
        id: parseInt(id),
        category_id,
        name,
        description,
        price,
        stock_quantity,
      },
    });
  } catch (err) {
    next(err);
  }
};

const deleteProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [getId] = await pool.query("SELECT id from products where id=?", [
      id,
    ]);
    if (getId.length === 0) {
      return res.status(404).json({
        message: "Product Not Found",
      });
    }
    const [rows] = await pool.query("DELETE from products where id=?", [id]);

    return res.status(200).json({
      message: "Product Deleted Successfully",
    });
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message: "Cannot delete Product- it exist in past order",
      });
    }
    next(err);
  }
};
module.exports = {
  getAllProducts,
  getProductById,
  createProducts,
  updateProducts,
  deleteProducts,
};