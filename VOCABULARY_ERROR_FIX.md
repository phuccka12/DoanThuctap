# 🐛 AdminVocabulary Error Fix

## Lỗi gặp phải:
```
An error occurred in the <AdminVocabulary> component.
```

## Nguyên nhân:
- `allTopics` có thể undefined khi component mount
- `.map()` trên undefined → crash
- API response format không đúng

## Đã fix:

### 1. **fetchTopics() với fallback**
```javascript
const fetchTopics = async () => {
  try {
    const res = await adminService.getTopics();
    console.log('Topics API response:', res.data);
    setAllTopics(res.data.data || res.data || []); // Fallback to empty array
  } catch (err) {
    console.error('Error fetching topics:', err);
    setAllTopics([]); // Set empty array on error
  }
};
```

### 2. **Safety check trong dropdown**
```javascript
{allTopics && allTopics.length > 0 && allTopics.map(topic => (
  <option key={topic._id} value={topic._id}>{topic.name}</option>
))}
```

### 3. **Safety check trong active filters**
```javascript
Topic: {allTopics && allTopics.find(t => t._id === topicFilter)?.name || topicFilter}
```

### 4. **Safety check trong stats**
```javascript
{stats && stats.topicStats && stats.topicStats.length > 0 && (
  // Render topic stats
)}
```

## Testing:
1. Reload page: http://localhost:5173/admin/vocabulary
2. Check browser console for "Topics API response:"
3. Verify no errors in React DevTools
4. Test all features:
   - [ ] Topic dropdown loads
   - [ ] Topic stats display (if have data)
   - [ ] Create/Edit form topic picker works
   - [ ] Filter by topic works

## Nếu vẫn lỗi:
1. Check console log để xem API response format
2. Check network tab: GET /api/admin/topics có success không?
3. Verify Topics collection có data chưa
4. Test API trực tiếp: `curl http://localhost:5000/api/admin/topics -H "Authorization: Bearer <token>"`

## Workaround nếu chưa có topics:
Tạo 1-2 topics trước tại `/admin/topics`, sau đó reload `/admin/vocabulary`
