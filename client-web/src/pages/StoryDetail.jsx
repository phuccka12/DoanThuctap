import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { cn, theme, darkTheme } from '../utils/dashboardTheme';
import { getStoryById, getStoryProgress } from '../services/storyService';
import LearnLayout from '../components/learn/LearnLayout';
import LessonIntro from '../components/shared/LessonIntro';
import LoadingCat from '../components/shared/LoadingCat';
import { FaBookOpen, FaGamepad, FaScroll, FaChevronRight } from 'react-icons/fa';

export default function StoryDetail() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const t = isDark ? darkTheme : theme;

  const [story, setStory] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const [storyRes, progressRes] = await Promise.all([
          getStoryById(storyId),
          getStoryProgress(storyId)
        ]);
        setStory(storyRes.data.data);
        setProgress(progressRes.data.data || []);
      } catch (err) {
        console.error('[StoryDetail] fetchData:', err);
        navigate('/stories');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [storyId, navigate]);

  if (loading) {
    return (
      <LearnLayout breadcrumbs={[{ label: 'Câu chuyện', path: '/stories' }]}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingCat size={250} text="Đang chuẩn bị cuốn truyện cho bạn..." />
        </div>
      </LearnLayout>
    );
  }

  if (!story) return null;

  const completedCount = progress.filter(p => p.isComplete).length;
  const nextPart = Math.min(completedCount + 1, story.total_parts || 1);

  const handleStart = () => {
    navigate(`/stories/${story._id}/parts/${nextPart}`);
  };

  const THEME_LABELS = {
    daily_life: 'Cuộc sống hàng ngày',
    travel: 'Du lịch & Khám phá',
    mystery: 'Bí ẩn & Trinh thám',
    adventure: 'Phiêu lưu & Hành động',
    business: 'Kinh doanh & Sự nghiệp',
    romance: 'Tình cảm & Lãng mạn',
    sci_fi: 'Khoa học viễn tưởng',
    other: 'Chủ đề khác'
  };

  return (
    <LearnLayout breadcrumbs={[
      { label: 'Câu chuyện', path: '/stories' },
      { label: story.title }
    ]}>
      <div className="py-6">
        <LessonIntro
          title={story.title}
          description={story.description}
          level={story.level}
          type="story"
          isDark={isDark}
          theme={t}
          onStart={handleStart}
          stats={[
            { 
              icon: <FaScroll />, 
              label: 'Thời lượng', 
              sub: `${story.total_parts} chương truyện tiếng Anh kịch tính.`, 
              type: 'Hành trình' 
            },
            { 
              icon: <FaGamepad />, 
              label: 'Lối chơi', 
              sub: 'Dịch thuật tương tác, nhận phản hồi ngay lập tức từ AI.', 
              type: 'RPG Style' 
            },
            { 
              icon: <FaBookOpen />, 
              label: 'Thể loại', 
              sub: `${THEME_LABELS[story.theme] || 'Chủ đề đa dạng'}.`, 
              type: 'Chủ đề' 
            }
          ]}
          tip="Đọc kỹ ngữ cảnh của câu chuyện để lựa chọn từ vựng phù hợp nhất. AI sẽ giúp bạn tinh chỉnh bản dịch!"
        />

        {/* Chapters list section - Simplified aligned with Intro */}
        <div className="max-w-3xl mx-auto mt-10 space-y-5 px-4">
          <div className="flex items-center justify-between">
            <h3 className={cn('text-lg font-black uppercase tracking-widest', t.text)}>Danh sách chương</h3>
            <span className={cn('text-xs font-bold px-3 py-1 rounded-full', isDark ? 'bg-white/5 text-gray-500' : 'bg-slate-100 text-slate-400')}>
              {completedCount} / {story.total_parts} hoàn thành
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {(story.parts || []).map((part, idx) => {
              const isLocked = idx + 1 > nextPart;
              const isDone = idx + 1 <= completedCount;
              
              return (
                <button
                  key={idx}
                  disabled={isLocked}
                  onClick={() => navigate(`/stories/${story._id}/parts/${idx + 1}`)}
                  className={cn(
                    'flex items-center gap-4 p-5 rounded-2xl border transition-all text-left',
                    isLocked 
                      ? 'opacity-40 grayscale cursor-not-allowed'
                      : isDark 
                        ? 'bg-white/5 border-white/10 hover:border-indigo-500/50 hover:bg-white/8'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-lg'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm',
                    isDone ? 'bg-emerald-500 text-white' : isDark ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                  )}>
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn('font-bold text-sm truncate uppercase tracking-wide', t.text)}>
                      {part.title || `Chương ${idx + 1}`}
                    </h4>
                    <p className={cn('text-[10px] font-bold uppercase tracking-widest opacity-40', t.sub)}>
                      Phần thưởng: {part.xp_reward} EXP · {part.coins_reward} Coins
                    </p>
                  </div>
                  {!isLocked && <FaChevronRight className="opacity-20" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </LearnLayout>
  );
}
