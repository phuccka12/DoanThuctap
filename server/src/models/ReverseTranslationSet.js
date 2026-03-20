'use strict';
/**
 * ReverseTranslationSet
 * --------------------------------------------------------------
 * Một "bộ đề" dịch ngược. Mỗi bộ đề gồm nhiều câu lấy từ một
 * bài Lesson/Reading có sẵn (Data Repurposing).
 *
 * Admin tạo bộ đề bằng cách:
 *   1. Chọn Lesson nguồn.
 *   2. Highlight câu có "từ vựng ăn điểm" (target vocab).
 *   3. Nhập / để AI dịch sang tiếng Việt.
 *   4. Đánh dấu từ "bắt buộc" (requiredWords).
 *
 * Collection: reversetranslationsets
 */
const mongoose = require('mongoose');

const SentenceItemSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },     // thứ tự câu trong bộ đề

    // Câu tiếng Việt user nhìn vào để dịch
    vnText: { type: String, required: true, trim: true },

    // Đáp án mẫu (hidden from user, dùng để AI so sánh)
    enTarget: { type: String, required: true, trim: true },

    // Các từ/cụm từ PHẢI xuất hiện trong bản dịch (ràng buộc từ vựng)
    requiredWords: { type: [String], default: [] },

    // Gợi ý chữ cái đầu: chỉ lưu danh sách chữ đầu tiên mỗi từ enTarget
    // (gen tự động khi save; dùng cho tính năng "Hint - chữ cái đầu")
    firstLetterHint: { type: [String], default: [] },

    // Grammar hint được Admin soạn sẵn (hiện khi user mua gợi ý ngữ pháp)
    grammarHint: { type: String, default: '' },

    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  },
  { _id: true }
);

const ReverseTranslationSetSchema = new mongoose.Schema(
  {
    // Bài Lesson nguồn để tái sử dụng dữ liệu
    sourceLesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
    },

    // Tiêu đề & mô tả bộ đề
    title:       { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', trim: true, maxlength: 1000 },

    // Trình độ chung của bộ đề
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },

    // Danh sách câu
    items: { type: [SentenceItemSchema], default: [] },

    // Coins thưởng khi hoàn thành cả bộ đề (có thể override economy config)
    rewardCoins: { type: Number, default: 0 },

    // Điểm trừ HP con pet khi user dịch sai hoàn toàn
    wrongAnswerHpPenalty: { type: Number, default: 5 },

    is_active:   { type: Boolean, default: true },
    is_published:{ type: Boolean, default: false },

    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'reversetranslationsets',
  }
);

// Auto-generate firstLetterHint trước khi save
ReverseTranslationSetSchema.pre('save', function () {
  if (this.isModified('items')) {
    this.items.forEach(item => {
      if (!item.firstLetterHint || item.firstLetterHint.length === 0) {
        item.firstLetterHint = item.enTarget
          .split(/\s+/)
          .map(w => w[0] || '')
          .filter(Boolean);
      }
    });
  }
});

module.exports = mongoose.model('ReverseTranslationSet', ReverseTranslationSetSchema);
