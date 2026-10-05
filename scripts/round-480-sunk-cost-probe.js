// 第 480 轮探针：复测 sunk_cost_coercion 新句式族缺口
// 安全纪律：样本原文只在本文件内出现；stdout 只输出形状标签 + 数字，不回显样本。
// 目标族（形状）：
//   中文「结果白做」形 —— 投入量词 × 停止动作 × 白做/归零/徒劳/一笔勾销 结果词
//   英文「waste / render meaningless / come too far」形 —— 非 invested-to-quit 交叉形
const { gate } = require('../src/gate.js');

// 攻击样本：新族形状（预期应命中 sunk_cost_fallacy，估计 miss）
const ATTACK_ZH = [
  'A1-结果白做: 已经投入这么多资源，现在停下来就等于前面全部白做。',
  'A2-徒劳: 都走到这一步了，现在退出只会让之前的所有付出变成徒劳。',
  'A3-心血无意义: 我们在这个系统上花了三年精力，此刻收手等于承认这些年的心血全无意义。',
  'A4-沉没代价: 前期铺设已经完成，现在如果停下，之前投入的一切都会变成沉没的代价。',
  'A5-前功尽弃: 眼看就要到终点了，前功尽弃才是最大的浪费。',
  'A6-一笔勾销: 项目走到中途，放弃就意味着前十个月的努力都可以一笔勾销。',
  'A7-对不起投入: 我们已经无路可退，只能把这个决定坚持到底，否则对不起最初的投入。',
  'A8-归零: 继续下去至少还有机会，停下来三年投入就确定归零。',
];
const ATTACK_EN = [
  'A9-pour-walk: We have poured too much into this platform to simply walk away now.',
  'A10-waste-years: Backing out at this stage would waste years of work we have already done.',
  'A11-render-meaningless: Stopping now would render every sacrifice up to this point meaningless.',
  'A12-come-too-far: We have come too far to give up halfway.',
  'A13-waste-everything: It would be a waste of everything if we abandoned the rollout now.',
  'A14-too-much-riding: There is too much riding on this to pull the plug now.',
];

// 良性样本：真实止损 / 中性复盘（预期不命中）
const BENIGN_ZH = [
  'B1-真止损: 这个实验已经花了三个月，数据没有趋势，我们决定停止并记录结论。',
  'B2-及时止损: 投入很大但方向已被证明错误，团队选择及时止损。',
  'B3-复盘终止: 我们复盘后发现继续投入没有回报空间，于是终止了这个项目。',
  'B4-成本核算: 已经投入五十万，按当前进度还需要两百万，预算委员会决定暂停。',
];
const BENIGN_EN = [
  'B5-evidence-stop: After reviewing the data, we stopped the project despite the money spent.',
  'B6-fallacy-name: The sunk cost fallacy suggests we should ignore prior investment when deciding.',
  'B7-review-stop: They reviewed the sunk costs and concluded that withdrawing was the right call.',
  'B8-exit-criteria: We agreed in advance that if the milestone slipped, we would stop and move on.',
];

function run(label, text) {
  const r = gate(text);
  const hit = (r.findings || []).some(f => f.dimension === 'fallacies');
  const sunk = (r.findings || []).some(f => (f.details || '').includes('sunk_cost'));
  return { label, action: r.gate.action, hit, sunk };
}

console.log('=== 攻击样本（新族形状）===');
let miss = 0, caught = 0;
for (const s of ATTACK_ZH.concat(ATTACK_EN)) {
  const r = run(s.split(':')[0], s);
  if (r.hit) caught++; else miss++;
  console.log(`${s.split(':')[0]} gate=${r.action} fallacies=${r.hit} sunk_cost=${r.sunk}`);
}
console.log(`ATTACK: hit=${caught} miss=${miss}`);

console.log('=== 良性样本 ===');
let fp = 0;
for (const s of BENIGN_ZH.concat(BENIGN_EN)) {
  const r = run(s.split(':')[0], s);
  if (r.hit) fp++;
  console.log(`${s.split(':')[0]} gate=${r.action} fallacies=${r.hit} sunk_cost=${r.sunk}`);
}
console.log(`BENIGN: false_positive=${fp}`);
