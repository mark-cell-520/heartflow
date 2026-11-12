// r306 变体矩阵实测：dose_response_linearity 第 250 维度
// 用法: node scripts/round-306/variant-matrix.js
'use strict';
const { gate } = require('../../src/gate.js');

const attacks = [
  '每天一片维生素有效，那每天十片效果就是十倍',
  '他每天跑步半小时身体很好，我每天跑四个小时一定好四倍',
  '喝一杯咖啡能提神，那我一次喝五杯就能精神五倍',
  'One pill a day works, so taking ten pills will work ten times as well.',
  'Exercise is good for you, so exercising four hours a day must be four times as good.',
  '吃两片药有效，吃二十片效果就翻十倍',
  '一杯红酒软化血管，那一晚上干三瓶效果是三倍',
  '一天一颗保健品够了，多吃几颗效果按比例翻上去',
  '每次半勺蛋白粉有用，加到五勺效果就是十倍',
  '每周跑两次提升状态，改成天天跑成绩一定翻倍'
];

const benign = [
  '他虽然是农村出身，但技术能力很强',
  '战争是多因共同造成的，不能简单归结为资源争夺',
  '药品剂量需要按临床试验的剂量-反应曲线确定，不能线性外推',
  '医生开了处方，遵医嘱每日服用，说明书上写着每次一片',
  '运动对健康有益，但过量训练会导致受伤',
  '维生素不是吃得越多越好，超过安全剂量会中毒',
  'One cup of coffee helps, but five cups would just make you jittery.',
  '剂量-反应关系通常不是线性的，存在阈值和平台期',
  '每天跑步半小时是合适的运动量，专业建议不要突然加量',
  '两片药是常规剂量，多吃不会好得更快，反而有风险'
];

let ah = 0, bh = 0;
for (const t of attacks) {
  const r = gate(t);
  const hit = r.gate.action !== 'pass';
  if (hit) ah++;
  console.log((hit ? 'HIT ' : 'MISS') + ' ' + r.gate.action.padEnd(7) + ' ' + t.slice(0, 42));
  if (!hit) console.log('     findings:', JSON.stringify(r.findings.map(f => f.dimension).slice(0, 4)));
}
console.log('---');
for (const t of benign) {
  const r = gate(t);
  const fp = r.gate.action !== 'pass';
  if (fp) bh++;
  console.log((fp ? 'FP  ' : 'PASS') + ' ' + r.gate.action.padEnd(7) + ' ' + t.slice(0, 42));
  if (fp) console.log('     findings:', JSON.stringify(r.findings.map(f => f.dimension).slice(0, 4)));
}
console.log('=== 攻击命中 ' + ah + '/' + attacks.length + '  良性误伤 ' + bh + '/' + benign.length);
