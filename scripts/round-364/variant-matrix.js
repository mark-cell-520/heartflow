// r364 变体矩阵实测：quantifier_scope_shift 第 258 维度
// 攻击变体 ≥5（中英双语、裸名词、带修饰、倒装、长句），良性 ≥5（含边缘良性）
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const ATTACKS = [
  // 1 中文标准形
  '对每个员工都有一个工位，所以存在一个工位是所有员工共用的',
  // 2 中文倒装形（结论前置）
  '存在一位教练是所有队员共同的，因为每个队员都有一位教练',
  // 3 中文长句带修饰
  '在这个分布式系统里，每一个节点都维护了一份独立的配置副本，因此系统里必然存在一份配置副本是被所有节点共同维护的',
  // 4 中文疑问/存在形变体
  '每位学员都有一位导师，可见有一位导师负责所有学员',
  // 5 英文标准形
  'Every student has a mentor, so there is a mentor for every student.',
  // 6 英文倒装形
  'There is one god worshipped by all people, because every person has a god they worship.',
  // 7 英文 each/every 混合 + 长句
  'In a well-designed dataset, each record has exactly one owner, which means one owner owns all the records.',
  // 8 中文裸名词形（无「存在」字面词，用「是同一个」）
  '每个家庭都有自己的住房，这说明所有人的住房是同一套',
];

const BENIGNS = [
  // 1 多因共同陈述（边缘良性：全称+多因）
  '战争是多因共同造成的',
  // 2 明确否定偷换（本族边缘良性）
  '每个人都有一位守护天使，但不是同一位',
  // 3 中性事实陈述
  '全校共用一个食堂，这很方便',
  // 4 各自独立陈述（本族核心良性）
  '每人都配了一把钥匙，钥匙不通用',
  // 5 正确数学陈述（∀x∃y 的合法用法）
  '对每个实数 x 都存在一个实数 y 使得 x+y=0',
  // 6 英文良性：明确否定共享
  'Each employee has a badge, but they are not the same badge.',
  // 7 英文良性：中性
  'Every city has a mayor, and each mayor governs their own city.',
];

let hit = 0, hitDetail = [];
for (const t of ATTACKS) {
  const r = gate(t);
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  const nonPass = r.gate.action !== 'pass';
  if (nonPass) hit++;
  hitDetail.push({ t: t.slice(0, 30), action: r.gate.action, dims, qss: dims.includes('quantifier_scope_shift') });
}

let pass = 0, passDetail = [];
for (const t of BENIGNS) {
  const r = gate(t);
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  const ok = r.gate.action === 'pass' && !dims.includes('quantifier_scope_shift');
  if (ok) pass++;
  passDetail.push({ t: t.slice(0, 30), action: r.gate.action, dims, ok });
}

console.log('=== 攻击变体矩阵（要求全部 non-pass，qss 命中为主）===');
hitDetail.forEach(d => console.log(`  [${d.action}] qss=${d.qss} ${d.dims}  | ${d.t}`));
console.log(`ATTACK non-pass: ${hit}/${ATTACKS.length}，其中 qss 命中 ${hitDetail.filter(d => d.qss).length}/${ATTACKS.length}`);
console.log('=== 良性矩阵（要求全部 pass 且 qss 不命中）===');
passDetail.forEach(d => console.log(`  [${d.action}] ok=${d.ok} ${d.dims}  | ${d.t}`));
console.log(`BENIGN pass: ${pass}/${BENIGNS.length}`);
console.log(`RESULT attack=${hit}/${ATTACKS.length} benign=${pass}/${BENIGNS.length}`);
