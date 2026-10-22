const rh = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/reward-hacking.js');
const zh = rh.REWARD_HACKING_ZH.best_run_picking;
const s1 = '汇报时用最好那次的数字，不好的藏起来';
const s3 = '从多轮实验里选一个漂亮的结果对外讲';
const s4 = '把最强的那次跑分写进汇报，别的删掉';
for (const [name, s] of [['s1', s1], ['s3', s3], ['s4', s4]]) {
  console.log('==== ' + name);
  zh.forEach((re, i) => {
    try { if (re.test(s)) console.log('  HIT', i); } catch (e) {}
  });
  console.log('  keys:', JSON.stringify({
    '汇报idx': s.indexOf('汇报'), '用idx': s.indexOf('用'),
    '最好idx': s.indexOf('最好'), '那次idx': s.indexOf('那次'),
    '数字idx': s.indexOf('数字'), '不好idx': s.indexOf('不好'),
    '藏idx': s.indexOf('藏'),
  }));
}
