import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

# Đường dẫn tệp
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'alex_features_v2.csv')
MODEL_FILE = os.path.join(BASE_DIR, 'alex_writing_brain.joblib')

print(f"📂 Đang đọc dữ liệu từ: {DATA_FILE}...")

# 1. Load dữ liệu đã có feature
df = pd.read_csv(DATA_FILE)

# Lọc bỏ các dòng có Overall bị thiếu (nếu có)
df = df.dropna(subset=['Overall'])

# Chọn 9 chỉ số chất lượng (Features v2)
features = [
    'mlt', 'mtld', 'inversions', 'complex_ratio', 'passive_count', 
    'word_count', 'error_density', 'academic_ratio', 'cohesion_density'
]
target = 'Overall'

X = df[features]
y = df[target]

print(f"📊 Tổng số mẫu huấn luyện: {len(df)}")

# 2. Chia tập dữ liệu (80% học, 20% thi thử)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. Khởi tạo và huấn luyện Random Forest (Siêu Tuning v2)
print("🧠 Đang huấn luyện Random Forest (1000 trees, High Sensitivity)...")
alex_brain = RandomForestRegressor(
    n_estimators=1000,      # Tăng gấp đôi số cây để giảm MAE
    max_depth=12,           # Sâu hơn một chút để bắt các mẫu phức tạp
    min_samples_split=5,    
    min_samples_leaf=2,     # Giúp mô hình mượt mà hơn (smooth)
    random_state=42
)
alex_brain.fit(X_train, y_train)

# 4. Đánh giá "Trình độ" của Alex
y_pred = alex_brain.predict(X_test)
# Làm tròn về bước 0.5 chuẩn IELTS
y_pred_rounded = np.round(y_pred * 2) / 2

mae = mean_absolute_error(y_test, y_pred_rounded)
r2 = r2_score(y_test, y_pred_rounded)

print(f"\n--- KẾT QUẢ HUẤN LUYỆN ALEX v2 (9 Features) ---")
print(f"✅ Sai số trung bình (MAE): {mae:.2f} Band")
print(f"✅ Độ tương quan (R2 Score): {r2:.2f}")

# 5. Lưu mô hình để xài thực tế
joblib.dump(alex_brain, MODEL_FILE)
print(f"--- ĐÃ LƯU MODEL '{MODEL_FILE}' THÀNH CÔNG! ---")

# 6. Test thử 1 case (mlt=25, mtld=45, word=250, error_dens=2.0, acad=15.0, cohes=5.0)
sample_test = pd.DataFrame([[25.0, 45.0, 0, 0.1, 1, 250, 2.0, 15.0, 5.0]], columns=features)
prediction = alex_brain.predict(sample_test)
print(f"🚀 Test thử 1 bài chất lượng cao -> Dự đoán: {np.round(prediction[0] * 2) / 2}")
