'use strict';
require('@code-fellows/supergoose');
const supertest = require('supertest');
const app = require('../brain.js');
const fakeServer = supertest(app);


describe('Testing /add route', () => {

    it('Testing Body Data', async() => {
        let data = { name: 'product1', price: 200, description: "testing product", image: "any", category: "car", timer: "120" }
        let test = fakeServer.post('/add').send(data);

        console.log(test.req)
    });


});