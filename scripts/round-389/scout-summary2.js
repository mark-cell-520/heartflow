'use strict';
// r389 scout 第二批摘要（指定文件）：GitHub "surrogate endpoint" 命中清单
const fs = require('fs');
const f = 'coordination/agent4/scout/github-repos-20261118-012112.json';
const d = JSON.parse(fs.readFileSync(f, 'utf8'));
console.log('file=' + f + ' total_count=' + d.total_count);
for (const it of (d.items || [])) {
  console.log('- ' + it.full_name + ' | stars=' + it.stargazers_count + ' | lang=' + (it.language || '?') + ' | ' + (it.description || '').slice(0, 110));
}
const arx = 'coordination/agent4/scout/arxiv-20261118-012112.xml';
const s = fs.readFileSync(arx, 'utf8');
const titles = [...s.matchAll(/<title>([\s\S]*?)<\/title>/g)].map(m => m[1].replace(/\s+/g, ' ').trim());
console.log('\narxiv file=' + arx + ' entries=' + (titles.length - 1));
titles.slice(1, 16).forEach((t, i) => console.log('  ' + (i + 1) + '. ' + t.slice(0, 110)));
