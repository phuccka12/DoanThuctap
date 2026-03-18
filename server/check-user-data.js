require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const LessonProgress = require('./src/models/LessonProgress');
const Pet = require('./src/models/Pet');

async function checkUserData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Tìm user đầu tiên
    const user = await User.findOne().select('_id user_name email gamification_data');
    if (!user) {
      console.log('❌ No user found');
      process.exit(1);
    }

    console.log(`👤 User: ${user.user_name} (${user.email})`);
    console.log(`   ID: ${user._id}`);
    console.log(`   Gamification Data:`, user.gamification_data);

    // Kiểm tra Pet
    const pet = await Pet.findOne({ user: user._id });
    console.log(`\n🐱 Pet Data:`);
    if (pet) {
      console.log(`   Coins: ${pet.coins}`);
      console.log(`   Level: ${pet.level}`);
      console.log(`   EXP: ${pet.growthPoints}`);
      console.log(`   Streak: ${pet.streakCount}`);
    } else {
      console.log(`   ❌ No pet found`);
    }

    // Kiểm tra LessonProgress
    const lessons = await LessonProgress.find({ userId: user._id }).sort({ updated_at: -1 }).limit(5);
    console.log(`\n📚 LessonProgress: ${lessons.length} records`);
    lessons.forEach((l, i) => {
      console.log(`   ${i+1}. Score: ${l.score}%, Time: ${l.timeSpentSec}s, Completed: ${l.completedAt ? 'Yes' : 'No'}`);
    });

    if (lessons.length === 0) {
      console.log('   ℹ️  No lesson progress found - user hasn\'t completed any lessons yet');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUserData();
