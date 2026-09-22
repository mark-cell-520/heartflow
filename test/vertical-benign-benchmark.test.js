/**
 * run-all 入口：垂直场景良性基准（v6.7.73）
 *
 * 来源：心虫 decision.decide 0.96 分——三轮回归的结构性根因是
 * 良性基准缺行业垂直场景覆盖。基准建出即抓出 12 个真误报（8%），
 * 修复后降到 0%。
 *
 * 六类场景：安全/金融/医疗/法律/教育/客服，各 25 条。
 */
module.exports = function ({ test }) {
  const { run, CATEGORIES } = require('./vertical-benign-benchmark.js');

  test('vertical-benign: 六类垂直场景零误拦', () => {
    const results = run();
    const fp = results.filter(r => r.fp);
    if (fp.length > 0) {
      throw new Error(`${fp.length}/${results.length} 条误拦: ` +
        fp.map(f => `[${f.category}][${f.action}] ${f.text.slice(0, 24)}`).join('; '));
    }
  });

  test('vertical-benign: 六类场景每类 ≥ 25 条', () => {
    for (const [cat, samples] of Object.entries(CATEGORIES)) {
      if (samples.length < 25) throw new Error(`${cat} 仅 ${samples.length} 条，少于 25`);
    }
  });
};
