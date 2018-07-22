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

const TacoTransaction = db.model('TacoTransaction', Schema);

module.exports = TacoTransaction;