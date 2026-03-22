import edge_tts
import asyncio
import os

async def generate_audio_edge(text, filepath, voice="en-GB-SoniaNeural"):
    """Chuyển text thành audio dùng Edge-TTS (Hỗ trợ đổi giọng)"""
    try:
        # Danh sách tham khảo: 
        # en-GB-SoniaNeural (Nữ, Anh), en-GB-RyanNeural (Nam, Anh)
        # en-US-JennyNeural (Nữ, Mỹ), en-US-GuyNeural (Nam, Mỹ)
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(filepath)
    except Exception as e:
        print(f"⚠️ Lỗi Edge-TTS: {e}")

def run_tts_sync(text, filepath, voice="en-GB-SoniaNeural"):
    """Hàm chạy TTS đồng bộ (dùng bọc quanh async)"""
    try:
        asyncio.run(generate_audio_edge(text, filepath, voice))
    except RuntimeError as e:
        if "cannot be called from a running event loop" in str(e):
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(generate_audio_edge(text, filepath, voice))
            loop.close()
        else:
            print(f"⚠️ Lỗi Async Loop TTS: {e}")

