import pandas as pd
import os
import sys

# Thêm đường dẫn để import WritingService
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from services.writing_service import WritingService

# Cấu hình đường dẫn
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(BASE_DIR, "Random_forest", "alex_features_ready.csv")
OUTPUT_FILE = os.path.join(BASE_DIR, "Random_forest", "alex_features_v2.csv")

print(f"🚀 Khởi tạo Alex Audit Engine v2...")
service = WritingService()

print(f"📂 Đang đọc dữ liệu gốc: {INPUT_FILE}")
df = pd.read_csv(INPUT_FILE)

# Chỉ lấy những dòng có Essay
df = df.dropna(subset=['Essay'])

new_data = []
total = len(df)

print(f"🧪 Bắt đầu trích xuất 9 chỉ số cho {total} mẫu...")

for i, row in df.iterrows():
    text = row['Essay']
    try:
        # Chạy preprocess v2
        analysis = service.preprocess(text)
        stats = analysis['stats']
        
        # Gom các chỉ số cũ và mới
        record = {
            "Overall": row['Overall'],
            "mlt": stats['mlt_index'],
            "mtld": stats['mtld_diversity'],
            "inversions": stats['structures'].get("INVERSION", 0),
            "complex_ratio": stats['complex_sentence_ratio'],
            "passive_count": stats['structures'].get("PASSIVE_VOICE", 0),
            "word_count": stats['word_count'],
            "error_density": stats['error_density'],
            "academic_ratio": stats['academic_ratio'],
            "cohesion_density": stats['cohesion_density']
        }
        new_data.append(record)
        
        if (i + 1) % 50 == 0:
            print(f"✅ Đã xử lý {i+1}/{total} bài...")
            
    except Exception as e:
        print(f"⚠️ Lỗi ở dòng {i}: {e}")

# Lưu kết quả
df_v2 = pd.DataFrame(new_data)
df_v2.to_csv(OUTPUT_FILE, index=False)

print(f"✨ HOÀN TẤT! Đã lưu tập dữ liệu v2 tại: {OUTPUT_FILE}")
print(f"👉 Bây giờ ông hãy dùng file này để Train v2 để thấy R2 tăng vọt!")
