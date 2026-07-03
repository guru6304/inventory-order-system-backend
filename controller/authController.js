const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const registerController = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!email?.trim() || !name?.trim() || !password?.trim()) {
      return res.status(400).json({
        message: "All Fields are Required",
      });
    }
    const [existingUser] = await pool.query(
      "SELECT id FROM users where email=?",
      [email],
    );
    if (existingUser.length > 0) {
      return res.status(409).json({
        message: "Email already Taken please Enter New email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (name,email,password_hash,role) VALUES(?,?,?,?)",
      [name, email, hashedPassword, "customer"],
    );

    return res.status(201).json({
      message: "User Register Successful",
      data: { id: result.insertId, name, email, role: "customer" },
    });
  } catch (err) {
    next(err);
  }
};

const loginController = async (req, res,next) => {
  try {
    const { email, password } = req.body;

    if (!password?.trim() || !email?.trim()) {
      return res.status(400).json({
        message: "All Fields Are Required",
      });
    }
    const [rows] = await pool.query(
      "SELECT id,name,email,password_hash,role FROM users where email=?",
      [email],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or Password",
      });
    }

    const user = rows[0]; // rows is an array. so we cant perform operations directly
    const comparePassword = await bcrypt.compare(password, user.password_hash);
    if (!comparePassword) {
      return res.status(401).json({
        message: "Invalid email or Password",
      });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    return res.status(200).json({
      message: "Login Successful",
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res,next) => {
  try {
    const user_id = req.user.id;
    const [rows] = await pool.query(
      "SELECT id,name,email,role FROM users WHERE id=?",
      [user_id],
    );
    if (rows.length === 0) {
      return res.status(404).json({
        message: "User Not Found",
      });
    }
    const user = rows[0]
    return res.status(200).json({
      message: "User Profile Fetched Successfully",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { registerController, loginController,getMe };
