/**
 * negative-test-ppf-light-nouns-r302.test.js
 * —— pseudo_profundity B 侧修身名词「光/微光/亮/灯/希望」注入-删条负例守卫（第 302 轮）
 *
 * 守什么：r302 新增的 5 个 B 侧修身名词必须真的是守卫。
 *   判据位置：src/index.js PSEUDO_PHILOSOPHY_ZH 数组第 20 条（idx=19），
 *   B 侧名词组尾部 …|\u7ad9\u8d77\u6765|\u9009\u62e9|\u5149|\u5fae\u5149|\u4eae|\u706f|\u5e0c\u671b)
 *
 * 四条铁律逐条验证：
 *   ① 注入：补词后 5 条专属探针必须命中 pseudo_profundity
 *   ② 删条：把 5 个新词从 src/ 正则里删掉，同样探针必须**变红**（回到不命中）
 *   ③ 还原：删条后立刻还原源码，探针必须重新命中（排除缓存/路径干扰）
 *   ④ 兜底：删掉整条 B 侧名词组（从 (?:\u89c9\u609f 到行尾 /），探针仍不命中
 *   ⑤ 良性：误伤面 0 —— 生活主语 + 真实描述的真句，删词前后都不允许命中
 *
 * 为什么在 test/ 里内联样本：本守卫对象就是这 5 个词本身，删条验证要求
 * 样本句与 src/ 正则逐字对应，无法用文件间间接引用替代。
 * 样本一律为「修身主语 + 不是 + 真实描述 + 是 + 含新名词短语」形状。
 */
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'index.js');
const SRC_ORIGINAL = fs.readFileSync(SRC, 'utf8');
const { checkOutput } = require(path.join(ROOT, 'src', 'gate.js'));

function ppf(t) {
  const r = checkOutput(t);
  return r && r.findings
    ? r.findings.some(f => String(f.dimension || '').indexOf('pseudo_profundity') !== -1)
    : false;
}
/** 清 src/index.js 的 require 缓存，确保后续读到改后的代码 */
function bustCache() {
  const target = path.join(ROOT, 'src', 'index.js');
  for (const k of Object.keys(require.cache)) {
    if (k === target || k.indexOf(target + path.sep) === 0) delete require.cache[k];
  }
}

// ── 专属探针：每条只被一个新词命中（主语在修身白名单）──
const PROBES = [
  '\u5c11\u5e74\u4e0d\u662f\u6ca1\u6709\u4f24\u75d5\uff0c\u662f\u773c\u91cc\u8fd8\u6709\u5149\u3002',
  '\u5c11\u5e74\u4e0d\u662f\u6ca1\u6709\u4f24\u75d5\uff0c\u662f\u773c\u91cc\u8fd8\u6709\u5fae\u5149\u3002',
  '\u5c11\u5e74\u4e0d\u662f\u6ca1\u6709\u4f24\u75d5\uff0c\u662f\u773c\u91cc\u8fd8\u6709\u4eae\u3002',
  '\u5c11\u5e74\u4e0d\u662f\u6ca1\u6709\u4f24\u75d5\uff0c\u662f\u773c\u91cc\u8fd8\u6709\u706f\u3002',
  '\u5c11\u5e74\u4e0d\u662f\u6ca1\u6709\u4f24\u75d5\uff0c\u662f\u773c\u91cc\u8fd8\u6709\u5e0c\u671b\u3002',
];

// ── 良性对照：同形状但 B 侧不含新词（生活主语 + 真实描述）──
const BENIGN = [
  '\u5c4f\u5e55\u4e0d\u662f\u4e0d\u4eae\uff0c\u662f\u73af\u5883\u5149\u592a\u5f3a\u3002',
  '\u73af\u5883\u4e0d\u662f\u6ca1\u6709\u706f\uff0c\u662f\u5ba4\u5185\u9762\u79ef\u592a\u5c0f\u3002',
  '\u591c\u665a\u4e0d\u662f\u4e0d\u70ed\uff0c\u662f\u767d\u5929\u5de5\u4f5c\u592a\u8d39\u793c\u3002',
  '\u7a97\u6237\u4e0d\u662f\u4e0d\u5e0c\u671b\uff0c\u662f\u5ba4\u5185\u9762\u79ef\u6709\u9650\u3002',
];

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; console.log('  \u2713 ' + name); }
  else { fail++; console.log('  \u2717 ' + name); }
}

