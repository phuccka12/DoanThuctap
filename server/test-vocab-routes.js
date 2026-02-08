// Test file to debug vocabulary routes
const express = require('express');
const router = express.Router();

console.log('1. Loading controller...');
const vocabularyController = require('./src/controllers/Vocabulary');

console.log('2. Controller loaded:', Object.keys(vocabularyController));
console.log('3. getStatistics type:', typeof vocabularyController.getStatistics);

console.log('4. Trying to create route...');
try {
  router.get('/stats', vocabularyController.getStatistics);
  console.log('✅ Route created successfully!');
} catch (err) {
  console.log('❌ Error:', err.message);
}

console.log('5. Done');
