# 🚀 Quick Start: Vocabulary với Topics

## Bước 1: Tạo Topics (Một lần đầu)

### Truy cập Topics Management
```
URL: http://localhost:5173/admin/topics
```

### Tạo một vài topics cơ bản
| Topic Name | Level | Description |
|------------|-------|-------------|
| Travel & Tourism | beginner | Từ vựng về du lịch, sân bay, khách sạn |
| Business English | intermediate | Từ vựng kinh doanh, công việc |
| Health & Medicine | intermediate | Từ vựng y tế, sức khỏe |
| Technology | advanced | Từ vựng về công nghệ, IT |
| Food & Cooking | beginner | Từ vựng về đồ ăn, nấu nướng |

### Click: **"Create New Topic"**
- Điền Name, Description, Level
- (Optional) Thêm icon, cover image
- Save

---

## Bước 2: Thêm Vocabulary với Topics

### Truy cập Vocabulary Management
```
URL: http://localhost:5173/admin/vocabulary
```

### Click: **"Thêm Từ Mới"**

### Ví dụ 1: Từ "airport"
```
✅ Word: airport
✅ Part of Speech: noun
✅ Pronunciation: /ˈeə.pɔːt/
✅ Meaning: Sân bay
✅ Example: I'm going to the airport at 6 AM.
✅ Level: beginner

📌 Topics (chọn nhiều):
   ☑️ Travel & Tourism
   ☑️ Transportation
   
🏷️ Tags: travel, transportation, flight
```

### Ví dụ 2: Từ "boardroom"
```
✅ Word: boardroom
✅ Part of Speech: noun
✅ Pronunciation: /ˈbɔːd.ruːm/
✅ Meaning: Phòng họp hội đồng quản trị
✅ Example: The meeting will be held in the boardroom.
✅ Level: intermediate

📌 Topics:
   ☑️ Business English
   ☑️ Office & Workplace
   
🏷️ Tags: business, meeting, formal
```

### Ví dụ 3: Từ "prescription"
```
✅ Word: prescription
✅ Part of Speech: noun
✅ Pronunciation: /prɪˈskrɪp.ʃən/
✅ Meaning: Đơn thuốc
✅ Example: The doctor gave me a prescription for antibiotics.
✅ Level: intermediate

📌 Topics:
   ☑️ Health & Medicine
   
🏷️ Tags: medical, doctor, pharmacy
```

---

## Bước 3: Sử dụng Topic Filters

### Xem thống kê theo Topics
Sau khi thêm vocabulary, scroll lên đầu trang sẽ thấy:

```
📊 Thống kê theo Topics
┌─────────────────────┬────────┐
│ Travel & Tourism    │ 45 từ  │
│ Business English    │ 38 từ  │
│ Health & Medicine   │ 32 từ  │
└─────────────────────┴────────┘
```

**Click vào card** → Tự động filter theo topic đó

### Filter thủ công
```
🔍 Dropdown "Tất cả Topics"
   → Chọn "Travel & Tourism"
   → Chỉ hiển thị từ vựng trong topic này
```

### Kết hợp nhiều filters
```
Topic: Travel & Tourism
Level: beginner
Part of Speech: noun
→ Kết quả: 15 từ phù hợp
```

---

## Bước 4: Import CSV với Topics

### Chuẩn bị file CSV
```csv
word,part_of_speech,pronunciation,meaning,example,topics,level,tags
airport,noun,/ˈeə.pɔːt/,Sân bay,I'm at the airport,"507f1f77bcf86cd799439011,507f1f77bcf86cd799439012",beginner,"travel,transportation"
passport,noun,/ˈpɑːs.pɔːt/,Hộ chiếu,Don't forget your passport,507f1f77bcf86cd799439011,beginner,"travel,document"
```

**Note:** 
- `topics`: Comma-separated Topic IDs (ObjectId)
- Cần lấy ID từ `/api/admin/topics` trước

