'use strict';
// r389 scout 摘要：读 coordination/agent4/scout/ 最新一批原始结果
const fs = require('fs');
const path = require('path');
const dir = 'coordination/agent4/scout';
const files = fs.readdirSync(dir);
function latest(prefix) {
  return files.filter(f => f.startsWith(prefix)).sort().pop();
}
function read(f) { return f ? fs.readFileSync(path.join(dir, f), 'utf8') : ''; }

const arx = read(latest('arxiv-'));
if (arx) {
  const titles = [...arx.matchAll(/<title>([\s\S]*?)<\/title>/g)].map(m => m[1].replace(/\s+/g, ' ').trim());
  console.log('=== arXiv 条目 ' + (titles.length - 1) + ' 条 ===');
  titles.slice(1, 13).forEach((t, i) => console.log('  ' + (i + 1) + '. ' + t.slice(0, 120)));
} else console.log('=== arXiv 空返 ===');

const gh = read(latest('github-repos-'));
if (gh) {
  try {
    const d = JSON.parse(gh);
    console.log('=== GitHub repos total=' + (d.total_count != null ? d.total_count : '?') + ' ===');
    (d.items || []).slice(0, 15).forEach(it => console.log('  - ' + it.full_name + ' | ' + (it.description || '').slice(0, 90)));
  } catch (e) { console.log('=== GitHub parse-fail ==='); }
} else console.log('=== GitHub 空返 ===');

const s2 = read(latest('s2-'));
if (s2) {
  try {
    const d = JSON.parse(s2);
    console.log('=== Semantic Scholar total=' + (d.total != null ? d.total : '?') + ' ===');
    (d.data || []).slice(0, 15).forEach(it => console.log('  - ' + (it.title || '').slice(0, 90) + ' | ' + it.year + ' | cites=' + it.citationCount));
  } catch (e) { console.log('=== S2 parse-fail ==='); }
} else console.log('=== S2 空返 ===');
