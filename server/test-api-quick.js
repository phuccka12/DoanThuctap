require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./src/models/User');
const jwt = require('jsonwebtoken');

async function testDashboardAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Tìm TEST USER
    const testUser = await User.findOne({ email: 'test-dashboard-demo@example.com' });
    if (!testUser) {
      console.log('❌ Test user not found');
      process.exit(1);
    }

    console.log(`👤 Testing with: ${testUser.user_name} (${testUser.email})\n`);

    // Tạo JWT token cho test user
    const token = jwt.sign(
      { user_id: testUser._id },
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'your_super_secret_key',
      { expiresIn: '7d' }
    );

    console.log('🔐 Generated JWT token\n');

    // Test /api/practice/today
    console.log('📋 Testing GET /api/practice/today');
    console.log('URL:', 'http://localhost:3001/api/practice/today');
    console.log('Token:', token.substring(0, 50) + '...');
    try {
      const tasksRes = await axios.get('http://localhost:3001/api/practice/today', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      console.log('✅ Tasks Response:');
      console.log(JSON.stringify(tasksRes.data.tasks, null, 2).substring(0, 500) + '...');
    } catch (e) {
      console.log('❌ Full Error:', JSON.stringify(e, null, 2).substring(0, 300));
    }

    // Test /api/auth/me
    console.log('\n\n📱 Testing GET /api/auth/me');
    try {
      const meRes = await axios.get('http://localhost:3001/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ User Gamification Data:');
      console.log(JSON.stringify(meRes.data.user.gamification_data, null, 2));
    } catch (e) {
      console.log('❌ Error:', e.message);
      if (e.response) console.log('   Status:', e.response.status, 'Data:', e.response.data);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testDashboardAPI();
