import React, { useEffect, useState, useCallback, useRef } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { FaHeart, FaDrumstickBite, FaPencilAlt, FaCheck, FaTimes } from 'react-icons/fa';
import { PixelEgg, PixelPetIdle } from './PixelSprite';
import Icon from './ui/Icon';

// ── Constants ──────────────────────────────────────────────────────────────────
const EGG_CONFIG = {
  fire:    { label: 'Trứng Lửa',  color: '#EF4444', dot: '🔴', glow: 'shadow-red-500/50'  },
  ice:     { label: 'Trứng Băng', color: '#3B82F6', dot: '🔵', glow: 'shadow-blue-500/50' },
  leaf:    { label: 'Trứng Lá',   color: '#22C55E', dot: '🟢', glow: 'shadow-green-500/50'},
  default: { label: 'Trứng Bí Ẩn',color: '#8B5CF6', dot: '🟣', glow: 'shadow-purple-500/50'},
};

const PET_CONFIG = {
  // 3 pet chính — tương ứng 3 quả trứng
  dragon: { emoji: '\uD83D\uDC09', name: 'R\u1ED3ng L\u1EEDa', gif: '/pets/dino/DinoSprites_mort.gif', sprite: null   },
  frog:   { emoji: '\uD83D\uDC38', name: '\u1EBFch B\u0103ng',  gif: null,                              sprite: 'frog' },
  pig:    { emoji: '\uD83D\uDC37', name: 'Heo L\u00E1',         gif: null,                              sprite: 'pig'  },
  // fallback khi default/skip egg
  slime:  { emoji: '\uD83D\uDFE2', name: 'Slime',               gif: null,                              sprite: null   },
};

// Widget state machine values
// 'loading' | 'no_pet' | 'egg_unhatched' | 'hatching' | 'hatched'

const FEED_COST = 50;
const PLAY_COST = 20;
const CURE_COST = 150;


