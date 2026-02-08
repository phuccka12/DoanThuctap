# 📚 Quản lý Từ vựng theo Topics

## Tổng quan

Hệ thống Vocabulary Bank được thiết kế với khả năng **phân loại và quản lý từ vựng theo Topics** (chủ đề). Mỗi từ vựng có thể thuộc về **nhiều topics** khác nhau, giúp tổ chức và tra cứu hiệu quả.

## 🎯 Lợi ích của Topic Management

### 1. **Tổ chức có hệ thống**
- Phân loại từ vựng theo chủ đề (Travel, Business, Health, Education...)
- Dễ dàng tìm kiếm và quản lý
- Tránh bị lộn xộn khi có hàng nghìn từ

### 2. **Học tập hiệu quả**
- Học sinh có thể học theo chủ đề cụ thể
- Vocabulary flashcards theo topic
- Ôn tập có mục tiêu

### 3. **Liên kết với Lessons**
- Mỗi bài học (Lesson) gắn với 1 topic
- Tự động gợi ý từ vựng phù hợp cho lesson
- Tích hợp vào Course Builder

## 🔧 Kiến trúc Database

### Vocabulary Model
```javascript
{
  word: String,
  part_of_speech: String,
  meaning: String,
  topics: [ObjectId],  // Array - 1 từ có thể thuộc nhiều topics
  tags: [String],      // Tags tự do (ví dụ: "formal", "slang")
  level: String,       // beginner/intermediate/advanced
  // ... other fields
}
```

### Topic Model
```javascript
{
  name: String,
  slug: String,
  description: String,
  level: String,
  keywords: [String],
  // ... other fields
}
```

## 💡 Sự khác biệt: Topics vs Tags

| Feature | **Topics** | **Tags** |
|---------|-----------|----------|
| **Kiểu dữ liệu** | ObjectId (tham chiếu Topic collection) | String (text tự do) |
| **Cấu trúc** | Có cấu trúc, quản lý tập trung | Không cấu trúc, tự do |
| **Liên kết** | Gắn với Lessons, Courses | Chỉ dùng để search/filter |
| **Ví dụ** | "Travel & Tourism", "Business English" | "formal", "slang", "british" |
| **Số lượng** | 1 từ có nhiều topics (thường 1-3) | 1 từ có nhiều tags (không giới hạn) |

## 🎨 UI/UX Features

### 1. **Topic Filter Dropdown**
```jsx
<select value={topicFilter} onChange={...}>
  <option value="">Tất cả Topics</option>
  {allTopics.map(topic => (
    <option key={topic._id} value={topic._id}>
      {topic.name}
    </option>
  ))}
</select>
```

### 2. **Topic Statistics Card**
Hiển thị top 10 topics với số lượng từ vựng:
```
📊 Travel & Tourism: 45 từ
📊 Business English: 38 từ
📊 Health & Medicine: 32 từ
```
Click vào card → Auto filter theo topic đó

### 3. **Multi-select Topic Picker** (Create/Edit Form)
```jsx
<div className="bg-gray-700 p-3 rounded-lg max-h-48 overflow-y-auto">
  {allTopics.map(topic => (
    <label className="flex items-center gap-2">
      <input 
        type="checkbox"
        checked={formData.topics.includes(topic._id)}
        onChange={() => toggleTopic(topic._id)}
      />
      <span>{topic.name}</span>
    </label>
  ))}
</div>
```

### 4. **Topic Badges** (Table View)
Mỗi từ vựng hiển thị 2 topics đầu tiên + số còn lại:
```
✅ Travel  ✅ Transportation  +2
```

### 5. **Active Filter Tags**
Hiển thị các filter đang active với nút X để xóa:
```
Đang lọc: [Topic: Travel] [Level: beginner] [X Xóa tất cả]
```

## 🔄 Workflow: Thêm từ vựng vào Topic

### Bước 1: Tạo Topics trước
1. Vào `/admin/topics`
2. Tạo các topics: Travel, Business, Health...
3. Set level, description, keywords cho mỗi topic

### Bước 2: Thêm từ vựng
1. Vào `/admin/vocabulary`
2. Click "Thêm Từ Mới"
3. Điền word, meaning, pronunciation...
4. **Chọn Topics liên quan** (multi-select checkbox)
5. Thêm Tags tự do nếu cần
6. Save

### Bước 3: Quản lý & Filter
1. Xem thống kê theo topics
2. Click vào topic card để filter
3. Export CSV theo topic
4. Bulk assign topics cho nhiều từ

## 📊 API Endpoints

### GET /api/admin/vocab?topic=:topicId
Filter vocabularies by topic
```javascript
const params = {
  page: 1,
  limit: 20,
  topic: '507f1f77bcf86cd799439011'  // Topic ObjectId
};
const res = await adminService.getVocabularies(params);
```

