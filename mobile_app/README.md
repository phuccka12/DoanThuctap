# IELTS Learning Mobile App

Mobile app Flutter cho nền tảng học IELTS với AI

## 🚀 Setup

### 1. Cài đặt Flutter SDK

**Windows:**
```powershell
# Tải Flutter từ: https://docs.flutter.dev/get-started/install/windows
# Hoặc dùng winget:
winget install Google.Flutter
```

**Sau khi cài xong, chạy:**
```powershell
flutter doctor
```

### 2. Cài dependencies

```powershell
cd mobile_app
flutter pub get
```

### 3. Chạy app

**Android Emulator:**
```powershell
flutter run
```

**iOS Simulator (chỉ trên Mac):**
```powershell
flutter run -d ios
```

**Web:**
```powershell
flutter run -d chrome
```

## 📱 Cấu hình API

Mở file `lib/services/api_service.dart` và đổi `baseUrl`:

- **Android Emulator:** `http://10.0.2.2:3000/api/v1`
- **iOS Simulator:** `http://localhost:3000/api/v1`
- **Physical Device:** `http://YOUR_COMPUTER_IP:3000/api/v1` (ví dụ: `http://192.168.1.146:3000/api/v1`)

## 🎨 Features

✅ **Hoàn thành:**
- Dark theme với purple-blue gradient
- Login screen với password toggle
- Register screen với validation
- AuthProvider với JWT token management
- API service để call Node.js backend
- Persistent login với SharedPreferences

🔄 **Đang làm:**
- Dashboard screen
- Navigation với GoRouter
- Speaking screen
- Writing screen

## 📦 Dependencies

- `provider` - State management
- `http` - API calls
- `shared_preferences` - Local storage
- `google_fonts` - Custom fonts
- `go_router` - Navigation

## 🏗️ Project Structure

```
lib/
├── constants/
│   ├── app_colors.dart      # Màu sắc dark theme
│   └── app_theme.dart       # Theme configuration
├── models/
│   └── user.dart            # User model
├── providers/
│   └── auth_provider.dart   # Auth state management
├── screens/
│   ├── login_screen.dart    # Màn hình đăng nhập
│   └── register_screen.dart # Màn hình đăng ký
├── services/
│   └── api_service.dart     # API client
├── widgets/                 # Reusable widgets
└── main.dart               # Entry point
```

## 🔧 Troubleshooting

**Lỗi "Flutter not found":**
```powershell
# Add Flutter to PATH
$env:Path += ";C:\path\to\flutter\bin"
```

**Lỗi kết nối API:**
- Kiểm tra backend Node.js đang chạy trên port 3000
- Đổi IP trong `api_service.dart` nếu test trên physical device
- Đảm bảo máy tính và điện thoại cùng mạng WiFi

## 📞 API Endpoints

- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/register` - Đăng ký
- `GET /api/v1/auth/profile` - Lấy thông tin user
- `POST /api/v1/auth/logout` - Đăng xuất
