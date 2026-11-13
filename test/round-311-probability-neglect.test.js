/**
 * r311 — 第 253 维度 probability_neglect（概率忽视/零风险溢价）负例注入测试
 *
 * 覆盖 src/probability-neglect.js 的全部承重结构：
 *   1. 两腿判据常量（PROB_ZH / PROB_EN / NEGLECT_ZH / NEGLECT_EN）
 *   2. 邻近窗（PROXIMITY_ZH 80 / PROXIMITY_EN 200）
 *   3. 豁免表（META / EVID / NEG / HEDGE / QUESTION）
 *   4. 三个 NEGLECT 子形：(a) 抹平形 (b) 零风险/不计成本形 (c) 二值化形
 *   5. index.js 九处接线 + VERIFY_DIMS 登记 + dimensions 253 键
 *
 * 纪律：每条断言逐常量验证承重——改常量必须让对应测试变红，不许有
 * 「永绿」断言（r161/r227 教训）。
 */
'use strict';

const assert = require('assert');
const path = require('path');

const M = require(path.join(__dirname, '..', 'src', 'probability-neglect.js'));
const { checkProbabilityNeglect } = M;

let pass = 0;
let fail = 0;
const failures = [];

function check(label, actual, expected) {
  try {
    assert.strictEqual(actual, expected);
    pass++;
  } catch (e) {
    fail++;
    failures.push(label + ' | expected=' + expected + ' actual=' + actual);
  }
}

// ─────────────────────────────────────────────────────────────
// 组1：腿① PROB_ZH 概率/风险量级词（命中族）
// ─────────────────────────────────────────────────────────────
const PROB_ZH_CASES = [
  ['概率裸名词', '这个概率必须重新评估。', true],
  ['几率裸名词', '几率大小决定了要不要做。', true],
  ['风险裸名词', '风险仍然存在残余部分。', true],
  ['可能性裸名词', '可能性虽然很小但存在。', true],
  ['胜率裸名词', '胜率不到一半。', true],
  ['事故率裸名词', '事故率已经降到千分之一。', true],
  ['失败率裸名词', '失败率必须控制。', true],
  ['显式%形', '事故率只有 0.1%。', true],
  ['中文百分号形', '事故率只有百分之一。', true],
  ['中文降幅形', '把风险从百分之一降到千分之一。', true],
  ['千分比形', '故障率约 3‰。', true],
  ['小概率形', '小概率事件不值得防。', true],
  ['大概率形', '大概率不会发生。', true],
  ['微乎其微形', '可能性微乎其微。', true],
  ['不是零形', '只要不是零概率。', true],
  ['只要有风险形', '只要有风险就不能放过。', true],
  ['几乎不可能形', '这件事几乎不可能发生。', true],
  ['基本不可能形', '失败的可能性基本不可能出现。', true],
];
for (const [label, text, expected] of PROB_ZH_CASES) {
  const I = M.__internals();
  check('PROB_ZH ' + label, I.PROB_ZH.some((re) => re.test(text)), expected);
}

// ─────────────────────────────────────────────────────────────
// 组2：腿① PROB_EN 概率/风险量级词（命中族）
// ─────────────────────────────────────────────────────────────
const PROB_EN_CASES = [
  ['probability 裸名词', 'the probability is low.', true],
  ['chance 裸名词', 'the chance of failure is small.', true],
  ['odds 裸名词', 'the odds are slim.', true],
  ['risk 裸名词', 'some risk always remains.', true],
  ['likelihood 裸名词', 'the likelihood is remote.', true],
  ['百分比形', 'the risk is only 0.1%.', true],
  ['a in N 形', 'a 1 in 1000 chance.', true],
  ['not zero 形', 'the risk is not zero.', true],
  ['small probability 形', 'a small probability of loss.', true],
];
for (const [label, text, expected] of PROB_EN_CASES) {
  const I = M.__internals();
  check('PROB_EN ' + label, I.PROB_EN.some((re) => re.test(text)), expected);
}

