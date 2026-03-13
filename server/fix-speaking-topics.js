/**
 * fix-speaking-topics.js
 * 
 * Vấn đề: SpeakingQuestion đang trỏ đến các topic_id không tồn tại trong Topic collection.
 * Giải pháp: Tạo lại các Topics tương ứng (Hobbies, Travel, Technology, Education, Science)
 *            rồi re-assign SpeakingQuestion về đúng topic.
 */
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Topic = require('./src/models/Topic');
  const SQ    = require('./src/models/SpeakingQuestion');

  // 1. Lấy các topic_id bị orphan
  const counts = await SQ.aggregate([
    { $match: { is_active: true } },
    { $group: { _id: '$topic_id', count: { $sum: 1 } } },
  ]);

  const allTopics  = await Topic.find({}).lean();
  const validIds   = new Set(allTopics.map(t => t._id.toString()));
  const orphanIds  = counts.filter(c => !validIds.has(c._id?.toString()));

  console.log('Orphan topic_ids:', orphanIds.map(o => `${o._id} (${o.count} câu)`));

  if (orphanIds.length === 0) {
    console.log('✅ Không có orphan — tất cả topic_id hợp lệ!');
    mongoose.disconnect();
    return;
  }

  // 2. Tạo các Topics mới cho từng orphan group
  // Lấy mẫu câu hỏi đầu tiên để đoán tên topic
  const topicNames = {
    '696f853fc5291b24a57c3b30': 'Hobbies & Interests',
    '696f853fc5291b24a57c3b31': 'Travel & Tourism',
    '696f853fc5291b24a57c3b32': 'Technology & Innovation',
    '696f853fc5291b24a57c3b33': 'Education & Learning',
    '696f853fc5291b24a57c3b34': 'Science & Environment',
  };

  const idMapping = {}; // oldId -> newId

  for (const orphan of orphanIds) {
    const oldId    = orphan._id.toString();
    const topicName = topicNames[oldId] || `Speaking Topic ${oldId.slice(-4)}`;

    // Kiểm tra xem topic tên này đã tồn tại chưa
    let existing = await Topic.findOne({ name: topicName });
    if (!existing) {
      existing = await Topic.create({
        name:        topicName,
        description: `Luyện Speaking chủ đề ${topicName}`,
        level:       'intermediate',
        is_active:   true,
      });
      console.log(`✅ Tạo Topic mới: "${topicName}" → ${existing._id}`);
    } else {
      console.log(`♻️  Dùng Topic đã có: "${topicName}" → ${existing._id}`);
    }
    idMapping[oldId] = existing._id;
  }

  // 3. Re-assign SpeakingQuestion
  let totalUpdated = 0;
  for (const [oldId, newId] of Object.entries(idMapping)) {
    const result = await SQ.updateMany(
      { topic_id: new mongoose.Types.ObjectId(oldId) },
      { $set: { topic_id: newId } }
    );
    console.log(`  → Cập nhật ${result.modifiedCount} câu từ ${oldId} → ${newId}`);
    totalUpdated += result.modifiedCount;
  }

  console.log(`\n🎉 Hoàn tất! Đã cập nhật ${totalUpdated} SpeakingQuestion.`);

  // 4. Verify
  const verify = await SQ.aggregate([
    { $match: { is_active: true } },
    { $group: { _id: '$topic_id', count: { $sum: 1 } } },
  ]);
  const allNew = await Topic.find({}).lean();
  const validNew = new Set(allNew.map(t => t._id.toString()));
  const stillOrphan = verify.filter(c => !validNew.has(c._id?.toString()));
  console.log(stillOrphan.length === 0 ? '✅ Verify OK — không còn orphan!' : `⚠️  Vẫn còn ${stillOrphan.length} orphan!`);

  const topicsNow = await Topic.find({}).select('name level').lean();
  console.log('\nTopics hiện tại:');
  topicsNow.forEach(t => console.log(`  - ${t._id} | ${t.name} | ${t.level}`));

  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
