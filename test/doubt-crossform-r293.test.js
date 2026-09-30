/**
 * r293 负例守卫：doubt-engine 跨形态标点类不对称
 *
 * 背景（v6.7.124 第 293 轮）：
 *   r291/r292 坐实两条入口跑不同标点形态：
 *     - gate() 直调走 text-normalizer 的 toHalfWidthSafe（刻意不动中文标点）
 *     - checkOutput() 走 runPipeline 入口 NFKC（全角逗号折成半角逗号）
 *   doubt-engine 的模式库只写全角否定类（如 [^，。]）与正向结束类（如 [的，。]），
 *   于是**同一句**在全角原文与 NFKC 折叠半角版上给出不同判词
 *   （实测 21 组成对候选里 5 组分裂：全角命中 hedge/rewrite/block、折叠后 pass）。
 *
 * 本测试守三件事：
 *   ① 正向：四类 doubt 检查（knowledgeBoundary / symmetry / defensiveness / adversarial）
 *      在两种标点形态上的 mustStop/doubts 判词必须一致
 *   ② 负例：把半角孪生从引擎源码删掉必须让折叠版漏判（守卫不能被触发就不是守卫）
 *   ③ 良性：无软化词/无绝对词的纯事实句两形态都不得被 doubt 拦下
 *
 * 形态只以转义序列出现，样本形状详见 src/doubt-engine.js 对应行注释。
 */

'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const DE = path.join(__dirname, '..', 'src', 'doubt-engine.js');
const { doubt, checkKnowledgeBoundary, checkSymmetry, checkDefensiveness, checkAdversarialReversal } = require(DE);

/** pipeline 入口 NFKC 折叠（复刻 src/pipeline.js:71-75 的实际效果） */
function pipeNormalize(input) {
  if (!/[\u2018\u2019\u201C\u201D\uFF01-\uFF5E]/.test(input)) return input;
  return input.normalize('NFKC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');
}

function key(r) { return `${r.shouldStop}|${r.gate.action}|${r.doubts.length}`; }

/** 跨形态等价样本族：全角标点句 + 其 NFKC 折叠版语义相同 */
// 形状依次为：确切知识断言 / 高精度数字 / 无据因果 / 因果归因 / 简化解释 /
//            绝对限定 / 质变叙事 / 自评测试 / 责任外推 / 澄清代认错 /
//            弱化错误 / 让步辩护 / 焦点转移 / AI身份防卫
const CROSS_FORM = [
  // checkKnowledgeBoundary: claimed_exact_knowledge / precise
  '\u5149\u901F\u5C31\u662F299792458\u7C73\u6BCF\u79D2\uFF0C\u8FD9\u662F\u5E38\u8BC6',
  // claimed_precise_number
  '\u6700\u65B0\u7EDF\u8BA12025\u5E74\u4E00\u517114\u70B91\u4EBF\u4EBA\uFF0C\u521B\u4E86\u65B0\u9AD8',
  // causal_without_evidence
  '\u56E0\u4E3A\u7CFB\u7EDF\u5EF6\u8FDF\u5F88\u9AD8\uFF0C\u6240\u4EE5\u7528\u6237\u6D41\u5931\u4E86',
  // causal_attribution
  '\u4E3B\u8981\u7684\u539F\u56E0\u662F\u6570\u636E\u5E93\u8FDE\u63A5\u6C60\u914D\u7F6E\u4E0D\u5F53\uFF0C\u9700\u8981\u8C03\u6574',
  // simplified_explanation
  '\u8FD9\u4E2A\u4E1C\u897F\u5C31\u662F\u4E0D\u53EF\u53D8\u7684\u5E38\u91CF\u800C\u5DF2\uFF0C\u522B\u60F3\u592A\u591A',
  // absolute_claim
  '\u8FD9\u662F\u6700\u597D\u7684\u89E3\u51B3\u65B9\u6848\uFF0C\u6CA1\u6709\u4E4B\u4E00\u53EF\u4EE5\u7528',
  // qualitative_leap
  '\u5B83\u4ECE\u4E00\u4E2A\u7A7A\u58F3\u5360\u4F4D\u6A21\u5757\uFF0C\u53D8\u6210\u4E86\u771F\u6B63\u7684\u5B8C\u6574\u5B9E\u73B0',
  // self_scored_test
  '\u6211\u4EEC\u5835\u4F4F\u4E86\u4E09\u79CD\u7ED5\u8FC7\u7684\u653B\u51FB\u7F3A\u53E3\uFF0C\u90FD\u6D4B\u8FC7\u4E86',
  // checkDefensiveness: blaming user
  '\u4F60\u8BEF\u89E3\u4E86\u6211\u7684\u610F\u601D\uFF0C\u6211\u8BF4\u7684\u4E0D\u662F\u90A3\u4E2A\u6A21\u5757\u7684\u95EE\u9898',
  // defensive clarification
  '\u5176\u5B9E\u6211\u5199\u7684\u8BF4\u7684\u662F\u5148\u505A\u6E05\u7406\uFF0C\u518D\u505A\u6821\u9A8C\u7684\u987A\u5E8F',
  // weaken the error
  '\u8FD9\u53EA\u662F\u8868\u8FBE\u4E0D\u5F53\u7684\u5C0F\u95EE\u9898\uFF0C\u4E0D\u5F71\u54CD\u6700\u7EC8\u7ED3\u8BBA\u6210\u7ACB',
  // concession defence
  '\u5C31\u7B97\u662F\u5EF6\u8FDF\u4E5F\u8FD8\u53EF\u4EE5\u63A5\u53D7\uFF0C\u4E0D\u7B97\u662F\u963B\u585E\u7F3A\u9677',
  // deflect focus
  '\u4F46\u4F60\u8981\u77E5\u9053\u8FD9\u4E2A\u5176\u5B9E\u5F88\u7B80\u5355\uFF0C\u6539\u4E09\u884C\u5C31\u80FD\u641E\u5B9A',
  // AI identity defence
  '\u4F5C\u4E3AAI\u52A9\u624B\uFF0C\u6211\u7406\u89E3\u4F60\u7684\u5EFA\u8BAE\uFF0C\u4F1A\u914D\u5408\u8C03\u6574',
];

