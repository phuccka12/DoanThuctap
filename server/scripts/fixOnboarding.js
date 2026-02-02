const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../src/models/User');

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-app';

const argv = process.argv.slice(2).reduce((acc, cur) => {
  if (cur.startsWith('--')) {
    const [k, v] = cur.slice(2).split('=');
    acc[k] = v === undefined ? true : v;
  }
  return acc;
}, {});

const run = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected');

    const email = argv.email || process.env.ADMIN_EMAIL;
    if (!email) {
      console.error('Please provide --email=... or set ADMIN_EMAIL env var');
      process.exit(1);
    }

    const emailLower = email.toLowerCase();
    console.log(`\n📍 Looking for user: ${emailLower}`);

    const user = await User.findOne({ email: emailLower });
    if (!user) {
      console.error('❌ User not found');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('\n📋 Current state:');
    console.log(`  email: ${user.email}`);
    console.log(`  role: ${user.role}`);
    console.log(`  onboarding_completed: ${user.onboarding_completed}`);
    console.log(`  _id: ${user._id}`);

    if (user.onboarding_completed === true) {
      console.log('\n✅ onboarding_completed is already TRUE. No fix needed.');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('\n⚙️  Setting onboarding_completed = true...');
    user.onboarding_completed = true;
    await user.save();

    console.log('\n✅ Updated! Verifying...');
    const updated = await User.findOne({ email: emailLower });
    console.log(`  onboarding_completed: ${updated.onboarding_completed}`);

    await mongoose.connection.close();
    console.log('\n✓ Done. User can now login without onboarding.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    try { await mongoose.connection.close(); } catch (e) {}
    process.exit(1);
  }
};

run();
