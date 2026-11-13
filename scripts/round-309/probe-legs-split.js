// r309 双腿分别实测：定位每个漏判样本是腿①（ANCHOR_EN）缺还是腿②（DOMINATED_EN）缺
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const mod = require(path.join(ROOT, 'src', 'anchoring-effect.js'));
const I = mod.__internals();
const ANCHOR_EN = I.ANCHOR_EN;
const DOMINATED_EN = I.DOMINATED_EN;

const SAMPLES = [
  'He opened at eight thousand, and I settled at sixty-five hundred without ever valuing it independently.',
  'The opening offer was eight thousand, and I agreed at sixty-five hundred without checking comparable prices.',
  'They listed it at forty thousand, and we signed at thirty-two thousand without reassessing the value ourselves.',
  'The first number was two hundred, and every counter never left the orbit of that opening bid.',
  'The asking price was nine hundred, so my bid stayed inside the orbit of that number the whole time.',
  'It was priced at five thousand, and I never questioned whether it was worth that much to me.',
  'The salary floor was set at eighty, and the offer came in at ninety-two without independently estimating my market value.',
  'The sticker said ten thousand, so the offer of seven felt like a great deal.',
];

function leg(list, text) {
  const hits = [];
  for (const re of list) {
    const m = text.match(new RegExp(re.source, 'i'));
    if (m) hits.push(m[0]);
  }
  return hits;
}

console.log('=== 双腿分别实测（lowercase 后文本，与 gate _normText 一致）===');
SAMPLES.forEach((s, i) => {
  const t = s.toLowerCase();
  const a = leg(ANCHOR_EN, t);
  const d = leg(DOMINATED_EN, t);
  const tag = a.length && d.length ? 'PAIR-OK' : (a.length ? 'LEG2-MISS' : (d.length ? 'LEG1-MISS' : 'BOTH-MISS'));
  console.log(`C${i + 1} ${tag}`);
  console.log(`     leg1: ${a.length ? a.join(' | ') : '(none)'}`);
  console.log(`     leg2: ${d.length ? d.join(' | ') : '(none)'}`);
});
