/**
 * scripts/round-660-sync-docs2.js
 *
 * [r660] README.md / SKILL.md 横幅行的 "105 discrimination dimensions" → 106。
 * 上一轮 round-660-sync-docs.js 只改了规格表与 pipeline 描述，横幅是独立的
 * 第四/第五处（守卫「三个文档数字互相一致」报的就是它）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const REPO = '/root/.hermes/skills/ai/mark-heartflow-skill';

const jobs = [
  ['README.md', '105 discrimination dimensions', '106 discrimination dimensions'],
  ['SKILL.md', '105 discrimination dimensions', '106 discrimination dimensions'],
];

for (const [name, from, to] of jobs) {
  const f = path.join(REPO, name);
  let s = fs.readFileSync(f, 'utf8');
  const n = s.split(from).length - 1;
  if (n === 0) {
    console.log('⚠️ ' + name + ' 未命中: ' + from);
    continue;
  }
  s = s.split(from).join(to);
  fs.writeFileSync(f, s, 'utf8');
  console.log('✅ ' + name + ': ' + n + ' 处已替换');
}

// 验证
console.log('\n=== 验证 ===');
for (const name of ['README.md', 'SKILL.md', 'AGENTS.md']) {
  const s = fs.readFileSync(path.join(REPO, name), 'utf8');
  const banner = (s.match(/(\d+) discrimination dimensions/g) || []).join(', ');
  console.log(name + ' 横幅: ' + (banner || '(无)'));
}
