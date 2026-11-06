// r228 scout 解析（第二轮）：读 scout 原始文件，输出摘要（不编造：文件为空/解析失败就如实输出）
const fs = require('fs');
const base = 'coordination/agent4/scout/';
function show(name) {
  const p = base + name;
  if (!fs.existsSync(p)) { console.log(name, ': 文件不存在'); return; }
  const t = fs.readFileSync(p, 'utf8');
  if (!t.trim()) { console.log(name, ': 空文件（0 字节，API 无响应或超时）'); return; }
  if (name.endsWith('.xml')) {
    const entries = (t.match(/<entry>/g) || []).length;
    console.log(name, ': entries=' + entries);
    const titles = [...t.matchAll(/<title>([\s\S]*?)<\/title>/g)].map(m => m[1].replace(/\s+/g, ' ').trim());
    titles.slice(0, 10).forEach((x, i) => console.log('  [' + i + ']', x.slice(0, 110)));
  } else {
    try {
      const d = JSON.parse(t);
      console.log(name, ': total_count=' + d.total_count);
      (d.items || []).slice(0, 10).forEach(r => console.log('  ', r.full_name, r.stargazers_count + '★', (r.description || '').replace(/\s+/g, ' ').slice(0, 90)));
    } catch (e) { console.log(name, ': JSON 解析失败 —', t.slice(0, 120)); }
  }
}
show('20261106-0505-arxiv-retry.xml');
show('20261106-0505-github-baserate.json');
