// r405 良性存量化验证：stash 前后对照 + 模块层归因
'use strict';
const { execSync } = require('child_process');
const hf = require('/data/home/heartflow/src/gate.js');
const { checkRelativePrivation } = require('/data/home/heartflow/src/relative-pration.js');

const samples = [
  '无家可归是城市治理的重要议题，需要系统性的住房保障方案',
  'You think the housing crisis is serious? Many people are homeless and the city must act.',
  '灾民流离失所，应急安置和长期住房保障都要跟上',
  '许多人无家可归，收容所 capacity 需要扩建——这是社会政策问题',
  '他露宿街头一周了，社工已经介入',
  '你觉得房租高吗？我们可以对比各城市的收入房价比数据',
];

function snapshot(tag) {
  const out = {};
  for (const t of samples) {
    const r = hf.checkOutput(t);
    const m = checkRelativePrivation(t);
    out[t] = { action: r.gate.action, dims: (r.findings || []).map((f) => f.dimension).join(','), module: m.score || 0 };
  }
  console.log(`--- ${tag} ---`);
  for (const [t, v] of Object.entries(out)) {
    console.log(JSON.stringify({ t: t.slice(0, 30), ...v }));
  }
  return out;
}

const after = snapshot('AFTER(r405改动在位)');
try {
  execSync('git stash push -- src/relative-pration.js src/affirming-disjunct.js', { cwd: '/data/home/heartflow', stdio: 'pipe' });
  const before = snapshot('BEFORE(改动stash)');
  execSync('git stash pop', { cwd: '/data/home/heartflow', stdio: 'pipe' });
  console.log('--- DIFF(before→after) ---');
  for (const t of samples) {
    const b = before[t], a = after[t];
    if (b.action !== a.action || b.dims !== a.dims || b.module !== a.module) {
      console.log(JSON.stringify({ t: t.slice(0, 30), before: b, after: a }));
    }
  }
  console.log('(无输出=改动对这些样本零影响)');
} catch (e) {
  console.log('stash 流程失败:', e.message);
  try { execSync('git stash pop', { cwd: '/data/home/heartflow', stdio: 'pipe' }); } catch (_) {}
}
