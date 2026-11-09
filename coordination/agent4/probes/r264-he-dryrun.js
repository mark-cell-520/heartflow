// r264 halo_effect 补丁后干跑（模块层 + gate 层 + 注入-删条）
const { checkHaloEffect, __internals } = require('/data/home/heartflow/src/halo-effect.js');
const { gate } = require('/data/home/heartflow/src/gate.js');
const hit = (t, inj) => checkHaloEffect(t, inj).hit === true;

const attacks = [
  'He came from a big tech firm, so his engineering must be solid.',
  'She worked at a major tech company, therefore her leadership is certainly strong.',
  'He joined big tech, so his code quality must be excellent.',
  'The candidate came from a tech giant, hence his architecture skills are surely top-notch.',
  'He came from a large corporation, so his engineering must be solid.',
];
const benign = [
  'He came from a big tech firm, but company pedigree alone says nothing about his engineering.',
  'She graduated from a top school, but that does not mean her character is dependable.',
  'He is tall and handsome, but looks are irrelevant to his judgment.',
  'She worked at a major tech company, though this says nothing about her leadership.',
];

let ah = 0, ag = 0, bh = 0;
for (const s of attacks) {
  const m = hit(s);
  const dim = (gate(s).findings || []).some(x => x.dimension === 'halo_effect');
  if (m) ah++;
  if (dim) ag++;
  console.log((m ? 'HIT' : 'miss') + ' gate=' + gate(s).gate.action + (dim ? '(dim)' : '') + '  ' + s.slice(0, 52));
}
for (const s of benign) {
  const m = hit(s);
  const dim = (gate(s).findings || []).some(x => x.dimension === 'halo_effect');
  if (m) bh++;
  if (m || dim) console.log('误伤! ' + s.slice(0, 52));
}
console.log('==> 攻击 ' + ah + '/' + attacks.length + ' 模块命中, ' + ag + '/' + attacks.length + ' gate 维度承重; 良性误伤 ' + bh + '/' + benign.length);

// 注入-删条：元素专属攻击句（[4] 专属 large corporation / [5] 专属 tech giant）
const I = __internals();
const OLD = 'He is tall and handsome, so his judgment must be sound.';
for (const [idx, atk] of [[4, 'He came from a large corporation, so his engineering must be solid.'], [5, 'The candidate came from a tech giant, hence his architecture skills are surely top-notch.']]) {
  const inj = { TRAIT_EN: I.TRAIT_EN.filter((re, i) => i !== idx) };
  const after = hit(atk, inj);
  const old = hit(OLD, inj);
  console.log('注入 TRAIT_EN[' + idx + '] → 专属攻击' + (after ? '未变红(FAIL)' : '变红(承重)') + ', 旧攻击' + (old ? '仍命中(OK)' : '失效(FAIL)'));
}
// 两模式同时删（整族置空）后全部新攻击须 miss
const injAll = { TRAIT_EN: I.TRAIT_EN.slice(0, 4) };
const aAll = attacks.some(s => hit(s, injAll));
console.log('整族置空（只留旧 4 元素）→ 新攻击' + (aAll ? '未变红(FAIL)' : '全变红(承重)'));
