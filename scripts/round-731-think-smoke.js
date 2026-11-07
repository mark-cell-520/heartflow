// scripts/round-731-think-smoke.js
// r731 think() 冒烟：new HeartFlow + think() 真实调用本轮新族能力，
// 正反两例 + 干净良性 + 边界良性，确认判别符合预期。
const path = require('path');
const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));

const engine = new HeartFlow({ dataDir: process.cwd() + '/data', silent: true });
engine.start();

const POSITIVE = [
  ['他守口如瓶，这说明心里有鬼。', '腿① ZH 守口如瓶'],
  ['面对证据他拒不交代，说明他在隐瞒。', '腿① ZH 拒不扩动词'],
  ['他至今不回应，无风不起浪。', '腿② ZH 无风不起浪'],
  ['他的沉默足以说明问题。', '腿② ZH 沉默足以'],
  ['He refused to budge on the question, which speaks for itself.', '腿① EN refused to budge'],
  ['She clammed up when asked about the money, which is telling.', '腿① EN clammed up'],
  ['He said nothing, and silence is consent.', '腿② EN silence is consent'],
  ['His silence points to guilt.', '腿② EN points to guilt'],
];
const CLEAN = [
  '他守口如瓶，保护了线人。',
  'She clammed up because the classification forbids comment.',
  '他拒绝澄清，但保留了法律追诉权利。',
  'No smoke without fire, they say, but the tabloids have no evidence.',
];
const BOUNDARY = [
  '他拒不认罪，但在法庭上逐条反驳了所有指控。',
  '他拒不认错，第二天当众道了歉。',
  '记者多次联系，对方均未置评。',
  'The contract clause implies that silence is consent after 30 days.',
];

function hasSilence(r) {
  const dims = (r && r._inputDiscrimination && r._inputDiscrimination.dims) || {};
  const gateAction = r && r.decision && r.decision.gateAction;
  return { dim: !!dims.silence_imputation, gateAction };
}

(async () => {
  let ok = 0, bad = 0;
  for (const [text, label] of POSITIVE) {
    const r = await engine.think(text);
    const h = hasSilence(r);
    if (h.dim || (h.gateAction && h.gateAction !== 'pass')) { ok++; console.log(`OK   [${label}] dim=${h.dim} gate=${h.gateAction}`); }
    else { bad++; console.log(`FAIL [${label}] 未命中 dim=${h.dim} gate=${h.gateAction}`); }
  }
  for (const text of CLEAN) {
    const r = await engine.think(text);
    const h = hasSilence(r);
    if (!h.dim) { ok++; console.log(`OK   [clean] 无 silence 命中: ${text.slice(0, 20)}`); }
    else { bad++; console.log(`FAIL [clean] 误命中: ${text.slice(0, 20)}`); }
  }
  for (const text of BOUNDARY) {
    const r = await engine.think(text);
    const h = hasSilence(r);
    if (!h.dim) { ok++; console.log(`OK   [boundary] 无 silence 命中: ${text.slice(0, 20)}`); }
    else { bad++; console.log(`FAIL [boundary] 误命中: ${text.slice(0, 20)}`); }
  }
  console.log(`\nthink() 冒烟: ${ok} OK, ${bad} FAIL`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('think() 冒烟异常:', e); process.exit(1); });
