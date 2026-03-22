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
MODEL_NAME = 'gemini-2.5-flash'  # Bản Flash 1.5 ổn định nhất cho Writing Pro


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


def call_gemini_stream(prompt, contents=None):
    """Gọi Gemini ở chế độ streaming để trả về text từng phần một"""
    try:
        payload = [prompt]
        if contents:
            if isinstance(contents, list): payload.extend(contents)
            else: payload.append(contents)
        
        print(f"🌐 [GEMINI STREAM] Đang gửi yêu cầu tới AI...")
        response = client.models.generate_content_stream(
            model=MODEL_NAME,
            contents=payload
        )
        for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        print(f"❌ Gemini Stream Error: {e}")
        yield None

def evaluate_writing_pro(content, task_type, topic, analysis_data):
    """
    Hệ thống chấm điểm IELTS tích hợp Zero-shot Reflection (Chỉ gọi 1 lần).
    Ép AI phải tự phản biện dựa trên số liệu Local trước khi xuất kết quả.
    """
    try:
        words = analysis_data['stats']['word_count']
        sentences_count = len(analysis_data.get('sentences', []))
        conflict_rate = analysis_data.get('cohesion', {}).get('conflict_rate', 0)
        mtld = analysis_data['stats'].get('mtld_diversity', 0)
        complex_ratio = analysis_data['stats'].get('complex_sentence_ratio', 0)
        
        # 1. BỘ TIÊU CHÍ CHUYÊN SÂU + QUY TẮC PHẢN BIỆN (STRICT PROMPT)
        prompt = f"""
        [HÀNH ĐỘNG]: Hãy đóng vai một Giám khảo chấm thi IELTS kỳ cựu. Nhiệm vụ của bạn là chấm điểm bài viết dưới đây dựa CHÍNH XÁC trên bảng IELTS Writing Band Descriptors (Public Version).

        [DỮ LIỆU ĐỊNH LƯỢNG TỪ LOCAL AI - SỰ THẬT KHÁCH QUAN]:
        - Word Count: {words} từ (Yêu cầu: {150 if task_type == 'task1' else 250})
        - Sentence Count: {sentences_count} câu
        - Logic Conflict Rate: {conflict_rate}% (Đo bằng NLI)
        - Lexical Diversity (MTLD): {mtld}
        - Tỷ lệ câu phức: {complex_ratio*100}%

        [QUY TRÌNH CHẤM ĐIỂM CHI TIẾT]:
        1. Task Achievement (Task 1) / Task Response (Task 2):
        - Đánh giá xem bài viết có "Address all parts of the task" hay chỉ "Address the task only partially"?
        - (Nếu Task 2): Vị trí (Position) có xuyên suốt không? Có bị "over-generalise" không?
        - (Nếu Task 1): Có "clear overview" không? Các "key features" có nổi bật không?

        2. Coherence and Cohesion (CC):
        - Soi kỹ "logical progression" và cách dùng "Cohesive devices" (Có bị máy móc "mechanical" không?).
        - Đánh giá Paragraphing (Cách chia đoạn có phù hợp không?).

        3. Lexical Resource (LR):
        - Liệt kê các "less common lexical items" dùng đúng.
        - Chỉ ra các lỗi "spelling/word formation" và xem chúng có "distort the message" không.

        4. Grammatical Range and Accuracy (GRA):
        - Phân tích sự kết hợp giữa "simple and complex forms".
        - Đánh giá tần suất "Error-free sentences".

        [QUY TẮC PHẢN BIỆN NỘI BỘ (INTERNAL REFLECTION)]:
        Trước khi xuất JSON, bạn PHẢI tự rà soát lại phán quyết của mình:
        - Nếu Word Count < 90% yêu cầu -> TR không được quá 5.5.
        - Nếu Logic Conflict > 15% -> CC không được quá 6.0.
        - Nếu Complex Ratio < 20% -> GRA không được quá 6.0.

        Topic: "{topic}"
        Essay: "{content}"

        [YÊU CẦU ĐẦU RA (JSON ONLY)]
        Trả về JSON với cấu trúc:
        {{
            "task_response": {{ "constraints": ["các yêu cầu đã đạt"], "relevance_score": 0.0, "critique": "Lời phê chuyên sâu" }},
            "highlights": [
                {{ "original_text": "...", "suggestion": "...", "explanation": "...", "category": "grammar|vocab|logic" }}
            ],
            "detailed_feedback": "Nhận xét tổng quát tiếng Việt đanh thép, nêu rõ điểm yếu chí mạng."
        }}
        """
        
        # SINH KẾT QUẢ DUY NHẤT
        final_result = call_gemini_json(prompt)
        return final_result

    except Exception as e:
        print(f"❌ Evaluate Error: {e}")
        return None

def call_gemini_json(prompt, contents=None, fail_fast=True):
    """Gọi Gemini và trả về JSON đã được parse an toàn"""
    try:
        payload = [prompt]
        if contents:
            if isinstance(contents, list): payload.extend(contents)
            else: payload.append(contents)
        
        print(f"🌐 [GEMINI CALL] Đang gửi yêu cầu tới AI...")
        response = genai_generate_with_backoff(payload, fail_fast_on_quota=fail_fast)
        # CLEANING: Loại bỏ các ký tự điều khiển gây lỗi JSON (như \n vô tình nằm trong string)
        import re
        raw_text = response.text
        # Chỉ giữ lại các ký tự in được và các ký tự newline/tab chuẩn
        clean_text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', ' ', raw_text)
        
        return parse_json_safely(clean_text)
    except Exception as e:
        print(f"❌ Gemini Error: {e}")
        return None
