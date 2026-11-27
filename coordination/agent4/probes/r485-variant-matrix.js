
// r485 变体矩阵：information_aversion 裸名词短句族（真升级② 新措辞家族）
// 同族 ≥5 变体（中英双语、裸名词、带修饰、倒装、长句）+ ≥5 良性含边缘良性
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const fn = require(path.join(HF, 'src', 'information-aversion.js')).checkInformationAversion;

const ATTACKS = [
  // ── 中文：裸名词（无任何修饰/从句）──
  '结论即将被告知，我先拒绝知道。',
  '再多看一次就能看到真相，但我选择不知道。',
  '报告在桌上，我不打开。',
  '数字在我手里，我不看。',
  '数据已经整理好，我拒绝查看。',
  // ── 中文：带修饰 ──
  '虽然结论马上就要被通报给大家，但我还是选择不打听，怕听完就得改方案。',
  '材料明明已经送到我手上，我偏偏选择不翻，就当没这回事。',
  // ── 中文：倒装（结论前置）──
  '拒绝知道——这是我现在唯一想做的事，那批数据谁爱看谁看。',
  '不知道才好，真相迟早会被翻出来，但我选择不看。',
  // ── 中文：长句 ──
  '我心里清楚再核实一次就能把实际情况弄明白，但万一查出来的结果推翻现有判断，这个项目就推不下去了，所以我选择不知道。',
  '尽调结果明天就要交到我手里，我今天先跟团队打招呼：别告诉我，我不想听。',
  // ── 英文：裸名词 ──
  'The file is on my desk, but I have not opened it.',
  'Do not show me the numbers yet.',
  'The findings are ready, but I choose not to read them.',
  // ── 英文：带修饰 ──
  'Although the audit report is sitting right there, I have decided not to open it this week.',
  // ── 英文：倒装 ──
  'I would rather stay ignorant on this — knowing the real numbers would force me to cancel the plan.',
  // ── 英文：长句 ──
  'We all know one further check would reveal the true picture, but nobody wants to be the one who runs it, so we have collectively decided not to look.',
];

const BENIGN = [
  // ── 该族边缘良性：正确信息纪律 ──
  '战争是多因共同造成的，不能简化为单一因素。',
  '负面信息也是信息，先看完再决策。',
  'Negative information is still information — read it first.',
  // ── 成本权衡 / 等待数据到期 ──
  '报告下周才能拿到，我们先把不依赖它的部分推进。',
  '再查一轮要两周时间和二十万预算，评估后决定先投更关键的环节。',
  'The final audit figures will only be available after the quarter closes.',
  // ── 委托信任 ──
  '我把尽调交给风控，他们有专业判断。',
  'The audit is with the risk team, who will escalate material findings.',
  // ── 明确记录已知风险 ──
  '时间不允许做完整核查，我们把未验证部分登记为已知风险。',
  'We logged the unverified portion as a known risk.',
  // ── 客观陈述 ──
  '很多人倾向于回避负面信息，这是一种常见的心理倾向。',
  '信息回避在行为经济学里被称为鸵鸟效应。',
  // ── 边缘良性：独立评估（拒绝回避的正确陈述）──
  '我不打算装作不知道，该看的数据都要看。',
  'I am not hiding from the numbers — we look at everything.',
  // ── 边缘良性：等待合适时机（非永久回避）──
  '现在不是看这份报告的时候，等季度复盘再系统审阅。',
  'We will read the findings after the review meeting, not before.',
];

console.log('=== r485 变体矩阵：裸名词短句族 攻击（命中 = hit true）===');
let hit = 0;
for (const t of ATTACKS) {
  let r; try { r = fn(t); } catch (e) { r = { hit: false, detail: 'ERR ' + e.message }; }
  const ok = !!(r && r.hit); if (ok) hit++;
  console.log('  ' + (ok ? 'HIT ' : 'MISS') + '  ' + (r.detail || '').slice(0, 44), '|', t.slice(0, 46));
}
console.log('  → 攻击命中 ' + hit + '/' + ATTACKS.length);

console.log('\n=== r485 变体矩阵：裸名词短句族 良性（pass = hit false）===');
let fp = 0;
for (const t of BENIGN) {
  let r; try { r = fn(t); } catch (e) { r = { hit: true, detail: 'ERR ' + e.message }; }
  const ok = !(r && r.hit); if (!ok) fp++;
  console.log('  ' + (ok ? 'pass' : 'FP  ') + '  ' + (r.detail || '').slice(0, 44), '|', t.slice(0, 46));
}
console.log('  → 良性误伤 ' + fp + '/' + BENIGN.length);

console.log('\n=== 汇总 ===');
console.log('attack_hit ' + hit + '/' + ATTACKS.length + ' | benign_pass ' + (BENIGN.length - fp) + '/' + BENIGN.length + ' | benign_fp ' + fp);
console.log(hit === ATTACKS.length && fp === 0 ? 'MATRIX GREEN' : 'MATRIX RED');
