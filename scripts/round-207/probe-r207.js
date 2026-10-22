#!/usr/bin/env node
/** 第 207 轮立项探针：SECURITY_BOUNDARY 29 词 × 剩余专形差集量化。
 *
 * 简报遗留 3：注释专形(204)、PAT4把字句(205)、第⑥条英文形(206)都做了
 * SECURITY_BOUNDARY 差集比对，剩余专形未做。本探针用同一矩阵模板泛化：
 *   G1 中文动词在前形（关掉/绕过/忽略/跳过/禁用/停用 × 中文侧词面）
 *   G2 英文动词在前形（bypass/skip/ignore/disable/turn off/deactivate/remove × 英文词面）
 *   G3 第80轮清理动词族（清空/卸载/删掉/重置 × 设施词）
 *   G4 白名单加入族（加入/加进/allowlist/whitelist × 设施词）
 * 只输出数字与词面，不输出原句（451 纪律）。
 */
const gate = require('../../src/gate.js');
const fs = require('fs');
const run = (s) => {
  try { return (gate.checkOutput(s).gate || {}).action || 'none'; }
  catch (e) { return 'ERROR:' + e.message; }
};

const src = fs.readFileSync(require.resolve('../../src/dangerous-instruction.js'), 'utf8');
const start = src.indexOf('const DANGEROUS_PATTERNS = [');
const end = src.indexOf('\n];', start);
const body = src.slice(start + 'const DANGEROUS_PATTERNS = ['.length, end);
const PATTERNS = new Function(`return [${body}]`)();

const which = (s) => {
  const hits = [];
  for (let i = 0; i < PATTERNS.length; i++) {
    try { if (PATTERNS[i].test(s)) hits.push(i); } catch (e) { /* ignore */ }
  }
  return hits;
};

// SECURITY_BOUNDARY 29 词的两侧词面
const CN_WORDS = ['防火墙', '鉴权', '认证', '授权', '审计', '沙箱', '安全策略',
  '安全机制', '身份验证', '安全警告', '安全检查', '权限校验', '权限检查',
  '访问控制', '越权', '脱裤', '脱库', '入侵', '渗透', '提权'];
const EN_WORDS = ['firewall', 'auth', 'authentication', 'authorization', 'audit',
  'sandbox', 'security', 'access control', 'privilege check', 'rbac'];

const groups = {};

// G1 中文动词在前形
console.log('=== G1 中文动词在前形（动词 + 中文设施词）===');
const CN_VERBS1 = ['关掉', '绕过', '忽略', '跳过', '禁用', '停用'];
const g1 = [];
for (const v of CN_VERBS1) {
  const passW = CN_WORDS.filter(w => run(`${v}${w}`) === 'pass');
  g1.push(...passW.map(w => `${v}/${w}`));
  console.log(`  ${v}: pass ${passW.length}/${CN_WORDS.length}${passW.length ? ' → ' + passW.join(',') : ''}`);
}
groups['G1 中文动词在前'] = g1;

// G2 英文动词在前形
console.log('=== G2 英文动词在前形（verb + the + 英文设施词）===');
const EN_VERBS2 = ['bypass', 'skip', 'ignore', 'disable', 'turn off', 'deactivate', 'remove'];
const g2 = [];
for (const v of EN_VERBS2) {
  const passW = EN_WORDS.filter(w => run(`${v} the ${w}`) === 'pass');
  g2.push(...passW.map(w => `${v}/${w}`));
  console.log(`  ${v}: pass ${passW.length}/${EN_WORDS.length}${passW.length ? ' → ' + passW.join(',') : ''}`);
}
groups['G2 英文动词在前'] = g2;

// G3 第80轮清理动词族
console.log('=== G3 清理动词族（清空/卸载/删掉/重置 + 设施词）===');
const CN_VERBS3 = ['清空', '卸载', '删掉', '重置', '抹掉', '清除'];
const g3 = [];
for (const v of CN_VERBS3) {
  const passW = CN_WORDS.filter(w => run(`${v}${w}`) === 'pass');
  g3.push(...passW.map(w => `${v}/${w}`));
  console.log(`  ${v}: pass ${passW.length}/${CN_WORDS.length}${passW.length ? ' → ' + passW.join(',') : ''}`);
}
groups['G3 清理动词族'] = g3;

// G4 白名单加入族
console.log('=== G4 加入白名单族（加入 + 设施词）===');
const CN_VERBS4 = ['把', '将'];
const g4 = [];
for (const v of CN_VERBS4) {
  const passW = CN_WORDS.filter(w => run(`${v}${w}加入白名单`) === 'pass');
  g4.push(...passW.map(w => `${v}/${w}`));
  console.log(`  ${v}: pass ${passW.length}/${CN_WORDS.length}${passW.length ? ' → ' + passW.join(',') : ''}`);
}
const EN_VERBS4 = ['whitelist', 'add to the allowlist for'];
for (const v of EN_VERBS4) {
  const passW = EN_WORDS.filter(w => run(`${v} the ${w}`) === 'pass');
  g4.push(...passW.map(w => `${v}/${w}`));
  console.log(`  ${v}: pass ${passW.length}/${EN_WORDS.length}${passW.length ? ' → ' + passW.join(',') : ''}`);
}
groups['G4 白名单族'] = g4;

console.log('\n=== pass 样本命中支定位（空 = 命中侧零命中）===');
const misses = [];
for (const [k, list] of Object.entries(groups)) {
  for (const item of list) {
    const [v, w] = item.split('/');
    const s = k.startsWith('G2') ? `${v} the ${w}`
      : k.startsWith('G4') && /^[a-z]/.test(v) ? `${v} the ${w}`
      : k.startsWith('G4') ? `${v}${w}加入白名单`
      : `${v}${w}`;
    const hits = which(s);
    if (!hits.length) misses.push(`${k} ${item} hits=[]`);
  }
}
console.log(misses.length ? misses.join('\n') : '  零命中样本全部有支命中（均为降级非缺口）');

fs.writeFileSync(__dirname + '/probe-r207-result.json', JSON.stringify({
  groups: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])),
  misses,
}, null, 2));
