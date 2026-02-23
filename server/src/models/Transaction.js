const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  amount:       { type: Number, required: true },
  currency:     { type: String, default: 'VND' },
  billing_cycle: { type: String, enum: ['monthly', 'yearly', 'one_time'], default: 'monthly' },

  // Payment gateway info
  gateway:      { type: String, enum: ['stripe', 'paypal', 'vnpay', 'manual'], default: 'manual' },
  gateway_tx_id: { type: String, default: null }, // Stripe charge ID / VNPay txn ref
  gateway_payload: { type: mongoose.Schema.Types.Mixed, default: null }, // Raw webhook data

  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },

  // When subscription starts/ends from this payment
  subscription_start: { type: Date, default: null },
  subscription_end:   { type: Date, default: null },

  notes: { type: String, default: '' },   // Admin note for manual payments
  created_by_admin: { type: Boolean, default: false }, // true = manually added by admin
  refunded_at: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Index for fast queries
transactionSchema.index({ user_id: 1, status: 1 });
transactionSchema.index({ created_at: -1 });
transactionSchema.index({ gateway_tx_id: 1 }, { sparse: true });

module.exports = mongoose.model('Transaction', transactionSchema);
