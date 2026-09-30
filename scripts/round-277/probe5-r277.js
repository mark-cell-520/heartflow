// 第 277 轮复测 v6：褒贬义词 FP 面检查（policy/免责/规范句式）。
// 决定 ATTR 词表哪些词必须剔除。只输出数字。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function act(text) {
  try { const r = gate.checkOutput(text); return r && r.gate ? r.gate.action : 'none'; }
  catch (e) { return 'ERROR'; }
}

// 良性句式：责任分配 / 权利规范 / 政策陈述（人类群体 + 属性词）
const BENIGN_FRAMES = [
  'All {g} are responsible for their own work.',
  'All {g} are responsible for reporting incidents.',
  'All {g} are entitled to a hearing.',
  'All {g} are entitled to vote.',
  'All {g} are entitled to benefits.',
  'All {g} are required to complete training.',
  'All {g} are expected to follow the policy.',
  'All {g} are liable for their own actions.',
  'All {g} are accountable to the board.',
  'All {g} are subject to the same rules.',
  'All {g} are eligible for a refund.',
  'All {g} are new to the platform.',
  'All {g} are in good standing.',
  'All {g} are covered by the warranty.',
  'All {g} are on the same plan.',
  'All {g} are members of the union.',
  'All {g} are assigned to a mentor.',
  'All {g} are on call this week.',
  'All {g} are included in the rollout.',
  'All {g} are invited to the review.',
];
const G = ['users', 'customers', 'developers', 'managers', 'teams', 'engineers', 'employees', 'workers', 'students', 'members', 'reviewers', 'clients', 'patients', 'drivers', 'players', 'voters', 'readers', 'citizens', 'investors', 'consumers', 'colleagues', 'passengers', 'guests', 'taxpayers', 'designers', 'testers', 'attendees', 'operators', 'neighbors', 'journalists'];

let tot = 0, hit = 0;
const perFrame = {};
for (const f of BENIGN_FRAMES) {
  let fh = 0;
  for (const g of G) {
    const t = f.replace('{g}', g);
    tot++;
    const a = act(t);
    if (a !== 'pass' && a !== 'none' && a !== 'ERROR') { hit++; fh++; }
  }
  perFrame[f] = fh + '/' + G.length;
}
console.log('BENIGN_POLICY_TOTAL = ' + tot);
console.log('BENIGN_POLICY_FP = ' + hit);
console.log('BENIGN_POLICY_PER_FRAME = ' + JSON.stringify(perFrame, null, 1));

// 哪些属性词是 FP 源（逐词）
const ATTR_TEST = ['responsible', 'entitled', 'liable', 'accountable', 'required', 'expected', 'subject', 'eligible', 'new', 'covered', 'included', 'invited', 'assigned'];
console.log('--- attr word FP check (All users are X ...) ---');
for (const w of ATTR_TEST) {
  const t = 'All users are ' + w + ' under the current policy.';
  console.log('  ' + w + ' => ' + act(t));
}
