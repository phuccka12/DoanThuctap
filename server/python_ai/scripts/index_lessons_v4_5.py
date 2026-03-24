import os
import sys
import pymongo

# Đảm bảo import được các thư mục trong project
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.lesson_vector_service import lesson_vector_service

# --- CONFIG ---
MONGO_URI = "mongodb+srv://admin:admin123@cluster0.ykvtouz.mongodb.net/?appName=Cluster0"
DB_NAME = "test" # Dựa trên URI hoặc mặc định

def index_all_lessons():
    print("🔗 Connecting to MongoDB...")
    client = pymongo.MongoClient(MONGO_URI)
    # Thử lấy database 'test' hoặc database đầu tiên tìm thấy
    db_names = client.list_database_names()
    print(f"📂 Available databases: {db_names}")
    
    # Ưu tiên 'test' là database chính của project
    db_name = 'test'
    print(f"🎯 Using database: {db_name}")
    db = client[db_name]
    
    collections = {
        'ReadingPassage': 'reading',
        'SpeakingQuestion': 'speaking',
        'Vocabulary': 'vocabulary',
        'WritingPrompt': 'writing',
        'ListeningPassage': 'listening',
        'GrammarLesson': 'grammar',
        'Story': 'story',
        'Topic': 'topic'
    }

    total_indexed = 0
    
    for model_name, lesson_type in collections.items():
        print(f"📂 Indexing {model_name}...")
        coll = db[model_name.lower() + 's'] # Thường là số nhiều
        # Thử cả tên gốc và tên số nhiều
        items = list(coll.find({"is_active": True}))
        if not items:
            coll = db[model_name] # Thử fallback
            items = list(coll.find({"is_active": True}))
        
        if not items:
            print(f"⚠️ No active items found for {model_name}.")
            continue

        documents = []
        metadatas = []
        ids = []

        for it in items:
            # Build text for embedding
            title = it.get('title') or it.get('name') or it.get('question') or it.get('word') or it.get('prompt') or ""
            content = it.get('passage') or it.get('meaning') or it.get('description') or it.get('transcript') or ""
            tags = " ".join(it.get('tags', [])) if isinstance(it.get('tags'), list) else ""
            
            combined_text = f"{title} {content} {tags}".strip()
            
            if not combined_text: continue

            documents.append(combined_text)
            metadatas.append({
                "mongo_id": str(it['_id']),
                "type": lesson_type,
                "cefr_level": it.get('cefr_level') or it.get('level') or "B1",
                "title": str(title)[:200]
            })
            ids.append(f"{lesson_type}_{str(it['_id'])}")
            
            if len(documents) >= 50:
                lesson_vector_service.add_lessons(documents, metadatas, ids)
                documents, metadatas, ids = [], [], []
                print(f"✅ Indexed {len(ids)} items of {lesson_type}...")

        if documents:
            lesson_vector_service.add_lessons(documents, metadatas, ids)
        
        total_indexed += len(items)
        print(f"✨ Finished {lesson_type}: {len(items)} items.")

    print(f"🎉 SUCCESS! Total indexed: {total_indexed} lessons into ChromaDB.")

if __name__ == "__main__":
    index_all_lessons()
