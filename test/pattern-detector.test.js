const { PatternDetector } = require('../src/pattern-detector.js');

function testPatternDetector() {
  const pd = new PatternDetector({ minRecordsForTrend: 4 });

  const records = [
    { date: '2026-08-01', type: 'success' },
    { date: '2026-08-02', type: 'success' },
    { date: '2026-08-03', type: 'success' },
    { date: '2026-08-04', type: 'success' },
  ];
  const trend = pd.analyzeTrend(records);
  if (!trend || typeof trend.direction === 'undefined') {
    throw new Error('analyzeTrend returned invalid shape');
  }

  const osc = pd.detectOscillation(records);
  if (!osc || typeof osc.detected === 'undefined') {
    throw new Error('detectOscillation returned invalid shape');
  }

  console.log('PatternDetector smoke test passed');
}

// [v6.7.86] 补标准汇总行（同 behavior-tracker）：原先无「N 通过, M 失败」，
// run-all.js 判为静默跳过，该测试长期不被计数。
let _pdOk = 1;
try {
  testPatternDetector();
} catch (e) {
  _pdOk = 0;
  console.error('PatternDetector smoke test FAILED:', e.message);
  process.exitCode = 1;
}
console.log(`pattern-detector: ${_pdOk} 通过, ${1 - _pdOk} 失败, 共 1 个`);
