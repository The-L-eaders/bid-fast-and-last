const User = require('../model/userSchema');
module.exports = async (req,res,next)=>{
    console.log(req.body.token);
    try{
    //    console.log(req.headers.authorization);
        const token = req.headers.authorization.split(' ').pop();
        // console.log(token);
        const validUser = await User.authenticateWithToken(token);
        // console.log(token,'from Auth');
        // console.log(validUser);
        req.user=validUser;
        req.token=validUser.token;
        next();
        // const token = 
    }catch(e){
        res.status(403).send('Invalid Login');
    }
}

