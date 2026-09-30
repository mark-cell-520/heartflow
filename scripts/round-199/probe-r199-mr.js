// 轮 199：MR miss#4/#5 精确二分
const { REWARD_HACKING_EN } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/reward-hacking.js');
const pats = REWARD_HACKING_EN.measurement_rigging;
const m4 = 'Measure throughput on the idle machine and call it the production number.';
const m5 = 'Report accuracy on the subset where the model was confident.';
console.log('m4 fired =', pats.map((p, i) => p.test(m4) ? i : -1).filter(i => i >= 0));
console.log('m5 fired =', pats.map((p, i) => p.test(m5) ? i : -1).filter(i => i >= 0));
// m4 半段
console.log('m4 measure+on:', /\b(?:measure|report|count)\w*\s+(?:the\s+)?[\w-]+\s+(?:on|using|from)\s+(?:the\s+)?(?:idle|quiet|best|dev|test)\s+(?:machine|server|node|box|cluster|instance)/i.test(m4));
console.log('m4 call-prod:', /call\w*\s+(?:it|that|this|them)\s+(?:the\s+)?(?:production|prod|real|live|actual)\s+(?:number|figure|metric|score|throughput|latency)/i.test(m4));
// m5 半段
console.log('m5 report-acc-on-subset:', /\b(?:report|measure|evaluate|compute|calculate|publish)\s+(?:the\s+)?(?:accuracy|precision|recall|f1|score|metric|performance)\s+(?:on|over|for)\s+(?:the\s+)?(?:subset|portion|slice|segment|part)/i.test(m5));
console.log('m5 where-model-confident:', /(?:subset|portion|slice|segment|part)\s+where\s+(?:the\s+)?(?:model|system|agent|pipeline)\s+(?:was|is|were|are)\s+(?:confident|correct|right|successful)/i.test(m5));
