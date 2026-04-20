require('dotenv').config();
const mongoose = require('mongoose');
const Pet = require('./src/models/Pet');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const duplicates = await Pet.aggregate([
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
          coins: { $push: '$coins' },
          ids: { $push: '$_id' },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    if (!duplicates.length) {
      console.log('No duplicate pets by user');
    } else {
      for (const d of duplicates) {
        console.log(`user=${d._id} count=${d.count} coins=${JSON.stringify(d.coins)} ids=${JSON.stringify(d.ids)}`);
      }
    }
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
