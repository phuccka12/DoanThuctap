import chromadb
from chromadb.utils import embedding_functions
import os
import json

# --- CONFIG ---
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "knowledge_db")
COLLECTION_NAME = "ielts_knowledge"

# Sử dụng mô hình embedding cực nhẹ và nhanh của Sentence Transformers
embedding_model = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

class VectorService:
    def __init__(self):
        # Khởi tạo hằng số (Warm-up ngay khi load class)
        self.client = chromadb.PersistentClient(path=DB_PATH)
        self.collection = self.client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=embedding_model
        )
        print(f"🧠 [VECTOR SERVICE] ChromaDB initialized at {DB_PATH}")

    def add_knowledge(self, documents, metadatas, ids):
        """Thêm dữ liệu vào bộ nhớ của Alex"""
        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )

    def query_knowledge(self, query_text, n_results=3):
        """Tìm kiếm kiến thức liên quan nhất dựa trên câu nói của User"""
        try:
            results = self.collection.query(
                query_texts=[query_text],
                n_results=n_results
            )
            return results
        except Exception as e:
            print(f"⚠️ Query Error: {e}")
            return None

# Singleton Pattern để dùng chung một kết nối
vector_service = VectorService()
