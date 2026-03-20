import requests
import json
import os

BASE_URL = "http://127.0.0.1:5000"

def test_health():
    print("🔍 Testing Backend Health...")
    try:
        resp = requests.get(BASE_URL)
        print(f"✅ Server responding on {BASE_URL}")
    except:
        print(f"❌ Server NOT responding on {BASE_URL}")

def test_writing_offline():
    print("\n📝 Testing Writing Check (OFFLINE - Heuristic)...")
    payload = {
        "text": "I think learning English is very important.",
        "topic": "Education",
        "mode": "offline"
    }
    try:
        resp = requests.post(f"{BASE_URL}/api/writing/check", json=payload)
        data = resp.json()
        print(f"Status: {resp.status_code} | Overall: {data.get('overall_score')} | Source: {data.get('source')}")
    except Exception as e:
        print(f"❌ Offline test failed: {e}")

def test_writing_online():
    print("\n🧠 Testing Writing Check (ONLINE - Gemini AI)...")
    payload = {
        "text": "Artificial Intelligence is the future of automation.",
        "topic": "Technology",
        "mode": "online"
    }
    try:
        resp = requests.post(f"{BASE_URL}/api/writing/check", json=payload)
        print(f"Status: {resp.status_code}")
        # Gemini data can be complex JSON string or dict
        print(f"AI Response (Preview): {resp.text[:150]}...")
    except Exception as e:
        print(f"❌ Online test failed: {e}")

if __name__ == "__main__":
    test_health()
    test_writing_offline()
    test_writing_online()
    print("\n💡 Bạn cũng có thể vào web: http://localhost:5173/ai-conversation để test Real-time và Pitch Graph!")
