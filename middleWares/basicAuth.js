'use strict'


const UserSchema = require('../model/userSchema.js');

const basicAuth = async function(req, res, next) {
    const { email, password } = req.body
    req.user=  await UserSchema.authenticateBasic(email, password)
    
    next();
}

module.exports = basicAuth