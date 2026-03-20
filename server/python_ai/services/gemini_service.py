import os
import time
import json
from google import genai
from dotenv import load_dotenv
from utils.helpers import parse_json_safely

load_dotenv()

# --- CẤU HÌNH ---
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("❌ Lỗi: Chưa có GEMINI_API_KEY trong .env")

client = genai.Client(api_key=api_key)
MODEL_NAME = 'gemini-2.5-flash'  # Sử dụng bản 2.0 Flash siêu tốc


def genai_generate_with_backoff(contents, model=MODEL_NAME, max_retries=3, initial_delay=2, backoff=2, fail_fast_on_quota=True):
    """Gửi yêu cầu tới Gemini với cơ chế exponential backoff nhanh hơn"""
    delay = initial_delay
    for attempt in range(1, max_retries + 1):
        try:
            resp = client.models.generate_content(
                model=model,
                contents=contents
            )
            return resp
        except Exception as e:
            err_s = str(e)
            # Kiểm tra lỗi quota/rate limit
            is_quota_error = any(x in err_s for x in ['RESOURCE_EXHAUSTED', '429', 'quota', 'rate limit'])
            
            if is_quota_error:
                if fail_fast_on_quota:
                    print(f"🛑 Quota hit! Failing fast to trigger fallback.")
                    raise e
                
                print(f"⚠️ GenAI quota/rate error (attempt {attempt}/{max_retries})")
                if attempt == max_retries:
                    raise e
                time.sleep(delay)
                delay *= backoff
                continue
            raise e


def call_gemini_json(prompt, contents=None, fail_fast=True):
    """Gọi Gemini và trả về JSON đã được parse an toàn"""
    try:
        payload = [prompt]
        if contents:
            if isinstance(contents, list): payload.extend(contents)
            else: payload.append(contents)
        
        print(f"🌐 [GEMINI CALL] Đang gửi yêu cầu tới AI...")
        response = genai_generate_with_backoff(payload, fail_fast_on_quota=fail_fast)
        return parse_json_safely(response.text)
    except Exception as e:
        print(f"❌ Gemini Error: {e}")
        return None
