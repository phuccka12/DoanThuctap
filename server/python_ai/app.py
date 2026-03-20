import os
import tempfile
import time
import json
import uuid
import html
import asyncio
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor

# --- IMPORT MODULAR SERVICES ---
from services.gemini_service import client, MODEL_NAME, genai_generate_with_backoff, call_gemini_json
from services.audio_service import whisper_model, transcribe_audio, extract_pitch, get_audio_duration
from services.tts_service import run_tts_sync
from services.nlp_service import (
    analyze_deep_tech, check_grammar, _offline_writing_score, 
    _offline_fluency_score, CEFR_FLESCH_MAP
)
from services.ollama_service import call_ollama, check_ollama_status

from utils.helpers import clean_temp_file, parse_json_safely

load_dotenv()
app = Flask(__name__)
CORS(app)

# --- THREAD POOL FOR PARALLEL TASKS ---
executor = ThreadPoolExecutor(max_workers=4)

# --- GLOBAL CACHE FOR QUOTA SAVING ---
GREETING_CACHE = {"text": None, "audio_url": None, "expires_at": 0}
CACHE_DURATION = 600

# --- SMART OFFLINE FALLBACK ---
LAST_QUOTA_ERROR_TIME = 0
OFFLINE_COOLDOWN = 60 # 1 phút nghỉ nếu bị 429
FALLBACK_QUESTIONS = [
    "That's a very interesting point. Can you tell me more about your personal experience with that?",
    "I see. And how does that compare to what people usually do in your country?",
    "That's quite a detailed answer. Why do you think that's the case nowadays?",
    "Interesting. If you had the chance, would you change anything about that situation?",
    "I understand. Moving on, could you tell me a bit more about how this affects your daily life?",
    "That's a common perspective. Do you think this will change in the future?",
    "Actually, that leads me to another question: How do you feel about this topic in general?"
]
import random

print("🚀 HỆ THỐNG AI ĐÃ ĐƯỢC MODULAR HÓA & TỐI ƯU TỐC ĐỘ!")




