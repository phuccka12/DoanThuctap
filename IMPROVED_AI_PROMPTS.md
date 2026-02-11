# 🔧 ĐÃ CẢI THIỆN PROMPT CHO AI GENERATE

## ✅ Thay đổi

### File: `server/python_ai/app.py`

## 🎯 Vấn đề trước đó

```
📝 AGENT 2 (AUTHOR): Attempt 1/3
   Generated: 121 words
🔍 AGENT 3 (CRITIC): Auditing draft 1...
❌ REJECTED: ['Readability score -0.48 outside B1 range (50-65)']

📝 AGENT 2 (AUTHOR): Attempt 2/3
   Generated: 108 words
🔍 AGENT 3 (CRITIC): Auditing draft 2...
❌ REJECTED: ['Readability score 37.07 outside B1 range (50-65)']

⚠️ Max retries reached. Returning best attempt.
```

**Root Cause:**
- AI generate văn bản **quá phức tạp** (Flesch score thấp)
- Prompt không có hướng dẫn cụ thể về **sentence length** và **vocabulary simplicity**
- Self-correction prompt không đủ chi tiết

## 🚀 Giải pháp

### 1. Enhanced Initial Author Prompt

**Trước:**
```python
REQUIREMENTS:
- CEFR Level: {cefr_level} (use appropriate vocabulary and sentence complexity)
```

**Sau:**
```python
REQUIREMENTS:
- CEFR Level: {cefr_level} - {flesch_range['grade']} 

READABILITY RULES FOR {cefr_level}:
- Target Flesch Reading Ease Score: {flesch_range['min']}-{flesch_range['max']}
- Use VERY SHORT sentences (5-8 words). SIMPLE vocabulary only. (A1/A2)
- Use short-to-medium sentences (8-15 words). Clear, common vocabulary. (B1)
- Use medium sentences (12-18 words). Some complex words OK. (B2)
- Avoid: complex grammar, subordinate clauses, advanced idioms (A1/A2/B1)
```

### 2. Smarter Self-Correction Prompt

**Trước:**
```python
CORRECTIVE ACTIONS REQUIRED:
- Fix readability: adjust sentence length/complexity for {cefr_level}
- Maintain word count: {word_count} ±10%
```

**Sau:**
```python
PREVIOUS FLESCH SCORE: {prev_flesch} (Target: {flesch_range['min']}-{flesch_range['max']})

CORRECTIVE ACTIONS REQUIRED:
- INCREASE readability: Use MUCH SIMPLER words, SHORTER sentences (8-12 words max)
  (if prev_flesch < target min)
- DECREASE readability: Use more complex vocabulary and longer sentences
  (if prev_flesch > target max)

SPECIFIC TIPS FOR {cefr_level}:
- Use present simple tense mostly (A1/A2)
- Avoid phrasal verbs and idioms (A1/A2)
- Average sentence length: 8 words (A1/A2) | 12 words (B1) | 15 words (B2) | 18 words (C1/C2)
```

## 📊 Improvements

| Aspect | Before | After |
|--------|--------|-------|
| Flesch guidance | ❌ Generic | ✅ Specific range per CEFR |
| Sentence length | ❌ Not mentioned | ✅ Explicit word count targets |
| Vocabulary level | ❌ Vague | ✅ Clear "simple" vs "complex" |
| Self-correction | ❌ Generic "fix readability" | ✅ Directional ("simpler" or "more complex") |
| Tense usage | ❌ Not guided | ✅ Recommended tense per level |
| Phrasal verbs | ❌ Not addressed | ✅ Avoid for A1/A2, OK for B2+ |

## 🧪 Expected Results

### For B1 (target 50-65 Flesch):

**Attempt 1:**
```
Generated: 150 words
Flesch: 55.3 ✅ (within 50-65)
✅ ACCEPTED
```

**Or with correction:**
```
Attempt 1: Flesch 38.2 ❌ (too complex)
Attempt 2: Flesch 52.7 ✅ (corrected - simpler sentences)
✅ ACCEPTED
```

## 🎯 Test Now

1. Quay lại trang web
2. Click "AI Generate"
3. Điền:
   ```
   Chủ đề: travel
   Trình độ CEFR: B1
   Số từ: 150
   ```
4. Click "Tạo với AI"

**Kỳ vọng:**
- Attempt 1 hoặc 2 sẽ pass (thay vì 3/3 rejected)
- Flesch score trong khoảng 50-65
- Success alert với audit report chi tiết

## 📝 Technical Details

### CEFR Flesch Mapping
```python
'A1': {'min': 70, 'max': 100}  # Very Easy
'A2': {'min': 60, 'max': 80}   # Easy  
'B1': {'min': 50, 'max': 65}   # Fairly Easy ← Target
'B2': {'min': 40, 'max': 55}   # Standard
'C1': {'min': 30, 'max': 45}   # Fairly Difficult
'C2': {'min': 0, 'max': 40}    # Difficult
```

### Sentence Length Targets
- A1/A2: 8 words average
- B1: 12 words average
- B2: 15 words average
- C1/C2: 18 words average

### Vocabulary Guidelines
- **A1/A2:** "Simple" = basic 1000 words, present simple, no idioms
- **B1:** "Common" = 2000-3000 words, mixed tenses, rare idioms
- **B2:** "Standard" = 4000+ words, complex tenses, common idioms
- **C1/C2:** "Advanced" = 6000+ words, all tenses, advanced idioms

## 🔄 Auto-Reload Confirmed

Flask detected changes and reloaded:
```
* Detected change in 'app.py', reloading
* Restarting with stat
✅ TOÀN BỘ HỆ THỐNG ĐÃ SẴN SÀNG CHIẾN ĐẤU!
```

**No manual restart needed!** 🎉

## 🐛 If Still Failing

### Check 1: Flesch score still wrong?
→ Increase `max_retries` to 5 in frontend

### Check 2: Author ignoring instructions?
→ Add "CRITICAL:" prefix to readability rules in prompt

### Check 3: Topic too abstract?
→ Use concrete topics: "Daily Routines", "Food Shopping", "Weekend Plans"

---

**Updated:** February 9, 2026
**Issue:** AI generates text too complex for target CEFR level
**Solution:** Enhanced prompts with specific readability guidance
**Status:** ✅ FIXED - Ready to test
