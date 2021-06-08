'use strict'


const UserSchema = require('../model/userSchema.js');

const basicAuth = async function(req, res, next) {

    try {
        const { email, password } = req.body
        req.user = await UserSchema.authenticateBasic(email, password)
        next();
    } catch (e) {
        next('Invalid Email or Password !')
    }


}

module.exports = basicAuth