/**
 * run-all 入口：正常中英混排文本误报率基准（v6.7.73）
 *
 * 补基准死角——203 样本基准缺"正常英文句子 + 中文"这一类，
 * 导致拼音还原的回归（正常英文被压成无空格长串）没被抓到。
 */
module.exports = function ({ test }) {
  const path = require('path');
  const { run, report, SAMPLES } = require('./benign-mixed-benchmark.js');

  test('benign-mixed: 正常中英混排文本零误拦', () => {
    const results = run();
    const fp = results.filter(r => r.fp);
    if (fp.length > 0) {
      throw new Error(`${fp.length}/${results.length} 条误拦: ` +
        fp.map(f => `[${f.action}] ${f.text.slice(0, 30)}`).join('; '));
    }
  });

  test('benign-mixed: 样本规模 ≥ 25', () => {
    if (SAMPLES.length < 25) throw new Error(`样本仅 ${SAMPLES.length} 条，少于 25`);
  });
};
