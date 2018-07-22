const Scores = require('../models/Scores');

const updateBanScore = (userId, secondsBanned) => {
    getUserScores(userId).then(userScores => {
        if(!userScores) {
            userScores = new Scores();
            userScores.userId = userId;
            userScores.bans = 0;
            userScores.bannedSeconds = 0;
            userScores.totalTacosGiven = 0;
            userScores.totalTacosReceived = 0;
        };
        userScores.bans++;
        userScores.bannedSeconds += secondsBanned;
        userScores.save();
    });
}

const updateTacoScore = (userId, additionalTacosGiven, additionalTacosReceived) => {
    getUserScores(userId).then(userScores => {
        if(!userScores) {
            userScores = new Scores();
            userScores.userId = userId;
            userScores.bans = 0;
            userScores.bannedSeconds = 0;
            userScores.totalTacosGiven = 0;
            userScores.totalTacosReceived = 0;
        };
        userScores.totalTacosGiven = (userScores.totalTacosGiven || 0) + additionalTacosGiven;
        userScores.totalTacosReceived = (userScores.totalTacosReceived || 0) + additionalTacosReceived;
        userScores.save();
    });
}

const getUserScores = (userId) => {
    return Scores.findOne({ userId });
}

const getAllScores = () => {
    return new Promise((resolve) => {
        Scores.find({}).then(resolve)
    });
}


module.exports = {
    updateBanScore,
    updateTacoScore,
    getAllScores
}