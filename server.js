"use strict";
require("dotenv").config();

const cors = require("cors");
const PORT = process.env.PORT || 3000;
const MongoDb_URI = process.env.MongoDb_URI || "mongodb://localhost:27017/test";
const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const app = express();

// DataBase ..............................................

const userSchema = require("./src/model/userSchema.js");
const productSchema = require("./src/model/productSchema.js");

// MiddleWares ...............................................
const notFoundHandler = require("./src/middleWares/error-handlers/404.js");
const errorHandler = require("./src/middleWares/error-handlers/500.js");

const myRoutes = require("./src/routes.js");
const http = require("http");
const server = http.createServer(app);

// ....................................................
app.set("view engine", "ejs");
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static("./"));

// Create Socket Server
let io = require("socket.io")(server, {
  cors: {
    origins: ["*"],

    handlePreflightRequest: (req, res) => {
      res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,GET",
        "Access-Control-Allow-Credentials": true,
      });
      res.end();
    },
  },
});

const configurations = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: true,
};
// Start the Server after connecting to the DB
mongoose.connect(MongoDb_URI, configurations, () => {
  console.log("connected to DB");
  server.listen(PORT, () => console.log("listening " + PORT));
});

// Use Middlewares ...........................

app.use(myRoutes);
app.use(errorHandler);
app.use("*", notFoundHandler);

// ----------------------------------------------------------------------------------------

const car = io.of("/car");
const house = io.of("/house");
const home = io.of("/");

let carLast = {};
let lastToken = "";
let carLastPrice = 0;
let flag = true;
let carUsers = [];

car.on("connection", (socket) => {
  const socketId = socket.id;
  socket.on("disconnect", () => {
    carUsers = carUsers.filter((user) => user.id !== socket.id);
    car.emit("nihad", { payload: carUsers });
  });

  socket.on("increasePrice", (data) => {
    lastToken = data.token;
    carLastPrice = data.lastPrice;
    car.emit("showLatest", { total: data.lastPrice, name: data.userName });
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
  /**
   *
   * @param {Object} data
   */
  let sold = async (data) => {
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
    carUsers = [];

    home.emit("soldEvent", soldTo);
  };
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
    carUsers = [];
  };

  socket.on("startBidding", (obj) => {
    if (flag) {
      flag = false;
      generateProduct();
      carLast = obj;

      let interval = setInterval(() => {
        if (obj.counter == 0) {
          if (lastToken != "") {
            // car.emit("try", { product, lastToken });
            sold({ product, lastToken });
            flag = true;
          } else {
            notSold();
            flag = true;
          }
          clearInterval(interval);
          return (obj.counter = 0), (obj.lastPrice = 0);
        }
        obj.counter = obj.counter - 1;
        car.emit("liveCounter", obj.counter);
      }, 1000);
    }
  });

  let users = "";
  let userSold = {};
  socket.on("newUser", async (data) => {
    const validUser = await userSchema.authenticateWithToken(data.token);
    const userObj = { userName: validUser.userName, id: socketId };
    let ifUser = false;

    for (let i = 0; i < carUsers.length; i++) {
      if (carUsers[i].userName === userObj.userName) {
        ifUser = true;
      }
    }

    if (!ifUser) {
      carUsers.push(userObj);
    }
    users = validUser.userName;
    userSold = validUser;
    car.emit("nihad", { payload: carUsers });
    car.emit("greeting", users);
  });

  car.emit("liveBid", carLastPrice);
});

/**
 * House
 */
let lastPrice = 0;
let houseLast = {};
let lastTokenHouse = "";
let houseFlag = true;
let houseUsers = [];
house.on("connection", (socket) => {
  const socketId = socket.id;
  socket.on("disconnect", () => {
    houseUsers = houseUsers.filter((user) => user.id !== socket.id);
    house.emit("nihad", { payload: houseUsers });
  });

  socket.on("increasePrice", (total) => {
    lastPrice = total.lastPrice;
    lastTokenHouse = total.token;
    house.emit("showLatest", { total: total.lastPrice, name: total.userName });
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
  let sold = async (data) => {
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
    houseUsers = [];

    home.emit("soldEvent", soldTo);
  };
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
    houseUsers = [];
  };

  socket.on("startBidding", (obj) => {
    if (houseFlag) {
      houseFlag = false;
      generateProduct();
      houseLast = obj;
      let interval = setInterval(() => {
        if (obj.counter == 0) {
          if (lastTokenHouse != "") {
            sold({ product, lastTokenHouse });
            // house.emit("try", { product, lastTokenHouse });
            houseFlag = true;
          } else {
            notSold();
            houseFlag = true;
          }
          clearInterval(interval);
          return (obj.counter = 0), (obj.lastPrice = 0);
        }
        obj.counter = obj.counter - 1;
        house.emit("liveCounter", obj.counter);
      }, 1000);
    }
  });

  let users = "";
  let userSold = {};
  socket.on("newUser", async (data) => {
    const validUser = await userSchema.authenticateWithToken(data.token);
    users = validUser.userName;
    userSold = validUser;
    const userObj = { userName: validUser.userName, id: socketId };
    let ifUser = false;

    for (let i = 0; i < houseUsers.length; i++) {
      if (houseUsers[i].userName === userObj.userName) {
        ifUser = true;
      }
    }

    if (!ifUser) {
      houseUsers.push(userObj);
    }
    house.emit("nihad", { payload: houseUsers });
    house.emit("greeting", users);
  });

  house.emit("liveBid", lastPrice);
});

module.exports = {
  app: app,
};
