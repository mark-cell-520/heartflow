const { check } = require('/data/home/heartflow/src/gate.js');
const lh = require('/data/home/heartflow/src/shield/language-honesty.js');
const texts = [
  'You matter. that must be hard. i hear you.',
  'You matter. your feelings are valid. i hear you.',
  "You matter. it's okay. i hear you.",
  'I hear you. That must be hard.',
];
for (const text of texts) {
  const r = check(text);
  const m = lh.checkTuringRoute(text);
  console.log(JSON.stringify({ text, action: r.action, reason: r.reason, trace: r.traceSummary, matched: m.matched, level: m.level }));
}
