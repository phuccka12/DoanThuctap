# 🚀 Hướng Dẫn Kết Nối API Backend - IELTS Mobile App

## 📋 Tổng Quan
Mobile app đã được tích hợp đầy đủ với backend API. Dưới đây là hướng dẫn chi tiết để chạy và test ứng dụng.

---

## ⚙️ Cấu Hình API URL

### 1. **Xác định môi trường test của bạn**

File cấu hình: `lib/constants/api_constants.dart`

```dart
static const String baseUrl = _androidEmulatorUrl; // Thay đổi dòng này
```

**Các tùy chọn:**

| Môi trường | Giá trị | Khi nào dùng |
|------------|---------|--------------|
| Android Emulator | `_androidEmulatorUrl` | Test trên Android Emulator |
| iOS Simulator | `_iosSimulatorUrl` | Test trên iOS Simulator |
| Physical Device | `_physicalDeviceUrl` | Test trên điện thoại thật |

### 2. **Nếu test trên điện thoại thật**

**Bước 1:** Tìm IP của máy tính
```powershell
# Windows PowerShell
ipconfig
# Tìm "IPv4 Address" của WiFi Adapter (ví dụ: 192.168.1.146)
```

**Bước 2:** Cập nhật trong `api_constants.dart`
```dart
static const String _physicalDeviceUrl = 'http://192.168.1.146:8000'; // IP của bạn
static const String baseUrl = _physicalDeviceUrl; // Chọn physical device
```

**Lưu ý:** Máy tính và điện thoại phải cùng mạng WiFi!

---

## 🖥️ Khởi Động Backend Server

### 1. **Kiểm tra server đang chạy chưa**

```powershell
cd d:\ĐỒ ÁN THỰC TẬP\Doantotnghiep\server
```

### 2. **Khởi động server** (nếu chưa chạy)

```powershell
npm start
# hoặc
node server.js
```

**Kiểm tra:** Mở trình duyệt và truy cập `http://localhost:8000`
- Bạn sẽ thấy: "Server is running"

### 3. **Xem log để debug**
Server sẽ hiển thị tất cả API requests trong terminal.

---

## 📱 Chạy Mobile App

### 1. **Cài đặt dependencies** (nếu chưa cài)

```powershell
cd d:\ĐỒ ÁN THỰC TẬP\Doantotnghiep\mobile_app
flutter pub get
```

### 2. **Chạy app**

**Android Emulator:**
```powershell
flutter run
```

**iOS Simulator:**
```powershell
flutter run
```

**Physical Device:**
```powershell
flutter devices  # Xem danh sách thiết bị
flutter run -d <device-id>
```

---

## 🧪 Test Chức Năng

### ✅ Test Đăng Ký (Register)

1. Mở app trên thiết bị
2. Nhấn "Đăng ký ngay"
3. Điền thông tin:
   - **Tên người dùng:** testuser123
   - **Email:** test@example.com
   - **Mật khẩu:** password123
   - **Xác nhận mật khẩu:** password123
4. Nhấn "Đăng ký"

**Kết quả mong đợi:**
- ✅ Thông báo "Đăng ký thành công!"
- ✅ Tự động quay về màn hình đăng nhập (hoặc vào Dashboard)

### ✅ Test Đăng Nhập (Login)

1. Điền thông tin tài khoản vừa tạo:
   - **Email:** test@example.com
   - **Mật khẩu:** password123
2. Nhấn "Đăng nhập"

**Kết quả mong đợi:**
- ✅ Thông báo "Đăng nhập thành công!"
- ✅ Vào màn hình Dashboard (TODO: chưa có)

---

## 🐛 Troubleshooting

### ❌ Lỗi: "Lỗi kết nối. Vui lòng thử lại."

**Nguyên nhân:** App không kết nối được đến server

**Giải pháp:**

1. **Kiểm tra server đã chạy chưa:**
   ```powershell
   # Terminal khác
   curl http://localhost:8000
   ```

2. **Kiểm tra API URL trong app:**
   - Mở `lib/constants/api_constants.dart`
   - Xác nhận `baseUrl` đúng với môi trường test

3. **Nếu dùng Android Emulator:**
   - Phải dùng `10.0.2.2` thay vì `localhost`
   - Đảm bảo: `baseUrl = _androidEmulatorUrl`

