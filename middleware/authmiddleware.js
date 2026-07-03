const jwt = require("jsonwebtoken");
const verifyToken = (req, res, next) => {
    try{
        const authHeader= req.headers.authorization;// req have hearder, normally header part containes tokens. header have authorization with Bearer token. 
    if(!authHeader|| !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            message:"Token Mising Or Invalid Token"
        });
    }
    const token= authHeader.split(" ")[1]// authorization: Bearer token. space is there before token. so we split it with space and 1 is for token 0 is for Bearer ["Bearer","token"]
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
    }catch(err){
        res.status(401).json({
            message:"Invalid Token"
        });
    }
};

const verifyAdmin = (req, res, next) => {
    if(req.user.role !=="admin"){
        return res.status(403).json({
            message:"Access Denied"
        });
    }
    next();
};

module.exports = { verifyToken, verifyAdmin };