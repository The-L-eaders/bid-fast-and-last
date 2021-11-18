"use strict";

process.env.SECRET = "toes";
const events = require("events");
const myEvent = new events();
const supertest = require("supertest");
const middleware = require("../middleWares/bearerAuth");
const Users = require("../model/userSchema");
const jwt = require("jsonwebtoken");
const { app } = require("../brain");
const mock = supertest(app);

xdescribe("Auth Middleware", () => {
  let mockConsole;
  beforeEach(() => {
    mockConsole = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    mockConsole.mockRestore();
  });
  let user = {
    email: "user@use.com",
    userName: "test",
    password: "123",
  };

  it("Register", async () => {
    // let newUser = await Users(user);
    let newUser = await mock.post("/register").send(user);
    expect(newUser.status).toEqual(200);
  });
  it("get Login Page", async () => {
    let login = await mock.get("/logIn");
    expect(login.status).toEqual(200);
  });
  it("get Register Page", async () => {
    let login = await mock.get("/register");
    expect(login.status).toEqual(200);
  });

  it("Login", async () => {
    let userLogin = await mock
      .post("/logIn")
      .send({ email: "user@use.com", password: "123" });
    expect(userLogin.status).toEqual(302);
  });

  it("Login", async () => {
    let userLogin = await mock
      .post("/logIn")
      .send({ email: "user@use1.com", password: "123" });
    expect(userLogin.status).toEqual(500);
  });
  it("404", async () => {
    let userLogin = await mock
      .post("/blablabla")
      .send({ email: "user@use1.com", password: "123" });
    expect(userLogin.status).toEqual(404);
  });
  it("Bearer", async () => {
    let userLogin = await mock
      .post("/logIn")
      .send({ email: "user@use.com", password: "123" });
    let token = userLogin.header["set-cookie"][0];
    let last = token.split("=");
    let last_last = last[1].split(";");
    let car = await mock
      .get("/car")
      .set(`Authorization`, `Bearer ${last_last[0]}`);
    expect(car.status).toEqual(200);
  });

  it("add Car", async () => {
    let userLogin = await mock
      .post("/logIn")
      .send({ email: "user@use.com", password: "123" });
    let token = userLogin.header["set-cookie"][0];
    let last = token.split("=");
    let last_last = last[1].split(";");
    const data = {
      name: "BMW",
      price: 1000,
      description: "AC Milan Home",
      image:
        "https://www.bmw-me.com/content/dam/bmw/common/home/teaser/bmw-2-series-gran-coupe-inspire-ag-home-teaser-xxl.jpg",
      category: "car",
      timer: 120,
    };
    let car = await mock
      .post("/add")
      .send(data)
      .set(`Authorization`, `Bearer ${last_last[0]}`);
    expect(car.body.productName).toEqual(data.name);
  });

  it("get House", async () => {
    let userLogin = await mock
      .post("/logIn")
      .send({ email: "user@use.com", password: "123" });
    let token = userLogin.header["set-cookie"][0];
    let last = token.split("=");
    let last_last = last[1].split(";");
    let car = await mock
      .get("/house")
      .set(`Authorization`, `Bearer ${last_last[0]}`);
    expect(car.status).toEqual(200);
  });

  it("get Car", async () => {
    let userLogin = await mock
      .post("/logIn")
      .send({ email: "user@use.com", password: "123" });
    let token = userLogin.header["set-cookie"][0];
    let last = token.split("=");
    let last_last = last[1].split(";");
    let car = await mock
      .get("/car")
      .set(`Authorization`, `Bearer ${last_last[0]}`);
    expect(car.status).toEqual(200);
  });
  it("category", async () => {
    let userLogin = await mock
      .post("/logIn")
      .send({ email: "user@use.com", password: "123" });
    let token = userLogin.header["set-cookie"][0];
    let last = token.split("=");
    let last_last = last[1].split(";");
    let category = await mock
      .get("/category")
      .set(`Authorization`, `Bearer ${last_last[0]}`);
    expect(category.status).toEqual(200);
  });
  it("add", async () => {
    let userLogin = await mock
      .post("/logIn")
      .send({ email: "user@use.com", password: "123" });
    let token = userLogin.header["set-cookie"][0];
    let last = token.split("=");
    let last_last = last[1].split(";");
    let add = await mock
      .get("/add")
      .set(`Authorization`, `Bearer ${last_last[0]}`);
    expect(add.status).toEqual(200);
  });
  it("logOut", async () => {
    let userLogin = await mock
      .post("/logIn")
      .send({ email: "user@use.com", password: "123" });
    let logOutUser = await mock.get("/logout");
    expect(logOutUser.status).toEqual(302);
  });

  it("Owner cant bid in his Own Car", async () => {
    let userLogin = await mock
      .post("/logIn")
      .send({ email: "user@use.com", password: "123" });
    let token = userLogin.header["set-cookie"][0];
    let last = token.split("=");
    let last_last = last[1].split(";");
    const data = {
      name: "BMW",
      price: 1000,
      description: "AC Milan Home",
      image:
        "https://www.bmw-me.com/content/dam/bmw/common/home/teaser/bmw-2-series-gran-coupe-inspire-ag-home-teaser-xxl.jpg",
      category: "car",
      timer: 120,
    };
    let carPage = await mock
      .get("/car")
      .set(`Authorization`, `Bearer ${last_last[0]}`);
    // console.log(carPage);
    expect(carPage.text).toEqual("You Cant bid in your own Product");
    expect(carPage.body).toEqual({});
  });
  it("Owner cant bid in his Own House", async () => {
    let userLogin = await mock
      .post("/logIn")
      .send({ email: "user@use.com", password: "123" });
    let token = userLogin.header["set-cookie"][0];
    let last = token.split("=");
    let last_last = last[1].split(";");
    const data = {
      name: "BMW",
      price: 1000,
      description: "AC Milan Home",
      image:
        "https://www.bmw-me.com/content/dam/bmw/common/home/teaser/bmw-2-series-gran-coupe-inspire-ag-home-teaser-xxl.jpg",
      category: "house",
      timer: 120,
    };
    let car = await mock
      .post("/add")
      .send(data)
      .set(`Authorization`, `Bearer ${last_last[0]}`);
    let carPage = await mock
      .get("/house")
      .set(`Authorization`, `Bearer ${last_last[0]}`);
    // console.log(carPage);
    expect(carPage.text).toEqual("You Cant bid in your own Product");
    expect(carPage.body).toEqual({});
  });
});
