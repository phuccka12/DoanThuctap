require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkOnboarding() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Lấy tất cả users
    const allUsers = await User.find({})
      .select('user_name email onboarding_completed learning_preferences created_at')
      .sort({ created_at: -1 })
      .limit(10);

    console.log(`📊 Tổng số users: ${await User.countDocuments()}`);
    console.log(`\n=== 10 USERS GẦN NHẤT ===\n`);

    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.user_name} (${user.email})`);
      console.log(`   onboarding_completed: ${user.onboarding_completed}`);
      console.log(`   learning_preferences:`, user.learning_preferences);
      console.log('');
    });

    // Đếm users đã hoàn thành onboarding
    const completedCount = await User.countDocuments({ onboarding_completed: true });
    console.log(`\n✅ Đã hoàn thành onboarding: ${completedCount}`);
    console.log(`❌ Chưa hoàn thành: ${await User.countDocuments() - completedCount}`);

    await mongoose.connection.close();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOnboarding();
