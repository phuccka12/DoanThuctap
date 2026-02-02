const axios = require('axios');
const readline = require('readline');

// tiny CLI arg parser for --key=value or --flag
const argv = process.argv.slice(2).reduce((acc, cur) => {
  if (cur.startsWith('--')) {
    const [k, v] = cur.slice(2).split('=');
    acc[k] = v === undefined ? true : v;
  }
  return acc;
}, {});

const prompt = (question) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(question, (answer) => { rl.close(); resolve(answer); });
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
      stdout.write('\n');
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
      resolve(value);
      return;
    }
    if (ch === '\u0003') process.exit();
    if (ch === '\u0008' || ch === '\u007f') {
      value = value.slice(0, -1);
      stdout.clearLine(); stdout.cursorTo(0);
      stdout.write(question + '*'.repeat(value.length));
      return;
    }
    value += ch;
    stdout.write('*');
  };
  stdin.on('data', onData);
});

const getArg = async (key, opts = {}) => {
  const v = argv[key] || process.env[key.toUpperCase()];
  if (v) return v;
  if (opts.prompt) return await prompt(opts.prompt);
  if (opts.promptHidden) return await promptHidden(opts.promptHidden);
  return undefined;
};

const run = async () => {
  try {
    const port = process.env.PORT || 5000;
    const base = argv.base || process.env.BASE_URL || `http://localhost:${port}`;

    const email = await getArg('email', { prompt: 'Email: ' });
    const password = await getArg('password', { promptHidden: 'Password: ' });

    if (!email || !password) {
      console.error('Email and password are required. Pass --email and --password or run interactively.');
      process.exit(1);
    }

    console.log(`→ Logging in as ${email} to ${base}`);
    const loginRes = await axios.post(`${base}/api/auth/login`, { email, password });
    const token = loginRes.data?.token || loginRes.data?.accessToken || null;
    console.log('\n[LOGIN] Response:');
    console.log(JSON.stringify(loginRes.data, null, 2));

    if (!token) {
      console.warn('No token returned from login. You may be using cookie-based auth.');
    }

    // Call /api/auth/me
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const me = await axios.get(`${base}/api/auth/me`, { headers });
      console.log('\n[ME]');
      console.log(JSON.stringify(me.data, null, 2));
    } catch (err) {
      console.error('\nFailed to call /api/auth/me:', err.response ? `${err.response.status} ${err.response.statusText}` : err.message);
    }

    // Try admin route to check admin permission
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const adminCheck = await axios.get(`${base}/api/admin/topics`, { headers });
      console.log('\n[ADMIN CHECK] GET /api/admin/topics ->', adminCheck.status);
      console.log(JSON.stringify(adminCheck.data, null, 2));
    } catch (err) {
      if (err.response) {
        console.error('\n[ADMIN CHECK] Failed:', err.response.status, err.response.data || err.response.statusText);
      } else {
        console.error('\n[ADMIN CHECK] Error:', err.message);
      }
    }

  } catch (error) {
    if (error.response) {
      console.error('Request failed:', error.response.status, error.response.data || error.response.statusText);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
};

run();
