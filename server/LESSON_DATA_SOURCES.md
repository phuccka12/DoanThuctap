/**
 * LESSON DATA SOURCES - Nơi Lấy Dữ Liệu Các Bài Tập
 * 
 * Tài liệu này mô tả từng nguồn dữ liệu bài tập từ các chức năng khác nhau
 * để hỗ trợ AI Smart Plan lấy dữ liệu linh hoạt từ TẤT CẢ features
 */

// ============================================================================
// 1️⃣ VOCABULARY (Từ Vựng)
// ============================================================================

/**
 * Model: Vocabulary
 * Collection: vocabularies
 * 
 * Cấu trúc:
 * {
 *   _id: ObjectId,
 *   word: String,
 *   pronunciation: String,
 *   part_of_speech: String (noun, verb, adj, adv, etc),
 *   meaning: String,
 *   examples: [String],
 *   topics: [ObjectId],  // Liên kết đến Topic
 *   tags: [String],      // formal, slang, phrasal, etc
 *   level: String,       // A1, A2, B1, B2, C1, C2
 *   synonyms: [String],
 *   antonyms: [String],
 *   related_words: [String],
 *   is_active: Boolean,
 *   created_at: Date,
 *   updated_at: Date
 * }
 * 
 * Routes:
 * - GET /vocabulary/topics                    → Danh sách topics
 * - GET /vocabulary/topics/:topicId           → Chi tiết topic + từ vựng
 * - GET /vocabulary/topics/:topicId/complete  → Hoàn thành session
 * 
 * Service: Học & ôn tập từ vựng theo topics, flashcard, quizzes
 */

// ============================================================================
// 2️⃣ READING (Đọc - Reading Passages)
// ============================================================================

/**
 * Model: ReadingPassage
 * Collection: readingpassages
 * 
 * Cấu trúc:
 * {
 *   _id: ObjectId,
 *   title: String,
 *   passage: String,        // Nội dung bài đọc
 *   level: String,          // A1-C2 (CEFR)
 *   content_type: String,   // email, news, story, article, etc
 *   genre: String,
 *   topics: [ObjectId],     // Liên kết đến Topic
 *   vocab_highlights: [{     // Từ khó được highlight
 *     word: String,
 *     meaning: String,
 *     pos: String
 *   }],
 *   questions: [{            // Câu hỏi về bài đọc
 *     question_text: String,
 *     question_type: String, // multiple_choice, true_false, fill_blank, short_answer
 *     options: [String],
 *     correct_answer: String,
 *     explanation: String
 *   }],
 *   linked_vocabulary: [{
 *     word_id: ObjectId,
 *     word: String,
 *     positions: [Number]    // Vị trí từ trong bài
 *   }],
 *   word_count: Number,
 *   reading_time_minutes: Number,
 *   is_active: Boolean,
 *   created_at: Date,
 *   updated_at: Date
 * }
 * 
 * Routes:
 * - GET /reading-passages/topics              → Danh sách topics
 * - GET /reading-passages/list                → Danh sách passages
 * - GET /reading-passages/:id                 → Chi tiết passage
 * - POST /reading-passages/:id/submit          → Submit answers
 * 
 * Service: Đọc bài, học từ vựng, trả lời câu hỏi
 */

// ============================================================================
// 3️⃣ LISTENING (Nghe)
// ============================================================================

/**
 * Model: ListeningLesson (Implied - chứa trong Topic/Lesson)
 * Nơi lưu: Topic.nodes hoặc Lesson collection
 * 
 * Cấu trúc node listening:
 * {
 *   type: 'listening',
 *   title: String,
 *   description: String,
 *   audio_url: String,         // URL audio MP3/WAV
 *   transcript: String,        // Bản ghi dùng cho practice
 *   video_url: String,         // Optional - video clip
 *   duration_seconds: Number,
 *   questions: [{
 *     question_text: String,
 *     options: [String],
 *     correct_answer: String,
 *     time_appears: Number      // Giây nào câu hỏi xuất hiện
 *   }],
 *   level: String,    // A1-C2
 *   keywords: [String]
 * }
 * 
 * Routes:
 * - GET /learn/lessons/:lessonId              → Lấy lesson + listening node
 * - POST /learn/lessons/:lessonId/complete    → Submit answers
 * 
 * Service: Nghe audio, trả lời câu hỏi, xem transcript
 */

