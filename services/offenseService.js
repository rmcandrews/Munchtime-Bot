const Offense = require('../models/Offense');

const createOffense = (offendingUserId, resultingBanSeconds) => {
    let offense = new Offense();
    offense.id = offense._id;
    offense.offendingUserId = offendingUserId;
    offense.resultingBanSeconds = resultingBanSeconds;
    offense.save((err) => {
        if(err) { console.error(err)}
    });
};

const getOffensesForUserInLast24Hours = (userId) => {
    return Offense.find({
        offendingUserId: userId,
        // createdAt: { $gt: new Date(Date.now() - 24*60*60 * 1000) }
    });
};

module.exports = {
    createOffense,
    getOffensesForUserInLast24Hours
}