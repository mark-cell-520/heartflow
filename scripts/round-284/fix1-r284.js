// 第 284 轮 fix1：把 281 判据群体表对齐 4948/4949 的完整 83 词表。
// 补 39 个缺失词：reviewers?|maintainers?|admins?|clients?|patients?|drivers?|players?|
// voters?|readers?|guys?|followers?|kids?|children|men|women|folks|protesters?|cops?|
// refugees?|soldiers|police|teachers?|nurses?|doctors?|riders?|staff|trainees?|cadets?|
// believers?|activists?|extremists?|moderates?|liberals?|conservatives?|republicans?|
// democrats?|herders?|fanatics?|ones
// 实测依据 scripts/round-284/probe7b-r284.js：281 判据 base 表只收 44/83 词，
// probe8 实测 270 条漏判（281 测试池 5 词 × 表语 × 2 量词）。
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', '..', 'src', 'index.js');

const OLD = 'members?|people|persons?|humans?|individuals?|interns?|one)\\s+(?:is|are)\\s+(?!not\\b|n\'t\\b)(?:a\\s+|an\\s+)?(?:fools?';
const NEW = 'members?|people|persons?|humans?|individuals?|interns?|one)\\s+(?:is|are)\\s+(?!not\\b|n\'t\\b)(?:a\\s+|an\\s+)?(?:fools?';

// 只改第 4920 行（281 主判据）的群体表尾：`|interns?|one)` → 补 39 词
const lines = fs.readFileSync(FILE, 'utf8').split('\n');
const IDX = 4919; // 0-based → 第 4920 行
const before = lines[IDX];
if (!/every|each/.test(before) || !/interns\?\|one\)/.test(before)) {
  console.error('ANCHOR_FAIL 第 4920 行不含预期锚点');
  process.exit(1);
}
const patched = before.replace(
  /(members\?\|people\|persons\?\|humans\?\|individuals\?\|interns\?\|one)(\)\\s\+\(\?:is\|are\))/,
  '$1|reviewers?|maintainers?|admins?|clients?|patients?|drivers?|players?|voters?|readers?|guys?|followers?|kids?|children|men|women|folks|protesters?|cops?|refugees?|soldiers|police|teachers?|nurses?|doctors?|riders?|staff|trainees?|cadets?|believers?|activists?|extremists?|moderates?|liberals?|conservatives?|republicans?|democrats?|herders?|fanatics?|ones$2'
);
if (patched === before) { console.error('NO_MATCH 群体表尾未替换'); process.exit(1); }
lines[IDX] = patched;
fs.writeFileSync(FILE, lines.join('\n'));
console.log('PATCHED 第 4920 行长度 ' + before.length + ' → ' + patched.length);
