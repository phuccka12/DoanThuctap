# 🎯 Onboarding Flow - IELTS Coach (Professional Design)

## ✨ Tổng quan

Hệ thống Onboarding **5 bước** với thiết kế **Professional & Clean**, theo phong cách Dashboard hiện tại:
- ✅ **Bỏ emoji AI robot** → Dùng **Icon Vector** chuyên nghiệp (React Icons)
- ✅ **Bỏ dark mode** → Dùng **Light mode** với gradient tím-trắng-tím nhạt
- ✅ **Card-based UI** → White cards, border-2, shadow-lg
- ✅ **Màu sắc Dashboard** → `#6C5CE7` (Tím) + `#00CEC9` (Cyan)

---

## 🎨 Design System

### **Màu sắc chính** (Giống Dashboard):
```css
Primary: #6C5CE7 (Tím)
Secondary: #00CEC9 (Cyan)
Accent: #A29BFE (Tím nhạt)
Success: #00B894 (Xanh lá)
Warning: #FDCB6E (Vàng)
Danger: #E84393 (Hồng đậm)

Background: bg-gradient-to-br from-purple-50 via-white to-violet-50
Card: bg-white border-2 border-purple-100 shadow-lg
Text: text-gray-800 (Heading), text-gray-600 (Body)
```

### **Typography**:
- **H1**: text-3xl/4xl font-bold text-gray-800
- **H2/Subtitle**: text-lg text-gray-600
- **Card Title**: text-xl font-bold text-gray-800
- **Card Subtitle**: text-sm text-gray-600

