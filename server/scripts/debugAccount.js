const axios = require('axios');
const fs = require('fs');
const readline = require('readline');

// tiny CLI arg parser
const argv = process.argv.slice(2).reduce((acc, cur) => {
  if (cur.startsWith('--')) {
    const [k, v] = cur.slice(2).split('=');
    acc[k] = v === undefined ? true : v;
  }
  return acc;
}, {});

const prompt = (q) => new Promise((r) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(q, (ans) => { rl.close(); r(ans); });
});

const promptHidden = (question) => new Promise((resolve) => {
  const stdin = process.stdin;
  const stdout = process.stdout;
  stdout.write(question);
  stdin.resume();
  stdin.setRawMode(true);
  stdin.setEncoding('utf8');
  let value = '';
  const onData = (ch) => {
    ch = String(ch);
    if (ch === '\r' || ch === '\n') {
      stdout.write('\n'); stdin.setRawMode(false); stdin.pause(); stdin.removeListener('data', onData); resolve(value); return;
    }
    if (ch === '\u0003') process.exit();
    if (ch === '\u0008' || ch === '\u007f') { value = value.slice(0, -1); stdout.clearLine(); stdout.cursorTo(0); stdout.write(question + '*'.repeat(value.length)); return; }
    value += ch; stdout.write('*');
  };
  stdin.on('data', onData);
});

const getArg = async (name, opts = {}) => {
  if (argv[name]) return argv[name];
  if (process.env[name.toUpperCase()]) return process.env[name.toUpperCase()];
  if (opts.prompt) return await prompt(opts.prompt);
  if (opts.promptHidden) return await promptHidden(opts.promptHidden);
  return undefined;
};

const extractCookieHeader = (setCookieArray) => {
  if (!setCookieArray) return null;
  // setCookieArray is like ['token=abc; Path=/; HttpOnly', 'sid=...']
  const pairs = setCookieArray.map((s) => s.split(';')[0].trim());
  return pairs.join('; ');
};

const writeOut = (outPath, text) => {
  if (!outPath) return;
  try { fs.appendFileSync(outPath, text + '\n'); } catch (e) { console.error('Failed to write out file:', e.message); }
};

const run = async () => {
  const base = argv.base || process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  const out = argv.out || null;
  const debug = argv.debug || false;

  const email = await getArg('email', { prompt: 'Email: ' });
  const password = await getArg('password', { promptHidden: 'Password: ' });

  if (!email || !password) {
    console.error('Email and password are required. Pass --email and --password or run interactively.');
    process.exit(1);
  }

  const now = new Date().toISOString();
  writeOut(out, `\n=== debugAccount run ${now} ===`);

  const axiosInst = axios.create({ baseURL: base, validateStatus: () => true });

  const log = (label, obj) => {
    const s = `[${label}] ${typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)}`;
    console.log(s);
    writeOut(out, s);
  };

  try {
    // 1. Ping root
    const root = await axiosInst.get('/');
    log('ROOT', { status: root.status, statusText: root.statusText, data: root.data });

    // 2. Login
    const login = await axiosInst.post('/api/auth/login', { email, password });
    log('LOGIN_STATUS', { status: login.status, statusText: login.statusText });
    if (debug) log('LOGIN_HEADERS', login.headers);
    log('LOGIN_BODY', login.data);
    writeOut(out, '---');

    // determine auth: token or cookies
    const token = login.data?.token || login.data?.accessToken || null;
    let cookieHeader = null;
    if (login.headers && login.headers['set-cookie']) {
      cookieHeader = extractCookieHeader(login.headers['set-cookie']);
      log('SET_COOKIE', login.headers['set-cookie']);
      log('COOKIE_HEADER', cookieHeader);
    }

    // 3. Call /api/auth/me
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : (cookieHeader ? { Cookie: cookieHeader } : {});
      const me = await axiosInst.get('/api/auth/me', { headers });
      log('ME_STATUS', { status: me.status, statusText: me.statusText });
      if (debug) log('ME_HEADERS', me.headers);
      log('ME_BODY', me.data);
    } catch (e) { log('ME_ERROR', e.message); }

    // 4. Call onboarding status
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : (cookieHeader ? { Cookie: cookieHeader } : {});
      const onb = await axiosInst.get('/api/onboarding/status', { headers });
      log('ONBOARDING_STATUS', { status: onb.status, body: onb.data });
    } catch (e) { log('ONB_ERROR', e.message); }

    // 5. Try admin route
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : (cookieHeader ? { Cookie: cookieHeader } : {});
      const admin = await axiosInst.get('/api/admin/topics', { headers });
      log('ADMIN_TOPICS', { status: admin.status, body: admin.data });
    } catch (e) { log('ADMIN_ERROR', e.message); }

    // 6. Optionally set onboarding_completed true (if --set-onboarding)
    if (argv['set-onboarding']) {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : (cookieHeader ? { Cookie: cookieHeader } : {});
        const payload = { goal: 'band', current_level: 'intermediate' };
        const res = await axiosInst.post('/api/onboarding', payload, { headers });
        log('SET_ONBOARDING', { status: res.status, body: res.data });
      } catch (e) { log('SET_ONB_ERROR', e.message); }
    }

    log('DONE', `Debug run complete (base=${base})`);
  } catch (error) {
    if (error.response) {
      log('ERROR', { status: error.response.status, data: error.response.data });
    } else {
      log('ERROR', error.message);
    }
    process.exit(1);
  }
};

run();
