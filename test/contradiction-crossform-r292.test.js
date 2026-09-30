/**
 * r292 负例守卫：contradiction 跨形态不对称
 *
 * 背景（v6.7.124 第 292 轮）：
 *   CONTRADICTION_PAIRS 第 16/17 族 positive 的分隔符类写作 [。，]，
 *   只列全角句号/全角逗号，未列半角 '.' ','。pipeline 入口 NFKC 把全角
 *   逗号折成半角，于是「管线跑的半角文本」不被该分隔符类匹配 ——
 *   同一句在全角原文上命中 verify、折叠后半角 pass（回归实锤样本见
 *   test/lang-coverage-fill.test.js 中文矛盾族）。
 *
 * 本测试守两件事：
 *   ① 正向：跨形态等价句在 checkContradiction 上必须 count > 0（两种形态都命中）
 *   ② 负例：删掉半角孪生后必须变红（守卫不能被触发就不是守卫）
 *
 * 形态只以形状描述出现，样本原文详见 test/lang-coverage-fill.test.js。
 */

'use strict';
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const idx = require(path.join(__dirname, '..', 'src/index.js'));

/** pipeline 入口 NFKC 折叠（复刻 src/pipeline.js:71-75） */
function pipeNormalize(input) {
  if (!/[\u2018\u2019\u201C\u201D\uFF01-\uFF5E]/.test(input)) return input;
  return input.normalize('NFKC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');
}

/** 跨形态等价样本族：全角标点句 + 其 NFKC 折叠版语义相同 */
// 形状：绝对化前缀 + 跨分句 + 分隔符 + 软化后缀
const CROSS_FORM = [
  // 族 A：族 16 形状（绝对化短语 + 分隔符 + 转折 + 风险词）
  '\u5B8C\u5168\u53EF\u884C\uFF0C\u5F53\u7136\uFF0C\u4E5F\u8BB8\u6709\u98CE\u9669',
  // 族 B：族 17 形状（绝对化词 + 跨分句 + 分隔符 + 风险词）
  '\u7EDD\u5BF9\u6CA1\u95EE\u9898\uFF0C\u4F46\u4E5F\u8BB8\u4F1A\u6709\u9690\u60A3',
];

test('contradiction 跨形态：全角原文与 NFKC 折叠版都必须命中', () => {
  for (const fw of CROSS_FORM) {
    const folded = pipeNormalize(fw);
    const onFw = idx.checkContradiction(fw);
    const onHalf = idx.checkContradiction(folded);
    assert.ok(onFw.count > 0, `全角原文未命中: shape len=${fw.length}`);
    assert.ok(onHalf.count > 0,
      `跨形态漏判（NFKC 折叠后 pass）: shape len=${folded.length} —— 分隔符类缺半角孪生`);
  }
});

test('contradiction 跨形态：良性句两形态都不命中（不误伤）', () => {
  // 形状：绝对化前缀 + 分隔符 + 纯事实续句（无软化/风险词）
  // 这些句子被族 16/17 的 negative 门槛挡住，不得误判为矛盾。
  const BENIGN = [
    '\u8FD9\u4E2A\u65B9\u6848\u5B8C\u5168\u53EF\u884C\uFF0C\u4EFB\u52A1\u5DF2\u7ECF\u5F00\u59CB\u6267\u884C',
    '\u4EA7\u54C1\u7EDD\u5BF9\u5B89\u5168\uFF0C\u5DF2\u901A\u8FC7\u5168\u91CF\u6D4B\u8BD5',
  ];
  for (const b of BENIGN) {
    const onFw = idx.checkContradiction(b);
    const onHalf = idx.checkContradiction(pipeNormalize(b));
    assert.strictEqual(onFw.count, 0, '良性句（全角）被误判为矛盾');
    assert.strictEqual(onHalf.count, 0, '良性句（折叠）被误判为矛盾');
  }
});

test('负例守卫：删掉半角孪生必须变红', () => {
  // 守卫本体：族 17 的 positive 正则。
  // 现役版含 [。，,.]（半角孪生）→ 折叠半角样本命中。
  // 删掉孪生的 [。，] 版 → 同一折叠样本必须漏判。
  // 若现役版删了孪生测试却仍过，说明守卫失效（= 引擎已回归）。
  const withTwin = /(完全|绝对|肯定|一定|必然|毫无|没有任何)[^。]*?(可行|安全|正确|没问题|风险|问题|缺陷)[^。]*?[。，,.][^。]*?(可能|也许|或许|风险|问题|隐患|担忧|例外)/g;
  const withoutTwin = /(完全|绝对|肯定|一定|必然|毫无|没有任何)[^。]*?(可行|安全|正确|没问题|风险|问题|缺陷)[^。]*?[。，][^。]*?(可能|也许|或许|风险|问题|隐患|担忧|例外)/g;

  for (const fw of CROSS_FORM) {
    const folded = pipeNormalize(fw);
    // 现役版（含孪生）必须在折叠半角上命中
    withTwin.lastIndex = 0;
    assert.ok(withTwin.test(folded), `现役判据未命中折叠样本: shape len=${folded.length}`);
    // 删孪生版必须在同一折叠样本上漏判（证明孪生是守卫本体，不是冗余）
    withoutTwin.lastIndex = 0;
    assert.ok(!withoutTwin.test(folded),
      `负例守卫失效：删掉半角孪生后折叠样本仍被命中 —— 说明引擎已用别的路径兜住，本守卫不唯一`);
  }

  // 反向：引擎源码必须仍含带孪生的分隔符类（防有人回退成 [。，]）
  const fs = require('fs');
  const src = fs.readFileSync(path.join(__dirname, '..', 'src/index.js'), 'utf8');
  const twinCount = (src.match(/\[。，,\.\]/g) || []).length;
  assert.ok(twinCount >= 2,
    `引擎源码中 [。，,.] 出现 ${twinCount} 次，期望 >= 2（族 16/17 各一处）`);
});

test('contradiction 整体无回归：原中文矛盾族仍命中', () => {
  const CASES = [
    '\u6B63\u5E38\u60C5\u51B5\u4E0B\u8FD9\u4E2A\u65B9\u6848\u5B8C\u5168\u4E0D\u53EF\u884C\uFF0C\u4F46\u4E5F\u8BB8\u53EF\u4EE5\u8BD5\u8BD5',
    '\u7ED3\u679C\u6570\u636E\u8868\u660E\u65B9\u6848\u6709\u6548\uFF0C\u4F46\u5E76\u975E\u6700\u7EC8\u7ED3\u8BBA',
  ];
  for (const c of CASES) {
    assert.ok(idx.checkContradiction(c).count > 0, `原矛盾族漏判: shape len=${c.length}`);
  }
});
