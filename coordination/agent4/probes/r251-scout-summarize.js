// r251-scout-summarize.js — 汇总本轮 scout 原始 JSON（不编造，只打印文件里真实存在的字段）
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..', 'scout');
const files = process.argv.slice(2);
for (const f of files) {
  const p = path.join(DIR, f);
  if (!fs.existsSync(p)) { console.log(`MISSING ${f}`); continue; }
  console.log(`\n=== ${f} ===`);
  try {
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (d.message) { console.log('API message:', d.message, d.code || ''); continue; }
    if (Array.isArray(d)) { console.log('array len', d.length); continue; }
    if (typeof d.total_count === 'number') {
      console.log('total_count', d.total_count);
      for (const it of (d.items || []).slice(0, 15)) {
        console.log('  -', it.full_name, '| stars', it.stargazers_count, '|', (it.description || '').slice(0, 90));
      }
    } else if (typeof d.data !== 'undefined') {
      console.log('data len', d.data.length);
      for (const it of d.data.slice(0, 15)) {
        console.log('  -', it.year, '| cites', it.citationCount, '|', String(it.title).slice(0, 100));
      }
    } else {
      console.log('keys', Object.keys(d).join(','));
    }
  } catch (e) { console.log('parse-fail:', e.message); }
}
