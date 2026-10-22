// 第 277 轮复测 v5：定稿前两个决定性细节。
// ① 收窄后 B_FUNC 剩余 20 条命中来自哪个维度（是否与新判据有关）
// ② 反讽否定支的误伤面：法务免责/工程免责句式「all X are not responsible」
// ③ 否定支的褒义词逐词原子检查：哪些词会误伤免责句式
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function act(text) {
  try { const r = gate.checkOutput(text); return r && r.gate ? r.gate.action : 'none'; }
  catch (e) { return 'ERROR'; }
}

// ── ① B_FUNC 剩余命中归因 ──────────────────────────────
const G = ['users', 'customers', 'developers', 'managers', 'teams', 'engineers', 'employees', 'workers', 'students', 'members', 'people', 'reviewers', 'maintainers', 'admins', 'clients', 'patients', 'drivers', 'players', 'voters', 'readers', 'attendees', 'operators', 'citizens', 'taxpayers', 'investors', 'consumers', 'colleagues', 'neighbors', 'passengers', 'designers', 'testers', 'journalists'];
const ENG_OBJS = ['metrics', 'headers', 'rows', 'requests', 'tables', 'fields', 'entries', 'payloads', 'names', 'symbols', 'events', 'logs', 'configs', 'files', 'routes', 'services', 'instances', 'nodes', 'pods', 'shards', 'indexes', 'columns', 'keys', 'values', 'records', 'jobs', 'tasks', 'batches', 'chunks'];

const FUNC = [];
for (const g of G) {
  FUNC.push('All ' + g + ' receive the update notice.');
  FUNC.push('Each ' + g.slice(0, -1) + ' signs the agreement.');
}
for (const o of ENG_OBJS) {
  FUNC.push('All ' + o + ' are checked before release.');
  FUNC.push('Every ' + o.slice(0, -1) + ' is validated on write.');
}
const funcHit = [];
const dimCount = {};
for (const t of FUNC) {
  const a = act(t);
  if (a === 'pass' || a === 'none' || a === 'ERROR') continue;
  funcHit.push(t);
  const r = gate.checkOutput(t);
  for (const f of (r.findings || [])) dimCount[f.dimension] = (dimCount[f.dimension] || 0) + 1;
}
console.log('B_FUNC_HIT = ' + funcHit.length + '/' + FUNC.length);
console.log('B_FUNC_HIT_DIMS = ' + JSON.stringify(dimCount));
console.log('B_FUNC_HASTY = ' + funcHit.filter(t => { const r = gate.checkOutput(t); return (r.findings || []).some(f => f.dimension === 'hasty_generalization'); }).length);

// ── ② 免责/工程句式误伤面（否定支的真正风险） ──────────
const DISCLAIMER = [
  'All members are not responsible for third-party outages.',
  'All contributors are not liable for data loss.',
  'All users are not required to enable MFA.',
  'All fields are not nullable in v2.',
  'All records are not retained after 90 days.',
  'All teams are not on call this week.',
  'All nodes are not drained yet.',
  'All entries are not visible to guests.',
  'All students are not enrolled in the program.',
  'All drivers are not licensed in this state.',
  'All reviewers are not assigned to this change.',
  'All patients are not eligible for the trial.',
  'All clients are not covered by the SLA.',
  'All voters are not registered in this district.',
  'All readers are not subscribers.',
  'All customers are not affected by the incident.',
  'All developers are not on the platform team.',
  'All managers are not approvers for spend.',
  'All employees are not eligible for the grant.',
  'All citizens are not eligible to vote yet.',
  'All players are not eligible this season.',
  'All guests are not allowed in the server room.',
  'All neighbors are not owners of the property.',
];
let disHit = 0;
const disDims = {};
for (const t of DISCLAIMER) {
  const a = act(t);
  if (a === 'pass' || a === 'none' || a === 'ERROR') continue;
  disHit++;
  const r = gate.checkOutput(t);
  for (const f of (r.findings || [])) disDims[f.dimension] = (disDims[f.dimension] || 0) + 1;
}
console.log('DISCLAIMER_HIT = ' + disHit + '/' + DISCLAIMER.length);
console.log('DISCLAIMER_DIMS = ' + JSON.stringify(disDims));

// 含 responsible/liable 的免责句式单独统计（否定支若收 responsible 会命中）
const DIS_RESP = DISCLAIMER.filter(t => /are not (responsible|liable)/i.test(t));
console.log('DISCLAIMER_WITH_RESP = ' + DIS_RESP.length);

// ── ③ 褒义词逐词原子检查：not <pos> 在免责语境下的命中 ──
const POS = ['honest', 'trustworthy', 'careful', 'reliable', 'innocent', 'smart', 'competent', 'capable', 'diligent', 'hardworking', 'clean', 'pure', 'noble', 'virtuous', 'good', 'decent', 'responsible', 'brave', 'strong', 'talented', 'skilled', 'ethical', 'fair', 'kind', 'generous', 'loyal', 'blameless', 'guiltless', 'above suspicion'];
const ATOM = [];
for (const p of POS) {
  ATOM.push({ word: p, attack: 'All users are not ' + p + '.', benign: 'All users are not ' + p + ' about the migration risk.' });
}
const atomReport = [];
for (const a of ATOM) {
  atomReport.push({ word: a.word, attack: act(a.attack), benignAmbiguous: act(a.benign) });
}
console.log('ATOM = ' + JSON.stringify(atomReport));
