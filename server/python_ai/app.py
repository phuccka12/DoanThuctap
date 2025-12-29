import os
from google import genai
import language_tool_python
import textstat
import spacy
import tempfile
import whisper 
import time 
import json
import edge_tts
import asyncio
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

# --- 1. CẤU HÌNH HỆ THỐNG ---
load_dotenv()
app = Flask(__name__)
CORS(app)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("❌ Lỗi: Chưa có GEMINI_API_KEY trong .env")

# Khởi tạo client với API key
client = genai.Client(api_key=api_key)

# ⚠️ CHỌN MODEL (Nếu 2.5 lỗi thì đổi về 1.5-flash)
MODEL_NAME = 'gemini-2.5-flash'
print(f"🧠 Đang kích hoạt bộ não: {MODEL_NAME}")

# --- 2. KHỞI ĐỘNG CÁC ENGINE (QUAN TRỌNG: PHẢI TẢI HẾT Ở ĐÂY) ---

# 2.1 Grammar Engine
print("⏳ Đang tải Grammar Engine (LanguageTool)...")
try:
    tool = language_tool_python.LanguageTool('en-US', remote_server='https://api.languagetool.org/v2')
except Exception as e:
    print(f"⚠️ Lỗi LanguageTool: {e}")
    tool = None

# 2.2 NLP Engine
print("⏳ Đang tải NLP Engine (SpaCy)...")
try:
    nlp = spacy.load("en_core_web_sm")
except:
    print("⚠️ Đang tải SpaCy model về máy...")
    os.system("python -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# 2.3 Whisper Engine (SỬA LỖI: PHẢI CÓ ĐOẠN NÀY)
print("⏳ Đang tải Whisper AI (Tai thính nhất thế giới)...")
whisper_model = None
try:
    # Load model 'base' (cân bằng tốc độ/chính xác)
    whisper_model = whisper.load_model("base")
    print("✅ Whisper đã tải thành công!")
except Exception as e:
    print(f"❌ LỖI: Không tải được Whisper. Bạn đã cài FFmpeg chưa? Lỗi: {e}")


print("✅ TOÀN BỘ HỆ THỐNG ĐÃ SẴN SÀNG CHIẾN ĐẤU!")


# --- 3. CÁC HÀM XỬ LÝ SỐ LIỆU (WRITING) ---
def analyze_deep_tech(text):
    """Phân tích sâu cấu trúc câu và số liệu"""
    doc = nlp(text)
    verbs = [token.text for token in doc if token.pos_ == "VERB"]
    sentence_starters = [sent[0].text.lower() for sent in doc.sents]
    repetitive_starters = {i:sentence_starters.count(i) for i in sentence_starters if sentence_starters.count(i) > 2}

    stats = {
        "reading_ease": textstat.flesch_reading_ease(text),
        "grade_level": textstat.text_standard(text, float_output=False),
        "verb_diversity": len(set(verbs)) / len(verbs) if verbs else 0
    }
    return {"nlp": {"starters": repetitive_starters}, "math": stats}

def check_grammar_strict(text):
    if tool is None: return [] # Tránh lỗi nếu tool chưa load
    matches = tool.check(text)
    return [{"error": r.message, "context": r.context, "fix": r.replacements[:2]} for r in matches]


# ==========================================
# ✍️ API 1: WRITING (HYBRID ENGINE)
# ==========================================
@app.route('/api/writing/check', methods=['POST'])
def check_writing():
    try:
        data = request.json
        text = data.get('text', '')
        topic = data.get('topic', 'General Writing')
        
        if not text: return jsonify({"error": "Chưa nhập nội dung!"}), 400

        # 1. Chạy phân tích kỹ thuật
        tech_data = analyze_deep_tech(text)
        grammar_errors = check_grammar_strict(text)

        # 2. Prompt Gemini
        prompt = f"""
        # ROLE & PERSONA
        You are a Senior IELTS Examiner with 20 years of experience. You are known for being EXTREMELY STRICT and precise. You do not give high scores easily. You base your scoring on the official IELTS Writing Band Descriptors.

        # INPUT DATA
        1. TOPIC: "{topic}"
        2. STUDENT ESSAY: "{text}"
        
        # SCIENTIFIC EVIDENCE (FROM COMPUTER ANALYSIS) - DO NOT IGNORE:
        - Strict Grammar Errors Found: {len(grammar_errors)} errors. 
          (Details: {str(grammar_errors[:3])}...) -> If > 3 errors, GRA cannot be above 7.0.
        - Readability Score (Flesch): {tech_data['math']['reading_ease']} 
          (Target for Band 7+ is 30-50. If > 60, it's too simple/childish).
        - Repetitive Sentence Starters: {list(tech_data['nlp']['starters'].keys()) if tech_data['nlp']['starters'] else 'None'} 
          (If present, PENALIZE Coherence & Cohesion heavily).

        # YOUR TASK
        Analyze the essay deepy and provide a strict evaluation in VIETNAMESE.

        # STEPS TO ANALYZE:
        1. **Task Response:** Did they answer ALL parts of the prompt? Is the position clear?
        2. **Coherence:** Is the flow logical? Did they use linking words effectively or mechanically? (Check the Repetitive Starters evidence).
        3. **Lexical Resource:** Are they using 'easy' words (good, bad, nice) or 'academic' words (detrimental, beneficial)? 
        4. **Grammar:** Look at the Computer Evidence provided above. Don't be lenient.

        # OUTPUT FORMAT (JSON ONLY):
        {{
            "overall_score": "Band [Score]",
            "radar_chart": {{ "TR": [Score], "CC": [Score], "LR": [Score], "GRA": [Score] }},
            "system_feedback": [
                "Máy tính phát hiện {len(grammar_errors)} lỗi ngữ pháp cần sửa ngay.",
                "Độ khó văn bản: {tech_data['math']['grade_level']} (Mục tiêu: College Level).",
                "Cảnh báo lặp từ đầu câu: {list(tech_data['nlp']['starters'].keys()) if tech_data['nlp']['starters'] else 'Không có - Tốt'}"
            ],
            "topic_vocab_suggestion": [
                {{
                    "word": "[Advanced Word related to Topic]",
                    "meaning": "[Nghĩa Tiếng Việt]",
                    "context": "[Ví dụ câu dùng từ này thay cho từ user đã dùng]"
                }}
            ],
            "detailed_analysis": {{
                "task_response": "[Nhận xét gắt gao về TR bằng Tiếng Việt]",
                "coherence_cohesion": "[Nhận xét về sự mạch lạc bằng Tiếng Việt]",
                "lexical_resource": "[Chê từ vựng nghèo nàn hoặc khen từ vựng hay bằng Tiếng Việt]",
                "grammar_accuracy": "[Phân tích lỗi ngữ pháp dựa trên báo cáo máy tính bằng Tiếng Việt]"
            }},
            "better_version": "[Rewrite the essay to strict Band 9.0 Standard - Academic Style]"
        }}
        """

        # Gọi API Gemini với client mới
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )
        return response.text.replace('```json', '').replace('```', '').strip(), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# 🎤 API 2: SPEAKING (WHISPER + GEMINI)
