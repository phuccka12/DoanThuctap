app_file = r'd:\ĐỒ ÁN THỰC TẬP\Doantotnghiep\server\python_ai\app.py'

# Đọc file
with open(app_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Code route mới
new_route = '''
# ==========================================
# 🎤 API: HYBRID SPEAKING EVALUATION (NEW)
# ==========================================
# Hybrid = XGBoost Acoustic + Gemini Feedback

@app.route('/api/speaking/evaluate-hybrid', methods=['POST'])
def evaluate_speaking_hybrid_api():
    """
    Enhanced Speaking Evaluation using Hybrid Model
    XGBoost Physical Scoring + Gemini AI Feedback
    """
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        audio_file = request.files['audio']
        transcript = request.form.get('transcript', '')
        question = request.form.get('question', '')
        
        # Save temp audio
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name
        
        # Convert to WAV if needed
        try:
            audio = AudioSegment.from_file(tmp_path)
            wav_path = tmp_path.replace(".webm", ".wav")
            audio.export(wav_path, format="wav")
        except:
            wav_path = tmp_path
        
        # 🎼 HYBRID EVALUATION
        hybrid_result = evaluate_speaking_hybrid(
            audio_path=wav_path,
            transcript=transcript,
            target_question=question,
            gemini_service=gemini_service
        )
        
        # Format for frontend
        response = format_speaking_response(hybrid_result)
        
        # Cleanup
        clean_temp_file(tmp_path, wav_path)
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"❌ Hybrid Speaking Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "success": False}), 500

'''

# Tìm dòng @app.route('/api/ai/writing
target_line = None
for i, line in enumerate(lines):
    if "@app.route('/api/ai/writing/evaluate'" in line:
        target_line = i
        break

if target_line:
    lines.insert(target_line, new_route)
    with open(app_file, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print(f"✅ Route added successfully at line {target_line}!")
else:
    print("❌ Target route not found")
