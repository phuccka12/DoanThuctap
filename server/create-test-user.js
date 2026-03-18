require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Pet = require('./src/models/Pet');
const LessonProgress = require('./src/models/LessonProgress');
const CoinLog = require('./src/models/CoinLog');
const bcrypt = require('bcryptjs');

async function createTestUserWithData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Tạo user test
    const hashedPassword = await bcrypt.hash('Test@123456', 10);
    const testUser = await User.create({
      user_name: 'Test User - Dashboard Demo',
      email: 'test-dashboard-demo@example.com',
      password_hash: hashedPassword,
      phone: '0123456789',
      role: 'standard',
      status: 'active',
      learning_preferences: { current_level: 'B1' },
      gamification_data: { level: 1, gold: 0, exp: 0, streak: 0 }
    });

    console.log(`✅ User tạo: ${testUser._id}`);
    console.log(`   Email: test-dashboard-demo@example.com`);
    console.log(`   Password: Test@123456\n`);

    // Tạo Pet với dữ liệu thực
    const pet = await Pet.create({
      user: testUser._id,
      petType: 'cat',
      egg_type: 'default',
      hatched: true,
      coins: 250,
      level: 3,
      growthPoints: 75,
      streakCount: 5,
      hunger: 30,
      happiness: 85,
      lastPlayedAt: new Date()
    });

    console.log(`✅ Pet tạo: ${pet._id}`);
    console.log(`   Coins: 250`);
    console.log(`   Level: 3`);
    console.log(`   EXP: 75/100`);
    console.log(`   Streak: 5 ngày\n`);

    // Tạo coin logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await CoinLog.create([
      {
        user: testUser._id,
        pet: pet._id,
        type: 'earn',
        source: 'lesson_complete',
        amount: 50,
        note: 'Hoàn thành bài học',
        created_at: today
      },
      {
        user: testUser._id,
        pet: pet._id,
        type: 'earn',
        source: 'daily_bonus',
        amount: 30,
        note: 'Bonus hàng ngày',
        created_at: today
      },
      {
        user: testUser._id,
        pet: pet._id,
        type: 'earn',
        source: 'streak_bonus',
        amount: 25,
        note: 'Streak bonus',
        created_at: today
      }
    ]);

    console.log(`✅ Coin logs tạo: 3 entries`);
    console.log(`   Hôm nay kiếm: 105 coins\n`);

    console.log('═══════════════════════════════════════');
    console.log('🎉 TEST USER READY!');
    console.log('═══════════════════════════════════════');
    console.log('\n📱 Đăng nhập với:\n');
    console.log('   Email: test-dashboard-demo@example.com');
    console.log('   Password: Test@123456\n');
    console.log('Dashboard sẽ hiển thị:');
    console.log('   • Coins: 250 (từ Pet model)');
    console.log('   • Level: 3');
    console.log('   • EXP: 75%');
    console.log('   • Streak: 5 ngày');
    console.log('   • Hôm nay kiếm: 105 coins\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUserWithData();
