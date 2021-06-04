'use strict'

const mongoose = require('mongoose');


const ProductSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    startingPrice: { type: Number, required: true },
    productDis: { type: String, required: true },
    productImage: { type: String, required: true },
    category: { type: String, enum: ['car', 'house'], required: true },
    userId: { type: String }
}, { timestamps: true });

const product = mongoose.model('product', ProductSchema);

module.exports = product