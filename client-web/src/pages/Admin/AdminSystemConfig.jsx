import React, { useState, useEffect, useCallback } from 'react';
import {
  FiSettings, FiKey, FiMessageSquare, FiMail, FiZap,
  FiSave, FiEye, FiEyeOff, FiRefreshCw, FiCheck, FiAlertCircle
} from 'react-icons/fi';
import systemConfigService from '../../services/systemConfigService';

const GROUP_META = {
  payment: { label: '💳 Thanh toán & API Gateway', color: 'green',  icon: FiKey },
  ai:      { label: '🤖 AI Services',              color: 'purple', icon: FiZap },
  email:   { label: '📧 Email (SendGrid)',          color: 'blue',   icon: FiMail },
  prompts: { label: '💬 AI Prompt Templates',       color: 'orange', icon: FiMessageSquare },
};

function ConfigField({ config, onChange }) {
  const [show, setShow] = useState(false);
  const [localVal, setLocalVal] = useState(config.value || '');
  const isPrompt = config.group === 'prompts';

  useEffect(() => { setLocalVal(config.value || ''); }, [config.value]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-200">{config.label}</label>
        {config.is_secret && (
          <button type="button" onClick={() => setShow(s => !s)} className="text-gray-500 hover:text-gray-300 transition-colors">
            {show ? <FiEyeOff size={13} /> : <FiEye size={13} />}
          </button>
        )}
      </div>
      {config.description && <p className="text-[11px] text-gray-500">{config.description}</p>}
      {isPrompt ? (
        <textarea
          value={localVal}
          onChange={e => { setLocalVal(e.target.value); onChange(config.key, e.target.value); }}
          rows={4}
          className="w-full px-3 py-2 text-sm bg-gray-900/50 border border-gray-600 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none font-mono"
          placeholder="System instruction prompt..."
        />
      ) : (
        <input
          type={config.is_secret && !show ? 'password' : 'text'}
          value={localVal}
          onChange={e => { setLocalVal(e.target.value); onChange(config.key, e.target.value); }}
          placeholder={config.is_secret ? '••••••••••••••••' : `Nhập ${config.label}...`}
          className="w-full px-3 py-2 text-sm bg-gray-900/50 border border-gray-600 text-white placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-mono"
        />
      )}
    </div>
  );
}

export default function AdminSystemConfig() {
  const [configs, setConfigs] = useState([]);
  const [changes, setChanges] = useState({}); // { key: newValue }
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState('payment');

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await systemConfigService.getConfigs();
      setConfigs(res.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const handleChange = (key, value) => {
    setChanges(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const toSave = Object.entries(changes).map(([key, value]) => ({ key, value }));
    if (toSave.length === 0) return;
    setSaving(true);
    try {
      await systemConfigService.updateBulk(toSave);
      setSaved(true);
      setChanges({});
      setTimeout(() => setSaved(false), 2500);
      fetchConfigs();
    } catch (e) {
      alert(e.response?.data?.message || 'Lỗi khi lưu cấu hình');
    } finally { setSaving(false); }
  };

  const groupedConfigs = configs.reduce((acc, c) => {
    if (!acc[c.group]) acc[c.group] = [];
    acc[c.group].push(c);
    return acc;
  }, {});

  const groups = Object.keys(GROUP_META).filter(g => groupedConfigs[g]);
  const hasChanges = Object.keys(changes).length > 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-gray-600 to-gray-500 flex items-center justify-center">
            <FiSettings size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cấu hình Hệ thống & AI</h1>
            <p className="text-gray-400 text-sm">API Keys, AI Prompts, Email settings</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-lg">
              <FiAlertCircle size={12} /> {Object.keys(changes).length} thay đổi chưa lưu
            </span>
          )}
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-lg">
              <FiCheck size={12} /> Đã lưu thành công!
            </span>
          )}
          <button onClick={fetchConfigs} className="p-2 text-gray-400 hover:text-white bg-gray-800/50 border border-gray-700 rounded-lg transition-colors">
            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleSave} disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium disabled:opacity-40">
            <FiSave size={14} /> {saving ? 'Đang lưu...' : 'Lưu tất cả'}
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
        <FiAlertCircle className="text-yellow-400 shrink-0 mt-0.5" size={16} />
        <div>
          <p className="text-sm font-medium text-yellow-300">🔒 Bảo mật quan trọng</p>
          <p className="text-xs text-yellow-400/70 mt-0.5">
            Các API Key được lưu mã hóa trong database. Không bao giờ chia sẻ các key này với người khác.
            Sau khi lưu, giá trị sẽ bị ẩn (masked) trong giao diện.
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-56 shrink-0">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
            {groups.map(g => {
              const meta = GROUP_META[g];
              const Icon = meta.icon;
              const pendingInGroup = groupedConfigs[g]?.some(c => changes[c.key] !== undefined);
              return (
                <button key={g} onClick={() => setActiveGroup(g)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors text-left border-b border-gray-700/30 last:border-b-0 ${
                    activeGroup === g ? `bg-${meta.color}-500/15 text-${meta.color}-400` : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  <Icon size={15} className="shrink-0" />
                  <span className="flex-1 text-left">{meta.label.split(' ').slice(1).join(' ')}</span>
                  {pendingInGroup && <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Config fields */}
        <div className="flex-1">
          {groups.filter(g => g === activeGroup).map(g => {
            const meta = GROUP_META[g];
            return (
              <div key={g} className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
                <h2 className="text-base font-bold text-white mb-1">{meta.label}</h2>
                {g === 'prompts' && (
                  <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                    Đây là các "System Instruction" — câu lệnh cốt lõi điều khiển cách AI chấm điểm.
                    Khi AI chấm quá gắt hoặc quá hiền, sửa text ở đây rồi nhấn <strong className="text-white">Lưu tất cả</strong>.
                  </p>
                )}
                <div className={`space-y-6 ${g === 'prompts' ? '' : 'divide-y divide-gray-700/30'}`}>
                  {(groupedConfigs[g] || []).map(config => (
                    <div key={config.key} className={g === 'prompts' ? '' : 'pt-5 first:pt-0'}>
                      <ConfigField
                        config={{ ...config, value: changes[config.key] !== undefined ? changes[config.key] : config.value }}
                        onChange={handleChange}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <FiRefreshCw className="animate-spin mr-2" size={20} /> Đang tải cấu hình...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
