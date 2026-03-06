'use strict';
// Quick test harness to run generatePlan() outside of Express
require('dotenv').config();
const mongoose = require('mongoose');
const Controller = require('../src/controllers/LearningController');
const User = require('../src/models/User');

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName: process.env.MONGO_DB_NAME || undefined });
  console.log('[test] Connected to MongoDB');

  const user = await User.findOne({ onboarding_completed: true }).lean();
  if (!user) {
    console.error('[test] No onboarding_completed user found. Aborting.');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log('[test] Using user:', user.user_name || user._id.toString());

  const req = { userId: user._id.toString(), body: {}, params: {} };
  const res = {
    status(code) { this._status = code; return this; },
    json(obj) { console.log('[test] output (res.json):'); console.log(JSON.stringify(obj, null, 2)); return obj; }
  };

  try {
    await Controller.generatePlan(req, res);
  } catch (err) {
    console.error('[test] generatePlan threw:', err);
  } finally {
    await mongoose.disconnect();
    console.log('[test] disconnected');
  }
}

main();
