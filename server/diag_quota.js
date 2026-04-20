const mongoose = require('mongoose');
require('dotenv').config();

async function diag() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const SubscriptionPlan = mongoose.model('SubscriptionPlan', new mongoose.Schema({ slug: String, quota: Object }));
    const AIUsage = mongoose.model('AIUsage', new mongoose.Schema({ user_id: mongoose.Schema.Types.ObjectId, date: String, ai_blocked: Boolean, writing_checks: Number }));

    const plans = await SubscriptionPlan.find();
    console.log('--- Subscription Plans ---');
    console.log(JSON.stringify(plans, null, 2));

    const today = new Date().toISOString().split('T')[0];
    const usages = await AIUsage.find({ date: today });
    console.log('--- AI Usage (Today) ---');
    console.log(JSON.stringify(usages, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

diag();
