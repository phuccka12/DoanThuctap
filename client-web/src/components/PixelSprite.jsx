import React, { useEffect, useState } from 'react';

/**
 * PixelSprite — Hiển thị animation pixel art từ các tile PNG riêng lẻ.
 *
 * Props:
 *   frames     — mảng số thứ tự frame
 *   fps        — frames per second (default 10)
 *   size       — kích thước hiển thị px (default 64)
 *   filter     — CSS filter string tuỳ ý (override tint)
 *   tint       — shortcut: 'fire'|'ice'|'leaf'|'default'|null
 *   paused     — dừng animation
 *   basePath   — thư mục chứa tile (default '/pets/egg-red/')
 */
export function PixelSprite({
  frames = [],
  fps = 10,
  size = 64,
  filter: filterProp = null,
  tint = null,
  paused = false,
  basePath = '/pets/egg-red/',
}) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0); // reset khi frames thay đổi
  }, [basePath]);

  useEffect(() => {
    if (paused || frames.length <= 1) return;
    const iv = setInterval(() => setIdx(i => (i + 1) % frames.length), 1000 / fps);
    return () => clearInterval(iv);
  }, [frames, fps, paused]);

  // CSS filter map — nhuộm lại màu spritesheet đỏ gốc
  const TINT_MAP = {
    fire:    null,   // đỏ gốc, không cần filter
    ice:     'sepia(1) saturate(6) hue-rotate(175deg) brightness(1.2)',
    leaf:    'sepia(1) saturate(5) hue-rotate(85deg)  brightness(1.1)',
    default: 'sepia(1) saturate(4) hue-rotate(260deg) brightness(1.2)',
  };

  const cssFilter = filterProp || (tint ? TINT_MAP[tint] ?? null : null);

  const frame  = frames[idx] ?? 0;
  const padded = String(frame).padStart(3, '0');
  const src    = `${basePath}tile${padded}.png`;

  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        objectFit: 'contain',
        filter: cssFilter || undefined,
        display: 'block',
      }}
    />
  );
}

// ── Trứng rung lắc (egg_unhatched) ────────────────────────────────────────────
// Spritesheet trứng: 442 frames 16×16 tại /pets/egg-red/
// Chia ~4 giai đoạn: idle rung (0-109) | lắc mạnh (110-219) | nứt (220-329) | nở (330-441)
// Dùng idle cycle cho widget trứng chưa nở
const EGG_IDLE_FRAMES  = range(0,   109);  // rung nhẹ
const EGG_SHAKE_FRAMES = range(110, 219);  // lắc mạnh (khi hover/select)
const EGG_HATCH_FRAMES = range(330, 441);  // nở (dùng khi hatching)

export function PixelEgg({
  tint    = 'fire',
  size    = 80,
  wiggle  = true,   // nếu false → static frame 0
  phase   = 'idle', // 'idle' | 'shake' | 'hatch'
}) {
  const FRAMES_MAP = {
    idle:  EGG_IDLE_FRAMES,
    shake: EGG_SHAKE_FRAMES,
    hatch: EGG_HATCH_FRAMES,
  };
  const frames = FRAMES_MAP[phase] || EGG_IDLE_FRAMES;
  const fps    = phase === 'hatch' ? 18 : phase === 'shake' ? 14 : 10;

  return (
    <div style={{ display: 'inline-block' }} className={wiggle && phase === 'idle' ? 'animate-[eggWiggle_1.4s_ease-in-out_infinite]' : ''}>
      <PixelSprite
        frames={wiggle ? frames : [0]}
        fps={fps}
        size={size}
        tint={tint}
        basePath="/pets/egg-red/"
        paused={!wiggle && phase === 'idle'}
      />
      <style>{`
        @keyframes eggWiggle {
          0%,100% { transform: rotate(-7deg) scale(1.04); }
          25%     { transform: rotate(0deg)  scale(1.07); }
          50%     { transform: rotate(7deg)  scale(1.04); }
          75%     { transform: rotate(0deg)  scale(1.07); }
        }
      `}</style>
    </div>
  );
}

// ── Pet đã nở — idle animation ────────────────────────────────────────────────
// Mỗi petType có basePath + frame range riêng
const PET_SPRITE_MAP = {
  // frog: 36 frames 24×24 — nhuộm màu băng (xanh dương)
  frog: {
    basePath: '/pets/frog/',
    frames: range(0, 35),
    fps: 12,
    filter: 'sepia(1) saturate(6) hue-rotate(175deg) brightness(1.2)',
  },
  // pig: 36 frames 24×24 — nhuộm màu xanh lá
  pig: {
    basePath: '/pets/pig/',
    frames: range(0, 35),
    fps: 12,
    filter: 'sepia(1) saturate(5) hue-rotate(85deg) brightness(1.1)',
  },
  // dragon dùng GIF riêng — không dùng PixelSprite (handle ở PetWidget)
  dragon: null,
};

export function PixelPetIdle({ size = 64, petType = 'cat' }) {
  const cfg = PET_SPRITE_MAP[petType];
  if (!cfg) return null;
  return (
    <PixelSprite
      frames={cfg.frames}
      fps={cfg.fps}
      size={size}
      basePath={cfg.basePath}
      filter={cfg.filter || null}
    />
  );
}

// helper
function range(start, end) {
  const arr = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}
