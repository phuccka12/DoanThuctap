#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
🧪 QUICK API TEST - Hybrid Speaking Evaluation
Demo request to /api/speaking/evaluate-hybrid endpoint
"""

import requests
import json
import sys

API_URL = "http://localhost:5000/api/speaking/evaluate-hybrid"

# ============================================
# TEST 1: Without actual audio (mock test)
# ============================================
print("=" * 60)
print("🧪 TEST: POST /api/speaking/evaluate-hybrid")
print("=" * 60)

print("\n⚠️  This test requires:")
print("   1. Flask server running (python app.py)")
print("   2. Audio file to upload")
print("   3. Gemini API key configured")

print("\n💡 Example using curl:")
print("""
curl -X POST http://localhost:5000/api/speaking/evaluate-hybrid \\
  -F "audio=@test_audio.wav" \\
  -F "transcript=Hello my name is John" \\
  -F "question=Tell me about yourself"
""")

print("\n💡 Example using Python requests:")
print("""
import requests

with open('test_audio.wav', 'rb') as f:
    files = {'audio': f}
    data = {
        'transcript': 'Hello my name is John',
        'question': 'Tell me about yourself'
    }
    response = requests.post(
        'http://localhost:5000/api/speaking/evaluate-hybrid',
        files=files,
        data=data
    )
    print(response.json())
""")

print("\n✅ Expected Response Structure:")
expected_response = {
    "success": True,
    "source": "hybrid-xgboost-gemini",
    "scores": {
        "overall": 7.5,
        "pronunciation": 7.8,
        "fluency": 7.2,
        "confidence": 7.4
    },
    "band": "7.0-band",
    "strengths": [
        "Clear articulation",
        "Natural intonation"
    ],
    "areas_for_improvement": [
        "/ð/ sound needs clarity",
        "Reduce hesitation pauses"
    ],
    "feedback": "Phát âm của bạn khá tốt!",
    "tips": [
        "Practice /θ/ vs /ð/ distinction"
    ],
    "xgboost_acoustic": 7.65,
    "xgboost_confidence": 0.87,
    "native_reference": "Compare with native speaker"
}

print(json.dumps(expected_response, indent=2, ensure_ascii=False))

print("\n" + "=" * 60)
print("📊 Score Breakdown:")
print("=" * 60)
print("""
✅ overall: Combined score from Gemini (70%) + XGBoost (30%)
✅ pronunciation: From Gemini AI analysis
✅ fluency: Speech flow and continuity
✅ confidence: Model confidence in the prediction
✅ band: IELTS Band score interpretation
✅ xgboost_acoustic: Raw XGBoost score
✅ xgboost_confidence: How confident is XGBoost model (0-1)
""")

print("\n" + "=" * 60)
print("🔧 Implementation Points:")
print("=" * 60)
print("""
Route: POST /api/speaking/evaluate-hybrid
Function: evaluate_speaking_hybrid_api() in app.py

Flow:
1. Audio uploaded → Convert to WAV
2. Whisper transcription
3. extract_acoustic_features() → 44 features
4. score_with_xgboost() → pronunciation score
5. detect_pronunciation_issues() → error list
6. build_gemini_prompt() → enhanced prompt
7. Gemini API call → detailed feedback
8. format_speaking_response() → frontend JSON
9. Return 200 OK with results

Fallback:
- If Gemini fails: Return XGBoost score only
- If XGBoost fails: Return 5.0 (default)
""")

print("\n" + "=" * 60)
print("✅ INTEGRATION COMPLETE & READY FOR TESTING")
print("=" * 60)
