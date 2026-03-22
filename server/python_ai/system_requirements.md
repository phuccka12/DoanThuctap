# 🏗️ IELTS Pro: Master System Requirements

Tài liệu này tổng hợp toàn bộ các yêu cầu phần cứng và phần mềm để Alex (Speaking & Writing) hoạt động "siêu mượt" trên máy tính của bạn.

## 💻 1. Phần cứng (Hardware)
| Thành phần | Yêu cầu Tối thiểu | Khuyến nghị (Để mượt nhất) |
| :--- | :--- | :--- |
| **RAM** | 8 GB | 16 GB+ |
| **CPU** | Intel i5 Gen 10+ / Ryzen 5 | Intel i7 / Ryzen 7 |
| **GPU** | Không bắt buộc | NVIDIA RTX (Nếu muốn dùng Whisper Large) |
| **Disk** | 5GB bộ nhớ trống | SSD (Đọc mô hình NLP nhanh hơn) |

## 📦 2. Phần mềm & Thư viện (Python AI)
Dưới đây là danh sách các gói phụ thuộc đã được tối ưu hóa cho **ONNX (CPU Intel/AMD)**:

### Lệnh cài đặt tổng lực:
```bash
pip install flask flask-cors spacy google-generativeai edge-tts pysbd lexical-diversity transformers onnxruntime optimum[onnxruntime] scikit-learn
```

### Yêu cầu Tài nguyên NLP (Chạy 1 lần):
- **spaCy Model**: `python -m spacy download en_core_web_md`
- **NLI ONNX Model**: Sẽ tự động tải khoảng 150MB khi chạy lần đầu.

## 🌐 3. API & Hạ tầng
1. **Google Gemini API**: Phải có Key trong file `.env`.
2. **FFmpeg**: Bắt buộc phải cài để xử lý Audio cho Speaking.
3. **Ollama (Optional)**: Nếu muốn Alex hoạt động Offline (Lamma3, Mistral).

## ⚠️ Giải quyết lỗi Start-up phổ biến
1. **Lỗi ModuleNotFoundError**: Chạy lại lệnh `pip install -r requirements.txt`.
2. **Lỗi 500 (Python AI)**: Đảm bảo cổng 5000 không bị chiếm dụng bởi ứng dụng khác.
3. **Lỗi Radar Chart (React)**: Tôi đã sửa biến `TR` sang `TA` để không còn bị lỗi build Vite.