### GET /api/admin/vocab/stats
Get statistics including topic breakdown
```javascript
{
  total: 150,
  beginner: 60,
  intermediate: 50,
  advanced: 40,
  topicStats: [
    { topicId: '...', topicName: 'Travel', count: 45 },
    { topicId: '...', topicName: 'Business', count: 38 }
  ]
}
```

### POST /api/admin/vocab
Create with topics array
```javascript
const data = {
  word: 'airport',
  meaning: 'Sân bay',
  topics: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],  // Array of Topic IDs
  tags: ['travel', 'transportation']
};
await adminService.createVocabulary(data);
```

## 🎯 Use Cases

### 1. **Lesson Builder Integration**
```javascript
// Khi tạo lesson cho topic "Travel"
const topicId = '507f1f77bcf86cd799439011';
const suggestedVocab = await getVocabularies({ topic: topicId, limit: 20 });
// Gợi ý 20 từ vựng liên quan để add vào lesson
```

### 2. **Flashcard Game**
```javascript
// Tạo flashcard deck theo topic
const topic = await getTopic('Travel & Tourism');
const vocab = await getVocabularies({ topic: topic._id });
// Generate flashcards với vocab này
```

### 3. **Student Practice**
```javascript
// Học sinh chọn topic muốn luyện
const practiceVocab = await getVocabularies({
  topic: selectedTopicId,
  level: 'beginner',
  limit: 10
});
// Hiển thị 10 từ dễ trong chủ đề đó
```

## 🚀 Tính năng nâng cao (Future)

### 1. **Auto-suggest Topics**
Dùng AI để tự động gợi ý topics dựa trên word và meaning:
```javascript
// Input: "airport" - "sân bay"
// AI suggest: Travel, Transportation
```

### 2. **Topic Relationships**
Tạo mối quan hệ parent-child giữa topics:
```
Travel & Tourism (parent)
├── Airports & Flights (child)
├── Hotels & Accommodation (child)
└── Tourist Attractions (child)
```

### 3. **Vocabulary Coverage Report**
Báo cáo phạm vi từ vựng của mỗi topic:
```
Topic: Business English
- Total words: 120
- Beginner: 40 (33%)
- Intermediate: 50 (42%)
- Advanced: 30 (25%)
- Missing: Accounting terms (0 words)
```

### 4. **Bulk Topic Assignment**
Chọn nhiều từ → Assign vào 1 topic cùng lúc:
```jsx
<button onClick={() => bulkAssignTopic(selectedIds, topicId)}>
  Gán {selectedIds.length} từ vào topic này
</button>
```

## 📋 Best Practices

### ✅ DO's
- **1 từ → 1-3 topics**: Chọn topics thực sự liên quan
- **Consistent naming**: Dùng tên topic chuẩn hóa
- **Level alignment**: Topic level = Vocabulary level
- **Regular cleanup**: Xóa topics không dùng

### ❌ DON'Ts
- **Không add quá nhiều topics**: 1 từ có 10 topics → khó quản lý
- **Không dùng topics như tags**: Topics phải có structure
- **Không tạo duplicate topics**: Check kỹ trước khi tạo mới
- **Không bỏ trống topics**: Mọi từ nên thuộc ít nhất 1 topic

## 🛠️ Troubleshooting

### ❓ Không thấy topics trong dropdown?
→ Vào `/admin/topics` tạo topics trước

### ❓ Topics không hiển thị trong table?
→ Check populate: `.populate('topics', 'name')`

### ❓ Filter theo topic không hoạt động?
→ Check query: `if (topic) query.topics = topic;`

### ❓ Thống kê topics sai?
→ Check aggregation pipeline trong `getStatistics()`

## 📝 Summary

| Feature | Status |
|---------|--------|
| ✅ Topic Model | Complete |
| ✅ Vocabulary.topics field | Complete |
| ✅ Multi-select Topic Picker | Complete |
| ✅ Topic Filter Dropdown | Complete |
| ✅ Topic Statistics | Complete |
| ✅ Topic Badges in Table | Complete |
| ✅ Active Filter Display | Complete |
| ✅ API Integration | Complete |
| ⏳ Auto-suggest Topics | Future |
| ⏳ Topic Relationships | Future |

---

**Hệ thống quản lý vocabulary theo topics giúp:**
- Tổ chức từ vựng có hệ thống
- Dễ dàng tra cứu và filter
- Tích hợp tốt với Lessons/Courses
- Nâng cao trải nghiệm học tập

**Next Steps:**
1. Test topic assignment trong production
2. Tạo sample vocabulary với topics đầy đủ
3. Tích hợp với Lesson Builder
4. Build flashcard game theo topics