export default function PetWidget({ theme = {} }) {
  const [pet, setPet]                   = useState(null);
  const [widgetState, setWidgetState]   = useState('loading');
  const [busy, setBusy]                 = useState(false);
  const [hatchResult, setHatchResult]   = useState(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const [error, setError]               = useState(null);
  // Floating +icon animation: array of { id, label, x }
  const [floaties, setFloaties]         = useState([]);

  // ── Load pet on mount ──────────────────────────────────────────────────────
  const loadPet = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/pet');
      const petData = res.data?.pet || res.data;

      if (!petData || !petData.user) {
        setWidgetState('no_pet');
        return;
      }

      setPet(petData);

      if (petData.hatched) {
        setWidgetState('hatched');
      } else if (petData.egg_type) {
        setWidgetState('egg_unhatched');
      } else {
        setWidgetState('hatched');
      }
    } catch (err) {
      console.error('[PetWidget] load error:', err);
      setError(err.response?.data?.message || err.message);
      setWidgetState('no_pet');
    }
  }, []);

  useEffect(() => {
    loadPet();
  }, [loadPet]);

  // ── Hatch handler ──────────────────────────────────────────────────────────
  const handleHatch = async () => {
    if (busy) return;
    setBusy(true);
    setWidgetState('hatching');
    try {
      const res = await axiosInstance.post('/pet/hatch');
      setPet(res.data.pet);
      setHatchResult({ petName: res.data.petName, coinsEarned: res.data.coinsEarned });
      // Short burst animation then reveal
      setTimeout(() => {
        setWidgetState('hatched');
        setShowCongrats(true);
        // Hide congrats after 6s
        setTimeout(() => setShowCongrats(false), 6000);
      }, 1200);
    } catch (err) {
      console.error('[PetWidget] hatch error:', err);
      // If already hatched, reload
      if (err.response?.status === 400) {
        await loadPet();
      } else {
        setWidgetState('egg_unhatched');
      }
    } finally {
      setBusy(false);
    }
  };

  // ── Spawn floating icon (micro-interaction) ───────────────────────────────
  const spawnFloat = (label) => {
    const id = Date.now() + Math.random();
    setFloaties(f => [...f, { id, label, x: Math.random() * 40 - 20 }]);
    setTimeout(() => setFloaties(f => f.filter(fl => fl.id !== id)), 1000);
  };

  // ── Normal pet actions ─────────────────────────────────────────────────────
  const handleCheckin = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await axiosInstance.post('/pet/checkin');
      setPet(res.data.pet);
      spawnFloat('⭐');
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in thất bại');
    } finally {
      setBusy(false);
    }
  };

  const handleFeed = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await axiosInstance.post('/pet/feed-direct');
      setPet(res.data.pet);
      spawnFloat('🍗');
      spawnFloat('💚');
    } catch (err) {
      alert(err.response?.data?.message || 'Feed thất bại');
    } finally {
      setBusy(false);
    }
  };

  const handlePlay = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await axiosInstance.post('/pet/play');
      setPet(res.data.pet);
      spawnFloat('💛');
    } catch (err) {
      const msg = err.response?.data?.message || 'Play thất bại';
      if (err.response?.status === 429 && err.response?.data?.retryAfterMs) {
        const sec = Math.ceil(err.response.data.retryAfterMs / 1000);
        alert(`${msg} — ${sec}s nữa nhé!`);
      } else {
        alert(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCure = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await axiosInstance.post('/pet/cure');
      setPet(res.data.pet);
      spawnFloat('💊');
      spawnFloat('✨');
    } catch (err) {
      alert(err.response?.data?.message || 'Chữa bệnh thất bại');
    } finally {
      setBusy(false);
    }
  };


  // ── Card wrapper ───────────────────────────────────────────────────────────
  const Card = ({ children, extra = '' }) => (
    <div className={`rounded-2xl border p-4 ${theme?.card || 'bg-gray-900/85'} ${theme?.border || 'border-gray-700'} ${extra}`}>
      {children}
    </div>
  );

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (widgetState === 'loading') {
    return (
      <Card>
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className={`text-sm ${theme?.sub || 'text-gray-400'}`}>Đang tải thú cưng…</span>
        </div>
      </Card>
    );
  }

  // ── NO PET / ERROR ─────────────────────────────────────────────────────────
  if (widgetState === 'no_pet') {
    return (
      <Card>
        <div className="text-center py-3">
          <div className="text-3xl mb-2">🥚</div>
          <p className={`text-sm ${theme?.sub || 'text-gray-400'}`}>
            {error ? `Lỗi: ${error}` : 'Chưa có thú cưng. Hoàn thành onboarding để nhận trứng!'}
          </p>
        </div>
      </Card>
    );
  }

  // ── EGG UNHATCHED ──────────────────────────────────────────────────────────
  if (widgetState === 'egg_unhatched' || widgetState === 'hatching') {
    const eggCfg  = EGG_CONFIG[pet?.egg_type || 'default'];
    const hatching = widgetState === 'hatching';

    return (
      <Card extra="overflow-hidden relative">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 rounded-2xl opacity-10 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 40%, ${eggCfg.color}, transparent 70%)` }}
        />

        <div className="relative text-center">
          {/* Title */}
          <p className={`text-xs font-semibold mb-3 uppercase tracking-wider ${theme?.sub || 'text-gray-400'}`}>
            Thú Cưng Đang Chờ
          </p>

          {/* Egg pixel art */}
          <div className="flex justify-center mb-3">
            <PixelEgg
              tint={pet?.egg_type || 'default'}
              size={88}
              wiggle={!hatching}
              phase={hatching ? 'hatch' : 'idle'}
            />
          </div>

          {/* Label */}
          <p className={`text-sm font-bold mb-1 ${theme?.text || 'text-white'}`}>
            {eggCfg.label}
          </p>
          <p className={`text-xs mb-5 ${theme?.sub || 'text-gray-400'}`}>
            Một sinh linh bí ẩn đang chờ bạn!
          </p>

          {/* Hatch button */}
          {hatching ? (
            <div className="flex items-center justify-center gap-2 py-3">
              <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-yellow-400 font-bold text-sm animate-pulse">Đang ấp nở…</span>
            </div>
          ) : (
            <button
              onClick={handleHatch}
              disabled={busy}
              className={`
                w-full py-3 rounded-xl font-bold text-sm text-gray-900
                bg-linear-to-r from-yellow-400 to-orange-500
                shadow-lg shadow-orange-500/30
                hover:scale-105 hover:shadow-orange-500/50
                active:scale-95 transition-all duration-200
                flex items-center justify-center gap-2
              `}
            >
              🐣 BẤM VÀO ĐỂ ẤP NỞ!
            </button>
          )}
        </div>

        {/* Keyframes */}
        <style>{`
          @keyframes wiggle {
            0%,100% { transform: rotate(-10deg) scale(1.05); }
            50%      { transform: rotate(10deg)  scale(1.05); }
          }
        `}</style>
      </Card>
    );
  }

  // ── HATCHED — normal pet UI ────────────────────────────────────────────────
  // Map petType cũ (cat/dog/bird/custom) → petType mới để hiển thị đúng sprite
  const LEGACY_MAP = { cat: 'frog', dog: 'pig', bird: 'dragon', custom: 'dragon' };
  const resolvedType = PET_CONFIG[pet?.petType] ? pet?.petType : (LEGACY_MAP[pet?.petType] || 'slime');
  const petCfg       = PET_CONFIG[resolvedType];
  const checkedInCooldown = pet?.lastCheckinAt
    ? (Date.now() - new Date(pet.lastCheckinAt).getTime()) < (12 * 60 * 60 * 1000)
    : false;

  // ── Trạng thái hunger — 4 mức ──────────────────────────────────────────────
  const hungerPct = pet?.hunger ?? 0;
  // sick:    pet.isSick = true → EXP locked, animation xanh xao
  // dying:   hunger >= 100     → EXP locked, streak vỡ
  // warning: 80 ≤ hunger < 100 → widget chớp đỏ, mặt buồn
  // happy:   hunger < 50  → buff EXP +10%
  const petStatus  = pet?.isSick      ? 'sick'
                   : hungerPct >= 100 ? 'dying'
                   : hungerPct >= 80  ? 'warning'
                   : hungerPct < 50   ? 'happy'
                   :                    'neutral';
  const isSick     = petStatus === 'sick';
  const isDying    = petStatus === 'dying';
  const isWarning  = petStatus === 'warning';
  const isHappy    = petStatus === 'happy';
  const happiness  = pet?.happiness ?? 0;

  // Avatar expression theo trạng thái
  const avatarEmoji = isSick ? '\uD83E\uDD12' // 🤒
                    : isDying || isWarning ? '\uD83D\uDE3F' // 😿
                    : petCfg.emoji;


  const pixelImg   = pet?.evolutionImage || pet?.speciesRef?.base_image_url || null;
  const displayName = pet?.nickname || pet?.speciesRef?.name || petCfg.name;

  const availableCoins = Number(pet?.coins ?? 0);
  const canFeed = availableCoins >= FEED_COST;
  const canPlay = availableCoins >= PLAY_COST;
  const canCure = availableCoins >= CURE_COST;

  return (
    <Card extra={`overflow-hidden relative ${isSick ? 'animate-[pulseGreen_2s_ease-in-out_infinite]' : isDying ? 'animate-[pulseRed_1s_ease-in-out_infinite]' : isWarning ? 'animate-[pulseRed_2s_ease-in-out_infinite]' : ''}`}>

      {/* Floating micro-interaction icons */}
      {floaties.map(fl => (
        <div
          key={fl.id}
          className="absolute bottom-16 left-1/2 text-lg font-bold pointer-events-none z-30
                     animate-[floatUp_1s_ease-out_forwards]"
          style={{ transform: `translateX(calc(-50% + ${fl.x}px))` }}
        >
          {fl.label}
        </div>
      ))}

      {/* Congrats banner */}
      {showCongrats && hatchResult && (
        <div className="absolute inset-x-0 top-0 z-20 rounded-t-2xl bg-linear-to-r from-yellow-500/90 to-orange-500/90 px-4 py-2 text-center">
          <p className="text-white font-bold text-sm animate-bounce">
            🎉 +{hatchResult.coinsEarned} Coins! {hatchResult.petName} đã gia nhập đội của bạn!
          </p>
        </div>
      )}

      {/* ── Status banner ── */}
      {isSick && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl
                        bg-green-500/20 border border-green-500/50">
          <span className="text-lg">🤒</span>
          <div>
            <p className="text-green-400 text-xs font-bold">Pet đang BỊ BỆNH!</p>
            <p className="text-green-300 text-[10px]">Cần uống thuốc để hồi phục và nhận EXP buff.</p>
          </div>
        </div>
      )}
      {isDying && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl
                        bg-red-500/20 border border-red-500/50 animate-pulse">
          <span className="text-lg">💀</span>
          <div>
            <p className="text-red-400 text-xs font-bold">Pet đang HẤP HỐI!</p>
            <p className="text-red-300 text-[10px]">Streak bị vỡ • EXP bị khoá cho đến khi cứu pet</p>
          </div>
        </div>
      )}

      {!isDying && isWarning && (
        <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-xl
                        bg-orange-500/15 border border-orange-500/30">
          <span className="text-base animate-bounce">😿</span>
          <p className="text-orange-400 text-xs font-semibold">
            Bé đang đói lắm! Cho ăn ngay không bé ngỏm mất!
          </p>
        </div>
      )}
      {!isDying && !isWarning && isHappy && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl
                        bg-green-500/10 border border-green-500/20">
          <span className="text-sm">✨</span>
          <p className="text-green-400 text-[11px] font-semibold">Pet vui vẻ! +10% EXP khi làm bài</p>
        </div>
      )}

      <div className={`flex items-center gap-3 ${showCongrats ? 'mt-9' : ''}`}>
        {/* Avatar */}
        <div className={`w-16 h-16 rounded-xl shrink-0 overflow-hidden relative
                         bg-linear-to-br from-[#6C5CE7]/30 to-[#00CEC9]/30
                         border flex items-center justify-center shadow-lg
                         ${isSick    ? 'border-green-500/60'
                         : isDying   ? 'border-red-600/80 animate-[pulseRed_0.8s_ease-in-out_infinite]'
                         : isWarning ? 'border-orange-500/60 animate-[pulseRed_1.5s_ease-in-out_infinite]'
                         :             'border-gray-700'}
                         ${showCongrats ? 'animate-bounce' : ''}`}>

          {isDying || isWarning ? (
            /* Khi warning/dying: emoji buồn */
            <span className="text-3xl">{avatarEmoji}</span>
          ) : petCfg.gif ? (
            /* GIF animation (dragon/dino) */
            <img
              src={petCfg.gif}
              alt={displayName}
              style={{ width: 56, height: 56, imageRendering: 'pixelated', objectFit: 'contain' }}
            />
          ) : petCfg.sprite ? (
            /* Pixel sprite frames (frog / pig) */
            <PixelPetIdle petType={petCfg.sprite} size={56} />
          ) : (
            /* Emoji fallback */
            <span className="text-3xl">{petCfg.emoji}</span>
          )}
          {/* Tear drops khi đói */}
          {(isDying || isWarning) && (
            <div className="absolute bottom-0 right-0 text-[10px] leading-none">💧</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <RenameField
            displayName={displayName}
            theme={theme}
            onSave={async (newName) => {
              const res = await axiosInstance.patch('/pet/rename', { nickname: newName });
              setPet(prev => ({ ...prev, nickname: res.data.nickname }));
            }}
          />
          <div className={`text-xs mt-0.5 ${theme?.sub || 'text-gray-400'}`}>
            Lv.{pet?.level || 1} •{' '}
            {isDying ? (
              <span className="text-red-400 font-bold line-through opacity-60">
                Streak {pet?.streakCount || 0}d
              </span>
            ) : (
              <span>Streak {pet?.streakCount || 0}d</span>
            )}
            {isDying && <span className="ml-1 text-red-400">💀</span>}
          </div>

          {/* Stat bars */}
          <div className="mt-2 space-y-1">
            <HungerBar hungerPct={hungerPct} isDying={isDying} isWarning={isWarning} />
            <StatBar label="⚡" value={Math.min(100, ((pet?.growthPoints || 0) % 100))} color="from-blue-400 to-purple-400" />
            <StatBar label="💛" value={happiness} color="from-yellow-400 to-lime-400" />
          </div>
        </div>
      </div>


      {/* Actions */}
      <div className="mt-2 flex gap-2">
        {/* Cure button if sick */}
        {isSick ? (
          <button
            onClick={handleCure}
            disabled={busy || !canCure}
            className={`flex-[2] py-2 rounded-xl text-white text-xs font-bold transition-all flex items-center justify-center gap-2
              ${canCure
                ? 'bg-linear-to-r from-green-500 to-emerald-600 hover:scale-105 shadow-md active:scale-95'
                : 'bg-gray-700 opacity-50 cursor-not-allowed'}
            `}
          >
            💊 Mua thuốc ({CURE_COST} 🪙)
          </button>
        ) : (
          <button
            onClick={handleCheckin}
            disabled={busy || checkedInCooldown}
            className={`flex-1 py-2 rounded-xl text-white text-xs font-semibold transition-all
              ${checkedInCooldown
                ? 'opacity-50 cursor-not-allowed bg-gray-700'
                : 'bg-linear-to-r from-[#6C5CE7] to-[#00CEC9] hover:scale-105 shadow-md active:scale-95'}
            `}
          >
            {checkedInCooldown ? '✅ Điểm danh' : '📅 Điểm danh'}
          </button>
        )}


        {/* Feed — hiện giá, disabled nếu không đủ coins */}
        <button
          onClick={handleFeed}
          disabled={busy || !canFeed}
          title={!canFeed ? `Cần ${FEED_COST} 🪙 — hãy đi học để kiếm thêm!` : `Cho ăn (-${FEED_COST} 🪙)`}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all
                      flex flex-col items-center justify-center gap-0 leading-tight
            ${canFeed
              ? 'border border-orange-500/50 text-orange-300 hover:bg-orange-500/15 active:scale-95'
              : 'border border-gray-700 text-gray-600 cursor-not-allowed opacity-50'}
          `}
        >
          <span className="flex items-center gap-1">
            <Icon forceShow><FaDrumstickBite size={11} /></Icon>
            <span>Cho ăn</span>
          </span>
          <span className={`text-[10px] ${canFeed ? 'text-orange-400' : 'text-gray-600'}`}>
            -{FEED_COST} 🪙
          </span>
        </button>

        {/* Play */}
        <button
          onClick={handlePlay}
          disabled={busy || !canPlay}
          title={!canPlay ? `Cần ${PLAY_COST} 🪙 — hãy đi học để kiếm thêm!` : `Chơi (-${PLAY_COST} 🪙)`}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all
                      flex flex-col items-center justify-center gap-0 leading-tight
            ${canPlay
              ? 'border border-pink-500/50 text-pink-300 hover:bg-pink-500/15 active:scale-95'
              : 'border border-gray-700 text-gray-600 cursor-not-allowed opacity-50'}
          `}
        >
          <span className="flex items-center gap-1">
            <Icon forceShow><FaHeart size={11} /></Icon>
            <span>Chơi</span>
          </span>
          <span className={`text-[10px] ${canPlay ? 'text-pink-400' : 'text-gray-600'}`}>
            -{PLAY_COST} 🪙
          </span>
        </button>
      </div>

      {/* Tooltip khi không đủ tiền */}
      {(!canFeed || !canPlay) && (
        <p className="mt-2 text-center text-[10px] text-gray-600">
          💡 Làm bài tập để kiếm coins và chăm sóc bé nhé!
        </p>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes floatUp {
          0%   { opacity: 1; transform: translateX(var(--tw-translate-x, 0)) translateY(0) scale(1); }
          100% { opacity: 0; transform: translateX(var(--tw-translate-x, 0)) translateY(-48px) scale(1.3); }
        }
        @keyframes pulseRed {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
          50%     { box-shadow: 0 0 8px 2px rgba(239,68,68,0.4); }
        }
        @keyframes pulseGreen {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
          50%     { box-shadow: 0 0 8px 2px rgba(34,197,94,0.4); }
        }
      `}</style>

    </Card>
  );
}

