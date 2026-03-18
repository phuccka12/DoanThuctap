require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Pet = require('./src/models/Pet');
const Lesson = require('./src/models/Lesson');
const Topic = require('./src/models/Topic');
const LessonProgress = require('./src/models/LessonProgress');
const CoinLog = require('./src/models/CoinLog');
const bcrypt = require('bcryptjs');

async function setupTestData() {
  try {
    console.log('🔍 Kết nối MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Kết nối thành công\n');

    // 1. Tạo Topic
    console.log('📚 Tạo Topic...');
    let topic = await Topic.findOne({ name: 'Test Topic' });
    if (!topic) {
      topic = await Topic.create({
        name: 'Test Topic',
        slug: 'test-topic',
        description: 'Topic test',
        is_active: true,
        order: 1
      });
      console.log(`  ✅ Topic tạo: ${topic._id}`);
    } else {
      console.log(`  ℹ️  Topic đã có: ${topic._id}`);
    }

    // 2. Tạo Lesson
    console.log('\n🎓 Tạo Lesson...');
    let lesson = await Lesson.findOne({ title: 'Test Lesson' });
    if (!lesson) {
      lesson = await Lesson.create({
        title: 'Test Lesson',
        description: 'Bài học test',
        topic_id: topic._id,
        nodes: [
          { 
            _id: new mongoose.Types.ObjectId(), 
            nodeType: 'reading', 
            title: 'Test Node',
            content: '<p>Test content</p>'
          }
        ],
        duration: 15,
        is_published: true,
        is_active: true,
        order: 1
      });
      console.log(`  ✅ Lesson tạo: ${lesson._id}`);
    } else {
      console.log(`  ℹ️  Lesson đã có: ${lesson._id}`);
    }

    // 3. Tạo User test
    console.log('\n👤 Tạo User test...');
    let user = await User.findOne({ email: 'test-dashboard@example.com' });
    if (!user) {
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      user = await User.create({
        user_name: 'Test Dashboard User',
        email: 'test-dashboard@example.com',
        password_hash: hashedPassword,
        phone: '0123456789',
        learning_preferences: { current_level: 'B1' },
        gamification_data: { coins: 0, level: 1, exp: 0, streak: 0 }
      });
      console.log(`  ✅ User tạo: ${user._id} (test-dashboard@example.com / Test@123)`);
    } else {
      console.log(`  ℹ️  User đã có: ${user._id}`);
    }

    // 4. Tạo Pet
    console.log('\n🐱 Tạo Pet...');
    let pet = await Pet.findOne({ user: user._id });
    if (!pet) {
      pet = await Pet.create({
        user: user._id,
        petType: 'cat',
        egg_type: 'default',
        coins: 150,
        level: 2,
        growthPoints: 45,
        streakCount: 3,
        hunger: 70,
        happiness: 80,
        lastPlayedAt: new Date()
      });
      console.log(`  ✅ Pet tạo: ${pet._id}`);
      console.log(`     • Coins: ${pet.coins}`);
      console.log(`     • Level: ${pet.level}`);
      console.log(`     • EXP: ${pet.growthPoints}`);
    } else {
      console.log(`  ℹ️  Pet đã có: ${pet._id}`);
    }

    // 5. Tạo LessonProgress
    console.log('\n📝 Tạo LessonProgress...');
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let progress = await LessonProgress.findOne({ userId: user._id, lessonId: lesson._id });
    if (!progress) {
      progress = await LessonProgress.create({
        userId: user._id,
        lessonId: lesson._id,
        topicId: topic._id,
        completedNodes: [lesson.nodes[0]._id.toString()],
        score: 85,
        timeSpentSec: 420,
        completedAt: todayStart,
        rewarded: true,
        coinsEarned: 25,
        expEarned: 20,
        attemptCount: 1
      });
      console.log(`  ✅ LessonProgress tạo: ${progress._id}`);
      console.log(`     • Score: 85/100`);
      console.log(`     • Time: 7 phút`);
      console.log(`     • Coins earned: 25`);
    } else {
      console.log(`  ℹ️  LessonProgress đã có: ${progress._id}`);
    }

    // 6. Tạo CoinLog
    console.log('\n💰 Tạo CoinLog...');
    let coinLog = await CoinLog.findOne({ user: user._id, reason: 'lesson_complete' });
    if (!coinLog) {
      coinLog = await CoinLog.create({
        user: user._id,
        amount: 25,
        reason: 'lesson_complete',
        description: 'Hoàn thành bài học',
        timestamp: todayStart
      });
      console.log(`  ✅ CoinLog tạo: ${coinLog._id}`);
    } else {
      console.log(`  ℹ️  CoinLog đã có`);
    }

    // Hiển thị thông tin user
    console.log('\n\n═══════════════════════════════════════');
    console.log('✅ DỮ LIỆU TEST ĐÃ ĐƯỢC TẠO');
    console.log('═══════════════════════════════════════');
    console.log('\n🔐 Đăng nhập với:');
    console.log('   Email: test-dashboard@example.com');
    console.log('   Password: Test@123');
    console.log('\n📊 Dữ liệu dashboard:');
    console.log(`   • 1 bài học hoàn thành`);
    console.log(`   • 25 coins kiếm được`);
    console.log(`   • 20 EXP được thưởng`);
    console.log(`   • Pet: Level 2, 150 coins, 45/100 EXP`);
    console.log('\n💡 Hãy đăng nhập và xem dashboard cập nhật!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupTestData();
