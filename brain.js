'use strict';

const cors = require('cors')
const PORT = process.env.PORT || 3000
const bcrypt = require('bcrypt');

const express = require('express');
const cookieParser = require('cookie-parser')
const app = express();
// DataBase ..............................................
const userSchema = require('./model/userSchema.js')
const productSchema = require('./model/productSchema.js');

const basicAuth = require('./middleWares/basicAuth.js');
const Auth = require('./middleWares/bearerAuth');

// ....................................................
app.set('view engine', 'ejs');
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser())

const http = require('http');
const server = http.createServer(app);

const mongoose = require('mongoose');
const user = require('./model/userSchema.js');
const product = require('./model/productSchema.js');
const URI = 'mongodb://localhost:27017/auction'

const options = {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: true
};


app.use(express.static('./'));

let io = require("socket.io")(server);

mongoose.connect(URI, options, () => {
    console.log('connected to DB');
    server.listen(PORT, () => console.log("listening " + PORT));
});

// Home page -----------------------------------------

app.get('/', (req, res) => {
    res.render('homePage');
});

// bidding page --------------------------------------------
app.post('/car', async (req, res) => {
    const { name, startingPrice, category, productImage, productDis } = req.body;
    let data = await productSchema({ productName: name, startingPrice: startingPrice, category: category, productImage: productImage, productDis: productDis }).save();
    res.send(data);
});

app.get('/car', async (req, res) => {
    let data = await productSchema.find({ category: 'car' });
    data.sort((a, b) => {
        a['createdAt'] - b['createdAt']
    });
    // res.send(data)

    res.render('biddingPage', { data: data[0] });
});

app.get('/house', async (req, res) => {
    let data = await productSchema.find({ category: 'house' });
    data.sort((a, b) => {
        a['createdAt'] - b['createdAt']
    });

    res.render('biddingPage', { data: data[0] });
});
// register page ------------------------------------------
app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { email, password, userName } = req.body;
    // console.log(req.body)

    let saveToDB = await userSchema({ email, userName, password }).save()

    res.render('logIn');
});

// Category Page ----------------------------------
app.get('/category', (req, res) => {
    res.render('category');
});

// logIn page ------------------------------

app.get('/logIn', (req, res) => {
    res.render('logIn');
});

app.post('/logIn', basicAuth, (req, res) => {
    // console.log(req.user.token);
    req.token = req.user.token;
    console.log(req.token);
    res.cookie('token', req.token);
    res.redirect('/');
});


app.get('/add', Auth, (req, res) => {
    res.render('addProducts');
});

app.post('/add', Auth, async (req, res) => {
    console.log('ho');
    const id = req.user._id;
    let { name, price, description, image, category } = req.body;
    let x = await productSchema(
        {
            productName: name,
            startingPrice: price,
            productDis: description,
            productImage: image,
            category: category,
            userId: id
        }).save();
    const user = await userSchema.findByIdAndUpdate({ _id: id }, { $push: { product: x } });
    // console.log(user);
    // user.addToProduct(x);
    // user[0].product.push(x);
    // let xx = user[0].product.push(x)
    // console.log(xx);
    // const user1 = await userSchema.findByIdAndUpdate({ _id: id },);

    // console.log(user[0].product.push(x), 'asasasas');
    res.send(x);
})


// ----------------------------------------------------------------------------------------






const car = io.of('/car');
const house = io.of('/house');

let carLast = {};

car.on('connection', socket => {
    socket.on('startBidding', (obj) => {
        carLast = obj;
        setInterval(() => {
            if (obj.counter == 0) {
                return obj.counter = 0, obj.totalFromUser = 0;
            };
            obj.counter = obj.counter - 1;
            car.emit('liveCounter', obj.counter);
        }, 1000);
        console.log(obj.totalFromUser, '*-----*', obj.text)
    });
    let users = ''
    socket.on('newUser', data => {
        users = data
        socket.broadcast.emit('greeting', data);
    });
    socket.on('increasePrice', (total) => {
        car.emit('showLatest', { total: total, name: users });
    });
    car.emit('liveBid', carLast.totalFromUser);

    socket.on('notSold', async (id) => {
        console.log(id.productId, 'id')

        let getProduct = await productSchema.find({ _id: id.productId });
        let update = await userSchema.updateOne({ '_id': getProduct[0].userId, product: { $elemMatch: { 'status': "still in progress ." } } }, { $set: { 'product.$.status': 'not sold' } });
        let deleted = await productSchema.findByIdAndDelete({ _id: id.productId })

    });

    socket.on('sold', async (id) => {
        let getProduct = await productSchema.find({ _id: id.productId });
        let update = await userSchema.updateOne({ '_id': getProduct[0].userId, product: { $elemMatch: { 'status': "still in progress ." } } }, { $set: { 'product.$.status': `sold  price ${id.totalFromUser} ` } });
        let deleted = await productSchema.findByIdAndDelete({ _id: id.productId })
    });
});



let houseLast = {};
house.on('connection', socket => {
    socket.on('startBidding', (obj) => {
        houseLast = obj;
        setInterval(() => {
            if (obj.counter == 0) {
                return obj.counter = 0, obj.totalFromUser = 0;
            };
            obj.counter = obj.counter - 1;
            house.emit('liveCounter', obj.counter);
        }, 1000);
        console.log(obj.totalFromUser, '*-----*', obj.text)
    });
    let users = ''
    socket.on('newUser', data => {
        users = data
        socket.broadcast.emit('greeting', data);
    });
    socket.on('increasePrice', (total) => {
        house.emit('showLatest', { total: total, name: users });
    });
    house.emit('liveBid', houseLast.totalFromUser);
    console.log('house');
});