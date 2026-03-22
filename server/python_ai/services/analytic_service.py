import librosa
import numpy as np
import os
import spacy
from collections import Counter

# Tải model spacy nhỏ để xử lý ngôn ngữ nhanh
try:
    nlp = spacy.load("en_core_web_sm")
except:
    # Nếu chưa có thì dùng bản cực nhẹ hoặc báo lỗi
    nlp = None

class AnalyticService:
    def __init__(self):
        print("🔍 [ANALYTIC SERVICE] Initialized")

    def extract_fluency_features(self, audio_path):
        """Phân tích độ trôi chảy từ file audio"""
        try:
            y, sr = librosa.load(audio_path)
            
            # 1. Tính toán độ im lặng (Silence)
            # Dùng energy threshold để tìm các đoạn không im lặng
            non_silent_intervals = librosa.effects.split(y, top_db=30)
            total_duration = librosa.get_duration(y=y, sr=sr)
            
            speech_duration = sum([(end - start) / sr for start, end in non_silent_intervals])
            silence_duration = total_duration - speech_duration
            
            # 2. Đếm số lần ngắt nghỉ (Pauses)
            # Coi mỗi khoảng trống giữa các đoạn non_silent là 1 lần nghỉ
            num_pauses = len(non_silent_intervals) - 1 if len(non_silent_intervals) > 0 else 0
            
            return {
                "total_duration": round(total_duration, 2),
                "speech_duration": round(speech_duration, 2),
                "silence_duration": round(silence_duration, 2),
                "num_pauses": num_pauses,
                "silence_ratio": round(silence_duration / total_duration if total_duration > 0 else 0, 2)
            }
        except Exception as e:
            print(f"⚠️ Fluency Error: {e}")
            return None

    def extract_lexical_features(self, text):
        """Phân tích vốn từ vựng từ transcript"""
        if not nlp:
            # Fallback đơn giản nếu không có spacy
            words = text.lower().split()
            unique_words = set(words)
            return {
                "word_count": len(words),
                "unique_word_count": len(unique_words),
                "lexical_diversity": round(len(unique_words) / len(words) if words else 0, 2)
            }

        doc = nlp(text.lower())
        words = [token.text for token in doc if not token.is_punct and not token.is_space]
        unique_words = set(words)
        
        # Thống kê loại từ (Nouns, Verbs, Adjectives)
        pos_counts = Counter([token.pos_ for token in doc])
        
        return {
            "word_count": len(words),
            "unique_word_count": len(unique_words),
            "lexical_diversity": round(len(unique_words) / len(words) if words else 0, 2),
            "adjectives_count": pos_counts.get("ADJ", 0),
            "verbs_count": pos_counts.get("VERB", 0),
            "nouns_count": pos_counts.get("NOUN", 0)
        }

analytic_service = AnalyticService()
