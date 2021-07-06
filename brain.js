"use strict";
require("dotenv").config();

const cors = require("cors");
const PORT = process.env.PORT || 3000;
const bcrypt = require("bcrypt");

const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
// DataBase ..............................................
const userSchema = require("./model/userSchema.js");
const productSchema = require("./model/productSchema.js");

const basicAuth = require("./middleWares/basicAuth.js");
const Auth = require("./middleWares/bearerAuth");
const notFoundHandler = require("./middleWares/error-handlers/404.js");
const errorHandler = require("./middleWares/error-handlers/500.js");

// ....................................................
app.set("view engine", "ejs");
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const http = require("http");
const server = http.createServer(app);

const mongoose = require("mongoose");

const MongoDb_URI = process.env.MongoDb_URI || "mongodb://localhost:27017/test";

const options = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: true,
};

app.use(express.static("./"));

let io = require("socket.io")(server);

server.listen(PORT, () => console.log("listening " + PORT));
mongoose.connect(MongoDb_URI, options, () => {
  console.log("connected to DB");
});

// Home page -----------------------------------------

app.get("/", (req, res) => {
  res.render("homePage", { token: req.cookies.token });
});

// bidding page --------------------------------------------

app.get("/car", Auth, async (req, res) => {
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

app.get("/house", Auth, async (req, res) => {
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

// register page ------------------------------------------
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  try {
    const { email, password, userName } = req.body;
    let saveToDB = await userSchema({ email, userName, password }).save();
    res.json(saveToDB);
    // res.render('logIn');
  } catch (e) {
    res.send("Email already exists !");
  }
});

// Category Page ----------------------------------
app.get("/category", Auth, (req, res) => {
  res.render("category");
});

// logIn page ------------------------------

app.get("/logIn", (req, res) => {
  res.render("logIn");
});

app.post("/logIn", basicAuth, (req, res) => {
  req.token = req.user.token;
  res.cookie("token", req.token);
  res.json({ user: req.user, token: req.token });
  // res.redirect('/');
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ user: "loggedOut" });
  // res.redirect('/');
});

app.get("/add", Auth, (req, res) => {
  res.render("addProducts");
});

