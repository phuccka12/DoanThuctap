import os
import tempfile
import random
import time
import json
import uuid
import html
import asyncio
import re as _re
from pydub import AudioSegment
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor

# --- IMPORT MODULAR SERVICES ---
import services.gemini_service as gemini_service
from services.audio_service import whisper_model, transcribe_audio, extract_pitch, get_audio_duration
from services.tts_service import run_tts_sync, generate_audio_edge
from services.nlp_service import (
    analyze_deep_tech, check_grammar, _offline_writing_score, 
    _offline_fluency_score, CEFR_FLESCH_MAP
)
from services.ollama_service import call_ollama, check_ollama_status, call_ollama_stream
from services.vector_service import vector_service
from services.analytic_service import analytic_service
from services.writing_service import writing_service

from utils.helpers import clean_temp_file, parse_json_safely

load_dotenv()
app = Flask(__name__)
CORS(app)

# --- THREAD POOL FOR PARALLEL TASKS ---
executor = ThreadPoolExecutor(max_workers=4)

# --- GLOBAL CACHE FOR QUOTA SAVING ---
GREETING_CACHE = {} 
CACHE_DURATION = 600

# --- WRITING TASK STORE ---
WRITING_TASKS = {}

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
        result = gemini_service.call_gemini_json(prompt)
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
        Role: IELTS Speaking Examiner. 
        Transcript: "{transcript}"
        Pitch Data Points: {len(pitch_data)}
        Output JSON in Vietnamese: overall_score, radar_chart (TR, CC, LR, GRA), detailed_feedback, mistakes_timeline, vocab_upgrade, better_version.
        """
        
        # Thử Gemini
        ai_result = None
        if time.time() - LAST_QUOTA_ERROR_TIME > OFFLINE_COOLDOWN:
            ai_result = gemini_service.call_gemini_json(prompt)
            if not ai_result:
                LAST_QUOTA_ERROR_TIME = time.time()
        
        # Thử Ollama nếu cần
        if not ai_result and check_ollama_status():
            print("🛡️ [OFFLINE EVALUATION] Using Ollama for Speaking Assessment.")
            ai_result = call_ollama(prompt) # call_ollama cũng đã hỗ trợ JSON qua format="json"
        
        clean_temp_file(tmp_path)

        if ai_result:
            ai_result["pitch_data"] = pitch_data
            return jsonify(ai_result), 200
        
        # Fallback cuối cùng nếu cả 2 đều lỗi
        return jsonify({
            "transcript": transcript, 
            "pitch_data": pitch_data,
            "overall_score": 5.0,
            "detailed_feedback": "Hệ thống đang bận, hãy thử lại sau hoặc chuyển sang chế độ Local AI."
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/speaking/conversation', methods=['POST'])
def conversation():
    try:
        audio_file = request.files['audio']
        history_str = request.form.get('history', '[]') 
        voice_id = request.form.get('voice', 'en-GB-SoniaNeural') # Lấy giọng nói từ FE
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name

        # 1. Chạy song song STT và Pitch
        future_stt = executor.submit(transcribe_audio, tmp_path)
        future_pitch = executor.submit(extract_pitch, tmp_path)
        
        # 2. Đợi STT xong (Nhanh với Faster-Whisper)
        stt_res = future_stt.result()
        user_text = stt_res.get("text", "")
        
        # 3. CHIẾN THUẬT "STREAMING & PARALLEL TTS": Tối ưu tốc độ phản hồi
        now = time.time()
        ai_response_text = ""
        correction_tip = ""
        global LAST_QUOTA_ERROR_TIME
        
        # 3. QUẢN LÝ NGỮ CẢNH THÔNG MINH (Lấy 5 tin nhắn gần nhất)
        try:
            full_history = json.loads(history_str)
            # Chỉ lấy 5 lượt hội thoại gần nhất để nhất quán nhưng vẫn đủ sâu
            recent_history = full_history[-5:] if len(full_history) > 5 else full_history
            history_window = json.dumps(recent_history, ensure_ascii=False)
        except:
            history_window = history_str[-2000:] # Fallback
        
        async def handle_ai_speaking():
            global LAST_QUOTA_ERROR_TIME
            nonlocal ai_response_text
            full_text = ""
            audio_segments = []
            sentence_buffer = ""
            tts_tasks = []
            
            # --- RAG: Tìm kiếm kiến thức bổ trợ ---
            knowledge_hints = ""
            rag_res = vector_service.query_knowledge(user_text, n_results=2)
            if rag_res and rag_res['documents']:
                knowledge_hints = "\nRelevant IELTS Examples/Vocab:\n" + "\n".join(rag_res['documents'][0])
                # Thêm cả các đáp án mẫu từ metadata nếu có
                for meta in rag_res['metadatas'][0]:
                    if meta.get('answer'):
                        knowledge_hints += f"\nNote: {meta['answer'][:500]}"
            
            # --- PHASE 1: Thử Gemini ---
            use_ollama = True
            if now - LAST_QUOTA_ERROR_TIME > OFFLINE_COOLDOWN:
                try:
                    prompt = f"""
                    Role: Friendly IELTS Speaking Examiner. 
                    History: {history_window}
                    Candidate said: "{user_text}"
                    Instruction: 
                    - If this is the start (Part 1), be very gentle. 
                    - Ask ONLY one simple individual question. 
                    - Do not overwhelm the candidate.
                    - Respond naturally and encouragingly.
                    - Use the provided context/knowledge to suggest advanced vocabulary if applicable.
                    {knowledge_hints}
                    Text only, no JSON.
                    """
                    stream_gen = gemini_service.call_gemini_stream(prompt)
                    
                    gemini_success = False
                    for chunk in stream_gen:
                        if chunk:
                            gemini_success = True
                            full_text += chunk
                            sentence_buffer += chunk
                            
                            if any(p in sentence_buffer for p in ['. ', '? ', '! ', '\n']):
                                parts = _re.split(r'(?<=[.?!])\s+|\n', sentence_buffer)
                                for i in range(len(parts) - 1):
                                    s = parts[i].strip()
                                    if s and len(s) > 2:
                                        chunk_path = os.path.join("static", f"chunk_{uuid.uuid4()}.mp3")
                                        audio_segments.append(chunk_path)
                                        tts_tasks.append(generate_audio_edge(s, chunk_path, voice=voice_id))
                                sentence_buffer = parts[-1]
                    
                    if gemini_success:
                        use_ollama = False
                    else:
                        LAST_QUOTA_ERROR_TIME = time.time()
                except Exception as e:
                    print(f"⚠️ Gemini Catch-all Error: {e}")
                    LAST_QUOTA_ERROR_TIME = time.time()

            # --- PHASE 2: Fallback sang Ollama (nếu Gemini fail hoặc đang cooldown) ---
            if use_ollama:
                if check_ollama_status():
                    print("🛡️ [AUTO FALLBACK] Gemini failed. Switching to Ollama for current request.")
                    # Profile cho AI Local (Cần ngắn gọn, súc tích hơn)
                    ollama_prompt = f"""
                    Role: Friendly and Patient IELTS Examiner. 
                    Context: {history_window[-1000:]}
                    Candidate said: "{user_text}"
                    Instruction: 
                    - Be very gentle and encouraging.
                    - Respond briefly and ask ONLY ONE simple next question.
                    - Focus on Part 1 style (simple personal questions).
                    - Knowledge Hints: {knowledge_hints}
                    """
                    stream_gen = call_ollama_stream(ollama_prompt)
                    for chunk in stream_gen:
                        if chunk:
                            full_text += chunk
                            sentence_buffer += chunk
                            if any(p in sentence_buffer for p in ['. ', '? ', '! ', '\n']):
                                parts = _re.split(r'(?<=[.?!])\s+|\n', sentence_buffer)
                                for i in range(len(parts) - 1):
                                    s = parts[i].strip()
                                    if s and len(s) > 2:
                                        chunk_path = os.path.join("static", f"chunk_{uuid.uuid4()}.mp3")
                                        audio_segments.append(chunk_path)
                                        tts_tasks.append(generate_audio_edge(s, chunk_path, voice=voice_id))
                                sentence_buffer = parts[-1]

            # Xử lý đoạn văn cuối cùng
            if sentence_buffer.strip():
                chunk_path = os.path.join("static", f"chunk_{uuid.uuid4()}.mp3")
                audio_segments.append(chunk_path)
                tts_tasks.append(generate_audio_edge(sentence_buffer.strip(), chunk_path, voice=voice_id))

            if tts_tasks:
                try:
                    await asyncio.gather(*tts_tasks)
                except Exception as e:
                    print(f"⚠️ Async TTS Gather Error: {e}")
            
            ai_response_text = full_text.strip()
            return audio_segments

        # Chạy logic Async an toàn trong Flask / Thread
        try:
            # Sử dụng asyncio.run cho gọn gàng và tự động dọn dẹp loop
            audio_paths = asyncio.run(handle_ai_speaking())
        except Exception as e:
            print(f"❌ AI Speaking Async Critical Error: {e}")
            # Fallback nếu toàn bộ luồng async sập
            ai_response_text = random.choice(FALLBACK_QUESTIONS) if not ai_response_text else ai_response_text
            audio_paths = []

        # 4. GHÉP AUDIO & TRẢ VỀ JSON
        final_filename = f"ai_ask_{uuid.uuid4()}.mp3"
        final_path = os.path.join("static", final_filename)
        os.makedirs("static", exist_ok=True)

        if audio_paths:
            try:
                combined = AudioSegment.empty()
                for p in audio_paths:
                    if os.path.exists(p):
                        combined += AudioSegment.from_file(p)
                        os.remove(p)
                combined.export(final_path, format="mp3")
            except Exception as e:
                print(f"⚠️ Merge Audio Error: {e}")
                run_tts_sync(ai_response_text, final_path, voice=voice_id)
        else:
            run_tts_sync(ai_response_text, final_path, voice=voice_id)

        # 5. Phân tích ngữ pháp (Correction Tip)
        errors = check_grammar(user_text)
        if errors:
            correction_tip = f"Tip: {errors[0]['error']}. Instead of '{errors[0]['word']}', try '{errors[0]['fix']}'."

        # Lấy Pitch data (đã chạy song song từ đầu)
        pitch_data = future_pitch.result()
        
        # --- Feature Extraction (The "Eyes") ---
        fluency_stats = analytic_service.extract_fluency_features(tmp_path)
        lexical_stats = analytic_service.extract_lexical_features(user_text)

        return jsonify({
            "user_transcript": user_text,
            "ai_response_text": ai_response_text,
            "ai_audio_url": f"{request.host_url}static/{final_filename}",
            "correction": correction_tip,
            "pitch_data": pitch_data,
            "analytics": {
                "fluency": fluency_stats,
                "lexical": lexical_stats
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Đảm bảo dọn dẹp file tạm dù có lỗi hay không
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            clean_temp_file(tmp_path)

# ==========================================
# 🤖 API 4: AGENTIC CONTENT ENGINE
# ==========================================
@app.route('/api/agentic/generate-reading', methods=['POST'])
def agentic_generate_reading():
    # ... Simplified for brief demo, can keep full logic if needed ...
    data = request.json
    prompt = f"Generate IELTS Reading passage about {data.get('topic')}. CEFR: {data.get('cefr_level')}. Word count: {data.get('wordCount')}. JSON output: title, passage."
    result = gemini_service.call_gemini_json(prompt)
    return jsonify(result), 200

@app.route('/api/speaking/start', methods=['GET', 'POST'])
def start_conversation():
    """AI chủ động chào hỏi theo chuẩn IELTS chuyên nghiệp (Có Cache theo Voice ID)"""
    global GREETING_CACHE
    try:
        # 0. Lấy Voice ID từ request
        voice_id = request.args.get('voice', 'en-GB-SoniaNeural')
        
        # 1. Kiểm tra Cache cho voice này
        now = time.time()
        cache = GREETING_CACHE.get(voice_id)
        if cache and now < cache["expires_at"]:
            print(f"💡 [CACHE HIT] Sử dụng câu chào ({voice_id}) từ bộ nhớ đệm.")
            return jsonify({
                "text": cache["text"],
                "audio_url": cache["audio_url"]
            }), 200

        prompt = """
        Role: Friendly and Encouraging IELTS Speaking Examiner. 
        Action: Start a new Speaking Mock Test with a gentle approach.
        Guidelines:
        1. Greet the candidate very warmly (e.g., 'Hello! It's nice to meet you.').
        2. Briefly introduce yourself (e.g., 'I'm Alex, and I'll be your examiner today.').
        3. Ask ONLY ONE simple question to start (e.g., 'First of all, could you tell me your full name, please?').
        4. Do NOT ask multiple questions at once. Keep it simple and welcoming.
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
            data = gemini_service.call_gemini_json(prompt)

        
        if not data: 
            # Tầng cuối cùng: Offline Fallback
            print("🛡️ [FINAL ARCH] Tất cả AI đều bận, sử dụng bộ mẫu chuẩn Offline.")
            text = "Good day! My name is Alex, and I'll be your examiner for this test today. First, could you tell me your full name, please? Also, to start with, I'd like to ask you some questions about your hometown. Where do you come from?"
        else:
            text = data.get("examiner_text", "")



        filename = f"ai_start_{uuid.uuid4()}.mp3"
        filepath = os.path.join("static", filename)
        os.makedirs("static", exist_ok=True)
        
        run_tts_sync(text, filepath, voice=voice_id)
        audio_url = f"{request.host_url}static/{filename}"

        # 2. Cập nhật Cache cho giọng này
        GREETING_CACHE[voice_id] = {
            "text": text,
            "audio_url": audio_url,
            "expires_at": now + 21600 # 6 hours
        }
        
        return jsonify({
            "text": text,
            "audio_url": audio_url
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# ✍️ API 5: WRITING PRO (THE 4-STAGE PIPELINE)
# ==========================================
# --- HELPER: Background Processor ---
def background_evaluate_task(task_id, text, task_type, topic):
    try:
        WRITING_TASKS[task_id] = {"status": "processing", "progress": 10}
        
        # 1. Local Preprocessing
        analysis = writing_service.preprocess(text)
        WRITING_TASKS[task_id]["progress"] = 30
        
        # 2. NLI Analysis
        cohesion_analysis = writing_service.analyze_cohesion_nli(analysis["sentences"])
        WRITING_TASKS[task_id]["progress"] = 50
        
        # 3. Gemini Eyes (Strict Band Descriptors + Reflection + Highlights)
        ai_eyes = gemini_service.evaluate_writing_pro(text, task_type, topic, {
            "stats": analysis["stats"], 
            "sentences": analysis["sentences"],
            "cohesion": cohesion_analysis
        })
        WRITING_TASKS[task_id]["progress"] = 80
        
        if not ai_eyes:
            ai_eyes = {"task_response": {"relevance_score": 5.0}, "highlights": [], "detailed_feedback": "AI đang bận, vui lòng thử lại sau."}

        # 4. Final Scoring (Weighted Consensus)
        final_result = writing_service.calculate_final_score(
            {"stats": analysis["stats"], "cohesion": cohesion_analysis, "discourse_markers": analysis["discourse_markers"], "collocation_errors": analysis.get("collocation_errors", [])},
            ai_eyes
        )

        # Merge Collocation Errors vào Highlights để hiển thị trên Frontend
        if "highlights" not in ai_eyes: ai_eyes["highlights"] = []
        for coll_err in analysis.get("collocation_errors", []):
            ai_eyes["highlights"].append({
                "original_text": coll_err["error"],
                "suggestion": coll_err["suggestion"],
                "explanation": f"Lỗi Collocation: '{coll_err['error']}' không tự nhiên.",
                "category": "vocab"
            })
        
        # 5. Post-processing: Calculate exact offsets for highlights
        refined_highlights = []
        for h in ai_eyes.get("highlights", []):
            orig = h.get("original_text", "")
            if orig and orig in text:
                start = text.find(orig)
                refined_highlights.append({**h, "start": start, "end": start + len(orig)})
            else:
                refined_highlights.append(h)

        # 6. Lưu kết quả
        WRITING_TASKS[task_id].update({
            "status": "completed",
            "progress": 100,
            "result": {
                "sentences": analysis["sentences"],
                "discourse_markers": analysis["discourse_markers"],
                "cohesion": cohesion_analysis,
                "ai_eyes": ai_eyes,
                "highlights": refined_highlights,
                "scoring": final_result
            }
        })
    except Exception as e:
        print(f"❌ Background Task Error: {e}")
        WRITING_TASKS[task_id] = {"status": "failed", "error": str(e)}

@app.route('/api/ai/writing/evaluate', methods=['POST'])
def evaluate_writing_pro():
    data = request.json
    text = data.get('text', '')
    topic = data.get('topic', '')
    
    if not text: return jsonify({"error": "No text"}), 400
    
    task_id = str(uuid.uuid4())
    task_type = data.get('task_type', 'task2') # Mặc định là task2
    WRITING_TASKS[task_id] = {"status": "pending", "progress": 0}
    
    # GỬI KÈM ĐỦ 4 THAM SỐ (Fix Error)
    executor.submit(background_evaluate_task, task_id, text, task_type, topic)
    
    return jsonify({"task_id": task_id, "status": "accepted"}), 202

@app.route('/api/ai/writing/status/<task_id>', methods=['GET'])
def get_writing_status(task_id):
    task = WRITING_TASKS.get(task_id)
    if not task: return jsonify({"error": "Task not found"}), 404
    return jsonify(task)

@app.route('/api/ai/writing/model-essay', methods=['POST'])
def generate_model_essay():
    data = request.json
    topic = data.get('topic', '')
    essay = data.get('essay', '') # Gửi kèm essay của user để AI biết "context"
    
    prompt = f"Role: IELTS Expert. Write a Band 9.0 Model Essay for topic: {topic}. Base on user's ideas if relevant: {essay}"
    
    # Sử dụng stream để user thấy bài viết đang được "gõ"
    def generate():
        for chunk in gemini_service.call_gemini_stream(prompt):
            if chunk: yield chunk
            
    return app.response_class(generate(), mimetype='text/plain')


if __name__ == '__main__':

    app.run(port=5000, debug=True)