// ============================================================================
// 4️⃣ SPEAKING (Nói)
// ============================================================================

/**
 * Model: SpeakingQuestion
 * Collection: speakingquestions
 * 
 * Cấu trúc:
 * {
 *   _id: ObjectId,
 *   topic_id: ObjectId,      // Liên kết đến Topic
 *   question_text: String,   // "Describe your hometown"
 *   question_type: String,   // cued_talk, conversation, presentation
 *   
 *   // CUED TALK (Part 1-2 style)
 *   preparation_time_sec: Number,  // 60 seconds để chuẩn bị
 *   speaking_time_sec: Number,     // 120 seconds để nói
 *   
 *   // Warmup + Main + Follow-up
 *   warmup_question: String,
 *   main_questions: [String],
 *   follow_up_questions: [String],
 *   
 *   // Sample answers (để reference)
 *   sample_answer: String,   // Band 8-9 answer
 *   
 *   // Scoring rubric
 *   band_descriptors: {
 *     fluency_coherence: String,
 *     lexical_resource: String,
 *     grammatical_range: String,
 *     pronunciation: String
 *   },
 *   
 *   level: String,    // A1-C2
 *   is_active: Boolean,
 *   created_at: Date,
 *   updated_at: Date
 * }
 * 
 * Routes:
 * - GET /speaking-practice/topics             → Danh sách topics
 * - GET /speaking-practice/questions          → Lấy questions theo topic
 * - GET /speaking-practice/warmup             → Lấy warmup question
 * - POST /speaking-practice/evaluate          → Gửi audio, nhận feedback
 * 
 * Service (Python AI):
 * - POST /api/speaking/check                  → Whisper + Gemini evaluation
 * - Voice Recording (Web Speech API) → Backend saves audio → Python processes
 * 
 * Evaluation Flow:
 * 1. Frontend: Ghi âm (Web Speech API)
 * 2. Backend: Lưu audio
 * 3. Python AI: Transcribe (Whisper) + Evaluate (Gemini + Offline metrics)
 * 4. Return: Transcript + Scores + Feedback + Mistakes
 */

// ============================================================================
// 5️⃣ WRITING (Viết)
// ============================================================================

/**
 * Model: WritingPrompt (hoặc Lesson node type 'writing')
 * Collection: writingprompts hoặc trong Lesson.nodes
 * 
 * Cấu trúc:
 * {
 *   _id: ObjectId,
 *   title: String,
 *   task_type: String,           // task_1 (letter), task_2 (essay)
 *   prompt: String,              // Yêu cầu viết gì
 *   instructions: String,
 *   sample_answer: String,       // Band 8-9 example
 *   
 *   // Writing Band Descriptors
 *   band_descriptors: {
 *     task_response: String,
 *     coherence_cohesion: String,
 *     lexical_resource: String,
 *     grammatical_range: String
 *   },
 *   
 *   // Tips & Common mistakes
 *   tips: [String],
 *   common_mistakes: [String],
 *   vocabulary_suggestions: [{
 *     word: String,
 *     meaning: String,
 *     usage: String
 *   }],
 *   
 *   level: String,      // A1-C2
 *   is_active: Boolean,
 *   created_at: Date,
 *   updated_at: Date
 * }
 * 
 * Routes:
 * - GET /ai-writing/prompts                   → Danh sách prompts
 * - GET /ai-writing/prompts/:id               → Chi tiết prompt
 * - POST /ai-writing/evaluate                 → Gửi bài viết, nhận feedback
 * 
 * Service (Python AI):
 * - POST /api/writing/check                   → Gemini evaluation
 * - Evaluation: Task Response + Coherence + Lexical + Grammar
 * - Return: Band score + Detailed feedback + Corrections
 */

