/**
 * Seed script: create a test Topic with multiple Lessons and varied activity nodes
 * Usage: node scripts/seedTestTopic.js
 * It reads MONGO_URI from server/.env (same pattern as other scripts).
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Topic = require('../src/models/Topic');
const Lesson = require('../src/models/Lesson');
const embeddingService = require('../src/services/embeddingService');

async function createLesson(topicId, idx, opts = {}) {
  const title = opts.title || `Test Lesson ${idx} - ${opts.level || 'beginner'}`;
  const level = opts.level || 'beginner';
  const nodes = opts.nodes || [];
  const lesson = new Lesson({
    topic_id: topicId,
    title,
    description: opts.description || `Auto-generated lesson ${idx} for testing`,
    order: idx,
    duration: opts.duration || 10,
    cover_image: opts.cover_image || '',
    level,
    nodes,
    is_active: true,
    is_published: true,
  });

  // Compute embedding from lesson content (best-effort) and save
  try {
    const txt = embeddingService.buildLessonText(lesson.toObject());
    const vec = await embeddingService.embedText(txt);
    lesson.embedding = vec;
  } catch (err) {
    console.warn('[seedTestTopic] embedding failed, saving lesson without embedding:', err.message || err);
  }

  await lesson.save();
  console.log(`  Created lesson: ${lesson._id} (${title})`);
  return lesson;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const topicName = 'Seed: Everyday English (Test)';
  let topic = await Topic.findOne({ name: topicName });
  if (!topic) {
    topic = await Topic.create({
      name: topicName,
      description: 'A seeded topic containing varied lessons for automated testing of the learning module.',
      cover_image: '',
      icon_name: 'book-open',
      keywords: ['test', 'seed', 'practice', 'learn'],
      frequency: 'medium',
      level: 'beginner',
    });
    console.log('Created topic:', topic._id);
  } else {
    console.log('Using existing topic:', topic._id);
  }

  // Remove any previous test lessons under this topic to keep environment idempotent
  const removed = await Lesson.deleteMany({ topic_id: topic._id, title: /Test Lesson/ });
  if (removed.deletedCount) console.log(`  Removed ${removed.deletedCount} previous test lessons`);

  // Create a variety of lessons covering different node types
  // 1. Reading passage
  await createLesson(topic._id, 1, {
    level: 'beginner',
    title: 'Ordering Coffee - Reading',
    duration: 12,
    nodes: [
      { id: 'r1', type: 'reading', title: 'Short passage', data: { text: 'Anna goes to a coffee shop and orders a latte. She pays and waits for her drink.' } },
      { id: 'r1_q1', type: 'quiz', title: 'Comprehension', data: { choices: ['She orders tea','She orders a latte','She buys bread'], answer: 1 } }
    ]
  });

  // 2. Listening with questions
  await createLesson(topic._id, 2, {
    level: 'beginner',
    title: 'At the Airport - Listening',
    duration: 15,
    nodes: [
      { id: 'listen1', type: 'listening', title: 'Announcement', data: { audio_url: 'https://example.com/audio/airport.mp3', text: 'Flight 123 is boarding at gate B4.' } },
      { id: 'listen1_q1', type: 'quiz', title: 'Listening question', data: { choices: ['Gate B4','Gate C2','Gate A1'], answer: 0 } }
    ]
  });

  // 3. Vocabulary builder
  await createLesson(topic._id, 3, {
    level: 'beginner',
    title: 'Travel Vocabulary',
    duration: 10,
    nodes: [
      { id: 'v1', type: 'vocabulary', title: 'Key words', data: { words: [ { word: 'boarding', meaning: 'getting on the plane' }, { word: 'luggage', meaning: 'suitcases' } ] } }
    ]
  });

  // 4. Speaking / roleplay prompt
  await createLesson(topic._id, 4, {
    level: 'intermediate',
    title: 'Roleplay: Ordering Food',
    duration: 18,
    nodes: [
      { id: 's1', type: 'ai_roleplay', title: 'Ordering food', data: { prompt: 'Pretend you are a waiter. The student orders from a menu. Practice the dialog.' } }
    ]
  });

  // 5. Writing prompt
  await createLesson(topic._id, 5, {
    level: 'intermediate',
    title: 'Write an email',
    duration: 20,
    nodes: [
      { id: 'w1', type: 'writing', title: 'Email to your teacher', data: { prompt: 'Write an email to your teacher asking for feedback on your homework.' } }
    ]
  });

  // 6. Mixed quiz & review
  await createLesson(topic._id, 6, {
    level: 'advanced',
    title: 'Mixed review',
    duration: 25,
    nodes: [
      { id: 'q1', type: 'quiz', title: 'Grammar check', data: { choices: ['He go','He goes','He going'], answer: 1 } },
      { id: 'v2', type: 'vocabulary', title: 'Advanced words', data: { words: [ { word: 'negotiate', meaning: 'discuss terms' }, { word: 'approximate', meaning: 'close to' } ] } }
    ]
  });

  console.log('Seeding complete.');
  await mongoose.disconnect();
  console.log('Disconnected.');
}

run().catch(err => { console.error(err); process.exit(1); });
