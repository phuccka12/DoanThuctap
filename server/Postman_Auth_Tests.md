# 🧪 POSTMAN - HƯỚNG DẪN TEST AUTHENTICATION

## ✅ **CHECKLIST - Các tính năng đã hoàn thiện**

### **Core Authentication:**
- ✅ Register (Đăng ký)
- ✅ Login (Đăng nhập)
- ✅ Get Me (Lấy thông tin user)
- ✅ Refresh Token (Làm mới token)
- ✅ Logout (Đăng xuất)

### **Security Features:**
- ✅ JWT Token với expiry
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting (chống spam)
- ✅ Input validation (Zod)
- ✅ Account lock (5 lần sai → khóa 15 phút)
- ✅ Auto downgrade VIP khi hết hạn

### **Extra Features:**
- ✅ Verify Email (request + confirm)
- ✅ Forgot Password
- ✅ Reset Password
- ✅ Gamification system (level, gold, exp, streak)

---

## 🚀 **TEST API - POSTMAN REQUESTS**

### **Base URL:**
```
http://localhost:3000/api/auth
```

---

## **1️⃣ REGISTER (Đăng ký)**

```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "user_name": "Nguyen Van A",
  "email": "nguyenvana@gmail.com",
  "password": "123456"
}
```

### **Expected Response (201):**
```json
{
  "message": "Đăng ký thành công",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "677...",
    "user_name": "Nguyen Van A",
    "email": "nguyenvana@gmail.com",
    "role": "standard",
    "vip_expire_at": null,
    "gamification_data": {
      "level": 1,
      "gold": 0,
      "exp": 0,
      "streak": 0
    }
  }
}
```

### **Error Cases:**
```json
// 400 - Thiếu thông tin
{
  "message": "Vui lòng nhập đủ user_name, email, mật khẩu"
}

// 400 - Password quá ngắn
{
  "message": "Mật khẩu tối thiểu 6 ký tự"
}

// 409 - Email đã tồn tại
{
  "message": "Email đã tồn tại"
}
```

---

## **2️⃣ LOGIN (Đăng nhập)**

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "nguyenvana@gmail.com",
  "password": "123456"
}
```

### **Expected Response (200):**
```json
{
  "message": "Đăng nhập thành công",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "677...",
    "user_name": "Nguyen Van A",
    "email": "nguyenvana@gmail.com",
    "role": "standard",
    "vip_expire_at": null,
    "gamification_data": {
      "level": 1,
      "gold": 0,
      "exp": 0,
      "streak": 0
    }
  }
}
```

### **Error Cases:**
```json
// 401 - Sai mật khẩu
{
  "message": "Sai email hoặc mật khẩu"
}

// 423 - Tài khoản bị khóa
{
  "message": "Tài khoản tạm khóa do đăng nhập sai nhiều lần. Thử lại sau."
}
```

---

## **3️⃣ GET ME (Lấy thông tin user)**

```http
GET http://localhost:3000/api/auth/me
Authorization: Bearer <your_token_here>
```

### **Expected Response (200):**
```json
{
  "user": {
    "id": "677...",
    "user_name": "Nguyen Van A",
    "email": "nguyenvana@gmail.com",
    "role": "standard",
    "status": "active",
    "vip_expire_at": null,
    "email_verified": false,
    "gamification_data": {
      "level": 1,
      "gold": 0,
      "exp": 0,
      "streak": 0
    },
    "last_login_at": "2026-01-02T10:30:00.000Z",
    "created_at": "2026-01-02T10:00:00.000Z"
  }
}
```

### **Error Cases:**
```json
// 401 - Không có token
{
  "success": false,
  "message": "Not authorized, no token"
}

// 401 - Token không hợp lệ
{
  "success": false,
  "message": "Not authorized, token failed"
}

// 404 - User không tồn tại
{
  "message": "Người dùng không tồn tại"
}
```

---

## **4️⃣ REFRESH TOKEN (Làm mới token)**

```http
POST http://localhost:3000/api/auth/refresh
Authorization: Bearer <old_token>
```

### **Expected Response (200):**
```json
{
  "message": "Làm mới token thành công",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "677...",
    "user_name": "Nguyen Van A",
    "email": "nguyenvana@gmail.com",
    "role": "standard",
    "vip_expire_at": null,
    "gamification_data": {
      "level": 1,
      "gold": 0,
      "exp": 0,
      "streak": 0
    }
  }
}
```

---

## **5️⃣ VERIFY EMAIL (Request)**

```http
POST http://localhost:3000/api/auth/verify-email/request
Authorization: Bearer <your_token>
```

### **Expected Response (200):**
```json
{
  "message": "Đã gửi email xác minh"
}
```

### **Check Console Log:**
Server sẽ log ra:
```
==== EMAIL DEV MODE ====
To: nguyenvana@gmail.com
Subject: Xác minh email
Content: Click để xác minh email: <a href="http://localhost:5173/verify-email?token=abc123...">Link</a>
========================
```

**→ Copy token từ console để dùng cho bước tiếp theo!**

---

## **6️⃣ VERIFY EMAIL (Confirm)**

```http
POST http://localhost:3000/api/auth/verify-email/confirm
Content-Type: application/json

