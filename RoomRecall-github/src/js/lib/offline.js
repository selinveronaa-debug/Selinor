/**
 * RoomRecall · lib/offline.js
 * Offline fallback when Claude is not available: picks key concepts by word frequency,
 * builds simple questions, and matches concepts to metro stops by how they sound.
 */

const stopwords = new Set(`a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves
dette denne disse eller også ikke som hvor hva skal blir med fra til for ved kan har var det den de en et og av på i å om seg sin sine sitt er jeg du han hun vi dere dem oss min mitt mine din ditt dine
understand understanding understood learn learning learned remember remembering explain explaining know knowing important importance topic topics material course courses subject subjects study studying studied need needs needed want wants wanted help helps helped use uses used make makes made get gets got see sees seen read reads reading write writes writing think thinks thinking
forstå forstår forstått forståelse lære lærer lært huske husker forklare forklarer vite vet visste viktig viktige tema temaet temaer pensum fag studere studerer lese leser skrive skriver tenke tenker gjøre gjør gjort bruke bruker brukt kunne burde måtte ønsker trenger`.split(/\s+/));

const emojiPool = ['🧠','⚡','🌊','🔑','🧲','🪐','🔥','🌱','🧬','💡'];

const storyTemplates = [
  'A neon sign reading “{concept}” flashes above {location}. Say what it means before the light disappears.',
  'The words “{concept}” float over {location} in bright letters. Connect them to one concrete example.',
  'Touch {location} and a voice repeats “{concept}”. Explain the idea back in your own words.',
  'A locked box marked “{concept}” appears on {location}. Recalling the definition is the only key.',
  'A spotlight reveals the words “{concept}” across {location}. Picture one detail that makes the idea impossible to forget.'
];

function extractConcepts(text, want = 5) {

  const tokens = (text.toLowerCase().match(/\p{L}{4,}/gu) || [])
    .map(word => word.normalize('NFC'));
  const isUseful = word => word.length >= 5 && !stopwords.has(word);
  const counts = new Map();
  const phrases = new Map();

  tokens.forEach((word, index) => {
    if (!isUseful(word)) return;
    counts.set(word, (counts.get(word) || 0) + 1);
    const next = tokens[index + 1];
    if (next && isUseful(next)) {
      const phrase = `${word} ${next}`;
      phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
    }
  });

  const candidates = [
    ...[...phrases.entries()].map(([term, frequency]) => ({ term, score: frequency * 8 + term.length / 20 })),
    ...[...counts.entries()].map(([term, frequency]) => ({ term, score: frequency * 5 + term.length / 30 }))
  ].sort((a, b) => b.score - a.score);

  const selected = [];
  for (const candidate of candidates) {
    if (selected.some(term => term.includes(candidate.term) || candidate.term.includes(term))) continue;
    selected.push(candidate.term);
    if (selected.length === want) break;
  }

  if (selected.length < Math.min(5, want)) return [];
  return selected.slice(0, want).map((term, index) => ({
    concept: term.replace(/(^|\s)\p{L}/gu, letter => letter.toUpperCase()),
    emoji: emojiPool[index % emojiPool.length],
    story: storyTemplates[index % storyTemplates.length]
  }));
}

function formulaScore(text) {
  const matches = text.match(/(?:=|Σ|∑|√|σ|ρ|\bPV\b|\bFV\b|\bR[_ₜₚ]?\b|variance|standard deviation|korrelasjon|avkastning|nåverdi|present value|formula)/gi) || [];
  return matches.length;
}

function buildGenericQuestionBank(text) {
  const sentences = text
    .replace(/\r/g, '\n')
    .split(/(?<=[.!?])\s+|\n+/)
    .map(sentence => sentence.replace(/\s+/g, ' ').trim())
    .filter(sentence => sentence.length >= 28 && sentence.length <= 260);
  const unique = [...new Set(sentences)];
  const concepts = extractConcepts(text);
  const candidates = unique.map((sentence, index) => {
    const concept = concepts.find(item => sentence.toLowerCase().includes(item.concept.toLowerCase()))?.concept
      || sentence.match(/\b[A-ZÆØÅ][\p{L}æøå-]{3,}\b/u)?.[0]
      || `topic ${index + 1}`;
    const score = formulaScore(sentence);
    return {
      prompt: score ? `Which formula or quantitative rule matches ${concept}?` : `Which statement best explains ${concept}?`,
      answer: sentence,
      type: score ? 'formula' : 'concept',
      emoji: score ? '∑' : emojiPool[index % emojiPool.length],
      priority: score * 4 + Math.max(1, 8 - index / 10)
    };
  }).sort((a, b) => b.priority - a.priority);
  const bank = [];
  for (const candidate of candidates) {
    if (bank.some(item => item.answer.toLowerCase() === candidate.answer.toLowerCase())) continue;
    bank.push(candidate);
    if (bank.length === 25) break;
  }
  concepts.forEach((item, index) => {
    if (bank.length >= 10) return;
    bank.push({ prompt: `Which key term belongs to memory ${index + 1}?`, answer: item.concept, type: 'concept', emoji: item.emoji, priority: 3 });
  });
  return bank;
}

function normalizeSound(value) {
  return value.toLowerCase()
    .replaceAll('æ', 'ae').replaceAll('ø', 'o').replaceAll('å', 'a')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const saved = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = saved;
    }
  }
  return row[b.length];
}

function soundScore(concept, stop) {
  const stopSound = normalizeSound(stop);
  return concept.split(/\s+/).reduce((best, word) => {
    const conceptSound = normalizeSound(word);
    if (!conceptSound || !stopSound) return best;
    return Math.max(best, 1 - editDistance(conceptSound, stopSound) / Math.max(conceptSound.length, stopSound.length));
  }, 0);
}

function matchConceptsToStops(concepts, selectedStops) {
  const availableConcepts = [...concepts];
  return selectedStops.map(stop => {
    let conceptIndex = availableConcepts.findIndex(item => item.preferredStop === stop);
    if (conceptIndex === -1) {
      conceptIndex = availableConcepts.reduce((bestIndex, item, index, items) =>
        soundScore(item.concept, stop) > soundScore(items[bestIndex].concept, stop) ? index : bestIndex, 0);
    }
    const [item] = availableConcepts.splice(conceptIndex, 1);
    const score = soundScore(item.concept, stop);
    const hook = item.preferredStop === stop || score > .42
      ? `“${stop}” sounds a little like “${item.concept}”`
      : `${stop} becomes the visual anchor for “${item.concept}”`;
    return {
      ...item,
      name: stop,
      hook,
      story: `As the train reaches ${stop}, the station sign transforms into glowing words: “${item.concept}”. Picture the idea acting out across the platform.`
    };
  });
}