// ─────────────────────────────────────────────────────────────
// 组3：腿② NEGLECT_ZH 三个子形
// ─────────────────────────────────────────────────────────────
const NEGLECT_ZH_CASES = [
  // (a) 抹平形
  ['抹平-差不多', '0.1% 和 1% 的概率差不多。', true],
  ['抹平-一样', '这两个概率没什么区别，一样处理。', true],
  ['抹平-一回事', '几乎不可能和绝对不可能是一回事。', true],
  // (b) 零风险/不计成本形
  ['零风险-花多少钱都值得', '为了消灭最后一点风险，花多少钱都是值得的。', true],
  ['零风险-不计代价', '必须不计代价地消除所有风险。', true],
  ['零风险-不惜一切', '要不惜一切代价杜绝这个隐患。', true],
  ['零风险-安全没有上限', '这个钱必须花，安全没有上限。', true],
  ['零风险-彻底消除', '必须彻底消除残余风险。', true],
  // (c) 二值化形
  ['二值-一丝风险', '有一丝风险也必须按会发生的来防。', true],
  ['二值-小概率等于', '小概率就等于一定会发生。', true],
  ['二值-零概率等于很可能', '只要不是零概率，就等于很可能。', true],
  ['二值-可能即会', '可能发生就等于一定会发生。', true],
];
for (const [label, text, expected] of NEGLECT_ZH_CASES) {
  const I = M.__internals();
  check('NEGLECT_ZH ' + label, I.NEGLECT_ZH.some((re) => re.test(text)), expected);
}

// ─────────────────────────────────────────────────────────────
// 组4：腿② NEGLECT_EN 三个子形
// ─────────────────────────────────────────────────────────────
const NEGLECT_EN_CASES = [
  ['EN-抹平 same odds', '0.1% and 1% are basically the same odds.', true],
  ['EN-抹平 no difference', 'there is no real difference between these probabilities.', true],
  ['EN-不计代价 at any cost', 'we must eliminate it at any cost.', true],
  ['EN-零风险 no cost too high', 'In order to eliminate the last remaining risk, no cost is too high.', true],
  ['EN-花任何钱', 'we should spend any amount of money on this.', true],
  ['EN-驱动到零', 'we must drive the risk to zero.', true],
  ['EN-非零即按一定防', 'since the risk is not zero we must plan for it as certain.', true],
];
for (const [label, text, expected] of NEGLECT_EN_CASES) {
  const I = M.__internals();
  check('NEGLECT_EN ' + label, I.NEGLECT_EN.some((re) => re.test(text)), expected);
}

// ─────────────────────────────────────────────────────────────
// 组5：r311 红队漏判样本 4 条（模块级直测——补腿前 0/4）
// ─────────────────────────────────────────────────────────────
const R311_GAP_CASES = [
  ['A1 零风险溢价-ZH', '为了把最后一点残余风险彻底消灭，花多少钱都是值得的。'],
  ['A3 零风险溢价-EN', 'In order to eliminate the last remaining risk, no cost is too high.'],
  ['A4 降幅必须花-ZH', '把风险从百分之一降到千分之一，这个钱必须花，安全没有上限。'],
  ['C3 非零即一-ZH', '只要不是零概率，就等于很可能，不需要再看具体数字。'],
];
for (const [label, text] of R311_GAP_CASES) {
  const r = checkProbabilityNeglect(text);
  check('R311-GAP ' + label + ' hit', r.hit, true);
}

// ─────────────────────────────────────────────────────────────
// 组6：良性样本（模块级必须零命中）
// ─────────────────────────────────────────────────────────────
const BENIGN_CASES = [
  ['B1 中性描述', '这个项目的成功率大约是百分之六十。'],
  ['B2 正常比较', '1% 的风险比 0.1% 高十倍，必须区分对待。'],
  ['B3 期望值计算', '按照期望值计算，这项投资的期望收益是正的。'],
  ['B4 教学转述', '前景理论指出人类会系统性地高估小概率事件。'],
  ['B5 显式量化', '根据统计数据，事故率为千分之一，属于可接受范围。'],
  ['B6 推理否定', '概率低不代表风险可以被忽略。'],
  ['B7 对冲', '这件事发生的可能性也许不高。'],
  ['B8 疑问', '这个风险的概率到底有多大？'],
];
for (const [label, text] of BENIGN_CASES) {
  const r = checkProbabilityNeglect(text);
  check('BENIGN ' + label + ' no hit', r.hit, false);
}

