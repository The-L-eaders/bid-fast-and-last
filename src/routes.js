"use strict";

const express = require("express");
const router = express.Router();

const userSchema = require("./model/userSchema.js");
const productSchema = require("./model/productSchema.js");
const basicAuth = require("./middleWares/basicAuth.js");
const Auth = require("./middleWares/bearerAuth");

router.get("/", (req, res) => {
  res.render("homePage", { token: req.cookies.token });
});

router.get("/car", Auth, async (req, res) => {
  let data = await productSchema.find({ category: "car" });
  data.sort((a, b) => {
    a["createdAt"] - b["createdAt"];
  });

  if (data[0]) {
    if (data[0].userId == req.user._id) {
      res.json({ message: "You Cant bid in your own Product" });
    } else {
      res.json({ data: data[0] });
    }
  } else {
    res.json({ data: data[0] });
  }
});

router.get("/house", Auth, async (req, res) => {
  let dataHouse = await productSchema.find({ category: "house" });
  dataHouse.sort((a, b) => {
    a["createdAt"] - b["createdAt"];
  });
  if (dataHouse[0]) {
    if (dataHouse[0].userId == req.user._id) {
      res.json({ message: "You Cant bid in your own Product" });
    } else {
      res.json({ data: dataHouse[0] });
    }
  } else {
    res.json({ data: dataHouse[0] });
  }
});

router.get("/register", (req, res) => {
  res.render("register");
});

router.post("/register", async (req, res) => {
  try {
    const { email, password, userName } = req.body;
    let saveToDB = await userSchema({ email, userName, password }).save();
    res.json(saveToDB);
    // res.render('logIn');
  } catch (e) {
    res.send("Email already exists !");
  }
});

router.get("/category", Auth, (req, res) => {
  res.json([
    {
      id: 1,
      name: "car",
    },
    {
      id: 2,
      name: "house",
    },
  ]);
});

router.get("/logIn", (req, res) => {
  res.render("logIn");
});

router.post("/logIn", basicAuth, (req, res) => {
  req.token = req.user.token;
  res.cookie("token", req.token);
  res.json({ user: req.user, token: req.token });
  // res.redirect('/');
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ user: "loggedOut" });
  // res.redirect('/');
});

router.get("/add", Auth, (req, res) => {
  res.render("addProducts");
});

router.post("/add", Auth, async (req, res) => {
  const id = req.user._id;
  let { name, price, description, image, category, timer } = req.body;
  let productSave = await productSchema({
    productName: name,
    startingPrice: price,
    productDis: description,
    productImage: image,
    category: category,
    userId: id,
    timer: timer,
  }).save();
  const user = await userSchema.findByIdAndUpdate(
    { _id: id },
    { $push: { product: productSave } }
  );
  res.json(productSave);
});

router.get("/products", async (req, res) => {
  let allProducts = await productSchema.find({});
  res.json(allProducts);
});

router.post("/getUser", async (req, res) => {
  let token = req.body.token;
  const user = await userSchema.authenticateWithToken(token);
  res.json(user);
});

module.exports = router;
