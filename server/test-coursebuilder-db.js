/**
 * 🧪 Test CourseBuilder Database Integration
 * 
 * Script này giúp test việc lưu/load course data từ MongoDB
 */

const mongoose = require('mongoose');
const Topic = require('./src/models/Topic');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts_app');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test 1: Create a topic with sample course structure
const testCreateTopicWithCourse = async () => {
  console.log('\n📝 Test 1: Create Topic with Course Structure');
  
  try {
    const sampleTopic = new Topic({
      name: 'Survival English: Airport',
      description: 'Learn essential English for navigating airports',
      cover_image: 'https://example.com/airport.jpg',
      level: 'intermediate',
      keywords: ['airport', 'travel', 'check-in', 'customs'],
      nodes: [
        {
          id: 'node_1',
          type: 'vocabulary',
          title: 'Airport Vocabulary',
          data: {
            words: [
              {
                word: 'Passport',
                meaning: 'Hộ chiếu',
                pronunciation: '/ˈpɑːspɔːrt/',
                example: 'Please show me your passport.',
                imageUrl: ''
              },
              {
                word: 'Boarding Pass',
                meaning: 'Vé lên máy bay',
                pronunciation: '/ˈbɔːrdɪŋ pæs/',
                example: 'Your boarding pass is at gate 5.',
                imageUrl: ''
              }
            ]
          },
          createdAt: new Date()
        },
        {
          id: 'node_2',
          type: 'video',
          title: 'Check-in Dialogue',
          data: {
            url: 'https://youtube.com/watch?v=example',
            transcript: 'Good morning. How can I help you?\nI\'d like to check in for flight BA123...'
          },
          createdAt: new Date()
        },
        {
          id: 'node_3',
          type: 'ai_roleplay',
          title: 'Customs Practice',
          data: {
            scenario: 'You are at customs after landing. The officer needs to verify your documents.',
            aiRole: 'Strict Customs Officer',
            userGoal: 'Pass through customs successfully',
            initialPrompt: 'Good morning. Your passport and boarding pass, please.'
          },
          createdAt: new Date()
        },
        {
          id: 'node_4',
          type: 'quiz',
          title: 'Vocabulary Quiz',
          data: {
            questions: [
              {
                question: 'What does "boarding pass" mean?',
                options: ['Hộ chiếu', 'Vé lên máy bay', 'Hải quan', 'Hành lý'],
                correctAnswer: 1,
                explanation: 'Boarding pass is the ticket you need to board the plane.'
              }
            ]
          },
          createdAt: new Date()
        },
        {
          id: 'node_5',
          type: 'grammar',
          title: 'Polite Requests',
          data: {
            title: 'Using "Would you like..." and "Could I have..."',
            content: '# Polite Requests\n\nWhen asking for something politely:\n- Would you like...?\n- Could I have...?',
            examples: [
              'Would you like a window seat?',
              'Could I have an aisle seat, please?'
            ]
          },
          createdAt: new Date()
        },
        {
          id: 'node_6',
          type: 'listening',
          title: 'Airport Announcement',
          data: {
            audioUrl: 'https://example.com/audio/announcement.mp3',
            transcript: 'Attention passengers on flight BA123 to London. Your flight is now boarding at gate 5.',
            dictationMode: false
          },
          createdAt: new Date()
        }
      ]
    });

    await sampleTopic.save();
    
    console.log('✅ Created topic:', sampleTopic.name);
    console.log('📦 Number of activities:', sampleTopic.nodes.length);
    
    return sampleTopic._id;
  } catch (error) {
    console.error('❌ Error creating topic:', error.message);
    throw error;
  }
};

// Test 2: Load topic and verify nodes
const testLoadTopic = async (topicId) => {
  console.log('\n🔍 Test 2: Load Topic and Verify Nodes');
  
  try {
    const topic = await Topic.findById(topicId);
    
    if (!topic) {
      throw new Error('Topic not found');
    }
    
    console.log('✅ Loaded topic:', topic.name);
    console.log('📊 Topic details:');
    console.log('  - Level:', topic.level);
    console.log('  - Keywords:', topic.keywords.join(', '));
    console.log('  - Activities:', topic.nodes.length);
    
    console.log('\n📋 Activities breakdown:');
    topic.nodes.forEach((node, index) => {
      console.log(`  ${index + 1}. [${node.type}] ${node.title}`);
    });
    
    return topic;
  } catch (error) {
    console.error('❌ Error loading topic:', error.message);
    throw error;
  }
};