app.post("/add", Auth, async (req, res) => {
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

app.use(errorHandler);
app.use("*", notFoundHandler);

module.exports = app;
// ----------------------------------------------------------------------------------------

const car = io.of("/car");
const house = io.of("/house");
const home = io.of("/");

let carLast = {};
let lastToken = "";
let carLastPrice = 0;

car.on("connection", (socket) => {
  socket.on("increasePrice", (data) => {
    lastToken = data.token;
    carLastPrice = data.lastPrice;
    car.emit("showLatest", { total: data.lastPrice, name: users });
  });

  socket.on("sold", async (data) => {
    let getProduct = await productSchema.find({ _id: data.product._id });

    const soldTo = {
      name: getProduct[0].productName,
      price: carLastPrice,
      image: getProduct[0].productImage,
      description: getProduct[0].productDis,
    };

    const dbUser = await userSchema.authenticateWithToken(lastToken);
    const user = await userSchema.findByIdAndUpdate(
      { _id: dbUser._id },
      { $push: { cart: soldTo } }
    );
    let update = await userSchema.updateOne(
      {
        _id: getProduct[0].userId,
        product: { $elemMatch: { _id: getProduct[0]._id } },
      },
      { $set: { "product.$.status": `sold  price ${carLastPrice} ` } }
    );
    let deleted = await productSchema.findByIdAndDelete({
      _id: data.product._id,
    });
    lastToken = "";
    carLastPrice = 0;

    home.emit("soldEvent", soldTo);
  });

  let product = {};
  async function generateProduct() {
    let getProd = await productSchema.find({ category: "car" });
    getProd.sort((a, b) => {
      a["createdAt"] - b["createdAt"];
    });
    product = getProd[0];
  }

  let notSold = async () => {
    let getProduct = await productSchema.find({ _id: product._id });
    let update = await userSchema.updateOne(
      {
        _id: getProduct[0].userId,
        product: { $elemMatch: { _id: getProduct[0]._id } },
      },
      { $set: { "product.$.status": "not sold" } }
    );
    let deleted = await productSchema.findByIdAndDelete({ _id: product._id });
    lastToken = "";
    carLastPrice = 0;
  };

  socket.on("startBidding", (obj) => {
    generateProduct();
    carLast = obj;

    let interval = setInterval(() => {
      if (obj.counter == 0) {
        if (lastToken != "") {
          car.emit("try", { product, lastToken });
        } else {
          notSold();
        }
        clearInterval(interval);
        return (obj.counter = 0), (obj.lastPrice = 0);
      }
      obj.counter = obj.counter - 1;
      car.emit("liveCounter", obj.counter);
    }, 1000);
  });

  let users = "";
  let userSold = {};
  socket.on("newUser", async (data) => {
    const validUser = await userSchema.authenticateWithToken(data.token);
    users = validUser.userName;
    userSold = validUser;
    socket.broadcast.emit("greeting", users);
  });

  car.emit("liveBid", carLastPrice);
});

let lastPrice = 0;
let houseLast = {};
let lastTokenHouse = "";
house.on("connection", (socket) => {
  socket.on("increasePrice", (total) => {
    lastPrice = total.lastPrice;
    lastTokenHouse = total.token;
    house.emit("showLatest", { total: total.lastPrice, name: users });
  });
  socket.on("sold", async (data) => {
    let getProduct = await productSchema.find({ _id: data.product._id });
    const soldTo = {
      name: getProduct[0].productName,
      price: lastPrice,
      image: getProduct[0].productImage,
      description: getProduct[0].productDis,
    };

    const dbUser = await userSchema.authenticateWithToken(lastTokenHouse);
    const user = await userSchema.findByIdAndUpdate(
      { _id: dbUser._id },
      { $push: { cart: soldTo } }
    );
    let update = await userSchema.updateOne(
      {
        _id: getProduct[0].userId,
        product: { $elemMatch: { _id: getProduct[0]._id } },
      },
      { $set: { "product.$.status": `sold  price ${lastPrice} ` } }
    );
    let deleted = await productSchema.findByIdAndDelete({
      _id: data.product._id,
    });
    lastTokenHouse = "";
    lastPrice = 0;

    home.emit("soldEvent", soldTo);
  });

  let product = {};
  async function generateProduct() {
    let getProd = await productSchema.find({ category: "house" });
    getProd.sort((a, b) => {
      a["createdAt"] - b["createdAt"];
    });
    product = getProd[0];
  }

  let notSold = async () => {
    let getProduct = await productSchema.find({ _id: product._id });
    let update = await userSchema.updateOne(
      {
        _id: getProduct[0].userId,
        product: { $elemMatch: { _id: getProduct[0]._id } },
      },
      { $set: { "product.$.status": "not sold" } }
    );
    let deleted = await productSchema.findByIdAndDelete({ _id: product._id });
    lastTokenHouse = "";
    lastPrice = 0;
  };

  socket.on("startBidding", (obj) => {
    generateProduct();
    houseLast = obj;
    let interval = setInterval(() => {
      if (obj.counter == 0) {
        if (lastTokenHouse != "") {
          house.emit("try", { product, lastTokenHouse });
        } else {
          notSold();
        }
        clearInterval(interval);
        return (obj.counter = 0), (obj.lastPrice = 0);
      }
      obj.counter = obj.counter - 1;
      house.emit("liveCounter", obj.counter);
    }, 1000);
  });

  let users = "";
  let userSold = {};
  socket.on("newUser", async (data) => {
    const validUser = await userSchema.authenticateWithToken(data.token);
    users = validUser.userName;
    userSold = validUser;
    socket.broadcast.emit("greeting", users);
  });

  house.emit("liveBid", lastPrice);
});

module.exports = {
  app: app,
};
