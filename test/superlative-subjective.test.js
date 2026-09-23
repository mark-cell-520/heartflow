/** test/superlative-subjective.test.js — 「最+主观形容词」盲区回归
 * 背景：v6.7.73 的词表枚举只覆盖 21 个肯定形容词，「最善良」「最强」
 * 因为词表里没有「善良」「强」而漏检，而「最好」在词表里会触发——
 * 主观性越强的论断反而越容易放行（语义极性反转）。
 * v6.7.81 改为「极性情态 + 泛化最高级」两段式，并把副词序列中性化。
 */
'use strict';
const assert = require('assert');
const idx = require('../src/index.js');

const cc = idx.checkConfidenceCalibration;

// 旧版漏检：词表没有的形容词
const MISSED = [
  '他是我见过最善良的人。',
  '最强模型在业界得到公认。',
  '这是2026年最安静、也最有分量的一篇论文。',
  '最优秀的方案才是出路。',
  '史上最伟大的一次合作。',
];
// 不该触发：常规建议句式 / 时间与序列副词
const BENIGN = [
  'Docker image 的大小最好是 100MB 以下。',
  '最近我们做了优化。',
  '最终方案分为三个阶段。',
  '最低成本配置即可。',
  '请选择最高优先级的任务。',
  '这是第二阶段最初的设计。',
];

module.exports = function ({ test }) {
  for (const t of MISSED) {
    test(`触发: ${t.slice(0, 16)}`, () => {
      const r = cc(t);
      assert.ok(r.count > 0, `应检出最+主观形容词: ${t}`);
    });
  }
  for (const t of BENIGN) {
    test(`不误报: ${t.slice(0, 16)}`, () => {
      const r = cc(t);
      assert.strictEqual(r.count, 0, `不应触发: ${t} → ${JSON.stringify(r.issues)}`);
    });
  }
};
