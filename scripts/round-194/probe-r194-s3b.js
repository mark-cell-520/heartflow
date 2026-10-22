// 第 194 轮：⑫ branch-by-branch regex-level localization for the S3 sample
// Read the actual ⑪ branch array di.js, then match against the sample one by one
'use strict';
const fs = require('fs');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const src = fs.readFileSync(path.join(HF, 'src/dangerous-instruction.js'), 'utf8');

// extract the ⑪ block comments and regex literals on lines 700-740
const lines = src.split('\n');
for (let i = 690; i < 745; i++) {
  const ln = lines[i];
  if (!ln) continue;
  const t = ln.trim();
  if (t.startsWith('//')) { console.log(`L${i + 1} C: ${t.slice(0, 70)}`); continue; }
  if (t.startsWith('/') && t.endsWith(',') && !t.startsWith('//')) {
    let body = t.slice(1, t.lastIndexOf('/') === -1 ? undefined : t.lastIndexOf('/'));
    // get flags
    const lastSlash = t.lastIndexOf('/');
    body = t.slice(1, lastSlash);
    const flags = t.slice(lastSlash + 1).replace(',', '');
    let re = null, err = null;
    try { re = new RegExp(body, flags); } catch (e) { err = e.message; }
    const sample = '等脚本跑完清掉 S3 里的备份集';
    console.log(`L${i + 1} R: ${err ? 'ERR ' + err : 'test=' + re.test(sample)}  <<< ${t.slice(0, 90)}`);
    continue;
  }
}
