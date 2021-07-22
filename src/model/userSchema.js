"use strict";

require("dotenv").config();

const mongoose = require("mongoose");
const base64 = require("base-64");
const JWT = require("jsonwebtoken");
const SECRET = process.env.SECRET || "BFAL";
const bcrypt = require("bcrypt");
const product = require("./productSchema");
const schema = mongoose.Schema;
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  userName: { type: String, required: true },
  password: { type: String, required: true },
  product: {
    type: schema.Types.Array,
    ref: "product",
    required: true,
  },
  cart: {
    type: schema.Types.Array,
    ref: "product",
    required: true,
  },
});
UserSchema.methods.addToProduct = function (item) {
  let product = this.product;
  if (product.userProduct.length >= 0) {
    product.userProduct.push(item);
  }
};

UserSchema.virtual("token").get(function () {
  let tokenObject = {
    email: this.email,
  };
  return JWT.sign(tokenObject, SECRET, { expiresIn: 60 * 60 });
});

UserSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

// BASIC AUTH
UserSchema.statics.authenticateBasic = async function (email, password) {
  const user = await this.findOne({ email });
  const valid = await bcrypt.compare(password, user.password);
  if (valid) {
    return user;
  }
  throw new Error("Invalid Email or Password");
};

// BEARER AUTH
UserSchema.statics.authenticateWithToken = async function (token) {
  try {
    const parsedToken = JWT.verify(token, SECRET);
    const user = this.findOne({ email: parsedToken.email });
    if (user) {
      return user;
    }
    throw new Error("User Not Found");
  } catch (e) {
    throw new Error(e.message);
  }
};

const user = mongoose.model("user", UserSchema);
module.exports = user;
