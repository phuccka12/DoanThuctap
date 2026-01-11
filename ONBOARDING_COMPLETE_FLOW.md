# 🔄 Onboarding Flow - From Start to Dashboard

## 📋 FLOW HOÀN CHỈNH

```
User đăng ký mới
    ↓
Login thành công
    ↓
AuthContext check: onboarding_completed = false
    ↓
needsOnboarding = true
    ↓
ProtectedRoute redirect → /onboarding
    ↓
User hoàn thành 5 steps
    ↓
Submit data → POST /api/onboarding
    ↓
Backend: Set onboarding_completed = true
    ↓
Frontend: fetchUserInfo() → Update user state
    ↓
navigate('/dashboard') ✅
    ↓
Dashboard hiển thị thành công!
```

---

## 🔒 PROTECTED ROUTE LOGIC

### File: `client-web/src/App.jsx`

```jsx
function ProtectedRoute({ children, allowWithoutOnboarding = false }) {
  const { isAuthenticated, needsOnboarding, loading } = useAuth();
  
  // Loading state
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Not logged in → Redirect to Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // ⚠️ QUAN TRỌNG: Check onboarding
  if (needsOnboarding && !allowWithoutOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  
  // All checks passed → Show protected content
  return children;
}
```

### Routes Configuration

```jsx
{/* Onboarding - Cho phép access mà KHÔNG cần hoàn thành onboarding */}
<Route path="/onboarding" element={
  <ProtectedRoute allowWithoutOnboarding={true}>
    <Onboarding />
  </ProtectedRoute>
} />

{/* Dashboard - YÊU CẦU phải hoàn thành onboarding */}
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

---

## 🧠 AUTH CONTEXT LOGIC

### File: `client-web/src/context/AuthContext.jsx`

```jsx
const value = {
  user,
  isAuthenticated: !!user,
  needsOnboarding: user && !user.onboarding_completed, // ← KEY LOGIC
  loading,
  login,
  logout,
  fetchUserInfo
};
```

### Giải thích:
- `needsOnboarding = true` khi:
  - User đã login (`user` tồn tại)
  - `user.onboarding_completed === false`

- `needsOnboarding = false` khi:
  - User chưa login (`user === null`)
  - User đã hoàn thành onboarding (`user.onboarding_completed === true`)

---

## ✅ SUBMIT ONBOARDING LOGIC

### File: `client-web/src/pages/Onboarding.jsx`

```jsx
const submitOnboarding = async (data) => {
  if (isSubmitting) return;
  
  setIsSubmitting(true);
  try {
    // 1. Map data từ frontend format → backend format
    const payload = {
      goal: data.goal,
      current_level: data.background,
      focus_skills: data.painPoint ? [data.painPoint] : [],
      study_hours_per_week: data.timeCommitment ? parseInt(data.timeCommitment.split('-')[0]) : null,
    };

    // 2. Submit to backend
    await axiosInstance.post('/onboarding', payload);
    
    // 3. ⚠️ QUAN TRỌNG: Reload user data để update onboarding_completed
    await fetchUserInfo(); 
    
    // 4. Redirect về Dashboard
    navigate('/dashboard', { replace: true });
    
  } catch (error) {
    console.error('Error submitting onboarding:', error);
    alert('Có lỗi xảy ra. Vui lòng thử lại!');
  } finally {
    setIsSubmitting(false);
  }
};
```

### Tại sao cần `fetchUserInfo()`?
- Backend đã set `onboarding_completed = true` trong database
- Frontend cần **reload user data** để update `user` state
- Nếu không reload → `needsOnboarding` vẫn là `true` → Redirect loop!

---

## 🔁 REDIRECT SCENARIOS

### Scenario 1: User mới đăng ký
```
1. Register → Login
2. user.onboarding_completed = false
3. Try access /dashboard
4. ProtectedRoute check: needsOnboarding = true
5. Redirect to /onboarding ✅
```

### Scenario 2: User đã hoàn thành onboarding
```
1. Login
2. user.onboarding_completed = true
3. Try access /dashboard
4. ProtectedRoute check: needsOnboarding = false
5. Access /dashboard ✅
```

### Scenario 3: User đang làm onboarding, refresh trang
```
1. User at /onboarding
2. Press F5 (refresh)
3. AuthContext reload user data
4. user.onboarding_completed = false
5. ProtectedRoute check: allowWithoutOnboarding = true
6. Stay at /onboarding ✅
```

### Scenario 4: User hoàn thành onboarding, click "Bắt đầu học ngay"
```
1. Submit onboarding data
2. Backend: Update user.onboarding_completed = true
3. Frontend: fetchUserInfo() → user state updated
4. navigate('/dashboard', { replace: true })
5. ProtectedRoute check: needsOnboarding = false
6. Dashboard displayed ✅
```

---

## 🛡️ BACKEND PROTECTION

### File: `server/src/controllers/onboardingController.js`

```javascript
exports.saveOnboarding = async (req, res) => {
  try {
    const userId = req.userId; // From protect middleware
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        onboarding_completed: true, // ← Set to true
        learning_preferences: {
          goal,
          current_level,
          focus_skills,
          study_hours_per_week,
        }
      },
      { new: true } // Return updated document
    );

    return res.status(200).json({
      success: true,
      message: "Đã lưu thông tin onboarding thành công",
      user: updatedUser
    });
  } catch (error) {
    console.error('Error saving onboarding:', error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server"
    });
  }
};
```

---

## 🧪 TESTING FLOW

### Test 1: User mới
1. **Register** new account
2. Verify redirect to `/onboarding` automatically
3. Complete 5 steps
4. Click "Bắt đầu học ngay"
5. Verify redirect to `/dashboard`
6. **Logout** and **login** again
7. Verify goes directly to `/dashboard` (no onboarding)

### Test 2: User đã complete onboarding
1. **Login** với account đã có `onboarding_completed = true`
2. Verify redirect to `/dashboard` directly
3. Try manually go to `/onboarding`
4. Should still allow access (for editing preferences in future)

### Test 3: Incomplete onboarding
1. **Login** user với `onboarding_completed = false`
2. Try access `/dashboard` directly
3. Verify redirect to `/onboarding`
4. Try access `/ai-writing`
5. Verify redirect to `/onboarding`

---

## 🐛 TROUBLESHOOTING

### Issue: Redirect loop between /onboarding and /dashboard
**Nguyên nhân:** `fetchUserInfo()` không được gọi sau submit
**Fix:** Đảm bảo có `await fetchUserInfo()` trước `navigate('/dashboard')`

### Issue: User vẫn bị redirect về /onboarding dù đã complete
**Nguyên nhân:** 
- Backend không update `onboarding_completed = true`
- Frontend không reload user data
**Fix:** 
- Check backend response: `user.onboarding_completed === true`
- Check `fetchUserInfo()` có được gọi không

### Issue: 404 error khi submit onboarding
**Nguyên nhân:** URL sai (`/api/api/onboarding`)
**Fix:** Đã fix thành `axiosInstance.post('/onboarding')`

### Issue: 401 Unauthorized
**Nguyên nhân:** Token expired
**Fix:** 
- Clear localStorage
- Login lại
- Token giờ expires sau 7 ngày

---

## 📊 DATABASE STATE

### User vừa đăng ký:
```json
{
  "_id": "...",
  "user_name": "John Doe",
  "email": "john@example.com",
  "onboarding_completed": false,  ← DEFAULT
  "learning_preferences": {}
}
```

### Sau khi hoàn thành onboarding:
```json
{
  "_id": "...",
  "user_name": "John Doe",
  "email": "john@example.com",
  "onboarding_completed": true,  ← UPDATED
  "learning_preferences": {
    "goal": "study_abroad",
    "current_level": "stranger",
    "focus_skills": ["speaking"],
    "study_hours_per_week": 30
  }
}
```

---

## 🎯 TÓM TẮT

### Flow hoàn chỉnh:
1. ✅ User register/login
2. ✅ Check `onboarding_completed` → `false` → Redirect to `/onboarding`
3. ✅ User hoàn thành 5 steps
4. ✅ Submit data → Backend update `onboarding_completed = true`
5. ✅ `fetchUserInfo()` reload user state
6. ✅ `navigate('/dashboard')` redirect
7. ✅ ProtectedRoute check → `needsOnboarding = false` → Allow access
8. ✅ Dashboard hiển thị!

### Key points:
- `ProtectedRoute` kiểm tra `needsOnboarding` trước khi cho vào Dashboard
- `allowWithoutOnboarding={true}` cho phép access `/onboarding` route
- `fetchUserInfo()` PHẢI được gọi sau submit để update user state
- `navigate('/dashboard', { replace: true })` redirect không lưu history

**Tất cả đã được implement đúng rồi!** ✅
