const Scores = require('../models/Scores');

const updateBanScore = (userId, secondsBanned) => {
    getUserScores(userId).then(userScores => {
        console.log(userScores);
    });
}

const getUserScores = (userId) => {
    return Scores.findOne({ userId });
}

module.exports = {
    updateBanScore
}