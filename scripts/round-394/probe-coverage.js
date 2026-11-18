// r394 射程核查：对 mean_as_typical 穿透句，逐维度看哪些维度已响应、哪些沉默。
// 用法: /root/.local/bin/node scripts/round-394/probe-coverage.js
const path = require('path');
const { discriminate } = require(path.resolve(__dirname, '../../src/index.js'));

const PROBES = [
  '人均收入达到了八万元，所以大多数人的年收入都在八万左右。',
  '班级平均分是 85 分，可见班上大部分同学都考到了 85 分以上。',
  '平均每户拥有 1.5 套住房，意味着多数家庭都有多余的房子。',
  '平均房价是一万二，这说明随便一套房就是一万一二的价格。',
];

for (const p of PROBES) {
  const r = discriminate(p);
  const dims = r.dimensions || {};
  const hit = Object.entries(dims).filter(([k, v]) => {
    const c = v && typeof v === 'object' ? (v.count || 0) : 0;
    const s = v && typeof v === 'object' ? (v.score || 0) : 0;
    return c > 0 || s >= 0.5;
  }).map(([k, v]) => `${k}(c=${v.count || 0},s=${(v.score || 0).toFixed(2)})`);
  console.log(`\nTEXT: ${p}`);
  console.log(`  overall=${(r.overallScore || 0).toFixed(2)} 命中维度: ${hit.length ? hit.join(', ') : '（无）'}`);
  // 打印 findings 里的维度名
  const fd = (r.findings || []).map(f => `${f.dimension}:${f.severity}`);
  console.log(`  findings: ${fd.length ? fd.join(', ') : '（无）'}`);
}

// circular_definition 既有覆盖核查
const CIRC = [
  '这种泡沫就是资产价格偏离基本面，而所谓基本面就是没有泡沫的价格。',
  '成功人士就是有能力的人，有能力就是能成功的人。',
  '自由就是不受强迫，而不受强迫的定义就是自由的。',
];
console.log('\n===== circular_definition 既有覆盖 =====');
for (const p of CIRC) {
  const r = discriminate(p);
  const dims = r.dimensions || {};
  const hit = Object.entries(dims).filter(([k, v]) => {
    const c = v && typeof v === 'object' ? (v.count || 0) : 0;
    const s = v && typeof v === 'object' ? (v.score || 0) : 0;
    return c > 0 || s >= 0.5;
  }).map(([k, v]) => `${k}(c=${v.count || 0},s=${(v.score || 0).toFixed(2)})`);
  console.log(`\nTEXT: ${p}`);
  console.log(`  overall=${(r.overallScore || 0).toFixed(2)} 命中: ${hit.length ? hit.join(', ') : '（无）'}`);
}
