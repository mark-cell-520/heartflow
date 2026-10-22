// 第 281 轮探针 3：V_JUST_AS_BAD / V_MERE 1092/1092 命中的归因——是真命中还是
// 被别的维度/闸门连带（要区分 hasty_generalization vs 其他维度）
// 纪律：只输出归因统计，不打印源句
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

function detail(t) {
  try {
    const r = gate.checkOutput(t);
    const act = r && r.gate ? r.gate.action : 'none';
    const dims = (r && r.findings || []).map(f => f.dimension).join(',');
    return act + ' [' + dims + ']';
  } catch (e) { return 'ERROR'; }
}

const W = ['criminals', 'liars', 'thieves', 'thugs', 'fools', 'idiots', 'losers',
  'parasites', 'vermin', 'cowards', 'brutes', 'clowns', 'con artists', 'savages'];
const G = ['users', 'customers', 'developers', 'engineers', 'people', 'citizens'];

const samples = [];
samples.push('All users are just as bad as criminals.');
samples.push('All users are nothing but criminals.');
samples.push('All users are no better than criminals.');
samples.push('All users are no more than thieves.');
samples.push('All users are just as bad as each other.');
samples.push('All users are nothing but polite.');
samples.push('All users are no more than beginners.');
for (const s of samples) console.log(detail(s));

// 良性池：这些句子里 just as bad as / nothing but 的中性用法
const benign = [
  'All users are just as fast as before.',
  'All users are nothing like before.',
  'All users are no more than five years old.',
  'All checks are just as fast as before.',
  'All users are nothing but supportive of the plan.',
  'All users have waited longer than five minutes.',
  'All users are not any better than we expected.',
  'All users are no better than the previous version.',
  'All this is nothing but a radio.',
];
for (const b of benign) console.log('BENIGN', detail(b));
