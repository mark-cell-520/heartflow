/**
 * r234 模块干跑 —— 直接加载 src/effort-justification.js 实测
 * 攻击必须 hit；良性/元话语/FP-stress 疑难良性必须不 hit。
 */
const { detectEffortJustification } = require('/data/home/heartflow/src/effort-justification.js');

const ATTACK = [
  // ZH
  '我们熬了几个月做出来的方案，质量肯定没问题。',
  '投入了这么多研发经费，产品不可能失败。',
  '团队这么努力，成绩一定好。',
  '他为这个课题呕心沥血多年，结论想必是对的。',
  '模型耗费了巨量算力训练这么久，结果质量一定高。',
  '我们夜以继日奋战数月，这个设计肯定是靠谱的。',
  '砸了这么多钱下去，这东西不可能错。',
  // EN
  'We worked on this for months, so it has to be correct.',
  'After all that effort, the conclusion has to be sound.',
  'They poured their blood, sweat, and tears into it, so the design must be reliable.',
  'We invested so much time and resources, therefore the product cannot be wrong.',
  'Countless sleepless nights went into this, so the result is certainly right.',
];

const BENIGN = [
  // 良性：独立举证/验证承载质量（无推断桥梁 or 有验证豁免）
  '团队攻坚三个月，独立第三方测试全部通过，产品质量可靠。',
  '虽然投入了大量精力，但方案仍需通过 A/B 实验验证才能上线。',
  '我们做了充分的市场调研和用户访谈，据此判断产品有市场。',
  '模型在标准 benchmark 上达到了 95% 准确率。',
  '反复实验上千次，数据表明这个配方是稳定的。',
  '花时间多少和结论正不正确没有必然联系，要看证据。',
  '参考文献综述显示，多数研究支持这一结论。',
  '经过同行评议，这篇论文的结论被认为是可靠的。',
  'We ran extensive tests and the benchmark numbers confirm the system is reliable.',
  '虽然别人做过类似系统，但这次我们采用了新技术，工期有望缩短。',
  // 纯努力陈述，无推断性质量结论
  '我们为这个项目投入了很多精力，但还在评估阶段。',
  '团队熬了好几个通宵，目前正在排查问题。',
  // 成就动词叙述真实结果（非"付出→质量"推论）
  '经过反复试验，我们终于实现了目标精度。',
  // 元话语
  '努力正当化是指人们因为投入了成本而高估其价值的倾向。',
  'The IKEA effect describes how people overvalue things they built themselves.',
  'Effort justification is a well-documented cognitive bias.',
];

let atkHit = 0, atkMiss = [];
for (const t of ATTACK) {
  const r = detectEffortJustification(t);
  if (r.hit) atkHit++; else atkMiss.push(t);
}
let benHit = 0, benFalse = [];
for (const t of BENIGN) {
  const r = detectEffortJustification(t);
  if (r.hit) { benHit++; benFalse.push(t + '  ::  ' + r.details); }
}

console.log('===== 攻击命中 =====');
console.log(`命中 ${atkHit}/${ATTACK.length}`);
if (atkMiss.length) { console.log('未命中:'); atkMiss.forEach(t => console.log('  ✗ ' + t)); }
console.log('\n===== 良性误报 =====');
console.log(`误报 ${benHit}/${BENIGN.length}`);
if (benFalse.length) { console.log('误报明细:'); benFalse.forEach(t => console.log('  ✗ ' + t)); }

// 抽样看一条攻击的完整输出
console.log('\n===== 样例输出 =====');
console.log(JSON.stringify(detectEffortJustification(ATTACK[0]), null, 1));
