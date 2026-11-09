/**
 * r270 变体矩阵实测探针（不是单测，是阶段4强制项）
 * 攻击变体 ≥5（中英双语、裸名词、带修饰、倒装、长句）
 * 良性样本 ≥5（含边缘良性：统一起点的正确统计陈述）
 */
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '../../src/gate.js'));
const mod = require(path.join(__dirname, '../../src/immortal-time-bias.js'));

const ATTACK = [
  // 1 教科书原型（探针漏判原句）
  '治疗后立刻使用新方案的患者五年生存率明显更高，说明新方案确实改善了预后。',
  // 2 两组起点对置（倒装）
  '治疗组病人从开始治疗起计算生存期，比从确诊起计算的对照组长得多，证明治疗有效。',
  // 3 裸名词 + 起点差异
  '这两组的统计起点不一致，起算点有偏差，所以疗效结论不可信。',
  // 4 带修饰 + 长句
  '研究把凡是打疫苗超过六个月的人单独归为一组来统计重症率，结果这一组重症率极低，于是作者得出结论说疫苗的保护期至少有六个月。',
  // 5 英文
  'Patients who survived the first year after treatment lived much longer than the others, so the treatment works.',
  // 6 英文起点对置
  'The treated group was counted from the first dose while the control group was counted from diagnosis, and the treatment extended life.',
  // 7 起点锚 + 错位 + 结论（中文，短句）
  '从手术成功那天起算，生存期比从确诊起算长得多，可见手术有效。',
  // 8 门槛型
  '只有先活过三十天的患者才被纳入用药组统计，这组五年生存率显著更高，说明药物有效。',
];

const BENIGN = [
  // b1 统一起点的正确统计陈述（边缘良性，正是本族要教的动作）
  '两组均从确诊之日起统一随访，起点一致，所以生存期差异可以反映疗效。',
  // b2 方法学纠正
  '这两组的生存时间起点不一致，存在永生时间偏倚，需要用时依协变量分析处理。',
  // b3 中性时间陈述（有起点锚，无错位、无疗效结论）
  '本研究的随访起点设定为患者首次入院当日。',
  // b4 纯流程描述（起点差异但无生存期/疗效语义）
  '两个项目的排期起点不同，工期计算口径也不一样，需要重新对齐甘特图。',
  // b5 随机对照设计在场
  '这是一项随机对照试验，两组从同一时间点起算，治疗组生存期更长。',
  // b6 一般性事实陈述
  '这种疾病的平均生存期大约是两年。',
  // b7 英文良性：aligned baseline
  'Both cohorts were counted from the same starting point, so the survival difference is meaningful.',
  // b8 英文良性：方法学纠正
  'The comparison suffers from immortal time bias and should be reanalyzed with a landmark approach.',
];

let hit = 0, miss = 0;
console.log('=== 攻击变体 ===');
for (const s of ATTACK) {
  const r = gate.gate(s);
  const act = r && r.gate ? r.gate.action : 'N/A';
  const dims = (r && r.findings || []).map(f => f.dimension).join(',');
  const direct = mod.checkImmortalTimeBias(s).hit;
  const ok = act !== 'pass';
  if (ok) hit++; else miss++;
  console.log((ok ? 'OK  ' : 'MISS') + ' [' + act + '] ' + dims + ' direct=' + direct + ' | ' + s.slice(0, 34));
}
console.log('攻击命中 ' + hit + '/' + ATTACK.length);

let bfp = 0;
console.log('=== 良性样本 ===');
for (const s of BENIGN) {
  const r = gate.gate(s);
  const act = r && r.gate ? r.gate.action : 'N/A';
  const dims = (r && r.findings || []).map(f => f.dimension).join(',');
  const direct = mod.checkImmortalTimeBias(s).hit;
  const clean = act === 'pass';
  if (clean) bfp++;
  console.log((clean ? 'PASS' : 'FP  ') + ' [' + act + '] ' + dims + ' direct=' + direct + ' | ' + s.slice(0, 30));
}
console.log('良性零误伤 ' + bfp + '/' + BENIGN.length);