// ── Hunger bar — nhấp nháy đỏ khi nguy hiểm ─────────────────────────────────
function HungerBar({ hungerPct, isDying = false, isWarning = false }) {
  // hunger 0=full, 100=starving → fullness = 100 - hunger
  const fullness = 100 - hungerPct;

  const barColor = isDying
    ? 'from-red-600 to-red-800'
    : isWarning
    ? 'from-orange-400 to-red-400'
    : fullness >= 50
    ? 'from-green-400 to-lime-400'
    : 'from-orange-400 to-amber-500';

  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] w-3">🍖</span>
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-linear-to-r ${barColor} transition-all duration-500
            ${isDying ? 'animate-pulse' : ''}`}
          style={{ width: `${Math.min(100, Math.max(0, fullness))}%` }}
        />
      </div>
      <span className={`text-[10px] w-6 text-right font-semibold
        ${isDying ? 'text-red-400 animate-pulse' : isWarning ? 'text-orange-400' : 'text-gray-500'}`}>
        {fullness}%
      </span>
    </div>
  );
}

// ── Inline rename field ────────────────────────────────────────────────────────
function RenameField({ displayName, theme, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState('');
  const [saving, setSaving]   = useState(false);
  const inputRef              = useRef(null);

  const startEdit = () => {
    setValue(displayName);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };
  const cancel  = () => setEditing(false);
  const confirm = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === displayName) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(trimmed); }
    catch { /* parent handles */ }
    finally { setSaving(false); setEditing(false); }
  };
  const onKeyDown = (e) => {
    if (e.key === 'Enter') confirm();
    if (e.key === 'Escape') cancel();
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          maxLength={20}
          className="flex-1 min-w-0 bg-gray-800 border border-blue-500 rounded-lg
                     text-white text-sm font-bold px-2 py-0.5 outline-none"
        />
        <button onClick={confirm} disabled={saving} className="text-green-400 hover:text-green-300">
          <Icon forceShow><FaCheck size={11} /></Icon>
        </button>
        <button onClick={cancel} className="text-gray-500 hover:text-gray-300">
          <Icon forceShow><FaTimes size={11} /></Icon>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 group">
      <span className={`font-bold text-base truncate ${theme?.text || 'text-white'}`}>
        {displayName}
      </span>
      <button
        onClick={startEdit}
        className="text-gray-600 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
        title="Đổi tên"
      >
        <Icon forceShow><FaPencilAlt size={11} /></Icon>
      </button>
    </div>
  );
}

// ── Generic stat bar ───────────────────────────────────────────────────────────
function StatBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] w-3">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-linear-to-r ${color} transition-all duration-500`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-500 w-6 text-right">{value}%</span>
    </div>
  );
}
