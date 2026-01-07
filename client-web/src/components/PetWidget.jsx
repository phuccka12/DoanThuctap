import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { FaHeart, FaDrumstickBite, FaGift } from 'react-icons/fa';
// import Lottie from 'lottie-react'; // Temporarily disabled

export default function PetWidget({ theme = {} }) {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  // const [lottieData, setLottieData] = useState(null); // Disabled
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        console.log('[PetWidget] Loading pet data...');
        const res = await axiosInstance.get('/pet');
        console.log('[PetWidget] API response:', res.data);
        console.log('[PetWidget] Response keys:', res.data ? Object.keys(res.data) : 'null');
        
        // Check response data first, before checking mounted
        if (!res.data) {
          console.error('[PetWidget] No response data');
          return;
        }

        // Check if pet data exists in response (could be res.data.pet or res.data itself)
        const petData = res.data.pet || res.data;
        console.log('[PetWidget] Pet data:', petData);
        
        if (!petData || !petData.user) {
          console.error('[PetWidget] Invalid pet data structure:', petData);
          return;
        }

        // Only update state if component is still mounted
        if (!mounted) {
          console.log('[PetWidget] Component unmounted, skipping state update');
          return;
        }

        console.log('[PetWidget] Setting pet:', petData);
        setPet(petData);
        
        // Lottie animation loading disabled temporarily
        // try {
        //   const lottieRes = await fetch('/cat-pet.json');
        //   const lottieJson = await lottieRes.json();
        //   if (mounted) {
        //     console.log('[PetWidget] Lottie loaded');
        //     setLottieData(lottieJson);
        //   }
        // } catch (lottieErr) {
        //   console.warn('[PetWidget] Lottie load failed:', lottieErr);
        // }
      } catch (err) {
        console.error('[PetWidget] Load pet error:', err);
        console.error('[PetWidget] Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        if (mounted) {
          setError(err.message || 'Failed to load pet');
        }
      } finally {
        if (mounted) {
          console.log('[PetWidget] Setting loading = false');
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      mounted = false;
      console.log('[PetWidget] Component unmounting');
    };
  }, []);

  const handleCheckin = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await axiosInstance.post('/pet/checkin');
      setPet(res.data.pet);
    } catch (err) {
      console.error('Checkin error', err);
      alert(err.response?.data?.message || 'Check-in failed');
    } finally {
      setBusy(false);
    }
  };

  const handleFeed = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // simple feed: buy food with coins if no inventory
      const res = await axiosInstance.post('/pet/feed', { qty: 1 });
      setPet(res.data.pet);
    } catch (err) {
      console.error('Feed error', err);
      alert(err.response?.data?.message || 'Feed failed');
    } finally {
      setBusy(false);
    }
  };

  const handlePlay = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await axiosInstance.post('/pet/play');
      setPet(res.data.pet);
    } catch (err) {
      console.error('Play error', err);
      const msg = err.response?.data?.message || 'Play failed';
      if (err.response?.status === 429 && err.response?.data?.retryAfterMs) {
        const sec = Math.ceil(err.response.data.retryAfterMs / 1000);
        alert(msg + '. Please wait ' + sec + 's');
      } else {
        alert(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className={"rounded-2xl p-4 " + (theme?.card || "bg-white")}>
        <div className="text-center py-4">Loading pet…</div>
      </div>
    );
  }
  
  // Show error or mock pet if API failed
  if (!pet) {
    return (
      <div className={"rounded-2xl border p-4 " + (theme?.card || "bg-white") + " " + (theme?.border || "border-purple-100")}>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00CEC9] flex items-center justify-center shadow-lg overflow-hidden relative">
            <span className="text-white text-5xl">🐱</span>
          </div>
          <div className="flex-1">
            <div className={"font-bold text-lg " + (theme?.text || 'text-gray-800')}>Your Pet</div>
            <div className={"text-sm " + (theme?.sub || 'text-gray-600')}>Level 1 • Streak 0d</div>
            <div className="mt-2 text-sm text-red-500">⚠️ {error || 'API Connection Failed'}</div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500 text-center">
          Please check backend server or login again
        </div>
      </div>
    );
  }

  // Safe check for today's checkin
  let checkedToday = false;
  try {
    checkedToday = pet?.lastCheckinAt && 
                   new Date(pet.lastCheckinAt).toDateString() === new Date().toDateString();
  } catch (dateErr) {
    console.warn('[PetWidget] Date parse error:', dateErr);
  }

  // Ensure pet data is valid before rendering
  if (!pet || !pet.user) {
    return (
      <div className={"rounded-2xl border p-4 " + (theme?.card || "bg-white")}>
        <div className="text-center text-red-500">Invalid pet data</div>
      </div>
    );
  }

  return (
    <div className={"rounded-2xl border p-4 " + (theme?.card || "bg-white") + " " + (theme?.border || "border-purple-100")}>
      <div className="flex items-center gap-4">
        {/* Pet Avatar with Emoji */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#00CEC9] flex items-center justify-center shadow-lg overflow-hidden relative">
          <span className="text-5xl animate-bounce">
            {pet.petType === 'cat' ? '🐱' : pet.petType === 'dog' ? '🐶' : '🐾'}
          </span>
        </div>
        <div className="flex-1">
          <div className={"font-bold text-lg " + (theme?.text || 'text-gray-800')}>
            {pet.petType || 'Buddy'}
          </div>
          <div className={"text-sm " + (theme?.sub || 'text-gray-600')}>
            Level {pet.level || 1} • Streak {pet.streakCount || 0}d
          </div>
          <div className={"mt-2 text-sm " + (theme?.sub || 'text-gray-600')}>
            Hunger: {pet.hunger || 0}% • Happiness: {pet.happiness || 0}%
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button onClick={handleCheckin}
          disabled={busy || checkedToday}
          className={"flex-1 px-3 py-2 rounded-xl text-white font-semibold " + (checkedToday ? 'opacity-60 cursor-not-allowed bg-gray-300' : 'bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9]')}
        >
          {checkedToday ? 'Checked in' : (busy ? 'Checking…' : 'Check-in')}
        </button>
        <button className="px-3 py-2 rounded-xl border flex items-center gap-2" onClick={handleFeed} disabled={busy}>
          <FaDrumstickBite /> {busy ? 'Feeding…' : 'Feed'}
        </button>
        <button className="px-3 py-2 rounded-xl border flex items-center gap-2" onClick={handlePlay} disabled={busy}>
          <FaHeart /> {busy ? 'Playing…' : 'Play'}
        </button>
      </div>
    </div>
  );
}
