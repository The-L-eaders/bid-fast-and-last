'use strict';

let carLast = require('../brain.js').carLast
let lastToken = require('../brain.js').lastToken
let carLastPrice = require('../brain.js').carLastPrice
    // let product = require('../brain.js').product

const userSchema = require('../model/userSchema.js')
const productSchema = require('../model/productSchema.js')


class Category {
    constructor() {}

    increasePrice(data) {
        lastToken = data.token
        carLastPrice = data.lastPrice;
        return data
    }

    async sold(data) {
        console.log('for Testing Purpose');

        let getProduct = await productSchema.find({ _id: data.product._id });
        const soldTo = {
            name: getProduct[0].productName,
            price: carLastPrice,
            image: getProduct[0].productImage,
            description: getProduct[0].productDis
        }

        const dbUser = await userSchema.authenticateWithToken(lastToken);
        const user = await userSchema.findByIdAndUpdate({ _id: dbUser._id }, { $push: { cart: soldTo } });
        let update = await userSchema.updateOne({ '_id': getProduct[0].userId, product: { $elemMatch: { '_id': getProduct[0]._id } } }, { $set: { 'product.$.status': `sold  price ${carLastPrice} ` } });
        let deleted = await productSchema.findByIdAndDelete({ _id: data.product._id })
        lastToken = '';
        carLastPrice = 0;
    }


    async notSold(product) {
        console.log('for Testing Purpose');


        let getProduct = await productSchema.find({ _id: product._id });
        let update = await userSchema.updateOne({ '_id': getProduct[0].userId, product: { $elemMatch: { '_id': getProduct[0]._id } } }, { $set: { 'product.$.status': 'not sold' } });
        let deleted = await productSchema.findByIdAndDelete({ _id: product._id });
        lastToken = '';
        carLastPrice = 0;
    }

}


module.exports = new Category