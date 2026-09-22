/**
 * run-all 入口：未覆盖维度补充基准（v6.7.76）
 */
module.exports = function ({ test }) {
  const { run, TARGETS } = require('./dimension-coverage-benchmark.js');

  test('dimension-coverage: 14 个未覆盖维度全部达标', () => {
    const results = run();
    const failures = [];
    for (const r of results) {
      if (r.skipped) { failures.push(`${r.dimension}: 跳过(${r.reason})`); continue; }
      const want = TARGETS[r.dimension];
      const hit = r.samples.filter(s => s.hit).length;
      if (hit < want) failures.push(`${r.dimension}: ${hit}/${want}`);
    }
    if (failures.length > 0) throw new Error(failures.join('; '));
  });

  test('dimension-coverage: 覆盖维度数 ≥ 14', () => {
    const results = run().filter(r => !r.skipped);
    if (results.length < 14) throw new Error(`只覆盖 ${results.length} 个维度`);
  });
};