{
  "token": "abc123... (token từ console log)"
}
```

### **Expected Response (200):**
```json
{
  "message": "Xác minh email thành công"
}
```

---

## **7️⃣ FORGOT PASSWORD**

```http
POST http://localhost:3000/api/auth/forgot-password
Content-Type: application/json

{
  "email": "nguyenvana@gmail.com"
}
```

### **Expected Response (200):**
```json
{
  "message": "Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu."
}
```

### **Check Console Log:**
```
==== EMAIL DEV MODE ====
To: nguyenvana@gmail.com
Subject: Đặt lại mật khẩu
Content: Click để đặt lại mật khẩu: <a href="http://localhost:5173/reset-password?token=xyz789...">Link</a>
========================
```

---

## **8️⃣ RESET PASSWORD**

```http
POST http://localhost:3000/api/auth/reset-password
Content-Type: application/json

{
  "token": "xyz789... (token từ console)",
  "new_password": "newpassword123"
}
```

### **Expected Response (200):**
```json
{
  "message": "Đặt lại mật khẩu thành công"
}
```

---

## **9️⃣ LOGOUT**

```http
POST http://localhost:3000/api/auth/logout
```

### **Expected Response (200):**
```json
{
  "message": "Đăng xuất thành công"
}
```

---

## **🔟 LOGOUT ALL DEVICES**

```http
POST http://localhost:3000/api/auth/logout-all
Authorization: Bearer <your_token>
```

### **Expected Response (200):**
```json
{
  "message": "Đăng xuất khỏi tất cả thiết bị thành công"
}
```

---

## 🛡️ **SECURITY FEATURES TESTING**

### **Rate Limiting:**
```
Register: 10 requests/hour
Login: 30 requests/15 minutes
Forgot Password: 10 requests/hour
```

**Test:** Gửi request liên tục quá limit → Nhận lỗi:
```json
{
  "message": "Quá nhiều lần đăng ký, thử lại sau."
}
```

### **Account Lock:**
**Test:** Đăng nhập sai 5 lần liên tiếp → Tài khoản bị khóa 15 phút

### **Input Validation:**
**Test:** Gửi data không hợp lệ:
```json
{
  "email": "not-an-email",
  "password": "123"  // < 6 ký tự
}
```

**Response:**
```json
{
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    {
      "field": "body.email",
      "message": "Invalid email"
    },
    {
      "field": "body.password",
      "message": "String must contain at least 6 character(s)"
    }
  ]
}
```

---

## ✅ **TESTING CHECKLIST**

- [ ] ✅ Register với email mới → Thành công
- [ ] ✅ Register với email trùng → Lỗi 409
- [ ] ✅ Register với password < 6 ký tự → Lỗi 400
- [ ] ✅ Login với thông tin đúng → Nhận token
- [ ] ✅ Login với password sai → Lỗi 401
- [ ] ✅ Get Me với token hợp lệ → Nhận thông tin user
- [ ] ✅ Get Me không có token → Lỗi 401
- [ ] ✅ Refresh token → Nhận token mới
- [ ] ✅ Verify Email request → Log email ra console
- [ ] ✅ Verify Email confirm → Email verified = true
- [ ] ✅ Forgot Password → Log token ra console
- [ ] ✅ Reset Password → Đổi password thành công
- [ ] ✅ Test rate limiting → Block sau khi vượt limit
- [ ] ✅ Test account lock → Khóa sau 5 lần sai

---

## 🎯 **KẾT LUẬN**

**Tất cả chức năng đăng ký/đăng nhập đã hoàn thiện:**

✅ Authentication cơ bản (Register, Login, Logout)  
✅ JWT Token management  
✅ Security (Rate limiting, Input validation, Account lock)  
✅ Email features (Verify, Forgot/Reset password)  
✅ User management (Get profile, Refresh token)  
✅ Gamification system  
✅ VIP system với auto expiry  

**Đã sẵn sàng để test trên Postman!** 🚀
