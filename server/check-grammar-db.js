require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const G = require('./src/models/GrammarLesson');

  const total      = await G.countDocuments();
  const published  = await G.countDocuments({ is_published: true });
  const active     = await G.countDocuments({ is_active: true });
  const ready      = await G.countDocuments({ is_active: true, is_published: true });
  const sample     = await G.find().limit(3).select('title level is_active is_published').lean();

  console.log('─── Grammar DB Check ───────────────────────');
  console.log('Total documents :', total);
  console.log('is_published=true:', published);
  console.log('is_active=true   :', active);
  console.log('Both (ready)     :', ready);
  console.log('Sample docs:', JSON.stringify(sample, null, 2));

  await mongoose.disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
