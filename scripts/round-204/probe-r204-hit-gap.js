#!/usr/bin/env node
/** 第 204 轮探针 v3：命中侧注释专形设施表 vs 豁免侧 SECURITY_BOUNDARY 的**精确差集**。
   v2 用整行 includes() 判定，被「安全审计 ⊃ 审计」这类子串误判（审计被当成已有）。
   本版把两个正则里最后一个交替组拆成词表后精确比对。
   只报数字与差集词，不贴原句（451 纪律）。 */
const fs = require('fs');
const path = require('path');

const diSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'dangerous-instruction.js'), 'utf8');
const deSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'dev-exemptions.js'), 'utf8');
const diLines = diSrc.split('\n');
const line185 = diLines[184];
const line190 = diLines[189];

// 行 185：动词在前 → 设施表是最后一个 (?:...) 组
// 行 190：设施在前 → 设施表是第一个 (?:...) 组
function lastGroup(line) {
  const m = line.match(/^(.*)\/i,?\s*$/);
  const body = line.trim().replace(/^\/\(/, '(').replace(/\)\/i,?$/, ')');
  // 收集所有非捕获组内容（按深度0 的 (?:...)）
  const groups = [];
  let depth = 0, start = -1;
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '(' && body[i + 1] === '?') { if (depth === 0) start = i; depth++; }
    else if (body[i] === ')' && depth === 1) { groups.push(body.slice(start + 3, i)); depth--; }
    else if (body[i] === '(') depth++;
  }
  return groups;
}
const g185 = lastGroup(line185);
const g190 = lastGroup(line190);
const fac185 = g185[g185.length - 1].split('|').map(s => s.trim()).filter(Boolean);
const fac190 = g190[0].split('|').map(s => s.trim()).filter(Boolean);
console.log('行185 组数 =', g185.length, '设施词数 =', fac185.length);
console.log('行190 组数 =', g190.length, '设施词数 =', fac190.length);

// 豁免侧词表（手工展开 SECURITY_BOUNDARY 的顶层交替项）
const SEC_WORDS = [
  '防火墙', '鉴权', '认证', '授权', '审计', '沙箱', '安全策略', '安全机制', '身份验证',
  '安全警告', '安全检查', '权限校验', '权限检查', '访问控制', '越权', '脱裤', '脱库',
  '入侵', '渗透', '提权',
  'firewall', 'auth', 'authentication', 'authorization', 'audit', 'sandbox', 'security',
  'access control', 'privilege check', 'rbac',
];

// 「auth」在豁免侧是 auth(?:entication|orization)? 的前缀形式，命中侧是裸 auth，
// 词面层面视为命中侧已有 auth 词干 → 只报缺 auth 的扩展形
const norm = (w) => w.toLowerCase().replace(/\s+/g, ' ').trim();
const hasFac = (list, w) => list.some(f => norm(f) === norm(w)
  || (w.length >= 4 && norm(f).startsWith(norm(w))));  // authentication ⊃ auth 干

const gap185 = SEC_WORDS.filter(w => !hasFac(fac185, w));
const gap190 = SEC_WORDS.filter(w => !hasFac(fac190, w));
console.log('--- 行185（设施在前）缺:');
gap185.forEach(w => console.log('   ', w));
console.log('--- 行190（动词在前）缺:');
gap190.forEach(w => console.log('   ', w));

const sameFacTable = JSON.stringify(fac185) === JSON.stringify(fac190);
console.log('两侧设施表完全一致 =', sameFacTable);
if (!sameFacTable) {
  const only190 = fac190.filter(f => !hasFac(fac185, norm(f)));
  const only185 = fac185.filter(f => !hasFac(fac190, norm(f)));
  console.log('  仅行185 有:', only185.join(' | ') || '(无)');
  console.log('  仅行190 有:', only190.join(' | ') || '(无)');
}
