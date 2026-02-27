import React, { useState, useEffect, useCallback } from 'react';
import {
  FiSettings, FiKey, FiZap, FiMail, FiMessageSquare, FiUsers,
  FiSave, FiEye, FiEyeOff, FiRefreshCw, FiCheck, FiAlertCircle,
  FiGlobe, FiShield, FiDollarSign, FiClock, FiCopy, FiX,
  FiAlertTriangle, FiCheckCircle, FiLoader, FiChevronDown, FiChevronUp,
  FiUpload, FiImage, FiSend,
} from 'react-icons/fi';
import systemConfigService from '../../services/systemConfigService';
import FileUploader from '../../components/FileUploader';

// Keys dùng upload ảnh thay vì nhập URL
const IMAGE_UPLOAD_KEYS = ['app_logo_url', 'app_favicon_url', 'seo_og_image'];

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'general',      label: 'General',       icon: FiGlobe,         color: 'blue',   desc: 'Branding & Bảo trì' },
  { id: 'integrations', label: 'Integrations',  icon: FiKey,           color: 'purple', desc: 'API Keys & Storage' },
  { id: 'ai_quota',     label: 'AI Quota',      icon: FiZap,           color: 'yellow', desc: 'Giới hạn & Kill Switch' },
  { id: 'roles',        label: 'Roles & Staff', icon: FiUsers,         color: 'green',  desc: 'Phân quyền' },
  { id: 'email_config', label: 'Email',         icon: FiMail,          color: 'pink',   desc: 'SMTP & Templates' },
  { id: 'prompts',      label: 'AI Prompts',    icon: FiMessageSquare, color: 'orange', desc: 'System Instructions' },
];

// Section grouping within each tab
const SECTION_META = {
  general: [
    { title: '🏷️ Brand Config',  keys: ['app_name','app_slogan','app_logo_url','app_favicon_url'] },
    { title: '🔍 SEO Meta',       keys: ['seo_title','seo_description','seo_og_image'] },
    { title: '🚧 Panic Button',   keys: ['maintenance_mode','maintenance_msg'], danger: true },
  ],
  integrations: [
    { title: '🤖 AI Providers',          keys: ['gemini_api_key','openai_api_key','whisper_api_key'] },
    { title: '💳 Payment Gateways',      keys: ['stripe_secret_key','stripe_webhook_secret','vnpay_tmn_code','vnpay_hash_secret'] },
    { title: '☁️ Storage — AWS S3',      keys: ['aws_s3_bucket','aws_s3_region','aws_access_key_id','aws_secret_access_key'] },
    { title: '☁️ Storage — Cloudinary',  keys: ['cloudinary_cloud_name','cloudinary_api_key','cloudinary_api_secret'] },
  ],
  ai_quota: [
    { title: '🛑 Global Kill Switch',            keys: ['ai_kill_switch'], danger: true },
    { title: '💰 Budget Alert',                  keys: ['ai_budget_alert_usd'] },
    { title: '⏱️ Rate Limits (per user / giờ)',  keys: ['ai_rate_limit_speaking_hour','ai_rate_limit_writing_hour','ai_rate_limit_chat_hour','ai_rate_limit_roleplay_hour'] },
  ],
  email_config: [
    { title: '⚙️ SMTP Config',   keys: ['smtp_host','smtp_port','smtp_user','smtp_pass','email_from','email_from_name','sendgrid_api_key'] },
    { title: '📄 Mẫu Email',     keys: ['email_tpl_welcome','email_tpl_payment_success','email_tpl_study_reminder'] },
  ],
  prompts: [
    { title: '💬 System Instructions', keys: ['prompt_speaking_check','prompt_writing_check','prompt_roleplay_system'] },
  ],
};

// Color palette
const CLR = {
  blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400',   ring: 'focus:ring-blue-500' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', ring: 'focus:ring-purple-500' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', ring: 'focus:ring-yellow-500' },
  green:  { bg: 'bg-emerald-500/10',border: 'border-emerald-500/30',text: 'text-emerald-400',ring: 'focus:ring-emerald-500' },
  pink:   { bg: 'bg-pink-500/10',   border: 'border-pink-500/30',   text: 'text-pink-400',   ring: 'focus:ring-pink-500' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', ring: 'focus:ring-orange-500' },
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-100 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium
      ${type === 'success' ? 'bg-gray-900 border-emerald-500/40 text-emerald-300'
        : type === 'warning' ? 'bg-gray-900 border-yellow-500/40 text-yellow-300'
        : 'bg-gray-900 border-red-500/40 text-red-300'}`}>
      {type === 'success' ? <FiCheckCircle size={16}/> : type === 'warning' ? <FiAlertTriangle size={16}/> : <FiAlertCircle size={16}/>}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><FiX size={14}/></button>
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function ToggleSwitch({ value, onChange, danger = false }) {
  const isOn = value === 'true';
  return (
    <button
      onClick={() => onChange(isOn ? 'false' : 'true')}
      className={`relative inline-flex h-7 w-13 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none
        ${isOn ? (danger ? 'bg-red-500' : 'bg-emerald-500') : 'bg-gray-700'}`}
      style={{ width: '52px' }}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${isOn ? 'translate-x-7' : 'translate-x-1'}`}/>
    </button>
  );
}

