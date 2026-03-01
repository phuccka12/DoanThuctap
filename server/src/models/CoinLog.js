const mongoose = require('mongoose');

/**
 * CoinLog – Lịch sử giao dịch Coins
 * type:
 *   earn  – nhận Coins (hoàn thành bài tập)
 *   spend – tiêu Coins (mua vật phẩm)
 *   admin – admin cộng/trừ thủ công
 *
 * source: nguồn gốc cụ thể
 *   earn:   'vocab' | 'speaking' | 'writing' | 'reading' | 'listening' | 'checkin' | 'play'
 *   spend:  'buy_item' (kèm item_id)
 *   admin:  'manual_grant' | 'manual_deduct'
 */
const coinLogSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pet:        { type: mongoose.Schema.Types.ObjectId, ref: 'Pet',  default: null },
    type:       { type: String, enum: ['earn', 'spend', 'admin'], required: true },
    source:     { type: String, required: true },
    amount:     { type: Number, required: true },   // >0 earn/grant, <0 spend/deduct
    balance_after: { type: Number, default: 0 },    // số dư sau giao dịch
    item_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'ShopItem', default: null },
    note:       { type: String, default: '' },
    admin_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // admin thao tác
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Index để query nhanh
coinLogSchema.index({ user: 1, created_at: -1 });
coinLogSchema.index({ type: 1, created_at: -1 });

module.exports = mongoose.model('CoinLog', coinLogSchema);
