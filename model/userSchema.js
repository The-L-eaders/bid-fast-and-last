'use strict'

const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    userName: { type: String, required: true },
    password: { type: String, required: true },
    productsStatus: { type: String }
});

const user = mongoose.model('user', UserSchema);

module.exports = user