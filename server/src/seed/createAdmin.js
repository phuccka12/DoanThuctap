const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const { signAccessToken } = require('../utils/token');

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ielts-app';

// Allow passing via CLI args (--email, --password, --name) or via env vars.
// If password not provided, prompt (hidden input).
const rawArgs = process.argv.slice(2);
const argv = rawArgs.reduce((acc, cur, idx, arr) => {
  if (cur.startsWith('--')) {
    const key = cur.slice(2);
    // Check if next arg is the value (not starting with --)
    const nextArg = arr[idx + 1];
    if (nextArg && !nextArg.startsWith('--')) {
      acc[key] = nextArg;
    } else if (cur.includes('=')) {
      const [k, v] = cur.slice(2).split('=');
      acc[k] = v;
    } else {
      acc[key] = true;
    }
  }
  return acc;
}, {});
const readline = require('readline');

const getArg = (key) => argv[key] || process.env[`ADMIN_${key.toUpperCase()}`];

const prompt = (question) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(question, (answer) => {
    rl.close();
    resolve(answer);
  });
});

const promptHidden = (question) => new Promise((resolve) => {
  const stdin = process.stdin;
  const stdout = process.stdout;
  stdout.write(question);
  stdin.resume();
  stdin.setRawMode(true);
  stdin.setEncoding('utf8');

  let password = '';

  const onData = (ch) => {
    ch = String(ch);
    switch (ch) {
      case '\r':
      case '\n':
        stdout.write('\n');
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        resolve(password);
        break;
      case '\u0003': // Ctrl-C
        process.exit();
        break;
      case '\u0008': // backspace
      case '\u007f':
        if (password.length > 0) {
          password = password.slice(0, -1);
          stdout.clearLine();
          stdout.cursorTo(0);
          stdout.write(question + '*'.repeat(password.length));
        }
        break;
      default:
        password += ch;
        stdout.write('*');
        break;
    }
  };

  stdin.on('data', onData);
});

const createOrUpdateAdmin = async () => {
  try {
  console.log('🔄 Connecting to MongoDB...');
  // Recent mongoose versions no longer accept useNewUrlParser/useUnifiedTopology options.
  // Call connect with the URI only and let mongoose choose sensible defaults.
  await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Determine admin details: CLI args > env vars > prompt
    let email = getArg('email');
    let password = getArg('password');
    let name = getArg('name') || getArg('username') || getArg('user_name');

    if (!email) {
      email = (await prompt('Admin email: ')).trim();
    }
    if (!password) {
      password = await promptHidden('Admin password: ');
    }
    
    // Ensure password is a string
    password = String(password);
    
    if (!name) {
      name = (await prompt('Admin display name (optional, default "Admin"): ')).trim() || 'Admin';
    }

    if (!email) {
      throw new Error('Admin email is required');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const emailLower = email.toLowerCase();
    let user = await User.findOne({ email: emailLower });

    if (user) {
      console.log(`⚙️  Found existing user with email ${emailLower}, updating role → admin`);
      user.role = 'admin';
      user.password_hash = passwordHash;
      user.email_verified = true;
      user.onboarding_completed = true;
      user.user_name = user.user_name || name;
      await user.save();
    } else {
      console.log(`➕ Creating new admin user ${emailLower}`);
      user = await User.create({
        user_name: name || 'Admin',
        email: emailLower,
        password_hash: passwordHash,
        role: 'admin',
        email_verified: true,
        onboarding_completed: true
      });
    }

    console.log('\n=== Admin user ready ===');
    console.log('email:', user.email);
    console.log('id   :', user._id.toString());

    // Try to sign an access token if possible
    let token;
    try {
      if (process.env.ACCESS_TOKEN_SECRET) {
        token = signAccessToken(user);
      } else if (process.env.JWT_SECRET) {
        token = jwt.sign({ user_id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
      } else {
        console.log('⚠️  No ACCESS_TOKEN_SECRET or JWT_SECRET found in .env — skipping token generation');
      }
    } catch (err) {
      console.error('Error generating token:', err.message);
    }

    if (token) {
      console.log('\n--- Admin access token (use as Bearer token) ---');
      console.log(token);
    }

    await mongoose.connection.close();
    console.log('\n✓ Done');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to create/update admin:', err);
    try { await mongoose.connection.close(); } catch (e) {}
    process.exit(1);
  }
};

createOrUpdateAdmin();
