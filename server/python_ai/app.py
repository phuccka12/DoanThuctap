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
import html  # For decoding HTML entities
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

print("🔑 Đang dùng Key:", os.getenv("GEMINI_API_KEY")[:10] + "...")
# Khởi tạo client với API key
client = genai.Client(api_key=api_key)

# ⚠️ CHỌN MODEL (Dùng bản 2.0 cho ổn định nhất)
MODEL_NAME = 'models/gemini-2.5-flash'
print(f"🧠 Đang kích hoạt bộ não: {MODEL_NAME}")

# --- Helper: GenAI call with retries/backoff for quota handling ---
def genai_generate_with_backoff(model, contents, max_retries=4, initial_delay=5, backoff=2):
    """Call client.models.generate_content with exponential backoff on quota/rate errors.
    Returns the response object on success or raises the last exception on failure.
    """
    delay = initial_delay
    for attempt in range(1, max_retries + 1):
        try:
            resp = client.models.generate_content(
                model=model,
                contents=contents
            )
            return resp
        except Exception as e:
            err_s = str(e)
            # Heuristic detection for quota/rate errors
            if ('RESOURCE_EXHAUSTED' in err_s) or ('429' in err_s) or ('quota' in err_s.lower()) or ('rate limit' in err_s.lower()):
                print(f"⚠️ GenAI quota/rate error (attempt {attempt}/{max_retries}): {err_s}")
                if attempt == max_retries:
                    print("❌ Max retries reached for GenAI call. Raising error.")
                    raise
                print(f"⏳ Backing off {delay}s before retrying GenAI call...")
                time.sleep(delay)
                delay *= backoff
                continue
            # Non-rate error: re-raise immediately
            raise

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

# --- 3.5 BỘ TỪ VỰNG HỌC THUẬT & TỪ NỐI (CHO OFFLINE FALLBACK) ---
ACADEMIC_WORD_LIST = {
    "analyze", "approach", "concept", "context", "derive", "distribution", "estimate", "evidence", "factor", "function",
    "identify", "income", "indicate", "individual", "interpretation", "issue", "method", "occurrence", "percent", "period",
    "policy", "principle", "procedure", "process", "range", "research", "response", "role", "section", "sector",
    "significant", "source", "specific", "structure", "theory", "variable", "achieve", "acquisition", "administration", "affect",
    "appropriate", "aspect", "assistance", "category", "chapter", "commission", "community", "complex", "computer", "conclusion",
    "conduct", "consequence", "construction", "consumer", "credit", "culture", "design", "distinction", "element", "equation",
    "evaluation", "feature", "final", "focus", "impact", "injury", "institute", "investment", "item", "journal",
    "alternative", "circumstance", "comment", "compensation", "component", "consent", "considerable", "constant", "constraint", "contribution",
    "convention", "coordination", "core", "corporate", "corresponding", "criteria", "deduction", "demonstrate", "document", "dominant",
    "emphasis", "ensure", "excluded", "framework", "fund", "illustrated", "migration", "minority", "negative", "outcomes",
    "partnership", "philosophy", "physical", "proportion", "published", "reaction", "registered", "reliance", "scheme", "sequence",
    "shift", "specified", "sufficient", "task", "technical", "techniques", "technology", "valid", "volume", "access",
    "adequate", "annual", "apparent", "approximated", "attitudes", "attributed", "civil", "code", "commitment", "communication",
    "beneficial", "detrimental", "sustainable", "paradigm", "infrastructure", "empirical", "theoretical", "methodology", "facilitate", "comprehensive"
}

LINKING_WORDS_LIST = {
    "however", "therefore", "furthermore", "moreover", "consequently", "nevertheless", "on the other hand", "in contrast", "specifically", "in addition",
    "additionally", "firstly", "secondly", "thirdly", "finally", "in conclusion", "to sum up", "as a result", "for instance", "for example",
    "notably", "significantly", "meanwhile", "simultaneously", "despite", "although", "whereas", "nonetheless", "subsequently", "accordingly",
    "similarly", "likewise", "not only", "but also", "in other words", "to clarify", "alternatively", "conversely", "hence", "thus"
}

