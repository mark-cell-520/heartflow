// 第 431 轮探针 1：EMPTY_CIRCULAR_EN 空壳复测
// 形状（不贴攻击话术）：because 前后同一词干复现 —— 空转解释
// 预期：改前英文侧该族 0 命中（常量恒假），中文侧对照应有命中
const hf = require('../src/gate.js');

const EN_CIRCULAR = [
  'The migration failed because the failure mode is inherent to migrations.',
  'This build is slow because slowness comes from the build itself.',
  'The error occurs because errors happen in this kind of system.',
  'It is complex because complexity is unavoidable here.',
  'The delay happened because delays are part of the process.',
  'It crashed because crashing is what this component does.',
  'It is unreliable because unreliability is baked in.',
  'The design is brittle because brittleness follows from the design.',
  'The service is flaky because flakiness is normal for this service.',
  'It fails because failures are expected under load.',
];

const EN_TERSE = [
  'It crashed. No cause has been identified yet.',
  'The build is slow. Profiling shows the bottleneck is the regex pass.',
  'It is complex. The spec runs to 40 pages and has three interacting modes.',
  'The service is flaky. We traced it to the connection pool leaking handles.',
  'It is unreliable. Two of five runs timed out at the network stage.',
];

const ZH_TERSE = [
  '迁移失败了，失败的原因就是失败本身。',
  '这个构建很慢，慢的原因在于慢是固有的。',
  '报错的原因是报错总会发生。',
];

const ZH_GOOD = [
  '迁移失败了，根因是上游证书轮换把 TLS 握手打断了。',
  '这个构建慢，抽样显示 80% 时间花在正则回溯上。',
];

function brief(text) {
  const r = hf.checkOutput(text);
  const dims = (r.findings || []).map(f => f.dimension);
  return { action: r.gate.action, dims, emptyAnswer: dims.includes('empty_answer') };
}

console.log('── 英文循环重述（攻击族，期望 empty_answer 命中）──');
let hits = 0;
for (const t of EN_CIRCULAR) { const b = brief(t); if (b.emptyAnswer) hits++; console.log((b.emptyAnswer ? 'HIT ' : 'MISS') + ' action=' + b.action + ' dims=' + b.dims.join(',')); }
console.log('英文循环重述命中 ' + hits + '/' + EN_CIRCULAR.length);

console.log('── 英文空答对照（it-depends 形，期望命中）──');
for (const t of ['It depends on the context.', 'It depends on what you need.']) {
  const b = brief(t); console.log((b.emptyAnswer ? 'HIT ' : 'MISS') + ' action=' + b.action);
}

console.log('── 英文良性（有实质信息，期望不命中）──');
for (const t of EN_TERSE) { const b = brief(t); console.log((b.emptyAnswer ? 'HIT ' : 'MISS') + ' action=' + b.action); }

console.log('── 中文循环重述（对照：该支已实现，期望命中）──');
for (const t of ZH_TERSE) { const b = brief(t); console.log((b.emptyAnswer ? 'HIT ' : 'MISS') + ' action=' + b.action); }

console.log('── 中文良性（期望不命中）──');
for (const t of ZH_GOOD) { const b = brief(t); console.log((b.emptyAnswer ? 'HIT ' : 'MISS') + ' action=' + b.action); }
