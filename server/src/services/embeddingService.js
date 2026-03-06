'use strict';
/**
 * embeddingService.js
 * Wraps Google gemini-embedding-001 (via REST, v1beta endpoint).
 * Falls back gracefully if GEMINI_API_KEY is not set (returns zero-vector).
 *
 * Public API:
 *   embedText(text)              → number[]  (768-dim vector)
 *   buildUserProfileText(user)   → string    (for embedding)
 *   buildLessonText(lesson)      → string    (for embedding)
 *   cosineSimilarity(a, b)       → number    (-1 … 1)
 *   rankLessonsByUser(userVec, lessons, topK) → sorted lessons with .score
 */

const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
const EMBED_MODEL    = 'gemini-embedding-001';  // only embedContent-capable model on this key
const EMBED_DIM      = 3072;                     // gemini-embedding-001 outputs 3072 dims
// gemini-embedding-001 is on v1beta endpoint
function getEmbedEndpoint() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || GEMINI_API_KEY;
  return `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${key}`;
}

// Simple in-memory LRU-like cache (max 500 entries, keyed by text hash)
const _cache = new Map();
const CACHE_MAX = 500;

function _cacheKey(text) {
  // Simple 32-char hash
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  }
  return `${h}_${text.length}`;
}

/**
 * Call Google embedding API and return 768-dim float array.
 * If API unavailable / key missing → returns zero vector (graceful degradation).
 */
async function embedText(text) {
  if (!text || !text.trim()) return new Array(EMBED_DIM).fill(0);

  const key = _cacheKey(text);
  if (_cache.has(key)) return _cache.get(key);

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[embeddingService] GEMINI_API_KEY not set — returning zero vector');
    return new Array(EMBED_DIM).fill(0);
  }

  try {
    const res = await axios.post(
      getEmbedEndpoint(),
      { content: { parts: [{ text }] } },
      { timeout: 15000, headers: { 'Content-Type': 'application/json' } }
    );
    const values = res.data?.embedding?.values;
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error(`Unexpected embedding shape: got ${values?.length} dims`);
    }
    // Evict oldest entry if cache is full
    if (_cache.size >= CACHE_MAX) {
      const firstKey = _cache.keys().next().value;
      _cache.delete(firstKey);
    }
    _cache.set(key, values);
    return values;
  } catch (err) {
    console.error('[embeddingService] embedText error:', err.response?.data || err.message);
    return new Array(EMBED_DIM).fill(0);
  }
}

/**
 * Build a descriptive text string from a User document for embedding.
 * Uses onboarding + placement data from the User model.
 */
function buildUserProfileText(user) {
  const prefs = user.learning_preferences || {};
  const placement = user.placement_test_result || {};

  const parts = [
    prefs.goal        ? `Learning goal: ${prefs.goal}`              : '',
    prefs.current_level ? `Current level: ${prefs.current_level}`  : '',
    placement.cefr_level ? `CEFR level: ${placement.cefr_level}`   : '',
    prefs.focus_skills?.length
      ? `Focus skills: ${prefs.focus_skills.join(', ')}`           : '',
    prefs.target_band  ? `Target band: ${prefs.target_band}`        : '',
    prefs.study_hours_per_week
      ? `Study hours per week: ${prefs.study_hours_per_week}`       : '',
  ].filter(Boolean);

  return parts.length ? parts.join('. ') : 'English language learning, general purposes';
}

/**
 * Build a descriptive text string from a Lesson document for embedding.
 */
function buildLessonText(lesson) {
  const parts = [
    lesson.title       ? `Lesson: ${lesson.title}`       : '',
    lesson.description ? lesson.description              : '',
    lesson.level       ? `Level: ${lesson.level}`        : '',
  ];

  // Extract text from nodes for richer semantic meaning
  if (Array.isArray(lesson.nodes)) {
    lesson.nodes.forEach(node => {
      if (node.title) parts.push(node.title);
      if (node.data?.prompt)   parts.push(node.data.prompt);
      if (node.data?.text)     parts.push(node.data.text);
      if (node.data?.content)  parts.push(node.data.content);
    });
  }

  return parts.filter(Boolean).join('. ').slice(0, 1500); // cap length
}

/**
 * Cosine similarity between two float arrays.
 * Returns value in [-1, 1]. Returns 0 if either vector is zero.
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

/**
 * Rank lessons by cosine similarity to a user vector.
 * Returns the top-K lessons sorted descending by similarity, each augmented with .score.
 *
 * @param {number[]} userVec  — 768-dim user embedding
 * @param {Array}    lessons  — Mongoose lesson docs (must have .embedding field)
 * @param {number}   topK     — how many to return
 */
function rankLessonsByUser(userVec, lessons, topK = 20) {
  const scored = lessons.map(lesson => {
    const vec = lesson.embedding || [];
    return { lesson, score: cosineSimilarity(userVec, vec) };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

module.exports = { embedText, buildUserProfileText, buildLessonText, cosineSimilarity, rankLessonsByUser };
