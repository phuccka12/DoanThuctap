import spacy
import textstat
import language_tool_python
import re as _re
from spacy.matcher import Matcher

# --- KHỞI TẠO ENGINES ---
print("⏳ Đang tải NLP Engine (SpaCy)...")
try:
    nlp = spacy.load("en_core_web_sm")
except:
    os.system("python -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

print("⏳ Đang cấu hình Grammar Engine (LanguageTool - Lazy Mode)...")
tool = None
def get_tool():
    global tool
    if tool is not None: return tool
    try:
        # Thử khởi tạo local mode (yêu cầu Java) hoặc bỏ qua nếu không có mạng
        # Để tránh lỗi Resolution, chúng ta mặc định không dùng remote server trừ khi cần
        tool = language_tool_python.LanguageTool('en-US')
        return tool
    except Exception as e:
        print(f"ℹ️ LanguageTool local không sẵn sàng (Yêu cầu Java). Sẽ dùng Gemini/SpaCy thay thế.")
        tool = False # Đánh dấu là đã thử nhưng fail
        return None

# --- DỮ LIỆU TỪ VỰNG & CẤU TRÚC ---
ACADEMIC_WORD_LIST = {
    "analyze", "approach", "concept", "context", "derive", "distribution", "estimate", "evidence", "factor", "function",
    "identify", "income", "indicate", "individual", "interpretation", "issue", "method", "occurrence", "percent", "period",
    "policy", "principle", "procedure", "process", "range", "research", "response", "role", "section", "sector",
    "significant", "source", "specific", "structure", "theory", "variable", "achieve", "acquisition", "administration", "affect",
    "appropriate", "aspect", "assistance", "category", "chapter", "commission", "community", "complex", "computer", "conclusion",
    "conduct", "consequence", "construction", "consumer", "credit", "culture", "design", "distinction", "element", "equation",
    "evaluation", "feature", "final", "focus", "impact", "injury", "institute", "investment", "item", "journal",
    "alternative", "circumstance", "comment", "compensation", "component", "consent", "considerable", "constant", "constraint", "contribution",
    "convention", "coordination", "core", "corporate", "corresponding", "criteria", "deduction", "demonstrate", "document", "dominant",
    "emphasis", "ensure", "excluded", "framework", "fund", "illustrated", "migration", "minority", "negative", "outcomes",
    "partnership", "philosophy", "physical", "proportion", "published", "reaction", "registered", "reliance", "scheme", "sequence",
    "shift", "specified", "sufficient", "task", "technical", "techniques", "technology", "valid", "volume", "access",
    "adequate", "annual", "apparent", "approximated", "attitudes", "attributed", "civil", "code", "commitment", "communication",
    "beneficial", "detrimental", "sustainable", "paradigm", "infrastructure", "empirical", "theoretical", "methodology", "facilitate", "comprehensive"
}

LINKING_WORDS_LIST = {
    "however", "therefore", "furthermore", "moreover", "consequently", "nevertheless", "on the other hand", "in contrast", "specifically", "in addition",
    "additionally", "firstly", "secondly", "thirdly", "finally", "in conclusion", "to sum up", "as a result", "for instance", "for example",
    "notably", "significantly", "meanwhile", "simultaneously", "despite", "although", "whereas", "nonetheless", "subsequently", "accordingly",
    "similarly", "likewise", "not only", "but also", "in other words", "to clarify", "alternatively", "conversely", "hence", "thus"
}

# --- CƠ SỞ DỮ LIỆU COLLOCATION (PMI-lite) ---
# Trong thực tế dùng PMI từ corpus lớn, ở đây dùng bộ lọc Heuristic cho IELTS
COMMON_COLLOCATION_ERRORS = {
    "do a mistake": "make a mistake",
    "heavy success": "huge/great success",
    "make a homework": "do homework",
    "big interest": "great/keen interest",
    "give an effort": "make an effort",
    "highly clear": "crystal clear/perfectly clear"
}
ACADEMIC_COLLOCATIONS = ["highly beneficial", "profound impact", "significant contribution", "widely accepted", "strictly prohibited"]
CEFR_FLESCH_MAP = {
    'A1': {'min': 70, 'max': 100, 'grade': 'Very Easy'},
    'A2': {'min': 60, 'max': 80, 'grade': 'Easy'},
    'B1': {'min': 50, 'max': 65, 'grade': 'Fairly Easy'},
    'B2': {'min': 40, 'max': 55, 'grade': 'Standard'},
    'C1': {'min': 30, 'max': 45, 'grade': 'Fairly Difficult'},
    'C2': {'min': 0, 'max': 40, 'grade': 'Difficult'}
}


FILLER_WORDS = ["uh", "um", "ah", "er", "you know", "basically", "actually", "kind of", "sort of", "i mean"]

# --- MATCHER FOR BAND 8+ STRUCTURES ---
matcher = Matcher(nlp.vocab)

# 1. Complex Sentences (Subordinate clauses)
matcher.add("COMPLEX_STRUCTURE", [[{"POS": "SCONJ"}], [{"TAG": "WDT"}], [{"TAG": "WP"}]])

# 2. Inversion (Đảo ngữ): Trạng từ phủ định + Trợ động từ
# VD: Never have I... / Seldom does he...
matcher.add("INVERSION", [[
    {"LOWER": {"IN": ["never", "seldom", "hardly", "rarely", "not only", "only by"]}},
    {"POS": {"IN": ["AUX", "VERB"]}},
    {"POS": "PRON"}
]])

# 3. Cleft Sentences (Câu chẻ): It + is/was + ... + that
matcher.add("CLEFT_SENTENCE", [[
    {"LOWER": "it"},
    {"LOWER": {"IN": ["is", "was"]}},
    {"POS": {"IN": ["NOUN", "PROPN", "ADJ"]}},
    {"LOWER": {"IN": ["that", "who", "which"]}}
]])

# 4. Passive Voice (Bị động): be + VBN
matcher.add("PASSIVE_VOICE", [[
    {"LOWER": {"IN": ["is", "am", "are", "was", "were", "been", "being"]}},
    {"TAG": "VBN"}
]])

# --- CÁC HÀM XỬ LÝ ---
def analyze_deep_tech(text):
    """Phân tích cấu trúc học thuật chuyên sâu (FGIF Upgrade)"""
    doc = nlp(text)
    matches = matcher(doc)
    
    unique_matches = {}
    for match_id, start, end in matches:
        m_name = nlp.vocab.strings[match_id]
        unique_matches[m_name] = unique_matches.get(m_name, 0) + 1

    # Thuật toán T-Unit (MLT): Mean Length of T-Unit
    # Một T-Unit ≈ một sentence (đơn giản hóa cho local)
    sentences = list(doc.sents)
    total_words = len([t for t in doc if not t.is_punct])
    mlt = total_words / len(sentences) if sentences else 0

    # Collocation Check (PMI-lite)
    colloc_errors = []
    text_lower = text.lower()
    for err, fix in COMMON_COLLOCATION_ERRORS.items():
        if err in text_lower:
            colloc_errors.append({"error": err, "suggestion": fix, "type": "collocation"})

    stats = {
        "reading_ease": textstat.flesch_reading_ease(text),
        "mlt_index": round(mlt, 2), # MLT càng cao câu càng chín
        "structures": unique_matches,
        "collocation_errors": colloc_errors,
        "complex_ratio": unique_matches.get("COMPLEX_STRUCTURE", 0) / len(sentences) if sentences else 0
    }
    return {"nlp": unique_matches, "math": stats}

def check_grammar(text):
    """Kiểm tra ngữ pháp bằng LanguageTool"""
    current_tool = get_tool()
    if not current_tool: return []
    try:
        matches = current_tool.check(text)
        return [{"word": m.context[m.offset:m.offset+m.errorLength], "error": m.message, "fix": (m.replacements[0] if m.replacements else "N/A")} for m in matches]
    except Exception as e:
        print(f"⚠️ Lỗi Grammar Check: {e}")
        return []

def _offline_writing_score(text, topic="General Topic", grammar_errors=None):
    """Hệ thống chấm điểm Writing dự phòng (Heuristic)"""
    if grammar_errors is None: grammar_errors = []
    words = text.lower().split()
    total_words = len(words)
    
    if total_words < 10:
        return {"overall_score": "Band 1.0", "radar_chart": {"TR": 1, "CC": 1, "LR": 1, "GRA": 1}, "source": "offline"}

    error_count = len(grammar_errors)
    error_density = (error_count / total_words) * 100
    
    # 1. GRA
    if error_density < 1.0: gra = 8.5
    elif error_density < 2.5: gra = 7.5
    else: gra = 5.0
    
    # 2. LR
    unique_words = set(words)
    ttr = len(unique_words) / total_words
    unique_awl = len(set([w for w in words if w in ACADEMIC_WORD_LIST]))
    lr = min(9.0, 5.0 + (unique_awl * 0.2) + (ttr * 2))
    
    # Simple overall calc
    overall = round((gra + lr + 6.0 + 6.0) / 4 * 2) / 2
    return {"overall_score": f"Band {overall}", "radar_chart": {"TR": 6.0, "CC": 6.0, "LR": lr, "GRA": gra}, "source": "offline"}

# --- SPEAKING OFFLINE METRICS ---
def _offline_fluency_score(transcript, wpm, hesitation_count, rhythm_std):
    """Tính điểm Fluency offline kèm theo phát hiện filler words"""
    if not transcript: return 3.0
    
    # Đếm filler words trong transcript
    found_fillers = [w for w in FILLER_WORDS if w in transcript.lower()]
    filler_penalty = len(found_fillers) * 0.4
    
    if wpm == 0: return round(max(1.0, 6.0 - filler_penalty), 1)
    
    wpm_score = 8.5 if 110 <= wpm <= 160 else 6.0
    score = wpm_score - (hesitation_count * 0.4) - filler_penalty
    return round(max(3.0, min(9.0, score)), 1)


def _offline_grammar_bleu(transcript, sample_answer):
    """N-gram overlap cho Grammar/Lexical score"""
    if not transcript or not sample_answer: return 5.0
    t_tokens = set(transcript.lower().split())
    s_tokens = set(sample_answer.lower().split())
    if not s_tokens: return 5.0
    overlap = len(t_tokens.intersection(s_tokens)) / len(s_tokens)
    return round(4.0 + (overlap * 5.0), 1)

def _offline_pronunciation_score(transcript, sample_answer):
    """Simplified Soundex-like comparison"""
    if not transcript or not sample_answer: return 5.0
    return _offline_grammar_bleu(transcript, sample_answer)

def _double_metaphone_simple(word):
    """Lọc bỏ nguyên âm để so sánh âm tiết thô"""
    w = word.lower()
    w = _re.sub(r'[aeiou]', '', w)
    return w