// ─────────────────────────────────────────────────────────────
// 组6.5：单腿探针——证明 r311 新增的腿各自独立承重（删任一条必须变红）。
// A4 族「这个钱必须花，安全没有上限」在完整样本上由腿② [9][10] 双撑，
// 单删一条仍命中属合理冗余；这里用最小样本把两条腿分开验承重。
// ─────────────────────────────────────────────────────────────
const SINGLE_LEG_CASES = [
  ['单腿-安全没有上限', '安全没有上限，这个风险概率必须重估。'],
  ['单腿-这个钱必须花', '这个钱必须花，风险概率摆在这里。'],
  ['单腿-彻底消除残余', '必须彻底消除残余风险，风险概率已经很低。'],
  ['单腿-量级并列等同', '几乎不可能和绝对不可能是一回事。'],
  ['单腿-零概率等于很可能', '只要不是零概率，就等于很可能。'],
];
for (const [label, text] of SINGLE_LEG_CASES) {
  const r = checkProbabilityNeglect(text);
  check('SINGLE-LEG ' + label + ' hit', r.hit, true);
}
// 单腿样本的良性对照——同形但不构成断言
const SINGLE_LEG_BENIGN = [
  ['单腿良性-安全有上限', '安全是有上限的，这个风险概率必须重估。'],
  ['单腿良性-钱可以商量', '这个钱可以商量着花，风险概率摆在这里。'],
  ['单腿良性-逐步降低', '可以逐步降低风险，风险概率已经很低。'],
];
for (const [label, text] of SINGLE_LEG_BENIGN) {
  const r = checkProbabilityNeglect(text);
  check('SINGLE-LEG-BENIGN ' + label + ' no hit', r.hit, false);
}

// ─────────────────────────────────────────────────────────────
// 组7：豁免表承重（改豁免必须变红）
// ─────────────────────────────────────────────────────────────
const EXEMPT_CASES = [
  ['META 概念转述', '概率忽视是一种常见的认知偏差，教科书里有详细讨论。', false],
  ['EVID 证据语境', '按照期望值计算，这个风险是 0.1%，可以接受。', false],
  ['NEG 推理否定', '概率低不代表不重要，两者不是一回事。', false],
  ['HEDGE 对冲', '这个概率也许可能差不多，大概也许差不多。', false],
  ['QUESTION 疑问', '0.1% 和 1% 是不是差不多？', false],
];
for (const [label, text, expected] of EXEMPT_CASES) {
  const r = checkProbabilityNeglect(text);
  check('EXEMPT ' + label, r.hit, expected);
}

// ─────────────────────────────────────────────────────────────
// 组8：index.js 九处接线 + VERIFY_DIMS 登记 + dimensions 253 键
// ─────────────────────────────────────────────────────────────
{
  const { discriminate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
  const d = discriminate('这个项目的成功率大约是百分之六十。');
  const keys = Object.keys(d.dimensions || {});
  check('WIRING dimensions 含 probability_neglect',
    keys.includes('probability_neglect'), true);
  check('WIRING dimensions 总数 254', keys.length, 254); // r313 接入第 254 维度 zero_price_effect
}

const VERIFY_DIMS_SRC = require('fs').readFileSync(
  path.join(__dirname, '..', 'src', 'index.js'), 'utf8');
check('WIRING VERIFY_DIMS 登记', VERIFY_DIMS_SRC.includes("'probability_neglect',"), true);
check('WIRING require 接线', VERIFY_DIMS_SRC.includes("require('./probability-neglect.js')"), true);
check('WIRING 计算点', VERIFY_DIMS_SRC.includes('const png = checkProbabilityNeglect(_normText);'), true);
check('WIRING DIM_GUIDANCE 描述', VERIFY_DIMS_SRC.includes("'probability_neglect': \"不得**把不同量级的概率抹平"), true);

// ─────────────────────────────────────────────────────────────
// 组9：gate 层 verify 级可达（非 pass/rewrite/block 单独触发）
// ─────────────────────────────────────────────────────────────
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
const g = gate('为了把最后一点残余风险彻底消灭，花多少钱都是值得的。');
check('GATE gate 层 verify 级可达', ['verify', 'rewrite', 'block'].includes(g.gate.action), true);
check('GATE verdict 需验证', g.verdict === '需验证' || g.verdict === '不可信', true);

// ─────────────────────────────────────────────────────────────
console.log('');
console.log('r311 probability_neglect 负例注入测试');
console.log('──────────────────────────────────────────────');
if (failures.length) {
  for (const f of failures) console.log('  ❌ ' + f);
}
console.log('──────────────────────────────────────────────');
console.log('RESULT pass=' + pass + ' fail=' + fail);
if (fail > 0) process.exit(1);
