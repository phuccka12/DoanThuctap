import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 flex items-center justify-center px-4">
      <div className="max-w-xl w-full text-center">
        {/* 404 Cat Animation using DotLottieReact */}
        <div className="mb-8 flex justify-center">
          <div className="w-80 h-80 md:w-[500px] md:h-[500px]">
            <DotLottieReact
              src="/404-cat-pink.json"
              loop
              autoplay
            />
          </div>
        </div>
        <div className="mt-12 text-sm text-gray-500">
          <p>Error Code: 404 • Page Not Found</p>
        </div>
      </div>
    </div>
  );
}
