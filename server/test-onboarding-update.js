require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function testOnboardingUpdate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Tìm user vừa test
    const user = await User.findOne({ email: 'phuccao083@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }

    console.log('📊 User info:');
    console.log('  Email:', user.email);
    console.log('  Name:', user.user_name);
    console.log('  onboarding_completed:', user.onboarding_completed);
    console.log('  learning_preferences:', JSON.stringify(user.learning_preferences, null, 2));

    // Test update
    console.log('\n🧪 Testing update onboarding_completed...');
    user.onboarding_completed = true;
    user.learning_preferences = {
      goal: 'test_goal',
      current_level: 'test_level',
      focus_skills: ['test_skill'],
      study_hours_per_week: 30
    };
    await user.save();
    console.log('✅ Updated successfully!');

    // Verify
    const updatedUser = await User.findById(user._id);
    console.log('\n📊 After update:');
    console.log('  onboarding_completed:', updatedUser.onboarding_completed);
    console.log('  learning_preferences:', JSON.stringify(updatedUser.learning_preferences, null, 2));

    await mongoose.connection.close();
    console.log('\n✅ Test completed!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testOnboardingUpdate();
