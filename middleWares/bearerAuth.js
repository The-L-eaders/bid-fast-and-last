const User = require('../model/userSchema');
module.exports = async (req,res,next)=>{
    console.log(req.body.token);
    try{
        const token = req.cookies.token;
        const validUser = await User.authenticateWithToken(token);
        req.user=validUser;
        req.token=validUser.token;
        next();
    }catch(e){
        res.status(403).send('Invalid Login');
    }
}

