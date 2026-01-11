# 🎯 Sau khi thu thập Onboarding - Làm gì tiếp?

## ✅ Hiện tại đã có:
- ✅ Thu thập data qua 5 steps
- ✅ Lưu vào `users.learning_preferences`
- ✅ Set `onboarding_completed = true`

---

## 🚀 BƯỚC TIẾP THEO

### 1️⃣ CÁ NHÂN HÓA DASHBOARD (Ưu tiên cao)

#### A. Hiển thị thông tin personalized
```jsx
// Dashboard.jsx
const { user } = useAuth();
const { goal, current_level, focus_skills, study_hours_per_week } = 
  user?.learning_preferences || {};

// Hiển thị lời chào cá nhân hóa:
"Chào {user_name}! Mục tiêu của bạn: {goal}"
"Trình độ hiện tại: {current_level}"
"Kỹ năng tập trung: {focus_skills.join(', ')}"
```

**Ví dụ UI:**
```
┌─────────────────────────────────────────┐
│ 👋 Chào phuc cao!                       │
│ 🎯 Mục tiêu: Du học nước ngoài          │
│ 📊 Trình độ: Mới bắt đầu                │
│ 🎤 Tập trung: Speaking                  │
│ ⏰ Học: 30 giờ/tuần                     │
└─────────────────────────────────────────┘
```

#### B. Gợi ý nội dung phù hợp
```javascript
// Dựa vào focus_skills → hiện bài tập phù hợp
if (focus_skills.includes('speaking')) {
  // Hiển thị Speaking Questions ở đầu
  // Ẩn Writing Prompts hoặc đẩy xuống
}

if (focus_skills.includes('writing')) {
  // Hiển thị Writing Prompts ở đầu
}
```

#### C. Điều chỉnh độ khó
```javascript
// Dựa vào current_level
const difficulty = {
  'stranger': 'beginner',      // Dễ
  'old_friend': 'intermediate', // Trung bình
  'learning': 'intermediate',
  'close_friend': 'advanced'    // Khó
};

// Filter bài tập theo độ khó
const filteredExercises = exercises.filter(ex => 
  ex.difficulty === difficulty[current_level]
);
```

---

### 2️⃣ TẠO LỘ TRÌNH HỌC TỰ ĐỘNG (AI-driven)

#### A. Generate Learning Roadmap
```javascript
// Gọi API AI để tạo lộ trình
POST /api/ai/generate-roadmap
Body: {
  goal: "study_abroad",
  current_level: "stranger",
  focus_skills: ["speaking"],
  study_hours_per_week: 30
}

Response: {
  roadmap: [
    {
      week: 1,
      topics: ["Introduction & Greetings", "Basic Pronunciation"],
      exercises: [...],
      estimated_hours: 5
    },
    {
      week: 2,
      topics: ["Daily Conversation", "Common Phrases"],
      exercises: [...],
      estimated_hours: 5
    },
    // ... 8-12 weeks
  ]
}
```

#### B. Lưu roadmap vào User model
```javascript
// Thêm field mới vào User schema:
learning_roadmap: {
  type: Array,
  default: []
}

// Update sau khi generate:
await User.findByIdAndUpdate(userId, {
  learning_roadmap: generatedRoadmap
});
```

#### C. Hiển thị Progress Tracker
```
Tuần 1: ✅ Hoàn thành (100%)
Tuần 2: 🔄 Đang học (60%)
Tuần 3: ⏳ Chưa bắt đầu
Tuần 4: ⏳ Chưa bắt đầu
```

---

### 3️⃣ PERSONALIZED RECOMMENDATIONS

#### A. Smart Content Suggestions
```javascript
// Dựa vào goal + current_level
const recommendations = {
  'study_abroad + stranger': [
    'IELTS Speaking Part 1 - Basic Topics',
    'Common IELTS Vocabulary',
    'Pronunciation Basics'
  ],
  'career + old_friend': [
    'Business English Speaking',
    'Job Interview Questions',
    'Professional Writing'
  ]
};
```

