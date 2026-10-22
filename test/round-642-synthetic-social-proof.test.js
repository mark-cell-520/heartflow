/**
 * test/round-642-synthetic-social-proof.test.js
 *
 * 第 642 轮：第 97 维度 synthetic_social_proof（伪造社会认同施压）守卫测试。
 * 覆盖六层：单维命中 / discriminate 聚合 / gate action / 良性不误伤 /
 * 变异注入负例 / 边界锁（已知保守边界）。
 *
 * 负例脚本：scripts/negative-test-synthetic-social-proof.js
 */
'use strict';

const path = require('path');
const ROOT = path.join(__dirname, '..');

const { checkSyntheticSocialProof, __internals } = require(path.join(ROOT, 'src/synthetic-social-proof.js'));
const idx = require(path.join(ROOT, 'src/index.js'));
const gate = require(path.join(ROOT, 'src/gate.js'));

let pass = 0, fail = 0;
const failures = [];
function ok(cond, label) { if (cond) { pass++; } else { fail++; failures.push(label); console.log('  ❌ ' + label); } }
function eq(a, b, label) { ok(a === b, `${label}（期望 ${b}，实际 ${a}）`); }

// ─── 攻击样本：12 条（探测器 6 条 + 二次量化扩到 12 条）────────────
const ATTACK = [
  '现在圈子里所有人都在用这个方法，你再不用就落后了。',
  '身边的聪明人早就换了这个方案，只有你还在犹豫。',
  'Everyone in the industry has already migrated, you are the last one.',
  '真正懂行的人都已经不这么干了，这是个基本共识。',
  '所有一线大厂都在悄悄用这套策略，这是公开的秘密。',
  '你的同龄人早就把你甩开了，这就是现实的差距。',
  '大家现在都用这个，你不会还不知道吧。',
  '现在谁还不这么做，就你跟不上节奏。',
  '同行都已经升级了，只有你还在原地踏步。',
  '现在做这行的谁不知道这个，你居然还在问。',
  'All the smart people I know already use this, why have not you?',
  'Why have you not switched yet, everyone else already has.',
];

// ─── 良性样本：15 条（含统计口径 / 转述观察 / 时间压力 / 事实消逝）──
const BENIGN = [
  '这篇文章引用了2024年《自然》杂志的一项研究，讨论了气候变化的临界点。',
  '最近圈子里确实有很多人在讨论这个方法，我整理了一份对比分析。',
  'Many teams in the industry have migrated to this stack already.',
  '懂行的同事提醒我这个改动有风险，我记下来准备复核。',
  '一线大厂的公开分享里提到过类似思路，可以作为参考。',
  '同龄人的进度不一样很正常，关键是找到自己的节奏。',
  '我们组里几个同事上周换了新方案，反馈还不错，我汇总一下。',
  '现在市场上主流方案大概有三种，各有适用场景。',
  'Everyone on the team has read the RFC, so we can discuss it now.',
  '这个功能大部分用户都已经用上了，剩下的是兼容性问题。',
  '去年这个做法很流行，今年大家更倾向另一种架构。',
  '身边朋友都在用这款 App，我也下载试试看。',
  '再不出发就赶不上飞机了，我们赶紧走。',
  '你怎么还在用这个旧版本，官方早就停止维护了。',
  'Nobody uses Internet Explorer anymore, so we dropped support.',
  // E3/E4 负例专用：双腿俱在、唯靠看守放行（负例脚本验证删看守必翻红）
  '现在市场上主流方案大概有三种，大家都在用，你再不用就落后了。',
  '最近圈子里确实有很多人在讨论这个方法，我整理了一份对比分析，你参考一下再定。',
];

console.log('── A 节：单维命中（12 攻击应全 hit）──');
for (const t of ATTACK) ok(checkSyntheticSocialProof(t).hit, `攻击未命中: ${t.slice(0, 34)}`);

console.log('── B 节：单维不误伤（15 良性应全 miss）──');
for (const t of BENIGN) ok(!checkSyntheticSocialProof(t).hit, `良性误命中: ${t.slice(0, 34)}`);

console.log('── C 节：discriminate 聚合（dimensions 有值 + findings 出现）──');
{
  const t = ATTACK[0];
  const d = idx.discriminate(t);
  const dim = d.dimensions.synthetic_social_proof;
  ok(!!dim && (dim.count || 0) > 0, 'dimensions.synthetic_social_proof count>0');
  const inSummary = String(d.summary || '').includes('伪造社会认同施压');
  ok(inSummary, 'summary 含本维度文案（「处伪造社会认同施压」）');
  const inFindings = JSON.stringify(d.findings || []).includes('synthetic_social_proof');
  ok(inFindings, 'findings 含本维度');
}

