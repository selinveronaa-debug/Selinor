/**
 * RoomRecall · ai/claude.js
 * Everything that talks to Claude (the artifact `sample` capability), plus the offline fallback.
 */

/* ---------- Claude ---------- */
const AI = { sample: null, images: false, off: false, checked: false };
const STOP_CODES = new Set(['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed', 'session_expired']);
const DAY_CACHE = { gcTime: 86400000 };
const aiOn = () => Boolean(AI.sample) && !AI.off;
function updateAiStatus() {
  $('#aiChip').hidden = !aiOn();
  const s = $('#aiStatus');
  if (s) s.textContent = aiOn() ? '✦ Claude writes the questions and pictures' : (AI.checked ? 'Offline mode: simpler questions' : 'Checking for Claude…');
}
(async () => {
  try {
    if (window.claude?.use) {
      AI.sample = await window.claude.use('sample');
      if (AI.sample) { const l = await AI.sample.limits().catch(() => null); AI.images = Boolean(l && l.images); }
    }
  } catch { AI.sample = null; }
  AI.checked = true; updateAiStatus();
})();
function aiErrorText(e) {
  const code = e?.code;
  if (STOP_CODES.has(code)) AI.off = true;
  updateAiStatus();
  if (code === 'cancelled') return 'Stopped. The rest was filled in offline mode.';
  if (code === 'rate_limited') return 'Claude is busy, so some rooms used offline mode. Try again in a minute.';
  if (STOP_CODES.has(code)) return 'Claude is not available here, so offline mode was used.';
  return 'Claude could not finish a room, so offline mode filled it in.';
}

const overlay = {
  ctrl: null,
  open(title, steps) {
    this.ctrl = new AbortController();
    $('#aiTitle').textContent = title;
    $('#aiSteps').innerHTML = steps.map((s, i) => `<li data-i="${i}">${esc(s)}</li>`).join('');
    $('#aiLive').textContent = '';
    $('#aiOverlay').hidden = false;
    return this.ctrl.signal;
  },
  set(i, cls) { const li = $(`#aiSteps li[data-i="${i}"]`); if (li) li.className = cls; },
  live(t) { $('#aiLive').textContent = t; },
  close() { $('#aiOverlay').hidden = true; $('#aiHouse').hidden = true; this.ctrl = null; }
};
$('#aiStop').addEventListener('click', () => overlay.ctrl?.abort());

const STORY_RULES = `Rules for "story" (the memory picture):
- 1-2 sentences, at most 40 words, present tense, plain simple English.
- The spot itself takes part: it moves, breaks, talks or changes. Use motion, emotion and surprise.
- It may be absurd, but it must make literal sense and be easy to picture as ONE scene.
- Every key part of the answer appears as a concrete thing in the scene, and the scene shows what the answer means. For a formula, each term is an object doing what that term does.
- No puns that need another language, no mixed metaphors, no Norwegian words.`;

async function aiRoom({ course, topic, roomLabel, spots, notes, signal, onText }) {
  const text = notes.length > 30000 ? notes.slice(0, 30000) + '\n[truncated]' : notes;
  const prompt = `You are furnishing one room of a memory palace (method of loci) for a university student.
Course: ${course}
Room: ${roomLabel}
Topic of this room: ${topic || 'choose the most important topic in the notes'}
Spots in this room, in walking order (use these names exactly):
${spots.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Notes:
"""
${text}
"""

Write exactly ${spots.length} items, one per spot, in the same order. Each item tests one important, exam-relevant fact, definition or formula from this topic, and the items do not repeat each other.
For each item:
- "question": a clear exam-style question, at most 22 words.
- "answer": short and correct, at most 18 words. Write formulas with plain symbols, e.g. PV = FV / (1 + r)^t.
- "distractors": 3 wrong answers that look plausible, in the same length and style as the answer.
- "explanation": one plain sentence on why the answer is right.
- "type": "formula" or "concept".
- "emoji": one emoji.
${STORY_RULES}
Write everything in English, even if the notes are in another language.
Reply with only JSON: {"topic":"short topic title, max 40 characters","items":[{"spot":"${spots[0]}","question":"...","answer":"...","distractors":["...","...","..."],"explanation":"...","type":"concept","emoji":"✨","story":"..."}]}`;
  const data = await AI.sample.json(prompt, { signal, cache: DAY_CACHE, onText });
  const raw = Array.isArray(data?.items) ? data.items : [];
  const items = spots.map((spot, i) => {
    const r = raw.find(x => cleanStr(x.spot).toLowerCase() === spot.toLowerCase()) || raw[i];
    if (!r) return null;
    const answer = cleanStr(r.answer, 220);
    const distractors = [...new Set((r.distractors || []).map(d => cleanStr(d, 220)))].filter(d => d && d.toLowerCase() !== answer.toLowerCase()).slice(0, 3);
    const it = { obj: i, spot, question: cleanStr(r.question, 260), answer, distractors, explanation: cleanStr(r.explanation, 260), type: r.type === 'formula' ? 'formula' : 'concept', emoji: cleanStr(r.emoji, 4) || '✦', story: cleanStr(r.story, 420) };
    return it.question && it.answer && it.story && distractors.length === 3 ? it : null;
  }).filter(Boolean);
  if (items.length < Math.min(2, spots.length)) throw { code: 'invalid_json' };
  return { topic: cleanStr(data.topic, 40), items };
}

