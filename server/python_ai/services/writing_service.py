import spacy
import pysbd
from lexical_diversity import lex_div as ld
import os
import re
import joblib
import pandas as pd
import language_tool_python
from spellchecker import SpellChecker
from services.nlp_service import analyze_deep_tech

# --- SINGLETON NLP ENGINES ---
_nlp_md = None
_nli_pipeline = None
_seg = pysbd.Segmenter(language="en", clean=False)

def get_nlp():
    global _nlp_md
    if _nlp_md is None:
        print("⏳ Loading spaCy (en_core_web_md) for Writing Pro...")
        try:
            _nlp_md = spacy.load("en_core_web_md")
        except:
            print("📥 Downloading spaCy model...")
            os.system("python -m spacy download en_core_web_md")
            _nlp_md = spacy.load("en_core_web_md")
    return _nlp_md

def get_nli_pipeline():
    global _nli_pipeline
    if _nli_pipeline is None:
        try:
            from transformers import pipeline
            print("⏳ Loading NLI model (DeBERTa v3 small) - This might take a moment if first time...")
            _nli_pipeline = pipeline("text-classification", model="cross-encoder/nli-deberta-v3-small")
            print("✅ NLI Model loaded successfully.")
        except Exception as e:
            print(f"⚠️ NLI Load Error: {e}. Cohesion logic will use fallback.")
            return None
    return _nli_pipeline

# ---Discourse Markers (IELTS Standard) ---
DISCOURSE_MARKERS = {
    # 1. Bổ sung ý (Addition)
    "addition": [
        "furthermore", "moreover", "in addition", "additionally", 
        "not only", "but also", "besides", "what is more", 
        "equally important", "along with", "coupled with", 
        "another key point", "as well as"
    ],
    
    # 2. Tương phản / Trái ngược (Contrast)
    "contrast": [
        "however", "nevertheless", "on the other hand", "conversely", 
        "despite", "in spite of", "although", "whereas", "nonetheless", 
        "in contrast", "alternatively", "even so", "on the contrary", 
        "by comparison"
    ],
    
    # 3. Nguyên nhân - Kết quả (Cause & Effect)
    "cause_effect": [
        "therefore", "consequently", "as a result", "accordingly", 
        "hence", "thus", "owing to", "due to", "stems from", 
        "brought about by", "for this reason", "as a consequence",
        "inevitably leads to"
    ],
    
    # 4. Đưa ví dụ / Làm rõ ý (Example & Clarification)
    "example": [
        "for instance", "to illustrate", "specifically", "notably", 
        "such as", "a prime example", "namely", "in particular", 
        "to demonstrate", "as an illustration", "to clarify", 
        "proof of this"
    ],
    
    # 5. Nhượng bộ (Concession - Rất quan trọng cho Band 7+)
    "concession": [
        "admittedly", "while it is true that", "granted", 
        "irrespective of", "regardless of", "even though",
        "up to a point"
    ],
    
    # 6. Nhấn mạnh (Emphasis)
    "emphasis": [
        "indeed", "undeniably", "undoubtedly", "primarily", 
        "crucially", "without a doubt", "needless to say", 
        "it goes without saying", "obviously"
    ],
    
    # 7. Trình tự / Liệt kê (Sequence)
    "sequence": [
        "initially", "subsequently", "finally", "first and foremost", 
        "firstly", "secondly", "to begin with", "subsequent to", 
        "in the first place"
    ],
    
        # 8. Kết luận (Conclusion)
    "conclusion": [
        "in conclusion", "to sum up", "ultimately", "overall", 
        "to summarize", "all things considered", "taking everything into consideration", 
        "by and large", "essentially", "to draw the conclusion"
    ]
}

