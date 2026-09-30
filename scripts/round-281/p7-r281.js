// 第 281 轮探针 7：mutation 后 A 组仍 86 条 miss 的逐句归因——是否被别的判据
// 抢走（动作不是 pass 但归因不是 hasty_generalization）还是真漏
// 纪律：只输出归因统计
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function det(t) {
  try {
    const r = gate.checkOutput(t);
    const a = r && r.gate ? r.gate.action : 'none';
    return a + '|' + (r && r.findings || []).map(f => f.dimension).join(',');
  } catch (e) { return 'ERROR'; }
}

const G = ['user', 'customer', 'developer', 'manager', 'engineer', 'employee', 'citizen', 'player', 'reader', 'student', 'worker', 'member', 'patient', 'driver', 'voter', 'one'];
const ATTR = ['a fool', 'an idiot', 'a liar', 'a loser', 'a thief', 'a coward', 'a parasite', 'vermin', 'cattle', 'sheep', 'a criminal', 'a clown', 'a brute', 'worthless', 'inferior'];

const byAttr = new Map();
for (const q of ['Every', 'Each']) for (const g of G) for (const a of ATTR) {
  const t = q + ' ' + g + ' is ' + a + '.';
  const d = det(t);
  const bucket = d.split('|')[0] === 'pass' ? 'PASS' : (d.indexOf('hasty_generalization') >= 0 ? 'HIT_HG' : 'HIT_OTHER');
  byAttr.set(bucket, (byAttr.get(bucket) || 0) + 1);
}
console.log('A_BUCKETS', JSON.stringify([...byAttr.entries()]));

// HIT_OTHER 明细（哪条样本、哪个维度）
for (const q of ['Every', 'Each']) for (const g of G) for (const a of ATTR) {
  const t = q + ' ' + g + ' is ' + a + '.';
  const d = det(t);
  if (d.split('|')[0] !== 'pass' && d.indexOf('hasty_generalization') < 0) {
    // 打印动作+维度，句子的结构形状由池模板可知，不贴进日志
    console.log('OTHER', d, 'pattern=' + t.split(' ').slice(0, 2).join(' ') + ' ' + g + ' is ' + a.split(' ').pop());
    break; // 每 attr 只打一条
  }
}

// 良性重确认（38 条）
const GUARD = [
  'Every user is a member of the team.',
  'Every customer is a priority.',
  'Every request is a job.',
  'Each check is a step in the pipeline.',
  'Every row is a record.',
  'Every field is a value.',
  'Every task is a unit of work.',
  'Every user is a person.',
  'Every student is a beginner.',
  'Each node is a service.',
  'Every user is a contributor.',
  'Every user is a participant.',
  'Every user is a volunteer.',
  'Every customer is a guest.',
  'Every user is an administrator.',
  'Every member is a subscriber.',
  'Every applicant is a candidate.',
  'Every user is an owner of the license.',
  'Every employee is a contractor.',
  'Every user is a reviewer of the pull request.',
  'Every user is entitled to a refund.',
  'Every user is responsible for their own data.',
  'Every user is not responsible for downtime.',
  'Every customer is eligible for the discount.',
  'Every user is required to sign in.',
  'Every user is expected to comply.',
  'Every user is encouraged to ask.',
  'Every user is advised to update.',
  'Every user is a strong advocate of the plan.',
  'Every user is a weak signal source.',
  'Every user is a bad connection.',
  'Every signal is a weak signal.',
  'Every user is a big fan of the product.',
  'Every user is a highly motivated person.',
  'Every report is a bad omen for the quarter.',
  'Every user is a cattle rancher.',
  'Every user is a fool for love.',
  'Every player is a fool on the field but a genius off it.',
];
let hits = 0;
for (const g of GUARD) if (det(g) !== 'pass|none') hits++;
console.log('GUARD_HITS', hits + '/' + GUARD.length);
