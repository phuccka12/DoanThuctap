const SystemConfig = require('../models/SystemConfig');

const DEFAULT_CONFIGS = [
  // ── Payment ────────────────────────────────────────────────────────────
  { key: 'stripe_secret_key',   label: 'Stripe Secret Key',   group: 'payment', is_secret: true,  description: 'Lấy từ Stripe Dashboard > Developers > API Keys' },
  { key: 'stripe_webhook_secret', label: 'Stripe Webhook Secret', group: 'payment', is_secret: true, description: 'Webhook endpoint secret cho Stripe events' },
  { key: 'vnpay_tmn_code',      label: 'VNPay TMN Code',      group: 'payment', is_secret: false, description: 'Terminal ID từ VNPay merchant portal' },
  { key: 'vnpay_hash_secret',   label: 'VNPay Hash Secret',   group: 'payment', is_secret: true,  description: 'Hash secret key cho VNPay checksum' },

  // ── AI ─────────────────────────────────────────────────────────────────
  { key: 'gemini_api_key',   label: 'Gemini API Key',   group: 'ai', is_secret: true,  description: 'Google AI Studio API Key' },
  { key: 'openai_api_key',   label: 'OpenAI API Key',   group: 'ai', is_secret: true,  description: 'OpenAI Platform API Key (nếu dùng GPT)' },

  // ── Email ──────────────────────────────────────────────────────────────
  { key: 'sendgrid_api_key', label: 'SendGrid API Key', group: 'email', is_secret: true,  description: 'SendGrid API key để gửi email' },
  { key: 'email_from',       label: 'Email Người gửi',  group: 'email', is_secret: false, description: 'Địa chỉ email gửi đi (VD: no-reply@hidayenglish.vn)' },
  { key: 'email_from_name',  label: 'Tên Người gửi',   group: 'email', is_secret: false, description: 'Tên hiển thị khi gửi email (VD: HIDAY English)' },

  // ── AI Prompts ─────────────────────────────────────────────────────────
  {
    key: 'prompt_speaking_check',
    label: 'Prompt chấm Speaking',
    group: 'prompts',
    is_secret: false,
    description: 'System instruction cho AI chấm bài Speaking. Sửa ở đây để thay đổi độ khắt khe.',
    value: `You are an experienced IELTS Speaking examiner. Evaluate the candidate's spoken response strictly based on IELTS Band Descriptors for: Fluency & Coherence, Pronunciation, Lexical Resource, and Grammatical Range & Accuracy. Give honest, constructive feedback in Vietnamese. Always end with an actionable improvement tip.`
  },
  {
    key: 'prompt_writing_check',
    label: 'Prompt chấm Writing',
    group: 'prompts',
    is_secret: false,
    description: 'System instruction cho AI chấm bài Writing. Sửa ở đây để thay đổi độ khắt khe.',
    value: `You are a Senior IELTS Writing examiner with 20 years of experience. Be strict but fair. Score based on: Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy. Provide detailed feedback in Vietnamese.`
  },
  {
    key: 'prompt_roleplay_system',
    label: 'Prompt AI Roleplay',
    group: 'prompts',
    is_secret: false,
    description: 'System instruction cho AI Roleplay conversation.',
    value: `You are a friendly English conversation partner helping IELTS students practice speaking. Keep responses concise (2-3 sentences), encourage the student, and gently correct major errors. Always respond in English.`
  },
];

exports.getConfigs = async (req, res) => {
  try {
    // Seed defaults if empty
    const existing = await SystemConfig.find();
    if (existing.length === 0) {
      await SystemConfig.insertMany(DEFAULT_CONFIGS);
    }

    const configs = await SystemConfig.find().sort({ group: 1, key: 1 });

    // Mask secret values in response
    const masked = configs.map(c => ({
      _id: c._id,
      key: c.key,
      value: c.is_secret && c.value ? '••••••••••••••••' : c.value,
      group: c.group,
      label: c.label,
      description: c.description,
      is_secret: c.is_secret,
      updated_at: c.updated_at,
    }));

    res.json({ message: 'OK', data: masked });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    // Don't update if user sent masked value back
    if (value === '••••••••••••••••') {
      return res.json({ message: 'Không có thay đổi' });
    }

    const config = await SystemConfig.findOneAndUpdate(
      { key },
      { value, updated_by: req.user?._id },
      { new: true, upsert: true }
    );
    res.json({ message: 'Cập nhật thành công', data: { key: config.key, updated_at: config.updated_at } });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

exports.updateConfigsBulk = async (req, res) => {
  try {
    const { configs } = req.body; // [{ key, value }]
    const results = [];

    for (const { key, value } of configs) {
      if (value === '••••••••••••••••') continue;
      const c = await SystemConfig.findOneAndUpdate(
        { key },
        { value, updated_by: req.user?._id },
        { new: true, upsert: true }
      );
      results.push({ key: c.key, updated: true });
    }

    res.json({ message: `Đã cập nhật ${results.length} cấu hình`, data: results });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// Get raw value (for internal server use only — NOT exposed to client)
exports.getConfigValue = async (key) => {
  const config = await SystemConfig.findOne({ key });
  return config?.value || null;
};
