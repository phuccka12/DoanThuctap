/**
 * 🔍 Check Topics in Database
 */

const mongoose = require('mongoose');
const Topic = require('./src/models/Topic');

const checkDatabase = async () => {
  try {
    // Connect
    await mongoose.connect('mongodb://localhost:27017/ielts_app');
    console.log('✅ MongoDB connected\n');

    // Get all topics
    const topics = await Topic.find({}).select('name nodes level keywords');
    
    console.log('📊 Topics in database:', topics.length);
    console.log('=' .repeat(50));
    
    if (topics.length === 0) {
      console.log('⚠️  No topics found in database!');
      console.log('\n💡 Tip: Run "node test-coursebuilder-db.js" (without --cleanup) to create sample data');
    } else {
      topics.forEach((topic, index) => {
        console.log(`\n${index + 1}. ${topic.name}`);
        console.log(`   Level: ${topic.level}`);
        console.log(`   Keywords: ${topic.keywords?.join(', ') || 'N/A'}`);
        console.log(`   Activities: ${topic.nodes?.length || 0}`);
        
        if (topic.nodes && topic.nodes.length > 0) {
          console.log('   📋 Activities list:');
          topic.nodes.forEach((node, i) => {
            console.log(`      ${i + 1}. [${node.type}] ${node.title}`);
          });
        }
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkDatabase();
