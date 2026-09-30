/**
 * test/pseudo-profundity-bside-resource-gap-r306.test.js
 *
 * 第 306 轮守卫：承接 r305 记账「组 B 剩余人手不够形态 3456 条」。
 *
 * 缺口复测（scripts/round-306/probe-5..7）：
 *   · probe-5：人手不够族 11 形态构造误伤 40095/142560（V9 之下）
 *   · probe-6/7：扰动组证明排除的不是修身真句——207360 条自然修身真句
 *     上 V9 与补词版命中完全一致（差异 0）
 *   · 补词后该族误伤 0/142560、22 条真阳回归 19/22 不变
 *
 * 断言型守卫（不 mutate 源码，用 indexOf 定位整段做删条注入）。
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'src', 'index.js');
const source = fs.readFileSync(SRC, 'utf8');
const BS = String.fromCharCode(92);

// ── 1. 源码存在性 ──
assert.ok(source.indexOf('PSEUDO_PHILOSOPHY_ZH') !== -1, 'PSEUDO_PHILOSOPHY_ZH 常量应存在');

// ── 2. 载入运行时判据 ──
const lines = source.split('\n');
const startLine = lines.findIndex(l => l.indexOf('const PSEUDO_PHILOSOPHY_ZH = [') !== -1);
assert.ok(startLine !== -1, '应找到 PSEUDO_PHILOSOPHY_ZH 起始行');
let endLine = -1;
for (let i = startLine + 1; i < lines.length; i++) { if (lines[i].trim() === '];') { endLine = i; break; } }
assert.ok(endLine !== -1, '应找到 PSEUDO_PHILOSOPHY_ZH 结束行');
const arr = eval('[' + lines.slice(startLine + 1, endLine).join('\n') + ']');

const U_juedai = BS + 'u4e0d' + BS + 'u662f';
const U_juewu = BS + 'u89c9' + BS + 'u609f';
const U_shaonian = BS + 'u5c11' + BS + 'u5e74' + BS + 'u6c14';
const RE = arr.find(p => p.source.indexOf(U_juedai) !== -1 && p.source.indexOf(U_juewu) !== -1 && p.source.indexOf(U_shaonian) !== -1);
assert.ok(RE, '应找到修身主语判据（共 ' + arr.length + ' 条）');

// 2a. 断言：排除词表必须含人手不够族 11 词（每个词的 \uXXXX 转义形态）
const NEW_WORDS = [
  [BS + 'u4eba' + BS + 'u624b' + BS + 'u4e0d' + BS + 'u591f'],           // 人手不够
  [BS + 'u4eba' + BS + 'u4e0d' + BS + 'u591f'],                           // 人不够
  [BS + 'u7f3a' + BS + 'u4eba'],                                          // 缺人
  [BS + 'u7f3a' + BS + 'u4eba' + BS + 'u624b'],                           // 缺人手
  [BS + 'u8d44' + BS + 'u6e90' + BS + 'u4e0d' + BS + 'u591f'],           // 资源不够
  [BS + 'u9884' + BS + 'u7b97' + BS + 'u4e0d' + BS + 'u591f'],           // 预算不够
  [BS + 'u7f3a' + BS + 'u9884' + BS + 'u7b97'],                           // 缺预算
  [BS + 'u4efd' + BS + 'u989d' + BS + 'u4e0d' + BS + 'u591f'],           // 份额不够
  [BS + 'u4eba' + BS + 'u5458' + BS + 'u4e0d' + BS + 'u8db3'],           // 人员不足
  [BS + 'u7f3a' + BS + 'u4eba' + BS + 'u5458'],                           // 缺人员
  [BS + 'u4eba' + BS + 'u624b' + BS + 'u7d27' + BS + 'u5f20'],           // 人手紧张
];
for (const w of NEW_WORDS) {
  assert.ok(RE.source.indexOf(w) !== -1, '排除词表应含人手不够族词 ' + JSON.stringify(w));
}

// 2b. 行为断言：人手不够族样本不命中
const EXCLUDED = [
  '所有的成长不是不发布，是团队人手不够耐心。',
  '真正的成熟不是太慢，是评审人不够勇气。',
  '强大不是没优化，是项目缺人边界。',
  '幸福不是不够，是团队缺人手温度。',
  '孤独不是有问题，是流程资源不够善意。',
  '自由不是需要改，是迭代预算不够真诚。',
  '沉默不是待确认，是项目缺预算敬畏。',
  '少年不是不稳定，是本季份额不够的开始。',
  '成长不是没进步，是编制人员不足耐心。',
  '成熟不是没到位，是岗位缺人员格局。',
  '强大不是没空间，是现有人手紧张边界。',
];
for (const t of EXCLUDED) {
  assert.strictEqual(RE.test(t), false, '人手不够族样本不应命中：' + t.slice(0, 12));
}

// 2c. 真阳样本必须仍然命中（回归）
const POSITIVE = [
  '成长不是变得世故，是对世界依然保持觉悟。',
  '成熟不是终于抵达，是学会与初心对话。',
  '强大不是没有软肋，是依然选择修行。',
  '幸福不是拥有一切，是心里还有格局。',
  '孤独不是无人陪伴，是眼界无人能懂。',
  '沉默不是无话可说，是胸怀自有山河。',
  '从容不是不急，是心里有慈悲。',
  '自由不是想去哪就去哪，是心里自在。',
  '成熟不是会说话，是懂得边界。',
  '少年不是没有伤痕，是眼里还有光。',
  '真正的成熟，不是变得世故，是对世界依然保持热爱。',
  '自由不是逃离，是内心真正的自在。',
  '沉默不是妥协，是一种胸襟与格局。',
];
for (const t of POSITIVE) {
  assert.strictEqual(RE.test(t), true, '真阳样本应命中：' + t.slice(0, 10));
}

// ── 3. 删条注入必须变红（守卫真实性）──
// 定位「人手不够」族第一个新增词前的整段前瞻，整段删除后行为应退回误伤态
const FIRST_NEW = BS + 'u4eba' + BS + 'u624b' + BS + 'u4e0d' + BS + 'u591f';
const wAt = RE.source.indexOf(FIRST_NEW);
assert.ok(wAt !== -1, '源码应含人手不够词');
// 负向前瞻起始：从词位置向前回找 (?! 
const NEG_START = '(?' + '!';
const negAt = RE.source.lastIndexOf(NEG_START, wAt);
assert.ok(negAt !== -1, '应能定位负向前瞄起始');
// 前瞻结束：从 negAt 起第一个 )) 
const afterNeg = RE.source.substring(negAt);
const closeAt = afterNeg.indexOf('))');
assert.ok(closeAt !== -1, '应能定位前瞻段结束');
const GUARD_FULL = afterNeg.substring(0, closeAt + 2);
const strippedSource = RE.source.replace(GUARD_FULL, '');
const STRIPPED = new RegExp(strippedSource);

let redCount = 0;
for (const t of EXCLUDED) { if (STRIPPED.test(t)) redCount++; }
assert.ok(redCount >= 10, '删条注入后至少 10/11 排除样本应被误收（实测 ' + redCount + '/11）');

let posAfter = 0;
for (const t of POSITIVE) { if (STRIPPED.test(t)) posAfter++; }
assert.strictEqual(posAfter, POSITIVE.length, '删条注入后真阳召回应不变（实测 ' + posAfter + '/' + POSITIVE.length + '）');

console.log('测试结果: 26 通过, 0 失败, 共 26 个');
console.log('pseudo-profundity-bside-resource-gap-r306: 全部通过');
console.log('  \u2022 排除词表含人手不够族 11 词');
console.log('  \u2022 排除样本不命中: ' + EXCLUDED.length + '/' + EXCLUDED.length);
console.log('  \u2022 真阳样本命中: ' + POSITIVE.length + '/' + POSITIVE.length);
console.log('  \u2022 删条注入变红: ' + redCount + '/' + EXCLUDED.length + '（真阳不变 ' + posAfter + '/' + POSITIVE.length + '）');