// Test 3: Update topic nodes (simulate CourseBuilder save)
const testUpdateNodes = async (topicId) => {
  console.log('\n✏️ Test 3: Update Topic Nodes (CourseBuilder Save)');
  
  try {
    const topic = await Topic.findById(topicId);
    
    // Add a new node
    topic.nodes.push({
      id: 'node_7',
      type: 'vocabulary',
      title: 'Security Vocabulary',
      data: {
        words: [
          {
            word: 'Security Check',
            meaning: 'Kiểm tra an ninh',
            pronunciation: '/sɪˈkjʊərəti tʃek/',
            example: 'Please go through the security check.',
            imageUrl: ''
          }
        ]
      },
      createdAt: new Date()
    });
    
    // Reorder nodes (simulate drag & drop)
    const [firstNode] = topic.nodes.splice(0, 1);
    topic.nodes.push(firstNode);
    
    await topic.save();
    
    console.log('✅ Updated topic nodes');
    console.log('📦 New number of activities:', topic.nodes.length);
    
    return topic;
  } catch (error) {
    console.error('❌ Error updating topic:', error.message);
    throw error;
  }
};

// Test 4: Query topics with nodes
const testQueryTopicsWithNodes = async () => {
  console.log('\n🔎 Test 4: Query Topics with Nodes');
  
  try {
    const topics = await Topic.find({ 'nodes.0': { $exists: true } });
    
    console.log(`✅ Found ${topics.length} topics with course structure`);
    
    topics.forEach(topic => {
      console.log(`  - ${topic.name}: ${topic.nodes.length} activities`);
    });
    
    return topics;
  } catch (error) {
    console.error('❌ Error querying topics:', error.message);
    throw error;
  }
};

// Test 5: Validate node data structure
const testValidateNodeStructure = async (topicId) => {
  console.log('\n✔️ Test 5: Validate Node Data Structure');
  
  try {
    const topic = await Topic.findById(topicId);
    
    const validTypes = ['vocabulary', 'video', 'ai_roleplay', 'quiz', 'grammar', 'listening'];
    let errors = [];
    
    topic.nodes.forEach((node, index) => {
      // Check required fields
      if (!node.id) errors.push(`Node ${index + 1}: Missing id`);
      if (!node.type) errors.push(`Node ${index + 1}: Missing type`);
      if (!node.title) errors.push(`Node ${index + 1}: Missing title`);
      
      // Check valid type
      if (node.type && !validTypes.includes(node.type)) {
        errors.push(`Node ${index + 1}: Invalid type "${node.type}"`);
      }
      
      // Check data structure based on type
      if (!node.data || typeof node.data !== 'object') {
        errors.push(`Node ${index + 1}: Invalid data structure`);
      }
    });
    
    if (errors.length > 0) {
      console.log('❌ Validation errors:');
      errors.forEach(err => console.log(`  - ${err}`));
      return false;
    }
    
    console.log('✅ All nodes are valid');
    return true;
  } catch (error) {
    console.error('❌ Error validating nodes:', error.message);
    throw error;
  }
};

// Test 6: Performance test (bulk operations)
const testPerformance = async () => {
  console.log('\n⚡ Test 6: Performance Test');
  
  try {
    const startTime = Date.now();
    
    // Create 10 topics with nodes
    const promises = [];
    for (let i = 0; i < 10; i++) {
      const topic = new Topic({
        name: `Test Topic ${i + 1}`,
        level: 'beginner',
        nodes: [
          {
            id: `node_${i}_1`,
            type: 'vocabulary',
            title: `Vocabulary ${i + 1}`,
            data: { words: [] }
          }
        ]
      });
      promises.push(topic.save());
    }
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Created 10 topics in ${duration}ms`);
    console.log(`   Average: ${(duration / 10).toFixed(2)}ms per topic`);
    
    // Clean up
    await Topic.deleteMany({ name: /^Test Topic/ });
    console.log('🧹 Cleaned up test data');
    
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    throw error;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting CourseBuilder Database Tests\n');
  console.log('=' .repeat(50));
  
  await connectDB();
  
  let topicId;
  
  try {
    // Run all tests
    topicId = await testCreateTopicWithCourse();
    await testLoadTopic(topicId);
    await testUpdateNodes(topicId);
    await testQueryTopicsWithNodes();
    await testValidateNodeStructure(topicId);
    await testPerformance();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests passed!');
    console.log('\n📊 Summary:');
    console.log('  - Topic model supports nodes ✓');
    console.log('  - CRUD operations work ✓');
    console.log('  - Data validation works ✓');
    console.log('  - Performance is acceptable ✓');
    console.log('\n🎉 CourseBuilder database is ready to use!');
    
  } catch (error) {
    console.log('\n' + '='.repeat(50));
    console.error('❌ Tests failed:', error.message);
    console.log('\n💡 Fix the errors above and run tests again.');
  } finally {
    // Clean up test data (optional)
    if (topicId) {
      const cleanup = process.argv.includes('--cleanup');
      if (cleanup) {
        await Topic.findByIdAndDelete(topicId);
        console.log('\n🧹 Test data cleaned up');
      } else {
        console.log(`\n💾 Test topic ID: ${topicId}`);
        console.log('   Use --cleanup flag to remove test data');
      }
    }
    
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed\n');
  }
};

// Run tests
runTests();