# ==========================================
# ✍️ API 1: WRITING (HYBRID ENGINE)
# ==========================================
@app.route('/api/writing/check', methods=['POST'])
def check_writing():
    try:
        data = request.json
        text = data.get('text', '')
        topic = data.get('topic', 'General Writing')
        mode = data.get('mode', 'online')
        
        if not text: return jsonify({"error": "Chưa nhập nội dung!"}), 400

        # Run Tech Analysis
        grammar_errors = check_grammar(text)
        tech_data = analyze_deep_tech(text)

        if mode == 'offline':
            result = _offline_writing_score(text, topic, grammar_errors)
            result["mistakes"] = grammar_errors[:10]
            return jsonify(result)

        # Online Mode (Gemini)
        prompt = f"""
        Role: Senior IELTS Examiner. Topic: {topic}. Text: {text}.
        Evidence: {len(grammar_errors)} errors, Flesch Reading Ease: {tech_data['math']['reading_ease']}, 
        Complex Structures (if/although/which): {tech_data['nlp']['complex_count']}.
        Output JSON in Vietnamese: overall_score, radar_chart, system_feedback, topic_vocab_suggestion, detailed_analysis, better_version.
        """
        result = call_gemini_json(prompt)
        if not result:
            return jsonify(_offline_writing_score(text, topic, grammar_errors))
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# 🎤 API 2: SPEAKING (WHISPER + GEMINI)
# ==========================================
@app.route('/api/speaking/check', methods=['POST'])
def evaluate_speaking():
    try:
        if 'audio' not in request.files: return jsonify({"error": "No file"}), 400
        audio_file = request.files['audio']
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name

        # 1. Chạy song song STT và Pitch
        future_stt = executor.submit(transcribe_audio, tmp_path)
        future_pitch = executor.submit(extract_pitch, tmp_path)
        
        # 2. Đợi kết quả
        stt_res = future_stt.result()
        transcript = stt_res.get("text", "")
        pitch_data = future_pitch.result()
        
        # 3. Gửi cho Gemini kèm bằng chứng NLP
        prompt = f"""
        IELTS Speaking Examiner. 
        Transcript: "{transcript}"
        Pitch Data Points: {len(pitch_data)}
        Output JSON in Vietnamese: overall_score, radar_chart, detailed_feedback, mistakes_timeline, vocab_upgrade, better_version.
        """
        ai_result = call_gemini_json(prompt)
        
        clean_temp_file(tmp_path)

        if ai_result:
            ai_result["pitch_data"] = pitch_data
            return jsonify(ai_result), 200
        return jsonify({"transcript": transcript, "pitch_data": pitch_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/speaking/conversation', methods=['POST'])
def conversation():
    try:
        audio_file = request.files['audio']
        history_str = request.form.get('history', '[]') 
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name

        # 1. Chạy song song STT và Pitch
        future_stt = executor.submit(transcribe_audio, tmp_path)
        future_pitch = executor.submit(extract_pitch, tmp_path)
        
        # 2. Đợi STT xong (Nhanh với Faster-Whisper)
        stt_res = future_stt.result()
        user_text = stt_res.get("text", "")
        
        # 3. CHIẾN THUẬT "GỌI SỚM": Gửi cho Gemini luôn, không đợi Pitch
        now = time.time()
        data = None
        global LAST_QUOTA_ERROR_TIME
        
        # Chỉ gọi Gemini nếu không trong thời gian "nghỉ" Quota
        if now - LAST_QUOTA_ERROR_TIME > OFFLINE_COOLDOWN:
            prompt = f"Role: IELTS Examiner. Context: Middle of the test. DO NOT introduce yourself. History: {history_str[-1000:]}. Candidate said: {user_text}. Task: Respond to the candidate and ask the next IELTS question. Format: JSON with 'examiner_response_text', 'correction_tip', 'is_short_answer'."
            data = call_gemini_json(prompt)
            if not data:
                print("⚠️ [SYSTEM] Quota exhausted. Switching to Local AI (Ollama) seamlessly.")
                LAST_QUOTA_ERROR_TIME = now
        else:
            print(f"🛡️ [OFFLINE MODE] Auto-routing to Ollama (Cooldown: {int(OFFLINE_COOLDOWN - (now - LAST_QUOTA_ERROR_TIME))}s remaining).")

        # Thử Ollama nếu Gemini bị lỗi hoặc đang cooldown
        if not data and check_ollama_status():
            # Prompt siêu ngắn cho Local AI để tiết kiệm CPU/RAM
            local_prompt = f"""
            SYSTEM: IELTS Examiner. DO NOT say 'Welcome'.
            HISTORY: {history_str[-300:]}
            CANDIDATE: {user_text}
            JSON: {{ "examiner_response_text": "...", "correction_tip": "...", "is_short_answer": false }}
            """
            data = call_ollama(local_prompt)


        # 4. TRÌNH DỰ PHÒNG THÔNG MINH (Fast-Fail Smart Fallback)
        if not data:
            # Nếu cả Online và Local đều chậm/lỗi, trả về ngay lập tức để giữ mạch hội thoại
            fallback_text = random.choice(FALLBACK_QUESTIONS)
            print(f"⚡ [FAST FAIL] Đang dùng bộ câu hỏi dự phòng để đảm bảo tốc độ phản hồi.")
            data = {
                "examiner_response_text": fallback_text,
                "correction_tip": "Hệ thống đang chạy chế độ Tiết kiệm/Ngoại tuyến để đảm bảo tốc độ cao nhất cho bạn!"
            }


        
        # 5. Trong lúc Gemini "đang nghĩ" thì Pitch chắc cũng đã xong hoặc đang chạy
        pitch_data = future_pitch.result()


        
        filename = f"ai_ask_{uuid.uuid4()}.mp3"
        filepath = os.path.join("static", filename)
        os.makedirs("static", exist_ok=True)
        
        run_tts_sync(data.get("examiner_response_text", ""), filepath)
        
        return jsonify({
            "user_transcript": user_text,
            "ai_response_text": data.get("examiner_response_text"),
            "ai_audio_url": f"{request.host_url}static/{filename}",
            "correction": data.get("correction_tip"),
            "pitch_data": pitch_data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# 🤖 API 4: AGENTIC CONTENT ENGINE
# ==========================================
@app.route('/api/agentic/generate-reading', methods=['POST'])
def agentic_generate_reading():
    # ... Simplified for brief demo, can keep full logic if needed ...
    data = request.json
    prompt = f"Generate IELTS Reading passage about {data.get('topic')}. CEFR: {data.get('cefr_level')}. Word count: {data.get('wordCount')}. JSON output: title, passage."
    result = call_gemini_json(prompt)
    return jsonify(result), 200

@app.route('/api/speaking/start', methods=['GET', 'POST'])
def start_conversation():
    """AI chủ động chào hỏi theo chuẩn IELTS chuyên nghiệp (Có Cache để tiết kiệm Quota)"""
    global GREETING_CACHE
    try:
        # 1. Kiểm tra Cache
        now = time.time()
        if GREETING_CACHE["text"] and now < GREETING_CACHE["expires_at"]:
            print("💡 [CACHE HIT] Sử dụng câu chào từ bộ nhớ đệm để tiết kiệm Quota.")
            return jsonify({
                "text": GREETING_CACHE["text"],
                "audio_url": GREETING_CACHE["audio_url"]
            }), 200

        prompt = """
        Role: Professional IELTS Speaking Examiner. 
        Action: Start a new Speaking Mock Test.
        Structure: 
        1. Greet the candidate warmly (e.g., Good morning/afternoon).
        2. Introduce yourself (e.g., My name is Alex, and I'll be your examiner for this test).
        3. Ask for the candidate's full name.
        4. Transition to Part 1 by asking the very first question on a random common topic (Hometown, Study, Work, or Hobbies).
        Respond in JSON: examiner_text.
        Language: English.
        """

        # KIẾN TRÚC FINAL: Task cơ bản (Chào hỏi) -> Ưu tiên Ollama (Local) trước để tiết kiệm Quota
        data = None
        if check_ollama_status():
            print("🏠 [FINAL ARCH] Task cơ bản: Ưu tiên sử dụng Ollama cho lời chào...")
            data = call_ollama(prompt)
        
        if not data:
            print("🌐 [FINAL ARCH] Ollama không sẵn sàng hoặc lỗi, chuyển sang Gemini...")
            data = call_gemini_json(prompt)

        
        if not data: 
            # Tầng cuối cùng: Offline Fallback
            print("🛡️ [FINAL ARCH] Tất cả AI đều bận, sử dụng bộ mẫu chuẩn Offline.")
            text = "Good day! My name is Alex, and I'll be your examiner for this test today. First, could you tell me your full name, please? Also, to start with, I'd like to ask you some questions about your hometown. Where do you come from?"
        else:
            text = data.get("examiner_text", "")



        filename = f"ai_start_{uuid.uuid4()}.mp3"
        filepath = os.path.join("static", filename)
        os.makedirs("static", exist_ok=True)
        
        run_tts_sync(text, filepath)
        audio_url = f"{request.host_url}static/{filename}"

        # 2. Cập nhật Cache
        GREETING_CACHE = {
            "text": text,
            "audio_url": audio_url,
            "expires_at": now + CACHE_DURATION
        }
        
        return jsonify({
            "text": text,
            "audio_url": audio_url
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':

    app.run(port=5000, debug=True)