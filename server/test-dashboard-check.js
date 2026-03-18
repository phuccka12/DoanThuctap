require('dotenv').config();
const mongoose = require('mongoose');
const LessonProgress = require('./src/models/LessonProgress');
const CoinLog = require('./src/models/CoinLog');
const User = require('./src/models/User');
const Pet = require('./src/models/Pet');

async function checkDashboardData() {
  try {
    console.log('🔍 Kết nối MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-learning');
    
    // Lấy 1 user bất kỳ
    const user = await User.findOne().select('_id user_name email');
    if (!user) {
      console.log('❌ Không có user nào');
      process.exit(1);
    }
    
    console.log(`\n✅ User tìm thấy: ${user.user_name} (${user._id})`);
    
    // Kiểm tra LessonProgress
    const lessons = await LessonProgress.find({ userId: user._id }).sort({ updated_at: -1 }).limit(5);
    console.log(`\n📚 Lessons đã làm: ${lessons.length}`);
    lessons.forEach((l, i) => {
      console.log(`  ${i+1}. Score: ${l.score}, Time: ${l.timeSpentSec}s, Completed: ${l.completedAt ? '✅' : '❌'}`);
    });
    
    // Kiểm tra CoinLog
    const coins = await CoinLog.find({ user: user._id }).sort({ timestamp: -1 }).limit(5);
    console.log(`\n💰 CoinLog: ${coins.length} entries`);
    coins.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.amount} coins, ${c.reason}, ${new Date(c.timestamp).toLocaleString()}`);
    });
    
    // Kiểm tra Pet
    const pet = await Pet.findOne({ userId: user._id });
    console.log(`\n🐱 Pet Data:`);
    if (pet) {
      console.log(`  💰 Coins: ${pet.coins}`);
      console.log(`  ⭐ Level: ${pet.level}`);
      console.log(`  ⚡ GrowthPoints: ${pet.growthPoints}`);
      console.log(`  🔥 Streak: ${pet.streakCount}`);
    } else {
      console.log('  ❌ Không có Pet data');
    }
    
    // Kiểm tra User.gamification_data
    const fullUser = await User.findById(user._id).select('gamification_data');
    console.log(`\n📊 User.gamification_data:`);
    console.log(`  ${JSON.stringify(fullUser.gamification_data, null, 2)}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDashboardData();