// ============================================================================
// 6️⃣ GRAMMAR (Ngữ Pháp)
// ============================================================================

/**
 * Model: GrammarLesson hoặc Topic node type 'grammar'
 * 
 * Cấu trúc:
 * {
 *   _id: ObjectId,
 *   type: 'grammar',
 *   title: String,
 *   
 *   // Giải thích ngữ pháp
 *   explanation: String,
 *   examples: [{
 *     correct: String,
 *     incorrect: String,
 *     explanation: String
 *   }],
 *   
 *   // Bài tập
 *   exercises: [{
 *     question: String,
 *     options: [String],
 *     correct_answer: String,
 *     explanation: String
 *   }],
 *   
 *   level: String,
 *   is_active: Boolean
 * }
 * 
 * Routes:
 * - GET /learn/lessons/:lessonId              → Lấy grammar node
 * - POST /learn/lessons/:lessonId/complete    → Submit answers
 */

// ============================================================================
// 7️⃣ TRANSLATION (Dịch Ngược)
// ============================================================================

/**
 * Model: TranslationExercise hoặc Topic node type 'translation'
 * 
 * Cấu trúc:
 * {
 *   _id: ObjectId,
 *   type: 'translation',
 *   title: String,
 *   
 *   source_text: String,         // Tiếng Anh
 *   source_language: String,     // 'en'
 *   target_language: String,     // 'vi'
 *   
 *   reference_translation: String, // Bản dịch chuẩn
 *   alternative_translations: [String], // Những bản dịch khác hợp lệ
 *   
 *   difficulty: String,
 *   concepts: [String],          // Grammar/vocab concepts
 *   
 *   level: String,
 *   is_active: Boolean
 * }
 * 
 * Routes:
 * - GET /learn/lessons/:lessonId              → Lấy translation node
 * - POST /learn/lessons/:lessonId/complete    → Submit translation
 */

// ============================================================================
// 8️⃣ MAIN TOPIC/LESSON STRUCTURE
// ============================================================================

/**
 * Model: Topic
 * Collection: topics
 * 
 * Cấu trúc:
 * {
 *   _id: ObjectId,
 *   name: String,              // "Travel", "Technology", etc
 *   slug: String,
 *   description: String,
 *   level: String,             // beginner, intermediate, advanced
 *   keywords: [String],
 *   is_active: Boolean,
 *   order: Number,
 *   created_at: Date
 * }
 */

/**
 * Model: Lesson
 * Collection: lessons
 * 
 * Cấu trúc:
 * {
 *   _id: ObjectId,
 *   title: String,
 *   topic_id: ObjectId,        // Reference to Topic
 *   description: String,
 *   duration: Number,          // Minutes
 *   level_required: String,    // A1-C2
 *   
 *   // Nodes = interactive components
 *   nodes: [{
 *     _id: ObjectId,
 *     type: String,            // 'vocabulary', 'reading', 'listening', 
 *                              // 'grammar', 'quiz', 'writing', 'speaking'
 *     title: String,
 *     content: String,         // HTML or text
 *     duration: Number,
 *     // Type-specific fields
 *   }],
 *   
 *   // Stats
 *   stats: {
 *     completions: Number,
 *     avg_score: Number
 *   },
 *   
 *   is_published: Boolean,
 *   is_active: Boolean,
 *   order: Number,
 *   created_at: Date
 * }
 */

// ============================================================================
// 9️⃣ USER PROGRESS TRACKING
// ============================================================================

/**
 * Model: LessonProgress
 * Collection: lessonprogresses
 * 
 * Cấu trúc:
 * {
 *   _id: ObjectId,
 *   userId: ObjectId,
 *   lessonId: ObjectId,
 *   topicId: ObjectId,
 *   
 *   completedNodes: [String],  // Array of completed node IDs
 *   score: Number,             // 0-100
 *   timeSpentSec: Number,
 *   completedAt: Date,
 *   rewarded: Boolean,
 *   coinsEarned: Number,
 *   expEarned: Number,
 *   
 *   updated_at: Date,
 *   created_at: Date
 * }
 */

