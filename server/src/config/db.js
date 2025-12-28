const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

// 👇 QUAN TRỌNG: Phải viết y chang thế này, KHÔNG ĐƯỢC CÓ DẤU {}
module.exports = connectDB;