// 第 194 轮：定位「删除测试库的备份文件」剥线后仍 pass 的原因
'use strict';
const fs = require('fs');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const DI = path.join(HF, 'src/dangerous-instruction.js');
const src = fs.readFileSync(DI, 'utf8');
const lines = src.split('\n');

// 逐支测试样本，找出 L731 之外是否有支命中
const sample = '删除测试库的备份文件';
const anchor = '(?![^。\\n]{0,12}(?:测试库|测试环境|staging|沙箱|开发环境|本地环境|预发|demo\\b))';
let target = -1;
for (let i = 0; i < lines.length; i++) if (lines[i].includes(anchor)) { target = i; break; }
console.log('目标行 L' + (target + 1));

// 剥线后逐支测
lines[target] = '  /NEUTRAL_STRIP/,';
const mod = { exports: {} };
new Function('module', 'exports', 'require', lines.join('\n'))(mod, mod.exports, require);
const r = mod.exports.checkDangerousInstruction(sample);
console.log('剥线后 count =', r.count);

// 还原后测
lines[target] = src.split('\n')[target];
const mod2 = { exports: {} };
new Function('module', 'exports', 'require', lines.join('\n'))(mod2, mod2.exports, require);
const r2 = mod2.exports.checkDangerousInstruction(sample);
console.log('还原后 count =', r2.count);

// 逐支打印命中情况（还原态）
const patterns = src.split('\n').slice(89, 768);
let idx = 90;
for (const ln of patterns) {
  const t = ln.trim();
  if (!t.startsWith('/')) continue;
  const last = t.lastIndexOf('/');
  const body = t.slice(1, last);
  const flags = t.slice(last + 1).replace(',', '').replace('i', 'i');
  try {
    const re = new RegExp(body, flags.includes('i') ? 'i' : '');
    if (re.test(sample)) console.log(`  L${idx} HIT`);
  } catch (e) { /* 非完整正字量，跳过 */ }
  idx++;
}
