const cors = require("cors");
require("dotenv").config();
const express= require("express");
const app= express();
app.use(express.json());
app.use(cors());
const authRoutes= require("./routes/authRoutes");

const productsRoutes= require("./routes/productRoutes");

const CategoriesRoutes= require("./routes/categoryRoutes");

const OrdersRoutes= require("./routes/ordersRoutes");

const wishlistRoutes= require("./routes/wishlistRoutes");

const { errorHandler, routeError } = require("./middleware/errorHandler");
 
app.use((req,res,next)=>{
    console.log(req.method,req.path);
    next();
});

app.use("/api/auth",authRoutes);
app.use("/api/products",productsRoutes);
app.use("/api/categories",CategoriesRoutes);
app.use("/api/orders",OrdersRoutes);
app.use("/api/wishlist",wishlistRoutes);

app.use(routeError);

app.use(errorHandler);

app.listen(process.env.PORT || 5000,()=>{
    console.log(`Running Port on ${process.env.PORT ||5000}`)
});


