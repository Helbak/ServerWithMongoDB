const Model = require("./model").Model;
const Logic = require("./logic.js").Logic;

const express = require("express");
const app = express();
let fs = require('fs');


const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const quotationSchema = new Schema({
        open: Number,
        close: Number,
        high: Number,
        low: Number,
        date: Date
    })
;
mongoose.connect("mongodb://localhost:27017/quotesdb", {useNewUrlParser: true});
const Quote = mongoose.model("Quote", quotationSchema);

const model = new Model();
const logic = new Logic();

let oldData = fs.readFileSync('text.txt', 'utf8');
model.arrayOfCandles = oldData.split('\n');

app.get("/getall", function (request, response) {
    let contents = fs.readFileSync('obj.txt', 'utf8');
    response.send(contents);
});
app.get("/getallmongodb", function (request, response) {
    const contents = model.stringFromMongoDB;
    response.send(contents);
});
app.use("/getlast", function (request, response) {
    // console.log("response.send(model.arrayOfCandles[model  "+model.arrayOfCandles[model.arrayOfCandles.length-2])
    response.send(model.arrayOfCandles[model.arrayOfCandles.length - 1]);
});

app.get("/", function (request, response) {
    response.send(" Main Page ")
});
app.listen(3000);

function main() {

    console.log(' last     _____' + model.arrayOfCandles[model.arrayOfCandles.length - 1]);
    for (let i = 0; i < model.arrayOfCandles.length; i++) {
        console.log(i + '__' + model.arrayOfCandles[i]);
    }

    function candleCreator() {
        let date = new Date();
        let second = date.getSeconds();
        let number = logic.getRandom();
        let secondData = logic.getSecondData(number, second);
        model.addSecond(secondData);
        console.log('model.addSecond(secondData) ' + secondData.ratio);
        if (second === 59) {
            let array = model.arrayOfSeconds;
            model.arrayOfSeconds = [];
            let candle = logic.getOCHL(array, date);
            console.log(candle);
            model.addCandles(candle);
            write(candle);
            writeToMongoDB(candle);
        }
    }

    setInterval(candleCreator, 1000);
}

function write(candle) {
    let jsonCandle = logic.objToJson(candle);
    fs.appendFile('text.txt', jsonCandle, function () {
    });
    fs.appendFile('text.txt', '\n', function () {
    });
    fs.appendFile('obj.txt', jsonCandle, function () {
    });
}

function writeToMongoDB(candle) {
    const dataCandle = new Quote({
        open: candle.open,
        close: candle.close,
        high: candle.high,
        low: candle.low,
        date: candle.data
    });
    dataCandle.save(function (err) {

        mongoose.disconnect();  // отключение от базы данных
        if (err) return console.log(err);
        console.log("Сохранен объект MongoDB", dataCandle);
    });
};

function readMongoDB() {
    Quote.find((err, candles) => {
        // Note that this error doesn't mean nothing was found,
        // it means the database had an error while searching, hence the 500 status
        if (err){
            return res.status(500).send(err);
        }
        // send the list of all people
        model.setStringFromMongoDB(candles);
        // return res.status(200).send(candles);
    });
}
readMongoDB();
main();