# --- ACADEMIC WORD LIST (Mẫu mở rộng từ Sublist 1-5) ---
AWL_SAMPLES = {
    "analyse", "approach", "area", "assess", "assume", "authority", "available", "benefit", "concept", "consist", "constitute", "context", "create", "data", "define", "derive", "distribute", "economy", "environment", "establish", "estimate", "evident", "export", "factor", "finance", "formula", "function", "identify", "income", "indicate", "individual", "interpret", "involve", "issue", "labour", "legal", "legislate", "major", "method", "occur", "percent", "period", "policy", "principle", "proceed", "process", "programme", "project", "purchase", "range", "region", "register", "relevant", "require", "research", "respond", "section", "sector", "select", "significant", "similar", "source", "specific", "structure", "theory", "vary",
    "achieve", "acquire", "administrate", "affect", "appropriate", "aspect", "assist", "category", "chapter", "commission", "community", "complex", "compute", "conclude", "conduct", "consequent", "construct", "consume", "credit", "culture", "design", "distinct", "element", "equate", "evaluate", "feature", "final", "focus", "impact", "injure", "institute", "invest", "item", "journal", "maintain", "normal", "obtain", "participate", "perceive", "positive", "potential", "previous", "primary", "purchase", "range", "region", "register", "relevant", "require", "research", "respond", "section", "sector", "select", "significant", "similar", "source", "specific", "structure", "theory", "vary",
    "alternative", "circumstance", "comment", "compensate", "component", "consent", "considerable", "constant", "constrain", "contribute", "convene", "coordinate", "core", "corporate", "correspond", "criteria", "deduce", "demonstrate", "document", "dominate", "emphasis", "ensure", "exclude", "framework", "fund", "illustrate", "immigrate", "imply", "initial", "instance", "interact", "justify", "layer", "link", "locate", "maximise", "minor", "negate", "outcome", "partner", "philosophy", "physical", "proportion", "publish", "react", "register", "reliance", "remove", "scheme", "sequence", "shift", "specify", "sufficient", "technical", "technique", "technology", "valid", "volume"
}

# --- RF MODEL PATH ---
RF_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "Random_forest", "alex_writing_brain.joblib")

