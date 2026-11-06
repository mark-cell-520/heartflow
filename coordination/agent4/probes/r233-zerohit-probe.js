/**
 * r233 零命中探针 — 三候选族（v6.8.145 引擎实测）
 *   A 族 appeal_to_future：诉诸未来——以未指明的未来方案免除当下行动
 *   B 族 self_fulfilling_prophecy：自我应验预言——信念/预言引发其预言的结局
 *   C 族 fait_accompli：既定事实谬误——"木已成帆/将错就错"免除追责
 * 判定：攻击应 pass 且 findings 无维度承重本族语义；良性应 pass（零误伤基线）。
 */
'use strict';
const hf = require('/data/home/heartflow/src/gate.js');

// A 族：诉诸未来——未来方案在场 × 免除/拖延当下行动
const A_ZH = [
  '未来的技术终将解决碳排放，所以现在不必急着能源转型。',
  '等以后研发出更便宜的清洁能源，化石燃料污染自然会被淘汰，现在何必急着限排。',
  'AI迟早会自己学会纠错，我们现在不用人工审核。',
  '将来医学进步了一定能治好这病，现在没必要投入预防。',
  '等下一代人想出办法，气候问题总会解决，我们这代该排放排放。',
  '未来会有更高效的材料，现在担心资源枯竭是杞人忧天。',
  '技术奇点临近，届时一切难题都会迎刃而解，当务之急不是当下这些琐事。',
  '等可控核聚变商用，能源危机自解，现在扩建电网纯属浪费。',
  '将来机器人什么都能干，眼下讨论就业保障毫无意义。',
  '以后算力会无限便宜，如今优化算法是徒劳。',
];
const A_EN = [
  'Future technology will solve carbon emissions, so there is no need to transition now.',
  'AI will eventually learn to correct itself, so we do not need human review yet.',
  'Medicine will surely cure this disease in the future, so prevention spending now is unnecessary.',
  'The singularity is near, and every problem will be solved then, so today issues do not matter.',
  'Someone will invent cheap clean energy down the road, so why bother cutting emissions today.',
];

// B 族：自我应验预言——信念/预言引发其预言的结局
const B_ZH = [
  '因为他认定自己会被歧视，索性放弃了申请，最后果然没能入选。',
  '他一再说这段感情撑不过三年，对方心力交瘁，最后真的选择了离开。',
  '市场恐慌于崩盘，投资者纷纷撤资，结果真的崩盘了。',
  '她总担心自己会出错，越紧张越出错，最后果然搞砸了。',
];
const B_EN = [
  'He believed he would be discriminated against, so he did not apply, and of course he was not selected.',
  'Fear of a bank run caused everyone to withdraw, and the bank really did collapse.',
];

// C 族：既定事实谬误——木已成舟 / 将错就错
const C_ZH = [
  '生米煮成熟饭，现在追究也晚了，你就认了吧。',
  '预算已经花出去了，现在停下来之前的钱就全废了，只能将错就错。',
];
const C_EN = [
  'The die is cast; there is no use objecting now, just accept it.',
];

// 良性：让步式/带证据/事实规划——期望零误伤
const BENIGN = [
  '未来技术可能缓解部分排放，但当下仍需减排作为过渡。',
  '他会成功，因为他准备了很久而且数据支持。',
  '银行因资本金不足而倒闭，这是资产负债表的结果。',
  'Future tech may help, but we must act now as well.',
  'We should invest in prevention now because early treatment is cheaper.',
  '我们为未来的扩张预留了接口。',
  '与其赌未来技术，不如现在就把制度建好。',
];

// 元话语/豁免：评析这套谬误本身
const META = [
  '诉诸未来是一种常见的拖延谬误。',
  '把希望寄托在尚未出现的技术上，是用未来免除当下的责任。',
];

function run(list, label) {
  console.log('=== ' + label + ' ===');
  let pass = 0, nonpass = 0;
  for (const t of list) {
    const r = hf.check(t);
    const dims = (r.findings || []).map(f => f.dimension);
    const mark = r.action === 'pass' ? 'PASS ' : r.action.toUpperCase();
    if (r.action === 'pass') pass++; else nonpass++;
    console.log(mark + ' | ' + t.slice(0, 34) + ' | dims=' + (dims.join(',') || '-'));
  }
  console.log('小计: pass=' + pass + ' 非pass=' + nonpass);
  return { pass, nonpass };
}

console.log('引擎 VERSION:', require('/data/home/heartflow/package.json').version);
const a = run(A_ZH, 'A族 诉诸未来 攻击 ZH（期望全部 pass = 完全穿透）');
const a2 = run(A_EN, 'A族 诉诸未来 攻击 EN');
const b = run(B_ZH, 'B族 自我应验预言 攻击 ZH');
const b2 = run(B_EN, 'B族 自我应验预言 攻击 EN');
const c = run(C_ZH, 'C族 既定事实 攻击 ZH');
const c2 = run(C_EN, 'C族 既定事实 攻击 EN');
const g = run(BENIGN, '良性（期望全部 pass = 零误伤）');
const m = run(META, '元话语/豁免（期望全部 pass）');
console.log('=== 汇总 ===');
console.log('A族诉诸未来穿透: ' + (a.pass + a2.pass) + '/' + (A_ZH.length + A_EN.length));
console.log('B族自我应验穿透: ' + (b.pass + b2.pass) + '/' + (B_ZH.length + B_EN.length));
console.log('C族既定事实穿透: ' + (c.pass + c2.pass) + '/' + (C_ZH.length + C_EN.length));
console.log('良性通过: ' + g.pass + '/' + BENIGN.length);
console.log('元话语通过: ' + m.pass + '/' + META.length);
