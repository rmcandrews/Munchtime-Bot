const db = require("../db");

const Schema = new db.Schema({
    userId: String,
    bans: Number,
    bannedSeconds: Number,
    tacos: Number
});

const Scores = db.model('Scores', Schema);

module.exports = Scores;