// 写盘 + 清缓存，返回探测结果（异常按不命中处理）
function probe(mutated, samples) {
  fs.writeFileSync(SRC, mutated, 'utf8');
  bustCache();
  try {
    return samples.map(s => {
      try { return ppf(s); } catch (e) { return false; }
    });
  } finally {
    fs.writeFileSync(SRC, SRC_ORIGINAL, 'utf8');
    bustCache();
  }
}

// ① 注入：5 条探针当前都应命中
console.log('\u2500\u2500 \u2460 \u6ce8\u5165\uff1a\u8865\u8bcd\u540e\u63a2\u9488\u5e94\u547d\u4e2d \u2500\u2500');
for (const s of PROBES) ok(ppf(s), '\u547d\u4e2d\uff1a' + s.slice(0, 16));

// ② 删条：把 5 个新词从正则中移除 → 探针应变红
console.log('\u2500\u2500 \u2461 \u5220\u6761\uff1a\u79fb\u9664\u65b0\u8bcd\u540e\u5e94\u53d8\u7ea2 \u2500\u2500');
const CUT_FULL = '\\u7ad9\\u8d77\\u6765|\\u9009\\u62e9|\\u5149|\\u5fae\\u5149|\\u4eae|\\u706f|\\u5e0c\\u671b)';
const CUT_BACK = '\\u7ad9\\u8d77\\u6765|\\u9009\\u62e9)';
if (!SRC_ORIGINAL.includes(CUT_FULL)) {
  fail++; console.log('  \u2717 \u5220\u6761\u951a\u70b9\u672a\u627e\u5230\uff1a' + CUT_FULL);
} else {
  const hits = probe(SRC_ORIGINAL.replace(CUT_FULL, CUT_BACK), PROBES);
  hits.forEach((h, i) => ok(!h, '\u5220\u6761\u540e\u4e0d\u518d\u547d\u4e2d\uff1a' + PROBES[i].slice(0, 16)));
  // 良性在删条后也不应误伤
  const benignHits = probe(SRC_ORIGINAL.replace(CUT_FULL, CUT_BACK), BENIGN);
  benignHits.forEach((h, i) => ok(!h, '\u5220\u6761\u540e\u826f\u6027\u4ecd\u4e0d\u8bef\u4f24\uff1a' + BENIGN[i].slice(0, 16)));
  // ③ 还原：应恢复命中
  console.log('\u2500\u2500 \u2462 \u8fd8\u539f\uff1a\u6062\u590d\u6e90\u7801\u540e\u5e94\u91cd\u65b0\u547d\u4e2d \u2500\u2500');
  for (const s of PROBES) ok(ppf(s), '\u8fd8\u539f\u540e\u91cd\u65b0\u547d\u4e2d\uff1a' + s.slice(0, 16));
}

// ④ 兜底：删掉整条 B 侧名词组（从 (?:\u89c9\u609f 到行尾 /）→ 0/5 命中
console.log('\u2500\u2500 \u2463 \u515c\u5e95\uff1a\u5220\u6389\u6574\u7ec4\u540d\u8bcd\u540e\u63a2\u9488\u5e94\u5931\u5b88 \u2500\u2500');
const GROUP_START = '(?:\\u89c9\\u609f';
const iStart = SRC_ORIGINAL.indexOf(GROUP_START);
const iEnd = SRC_ORIGINAL.indexOf(')/', iStart);
if (iStart === -1 || iEnd === -1) {
  fail++; console.log('  \u2717 \u515c\u5e95\u5220\u6761\u951a\u70b9\u672a\u627e\u5230');
} else {
  const mutated = SRC_ORIGINAL.slice(0, iStart) + '(?:\\u4e0d\\u5b58\\u5728\\u7684\\u8bcd)' + SRC_ORIGINAL.slice(iEnd + 1);
  const hits = probe(mutated, PROBES);
  ok(hits.every(h => !h), '\u515c\u5e95\u5220\u6761\u540e 0/' + PROBES.length + ' \u547d\u4e2d\uff08\u65e0\u522b\u7684\u4ea7\u51fa\u8def\u5f84\uff09');
}

// 源码完整性
const final = fs.readFileSync(SRC, 'utf8');
ok(final === SRC_ORIGINAL, '\u6e90\u7801\u5df2\u5b8c\u6574\u8fd8\u539f');

console.log('\n' + pass + ' \u901a\u8fc7, ' + fail + ' \u5931\u8d25');
assert.strictEqual(fail, 0, 'negative-test-ppf-light-nouns-r302: ' + fail + ' \u4e2a\u65ad\u8a00\u5931\u8d25');
