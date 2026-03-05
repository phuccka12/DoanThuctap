/**
 * Profile.jsx — Hồ sơ cá nhân
 * Tab 1: Thông tin cá nhân (xem / chỉnh sửa)
 * Tab 2: Tiến độ học tập  (stats + placement result)
 * Tab 3: Lộ trình & Mục tiêu (learning preferences)
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosConfig';
import {
  FaUser, FaEnvelope, FaPhone, FaCalendar, FaMapMarkerAlt,
  FaGraduationCap, FaEdit, FaSave, FaTimes, FaCamera,
  FaFire, FaTrophy, FaCoins, FaStar, FaBullseye,
  FaBook, FaMicrophone, FaHeadphones, FaPen, FaChartBar,
  FaCheckCircle, FaClock, FaArrowLeft,
} from 'react-icons/fa';

// ─── helpers ──────────────────────────────────────────────────────────────────
const cn = (...c) => c.filter(Boolean).join(' ');

// ─── colour palette ───────────────────────────────────────────────────────────
const P1 = '#0EA5E9'; // sky-500
const P2 = '#6366F1'; // indigo-500
const A1c = '#06B6D4'; // cyan-500
const A2c = '#14B8A6'; // teal-500

const CEFR_COLORS = {
  A1: 'from-[#6EE7B7] to-[#10B981]', A2: 'from-[#6EE7B7] to-[#10B981]',
  B1: 'from-[#7DD3FC] to-[#0EA5E9]', B2: 'from-[#A5B4FC] to-[#6366F1]',
  C1: 'from-[#FDA4AF] to-[#F43F5E]', C2: 'from-[#FDE68A] to-[#F59E0B]',
};

const SKILL_ICONS = {
  writing: <FaPen />, speaking: <FaMicrophone />,
  reading: <FaBook />, listening: <FaHeadphones />,
};

const GOAL_LABELS = {
  band: 'Đạt band IELTS mục tiêu', speaking: 'Cải thiện Speaking',
  writing: 'Cải thiện Writing', listening: 'Cải thiện Listening',
  grammar: 'Nắm vững Ngữ pháp',
};

const LEVEL_LABELS = {
  a1: 'A1 – Mới bắt đầu', a2: 'A2 – Cơ bản',
  b1: 'B1 – Trung bình',  b2: 'B2 – Khá tốt',
  c1: 'C1 – Nâng cao',    c2: 'C2 – Thông thạo',
  stranger: 'Mới bắt đầu', old_friend: 'Cơ bản',
  learning: 'Trung bình',  close_friend: 'Khá tốt',
};

// ─── sub-components ───────────────────────────────────────────────────────────
function InputField({ icon, label, disabled, className = '', ...props }) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold mb-1.5 text-slate-700">{label}</label>
      <div className="relative group">
        <div className={cn('absolute left-3 top-1/2 -translate-y-1/2 text-sm transition-colors', disabled ? 'text-gray-300' : 'text-sky-400 group-focus-within:text-indigo-500')}>
          {icon}
        </div>
        <input
          {...props}
          disabled={disabled}
          className={cn(
            'w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-all outline-none shadow-sm',
            'border-sky-100 bg-white/80 placeholder-gray-300',
            'focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] focus:bg-white',
            disabled && 'cursor-not-allowed opacity-70 bg-gray-50/50 shadow-none',
          )}
        />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, gradient }) {
  return (
    <div className={cn('rounded-2xl p-4 flex flex-col sm:flex-row items-center sm:items-start gap-3 text-white shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden', `bg-linear-to-br ${gradient}`)}>
      <div className="absolute -right-4 -bottom-4 opacity-20 text-6xl pointer-events-none">
        {icon}
      </div>
      <div className="text-3xl opacity-90 drop-shadow-sm">{icon}</div>
      <div className="text-center sm:text-left z-10">
        <div className="text-2xl font-extrabold leading-tight drop-shadow-sm">{value}</div>
        <div className="text-xs font-semibold opacity-90 uppercase tracking-wide mt-1">{label}</div>
        {sub && <div className="text-xs opacity-75 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function ScoreBar({ label, value, max, gradient }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1 text-slate-600">
        <span className="font-medium">{label}</span>
        <span className="font-extrabold text-slate-800">{value}/{max}</span>
      </div>
      <div className="h-2.5 bg-sky-100/50 rounded-full overflow-hidden shadow-inner">
        <div className={cn('h-full rounded-full bg-linear-to-r transition-all duration-1000 ease-out', gradient)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Profile() {
  const navigate  = useNavigate();
  const { fetchUserInfo } = useAuth();

  const [tab, setTab]         = useState('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg]         = useState({ type: '', text: '' });
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    user_name: '', phone: '', date_of_birth: '',
    address: '', bio: '', current_band: '',
    target_band: '', goal: '',
    study_hours_per_week: '', exam_date: '',
    focus_skills: [], preferred_study_days: [],
  });

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/user/profile');
      const p   = res.data.profile;
      setProfile(p);
      setForm({
        user_name:            p.user_name || '',
        phone:                p.phone || '',
        date_of_birth:        p.date_of_birth ? p.date_of_birth.split('T')[0] : '',
        address:              p.address || '',
        bio:                  p.bio || '',
        current_band:         p.current_band ?? '',
        target_band:          p.learning_preferences?.target_band ?? '',
        goal:                 p.learning_preferences?.goal || '',
        study_hours_per_week: p.learning_preferences?.study_hours_per_week ?? '',
        exam_date:            p.learning_preferences?.exam_date ? p.learning_preferences.exam_date.split('T')[0] : '',
        focus_skills:         p.learning_preferences?.focus_skills || [],
        preferred_study_days: p.learning_preferences?.preferred_study_days || [],
      });
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Không thể tải hồ sơ' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const toggleSkill = skill =>
    setForm(f => ({
      ...f,
      focus_skills: f.focus_skills.includes(skill)
        ? f.focus_skills.filter(s => s !== skill)
        : [...f.focus_skills, skill],
    }));

  const toggleDay = day =>
    setForm(f => ({
      ...f,
      preferred_study_days: f.preferred_study_days.includes(day)
        ? f.preferred_study_days.filter(d => d !== day)
        : [...f.preferred_study_days, day],
    }));

  const handleSave = async () => {
    try {
      setSaving(true);
      setMsg({ type: '', text: '' });
      await axiosInstance.put('/user/profile', {
        ...form,
        current_band:         form.current_band !== '' ? parseFloat(form.current_band) : null,
        target_band:          form.target_band  !== '' ? parseFloat(form.target_band)  : null,
        study_hours_per_week: form.study_hours_per_week !== '' ? parseInt(form.study_hours_per_week) : null,
      });
      setMsg({ type: 'success', text: '✅ Đã lưu hồ sơ thành công!' });
      setEditing(false);
      await loadProfile();
      await fetchUserInfo();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Lưu thất bại' });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    }
  };

  const handleCancel = () => { setEditing(false); loadProfile(); };

  if (loading) return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-sky-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-[#0EA5E9] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-indigo-600 font-medium text-sm animate-pulse">Đang tải hồ sơ...</p>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-sky-50">
      <p className="text-slate-500 font-medium">Không tải được hồ sơ.</p>
    </div>
  );

  const cefrBand   = profile.placement_test_result?.cefr_level || null;
  const levelKey   = profile.learning_preferences?.current_level || null;
  const levelLabel = (cefrBand ? LEVEL_LABELS[cefrBand.toLowerCase()] : null)
                  || (levelKey ? LEVEL_LABELS[levelKey] : null)
                  || 'Chưa xác định';

  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const DAY_LABELS = { Mon:'T2',Tue:'T3',Wed:'T4',Thu:'T5',Fri:'T6',Sat:'T7',Sun:'CN' };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50/50 to-sky-100 pb-12">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between bg-white/60 backdrop-blur-md p-4 rounded-3xl shadow-xs border border-white">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')}
              className="w-11 h-11 rounded-2xl bg-white border border-sky-100 flex items-center justify-center text-slate-500 shadow-sm hover:bg-sky-50 hover:text-[#0EA5E9] hover:border-sky-300 transition-all">
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold bg-linear-to-r from-[#0EA5E9] to-[#6366F1] bg-clip-text text-transparent drop-shadow-sm">Hồ sơ cá nhân</h1>
              <p className="text-xs text-slate-500 font-medium">Quản lý thông tin &amp; xem tiến độ học tập</p>
            </div>
          </div>
          {tab === 'info' && !editing && (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-linear-to-r from-[#0EA5E9] to-[#6366F1] text-white text-sm font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <FaEdit /> Chỉnh sửa
            </button>
          )}
          {editing && (
            <div className="flex gap-3">
              <button onClick={handleCancel} className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-white border-2 border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all">
                <FaTimes /> Hủy
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-linear-to-r from-[#10B981] to-[#059669] text-white text-sm font-bold shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0">
                <FaSave /> {saving ? 'Đang lưu...' : 'Lưu lại'}
              </button>
            </div>
          )}
        </div>

        {/* ── Alert ── */}
        {msg.text && (
          <div className={cn('px-5 py-4 rounded-2xl text-sm font-bold border shadow-md animate-fade-in-down',
            msg.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-700' : 'bg-red-50/90 border-red-200 text-red-600')}>
            {msg.text}
          </div>
        )}

        {/* ── Avatar + quick stats row ── */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          {/* Decorative background blur */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-linear-to-br from-[#0EA5E9]/20 to-[#6366F1]/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative flex-none">
            <div className="w-28 h-28 rounded-3xl bg-linear-to-br from-[#0EA5E9] to-[#6366F1] flex items-center justify-center text-white text-4xl font-extrabold shadow-lg shadow-indigo-200 ring-4 ring-white overflow-hidden z-10 relative">
              {profile.avatar
                ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                : profile.user_name?.substring(0, 2).toUpperCase()}
            </div>
            {editing && (
              <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border-2 border-[#0EA5E9] rounded-full flex items-center justify-center text-[#0EA5E9] text-sm shadow-xl hover:bg-[#0EA5E9] hover:text-white transition-colors z-20">
                <FaCamera />
              </button>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left z-10">
            <h2 className="text-2xl font-extrabold text-slate-800">{profile.user_name}</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">{profile.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 justify-center md:justify-start">
              {cefrBand && (
                <span className={cn('text-xs px-3.5 py-1.5 rounded-xl text-white font-extrabold shadow-sm bg-linear-to-r', CEFR_COLORS[cefrBand] || 'from-[#0EA5E9] to-[#6366F1]')}>
                  Mức {cefrBand}
                </span>
              )}
              <span className="text-xs px-3.5 py-1.5 rounded-xl bg-sky-100 border border-sky-200 text-sky-700 font-bold shadow-sm">{levelLabel}</span>
              {profile.role === 'vip' && <span className="text-xs px-3.5 py-1.5 rounded-xl bg-linear-to-r from-amber-200 to-yellow-400 border border-yellow-300 text-yellow-900 font-extrabold shadow-sm">⭐ VIP Member</span>}
            </div>
          </div>
          
          <div className="flex gap-6 flex-wrap justify-center bg-slate-50/50 p-4 rounded-3xl border border-slate-100 z-10">
            {[
              { v: profile.gamification.level,  l: 'Level',     c: 'text-[#0EA5E9]' },
              { v: profile.gamification.streak, l: 'Streak 🔥', c: 'text-orange-500' },
              { v: profile.gamification.gold,   l: 'Coins 🪙',  c: 'text-yellow-500' },
              { v: profile.gamification.exp,    l: 'XP',        c: 'text-[#6366F1]' },
            ].map(s => (
              <div key={s.l} className="text-center px-2">
                <div className={cn('text-2xl font-extrabold drop-shadow-sm', s.c)}>{s.v}</div>
                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 p-1.5 bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-sm">
          {[
            { key: 'info',     icon: <FaUser />,     label: 'Thông tin cá nhân' },
            { key: 'progress', icon: <FaChartBar />, label: 'Tiến độ học tập' },
            { key: 'goals',    icon: <FaBullseye />, label: 'Lộ trình & Mục tiêu' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300',
                tab === t.key 
                  ? 'bg-linear-to-r from-[#0EA5E9] to-[#6366F1] text-white shadow-md transform scale-[1.02]' 
                  : 'text-slate-500 hover:text-[#6366F1] hover:bg-white/80'
              )}>
              <span className={tab === t.key ? 'text-white' : 'text-slate-400'}>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* ══ TAB: THÔNG TIN ══ */}
        {tab === 'info' && (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white shadow-lg p-6 md:p-8 space-y-8 animate-fade-in">
            <div>
              <p className="text-xs font-extrabold text-indigo-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Thông tin liên hệ
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField icon={<FaUser />}         label="Họ và tên"      name="user_name"     value={form.user_name}     onChange={handleChange} disabled={!editing} placeholder="Nguyễn Văn A" />
                <InputField icon={<FaEnvelope />}     label="Email (Cố định)"name="email"         value={profile.email}      disabled={true}         placeholder="" />
                <InputField icon={<FaPhone />}        label="Số điện thoại"  name="phone"         value={form.phone}         onChange={handleChange} disabled={!editing} placeholder="0912345678" />
                <InputField icon={<FaCalendar />}     label="Ngày sinh"      name="date_of_birth" value={form.date_of_birth} onChange={handleChange} disabled={!editing} type="date" />
                <InputField icon={<FaMapMarkerAlt />} label="Địa chỉ hiện tại"name="address"      value={form.address}       onChange={handleChange} disabled={!editing} placeholder="Hà Nội, Việt Nam" className="md:col-span-2" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-linear-to-r from-sky-50 to-indigo-50 border border-sky-100">
              <p className="text-xs font-extrabold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-sky-500"></span> Điểm IELTS
              </p>
              <div className="grid grid-cols-2 gap-5">
                <InputField icon={<FaGraduationCap />} label="Band hiện tại" name="current_band" value={form.current_band} onChange={handleChange} disabled={!editing} type="number" step="0.5" min="0" max="9" placeholder="6.0" className="bg-white rounded-xl" />
                <InputField icon={<FaTrophy />}        label="Band mục tiêu" name="target_band"  value={form.target_band}  onChange={handleChange} disabled={!editing} type="number" step="0.5" min="0" max="9" placeholder="7.5" className="bg-white rounded-xl" />
              </div>
              {!editing && (profile.current_band || profile.learning_preferences?.target_band) && (
                <div className="mt-5 flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-white">
                  <span className="text-3xl font-black text-slate-700">{profile.current_band || '–'}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-linear-to-r from-[#0EA5E9] to-[#6366F1] rounded-full relative"
                      style={{ width: `${Math.min(100, ((profile.current_band || 0) / 9) * 100)}%` }}>
                        <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 blur-[2px]"></div>
                      </div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-[#0EA5E9] block leading-none">{profile.learning_preferences?.target_band || '–'}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mục tiêu</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">Giới thiệu bản thân</label>
              <textarea name="bio" value={form.bio} onChange={handleChange} disabled={!editing} rows={4}
                placeholder="Chia sẻ về mục tiêu và quá trình học IELTS của bạn..."
                className={cn('w-full px-4 py-3 rounded-2xl border text-sm outline-none transition-all shadow-sm',
                  'border-sky-100 bg-white/80 placeholder-gray-300',
                  'focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] focus:bg-white',
                  !editing && 'cursor-not-allowed opacity-70 bg-gray-50/50 shadow-none')} />
            </div>

            <div className="pt-6 border-t border-slate-100">
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Trạng thái Tài khoản</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-medium text-slate-600">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <FaCheckCircle className={profile.email_verified ? 'text-emerald-500 text-lg' : 'text-slate-300 text-lg'} />
                  {profile.email_verified ? 'Đã xác thực Email' : 'Chưa xác thực Email'}
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <FaClock className="text-sky-400 text-lg" />
                  Tham gia: {new Date(profile.created_at).toLocaleDateString('vi-VN')}
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <FaStar className={profile.role === 'vip' ? 'text-yellow-500 text-lg' : 'text-indigo-400 text-lg'} />
                  {profile.role === 'vip' ? 'Tài khoản VIP' : profile.role === 'admin' ? 'Admin' : 'Tài khoản Tiêu chuẩn'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB: TIẾN ĐỘ ══ */}
        {tab === 'progress' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<FaStar />}    label="Level"  value={profile.gamification.level}           gradient="from-[#0EA5E9] to-[#3B82F6]" />
              <StatCard icon={<FaFire />}    label="Streak" value={`${profile.gamification.streak} ngày`} sub="Giữ vững phong độ!" gradient="from-[#F43F5E] to-[#E11D48]" />
              <StatCard icon={<FaTrophy />}  label="Tổng XP"value={profile.gamification.exp}             gradient="from-[#8B5CF6] to-[#6366F1]" />
              <StatCard icon={<FaCoins />}   label="Coins"  value={profile.gamification.gold}            gradient="from-[#F59E0B] to-[#D97706]" />
            </div>

            {profile.placement_test_completed && profile.placement_test_result ? (
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white shadow-lg p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-800">Kết quả Đánh giá Trình độ</h3>
                    <p className="text-sm text-slate-500 font-medium">Hoàn thành vào: {new Date(profile.placement_test_result.completed_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <span className={cn('text-sm px-4 py-2 rounded-xl text-white font-extrabold shadow-md bg-linear-to-r text-center',
                    CEFR_COLORS[profile.placement_test_result.cefr_level] || 'from-[#0EA5E9] to-[#6366F1]')}>
                    Khung {profile.placement_test_result.cefr_level}
                  </span>
                </div>
                
                <div className="flex items-center gap-5 p-5 rounded-3xl bg-linear-to-r from-sky-50 to-indigo-50 border border-indigo-100 mb-6 relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/40 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#0EA5E9] to-[#6366F1] flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-white z-10">
                    {profile.placement_test_result.score}
                  </div>
                  <div className="z-10">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Điểm trung bình</p>
                    <p className="text-2xl font-extrabold text-slate-800">{profile.placement_test_result.score}<span className="text-base text-slate-400">/100</span></p>
                  </div>
                </div>
                
                <div className="space-y-5 px-2">
                  <ScoreBar label="Từ vựng & Ngữ pháp" value={profile.placement_test_result.vocab_score    || 0} max={40} gradient="from-[#0EA5E9] to-[#3B82F6]" />
                  <ScoreBar label="Kỹ năng Đọc hiểu"   value={profile.placement_test_result.reading_score  || 0} max={35} gradient="from-[#8B5CF6] to-[#6366F1]" />
                  <ScoreBar label="Kỹ năng Phát âm"    value={profile.placement_test_result.speaking_score || 0} max={25} gradient="from-[#10B981] to-[#059669]" />
                </div>
                
                <button onClick={() => navigate('/placement-test')}
                  className="mt-8 w-full py-3.5 rounded-2xl border-2 border-dashed border-[#0EA5E9]/40 text-[#0EA5E9] text-sm font-bold bg-sky-50/50 hover:bg-sky-100 transition-colors flex items-center justify-center gap-2">
                  🔄 Làm lại bài đánh giá năng lực
                </button>
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white shadow-lg p-10 text-center relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-100 rounded-full blur-3xl opacity-50"></div>
                <div className="text-6xl mb-4 drop-shadow-md relative z-10">🎯</div>
                <h3 className="text-xl font-extrabold text-slate-800 mb-2 relative z-10">Bạn chưa làm bài test trình độ!</h3>
                <p className="text-sm text-slate-500 font-medium mb-6 relative z-10">Hãy dành ra vài phút làm bài kiểm tra để hệ thống gợi ý lộ trình phù hợp nhất nhé.</p>
                <button onClick={() => navigate('/placement-test')}
                  className="relative z-10 px-8 py-3.5 rounded-2xl bg-linear-to-r from-[#F59E0B] to-[#D97706] text-white text-sm font-extrabold shadow-lg shadow-amber-200 hover:shadow-xl hover:-translate-y-1 transition-all animate-pulse hover:animate-none">
                  Làm bài test ngay (+200 Coins)
                </button>
              </div>
            )}

            {(profile.current_band || profile.learning_preferences?.target_band) && (
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white shadow-lg p-6 md:p-8">
                <p className="text-xs font-extrabold text-indigo-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Hành trình thăng hạng Band
                </p>
                <div className="flex items-center gap-4">
                  <div className="text-center w-16">
                    <div className="text-3xl font-black text-slate-700">{profile.current_band || '0'}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Hiện tại</div>
                  </div>
                  <div className="flex-1 relative">
                    {/* Background track */}
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      {/* Fill track */}
                      <div className="h-full bg-linear-to-r from-[#0EA5E9] to-[#6366F1] rounded-full transition-all duration-1000 ease-out relative"
                        style={{ width: `${Math.min(100, ((profile.current_band || 0) / (profile.learning_preferences?.target_band || 9)) * 100)}%` }}>
                        <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/20 skew-x-12"></div>
                      </div>
                    </div>
                    {/* Goal marker */}
                    <div className="absolute -top-3 right-0 bottom-0 flex flex-col items-center">
                       <div className="w-1 h-10 bg-indigo-200 rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-center w-16">
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-[#0EA5E9] to-[#6366F1]">{profile.learning_preferences?.target_band || '9.0'}</div>
                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mt-1">Mục tiêu</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: LỘ TRÌNH ══ */}
        {tab === 'goals' && (
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white shadow-lg p-6 md:p-8 space-y-8 animate-fade-in">
            <div>
              <p className="text-xs font-extrabold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Mục tiêu chính
              </p>
              {editing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(GOAL_LABELS).map(([key, label]) => {
                    const active = form.goal === key;
                    return (
                      <button key={key} onClick={() => setForm(f => ({ ...f, goal: key }))}
                        className={cn('p-4 rounded-2xl border-2 text-sm font-bold text-left transition-all duration-200',
                          active 
                            ? 'border-transparent bg-linear-to-r from-[#0EA5E9] to-[#6366F1] text-white shadow-lg shadow-indigo-200 -translate-y-0.5' 
                            : 'border-slate-100 bg-white text-slate-600 hover:border-sky-300 hover:shadow-md')}>
                        {label}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-linear-to-r from-[#0EA5E9] to-[#6366F1] text-white shadow-lg shadow-indigo-200">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaBullseye className="text-2xl" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-indigo-100 uppercase tracking-wider mb-0.5">Mục tiêu hiện tại</p>
                    <span className="text-lg font-extrabold">{GOAL_LABELS[profile.learning_preferences?.goal] || 'Chưa thiết lập mục tiêu'}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-extrabold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Thời gian biểu
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
                <InputField icon={<FaClock />}    label="Giờ học dự kiến (tuần)"  name="study_hours_per_week" value={form.study_hours_per_week} onChange={handleChange} disabled={!editing} type="number" min="1" max="40" placeholder="10 giờ" className="bg-white rounded-xl" />
                <InputField icon={<FaCalendar />} label="Ngày thi mục tiêu" name="exam_date"            value={form.exam_date}            onChange={handleChange} disabled={!editing} type="date" className="bg-white rounded-xl" />
              </div>
            </div>

            <div>
              <p className="text-xs font-extrabold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Kỹ năng ưu tiên
              </p>
              <div className="flex gap-3 flex-wrap">
                {['writing','speaking','reading','listening'].map(skill => {
                  const active = (editing ? form.focus_skills : profile.learning_preferences?.focus_skills || []).includes(skill);
                  return (
                    <button key={skill} onClick={() => editing && toggleSkill(skill)}
                      className={cn('flex items-center gap-2 px-5 py-3 rounded-2xl border-2 text-sm font-bold transition-all duration-200',
                        active 
                          ? 'border-transparent bg-linear-to-r from-[#0EA5E9] to-[#6366F1] text-white shadow-md' 
                          : 'border-slate-100 bg-white text-slate-500',
                        editing ? 'cursor-pointer hover:border-sky-300 hover:shadow-sm' : 'cursor-default')}>
                      <span className={active ? 'text-white' : 'text-slate-400'}>{SKILL_ICONS[skill]}</span> 
                      {skill.charAt(0).toUpperCase() + skill.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-extrabold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Lịch học linh hoạt
              </p>
              <div className="flex gap-3 flex-wrap">
                {DAYS.map(day => {
                  const active = (editing ? form.preferred_study_days : profile.learning_preferences?.preferred_study_days || []).includes(day);
                  return (
                    <button key={day} onClick={() => editing && toggleDay(day)}
                      className={cn('w-14 h-14 rounded-2xl border-2 text-sm font-extrabold transition-all duration-200 flex items-center justify-center',
                        active 
                          ? 'border-transparent bg-linear-to-r from-[#0EA5E9] to-[#6366F1] text-white shadow-md -translate-y-0.5' 
                          : 'border-slate-100 bg-white text-slate-400',
                        editing ? 'cursor-pointer hover:border-sky-300 hover:shadow-sm' : 'cursor-default')}>
                      {DAY_LABELS[day]}
                    </button>
                  );
                })}
              </div>
            </div>

            {!editing && (
              <button onClick={() => setEditing(true)}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-[#0EA5E9]/40 text-[#0EA5E9] text-sm font-bold bg-sky-50/50 hover:bg-sky-100 transition-colors flex items-center justify-center gap-2 mt-4">
                ✏️ Tùy chỉnh lộ trình học của tôi
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}