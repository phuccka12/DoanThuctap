const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import models sau khi connect
const Topic = require('../models/Topic');
const WritingPrompt = require('../models/WritingPrompt');
const SpeakingQuestion = require('../models/SpeakingQuestion');

const topics = [
  {
    name: 'Hobbies',
    level: 'beginner',
    cover_image: 'https://example.com/hobbies.jpg',
    is_active: true
  },
  {
    name: 'Travel',
    level: 'intermediate',
    cover_image: 'https://example.com/travel.jpg',
    is_active: true
  },
  {
    name: 'Technology',
    level: 'advanced',
    cover_image: 'https://example.com/technology.jpg',
    is_active: true
  },
  {
    name: 'Health',
    level: 'intermediate',
    cover_image: 'https://example.com/health.jpg',
    is_active: true
  },
  {
    name: 'Education',
    level: 'intermediate',
    cover_image: 'https://example.com/education.jpg',
    is_active: true
  }
];

const getWritingPrompts = (topicId, topicName) => [
  {
    topic_id: topicId,
    type: 'topic',
    prompt: `Some people believe that ${topicName.toLowerCase()} is the most important aspect of modern life. To what extent do you agree or disagree?`,
    ideas: [
      'Discuss the benefits',
      'Consider the drawbacks',
      'Provide personal examples'
    ],
    min_words: 250,
    max_words: 300,
    difficulty: 'medium',
    is_active: true
  },
  {
    topic_id: topicId,
    type: 'topic',
    prompt: `Discuss the advantages and disadvantages of ${topicName.toLowerCase()} in today's society.`,
    ideas: [
      'Economic impact',
      'Social implications',
      'Future trends'
    ],
    min_words: 250,
    max_words: 300,
    difficulty: 'medium',
    is_active: true
  },
  {
    topic_id: topicId,
    type: 'topic',
    prompt: `How has ${topicName.toLowerCase()} changed over the past decade? What might the future hold?`,
    ideas: [
      'Historical perspective',
      'Current trends',
      'Future predictions'
    ],
    min_words: 250,
    max_words: 300,
    difficulty: 'hard',
    is_active: true
  }
];

const getSpeakingQuestions = (topicId, topicName) => [
  {
    topic_id: topicId,
    part: 'free',
    question: `Tell me about your interest in ${topicName.toLowerCase()}.`,
    keywords: [topicName.toLowerCase(), 'interest', 'experience'],
    difficulty: 'easy',
    is_active: true
  },
  {
    topic_id: topicId,
    part: 'free',
    question: `What do you think are the benefits of ${topicName.toLowerCase()}?`,
    keywords: [topicName.toLowerCase(), 'benefits', 'advantages'],
    difficulty: 'medium',
    is_active: true
  },
  {
    topic_id: topicId,
    part: 'free',
    question: `How popular is ${topicName.toLowerCase()} in your country?`,
    keywords: [topicName.toLowerCase(), 'popular', 'country'],
    difficulty: 'medium',
    is_active: true
  },
  {
    topic_id: topicId,
    part: 'free',
    question: `Do you think ${topicName.toLowerCase()} will become more or less important in the future?`,
    keywords: [topicName.toLowerCase(), 'future', 'trend'],
    difficulty: 'hard',
    is_active: true
  },
  {
    topic_id: topicId,
    part: 'free',
    question: `What advice would you give to someone interested in ${topicName.toLowerCase()}?`,
    keywords: [topicName.toLowerCase(), 'advice', 'tips'],
    difficulty: 'medium',
    is_active: true
  }
];

const seedDatabase = async () => {
  try {
    // Kết nối MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-app';
    console.log('🔄 Đang kết nối MongoDB...');
    console.log('📍 MongoDB URI:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//*****:*****@')); // Hide credentials
    await mongoose.connect(mongoUri);
    console.log('✓ Đã kết nối MongoDB');

    // Debug: kiểm tra models
    console.log('🔍 Kiểm tra models...');
    console.log('Topic:', typeof Topic);
    console.log('WritingPrompt:', typeof WritingPrompt);
    console.log('SpeakingQuestion:', typeof SpeakingQuestion);

    // Xóa dữ liệu cũ
    console.log('🗑️  Đang xóa dữ liệu cũ...');
    await Topic.deleteMany({});
    await WritingPrompt.deleteMany({});
    await SpeakingQuestion.deleteMany({});
    console.log('✓ Đã xóa dữ liệu cũ');

    // Tạo topics
    console.log('📝 Đang tạo topics...');
    const createdTopics = await Topic.insertMany(topics);
    console.log(`✓ Đã tạo ${createdTopics.length} topics`);

    // Tạo writing prompts và speaking questions cho mỗi topic
    let totalWritingPrompts = 0;
    let totalSpeakingQuestions = 0;

    console.log('📝 Đang tạo writing prompts và speaking questions...');
    for (const topic of createdTopics) {
      const writingPrompts = getWritingPrompts(topic._id, topic.name);
      await WritingPrompt.insertMany(writingPrompts);
      totalWritingPrompts += writingPrompts.length;
      
      const speakingQuestions = getSpeakingQuestions(topic._id, topic.name);
      await SpeakingQuestion.insertMany(speakingQuestions);
      totalSpeakingQuestions += speakingQuestions.length;
      
      console.log(`  ✓ ${topic.name}`);
    }

    console.log('\n=== 🎉 SEED DATA HOÀN TẤT ===');
    console.log(`Topics: ${createdTopics.length}`);
    console.log(`Writing Prompts: ${totalWritingPrompts}`);
    console.log(`Speaking Questions: ${totalSpeakingQuestions}`);

    await mongoose.connection.close();
    console.log('\n✓ Đã đóng kết nối MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed data:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

// Chạy seed
seedDatabase();