const db = require("../db");

const Schema = new db.Schema({
    users: [{
        id: Number,
        totalBans: Number,
        totalTimeBanned: Number
    }]
});

const Scoreboard = db.model('Scoreboard', Schema);

module.exports = Scoreboard;