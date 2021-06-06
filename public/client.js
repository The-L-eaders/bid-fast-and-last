'use strict'

let pathName = window.location.pathname;

const socket = io(pathName);

let text = ''
// text = window.prompt("What is Your name");
socket.emit('newUser', text);

let price = parseInt(document.getElementById('startingPrice').value);
let totalFromUser = 0;
console.log(price, 'from DB')
let lastUser = ''
let addFive = document.getElementById("addFive");
let addTwen = document.getElementById('addTwen');
let addTen = document.getElementById('addTen');
// ---------------------------------------------------
let lastPrice = price; 
addFive.addEventListener('click', function (e) {
    let dollar = parseInt(addFive.value);
    lastPrice+=dollar;
    console.log(lastPrice, 'after Add');
    socket.emit('increasePrice', lastPrice);
});


addTwen.addEventListener('click', function (e) {
    let dollar = parseInt(addTwen.value);
    lastPrice+=dollar;
    socket.emit('increasePrice', lastPrice);
});

addTen.addEventListener('click', function (e) {
    let dollar = parseInt(addTen.value);
    lastPrice += dollar;
    socket.emit('increasePrice', lastPrice);
});


// ----------------------------------------------



socket.on("greeting", (data) => {
    let head = document.createElement('h1');
    head.innerHTML = `${data} has joined`
    let header = document.getElementById("header");
    header.append(head);
});

let bidding = document.getElementById('bidding');

socket.on('showLatest', total => {
    console.log(total.total);
    lastPrice = parseInt(total.total)

    let para = document.createElement('p');
    para.innerHTML = `${total.name} ${total.total}$`
    bidding.append(para);
    lastUser = total.name

    window.setInterval(function () {
        var elem = document.getElementById('bidding');
        elem.scrollTop = elem.scrollHeight;
    }, 0);
});

socket.on('liveBid', (latest) => {
    console.log(latest);
    if(latest===0 || latest===null){
        latest=lastPrice;
    }else{
        lastPrice=latest;
    }
    let user = document.createElement('p')
    user.innerHTML = `Bidding now ${latest}$`
    bidding.append(user);
});

// --------------------------------------------------------------------



let product = document.getElementById('product');

let counter = 40

product.addEventListener('click', add)


console.log(lastPrice,'at the begineing');
function add() {
    socket.emit('startBidding', { counter, lastPrice, text });
    // clearTimeout();
}



let auctionEnd = document.getElementById('auctionEnd')
let end = document.getElementById('endAt')
let timeOut = 0;

socket.on('liveCounter', (data) => {

    counter = data;

    timeOut = counter * 1000


    end.innerHTML = `${counter} Seconds left`

    let productId = document.getElementById('productId').value;
    if (counter === 0) {

        // setTimeout(() => {
        if (lastPrice == price) {
            product.removeEventListener('click', add);
            product.style.display = 'none';
            auctionEnd.style.display = 'block'
            bidding.style.display = 'none'
            auctionEnd.innerHTML = `No one Bidded on the product, please come back agin on another auction <a href='/'> Home</a>!!`
            socket.emit('notSold', { productId });

        } else {
            product.removeEventListener('click', add);
            product.style.display = 'none';
            auctionEnd.style.display = 'block'
            bidding.style.display = 'none'
            auctionEnd.innerHTML = `The product Sold to ${lastUser}, please come back again on another auction  !!`
            socket.emit('sold', { productId, totalFromUser });
        }

        counter = 0
        // }, timeOut);
    }

});