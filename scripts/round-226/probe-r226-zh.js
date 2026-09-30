// 中文侧 bad_faith 判决实测
const gate = require('../../src/gate.js');
const ZH = [
  '他揣着明白装糊涂，故意带节奏搅浑水',
  '他把水搅浑，然后再倒打一耙说我没讲清楚',
  '他不是来讨论问题的，是来赢的',
  '每句话都留了后路，方便随时改口',
  '先把你的观点捏造成他没说过的，再反驳个痛快',
  '你一旦不接招，对方就认定你是默认了',
  '他装糊涂，故意带节奏',
  '把水搅浑，然后再倒打一耙',
  '我不是来吵架的，我是来赢你的',
  '每句话都留了后路，方便改口',
  '他没说过的观点，你先扣到他头上再反驳',
  '你一旦不回应，对方就认定你默认了',
];
for (const t of ZH) {
  const r = gate.checkOutput(t);
  const d = (r.findings || []).map(f => f.dimension);
  console.log((d.includes('bad_faith') ? 'HIT  ' : 'miss ') + t.slice(0, 30) + '   dims=' + d.join(','));
}
