const axios = require('axios');
const fs = require('fs');

// tiny CLI arg parser
const argv = process.argv.slice(2).reduce((acc, cur) => {
  if (cur.startsWith('--')) {
    const [k, v] = cur.slice(2).split('=');
    acc[k] = v === undefined ? true : v;
  }
  return acc;
}, {});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const extractCookieHeader = (setCookieArray) => {
  if (!setCookieArray) return null;
  const pairs = setCookieArray.map((s) => s.split(';')[0].trim());
  return pairs.join('; ');
};

const appendLog = (path, text) => {
  if (!path) return;
  try { fs.appendFileSync(path, text + '\n'); } catch (e) { console.error('Log write failed:', e.message); }
};

const runOnce = async (base, email, password, debug) => {
  const axiosInst = axios.create({ baseURL: base, validateStatus: () => true });
  const now = new Date().toISOString();
  const entry = { time: now, login: {}, me: {}, onboarding: {}, admin: {} };
  try {
    const login = await axiosInst.post('/api/auth/login', { email, password });
    entry.login.status = login.status;
    entry.login.body = login.data;

    const token = login.data?.token || login.data?.accessToken || null;
    let cookieHeader = null;
    if (login.headers && login.headers['set-cookie']) {
      cookieHeader = extractCookieHeader(login.headers['set-cookie']);
    }

    const headers = token ? { Authorization: `Bearer ${token}` } : (cookieHeader ? { Cookie: cookieHeader } : {});

    const me = await axiosInst.get('/api/auth/me', { headers });
    entry.me.status = me.status;
    entry.me.body = me.data;

    const onb = await axiosInst.get('/api/onboarding/status', { headers });
    entry.onboarding.status = onb.status;
    entry.onboarding.body = onb.data;

    const admin = await axiosInst.get('/api/admin/topics', { headers });
    entry.admin.status = admin.status;
    entry.admin.body = admin.data;

    return { ok: true, entry };
  } catch (err) {
    entry.error = err.message || String(err);
    return { ok: false, entry };
  }
};

const main = async () => {
  const base = argv.base || process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  const email = argv.email || process.env.WATCH_EMAIL;
  const password = argv.password || process.env.WATCH_PASSWORD;
  const intervalSec = parseInt(argv.interval || process.env.WATCH_INTERVAL || '60', 10);
  const out = argv.out || process.env.WATCH_OUT || 'watch-account.log';
  const debug = argv.debug || false;
  const alertOnFail = argv['alert-on-fail'] || false;
  const maxFailuresBeforeAlert = parseInt(argv['max-failures'] || process.env.WATCH_MAX_FAILS || '3', 10);

  if (!email || !password) {
    console.error('Please provide --email and --password (or set WATCH_EMAIL/WATCH_PASSWORD env vars)');
    process.exit(1);
  }

  console.log(`Watching account ${email} on ${base} every ${intervalSec}s; logging to ${out}`);
  appendLog(out, `=== watchAccount started ${new Date().toISOString()} ===`);

  let consecutiveFails = 0;
  let stopped = false;

  process.on('SIGINT', () => { console.log('Received SIGINT, stopping watcher...'); stopped = true; });
  process.on('SIGTERM', () => { console.log('Received SIGTERM, stopping watcher...'); stopped = true; });

  while (!stopped) {
    const result = await runOnce(base, email, password, debug);
    const logLine = `[${new Date().toISOString()}] ${JSON.stringify(result.entry)}`;
    appendLog(out, logLine);
    if (result.ok) {
      consecutiveFails = 0;
      if (debug) console.log('OK:', result.entry);
    } else {
      consecutiveFails += 1;
      console.error('Check failed:', result.entry.error);
      if (alertOnFail && consecutiveFails >= maxFailuresBeforeAlert) {
        const alertMsg = `[ALERT] ${new Date().toISOString()} - ${email} failed ${consecutiveFails} checks.`;
        console.error(alertMsg);
        appendLog(out, alertMsg);
        // reset counter after alert
        consecutiveFails = 0;
      }
    }

    // sleep
    let slept = 0;
    const waitMs = intervalSec * 1000;
    while (!stopped && slept < waitMs) {
      const chunk = Math.min(1000, waitMs - slept);
      await sleep(chunk);
      slept += chunk;
    }
  }

  appendLog(out, `=== watchAccount stopped ${new Date().toISOString()} ===`);
  console.log('Watcher stopped.');
};

main().catch((e) => { console.error('Watcher fatal error:', e.message || e); process.exit(1); });
