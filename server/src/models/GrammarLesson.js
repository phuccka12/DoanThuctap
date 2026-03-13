const mongoose = require('mongoose');

/**
 * GrammarLesson — bài học ngữ pháp độc lập (không thuộc Topic/Lesson CourseBuilder)
 * Cấu trúc: Hook (câu hỏi mồi) + Theory (thẻ lý thuyết) + Minigames (trắc nghiệm, lỗi sai, xếp câu)
 */

// ── Câu hỏi mồi (Hook) ────────────────────────────────────────────────────
const hookQuestionSchema = new mongoose.Schema({
  text:    { type: String, required: true, trim: true },
  optionA: { type: String, required: true, trim: true },
  optionB: { type: String, required: true, trim: true },
  correct: { type: String, enum: ['A', 'B'], required: true },
}, { _id: true });

// ── Thẻ lưu ý phụ (Sub-card) ──────────────────────────────────────────────
const subCardSchema = new mongoose.Schema({
  title:   { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
}, { _id: true });

// ── Mini-game: Trắc nghiệm ────────────────────────────────────────────────
const multipleChoiceSchema = new mongoose.Schema({
  type:     { type: String, default: 'multiple_choice' },
  question: { type: String, required: true, trim: true },
  options:  [{ type: String, trim: true }],       // 4 đáp án
  correct:  { type: Number, required: true },      // index 0-3
}, { _id: true });

// ── Mini-game: Tìm lỗi sai ───────────────────────────────────────────────
const errorDetectionSchema = new mongoose.Schema({
  type:        { type: String, default: 'error_detection' },
  sentence:    { type: String, required: true, trim: true },
  errorWord:   { type: String, required: true, trim: true },
  correction:  { type: String, required: true, trim: true },
  explanation: { type: String, trim: true },
}, { _id: true });

// ── Mini-game: Xếp câu ────────────────────────────────────────────────────
const wordOrderSchema = new mongoose.Schema({
  type:    { type: String, default: 'word_order' },
  words:   [{ type: String, trim: true }],        // các từ bị xáo trộn
  correct: { type: String, required: true, trim: true }, // câu đúng
}, { _id: true });

// ── Schema chính ──────────────────────────────────────────────────────────
const grammarLessonSchema = new mongoose.Schema({
  title: {
    type: String, required: true, trim: true, maxlength: 200,
  },
  description: {
    type: String, trim: true, default: '',
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate',
  },

  // Khối 1: Câu hỏi mồi
  hook: {
    questions: [hookQuestionSchema],
  },

  // Khối 2: Lý thuyết
  theory: {
    mainCard:  { type: String, trim: true, default: '' }, // Markdown
    subCards:  [subCardSchema],
  },

  // Khối 3: Mini-games (mixed array — mỗi phần tử có field `type`)
  minigames: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },

  is_active:   { type: Boolean, default: true },
  is_published:{ type: Boolean, default: false },
  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('GrammarLesson', grammarLessonSchema);
