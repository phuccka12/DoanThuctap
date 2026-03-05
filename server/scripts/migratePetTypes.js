/**
 * Migration: chuyển petType cũ (cat/dog/bird/custom) → petType mới (frog/pig/dragon)
 * Chạy 1 lần: node scripts/migratePetTypes.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Pet = require('../src/models/Pet');

const LEGACY_MAP = {
  cat:    'frog',
  dog:    'pig',
  bird:   'dragon',
  custom: 'dragon',
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  for (const [oldType, newType] of Object.entries(LEGACY_MAP)) {
    const result = await Pet.updateMany(
      { petType: oldType },
      { $set: { petType: newType } }
    );
    if (result.modifiedCount > 0) {
      console.log(`  ${oldType} → ${newType}: ${result.modifiedCount} pets updated`);
    }
  }

  console.log('✅ Migration done');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
