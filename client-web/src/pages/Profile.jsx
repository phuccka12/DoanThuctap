import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn as themeCn, theme as lightTheme, darkTheme } from '../utils/dashboardTheme';
import axiosInstance from '../utils/axiosConfig';
import LoadingCat from '../components/shared/LoadingCat';
import {
  FaUser, FaEnvelope, FaPhone, FaCalendar, FaMapMarkerAlt,
  FaGraduationCap, FaEdit, FaSave, FaTimes, FaCamera,
  FaFire, FaTrophy, FaCoins, FaStar, FaBullseye,
  FaBook, FaMicrophone, FaHeadphones, FaPen, FaChartBar,
  FaCheckCircle, FaClock, FaArrowLeft, FaCog
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
  const { isDark } = useTheme();
  return (
    <div className={className}>
      <label className={cn('block text-sm font-semibold mb-1.5', isDark ? 'text-slate-300' : 'text-slate-700')}>{label}</label>
      <div className="relative group">
        <div className={cn('absolute left-3 top-1/2 -translate-y-1/2 text-sm transition-colors', 
          disabled ? (isDark ? 'text-slate-700' : 'text-gray-300') : (isDark ? 'text-indigo-400 group-focus-within:text-indigo-300' : 'text-sky-400 group-focus-within:text-indigo-500'))}>
          {icon}
        </div>
        <input
          {...props}
          disabled={disabled}
          className={cn(
            'w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-all outline-none shadow-sm',
            isDark 
              ? 'border-white/10 bg-white/5 placeholder-slate-500 text-white focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white/10'
              : 'border-sky-100 bg-white/80 placeholder-gray-300 text-slate-800 focus:ring-indigo-500/30 focus:border-[#6366F1] focus:bg-white',
            disabled && 'cursor-not-allowed opacity-70 shadow-none',
            disabled && (isDark ? 'bg-white/5' : 'bg-gray-50/50')
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
  const { isDark } = useTheme();
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className={cn('flex justify-between text-xs mb-1', isDark ? 'text-slate-400' : 'text-slate-600')}>
        <span className="font-medium">{label}</span>
        <span className={cn('font-extrabold', isDark ? 'text-slate-200' : 'text-slate-800')}>{value}/{max}</span>
      </div>
      <div className={cn('h-2.5 rounded-full overflow-hidden shadow-inner', isDark ? 'bg-white/5' : 'bg-sky-100/50')}>
        <div className={cn('h-full rounded-full bg-linear-to-r transition-all duration-1000 ease-out', gradient)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Profile({ defaultTab }) {
  const navigate  = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { fetchUserInfo } = useAuth();
  const { isDark } = useTheme();
  
  const t = isDark ? darkTheme : lightTheme;

  const initialTab = searchParams.get('tab') || defaultTab || 'info';
  const [tab, setTab]         = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg]         = useState({ type: '', text: '' });
  const [profile, setProfile] = useState(null);
  const [recentScores, setRecentScores] = useState([]);

  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [settings, setSettings]   = useState({ ai_voice: 'female', ai_speed: 1.0, notifications_enabled: true });

  const [form, setForm] = useState({
    user_name: '', phone: '', date_of_birth: '',
    address: '', bio: '', current_band: '',
    target_band: '', goal: '',
    study_hours_per_week: '', exam_date: '',
    focus_skills: [], preferred_study_days: [],
  });

  useEffect(() => { loadProfile(); }, []);

  useEffect(() => {
    if (tab === 'progress') {
      import('../services/dashboardService').then((module) => {
        module.default.getLatestScores(6).then(scores => {
          setRecentScores(scores || []);
        }).catch(err => console.error(err));
      });
    }
  }, [tab]);

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
      if (p.settings) {
        setSettings({
          ai_voice: p.settings.ai_voice || 'female',
          ai_speed: p.settings.ai_speed || 1.0,
          notifications_enabled: p.settings.notifications_enabled ?? true,
        });
      }
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
 
  const handleChangePwd = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm_password) {
      return setMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
    }
    try {
      setChangingPwd(true);
      await axiosInstance.post('/auth/change-password', {
        old_password: passwords.old_password,
        new_password: passwords.new_password
      });
      setMsg({ type: 'success', text: '✅ Đổi mật khẩu thành công!' });
      setPasswords({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Đổi mật khẩu thất bại' });
    } finally {
      setChangingPwd(false);
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    }
  };

  const handleUpdateSettings = async (newSettings) => {
    try {
      setSettings(newSettings);
      await axiosInstance.put('/user/profile', { settings: newSettings });
    } catch (err) {
      console.error('Update settings failed:', err);
    }
  };

  const handleCancel = () => { setEditing(false); loadProfile(); };

  if (loading) return (
    <div className={cn('min-h-screen flex items-center justify-center transition-colors duration-500', t.page)}>
      <LoadingCat size={250} text="Đang tải hồ sơ của bạn..." />
    </div>
  );

  if (!profile) return (
    <div className={cn('min-h-screen flex items-center justify-center transition-colors duration-500', t.page)}>
      <p className={cn('font-medium', t.sub)}>Không tải được hồ sơ.</p>
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
    <div className={cn('min-h-screen transition-colors duration-500 pb-12', t.page)}>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* ── Top bar ── */}
        <div className={cn('flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl p-5 rounded-[2rem] border transition-all duration-300', 
          isDark ? 'bg-white/5 border-white/10 shadow-2xl' : 'bg-white/40 border-white/60 shadow-xl shadow-indigo-100/20')}>
          <div className="flex items-center gap-5">
            <button onClick={() => navigate('/dashboard')}
              className={cn('w-12 h-12 rounded-2xl border flex items-center justify-center transition-all',
                isDark ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-indigo-400' : 'bg-white border-indigo-100 text-slate-500 hover:bg-sky-50 hover:text-indigo-600 hover:border-indigo-300 hover:-translate-x-1')}>
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-3xl font-black bg-linear-to-r from-indigo-600 via-purple-600 to-sky-500 bg-clip-text text-transparent italic tracking-tight uppercase">MY PROFILE</h1>
              <p className={cn('text-xs font-bold uppercase tracking-widest mt-0.5 opacity-70', t.sub)}>Quản lý hành trình chinh phục IELTS</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {tab === 'info' && !editing && (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-linear-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all">
                <FaEdit /> CHỈNH SỬA HỒ SƠ
              </button>
            )}
            {editing && (
              <div className="flex gap-3 w-full md:w-auto">
                <button onClick={handleCancel} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white border-2 border-slate-200 text-slate-500 text-sm font-bold hover:bg-slate-50 transition-all">
                  <FaTimes /> HỦY
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-100 hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50">
                  <FaSave /> {saving ? 'ĐANG LƯU...' : 'LƯU LẠI'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Alert ── */}
        {msg.text && (
          <div className={cn('px-6 py-4 rounded-2xl text-sm font-bold border shadow-lg animate-bounce-in',
            msg.type === 'success' ? 'bg-emerald-50/90 border-emerald-200 text-emerald-700' : 'bg-rose-50/90 border-rose-200 text-rose-600')}>
            {msg.text}
          </div>
        )}

        {/* ── Dashboard Header (Profile Card) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={cn('lg:col-span-2 backdrop-blur-2xl rounded-[2.5rem] border shadow-2xl p-8 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group',
            isDark ? 'bg-[#1C1E28]/80 border-white/5' : 'bg-white/60 border-white')}>
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-linear-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-linear-to-br from-sky-400/10 to-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative shrink-0">
               <div className={cn('w-40 h-40 md:w-48 md:h-48 rounded-[3rem] p-2 shadow-2xl ring-1 relative group/avatar overflow-hidden transition-all',
                 isDark ? 'bg-[#16181F] ring-white/10' : 'bg-white ring-indigo-50')}>
                  <div className="w-full h-full rounded-[2.5rem] bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-6xl font-black shadow-inner overflow-hidden">
                    {profile.avatar
                      ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110" />
                      : profile.user_name?.substring(0, 2).toUpperCase()}
                  </div>
                  {editing && (
                    <div className="absolute inset-2 rounded-[2.5rem] bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                      <FaCamera className="text-white text-3xl" />
                    </div>
                  )}
               </div>
               {/* Level Badge Floating */}
               <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-2xl shadow-xl border border-indigo-50">
                  <div className="bg-linear-to-r from-indigo-600 to-purple-600 text-white px-4 py-1.5 rounded-xl font-black text-sm shadow-md">
                    LV. {profile.gamification.level}
                  </div>
               </div>
            </div>
            
            <div className="flex-1 text-center md:text-left z-10 space-y-4">
              <div>
                <h2 className={cn('text-4xl font-black tracking-tight', t.text)}>{profile.user_name}</h2>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                  <span className={cn('text-sm font-bold', t.sub)}>{profile.email}</span>
                  {profile.email_verified && <FaCheckCircle className="text-emerald-500 text-xs" />}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                {cefrBand && (
                  <div className={cn('px-4 py-2 rounded-2xl text-white font-black text-xs shadow-lg bg-linear-to-r', CEFR_COLORS[cefrBand] || 'from-indigo-500 to-purple-600')}>
                    IELTS {cefrBand}
                  </div>
                )}
                <div className={cn('px-4 py-2 rounded-2xl border font-black text-xs shadow-sm backdrop-blur-md',
                   isDark ? 'bg-white/5 border-white/10 text-indigo-400' : 'bg-white/80 border-indigo-100 text-indigo-600')}>
                    {levelLabel}
                </div>
                {profile.role === 'vip' && (
                  <div className="px-4 py-2 rounded-2xl bg-linear-to-r from-amber-200 via-yellow-400 to-orange-400 text-yellow-900 font-black text-xs shadow-lg border border-yellow-300 flex items-center gap-1.5 animate-pulse">
                    <FaStar /> VIP MEMBER
                  </div>
                )}
              </div>

              <div className={cn('pt-2 flex items-center justify-center md:justify-start gap-6 border-t', isDark ? 'border-white/10' : 'border-slate-100/50')}>
                <div className="text-center">
                   <p className="text-2xl font-black text-orange-500 drop-shadow-sm">{profile.gamification.streak}</p>
                   <p className={cn('text-[10px] font-black uppercase tracking-widest', t.sub)}>Streak 🔥</p>
                </div>
                <div className="text-center">
                   <p className="text-2xl font-black text-yellow-500 drop-shadow-sm">{profile.gamification.gold}</p>
                   <p className={cn('text-[10px] font-black uppercase tracking-widest', t.sub)}>Coins 🪙</p>
                </div>
                <div className="text-center">
                   <p className="text-2xl font-black text-indigo-500 drop-shadow-sm">{profile.gamification.exp}</p>
                   <p className={cn('text-[10px] font-black uppercase tracking-widest', t.sub)}>XP ✨</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] shadow-2xl p-8 text-white relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 group-hover:rotate-12 transition-transform duration-700">
                <FaTrophy className="text-9xl" />
             </div>
             <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                   <p className="text-xs font-black text-indigo-100 uppercase tracking-[0.2em] mb-1">Mục tiêu hiện tại</p>
                   <h3 className="text-2xl font-black leading-tight drop-shadow-md">
                      {GOAL_LABELS[profile.learning_preferences?.goal] || 'Hãy bắt đầu thiết lập lộ trình!'}
                   </h3>
                </div>
                <div className="mt-8 space-y-4">
                   <div className="flex justify-between items-end">
                      <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest opacity-80">Tiến trình Band</p>
                      <p className="text-xl font-black">{profile.current_band || '—'} <span className="text-sm opacity-60">/ {profile.learning_preferences?.target_band || '9.0'}</span></p>
                   </div>
                   <div className="h-4 bg-white/20 backdrop-blur-md rounded-full overflow-hidden p-1 shadow-inner">
                      <div className="h-full bg-linear-to-r from-yellow-300 via-orange-400 to-rose-400 rounded-full shadow-lg relative"
                         style={{ width: `${Math.min(100, ((profile.current_band || 0) / (profile.learning_preferences?.target_band || 9)) * 100)}%` }}>
                         <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </div>
                   </div>
                   <p className="text-[10px] font-bold text-center text-indigo-50/70 italic italic">"Cố gắng một chút mỗi ngày, thành công là điều sớm muộn!"</p>
                </div>
             </div>
          </div>
        </div>

        {/* ── Tabs Navigation ── */}
        <div className={cn('flex p-1.5 backdrop-blur-xl rounded-3xl border shadow-lg overflow-hidden', 
          isDark ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white')}>
          {[
            { key: 'info',     icon: <FaUser />,     label: 'TÀI KHOẢN' },
            { key: 'progress', icon: <FaChartBar />, label: 'TIẾN ĐỘ HỌC' },
            { key: 'goals',    icon: <FaBullseye />, label: 'LỘ TRÌNH AI' },
            { key: 'settings', icon: <FaCog />,      label: 'CÀI ĐẶT' },
          ].map(t_nav => (
            <button key={t_nav.key} onClick={() => setTab(t_nav.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-black tracking-widest transition-all duration-500',
                tab === t_nav.key 
                  ? (isDark ? 'bg-indigo-600 text-white shadow-xl scale-[1.02]' : 'bg-white text-indigo-600 shadow-xl shadow-indigo-100/50 scale-[1.02]')
                  : (isDark ? 'text-slate-500 hover:text-indigo-400 hover:bg-white/5' : 'text-slate-400 hover:text-indigo-500 hover:bg-white/40')
              )}>
              {t_nav.icon} {t_nav.label}
            </button>
          ))}
        </div>

        {/* ══ TAB CONTENT ══ */}
        <div className="min-h-[500px]">
          {tab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up items-stretch">
              <div className={cn('lg:col-span-2 backdrop-blur-2xl rounded-[2.5rem] border shadow-xl p-8 space-y-10 flex flex-col h-full', t.card)}>
                <section className="flex-1">
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                    <span className="w-8 h-1 bg-linear-to-r from-indigo-600 to-purple-600 rounded-full"></span> Thông tin cá nhân
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField icon={<FaUser />} label="HỌ VÀ TÊN" name="user_name" value={form.user_name} onChange={handleChange} disabled={!editing} placeholder="Họ tên của bạn" />
                    <InputField icon={<FaEnvelope />} label="EMAIL" name="email" value={profile.email} disabled={true} />
                    <InputField icon={<FaPhone />} label="SỐ ĐIỆN THOẠI" name="phone" value={form.phone} onChange={handleChange} disabled={!editing} />
                    <InputField icon={<FaCalendar />} label="NGÀY SINH" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} disabled={!editing} type="date" />
                    <InputField icon={<FaMapMarkerAlt />} label="ĐỊA CHỈ" name="address" value={form.address} onChange={handleChange} disabled={!editing} className="md:col-span-2" />
                  </div>
                </section>

                <section>
                   <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                    <span className="w-8 h-1 bg-linear-to-r from-indigo-600 to-purple-600 rounded-full"></span> Tiểu sử
                  </p>
                   <textarea name="bio" value={form.bio} onChange={handleChange} disabled={!editing} rows={4}
                    placeholder="Giới thiệu một chút về bản thân và niềm đam mê IELTS của bạn..."
                    className={cn('w-full px-6 py-4 rounded-3xl border text-sm font-medium outline-none transition-all shadow-inner placeholder-slate-500',
                      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white/60 border-indigo-50 text-slate-800',
                      editing && (isDark ? 'focus:ring-indigo-500/20 focus:ring-2 focus:border-indigo-500 focus:bg-white/10' : 'focus:ring-4 focus:ring-indigo-100 focus:border-cyan-300 focus:bg-white'),
                      !editing && 'cursor-not-allowed opacity-70')} />
                </section>
              </div>

              <div className="space-y-6 flex flex-col h-full">
                <div className={cn('backdrop-blur-2xl rounded-[2.5rem] border shadow-xl p-8 flex-1', t.card)}>
                   <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-6">Trạng thái Tài khoản</p>
                   <div className="space-y-4">
                     {[
                        { label: 'EMAIL',      v: profile.email_verified ? 'Đã xác thực' : 'Chưa xác thực', i: <FaCheckCircle />, c: profile.email_verified ? 'emerald' : 'rose' },
                        { label: 'THÀNH VIÊN',  v: profile.role === 'vip' ? 'Gói PREMIUM' : 'Gói BASIC',    i: <FaStar />,        c: profile.role === 'vip' ? 'amber' : 'indigo' },
                        { label: 'NGÀY THAM GIA',v: new Date(profile.created_at).toLocaleDateString(),      i: <FaClock />,       c: 'sky' }
                     ].map(item => (
                       <div key={item.label} className={cn('group p-4 rounded-[1.5rem] border transition-all',
                         isDark ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-white/60 border-white hover:border-indigo-200')}>
                         <p className={cn('text-[10px] font-black mb-1', t.sub)}>{item.label}</p>
                         <div className="flex items-center gap-2">
                            <span className={`text-${item.c}-500 text-sm`}>{item.i}</span>
                            <span className={cn('text-sm font-black', t.text)}>{item.v}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>

                <div className={cn('rounded-[2.5rem] border shadow-xl p-8 relative overflow-hidden flex-1 backdrop-blur-2xl', 
                  isDark ? 'bg-[#1C1E28] border-white/5' : 'bg-linear-to-br from-indigo-50 to-purple-50 border-white')}>
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <FaTrophy className="text-7xl text-indigo-600" />
                   </div>
                   <h4 className={cn('text-sm font-black uppercase tracking-widest mb-4', isDark ? 'text-indigo-400' : 'text-indigo-600')}>Mục tiêu sắp tới</h4>
                   <div className={cn('p-4 rounded-2xl shadow-sm border transition-all', isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-indigo-100')}>
                      <p className="text-[11px] font-bold text-slate-500 mb-2">TARGET BAND</p>
                      <p className="text-4xl font-black text-indigo-600 italic">{profile.learning_preferences?.target_band || 'NONE'}</p>
                   </div>
                   <p className="text-xs text-indigo-400 mt-4 italic">"Hành trình vạn dặm bắt đầu từ những bước chân đầu tiên."</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'progress' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<FaStar />}    label="LEVEL"  value={profile.gamification.level}           gradient="from-indigo-500 to-blue-600" />
                <StatCard icon={<FaFire />}    label="STREAK" value={`${profile.gamification.streak} NGÀY`} gradient="from-rose-500 to-orange-500" />
                <StatCard icon={<FaTrophy />}  label="TỔNG XP"value={profile.gamification.exp}             gradient="from-purple-500 to-indigo-600" />
                <StatCard icon={<FaCoins />}   label="COINS"  value={profile.gamification.gold}            gradient="from-amber-400 to-orange-500" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-xl p-8">
                   <div className="flex justify-between items-center mb-10">
                      <div>
                        <h3 className="text-2xl font-black text-slate-800">KẾT QUẢ ĐÁNH GIÁ THỰC TẾ</h3>
                        <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Dựa trên bài Placement Test & Lịch sử học</p>
                      </div>
                      <div className={cn('w-20 h-20 rounded-3xl flex flex-col items-center justify-center text-white font-black shadow-2xl skew-x-[-12deg]',
                         CEFR_COLORS[profile.placement_test_result?.cefr_level] || 'from-indigo-600 to-purple-600')}>
                         <span className="text-xs opacity-60">BAND</span>
                         <span className="text-2xl">{profile.placement_test_result?.cefr_level || '—'}</span>
                      </div>
                   </div>

                   {profile.placement_test_result ? (
                     <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           {[
                             { l: 'VOCAB & GRAMMAR', v: profile.placement_test_result.vocab_score,    m: 40, c: 'from-blue-400 to-indigo-500' },
                             { l: 'READING SKILL',   v: profile.placement_test_result.reading_score,  m: 35, c: 'from-purple-400 to-pink-500' },
                             { l: 'SPEAKING PROF.',  v: profile.placement_test_result.speaking_score, m: 25, c: 'from-emerald-400 to-teal-500' }
                           ].map(skill => (
                             <div key={skill.l} className="group p-5 rounded-3xl bg-white/60 border border-white hover:border-indigo-100 transition-all shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 mb-2">{skill.l}</p>
                                <div className="flex items-baseline gap-1">
                                   <span className="text-3xl font-black text-slate-800 italic">{skill.v}</span>
                                   <span className="text-xs font-bold text-slate-300">/ {skill.m}</span>
                                </div>
                                <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                   <div className={cn('h-full bg-linear-to-r rounded-full transition-all duration-1000', skill.c)} 
                                      style={{ width: `${(skill.v / skill.m) * 100}%` }} />
                                </div>
                             </div>
                           ))}
                        </div>
                        <button onClick={() => navigate('/placement-test')}
                          className="w-full py-4 rounded-3xl border-2 border-dashed border-indigo-200 text-indigo-500 font-black text-xs hover:bg-indigo-50/50 transition-all tracking-widest">
                          🔄 LÀM LẠI BÀI TEST TRÌNH ĐỘ (PLACEMENT TEST)
                        </button>
                      </div>
                   ) : (
                      <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                         <div className="text-6xl mb-6">🎯</div>
                         <p className="text-lg font-black text-slate-700">CHƯA CÓ KẾT QUẢ ĐÁNH GIÁ</p>
                         <p className="text-sm text-slate-500 mt-2 mb-8">Làm bài test ngay để được AI thiết lập lộ trình chuẩn cá nhân hóa!</p>
                         <button onClick={() => navigate('/placement-test')}
                            className="px-10 py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm shadow-xl shadow-indigo-100 hover:shadow-2xl hover:-translate-y-1 transition-all uppercase">
                            Bắt đầu Kiểm tra Trình độ
                         </button>
                      </div>
                   )}
                </div>

                <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-xl p-8 flex flex-col h-full">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-linear-to-br from-indigo-500 to-sky-500 rounded-[1rem] flex items-center justify-center shadow-inner ring-2 ring-white">
                        <FaClock className="text-white text-xl" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">HOẠT ĐỘNG GẦN ĐÂY</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiến độ cày cuốc thực tế</p>
                      </div>
                   </div>
                   <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                     {recentScores.length > 0 ? recentScores.map((score, i) => (
                       <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-white hover:bg-white hover:shadow-md transition-all group">
                         <div>
                           <p className="text-xs font-black text-slate-700">{score.topic || score.type}</p>
                           <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                             <FaCheckCircle className="text-emerald-400" /> {new Date(score.date).toLocaleDateString()}
                           </p>
                         </div>
                         <div className="text-right">
                           <p className="text-lg font-black bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent italic">{score.score}</p>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                         </div>
                       </div>
                     )) : (
                       <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                         <span className="text-3xl mb-3">🏃‍♂️</span>
                         <p className="text-sm font-bold text-slate-600">Bạn chưa làm bài nào gần đây, học ngay thôi!</p>
                       </div>
                     )}
                   </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'goals' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
              <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-xl p-8 md:p-12">
                 <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-linear-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                       <FaBullseye className="text-2xl" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">THIẾT LẬP MỤC TIÊU AI</h3>
                 </div>

                 <div className="space-y-12">
                   <section>
                      <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-6">MỤC TIÊU ƯU TIÊN</p>
                      {editing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(GOAL_LABELS).map(([key, label]) => {
                            const active = form.goal === key;
                            return (
                              <button key={key} onClick={() => setForm(f => ({ ...f, goal: key }))}
                                className={cn('px-6 py-5 rounded-[2rem] border-2 text-sm font-black text-left transition-all duration-300',
                                  active 
                                    ? 'border-transparent bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-[1.05]' 
                                    : 'border-white bg-white/80 text-slate-500 hover:border-indigo-200 hover:shadow-lg')}>
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="group p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-100 flex items-center justify-between relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-8 opacity-10 scale-[2.5]">
                              <FaBullseye />
                           </div>
                           <div className="relative z-10">
                              <p className="text-xs font-black text-indigo-100 mb-2 opacity-80 uppercase tracking-widest">Hiện tại</p>
                              <h4 className="text-3xl font-black italic">{GOAL_LABELS[profile.learning_preferences?.goal] || 'CHƯA ĐẶT MỤC TIÊU'}</h4>
                           </div>
                           <button onClick={() => setEditing(true)} className="relative z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white hover:text-indigo-600 transition-all shadow-lg">
                              <FaEdit />
                           </button>
                        </div>
                      )}
                   </section>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <section>
                        <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-6">KỸ NĂNG TRỌNG TÂM</p>
                        <div className="grid grid-cols-2 gap-3">
                           {['writing','speaking','reading','listening'].map(skill => {
                              const active = (editing ? form.focus_skills : profile.learning_preferences?.focus_skills || []).includes(skill);
                              return (
                                <button key={skill} onClick={() => editing && toggleSkill(skill)}
                                  className={cn('flex items-center gap-3 p-4 rounded-2xl border-2 text-xs font-black transition-all duration-300',
                                    active 
                                      ? 'border-transparent bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-xl' 
                                      : 'border-white bg-white/80 text-slate-500',
                                    editing ? 'cursor-pointer hover:border-indigo-200 hover:shadow-lg' : 'cursor-default')}>
                                  <span className="text-lg">{SKILL_ICONS[skill]}</span> {skill.toUpperCase()}
                                </button>
                              );
                           })}
                        </div>
                      </section>

                      <section>
                        <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-6">LỊCH HỌC TRÙNG KHỚP</p>
                        <div className="flex gap-2.5 flex-wrap">
                          {DAYS.map(day => {
                            const active = (editing ? form.preferred_study_days : profile.learning_preferences?.preferred_study_days || []).includes(day);
                            return (
                              <button key={day} onClick={() => editing && toggleDay(day)}
                                className={cn('w-12 h-12 rounded-2xl border-2 text-[11px] font-black transition-all duration-300 flex items-center justify-center',
                                  active 
                                    ? 'border-transparent bg-indigo-600 text-white shadow-xl scale-[1.1]' 
                                    : 'border-white bg-white/80 text-slate-400',
                                  editing ? 'cursor-pointer hover:border-indigo-200 hover:shadow-lg' : 'cursor-default')}>
                                {DAY_LABELS[day]}
                              </button>
                            );
                          })}
                        </div>
                      </section>
                   </div>
                 </div>

                 {!editing && (
                   <button onClick={() => setEditing(true)}
                    className="mt-16 w-full py-5 rounded-[2rem] bg-indigo-50 border-2 border-dashed border-indigo-200 text-indigo-600 font-black text-sm hover:bg-indigo-100 transition-all uppercase tracking-widest shadow-inner">
                    ✏️ Tùy chỉnh tham số Lộ trình AI của tôi
                   </button>
                 )}
              </div>
            </div>
          )}

          {tab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
              {/* AI & System Settings */}
              <div className="lg:col-span-2 space-y-6">
                <div className={cn('backdrop-blur-2xl rounded-[2.5rem] border shadow-xl p-8', t.card)}>
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                    <span className="w-8 h-1 bg-linear-to-r from-indigo-600 to-purple-600 rounded-full"></span> Tùy chỉnh AI
                  </p>
                  
                  <div className="space-y-10">
                    <section>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Giọng nói AI (AI Voice)</label>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { key: 'female', label: 'Giọng Nữ (Hỗ trợ tốt)', i: '👩‍💼' },
                          { key: 'male',   label: 'Giọng Nam',        i: '👨‍💼' }
                        ].map(voice => (
                          <button key={voice.key} 
                            onClick={() => handleUpdateSettings({ ...settings, ai_voice: voice.key })}
                            className={cn('p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all',
                              settings.ai_voice === voice.key 
                                ? (isDark ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 shadow-lg' : 'border-indigo-500 bg-indigo-50/50 text-indigo-600 shadow-lg')
                                : (isDark ? 'border-white/5 bg-white/5 text-slate-400 hover:border-white/10' : 'border-white bg-white/50 text-slate-500 hover:border-indigo-100'))}>
                            <span className="text-2xl">{voice.i}</span>
                            <span className="text-xs font-bold">{voice.label}</span>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section>
                      <div className="flex justify-between items-center mb-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tốc độ đọc (AI Speed)</label>
                        <span className="text-sm font-black text-indigo-600 italic">x{settings.ai_speed.toFixed(1)}</span>
                      </div>
                      <input type="range" min="0.5" max="2.0" step="0.1" 
                        value={settings.ai_speed}
                        onChange={(e) => handleUpdateSettings({ ...settings, ai_speed: parseFloat(e.target.value) })}
                        className={cn('w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-600', isDark ? 'bg-white/10' : 'bg-indigo-100')} />
                      <div className={cn('flex justify-between mt-2 text-[10px] font-bold', t.sub)}>
                        <span>Chậm</span>
                        <span>Bình thường</span>
                        <span>Nhanh</span>
                      </div>
                    </section>

                    <section className={cn('p-6 rounded-3xl border flex items-center justify-between',
                      isDark ? 'bg-white/5 border-white/10' : 'bg-indigo-50/50 border-indigo-100')}>
                      <div>
                        <p className={cn('text-sm font-black', isDark ? 'text-indigo-400' : 'text-indigo-700')}>Thông báo học tập</p>
                        <p className={cn('text-xs font-medium', isDark ? 'text-slate-500' : 'text-indigo-500/70')}>Nhận nhắc nhở luyện tập hàng ngày để giữ Streak</p>
                      </div>
                      <button 
                        onClick={() => handleUpdateSettings({ ...settings, notifications_enabled: !settings.notifications_enabled })}
                        className={cn('w-14 h-8 rounded-full transition-all relative p-1', 
                          settings.notifications_enabled ? 'bg-indigo-600' : (isDark ? 'bg-slate-700' : 'bg-slate-300'))}>
                        <div className={cn('w-6 h-6 bg-white rounded-full shadow-md transition-all', 
                          settings.notifications_enabled ? 'translate-x-6' : 'translate-x-0')} />
                      </button>
                    </section>
                  </div>
                </div>

                {/* Change Password */}
                <div className={cn('backdrop-blur-2xl rounded-[2.5rem] border shadow-xl p-8', t.card)}>
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                    <span className="w-8 h-1 bg-linear-to-r from-indigo-600 to-purple-600 rounded-full"></span> Bảo mật & Mật khẩu
                  </p>
                  <form onSubmit={handleChangePwd} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <InputField icon={<FaCog />} label="MẬT KHẨU CŨ" type="password" 
                        value={passwords.old_password} 
                        onChange={(e) => setPasswords({...passwords, old_password: e.target.value})} 
                        placeholder="••••••••" />
                       <div className="hidden md:block"></div>
                       <InputField icon={<FaCog />} label="MẬT KHẨU MỚI" type="password" 
                        value={passwords.new_password} 
                        onChange={(e) => setPasswords({...passwords, new_password: e.target.value})} 
                        placeholder="••••••••" />
                       <InputField icon={<FaCog />} label="XÁC NHẬN MẬT KHẨU" type="password" 
                        value={passwords.confirm_password} 
                        onChange={(e) => setPasswords({...passwords, confirm_password: e.target.value})} 
                        placeholder="••••••••" />
                    </div>
                    <button type="submit" disabled={changingPwd}
                      className="mt-4 px-8 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50">
                      {changingPwd ? 'ĐANG CẬP NHẬT...' : 'ĐÔI MẬT KHẨU'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Sidebar: Subscription & Info */}
              <div className="space-y-6">
                <div className="bg-linear-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] shadow-2xl p-8 text-white relative overflow-hidden">
                   <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 scale-150">
                      <FaStar className="text-9xl" />
                   </div>
                   <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Gói dịch vụ hiện tại</p>
                   <h3 className="text-2xl font-black italic tracking-tight">{profile.role === 'vip' ? 'PREMIUM ACCESS' : 'FREE EDITION'}</h3>
                   
                   <div className="mt-8 space-y-4">
                      {profile.role === 'vip' ? (
                        <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20">
                          <p className="text-[10px] font-bold opacity-70">NGÀY HẾT HẠN</p>
                          <p className="text-lg font-black">{new Date(profile.vip_expire_at).toLocaleDateString()}</p>
                        </div>
                      ) : (
                        <button onClick={() => navigate('/pricing')}
                          className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs shadow-lg hover:scale-[1.02] transition-all">
                          NÂNG CẤP NGAY 🚀
                        </button>
                      )}
                   </div>
                </div>

                <div className={cn('backdrop-blur-2xl rounded-[2.5rem] border shadow-xl p-8', t.card)}>
                   <p className={cn('text-xs font-black uppercase tracking-widest mb-6', t.sub)}>Liên kết hệ thống</p>
                   <div className="space-y-3">
                      <div className={cn('flex items-center justify-between p-4 rounded-2xl border',
                        isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-indigo-50')}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-black shadow-sm">G</div>
                          <span className={cn('text-sm font-bold', t.text)}>Google Account</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">ĐÃ LIÊN KẾT</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}