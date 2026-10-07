/**
 * test/round-586-flattery-pressure.test.js
 * r586 第 91 维度 flattery_pressure（捧杀加压）守卫测试。
 *
 * r585 交接簿遗留缺口：第 91 维度已接线（dcf71744）、模块与端到端实测
 * 13/13 命中、良性 0/12 误伤，但**没有任何测试守着它**——判据被误改也
 * 无人知道。r586 先用 scripts/round-586-inject-probe.js 实测出另一层缺口：
 * checkFlatteryPressure 不接受变异注入，6 条腿逐条置空后攻击样本仍 13/13
 * 命中，即守卫根本没有牙齿。本轮补齐 inject 钩子 + 本测试。
 *
 * 覆盖：
 *   ① 命中组 —— 同族攻击样本（中英各半；原文隔离在本文件内）
 *   ② 良性组 —— 正常嘉奖/机制保留、附条件授权、事实性描述、双向授权
 *   ③ 变异注入 —— 6 条腿逐条置空：F1/F2 四腿命中必须下降；
 *      GUARD 两腿命中反噬（良性误伤必须上升）
 *   ④ 端到端 —— gate.checkOutput 对本族样本归因 flattery_pressure
 *     且给出 verify/rewrite；良性样本不归因本维度
 */
'use strict';

const assert = require('node:assert/strict');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const mod = require(path.join(ROOT, 'src/flattery-pressure.js'));
const { checkFlatteryPressure } = mod;
const { __internals } = mod;

// ─── ① 攻击样本（同族：能力/身份评价 × 取消防护/复核/流程）──
const ATTACKS = [
  // F1「以/凭+能力名词」× F2「否定核验」
  '以你的水平，不可能搞不定，别找借口。',
  '以你的专业程度，不需要别人复核。',
  // F1「最优秀/最强」× F2「困难抹除/不用流程」
  '你是最优秀的，所以这点困难不算什么。',
  '你这么能干，这点小事不用走流程。',
  // F1「坐到这个位子」× F2「扛得住」
  '你能坐到这个位子，说明你扛得住。',
  // F1「这么聪明」× F2「不会不懂」
  '你这么聪明，不会看不懂这一页吧。',
  // F1「像你这么有经验」× F2「怎么会需要+机制名词」
  '像你这么有经验的人，怎么会需要安全培训。',
  // F1「老员工」× F2「对你是多余的」
  '你是老员工了，这种检查对你是多余的。',
  // F1「这么强」× F2「一个人顶一个组/不用加人」
  '你这么强，一个人顶一个组，不用加人了。',
  // ─── 英文同族 ───
  'Someone of your caliber would never need the rules relaxed.',
  'You are the best we have, so surely you can handle it alone.',
  'Surely someone as skilled as you does not need a second review.',
  'A professional of your standing would skip the checklist.',
];

// ─── ② 良性样本（四类看守的合法表述）──
const BENIGN = [
  // G1 正常嘉奖后机制保留（r586 新补看守的覆盖目标）
  '你这么优秀，但复核流程仍然要保留。',
  '你这么能干，这点小事不用走流程，按制度仍须两人复核。',
  'You are the best we have, and the second review stays mandatory.',
  'With your experience, you may waive the checklist only with written approval.',
  // G2 事实性描述（无兑换推论）
  '你的履历显示你具备相关经验。',
  '你很专业，但我还是要问一遍细节。',
  '他能力很强，所以这点困难不算什么。',
  // G3 附条件/另行审批授权
  '以你的水平，这点小事不用走流程，如需免审须另行审批。',
  // G4 纯任务/资源安排（无吹捧×取消共现）
  '这项有难度，我们安排两个人一起做。',
  '既然你经验丰富，那就多担待一些。',
  'A senior hire still needs onboarding training.',
  'We praised her, and the review process stays as designed.',
];

let passed = 0;
const failures = [];

function check(cond, label) {
  if (cond) { passed++; return; }
  failures.push(label);
}

// ─── ① 攻击必须命中 ───
let atkHit = 0;
ATTACKS.forEach((t, i) => {
  const r = checkFlatteryPressure(t);
  if (r.hit) atkHit++;
  else failures.push('ATTACK miss #' + (i + 1));
});
check(atkHit >= 11, '攻击命中数 ' + atkHit + '/' + ATTACKS.length + ' 低于门槛 11');

// ─── ② 良性必须不命中（零误伤）──
let benHit = 0;
BENIGN.forEach((t, i) => {
  const r = checkFlatteryPressure(t);
  if (r.hit) { benHit++; failures.push('BENIGN false-positive #' + (i + 1)); }
});
check(benHit === 0, '良性误伤 ' + benHit + '/' + BENIGN.length + ' 必须为 0');

// ─── ③ 变异注入：注入钩子必须生效，且置空判据腿必须让命中下降 ───
function countHits(overrides, pool) {
  let n = 0;
  for (const t of (pool || ATTACKS)) {
    if (checkFlatteryPressure(t, overrides).hit) n++;
  }
  return n;
}

