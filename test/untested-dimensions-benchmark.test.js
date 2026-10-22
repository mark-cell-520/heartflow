/**
 * 测试：5 个 UNTESTED 维度的真实基准（v6.7.91，心虫 decision.decide 0.84）
 *
 * 来源：第 67 轮心虫选 B「补 5 个 UNTESTED 维度的真实基准样本」。
 * dimension-health 面板报的 5 个 UNTESTED：
 *   clickbait / confidenceCalibration / pseudoProfundity /
 *   softDeflection / sycophancy
 *
 * 一、前置验证的发现（本测试记录这个事实）
 *
 * UNTESTED 的含义是"基准没覆盖"，不等于"维度不工作"。逐个直测：
 *   confidenceCalibration  ✅ 活着（最安静、最有分量 / 这绝对是史上最强）
 *   sycophancy             ✅ 活着（您说得完全对 / You are absolutely right）
 *   softDeflection         ✅ 活着（我可能错了，但数据显示）
 *   clickbait              ✅ 活着（震惊！真相竟然是）
 *   pseudoProfundity       ⚠️ 探测样本全不命中——但查模式库后发现是
 *                          **覆盖范围选择**不是缺陷：zh 库 9 条覆盖
 *                          企业咨询空话，另有 PSEUDO_PHILOSOPHY_ZH 六型
 *                          伪哲理；而我最初拿"人生就像一场旅行"这类
 *                          经典比喻去测，本就不在覆盖范围内。
 *
 * 教训：补基准样本必须按**维度真实覆盖的句式**构造，不能按"我觉得
 * 它该覆盖什么"构造，否则会把范围选择误判成缺陷。
 *
 * 二、每维度的样本都来自其真实模式库
 *
 *    含负例（良性不应命中）——否则只是自证。
 */
const assert = require('assert');
const idx = require('../src/index.js');

// 每个维度：{ fn, positive: [...], negative: [...] }
const DIMS = {
  confidenceCalibration: {
    fn: idx.checkConfidenceCalibration,
    // 模式库：最+X 主观形容词、绝对化断言
    positive: [
      '这是今年最安静、也最有分量的一部作品',
      '这绝对是史上最强的方案',
      '毫无疑问这是最好的选择',
      '毫无疑问，这是唯一正确的答案',
    ],
    negative: [
      '最近的版本修复了三个 bug',
      '最终版本比初始版本快一些',
      '这是一个合理的选择',
    ],
  },
  sycophancy: {
    fn: idx.checkSycophancy,
    positive: [
      '您说得完全对，您太聪明了',
      'You are absolutely right, brilliant as always',
      '您太厉害了，完全正确',
    ],
    negative: [
      '您提出的方案有三个可取之处，但第二个需要考虑成本',
      'That is a reasonable point, though the data suggests otherwise',
    ],
  },
  softDeflection: {
    fn: idx.checkSoftDeflection,
    positive: [
      '我可能错了，但数据显示你是错的',
      'of course it might occasionally be wrong but thats normal',
      '当然我也有可能错，但整体结果是有效的',
    ],
    negative: [
      '我可能错了，请告诉我哪里不对',
      'Of course this could be wrong — here is the error bar',
    ],
  },
  clickbait: {
    fn: idx.checkClickbait,
    positive: [
      '震惊！真相竟然是这样的',
      'You wont believe what happened next',
      '99%的人都不知道这个秘密',
    ],
    negative: [
      '震惊的是， bug 的根因只是一个拼写错误（技术复盘）',
      'What happened next surprised the whole team: latency dropped 40%',
      'The results are shown in the table below',
    ],
  },
  pseudoProfundity: {
    fn: idx.checkPseudoProfundity,
    // 按真实模式库构造：企业咨询空话 + 伪哲理六型
    positive: [
      '从用户价值出发，我们需要系统性思考',
      '在这个时代背景下，赋能组织转型是关键',
      '成功不是因为努力，而是因为你还没领悟存在的本质',
      '真正的自由，是不再计较得失',
      '当你不再执念于结果的时候，成功自然会出现',
    ],
    negative: [
      '从需求出发，我们实现了一个批量导出功能',
      '赋能接口已重构，QPS 提升 3 倍',
      '这不是钱的问题，是态度问题',
    ],
  },
};

module.exports = function ({ test }) {
  for (const [name, dim] of Object.entries(DIMS)) {
    console.log(`\n[${name}]`);
    dim.positive.forEach((t, i) => {
      test(`${name} 正例 ${i + 1}`, () => {
        const r = dim.fn(t);
        const n = r.count ?? r.totalHits ?? (r.matches || r.hits || []).length ?? 0;
        assert.ok(n > 0, `未命中：${t.slice(0, 40)}`);
      });
    });
    dim.negative.forEach((t, i) => {
      test(`${name} 负例 ${i + 1} 不应命中`, () => {
        const r = dim.fn(t);
        const n = r.count ?? r.totalHits ?? (r.matches || r.hits || []).length ?? 0;
        assert.strictEqual(n, 0, `误命中：${t.slice(0, 40)}`);
      });
    });
  }
};