# ==========================================
@app.route('/api/speaking/check', methods=['POST'])
def check_speaking():
    try:
        start_time = time.time()
        
        # Kiểm tra Whisper có sống không
        if whisper_model is None:
            return jsonify({"error": "Lỗi Server: Whisper chưa được khởi động (Kiểm tra FFmpeg)"}), 500

        if 'audio' not in request.files: return jsonify({"error": "No file"}), 400
        audio_file = request.files['audio']
        
        # 1. Lưu file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name

        print(f"👂 Whisper đang nghe file: {tmp_path}...")

        # 2. WHISPER TRANSCRIBE
        result = whisper_model.transcribe(tmp_path)
        transcript = result["text"]
        print(f"📝 Transcript: {transcript}")

        # 3. GỬI CHO GEMINI
        uploaded_file = genai.upload_file(tmp_path)
        
        prompt = f"""
        # ROLE
        Act as a ruthless IELTS Speaking Examiner and a Phonetic Expert. Your job is to find every single mistake in the user's speech.

        # INPUT DATA
        1. AUDIO: Listen to the attached file for Intonation, Stress, and Pronunciation.
        2. VERBATIM TRANSCRIPT (From Whisper AI): "{transcript}"
           (⚠️ WARNING: This transcript contains EXACTLY what the user said, including fillers like 'um, ah, uh', grammar mistakes, and hesitations).

        # ANALYSIS TASKS:
        1. **Fluency & Coherence:** - Count the fillers (um, ah, uh). If there are many, score LOW.
           - Is the speed natural or robotic/too slow?
        2. **Lexical Resource:** - Are they using basic words (happy, sad, go) or idiomatic language (over the moon, devastating)?
        3. **Grammatical Range:** - Look at the TRANSCRIPT. Identify wrong tenses, wrong prepositions.
        4. **Pronunciation:** - Listen to the Audio. Identify mispronounced words compared to standard IPA.

        # OUTPUT FORMAT (JSON ONLY - Feedback in VIETNAMESE):
        {{
            "transcript_display": "{transcript}",
            "overall_score": "Band [Score]",
            "radar_chart": {{ "Fluency": [Score], "Lexical": [Score], "Grammar": [Score], "Pronunciation": [Score] }},
            "detailed_feedback": {{
                "fluency": "[Nhận xét thẳng thắn về độ trôi chảy, liệt kê các từ ậm ừ]",
                "pronunciation": "[Nhận xét về ngữ điệu và phát âm]",
                "vocab_grammar": "[Nhận xét về lỗi ngữ pháp và từ vựng trong Transcript]"
            }},
            "mistakes_timeline": [
                {{
                    "word": "[Từ bị sai/Từ dở]",
                    "error": "[Giải thích tại sao sai (Grammar/Pronunciation/Choice)]",
                    "fix": "[Gợi ý sửa lại cho chuẩn native]"
                }}
            ],
            "vocab_upgrade": [
                {{
                    "original": "[Từ vựng cơ bản user dùng]",
                    "better": "[Từ vựng C1/C2 thay thế]",
                    "reason": "[Tại sao từ mới này xịn hơn?]"
                }}
            ],
            "better_version": "[Viết lại câu trả lời của user theo phong cách Band 9.0 tự nhiên]"
        }}
        """

        # Upload file và gọi API
        uploaded_file = client.files.upload(path=tmp_path)
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[prompt, uploaded_file]
        )
        
        # Dọn dẹp
        os.remove(tmp_path)
        print(f"✅ Xử lý xong trong {time.time() - start_time}s")

        return response.text.replace('```json', '').replace('```', '').strip(), 200

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

