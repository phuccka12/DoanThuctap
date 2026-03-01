import { useState, useEffect } from 'react';
import {
  FiSliders, FiSave, FiRefreshCw, FiCheckCircle, FiAlertTriangle,
} from 'react-icons/fi';
import { getEconomySettings, updateEconomySettings } from '../../services/adminService';

/* ─── định nghĩa tất cả 13 key ─── */
const ECONOMY_GROUPS = [
  {
    group: '🪙 Phần thưởng khi hoàn thành bài',
    color: 'from-yellow-500 to-orange-500',
    items: [
      { key: 'economy_reward_vocab',     label: 'Từ vựng',        unit: 'coins', desc: 'Mỗi bài từ vựng hoàn thành' },
      { key: 'economy_reward_speaking',  label: 'Speaking AI',    unit: 'coins', desc: 'Sau khi AI chấm bài nói' },
      { key: 'economy_reward_writing',   label: 'Writing AI',     unit: 'coins', desc: 'Sau khi AI chấm bài viết' },
      { key: 'economy_reward_reading',   label: 'Reading',        unit: 'coins', desc: 'Hoàn thành bài đọc' },
      { key: 'economy_reward_listening', label: 'Listening',      unit: 'coins', desc: 'Hoàn thành bài nghe' },
      { key: 'economy_reward_checkin',   label: 'Check-in hàng ngày', unit: 'coins', desc: 'Điểm danh mỗi ngày' },
    ],
  },
  {
    group: '📊 Giới hạn hàng ngày',
    color: 'from-blue-500 to-indigo-500',
    items: [
      { key: 'economy_daily_coin_cap', label: 'Coins tối đa / ngày', unit: 'coins', desc: 'Trần kiếm được trong 1 ngày (reset lúc 0h UTC)' },
    ],
  },
  {
    group: '🐾 Luật sinh tồn — Hunger Bar',
    color: 'from-pink-500 to-rose-500',
    items: [
      { key: 'economy_hunger_decay_per_day',    label: 'Đói tăng / ngày',         unit: 'điểm', desc: 'Mỗi ngày pet đói thêm bao nhiêu (0=đầy, 100=chết)' },
      { key: 'economy_hunger_happy_threshold',  label: 'Ngưỡng "Vui vẻ"',         unit: 'điểm đói', desc: 'Dưới ngưỡng này pet ở trạng thái Happy → EXP buff' },
      { key: 'economy_hunger_dying_threshold',  label: 'Ngưỡng "Hấp hối"',        unit: 'điểm đói', desc: 'Trên ngưỡng này pet đói nặng → EXP bị lock' },
      { key: 'economy_exp_buff_happy_pct',      label: 'EXP buff khi Happy (%)',   unit: '%', desc: 'Tỉ lệ EXP bonus khi pet đang vui vẻ' },
      { key: 'economy_freeze_streak_cost',      label: 'Giá đóng băng streak',     unit: 'coins', desc: 'Bao nhiêu coins để mua 1 lần bảo vệ streak' },
    ],
  },
  {
    group: '⚔️ Hệ thống thăng cấp',
    color: 'from-violet-500 to-purple-600',
    items: [
      { key: 'economy_pet_exp_per_level_base', label: 'EXP cần mỗi cấp (base)', unit: 'EXP', desc: 'Mỗi cấp cần thêm bội số này nhân với cấp độ' },
    ],
  },
];

/* flat map key → group/meta */
const KEY_META = {};
ECONOMY_GROUPS.forEach(g => g.items.forEach(item => { KEY_META[item.key] = item; }));

export default function AdminEconomy() {
  const [values, setValues]   = useState({});   // { key: rawStringValue }
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null); // { type: 'success'|'error', msg }

  /* ── load ── */
  const load = async () => {
    setLoading(true);
    try {
      const res = await getEconomySettings();
      const map = {};
      // backend trả { success, data: configs[] }
      const configs = res.data.data ?? res.data.configs ?? [];
      configs.forEach(c => { map[c.key] = String(c.value); });
      setValues(map);
      setOriginal(map);
    } catch (e) {
      setToast({ type: 'error', msg: `Lỗi tải cài đặt: ${e?.response?.data?.message || e?.message || 'Không thể kết nối server'}` });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  /* ── save ── */
  const handleSave = async () => {
    // validate all numeric
    for (const key of Object.keys(values)) {
      if (isNaN(Number(values[key]))) {
        setToast({ type: 'error', msg: `Giá trị của "${KEY_META[key]?.label || key}" phải là số` });
        return;
      }
    }
    setSaving(true);
    try {
      const configs = Object.entries(values).map(([key, val]) => ({ key, value: Number(val) }));
      await updateEconomySettings(configs);
      setOriginal({ ...values });
      setToast({ type: 'success', msg: 'Đã lưu cấu hình thành công!' });
    } catch (e) {
      setToast({ type: 'error', msg: e?.response?.data?.message || 'Lưu thất bại' });
    }
    setSaving(false);
    setTimeout(() => setToast(null), 3500);
  };

  const isDirty = Object.keys(values).some(k => values[k] !== original[k]);

  /* ─── render ─── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-linear-to-br from-violet-500 to-purple-600">
            <FiSliders className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Cấu hình Cân bằng Game</h1>
            <p className="text-gray-400 text-sm">Economy settings — lưu vào DB, áp dụng ngay không cần restart</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} title="Tải lại"
            className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all">
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleSave} disabled={saving || !isDirty}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-linear-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity">
            <FiSave /> {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-medium transition-all
          ${toast.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {toast.type === 'success' ? <FiCheckCircle className="text-lg shrink-0" /> : <FiAlertTriangle className="text-lg shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Dirty banner */}
      {isDirty && !toast && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
          <FiAlertTriangle /> Bạn có thay đổi chưa lưu. Nhớ bấm <strong>Lưu thay đổi</strong>.
        </div>
      )}

      {/* Groups */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {ECONOMY_GROUPS.map(g => (
            <div key={g.group} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {/* Group header */}
              <div className={`bg-linear-to-r ${g.color} px-5 py-3`}>
                <h2 className="text-white font-bold text-sm">{g.group}</h2>
              </div>
              {/* Items */}
              <div className="divide-y divide-gray-800/60">
                {g.items.map(item => (
                  <div key={item.key} className="flex items-center justify-between px-5 py-4 gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold">{item.label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                      <code className="text-gray-600 text-xs">{item.key}</code>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min={0}
                        step={item.unit === '%' ? 1 : 1}
                        value={values[item.key] ?? ''}
                        onChange={e => setValues(v => ({ ...v, [item.key]: e.target.value }))}
                        className={`w-28 bg-gray-800 border rounded-xl px-3 py-1.5 text-white text-sm text-right outline-none transition-colors
                          ${values[item.key] !== original[item.key] ? 'border-yellow-500/60 bg-yellow-500/5' : 'border-gray-700 focus:border-violet-500'}`}
                      />
                      <span className="text-gray-500 text-xs w-12 text-left">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
