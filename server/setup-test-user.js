require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

// Kiểm tra xem có user nào hoặc tạo user test
async function setupTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-learning');
    
    console.log('🔍 Kiểm tra existing users...');
    const existingUsers = await User.find();
    console.log(`📊 Tổng users: ${existingUsers.length}`);
    
    if (existingUsers.length > 0) {
      console.log('\n✅ Users hiện có:');
      existingUsers.forEach(u => {
        console.log(`  • ${u.user_name} (${u.email})`);
      });
      process.exit(0);
    }
    
    // Nếu không có user, tạo user test
    console.log('\n❌ Không có user nào. Tạo test user...');
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    
    const testUser = new User({
      user_name: 'Test Student',
      email: 'test@example.com',
      password: hashedPassword,
      phone: '0123456789',
      learning_preferences: {
        current_level: 'B1',
      },
      gamification_data: {
        coins: 0,
        level: 1,
        exp: 0,
        streak: 0
      }
    });
    
    await testUser.save();
    console.log(`\n✅ Tạo user thành công: test@example.com / Test@123`);
    console.log(`User ID: ${testUser._id}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupTestUser();
