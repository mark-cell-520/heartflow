'use strict';
// [r293] 第 246 维度 stolen_concept（偷取概念谬误）负例注入测试。
// 守卫常量（META_CONCEPT / LIMIT_SCOPE / REPAIR / HEDGE / QUESTION）逐个置空，
// 验证每个守卫真正承重——置空后本该豁免的样本必须开始命中。
const path = require('path');
const { checkStolenConcept, __internals } = require(path.join(__dirname, '..', 'src', 'stolen-concept.js'));

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) { pass++; } else { fail++; fails.push(name + (detail ? ' :: ' + detail : '')); }
}

// 攻击族：先能力否认，后贬斥结论（同句内或后续 2 句）
const ATTACKS = [
  '科学证明不了上帝存在，所以科学一无所用。',
  '理性不能解释一切，所以理性毫无价值。',
  '逻辑不能证明逻辑本身，所以逻辑是循环论证、不可信。',
  '科学解释不了意识的本质，所以科学毫无意义。',
  '理性无法保证我们得到真理，所以理性不值一提。',
  'There is no objective truth, therefore science is worthless.',
  'Reason cannot justify itself, so reason is groundless.',
  'Logic cannot prove itself, therefore logic is circular and cannot be trusted.',
  '实验不能直接观测因果，所以实验毫无价值。',
  '证据无法给出确定性，所以证据毫无意义。',
];

// 良性族：正确批评 / 范围限定 / 正面修补 / 元判别
const BENIGN = [
  '科学不能证明一切，所以科学只能处理可观测的现象。',   // 范围限定
  '逻辑不能自证，所以逻辑需要预设公理。',                 // 正面修补
  '理性有局限，所以我们要保持谦卑。',                     // 结论无贬斥谓语
  '因为科学证明不了神，所以神存在。',                     // 结论不否定科学
  '用科学暂时解释不了的事来否定科学本身，是偷取概念谬误。', // 元判别（META_CONCEPT）
  '科学也许不能回答所有问题，所以它仍有边界。',           // HEDGE
  '科学能解释什么？它不能解释意识。',                     // QUESTION
  '实验方法需要严格的对照组，否则结论不可靠。',           // REPAIR
  '数据只能反映可测量的部分，因此我们要谨慎解读。',       // LIMIT_SCOPE
  '理性有其适用范围，超出范围它就不适用。',               // LIMIT_SCOPE
  '今天天气不错，我们出去散步吧。',                       // 无关
  'The scientific method requires reproducible results.', // 无关英文
];

// ── 1. 攻击族必须命中 ──────────────────────────────────────
for (let i = 0; i < ATTACKS.length; i++) {
  const r = checkStolenConcept(ATTACKS[i]);
  ok('attack[' + i + '] hits', r.count > 0 && r.score >= 70, JSON.stringify(r));
}

// ── 2. 良性族必须 pass ──────────────────────────────────────
for (let i = 0; i < BENIGN.length; i++) {
  const r = checkStolenConcept(BENIGN[i]);
  ok('benign[' + i + '] pass', r.count === 0, JSON.stringify(r));
}

// ── 3. 空输入 ────────────────────────────────────────────────
ok('empty pass', checkStolenConcept('').count === 0);
ok('null pass', checkStolenConcept(null).count === 0);

// ── 4. 守卫逐常量置空注入（每个守卫必须真正承重）─────────────
// 注入参数名与 src/stolen-concept.js 的 G 映射一致。
// 注意：承重样本必须**自带贬斥结论**（DEMOTE 腿）——守卫只在
// 「能力否认 × 贬斥结论」两腿齐备后才可能豁免，缺 DEMOTE 腿的句子
// 置空守卫也不会命中（那是正常的不判，不是守卫承重）。
// 4.1 META_CONCEPT 置空 → 元判别句应开始命中（守卫原本豁免它）
{
  const r = checkStolenConcept('用科学暂时解释不了的事来否定科学本身，说明科学毫无价值。', { META_CONCEPT: [] });
  ok('META_CONCEPT load-bearing', r.count > 0, JSON.stringify(r));
}
// 4.2 HEDGE 置空 → 对冲句应开始命中
{
  const r = checkStolenConcept('科学也许不能回答所有问题，所以科学毫无价值。', { HEDGE: [] });
  ok('HEDGE load-bearing', r.count > 0, JSON.stringify(r));
}
// 4.3 QUESTION 置空 → 疑问句应开始命中
{
  const r = checkStolenConcept('科学能解释什么？它不能解释意识，所以科学毫无意义。', { QUESTION: [] });
  ok('QUESTION load-bearing', r.count > 0, JSON.stringify(r));
}
// 4.4 LIMIT_SCOPE 置空 → 范围限定结论应开始命中
{
  const r = checkStolenConcept('科学不能证明一切，所以科学只能处理可观测的现象、毫无价值可言。', { LIMIT_SCOPE: [] });
  ok('LIMIT_SCOPE load-bearing', r.count > 0, JSON.stringify(r));
}
// 4.5 REPAIR 置空 → 正面修补结论应开始命中
{
  const r = checkStolenConcept('逻辑不能自证，所以逻辑需要预设公理，否则便不可信。', { REPAIR: [] });
  ok('REPAIR load-bearing', r.count > 0, JSON.stringify(r));
}
// 4.6 全部守卫置空 → 结论带贬斥词的那句仍应命中
{
  const r = checkStolenConcept('科学不能证明一切，所以科学只能处理可观测的现象、毫无价值可言。', { LIMIT_SCOPE: [], REPAIR: [], META_CONCEPT: [], HEDGE: [], QUESTION: [] });
  ok('all-guard-empty still hits', r.count > 0, JSON.stringify(r));
}

