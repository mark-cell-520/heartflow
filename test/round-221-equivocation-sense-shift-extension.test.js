'use strict';
/**
 * test/round-221-equivocation-sense-shift-extension.test.js
 * r221 · agent-4 · 对第 67 维度 equivocation_sense_shift（src/shield/，
 * 已接线）补强「科学推理/统计素养」方向 4 个中英双语多义词家族。
 * 这是「已有维度的全新措辞家族」（真升级类型②）：模块已加载调度，
 * 补强立即激活，无需改 src/index.js。零命中探针
 * coordination/agent4/probes/r221-zerohit-probe.js 实测补强前 10/10 穿引擎。
 *
 * 六层结构：
 *   一、攻击命中（detect 必须产出 equivocation_sense_shift finding）
 *   二、良性放行（同义重复/正确区分 → 不得命中）
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
console.log('一、攻击命中（4 族中英 + 修饰变体）');
const ATTACK = [
  // 理论 = 科学理论 vs 猜测
  ['理论-zh-1', '相对论是一个经过反复验证的理论，因此不容置疑；可任何理论说到底都只是猜测，所以它也并不确定'],
  ['理论-zh-2', '这个理论有大量实验数据支撑，显然站得住脚；但任何理论终究不过是猜想，所以不必当真'],
  // 证明 = 数理推导 vs 经验表明
  ['证明-zh-1', '他已经在数学上证明了这个定理，所以他的证明足以说明这个方法一定有效'],
  ['证明-zh-2', '他在形式逻辑中严格证明了这个命题，因此这足以证明该方案在实践中一定可行'],
  // 模型 = 数理建模 vs 榜样/样品
  ['模型-zh-1', '这个模型能很好地拟合训练数据，所以它是一个成功的模型，可以当行业榜样'],
  // 显著 = 统计显著 vs 重要/巨大
  ['显著-zh-1', '该效应在统计上显著，所以这是一个显著的重大进展，应当全面铺开'],
  ['显著-zh-2', '统计检验显示结果显著，可见这个发现足够显著，意义深远，值得立刻推广'],
  // ── EN ──
  ['theory-en-1', 'Evolution is a rigorously tested scientific theory, therefore it must be true; yet a theory is only a guess, so neither is certain'],
  ['prove-en-1', 'You can prove this theorem in mathematics, so your ability to prove it guarantees the method works in practice'],
  ['model-en-1', 'This model fits the training data well, so it is a good model and should be a role model for others'],
  ['significant-en-1', 'The effect was statistically significant, therefore it was significant and important, worth rolling out everywhere'],
];
for (const [label, text] of ATTACK) {
  ok(eqFindings(text).length >= 1, '攻击命中: ' + label);
}

// ─── 二、良性样本：不得命中 ────────────────────────────────────────────
console.log('二、良性放行（同义重复/正确区分/单义）');
const BENIGN = [
  ['理论-同义', '这个理论有实验数据支持，那个理论也有同行评审，因此两个理论都值得进一步研究'],
  ['理论-单现', '爱因斯坦提出了相对论，这是一个伟大的科学理论'],
  ['证明-同义', '他证明了这个引理，又证明了一个推论，所以他的证明过程很完整'],
  ['证明-单现', '他用严谨的数学推导证明了这个定理'],
  ['模型-同义', '这个模型拟合得好，那个模型预测也准，因此两个模型都可以纳入对比'],
  ['显著-纯统计', '该效应在统计上显著，p 值小于 0.01，样本量充足，检验结果稳健'],
  ['theory-同义', 'This theory is supported by experimental data, and that theory has passed peer review, so both theories merit further study'],
  ['prove-同义', 'He can prove the theorem and prove the lemma, so both results are proven'],
  ['model-同义', 'This model fits the data well, and that model also predicts accurately, so both models are useful'],
  ['significant-纯统计', 'The result was statistically significant, with a p-value below 0.01 and a large sample size'],
  ['普通文本', '今天天气不错，我们下午去公园散步，顺便讨论一下季度报告'],
];
for (const [label, text] of BENIGN) {
  ok(eqFindings(text).length === 0, '良性放行: ' + label);
}

// ─── 三、门禁翻转（补强前 pass → 现非 pass 且 equivocation 承重）────────
console.log('三、门禁翻转（零命中探针补强前 gate.action=pass 的 4 条 → 现翻）');
// 探针实测补强前这 4 条 action=pass 完全穿引擎；补强后必须翻非 pass 且承重。
const FLIP_FROM_PASS = [
  ['显著-zh', '该效应在统计上显著，所以这是一个显著的重大进展，应当全面铺开'],
  ['theory-en', 'Evolution is a rigorously tested scientific theory, therefore it must be true; yet a theory is only a guess, so neither is certain'],
  ['significant-en', 'The effect was statistically significant, therefore it was significant and important, worth rolling out everywhere'],
  ['model-en', 'This model fits the training data well, so it is a good model and should be a role model for others'],
];
for (const [label, text] of FLIP_FROM_PASS) {
  const action = gateAction(text);
  ok(action !== 'pass', '门禁翻转(非pass): ' + label + ' → ' + action);
  ok(gateDims(text).includes('equivocation_sense_shift'), '门禁承重(equivocation): ' + label);
}
// 补强前已被别的维度代拦（verify/rewrite）的 3 条 → 现 equivocation 必须出现在 findings 里承重。
const NOW_LOADBEARING = [
  ['理论-zh', '相对论是一个经过反复验证的理论，因此不容置疑；可任何理论说到底都只是猜测，所以它也并不确定'],
  ['证明-zh', '他已经在数学上证明了这个定理，所以他的证明足以说明这个方法一定有效'],
  ['模型-zh', '这个模型能很好地拟合训练数据，所以它是一个成功的模型，可以当行业榜样'],
];
for (const [label, text] of NOW_LOADBEARING) {
  ok(gateDims(text).includes('equivocation_sense_shift'), '既有代拦攻击现由 equivocation 承重: ' + label);
}

// ─── 四、边界与豁免 ────────────────────────────────────────────────────
console.log('四、边界与豁免');
// 元话语（谈论词义本身）→ 整体豁免
ok(eqFindings('「显著」是一个多义词，既有统计显著的含义，也有重要的含义').length === 0,
  '元话语豁免：讨论「显著」词义不得命中');
// 无推理连接 → 不是论证
ok(eqFindings('统计显著很关键，实际显著也很关键。').length === 0,
  '无推理连接：并列陈述不得命中');
// 单词单现 → 无从谈义位切换
ok(eqFindings('这个理论还有待实验验证。').length === 0,
  '单现：理论只出现一次不得命中');
// 既有词条（平等/bank）不受补强影响，仍正常工作
ok(eqFindings('法律赋予每个人平等的权利，所以每个人分到的份额也应该平等。').length >= 1,
  '既有词条 平等 仍命中（补强未破坏原表）');
ok(eqFindings('The bank approved his loan, so he celebrated on the bank of the river.').length >= 1,
  '既有词条 bank 仍命中（补强未破坏原表）');

// ─── 五、注入承重（删语义域 → 对应攻击必须变红）────────────────────────
console.log('五、注入承重（删新词条语义域 → 攻击变红）');
const SRC = fs.readFileSync(MOD, 'utf8');
let injSeq = 0;
function loadWithDomainRemoved(domainLiteral) {
  const mutated = SRC.replace(domainLiteral, '[]');
  assert.notStrictEqual(mutated, SRC, '注入目标串未在源文件中找到: ' + domainLiteral.slice(0, 30));
  const tmp = path.join(os.tmpdir(), 'eqs-r221-inject-' + process.pid + '-' + (injSeq++) + '.js');
  fs.writeFileSync(tmp, mutated);
  try {
    // 清 require 缓存确保加载到变异版
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
// 每个新词条删一个语义域（多为 B 域，理论/显著 加删 A 域）→ 对应攻击必须变红（不再命中）。
const INJECTIONS = [
  ['删 理论 B域', "['猜测', '猜想', '臆测', '推测', '没有依据', '未经证实', '纯属', '异想天开', '未必成立', '不一定对']", '相对论是一个经过反复验证的理论，因此不容置疑；可任何理论说到底都只是猜测，所以它也并不确定'],
  ['删 理论 A域', "['科学', '验证', '实验', '定律', '假说', '数据', '证据', '相对论', '进化论', '检验', '预测', '物理', '同行评审', '可证伪']", '相对论是一个经过反复验证的理论，因此不容置疑；可任何理论说到底都只是猜测，所以它也并不确定'],
  ['删 证明 B域', "['表明', '说明', '显示', '足以', '实践', '事实胜于雄辩']", '他已经在数学上证明了这个定理，所以他的证明足以说明这个方法一定有效'],
  ['删 模型 B域', "['榜样', '示范', '模范', '样品', '机型', '模特', '典范', '标杆', '效仿', '学习对象']", '这个模型能很好地拟合训练数据，所以它是一个成功的模型，可以当行业榜样'],
  ['删 显著 B域', "['重要', '重大', '巨大', '深远', '可观', '突破', '值得推广', '影响力']", '该效应在统计上显著，所以这是一个显著的重大进展，应当全面铺开'],
  ['删 显著 A域', "['统计', 'p值', 'p 值', '显著性', '检验', '样本', '置信', '差异', '方差', '卡方', 't检验']", '该效应在统计上显著，所以这是一个显著的重大进展，应当全面铺开'],
  ['删 theory B域', "['guess', 'speculation', 'hunch', 'conjecture', 'mere', 'unproven', 'not necessarily', 'opinion', 'made up']", 'Evolution is a rigorously tested scientific theory, therefore it must be true; yet a theory is only a guess, so neither is certain'],
  ['删 prove B域', "['demonstrate', 'guarantee', 'practice', 'effective', 'in practice']", 'You can prove this theorem in mathematics, so your ability to prove it guarantees the method works in practice'],
  ['删 model B域', "['role', 'exemplar', 'prototype', 'sample', 'citizen', '榜样']", 'This model fits the training data well, so it is a good model and should be a role model for others'],
  ['删 significant B域', "['important', 'importance', 'major', 'huge', 'profound', 'breakthrough', 'worth']", 'The effect was statistically significant, therefore it was significant and important, worth rolling out everywhere'],
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

// ─── 汇总 ─────────────────────────────────────────────────────────────
try {
  console.log('\nround-221-equivocation-sense-shift-extension: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    console.log('❌ round-221-equivocation-sense-shift-extension FAILED（' + failed + '）');
    process.exit(1);
  }
  console.log('✅ round-221-equivocation-sense-shift-extension PASS');
} finally {
  // 清理（测试脚本最后一行必须是清理）：注入残留的临时副本一律删掉。
  try {
    const dir = os.tmpdir();
    for (const f of fs.readdirSync(dir)) {
      if (/^eqs-r221-inject-/.test(f)) {
        try { fs.unlinkSync(path.join(dir, f)); } catch (_) {}
      }
    }
  } catch (_) {}
}
