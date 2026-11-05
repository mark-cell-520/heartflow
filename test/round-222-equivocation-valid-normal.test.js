'use strict';
/**
 * test/round-222-equivocation-valid-normal.test.js
 * r222 · agent-4 · 对第 67 维度 equivocation_sense_shift（src/shield/，
 * 已接线）补强「逻辑有效性 + 统计常态」方向 2 个中英双语多义词家族：
 *   有效/valid（逻辑保真 vs 日常"有道理/站得住脚"）、
 *   正常/normal（统计常态=接近均值 vs 健康/规范性）。
 * 这是「已有维度的全新措辞家族」（真升级类型②）：模块已加载调度，
 * 补强立即激活，无需改 src/index.js。零命中探针
 * coordination/agent4/probes/r222-zerohit-probe.js 实测补强前：
 *   有效-zh 两种变体 / 正常-zh / normal-en 的 gate.action=pass 完全穿引擎。
 *
 * 压 FP 关键决策：域A 只用严格逻辑/统计标记（演绎/保真/形式逻辑/统计/均值…），
 *   不收"论证/前提/结论/方案"等泛词；健全/sound 族因"逻辑健全+财务健全"合法
 *   共现会被误判而弃用（benign-mix 对照证实不误伤）。
 *
 * 六层结构：
 *   一、攻击命中（detect 必须产出 equivocation_sense_shift finding）
 *   二、良性放行（单一义位/正确区分 → 不得命中）
 *   三、门禁翻转（补强前 gate.action=pass 的攻击 → 现翻非 pass 且承重）
 *   四、边界与豁免（元话语/无推理连接/单词单现/既有词条不受影响）
 *   五、注入承重（删每个新词条的一个语义域 → 对应攻击必须变红）
 *   六、分工边界锁（非 equivocation 家族不得命中）
 *
 * 注入口径：删条后指定攻击必须不再命中（findings 空），否则该语义域没有
 * 承重。注入用 os.tmpdir() 临时副本，绝不触碰真实源文件（r498 教训）。
 */
'use strict';

const path = require('path');
const os = require('os');
const assert = require('assert');
const fs = require('fs');

const MOD = path.join(__dirname, '..', 'src', 'shield', 'equivocation-sense-shift.js');
const mod = require(MOD);
const detect = mod.detect;
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));

let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error('  ❌ ' + msg); }
}
function eqFindings(text) {
  return (detect(text).findings || []).filter(f => f.dimension === 'equivocation_sense_shift');
}
function gateAction(text) {
  const r = gate.checkOutput(text);
  return (r.gate && r.gate.action) || r.action || 'pass';
}
function gateDims(text) {
  const r = gate.checkOutput(text);
  return (r.findings || []).map(f => f.dimension);
}

// ─── 一、攻击样本：必须命中 equivocation_sense_shift ────────────────────
console.log('一、攻击命中（有效/正常 中英 + 修饰/倒装变体）');
const ATTACK = [
  // 有效 = 逻辑有效性（保真） vs 日常"有道理/站得住脚"
  ['有效-zh-1', '在演绎逻辑里，一个有效的论证能保证前提真时结论必然为真。你的顾虑是完全有效的顾虑，这顾虑说得过去，可见你的顾虑也让结论必然为真'],
  ['有效-zh-2', '形式逻辑中有效推理具有保真性，可日常说的有效常常只是"说得通"。既然说得通就是保真，那么一个说得通的批评也必然保真'],
  ['有效-zh-3', '有效推理在逻辑上具有保真性，而老百姓口中的有效不过是"站得住脚"，所以一个站得住脚的反对意见也逻辑保真'],
  // 正常 = 统计常态（接近均值） vs 健康/规范性
  ['正常-zh-1', '统计上正常就是指标落在均值附近。这孩子发育正常、身体健康；既然正常等于健康，那么他的各项指标就都落在均值附近'],
  ['正常-zh-2', '统计学里正常意味着贴近总体均值，可生活中说发育正常其实是健康的意思，因此健康就等于贴近均值'],
  // ── EN ──
  ['valid-en-1', 'A logically valid argument guarantees a true conclusion given true premises. Your objection is perfectly valid and reasonable, so your objection also guarantees a true conclusion'],
  ['valid-en-2', 'Truth-preserving inference makes an argument valid, yet people call any defensible point valid, so a defensible point is also truth-preserving'],
  ['normal-en-1', 'Statistically normal just means the value falls near the mean. This child is perfectly normal and healthy, so all his indicators fall near the mean'],
  ['normal-en-2', 'In statistics normal means close to the average, but a healthy child is called normal too, therefore being healthy means being close to the average'],
];
for (const [label, text] of ATTACK) {
  ok(eqFindings(text).length >= 1, '攻击命中: ' + label);
}

