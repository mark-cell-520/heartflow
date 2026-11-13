// r308: 维度总数口径 251→252（README/SKILL/AGENTS 三处同步）
const fs = require('fs');
const ROOT = '/root/hermes1/skills/ai/mark-heartflow-skill/';

function patchFile(name, edits) {
  const p = ROOT + name;
  let s = fs.readFileSync(p, 'utf8');
  let n = 0;
  for (const [from, to, label] of edits) {
    if (s.indexOf(from) < 0) { console.log('MISS [' + name + '] ' + label); continue; }
    const cnt = s.split(from).length - 1;
    s = s.split(from).join(to);
    n += cnt;
    console.log('OK   [' + name + '] ' + label + ' ×' + cnt);
  }
  fs.writeFileSync(p, s, 'utf8');
  return n;
}

let total = 0;
total += patchFile('README.md', [
  ['discrimination%20dimensions-251-', 'discrimination%20dimensions-252-', 'README badge'],
  ['#what-it-catches-251-dimensions', '#what-it-catches-252-dimensions', 'README badge anchor'],
  ['251 discrimination dimensions', '252 discrimination dimensions', 'README 头部行'],
  ['premise-check, 251 dimensions', 'premise-check, 252 dimensions', 'README API 表'],
  ['discriminate (251 dimensions)', 'discriminate (252 dimensions)', 'README pipeline 行'],
  ['What it catches (251 dimensions)', 'What it catches (252 dimensions)', 'README 章节标题'],
]);
total += patchFile('SKILL.md', [
  ['251 discrimination dimensions', '252 discrimination dimensions', 'SKILL 头部行'],
  ['| Discrimination dimensions | 251 |', '| Discrimination dimensions | 252 |', 'SKILL 规格表'],
  ['## The 251 dimensions', '## The 252 dimensions', 'SKILL 章节标题'],
  ['(251 dimensions)', '(252 dimensions)', 'SKILL API 表'],
]);
total += patchFile('AGENTS.md', [
  ['251 dimensions, 164 modules', '252 dimensions, 164 modules', 'AGENTS 头部行'],
]);
console.log('total replacements:', total);
