import edge_tts
import asyncio
import os

async def generate_audio_edge(text, filepath):
    """Chuyển text thành audio dùng Edge-TTS (Chuẩn Anh-Anh)"""
    try:
        # 'en-GB-SoniaNeural': Giọng Nữ Anh-Anh (Chuẩn IELTS)
        VOICE = "en-GB-SoniaNeural" 
        communicate = edge_tts.Communicate(text, VOICE)
        await communicate.save(filepath)
    except Exception as e:
        print(f"⚠️ Lỗi Edge-TTS: {e}")
        # Không raise để tránh lỗi 500, trả về JSON text thôi là đủ


def run_tts_sync(text, filepath):
    """Hàm chạy TTS đồng bộ (dùng bọc quanh async)"""
    try:
        asyncio.run(generate_audio_edge(text, filepath))
    except RuntimeError as e:
        if "cannot be called from a running event loop" in str(e):
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(generate_audio_edge(text, filepath))
            loop.close()
        else:
            print(f"⚠️ Lỗi Async Loop TTS: {e}")

