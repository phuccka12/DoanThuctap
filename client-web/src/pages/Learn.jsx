import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { cn, theme, darkTheme } from '../utils/dashboardTheme';
import { getTopics, getCurrentPlan, generatePlan } from '../services/learningService';
import LearnLayout from '../components/learn/LearnLayout';
import {
  FaLock, FaPlay, FaCalendarAlt, FaStar, FaSpinner, FaBookOpen,
  FaRedo, FaCheckCircle, FaArrowRight, FaFire, FaTrophy, FaBrain,
  FaSearch, FaChevronRight, FaGraduationCap,
} from 'react-icons/fa';
import ElasticTimeline from '../components/learn/ElasticTimeline';
import LoadingCat from '../components/shared/LoadingCat';

const LEVEL_META = {
  beginner: { label: 'Cơ bản', color: 'bg-emerald-500/15 text-emerald-600 border border-emerald-400/40' },
  intermediate: { label: 'Trung cấp', color: 'bg-amber-500/15   text-amber-600   border border-amber-400/40' },
  advanced: { label: 'Nâng cao', color: 'bg-rose-500/15    text-rose-600    border border-rose-400/40' },
};
const DAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const SKILL_META = {
  reading: { icon: '📖', label: 'Đọc', color: 'text-blue-400', bg: 'bg-blue-500/15    border-blue-400/30' },
  listening: { icon: '🎧', label: 'Nghe', color: 'text-purple-400', bg: 'bg-purple-500/15  border-purple-400/30' },
  vocabulary: { icon: '📝', label: 'Từ vựng', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-400/30' },
  writing: { icon: '✍️', label: 'Viết', color: 'text-yellow-400', bg: 'bg-yellow-500/15  border-yellow-400/30' },
  speaking: { icon: '🎙️', label: 'Nói', color: 'text-rose-400', bg: 'bg-rose-500/15    border-rose-400/30' },
  quiz: { icon: '🧩', label: 'Quiz', color: 'text-orange-400', bg: 'bg-orange-500/15  border-orange-400/30' },
  video: { icon: '🎬', label: 'Video', color: 'text-sky-400', bg: 'bg-sky-500/15     border-sky-400/30' },
  general: { icon: '📚', label: 'Học', color: 'text-gray-400', bg: 'bg-gray-500/10    border-gray-400/20' },
};
const getSkillMeta = s => SKILL_META[s] || SKILL_META.general;

export default function Learn() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const t = isDark ? darkTheme : theme;

  const [topics, setTopics] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('topics');
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  useEffect(() => {
    Promise.all([
      getTopics().then(r => setTopics(r.data.data || [])),
      getCurrentPlan().then(r => setPlan(r.data.data)).catch(() => { }),
    ]).finally(() => setLoading(false));
  }, []);

  const handleGeneratePlan = async () => {
    setPlanLoading(true);
    try {
      const res = await generatePlan();
      setPlan(res.data.data);
      setActiveTab('plan');
    } catch (err) {
      console.error('[Learn] generatePlan error:', err);
      if (err.response?.status === 403) {
        alert(err.response.data.message || 'Bạn cần nâng cấp gói cước để sử dụng tính năng này! 🚀');
      } else {
        alert('Có lỗi xảy ra khi tạo lộ trình. Vui lòng thử lại sau!');
      }
    } finally {
      setPlanLoading(false);
    }
  };

  const completedTopics = topics.filter(tp => (tp.progress ?? 0) === 100).length;
  const inProgressTopics = topics.filter(tp => (tp.progress ?? 0) > 0 && (tp.progress ?? 0) < 100).length;

  const filteredTopics = topics.filter(topic => {
    const matchSearch = !search || topic.name?.toLowerCase().includes(search.toLowerCase()) || topic.description?.toLowerCase().includes(search.toLowerCase());
    const matchLevel = filterLevel === 'all' || topic.level === filterLevel;
    return matchSearch && matchLevel;
  });

  if (loading) {
    return (
      <LearnLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <LoadingCat size={250} text="Đang chuẩn bị kho bài học cho bạn..." />
        </div>
      </LearnLayout>
    );
  }

  return (
    <LearnLayout>

      {/* ══ HERO BANNER ══════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl mb-6 shadow-xl">
        <div className={cn(
          'absolute inset-0',
          isDark
            ? 'bg-linear-to-br from-[#1a1040] via-[#2d1b69] to-[#0f172a]'
            : 'bg-linear-to-br from-[#6C5CE7] via-[#8B5CF6] to-[#06B6D4]'
        )} />
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <FaBookOpen className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Kho Luyện Tập</p>
                  <h1 className="text-white text-2xl font-black leading-tight">Học mọi kỹ năng IELTS</h1>
                </div>
              </div>
              <p className="text-white/75 text-sm max-w-md leading-relaxed">
                Khám phá các chủ đề từ cơ bản đến nâng cao, hoặc để{' '}
                <span className="font-bold text-white">AI</span> tạo lịch học 7 ngày cá nhân hoá riêng cho bạn.
              </p>
            </div>

            <div className="flex flex-wrap md:flex-col gap-2 md:items-end shrink-0">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/20">
                <FaBookOpen className="text-white/80 text-sm" />
                <span className="text-white font-black text-lg leading-none">{topics.length}</span>
                <span className="text-white/70 text-xs">chủ đề</span>
              </div>
              {completedTopics > 0 && (
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/20">
                  <FaCheckCircle className="text-emerald-300 text-sm" />
                  <span className="text-white font-black text-lg leading-none">{completedTopics}</span>
                  <span className="text-white/70 text-xs">hoàn thành</span>
                </div>
              )}
              {inProgressTopics > 0 && (
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/20">
                  <FaFire className="text-amber-300 text-sm" />
                  <span className="text-white font-black text-lg leading-none">{inProgressTopics}</span>
                  <span className="text-white/70 text-xs">đang học</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleGeneratePlan}
              disabled={planLoading}
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white text-[#6C5CE7] text-sm font-black shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-60"
            >
              {planLoading ? <LoadingCat size={24} /> : <FaBrain />}
              {planLoading ? 'Đang tạo lộ trình…' : 'Tạo lộ trình AI'}
            </button>
            {plan && (
              <button
                onClick={() => setActiveTab('plan')}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/20 backdrop-blur-sm text-white text-sm font-semibold border border-white/30 hover:bg-white/30 transition-all"
              >
                <FaCalendarAlt className="text-xs" />
                Xem lịch học
                <FaChevronRight className="text-[10px]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══ TAB BAR ══════════════════════════════════════════════════════ */}
      <div className={cn('flex gap-1 p-1 rounded-2xl mb-5 w-fit', isDark ? 'bg-white/5' : 'bg-black/5')}>
        {[
          { key: 'topics', label: '📚 Chủ đề', count: topics.length },
          { key: 'plan', label: '🗓️ Lộ trình AI', count: plan?.dayItems?.length ?? 0 },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
              activeTab === key
                ? 'bg-white shadow-md text-[#6C5CE7]'
                : cn('text-gray-500 hover:text-[#6C5CE7]', isDark && 'hover:text-[#A29BFE]')
            )}
          >
            {label}
            {count > 0 && (
              <span className={cn(
                'text-[10px] font-black px-1.5 py-0.5 rounded-lg',
                activeTab === key ? 'bg-[#6C5CE7]/10 text-[#6C5CE7]' : 'bg-black/10 text-gray-500'
              )}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══ TOPICS TAB ══════════════════════════════════════════════════ */}
      {activeTab === 'topics' && (
        <div>
          {/* Search + filter bar */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className={cn('flex items-center gap-2.5 flex-1 min-w-52 px-4 py-2.5 rounded-2xl border shadow-sm', t.border, t.card)}>
              <FaSearch className={cn('text-sm shrink-0', t.sub)} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm chủ đề…"
                className={cn('flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400', t.text)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 text-xs font-bold">✕</button>
              )}
            </div>
            <div className={cn('flex gap-1 p-1 rounded-2xl border shadow-sm', t.border, t.card)}>
              {[
                { val: 'all', label: 'Tất cả' },
                { val: 'beginner', label: 'Cơ bản' },
                { val: 'intermediate', label: 'Trung cấp' },
                { val: 'advanced', label: 'Nâng cao' },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setFilterLevel(val)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                    filterLevel === val
                      ? 'bg-[#6C5CE7] text-white shadow-sm'
                      : cn('text-gray-500 hover:text-[#6C5CE7]', isDark && 'hover:text-[#A29BFE]')
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTopics.map(topic => (
              <TopicCard
                key={topic._id}
                topic={topic}
                t={t}
                isDark={isDark}
                onClick={() => !topic.isLocked && navigate(`/learn/topics/${topic._id}`)}
              />
            ))}
            {filteredTopics.length === 0 && (
              <div className={cn('col-span-3 text-center py-16 rounded-3xl border', t.border, t.card)}>
                <p className="text-5xl mb-4"></p>
                <p className={cn('text-base font-bold mb-1', t.text)}>Không tìm thấy chủ đề</p>
                <p className={cn('text-sm', t.sub)}>Thử thay đổi từ khoá hoặc bộ lọc</p>
                <button onClick={() => { setSearch(''); setFilterLevel('all'); }} className="mt-4 text-sm text-[#6C5CE7] font-semibold hover:underline">
                  Xoá bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ PLAN TAB ════════════════════════════════════════════════════ */}
      {activeTab === 'plan' && (
        !plan ? (
          <EmptyPlan onGenerate={handleGeneratePlan} planLoading={planLoading} t={t} isDark={isDark} />
        ) : (
          <ElasticTimeline
            plan={plan}
            onRegenerate={handleGeneratePlan}
            planLoading={planLoading}
            isDark={isDark}
            t={t}
            navigate={navigate}
          />
        )
      )}
    </LearnLayout>
  );
}

/* ── Empty Plan ──────────────────────────────────────────────────────────── */
function EmptyPlan({ onGenerate, planLoading, t, isDark }) {
  return (
    <div className={cn('relative overflow-hidden rounded-3xl border p-12 text-center shadow-sm', t.border, t.card)}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#6C5CE7] via-[#a855f7] to-[#00CEC9]" />
      <div className="text-7xl mb-5">🤖</div>
      <h2 className={cn('text-2xl font-black mb-3', t.text)}>Chưa có lộ trình cá nhân</h2>
      <p className={cn('text-sm mb-8 max-w-md mx-auto leading-relaxed', t.sub)}>
        AI sẽ phân tích hồ sơ học tập, rồi lên lịch học{' '}
        <span className={cn('font-bold', t.text)}>7 ngày tối ưu</span> hoàn toàn cá nhân hoá.
      </p>
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {['🎯 Cá nhân hoá 100%', '⚡ Tạo ngay lập tức', '📈 Tối ưu tiến độ', '🔄 Tạo lại bất kỳ lúc'].map(label => (
          <div key={label} className={cn('px-4 py-2 rounded-2xl border text-sm', t.border, isDark ? 'bg-white/5' : 'bg-gray-50')}>
            <span className={cn('font-medium', t.sub)}>{label}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onGenerate}
        disabled={planLoading}
        className="inline-flex items-center gap-3 px-10 py-4 bg-linear-to-r from-[#6C5CE7] to-[#a855f7] rounded-2xl font-black text-white text-base shadow-2xl shadow-[#6C5CE7]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-60"
      >
        {planLoading ? <FaSpinner className="animate-spin text-lg" /> : <FaBrain className="text-lg" />}
        {planLoading ? 'AI đang phân tích…' : 'Tạo lộ trình cho tôi'}
      </button>
    </div>
  );
}

/* ── Topic Card ──────────────────────────────────────────────────────────── */

// Map tên icon string (từ DB) → emoji đẹp
const ICON_NAME_MAP = {
  'book-open': '📖', 'book': '📚', 'books': '📚',
  'graduation-cap': '🎓', 'school': '🏫', 'learn': '📝',
  'airplane': '✈️', 'plane': '✈️', 'airport': '🛫',
  'travel': '🌍', 'globe': '🌐', 'world': '🌎',
  'technology': '💻', 'tech': '🔧', 'computer': '🖥️',
  'business': '💼', 'work': '👔', 'office': '🏢',
  'food': '🍜', 'restaurant': '🍽️', 'cooking': '👨‍🍳',
  'health': '🏥', 'medical': '💊', 'doctor': '👨‍⚕️',
  'sport': '⚽', 'sports': '🏆', 'fitness': '💪',
  'music': '🎵', 'art': '🎨', 'movie': '🎬',
  'nature': '🌿', 'environment': '🌱', 'animal': '🐾',
  'science': '🔬', 'math': '🔢', 'history': '📜',
  'city': '🏙️', 'home': '🏠', 'family': '👨‍👩‍👧‍👦',
  'shopping': '🛍️', 'money': '💰', 'finance': '📈',
};

function getTopicIcon(icon_name) {
  if (!icon_name) return '📚';
  // Nếu đã là emoji (unicode > 127) thì giữ nguyên
  if ([...icon_name][0]?.codePointAt(0) > 127) return icon_name;
  // Tìm trong map (case-insensitive, bỏ dấu gạch ngang/underscore)
  const key = icon_name.toLowerCase().replace(/[-_]/g, '-');
  return ICON_NAME_MAP[key] || ICON_NAME_MAP[key.split('-')[0]] || '📚';
}

function TopicCard({ topic, onClick, t, isDark }) {
  const pct = topic.progress ?? 0;
  const done = pct === 100;
  const meta = LEVEL_META[topic.level] || LEVEL_META.beginner;
  const lessonsCount = topic.lessons_count ?? topic.totalLessons ?? 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative rounded-3xl border overflow-hidden transition-all duration-300',
        topic.isLocked
          ? cn('opacity-50 cursor-not-allowed', t.border, t.card)
          : cn(
            'cursor-pointer hover:-translate-y-2 hover:shadow-2xl',
            done
              ? 'border-emerald-400/50 bg-emerald-500/5 hover:shadow-emerald-500/15'
              : 'hover:border-[#6C5CE7]/50 hover:shadow-[#6C5CE7]/15',
            t.border, t.card
          )
      )}
    >
      {/* Cover */}
      <div className="relative h-44 overflow-hidden">
        {topic.cover_image
          ? <img src={topic.cover_image} alt={topic.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          : <div className={cn(
            'w-full h-full flex items-center justify-center text-6xl',
            isDark
              ? 'bg-linear-to-br from-[#6C5CE7]/25 via-[#a855f7]/15 to-[#1a1040]'
              : 'bg-linear-to-br from-[#A29BFE]/30 via-[#6C5CE7]/10 to-[#EDE9FE]'
          )}>
            <span className="drop-shadow-lg group-hover:scale-125 transition-transform duration-500 inline-block">
              {getTopicIcon(topic.icon_name)}
            </span>
          </div>
        }
        <div className={cn(
          'absolute inset-0',
          isDark
            ? 'bg-linear-to-t from-gray-900/80 via-transparent to-transparent'
            : 'bg-linear-to-t from-white/60 via-transparent to-transparent'
        )} />
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <span className={cn('text-[10px] font-black px-2.5 py-1 rounded-xl border backdrop-blur-sm', meta.color)}>
            {meta.label}
          </span>
          <div className="flex items-center gap-1.5">
            {done && (
              <div className="flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg">
                <FaCheckCircle className="text-[9px]" /> Xong
              </div>
            )}
            {topic.isLocked && (
              <div className="absolute inset-0 bg-black/60 -left-3 -right-3 -top-3 flex flex-col items-center justify-center gap-2">
                <FaLock className="text-3xl text-white/70" />
                <span className="text-white/70 text-xs font-bold bg-black/40 px-3 py-1 rounded-xl">Premium</span>
              </div>
            )}
          </div>
        </div>
        {lessonsCount > 0 && !topic.isLocked && (
          <div className={cn(
            'absolute bottom-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-xl backdrop-blur-sm border',
            isDark ? 'bg-black/50 text-gray-300 border-white/10' : 'bg-white/80 text-gray-600 border-black/10'
          )}>
            {lessonsCount} bài
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className={cn('font-black text-base mb-1.5 group-hover:text-[#6C5CE7] transition-colors truncate', t.text)}>
          {topic.name}
        </h3>
        <p className={cn('text-xs line-clamp-2 mb-4 leading-relaxed', t.sub)}>{topic.description || ''}</p>

        {!topic.isLocked && (
          <>
            <div className="mb-4">
              <div className={cn('flex justify-between text-[11px] mb-1.5', t.sub)}>
                <span className="font-medium">Tiến độ</span>
                <span className={cn('font-black', done ? 'text-emerald-500' : 'text-[#6C5CE7]')}>{pct}%</span>
              </div>
              <div className={cn('w-full h-2 rounded-full overflow-hidden', isDark ? 'bg-white/10' : 'bg-gray-100')}>
                <div
                  className={cn('h-full rounded-full transition-all duration-700', done ? 'bg-emerald-500' : 'bg-linear-to-r from-[#6C5CE7] to-[#a855f7]')}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Day Card ────────────────────────────────────────────────────────────── */
function DayCard({ item, idx, isToday, isDone, topic, lesson, skillM, dateStr, navigate, t, isDark }) {
  // topic-based plan: navigate to topic page; fallback to lesson for legacy plans
  const itemType = item.itemType || (topic ? 'topic' : 'lesson');
  
  let dest = null;
  switch (itemType) {
    case 'topic': dest = `/learn/topics/${item.itemId || (topic ? topic._id : '')}`; break;
    case 'reading': dest = '/reading'; break;
    case 'speaking': dest = '/speaking-practice'; break;
    case 'writing': dest = '/ai-writing'; break;
    case 'listening': dest = '/ai-listening'; break;
    case 'vocabulary': dest = item.topicId ? `/vocabulary/${item.topicId}/learn` : '/vocabulary'; break;
    case 'grammar': dest = `/grammar/${item.itemId}`; break;
    case 'story': dest = `/stories/${item.itemId}/parts/1`; break;
    default: dest = topic ? `/learn/topics/${topic._id}` : lesson ? `/learn/lessons/${lesson._id}` : null;
  }

  const hasContent = !!(topic || lesson || item.content || item.itemId);
  const title = topic ? topic.name : lesson ? lesson.title : (item.content?.title || item.content?.name || item.content?.word || item.content?.question_text || item.content?.prompt || 'Bài học AI');
  
  const subtitle = topic
    ? (topic.level ? `📊 ${topic.level}` : null)
    : lesson?.duration ? `⏱ ${lesson.duration}ph` : (itemType !== 'topic' ? `✨ Luyện ${itemType}` : null);

  return (
    <div
      onClick={() => dest && navigate(dest)}
      className={cn(
        'relative rounded-2xl border overflow-hidden transition-all duration-300 group flex flex-col',
        hasContent ? 'cursor-pointer' : 'cursor-default',
        isToday
          ? 'border-[#6C5CE7] shadow-lg shadow-[#6C5CE7]/20 ring-1 ring-[#6C5CE7]/30 hover:-translate-y-1'
          : isDone
            ? cn('border-emerald-400/50 hover:border-emerald-400 hover:-translate-y-0.5', isDark ? 'bg-emerald-900/15' : 'bg-emerald-50/80')
            : cn(t.border, t.card, hasContent ? 'hover:border-[#6C5CE7]/40 hover:shadow-md hover:-translate-y-0.5' : 'opacity-55')
      )}
    >
      <div className={cn(
        'h-1.5',
        isToday ? 'bg-linear-to-r from-[#6C5CE7] to-[#a855f7]'
          : isDone ? 'bg-emerald-500'
            : isDark ? 'bg-white/5' : 'bg-gray-100'
      )} />

      <div className="p-3 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className={cn('text-xs font-black uppercase tracking-widest', isToday ? 'text-[#6C5CE7]' : t.sub)}>
              {DAY_SHORT[idx]}
            </p>
            {dateStr && <p className={cn('text-[10px]', isToday ? 'text-[#A29BFE]' : t.sub)}>{dateStr}</p>}
          </div>
          {item.isExploration ? (
            <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center animate-pulse">
              <FaBrain className="text-purple-500 text-[10px]" />
            </div>
          ) : isDone ? (
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
              <FaCheckCircle className="text-white text-[10px]" />
            </div>
          ) : isToday ? (
            <div className="w-6 h-6 rounded-full bg-[#6C5CE7] flex items-center justify-center shadow-lg shadow-[#6C5CE7]/30">
              <div className="w-2 h-2 rounded-full bg-white animate-ping" />
            </div>
          ) : null}
        </div>

        <span className={cn('inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border mb-2 w-fit', skillM.bg, skillM.color)}>
          {skillM.icon} {skillM.label}
        </span>

        {hasContent ? (
          <div className="flex-1">
            <p className={cn(
              'text-xs font-bold leading-snug line-clamp-2',
              isToday ? t.text : isDone ? (isDark ? 'text-emerald-300' : 'text-emerald-700') : t.text
            )}>
              {title}
            </p>
            {subtitle && <p className={cn('text-[10px] mt-1', t.sub)}>{subtitle}</p>}
          </div>
        ) : (
          <p className={cn('text-xs italic flex-1', t.sub)}>Ngày trống</p>
        )}

        <div className="mt-2">
          {item.isExploration && (
            <span className="inline-flex items-center gap-0.5 text-[9px] bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full border border-purple-400/25 mb-1">
              <FaStar className="text-[7px]" /> AI pick
            </span>
          )}
          {isToday && !isDone && hasContent && (
            <button className="w-full py-1.5 rounded-xl bg-[#6C5CE7] text-white text-[10px] font-black flex items-center justify-center gap-1 hover:bg-[#5a4bd1] transition-all">
              Học ngay <FaArrowRight className="text-[8px]" />
            </button>
          )}
          {isDone && <p className="text-[10px] font-black text-emerald-500">✓ Xong</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Mini Stat ───────────────────────────────────────────────────────────── */
function MiniStat({ icon, label, value, isDark, t }) {
  return (
    <div className={cn('rounded-2xl p-3 text-center border', isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100')}>
      <div className="text-xl mb-1">{icon}</div>
      <p className={cn('text-sm font-black leading-tight', t.text)}>{value}</p>
      <p className={cn('text-[10px] mt-0.5 font-medium', t.sub)}>{label}</p>
    </div>
  );
}

/* ── Helper ──────────────────────────────────────────────────────────────── */
function getWeekDates(weekStart) {
  if (!weekStart) return Array(7).fill('');
  try {
    const monday = new Date(weekStart);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
    });
  } catch { return Array(7).fill(''); }
}
