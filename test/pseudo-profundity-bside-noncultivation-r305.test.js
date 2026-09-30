/**
 * test/pseudo-profundity-bside-noncultivation-r305.test.js
 *
 * 第 305 轮守卫：PSEUDO_PHILOSOPHY_ZH 修身主语判据的 B 侧非修身排除。
 *
 * 背景（r301 遗留记账「V4 前导 6 字族误伤面未测」的复测结论）：
 *   真缺口不在句首前导，而在 B 侧跨距段吞工程需求/执行不足短语。
 *   修法：B 侧系词「是」后加负向前瞻，修身名词前 8 字窗内出现
 *   「团队需要更多 / 评审人手不足」这类短语时不判 pseudo_profundity。
 *
 * 断言型守卫（不 mutate 源码，用 indexOf 定位整段做删条注入）。
 *
 * r306 修订：原文件的 \uXXXX 转义样本有三处笔误（觉悟写成「悟觉」、
 * 软肋写成「软肘」、耐心写成「耐忆」）导致真阳断言假阴性。
 * 改为直接写中文字符，逐条人工核对过。
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

// 修身名词表锚点（源码内是 \u89c9\u609f 这种转义串，故用 BS 拼）
const CULT_ANCHOR = '(?:' + BS + 'u89c9' + BS + 'u609f|' + BS + 'u521d' + BS + 'u5fc3';
const CULT_AT = source.indexOf(CULT_ANCHOR);
assert.ok(CULT_AT !== -1, '应能定位修身名词表（觉悟|初心）');

// B 侧排除断言锚点：从修身名词表位置向前回找最靠近的 (?!
const GUARD_ANCHOR = '(?![^' + BS + 'u3002' + BS + 'uff01' + BS + 'uff1f' + BS + 'n]{0,8}(';
const gRel = source.lastIndexOf(GUARD_ANCHOR, CULT_AT);
assert.ok(gRel !== -1, 'B 侧非修身排除负向前瞻应存在于修身名词表之前');
const afterGuard = source.substring(gRel + GUARD_ANCHOR.length, gRel + GUARD_ANCHOR.length + 60);
if (process.env.R305_DEBUG) console.log('DEBUG CULT_AT=' + CULT_AT + ' gRel=' + gRel);
assert.ok(afterGuard.indexOf(BS + 'u9700' + BS + 'u8981' + BS + 'u66f4' + BS + 'u591a') !== -1,
  '负向前瞻内应含「需要更多」族：' + JSON.stringify(afterGuard));

// ── 2. 载入运行时判据并验证行为 ──
const lines = source.split('\n');
const startLine = lines.findIndex(l => l.indexOf('const PSEUDO_PHILOSOPHY_ZH = [') !== -1);
assert.ok(startLine !== -1, '应找到 PSEUDO_PHILOSOPHY_ZH 起始行');
let endLine = -1;
for (let i = startLine + 1; i < lines.length; i++) { if (lines[i].trim() === '];') { endLine = i; break; } }
assert.ok(endLine !== -1, '应找到 PSEUDO_PHILOSOPHY_ZH 结束行');
const arr = eval('[' + lines.slice(startLine + 1, endLine).join('\n') + ']');
// RegExp.source 返回正则字面量的源码文本，其中中文仍是 \uXXXX 转义形态
const U89c9 = BS + 'u89c9' + BS + 'u609f';
const U_budai = BS + 'u4e0d' + BS + 'u662f';
const U_shao = BS + 'u5c11' + BS + 'u5e74' + BS + 'u6c14';
const pat = arr.find(p => p.source.indexOf(U_budai) !== -1 && p.source.indexOf(U89c9) !== -1 && p.source.indexOf(U_shao) !== -1);
assert.ok(pat, '应找到修身主语判据（共 ' + arr.length + ' 条）');
const RE = pat;

// 2a. 排除样本（B 侧工程需求/执行不足）必须不命中
const EXCLUDED = [
  '所有的成长不是不发布，是团队需要更多耐心。',
  '真正的成熟不是太慢，是流程缺少勇气。',
  '强大不是没优化，是评审人手不足边界。',
  '幸福不是不够，是策略缺少温度。',
  '孤独不是有问题，是采集链路有缺失善意。',
  '自由不是需要改，是时间不够真诚。',
  '沉默不是待确认，是环境光太强敬畏。',
  '少年不是不稳定，是运营的开始。',
];
for (const t of EXCLUDED) {
  assert.strictEqual(RE.test(t), false, '排除样本不应命中：' + t.slice(0, 10));
}

// 2b. 真阳样本必须仍然命中（回归）
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
const gStart = gRel;
const seg = source.substring(gStart);
const closeIdx = seg.indexOf('))');
assert.ok(closeIdx !== -1, '应能定位前瞻段结束');
const GUARD_FULL = seg.substring(0, closeIdx + 2);
const STRIPPED = source.replace(GUARD_FULL, '');
const lines2 = STRIPPED.split('\n');
const s2 = lines2.findIndex(l => l.indexOf('const PSEUDO_PHILOSOPHY_ZH = [') !== -1);
let e2 = -1;
for (let i = s2 + 1; i < lines2.length; i++) { if (lines2[i].trim() === '];') { e2 = i; break; } }
const arr2 = eval('[' + lines2.slice(s2 + 1, e2).join('\n') + ']');
const pat2 = arr2.find(p => p.source.indexOf(U_budai) !== -1 && p.source.indexOf(U89c9) !== -1 && p.source.indexOf(U_shao) !== -1);

let redCount = 0;
for (const t of EXCLUDED) { if (pat2 && pat2.test(t)) redCount++; }
assert.ok(redCount >= 7, '删条注入后至少 7/8 排除样本应被误收（实测 ' + redCount + '/8）');

let posAfter = 0;
for (const t of POSITIVE) { if (pat2 && pat2.test(t)) posAfter++; }
assert.strictEqual(posAfter, POSITIVE.length, '删条注入后真阳召回应不变（实测 ' + posAfter + '/' + POSITIVE.length + '）');

console.log('pseudo-profundity-bside-noncultivation-r305: 全部通过');
console.log('  \u2022 排除样本不命中: ' + EXCLUDED.length + '/' + EXCLUDED.length);
console.log('  \u2022 真阳样本命中: ' + POSITIVE.length + '/' + POSITIVE.length);
console.log('  \u2022 删条注入变红: ' + redCount + '/' + EXCLUDED.length + '（真阳不变 ' + posAfter + '/' + POSITIVE.length + '）');
