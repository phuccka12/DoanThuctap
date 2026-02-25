require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User             = require('./src/models/User');
  const Transaction      = require('./src/models/Transaction');
  const SubscriptionPlan = require('./src/models/SubscriptionPlan');
  const vnpay            = require('./src/services/vnpayService');

  // Get a real user and the pro plan
  const user = await User.findOne();
  const plan = await SubscriptionPlan.findOne({ slug: 'pro' });

  console.log('User:', user?._id, user?.email);
  console.log('Plan:', plan?._id, plan?.name, '| monthly:', plan?.price_monthly);

  if (!plan || !plan.is_active) { console.error('Plan not found/active'); process.exit(1); }
  if (plan.slug === 'free')     { console.error('Free plan, skip'); process.exit(0); }

  const amount = plan.price_monthly;
  const start  = new Date();
  const end    = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const tx = await Transaction.create({
    user_id: user._id,
    plan_id: plan._id,
    amount,
    billing_cycle: 'monthly',
    gateway: 'vnpay',
    status: 'pending',
    subscription_start: start,
    subscription_end: end,
    created_by_admin: false,
  });
  console.log('TX created OK:', tx._id.toString());

  const payUrl = vnpay.createPaymentUrl({
    txnRef:    tx._id.toString(),
    amount,
    orderInfo: 'Pro 1 thang',
    ipAddr:    '127.0.0.1',
  });
  console.log('payUrl OK:', payUrl.slice(0, 100) + '...');

  // cleanup test tx
  await Transaction.deleteOne({ _id: tx._id });
  console.log('Cleaned up test TX');
  await mongoose.disconnect();
  console.log('ALL GOOD - controller logic works fine');
}).catch(e => {
  console.error('ERROR:', e.message);
  console.error(e.stack);
  process.exit(1);
});