def _offline_writing_score(text, topic="General Topic", grammar_errors=[]):
    """
    Hệ thống chấm điểm Writing dự phòng (Heuristic) khi AI sập.
    Dựa trên logic Kỹ thuật: Error Density, TTR, AWL count, và Structure.
    """
    words = text.lower().split()
    total_words = len(words)
    if total_words < 10:
        return {
            "overall_score": "Band 1.0",
            "radar_chart": {"TR": 1, "CC": 1, "LR": 1, "GRA": 1},
            "system_feedback": ["Văn bản quá ngắn để đánh giá."],
            "source": "offline"
        }

    # 1. GRA (Grammar Accuracy) - Dựa trên Error Density
    error_count = len(grammar_errors)
    error_density = (error_count / total_words) * 100
    if error_density < 1.0: gra = 8.5
    elif error_density < 2.5: gra = 7.5
    elif error_density < 5.0: gra = 6.5
    elif error_density < 10.0: gra = 5.5
    else: gra = 4.5

    # 2. LR (Lexical Resource) - Dựa trên Diversity & AWL
    unique_words = set(words)
    ttr = len(unique_words) / total_words
    awl_found = [w for w in words if w in ACADEMIC_WORD_LIST]
    unique_awl = len(set(awl_found))
    
    lr_base = 5.0
    if unique_awl >= 15: lr_base += 2.5
    elif unique_awl >= 10: lr_base += 1.5
    elif unique_awl >= 5: lr_base += 0.5
    
    # Thưởng diversity (TTR > 0.45 là ổn cho Writing)
    if ttr > 0.5: lr_base += 0.5
    lr = min(9.0, lr_base)

    # 3. CC (Coherence & Cohesion) - Dựa trên Từ nối & trần (Cap)
    linking_found = [w for w in words if w in LINKING_WORDS_LIST]
    unique_linking = len(set(linking_found))
    
    if unique_linking < 3: cc = 5.0
    elif unique_linking < 6: cc = 6.0
    elif unique_linking < 12: cc = 7.5
    elif unique_linking < 20: cc = 8.5
    else: cc = 6.0  # Over-cohesion penalty (Cap)

    # 4. TR (Task Response) - Dựa trên Word Count & Paragraphs
    paragraphs = [p for p in text.split('\n\n') if len(p.strip()) > 20]
    num_paras = len(paragraphs)
    
    tr_base = 5.0
    if total_words >= 250: tr_base += 1.5
    elif total_words >= 150: tr_base += 0.5
    
    if num_paras >= 4: tr_base += 1.0
    elif num_paras >= 3: tr_base += 0.5
    
    tr = min(9.0, tr_base)

    overall = round((gra + lr + cc + tr) / 4 * 2) / 2 # IELTS step 0.5
    
    return {
        "overall_score": f"Band {overall}",
        "radar_chart": {"TR": tr, "CC": cc, "LR": lr, "GRA": gra},
        "system_feedback": [
            f"Mật độ lỗi ngữ pháp: {error_density:.1f}% ({error_count} lỗi).",
            f"Vốn từ học thuật: {unique_awl} từ độc nhất phát hiện được.",
            f"Cấu trúc bài viết: {num_paras} đoạn văn, {total_words} từ.",
            "⚠️ CHẾ ĐỘ DỰ PHÒNG: Đang dùng thuật toán Heuristic vì máy chủ AI quá tải."
        ],
        "detailed_analysis": {
            "task_response": "Đánh giá dựa trên độ dài và số lượng đoạn văn.",
            "coherence_cohesion": "Đánh giá dựa trên mật độ và sự đa dạng của từ nối.",
            "lexical_resource": "Đánh giá dựa trên tỷ lệ từ vựng học thuật (AWL).",
            "grammar_accuracy": "Đánh giá dựa trên mật độ lỗi phát hiện bởi LanguageTool."
        },
        "source": "offline"
    }


