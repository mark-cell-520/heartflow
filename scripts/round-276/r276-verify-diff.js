// r276: 从 src/index.js 提取 VERIFY_DIMS，与三份文档的 Verify 列举做 diff
const fs = require('fs');
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';

// 用 measure 脚本同样的方式取 VERIFY_DIMS：require index.js 太重，改为静态抓数组
const idx = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
const m = idx.match(/const VERIFY_DIMS = new Set\(\[([\s\S]*?)\]\)/);
if (!m) { console.log('NO VERIFY_DIMS'); process.exit(1); }
const live = m[1].match(/'[a-z0-9_]+'/g).map(s => s.replace(/'/g, ''));
console.log('live VERIFY_DIMS:', live.length);

function docList(file, label) {
  const src = fs.readFileSync(path.join(HF, file), 'utf8');
  const line = src.split('\n').find(l => l.includes('Verify-level'));
  if (!line) { console.log(file, 'NO Verify-level line'); return; }
  const names = line.match(/[a-z][a-z0-9_]{2,}/g) || [];
  const set = new Set(names);
  const missing = live.filter(d => !set.has(d));
  const extra = names.filter(n => !live.includes(n));
  console.log(`${file} ${label}: 列举 ${names.length} 个（去重后 ${set.size}）`);
  console.log('  缺:', missing.join(', ') || '无');
  console.log('  多:', extra.join(', ') || '无');
}
docList('AGENTS.md', 'AGENTS');
docList('README.md', 'README');
docList('SKILL.md', 'SKILL');
