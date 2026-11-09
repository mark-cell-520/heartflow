// r264 common_cause 补丁后干跑（模块层 + gate 层 + 注入-删条）
const { checkCommonCause, __internals } = require('/data/home/heartflow/src/common-cause.js');
const { gate } = require('/data/home/heartflow/src/gate.js');
const hit = (t, inj) => checkCommonCause(t, inj).hit === true;

const attacks = [
  // ZH 新共变词族
  '冰淇淋销量和溺水人数双双走高，说到底都是高温推动的。',
  '搜索量和成交量越涨越猛，说到底都是流量红利推动的。',
  '加班时长和离职率双双回落，根源在于新考勤制度。',
  // EN 新共变词族 + 新因果动词族
  'Ice cream sales and drownings both climbed this summer, and the heat wave drives both.',
  'Ad spend and signups rose in lockstep, both trace back to the same campaign push.',
];
const benign = [
  '冰淇淋销量和溺水人数相关，但这是典型的相关不等于因果，需要第三变量解释。',
  '搜索量和成交量越涨越猛，但要区分谁是因谁是果，需要实验验证。',
  'Ice cream sales and drownings both climbed this summer, though correlation alone cannot establish a common cause.',
  'Ad spend and signups rose in lockstep, but this does not mean one causes the other.',
  '冰淇淋销量和溺水人数双双走高，但双双走高不等于谁是因谁是果，需要控制高温变量后再看。',
];

let ah = 0, ag = 0, bh = 0;
for (const s of attacks) {
  const m = hit(s);
  const g = gate(s);
  const dim = (g.findings || []).some(x => x.dimension === 'common_cause');
  if (m) ah++;
  if (dim) ag++;
  console.log((m ? 'HIT' : 'miss') + ' gate=' + (g.gate ? g.gate.action : '?') + (dim ? '(dim)' : '') + '  ' + s.slice(0, 44));
}
for (const s of benign) {
  const m = hit(s);
  const dim = (gate(s).findings || []).some(x => x.dimension === 'common_cause');
  if (m) bh++;
  if (m || dim) console.log('误伤! ' + s.slice(0, 44));
}
console.log('==> 攻击 ' + ah + '/' + attacks.length + ' 模块命中, ' + ag + '/' + attacks.length + ' gate 维度承重; 良性误伤 ' + bh + '/' + benign.length);

// 注入-删条：删新共变/新因果模式后对应攻击转 miss
const INJ = [
  { arr: 'COVARY_MOVE_ZH', idx: 1, atk: '冰淇淋销量和溺水人数双双走高，说到底都是高温推动的。' },
  { arr: 'COVARY_MOVE_ZH', idx: 2, atk: '搜索量和成交量越涨越猛，说到底都是流量红利推动的。' },
  { arr: 'COVARY_MOVE_EN', idx: 1, atk: 'Ice cream sales and drownings both climbed this summer, and the heat wave drives both.' },
  { arr: 'CAUSE_EN', idx: 1, atk: 'Ad spend and signups rose in lockstep, both trace back to the same campaign push.' },
];
for (const c of INJ) {
  const full = __internals()[c.arr];
  assert: {
    if (!(full.length > c.idx)) { console.log('注入失败: ' + c.arr + ' 长度不足'); break assert; }
  }
  const inj = {}; inj[c.arr] = full.filter((re, i) => i !== c.idx);
  const after = hit(c.atk, inj);
  console.log('注入 ' + c.arr + '[' + c.idx + '] → ' + (after ? '未变红(FAIL)' : '变红(承重)') + '  ' + c.atk.slice(0, 36));
}
