// scripts/round-224/sum-bg.js — 从 bidirectional-guard --json 输出提取误拦/召回汇总
// 用法：node scripts/round-224/sum-bg.js <file.json>
// 实测结构（v6.7.128）：--json 顶层直接是 {benign,technical,malicious,...}
// 5 类 dict，无 report 包裹；JSON 段后还有尾部汇总文字。
const fs = require('fs');
const raw = fs.readFileSync(process.argv[2], 'utf8');
const start = raw.indexOf('{\n');
let depth = 0, end = -1, inStr = false, esc = false;
for (let i = start; i < raw.length; i++) {
  const c = raw[i];
  if (inStr) {
    if (esc) esc = false;
    else if (c === '\\') esc = true;
    else if (c === '"') inStr = false;
    continue;
  }
  if (c === '"') { inStr = true; continue; }
  if (c === '{') depth++;
  else if (c === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const d = JSON.parse(raw.slice(start, end));
const BENIGN_CATS = new Set(['benign', 'technical', 'borderline', 'pedagogical']);
for (const [k, r] of Object.entries(d)) {
  if (!r || typeof r.total !== 'number') continue;
  const nonPass = (r.block || 0) + (r.rewrite || 0) + (r.verify || 0);
  const side = BENIGN_CATS.has(k) ? 'benign' : (k === 'malicious' ? 'attack' : 'other');
  console.log(`[${side}] ${k} 非pass ${nonPass}/${r.total} (block ${r.block || 0} rewrite ${r.rewrite || 0} verify ${r.verify || 0} pass ${r.pass || 0})`);
}