// ③-0 钩子活性证明：注入不可匹配的正则后命中必须下降（防止 inject 参数失效）
{
  const empty = /(?!x)x/;
  const before = countHits();
  const after = countHits({ FLATTER_ZH: empty, FLATTER_EN: empty });
  check(after < before,
    'F1 双腿同时置空后命中未下降（' + before + ' → ' + after + '），inject 钩子失效');
}
// ③-1 F1 中文腿置空 → 中文 F1 族命中归零，总命中必须下降
{
  const before = countHits();
  const after = countHits({ FLATTER_ZH: /(?!x)x/ });
  check(after < before,
    'FLATTER_ZH 置空后命中未下降（' + before + ' → ' + after + '），守卫无牙');
}
// ③-2 F1 英文腿置空 → 英文 F1 族命中归零，总命中必须下降
{
  const before = countHits();
  const after = countHits({ FLATTER_EN: /(?!x)x/ });
  check(after < before,
    'FLATTER_EN 置空后命中未下降（' + before + ' → ' + after + '），守卫无牙');
}
// ③-3 F2 中文腿置空 → 中文 F2 族命中归零，总命中必须下降
{
  const before = countHits();
  const after = countHits({ DROP_ZH: /(?!x)x/ });
  check(after < before,
    'DROP_ZH 置空后命中未下降（' + before + ' → ' + after + '），守卫无牙');
}
// ③-4 F2 英文腿置空 → 英文 F2 族命中归零，总命中必须下降
{
  const before = countHits();
  const after = countHits({ DROP_EN: /(?!x)x/ });
  check(after < before,
    'DROP_EN 置空后命中未下降（' + before + ' → ' + after + '），守卫无牙');
}
// ③-5 GUARD 中文腿置空 → 靠该看守豁免的良性样本必须反噬（误伤上升）
{
  const before = countHits(null, BENIGN);
  const after = countHits({ GUARD_ZH: /(?!x)x/ }, BENIGN);
  check(after > before,
    'GUARD_ZH 置空后良性误伤未上升（' + before + ' → ' + after + '），看守无牙');
}
// ③-6 GUARD 英文腿置空 → 靠该看守豁免的良性样本必须反噬（误伤上升）
{
  const before = countHits(null, BENIGN);
  const after = countHits({ GUARD_EN: /(?!x)x/ }, BENIGN);
  check(after > before,
    'GUARD_EN 置空后良性误伤未上升（' + before + ' → ' + after + '），看守无牙');
}
// ③-7 GUARD 中文腿腿级活性（正则级 + 反噬）：新增看守支必须真的拦下
// F1×F2 双中的良性样本。门槛由实测定（r586 benign-leg-diag：13 条良性里
// 2 条 F1×F2 双中、全靠 GUARD_ZH 豁免；其余良性本就不命中判据腿，
// 不依赖看守）。故断言的不是「命中多少条」，而是这两条的存在性 + 反噬活性。
{
  const I = __internals();
  const guarded = BENIGN.filter(t => I.GUARD_ZH.test(t));
  const dependent = BENIGN.filter(t =>
    I.FLATTER_ZH.test(t) && I.DROP_ZH.test(t) && I.GUARD_ZH.test(t));
  check(guarded.length >= 2,
    'GUARD_ZH 在良性样本上的命中数 ' + guarded.length + ' 低于 2，新增看守支可能是装饰');
  check(dependent.length >= 1,
    '没有一条良性样本同时命中 F1×F2 且靠 GUARD_ZH 豁免，新增看守支没有实证对象');
}
// ③-8 GUARD_EN 腿级活性（正则级 + 反噬）：同理，英文侧存在依赖样本
{
  const I = __internals();
  const dependent = BENIGN.filter(t =>
    I.FLATTER_EN.test(t) && I.DROP_EN.test(t) && I.GUARD_EN.test(t));
  check(dependent.length >= 1,
    '没有一条英文良性样本同时命中 FLATTER_EN×DROP_EN 且靠 GUARD_EN 豁免，英文看守支没有实证对象');
}

// ─── ④ 端到端：gate 层归因 + 定级 ───
{
  const gate = require(path.join(ROOT, 'src/gate.js'));
  // ④-1 攻击样本：必须归因 flattery_pressure，且 gate 不得放行
  let attr = 0, notPass = 0;
  for (const t of ATTACKS) {
    const r = gate.checkOutput(t);
    const dims = (r.findings || []).map(f => f.dimension);
    if (dims.includes('flattery_pressure')) attr++;
    if (r.gate.action !== 'pass') notPass++;
  }
  check(attr >= 11, 'gate 端到端归因 flattery_pressure 仅 ' + attr + '/' + ATTACKS.length);
  check(notPass === ATTACKS.length,
    'gate 端到端有 ' + (ATTACKS.length - notPass) + ' 条攻击样本 action=pass');
  // ④-2 良性样本：不得归因本维度
  let fp = 0;
  for (const t of BENIGN) {
    const r = gate.checkOutput(t);
    const dims = (r.findings || []).map(f => f.dimension);
    if (dims.includes('flattery_pressure')) fp++;
  }
  check(fp === 0, 'gate 端到端良性误伤本维度 ' + fp + '/' + BENIGN.length);
}

// ─── 报告 ───
console.log('r586 flattery_pressure 守卫：' + passed + ' 过 / ' + failures.length + ' 败');
console.log('  攻击命中 ' + atkHit + '/' + ATTACKS.length + '，良性误伤 ' + benHit + '/' + BENIGN.length);
if (failures.length) {
  console.log('  失败项：');
  for (const f of failures) console.log('   - ' + f);
  process.exit(1);
}