### Upload CSV
1. Click **"Import CSV"**
2. Chọn file CSV
3. Preview 5 dòng đầu
4. Click **"Import"**
5. Xem kết quả: "✅ Imported 45/50 words (5 failed)"

---

## Bước 5: Tích hợp với Lessons

### Khi tạo Lesson mới
```javascript
// Trong Course Builder
const lesson = {
  title: "Booking a Flight",
  topic: "507f1f77bcf86cd799439011",  // Travel & Tourism
  // ...
};

// Auto-suggest vocabulary từ topic này
const suggestedVocab = await getVocabularies({
  topic: lesson.topic,
  level: 'beginner',
  limit: 20
});

// Hiển thị danh sách gợi ý cho admin chọn
```

---

## 📋 Checklist: Setup hoàn chỉnh

### Phase 1: Topics (5 phút)
- [ ] Tạo 5-10 topics cơ bản
- [ ] Set description, level cho mỗi topic
- [ ] (Optional) Upload cover image

### Phase 2: Vocabulary (15 phút)
- [ ] Thêm 10-20 từ mẫu thủ công
- [ ] Gán topics cho mỗi từ (1-3 topics/từ)
- [ ] Thêm tags bổ sung
- [ ] Upload hình ảnh, audio cho một vài từ

### Phase 3: Bulk Import (10 phút)
- [ ] Chuẩn bị CSV với 50-100 từ
- [ ] Lấy Topic IDs từ database
- [ ] Update CSV với đúng topic IDs
- [ ] Import và check lỗi

### Phase 4: Testing (5 phút)
- [ ] Test filter theo topic
- [ ] Test search kết hợp với topic filter
- [ ] Test bulk delete theo topic
- [ ] Test export CSV với topic filter

---

## 🎯 Best Practices

### ✅ Nên làm
1. **Luôn gán topics khi tạo từ mới**
   - Ít nhất 1 topic cho mỗi từ
   - Chọn 1-3 topics liên quan nhất

2. **Dùng topics để organize**
   - Topics = Chủ đề lớn (Travel, Business)
   - Tags = Chi tiết (formal, slang, british)

3. **Tạo topics theo curriculum**
   - Align với giáo trình IELTS
   - Phù hợp với course structure

### ❌ Không nên
1. **Không bỏ trống topics**
   - Từ không có topic → khó quản lý
   
2. **Không add quá nhiều topics**
   - 1 từ có 10 topics → mất focus
   
3. **Không duplicate topics**
   - Check trước khi tạo topic mới

---

## 🔥 Pro Tips

### Tip 1: Quick Filter từ Stats
Click vào topic stats card → Instant filter, không cần dùng dropdown

### Tip 2: Clear All Filters
Khi filter phức tạp, click **"Xóa tất cả"** để reset về view mặc định

### Tip 3: Topic Coverage Report
```javascript
// Check topic nào thiếu vocabulary
stats.topicStats.forEach(topic => {
  if (topic.count < 20) {
    console.warn(`⚠️ ${topic.topicName}: Chỉ có ${topic.count} từ`);
  }
});
```

### Tip 4: Bulk Topic Assignment (Future)
```
1. Filter theo level: beginner
2. Select all (50 từ)
3. Bulk assign → "Travel & Tourism"
4. ✅ Updated 50 words
```

---

## 📞 Support

### Gặp vấn đề?
- **Topics không hiển thị**: Check `/api/admin/topics` có data chưa
- **Filter không hoạt động**: F12 → Console → Check API call
- **Import CSV failed**: Check format CSV và topic IDs đúng chưa

### Feature Requests
- Auto-suggest topics dựa trên word + meaning (AI)
- Topic hierarchy (parent-child)
- Vocabulary coverage report by topic

---

**Tóm lại:**
1. Tạo Topics → 2. Thêm Vocabulary + gán Topics → 3. Filter & Search theo Topics → 4. Tích hợp với Lessons

**Giờ đây, vocabulary bank của bạn được tổ chức có hệ thống theo topics! 🎉**
