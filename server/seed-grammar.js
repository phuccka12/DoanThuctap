/**
 * seed-grammar.js — Seed 3 bài ngữ pháp mẫu đầy đủ (published + active)
 * Chạy: node seed-grammar.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const GrammarLesson = require('./src/models/GrammarLesson');

const SEEDS = [
  {
    title: 'Thì Hiện Tại Hoàn Thành (Present Perfect)',
    description: 'Dùng để diễn đạt trải nghiệm, hành động vừa xong hoặc kết quả còn ảnh hưởng tới hiện tại.',
    level: 'intermediate',
    is_active: true,
    is_published: true,
    hook: {
      questions: [
        {
          text: 'Muốn khoe bạn đã từng ăn Sushi 3 lần trong đời, bạn nói câu nào?',
          optionA: 'I ate sushi 3 times.',
          optionB: 'I have eaten sushi 3 times.',
          correct: 'B',
        },
        {
          text: 'Câu nào diễn tả hành động vừa xảy ra và còn ảnh hưởng hiện tại?',
          optionA: 'She lost her key.',
          optionB: 'She has lost her key.',
          correct: 'B',
        },
      ],
    },
    theory: {
      mainCard: `## Công thức\n\n**[ S ]** + **[ have / has ]** + **[ V3/ed ]**\n\n> Dùng để kể về **TRẢI NGHIỆM** trong quá khứ mà **không cần biết thời gian cụ thể!**\n\n\`\`\`\nI have visited Paris.  → Tôi đã từng thăm Paris.\nShe has eaten sushi.   → Cô ấy đã từng ăn sushi.\n\`\`\``,
      subCards: [
        {
          title: '⚠️ Dấu hiệu nhận biết',
          content: 'Đi với: since (mốc thời gian), for (khoảng thời gian), already, yet, ever, never, just, recently, so far, up to now.',
        },
        {
          title: '💡 Động từ bất quy tắc hay gặp',
          content: 'go → gone\nsee → seen\nwrite → written\neat → eaten\ntake → taken\ngive → given\nknow → known',
        },
      ],
    },
    minigames: [
      {
        type: 'multiple_choice',
        question: 'She _____ to Japan twice. (go)',
        options: ['go', 'went', 'has gone', 'have gone'],
        correct: 2,
      },
      {
        type: 'multiple_choice',
        question: 'They _____ here since 2020. (live)',
        options: ['lived', 'have lived', 'has lived', 'were living'],
        correct: 1,
      },
      {
        type: 'error_detection',
        sentence: 'I have saw this movie before.',
        errorWord: 'saw',
        correction: 'seen',
        explanation: 'Sau "have/has" phải dùng quá khứ phân từ (V3/ed). "see" → "seen", không phải "saw" (quá khứ đơn).',
      },
      {
        type: 'error_detection',
        sentence: 'He has wrote three books.',
        errorWord: 'wrote',
        correction: 'written',
        explanation: '"write" là động từ bất quy tắc: write → wrote → written. Sau "has" phải dùng "written".',
      },
      {
        type: 'word_order',
        words: ['never', 'I', 'have', 'sushi', 'eaten'],
        correct: 'I have never eaten sushi',
      },
      {
        type: 'word_order',
        words: ['just', 'She', 'has', 'her', 'finished', 'homework'],
        correct: 'She has just finished her homework',
      },
    ],
  },
  {
    title: 'Câu Điều Kiện Loại 2 (Second Conditional)',
    description: 'Diễn đạt tình huống giả định không có thật ở hiện tại hoặc tương lai.',
    level: 'intermediate',
    is_active: true,
    is_published: true,
    hook: {
      questions: [
        {
          text: 'Bạn muốn nói "Nếu tôi là tỷ phú, tôi sẽ mua du thuyền". Câu nào đúng?',
          optionA: 'If I am a billionaire, I will buy a yacht.',
          optionB: 'If I were a billionaire, I would buy a yacht.',
          correct: 'B',
        },
        {
          text: 'Câu nào diễn tả tình huống KHÔNG có thật ở hiện tại?',
          optionA: 'If it rains, I will stay home.',
          optionB: 'If I had wings, I would fly to you.',
          correct: 'B',
        },
      ],
    },
    theory: {
      mainCard: `## Công thức\n\n**If + S + V2/were, S + would + V**\n\n> Dùng để nói về tình huống **KHÔNG CÓ THẬT** ở hiện tại hoặc tương lai — điều bạn **ước, tưởng tượng, giả định**.\n\n\`\`\`\nIf I were rich, I would travel the world.\nIf she knew the answer, she would tell us.\n\`\`\``,
      subCards: [
        {
          title: '⚠️ Lưu ý quan trọng',
          content: 'Dùng "were" cho TẤT CẢ chủ ngữ (kể cả I, he, she, it) trong mệnh đề IF:\n✅ If I were you...\n✅ If he were here...\n❌ If I was you... (không chuẩn trong văn viết)',
        },
        {
          title: '🔄 So sánh với Loại 1',
          content: 'Loại 1 (có thể xảy ra): If it rains, I will stay home.\nLoại 2 (không có thật): If it rained, I would stay home.',
        },
      ],
    },
    minigames: [
      {
        type: 'multiple_choice',
        question: 'If I _____ a car, I would drive to work.',
        options: ['have', 'had', 'has', 'would have'],
        correct: 1,
      },
      {
        type: 'multiple_choice',
        question: 'She would travel more if she _____ more money.',
        options: ['has', 'have', 'had', 'would have'],
        correct: 2,
      },
      {
        type: 'error_detection',
        sentence: 'If I was a bird, I would fly to Paris.',
        errorWord: 'was',
        correction: 'were',
        explanation: 'Trong câu điều kiện loại 2, dùng "were" cho tất cả chủ ngữ trong mệnh đề If, kể cả "I".',
      },
      {
        type: 'word_order',
        words: ['would', 'If', 'I', 'rich', 'were', 'the', 'world', 'travel', 'I'],
        correct: 'If I were rich I would travel the world',
      },
      {
        type: 'word_order',
        words: ['knew', 'She', 'would', 'the', 'answer', 'tell', 'us', 'she', 'if'],
        correct: 'If she knew the answer she would tell us',
      },
    ],
  },
  {
    title: 'Thì Quá Khứ Đơn vs Quá Khứ Tiếp Diễn',
    description: 'Phân biệt khi nào dùng Past Simple và Past Continuous để kể chuyện trong quá khứ.',
    level: 'beginner',
    is_active: true,
    is_published: true,
    hook: {
      questions: [
        {
          text: 'Đang đi bộ thì mưa — Câu nào đúng?',
          optionA: 'I walked when it rained.',
          optionB: 'I was walking when it rained.',
          correct: 'B',
        },
      ],
    },
    theory: {
      mainCard: `## Hai thì quá khứ quan trọng\n\n**Quá khứ đơn:** S + V2/ed\n→ Hành động **hoàn thành**, xảy ra **tại một thời điểm cụ thể**.\n\n**Quá khứ tiếp diễn:** S + was/were + V-ing\n→ Hành động **đang diễn ra** tại một thời điểm trong quá khứ.\n\n\`\`\`\nI was studying when she called. \n(đang học thì cô ấy gọi)\n\`\`\``,
      subCards: [
        {
          title: '🎯 Công thức kết hợp',
          content: 'While + QK tiếp diễn → hành động nền (dài)\nWhen + QK đơn → hành động xen vào (ngắn)\n\nVí dụ:\nWhile I was cooking, he arrived.\nShe was reading when the phone rang.',
        },
        {
          title: '⚠️ Dấu hiệu nhận biết',
          content: 'Quá khứ đơn: yesterday, last week, ago, in 2020\nQuá khứ tiếp diễn: at 8pm yesterday, while, when (+ hành động ngắn)',
        },
      ],
    },
    minigames: [
      {
        type: 'multiple_choice',
        question: 'At 9pm last night, I _____ TV.',
        options: ['watch', 'watched', 'was watching', 'were watching'],
        correct: 2,
      },
      {
        type: 'multiple_choice',
        question: 'While she _____ a shower, the doorbell rang.',
        options: ['took', 'was taking', 'has taken', 'takes'],
        correct: 1,
      },
      {
        type: 'error_detection',
        sentence: 'I was seeing him yesterday at the park.',
        errorWord: 'was seeing',
        correction: 'saw',
        explanation: '"See" là stative verb (động từ trạng thái) — không dùng ở dạng tiếp diễn. Dùng "saw" (quá khứ đơn).',
      },
      {
        type: 'word_order',
        words: ['was', 'I', 'studying', 'when', 'she', 'called'],
        correct: 'I was studying when she called',
      },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Publish bài hiện có (nếu có)
    const updateResult = await GrammarLesson.updateMany(
      { is_published: false },
      { $set: { is_published: true } }
    );
    console.log(`📝 Published ${updateResult.modifiedCount} existing unpublished lessons`);

    // Insert seed nếu chưa có
    let inserted = 0;
    for (const seed of SEEDS) {
      const exists = await GrammarLesson.findOne({ title: seed.title });
      if (!exists) {
        await GrammarLesson.create(seed);
        inserted++;
        console.log(`  ✅ Created: "${seed.title}"`);
      } else {
        console.log(`  ⏭️  Skipped (exists): "${seed.title}"`);
      }
    }

    const total = await GrammarLesson.countDocuments({ is_active: true, is_published: true });
    console.log(`\n🏁 Done! Total ready lessons: ${total}`);

  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
