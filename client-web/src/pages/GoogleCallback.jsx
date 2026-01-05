import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAccessToken, fetchUserInfo } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('Google login error:', error);
        navigate('/login?error=' + error);
        return;
      }

      if (token) {
        // Lưu access token
        setAccessToken(token);
        
        // Fetch user info
        try {
          await fetchUserInfo();
          navigate('/dashboard');
        } catch (err) {
          console.error('Failed to fetch user info:', err);
          navigate('/login?error=fetch_user_failed');
        }
      } else {
        navigate('/login?error=no_token');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setAccessToken, fetchUserInfo]);

  return (
    <div className="min-h-screen bg-[#1a1d29] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <p className="mt-4 text-white">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}
