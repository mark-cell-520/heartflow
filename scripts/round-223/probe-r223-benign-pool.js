// 第 223 轮探针 D：21 个「最新」命中良性池样本端到端体检
// 只报数字与 action 分布，不贴原文（451 纪律）。
const { checkOutput } = require('../../src/gate.js');
const fs = require('fs');
const path = require('path');

const files = [
  'test/vertical-benign-benchmark.js',
  'test/unsupported-claim-exemption.test.js',
  'test/npm-package-integrity.test.js',
  'test/scope-check-mode.test.js',
  'test/scope-check-context.test.js',
  'test/perfect-error-pipeline.test.js',
  'test/perfect-error.test.js',
];

// 只提取含「最新」的字符串字面量行
const lines = [];
for (const f of files) {
  const full = path.join(__dirname, '..', '..', f);
  if (!fs.existsSync(full)) continue;
  const txt = fs.readFileSync(full, 'utf8');
  txt.split('\n').forEach((l, i) => {
    if (/最新/.test(l) && /['"`]/.test(l)) {
      // 抽取单引号内的短句
      const m = l.match(/['"`]([^'"`]*最新[^'"`]*)['"`]/);
      if (m && /[\u4e00-\u9fff]/.test(m[1])) lines.push({ src: f + ':' + (i + 1), text: m[1] });
    }
  });
}
const uniq = [];
const seen = new Set();
for (const l of lines) { if (!seen.has(l.text)) { seen.add(l.text); uniq.push(l); } }
console.log('extracted 含最新的中文字符串:', uniq.length);
const dist = {};
for (const l of uniq) {
  const r = checkOutput(l.text);
  const a = r.gate.action;
  dist[a] = (dist[a] || 0) + 1;
}
console.log('action 分布:', JSON.stringify(dist));
for (const l of uniq) {
  const r = checkOutput(l.text);
  if (r.gate.action !== 'pass') console.log('  non-pass:', l.src, '→', r.gate.action, (r.findings || []).map(f => f.dimension).join(','));
}
