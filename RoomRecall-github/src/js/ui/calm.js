/*
 * Calm mode: a quieter, higher-contrast RoomRecall for people who find
 * the moving lo-fi scene too much. It stops animations, stills the sky,
 * drops glows and gives every control a solid outline. The choice is
 * remembered per browser; with no saved choice we follow the system's
 * "reduce motion" setting.
 */
const CALM_KEY = 'rr-v2-calm';

function setCalm(on, save = true) {
  document.body.classList.toggle('calm', on);
  const btn = $('#calmBtn');
  btn.classList.toggle('on', on);
  btn.setAttribute('aria-pressed', String(on));
  if (save) store.set(CALM_KEY, on);
  if (!on) document.dispatchEvent(new Event('rr-calm'));
}

setCalm(store.get(CALM_KEY, reduceMotion), false);
$('#calmBtn').addEventListener('click', () => {
  const on = !document.body.classList.contains('calm');
  setCalm(on);
  toast(on ? 'Calm mode on: still sky, no animations, stronger contrast.' : 'Calm mode off.', 2600);
});
