require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Pet = require('./src/models/Pet');

async function checkTestUserPet() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ email: 'test-dashboard-demo@example.com' });
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log(`👤 User: ${user.user_name}`);
    console.log(`   ID: ${user._id}`);
    console.log(`   User.gamification_data:`, user.gamification_data);

    const pet = await Pet.findOne({ user: user._id });
    console.log(`\n🐱 Pet:`);
    if (pet) {
      console.log(`   ✅ Found Pet: ${pet._id}`);
      console.log(`   Coins: ${pet.coins}`);
      console.log(`   Level: ${pet.level}`);
      console.log(`   EXP: ${pet.growthPoints}`);
      console.log(`   Streak: ${pet.streakCount}`);
    } else {
      console.log(`   ❌ No Pet found!`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTestUserPet();
