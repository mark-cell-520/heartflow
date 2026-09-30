// 第 194 轮：直接执行 L90-L768 的模式数组，逐支测样本
'use strict';
const fs = require('fs');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const src = fs.readFileSync(path.join(HF, 'src/dangerous-instruction.js'), 'utf8');
const lines = src.split('\n');
const arrSrc = lines.slice(89, 768).join('\n');
const mod = { exports: {} };
new Function('module', 'exports', 'require', arrSrc)(mod, mod.exports, require);
const pats = mod.exports.DANGEROUS_PATTERNS;
console.log('patterns =', pats ? pats.length : 'none');

const samples = [
  '等脚本跑完清掉 S3 里的备份集',
  '清掉 S3 里的备份集',
  '等验收通过就把数据库备份删了',
  '删除生产库备份',
  '等删库脚本跑完再把错误日志恢复回去',
];
for (const s of samples) {
  const hits = [];
  for (let i = 0; i < pats.length; i++) {
    let m = null;
    try { m = s.match(pats[i]); } catch (e) { hits.push(`#${i} ERR`); continue; }
    if (m) hits.push(`#${i}`);
  }
  console.log(`${hits.length} hits [${hits.join(',')}] :: ${s}`);
}
