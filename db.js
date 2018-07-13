let db = require('mongoose');

db.connect(process.env.MONGOLAB_URI, (error) => {
    if (error) console.error(error);
    else console.log('mongo connected');
});

export default db;