require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing model import...');
try {
  const Topic = require('./src/models/Topic');
  console.log('✓ Topic model loaded:', Topic);
  console.log('✓ Model name:', Topic.modelName);
} catch (error) {
  console.error('✗ Error loading Topic model:', error.message);
}

console.log('\nTesting controller import...');
try {
  const TopicController = require('./src/controllers/Topic');
  console.log('✓ Topic controller loaded:', Object.keys(TopicController));
} catch (error) {
  console.error('✗ Error loading controller:', error.message);
  console.error(error.stack);
}
