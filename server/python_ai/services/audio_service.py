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
    print("🚀 Đang tải Động cơ Faster-Whisper (small)...")
    try:
        # Nâng cấp lên 'small' để tăng độ chính xác đáng kể so với 'base'
        faster_model = WhisperModel("small", device="cpu", compute_type="int8")
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
            # vad_filter=True: Tự động lọc bỏ các đoạn không có tiếng người
            # no_speech_threshold: Tăng lên 0.6 để tránh nhận diện nhầm tiếng ồn thành chữ
            segments, info = faster_model.transcribe(
                processed_path, 
                beam_size=5, 
                language="en", 
                vad_filter=True, 
                no_speech_threshold=0.6
            )
            transcript = "".join([segment.text for segment in segments]).strip()
            
            # 🛡️ HALLUCINATION FILTER: Loại bỏ các mẫu Whisper hay bị lỗi khi im lặng
            bad_patterns = [
                "Thank you for watching", "Subtitles by", "Please subscribe", 
                "Thanks for watching", "translated by", "Re-edited by"
            ]
            if any(p.lower() in transcript.lower() for p in bad_patterns):
                transcript = ""
                
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


def transcribe_audio_detailed(audio_path, model_type="base"):
    """Transcribe + word-level timestamps (nếu engine hỗ trợ)."""
    try:
        if not os.path.exists(audio_path):
            return {"text": "", "segments": [], "words": [], "error": "File not found"}

        audio = AudioSegment.from_file(audio_path)
        audio = trim_silence(audio)
        audio = audio.set_frame_rate(16000).set_channels(1)

        processed_path = audio_path + "_detail_clean.wav"
        audio.export(processed_path, format="wav")

        result = {"text": "", "segments": [], "words": []}

        if HAS_FASTER_WHISPER and faster_model is not None:
            segments, info = faster_model.transcribe(
                processed_path,
                beam_size=5,
                language="en",
                vad_filter=True,
                no_speech_threshold=0.6,
                word_timestamps=True
            )

            all_text = []
            all_segments = []
            all_words = []

            for seg in segments:
                seg_text = (seg.text or "").strip()
                if seg_text:
                    all_text.append(seg_text)

                all_segments.append({
                    "start": float(getattr(seg, "start", 0.0) or 0.0),
                    "end": float(getattr(seg, "end", 0.0) or 0.0),
                    "text": seg_text
                })

                for w in (getattr(seg, "words", None) or []):
                    word_text = (getattr(w, "word", "") or "").strip()
                    if word_text:
                        all_words.append({
                            "word": word_text,
                            "start": float(getattr(w, "start", 0.0) or 0.0),
                            "end": float(getattr(w, "end", 0.0) or 0.0),
                            "confidence": float(getattr(w, "probability", 0.0) or 0.0)
                        })

            transcript = " ".join(all_text).strip()

            bad_patterns = [
                "Thank you for watching", "Subtitles by", "Please subscribe",
                "Thanks for watching", "translated by", "Re-edited by"
            ]
            if any(p.lower() in transcript.lower() for p in bad_patterns):
                transcript = ""
                all_segments = []
                all_words = []

            result = {
                "text": transcript,
                "segments": all_segments,
                "words": all_words
            }
        else:
            base_res = whisper_model.transcribe(processed_path, language="en", fp16=False)
            text = (base_res.get("text", "") or "").strip() if isinstance(base_res, dict) else ""
            segs = base_res.get("segments", []) if isinstance(base_res, dict) else []
            norm_segments = []
            for s in segs:
                norm_segments.append({
                    "start": float(s.get("start", 0.0) or 0.0),
                    "end": float(s.get("end", 0.0) or 0.0),
                    "text": (s.get("text", "") or "").strip()
                })
            result = {"text": text, "segments": norm_segments, "words": []}

        if os.path.exists(processed_path):
            try:
                os.remove(processed_path)
            except Exception:
                pass

        return result
    except Exception as e:
        print(f"⚠️ Lỗi Transcribe Detailed: {e}")
        return {"text": "", "segments": [], "words": [], "error": str(e)}



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
        
        return result
        
    except Exception as e:
        print(f"⚠️ Lỗi trích xuất Pitch: {e}")
        return []

def extract_audio_features_pro(audio_path):
    """Trích xuất 44 đặc trưng âm học (Acoustic Features) cho mô hình XGBoost Pro"""
    try:
        if not os.path.exists(audio_path): return None
        
        # Load audio (16kHz mono là chuẩn cho speech features)
        y, sr = librosa.load(audio_path, sr=16000)
        
        # 1. MFCC + Delta + Delta-Delta (Đo lường sự biến thiên âm sắc)
        # 13 mfcc + 13 delta + 13 delta2 = 39 features
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_delta = librosa.feature.delta(mfccs)
        mfcc_delta2 = librosa.feature.delta(mfccs, order=2)
        
        # 2. Pitch (pYIN) & Jitter (Độ ổn định tần số)
        # Sử dụng fmin, fmax chuẩn cho giọng người
        f0, voiced_flag, voiced_probs = librosa.pyin(y, fmin=65, fmax=2093, sr=sr)
        f0_clean = f0[~np.isnan(f0)]
        pitch_mean = np.mean(f0_clean) if len(f0_clean) > 0 else 0
        jitter = np.std(f0_clean) / np.mean(f0_clean) if len(f0_clean) > 0 else 0
        
        # 3. Energy & Shimmer (Độ ổn định biên độ)
        rms = librosa.feature.rms(y=y)[0]
        energy_mean = np.mean(rms)
        shimmer = np.std(rms) / np.mean(rms) if np.mean(rms) > 0 else 0
        
        # 4. Fluency (Tỷ lệ im lặng)
        # top_db=30 là ngưỡng chuẩn để phân biệt tiếng nói và nhiễu nền
        non_silent = librosa.effects.split(y, top_db=30)
        total_dur = len(y) / sr
        speech_dur = sum([(e - s) / sr for s, e in non_silent])
        silence_ratio = (total_dur - speech_dur) / total_dur if total_dur > 0 else 0
        
        # Gộp tất cả vào dictionary logic
        feat = {
            "pitch_mean": pitch_mean, 
            "jitter": jitter,
            "energy_mean": energy_mean, 
            "shimmer": shimmer,
            "silence_ratio": silence_ratio
        }
        
        # Thêm 13 hệ số MFCC, Delta, Delta2
        for i in range(13):
            feat[f"mfcc_{i}"] = np.mean(mfccs[i])
            feat[f"delta_{i}"] = np.mean(mfcc_delta[i])
            feat[f"delta2_{i}"] = np.mean(mfcc_delta2[i])
            
        return feat
    except Exception as e:
        print(f"⚠️ Error in extract_audio_features_pro: {e}")
        return None


def get_audio_duration(audio_path):
    """Lấy độ dài file audio (giây) dùng Pydub"""
    try:
        audio = AudioSegment.from_file(audio_path)
        return len(audio) / 1000.0
    except:
        return 0
