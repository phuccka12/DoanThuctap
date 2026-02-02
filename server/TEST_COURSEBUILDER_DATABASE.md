# 🧪 Hướng Dẫn Test CourseBuilder với Database

## 📋 Tóm tắt

File này hướng dẫn cách kiểm tra CourseBuilder hoạt động với MongoDB.

---

## 🔧 Cấu hình đã thêm

### 1. **Topic Model** (server/src/models/Topic.js)

Đã thêm field `nodes` vào schema:

```javascript
nodes: {
  type: [{
    id: String,              // Unique ID (node_123456789)
    type: String,            // vocabulary, video, ai_roleplay, quiz, grammar, listening
    title: String,           // Activity title
    data: Mixed,             // Dynamic data based on type
    createdAt: Date          // Timestamp
  }],
  default: []
}
```

### 2. **Topic Controller** (server/src/controllers/Topic.js)

Đã update `updateTopic` để hỗ trợ field `nodes`:

```javascript
if (nodes !== undefined) topic.nodes = nodes;
```

---

## 🧪 Cách Test

### **Option 1: Dùng Test Script (Recommended)**

```bash
# Di chuyển vào thư mục server
cd "D:\ĐỒ ÁN THỰC TẬP\Doantotnghiep\server"

# Chạy test script
node test-coursebuilder-db.js

# Hoặc chạy với cleanup (xóa data test sau khi chạy)
node test-coursebuilder-db.js --cleanup
```

**Test script sẽ:**
- ✅ Tạo topic mới với 6 activities
- ✅ Load topic và verify data
- ✅ Update nodes (thêm, xóa, reorder)
- ✅ Query topics có nodes
- ✅ Validate cấu trúc data
- ✅ Performance test

---

### **Option 2: Test qua Postman/Thunder Client**

#### 1. **Create Topic with Nodes**

```http
POST http://localhost:5000/api/admin/topics
Content-Type: application/json
Authorization: Bearer <your_admin_token>

{
  "name": "Survival English: Airport",
  "description": "Learn essential English for navigating airports",
  "cover_image": "https://example.com/airport.jpg",
  "level": "intermediate",
  "keywords": ["airport", "travel", "check-in"],
  "nodes": [
    {
      "id": "node_1",
      "type": "vocabulary",
      "title": "Airport Vocabulary",
      "data": {
        "words": [
          {
            "word": "Passport",
            "meaning": "Hộ chiếu",
            "pronunciation": "/ˈpɑːspɔːrt/",
            "example": "Please show me your passport.",
            "imageUrl": ""
          }
        ]
      }
    }
  ]
}
```

#### 2. **Get Topic (Verify Nodes)**

```http
GET http://localhost:5000/api/admin/topics/<topic_id>
Authorization: Bearer <your_admin_token>
```

#### 3. **Update Nodes (CourseBuilder Save)**

```http
PUT http://localhost:5000/api/admin/topics/<topic_id>
Content-Type: application/json
Authorization: Bearer <your_admin_token>

{
  "nodes": [
    {
      "id": "node_1",
      "type": "vocabulary",
      "title": "Airport Vocabulary (Updated)",
      "data": {
        "words": [
          {
            "word": "Passport",
            "meaning": "Hộ chiếu",
            "pronunciation": "/ˈpɑːspɔːrt/",
            "example": "Please show me your passport.",
            "imageUrl": ""
          },
          {
            "word": "Boarding Pass",
            "meaning": "Vé lên máy bay",
            "pronunciation": "/ˈbɔːrdɪŋ pæs/",
            "example": "Your boarding pass is at gate 5.",
            "imageUrl": ""
          }
        ]
      }
    },
    {
      "id": "node_2",
      "type": "video",
      "title": "Check-in Dialogue",
      "data": {
        "url": "https://youtube.com/watch?v=example",
        "transcript": "Good morning..."
      }
    }
  ]
}
```

---

### **Option 3: Test qua MongoDB Compass**

1. Mở MongoDB Compass
2. Connect to: `mongodb://localhost:27017/ielts_app`
3. Vào collection `topics`
4. Tìm một document, thêm field `nodes`:

```json
{
  "_id": ObjectId("..."),
  "name": "Test Topic",
  "nodes": [
    {
      "id": "node_1",
      "type": "vocabulary",
      "title": "Test Vocabulary",
      "data": {
        "words": []
      },
      "createdAt": ISODate("2026-01-30T10:00:00Z")
    }
  ]
}
```

5. Save và verify

---

## 📊 Cấu trúc dữ liệu chi tiết

### **Node Types & Data Structure**

#### 1. **Vocabulary**
```json
{
  "id": "node_1",
  "type": "vocabulary",
  "title": "Airport Vocabulary",
  "data": {
    "words": [
      {
        "word": "string",
        "meaning": "string",
        "pronunciation": "string (IPA)",
        "example": "string",
        "imageUrl": "string (URL)"
      }
    ]
  },
  "createdAt": "2026-01-30T10:00:00Z"
}
```

