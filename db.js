let db = require('mongoose');

db.connect(process.env.MONGODB_URI, (error) => {
    if (error) console.error(error);
    else console.log('mongo connected');
});

module.exports = db;