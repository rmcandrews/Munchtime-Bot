const Taco = require('../models/Taco');

const createTaco = (recipientUserId, giverUserId, number, reason) => {
    let taco = new Taco();
    taco.id = taco._id;
    taco.recipientUserId = recipientUserId;
    taco.giverUserId = giverUserId;
    taco.number = number;
    taco.reason = reason;
    taco.save((err) => {
        if(err) { console.error(err)}
    });
};

const getNumberOfGiftedTacosByUserInLastDay = (userid) => {
    return Taco.find({
        giverUserId: userId,
        createdAt: { $gt: new Date(new Date().setHours(0,0,0,0)) }
    });
};

const getTacosForUserAllTime = (userId) => {
    return Taco.find({
        recipientUserId: userId
    });
};

module.exports = {
    createTaco,
    getNumberOfGiftedTacosByUserInLastDay,
    getTacosForUserAllTime
}