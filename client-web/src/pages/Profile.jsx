import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosConfig';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendar,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaEdit,
  FaSave,
  FaTimes,
  FaCamera,
  FaAward,
  FaFire,
  FaTrophy,
} from 'react-icons/fa';

const cn = (...c) => c.filter(Boolean).join(' ');

const theme = {
  page: 'bg-gradient-to-br from-purple-50 via-white to-violet-50',
  card: 'bg-white shadow-md',
  border: 'border-purple-100',
  text: 'text-gray-800',
  sub: 'text-gray-600',
  input: 'bg-white border-purple-200',
  hover: 'hover:bg-purple-50',
  accent: 'text-[#6C5CE7]',
  accentBg: 'bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9]',
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, fetchUserInfo } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [profileData, setProfileData] = useState({
    user_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    current_band: null,
    target_band: null,
    bio: '',
    avatar: null,
  });

  const [stats, setStats] = useState({
    streak: 0,
    totalXP: 0,
    level: 1,
    testsCompleted: 0,
    studyTime: 0,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('http://localhost:5000/api/auth/me');
      const userData = response.data.user;
      
      setProfileData({
        user_name: userData.user_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        date_of_birth: userData.date_of_birth || '',
        address: userData.address || '',
        current_band: userData.current_band || null,
        target_band: userData.target_band || null,
        bio: userData.bio || '',
        avatar: userData.avatar || null,
      });

      setStats({
        streak: userData.gamification_data?.streak || 0,
        totalXP: userData.gamification_data?.exp || 0,
        level: userData.gamification_data?.level || 1,
        testsCompleted: userData.tests_completed || 0,
        studyTime: userData.total_study_time || 0,
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Không thể tải thông tin profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await axiosInstance.put('http://localhost:5000/api/user/profile', profileData);
      
      setSuccess('Cập nhật profile thành công!');
      setEditing(false);
      
      // Refresh user info in context
      await fetchUserInfo();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    fetchProfile(); // Reset to original data
  };

  if (loading) {
    return (
      <div className={cn('min-h-screen', theme.page, 'flex items-center justify-center')}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#6C5CE7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-700">Đang tải profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen', theme.page, 'py-8 px-4')}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={cn('text-3xl font-bold', theme.text)}>Hồ sơ cá nhân</h1>
            <p className={cn('text-sm mt-1', theme.sub)}>Quản lý thông tin và cài đặt tài khoản</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-xl border border-purple-200 text-gray-600 hover:bg-purple-50 hover:text-[#6C5CE7] transition"
          >
            ← Quay lại
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-xl">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            {/* Avatar & Basic Info */}
            <div className={cn('rounded-2xl border p-6', theme.border, theme.card)}>
              <div className="text-center">
                {/* Avatar */}
                <div className="relative inline-block mb-4">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00CEC9] flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                    {profileData.avatar ? (
                      <img
                        src={profileData.avatar}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      profileData.user_name?.substring(0, 2).toUpperCase() || 'U'
                    )}
                  </div>
                  {editing && (
                    <button className="absolute bottom-0 right-0 w-10 h-10 bg-[#6C5CE7] rounded-full flex items-center justify-center text-white hover:bg-[#8E44AD] transition shadow-lg">
                      <FaCamera />
                    </button>
                  )}
                </div>

                {/* Name & Email */}
                <h2 className={cn('text-2xl font-bold', theme.text)}>{profileData.user_name}</h2>
                <p className={cn('text-sm mt-1', theme.sub)}>{profileData.email}</p>

                {/* Band Score */}
                <div className="mt-4 flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className={cn('text-2xl font-bold', theme.text)}>
                      {profileData.current_band || '-'}
                    </div>
                    <div className={cn('text-xs', theme.sub)}>Band hiện tại</div>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div className="text-center">
                    <div className={cn('text-2xl font-bold', theme.accent)}>
                      {profileData.target_band || '-'}
                    </div>
                    <div className={cn('text-xs', theme.sub)}>Mục tiêu</div>
                  </div>
                </div>

                {/* Edit Button */}
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className={cn(
                      'mt-6 w-full py-3 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2',
                      'bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] hover:from-[#8E44AD] hover:to-[#00CEC9] shadow-lg'
                    )}
                  >
                    <FaEdit /> Chỉnh sửa profile
                  </button>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div className={cn('rounded-2xl border p-6', theme.border, theme.card)}>
              <h3 className={cn('text-lg font-bold mb-4', theme.text)}>Thống kê</h3>
              <div className="space-y-4">
                <StatItem icon={<FaFire className="text-orange-500" />} label="Streak" value={`${stats.streak} ngày`} />
                <StatItem icon={<FaTrophy className="text-yellow-500" />} label="Level" value={stats.level} />
                <StatItem icon={<FaAward className="text-purple-500" />} label="Tổng XP" value={stats.totalXP} />
                <StatItem icon={<FaGraduationCap className="text-blue-500" />} label="Bài test" value={stats.testsCompleted} />
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Info */}
          <div className="lg:col-span-2">
            <div className={cn('rounded-2xl border p-6', theme.border, theme.card)}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={cn('text-xl font-bold', theme.text)}>Thông tin chi tiết</h3>
                {editing && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={cn(
                        'px-4 py-2 text-white font-semibold rounded-xl transition flex items-center gap-2',
                        'bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] hover:from-[#8E44AD] hover:to-[#00CEC9] shadow-lg',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      <FaSave /> {saving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 rounded-xl border border-purple-200 text-gray-600 hover:bg-purple-50 hover:text-[#6C5CE7] transition flex items-center gap-2"
                    >
                      <FaTimes /> Hủy
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Personal Info */}
                <div>
                  <h4 className={cn('text-sm font-semibold mb-4 uppercase tracking-wide', theme.sub)}>
                    Thông tin cá nhân
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      icon={<FaUser />}
                      label="Họ và tên"
                      name="user_name"
                      value={profileData.user_name}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                    <InputField
                      icon={<FaEnvelope />}
                      label="Email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleChange}
                      disabled={true} // Email không cho sửa
                    />
                    <InputField
                      icon={<FaPhone />}
                      label="Số điện thoại"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="0123456789"
                    />
                    <InputField
                      icon={<FaCalendar />}
                      label="Ngày sinh"
                      name="date_of_birth"
                      type="date"
                      value={profileData.date_of_birth}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <InputField
                    icon={<FaMapMarkerAlt />}
                    label="Địa chỉ"
                    name="address"
                    value={profileData.address}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Thành phố, Quốc gia"
                  />
                </div>

                {/* IELTS Goals */}
                <div>
                  <h4 className={cn('text-sm font-semibold mb-4 uppercase tracking-wide', theme.sub)}>
                    Mục tiêu IELTS
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      icon={<FaGraduationCap />}
                      label="Band hiện tại"
                      name="current_band"
                      type="number"
                      step="0.5"
                      min="0"
                      max="9"
                      value={profileData.current_band || ''}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="6.5"
                    />
                    <InputField
                      icon={<FaTrophy />}
                      label="Band mục tiêu"
                      name="target_band"
                      type="number"
                      step="0.5"
                      min="0"
                      max="9"
                      value={profileData.target_band || ''}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="7.5"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className={cn('block text-sm font-medium mb-2', theme.text)}>
                    Giới thiệu bản thân
                  </label>
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleChange}
                    disabled={!editing}
                    rows={4}
                    placeholder="Viết vài dòng về bản thân..."
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border transition-colors',
                      theme.input,
                      theme.border,
                      'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 focus:border-[#6C5CE7]',
                      !editing && 'cursor-not-allowed opacity-60 bg-gray-50'
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function InputField({ icon, label, disabled, ...props }) {
  return (
    <div>
      <label className={cn('block text-sm font-medium mb-2', theme.text)}>{label}</label>
      <div className="relative">
        <div className={cn('absolute left-3 top-1/2 -translate-y-1/2', disabled ? 'text-gray-400' : theme.sub)}>
          {icon}
        </div>
        <input
          {...props}
          className={cn(
            'w-full pl-10 pr-4 py-3 rounded-xl border transition-colors',
            theme.input,
            theme.border,
            'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 focus:border-[#6C5CE7]',
            disabled && 'cursor-not-allowed opacity-60 bg-gray-50'
          )}
        />
      </div>
    </div>
  );
}

function StatItem({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-xl">{icon}</div>
        <span className={cn('text-sm', theme.sub)}>{label}</span>
      </div>
      <span className={cn('text-lg font-bold', theme.text)}>{value}</span>
    </div>
  );
}
