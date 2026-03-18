require('dotenv').config();
co    // Test /api/practice/today
    console.log('📋 Testing GET /api/practice/today');
    const tasksRes = await axios.get('http://localhost:3001/api/practice/today', {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(e => {
      console.log('❌ Error:', e.response?.status, e.response?.data || e.message);
      return null;
    });s = require('axios');

// Lấy JWT token từ database đầu tiên
const mongoose = require('mongoose');
const User = require('./src/models/User');
const jwt = require('jsonwebtoken');

async function testDashboardAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Tìm user đầu tiên
    const user = await User.findOne().select('_id user_name email');
    if (!user) {
      console.log('❌ No user found in database');
      process.exit(1);
    }

    console.log(`👤 Testing with user: ${user.user_name} (${user.email})\n`);

    // Tạo JWT token
    const token = jwt.sign(
      { user_id: user._id },
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'your_super_secret_key',
      { expiresIn: '7d' }
    );

    console.log('🔐 Generated JWT token\n');

    // Test /api/dashboard/today-tasks
    console.log('📋 Testing GET /api/practice/today');
    const tasksRes = await axios.get('http://localhost:3001/api/practice/today', {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(e => {
      console.log('❌ Error:', e.response?.data || e.message);
      return null;
    });

    if (tasksRes) {
      console.log('✅ Response:');
      console.log(JSON.stringify(tasksRes.data, null, 2));
    }

    // Test /api/auth/me
    console.log('\n\n📱 Testing GET /api/auth/me');
    const meRes = await axios.get('http://localhost:3001/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }).catch(e => {
      console.log('❌ Error:', e.response?.status, e.response?.data || e.message);
      return null;
    });

    if (meRes) {
      console.log('✅ Response (User data):');
      console.log(JSON.stringify(meRes.data.user.gamification_data, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testDashboardAPI();
