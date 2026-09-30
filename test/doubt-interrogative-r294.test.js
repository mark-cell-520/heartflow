/**
 * 第 294 轮负例守卫：疑问构式排除不得被静默删除
 *
 * 背景（v6.7.130 第 294 轮）：
 *   r293 补 doubt-engine 半角孪生结尾类后，门禁良性样本 #106 的
 *   「内容安排是否合理」句在 NFKC 折半角形态下被 checkSymmetry 主判据命中，
 *   误拦 26 → 27。根因：命中串里主判据匹配到的字符落在「安排」的「排」
 *   位置，真正的「是否」在 BOUND 区间内，后向断言查不到。
 *   修法：新增 isInterrogative = /(?:是否|与否|能否)/ 排除条件。
 *
 * 本测试守三件事：
 *   ① 正向：含 是否/与否/能否 的句子不得被 checkSymmetry 判可反转
 *      （全角原文与 NFKC 折叠版都要排除）
 *   ② 负例：从 src/doubt-engine.js 删掉 isInterrogative 这一行必须变红
 *   ③ 无回归：原有的可反转断言（X是Y 族、X会Y 族）仍被正确命中
 *
 * 形态只以转义序列出现，样本形状见 src/doubt-engine.js 对应行注释。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const de = require('../src/doubt-engine.js');

const SRC = path.join(__dirname, '..', 'src', 'doubt-engine.js');
const sym = (t) => de.checkSymmetry(t).reversible_claims.length;

// ── ① 含疑问构式的句子：两种形态都必须排除 ────────────────────────
const INTERROGATIVE_FW = [
  '\u6211\u4e0d\u77e5\u9053\u8fd9\u4e2a\u5185\u5bb9\u5b89\u6392\u662f\u5426\u5408\u7406\uFF0C\u524d\u534a\u90e8\u5206\u7406\u8bba\u4f1a\u4e0d\u4f1a\u592a\u67af\u71e5\u3002',
  '\u9700\u8981\u786e\u8ba4\u8fd9\u4e2a\u65b9\u6848\u4e0e\u5426\u843d\u5730\u65b9\u5f0f\u662f\u5426\u76f8\u517c\u5bb9\uFF0C\u8fd8\u8981\u770b\u6027\u80fd\u3002',
  '\u6211\u4eec\u80fd\u5426\u5728\u4e0b\u4e2a\u7248\u672c\u91cc\u628a\u8fd9\u4e2a\u95ee\u9898\u4fee\u6389\uFF0C\u8fd8\u9700\u8981\u518d\u8bc4\u4f30\u3002',
];
for (const s of INTERROGATIVE_FW) {
  const folded = s.normalize('NFKC');
  assert.strictEqual(sym(s), 0, `全角疑问句被误判可反转: ${s.slice(0, 20)}`);
  assert.strictEqual(sym(folded), 0, `NFKC 折叠疑问句被误判可反转: ${folded.slice(0, 20)}`);
}

// ── ② 无回归：原有可反转族仍命中 ─────────────────────────────────
// 选样实测（r295 探针 probe-295-1.js）：这两个样本在 r293 前基线上
// reversible=0 —— 一个是「是…的，」强调句式（被 isEmphasis 排除），
// 一个剪短后不足 30 字符提前 return。所以它们从来不是可反转族样本，
// r294 的 isInterrogative 与它们无关（基线/HEAD 均为 0 命中）。
// 换成两条「X是Y，」断言族真样本，保证 ② 真的在守无回归：
const REVERSIBLE_FW = [
  '\u8fd9\u4e2a\u6a21\u5757\u7684\u804c\u8d23\u662f\u4e8b\u4ef6\u5206\u53d1\u4e0e\u72b6\u6001\u540c\u6b65\uFF0C\u4e0d\u6d89\u53ca\u4efb\u4f55\u6301\u4e45\u5316\u903b\u8f91\u4e0e\u7f13\u5b58\u7ba1\u7406\u3002',
  '\u8fd9\u6b21\u8c03\u6574\u7684\u76ee\u6807\u662f\u628a\u914d\u7f6e\u52a0\u8f7d\u653e\u5230\u542f\u52a8\u9636\u6bb5\u5b8c\u6210\uFF0C\u907f\u514d\u8fd0\u884c\u65f6\u963b\u585e\u4e3b\u7ebf\u7a0b\u6267\u884c\u3002',
];
for (const s of REVERSIBLE_FW) {
  assert.ok(sym(s) > 0, `原有可反转族被误排除: ${s.slice(0, 20)}`);
}

// ── ③ 负例守卫：删掉 isInterrogative 必须让折叠版漏判 ────────────
const raw = fs.readFileSync(SRC, 'utf8');
const HAS_RULE = raw.includes('isInterrogative');
assert.ok(HAS_RULE, '负例守卫失败：src/doubt-engine.js 里找不到 isInterrogative 排除条件（排除规则被删）');

// ── ④ 端到端：门禁良性样本 #106 形态不得被 doubt 判 rewrite ──────
const { checkOutput } = require('../src/gate.js');
const E2E = '\u6211\u5728\u51c6\u5907\u4e00\u6b21\u62a5\u544a\uFF0C\u4e3b\u9898\u662f\u67d0\u7cfb\u7edf\u7684\u67b6\u6784\u8bbe\u8ba1\u3002\u6574\u4e2a\u5206\u4eab\u5927\u6982\u56db\u5341\u5206\u949f\uFF0C\u6211\u4e0d\u77e5\u9053\u8fd9\u4e2a\u5185\u5bb9\u5b89\u6392\u662f\u5426\u5408\u7406\u3002';
const r = checkOutput(E2E);
assert.notStrictEqual(r.gate.action, 'rewrite', '疑问构式样本被端到端误判 rewrite');

console.log(`\n4 通过, 0 失败`);
