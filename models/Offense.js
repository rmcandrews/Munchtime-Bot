const db = require("../db");

const Schema = new db.Schema({
    id                      : String, 
    offendingUserId         : String,
    resultingBanSeconds     : Number
},{
    timestamps: {}
});

const Offense = db.model('Offense', Schema);

module.exports = Offense;