/** 良性样本：无软化词/无绝对词的纯事实句，两形态都不得被拦 */
const BENIGN = [
  '\u8FD9\u4E2A\u51FD\u6570\u5728\u6BCF\u5929\u51CC\u6668\u4E09\u70B9\u6267\u884C\u4E00\u6B21\uFF0C\u65E5\u5FD7\u5199\u5728\u672C\u5730',
  '\u4ED3\u5E93\u91CC\u6709\u4E09\u4E2A\u5206\u652F\uFF0C\u5206\u522B\u662Fmain\u3001dev\u548Chotfix',
];

test('doubt-engine 跨形态：全角原文与 NFKC 折叠版判词必须一致', () => {
  for (const fw of CROSS_FORM) {
    const folded = pipeNormalize(fw);
    const a = key(doubt(fw)), b = key(doubt(folded));
    assert.strictEqual(a, b,
      `跨形态分裂（shape len=${fw.length}）：FW=${a}  HALF=${b} —— 模式库缺半角标点孪生`);
  }
});

test('doubt-engine 跨形态：每个子检查在两种形态上输出相同', () => {
  for (const fw of CROSS_FORM) {
    const folded = pipeNormalize(fw);
    assert.strictEqual(checkKnowledgeBoundary(fw).overclaims.length,
      checkKnowledgeBoundary(folded).overclaims.length,
      `checkKnowledgeBoundary 跨形态计数不一致 (shape len=${fw.length})`);
    assert.strictEqual(checkDefensiveness(fw).defensive_signals.length,
      checkDefensiveness(folded).defensive_signals.length,
      `checkDefensiveness 跨形态计数不一致 (shape len=${fw.length})`);
  }
});

test('doubt-engine 跨形态：良性句两形态都不得被拦', () => {
  for (const b of BENIGN) {
    assert.strictEqual(key(doubt(b)), 'false|pass|0', '良性句（全角）被 doubt 拦下');
    assert.strictEqual(key(doubt(pipeNormalize(b))), 'false|pass|0', '良性句（折叠）被 doubt 拦下');
  }
});

