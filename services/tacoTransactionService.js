const TacoTransaction = require('../models/TacoTransaction');

const createTacoTransaction = (recipientUserId, giverUserId, number, reason) => {
    let tacoTransaction = new TacoTransaction();
    tacoTransaction.id = tacoTransaction._id;
    tacoTransaction.recipientUserId = recipientUserId;
    tacoTransaction.giverUserId = giverUserId;
    tacoTransaction.number = number;
    tacoTransaction.reason = reason;
    tacoTransaction.save((err) => {
        if(err) { console.error(err)}
    });
};

const getNumberOfGiftedTacoTransactionsByUserInLastDay = (userId) => {
    return TacoTransaction.find({
        giverUserId: userId,
        createdAt: { $gt: new Date(new Date().setHours(0,0,0,0)) }
    });
};

module.exports = {
    createTacoTransaction,
    getNumberOfGiftedTacoTransactionsByUserInLastDay
}