async function aiPlanTopics({ course, notes, rooms, signal }) {
  const text = notes.length > 50000 ? notes.slice(0, 50000) + '\n[truncated]' : notes;
  const data = await AI.sample.json(`Split this course into exactly ${rooms} distinct topics in a sensible learning order, one per room of a memory palace. Course: ${course}.
Notes:
"""
${text}
"""
Reply with only JSON: {"topics":["short English title, max 40 characters"]}`, { signal, cache: DAY_CACHE, modelTier: 'quick' });
  const topics = (data?.topics || []).map(t => cleanStr(t, 40)).filter(Boolean);
  if (topics.length < rooms) throw { code: 'invalid_json' };
  return topics.slice(0, rooms);
}

async function aiFindObjects(blob, count) {
  const r = await AI.sample.json(`This photo shows a room someone knows well. Pick ${count} distinct, memorable physical objects that are clearly visible and spread out across the photo (different areas, not overlapping). Order them as a natural walk from left to right. Name each like "the green armchair" (lowercase "the" plus 1-3 words). Give each object's centre as a percentage of image width (x, from the left) and height (y, from the top).
Reply with only a JSON array: [{"name":"the lamp","x":72,"y":40}]`, { images: [blob], cache: DAY_CACHE });
  if (!Array.isArray(r) || r.length < 2) throw { code: 'invalid_json' };
  return r.slice(0, count).map(p => ({ name: cleanStr(p.name, 40) || 'the object', x: Math.min(96, Math.max(4, +p.x || 50)), y: Math.min(94, Math.max(6, +p.y || 50)) }));
}

async function aiWeirder(item, course) {
  const r = await AI.sample.json(`Rewrite this memory-palace picture so it is stranger and more vivid, and so it shows the answer even more clearly.
Course: ${course}
Spot: ${item.spot}
Question: ${item.question}
Answer: ${item.answer}
Current picture: ${item.story}
${STORY_RULES}
Reply with only JSON: {"story":"..."}`, { cache: false });
  const s = cleanStr(r?.story, 420);
  if (!s) throw { code: 'invalid_json' };
  return s;
}

/* ---------- Offline fallback for one room ---------- */
function offlineRoom(text, spots) {
  const bank = buildGenericQuestionBank(text || '');
  return {
    topic: '',
    items: spots.map((spot, i) => {
      const q = bank[i % Math.max(1, bank.length)];
      if (!q) return null;
      const others = bank.filter(b => b.answer !== q.answer).map(b => b.answer);
      return { obj: i, spot, question: q.prompt, answer: q.answer, distractors: shuffle(others).slice(0, 3), explanation: '', type: q.type, emoji: q.emoji, story: `Picture ${spot} glowing with the words of this fact written across it. Touch it and say the answer out loud.` };
    }).filter(Boolean)
  };
}
function splitText(text, n) {
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).filter(s => s.trim());
  const per = Math.ceil(sentences.length / n);
  return Array.from({ length: n }, (_, i) => sentences.slice(i * per, (i + 1) * per).join(' '));
}
