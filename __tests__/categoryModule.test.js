'use strict'

const Category = require('../src/category.js');

let data = {
    token: 'test',
    lastPrice: 500
}


xdescribe("Testing Category Module", () => {
    it('test increasePrice method', () => {
        let test = Category.increasePrice(data);
        expect(test.lastPrice).toEqual(data.lastPrice);
    });


    it('test sold method', async() => {
        let mockCons = jest.spyOn(global.console, "log");
        let test = Category.sold(data);
        expect(mockCons).toHaveBeenCalled()
    });


    it('test notSold method', async() => {
        let mockCons = jest.spyOn(global.console, "log");

        let test = Category.notSold(data);
        expect(mockCons).toHaveBeenCalled();
    });
})