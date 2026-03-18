require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Pet = require('./src/models/Pet');

async function checkAdminData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Lấy admin user
    const admin = await User.findOne({ email: 'admintest03@gmail.com' });
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    console.log(`👤 Admin User: ${admin.user_name} (${admin._id})`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Status: ${admin.status}`);
    console.log(`   Gamification Data:`, admin.gamification_data);

    // Kiểm tra Pet
    const pet = await Pet.findOne({ user: admin._id });
    console.log(`\n🐱 Pet for admin:`);
    if (pet) {
      console.log(`   ✅ Found Pet: ${pet._id}`);
      console.log(`   Coins: ${pet.coins}`);
      console.log(`   Level: ${pet.level}`);
      console.log(`   EXP: ${pet.growthPoints}`);
      console.log(`   Streak: ${pet.streakCount}`);
    } else {
      console.log(`   ❌ No Pet found for admin user`);
    }

    // Lấy user KHÔNG phải admin
    console.log('\n\n═══════════════════════════════════════');
    console.log('Kiểm tra user KHÔNG phải admin:');
    console.log('═══════════════════════════════════════\n');
    
    const regularUser = await User.findOne({ role: { $ne: 'admin' } });
    if (!regularUser) {
      console.log('❌ No regular user found');
      process.exit(0);
    }

    console.log(`👤 Regular User: ${regularUser.user_name} (${regularUser._id})`);
    console.log(`   Role: ${regularUser.role}`);
    console.log(`   Status: ${regularUser.status}`);
    console.log(`   Gamification Data:`, regularUser.gamification_data);

    // Kiểm tra Pet của regular user
    const regularPet = await Pet.findOne({ user: regularUser._id });
    console.log(`\n🐱 Pet for regular user:`);
    if (regularPet) {
      console.log(`   ✅ Found Pet: ${regularPet._id}`);
      console.log(`   Coins: ${regularPet.coins}`);
      console.log(`   Level: ${regularPet.level}`);
      console.log(`   EXP: ${regularPet.growthPoints}`);
      console.log(`   Streak: ${regularPet.streakCount}`);
    } else {
      console.log(`   ❌ No Pet found`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAdminData();