#### 2. **Video**
```json
{
  "id": "node_2",
  "type": "video",
  "title": "Check-in Dialogue",
  "data": {
    "url": "string (YouTube URL)",
    "transcript": "string (Full transcript)"
  },
  "createdAt": "2026-01-30T10:00:00Z"
}
```

#### 3. **AI Roleplay**
```json
{
  "id": "node_3",
  "type": "ai_roleplay",
  "title": "Customs Practice",
  "data": {
    "scenario": "string (Context description)",
    "aiRole": "string (AI persona)",
    "userGoal": "string (What user should achieve)",
    "initialPrompt": "string (AI's first message)"
  },
  "createdAt": "2026-01-30T10:00:00Z"
}
```

#### 4. **Quiz**
```json
{
  "id": "node_4",
  "type": "quiz",
  "title": "Vocabulary Quiz",
  "data": {
    "questions": [
      {
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "correctAnswer": 0,
        "explanation": "string"
      }
    ]
  },
  "createdAt": "2026-01-30T10:00:00Z"
}
```

#### 5. **Grammar**
```json
{
  "id": "node_5",
  "type": "grammar",
  "title": "Polite Requests",
  "data": {
    "title": "string",
    "content": "string (Markdown supported)",
    "examples": ["string", "string", "string"]
  },
  "createdAt": "2026-01-30T10:00:00Z"
}
```

#### 6. **Listening**
```json
{
  "id": "node_6",
  "type": "listening",
  "title": "Airport Announcement",
  "data": {
    "audioUrl": "string (Audio/Video URL)",
    "transcript": "string (Full transcript)",
    "dictationMode": false
  },
  "createdAt": "2026-01-30T10:00:00Z"
}
```

---

## ✅ Checklist Test

### **Backend:**
- [ ] Topic model có field `nodes`
- [ ] createTopic accept field `nodes`
- [ ] updateTopic accept field `nodes`
- [ ] getTopic return field `nodes`
- [ ] Validation cho node types
- [ ] Save/load hoạt động đúng

### **Frontend:**
- [ ] CourseBuilder load nodes từ topic
- [ ] Thêm activity → nodes.push()
- [ ] Xóa activity → nodes.splice()
- [ ] Drag & drop → reorder nodes
- [ ] Save button → call updateTopic API
- [ ] Refresh page → data persist

### **Database:**
- [ ] Nodes được lưu vào MongoDB
- [ ] Data structure đúng
- [ ] Indexes (nếu cần)
- [ ] Performance OK với nhiều nodes

---

## 🐛 Troubleshooting

### **Lỗi: "nodes is not defined"**
```bash
# Restart server để load model mới
cd server
npm run dev
```

### **Lỗi: "Validation failed"**
```javascript
// Check node structure:
{
  id: 'node_1',         // ✓ Required
  type: 'vocabulary',   // ✓ Required, valid enum
  title: 'Test',        // ✓ Required
  data: {}              // ✓ Required, object
}
```

### **Lỗi: "Cannot save topic"**
```bash
# Check MongoDB connection
# Check server logs
# Verify auth token
```

---

## 📈 Performance Tips

### **Optimize for large courses:**

1. **Limit nodes per topic:**
   ```javascript
   if (topic.nodes.length > 50) {
     return res.status(400).json({
       message: 'Maximum 50 activities per course'
     });
   }
   ```

2. **Paginate nodes if needed:**
   ```javascript
   // For very large courses, consider pagination
   const page = req.query.page || 1;
   const limit = 20;
   const nodes = topic.nodes.slice((page-1)*limit, page*limit);
   ```

3. **Index for queries:**
   ```javascript
   // In Topic model
   topicSchema.index({ 'nodes.type': 1 });
   ```

---

## 🎯 Next Steps

1. ✅ **Backend ready** - Nodes field implemented
2. ⏳ **Frontend integration** - CourseBuilder save/load
3. ⏳ **Validation** - Add mongoose validators
4. ⏳ **Versioning** - Track course changes
5. ⏳ **Migration** - Convert old lessons to nodes

---

## 📝 Sample Data

Xem file `test-coursebuilder-db.js` để có sample data hoàn chỉnh cho tất cả 6 loại activities.

---

## 💡 Tips

- **Use unique IDs:** `node_${Date.now()}` hoặc `uuid()`
- **Validate client-side:** Trước khi gửi lên server
- **Auto-save:** Debounce 2-3s để tránh spam API
- **Error handling:** Show friendly messages cho user
- **Backup:** Trước khi update, backup nodes cũ

---

**Status:** ✅ Database Ready  
**Last Updated:** January 30, 2026
