const db = require("../db");

const Schema = new db.Schema({
    userId: String,
    bans: Number,
    bannedSeconds: Number,
    totalTacosGiven: Number,
    totalTacosReceived: Number
});

const Scores = db.model('Scores', Schema);

module.exports = Scores;