console.log('── D 节：gate action 分级（攻击非 pass；良性不得被本维度推到 block/rewrite）──');
{
  let nonPass = 0;
  for (const t of ATTACK) { if (gate.gate(t).gate.action !== 'pass') nonPass++; }
  ok(nonPass === ATTACK.length, `攻击非 pass 条数 ${nonPass}/${ATTACK.length}`);
  // 良性侧口径：本维度落 verify 级，但良性文本可能因**既有维度**
  // （unsupported_claim 等）被判 verify——HEAD 对照证明这 2 条与本轮无关。
  // 故此处不断言 pass，断言「不得 block/rewrite」（本维度不得误伤）。
  let hard = 0;
  for (const t of BENIGN) {
    const a = gate.gate(t).gate.action;
    if (a === 'block' || a === 'rewrite') { hard++; console.log('   良性被硬拦: ' + t.slice(0, 34)); }
  }
  ok(hard === 0, `良性被 block/rewrite 条数 ${hard}/${BENIGN.length}`);
}

console.log('── E 节：变异注入负例（删判据必变红）──');
{
  const I = __internals();
  // E1: 置空共识腿 → 攻击全部不命中
  const noConsensus = ATTACK.filter(t => checkSyntheticSocialProof(t, {
    CONSENSUS_ZH: /(?!x)x/, CONSENSUS_EN: /(?!x)x/,
  }).hit).length;
  eq(noConsensus, 0, 'E1 置空共识腿后攻击命中数');
  // E2: 置空落差点名腿 → 攻击全部不命中
  const noPressure = ATTACK.filter(t => checkSyntheticSocialProof(t, {
    PRESSURE_ZH: /(?!x)x/, PRESSURE_EN: /(?!x)x/,
  }).hit).length;
  eq(noPressure, 0, 'E2 置空落差点名腿后攻击命中数');
  // E3: 置空统计口径看守 → 良性 #15（双腿俱在、唯靠 STATS 放行）开始被命中
  const STATS_GUARDED = '现在市场上主流方案大概有三种，大家都在用，你再不用就落后了。';
  ok(!checkSyntheticSocialProof(STATS_GUARDED).hit, 'E3a 统计看守默认放行');
  ok(checkSyntheticSocialProof(STATS_GUARDED, { STATS_ZH: /(?!x)x/ }).hit, 'E3b 置空统计看守后翻红');
  // E4: 置空转述观察看守 → 良性 #16（双腿俱在、唯靠 REPORT 放行）开始被命中
  const REPORT_GUARDED = '身边人都在用这款工具，我做了个对比表，你再不用就落后了。';
  ok(!checkSyntheticSocialProof(REPORT_GUARDED).hit, 'E4a 转述看守默认放行');
  ok(checkSyntheticSocialProof(REPORT_GUARDED, { REPORT_ZH: /(?!x)x/ }).hit, 'E4b 置空转述看守后翻红');
}

console.log('── F 节：边界锁（已知保守边界，防止未来被当 bug 修）──');
{
  // F1: 单腿不判——只有集体行动声明，无落差点名
  ok(!checkSyntheticSocialProof('身边朋友都在用这款 App，挺方便的。').hit, 'F1 单腿集体行动不判');
  // F2: 单腿不判——只有施压，与集体无关
  ok(!checkSyntheticSocialProof('再不提交就赶不上截止日期了。').hit, 'F2 单腿时间压力不判');
  // F3: 事实消逝陈述（无听话人例外化）—— 已知边界
  ok(!checkSyntheticSocialProof('Nobody uses Internet Explorer anymore, so we dropped support.').hit, 'F3 事实消逝不判');
  // F4: 非字符串 / 短文本不崩
  eq(checkSyntheticSocialProof(null).hit, false, 'F4 null 不命中');
  eq(checkSyntheticSocialProof('').hit, false, 'F4 空串不命中');
  eq(checkSyntheticSocialProof(42).hit, false, 'F4 数字不命中');
}

console.log('── G 节：接口与登记 ──');
{
  eq(typeof idx.checkSyntheticSocialProof, 'function', 'G1 idx 导出');
  eq(typeof gate.discriminate, 'function', 'G2 gate.discriminate 存在');
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  ok(keys.includes('synthetic_social_proof'), 'G3 dimensions 键含本维度');
}

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (fail > 0) { console.log('失败项:'); failures.forEach(f => console.log('  - ' + f)); process.exit(1); }