### **Components**:
- **Icon Box**: w-16 h-16, rounded-xl, bg-gradient-to-r, shadow-md
- **Check Icon**: w-8 h-8, rounded-full, gradient hoặc border-2
- **Button Primary**: px-10 py-4, gradient from-[#6C5CE7] to-[#00CEC9]
- **Button Secondary**: hover:bg-gray-100, text-gray-600

---

## 📱 Các màn hình Onboarding

### **Màn 1: Mục tiêu học tập**
📁 **File**: `OnboardingStep1.jsx`  
🎨 **Header Icon**: `FaGraduationCap` (gradient tím-cyan)  
📝 **Title**: "Mục tiêu học tập của bạn"  
📄 **Subtitle**: "Hãy cho chúng tôi biết lý do bạn muốn học IELTS để tạo lộ trình phù hợp nhất"

**5 Cards:**
| Icon Vector | Title | Subtitle | Gradient |
|-------------|-------|----------|----------|
| `FaGlobeAmericas` | Du học / Định cư | Chuẩn bị IELTS Academic cho các kỳ thi quan trọng | Tím → Cyan |
| `FaBriefcase` | Công việc / Thăng tiến | Nâng cao tiếng Anh chuyên nghiệp trong môi trường làm việc | Tím nhạt → Tím |
| `FaGraduationCap` | Xét tốt nghiệp | Đạt chứng chỉ đầu ra theo yêu cầu của trường | Cyan → Xanh |
| `FaHeart` | Đam mê ngôn ngữ | Học để giao tiếp, xem phim, đọc sách tiếng Anh tự nhiên | Hồng → Cam |
| `FaRocket` | Mục tiêu khác | Nâng cao trình độ tiếng Anh toàn diện và đa dạng | Vàng → Cam |

---

### **Màn 2: Trình độ hiện tại**
📁 **File**: `OnboardingStep2.jsx`  
🎨 **Header Icon**: `FaUserGraduate` (gradient tím nhạt)  
📝 **Title**: "Trình độ hiện tại của bạn"  
📄 **Subtitle**: "Đánh giá mức độ tiếng Anh hiện tại để chúng tôi tạo lộ trình phù hợp"

**4 Cards:**
| Icon Vector | Title | Subtitle | Gradient |
|-------------|-------|----------|----------|
| `FaSeedling` | Mới bắt đầu | Chưa có kiến thức nền tảng hoặc đã lâu không sử dụng | Xanh lá nhạt → Xanh lá |
| `FaBook` | Cơ bản | Đã học ở trường nhưng kiến thức còn rời rạc, chưa vững | Xanh dương nhạt → Xanh dương |
| `FaUserGraduate` | Trung bình | Đang tự học, có nền tảng nhưng cần cải thiện nhiều hơn | Tím nhạt → Tím |
| `FaFire` | Khá tốt | Đã có trình độ ổn định, muốn luyện thi để đạt band cao | Hồng nhạt → Hồng đậm |

---

### **Màn 3: Kỹ năng cần cải thiện**
📁 **File**: `OnboardingStep3.jsx`  
🎨 **Header Icon**: `FaLayerGroup` (gradient cyan)  
📝 **Title**: "Kỹ năng cần cải thiện"  
📄 **Subtitle**: "Chọn kỹ năng bạn muốn tập trung để chúng tôi tạo bài tập phù hợp"

**4 Cards:**
| Icon Vector | Title | Subtitle | Gradient |
|-------------|-------|----------|----------|
| `FaPenFancy` | Writing (Viết) | Cần cải thiện cấu trúc bài viết, từ vựng học thuật và ngữ pháp | Tím → Tím nhạt |
| `FaMicrophoneAlt` | Speaking (Nói) | Cần luyện phát âm, tăng độ tự tin và phản xạ trong giao tiếp | Cyan → Xanh |
| `FaHeadphones` | Listening (Nghe) | Cần cải thiện khả năng bắt từ, nghe hiểu và ghi chép nhanh | Vàng → Cam |
| `FaLayerGroup` | Tất cả kỹ năng | Cần lộ trình toàn diện để cải thiện đồng đều cả 4 kỹ năng | Hồng → Đỏ |

---

### **Màn 4: Thời gian học mỗi ngày**
📁 **File**: `OnboardingStep4.jsx`  
🎨 **Header Icon**: `FaClock` (gradient vàng-cam)  
📝 **Title**: "Thời gian học mỗi ngày"  
📄 **Subtitle**: "Chọn thời lượng phù hợp với lịch trình của bạn để tối ưu hiệu quả học tập"

**3 Cards:**
| Icon Vector | Title | Subtitle | Gradient |
|-------------|-------|----------|----------|
| `FaClock` | 15-20 phút/ngày | Phù hợp cho người bận rộn, học tranh thủ giữa các công việc | Xanh lá nhạt → Xanh lá |
| `FaRegClock` | 30-45 phút/ngày | Tiến độ đều đặn, cân bằng giữa học tập và cuộc sống | Xanh dương nhạt → Xanh dương |
| `FaBolt` | 60+ phút/ngày | Học cường độ cao, phù hợp cho mục tiêu thi gấp hoặc nâng band nhanh | Hồng → Đỏ |

---

### **Màn 5: Đánh giá nhanh (Optional)**
📁 **File**: `OnboardingStep5.jsx`  
🎨 **Header Icon**: `FaClipboardList` (gradient tím)  
📝 **Title**: "Đánh giá nhanh trình độ"  
📄 **Subtitle**: "Hoàn thành 5 câu hỏi ngắn để chúng tôi đánh giá chính xác trình độ của bạn"

**2 Options:**

#### **Option 1: Bắt đầu đánh giá** (Primary Card)
- Icon: `FaArrowRight` (gradient tím-cyan, size lớn)
- Title: "Bắt đầu đánh giá"
- Subtitle: "Chỉ mất 2 phút • Giúp tạo lộ trình chính xác hơn"
- Badge: "Khuyên dùng" (bg-[#6C5CE7]/10)

#### **Option 2: Bỏ qua** (Secondary Card)
- Text: "Bỏ qua, tôi muốn vào Dashboard ngay"
- Style: border-gray-200, hover:border-gray-300

#### **Game Screen** (Nếu chọn Option 1):
- **Progress Bar**: Gradient tím-cyan, rounded-full
- **Question Card**: White bg, border-2 border-purple-100, shadow-lg
- **4 Options**: A/B/C/D với box vuông gradient (gray → green/orange khi feedback)
- **Feedback**:
  - ✅ Correct: Green bg, `FaCheckCircle`, "Chính xác!"
  - ⚠️ Wrong: Orange bg, `FaTimesCircle`, "Chưa đúng, nhưng không sao!"

---

### **Màn 6: Tổng kết lộ trình**
📁 **File**: `OnboardingSummary.jsx`  
🎨 **Header Icon**: `FaTrophy` (gradient tím-cyan, **animate-bounce**)  
📝 **Title**: "Hoàn thành!"  
📄 **Subtitle**: "Chúng tôi đã tạo lộ trình học tập dành riêng cho [Username]"

**Summary Grid (2x2 Cards):**

| Icon | Label | Content | Gradient |
|------|-------|---------|----------|
| `FaBullseye` | MỤC TIÊU | Du học / Định cư<br/>Target: Band 7.0 | Tím → Tím nhạt |
| `FaCalendarAlt` | THỜI GIAN | 3-4 tháng<br/>30-45 phút/ngày | Cyan → Xanh |
| `FaChartLine` | TRỌNG TÂM | Speaking (Nói)<br/>Ưu tiên cải thiện | Hồng → Đỏ |
| `FaStar` | TRÌNH ĐỘ | Trung bình<br/>Đánh giá: 4/5 đúng | Vàng → Cam |

**Info Box:**
- Icon: 💡 (emoji nhỏ)
- Background: `bg-gradient-to-r from-[#A29BFE]/10 to-[#00CEC9]/10`
- Border: `border-2 border-[#A29BFE]/20`
- Text: "**AI Coach** sẽ đồng hành cùng bạn trong suốt hành trình học tập..."

**CTA Button:**
- Text: "Bắt đầu học ngay"
- Icon: `FaTrophy` (bên phải)
- Style: `px-12 py-5 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9]`
- Hover: `hover:shadow-[#6C5CE7]/50 hover:scale-105`

---

## 🛠️ Technical Details

### **File Structure:**
```
client-web/src/
├── components/Onboarding/
│   ├── OnboardingStep1.jsx   ✅ Redesigned
│   ├── OnboardingStep2.jsx   ✅ Redesigned
│   ├── OnboardingStep3.jsx   ✅ Redesigned
│   ├── OnboardingStep4.jsx   ✅ Redesigned
│   ├── OnboardingStep5.jsx   ✅ Redesigned
│   └── OnboardingSummary.jsx ✅ Redesigned
├── pages/
│   └── Onboarding.jsx         ✅ Updated (light background)
```

### **Dependencies:**
```json
{
  "react-icons": "^4.x" // FaXxx icons
}
```

### **API Endpoint:**
```javascript
POST /api/onboarding
Body: {
  goal: "study_abroad",
  background: "learning",
  painPoint: "speaking",
  timeCommitment: "moderate",
  assessmentCompleted: true,
  score: 4,
  totalQuestions: 5
}
```

---

## 🎯 Key Improvements

### **Before (Old Design)**:
- ❌ Dark mode với background tối
- ❌ Emoji robot AI 🤖👋
- ❌ Speech bubble chat style
- ❌ Playful tone ("chill chill", "khoai")
- ❌ Emoji trong cards (🌱💼🎓✨🚀)

### **After (New Design)**:
- ✅ Light mode với gradient nhẹ nhàng (giống Dashboard)
- ✅ Icon Vector chuyên nghiệp (React Icons)
- ✅ Header icon trong box gradient vuông
- ✅ Professional tone
- ✅ Card design sạch sẽ với border + shadow

---

## 🚀 Cách test

### **1. Khởi động server + client:**
```bash
# Terminal 1
cd server
npm start

# Terminal 2
cd client-web
npm run dev
```

### **2. Test flow:**
1. Đăng ký tài khoản mới
2. Auto redirect → `/onboarding`
3. Làm đủ 5 bước (hoặc bỏ qua mini-game)
4. Xem màn tổng kết professional
5. Nhấn "Bắt đầu học ngay" → Dashboard

### **3. Verify:**
- UI nhìn giống Dashboard (màu sắc, typography, spacing)
- Không có emoji AI robot
- Cards có icon vector đẹp mắt
- Hover effects mượt mà
- Responsive trên mobile

---

## 📸 Screenshots Mô phỏng

```
┌──────────────────────────────────────┐
│  [🎓 Icon trong box gradient tím]    │
│                                      │
│  Mục tiêu học tập của bạn           │
│  Hãy cho chúng tôi biết lý do...    │
│                                      │
│  ┌─────────────────────────────┐    │
│  │ [🌐] Du học / Định cư      ✓│    │ ← Selected
│  │  Chuẩn bị IELTS Academic... │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ [💼] Công việc / Thăng tiến ○│    │
│  └─────────────────────────────┘    │
│  ...                                │
│                                      │
│            [Tiếp theo →]            │
└──────────────────────────────────────┘
```

---

## 📝 Notes

- **Lint warnings** về `bg-gradient-to-*` có thể ignore (Tailwind v3 hợp lệ)
- **Animation** chỉ dùng ở màn tổng kết (trophy bounce)
- **Responsive**: Tất cả cards đều responsive với `sm:` prefix
- **Accessibility**: Buttons có proper hover/active states

---

**Version**: 2.0.0 (Professional Redesign)  
**Updated**: 10/01/2026  
**Design Language**: Dashboard-aligned, Clean & Professional
