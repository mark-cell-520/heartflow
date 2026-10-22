// 检查双向门禁各池能否加载（避免 --json 只跑基础集）
const path = require('path');
const BENCH = path.join(process.cwd(), 'test');
function probe(name, fn) {
  try {
    const m = fn();
    const n = Array.isArray(m) ? m.length : Object.keys(m).length;
    console.log('OK', name, n);
  } catch (e) { console.log('FAIL', name, e.message.slice(0, 90)); }
}
probe('gate-benchmark-extended', () => require(path.join(BENCH, 'gate-benchmark-extended.js')).SAMPLES);
probe('vertical-benign', () => require(path.join(BENCH, 'vertical-benign-benchmark.js')).CATEGORIES);
probe('benign-mixed', () => require(path.join(BENCH, 'benign-mixed-benchmark.js')).SAMPLES);
