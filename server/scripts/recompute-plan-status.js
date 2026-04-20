#!/usr/bin/env node
'use strict';

/**
 * Recompute UserPlan task/day statuses from current task data.
 *
 * Usage:
 *   node scripts/recompute-plan-status.js                // dry-run (default)
 *   node scripts/recompute-plan-status.js --commit       // write changes
 *   node scripts/recompute-plan-status.js --commit --all-statuses
 *   node scripts/recompute-plan-status.js --commit --user <userId>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const UserPlan = require('../src/models/UserPlan');

function normalizeTaskStatus(raw) {
  const s = String(raw || '').toLowerCase();
  if (['completed', 'in_progress', 'pending', 'skipped'].includes(s)) return s;
  return 'pending';
}

function computeDayStatus(day = {}) {
  const tasks = Array.isArray(day.tasks) ? day.tasks : [];
  if (tasks.length === 0) {
    return normalizeTaskStatus(day.status || 'pending');
  }
  const statuses = tasks.map(t => normalizeTaskStatus(t?.status));
  const allDone = statuses.every(s => s === 'completed' || s === 'skipped');
  if (allDone) return 'completed';
  if (statuses.some(s => s === 'in_progress')) return 'in_progress';
  return 'pending';
}

function parseArgs(argv) {
  const args = { commit: false, allStatuses: false, userId: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--commit') args.commit = true;
    else if (a === '--all-statuses') args.allStatuses = true;
    else if (a === '--user') args.userId = argv[i + 1] || null, i++;
  }
  return args;
}

async function main() {
  const { commit, allStatuses, userId } = parseArgs(process.argv.slice(2));
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is missing in environment.');
  }

  await mongoose.connect(uri);

  const query = allStatuses ? {} : { status: 'active' };
  if (userId) query.userId = userId;

  const plans = await UserPlan.find(query);
  let scanned = 0;
  let changedPlans = 0;
  let changedDays = 0;

  for (const plan of plans) {
    scanned += 1;
    if (!Array.isArray(plan.dayItems) || plan.dayItems.length === 0) continue;

    let planChanged = false;
    for (const day of plan.dayItems) {
      const prevDayStatus = normalizeTaskStatus(day.status);
      let localDayChanged = false;

      if (Array.isArray(day.tasks) && day.tasks.length > 0) {
        for (const task of day.tasks) {
          const prevTaskStatus = normalizeTaskStatus(task?.status);
          if (task.status !== prevTaskStatus) {
            task.status = prevTaskStatus;
            localDayChanged = true;
          }
        }
      }

      const nextDayStatus = computeDayStatus(day);
      if (day.status !== nextDayStatus) {
        day.status = nextDayStatus;
        localDayChanged = true;
      }

      const prevCompletedAt = day.completedAt ? new Date(day.completedAt).toISOString() : null;
      const shouldCompletedAt = nextDayStatus === 'completed';
      if (shouldCompletedAt && !day.completedAt) {
        day.completedAt = new Date();
        localDayChanged = true;
      }
      if (!shouldCompletedAt && day.completedAt) {
        day.completedAt = null;
        localDayChanged = true;
      }

      const nowCompletedAt = day.completedAt ? new Date(day.completedAt).toISOString() : null;
      if (localDayChanged || prevDayStatus !== nextDayStatus || prevCompletedAt !== nowCompletedAt) {
        changedDays += 1;
        planChanged = true;
      }
    }

    if (planChanged) {
      changedPlans += 1;
      if (commit) {
        plan.markModified('dayItems');
        await plan.save();
      }
    }
  }

  console.log('--- Recompute Plan Status Summary ---');
  console.log(`Mode           : ${commit ? 'COMMIT' : 'DRY-RUN'}`);
  console.log(`Query          : ${JSON.stringify(query)}`);
  console.log(`Plans scanned  : ${scanned}`);
  console.log(`Plans changed  : ${changedPlans}`);
  console.log(`Days changed   : ${changedDays}`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('[recompute-plan-status] failed:', err.message);
  try { await mongoose.disconnect(); } catch (_) { /* ignore */ }
  process.exit(1);
});
