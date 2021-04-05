const mongoose = require('mongoose');
const config = require('config');
const dbString = config.get('mongoURI');

const connectDB = async() => {
    try {
        await mongoose.connect(dbString,
            {
                useNewUrlParser: true,
                useCreateIndex: true,
                useFindAndModify: false,
            });

        console.log(`A connection has been established with MongoDB`);

    }
    catch (e)
    {
        console.error(e.message);
        // Process ended with exit code 1
        process.exit(1);
    }
}

module.exports = connectDB;

// test