#### B. Daily Practice Plan
```javascript
// Tính toán dựa vào study_hours_per_week
const dailyHours = study_hours_per_week / 7; // VD: 30/7 ≈ 4.3h/day

// Gợi ý schedule:
{
  speaking: dailyHours * 0.4,  // 40% nếu focus_skills có 'speaking'
  writing: dailyHours * 0.2,
  listening: dailyHours * 0.2,
  vocabulary: dailyHours * 0.2
}
```

---

### 4️⃣ GAMIFICATION PERSONALIZED

#### A. Cá nhân hóa Challenges
```javascript
// Tạo challenges dựa vào focus_skills
if (focus_skills.includes('speaking')) {
  challenges = [
    'Complete 5 speaking exercises today',
    'Practice pronunciation for 15 minutes',
    'Record yourself speaking for 2 minutes'
  ];
}
```

#### B. Rewards phù hợp
```javascript
// Dựa vào goal
const rewards = {
  'study_abroad': 'IELTS Band Score Prediction',
  'career': 'Business English Certificate',
  'graduation': 'University English Test Prep'
};
```

---

### 5️⃣ AI CHATBOT PERSONALIZED

#### A. Context-aware conversations
```javascript
// Khi user chat với AI, gửi context:
POST /api/ai/chat
Body: {
  message: "Help me practice speaking",
  context: {
    goal: user.learning_preferences.goal,
    current_level: user.learning_preferences.current_level,
    focus_skills: user.learning_preferences.focus_skills
  }
}

// AI response điều chỉnh theo level:
// - stranger: Câu hỏi đơn giản, từ vựng cơ bản
// - close_friend: Câu hỏi phức tạp, từ vựng nâng cao
```

---

## 📊 KẾ HOẠCH TRIỂN KHAI

### Phase 1: Basic Personalization (1-2 ngày)
- [ ] Hiển thị learning_preferences trong Dashboard
- [ ] Lời chào cá nhân hóa
- [ ] Filter nội dung theo focus_skills

### Phase 2: Content Recommendations (2-3 ngày)
- [ ] Gợi ý bài tập phù hợp
- [ ] Điều chỉnh độ khó theo level
- [ ] Daily practice suggestions

### Phase 3: AI-driven Roadmap (3-5 ngày)
- [ ] API generate roadmap từ AI
- [ ] Lưu roadmap vào database
- [ ] UI hiển thị progress tracker
- [ ] Weekly/monthly goals

### Phase 4: Advanced Features (1 tuần)
- [ ] Adaptive learning (AI điều chỉnh độ khó real-time)
- [ ] Performance analytics
- [ ] Personalized challenges
- [ ] Smart notifications

---

## 🔧 CODE EXAMPLES

### 1. Dashboard Personalization

#### `Dashboard.jsx` - Show personalized greeting
```jsx
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const prefs = user?.learning_preferences || {};
  
  // Map values to Vietnamese
  const goalNames = {
    'study_abroad': 'Du học',
    'career': 'Phát triển sự nghiệp',
    'graduation': 'Tốt nghiệp',
    'passion': 'Đam mê học',
    'other': 'Mục tiêu khác'
  };
  
  const levelNames = {
    'stranger': 'Mới bắt đầu',
    'old_friend': 'Trung bình',
    'learning': 'Đang học',
    'close_friend': 'Nâng cao'
  };
  
  const skillNames = {
    'writing': 'Viết',
    'speaking': 'Nói',
    'listening': 'Nghe',
    'all': 'Tất cả kỹ năng'
  };

  return (
    <div>
      {/* Personalized Header */}
      <div className="bg-gradient-to-r from-purple-500 to-cyan-500 p-6 rounded-lg text-white">
        <h1 className="text-3xl font-bold">
          👋 Chào {user?.user_name}!
        </h1>
        
        {prefs.goal && (
          <div className="mt-4 space-y-2">
            <p className="flex items-center gap-2">
              🎯 <span className="font-semibold">Mục tiêu:</span> 
              {goalNames[prefs.goal]}
            </p>
            
            {prefs.current_level && (
              <p className="flex items-center gap-2">
                📊 <span className="font-semibold">Trình độ:</span> 
                {levelNames[prefs.current_level]}
              </p>
            )}
            
            {prefs.focus_skills?.length > 0 && (
              <p className="flex items-center gap-2">
                🎯 <span className="font-semibold">Tập trung:</span> 
                {prefs.focus_skills.map(s => skillNames[s]).join(', ')}
              </p>
            )}
            
            {prefs.study_hours_per_week && (
              <p className="flex items-center gap-2">
                ⏰ <span className="font-semibold">Thời gian học:</span> 
                {prefs.study_hours_per_week} giờ/tuần
              </p>
            )}
          </div>
        )}
      </div>

      {/* Recommended Exercises */}
      <RecommendedExercises preferences={prefs} />
    </div>
  );
}
```

