const pool = require("../config/db");

const createOrder = async (req, res,next) => {
  let connection;
  try {
    const user_id = req.user.id;
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Provide valid items array",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();
    let total_amount = 0;
    const preparedItems = [];

    for (const item of items) {
      const { product_id, quantity } = item;
      if (!product_id || !quantity || quantity <= 0) {
        await connection.rollback();
        return res.status(400).json({
          message: "Each Item Must contain valid quantity and product_id",
        });
      }
      const [productRows] = await connection.query(
        "SELECT id,category_id,name,price,stock_quantity FROM products where id=? FOR UPDATE",
        [product_id],
      );
      if (productRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          message: "Product Not found",
        });
      }
      const product = productRows[0];
      if (product.stock_quantity < quantity) {
        await connection.rollback();
        return res.status(400).json({
          message: `Insufficient stock for product_id: ${product_id}`,
        });
      }
      const price_at_purchase = Number(product.price);
      total_amount += price_at_purchase * Number(quantity);
      preparedItems.push({
        product_id,
        quantity: Number(quantity),
        price_at_purchase,
      });
    }
    const [orderRows] = await connection.query(
      "INSERT INTO orders (user_id,total_amount,status) VALUES(?,?,?)",
      [user_id, total_amount,'confirmed'],
    );
    const orderId = orderRows.insertId;
    for (const item of preparedItems) {
      await connection.query(
        "INSERT INTO order_items(order_id,product_id,quantity,price_at_purchase)VALUES (?,?,?,?)",
        [orderId, item.product_id, item.quantity, item.price_at_purchase],
      );

      await connection.query(
        "UPDATE products SET stock_quantity= stock_quantity-? where id=?",
        [item.quantity, item.product_id],
      );
    }
    await connection.commit();
    return res.status(201).json({
      message: "order created Successfully",
      data: {
        id: orderId,
        user_id,
        total_amount,
        items: preparedItems,
      },
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    next(err);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getMyOrders = async (req, res,next) => {
  try {
    const user_id = req.user.id;
    const [rows] = await pool.query(
      "SELECT o.id as order_id ,o.status,o.total_amount,o.reserved_at, oi.product_id,oi.quantity,oi.price_at_purchase,p.name as product_name FROM orders o join order_items as oi on o.id= oi.order_id join products as p on oi.product_id=p.id where o.user_id=? order by o.id desc",
      [user_id],
    );
    if (rows.length === 0) {
      return res.status(200).json({
        message: "You have No orders yet",
        data: [],
      });
    }
    const ordersMap = {};
    for (const row of rows) {
      if (!ordersMap[row.order_id]) {
        ordersMap[row.order_id] = {
          id: row.order_id,
          status: row.status,
          total_amount: row.total_amount,
          reserved_at: row.reserved_at,
          items: [],
        };
      }
      ordersMap[row.order_id].items.push({
        product_id: row.product_id,
        product_name: row.product_name,
        quantity: row.quantity,
        price_at_purchase: row.price_at_purchase,
      });
    }
    const orders = Object.values(ordersMap);
    return res.status(200).json({
      message: "your Order(s)",
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};
const getAllOrders = async (req, res,next) => {
  try {
    const [allOrders] = await pool.query(
      "SELECT o.id as order_id,o.status,o.total_amount,o.reserved_at, oi.product_id,oi.quantity,oi.price_at_purchase,p.name as product_name,u.name as user_name,u.email as user_mail FROM orders o join order_items as oi on o.id= oi.order_id join products as p on oi.product_id=p.id join users as u on o.user_id=u.id",
    );
    if (allOrders.length === 0) {
      return res.status(200).json({
        message: "You have No orders yet",
        data: [],
      });
    }
    const ordersMap = {};
    for (const row of allOrders) {
      if (!ordersMap[row.order_id]) {
        ordersMap[row.order_id] = {
          id: row.order_id,
          status: row.status,
          total_amount: row.total_amount,
          reserved_at: row.reserved_at,
          user:row.user_name,
          items: [],
        };
      }
      ordersMap[row.order_id].items.push({
        product_id: row.product_id,
        product_name: row.product_name,
        quantity: row.quantity,
        price_at_purchase: row.price_at_purchase,
      });
    }
    const orders = Object.values(ordersMap);
    return res.status(200).json({
      message: "All Placed Orders",
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

const cancelOrder = async (req, res,next) => {
  let connection;
  try {
    const order_id = req.params.id;
    const user_id = req.user.id;
    const role = req.user.role;
    const [rows] = await pool.query(
      "SELECT id,user_id,status FROM orders where id=?",
      [order_id],
    );
    if (rows.length === 0) {
      return res.status(404).json({
        message: "Order Not Found",
      });
    }
    const data = rows[0];
    if (data.user_id !== user_id && role !== "admin") {
      return res.status(403).json({
        message: "Access Denied",
      });
    }
    if (data.status !== "pending") {
      return res.status(400).json({
        message: "Order Cancellation not Possible",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [orderRows] = await connection.query(
      "SELECT order_id,product_id,quantity FROM order_items where order_id=? FOR UPDATE",
      [order_id],
    );
    if (orderRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: " No Orders Found",
      });
    }
    for (const item of orderRows) {
      const { quantity, product_id } = item;
      await connection.query(
        "UPDATE products SET stock_quantity= stock_quantity + ? where id=?",
        [quantity, product_id],
      );
    }
    await connection.query("UPDATE orders SET status ='cancelled' where id=?", [
      order_id,
    ]);

    await connection.commit();
    return res.status(200).json({
      message: "Order Cancelled Successfully",
      data: {
        id: order_id,
        status: "cancelled",
      },
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    next(err);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const confirmOrder = async (req, res,next) => {
  try {
    const order_id = req.params.id;
    const [rows] = await pool.query(
      "SELECT status FROM orders where id =?",
      [order_id],
    );
    if (rows.length === 0) {
      return res.status(404).json({
        message: "Orders Not Found",
      });
    }
    const orderDetails = rows[0];
    if (orderDetails.status !== "pending") {
      return res.status(409).json({
        message: "Order is Not in Pending status",
      });
    }
    await pool.query(
      "UPDATE orders SET status='confirmed', confirmed_at=NOW() where id=?",
      [order_id]);
    return res.status(200).json({
      message: "Order Confirmed Successfully",
      data: {
        id: order_id,
        status: "confirmed",
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createOrder, getMyOrders, getAllOrders, cancelOrder ,confirmOrder};
