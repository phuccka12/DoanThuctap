from utils.helpers import parse_json_safely

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "gemma:2b" 

def check_ollama_status():
    """Kiểm tra xem Ollama có đang chạy không"""
    try:
        import requests
        resp = requests.get("http://localhost:11434/api/tags", timeout=2)
        return resp.status_code == 200
    except:
        return False

def call_ollama(prompt):
    """Gọi Ollama local với khả năng parse JSON mạnh mẽ"""
    import requests
    try:
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }
        print(f"🏠 [OLLAMA] Đang sử dụng AI nội bộ (Model: {OLLAMA_MODEL})...")
        response = requests.post(OLLAMA_URL, json=payload, timeout=12)
        if response.status_code == 200:

            result = response.json()
            return parse_json_safely(result.get("response", "{}"))
        return None
    except Exception as e:
        print(f"❌ [OLLAMA ERROR] {e}")
        return None
