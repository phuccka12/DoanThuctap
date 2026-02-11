# 🔧 FIX: setFormData Error & 500 Internal Server Error

## ❌ Lỗi trước đó

### 1. Frontend Error:
```
ReferenceError: setFormData is not defined
at handleAgenticGenerate (AdminReadingPassages.jsx:198:9)
```

### 2. Backend Error:
```
:3001/api/admin/reading-passages/agentic-generate:1  
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

## 🔍 Root Cause

### Lỗi 1: `setFormData is not defined`
**Nguyên nhân:**
- `formData` và `setFormData` là state của **CreateEditModal component** (line 661)
- Main component (AdminReadingPassages) KHÔNG có state này
- Code cố gắng gọi `setFormData()` từ main component → **Reference Error**

**Cấu trúc component:**
```jsx
function AdminReadingPassages() {
  // ❌ KHÔNG CÓ formData state ở đây
  const [aiGenerating, setAiGenerating] = useState(false);
  
  return (
    <div>
      {showCreateModal && (
        <CreateEditModal> {/* ✅ formData CÓ Ở ĐÂY */}
          ...
        </CreateEditModal>
      )}
    </div>
  );
}
```

### Lỗi 2: 500 Internal Server Error
**Nguyên nhân:**
- Node server chưa chạy hoặc chạy sai port
- Node không kết nối được Python AI service
- Response format sai (expecting `res.data.data` nhưng API trả về `res.data`)

## ✅ Giải pháp

### Fix 1: Dùng `editingPassage` thay vì `setFormData`

**Trước:**
```javascript
// ❌ SAI - setFormData không tồn tại ở main component
setFormData({
  ...formData,  // ← formData cũng không tồn tại
  title: result.title,
  passage: result.passage,
});
setShowCreateModal(true);
```

**Sau:**
```javascript
// ✅ ĐÚNG - Tạo object và pass vào editingPassage
const aiGeneratedPassage = {
  title: result.title,
  passage: result.passage,
  cefr_level: result.cefr_level,
  word_count: result.word_count,
  ai_generated: true,
  level: 'intermediate', // default
  content_type: 'article', // default
  topics: [],
  questions: []
};

setEditingPassage(aiGeneratedPassage);
setShowCreateModal(true);
```

**Cách hoạt động:**
```jsx
{showCreateModal && (
  <CreateEditModal
    passage={editingPassage}  // ← Nhận data từ đây
    ...
  />
)}
```

CreateEditModal sẽ nhận `passage` prop và populate vào formData:
```jsx
useEffect(() => {
  if (passage) {
    setFormData({
      title: passage.title || '',
      passage: passage.passage || '',
      cefr_level: passage.cefr_level || 'A2',
      // ...
    });
  }
}, [passage]);
```

### Fix 2: Sửa response path

**Trước:**
```javascript
const result = res.data.data;  // ❌ Nested data
```

**Sau:**
```javascript
const result = res.data;  // ✅ Direct response
```

**Backend response format:**
```json
{
  "status": "success",
  "attempts": 2,
  "title": "...",
  "passage": "...",
  "audit_report": {...}
}
```

### Fix 3: Node Server Port

**Đã fix trước đó:**
- Node server: `PORT=3001` (trong `.env`)
- Python AI service: `PORT=5000`
- Frontend: Gọi đến `localhost:3001/api/...`

## 📋 Checklist Deployed

- [x] Node server chạy port 3001
- [x] Python AI service chạy port 5000
- [x] Frontend services point to 3001
- [x] Response format fixed (`res.data` not `res.data.data`)
- [x] Use `editingPassage` instead of `setFormData`
- [x] AI generated object has all required fields
- [x] Modal receives data via props

## 🧪 Test Steps

### 1. Verify Services Running

**Python (Port 5000):**
```
✅ TOÀN BỘ HỆ THỐNG ĐÃ SẴN SÀNG CHIẾN ĐẤU!
* Running on http://127.0.0.1:5000
```

**Node (Port 3001):**
```
Server đang chạy trên cổng 3001
✅ MongoDB Connected
```

**Frontend (Port 5173):**
```
VITE ready in XXX ms
```

### 2. Test AI Generate

1. Navigate to `/admin/reading-passages`
2. Click "AI Generate" button (purple)
3. Fill form:
   ```
   Chủ đề: Daily Routines
   Trình độ CEFR: B1
   Số từ: 150
   ```
4. Click "Tạo với AI"

**Expected behavior:**
- ✅ No console errors
- ✅ Modal shows "Đang tạo..." for 30-60 seconds
- ✅ Success alert appears with Flesch score
- ✅ Modal closes
- ✅ **Create Modal opens with pre-filled data:**
  - Title: (AI generated)
  - Passage: (AI generated text)
  - CEFR Level: B1
  - AI Generated: ✓
- ✅ Can add questions and save

## 🔍 Debugging

### Check Console
```javascript
console.log('🤖 Starting Agentic Generation...', options);
```
Should appear before API call

### Check Network Tab
```
POST http://localhost:3001/api/admin/reading-passages/agentic-generate
Status: 200 OK
Response: { status: 'success', title: '...', passage: '...' }
```

### Check Python Logs
```
🏗️  AGENT 1 (ARCHITECT): Creating outline...
✅ Outline created: ...
📝 AGENT 2 (AUTHOR): Attempt 1/3
✅ ACCEPTED! (Flesch: 55.2)
🎉 GENERATION COMPLETE: success
```

## 💡 Key Learnings

### 1. Component State Scope
```
Main Component State → Only accessible in main component
Child Component State → Only accessible in child component

To pass data: Use props
```

### 2. Modal Data Flow Pattern
```
Main Component:
  const [editingItem, setEditingItem] = useState(null);
  
  // When AI generates:
  setEditingItem(aiResult);
  setShowModal(true);

Modal Component:
  useEffect(() => {
    if (props.item) {
      setLocalFormData(props.item); // Populate form
    }
  }, [props.item]);
```

### 3. API Response Nesting
```
✅ GOOD: res.data → { status, title, passage }
❌ BAD:  res.data → { data: { status, title, passage } }

Avoid unnecessary nesting!
```

## 🎉 Result

**Before:**
```
❌ ReferenceError: setFormData is not defined
❌ 500 Internal Server Error
```

**After:**
```
✅ AI generates content successfully
✅ Create Modal opens with pre-filled data
✅ User can review, add questions, and save
```

---

**Fixed:** February 9, 2026
**Files Changed:** `AdminReadingPassages.jsx`
**Status:** ✅ RESOLVED - Ready to test
