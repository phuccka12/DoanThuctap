import os
import time

def clean_temp_file(file_path):
    """Xóa file tạm an toàn"""
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            # print(f"🗑️ Đã xóa file tạm: {file_path}")
    except Exception as e:
        print(f"⚠️ Lỗi khi xóa file {file_path}: {e}")

def get_timestamp():
    """Lấy timestamp hiện tại"""
    return int(time.time())

def parse_json_safely(text, default_value=None):
    """Tìm cụm JSON đầu tiên xuất hiện trong text để parse (Dùng cho cả Gemini và Ollama)"""
    import json
    import re
    if not text: return default_value
    try:
        # 1. Thử tìm khối JSON nằm trong dấu { } đầu tiên
        match = re.search(r'(\{.*\})', text, re.DOTALL)
        if match:
            json_str = match.group(1)
            return json.loads(json_str)
        
        # 2. Nếu không có { }, thử clean text và parse trực tiếp
        clean_text = text.replace('```json', '').replace('```', '').strip()
        return json.loads(clean_text)
    except Exception as e:
        print(f"⚠️ Lỗi Lọc JSON: {e}")
        return default_value

