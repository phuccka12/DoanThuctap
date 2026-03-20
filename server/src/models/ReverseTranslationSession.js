'use strict';
/**
 * ReverseTranslationSession
 * --------------------------------------------------------------
 * Lưu trạng thái một lần luyện tập dịch ngược của user.
 * Mỗi lần user mở bộ đề → tạo (hoặc resume) một Session.
 *
 *  status:
 *    in_progress — đang làm
 *    completed   — đã nộp toàn bộ
 *    abandoned   — không hoàn thành (timeout / bỏ giữa chừng)
 *
 * Collection: reversetranslationsessions
 */
const mongoose = require('mongoose');

// Kết quả chấm AI từng câu
const SentenceResultSchema = new mongoose.Schema(
  {
    itemId:      { type: mongoose.Schema.Types.ObjectId, required: true }, // _id của SentenceItem
    order:       { type: Number },
    userAnswer:  { type: String, default: '' },  // Bản dịch user gõ

    // Kết quả AI trả về (lưu để replay / hiển thị lại)
    aiScore:     { type: Number, default: 0 },   // 0-100
    aiFeedback:  { type: String, default: '' },  // nhận xét của AI
    aiNaturalness: { type: String, default: '' },// góp ý văn phong tự nhiên

    // Trạng thái câu
    status: {
      type: String,
      enum: ['pending', 'correct', 'partial', 'wrong', 'skipped'],
      default: 'pending',
    },

    // Combo khi nộp câu này (0 = không có)
    comboAtSubmit: { type: Number, default: 0 },

    // Coins thưởng thực sự nhận được từ câu này (sau tính combo)
    coinsEarned: { type: Number, default: 0 },

    // Số lần thử của câu này
    attempts: { type: Number, default: 0 },

    // Danh sách hints đã mua cho câu này
    hintsPurchased: {
      type: [String],
      enum: ['first_letter', 'grammar', 'view_passage'],
      default: [],
    },

    // Tổng coins đã tiêu cho hints ở câu này
    hintCoinsPaid:  { type: Number, default: 0 },
  },
  { _id: false }
);

const ReverseTranslationSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    setId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReverseTranslationSet',
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
    },

    results: { type: [SentenceResultSchema], default: [] },

    // Câu đang làm (index trong results[])
    currentIndex: { type: Number, default: 0 },

    // Combo hiện tại (reset về 0 khi sai)
    currentCombo: { type: Number, default: 0 },

    // Tổng điểm phiên này
    totalScore:   { type: Number, default: 0 },

    // Tổng coins thực sự kiếm được (sau đã tính hints tiêu)
    totalCoinsEarned: { type: Number, default: 0 },

    // Tổng coins tiêu cho hints
    totalCoinsSpentOnHints: { type: Number, default: 0 },

    // Số lần sai hoàn toàn trong phiên → HP penalty cho pet
    wrongCountFull: { type: Number, default: 0 },

    completedAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'reversetranslationsessions',
  }
);

// Unique: mỗi user chỉ có 1 session in_progress cho mỗi set tại một thời điểm
ReverseTranslationSessionSchema.index(
  { userId: 1, setId: 1, status: 1 },
  { unique: false }
);

module.exports = mongoose.model('ReverseTranslationSession', ReverseTranslationSessionSchema);
