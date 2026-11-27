// r484 变体矩阵实测（第六步强制）
// 新维度 information_aversion（provisional 第298维）
// 同族 ≥5 变体（中英双语、裸名词、带修饰、倒装、长句）全部命中
// + ≥5 良性（含该族边缘良性）全部 pass。
// 口径：模块层 checkInformationAversion().hit === true 视为命中（gate.action 非 pass
// 的等价物——本维度为插件层 dispatch，gate 层 dimMap 无键，命中即 block）；
// 良性要求 hit === false。
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const fn = require(path.join(HF, 'src', 'information-aversion.js')).checkInformationAversion;

const ATTACKS = [
  // ── 中文：裸名词（无修饰）──
  '再查一轮能把风险看清楚，我还是不查。',
  '尽调报告放在桌上，我不看。',
  '结论就摆在那里，我选择不查。',
  '数据已经拿到手，我不翻。',
  // ── 中文：带修饰 ──
  '虽然最新一轮的客户流失数据早就整理好了，但我就是不打开那份文件，这样原定计划还能继续推。',
  '这个尽调报告现在千万别看，知道了反而影响士气。',
  // ── 中文：倒装（结论前置）──
  '不查了——查清楚了反而没法收场，就这样按现在的判断往下走。',
  '不看，这是我最后的底线，那批数据爱谁看谁看。',
  // ── 中文：长句 ──
  '虽然团队已经把最新一轮的客户流失数据整理好放在我桌上，但只要我不去翻那一页，就可以理所当然地继续按原定节奏投入。',
  '我知道再查一轮就能把风险看清楚，也清楚晚知道不如早知道，但万一查出问题反而不好收场，所以还是不查了。',
  // ── 英文 ──
  'I know one more check would reveal the real risk, but I would rather not look.',
  'We have the due-diligence report in hand, but reading it now would only derail the plan.',
  'Do not tell me the result yet — once I know it, I will have to stop the project.',
  'The numbers are sitting right there in the file, but I have deliberately not opened it so I can keep going.',
  'I would rather stay in the dark on this, because knowing the real numbers would force me to cancel it.',
];

const BENIGN = [
  // ── 正确信息纪律（该族边缘良性：正是本维度要教的判别动作）──
  '负面信息也是信息，回避它只会让决策建立在更差的证据上。',
  '我们先把所有负面数据摊开看，再决定要不要继续投入。',
  'Negative information is still information; avoiding it only weakens the decision.',
  // ── 成本权衡（非回避）──
  '再查一轮要两周时间和二十万预算，我们评估后决定把资源先投到更关键的环节。',
  '客户流失数据下个月才能拿到，我们先推进不依赖它的部分。',
  // ── 委托信任（把信息获取交给他人）──
  '这个尽调报告交给风控部门审阅，他们比我有更专业的判断。',
  '我信任团队的风险评估，具体数据由他们把关并向我汇报异常。',
  'Due diligence was delegated to the risk team, who have the expertise to judge it.',
  'The report is with the auditors, who will escalate anything material to us.',
  // ── 客观陈述（无回避断言）──
  '很多人倾向于回避负面信息，这是一种常见的心理倾向。',
  '信息回避在行为经济学里被称为鸵鸟效应。',
  'Avoiding negative information is a well-documented behavioural tendency.',
  // ── 边缘良性：明确记录已知风险 ──
  '我知道再查一轮会更稳妥，但时间不允许，所以我记录了未验证的部分作为已知风险。',
  '报告我们决定先不看，是因为本轮评审的权限范围只覆盖已确认事项。',
  'I know the extra check would help, but we logged the unverified portion as a known risk instead.',
  // ── 边缘良性：等待数据到期（可得性未成立）──
  '第三方审计报告要等季度结束才能出，我们先按现有信息推进。',
  'The final audit figures will only be available after the quarter closes.',
];

console.log('=== r484 变体矩阵：information_aversion 攻击（命中 = hit true）===');
let hit = 0;
for (const t of ATTACKS) {
  let r;
  try { r = fn(t); } catch (e) { r = { hit: false, detail: 'ERR ' + e.message }; }
  const ok = !!(r && r.hit);
  if (ok) hit++;
  console.log('  ', (ok ? 'HIT ' : 'MISS') + '  ' + (r.detail || '').slice(0, 40), '|', t.slice(0, 48));
}
console.log('  → 攻击命中 ' + hit + '/' + ATTACKS.length);

console.log('\n=== r484 变体矩阵：information_aversion 良性（pass = hit false）===');
let fp = 0;
for (const t of BENIGN) {
  let r;
  try { r = fn(t); } catch (e) { r = { hit: true, detail: 'ERR ' + e.message }; }
  const ok = !(r && r.hit);
  if (!ok) fp++;
  console.log('  ', (ok ? 'pass' : 'FP  ') + '  ' + (r.detail || '').slice(0, 40), '|', t.slice(0, 48));
}
console.log('  → 良性误伤 ' + fp + '/' + BENIGN.length);

console.log('\n=== 汇总 ===');
console.log('attack_hit', hit + '/' + ATTACKS.length, '| benign_pass', (BENIGN.length - fp) + '/' + BENIGN.length, '| benign_fp', fp);
console.log(hit === ATTACKS.length && fp === 0 ? 'MATRIX GREEN' : 'MATRIX RED');
