const errorHandler = (err,req,res,next)=>{
    console.error(err.stack);
    res.status(err.status||500).json({
        message:err.message||"Internal Server Error"
    });
};

const routeError=(req, res) => {
    res.status(404).json({
        message: "Route Not Found"
    });
};
module.exports= {errorHandler,routeError};