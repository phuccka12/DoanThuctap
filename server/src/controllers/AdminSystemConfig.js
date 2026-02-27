const SystemConfig = require('../models/SystemConfig');
const User         = require('../models/User');
const nodemailer   = require('nodemailer');
const { invalidateMaintenanceCache } = require('../middlewares/maintenanceMode');

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT CONFIGS — seeded on first load
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_CONFIGS = [
  // ── TAB 1: GENERAL ────────────────────────────────────────────────────────
  { key: 'app_name',          label: 'Tên ứng dụng',      group: 'general', field_type: 'text',    sort_order: 1,  description: 'Tên thương hiệu hiển thị trên toàn app (VD: Hiday English)', value: 'IELTS AI' },
  { key: 'app_slogan',        label: 'Slogan',             group: 'general', field_type: 'text',    sort_order: 2,  description: 'Khẩu hiệu ngắn gọn hiển thị dưới logo', value: 'Luyện IELTS thông minh cùng AI' },
  { key: 'app_logo_url',      label: 'URL Logo',           group: 'general', field_type: 'text',    sort_order: 3,  description: 'Đường dẫn ảnh logo (https://... hoặc /logo.png)' },
  { key: 'app_favicon_url',   label: 'URL Favicon',        group: 'general', field_type: 'text',    sort_order: 4,  description: 'Đường dẫn favicon 32x32px' },
  { key: 'seo_title',         label: 'SEO Title',          group: 'general', field_type: 'text',    sort_order: 5,  description: 'Tiêu đề trang (hiện khi share link Facebook/Google)', value: 'IELTS AI - Luyện thi thông minh' },
  { key: 'seo_description',   label: 'SEO Description',    group: 'general', field_type: 'textarea',sort_order: 6,  description: 'Mô tả trang (hiện dưới tiêu đề khi share Facebook)', value: 'Nền tảng luyện IELTS tích hợp AI giúp bạn nâng band nhanh chóng.' },
  { key: 'seo_og_image',      label: 'OG Image URL',       group: 'general', field_type: 'text',    sort_order: 7,  description: 'Ảnh thumbnail khi share lên mạng xã hội (1200×630px)' },
  { key: 'maintenance_mode',  label: 'Chế độ bảo trì',     group: 'general', field_type: 'toggle',  sort_order: 10, description: '🚨 Khi BẬT: toàn bộ user bị văng ra màn hình bảo trì. Chỉ Admin vào được.', value: 'false' },
  { key: 'maintenance_msg',   label: 'Thông báo bảo trì',  group: 'general', field_type: 'textarea',sort_order: 11, description: 'Nội dung hiển thị cho user khi đang bảo trì', value: 'Hệ thống đang được bảo trì và nâng cấp. Vui lòng quay lại sau ít phút.' },

  // ── TAB 2: INTEGRATIONS ───────────────────────────────────────────────────
  { key: 'gemini_api_key',        label: 'Gemini API Key',        group: 'integrations', field_type: 'text', is_secret: true, sort_order: 1, description: 'Google AI Studio API Key (AI Speaking, Writing, Chat)' },
  { key: 'openai_api_key',        label: 'OpenAI API Key',        group: 'integrations', field_type: 'text', is_secret: true, sort_order: 2, description: 'OpenAI Platform API Key (GPT-4o, Whisper)' },
  { key: 'whisper_api_key',       label: 'Whisper API Key',       group: 'integrations', field_type: 'text', is_secret: true, sort_order: 3, description: 'OpenAI Whisper API Key cho Speech-to-Text (có thể dùng chung key OpenAI)' },
  { key: 'stripe_secret_key',     label: 'Stripe Secret Key',     group: 'integrations', field_type: 'text', is_secret: true, sort_order: 10, description: 'Stripe Dashboard > Developers > API Keys > Secret key' },
  { key: 'stripe_webhook_secret', label: 'Stripe Webhook Secret', group: 'integrations', field_type: 'text', is_secret: true, sort_order: 11, description: 'Webhook endpoint secret cho Stripe events' },
  { key: 'vnpay_tmn_code',        label: 'VNPay TMN Code',        group: 'integrations', field_type: 'text', is_secret: false,sort_order: 12, description: 'Terminal ID từ VNPay merchant portal' },
  { key: 'vnpay_hash_secret',     label: 'VNPay Hash Secret',     group: 'integrations', field_type: 'text', is_secret: true, sort_order: 13, description: 'Hash secret key cho VNPay checksum' },
  { key: 'aws_s3_bucket',         label: 'AWS S3 Bucket',         group: 'integrations', field_type: 'text', is_secret: false,sort_order: 20, description: 'Tên S3 bucket lưu audio Speaking và ảnh' },
  { key: 'aws_s3_region',         label: 'AWS S3 Region',         group: 'integrations', field_type: 'text', is_secret: false,sort_order: 21, description: 'VD: ap-southeast-1' },
  { key: 'aws_access_key_id',     label: 'AWS Access Key ID',     group: 'integrations', field_type: 'text', is_secret: true, sort_order: 22, description: 'IAM Access Key ID' },
  { key: 'aws_secret_access_key', label: 'AWS Secret Access Key', group: 'integrations', field_type: 'text', is_secret: true, sort_order: 23, description: 'IAM Secret Access Key' },
  { key: 'cloudinary_cloud_name', label: 'Cloudinary Cloud Name', group: 'integrations', field_type: 'text', is_secret: false,sort_order: 30, description: 'Tên cloud Cloudinary (thay thế cho S3)' },
  { key: 'cloudinary_api_key',    label: 'Cloudinary API Key',    group: 'integrations', field_type: 'text', is_secret: true, sort_order: 31, description: 'Cloudinary API Key' },
  { key: 'cloudinary_api_secret', label: 'Cloudinary API Secret', group: 'integrations', field_type: 'text', is_secret: true, sort_order: 32, description: 'Cloudinary API Secret' },

  // ── TAB 3: AI QUOTA & LIMITS ──────────────────────────────────────────────
  { key: 'ai_kill_switch',              label: 'Global AI Kill Switch',          group: 'ai_quota', field_type: 'toggle', sort_order: 1, description: '🛑 Khi BẬT: tắt toàn bộ tính năng AI. User sẽ thấy "AI đang quá tải".', value: 'false' },
  { key: 'ai_budget_alert_usd',         label: 'Cảnh báo ngân sách (USD/tháng)', group: 'ai_quota', field_type: 'number', sort_order: 2, description: 'Khi chi phí AI chạm mốc này → gửi email báo động cho Admin', value: '100' },
  { key: 'ai_rate_limit_speaking_hour', label: 'Giới hạn Speaking / giờ / user', group: 'ai_quota', field_type: 'number', sort_order: 3, description: 'Tối đa bao nhiêu lần gọi AI Speaking trong 1 giờ per user', value: '10' },
  { key: 'ai_rate_limit_writing_hour',  label: 'Giới hạn Writing / giờ / user',  group: 'ai_quota', field_type: 'number', sort_order: 4, description: 'Tối đa bao nhiêu lần gọi AI Writing trong 1 giờ per user', value: '10' },
  { key: 'ai_rate_limit_chat_hour',     label: 'Giới hạn AI Chat / giờ / user',  group: 'ai_quota', field_type: 'number', sort_order: 5, description: 'Tối đa bao nhiêu tin nhắn AI Chat trong 1 giờ per user', value: '30' },
  { key: 'ai_rate_limit_roleplay_hour', label: 'Giới hạn Roleplay / giờ / user', group: 'ai_quota', field_type: 'number', sort_order: 6, description: 'Tối đa bao nhiêu phiên Roleplay trong 1 giờ per user', value: '5' },

  // ── TAB 4: EMAIL & SMTP ───────────────────────────────────────────────────
  { key: 'smtp_host',          label: 'SMTP Host',          group: 'email_config', field_type: 'text',   sort_order: 1, description: 'VD: smtp.gmail.com, smtp.sendgrid.net', value: 'smtp.gmail.com' },
  { key: 'smtp_port',          label: 'SMTP Port',          group: 'email_config', field_type: 'number', sort_order: 2, description: '465 (SSL) hoặc 587 (TLS)', value: '587' },
  { key: 'smtp_user',          label: 'SMTP Username',      group: 'email_config', field_type: 'text',   sort_order: 3, description: 'Email tài khoản gửi mail' },
  { key: 'smtp_pass',          label: 'SMTP Password',      group: 'email_config', field_type: 'text', is_secret: true, sort_order: 4, description: 'App Password (Gmail) hoặc API Key (SendGrid)' },
  { key: 'email_from',         label: 'Email người gửi',    group: 'email_config', field_type: 'text',   sort_order: 5, description: 'VD: no-reply@hidayenglish.vn' },
  { key: 'email_from_name',    label: 'Tên người gửi',      group: 'email_config', field_type: 'text',   sort_order: 6, description: 'VD: HIDAY English', value: 'IELTS AI' },
  { key: 'sendgrid_api_key',   label: 'SendGrid API Key',   group: 'email_config', field_type: 'text', is_secret: true, sort_order: 7, description: 'Nếu dùng SendGrid thay SMTP Gmail' },
  {
    key: 'email_tpl_welcome',
    label: 'Mẫu email chào mừng',
    group: 'email_config',
    field_type: 'textarea',
    sort_order: 10,
    description: 'Gửi tự động khi user đăng ký tài khoản mới. Biến: {{name}}, {{email}}',
    value: `Xin chào {{name}},\n\nChúc mừng bạn đã đăng ký thành công tài khoản IELTS AI!\n\nBắt đầu hành trình chinh phục IELTS của bạn ngay hôm nay.\n\nTrân trọng,\nĐội ngũ IELTS AI`,
  },
  {
    key: 'email_tpl_payment_success',
    label: 'Mẫu email thanh toán thành công',
    group: 'email_config',
    field_type: 'textarea',
    sort_order: 11,
    description: 'Gửi tự động sau khi thanh toán VIP thành công. Biến: {{name}}, {{plan}}, {{amount}}, {{expire_date}}',
    value: `Xin chào {{name}},\n\nGiao dịch của bạn đã thành công! 🎉\n\n📦 Gói: {{plan}}\n💰 Số tiền: {{amount}}\n📅 Hết hạn: {{expire_date}}\n\nTrân trọng,\nĐội ngũ IELTS AI`,
  },
  {
    key: 'email_tpl_study_reminder',
    label: 'Mẫu email nhắc nhở học tập',
    group: 'email_config',
    field_type: 'textarea',
    sort_order: 12,
    description: 'Gửi tự động khi user không hoạt động. Biến: {{name}}, {{days_inactive}}, {{app_url}}',
    value: `Xin chào {{name}},\n\nĐã {{days_inactive}} ngày rồi bạn chưa vào luyện tập rồi đó! 😊\n\nMỗi ngày chỉ cần 15 phút luyện Speaking là bạn đã tiến bộ rất nhiều.\n\nVào luyện ngay: {{app_url}}\n\nCố lên nào! 💪\nĐội ngũ IELTS AI`,
  },

  // ── TAB 5: AI PROMPTS (giữ lại từ cũ) ────────────────────────────────────
  {
    key: 'prompt_speaking_check',
    label: 'Prompt chấm Speaking',
    group: 'prompts',
    field_type: 'textarea',
    sort_order: 1,
    description: 'System instruction cho AI chấm bài Speaking.',
    value: `You are an experienced IELTS Speaking examiner. Evaluate the candidate's spoken response strictly based on IELTS Band Descriptors for: Fluency & Coherence, Pronunciation, Lexical Resource, and Grammatical Range & Accuracy. Give honest, constructive feedback in Vietnamese. Always end with an actionable improvement tip.`
  },
  {
    key: 'prompt_writing_check',
    label: 'Prompt chấm Writing',
    group: 'prompts',
    field_type: 'textarea',
    sort_order: 2,
    description: 'System instruction cho AI chấm bài Writing.',
    value: `You are a Senior IELTS Writing examiner with 20 years of experience. Be strict but fair. Score based on: Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy. Provide detailed feedback in Vietnamese.`
  },
  {
    key: 'prompt_roleplay_system',
    label: 'Prompt AI Roleplay',
    group: 'prompts',
    field_type: 'textarea',
    sort_order: 3,
    description: 'System instruction cho AI Roleplay conversation.',
    value: `You are a friendly English conversation partner helping IELTS students practice speaking. Keep responses concise (2-3 sentences), encourage the student, and gently correct major errors. Always respond in English.`
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/system-config — lấy toàn bộ config, seed defaults nếu thiếu
// ─────────────────────────────────────────────────────────────────────────────
exports.getConfigs = async (req, res) => {
  try {
    const existing = await SystemConfig.find();
    const existingKeys = new Set(existing.map(c => c.key));

    // Seed only missing keys (non-destructive)
    const toSeed = DEFAULT_CONFIGS.filter(c => !existingKeys.has(c.key));
    if (toSeed.length > 0) {
      await SystemConfig.insertMany(toSeed);
    }

    const configs = await SystemConfig.find().sort({ group: 1, sort_order: 1, key: 1 });

    const masked = configs.map(c => ({
      _id:         c._id,
      key:         c.key,
      value:       c.is_secret && c.value ? '••••••••••••••••' : (c.value || ''),
      group:       c.group,
      label:       c.label,
      description: c.description,
      is_secret:   c.is_secret,
      field_type:  c.field_type || 'text',
      options:     c.options || [],
      sort_order:  c.sort_order || 0,
      updated_at:  c.updated_at,
    }));

    res.json({ message: 'OK', data: masked });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /admin/system-config/:key
// ─────────────────────────────────────────────────────────────────────────────
exports.updateConfig = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === '••••••••••••••••') return res.json({ message: 'Không có thay đổi' });

    const config = await SystemConfig.findOneAndUpdate(
      { key },
      { value, updated_by: req.userId },
      { new: true, upsert: true }
    );

    // Clear maintenance cache ngay nếu key liên quan
    if (key === 'maintenance_mode') invalidateMaintenanceCache();

    res.json({ message: 'Cập nhật thành công', data: { key: config.key, updated_at: config.updated_at } });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /admin/system-config/bulk — bulk update
// ─────────────────────────────────────────────────────────────────────────────
exports.updateConfigsBulk = async (req, res) => {
  try {
    const { configs } = req.body; // [{ key, value }]
    const results = [];
    for (const { key, value } of configs) {
      if (value === '••••••••••••••••') continue;
      const c = await SystemConfig.findOneAndUpdate(
        { key },
        { value, updated_by: req.userId },
        { new: true, upsert: true }
      );
      results.push({ key: c.key, updated: true });
    }

    // Clear cache nếu maintenance_mode nằm trong batch
    if (configs.some(c => c.key === 'maintenance_mode')) {
      invalidateMaintenanceCache();
    }

    res.json({ message: `Đã cập nhật ${results.length} cấu hình`, data: results });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /admin/system-config/staff — danh sách staff/admin (Tab Roles)
// ─────────────────────────────────────────────────────────────────────────────
exports.getStaffList = async (req, res) => {
  try {
    const staff = await User.find({ role: 'admin' })
      .select('user_name email role avatar created_at last_login_at')
      .sort({ created_at: -1 });
    res.json({ message: 'OK', data: staff });
  } catch (e) {
    res.status(500).json({ message: 'Lỗi server', error: e.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET raw value — nội bộ server dùng, không expose ra client
// ─────────────────────────────────────────────────────────────────────────────
exports.getConfigValue = async (key) => {
  const config = await SystemConfig.findOne({ key });
  return config?.value || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: kiểm tra maintenance mode (dùng trong middleware)
// ─────────────────────────────────────────────────────────────────────────────
exports.isMaintenanceMode = async () => {
  const c = await SystemConfig.findOne({ key: 'maintenance_mode' });
  return c?.value === 'true';
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: kiểm tra AI kill switch (dùng trong AI controllers)
// ─────────────────────────────────────────────────────────────────────────────
exports.isAiKillSwitch = async () => {
  const c = await SystemConfig.findOne({ key: 'ai_kill_switch' });
  return c?.value === 'true';
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /admin/system-config/test-email — gửi email test dùng SMTP trong DB
// Body: { to?: string }  (nếu không có thì gửi về email admin đang đăng nhập)
// ─────────────────────────────────────────────────────────────────────────────
exports.sendTestEmail = async (req, res) => {
  try {
    // Lấy SMTP config từ DB
    const keys = ['smtp_host','smtp_port','smtp_user','smtp_pass','email_from','email_from_name'];
    const configs = await SystemConfig.find({ key: { $in: keys } });
    const cfg = configs.reduce((acc, c) => { acc[c.key] = c.value; return acc; }, {});

    const host = cfg.smtp_host;
    const user = cfg.smtp_user;
    const pass = cfg.smtp_pass;

    if (!host || !user || !pass) {
      return res.status(400).json({
        message: 'Chưa cấu hình SMTP. Vui lòng điền SMTP Host, Username và Password trước.',
      });
    }

    // Địa chỉ nhận — ưu tiên body.to, fallback về email admin đang login
    const admin = await User.findById(req.userId).select('email user_name');
    const toEmail = (req.body.to || admin?.email || '').trim();
    if (!toEmail) {
      return res.status(400).json({ message: 'Không xác định được địa chỉ nhận email.' });
    }

    const fromName  = cfg.email_from_name || 'IELTS AI';
    const fromEmail = cfg.email_from || user;
    const port      = Number(cfg.smtp_port || 587);

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    // Verify kết nối trước khi gửi
    await transporter.verify();

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject: '✅ Test Email từ IELTS AI Admin',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#111;color:#eee;border-radius:12px">
          <h2 style="color:#a78bfa;margin-bottom:8px">✅ Email Test thành công!</h2>
          <p style="color:#9ca3af;margin-bottom:24px">Email này được gửi từ trang <strong style="color:#fff">Admin → System Config → Email</strong></p>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <tr><td style="color:#6b7280;padding:6px 0">SMTP Host</td><td style="color:#fff">${host}:${port}</td></tr>
            <tr><td style="color:#6b7280;padding:6px 0">Từ</td><td style="color:#fff">${fromName} &lt;${fromEmail}&gt;</td></tr>
            <tr><td style="color:#6b7280;padding:6px 0">Đến</td><td style="color:#fff">${toEmail}</td></tr>
            <tr><td style="color:#6b7280;padding:6px 0">Thời gian</td><td style="color:#fff">${new Date().toLocaleString('vi-VN')}</td></tr>
          </table>
          <p style="margin-top:24px;color:#6b7280;font-size:12px">IELTS AI — Hệ thống luyện thi thông minh</p>
        </div>
      `,
    });

    res.json({ message: `Email test đã gửi thành công đến ${toEmail}` });
  } catch (e) {
    // Trả về lỗi cụ thể của nodemailer để admin biết cấu hình sai chỗ nào
    res.status(500).json({
      message: `Gửi email thất bại: ${e.message}`,
      hint: e.code === 'EAUTH'  ? 'Sai Username/Password. Gmail cần dùng App Password (không phải mật khẩu thường).'
          : e.code === 'ECONNREFUSED' ? 'Không kết nối được tới SMTP Host. Kiểm tra Host và Port.'
          : e.code === 'ETIMEDOUT'    ? 'Kết nối timeout. Kiểm tra Host/Port hoặc firewall.'
          : null,
    });
  }
};