class WritingService:
    def __init__(self):
        self.rf_model = None
        self._load_rf_brain()
        # Spell Checker (Local & Fast)
        try:
            self.spell = SpellChecker()
        except:
            self.spell = None
        # LanguageTool (Deep check - Lazy Loading)
        self.tool = None

    def _get_language_tool(self):
        """Lazy load LanguageTool when needed"""
        if self.tool is None:
            try:
                print("⏳ Starting LanguageTool Java Server (First time)...")
                self.tool = language_tool_python.LanguageTool('en-US')
            except Exception as e:
                print(f"⚠️ LanguageTool failed: {e}")
                return None
        return self.tool

    def _load_rf_brain(self):
        """Nạp bộ não Random Forest nếu tồn tại"""
        if os.path.exists(RF_MODEL_PATH):
            try:
                print(f"🧠 Loading Alex's Random Forest Brain from {RF_MODEL_PATH}...")
                self.rf_model = joblib.load(RF_MODEL_PATH)
            except Exception as e:
                print(f"⚠️ Error loading RF Brain: {e}")
        else:
            print(f"ℹ️ RF Brain not found at {RF_MODEL_PATH}. Using Heuristic mode.")
    def preprocess(self, text):
        """
        BƯỚC 1: Xử lý Tín hiệu (Local)
        - Tách câu, đếm từ, tính MTLD, gán nhãn OFFSET
        """
        nlp = get_nlp()
        doc = nlp(text)
        sentences = _seg.segment(text)
        
        # 1. Tính toán độ đa dạng từ vựng (MTLD)
        tokens = [token.text.lower() for token in doc if not token.is_punct]
        mtld_score = ld.mtld(tokens) if len(tokens) > 50 else 0
        
        # 2. Phân tích cấu trúc câu (Grammar Complexity)
        complex_sentences_count = 0
        sentence_data = []
        
        for sent in doc.sents:
            # Tìm các mệnh đề phụ (SCONJ - Subordinating conjunctions)
            has_subordinate = any(token.dep_ == "mark" or token.pos_ == "SCONJ" for token in sent)
            if has_subordinate:
                complex_sentences_count += 1
            
            sentence_data.append({
                "text": sent.text,
                "start": sent.start_char,
                "end": sent.end_char,
                "is_complex": has_subordinate
            })

        # 3. Phát hiện Discourse Markers (CC Layer)
        found_markers = []
        for category, markers in DISCOURSE_MARKERS.items():
            for m in markers:
                pattern = rf"\b{re.escape(m)}\b"
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    found_markers.append({
                        "marker": m,
                        "category": category,
                        "start": match.start(),
                        "end": match.end()
                    })

        # 4. Academic Deep Tech (FGIF Upgrade)
        deep_tech = analyze_deep_tech(text)
        
        # 5. Mật độ lỗi (Error Density - pyspellchecker v2)
        misspelled_count = 0
        if self.spell:
            # Lọc bỏ dấu câu trước khi check chính tả
            clean_tokens = [t.lower() for t in tokens if t.isalpha()]
            misspelled = self.spell.unknown(clean_tokens)
            misspelled_count = len(misspelled)
        
        # Kết hợp thêm Deep Tech (Collocation Errors) nếu có
        tool = self._get_language_tool()
        deep_errors = 0
        if tool:
            try:
                matches = tool.check(text)
                deep_errors = len(matches)
            except:
                deep_errors = len(deep_tech["math"]["collocation_errors"])
        else:
            deep_errors = len(deep_tech["math"]["collocation_errors"])

        total_errors = misspelled_count + deep_errors
        error_density = (total_errors / len(tokens)) * 100 if tokens else 0

        # 6. Academic Ratio & Cohesion Ratio
        academic_count = sum(1 for token in tokens if token in AWL_SAMPLES)
        academic_ratio = (academic_count / len(tokens)) * 100 if tokens else 0
        
        marker_count = len(found_markers)
        cohesion_density = (marker_count / len(tokens)) * 100 if tokens else 0
        
        return {
            "stats": {
                "word_count": len(tokens),
                "sentence_count": len(sentences),
                "mtld_diversity": round(mtld_score, 2),
                "complex_sentence_ratio": round(complex_sentences_count / len(sentences), 2) if sentences else 0,
                "mlt_index": deep_tech["math"]["mlt_index"],
                "structures": deep_tech["math"]["structures"],
                "error_density": round(error_density, 2),
                "academic_ratio": round(academic_ratio, 2),
                "cohesion_density": round(cohesion_density, 2)
            },
            "sentences": sentence_data,
            "discourse_markers": found_markers,
            "collocation_errors": deep_tech["math"]["collocation_errors"]
        }

    def analyze_cohesion_nli(self, sentences):
        """
        BƯỚC 2: Phân tích Logic NLI (Natural Language Inference)
        Tối ưu: Xử lý tất cả cặp câu song song thay vì tuần tự.
        """
        if len(sentences) < 2:
            return {"score": 9.0, "details": "Bài viết quá ngắn."}

        model = get_nli_pipeline()
        if not model:
            return {"error": "NLI Model not available"}

        try:
            plain_sentences = [s['text'] for s in sentences] if isinstance(sentences[0], dict) else sentences
            pairs = [
                (i, f"{plain_sentences[i]} [SEP] {plain_sentences[i+1]}")
                for i in range(len(plain_sentences) - 1)
            ]

            def _score_pair(args):
                idx, pair_text = args
                res = model(pair_text)
                return {"pair": idx, "label": res[0]['label'], "score": round(res[0]['score'], 3)}

            # Chạy song song - số worker bằng số cặp câu (giới hạn tối đa 8)
            max_workers = min(len(pairs), 8)
            from concurrent.futures import ThreadPoolExecutor as _TPE
            with _TPE(max_workers=max_workers) as pool:
                logic_scores = list(pool.map(_score_pair, pairs))

            # Sắp xếp lại theo thứ tự gốc
            logic_scores.sort(key=lambda x: x["pair"])

            avg_score = sum([s['score'] for s in logic_scores]) / len(logic_scores) if logic_scores else 0
            conflicts = [
                s for s in logic_scores
                if s['label'].upper() in ('CONTRADICTION', 'LABEL_2')
            ]
            conflict_rate = (len(conflicts) / len(logic_scores)) * 100 if logic_scores else 0

            return {
                "logic_pairs": logic_scores,
                "cohesion_index": round(avg_score, 2),
                "conflict_rate": round(conflict_rate, 2)
            }
        except Exception as e:
            return {"error": str(e)}

    def calculate_final_score(self, analysis_data, ai_eyes):
        """
        BƯỚC 4: Chốt Điểm (Intelligent Scoring)
        - Tổng hợp từ 4 tiêu chí IELTS.
        """
        try:
            # 1. Task Response (TA) - Lấy từ Gemini (Scale 0-9)
            ta_score = ai_eyes.get("task_response", {}).get("relevance_score", 5.0)
            # Fail-safe: Nếu AI trả về thang 0.1 (ví dụ 0.9 instead of 9.0)
            if 0 < ta_score < 1.0:
                ta_score *= 10
            
            # 2. Coherence & Cohesion (CC) - Kết hợp NLI và Discourse Markers
            cohesion_idx = analysis_data.get("cohesion", {}).get("cohesion_index", 0.5)
            conflict_rate = analysis_data.get("cohesion", {}).get("conflict_rate", 0)
            marker_count = len(analysis_data.get("discourse_markers", []))
            
            # Heuristic CC: (NLI index + Mật độ từ nối) - Trừ điểm nặng nếu mâu thuẫn > 15%
            cc_score = (cohesion_idx * 7) + (marker_count * 0.15)
            if conflict_rate > 15:
                cc_score -= (conflict_rate / 10)
            cc_score = max(1.0, min(9.0, cc_score))
            
            # 3. Lexical Resource (LR) - Dựa trên MTLD (Nghiêm khắc hơn)
            mtld = analysis_data.get("stats", {}).get("mtld_diversity", 50)
            # MTLD > 70 mới bắt đầu chạm ngưỡng Band 7
            lr_score = 3.0 + (mtld / 25)
            lr_score = max(1.0, min(9.0, lr_score))
            
            # 4. Grammatical Range & Accuracy (GRA) - Dựa trên Complex Sentence Ratio + Band 8 patterns
            gra_ratio = analysis_data.get("stats", {}).get("complex_sentence_ratio", 0.2)
            structures = analysis_data.get("stats", {}).get("structures", {})
            mlt_index = analysis_data.get("stats", {}).get("mlt_index", 10)

            # Yêu cầu ít nhất 30% câu phức để đạt Band 7+
            gra_score = 4.0 + (gra_ratio * 8)
            
            # BONUS: Academic Patterns (Inversion, Passive)
            if structures.get("INVERSION", 0) > 0: gra_score += 0.5
            if structures.get("PASSIVE_VOICE", 0) > 1: gra_score += 0.2
            if structures.get("CLEFT_SENTENCE", 0) > 0: gra_score += 0.3
            
            # MLT (Maturity Index): Nếu MLT > 18 (câu rất chín), thưởng thêm điểm
            if mlt_index > 18: gra_score += 0.5

            gra_score = max(1.0, min(9.0, gra_score))
            
            # PENALTY: Collocation Errors (Subtract from LR)
            colloc_errors = analysis_data.get("collocation_errors", [])
            lr_score -= (len(colloc_errors) * 0.3)
            lr_score = max(1.0, min(9.0, lr_score))

            # 6. TỔNG HỢP VỚI CÔNG THỨC TRỌNG SỐ (WEIGHTED CONSENSUS)
            # S_Local: Trọng số của con số kỹ thuật (40%) - Nâng cấp dùng RF nếu có
            
            # Hot-reload check: Nếu chưa nạp được model, hãy thử lại (đề phòng ông vừa train xong)
            if not self.rf_model:
                self._load_rf_brain()
            
            s_local = 5.0 # Mặc định
            
            if self.rf_model:
                try:
                    # Chuẩn bị X cho RF v2 (Đủ 9 features)
                    X_input = pd.DataFrame([{
                        "mlt": mlt_index,
                        "mtld": mtld,
                        "inversions": structures.get("INVERSION", 0),
                        "complex_ratio": gra_ratio,
                        "passive_count": structures.get("PASSIVE_VOICE", 0),
                        "word_count": analysis_data["stats"]["word_count"],
                        "error_density": analysis_data["stats"].get("error_density", 0),
                        "academic_ratio": analysis_data["stats"].get("academic_ratio", 0),
                        "cohesion_density": analysis_data["stats"].get("cohesion_density", 0)
                    }])
                    s_local = float(self.rf_model.predict(X_input)[0])
                    print(f"🤖 RF Predictor decided Band: {s_local}")
                except Exception as e:
                    print(f"⚠️ RF Prediction failed, falling back to heuristic: {e}")
                    s_local = (ta_score * 0.2) + (cc_score * 0.3) + (lr_score * 0.25) + (gra_score * 0.25)
            else:
                # Điểm Local tổng hợp (Heuristic - Fallback)
                s_local = (ta_score * 0.2) + (cc_score * 0.3) + (lr_score * 0.25) + (gra_score * 0.25)
            
            # Điểm Gemini tổng hợp (Dựa trên cảm quan của Model)
            s_gemini = (ta_score + cc_score + lr_score + gra_score) / 4
            
            # Công thức: Final = (0.4 * s_local) + (0.6 * s_gemini)
            raw_avg = (0.4 * s_local) + (0.6 * s_gemini)
            
            # Penalty Gap: Nếu sự lệch pha giữa con số và cảm nhận > 1.5 Band
            gap = abs(s_local - s_gemini)
            penalty = 0
            if gap > 1.5:
                penalty = 0.5 # Trừ 0.5 band vì sự không nhất quán
                
            final_band = round(raw_avg * 2) / 2
            final_band = max(1.0, min(9.0, final_band - penalty))
            
            return {
                "overall_band": final_band,
                "sub_scores": {
                    "TA": round(ta_score, 1),
                    "CC": round(cc_score, 1),
                    "LR": round(lr_score, 1),
                    "GRA": round(gra_score, 1)
                }
            }
        except Exception as e:
            print(f"⚠️ Scoring Error: {e}")
            return {
                "overall_band": 5.0, 
                "sub_scores": {"TA": 5.0, "CC": 5.0, "LR": 5.0, "GRA": 5.0},
                "error": str(e)
            }

writing_service = WritingService()
