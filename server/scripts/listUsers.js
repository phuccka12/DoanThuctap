const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-app';

const run = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected\n');

    const users = await User.find({}, 'email role onboarding_completed created_at -_id');
    
    if (users.length === 0) {
      console.log('No users found in database.');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`Found ${users.length} user(s):\n`);
    console.log('╔═══════════════════════════════════╦═══════════╦═══════════════════════╗');
    console.log('║ Email                             ║ Role      ║ Onboarding Completed  ║');
    console.log('╠═══════════════════════════════════╬═══════════╬═══════════════════════╣');
    
    users.forEach((user) => {
      const email = (user.email || '').padEnd(33);
      const role = (user.role || 'N/A').padEnd(9);
      const onb = (user.onboarding_completed ? 'YES' : 'NO').padEnd(21);
      console.log(`║ ${email} ║ ${role} ║ ${onb} ║`);
    });
    
    console.log('╚═══════════════════════════════════╩═══════════╩═══════════════════════╝\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    try { await mongoose.connection.close(); } catch (e) {}
    process.exit(1);
  }
};

run();
