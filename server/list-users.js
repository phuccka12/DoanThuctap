require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📋 Danh sách users trong database:\n');

    const users = await User.find().select('_id user_name email role gamification_data');
    
    users.forEach((u, i) => {
      console.log(`${i+1}. ${u.user_name}`);
      console.log(`   Email: ${u.email}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Coins: ${u.gamification_data?.gold || 0}`);
      console.log();
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listUsers();
