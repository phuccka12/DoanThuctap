const Pet = require('../models/Pet');

// Pet decay job: runs daily at UTC midnight (approx) and updates hunger/happiness
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

async function runDecayOnce() {
  try {
    console.log('[petDecay] Running daily decay job');
    const pets = await Pet.find({});
    const updates = [];
    for (const pet of pets) {
      // hunger increases each day by 8
      pet.hunger = clamp(pet.hunger + 8, 0, 100);
      // happiness drops a bit each day; more if very hungry
      let happinessDrop = 3;
      if (pet.hunger >= 80) happinessDrop += 10;
      else if (pet.hunger >= 50) happinessDrop += 4;
      pet.happiness = clamp(pet.happiness - happinessDrop, 0, 100);

      // if hunger is very high, small coin penalty (optional)
      if (pet.hunger >= 90) {
        pet.coins = Math.max(0, pet.coins - 1);
      }

      updates.push(pet.save());
    }

    await Promise.all(updates);
    console.log('[petDecay] Finished, updated', updates.length, 'pets');
  } catch (err) {
    console.error('[petDecay] Error running decay job', err);
  }
}

// Start a job that runs at next UTC midnight, then every 24h
function startPetDecayJob() {
  try {
    const now = new Date();
    // next UTC midnight
    const nextUtcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const msUntil = nextUtcMidnight - now;
    console.log('[petDecay] Scheduling first run in', Math.round(msUntil / 1000 / 60), 'minutes');
    setTimeout(() => {
      // Run immediately at that time, then schedule every 24h
      runDecayOnce();
      setInterval(runDecayOnce, 24 * 60 * 60 * 1000);
    }, msUntil);
  } catch (err) {
    console.error('[petDecay] Failed to start job', err);
  }
}

module.exports = { startPetDecayJob, runDecayOnce };
