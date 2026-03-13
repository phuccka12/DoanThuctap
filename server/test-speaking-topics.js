require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const SQ    = require('./src/models/SpeakingQuestion');
  const Topic = require('./src/models/Topic');

  // 1. Raw count
  const total = await SQ.countDocuments();
  const activeCount = await SQ.countDocuments({ is_active: true });
  console.log(`Total SpeakingQuestions: ${total}, is_active=true: ${activeCount}`);

  // 2. Sample docs
  const samples = await SQ.find({ is_active: true }).limit(3).lean();
  samples.forEach((s, i) => {
    console.log(`[${i}] topic_id=${s.topic_id}  part=${s.part}  question="${s.question?.slice(0,60)}"`);
  });

  // 3. Aggregate (same logic as getTopics controller)
  const counts = await SQ.aggregate([
    { $match: { is_active: true } },
    { $group: { _id: '$topic_id', count: { $sum: 1 } } },
  ]);
  console.log('\nAggregate result:', JSON.stringify(counts));

  // 4. Find matching Topics
  const topicIds = counts.map(c => c._id).filter(Boolean);
  console.log('\ntopic_ids to find:', topicIds);
  const topics = await Topic.find({ _id: { $in: topicIds } }).select('name level').lean();
  console.log('Topics found:', JSON.stringify(topics));

  if (topics.length === 0) {
    console.log('\n⚠️  Không tìm thấy Topic nào match! Kiểm tra xem topic_id trong SpeakingQuestion có tồn tại trong Topic collection không.');
    // List all topics in DB for comparison
    const allTopics = await Topic.find({}).select('_id name').lean();
    console.log('All Topics in DB:', JSON.stringify(allTopics.map(t => ({ id: t._id, name: t.name }))));
  }

  mongoose.disconnect();
}).catch(err => {
  console.error('Connect error:', err.message);
  process.exit(1);
});