# ==========================================
# ✍️ API 1: WRITING (HYBRID ENGINE)
# ==========================================
@app.route('/api/writing/check', methods=['POST'])
def check_writing():
    try:
        data = request.json
        text = data.get('text', '')
        topic = data.get('topic', 'General Writing')
        mode = data.get('mode', 'online') # Lấy mode từ Node.js
        
        print(f"📝 Writing Check - Mode: {mode}")

        if not text: return jsonify({"error": "Chưa nhập nội dung!"}), 400

        # 🟢 CHẾ ĐỘ OFFLINE (Bắt buộc cho Standard)
        if mode == 'offline':
            print("⚠️  Standard User: Skipping Gemini, using Heuristic Engine.")
            # Ensure tool is initialized for offline mode if it failed globally
            if tool is None:
                try:
                    local_tool = language_tool_python.LanguageTool('en-US', remote_server='https://api.languagetool.org/v2')
                except Exception as e:
                    print(f"❌ LanguageTool failed in offline mode: {e}. Cannot perform grammar check.")
                    local_tool = None
            else:
                local_tool = tool

            grammar_errors_raw = []
            if local_tool:
                matches = local_tool.check(text)
                grammar_errors_raw = [{"word": m.context[m.offset:m.offset+m.errorLength], "error": m.message, "fix": (m.replacements[0] if m.replacements else "N/A")} for m in matches]
            
            result = _offline_writing_score(text, topic, grammar_errors_raw)
            result["mistakes"] = grammar_errors_raw[:10] # Limit mistakes for display
            return jsonify(result)

        # 🔵 CHẾ ĐỘ ONLINE (Mặc định cho VIP/Admin)
        # 1. Chạy phân tích kỹ thuật
        tech_data = analyze_deep_tech(text)
        
        # Check grammar errors
        grammar_errors = []
        if tool is not None:
            try:
                matches = tool.check(text)
                grammar_errors = [{"word": m.context[m.offset:m.offset+m.errorLength], "error": m.message, "fix": (m.replacements[0] if m.replacements else "N/A")} for m in matches]
            except Exception as e:
                print(f"⚠️  Grammar check failed: {e}")
                grammar_errors = []

        # 2. Prompt Gemini
        try:
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

            # Gọi API Gemini với client mới (với backoff để tránh quota errors)
            response = genai_generate_with_backoff(MODEL_NAME, prompt)
            return response.text.replace('```json', '').replace('```', '').strip(), 200
        except Exception as ai_err:
            print(f"⚠️ Writing AI failure -> Fallback to Offline Engine: {ai_err}")
            # Kích hoạt phao cứu sinh
            offline_result = _offline_writing_score(text, topic, grammar_errors)
            return json.dumps(offline_result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# 🎤 API 2: SPEAKING (WHISPER + GEMINI)
# ==========================================
@app.route('/api/speaking/check', methods=['POST'])
def evaluate_speaking(): # Renamed from check_speaking as per instruction
    try:
        start_time = time.time()
        
        # Kiểm tra Whisper có sống không
        if whisper_model is None:
            return jsonify({"error": "Lỗi Server: Whisper chưa được khởi động (Kiểm tra FFmpeg)"}), 500

        if 'audio' not in request.files: return jsonify({"error": "No file"}), 400
        audio_file = request.files['audio']
        mode = request.form.get('mode', 'online') # Lấy mode từ Node.js
        
        # 1. Lưu file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name

        print(f"🎤 Speaking Check - Mode: {mode}")
        print(f"👂 Whisper đang nghe file: {tmp_path}...")

        # 🟢 CHẾ ĐỘ OFFLINE
        if mode == 'offline':
            print("⚠️  Mode Offline: Using Offline Speaking Engine.")
            # Transcribe audio for offline mode
            transcript = ''
            try:
                whisper_result = whisper_model.transcribe(tmp_path)
                transcript = whisper_result.get('text', '').strip()
            except Exception as whisper_err:
                print(f"❌ Whisper transcription failed in offline mode: {whisper_err}. Using empty transcript.")
            
            result = _offline_speaking_score(transcript)
            result["source"] = "offline"
            os.remove(tmp_path) # Clean up temp file
            return jsonify(result)

        # 🔵 CHẾ ĐỘ ONLINE
        # 2. WHISPER TRANSCRIBE
        result = whisper_model.transcribe(tmp_path)
        transcript = result["text"]
        print(f"📝 Transcript: {transcript}")
        
        # 3. GỬI CHO GEMINI
        # SỬA LỖI: Dùng client.files.upload(file=...) cho SDK mới
        try:
            uploaded_file = client.files.upload(file=tmp_path)
        except Exception as upload_err:
            print(f"⚠️ Upload Gemini thất bại: {upload_err}")
            uploaded_file = None

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

        # Gọi API với cả prompt và file đã upload (nếu có)
        contents = [prompt]
        if uploaded_file:
            contents.append(uploaded_file)
            
        response = genai_generate_with_backoff(MODEL_NAME, contents)
        
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
        # Kiểm tra Whisper trước
        if whisper_model is None: 
            return jsonify({"error": "Whisper chưa load! Kiểm tra FFmpeg."}), 500
        
        # 1. Nhận dữ liệu
        if 'audio' not in request.files: 
            return jsonify({"error": "Thiếu audio"}), 400
        
        audio_file = request.files['audio']
        history_str = request.form.get('history', '[]') 
        
        # 2. Lưu file tạm & Whisper nghe
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name

        print(f"🗣️ Conversation: Whisper đang nghe...")
        
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
        
        response = genai_generate_with_backoff(MODEL_NAME, prompt)
        response_json = response.text.replace('```json', '').replace('```', '').strip()
        
        # 4. Xử lý JSON & Tạo Audio
        data = json.loads(response_json)
        ai_text = data.get("examiner_response_text", "Could you repeat that?")
        correction = data.get("correction_tip", "")

        # Tạo tên file
        filename = f"ai_ask_{uuid.uuid4()}.mp3"
        filepath = os.path.join("static", filename)
        
        # Đảm bảo thư mục static tồn tại
        os.makedirs("static", exist_ok=True)
        
        # Gọi hàm Edge TTS (Xử lý Async)
        try:
            asyncio.run(generate_audio_edge(ai_text, filepath))
        except RuntimeError as e:
            # Fallback nếu lỗi loop
            if "cannot be called from a running event loop" in str(e):
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                loop.run_until_complete(generate_audio_edge(ai_text, filepath))
                loop.close()
            else:
                raise

        audio_url = f"{request.host_url}static/{filename}"
        
        return jsonify({
            "user_transcript": user_text,
            "ai_response_text": ai_text,
            "ai_audio_url": audio_url,
            "correction": correction
        })

    except Exception as e:
        print(f"❌ Lỗi Conversation: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ==========================================
# 🤖 API 4: AGENTIC CONTENT ENGINE
# Multi-Agent System: Architect → Author → Critic → Self-Correction
# ==========================================

# CEFR to Flesch Reading Ease mapping
CEFR_FLESCH_MAP = {
    'A1': {'min': 70, 'max': 100, 'grade': 'Very Easy'},
    'A2': {'min': 60, 'max': 80, 'grade': 'Easy'},
    'B1': {'min': 50, 'max': 65, 'grade': 'Fairly Easy'},
    'B2': {'min': 40, 'max': 55, 'grade': 'Standard'},
    'C1': {'min': 30, 'max': 45, 'grade': 'Fairly Difficult'},
    'C2': {'min': 0, 'max': 40, 'grade': 'Difficult'}
}

def critic_audit(passage, title, cefr_level, target_word_count):
    """
    AGENT 3: The Critic - Symbolic AI Auditor
    Returns: (passed: bool, report: dict, errors: list)
    """
    errors = []
    report = {}
    
    # 1. Word Count Check
    words = passage.split()
    actual_count = len(words)
    report['word_count'] = actual_count
    tolerance = int(target_word_count * 0.25)  # ±25%
    if abs(actual_count - target_word_count) > tolerance:
        errors.append(f"Word count {actual_count} out of range ({target_word_count} ±{tolerance})")
    
    # 2. Readability Check (Flesch)
    try:
        flesch_score = textstat.flesch_reading_ease(passage)
        report['flesch_score'] = round(flesch_score, 2)
        
        target_range = CEFR_FLESCH_MAP.get(cefr_level, {'min': 40, 'max': 60})
        if flesch_score < target_range['min'] or flesch_score > target_range['max']:
            errors.append(f"Readability score {flesch_score} outside {cefr_level} range ({target_range['min']}-{target_range['max']})")
    except:
        report['flesch_score'] = None
        errors.append("Could not calculate readability score")
    
    # 3. Lexical Diversity Check
    doc = nlp(passage.lower())
    tokens = [token.text for token in doc if token.is_alpha]
    if len(tokens) > 0:
        unique_tokens = len(set(tokens))
        diversity_ratio = unique_tokens / len(tokens)
        report['lexical_diversity'] = round(diversity_ratio, 3)
        
        if diversity_ratio < 0.40:  # Too repetitive
            errors.append(f"Low lexical diversity ({diversity_ratio:.2%}), too many repeated words")
        
        # Check for overused words
        from collections import Counter
        word_freq = Counter(tokens)
        most_common = word_freq.most_common(1)[0] if word_freq else None
        if most_common and most_common[1] / len(tokens) > 0.08:
            errors.append(f"Word '{most_common[0]}' repeated {most_common[1]} times (overused)")
    
    # 4. Grammar Check (if tool available)
    if tool:
        try:
            matches = tool.check(passage)
            major_errors = [m for m in matches if m.category in ['GRAMMAR', 'TYPOS']]
            report['grammar_errors'] = len(major_errors)
            if len(major_errors) > 5:
                errors.append(f"Too many grammar errors ({len(major_errors)})")
        except:
            report['grammar_errors'] = None
    
    # 5. Structure Check
    if not title or len(title) < 5:
        errors.append("Title too short or missing")
    
    if len(passage) < 100:
        errors.append("Passage too short (< 100 characters)")
    
    passed = len(errors) == 0
    return passed, report, errors

@app.route('/api/agentic/generate-reading', methods=['POST'])
def agentic_generate_reading():
    """
    🧠 AGENTIC CONTENT ENGINE
    Multi-Agent System với Self-Correction Loop
    """
    try:
        data = request.json
        topic = data.get('topic', 'General Topic')
        cefr_level = data.get('cefr_level', 'B1')
        word_count = data.get('wordCount', 150)
        tone = data.get('tone', 'neutral')
        topic_hints = data.get('topicHints', '')
        core_vocab = data.get('core_vocab', [])
        max_retries = data.get('maxRetries', 3)
        
        print(f"\n{'='*60}")
        print(f"🎯 AGENTIC GENERATION START")
        print(f"   Topic: {topic}")
        print(f"   CEFR: {cefr_level} | Words: {word_count}")
        print(f"{'='*60}\n")
        
        attempts = 0
        final_result = None
        all_attempts = []
        
        # === PHASE 1: ARCHITECT (Planning) ===
        print("🏗️  AGENT 1 (ARCHITECT): Creating outline...")
        architect_prompt = f"""
You are "The Architect" - a pedagogical planner for IELTS reading materials.

INPUT:
- Topic: {topic}
- CEFR Level: {cefr_level}
- Target Word Count: {word_count}
- Tone: {tone}
{f"- Topic Hints: {topic_hints}" if topic_hints else ""}

TASK: Create a structured outline for a reading passage.

OUTPUT (JSON only, no markdown):
{{
  "title_suggestion": "Engaging title here",
  "learning_objectives": ["objective 1", "objective 2"],
  "sections": [
    {{"name": "Introduction", "instructions": "Set context in 1-2 sentences"}},
    {{"name": "Body Part 1", "instructions": "Main idea development"}},
    {{"name": "Body Part 2", "instructions": "Supporting details or contrast"}},
    {{"name": "Conclusion", "instructions": "Brief closing thought"}}
  ],
  "recommended_vocab": ["word1", "word2", "word3"]
}}
"""
        
        try:
            arch_response = genai_generate_with_backoff(MODEL_NAME, architect_prompt)
            outline_text = arch_response.text.replace('```json', '').replace('```', '').strip()
            outline = json.loads(outline_text)
            
            # Decode HTML entities in outline fields
            if 'title_suggestion' in outline:
                outline['title_suggestion'] = html.unescape(outline['title_suggestion'])
            
            print(f"✅ Outline created: {outline.get('title_suggestion', 'N/A')}")
        except Exception as e:
            err_s = str(e)
            print(f"❌ Architect failed: {err_s}")
            # If it's a quota/rate error, return 429 with friendly message
            if ('RESOURCE_EXHAUSTED' in err_s) or ('429' in err_s) or ('quota' in err_s.lower()) or ('rate limit' in err_s.lower()):
                return jsonify({
                    "error": "Architect failed due to API quota/rate limits. Please check your Gemini quota/billing or try again later.",
                    "details": err_s
                }), 429
            return jsonify({"error": f"Architect failed: {err_s}"}), 500
        
        # Merge vocab
        all_vocab = list(set(core_vocab + outline.get('recommended_vocab', [])))
        time.sleep(15)
        # === PHASE 2-4: AUTHOR + CRITIC LOOP ===
        while attempts < max_retries:
            attempts += 1
            print(f"\n📝 AGENT 2 (AUTHOR): Attempt {attempts}/{max_retries}")
            
            # 💤 DELAY để tránh rate limit (Free tier: 15 req/min = 1 req/4s)
            if attempts > 1:  # Skip delay for first attempt
                print(f"⏳ Waiting 5 seconds before attempt {attempts} (Free API rate limit protection)...")
                time.sleep(5)  # 5s delay = safe for Free tier
            
            # Build Author prompt
            if attempts == 1:
                # Get readability guidance
                flesch_range = CEFR_FLESCH_MAP.get(cefr_level, {'min': 40, 'max': 60, 'grade': 'Standard'})
                
                author_prompt = f"""
You are "The Author" - an expert writer of IELTS reading materials.

OUTLINE (follow this structure):
{json.dumps(outline, indent=2)}

REQUIREMENTS:
- Write exactly {word_count} words (±10%)
- CEFR Level: {cefr_level} - {flesch_range['grade']} 
- Tone: {tone}
- MUST include these vocabulary words naturally: {', '.join(all_vocab[:10]) if all_vocab else 'none'}

READABILITY RULES FOR {cefr_level}:
- Target Flesch Reading Ease Score: {flesch_range['min']}-{flesch_range['max']}
- Use {'VERY SHORT sentences (5-8 words). SIMPLE vocabulary only.' if cefr_level in ['A1', 'A2'] else 'short-to-medium sentences (8-15 words). Clear, common vocabulary.' if cefr_level == 'B1' else 'medium sentences (12-18 words). Some complex words OK.' if cefr_level == 'B2' else 'longer sentences (15-25 words). Advanced vocabulary encouraged.' if cefr_level in ['C1', 'C2'] else 'medium sentences'}
- Avoid: {'complex grammar, subordinate clauses, advanced idioms' if cefr_level in ['A1', 'A2', 'B1'] else 'overly academic jargon only' if cefr_level == 'B2' else 'only extremely rare words'}

IMPORTANT: Write PLAIN TEXT only. Do NOT use HTML tags, HTML entities (&nbsp;, &lt;, etc.), or any markup. Use normal spaces and punctuation.

OUTPUT (JSON only, no markdown):
{{
  "title": "Your final title",
  "passage": "Full passage text here. Multiple paragraphs separated by double newlines."
}}
"""
            else:
                # Self-Correction prompt
                prev_errors = all_attempts[-1]['errors']
                prev_flesch = all_attempts[-1]['audit_report'].get('flesch_score', 0)
                flesch_range = CEFR_FLESCH_MAP.get(cefr_level, {'min': 40, 'max': 60})
                
                author_prompt = f"""
You are "The Author". Your previous draft was REJECTED by the Critic.

REASONS FOR REJECTION:
{chr(10).join(f"- {err}" for err in prev_errors)}

PREVIOUS FLESCH SCORE: {prev_flesch} (Target: {flesch_range['min']}-{flesch_range['max']})

OUTLINE (follow this):
{json.dumps(outline, indent=2)}

CORRECTIVE ACTIONS REQUIRED:
{'- INCREASE readability: Use MUCH SIMPLER words, SHORTER sentences (8-12 words max)' if prev_flesch < flesch_range['min'] else '- DECREASE readability: Use more complex vocabulary and longer sentences' if prev_flesch > flesch_range['max'] else '- Maintain current complexity'}
- Reduce word repetition: use synonyms and varied expressions
- Fix grammar issues if any
- Adjust word count to: {word_count} ±10%
- Keep these vocabulary words: {', '.join(all_vocab[:10]) if all_vocab else 'none'}

SPECIFIC TIPS FOR {cefr_level}:
{'- Use present simple tense mostly' if cefr_level in ['A1', 'A2'] else '- Mix simple and continuous tenses' if cefr_level == 'B1' else '- Use varied tenses including perfect forms'}
{'- Avoid phrasal verbs and idioms' if cefr_level in ['A1', 'A2'] else '- Use common phrasal verbs sparingly' if cefr_level == 'B1' else '- Phrasal verbs and idioms OK'}
- Average sentence length: {8 if cefr_level in ['A1', 'A2'] else 12 if cefr_level == 'B1' else 15 if cefr_level == 'B2' else 18} words

IMPORTANT: Write PLAIN TEXT only. Do NOT use HTML tags, HTML entities (&nbsp;, &lt;, etc.), or any markup. Use normal spaces and punctuation.

OUTPUT (JSON only, no markdown):
{{
  "title": "Improved title",
  "passage": "Rewritten passage text."
}}
"""
            
            try:
                print(f"🖊️  AGENT 2 (AUTHOR): Writing attempt {attempts}...")
                author_response = genai_generate_with_backoff(MODEL_NAME, author_prompt)
                draft_text = author_response.text.replace('```json', '').replace('```', '').strip()
                draft = json.loads(draft_text)
                title = draft.get('title', '')
                passage = draft.get('passage', '')
                
                # Decode HTML entities (e.g., &nbsp; → space, &lt; → <)
                title = html.unescape(title)
                passage = html.unescape(passage)
                
                print(f"   Generated: {len(passage.split())} words")
                
            except Exception as e:
                print(f"❌ Author failed: {e}")
                all_attempts.append({
                    'attempt': attempts,
                    'status': 'author_failed',
                    'error': str(e)
                })
                continue
            
            # === PHASE 3: CRITIC AUDIT ===
            print(f"🔍 AGENT 3 (CRITIC): Auditing draft {attempts}...")
            passed, report, errors = critic_audit(passage, title, cefr_level, word_count)
            
            attempt_record = {
                'attempt': attempts,
                'title': title,
                'word_count': len(passage.split()),
                'audit_report': report,
                'errors': errors,
                'status': 'accepted' if passed else 'rejected'
            }
            all_attempts.append(attempt_record)
            
            if passed:
                print(f"✅ ACCEPTED! (Flesch: {report.get('flesch_score', 'N/A')}, Diversity: {report.get('lexical_diversity', 'N/A')})")
                final_result = {
                    'status': 'success',
                    'attempts': attempts,
                    'title': title,
                    'passage': passage,
                    'outline': outline,
                    'audit_report': report,
                    'cefr_level': cefr_level,
                    'word_count': len(passage.split()),
                    'all_attempts': all_attempts
                }
                break
            else:
                print(f"❌ REJECTED: {errors}")
                if attempts >= max_retries:
                    print(f"⚠️  Max retries reached. Returning best attempt.")
                    final_result = {
                        'status': 'max_retries_reached',
                        'attempts': attempts,
                        'title': title,
                        'passage': passage,
                        'outline': outline,
                        'audit_report': report,
                        'errors': errors,
                        'all_attempts': all_attempts,
                        'warning': 'Generated content did not pass all audits after max retries'
                    }
        
        if not final_result:
            return jsonify({"error": "Generation failed after all attempts"}), 500
        
        print(f"\n{'='*60}")
        print(f"🎉 GENERATION COMPLETE: {final_result['status']}")
        print(f"{'='*60}\n")
        
        return jsonify(final_result), 200
        
    except Exception as e:
        print(f"❌ System Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ==========================================
# 🎙️ API: SPEAKING - GENERATE SAMPLE ANSWER
# ==========================================
@app.route('/api/speaking/generate-sample', methods=['POST'])
def generate_speaking_sample():
    """Generate a band 7-8 sample answer for an IELTS speaking question."""
    try:
        data = request.json
        question    = data.get('question', '')
        part        = data.get('part', 'p1')         # free / p1 / p2 / p3
        cefr_level  = data.get('cefr_level', 'B2')
        difficulty  = data.get('difficulty', 'medium')
        keywords    = data.get('keywords', [])
        follow_ups  = data.get('follow_up_questions', [])

        if not question:
            return jsonify({"error": "Thiếu câu hỏi"}), 400

        part_label_map = {'free': 'Free Speaking', 'p1': 'Part 1 (Interview)', 'p2': 'Part 2 (Long Turn)', 'p3': 'Part 3 (Discussion)'}
        part_label = part_label_map.get(part, part)

        # Word-count guideline per part
        word_guide = {
            'free': '60-100 words',
            'p1':   '50-80 words',
            'p2':   '150-220 words (2-minute monologue)',
            'p3':   '100-160 words (analytical response)',
        }.get(part, '80-120 words')

        kw_hint = f"\nTry to naturally incorporate these keywords: {', '.join(keywords)}" if keywords else ""
        fup_hint = f"\nAlso briefly address these follow-up angles if relevant: {'; '.join(follow_ups)}" if follow_ups else ""

        prompt = f"""
You are an experienced IELTS Speaking examiner writing a model answer for teaching purposes.

## TASK
Write a natural, fluent Band 7-8 model spoken answer for the following IELTS {part_label} question.

## QUESTION
"{question}"

## CONSTRAINTS
- CEFR target level: {cefr_level}
- Difficulty: {difficulty}
- Target length: {word_guide}
- The answer must sound SPOKEN (natural fillers like "Well,", "To be honest,", "I mean," are fine)
- Use a variety of vocabulary and grammar structures appropriate for the CEFR level
- Do NOT use overly academic or written-style language — it must sound like real speech{kw_hint}{fup_hint}

## OUTPUT FORMAT
Return ONLY a JSON object (no markdown) with this exact structure:
{{
  "sample_answer": "The full spoken answer text here.",
  "band_estimate": "7.0",
  "highlights": ["notable vocab or structure used", "..."]
}}
"""
        response = genai_generate_with_backoff(MODEL_NAME, prompt)
        raw = response.text.strip().replace('```json', '').replace('```', '').strip()

        try:
            parsed = json.loads(raw)
            return jsonify(parsed), 200
        except Exception:
            # If JSON parse fails, return the raw text as sample_answer
            return jsonify({"sample_answer": raw, "band_estimate": "7.0", "highlights": []}), 200

    except Exception as e:
        print(f"❌ generate_speaking_sample error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ==========================================
# 🎤 API: SPEAKING PRACTICE — HYBRID ENGINE
# Phase: warmup | main | followup
# ==========================================
import math
import re as _re

def _offline_fluency_score(transcript, wpm, hesitation_count, rhythm_std):
    """Tính điểm Fluency offline từ WPM + hesitation + rhythm."""
    # WPM chuẩn IELTS Speaking: 110-160 wpm → điểm cao nhất
    if wpm == 0:
        return 3.0
    if wpm < 60:
        wpm_score = 4.0
    elif wpm < 90:
        wpm_score = 5.0
    elif wpm < 110:
        wpm_score = 6.0
    elif wpm <= 160:
        wpm_score = 8.5
    elif wpm <= 200:
        wpm_score = 7.5
    else:
        wpm_score = 6.5  # Nói quá nhanh → mất điểm

    # Trừ điểm cho hesitation
    hesitation_penalty = min(hesitation_count * 0.4, 2.5)

    # Rhythm penalty (std > 0.6 → "giật cục")
    rhythm_penalty = min(rhythm_std * 1.5, 1.5) if rhythm_std > 0.4 else 0

    score = wpm_score - hesitation_penalty - rhythm_penalty
    return round(max(3.0, min(9.0, score)), 1)


def _offline_grammar_bleu(transcript, sample_answer):
    """N-gram BLEU-like overlap giữa transcript và sample answer → Grammar/Lexical score."""
    if not transcript or not sample_answer:
        return 5.0

    def ngrams(tokens, n):
        return [tuple(tokens[i:i+n]) for i in range(len(tokens)-n+1)]

    def tokenize(text):
        return _re.sub(r'[^a-z\s]', '', text.lower()).split()

    ref = tokenize(sample_answer)
    hyp = tokenize(transcript)
    if not hyp or not ref:
        return 5.0

    scores = []
    for n in [1, 2, 3]:
        ref_ng = ngrams(ref, n)
        hyp_ng = ngrams(hyp, n)
        if not hyp_ng:
            continue
        ref_set = {}
        for ng in ref_ng:
            ref_set[ng] = ref_set.get(ng, 0) + 1
        match = 0
        for ng in hyp_ng:
            if ref_set.get(ng, 0) > 0:
                match += 1
                ref_set[ng] -= 1
        precision = match / len(hyp_ng)
        scores.append(precision)

    if not scores:
        return 5.0

    avg = sum(scores) / len(scores)
    # Scale 0→1 into IELTS band 4→9
    band = 4.0 + avg * 5.0
    return round(min(9.0, max(4.0, band)), 1)


def _double_metaphone_simple(word):
    """Very simplified Double Metaphone — just strips vowels/common alt-spellings."""
    w = word.lower()
    w = _re.sub(r'[aeiou]', '', w)
    w = w.replace('ph', 'f').replace('ck', 'k').replace('th', 't')
    return w


def _offline_pronunciation_score(transcript, sample_answer):
    """Dùng soundex-like similarity để bắt lỗi phát âm mờ."""
    if not transcript or not sample_answer:
        return 5.0
    def tokenize(text):
        return _re.sub(r'[^a-z\s]', '', text.lower()).split()
    ref_tokens = tokenize(sample_answer)
    hyp_tokens = tokenize(transcript)
    if not hyp_tokens or not ref_tokens:
        return 5.0
    ref_meta = set(_double_metaphone_simple(w) for w in ref_tokens)
    matches = sum(1 for w in hyp_tokens if _double_metaphone_simple(w) in ref_meta)
    ratio = matches / max(len(hyp_tokens), 1)
    band = 4.0 + ratio * 5.0
    return round(min(9.0, max(4.0, band)), 1)


@app.route('/api/speaking-practice/evaluate', methods=['POST'])
def evaluate_speaking_practice():
    """
    Body (multipart/form-data):
      audio        : audio file (wav/mp3/webm)
      question     : câu hỏi đang trả lời
      phase        : 'warmup' | 'main' | 'followup'
      sample_answer: đáp án mẫu (tùy chọn, dùng offline fallback)
      frontend_data: JSON string { wpm, hesitation_count, rhythm_std, duration_sec }
      mode         : 'online' | 'offline' (chế độ đánh giá)
    """
    try:
        if whisper_model is None:
            return jsonify({"error": "Whisper chưa load! Kiểm tra FFmpeg."}), 500

        if 'audio' not in request.files:
            return jsonify({"error": "Thiếu audio"}), 400

        audio_file   = request.files['audio']
        question     = request.form.get('question', 'Tell me about yourself.')
        phase        = request.form.get('phase', 'main')   # warmup | main | followup
        sample_ans   = request.form.get('sample_answer', '')
        fe_data_raw  = request.form.get('frontend_data', '{}')

        try:
            fe_data = json.loads(fe_data_raw)
        except Exception:
            fe_data = {}

        wpm             = float(fe_data.get('wpm', 0))
        hesitation_count = int(fe_data.get('hesitation_count', 0))
        rhythm_std      = float(fe_data.get('rhythm_std', 0))
        duration_sec    = float(fe_data.get('duration_sec', 0))

        # ── 1. Save & Whisper ──────────────────────────────────────────────────
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name

        # ── 1b. Whisper transcription (có fallback nếu Whisper lỗi) ──────────────
        print(f"🎤 Speaking Practice [{phase}]: Whisper đang phân tích...")
        transcript = ''
        try:
            whisper_result = whisper_model.transcribe(tmp_path)
            transcript = whisper_result.get('text', '').strip()
            print(f"📝 Transcript: {transcript}")
        except Exception as whisper_err:
            print(f"⚠️ Whisper thất bại → dùng frontend_data làm fallback: {whisper_err}")
            # Lấy transcript từ Web Speech API nếu frontend gửi lên
            transcript = fe_data.get('browser_transcript', '').strip()
            if not transcript:
                transcript = f"[Whisper lỗi - dùng điểm offline từ frontend_data: WPM={int(wpm)}]"

        # ── 2. Try Online (Gemini) ─────────────────────────────────────────────
        online_ok = False
        result = {}
        try:
            # SỬA LỖI: Dùng file= thay vì path=
            uploaded_file = client.files.upload(file=tmp_path)

            phase_instruction = {
                'warmup': 'This is a warm-up question (easy ice-breaker, 10-15 seconds expected).',
                'main':   'This is the Main IELTS Speaking Part 2 challenge (45 seconds expected).',
                'followup': 'This is a follow-up conversational question (Part 3 style, 20-30 seconds).',
            }.get(phase, 'This is a standard IELTS Speaking question.')

            prompt = f"""
You are a strict IELTS Speaking Examiner with 20 years of experience.

## CONTEXT
{phase_instruction}
Question asked: "{question}"

## INPUT
Whisper Transcript (verbatim, including all fillers like um/uh/ah): "{transcript}"
Frontend Fluency Data:
  - WPM: {wpm} (0 = not measured)
  - Hesitation words counted by browser: {hesitation_count}
  - Rhythm standard deviation: {rhythm_std} (higher = more uneven)
  - Recording duration: {duration_sec}s

## TASK
1. Score each IELTS criterion on a scale of 0.0–9.0 (0.5 increments).
2. Generate a follow-up question based on what the user just said.
3. Provide a corrected/improved version of the answer at Band 7 level.
4. List up to 3 specific mistakes found.

## OUTPUT (JSON ONLY, feedback in Vietnamese):
{{
  "transcript": "{transcript}",
  "scores": {{
    "fluency": <0-9>,
    "pronunciation": <0-9>,
    "lexical": <0-9>,
    "grammar": <0-9>,
    "overall": <0-9>
  }},
  "feedback": {{
    "fluency":       "[Nhận xét về độ trôi chảy bằng Tiếng Việt]",
    "pronunciation": "[Nhận xét phát âm bằng Tiếng Việt]",
    "lexical":       "[Nhận xét từ vựng bằng Tiếng Việt]",
    "grammar":       "[Nhận xét ngữ pháp bằng Tiếng Việt]"
  }},
  "mistakes": [
    {{"word": "...", "error": "...", "fix": "..."}}
  ],
  "follow_up_question": "[Câu hỏi tiếp theo bằng Tiếng Anh, liên quan đến câu trả lời vừa nghe]",
  "improved_answer": "[Câu trả lời Band 7 viết lại bằng Tiếng Anh]",
  "encouragement": "[1 câu động viên ngắn bằng Tiếng Việt]"
}}
"""
            response = genai_generate_with_backoff(MODEL_NAME, [prompt, uploaded_file])
            raw = response.text.strip().replace('```json', '').replace('```', '').strip()
            result = json.loads(raw)
            result['source'] = 'online'
            online_ok = True

        except Exception as ai_err:
            print(f"⚠️ Gemini/Online thất bại → kích hoạt Offline Engine: {ai_err}")

        # ── 3. Offline Fallback ────────────────────────────────────────────────
        if not online_ok:
            # Tầng 3: Phao Cứu Sinh
            fluency_score = _offline_fluency_score(transcript, wpm, hesitation_count, rhythm_std)
            grammar_score = _offline_grammar_bleu(transcript, sample_ans)
            lexical_score = grammar_score  # Same N-gram overlap used for lexical
            pron_score    = _offline_pronunciation_score(transcript, sample_ans)
            overall       = round((fluency_score + grammar_score + lexical_score + pron_score) / 4, 1)

            result = {
                'transcript': transcript,
                'scores': {
                    'fluency':       fluency_score,
                    'pronunciation': pron_score,
                    'lexical':       lexical_score,
                    'grammar':       grammar_score,
                    'overall':       overall,
                },
                'feedback': {
                    'fluency':       f"Tốc độ nói đo được: {int(wpm)} WPM. {'Tốt!' if 110 <= wpm <= 160 else 'Cần luyện tập thêm để đạt 110-160 WPM.'}",
                    'pronunciation': 'Phân tích phát âm offline (chế độ dự phòng khi AI không kết nối).',
                    'lexical':       'Đánh giá từ vựng dựa trên độ tương đồng với đáp án mẫu.',
                    'grammar':       f"Phát hiện ~{hesitation_count} từ ngập ngừng (um/uh/ah). {'Tốt, không có nhiều.' if hesitation_count < 3 else 'Cần giảm bớt từ ngập ngừng.'}",
                },
                'mistakes': [],
                'follow_up_question': 'Can you tell me more about that?',
                'improved_answer': sample_ans or 'No sample answer provided.',
                'encouragement': 'Tiếp tục cố gắng! Mỗi lần luyện tập là một bước tiến.',
                'source': 'offline',
            }

        # ── Cleanup ────────────────────────────────────────────────────────────
        try:
            os.remove(tmp_path)
        except Exception:
            pass

        return jsonify(result), 200

    except Exception as e:
        print(f"❌ evaluate_speaking_practice error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)