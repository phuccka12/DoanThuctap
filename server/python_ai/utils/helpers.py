import os
import time

def clean_temp_file(*file_paths):
    """Xóa file tạm an toàn"""
    for file_path in file_paths:
        try:
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
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
        
        # 🚀 [MỚI] Xử lý mạnh tay các lỗi JSON phổ biến của LLM
        # 1. Loại bỏ các ký tự điều khiển (Control characters) ẩn bên trong text
        text_to_parse = re.sub(r'[\x00-\x1F\x7F]', ' ', text_to_parse)

        # 2. Escape các dấu ngoặc kép nằm bên trong chuỗi (ví dụ: "He said "Hello" to me")
        # Thuật toán: Tìm các dấu " không đứng sau dấu : hoặc dấu , hoặc { [ và không đứng trước các dấu đó
        # Tuy nhiên regex này phức tạp, ta dùng một Heuristic đơn giản hơn: 
        # Chỉ những dấu " ở đầu/cuối của key/value mới được giữ lại
        
        def fix_quotes(match):
            s = match.group(0)
            if len(s) <= 2: return s
            content = s[1:-1]
            # Escape " bên trong nếu chưa được escape
            content = re.sub(r'(?<!\\)"', '\\"', content)
            # Thay thế các newline thực tế bằng \n
            content = content.replace('\n', '\\n').replace('\r', '\\r')
            return f'"{content}"'

        text_to_parse = re.sub(r'"(?:\\.|[^"\\])*"', fix_quotes, text_to_parse)

        # 3. Sửa lỗi trailing commas: ,} -> } và ,] -> ]
        text_to_parse = re.sub(r',\s*}', '}', text_to_parse)
        text_to_parse = re.sub(r',\s*]', ']', text_to_parse)

        # 4. Sử dụng JSONDecoder
        decoder = json.JSONDecoder()
        try:
            obj, _ = decoder.raw_decode(text_to_parse)
            return obj
        except json.JSONDecodeError:
            # Nếu vẫn lỗi, thử dùng json.loads trên toàn bộ text đã clean
            # Tìm dấu } cuối cùng
            end_idx = text_to_parse.rfind('}')
            if end_idx != -1:
                return json.loads(text_to_parse[:end_idx+1])
            raise

    except Exception as e:
        print(f"⚠️ Lỗi Phân tích JSON: {e}")
        # Debug: In 100 ký tự đầu của text lỗi để dễ soi
        if text: print(f"DEBUG JSON (starts with): {text[:100]}...")
        return default_value