/**
 * Model: CoinLog
 * Collection: coinlogs
 * 
 * Cấu trúc:
 * {
 *   _id: ObjectId,
 *   user: ObjectId,
 *   type: String,              // 'earn' or 'spend'
 *   source: String,            // 'lesson_complete', 'daily_bonus', 'vocab', etc
 *   amount: Number,
 *   balance_after: Number,
 *   
 *   timestamp: Date            // Khi kiếm/tiêu coins
 * }
 */

// ============================================================================
// 🎯 AI SMART PLAN - LẤY DỮ LIỆU TỪ ĐÂU?
// ============================================================================

/**
 * Thay vì chỉ lấy Lesson từ Topic, AI Smart Plan nên lấy từ:
 * 
 * 1. ✅ TOPICS + LESSONS (Hiện tại)
 *    Query: Lesson.find({ is_published: true, is_active: true })
 *    
 * 2. ⭕ READING PASSAGES (Bổ sung)
 *    Query: ReadingPassage.find({ is_active: true })
 *    Transform: passage → lesson-like object
 *    
 * 3. ⭕ SPEAKING QUESTIONS (Bổ sung)
 *    Query: SpeakingQuestion.find({ is_active: true })
 *    Transform: question → lesson-like object
 *    
 * 4. ⭕ WRITING PROMPTS (Bổ sung)
 *    Query: WritingPrompt.find({ is_active: true })
 *    Transform: prompt → lesson-like object
 *    
 * 5. ⭕ VOCABULARY TOPICS (Bổ sung)
 *    Query: Vocabulary.find({ is_active: true }).distinct('topics')
 *    Lấy danh sách vocab practice theo topic
 *    
 * 6. ⭕ LISTENING LESSONS (Bổ sung)
 *    Query: Lesson.find({ 'nodes.type': 'listening' })
 *    Filter nodes → listening only
 *    
 * 7. ⭕ GRAMMAR LESSONS (Bổ sung)
 *    Query: Lesson.find({ 'nodes.type': 'grammar' })
 *    Filter nodes → grammar only
 */

// ============================================================================
// 💡 IMPLEMENTATION STRATEGY
// ============================================================================

/**
 * Tạo unified data fetching function:
 * 
 * async function getAllPracticeItems(userId, levelFilter) {
 *   const items = [];
 *   
 *   // 1. Regular lessons from Topics
 *   const lessons = await Lesson.find({ is_published: true }).lean();
 *   items.push(...lessons.map(formatAsItem));
 *   
 *   // 2. Reading passages
 *   const readings = await ReadingPassage.find({ is_active: true }).lean();
 *   items.push(...readings.map(formatAsItem));
 *   
 *   // 3. Speaking questions
 *   const speaking = await SpeakingQuestion.find({ is_active: true }).lean();
 *   items.push(...speaking.map(formatAsItem));
 *   
 *   // 4. Writing prompts
 *   const writing = await WritingPrompt.find({ is_active: true }).lean();
 *   items.push(...writing.map(formatAsItem));
 *   
 *   // 5. Vocabulary by topic
 *   const vocabTopics = await VocabularyTopic.find({ is_active: true }).lean();
 *   items.push(...vocabTopics.map(formatAsItem));
 *   
 *   // Filter by user level + return
 *   return items.filter(item => levelMatches(item.level, levelFilter));
 * }
 * 
 * function formatAsItem(raw) {
 *   return {
 *     id: raw._id,
 *     title: raw.title || raw.name,
 *     type: raw.type || 'reading',  // reading, speaking, writing, vocabulary, etc
 *     level: raw.level,
 *     duration: raw.duration || 20,
 *     description: raw.description || '',
 *     source: raw.source || 'lesson',  // lesson, reading, speaking, writing, vocab
 *     nodeTypes: raw.nodes?.map(n => n.type) || [],
 *     // ... other fields
 *   };
 * }
 */

module.exports = {
  DOCUMENTATION: 'See comments above for complete data source mapping'
};
