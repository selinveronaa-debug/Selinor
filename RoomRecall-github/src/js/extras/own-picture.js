/**
 * RoomRecall · extras/own-picture.js
 * Students write their own picture for a spot; Claude rates it and gives one tip.
 */

/* ---------- Draw it yourself ---------- */
let ownTarget = null;
function openOwnPicture(h, it) {
  ownTarget = { h, it };
  $('#ownCtx').textContent = `${cap(it.spot)} · ${it.question} → ${it.answer}`;
  $('#ownText').value = it.ownStory || '';
  $('#ownFeedback').hidden = true;
  $('#ownCheck').hidden = !aiOn();
  $('#ownDialog').hidden = false; $('#ownText').focus();
}
$('#ownClose').addEventListener('click', () => { $('#ownDialog').hidden = true; });
$('#ownCheck').addEventListener('click', async e => {
  const text = $('#ownText').value.trim(); if (!ownTarget || text.length < 8) { toast('Write a sentence first.', 2500); return; }
  const { it } = ownTarget; const b = e.target; b.disabled = true; b.textContent = '✦ Reading…';
  try {
    const r = await AI.sample.json(`A student wrote their own memory-palace picture.
Spot: ${it.spot}
Question: ${it.question}
Answer: ${it.answer}
Their picture: ${text}
Rate it from 1 to 5 on how well it will trigger the answer (vivid, moving, touches the spot, shows every key part of the answer). Then give ONE short, friendly, concrete tip in plain English (max 25 words) to make it stronger.
Reply with only JSON: {"score":4,"tip":"..."}`, { cache: false, modelTier: 'quick' });
    const score = Math.max(1, Math.min(5, Math.round(+r?.score || 3)));
    $('#ownFeedback').innerHTML = `<b>${'★'.repeat(score)}${'☆'.repeat(5 - score)}</b><span>${esc(cleanStr(r?.tip, 200))}</span>`;
    $('#ownFeedback').hidden = false;
  } catch (err) { aiErrorText(err); toast('Claude could not read it right now. You can still save it.'); }
  finally { b.disabled = false; b.textContent = '✦ Ask Claude for a tip'; }
});
$('#ownSave').addEventListener('click', () => {
  const text = $('#ownText').value.trim(); if (!ownTarget || text.length < 8) { toast('Write a sentence first.', 2500); return; }
  const { h, it } = ownTarget;
  it.claudeStory = it.claudeStory || it.story; it.story = text; it.ownStory = text;
  upsertHouse(h); $('#ownDialog').hidden = true; renderMemCard(); addGems(5, 'own picture');
});