4. **Nếu dùng Physical Device:**
   - Kiểm tra IP máy tính: `ipconfig`
   - Cập nhật `_physicalDeviceUrl` với IP đúng
   - Đảm bảo cùng mạng WiFi

### ❌ Lỗi: "Đăng ký thất bại" / "Đăng nhập thất bại"

**Nguyên nhân:** Backend trả về lỗi

**Giải pháp:**

1. **Xem log trong terminal chạy server:**
   - Backend sẽ in ra lỗi chi tiết

2. **Kiểm tra định dạng dữ liệu:**
   - Email phải đúng format: `test@example.com`
   - Password tối thiểu 6 ký tự
   - Username không được trống

3. **Test API trực tiếp với Postman/cURL:**
   ```powershell
   # Test register
   curl -X POST http://localhost:8000/api/auth/register `
     -H "Content-Type: application/json" `
     -d '{\"user_name\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"password123\"}'
   ```

### ❌ Lỗi: Hot Reload không hoạt động sau khi sửa code

**Giải pháp:**
```powershell
# Stop app và chạy lại
flutter run
```

---

## 📊 Kiến Trúc API

### Các Endpoint Đã Tích Hợp:

| Endpoint | Method | Mô Tả |
|----------|--------|-------|
| `/api/auth/register` | POST | Đăng ký tài khoản mới |
| `/api/auth/login` | POST | Đăng nhập |
| `/api/auth/logout` | POST | Đăng xuất |
| `/api/auth/profile` | GET | Lấy thông tin user |
| `/api/users/profile` | PUT | Cập nhật profile |

### Flow Đăng Nhập:

1. **User nhập email/password** → `LoginScreen`
2. **Call API** → `AuthProvider.login()`
3. **API Service** → `ApiService.login()`
4. **Backend xử lý** → Trả về `accessToken`, `refreshToken`, `user`
5. **Lưu local** → `SharedPreferences`
6. **Update UI** → `notifyListeners()`

---

## 🔐 Authentication Flow

### Token Management:

- **Access Token:** Lưu trong memory (`AuthProvider._accessToken`)
- **Refresh Token:** Lưu trong `SharedPreferences`
- **User Data:** Lưu trong `SharedPreferences` dạng JSON

### Auto-Login:

Khi mở app:
1. `AuthProvider` load token từ `SharedPreferences`
2. Nếu có token → Verify với backend (`fetchUser()`)
3. Nếu valid → Tự động đăng nhập
4. Nếu expired → Yêu cầu đăng nhập lại

---

## 📝 Các File Quan Trọng

```
mobile_app/
├── lib/
│   ├── constants/
│   │   └── api_constants.dart        # ⚙️ Cấu hình API URLs
│   ├── services/
│   │   └── api_service.dart          # 🌐 HTTP API calls
│   ├── providers/
│   │   └── auth_provider.dart        # 🔐 State management
│   ├── screens/
│   │   ├── login_screen.dart         # 📱 UI đăng nhập
│   │   └── register_screen.dart      # 📱 UI đăng ký
│   ├── models/
│   │   └── user.dart                 # 👤 User model
│   └── main.dart                     # 🚀 Entry point + Provider setup
```

---

## 🎯 Next Steps (TODO)

- [ ] Tạo Dashboard screen sau khi đăng nhập thành công
- [ ] Implement logout functionality
- [ ] Add auto-refresh token
- [ ] Add loading indicators
- [ ] Handle network errors better
- [ ] Add form validation
- [ ] Implement "Remember Me"
- [ ] Add biometric authentication

---

## 💡 Tips

1. **Debug Network Calls:**
   ```dart
   // Thêm vào api_service.dart để log requests
   print('API Call: ${response.request?.url}');
   print('Response: ${response.body}');
   ```

2. **Clear App Data:**
   ```powershell
   # Xóa cache và data để test lại từ đầu
   flutter clean
   flutter pub get
   flutter run
   ```

3. **Monitor Backend:**
   - Luôn mở terminal chạy server để xem log
   - Backend sẽ hiển thị mọi request nhận được

---

## 📞 Support

Nếu gặp vấn đề:
1. Check console logs trong terminal
2. Check backend server logs
3. Verify API URL configuration
4. Test API với Postman/cURL trước

**Happy Coding! 🚀**
