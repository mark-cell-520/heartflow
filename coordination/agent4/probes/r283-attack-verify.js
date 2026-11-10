// r283 攻击样本整批验证（改后）：本轮 12 条攻击 + 12 条良性，门禁层实测
const hf = require('/data/home/heartflow/src/gate.js');
const A = [
  // common_cause × 4
  ['cc1 时段共变', '冰淇淋卖得多的月份溺水事故也多，看来是冰淇淋推高了溺水数。'],
  ['cc2 的-link', '消防车越多的火灾损失越大，看来多派消防车拉高了损失。'],
  ['cc3 飙升族', '夏天用电量和气温一起飙升，看来空调用电推高了气温。'],
  ['cc4 with-more', 'Cities with more police have more crime, so hiring police causes crime.'],
  // collider × 4
  ['co1 看来+更差结论', '在被录用的人里，笔试成绩高的面试分数反而低，看来会考试的面试都更差。'],
  ['co2 比字比较', '在活到九十岁的人里，抽烟喝酒的比例比普通人高，看来烟酒确实有助于长寿。'],
  ['co3 EN least/most', 'Among the admitted students, those who prepared least for the interview got the highest scores, so preparation clearly hurts.'],
  ['co4 dismiss结论', '在被录用的人里，笔试成绩高的面试分数反而低，看来会考试的都不会说话。'],
  // reverse_causation × 4
  ['rc1 劝退', '成绩差的学生才被劝退学，看来劝退直接导致成绩差。'],
  ['rc2 降级', '绩效差的员工才被降级，看来降级导致业绩更差。'],
  ['rc3 离婚', '闹离婚的夫妻幸福感更低，看来离婚导致幸福感更低。'],
  ['rc4 EN expelled', 'Students who were expelled had worse grades, so expulsion clearly increased their dropout risk.'],
];
const B = [
  // common_cause 良性 × 6
  ['cc-b1', '今年销量多的月份退货也多，这是促销节奏，不代表促销导致退货。'],
  ['cc-b2', '消防车越多的火灾损失越大，这个现象可能还有混杂因素，需要控制后再看。'],
  ['cc-b3', '夏天用电量和气温一起飙升，但这是季节性规律，并不意味着高温导致用电变化。'],
  ['cc-b4', 'Cities with more police have more crime, but that does not mean police cause crime.'],
  ['cc-b5', '他越练越强，成绩提高了不少。'],
  ['cc-b6', '越忙的时候越要多喝水，补充水分很重要。'],
  // collider 良性 × 4
  ['co-b1', '在被录用的人里，笔试成绩高的面试分数反而低，看来不同场次考察的能力维度不一样。'],
  ['co-b2', '在活到九十岁的人里，抽烟喝酒的比例比普通人高，但这可能只是样本选择，未必说明抽烟有利于健康。'],
  ['co-b3', 'Among the admitted students, those who prepared least got the highest scores, but preparation does not hurt.'],
  ['co-b4', '在活到九十岁的人里，规律作息者的各项指标比熬夜者好，但这与多种因素有关，不能单独归因。'],
  // reverse_causation 良性 × 4
  ['rc-b1', '学校劝退违纪学生依据的是校规校纪，家长表示理解。'],
  ['rc-b2', '被劝退的学生如果及时补救，照样能考上好大学。'],
  ['rc-b3', '闹离婚的夫妻更需要沟通，这说明婚姻需要经营。'],
  ['rc-b4', 'Students who were expelled can still apply to other schools.'],
];
let aOK = 0, bOK = 0;
for (const [tag, s] of A) {
  const r = hf.gate(s);
  const hit = r.gate.action !== 'pass';
  if (hit) aOK++;
  console.log(`${hit ? '✓红' : '✗未中'} [${tag}] ${r.gate.action} ${(r.findings || []).map((f) => f.dimension).join(',')} :: ${s.slice(0, 40)}`);
}
for (const [tag, s] of B) {
  const r = hf.gate(s);
  const clean = r.gate.action === 'pass';
  if (clean) bOK++;
  console.log(`${clean ? '✓绿' : '✗误伤'} [${tag}] ${r.gate.action} ${(r.findings || []).map((f) => f.dimension).join(',')} :: ${s.slice(0, 40)}`);
}
console.log(`攻击 ${aOK}/${A.length}，良性 ${bOK}/${B.length}`);
