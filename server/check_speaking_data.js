const mongoose = require('mongoose');
require('dotenv').config();
const SpeakingQuestion = require('./src/models/SpeakingQuestion');
const Topic = require('./src/models/Topic');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const counts = await SpeakingQuestion.aggregate([
      {
        $group: {
          _id: { topic: '$topic_id', part: '$part' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'topics',
          localField: '_id.topic',
          foreignField: '_id',
          as: 'topicDetail'
        }
      },
      {
        $unwind: '$topicDetail'
      },
      {
        $project: {
          topicName: '$topicDetail.name',
          part: '$_id.part',
          count: 1
        }
      }
    ]);

    console.log('Question counts per topic and part:');
    console.log(JSON.stringify(counts, null, 2));

    const allQuestions = await SpeakingQuestion.find({ is_active: true }).limit(5).lean();
    console.log('\nSample questions:');
    console.log(JSON.stringify(allQuestions, null, 2));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkData();
