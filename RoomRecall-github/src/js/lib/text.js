/**
 * RoomRecall · lib/text.js
 * Cleaning and validating text that comes back from Claude.
 */

function cleanStr(value, max = 400) { return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max); }

function normalizeAiQuestions(list, anchorCount) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.map(q => {
    const answer = cleanStr(q.answer, 220);
    const distractors = [...new Set((Array.isArray(q.distractors) ? q.distractors : []).map(d => cleanStr(d, 220)))]
      .filter(d => d && d.toLowerCase() !== answer.toLowerCase()).slice(0, 3);
    const anchor = Number(q.anchor);
    return {
      prompt: cleanStr(q.prompt, 260),
      answer,
      distractors,
      explanation: cleanStr(q.explanation, 260),
      type: q.type === 'formula' ? 'formula' : 'concept',
      emoji: cleanStr(q.emoji, 4) || '◆',
      anchor: Number.isInteger(anchor) && anchor >= 0 && anchor < anchorCount ? anchor : undefined,
      priority: q.type === 'formula' ? 10 : 8
    };
  }).filter(q => {
    if (!q.prompt || !q.answer || q.distractors.length < 3) return false;
    const key = q.prompt.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
