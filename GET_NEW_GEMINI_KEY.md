# 🔑 GEMINI API KEY ĐÃ HẾT HẠN - HƯỚNG DẪN LẤY KEY MỚI

## ❌ Lỗi hiện tại
```
API key expired. Please renew the API key.
```

## 🚀 Cách lấy API Key mới (MIỄN PHÍ)

### Bước 1: Truy cập Google AI Studio
🔗 **Link:** https://aistudio.google.com/app/apikey

### Bước 2: Đăng nhập
- Dùng tài khoản Google của bạn
- Click **"Sign in"** ở góc trên bên phải

### Bước 3: Tạo API Key
1. Click nút **"Create API Key"** (màu xanh)
2. Chọn project (hoặc tạo mới):
   - Nếu đã có project → chọn từ dropdown
   - Nếu chưa có → click **"Create API key in new project"**
3. API key sẽ được tạo ngay lập tức

### Bước 4: Copy API Key
```
Ví dụ: AIzaSyABC123def456GHI789jkl012MNO345pqr678
```
⚠️ **LƯU Ý:** Key chỉ hiển thị 1 lần, nhớ copy ngay!

## 📝 Cập nhật vào project

### File 1: `server/python_ai/.env`
```bash
# Mở file này và thay key cũ
GEMINI_API_KEY=AIzaSyABC123def456GHI789jkl012MNO345pqr678
```

**Cách sửa:**
```powershell
# Mở bằng notepad
notepad server\python_ai\.env

# Hoặc VS Code
code server\python_ai\.env
```

Tìm dòng:
```
GEMINI_API_KEY=AIzaSyCStnRz0Qv2baOV6QyT5AILgxDlBhcu2qI
```

Thay bằng:
```
GEMINI_API_KEY=<KEY_MỚI_CỦA_BẠN>
```

**Lưu file và tắt!**

## 🔄 Restart Python Service

### Cách 1: Stop và Start lại
```powershell
# Trong terminal Python đang chạy
# Nhấn Ctrl+C để stop

# Sau đó chạy lại
cd server\python_ai
.\venv\Scripts\Activate.ps1
python app.py
```

### Cách 2: Kill và restart
```powershell
# Kill process
Get-Process python | Where-Object {$_.Path -like "*python_ai*"} | Stop-Process -Force

# Start lại
cd server\python_ai
.\venv\Scripts\Activate.ps1
python app.py
```

## ✅ Kiểm tra

Khi Python service restart, bạn sẽ thấy:
```
🧠 Đang kích hoạt bộ não: gemini-2.5-flash
✅ TOÀN BỘ HỆ THỐNG ĐÃ SẴN SÀNG CHIẾN ĐẤU!
```

**Không có lỗi về API key!**

## 🧪 Test lại

1. Quay lại trang web
2. Click **"AI Generate"**
3. Điền form:
   ```
   Chủ đề: travel
   Trình độ CEFR: B1
   Số từ: 150
   ```
4. Click **"Tạo với AI"**
5. **Kỳ vọng:** Chờ 30-60 giây → Success! ✅

## 📊 Gemini API Free Tier

✅ **Miễn phí hoàn toàn!**

**Giới hạn:**
- 60 requests/phút
- 1,500 requests/ngày
- 1 triệu tokens/ngày

**→ Đủ cho development và testing!**

## 🔒 Bảo mật API Key

### ✅ ĐÚNG:
- Lưu trong file `.env`
- Không commit lên Git (có trong `.gitignore`)
- Không share công khai

### ❌ SAI:
- Hardcode trong code
- Commit lên GitHub public
- Share trên Discord/Slack

## 🆘 Troubleshooting

### Lỗi: "API key still expired"
**Nguyên nhân:** Chưa restart Python service
**Fix:** Ctrl+C rồi chạy lại `python app.py`

### Lỗi: "API_KEY_INVALID"
**Nguyên nhân:** Copy sai key (có khoảng trắng)
**Fix:** Copy lại key, xóa hết khoảng trắng đầu/cuối

### Lỗi: "RESOURCE_EXHAUSTED"
**Nguyên nhân:** Vượt quota (60 requests/phút)
**Fix:** Chờ 1 phút rồi thử lại

## 🎁 Bonus: Kiểm tra quota còn lại

Vào: https://aistudio.google.com/app/apikey

Click vào API key đã tạo → Xem **"Usage"** tab

## 📝 Checklist

- [ ] Vào https://aistudio.google.com/app/apikey
- [ ] Click "Create API Key"
- [ ] Copy key mới
- [ ] Mở file `server/python_ai/.env`
- [ ] Thay `GEMINI_API_KEY=...` bằng key mới
- [ ] Lưu file
- [ ] Restart Python service (Ctrl+C → `python app.py`)
- [ ] Thấy "✅ TOÀN BỘ HỆ THỐNG ĐÃ SẴN SÀNG CHIẾN ĐẤU!"
- [ ] Test tạo bài đọc

## 🎉 Done!

Sau khi update key mới, hệ thống sẽ hoạt động bình thường!

---

**Created:** February 9, 2026
**Issue:** Gemini API key expired
**Solution:** Get new key from Google AI Studio
**Status:** ⏳ PENDING (waiting for new key)
