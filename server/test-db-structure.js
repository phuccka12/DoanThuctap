require('dotenv').config();
const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    console.log('🔍 Kết nối MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-learning');
    
    // Lấy tất cả collections
    const db = mongoose.connection;
    const collections = await db.db.listCollections().toArray();
    
    console.log(`\n📚 Collections trong database: ${collections.length}`);
    collections.forEach(c => {
      console.log(`  • ${c.name}`);
    });
    
    // Đếm documents trong các collection quan trọng
    for (const collName of ['users', 'lessonprogresses', 'coinlogs', 'pets']) {
      const count = await db.db.collection(collName).countDocuments().catch(() => 0);
      console.log(`\n  📊 ${collName}: ${count} documents`);
      
      if (count > 0 && collName === 'users') {
        const sample = await db.db.collection(collName).findOne();
        console.log(`    Sample user: ${sample.user_name || sample.email}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
