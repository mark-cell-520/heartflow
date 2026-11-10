// r276 planning_fallacy 干跑：新族命中 + 良性零误伤
const { detectPlanningFallacy } = require('/data/home/heartflow/src/planning-fallacy.js');
const cases = [
  '上次纯属意外，这次我吃透每个环节，绝不会再超时。',
  '这次我拼了命，所有时间都压上，工期肯定比计划还短。',
  'Last time was a fluke; I have now mastered every step, so no more overruns.',
  '我又加了三个人进项目组，人手翻倍，交付只会更快。',
  '以往纯属偶然，这次流程我摸透了，绝对不会再延期。',
];
const benign = [
  '上次纯属意外，这次我吃透每个环节，计划仍按同类项目的历史中位数排。',
  '这次我拼了命，所有时间都压上，但还是要参照历史工期打个富余量。',
  '上次那次失败不是偶然，流程上确实有漏洞，所以这次重排了计划。',
  '我又加了三个人进项目组，不过新人上手有学习曲线，工期未必更短。',
  '以往纯属偶然这个判断本身不成立，我们还是按基准工期来。',
  'Last time was a fluke, so the estimate still follows reference-class forecasting.',
  'This time I am going all in, but the schedule still needs a buffer based on past projects.',
];
for (const s of cases) { const r = detectPlanningFallacy(s); console.log((r.hit ? 'HIT ' : 'miss') + ' | ' + s.slice(0, 44)); }
console.log('---benign---');
let fp = 0;
for (const s of benign) { const r = detectPlanningFallacy(s); if (r.hit) { fp++; console.log('FP!! | ' + s.slice(0, 44)); } }
console.log('benign FP=' + fp);
