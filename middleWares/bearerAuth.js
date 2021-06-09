const User = require('../model/userSchema');
module.exports = async (req, res, next) => {
    console.log(req.cookies.token);
    try {
        let token = req.cookies.token;
        if (req.headers.authorization) {
            console.log('inside if')
            token = req.headers.authorization.split(' ').pop();

        }
        const validUser = await User.authenticateWithToken(token);
        req.user = validUser;
        req.token = validUser.token;
        next();
    } catch (e) {
        next('Unauthorized !');
    }
}