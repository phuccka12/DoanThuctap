const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './server/.env' });

const ReadingPassage = require('./server/src/models/ReadingPassage');
const SpeakingQuestion = require('./server/src/models/SpeakingQuestion');
const Vocabulary = require('./server/src/models/Vocabulary');
const WritingPrompt = require('./server/src/models/WritingPrompt');
const ListeningPassage = require('./server/src/models/ListeningPassage');
const GrammarLesson = require('./server/src/models/GrammarLesson');
const Story = require('./server/src/models/Story');
const Topic = require('./server/src/models/Topic');

async function exportData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected.');

    const readings = await ReadingPassage.find({ is_active: true }).lean();
    const speakings = await SpeakingQuestion.find({ is_active: true }).lean();
    const vocabs = await Vocabulary.find({ is_active: true }).lean();
    const writings = await WritingPrompt.find({ is_active: true }).lean();
    const listenings = await ListeningPassage.find({ is_active: true }).lean();
    const grammars = await GrammarLesson.find({ is_active: true }).lean();
    const stories = await Story.find({ is_active: true }).lean();
    const topics = await Topic.find({ is_active: true }).lean();

    const allData = [
      ...readings.map(r => ({
        id: r._id.toString(),
        type: 'reading',
        text: `${r.title} ${r.passage} ${r.tags?.join(' ') || ''}`,
        cefr_level: r.cefr_level || 'A2'
      })),
      ...speakings.map(s => ({
        id: s._id.toString(),
        type: 'speaking',
        text: `${s.question} ${s.tags?.join(' ') || ''}`,
        cefr_level: s.cefr_level || 'B1'
      })),
      ...vocabs.map(v => ({
        id: v._id.toString(),
        type: 'vocabulary',
        text: `${v.word} ${v.meaning} ${v.example || ''}`,
        cefr_level: v.level?.toUpperCase() || 'A1'
      })),
      ...writings.map(w => ({
        id: w._id.toString(),
        type: 'writing',
        text: `${w.prompt} ${w.type || ''}`,
        cefr_level: w.topic_id?.level || 'B2'
      })),
      ...listenings.map(l => ({
        id: l._id.toString(),
        type: 'listening',
        text: `${l.title} ${l.transcript || ''}`,
        cefr_level: 'B1' // Default
      })),
      ...grammars.map(g => ({
        id: g._id.toString(),
        type: 'grammar',
        text: `${g.title} ${g.description || ''}`,
        cefr_level: 'A2'
      })),
      ...stories.map(st => ({
        id: st._id.toString(),
        type: 'story',
        text: `${st.title} ${st.description || ''}`,
        cefr_level: st.level || 'B1'
      })),
      ...topics.map(tp => ({
        id: tp._id.toString(),
        type: 'topic',
        text: `${tp.name} ${tp.description || ''}`,
        cefr_level: tp.level || 'A2'
      }))
    ];

    const outputPath = path.join(__dirname, 'server', 'python_ai', 'data', 'lessons_export.json');
    fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
    console.log(`🎉 Exported ${allData.length} lessons to ${outputPath}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Export failed:', err);
    process.exit(1);
  }
}

exportData();
