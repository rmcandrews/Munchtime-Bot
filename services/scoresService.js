const Scores = require('../models/Scores');

const updateBanScore = (userId, secondsBanned) => {
    getUserScores().then(userScores => {
        console.log(getUserScores);
    });
}

const getUserScores = (userId) => {
    return Scores.findOne({ userId });
}

module.exports = {
    updateBanScore
}