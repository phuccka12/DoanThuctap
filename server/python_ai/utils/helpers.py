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
    """Tìm cụm JSON chính xác nhất trong text để parse (Sử dụng raw_decode + Clean up)"""
    import json
    import re
    if not text: return default_value
    
    try:
        # 1. Tiền xử lý: Xóa các Markdown code blocks
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*', '', text)
        text = text.strip()

        # 2. Tìm vị trí dấu {
        start_idx = text.find('{')
        if start_idx == -1: return default_value
        
        text_to_parse = text[start_idx:]
        
        # 3. Last ditch effort: Sửa các lỗi phổ biến (Trailing commas, unescaped newlines)
        # Xóa trailing commas: ,} -> } và ,] -> ]
        text_to_parse = re.sub(r',\s*}', '}', text_to_parse)
        text_to_parse = re.sub(r',\s*]', ']', text_to_parse)

        # 4. Sử dụng JSONDecoder
        decoder = json.JSONDecoder()
        try:
            obj, _ = decoder.raw_decode(text_to_parse)
            return obj
        except json.JSONDecodeError:
            # Nếu vẫn lỗi, thử dùng json.loads trên toàn bộ text đã clean
            # (Có thể giúp nếu object bị bao bởi text linh tinh)
            end_idx = text_to_parse.rfind('}')
            if end_idx != -1:
                return json.loads(text_to_parse[:end_idx+1])
            raise

    except Exception as e:
        print(f"⚠️ Lỗi Phân tích JSON: {e}")
        # Debug: In 100 ký tự đầu của text lỗi để dễ soi
        if text: print(f"DEBUG JSON (starts with): {text[:100]}...")
        return default_value

