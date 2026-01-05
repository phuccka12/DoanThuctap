require('dotenv').config();
const mongoose = require('mongoose');

async function fixSessionIndex() {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Lấy collection sessions
    const db = mongoose.connection.db;
    const sessionsCollection = db.collection('sessions');

    // Xem các index hiện tại
    const indexes = await sessionsCollection.indexes();
    console.log('\n📋 Current indexes:', indexes);

    // Drop index cũ token_hash_1 nếu tồn tại
    try {
      await sessionsCollection.dropIndex('token_hash_1');
      console.log('✅ Dropped old index: token_hash_1');
    } catch (err) {
      console.log('ℹ️  Index token_hash_1 not found (already dropped)');
    }

    // Xóa tất cả sessions cũ để cleanup
    const result = await sessionsCollection.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} old sessions`);

    console.log('\n✅ Fix completed! You can now restart your server.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixSessionIndex();
