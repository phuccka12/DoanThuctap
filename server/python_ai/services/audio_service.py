import whisper
try:
    from faster_whisper import WhisperModel
    HAS_FASTER_WHISPER = True
except ImportError:
    HAS_FASTER_WHISPER = False

import librosa
import numpy as np
import os
import hashlib
from pydub import AudioSegment
from pydub.silence import detect_nonsilent
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# --- MONGODB CACHE CONFIG ---
MONGO_URI = os.getenv("MONGO_URI")
try:
    mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = mongo_client["ai_speaking_cache"]
    pitch_cache = db["pitch_data"]
    # Test connection
    mongo_client.server_info()
    print("🍃 MongoDB Cache connected!")
except Exception as e:
    print(f"⚠️ MongoDB Cache failed: {e}")
    pitch_cache = None

# Khởi tạo model Whisper (Động cơ cũ)
print("🎙️ Đang tải model Whisper (base)...")
whisper_model = whisper.load_model("base")

# Khởi tạo Faster-Whisper (Động cơ mới - Cực nhanh)
if HAS_FASTER_WHISPER:
    print("🚀 Đang tải Động cơ Faster-Whisper (tiny.en/base)...")
    try:
        # Dùng tiny.en cho tốc độ tối thượng, hoặc base cho độ chính xác
        faster_model = WhisperModel("base", device="cpu", compute_type="int8")
    except Exception as e:
        print(f"⚠️ Lỗi Faster-Whisper: {e}")
        HAS_FASTER_WHISPER = False
else:
    faster_model = None

def trim_silence(audio, silence_thresh=-40, min_silence_len=500):

    """Cắt bỏ đoạn im lặng ở đầu và cuối để Whisper xử lý nhanh hơn"""
    nonsilent_intervals = detect_nonsilent(audio, min_silence_len=min_silence_len, silence_thresh=silence_thresh)
    if nonsilent_intervals:
        start_trim = nonsilent_intervals[0][0]
        end_trim = nonsilent_intervals[-1][1]
        return audio[start_trim:end_trim]
    return audio

def transcribe_audio(audio_path, model_type="base"):
    """Chuyển đổi âm thanh thành văn bản - Tối ưu tốc độ với Faster-Whisper"""
    try:
        if not os.path.exists(audio_path): return {"text": "File not found"}
        
        # 🟢 Tiền xử lý: Cắt im lặng
        audio = AudioSegment.from_file(audio_path)
        audio = trim_silence(audio)
        audio = audio.set_frame_rate(16000).set_channels(1)
        
        processed_path = audio_path + "_clean.wav"
        audio.export(processed_path, format="wav")

        # 🟢 Sử dụng Faster-Whisper nếu khả dụng (Nhanh gấp 5-10 lần)
        if HAS_FASTER_WHISPER:
            segments, info = faster_model.transcribe(processed_path, beam_size=5, language="en")
            transcript = "".join([segment.text for segment in segments]).strip()
            result = {"text": transcript}
        else:
            # Fallback về Whisper gốc
            result = whisper_model.transcribe(processed_path, language="en", fp16=False)
        
        if os.path.exists(processed_path): 
            try: os.remove(processed_path)
            except: pass
            
        return result
    except Exception as e:
        print(f"⚠️ Lỗi Transcribe: {e}")
        return {"text": "", "error": str(e)}



def get_file_hash(file_path):
    """Tính mã băm SHA-256 của file để làm key cache"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def extract_pitch(audio_path):
    """Trích xuất cao độ (Pitch) với Caching MongoDB"""
    try:
        if not os.path.exists(audio_path): return []
        
        # 1. Kiểm tra Cache
        file_id = get_file_hash(audio_path)
        if pitch_cache is not None:
            cached = pitch_cache.find_one({"_id": file_id})
            if cached:
                # print("🚀 Pitch Cache Hit!")
                return cached["pitch_data"]

        # 2. Xử lý Audio (Fix MPEG header issues bằng cách dùng pydub)
        # print("⚙️ Processing Audio for Pitch...")
        audio = AudioSegment.from_file(audio_path)
        # Convert to mono and 22050Hz for standard librosa processing
        audio = audio.set_channels(1).set_frame_rate(22050)
        
        # Chuyển sang numpy array
        y = np.array(audio.get_array_of_samples(), dtype=np.float32) / 32768.0
        sr = audio.frame_rate
        
        # 3. Trích xuất Pitch (pYIN)
        f0, voiced_flag, voiced_probs = librosa.pyin(
            y, 
            fmin=librosa.note_to_hz('C2'), 
            fmax=librosa.note_to_hz('C7'),
            sr=sr
        )
        
        f0_clean = f0[~np.isnan(f0)]
        if len(f0_clean) == 0: return []
            
        if len(f0_clean) > 100:
            indices = np.linspace(0, len(f0_clean) - 1, 100).astype(int)
            f0_final = f0_clean[indices]
        else:
            f0_final = f0_clean
            
        result = [float(round(p, 2)) for p in f0_final]
        
        # 4. Lưu Cache
        if pitch_cache is not None:
            try:
                pitch_cache.update_one(
                    {"_id": file_id},
                    {"$set": {"pitch_data": result, "timestamp": os.getpid()}},
                    upsert=True
                )
            except: pass
            
        return result
        
    except Exception as e:
        print(f"⚠️ Lỗi trích xuất Pitch: {e}")
        return []


def get_audio_duration(audio_path):
    """Lấy độ dài file audio (giây) dùng Pydub"""
    try:
        audio = AudioSegment.from_file(audio_path)
        return len(audio) / 1000.0
    except:
        return 0
