const pool = require("../config/db");

const getAllProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;

    // Direct integer string interpolation avoids mysql2 query-parameter string-casting errors on LIMIT/OFFSET
    const [rows] = await pool.query(
      `SELECT p.id, p.category_id, p.name, p.description, p.price, p.stock_quantity, p.file_name, p.folder_name, c.name as category_name 
       FROM products p 
       JOIN categories c ON p.category_id = c.id 
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`
    );

    const [totalRows] = await pool.query("SELECT COUNT(*) as count FROM products");
    const totalItems = totalRows[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    return res.status(200).json({
      message: "Products Fetch Successful",
      data: rows,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems
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
      "SELECT p.id, p.category_id, p.name, p.description, p.price, p.stock_quantity, p.file_name, p.folder_name, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({
        message: "Product Not Available"
      });
    }
    return res.status(200).json({
      message: "Product Fetch Successful",
      data: rows[0]
    });
  } catch (err) {
    next(err);
  }
};

const createProducts = async (req, res, next) => {
  try {
    const { category_id, name, description, price, stock_quantity } = req.body;
    let file_name = null;
    let folder_name = "uploads/products";

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
        message: "category_id, name, price, stock_quantity Fields are Required"
      });
    }

    const [getCategory] = await pool.query(
      "SELECT id FROM categories WHERE id = ?",
      [category_id]
    );
    if (getCategory.length === 0) {
      return res.status(400).json({
        message: "Category_id does not exist - category not found"
      });
    }

    const [rows] = await pool.query(
      "INSERT INTO products (category_id, name, description, price, stock_quantity, file_name, folder_name) VALUES (?,?,?,?,?,?,?)",
      [category_id, name, description, price, stock_quantity, file_name, folder_name]
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
      }
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
        message: "category_id, name, price, stock_quantity Fields are Required"
      });
    }

    const [getCategory] = await pool.query(
      "SELECT id FROM categories WHERE id = ?",
      [category_id]
    );
    if (getCategory.length === 0) {
      return res.status(400).json({
        message: "Category_id does not exist - category not found"
      });
    }

    const [rows] = await pool.query(
      "UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, stock_quantity = ? WHERE id = ?",
      [category_id, name, description, price, stock_quantity, id]
    );

    if (rows.affectedRows === 0) {
      return res.status(404).json({
        message: "Product Not Found"
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
        stock_quantity
      }
    });
  } catch (err) {
    next(err);
  }
};

const deleteProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [getId] = await pool.query("SELECT id FROM products WHERE id = ?", [id]);
    if (getId.length === 0) {
      return res.status(404).json({
        message: "Product Not Found"
      });
    }

    await pool.query("DELETE FROM products WHERE id = ?", [id]);

    return res.status(200).json({
      message: "Product Deleted Successfully"
    });
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message: "Cannot delete Product - it exists in a past order"
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
  deleteProducts
};