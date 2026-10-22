// 第 135 轮：量化 ZH 侧与 EN 侧的族覆盖差（哪一族中文判据明显薄于英文）
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', 'src', 'reward-hacking.js');

function parse(fileText, startMarker) {
  const start = fileText.indexOf(startMarker);
  if (start < 0) throw new Error('marker not found: ' + startMarker);
  const end = fileText.indexOf('\nconst ', start + 10);
  const body = fileText.slice(start, end < 0 ? undefined : end);
  const families = {};
  const re = /^ {2}([a-z_0-9]+):\s*\[$/gm;
  let m;
  const marks = [];
  while ((m = re.exec(body))) marks.push({ name: m[1], idx: m.index });
  for (let i = 0; i < marks.length; i++) {
    const from = marks[i].idx;
    const to = i + 1 < marks.length ? marks[i + 1].idx : body.length;
    const seg = body.slice(from, to);
    families[marks[i].name] = (seg.match(/\/(?:[^\/\\\n]|\\.)+\/[a-z,]*/g) || []).length;
  }
  return families;
}

const text = fs.readFileSync(SRC, 'utf8');
const zh = parse(text, 'const REWARD_HACKING_ZH = {');
const en = parse(text, 'const REWARD_HACKING_EN = {');

const zhKeys = Object.keys(zh);
const enKeys = Object.keys(en);
console.log('ZH 族数=' + zhKeys.length + ' EN 族数=' + enKeys.length);
console.log('仅 EN 有(中文整族缺失): ' + JSON.stringify(enKeys.filter(k => !zh[k])));
console.log('仅 ZH 有: ' + JSON.stringify(zhKeys.filter(k => !en[k])));

const rows = [];
for (const k of zhKeys) {
  const z = zh[k] || 0;
  const e = en[k] || 0;
  rows.push({ family: k, zh: z, en: e, diff: z - e });
}
rows.sort((a, b) => a.diff - b.diff);
console.log('\n== 中文判据数 <= 英文判据数的族（diff 最小的 25 个）==');
for (const r of rows.slice(0, 25)) {
  console.log('  ' + r.family.padEnd(34) + ' zh=' + String(r.zh).padStart(2) + '  en=' + String(r.en).padStart(2) + '  diff=' + r.diff);
}
console.log('\nZH 判据总数=' + zhKeys.reduce((s, k) => s + zh[k], 0) + '  EN 判据总数=' + enKeys.reduce((s, k) => s + en[k], 0));
