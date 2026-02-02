/**
 * 🧪 Test Cloudinary Upload
 * 
 * Chạy file này để test upload functionality
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api/upload';

// Thay bằng token thật từ localStorage sau khi login
const TOKEN = 'your_jwt_token_here';

/**
 * Test upload single file
 */
async function testUploadImage() {
  try {
    console.log('🧪 Testing image upload...\n');

    // Tạo FormData
    const formData = new FormData();
    
    // Giả sử có file test trong thư mục server/test-files/
    const testFilePath = path.join(__dirname, 'test-files', 'test-image.jpg');
    
    if (!fs.existsSync(testFilePath)) {
      console.log('⚠️  Test file not found. Create test-files/test-image.jpg first.');
      return;
    }

    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('folder', 'ielts-app/test');

    // Upload
    const response = await axios.post(`${BASE_URL}/single`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${TOKEN}`
      }
    });

    console.log('✅ Upload successful!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

/**
 * Test delete file
 */
async function testDeleteFile(publicId) {
  try {
    console.log('\n🧪 Testing file deletion...\n');

    const response = await axios.delete(BASE_URL, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      },
      data: {
        publicId: publicId,
        resourceType: 'image'
      }
    });

    console.log('✅ Delete successful!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Cloudinary Upload Test Suite\n');
  console.log('=' . repeat(50));

  // Test 1: Upload
  const uploadedFile = await testUploadImage();

  if (uploadedFile) {
    console.log('\n⏳ Waiting 3 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 2: Delete
    await testDeleteFile(uploadedFile.publicId);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Tests completed!');
}

// Run tests
if (require.main === module) {
  if (TOKEN === 'your_jwt_token_here') {
    console.log('❌ Please set TOKEN variable first!');
    console.log('   1. Login to get JWT token');
    console.log('   2. Update TOKEN variable in this file');
    process.exit(1);
  }
  
  runTests();
}

module.exports = { testUploadImage, testDeleteFile };
