let db = require('mongoose');

const options = { useNewUrlParser: true };
db.connect(process.env.MONGODB_URI, options, (err) => {
    if (err) console.error(err);
    else console.log('db connected');
});

module.exports = db;