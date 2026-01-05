# Hướng dẫn cài đặt Google OAuth

## 1. Cài đặt packages
```bash
cd server
npm install passport passport-google-oauth20 express-session
```

## 2. Lấy Google OAuth credentials

### Bước 1: Tạo Google Cloud Project
1. Truy cập: https://console.cloud.google.com/
2. Tạo project mới hoặc chọn project có sẵn

### Bước 2: Bật Google+ API
1. Vào menu **APIs & Services** > **Library**
2. Tìm "Google+ API" và bật nó

### Bước 3: Tạo OAuth Credentials
1. Vào **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Chọn **Application type**: Web application
4. Điền thông tin:
   - **Name**: English Learning App
   - **Authorized JavaScript origins**: 
     - http://localhost:5173
     - http://localhost:3000
   - **Authorized redirect URIs**:
     - http://localhost:3000/api/auth/google/callback
5. Click **Create**
6. Lưu lại **Client ID** và **Client Secret**

## 3. Cấu hình .env
Thêm vào file `server/.env`:
```
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Session Secret
SESSION_SECRET=your_random_session_secret_here

# Client URL (frontend)
CLIENT_URL=http://localhost:5173
```

## 4. Khởi động server
```bash
cd server
npm start
```

## 5. Test Google Login
1. Khởi động client: `cd client-web && npm run dev`
2. Truy cập: http://localhost:5173/login
3. Click nút "Đăng nhập với Google"
4. Chọn tài khoản Google
5. Sau khi xác thực, bạn sẽ được redirect về dashboard

## Lưu ý:
- User đăng nhập lần đầu qua Google sẽ tự động được tạo tài khoản
- Nếu email đã tồn tại, hệ thống sẽ liên kết với tài khoản Google
- Email từ Google sẽ tự động được verify (email_verified = true)
- User đăng nhập qua Google sẽ có trường `google_id` trong database

## Cấu trúc database User sau khi cập nhật:
```javascript
{
  user_name: String,
  email: String,
  password_hash: String,
  google_id: String,        // Mới thêm
  avatar: String,           // Mới thêm - lấy từ Google
  role: String,
  status: String,
  vip_expire_at: Date,
  gamification_data: Object,
  last_login_at: Date,
  email_verified: Boolean,
  failed_login_attempts: Number,
  lock_until: Date
}
```

## API Endpoints mới:
- `GET /api/auth/google` - Khởi tạo OAuth flow
- `GET /api/auth/google/callback` - Callback sau khi Google xác thực

## Frontend routes mới:
- `/auth/google/callback` - Xử lý callback từ backend