#### `RecommendedExercises.jsx` - Filter by focus_skills
```jsx
export default function RecommendedExercises({ preferences }) {
  const { focus_skills = [], current_level } = preferences;
  
  // Hiển thị Speaking nếu focus là speaking
  const showSpeaking = focus_skills.includes('speaking') || focus_skills.includes('all');
  const showWriting = focus_skills.includes('writing') || focus_skills.includes('all');
  
  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-2xl font-bold">📚 Bài tập được đề xuất cho bạn</h2>
      
      {showSpeaking && (
        <div className="border p-4 rounded">
          <h3 className="text-xl font-semibold">🎤 Speaking Practice</h3>
          {/* Fetch speaking questions filtered by level */}
        </div>
      )}
      
      {showWriting && (
        <div className="border p-4 rounded">
          <h3 className="text-xl font-semibold">✍️ Writing Practice</h3>
          {/* Fetch writing prompts filtered by level */}
        </div>
      )}
    </div>
  );
}
```

---

### 2. AI Roadmap Generator

#### Backend: `aiRoadmapController.js`
```javascript
const OpenAI = require('openai');
const User = require('../models/User');

exports.generateRoadmap = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    const { goal, current_level, focus_skills, study_hours_per_week } = 
      user.learning_preferences;

    // Gọi OpenAI để generate roadmap
    const prompt = `
Create a 12-week IELTS learning roadmap for a student with:
- Goal: ${goal}
- Current level: ${current_level}
- Focus skills: ${focus_skills.join(', ')}
- Study hours per week: ${study_hours_per_week}

Return a JSON array with weekly plan including:
- Week number
- Topics to cover
- Specific exercises
- Estimated hours

Format: 
[
  {
    "week": 1,
    "topics": ["..."],
    "exercises": ["..."],
    "hours": 5
  }
]
    `;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an IELTS learning expert.' },
        { role: 'user', content: prompt }
      ]
    });

    const roadmap = JSON.parse(response.choices[0].message.content);

    // Lưu roadmap vào user
    user.learning_roadmap = roadmap;
    await user.save();

    return res.json({
      success: true,
      roadmap
    });
  } catch (error) {
    console.error('Error generating roadmap:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate roadmap'
    });
  }
};
```

---

### 3. Progress Tracker UI

#### `ProgressTracker.jsx`
```jsx
export default function ProgressTracker() {
  const { user } = useAuth();
  const roadmap = user?.learning_roadmap || [];
  
  const calculateProgress = (week) => {
    // Tính % hoàn thành dựa vào exercises completed
    // (cần thêm tracking logic)
    return 0;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">🗓️ Lộ trình học của bạn</h2>
      
      {roadmap.map((week, index) => {
        const progress = calculateProgress(week.week);
        const isCompleted = progress === 100;
        const isCurrent = progress > 0 && progress < 100;
        
        return (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {isCompleted && '✅ '}
                {isCurrent && '🔄 '}
                {!isCompleted && !isCurrent && '⏳ '}
                Tuần {week.week}
              </h3>
              <span className="text-sm text-gray-600">
                {week.hours} giờ
              </span>
            </div>
            
            <p className="text-gray-700 mt-2">
              {week.topics.join(', ')}
            </p>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

---

## 🎯 TÓM TẮT

Sau khi thu thập onboarding:

1. **Dashboard:** Hiển thị thông tin cá nhân hóa
2. **Content:** Filter/gợi ý bài tập phù hợp
3. **AI Roadmap:** Generate lộ trình học 12 tuần
4. **Progress:** Track tiến độ học tập
5. **Gamification:** Tạo challenges phù hợp
6. **Chatbot:** AI response dựa trên level/goal

**Bắt đầu từ Phase 1** - personalized greeting và content filtering!