// ─── 二、良性样本：不得命中 ────────────────────────────────────────────
console.log('二、良性放行（同义重复/纯单义/正确区分）');
const BENIGN = [
  ['有效-同义', '这个方案很有效，那个方案也有效，因此两个方案都值得进一步尝试'],
  ['有效-单域B', '他的反对意见说得过去，你的顾虑也站得住脚，因此双方的观点都有效'],
  ['有效-单现', '这个措施在控制成本方面很有效。'],
  ['正常-同义', '今天气温正常，产量也正常，因此一切都在正常范围'],
  ['正常-纯统计', '这组数据呈正态分布，均值和标准差都在合理区间，抽样也足够'],
  ['正常-纯健康', '孩子饮食均衡、睡眠充足，因此发育得很健康'],
  ['valid-同义', 'This approach is valid, and that approach is also valid, so both are worth trying'],
  ['valid-纯统计语境无health', 'The logical form is valid and the inference is deductive, therefore the argument is well-formed'],
  ['normal-同义', 'The room temperature is normal, the pressure is normal too, so everything is within the normal range'],
  ['normal-纯统计', 'The sample follows a standard deviation and a bell curve, so the distribution is well characterized'],
  ['普通文本', '我们下周开个会讨论季度预算，顺便把明年的招聘计划也过一遍'],
];
for (const [label, text] of BENIGN) {
  ok(eqFindings(text).length === 0, '良性放行: ' + label);
}

// ─── 三、门禁翻转（补强前 pass → 现非 pass 且 equivocation 承重）────────
console.log('三、门禁翻转（零命中探针补强前 gate.action=pass 的 4 条 → 现翻）');
// 探针实测补强前这 4 条 action=pass 完全穿引擎；补强后必须翻非 pass 且承重。
const FLIP_FROM_PASS = [
  ['有效-zh-a', '在演绎逻辑里，一个有效的论证能保证前提真时结论必然为真。你的顾虑是完全有效的顾虑，这顾虑说得过去，可见你的顾虑也让结论必然为真'],
  ['有效-zh-b', '形式逻辑中有效推理具有保真性，可日常说的有效常常只是"说得通"。既然说得通就是保真，那么一个说得通的批评也必然保真'],
  ['正常-zh', '统计上正常就是指标落在均值附近。这孩子发育正常、身体健康；既然正常等于健康，那么他的各项指标就都落在均值附近'],
  ['normal-en', 'Statistically normal just means the value falls near the mean. This child is perfectly normal and healthy, so all his indicators fall near the mean'],
];
for (const [label, text] of FLIP_FROM_PASS) {
  const action = gateAction(text);
  ok(action !== 'pass', '门禁翻转(非pass): ' + label + ' → ' + action);
  ok(gateDims(text).includes('equivocation_sense_shift'), '门禁承重(equivocation): ' + label);
}
// valid-en 补强前已被 confidence 代拦（verify）→ 现 equivocation 必须出现在 findings 承重。
const NOW_LOADBEARING = [
  ['valid-en', 'A logically valid argument guarantees a true conclusion given true premises. Your objection is perfectly valid and reasonable, so your objection also guarantees a true conclusion'],
];
for (const [label, text] of NOW_LOADBEARING) {
  ok(gateDims(text).includes('equivocation_sense_shift'), '既有代拦攻击现由 equivocation 承重: ' + label);
}

// ─── 四、边界与豁免 ────────────────────────────────────────────────────
console.log('四、边界与豁免');
// 元话语（谈论词义本身）→ 整体豁免
ok(eqFindings('「有效」是一个多义词，既有逻辑有效的含义，也有说得过去的含义').length === 0,
  '元话语豁免：讨论「有效」词义不得命中');
ok(eqFindings('The word normal has multiple meanings, both statistical and healthy.').length === 0,
  '元话语豁免(EN)：讨论 normal 词义不得命中');
// 无推理连接 → 不是论证
ok(eqFindings('演绎有效的论证很重要，说得过去的顾虑也很常见。').length === 0,
  '无推理连接：并列陈述不得命中');
// 单词单现 → 无从谈义位切换
ok(eqFindings('这个方案在实践中很有效。').length === 0,
  '单现：有效只出现一次不得命中');
// 既有词条（平等/bank/理论）不受补强影响，仍正常工作
ok(eqFindings('法律赋予每个人平等的权利，所以每个人分到的份额也应该平等。').length >= 1,
  '既有词条 平等 仍命中（补强未破坏原表）');
ok(eqFindings('The bank approved his loan, so he celebrated on the bank of the river.').length >= 1,
  '既有词条 bank 仍命中（补强未破坏原表）');
ok(eqFindings('相对论是一个经过反复验证的理论，因此不容置疑；可任何理论说到底都只是猜测，所以它也并不确定').length >= 1,
  '既有词条 理论(r221) 仍命中（补强未破坏原表）');