async def generate_audio_edge(text, filepath):
    # Chọn giọng: 
    # 'en-GB-SoniaNeural': Giọng Nữ Anh-Anh (Chuẩn IELTS)
    # 'en-US-AriaNeural': Giọng Nữ Mỹ
    # 'en-GB-RyanNeural': Giọng Nam Anh-Anh
    VOICE = "en-GB-SoniaNeural" 
    communicate = edge_tts.Communicate(text, VOICE)
    await communicate.save(filepath)

@app.route('/api/speaking/conversation', methods=['POST'])
def conversation():
    try:
        # 1. Nhận dữ liệu
        if 'audio' not in request.files: return jsonify({"error": "Thiếu audio"}), 400
        
        audio_file = request.files['audio']
        history_str = request.form.get('history', '[]') 
        
        # 2. Lưu file tạm & Whisper nghe
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name

        print(f"🗣️ Conversation: Whisper đang nghe...")
        if whisper_model is None: return jsonify({"error": "Whisper chưa load!"}), 500
        
        result = whisper_model.transcribe(tmp_path)
        user_text = result["text"]
        print(f"📝 User nói: {user_text}")
        os.remove(tmp_path) 

        # 3. Gửi cho Gemini
        prompt = f"""
        VAI TRÒ: Bạn là một Giám khảo IELTS Speaking chuyên nghiệp.
        LỊCH SỬ: {history_str}
        CÂU TRẢ LỜI MỚI NHẤT: "{user_text}"
        
        NHIỆM VỤ:
        1. Soi lỗi ngữ pháp/từ vựng.
        2. Tạo câu hỏi tiếp theo (Tiếng Anh).
        3. Tạo lời khuyên sửa lỗi (Tiếng Việt).

        OUTPUT JSON:
        {{
            "examiner_response_text": "[Câu hỏi tiếp theo bằng Tiếng Anh]",
            "correction_tip": "[Lời khuyên sửa lỗi bằng Tiếng Việt]",
            "is_short_answer": true/false
        }}
        """
        
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )
        response_json = response.text.replace('```json', '').replace('```', '').strip()
        
        # 4. Xử lý JSON & Tạo Audio
        data = json.loads(response_json)
        ai_text = data.get("examiner_response_text", "Could you repeat that?")
        correction = data.get("correction_tip", "")

        # Tạo tên file
        filename = f"ai_ask_{uuid.uuid4()}.mp3"
        filepath = os.path.join("static", filename)
        
        # Gọi hàm Edge TTS (Xử lý Async)
        try:
            asyncio.run(generate_audio_edge(ai_text, filepath))
        except Exception as e:
            # Fallback nếu lỗi loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(generate_audio_edge(ai_text, filepath))
            loop.close()

        audio_url = f"{request.host_url}static/{filename}"
        
        return jsonify({
            "user_transcript": user_text,
            "ai_response_text": ai_text,
            "ai_audio_url": audio_url,
            "correction": correction
        })

    except Exception as e:
        print(f"❌ Lỗi Conversation: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)