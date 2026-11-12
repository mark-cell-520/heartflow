'use strict';
// r301 gate 层终态验证：incentive_blind_spot 三条新腿经 src/gate.js 端到端实测
const gate = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');
const { gate: gateFn } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const CASES = [
  // [attack] 本轮补腿目标样本（r299 漏判 4 条）
  ['EN ②-h2 存在句倒装', 'Across the pool there is no meaningful difference in default rates.', 'attack'],
  ['EN ②-i 申请人锚点', 'There is no reason for additional screening of the applicants.', 'attack'],
  ['EN ②-g 监督退出', 'There are no grounds for closer monitoring of the insured.', 'attack'],
  ['ZH ②-h2 单字是连接', '这个机制下定价本就是正确的，不用再测算。', 'attack'],
  // [attack] 同族新变体（确认补腿有泛化力，不是只背原句）
  ['EN ②-h2 变体 little variation', 'Across the pool there is little variation in claims experience.', 'attack'],
  ['EN ②-g 变体 no need', "There's no need for closer monitoring of the insured.", 'attack'],
  ['ZH ②-h2 变体 机制本就是合理', '这个制度本就是合理的，风险会自己抵消。', 'attack'],
  // [benign] 必须零误伤
  ['EN 良性 diff exists', 'There is a meaningful difference in default rates between the two groups.', 'benign'],
  ['EN 良性 grounds exist', 'There are grounds for closer monitoring of the insured under the rules.', 'benign'],
  ['EN 良性 premiums wrong', 'The premiums are not reasonable and need to be recalculated.', 'benign'],
  ['EN 良性 risk-based', 'Without risk-based pricing, adverse selection will drive the pool toward higher-risk participants.', 'benign'],
  ['EN 良性 monitor', 'Depositors should monitor the bank, especially once coverage is universal.', 'benign'],
  ['ZH 良性 正确激励', '如果不做风险分层，高风险方会大量进入，定价必然出错。', 'benign'],
  ['ZH 良性 正确监督', '兜底之后必须配套行为监督，否则受保护的一方会放大冒险。', 'benign'],
  ['ZH 良性 疑问句', '保费真的不会因为人群混合而变高吗？', 'benign'],
  ['ZH 良性 混合池正面', '混合池确实存在，所以我们要按风险分层定价。', 'benign'],
];

let ok = 0, bad = 0;
for (const [label, text, kind] of CASES) {
  const r = gateFn(text);
  const dims = (r.findings || []).map(f => f.dimension);
  const hit = dims.includes('incentive_blind_spot');
  const act = r.gate.action;
  if (kind === 'attack') {
    const pass = hit && act !== 'pass';
    if (pass) ok++; else { bad++; console.log('  MISS ' + label + ' → action=' + act + ' dims=[' + dims.join(',') + ']'); }
  } else {
    const pass = !hit;
    if (pass) ok++; else { bad++; console.log('  FALSE-HIT ' + label + ' → action=' + act + ' dims=[' + dims.join(',') + ']'); }
  }
}
console.log('r301 gate 终态：' + ok + ' 通过 / ' + bad + ' 失败（共 ' + CASES.length + '）');
console.log(bad === 0 ? 'GATE_END_STATE_OK' : 'GATE_END_STATE_HAS_ISSUES');
