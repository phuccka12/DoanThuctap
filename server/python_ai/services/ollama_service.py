import os
import requests
import json
from utils.helpers import parse_json_safely

OLLAMA_BASE_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_GENERATE_URL = f"{OLLAMA_BASE_URL}/api/generate"

# Danh sách model ưu tiên từ thông minh đến nhẹ
PREFERRED_MODELS = ["llama3:8b", "llama3.1:8b", "mistral:7b", "gemma:7b", "gemma:2b"]

def get_best_ollama_model():
    """Tự động tìm model tốt nhất đang có trong máy"""
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=2)
        if resp.status_code == 200:
            available = [m['name'] for m in resp.json().get('models', [])]
            for model in PREFERRED_MODELS:
                if any(model in a for a in available):
                    return model
    except:
        pass
    return "gemma:2b" # Fallback cuối cùng

OLLAMA_MODEL = get_best_ollama_model()

def check_ollama_status():
    """Kiểm tra xem Ollama có đang chạy không"""
    try:
        resp = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=2)
        return resp.status_code == 200
    except:
        return False

def call_ollama_stream(prompt):
    """Gọi Ollama local ở chế độ streaming để giảm độ trễ"""
    import requests
    import json
    try:
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": True,
            "options": {
                "num_ctx": 4096,
                "num_predict": 256, # Giới hạn độ dài để phản hồi nhanh hơn
                "temperature": 0.7,
                "top_p": 0.9
            }
        }
        print(f"🏠 [OLLAMA STREAM] Đang sử dụng AI nội bộ (Model: {OLLAMA_MODEL})...")
        response = requests.post(OLLAMA_GENERATE_URL, json=payload, timeout=30, stream=True)
        
        for line in response.iter_lines():
            if line:
                chunk = json.loads(line.decode('utf-8'))
                if "response" in chunk:
                    yield chunk["response"]
                if chunk.get("done"):
                    break
    except Exception as e:
        print(f"❌ [OLLAMA STREAM ERROR] {e}")
        yield None

def call_ollama(prompt):
    """Gọi Ollama local (giữ nguyên bản cũ cho các task không cần stream)"""
    import requests
    try:
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {
                "num_ctx": 4096,
                "temperature": 0.3 # Low temp for JSON
            }
        }
        print(f"🏠 [OLLAMA] Đang sử dụng AI nội bộ (Model: {OLLAMA_MODEL})...")
        response = requests.post(OLLAMA_GENERATE_URL, json=payload, timeout=60)
        if response.status_code == 200:
            result = response.json()
            return parse_json_safely(result.get("response", "{}"))
        return None
    except Exception as e:
        print(f"❌ [OLLAMA ERROR] {e}")
        return None
