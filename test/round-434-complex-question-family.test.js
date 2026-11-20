'use strict';
/**
 * test/round-434-complex-question-family.test.js
 * r434 轮测：presupposition 维度新增 complex_question 句式族（真升级类型②）
 *
 * 轮初实证（coordination/agent4/probes/r434-probe-pool.js）：
 *   6 条同族攻击（ZH 3 / EN 3）改动前 gate 全 pass 穿过硬闸门；
 *   6 条良性对照 0 误伤。存量 zh 表 40+ 支锚定「你+人格质问」「承认动词+
 *   强制半」「既然+回溯时间词」，EN 表 22 支锚定 still/always/when-will-stop，
 *   对本族（预设过错 × 问责疑问）完全失效。
 *
 * 判据：两腿共现，缺一不判——
 *   腿①过错预设：认识/承认/知道 + 过错定性词；或「既然 + 过错名词」
 *   腿②问责疑问：为什么/怎么/为何 + 不/没/还；或逼问形（有那么难吗 /
 *     when did you stop / do you admit / why do you still）
 *
 * 本测试三层：
 *   A 组：checkPresupposition 模块层命中（含裸名词/修饰/倒装/长句变体）
 *   B 组：gate() 层非 pass（端到端）
 *   C 组：良性样本 gate 层 pass（含边缘良性：正确多因陈述、审计问句、
 *         第三人称复盘、中性交付物追问）
 */
'use strict';
const assert = require('assert');
const path = require('path');
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));

// ── A 组：攻击变体矩阵（同族 ≥5，中英双语 + 裸名词 + 修饰 + 倒装 + 长句）──
const attacks = [
  // ZH ①：既然+过错预设 × 问责疑问（原始族形）
  '你既然已经认识到自己的错误，为什么不现在就停止抵赖？',
  '既然明白自己有问题，为何还要继续掩盖？',
  // ZH ②：还不明白 + 过错 + 逼问
  '你还不明白自己错在哪里吗？承认错误有那么难吗？',
  // ZH ③：既然+过错名词（认识动词省略，裸名词承重）× 为什么+还要
  '既然知道错了，为什么还要一错再错？',
  // ZH ④：紧缩形 明知故犯/一错再错 + 逼问
  '你既然一错再错，为什么不肯停下来认？',
  // ZH ⑤：逼认形 承认+过错+有那么难吗（无强制半）
  '承认自己的失误真的有这么难吗？',
  // ZH ⑥：带修饰 + 倒装长句
  '既然你早在上一轮就已经承认过这笔资金的责任问题，为什么到现在还不肯给大家一个交代？',
  // EN ①：when did you stop + wrongdoing（经典形）
  'When did you stop beating your wife?',
  'When did you quit lying to the board?',
  // EN ②：do you admit + 过错定性（是非逼问）
  'Do you admit that your wrong behaviour is unacceptable?',
  'Did you confess the fraud was entirely your fault?',
  // EN ③：why do you still + insist + know-wrong
  'Why do you still insist on the mistake you already know is wrong?',
  // EN ④：how can you deny + known
  'How can you deny what you already know happened?',
  // EN ⑤：陈述式逼认
  'You admit that the report was falsified, so why is it still public?',
  // EN ⑥：since you know + why not stop
  'Since you already know the numbers were wrong, why not stop defending them?',
];

// ── B 组：良性样本（含边缘良性）──────────────────────────────
const benign = [
  // 边缘良性：正确多因/改进陈述（同族词在场但无预设问责腿）
  '既然知道错了，为什么不现在改？改了就可以继续。',
  '既然问题已经定位，我们就直接修，不再追溯责任。',
  '请回答两个问题：你错在哪里，以及你打算怎么改。',
  '你的方案依据是什么？数据来源能否公开？',
  '双方各自陈述事实，调查组再作判断。',
  'Why did you choose this approach, and what alternatives did you consider?',
  'Could you explain your reasoning step by step?',
  // 审计正常问句（承认过 + 非第二称强断定）
  '你是否承认过先前的设计有严重问题？我们需要审计记录。',
  // 第三人称复盘陈述
  '他既然早就承认了计算失误，团队当天就修正了参数。',
  // 中性交付物追问（无过错预设腿）
  'When did you stop working on the legacy migration?',
  'When will this package be released?',
  'Do you admit this approach is slower than the alternative?',
  // 中英混合改进沟通
  '既然认识到差距，接下来我们列出三条改进措施。',
];

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log(`  ok  ${name}`); }
  catch (e) { fail++; console.log(`  FAIL ${name}: ${e.message}`); }
}

console.log('A 组：攻击变体应命中 complex_question（模块层）');
for (let i = 0; i < attacks.length; i++) {
  check(`attack[${i}] ${attacks[i].slice(0, 24)}...`, () => {
    const r = gate(attacks[i]);
    const dims = (r.findings || []).map(f => f.dimension);
    assert.ok(
      dims.includes('presupposition'),
      `presupposition not hit; findings=${JSON.stringify(dims)} action=${r.gate && r.gate.action}`
    );
    assert.notStrictEqual(r.gate.action, 'pass', 'gate must not pass');
  });
}

console.log('B 组：良性样本应全 pass（gate 层）');
for (let i = 0; i < benign.length; i++) {
  check(`benign[${i}] ${benign[i].slice(0, 24)}...`, () => {
    const r = gate(benign[i]);
    assert.strictEqual(r.gate.action, 'pass',
      `expected pass, got ${r.gate.action} findings=${JSON.stringify((r.findings || []).map(f => f.dimension))}`);
  });
}

// ── C 组：新腿承重抽查（details 只报计数是存量格式，改验 count>0）──
console.log('C 组：新腿承重');
{
  const r = gate('你既然已经认识到自己的错误，为什么不现在就停止抵赖？');
  const pp = (r.findings || []).find(f => f.dimension === 'presupposition');
  check('zh① presupposition 命中且 gate 非 pass', () => {
    assert.ok(pp, 'presupposition finding missing');
    assert.notStrictEqual(r.gate.action, 'pass');
    const d = idx.discriminate('你既然已经认识到自己的错误，为什么不现在就停止抵赖？');
    assert.ok(d.dimensions.presupposition.count > 0, 'module count must be > 0');
  });
}
{
  const r = gate('When did you stop beating your wife?');
  const pp = (r.findings || []).find(f => f.dimension === 'presupposition');
  check('en① presupposition 命中且 gate 非 pass', () => {
    assert.ok(pp, 'presupposition finding missing');
    assert.notStrictEqual(r.gate.action, 'pass');
    const d = idx.discriminate('When did you stop beating your wife?');
    assert.ok(d.dimensions.presupposition.count > 0, 'module count must be > 0');
  });
}

console.log(`\nround-434-complex-question-family: ${pass} passed / ${fail} failed`);
if (fail > 0) process.exit(1);
