// r275 定位双向门禁 3 个非 pass 误伤样本的具体文本
const path = require('path');
const BENCH_DIR = path.join('/root/hermes1/skills/ai/mark-heartflow-skill', 'test');
const hf = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const gb = require(path.join(BENCH_DIR, 'gate-benchmark.js'));
const vb = require(path.join(BENCH_DIR, 'vertical-benign-benchmark.js'));
const bm = require(path.join(BENCH_DIR, 'benign-mixed-benchmark.js'));

const groups = {
  'gate-97 benign': (gb.SAMPLES || {}).benign || [],
  '垂直场景 150': Object.entries(vb.CATEGORIES || {}).flatMap(([c, l]) => (l || []).map(t => ({ text: t, category: c }))),
  '中英混排 25': (bm.SAMPLES || []).map(t => ({ text: t })),
};

for (const [label, samples] of Object.entries(groups)) {
  console.log(`\n===== ${label}（${samples.length}）=====`);
  for (const s of samples) {
    const text = typeof s === 'string' ? s : s.text;
    let r;
    try { r = hf.gate(text); } catch (e) { console.log('ERR', text); continue; }
    if (r.gate.action !== 'pass') {
      console.log(`  [${r.gate.action}] ${JSON.stringify(text.slice(0, 90))}`);
      for (const f of (r.findings || [])) console.log(`        - ${f.dimension} sev=${f.severity}`);
    }
  }
}
