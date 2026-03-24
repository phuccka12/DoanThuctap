import chromadb
from chromadb.utils import embedding_functions
import os
import json
import numpy as np

# --- CONFIG ---
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "lesson_knowledge_db")
COLLECTION_NAME = "lessons_bank"

# all-MiniLM-L6-v2: Nhẹ (80MB), Nhanh, 384 dims - Chuẩn "Perfect" như ní gợi ý
embedding_model = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

class LessonVectorService:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=DB_PATH)
        self.collection = self.client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=embedding_model
        )
        print(f"🧠 [LESSON VECTOR] ChromaDB initialized at {DB_PATH}")

    def add_lessons(self, documents, metadatas, ids):
        """Index bài học: ReadingPassage, SpeakingQuestion, etc."""
        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )

    def hybrid_match(self, query_text, user_level, mastery_stats=None, n_results=5):
        """
        Chiến lược Hybrid Matching Score V4.5
        Formula: Final = w1*Semantic + w2*LevelMatch + w3*Mastery
        """
        try:
            # 1. Semantic Search (Top 50 candidate)
            results = self.collection.query(
                query_texts=[query_text],
                n_results=50,
                include=["metadatas", "distances"]
            )
            
            if not results or not results['ids'][0]:
                return []

            candidates = []
            
            # Trọng số (Weights)
            W1, W2, W3 = 0.5, 0.4, 0.1
            
            # Map level sang số để tính khoảng cách
            LEVEL_MAP = {"A1": 1, "A2": 2, "B1": 3, "B2": 4, "C1": 5, "C2": 6}
            target_lvl = LEVEL_MAP.get(user_level.upper(), 3)

            for i in range(len(results['ids'][0])):
                meta = results['metadatas'][0][i]
                dist = results['distances'][0][i]
                
                # Semantic Similarity (Chroma trả về distance, càng nhỏ càng giống -> đổi sang score)
                semantic_score = 1.0 / (1.0 + dist)
                
                # Level Match Score
                item_lvl = LEVEL_MAP.get(meta.get('cefr_level', 'B1'), 3)
                level_dist = abs(target_lvl - item_lvl)
                level_score = 1.0 if level_dist == 0 else (0.7 if level_dist == 1 else 0.3)
                
                # Mastery Score (Ưu tiên các kỹ năng user đang yếu)
                mastery_score = 0.5
                if mastery_stats and meta.get('type') in mastery_stats:
                    # Nếu mastery thấp (ví dụ 0.2) -> 1 - 0.2 = 0.8 (Ưu tiên cao)
                    user_mastery = float(mastery_stats.get(meta.get('type'), 0.5))
                    mastery_score = 1.0 - user_mastery
                
                final_score = (W1 * semantic_score) + (W2 * level_score) + (W3 * mastery_score)
                
                candidates.append({
                    "id": results['ids'][0][i],
                    "type": meta.get('type'),
                    "score": final_score,
                    "metadata": meta
                })

            # Sắp xếp theo score cao nhất
            candidates.sort(key=lambda x: x['score'], reverse=True)
            return candidates[:n_results]

        except Exception as e:
            print(f"⚠️ Hybrid Match Error: {e}")
            return []

# Singleton
lesson_vector_service = LessonVectorService()
