'use strict';
/**
 * test-story-api.js
 * Test trực tiếp CRUD API cho Stories (không cần Jest)
 * Chạy: node test-story-api.js
 */
require('dotenv').config();
const http  = require('http');
const jwt   = require('jsonwebtoken');

const BASE  = 'localhost';
const PORT  = process.env.PORT || 3001;
const TOKEN = jwt.sign(
  { user_id: '000000000000000000000001', role: 'admin' },
  process.env.ACCESS_TOKEN_SECRET || 'access_secret_key',
  { expiresIn: '1h' }
);

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: BASE,
      port:     PORT,
      path,
      method,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Length': Buffer.byteLength(bodyStr),
      },
    };
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function run() {
  let storyId;

  // ─── 1. Tạo câu chuyện mới ──────────────────────────────────────────────────
  console.log('\n━━━ TEST 1: Tạo câu chuyện (POST /api/admin/stories) ━━━');
  const createRes = await request('POST', '/api/admin/stories', {
    title:       'Test RPG Story - Buổi sáng Hội An',
    description: 'Mô tả câu chuyện test',
    cover_image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    theme:       'daily_life',
    level:       'beginner',
    tags:        ['test', 'hội an'],
    is_active:   true,
    parts: [
      {
        part_number: 1,
        title:       'Phần 1 - Buổi sáng',
        xp_reward:   50,
        coins_reward: 30,
        sentences: [
          { order: 1, vi: 'Buổi sáng hôm nay rất đẹp.', en_sample: 'This morning is very beautiful.', hints: [{ word: 'Buổi sáng', hint: 'morning' }] },
          { order: 2, vi: 'Tôi uống cà phê và đọc sách.', en_sample: 'I drink coffee and read books.', hints: [] },
        ],
      },
      {
        part_number: 2,
        title:       'Phần 2 - Ra phố',
        xp_reward:   60,
        coins_reward: 35,
        sentences: [
          { order: 1, vi: 'Tôi đi bộ ra phố cổ.', en_sample: 'I walk to the old town.', hints: [] },
        ],
      },
    ],
  });

  if (createRes.status === 201 && createRes.body.success) {
    storyId = createRes.body.data._id;
    const d = createRes.body.data;
    console.log(`✅ Tạo thành công! ID: ${storyId}`);
    console.log(`   title: "${d.title}"`);
    console.log(`   cover_image: "${d.cover_image}"`);
    console.log(`   total_parts: ${d.total_parts} (phải là 2)`);
    console.log(`   parts[0].sentences: ${d.parts?.[0]?.sentences?.length} câu (phải là 2)`);
    console.log(`   parts[1].sentences: ${d.parts?.[1]?.sentences?.length} câu (phải là 1)`);
    if (d.total_parts !== 2) console.warn(`⚠️  total_parts WRONG: expected 2, got ${d.total_parts}`);
  } else {
    console.error(`❌ Tạo THẤT BẠI! Status: ${createRes.status}`);
    console.error('   Response:', JSON.stringify(createRes.body, null, 2));
    process.exit(1);
  }

  // ─── 2. Lấy danh sách (kiểm tra cover_image có trong list) ──────────────────
  console.log('\n━━━ TEST 2: Danh sách (GET /api/admin/stories) ━━━');
  const listRes = await request('GET', '/api/admin/stories', null);
  if (listRes.status === 200 && listRes.body.success) {
    const found = listRes.body.data.find(s => s._id === storyId);
    if (found) {
      console.log(`✅ Câu chuyện xuất hiện trong danh sách.`);
      console.log(`   cover_image trong list: "${found.cover_image}" ${found.cover_image ? '✅' : '❌ THIẾU'}`);
      console.log(`   description trong list: "${found.description?.slice(0, 30)}…" ${found.description ? '✅' : '❌ THIẾU'}`);
    } else {
      console.error('❌ Câu chuyện vừa tạo KHÔNG xuất hiện trong list!');
    }
  } else {
    console.error(`❌ List THẤT BẠI! Status: ${listRes.status}`);
  }

  // ─── 3. Lấy chi tiết một câu chuyện ─────────────────────────────────────────
  console.log(`\n━━━ TEST 3: Chi tiết (GET /api/admin/stories/${storyId}) ━━━`);
  const getRes = await request('GET', `/api/admin/stories/${storyId}`, null);
  if (getRes.status === 200 && getRes.body.success) {
    const d = getRes.body.data;
    console.log(`✅ Lấy chi tiết thành công.`);
    console.log(`   parts: ${d.parts?.length} phần`);
    console.log(`   parts[0].sentences: ${d.parts?.[0]?.sentences?.length} câu`);
    console.log(`   hints[0][0]: ${JSON.stringify(d.parts?.[0]?.sentences?.[0]?.hints?.[0])}`);
  } else {
    console.error(`❌ GetOne THẤT BẠI! Status: ${getRes.status}`, getRes.body);
  }

  // ─── 4. Cập nhật câu chuyện ──────────────────────────────────────────────────
  console.log(`\n━━━ TEST 4: Cập nhật (PUT /api/admin/stories/${storyId}) ━━━`);
  const updateRes = await request('PUT', `/api/admin/stories/${storyId}`, {
    title:       'Test RPG Story - ĐÃ CẬP NHẬT',
    description: 'Mô tả đã cập nhật',
    cover_image: 'https://res.cloudinary.com/demo/image/upload/updated.jpg',
    theme:       'travel',
    level:       'intermediate',
    tags:        ['updated'],
    is_active:   true,
    parts: [
      {
        part_number: 1,
        title:       'Phần cập nhật',
        xp_reward:   80,
        coins_reward: 50,
        sentences: [
          { order: 1, vi: 'Câu mới sau khi cập nhật.', en_sample: 'New sentence after update.', hints: [] },
          { order: 2, vi: 'Câu số hai mới.', en_sample: 'The second new sentence.', hints: [{ word: 'mới', hint: 'new' }] },
        ],
      },
    ],
  });
  if (updateRes.status === 200 && updateRes.body.success) {
    const d = updateRes.body.data;
    console.log(`✅ Cập nhật thành công.`);
    console.log(`   title: "${d.title}"`);
    console.log(`   total_parts sau update: ${d.total_parts} (phải là 1)`);
    console.log(`   sentences count: ${d.parts?.[0]?.sentences?.length} (phải là 2)`);
    if (d.total_parts !== 1) console.warn(`⚠️  total_parts WRONG sau update: expected 1, got ${d.total_parts}`);
  } else {
    console.error(`❌ Update THẤT BẠI! Status: ${updateRes.status}`);
    console.error('   Response:', JSON.stringify(updateRes.body, null, 2));
  }

  // ─── 5. Xóa câu chuyện ───────────────────────────────────────────────────────
  console.log(`\n━━━ TEST 5: Xóa (DELETE /api/admin/stories/${storyId}) ━━━`);
  const delRes = await request('DELETE', `/api/admin/stories/${storyId}`, null);
  if (delRes.status === 200 && delRes.body.success) {
    console.log(`✅ Xóa thành công.`);
  } else {
    console.error(`❌ Xóa THẤT BẠI! Status: ${delRes.status}`, delRes.body);
  }

  // ─── 6. Xác nhận đã xóa ──────────────────────────────────────────────────────
  const verifyRes = await request('GET', `/api/admin/stories/${storyId}`, null);
  if (verifyRes.status === 404) {
    console.log(`✅ Xác nhận: câu chuyện đã bị xóa (404).`);
  } else {
    console.warn(`⚠️  GetOne sau xóa trả về ${verifyRes.status}, mong đợi 404.`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Tất cả test hoàn thành!\n');
}

run().catch(err => {
  console.error('\n❌ Script lỗi không xử lý được:', err.message);
  process.exit(1);
});
