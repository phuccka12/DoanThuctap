const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  order:    { type: Number, default: 1 },
  type:     { type: String, enum: ['multiple_choice', 'fill_blank', 'matching'], default: 'multiple_choice' },
  question: { type: String, required: true, trim: true },
  options:  [{ type: String, trim: true }], // chỉ dùng cho multiple_choice
  answer:   { type: String, required: true, trim: true },
}, { _id: true });

const listeningPassageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tiêu đề tối đa 200 ký tự'],
  },

  audio_url: {
    type: String,
    required: [true, 'File audio là bắt buộc'],
    trim: true,
  },

  // Thời lượng audio (giây) — điền thủ công hoặc từ metadata
  duration_sec: {
    type: Number,
    default: 0,
  },

  // Nội dung audio dạng văn bản (dùng để AI chấm / hiển thị sau)
  transcript: {
    type: String,
    trim: true,
    default: '',
  },

  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate',
    required: true,
  },

  // IELTS Section (1-4)
  section: {
    type: String,
    enum: ['section1', 'section2', 'section3', 'section4', 'general'],
    default: 'section1',
  },

  topics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],

  questions: [questionSchema],

  is_active: { type: Boolean, default: true },

  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

listeningPassageSchema.index({ title: 'text' });
listeningPassageSchema.index({ level: 1, is_active: 1 });

module.exports = mongoose.model('ListeningPassage', listeningPassageSchema);
