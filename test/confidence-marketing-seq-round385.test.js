/**
 * confidence-marketing-seq-round385.test.js — r385
 *
 * 守卫 marketingOverclaimZH 的「第X+序列量词」形状排除。
 *
 * 背景：v6.7.11 的营销过度声称判据
 *   /(?:唯一|第一|首个|顶级|天花板|...)[^。，]{0,12}(?:技术|方案|产品|模型|系统|平台|方法|算法|框架)/
 * 与中文序列量词共享「第一」字面——「第一阶段先验证方案，第二阶段再
 * 扩大投入」被 12 字窗口从序列词一路吃到后句的「方案」，误命中
 * marketing overclaim → gate verify（probe-6 实测 19 个序列量词全误抓）。
 *
 * 排除口径：营销词 + 紧邻的序列量词形状整体中性化再匹配；
 * 「第一品牌」要保留（品牌/排名声称），只是「第一阶段」要排除。
 */
'use strict';

const { checkConfidenceCalibration } = require('../src/index.js');
const { gate: runGate } = require('../src/gate.js');

// ── 样本隔离：负例会临时改 src/ 再还原，全部走独立文件 scripts/ ──

// 19 个序列量词 × 阶段递进句式（真阶段流程表述，零营销意图）
const SEQ_NOUNS = [
  '阶段', '时期', '时段', '季度', '月份', '年', '年度', '期', '步', '步骤',
  '轮', '轮次', '版', '版本', '次', '批次', '批', '章', '章节', '节',
  '部分', '环节', '层', '遍', '回', '周', '本', '书', '册',
];
const SEQ_SAMPLES = SEQ_NOUNS.map(n => `第一${n}先验证方案，第二${n}再扩大投入`);

// 真营销声称（排除不得伤到这些）
const MARKETING = [
  '这是行业领先的方案',
  '我们的系统是全球顶尖的平台',
  '唯一的技术路线就在这里',
  '这是划时代的产品',
  '里程碑式的框架',
  '这是世界级的模型',
  '第一品牌的解决方案',
  '首个自研模型系统',
];

// 混合句：营销词 + 序列量词同现（同句营销声称仍应命中）
const MIXED = [
  '第一阶段采用行业领先方案',
  '第一阶段用全球顶尖平台',
  '首个方案在第一阶段上线',
  '第一品牌解决方案行业领先',
  '第二步上线首个自研模型系统',
];

// 序列量词误抓的另一种形态：营销词 + 窗口直接吃到营销对象词
// （「第一步...自研模型系统」——「第一」离后句的「模型系统」在 12 字内，
//  修复前同样被误抓，修复后正确地不再命中）
const SEQ_OBJ = [
  '第一步迈出自研模型系统',
];

module.exports = function ({ test, assertTrue, assertFalse }) {
  test('r385-A: 第X+序列量词阶段流程句不命中 marketing overclaim', () => {
    for (const s of SEQ_SAMPLES) {
      const r = checkConfidenceCalibration(s);
      assertFalse(
        r.issues.some(i => i.detail && i.detail.includes('marketing overclaim')),
        `阶段流程句不应命中营销声称: ${s}`,
      );
    }
  });

  test('r385-B: 真营销过度声称仍命中（排除未放松拦截）', () => {
    for (const s of MARKETING) {
      const r = checkConfidenceCalibration(s);
      assertTrue(
        r.issues.some(i => i.detail && i.detail.includes('marketing overclaim')),
        `营销声称仍应命中: ${s}`,
      );
    }
  });

  test('r385-C: 营销词与序列量词同句时营销声称仍命中', () => {
    for (const s of MIXED) {
      const r = checkConfidenceCalibration(s);
      assertTrue(
        r.issues.some(i => i.detail && i.detail.includes('marketing overclaim')),
        `混合句中的营销声称仍应命中: ${s}`,
      );
    }
  });

  test('r385-D: 被误抓的代表性阶段句 gate 从 verify 回到 pass', () => {
    const r = runGate('第一阶段先验证方案，第二阶段再扩大投入');
    assertFalse(r.gate.action === 'verify', `阶段流程句不应被判 verify，实际=${r.gate.action}`);
  });

  test('r385-F: 序列量词 + 远端营销对象词形态同样不误抓', () => {
    for (const s of SEQ_OBJ) {
      const r = checkConfidenceCalibration(s);
      assertFalse(
        r.issues.some(i => i.detail && i.detail.includes('marketing overclaim')),
        `序列量词后接营销对象词不应命中营销声称: ${s}`,
      );
    }
  });

  test('r385-E: superlative generic 判据不退化（锚点对照）', () => {
    // 「最好的方案」走另一条 superlative generic 判据，不依赖 marketing 分支
    const r1 = checkConfidenceCalibration('这是最好的方案');
    assertTrue(r1.issues.some(i => i.detail && i.detail.includes('superlative')), 'superlative 应仍命中');
    // 「最大的风险是延期」是过程量陈述，应保持不命中
    const r2 = checkConfidenceCalibration('最大的风险是延期');
    assertFalse(
      (r2.issues || []).some(i => i.detail && i.detail.includes('marketing overclaim')),
      '过程量陈述不应命中营销声称',
    );
  });
};