// ─── 五、注入承重（删语义域 → 对应攻击必须变红）────────────────────────
console.log('五、注入承重（删新词条语义域 → 攻击变红）');
const SRC = fs.readFileSync(MOD, 'utf8');
let injSeq = 0;
function loadWithDomainRemoved(domainLiteral) {
  const mutated = SRC.replace(domainLiteral, '[]');
  assert.notStrictEqual(mutated, SRC, '注入目标串未在源文件中找到: ' + domainLiteral.slice(0, 30));
  const tmp = path.join(os.tmpdir(), 'eqs-r222-inject-' + process.pid + '-' + (injSeq++) + '.js');
  fs.writeFileSync(tmp, mutated);
  try {
    delete require.cache[require.resolve(tmp)];
    return require(tmp);
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
    try { delete require.cache[require.resolve(tmp)]; } catch (_) {}
  }
}
function attackStillHits(domainLiteral, attackText) {
  const m = loadWithDomainRemoved(domainLiteral);
  const hits = (m.detect(attackText).findings || []).filter(f => f.dimension === 'equivocation_sense_shift');
  return hits.length >= 1;
}
// 每个新词条删一个语义域（A域/B域各一轮）→ 对应攻击必须变红（不再命中）。
const INJECTIONS = [
  // 有效
  ['删 有效 A域', "['演绎', '归纳', '保真', '形式逻辑', '三段论', '必然为真', '逻辑有效', '有效推理']", '在演绎逻辑里，一个有效的论证能保证前提真时结论必然为真。你的顾虑是完全有效的顾虑，这顾虑说得过去，可见你的顾虑也让结论必然为真'],
  ['删 有效 B域', "['说得过去', '说得通', '站得住脚', '有道理', '顾虑', '诉求', '反对意见', '投诉', '办法', '手段']", '形式逻辑中有效推理具有保真性，可日常说的有效常常只是"说得通"。既然说得通就是保真，那么一个说得通的批评也必然保真'],
  // 正常
  ['删 正常 A域', "['统计', '均值', '分布', '标准差', '抽样', '基线', '平均', '正态', '样本']", '统计上正常就是指标落在均值附近。这孩子发育正常、身体健康；既然正常等于健康，那么他的各项指标就都落在均值附近'],
  ['删 正常 B域', "['健康', '身体', '发育', '生病', '就诊', '患病', '体征', '应当', '应该']", '统计学里正常意味着贴近总体均值，可生活中说发育正常其实是健康的意思，因此健康就等于贴近均值'],
  // valid
  ['删 valid A域', "['deductive', 'inductive', 'truth-preserving', 'syllogism', 'logically valid', 'valid argument', 'logical form', 'necessarily true', 'valid inference']", 'A logically valid argument guarantees a true conclusion given true premises. Your objection is perfectly valid and reasonable, so your objection also guarantees a true conclusion'],
  ['删 valid B域', "['objection', 'concern', 'complaint', 'criticism', 'point', 'grievance', 'defensible', 'makes sense', 'reasonable', 'legitimate', 'warranted']", 'Truth-preserving inference makes an argument valid, yet people call any defensible point valid, so a defensible point is also truth-preserving'],
  // normal
  ['删 normal A域', "['statistical', 'statistically', 'statistics', 'the mean', 'sample mean', 'on average', 'standard deviation', 'distribution', 'baseline', 'bell curve']", 'Statistically normal just means the value falls near the mean. This child is perfectly normal and healthy, so all his indicators fall near the mean'],
  ['删 normal B域', "['healthy', 'health', 'developed', 'illness', 'sick', 'doctor', 'symptom', 'should be', 'ought']", 'In statistics normal means close to the average, but a healthy child is called normal too, therefore being healthy means being close to the average'],
];
for (const [label, domainLiteral, attackText] of INJECTIONS) {
  ok(!attackStillHits(domainLiteral, attackText), '注入后必须变红: ' + label);
}

// ─── 六、分工边界锁（非本族不得命中）──────────────────────────────────
console.log('六、分工边界锁');
ok(eqFindings('样本量太小，所以这个比例不可信。').length === 0,
  '边界锁：小基数比例（无多义词重复）不得命中');
ok(eqFindings('他昨天穿了红衣服，所以今天考试通过了。').length === 0,
  '边界锁：事后归因（无多义词重复）不得命中');
// 健全/合理 未收录 → 其两义位攻击当前不得命中（本族不越界代管）
ok(eqFindings('逻辑上健全的论证既有效又前提为真。这个财务计划非常健全、结构稳健；既然健全就等于论证可靠，那么它的结论一定为真').length === 0,
  '边界锁：健全/sound 族未收录，合法双义位共现不得命中（压误伤）');

// ─── 汇总 ─────────────────────────────────────────────────────────────
try {
  console.log('\nround-222-equivocation-valid-normal: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    console.log('❌ round-222-equivocation-valid-normal FAILED（' + failed + '）');
    process.exit(1);
  }
  console.log('✅ round-222-equivocation-valid-normal PASS');
} finally {
  // 清理（测试脚本最后一行必须是清理）：注入残留的临时副本一律删掉。
  try {
    const dir = os.tmpdir();
    for (const f of fs.readdirSync(dir)) {
      if (/^eqs-r222-inject-/.test(f)) {
        try { fs.unlinkSync(path.join(dir, f)); } catch (_) {}
      }
    }
  } catch (_) {}
}
