const Scoreboard = require('../models/Scoreboard');

const getScoreboard = () => {
    return new Promise((resolve, reject) => {
        Scoreboard.find({}, (err, allScoreboards) => {
            if(err) reject(err);
            resolve(allScoreboards[0]);
        });
    });
};

const updateScoreboard = (userId, secondsBanned) => {
    getScoreboard().then(scoreboardSchema => {
        let scoreboard = scoreboardSchema.toObject();
        let users = scoreboard.users[0];
        console.log("Inital users");
        console.log(users);
        if(!users[userId]) {
            addNewUser(userId);
        }
    });
}

const addNewUser = (userId) => {
    let newUserObject = {};
    newUserObject[`users.${userId}`] = {};
    Scoreboard.update({ _id: scoreboard.id }, 
        { 
            $set: newUserObject
        }, 
        (err, updatedScoreboard) => {
            console.log("DB stuff");
            if (err) console.error(err);
            console.log(updatedScoreboard);
        }
    );
}

module.exports = {
    updateScoreboard
}