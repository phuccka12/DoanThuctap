const mongoose = require('mongoose');

/**
 * ShopItem – Vật phẩm trong cửa hàng
 * category:
 *   food      – thức ăn, tăng hunger_restore điểm đói
 *   skin      – trang phục/skin, pet equip được
 *   function  – vật phẩm chức năng (ví dụ: freeze_streak)
 *
 * effects (JSON): tác dụng khi sử dụng, ví dụ:
 *   { hunger_restore: 30 }
 *   { exp_bonus_pct: 10 }
 *   { freeze_streak: true }
 *   { growth_points: 50 }
 */
const shopItemSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category:    { type: String, enum: ['food', 'skin', 'function'], required: true },
    price:       { type: Number, required: true, min: 0 },   // giá bán tính bằng Coins
    image_url:   { type: String, default: '' },              // URL ảnh Pixel Art trên Cloudinary
    effects:     { type: mongoose.Schema.Types.Mixed, default: {} },
    is_active:   { type: Boolean, default: true },            // ẩn/hiện khỏi shop
    sort_order:  { type: Number, default: 0 },
    created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('ShopItem', shopItemSchema);
