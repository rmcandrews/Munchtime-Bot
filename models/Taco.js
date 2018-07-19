const db = require("../db");

const Schema = new db.Schema({
    id : String, 
    recipientUserId : String,
    giverUserId : String,
    number: Number,
    reason: String
},{
    timestamps: {}
});

const Taco = db.model('Taco', Schema);

module.exports = Taco;