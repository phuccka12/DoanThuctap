import os
import sys
import joblib
import pandas as pd
import numpy as np

# Thêm đường dẫn để import services
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.audio_service import extract_audio_features_pro

def test_hybrid_flow():
    # 1. Đường dẫn file
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    MODEL_PATH = os.path.join(BASE_DIR, 'Random_forest', 'alex_speaking_brain_pro.joblib')
    
    # Tìm 1 file wav bất kỳ để test
    test_audio = None
    for root, dirs, files in os.walk(BASE_DIR):
        for f in files:
            if f.endswith('.wav') or f.endswith('.mp3'):
                test_audio = os.path.join(root, f)
                break
        if test_audio: break

    if not test_audio:
        print("❌ Không tìm thấy file audio nào để test!")
        return

    print(f"🎬 Đang test với file: {test_audio}")

    # 2. Test Feature Extraction
    print("🔬 Đang trích xuất đặc trưng (Tai)...")
    feats = extract_audio_features_pro(test_audio)
    if not feats:
        print("❌ Lỗi trích xuất đặc trưng!")
        return
    
    print(f"✅ Đã trích xuất {len(feats)} đặc trưng.")
    print(f"   - Silence Ratio: {feats['silence_ratio']:.2f}")
    print(f"   - Pitch Mean: {feats['pitch_mean']:.2f}")

    # 3. Test Model Prediction
    print(f"🧠 Đang nạp mô hình: {MODEL_PATH}")
    try:
        model = joblib.load(MODEL_PATH)
        df_feats = pd.DataFrame([feats])
        score = model.predict(df_feats)[0]
        print(f"✅ Dự đoán điểm Accuracy (XGBoost): {score:.2f}/9.0")
    except Exception as e:
        print(f"❌ Lỗi nạp mô hình hoặc dự đoán: {e}")

if __name__ == "__main__":
    test_hybrid_flow()
