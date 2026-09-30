// 轮 200：rh 中英两侧判据规模 + 稀疏族定位（决定收割顺序）
const path = require('path');
const HF = process.env.HF_ROOT || path.join(__dirname, '..', '..');
const src = require('fs').readFileSync(path.join(HF, 'src/reward-hacking.js'), 'utf8');

function parseBlock(name) {
  const start = src.indexOf('const ' + name + ' = {');
  if (start < 0) return null;
  // brace matching
  let i = src.indexOf('{', start);
  let depth = 0, end = -1;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) { end = j; break; } }
  }
  const body = src.slice(i + 1, end);
  const out = {};
  let m;
  const re = /^\s{2}([A-Za-z0-9_]+):\s*\[/gm;
  while ((m = re.exec(body)) !== null) {
    const fam = m[1];
    // count regex literals up to the closing ] of this family
    let k = body.indexOf('[', m.index + m[0].length - 1);
    let d = 0, close = -1;
    for (let j = k; j < body.length; j++) {
      if (body[j] === '[') d++;
      else if (body[j] === ']') { d--; if (d === 0) { close = j; break; } }
    }
    const seg = body.slice(k + 1, close);
    out[fam] = (seg.match(/\/[^\/\n]+\/[a-z]*\s*(?:,|$)/g) || []).length;
  }
  return out;
}

const zh = parseBlock('REWARD_HACKING_ZH');
const en = parseBlock('REWARD_HACKING_EN');
const keys = new Set([...Object.keys(zh), ...Object.keys(en)]);
const rows = [];
for (const k of keys) rows.push([k, zh[k] || 0, en[k] || 0]);
rows.sort((a, b) => (b[1] + b[2]) - (a[1] + a[2]));
console.log('ZH 族数 =', Object.keys(zh).length, ' EN 族数 =', Object.keys(en).length);
console.log('ZH 判据总数 =', Object.values(zh).reduce((a, b) => a + b, 0));
console.log('EN 判据总数 =', Object.values(en).reduce((a, b) => a + b, 0));
console.log('\n--- 只有 EN 没有 ZH 的族（中文侧完全空转）---');
const onlyEn = rows.filter(r => r[1] === 0);
onlyEn.forEach(r => console.log(`  ${r[0]}: zh=${r[1]} en=${r[2]}`));
console.log(`\n--- 稀疏族（zh<=5 且 en>0）---`);
rows.filter(r => r[1] > 0 && r[1] <= 5 && r[2] > 0).forEach(r => console.log(`  ${r[0]}: zh=${r[1]} en=${r[2]}`));
console.log('\n--- 全量 ---');
rows.forEach(r => console.log(`  ${r[0]}: zh=${r[1]} en=${r[2]}`));
