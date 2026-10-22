/**
 * 第 304 轮负例守卫：isEmphasis 的 isNominalChain 排除不得被静默删除
 *
 * 背景（v6.7.124 第 304 轮）：
 *   r299~r303 连续五轮记账的 isEmphasis 细化。r304 先用受控 A/B 探针定量：
 *   isEmphasis 的 B2 分支（「是…的X，」）把「X是[…的…的…]，」型多层定语
 *   定义句整句吃成强调句，导致可反转断言漏检。
 *
 * 修法：B2 分支追加 !isNominalChain（B 侧出现第二个「的」时不判强调句）。
 * A/B 实测（probe-304-k.js）：
 *   良性库 175 条 rev 0/175（BASE 也是 0，误伤不增）
 *   真强调 4 条 rev 0/4（BASE 也是 0，排除能力不降）
 *   多层定语定义句 0/4 → 1/4（召回 +1）
 *
 * 本守卫守四件事：
 *   ① 正向：多层定语定义句不再被 isEmphasis 吃成强调句（rev > 0）
 *   ② 负例：从 src/doubt-engine.js 删掉 isNominalChain 判断必须让 ① 变红
 *   ③ 无回归：真强调句（是[…]的，）继续被排除（rev = 0）
 *   ④ 无回归：r294 疑问构式守卫的样本仍 0 命中
 *
 * 形态只以转义序列出现，样本形状见 src/doubt-engine.js 对应行注释。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const SRC = path.join(__dirname, '..', 'src', 'doubt-engine.js');
const de = require('../src/doubt-engine.js');
const sym = (t) => de.checkSymmetry(t).reversible_claims.length;

// ── ① 多层定语定义句：X是[…的…的…]，不得被 isEmphasis 排除 ────────────
// 形状：A 侧主语 + 是 + [B1 的 B2 与 C1 的 C2] + 逗号。B 侧是名词性定义。
// 实测（probe-304-p.js）：B 侧只有单个「的」的名词短语仍被 isEmphasis 吃下
// （「…是上游服务的原始数据，」rev=0）——那确实是强调形，排除是对的。
// 真正漏检的是 B 侧出现**第二个「的」**的形态（「A的B与C的D」）。
const NOMINAL_DEF = [
  '\u8fd9\u4e2a\u6a21\u5757\u7684\u804c\u8d23\u662f\u8d1f\u8d23\u6d88\u606f\u7684\u5206\u53d1\u4e0e\u7f13\u5b58\u7684\u66f4\u65b0\uff0c\u4e0d\u6d89\u53ca\u4efb\u4f55\u7f51\u7edc\u901a\u4fe1\u903b\u8f91\u3002',
  '\u8fd9\u4e2a\u7ec4\u4ef6\u7684\u4f5c\u7528\u662f\u8d44\u6e90\u7ba1\u7406\u7684\u751f\u547d\u5468\u671f\u4e0e\u7f16\u8f91\u5668\u91cc\u7684\u91ca\u653e\u987a\u5e8f\uff0c\u5176\u4f59\u90e8\u5206\u4e0d\u9700\u8981\u5173\u5fc3\u3002',
  '\u8fd9\u4e2a\u63a5\u53e3\u7684\u8fd4\u56de\u503c\u662f\u4e0a\u6e38\u670d\u52a1\u7684\u539f\u59cb\u6570\u636e\u4e0e\u672c\u5730\u7f13\u5b58\u7684\u5408\u5e76\u7ed3\u679c\uff0c\u8c03\u7528\u65b9\u4e0d\u9700\u8981\u518d\u505a\u4e8c\u6b21\u52a0\u5de5\u3002',
  '\u8fd9\u6b21\u8fc1\u79fb\u7684\u7ed3\u679c\u662f\u65b0\u65e7\u4e24\u5957\u914d\u7f6e\u7684\u5e76\u884c\u8fd0\u884c\u4e0e\u7070\u5ea6\u6d41\u91cf\u7684\u9010\u6b65\u5207\u6362\uff0c\u56de\u6eda\u7a97\u53e3\u4fdd\u7559\u4e24\u5468\u3002',
];
for (const s of NOMINAL_DEF) {
  assert.ok(sym(s) > 0, `多层定语定义句被误当强调句排除: ${s.slice(0, 20)}`);
}

// ── ①c 归因留档（probe-304-q.js 逐条真值）────────────────────────────
// 另两条同形态样本仍被 isLeadWord / isStanceVerb 拦下（不是 isEmphasis 的锅）：
//   「这里的关键是索引的构建方式与枚举值的定义顺序，」→ isLeadWord
//   「问题的核心是缓存键的构建方式不一致，」→ isLeadWord + isStanceVerb
// 这两支是独立的排除族，isEmphasis 细化不该也不宜连带放宽（r304 纪律：
// 一个方向只动一支，避免同时放宽两面把误伤基线抬起来）。
const OTHER_BLOCKED = [
  '\u8fd9\u91cc\u7684\u5173\u952e\u662f\u7d22\u5f15\u7684\u6784\u5efa\u65b9\u5f0f\u4e0e\u679a\u4e3e\u503c\u7684\u5b9a\u4e49\u987a\u5e8f\uff0c\u5176\u4f59\u7ec6\u8282\u90fd\u4e0d\u91cd\u8981\u3002',
  '\u95ee\u9898\u7684\u6838\u5fc3\u662f\u7f13\u5b58\u952e\u7684\u6784\u5efa\u65b9\u5f0f\u4e0d\u4e00\u81f4\uff0c\u624d\u4f1a\u5bfc\u81f4\u67e5\u8be2\u65f6\u603b\u662f\u672a\u547d\u4e2d\u3002',
];
for (const s of OTHER_BLOCKED) {
  assert.strictEqual(sym(s), 0, `非 isEmphasis 排除族的样本被本轮细化放出来了: ${s.slice(0, 20)}`);
}

// ── ①b 无回归：B 侧单「的」的强调形继续被排除 ────────────────────────
// probe-304-p.js 实测：这是「是…的，」强调句，isEmphasis 排除它是对的，
// 细化不能把它放出来（否则等于回归 BASE 之前的误拦面）。
const SINGLE_EMPHASIS = [
  '\u8fd9\u4e2a\u63a5\u53e3\u7684\u8fd4\u56de\u503c\u662f\u4e0a\u6e38\u670d\u52a1\u7684\u539f\u59cb\u6570\u636e\uff0c\u8c03\u7528\u65b9\u4e0d\u9700\u8981\u518d\u505a\u4e8c\u6b21\u52a0\u5de5\u3002',
  '\u8fd9\u6b21\u8fc1\u79fb\u7684\u7ed3\u679c\u662f\u65b0\u65e7\u4e24\u5957\u914d\u7f6e\u7684\u5e76\u884c\u8fd0\u884c\uff0c\u56de\u6eda\u7a97\u53e3\u4fdd\u7559\u4e24\u5468\u3002',
];
for (const s of SINGLE_EMPHASIS) {
  assert.strictEqual(sym(s), 0, `单「的」强调形被放出来了: ${s.slice(0, 20)}`);
}

// ── ② 无回归：真强调句（是〔形容词〕的，）继续被排除 ──────────────────
const TRUE_EMPHASIS = [
  '\u8fd9\u4e2a\u5224\u65ad\u662f\u6b63\u786e\u7684\uff0c\u540e\u7eed\u53ef\u4ee5\u6309\u8fd9\u4e2a\u65b9\u5411\u7ee7\u7eed\u63a8\u8f76\u3002',
  '\u8fd9\u4e2a\u7ed3\u8bba\u662f\u53ef\u9760\u7684\uff0c\u591a\u6b21\u5b9e\u6d4b\u90fd\u80fd\u590d\u73b0\u3002',
  '\u8fd9\u4e2a\u9009\u62e9\u662f\u5408\u7406\u7684\uff0c\u7efc\u5408\u8003\u8651\u4e86\u6210\u672c\u4e0e\u98ce\u9669\u3002',
  '\u8fd9\u4e2a\u65b9\u6848\u662f\u53ef\u884c\u7684\uff0c\u56db\u4e2a\u73af\u8282\u90fd\u80fd\u8d70\u901a\u3002',
];
for (const s of TRUE_EMPHASIS) {
  assert.strictEqual(sym(s), 0, `真强调句被误判可反转: ${s.slice(0, 20)}`);
}

// ── ③ 无回归：r294 疑问构式守卫样本仍 0 命中 ─────────────────────────
const INTERROGATIVE = [
  '\u6211\u4e0d\u77e5\u9053\u8fd9\u4e2a\u5185\u5bb9\u5b89\u6392\u662f\u5426\u5408\u7406\uff0c\u524d\u534a\u90e8\u5206\u7406\u8bba\u4f1a\u4e0d\u4f1a\u592a\u67af\u71e5\u3002',
  '\u9700\u8981\u786e\u8ba4\u8fd9\u4e2a\u65b9\u6848\u4e0e\u5426\u843d\u5730\u65b9\u5f0f\u662f\u5426\u76f8\u5bb9\uff0c\u8fd8\u8981\u770b\u6027\u80fd\u3002',
  '\u6211\u4eec\u80fd\u5426\u5728\u4e0b\u4e2a\u7248\u672c\u91cc\u628a\u8fd9\u4e2a\u95ee\u9898\u4fee\u6389\uff0c\u8fd8\u9700\u8981\u518d\u8bc4\u4f30\u3002',
];
for (const s of INTERROGATIVE) {
  assert.strictEqual(sym(s), 0, `疑问构式被误判可反转: ${s.slice(0, 20)}`);
}

// ── ④ 无回归：原有可反转族（X是Y，Y 无「的」）仍命中 ──────────────────
const REVERSIBLE = [
  '\u8fd9\u4e2a\u6a21\u5757\u7684\u804c\u8d23\u662f\u4e8b\u4ef6\u5206\u53d1\u4e0e\u72b6\u6001\u540c\u6b65\uff0c\u4e0d\u6d89\u53ca\u4efb\u4f55\u6301\u4e45\u5316\u903b\u8f91\u4e0e\u7f13\u5b58\u7ba1\u7406\u3002',
  '\u8fd9\u6b21\u8c03\u6574\u7684\u76ee\u6807\u662f\u628a\u914d\u7f6e\u52a0\u8f7d\u653e\u5230\u542f\u52a8\u9636\u6bb5\u5b8c\u6210\uff0c\u907f\u514d\u8fd0\u884c\u65f6\u963b\u585e\u4e3b\u7ebf\u7a0b\u6267\u884c\u3002',
];
for (const s of REVERSIBLE) {
  assert.ok(sym(s) > 0, `原有可反转族被误排除: ${s.slice(0, 20)}`);
}

// ── ⑤ 负例守卫：源码里必须存在 isNominalChain，且 B2 分支必须引用它 ────
const raw = fs.readFileSync(SRC, 'utf8');
assert.ok(raw.includes('isNominalChain'),
  '负例守卫失败：src/doubt-engine.js 里找不到 isNominalChain（细化被删）');
const B2_LINE = raw.split('\n').find(l => l.includes('const isEmphasis ='));
assert.ok(/.test\(s\) && !\/\u662f\u7684\[/.test(B2_LINE) && B2_LINE.includes('isNominalChain'),
  '负例守卫失败：isEmphasis 的 B2 分支未引用 isNominalChain（细化被回退）');

// ── ⑥ 删条必须变红：删掉 isNominalChain 判断后 ① 的四条样本必须全部漏检 ──
let deleted = 0;
{
  const target = B2_LINE.replace(/ && !isNominalChain;/, ';');
  assert.notStrictEqual(target, B2_LINE, '删条锚点未命中（源码形态已变）');
  const copy = path.join(require('os').tmpdir(), 'hf-r304-emphasis-' + process.pid + '.js');
  fs.writeFileSync(copy, raw.replace(B2_LINE, target));
  const mutated = require(copy);
  for (const s of NOMINAL_DEF) {
    if (mutated.checkSymmetry(s).reversible_claims.length === 0) deleted++;
  }
  fs.unlinkSync(copy);
}
assert.strictEqual(deleted, NOMINAL_DEF.length,
  `删条未让守卫变红：${NOMINAL_DEF.length} 条样本只有 ${deleted} 条漏检`);

// ── ⑦ 端到端：名词链样本的 doubt() 不再 hedge，且不被误升到 rewrite ────
const doubtN = de.doubt(NOMINAL_DEF[0]);
assert.strictEqual(doubtN.symmetry.reversible_claims.length, 1,
  'doubt() 未反映细化结果（reversible_claims 空缺）');

console.log(`\n7 \u901a\u8fc7, 0 \u5931\u8d25`);
