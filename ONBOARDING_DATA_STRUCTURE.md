# 📊 Cấu trúc dữ liệu Onboarding

## 🗄️ Lưu trữ dữ liệu

Dữ liệu onboarding được lưu **TRỰC TIẾP vào collection `users`**, KHÔNG tạo collection riêng.

### 📍 Vị trí trong Database

```
Database: ielts_learning_db
Collection: users
Document: {
  _id: ObjectId("..."),
  user_name: "John Doe",
  email: "john@example.com",
  
  // ⬇️ ONBOARDING DATA Ở ĐÂY
  onboarding_completed: true,
  learning_preferences: {
    goal: "study_abroad",
    current_level: "stranger",
    focus_skills: ["writing"],
    study_hours_per_week: 30,
    target_band: null,
    preferred_study_days: [],
    exam_date: null
  }
}
```

---

## 📋 Schema Chi tiết

### 1. `onboarding_completed` (Boolean)
- **Mặc định:** `false`
- **Sau onboarding:** `true`
- **Mục đích:** Track xem user đã hoàn thành onboarding chưa

### 2. `learning_preferences` (Object)

#### Frontend thu thập:
```javascript
{
  goal: "study_abroad",           // Step 1: Mục tiêu học
  background: "stranger",          // Step 2: Trình độ hiện tại
  painPoint: "writing",            // Step 3: Kỹ năng cần cải thiện
  timeCommitment: "30-45 phút/ngày", // Step 4: Thời gian học
  assessmentScore: 3               // Step 5: Điểm mini-game (optional)
}
```

#### Backend lưu (sau mapping):
```javascript
{
  goal: "study_abroad",
  current_level: "stranger",       // Mapped from background
  focus_skills: ["writing"],       // Mapped from painPoint (as array)
  study_hours_per_week: 30,        // Parsed from timeCommitment
  target_band: null,               // Optional - chưa thu thập
  preferred_study_days: [],        // Optional - chưa thu thập
  exam_date: null                  // Optional - chưa thu thập
}
```

---

## 🔄 Data Flow

### 1. Frontend Collection (5 Steps)
```
Step 1 → goal
Step 2 → background
Step 3 → painPoint
Step 4 → timeCommitment
Step 5 → assessmentScore (optional)
```

### 2. Data Mapping (Onboarding.jsx)
```javascript
const payload = {
  goal: data.goal,
  current_level: data.background,
  focus_skills: data.painPoint ? [data.painPoint] : [],
  study_hours_per_week: data.timeCommitment ? parseInt(data.timeCommitment.split('-')[0]) : null,
  target_band: null,
  preferred_study_days: [],
  exam_date: null,
};
```

### 3. Backend Save (onboardingController.js)
```javascript
await User.findByIdAndUpdate(userId, {
  onboarding_completed: true,
  learning_preferences: {
    goal,
    target_band,
    current_level,
    study_hours_per_week,
    preferred_study_days,
    exam_date,
    focus_skills,
  }
});
```

---

## 📊 Ví dụ thực tế

### User vừa đăng ký:
```json
{
  "_id": "679abc123def456789",
  "user_name": "Nguyễn Văn A",
  "email": "vana@gmail.com",
  "onboarding_completed": false,
  "learning_preferences": {}
}
```

### Sau khi hoàn thành onboarding:
```json
{
  "_id": "679abc123def456789",
  "user_name": "Nguyễn Văn A",
  "email": "vana@gmail.com",
  "onboarding_completed": true,
  "learning_preferences": {
    "goal": "career",
    "current_level": "old_friend",
    "focus_skills": ["speaking"],
    "study_hours_per_week": 45,
    "target_band": null,
    "preferred_study_days": [],
    "exam_date": null
  }
}
```

---

## 🎯 Sử dụng dữ liệu

### 1. Check onboarding status
```javascript
const user = await User.findById(userId).select('onboarding_completed');
if (!user.onboarding_completed) {
  // Redirect to onboarding
}
```

### 2. Lấy learning preferences
```javascript
const user = await User.findById(userId).select('learning_preferences');
const { goal, current_level, focus_skills } = user.learning_preferences;
```

### 3. Sử dụng cho AI personalization
```javascript
// AI có thể dùng learning_preferences để:
// - Tạo lộ trình học phù hợp
// - Gợi ý bài tập theo focus_skills
// - Điều chỉnh độ khó theo current_level
// - Schedule theo study_hours_per_week
```

---

## ⚙️ API Endpoints

### POST `/api/onboarding`
**Request:**
```json
{
  "goal": "study_abroad",
  "current_level": "stranger",
  "focus_skills": ["writing"],
  "study_hours_per_week": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã lưu thông tin onboarding thành công",
  "user": {
    "_id": "...",
    "user_name": "...",
    "onboarding_completed": true,
    "learning_preferences": {...}
  }
}
```

### GET `/api/onboarding/status`
**Response:**
```json
{
  "success": true,
  "onboarding_completed": true,
  "learning_preferences": {
    "goal": "career",
    "current_level": "old_friend",
    "focus_skills": ["speaking"],
    "study_hours_per_week": 45
  }
}
```

---

## 🔐 Security

- **Authentication:** Routes được bảo vệ bởi `protect` middleware
- **Authorization:** Chỉ user đó mới update được learning_preferences của mình
- **Validation:** Backend validate `goal` và `current_level` là required

---

## 📝 Notes

1. **Không tạo collection riêng** - Tích hợp vào `users` để dễ query và quản lý
2. **Optional fields** - `target_band`, `preferred_study_days`, `exam_date` có thể null
3. **Mở rộng dễ dàng** - Có thể thêm fields mới vào `learningPreferencesSchema` khi cần
4. **AI-ready** - Cấu trúc sẵn sàng cho AI processing và personalization

