# 🔧 FIX: React Quill "Cannot register bullet" Error

## ❌ Lỗi

```
quill Cannot register "bullet" specified in "formats" config. 
Are you sure it was registered?
```

**Triệu chứng:**
- Modal Create mở ra NHƯNG trắng xóa
- Rich Text Editor không hiển thị
- Console đầy errors về Quill

## 🔍 Root Cause

### Config sai trong SmartPassageEditor.jsx

**Trước (SAI):**
```javascript
const formats = [
  'header',
  'bold', 'italic', 'underline',
  'list', 'bullet',  // ❌ SAI: 'bullet' không phải format riêng
  'link'
];
```

**Lý do lỗi:**
- `'bullet'` KHÔNG phải là format riêng biệt
- Nó là **value** của format `'list'`
- Khi dùng `{ 'list': 'bullet' }` trong toolbar, Quill hiểu là: "list với type bullet"
- Nhưng trong `formats` array, chỉ cần khai báo `'list'` thôi!

### Cấu trúc đúng của Quill List

**Toolbar modules:**
```javascript
[{ 'list': 'ordered'}, { 'list': 'bullet' }]
```
Có nghĩa là:
- Tạo 2 buttons
- Button 1: list ordered (1, 2, 3...)
- Button 2: list bullet (•, ○, ▪...)

**Formats array:**
```javascript
['list']  // ✅ Chỉ cần 'list', không cần 'bullet' hay 'ordered'
```

## ✅ Giải pháp

**Sau (ĐÚNG):**
```javascript
const formats = [
  'header',
  'bold', 'italic', 'underline',
  'list',  // ✅ ĐÚNG: Chỉ khai báo 'list'
  'link'
];
```

## 📚 Quill Format Types

### Inline Formats (áp dụng cho text selection)
- `bold`, `italic`, `underline`, `strike`
- `color`, `background`
- `script` (superscript/subscript)
- `link`

### Block Formats (áp dụng cho toàn bộ block/line)
- `header` (với values: 1, 2, 3, 4, 5, 6)
- `list` (với values: 'ordered', 'bullet')
- `align` (với values: '', 'center', 'right', 'justify')
- `direction` (với values: 'rtl')
- `code-block`
- `blockquote`

### Embeds (special objects)
- `image`
- `video`
- `formula`

## 🎯 Cách nhớ

```
Trong modules (toolbar):
  { 'format': 'value' } → Define button behavior

Trong formats array:
  ['format'] → Whitelist format type only
```

**Ví dụ:**
```javascript
// Toolbar: 3 header buttons (H1, H2, H3)
{ 'header': [1, 2, 3] }

// Formats: Chỉ cần khai báo 'header'
['header']  // NOT ['header', 1, 2, 3]
```

## 🧪 Test

1. **Refresh browser** (Ctrl+F5)
2. Click "AI Generate"
3. Generate content
4. **Kỳ vọng:**
   - ✅ Modal mở ra bình thường
   - ✅ Rich Text Editor hiển thị
   - ✅ Content đã được fill sẵn
   - ✅ Toolbar hoạt động (bold, list, etc.)
   - ✅ Không có console errors

## 💡 Bonus: Common Quill Errors

### Error: "Cannot register X"
**Cause:** Format in `formats` array không match với registered formats
**Fix:** Remove unregistered format hoặc register nó

### Error: "Toolbar handler undefined"
**Cause:** Handler function không tồn tại
**Fix:** Define handler trong modules config

### Error: "Delta insert only supports string or embed object types"
**Cause:** Trying to insert invalid data type
**Fix:** Convert data to plain text/HTML string first

## 📖 Documentation

React Quill Formats:
https://github.com/gtgalone/react-quill-new#formats

Quill Documentation:
https://quilljs.com/docs/formats/

---

**Fixed:** February 9, 2026
**File:** `SmartPassageEditor.jsx`
**Issue:** Quill "Cannot register bullet" error
**Solution:** Remove 'bullet' from formats array (it's a value, not a format)
**Status:** ✅ FIXED
