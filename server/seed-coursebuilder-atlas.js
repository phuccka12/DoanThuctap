/**
 * 🌱 Seed CourseBuilder Sample Data to MongoDB Atlas
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Topic = require('./src/models/Topic');

const seedToAtlas = async () => {
  try {
    // Connect to Atlas (from .env)
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGO_URI not found in .env file');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to Atlas\n');

    // Check if sample topic already exists
    const existing = await Topic.findOne({ name: 'Survival English: Airport' });
    
    if (existing) {
      console.log('⚠️  Sample topic already exists!');
      console.log(`   Topic ID: ${existing._id}`);
      console.log(`   Activities: ${existing.nodes?.length || 0}`);
      
      const answer = process.argv.includes('--force');
      if (!answer) {
        console.log('\n💡 Use --force flag to recreate');
        await mongoose.connection.close();
        return;
      }
      
      console.log('🗑️  Deleting existing topic...');
      await Topic.findByIdAndDelete(existing._id);
    }

    // Create sample topic with course structure
    console.log('📝 Creating sample topic with CourseBuilder data...\n');
    
    const sampleTopic = new Topic({
      name: 'Survival English: Airport',
      description: 'Learn essential English for navigating airports',
      cover_image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05',
      level: 'intermediate',
      keywords: ['airport', 'travel', 'check-in', 'customs'],
      is_active: true,
      nodes: [
        {
          id: 'node_vocab_1',
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
              },
              {
                word: 'Departure',
                meaning: 'Khởi hành',
                pronunciation: '/dɪˈpɑːrtʃər/',
                example: 'The departure time is 3 PM.',
                imageUrl: ''
              }
            ]
          },
          createdAt: new Date()
        },
        {
          id: 'node_video_1',
          type: 'video',
          title: 'Check-in Dialogue',
          data: {
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration: 180,
            transcript: 'Clerk: Good morning! May I see your passport and ticket?\nPassenger: Here you are.\nClerk: Thank you. Would you like a window or aisle seat?',
            questions: [
              {
                question: 'What does the clerk ask for first?',
                options: ['Passport', 'Money', 'Luggage', 'Phone'],
                correctAnswer: 0
              }
            ]
          },
          createdAt: new Date()
        },
        {
          id: 'node_roleplay_1',
          type: 'ai_roleplay',
          title: 'Customs Practice',
          data: {
            scenario: 'You are going through customs at the airport',
            aiRole: 'customs_officer',
            userRole: 'traveler',
            objectives: [
              'Answer questions about your trip',
              'Declare items if necessary',
              'Be polite and clear'
            ],
            sampleDialogue: 'Officer: What is the purpose of your visit?\nYou: I\'m here for tourism.'
          },
          createdAt: new Date()
        },
        {
          id: 'node_quiz_1',
          type: 'quiz',
          title: 'Vocabulary Quiz',
          data: {
            questions: [
              {
                question: 'What do you need to show before boarding?',
                type: 'multiple_choice',
                options: ['Boarding pass', 'Driver license', 'Credit card', 'Phone'],
                correctAnswer: 0,
                explanation: 'You need a boarding pass to get on the plane'
              },
              {
                question: 'The opposite of "arrival" is _____',
                type: 'fill_blank',
                correctAnswer: 'departure',
                explanation: 'Departure means leaving, arrival means coming'
              }
            ],
            timeLimit: 300,
            passingScore: 70
          },
          createdAt: new Date()
        },
        {
          id: 'node_grammar_1',
          type: 'grammar',
          title: 'Polite Requests at Airport',
          data: {
            grammarPoint: 'Modal verbs for polite requests (Could/Would/May)',
            explanation: 'Use "Could you...?" or "Would you...?" to make polite requests',
            examples: [
              'Could you help me with my luggage?',
              'Would you mind if I sit here?',
              'May I see your boarding pass?'
            ],
            exercises: [
              {
                instruction: 'Make a polite request',
                prompt: 'You want to know the gate number',
                sampleAnswer: 'Could you tell me which gate my flight is at?'
              }
            ]
          },
          createdAt: new Date()
        },
        {
          id: 'node_listening_1',
          type: 'listening',
          title: 'Airport Announcement',
          data: {
            audioUrl: 'https://example.com/airport-announcement.mp3',
            duration: 45,
            transcript: 'Attention passengers. Flight BA 123 to London is now boarding at gate 15. This is the final call.',
            questions: [
              {
                question: 'Which flight is boarding?',
                options: ['BA 123', 'BA 321', 'BA 213', 'BA 132'],
                correctAnswer: 0
              },
              {
                question: 'What gate number was announced?',
                type: 'fill_blank',
                correctAnswer: '15'
              }
            ]
          },
          createdAt: new Date()
        }
      ]
    });

    await sampleTopic.save();
    console.log('✅ Sample topic created successfully!');
    console.log(`\n📊 Topic Details:`);
    console.log(`   ID: ${sampleTopic._id}`);
    console.log(`   Name: ${sampleTopic.name}`);
    console.log(`   Level: ${sampleTopic.level}`);
    console.log(`   Activities: ${sampleTopic.nodes.length}`);
    console.log(`\n📋 Activities:`);
    sampleTopic.nodes.forEach((node, i) => {
      console.log(`   ${i + 1}. [${node.type}] ${node.title}`);
    });

    console.log('\n🎉 Done! Check MongoDB Atlas to see the data.');
    console.log(`\n💡 Test CourseBuilder with this URL:`);
    console.log(`   http://localhost:5173/admin/topics/${sampleTopic._id}/builder`);

    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run
seedToAtlas();