// ─── Config Field ─────────────────────────────────────────────────────────────
function ConfigField({ config, onChange, tabColor }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const clr = CLR[tabColor] || CLR.blue;
  const val = config.value ?? '';
  const isMasked = config.is_secret && val === '••••••••••••••••';
  const isDanger = config.key === 'maintenance_mode' || config.key === 'ai_kill_switch';
  const isOn = val === 'true';

  const handleCopy = () => {
    if (!isMasked) { navigator.clipboard.writeText(val); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  };

  if (config.field_type === 'toggle') {
    return (
      <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
        isOn && isDanger ? 'bg-red-950/30 border-red-500/40' : 'bg-gray-900/40 border-gray-700/40'
      }`}>
        <div className="flex-1 pr-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{config.label}</span>
            {isOn && isDanger && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">ĐANG BẬT</span>
            )}
          </div>
          {config.description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{config.description}</p>}
        </div>
        <ToggleSwitch value={val} onChange={(v) => onChange(config.key, v)} danger={isDanger}/>
      </div>
    );
  }

  if (config.field_type === 'number') {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-200">{config.label}</label>
        {config.description && <p className="text-[11px] text-gray-500">{config.description}</p>}
        <input type="number" value={val} onChange={e => onChange(config.key, e.target.value)}
          className={`w-36 px-3 py-2 text-sm bg-gray-900/50 border border-gray-600 text-white rounded-xl outline-none focus:ring-2 ${clr.ring} font-mono`}/>
      </div>
    );
  }

  if (config.field_type === 'textarea') {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-200">{config.label}</label>
        {config.description && <p className="text-[11px] text-gray-500">{config.description}</p>}
        <textarea value={val} onChange={e => onChange(config.key, e.target.value)}
          rows={config.key.startsWith('prompt_') ? 6 : 4}
          className={`w-full px-3 py-2 text-sm bg-gray-900/50 border border-gray-600 text-white rounded-xl outline-none focus:ring-2 ${clr.ring} resize-y font-mono leading-relaxed`}/>
      </div>
    );
  }

  // image upload via Cloudinary
  if (IMAGE_UPLOAD_KEYS.includes(config.key)) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-200">{config.label}</label>
        {config.description && <p className="text-[11px] text-gray-500">{config.description}</p>}

        {/* Preview ảnh hiện tại */}
        {val && (
          <div className="flex items-center gap-3 p-3 bg-gray-900/50 border border-gray-700/50 rounded-xl">
            <img
              src={val}
              alt="preview"
              className="w-12 h-12 object-contain rounded-lg bg-gray-800 border border-gray-700"
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 truncate">{val}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">Ảnh hiện tại</p>
            </div>
            <button
              onClick={() => onChange(config.key, '')}
              className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
              title="Xoá ảnh"
            >
              <FiX size={14}/>
            </button>
          </div>
        )}

        {/* Upload mới */}
        <FileUploader
          accept="image/*"
          folder="system-config"
          maxSize={5}
          placeholder="Kéo thả ảnh vào đây hoặc nhấn để chọn (PNG, JPG, SVG ≤ 5MB)"
          onUploadSuccess={(data) => onChange(config.key, data.url)}
        />
      </div>
    );
  }

  // text / password
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-200">{config.label}</label>
        <div className="flex items-center gap-1">
          {!isMasked && (
            <button onClick={handleCopy} className="p-1 text-gray-600 hover:text-gray-300 transition-colors" title="Copy">
              {copied ? <FiCheck size={12} className="text-emerald-400"/> : <FiCopy size={12}/>}
            </button>
          )}
          {config.is_secret && (
            <button onClick={() => setShow(s => !s)} className="p-1 text-gray-500 hover:text-gray-300 transition-colors">
              {show ? <FiEyeOff size={13}/> : <FiEye size={13}/>}
            </button>
          )}
        </div>
      </div>
      {config.description && <p className="text-[11px] text-gray-500">{config.description}</p>}
      <input
        type={config.is_secret && !show ? 'password' : 'text'}
        value={val}
        onChange={e => onChange(config.key, e.target.value)}
        placeholder={config.is_secret ? '••••••••••••••••' : `Nhập ${config.label}...`}
        className={`w-full px-3 py-2 text-sm bg-gray-900/50 border border-gray-600 text-white placeholder-gray-500 rounded-xl outline-none focus:ring-2 ${clr.ring} font-mono`}
      />
    </div>
  );
}

// ─── Email Test Panel ─────────────────────────────────────────────────────────
function EmailTestPanel() {
  const [to, setTo]         = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult]  = useState(null); // { ok, message, hint }

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await systemConfigService.testEmail(to || undefined);
      setResult({ ok: true, message: res.data.message });
    } catch (e) {
      setResult({
        ok: false,
        message: e.response?.data?.message || 'Gửi email thất bại',
        hint:    e.response?.data?.hint || null,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-blue-500/25 bg-blue-950/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-blue-500/20">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
          <FiSend size={14} className="text-blue-400"/>
        </div>
        <div>
          <p className="text-sm font-bold text-white">Gửi Email Test</p>
          <p className="text-[11px] text-gray-500">Kiểm tra cấu hình SMTP bằng cách gửi thử một email</p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Input */}
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="email"
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="Nhập email nhận (để trống = gửi về email admin)"
              className="w-full px-3 py-2.5 text-sm bg-gray-900/60 border border-gray-700 text-white placeholder-gray-500 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2.5 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-medium transition-colors shrink-0"
          >
            {sending
              ? <><FiLoader size={13} className="animate-spin"/> Đang gửi...</>
              : <><FiSend size={13}/> Gửi thử</>
            }
          </button>
        </div>

        {/* Kết quả */}
        {result && (
          <div className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm ${
            result.ok
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/30 border-red-500/30 text-red-300'
          }`}>
            {result.ok
              ? <FiCheckCircle size={15} className="shrink-0 mt-0.5"/>
              : <FiAlertCircle size={15} className="shrink-0 mt-0.5"/>
            }
            <div>
              <p>{result.message}</p>
              {result.hint && <p className="mt-1 text-xs opacity-75">{result.hint}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, configs, changes, onChange, tabColor, danger = false }) {
  const [collapsed, setCollapsed] = useState(false);
  const pendingCount = configs.filter(c => changes[c.key] !== undefined).length;
  return (
    <div className={`rounded-2xl border overflow-hidden ${danger ? 'border-red-500/30 bg-red-950/10' : 'border-gray-700/50 bg-gray-800/40'}`}>
      <button onClick={() => setCollapsed(p => !p)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-sm font-bold text-white">{title}</span>
          {pendingCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              {pendingCount} thay đổi
            </span>
          )}
          {danger && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">⚠️ Nguy hiểm</span>}
        </div>
        {collapsed ? <FiChevronDown size={16} className="text-gray-500 shrink-0"/> : <FiChevronUp size={16} className="text-gray-500 shrink-0"/>}
      </button>
      {!collapsed && (
        <div className="px-5 pb-5 space-y-5 border-t border-gray-700/30">
          {configs.map((config, i) => (
            <div key={config.key} className={i > 0 && config.field_type !== 'toggle' ? 'pt-5 border-t border-gray-700/20' : i > 0 ? 'pt-3' : 'pt-5'}>
              <ConfigField
                config={{ ...config, value: changes[config.key] !== undefined ? changes[config.key] : config.value }}
                onChange={onChange}
                tabColor={tabColor}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── RBAC roles definition ────────────────────────────────────────────────────
const RBAC_ROLES = [
  { id: 'super_admin',     icon: '👑', label: 'Super Admin',      color: 'amber',
    perms: ['Xem tất cả màn hình','Xem doanh thu & giao dịch','Đổi API Key','Bật/tắt AI Kill Switch','Bật/tắt Bảo trì'] },
  { id: 'content_creator', icon: '📝', label: 'Content Creator',  color: 'blue',
    perms: ['Tạo & sửa Bài đọc','Tạo & sửa Bài viết','Tạo & sửa Bài nói','Quản lý Topics','❌ Không xem Thanh toán','❌ Không xem API Keys'] },
  { id: 'reviewer',        icon: '🎧', label: 'Reviewer',          color: 'green',
    perms: ['Nghe lại Audio Speaking','Chấm điểm phúc khảo','Xem kết quả học viên','❌ Không tạo/sửa nội dung','❌ Không xem Thanh toán'] },
];

// ─── Roles Tab ────────────────────────────────────────────────────────────────
function RolesTab({ staff, loadingStaff }) {
  return (
    <div className="space-y-6">
      {/* RBAC cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {RBAC_ROLES.map(r => (
          <div key={r.id} className={`rounded-2xl border p-5 ${
            r.color === 'amber' ? 'border-amber-500/30 bg-amber-950/20' :
            r.color === 'blue'  ? 'border-blue-500/30 bg-blue-950/20' :
                                  'border-emerald-500/30 bg-emerald-950/20'}`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{r.icon}</span>
              <div>
                <p className="font-bold text-white text-sm">{r.label}</p>
                <code className={`text-[11px] ${r.color === 'amber' ? 'text-amber-400' : r.color === 'blue' ? 'text-blue-400' : 'text-emerald-400'}`}>{r.id}</code>
              </div>
            </div>
            <ul className="space-y-1.5">
              {r.perms.map((p, i) => (
                <li key={i} className={`text-xs flex items-start gap-2 ${p.startsWith('❌') ? 'text-gray-600' : 'text-gray-300'}`}>
                  {p.startsWith('❌')
                    ? <span className="shrink-0">❌</span>
                    : <FiCheck size={11} className={`shrink-0 mt-0.5 ${r.color === 'amber' ? 'text-amber-400' : r.color === 'blue' ? 'text-blue-400' : 'text-emerald-400'}`}/>
                  }
                  <span>{p.replace('❌ ', '')}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Staff list */}
      <div className="rounded-2xl border border-gray-700/50 bg-gray-800/40 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700/30 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">👥 Danh sách Admin / Staff</h3>
            <p className="text-xs text-gray-500 mt-0.5">Tài khoản có quyền truy cập trang quản trị</p>
          </div>
          <span className="text-xs text-gray-500 bg-gray-700/50 px-2.5 py-1 rounded-lg">{staff.length} tài khoản</span>
        </div>
        <div className="divide-y divide-gray-700/30">
          {loadingStaff ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <FiLoader className="animate-spin mr-2" size={16}/> Đang tải...
            </div>
          ) : staff.length === 0 ? (
            <p className="py-10 text-center text-gray-600 text-sm">Chưa có tài khoản admin nào</p>
          ) : staff.map(s => (
            <div key={s._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-700/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                  {s.avatar ? <img src={s.avatar} className="w-full h-full object-cover" alt=""/> : s.user_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{s.user_name}</p>
                  <p className="text-xs text-gray-500">{s.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-600">
                  {s.last_login_at ? `Login: ${new Date(s.last_login_at).toLocaleDateString('vi-VN')}` : 'Chưa đăng nhập'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  👑 Super Admin
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-gray-700/30 bg-gray-900/30">
          <p className="text-xs text-gray-600">
            💡 Cấp quyền admin: vào <strong className="text-gray-400">Admin Users</strong> → tìm user → đổi Role → <code className="bg-gray-800 px-1 rounded text-gray-400">admin</code>
          </p>
        </div>
      </div>

      {/* Roadmap note */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-950/10 p-4">
        <p className="text-xs text-blue-300 font-medium mb-1">📌 Roadmap RBAC chi tiết</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Hệ thống hiện dùng 3 role: <code className="bg-gray-800 px-1 rounded">standard</code>, <code className="bg-gray-800 px-1 rounded">vip</code>, <code className="bg-gray-800 px-1 rounded">admin</code>.
          Để triển khai Content Creator / Reviewer cần thêm <code className="bg-gray-800 px-1 rounded">admin_role</code> vào User model và cập nhật middleware — <strong className="text-blue-300">v2.0 roadmap</strong>.
        </p>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminSystemConfig() {
  const [configs,      setConfigs]      = useState([]);
  const [changes,      setChanges]      = useState({});
  const [saving,       setSaving]       = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState('general');
  const [toast,        setToast]        = useState(null);
  const [staff,        setStaff]        = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try { const res = await systemConfigService.getConfigs(); setConfigs(res.data?.data || []); }
    catch { showToast('Lỗi tải cấu hình', 'error'); }
    finally { setLoading(false); }
  }, []);

  const fetchStaff = useCallback(async () => {
    setLoadingStaff(true);
    try { const res = await systemConfigService.getStaff(); setStaff(res.data?.data || []); }
    catch {}
    finally { setLoadingStaff(false); }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);
  useEffect(() => { if (activeTab === 'roles') fetchStaff(); }, [activeTab, fetchStaff]);

  const handleChange = (key, value) => setChanges(p => ({ ...p, [key]: value }));

  const handleSave = async () => {
    const toSave = Object.entries(changes).map(([key, value]) => ({ key, value }));
    if (!toSave.length) return;
    setSaving(true);
    try {
      await systemConfigService.updateBulk(toSave);
      showToast(`✅ Đã lưu ${toSave.length} thay đổi`);
      setChanges({});
      fetchConfigs();
    } catch (e) { showToast(e.response?.data?.message || 'Lỗi khi lưu', 'error'); }
    finally { setSaving(false); }
  };

  const configMap = configs.reduce((acc, c) => { acc[c.key] = c; return acc; }, {});
  const getSectionConfigs = (keys) => keys.map(k => configMap[k]).filter(Boolean);
  const hasChanges = Object.keys(changes).length > 0;
  const activeTabMeta = TABS.find(t => t.id === activeTab);
  const tabColor = activeTabMeta?.color || 'blue';

  const tabPending = (tabId) => {
    const keys = (SECTION_META[tabId] || []).flatMap(s => s.keys);
    return keys.filter(k => changes[k] !== undefined).length;
  };

  const maintenanceOn = (changes['maintenance_mode'] ?? configMap['maintenance_mode']?.value) === 'true';
  const killSwitchOn  = (changes['ai_kill_switch']   ?? configMap['ai_kill_switch']?.value)   === 'true';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-gray-600 to-gray-500 flex items-center justify-center shrink-0">
              <FiSettings size={18}/>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Cài đặt Hệ thống</h1>
              <p className="text-gray-500 text-xs">System Configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {maintenanceOn && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 animate-pulse">
                🚧 MAINTENANCE ON
              </span>
            )}
            {killSwitchOn && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 animate-pulse">
                🛑 AI KILLED
              </span>
            )}
            {hasChanges && (
              <span className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-lg">
                <FiAlertCircle size={12}/> {Object.keys(changes).length} chưa lưu
              </span>
            )}
            <button onClick={fetchConfigs} className="p-2 text-gray-400 hover:text-white bg-gray-800/50 border border-gray-700 rounded-lg transition-colors">
              <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''}/>
            </button>
            <button onClick={handleSave} disabled={saving || !hasChanges}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-medium disabled:opacity-40">
              {saving ? <FiLoader size={14} className="animate-spin"/> : <FiSave size={14}/>}
              {saving ? 'Đang lưu...' : 'Lưu tất cả'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* ── Sidebar ── */}
        <div className="w-52 shrink-0">
          <nav className="bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden sticky top-24">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const clr = CLR[tab.color];
              const pending = tabPending(tab.id);
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-gray-700/30 last:border-0
                    ${isActive ? `${clr.bg} ${clr.text}` : 'text-gray-400 hover:text-white hover:bg-gray-700/30'}`}
                >
                  <Icon size={15} className="shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{tab.label}</p>
                    <p className={`text-[10px] truncate ${isActive ? 'opacity-60' : 'text-gray-600'}`}>{tab.desc}</p>
                  </div>
                  {pending > 0 && (
                    <span className="w-5 h-5 rounded-full bg-yellow-500 text-gray-900 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {pending}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          {activeTab === 'integrations' && (
            <div className="bg-yellow-900/20 border border-yellow-500/25 rounded-xl p-3.5 mb-5 flex items-start gap-3">
              <FiShield className="text-yellow-400 shrink-0 mt-0.5" size={15}/>
              <p className="text-xs text-yellow-300/80">
                <strong className="text-yellow-300">🔒 Bảo mật:</strong> API Key lưu trong DB, chỉ hiện dạng{' '}
                <code className="bg-yellow-900/40 px-1 rounded">••••••••</code>.
                Bấm 👁️ để xem. Không bao giờ chia sẻ key này với bất kỳ ai.
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24 text-gray-500">
              <FiLoader className="animate-spin mr-2" size={20}/> Đang tải cấu hình...
            </div>
          ) : activeTab === 'roles' ? (
            <RolesTab staff={staff} loadingStaff={loadingStaff}/>
          ) : (
            <div className="space-y-4">
              {(SECTION_META[activeTab] || []).map(section => {
                const sectionConfigs = getSectionConfigs(section.keys);
                if (!sectionConfigs.length) return null;
                return (
                  <SectionCard
                    key={section.title}
                    title={section.title}
                    configs={sectionConfigs}
                    changes={changes}
                    onChange={handleChange}
                    tabColor={tabColor}
                    danger={!!section.danger}
                  />
                );
              })}
              {/* Email test panel — chỉ hiện trong tab email */}
              {activeTab === 'email_config' && <EmailTestPanel />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}