// ── 5. 裸名词形态自查（161 轮教训：族词去后缀仍需命中）────────
{
  const bare = [
    '科学证明不了上帝，所以科学不可信。',
    '理性解释不了，所以理性靠不住。',
    '逻辑证明不了，所以逻辑是迷信。',
    '证据不能保证，所以证据不算什么。',
    '观测有局限，所以观测毫无价值。',
  ];
  for (let i = 0; i < bare.length; i++) {
    const r = checkStolenConcept(bare[i]);
    ok('bare[' + i + '] hits', r.count > 0, JSON.stringify(r));
  }
}

// ── 6. 结论跟句中必须自带能力概念（防跨概念误判）────────────
{
  // 腿②跟句若无能力概念，不得判
  const r = checkStolenConcept('科学解释不了意识。他这个人很差劲。');
  ok('follow-without-concept pass', r.count === 0, JSON.stringify(r));
}

// ── 7. r293 补腿：中置推论桥（单句内「否认…，说明/足见 X」）──────
// 缺口实证见 coordination/agent4/probes/r293-midbridge-probe.js：
// 首版模块只剥句首桥，句中「，说明」「，这说明」「，足见」不剥 →
// 6 攻击样本中 3 个漏判（A1/A2/A3），11 个良性样本零误伤。
// 修 _stripBridge 中置切分（含桥前指示代词 + 句尾无后分隔符形态）
// 与 DEMOTE_ZH 补「毫不足取/不足取/不足为信」族后 6/6 命中、11/11 零误伤。
// 此处固化为回归。
console.log('\n[7] mid-sentence bridge (r293)');
{
  const MID_ATTACK = [
    ['MID-1', '用科学暂时解释不了的事来否定科学本身，说明科学毫无价值。'],
    ['MID-2', '科学证明不了上帝存在，这说明科学一文不值。'],
    ['MID-3', '理性不能解释一切，足见理性毫不足取。'],
    ['MID-4', '实验不能直接观测因果，可见实验形同虚设。'],
    ['MID-5', 'Reason cannot justify itself, which means reason is groundless.'],
    ['MID-6', 'Logic cannot prove itself, thus logic is worthless.'],
  ];
  for (const [id, s] of MID_ATTACK) {
    const r = checkStolenConcept(s);
    ok(id + ' mid-bridge hit', r.count > 0, JSON.stringify({ count: r.count, score: r.score }));
  }
  const MID_BENIGN = [
    ['MB-1', '科学不能证明一切，这说明科学有它自己的适用范围。'],
    ['MB-2', '逻辑不能自证，这说明逻辑立足于公理预设。'],
    ['MB-3', '理性不能解释一切，可见我们要保持谦卑。'],
    ['MB-4', '科学不能证明一切，所以科学只能处理可观测的现象。'],
    ['MB-5', '逻辑不能自证，所以逻辑需要预设公理。'],
    ['MB-6', '理性有局限，所以我们要保持谦卑。'],
    ['MB-7', '科学证明不了神，所以神存在。'],
    ['MB-8', '数据只能反映可测量的部分，因此我们要谨慎解读。'],
  ];
  for (const [id, s] of MID_BENIGN) {
    const r = checkStolenConcept(s);
    ok(id + ' mid-bridge benign', r.count === 0, JSON.stringify({ count: r.count, hits: r.hits }));
  }
}

console.log('round-293 stolen_concept: ' + pass + ' passed / ' + fail + ' failed');
if (fails.length) { console.log('FAILURES:'); for (const f of fails) console.log('  - ' + f); process.exit(1); }
