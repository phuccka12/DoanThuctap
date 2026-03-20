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

print("⏳ Đang tải Grammar Engine (LanguageTool)...")
try:
    tool = language_tool_python.LanguageTool('en-US', remote_server='https://api.languagetool.org/v2')
except Exception as e:
    print(f"⚠️ Lỗi LanguageTool: {e}")
    tool = None

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
CEFR_FLESCH_MAP = {
    'A1': {'min': 70, 'max': 100, 'grade': 'Very Easy'},
    'A2': {'min': 60, 'max': 80, 'grade': 'Easy'},
    'B1': {'min': 50, 'max': 65, 'grade': 'Fairly Easy'},
    'B2': {'min': 40, 'max': 55, 'grade': 'Standard'},
    'C1': {'min': 30, 'max': 45, 'grade': 'Fairly Difficult'},
    'C2': {'min': 0, 'max': 40, 'grade': 'Difficult'}
}


FILLER_WORDS = ["uh", "um", "ah", "er", "you know", "basically", "actually", "kind of", "sort of", "i mean"]

# --- MATCHER FOR COMPLEX SENTENCES ---
matcher = Matcher(nlp.vocab)
matcher.add("COMPLEX_STRUCTURE", [
    [{"POS": "SCONJ"}], # although, because, if, since
    [{"TAG": "WDT"}],   # which, that
    [{"TAG": "WP"}],    # who, what
    [{"TAG": "WP$"}]    # whose
])

# --- CÁC HÀM XỬ LÝ ---
def analyze_deep_tech(text):
    """Phân tích cấu trúc câu và số liệu"""
    doc = nlp(text)
    
    # Phát hiện câu phức dùng Matcher
    matches = matcher(doc)
    complex_count = len(set([match_id for match_id, start, end in matches]))
    
    verbs = [token.text for token in doc if token.pos_ == "VERB"]
    sentence_starters = [sent[0].text.lower() for sent in doc.sents]
    repetitive_starters = {i:sentence_starters.count(i) for i in sentence_starters if sentence_starters.count(i) > 2}

    stats = {
        "reading_ease": textstat.flesch_reading_ease(text),
        "grade_level": textstat.text_standard(text, float_output=False),
        "verb_diversity": len(set(verbs)) / len(verbs) if verbs else 0,
        "complex_structures_count": complex_count
    }
    return {"nlp": {"starters": repetitive_starters, "complex_count": complex_count}, "math": stats}

def check_grammar(text):
    """Kiểm tra ngữ pháp bằng LanguageTool"""
    if tool is None: return []
    try:
        matches = tool.check(text)
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

