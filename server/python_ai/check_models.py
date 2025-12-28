import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load key
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

print("🔍 Đang hỏi Google danh sách Model...")

try:
    # Lấy danh sách model
    for m in genai.list_models():
        # Chỉ lấy những model nào biết "tạo nội dung" (generateContent)
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ Model khả dụng: {m.name}")
except Exception as e:
    print(f"❌ Lỗi: {e}")