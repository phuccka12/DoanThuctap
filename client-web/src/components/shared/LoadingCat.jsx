import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const LoadingCat = ({ size = 200, text = "AI đang suy nghĩ..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div style={{ width: size, height: size }}>
        <DotLottieReact
          src="https://lottie.host/857bd51e-01ca-4739-895f-aba89dd2d06c/viGSFo9geF.lottie"
          loop
          autoplay
        />
      </div>
      {text && (
        <span className="mt-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] animate-pulse text-center">
          {text}
        </span>
      )}
    </div>
  );
};

export default LoadingCat;
