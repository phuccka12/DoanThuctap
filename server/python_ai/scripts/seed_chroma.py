import os
import json
import sys
import uuid

# Đảm bảo import được các thư mục trong project
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.vector_service import vector_service

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "dữ liệu", "master_seed_data.json")

def seed_data():
    if not os.path.exists(DATA_FILE):
        print(f"❌ Không tìm thấy file dữ liệu tại {DATA_FILE}")
        return

    print(f"🚀 [SEEDER] Đang nạp dữ liệu từ {DATA_FILE}...")
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    documents = []
    metadatas = []
    ids = []

    # Xử lý dữ liệu (Chỉ lấy những câu có answer hoặc topic giá trị)
    count = 0
    for item in data:
        question = item.get("question", "").strip()
        answer = item.get("answer", "").strip()
        topic = item.get("topic", "General").strip()
        
        if question and (answer or topic):
            # Nội dung để AI "nhớ" là câu hỏi (vì user sẽ nói những thứ gần giống câu hỏi)
            documents.append(question)
            metadatas.append({
                "answer": answer[:2000],  # Giới hạn metadata length
                "topic": topic,
                "source": item.get("source", "unknown")
            })
            ids.append(str(uuid.uuid4()))
            count += 1
            
            # Nạp theo batch (ví dụ mỗi 100 câu)
            if len(documents) >= 100:
                vector_service.add_knowledge(documents, metadatas, ids)
                documents, metadatas, ids = [], [], []
                print(f"✅ Đã nạp {count} câu...")

    # Nạp nốt số còn lại
    if documents:
        vector_service.add_knowledge(documents, metadatas, ids)
    
    print(f"🎉 Hoàn tất! Đã nạp tổng cộng {count} thẻ kiến thức vào Alex.")

if __name__ == "__main__":
    seed_data()
