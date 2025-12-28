# 🤖 Python AI Backend - IELTS Writing & Speaking Feedback

Backend xử lý AI cho ứng dụng học tiếng Anh với phản hồi IELTS Writing và Speaking.

## 📋 Yêu cầu hệ thống

- **Python**: 3.10 hoặc cao hơn
- **FFmpeg**: Cần thiết cho xử lý audio
- **Google Gemini API Key**: Để sử dụng AI

## 🚀 Hướng dẫn cài đặt

### 1. Tạo Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. Cài đặt Dependencies

```bash
pip install -r requirements.txt
```

### 3. Download spaCy Model

```bash
python -m spacy download en_core_web_sm
```

### 4. Cài đặt FFmpeg

**Windows:**
- Download từ: https://ffmpeg.org/download.html
- Giải nén và thêm vào PATH

**Linux:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**Mac:**
```bash
brew install ffmpeg
```

### 5. Tạo file `.env`

Tạo file `.env` trong folder `python_ai`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**Lấy API Key:**
1. Truy cập: https://makersuite.google.com/app/apikey
2. Tạo API key mới
3. Copy và paste vào file `.env`

## ▶️ Chạy Server

```bash
# Development mode
python app.py

# Production mode (với gunicorn)
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

Server sẽ chạy tại: **http://localhost:8000**

## 📡 API Endpoints

### 1. Check Writing (POST `/api/writing`)

**Request:**
```json
{
  "text": "PROMPT:\nSome people think...\n\nANSWER:\nIn my opinion..."
}
```

**Response:**
```json
{
  "overall_score": 7.5,
  "general_comment": "Good essay with clear structure...",
  "radar_chart": {
    "grammar": 8,
    "vocabulary": 7,
    "coherence": 7,
    "task_response": 8
  },
  "detailed_analysis": [
    {
      "type": "grammar_error",
      "text": "I am agree",
      "fix": "I agree",
      "explanation": "Remove 'am' - agree is not used with 'to be'"
    }
  ],
  "better_version": "Improved version of the essay..."
}
```

### 2. Speaking Practice (POST `/api/speaking`)

**Request:**
```json
{
  "topic": "Describe your hometown"
}
```

**Response:**
```json
{
  "question": "Can you describe your hometown?",
  "audio_url": "/static/ai_ask_uuid.mp3"
}
```

### 3. Speaking Feedback (POST `/api/speaking/feedback`)

**Request:** (multipart/form-data)
- `audio`: Audio file (WAV/MP3)
- `question`: Text của câu hỏi

**Response:**
```json
{
  "transcript": "My hometown is...",
  "score": 7.0,
  "feedback": "Good pronunciation and fluency...",
  "pronunciation_errors": [...],
  "grammar_errors": [...],
  "suggestions": [...]
}
```

## 🛠️ Troubleshooting

### Lỗi: "GEMINI_API_KEY not found"
- Kiểm tra file `.env` đã tạo chưa
- Đảm bảo key đúng format: `GEMINI_API_KEY=your_key_here`

### Lỗi: "FFmpeg not found"
- Windows: Thêm FFmpeg vào System PATH
- Linux/Mac: Cài đặt qua package manager

### Lỗi: "No module named 'language_tool_python'"
```bash
pip install language-tool-python
```

### Lỗi: "spaCy model not found"
```bash
python -m spacy download en_core_web_sm
```

## 📦 Cấu trúc Dependencies

```
Flask + CORS          → Web framework
Google Generative AI  → Gemini AI
Whisper              → Speech recognition
edge-tts             → Text-to-speech
spaCy                → NLP processing
language-tool-python → Grammar checking
textstat             → Text analysis
FFmpeg               → Audio processing
```

## 🔧 Development

### Cập nhật dependencies:
```bash
pip freeze > requirements.txt
```

### Chạy tests:
```bash
pytest tests/
```

## 📝 Notes

- Model mặc định: `gemini-2.5-flash` (có thể đổi về `gemini-1.5-flash` nếu lỗi)
- Audio files được lưu trong `static/` (được ignore bởi git)
- Hỗ trợ CORS cho frontend development

## 🐛 Known Issues

- Gemini 2.5 đôi khi không ổn định → đổi về 1.5-flash
- Whisper model lớn → tải lần đầu sẽ lâu
- FFmpeg phải được cài đặt riêng (không có trong pip)

## 📄 License

Private - Đồ án thực tập tốt nghiệp
