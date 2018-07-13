const db = require("../db");

const Schema = new db.Schema({
    id                      : String, 
    offending_user_id       : String,
    resulting_ban_seconds   : Number
},{
    timestamps: { createdAt: 'created_at' } 
});

const Offense = db.model('Offense', Schema);

module.exports = Offense;