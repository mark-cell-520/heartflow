// 解 UU 冲突：两轮工作都保留。VERSION 两侧同为 6.8.163，取一侧即可。
// 2026-11-10 22:35 audit-cron
'use strict';
const fs = require('fs');
const p = '/root/hermes1/skills/ai/mark-heartflow-skill/VERSION';
const raw = fs.readFileSync(p, 'utf8');
if (!raw.includes('<<<<<<<')) { console.log('VERSION: 无冲突标记，跳过'); process.exit(0); }
const m = raw.match(/<<<<<<< Updated upstream\r?\n([\s\S]*?)\r?\n=======\r?\n([\s\S]*?)\r?\n>>>>>>> Stashed changes/);
if (!m) { console.error('VERSION: 冲突块解析失败'); process.exit(1); }
const ours = m[1].trim(), theirs = m[2].trim();
console.log('ours=', JSON.stringify(ours), 'theirs=', JSON.stringify(theirs));
if (ours !== theirs) { console.error('VERSION: 两侧内容不同，需人工裁决，不自动解'); process.exit(2); }
const out = raw.replace(/<<<<<<< Updated upstream\r?\n[\s\S]*?\r?\n=======\r?\n[\s\S]*?\r?\n>>>>>>> Stashed changes/, ours);
fs.writeFileSync(p, out.endsWith('\n') ? out : out + '\n');
console.log('VERSION 解冲突完成 ->', JSON.stringify(fs.readFileSync(p, 'utf8')));
