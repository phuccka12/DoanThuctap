const Pet          = require('../models/Pet');
const { getNum }   = require('../services/economyService');

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

async function runDecayOnce() {
  try {
    console.log('[petDecay] Running daily decay job');

    // Đọc config động từ DB (fallback nếu chưa có)
    const decayAmount      = await getNum('economy_hunger_decay_per_day',   30);
    const dyingThreshold   = await getNum('economy_hunger_dying_threshold', 100);
    const warningThreshold = await getNum('economy_hunger_warning_threshold', 80); // < 20% máu

    // Chỉ xử lý pet đã nở (hatched=true)
    const pets   = await Pet.find({ hatched: true });
    const saves  = [];

    for (const pet of pets) {
      // ── 1. Tăng hunger mỗi ngày ──────────────────────────────────────────
      pet.hunger = clamp(pet.hunger + decayAmount, 0, 100);

      // ── 2. Happiness giảm theo hunger ────────────────────────────────────
      let happinessDrop = 3;
      if (pet.hunger >= warningThreshold)  happinessDrop += 10; // đói nguy hiểm
      else if (pet.hunger >= 50)           happinessDrop += 4;  // đói trung bình
      pet.happiness = clamp(pet.happiness - happinessDrop, 0, 100);

      // ── 3. Hấp hối: hunger đạt ngưỡng dying ─────────────────────────────
      if (pet.hunger >= dyingThreshold) {
        const now    = new Date();
        const frozen = pet.streakFrozenUntil && new Date(pet.streakFrozenUntil) > now;
        if (!frozen) {
          pet.streakCount = 0;     // đứt streak
        } else {
          pet.streakFrozenUntil = null; // tiêu bùa để giữ streak
        }
      }

      saves.push(pet.save());
    }

    await Promise.all(saves);
    console.log(`[petDecay] Done — ${saves.length} pets updated. Decay: ${decayAmount}/day`);
  } catch (err) {
    console.error('[petDecay] Error running decay job', err);
  }
}

// Start a job that runs at next UTC midnight, then every 24h
function startPetDecayJob() {
  try {
    const now             = new Date();
    const nextUtcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const msUntil         = nextUtcMidnight - now;
    console.log('[petDecay] Scheduling first run in', Math.round(msUntil / 1000 / 60), 'minutes');
    setTimeout(() => {
      runDecayOnce();
      setInterval(runDecayOnce, 24 * 60 * 60 * 1000);
    }, msUntil);
  } catch (err) {
    console.error('[petDecay] Failed to start job', err);
  }
}

module.exports = { startPetDecayJob, runDecayOnce };