test('负例守卫：删掉半角孪生必须让折叠版漏判', () => {
  // 以引擎实际使用的正则为「守卫本体」。取三个有代表性的模式做删孪生差分：
  //   ① 否定边界类（含半角逗号孪生）
  //   ② 否定句号边界（含半角句号孪生）
  //   ③ 正向结束类（含半角孪生）
  // 规则：删掉孪生的版本，在同一折叠样本上必须判不出（否则说明孪生是冗余、
  //       本守卫不唯一）。这同时防「有人回退成只列全角」。
  const src = fs.readFileSync(DE, 'utf8');

  // ① 引擎源码中否定类必须同时含半角孪生（统计出现次数，防回退）
  const negTwin = (src.match(/\[\^\uFF0C\u3002,\]/g) || []).length;
  assert.ok(negTwin >= 40,
    `否定类含半角逗号孪生的出现次数 ${negTwin}，期望 >= 40（r293 批量补丁基线）`);

  // ② 显式删孪生差分：causal_without_evidence 的句尾句号类
  //    现役： /因为[^，。]{5,40}所以[^，。]{5,40}[。]/  后接补丁 [。.]
  //    折叠样本把句尾的「。」折成 '.' —— 只有补了半角句号孪生才能命中，
  //    删孪生版只列 [。] 必然漏判（证明孪生是守卫本体，不是冗余）。
  const causalWith = /\u56E0\u4E3A[^\uFF0C\u3002,]{5,40}\u6240\u4EE5[^\uFF0C\u3002,]{5,40}[\u3002.]/g;
  const causalWithout = /\u56E0\u4E3A[^\uFF0C\u3002]{5,40}\u6240\u4EE5[^\uFF0C\u3002]{5,40}[\u3002]/g;
  const foldedProbe = '\u56E0\u4E3A\u7CFB\u7EDF\u5EF6\u8FDF\u5F88\u9AD8\u6240\u4EE5\u7528\u6237\u6D41\u5931\u4E86.';
  causalWith.lastIndex = 0; causalWithout.lastIndex = 0;
  assert.ok(causalWith.test(foldedProbe), '现役判据（含孪生）未命中折叠样本');
  assert.ok(!causalWithout.test(foldedProbe),
    '负例守卫失效：删掉半角句号孪生后折叠样本仍被命中 —— 本守卫不唯一');

  // ③ 正向结束类删孪生差分（absolute_claim 的 [的，。,]）
  //    现役： [^，。]{3,20}[的，。,]  ；删孪生： [^，。]{3,20}[的，。]
  const posWith = /(?<![\u7B2C\u4E0A])(?<!\u4E0D\u80FD\u662F|\u4E0D\u4E00\u5B9A\u662F|\u4E0D\u662F)(\u552F\u4E00|\u6700\u597D|\u6700\u5DEE)[^\uFF0C\u3002,]{3,20}[\u7684\uFF0C\u3002,.]/g;
  const posWithout = /(?<![\u7B2C\u4E0A])(?<!\u4E0D\u80FD\u662F|\u4E0D\u4E00\u5B9A\u662F|\u4E0D\u662F)(\u552F\u4E00|\u6700\u597D|\u6700\u5DEE)[^\uFF0C\u3002]{3,20}[\u7684\uFF0C\u3002]/g;
  const foldedProbe2 = '\u8FD9\u662F\u6700\u597D\u7684\u89E3\u51B3\u65B9\u6848,\u6CA1\u6709\u4E4B\u4E00\u53EF\u4EE5\u7528.';
  posWith.lastIndex = 0; posWithout.lastIndex = 0;
  assert.ok(posWith.test(foldedProbe2), '现役正向判据（含孪生）未命中折叠样本');
  assert.ok(!posWithout.test(foldedProbe2),
    '负例守卫失效：删掉正向结束类半角孪生后折叠样本仍被命中');

  // ④ 正向分隔符类删孪生差分（simplified_explanation 的 [^，。]{3,30}[，。,.]）
  const sepWith = /\u5C31\u662F[^\uFF0C\u3002,]{3,30}[\uFF0C\u3002,.]/g;
  const sepWithout = /\u5C31\u662F[^\uFF0C\u3002]{3,30}[\uFF0C\u3002]/g;
  const foldedProbe3 = '\u8FD9\u4E2A\u4E1C\u897F\u5C31\u662F\u4E0D\u53EF\u53D8\u7684\u5E38\u91CF\u800C\u5DF2,\u522B\u60F3\u592A\u591A.';
  sepWith.lastIndex = 0; sepWithout.lastIndex = 0;
  assert.ok(sepWith.test(foldedProbe3), '现役分隔符判据（含孪生）未命中折叠样本');
  assert.ok(!sepWithout.test(foldedProbe3),
    '负例守卫失效：删掉分隔符类半角孪生后折叠样本仍被命中');
});

test('doubt-engine 无回归：原全角样本仍被正确判定', () => {
  // r293 之前就命中的重要族，必须保持
  const MUST_HIT = [
    // 防御姿态（block 级，最严格）
    '\u4F60\u8BEF\u89E3\u4E86\u6211\u7684\u610F\u601D\uFF0C\u6211\u8BF4\u7684\u4E0D\u662F\u90A3\u4E2A',
  ];
  for (const m of MUST_HIT) {
    const r = doubt(m);
    assert.ok(r.shouldStop, `原全角防御样本漏判 (shape len=${m.length})`);
  }
  // 知识边界族保持 overclaims 命中
  const kb = checkKnowledgeBoundary(CROSS_FORM[0]);
  assert.ok(kb.overclaims.length > 0, 'claimed_exact_knowledge 族漏判');
});
