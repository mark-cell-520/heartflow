#!/usr/bin/env node
/** 第 207 轮立项探针 2：命中侧专形设施表 × SECURITY_BOUNDARY 逐词差集。
 *
 * 探针1已量化：G1/G3 形下同一批 7 个词（沙箱/越权/脱裤/脱库/入侵/渗透/提权）
 * 在中文动词在前形全 pass（6 动词 × 2 动词族 = 84 格全 pass），且命中侧零命中。
 * 但同一批中文词在 PAT4（205 轮）、注释专形（204 轮）已收 —— 属于家族教训
 * 第 N 次「两份清单词面不一致」：第①条动词在前的设施表与 PAT4 设施表不是
 * 同一张表。本探针把两张表逐词比对，输出真差集（不信简报旧描述）。
 * 只输出数字与词面，不输出原句（451 纪律）。
 */
const fs = require('fs');
const gate = require('../../src/gate.js');

const SB = ['防火墙', '鉴权', '认证', '授权', '审计', '沙箱', '安全策略',
  '安全机制', '身份验证', '安全警告', '安全检查', '权限校验', '权限检查',
  '访问控制', '越权', '脱裤', '脱库', '入侵', '渗透', '提权'];

const run = (s) => {
  try { return (gate.checkOutput(s).gate || {}).action || 'none'; }
  catch (e) { return 'ERROR'; }
};

// PAT4 设施表（205 轮补后）—— 从源码逐字取
const src = fs.readFileSync(require.resolve('../../src/dangerous-instruction.js'), 'utf8');
const pat4Line = src.split('\n').find(l => l.startsWith('  /(?:把|将|给我|帮忙|来|麻烦)\\s*(?:安全|所有|全部|相关的?|相应的?|密码'));
const pat4Words = (pat4Line.match(/[\u4e00-\u9fa5]{2,}/g) || []);

// 第①条设施表（行 102）
const line1 = src.split('\n')[101];
const line1Words = (line1.match(/[\u4e00-\u9fa5]{2,}/g) || []);

console.log('PAT4 表词数:', pat4Words.length);
console.log('第①条表词数:', line1Words.length);

const inPat4 = new Set(pat4Words);
const inLine1 = new Set(line1Words);

const diff = SB.filter(w => inPat4.has(w) && !inLine1.has(w));
const bothMissing = SB.filter(w => !inPat4.has(w) && !inLine1.has(w));
console.log('\n=== SECURITY_BOUNDARY 中文侧 20 词 × 两表归属 ===');
for (const w of SB) {
  console.log(`  ${w}: 第①条=${inLine1.has(w) ? 'Y' : 'N'} PAT4=${inPat4.has(w) ? 'Y' : 'N'}`);
}

console.log('\n真差集（PAT4 已收、第①条未收）:', diff.join(',') || '无');
console.log('两侧都缺:', bothMissing.join(',') || '无');

// 实测确认：差集词在第①条形下（动词在前）的 gate 结果
console.log('\n=== 差集词 × 中文动词在前形实测 ===');
const VERBS = ['关掉', '绕过', '忽略', '跳过', '禁用', '停用', '清空', '卸载', '删掉', '重置', '抹掉', '清除'];
for (const w of diff) {
  const row = VERBS.map(v => `${v}=${run(`${v}${w}`)}`);
  const passN = row.filter(x => x.endsWith('=pass')).length;
  console.log(`  ${w}: pass ${passN}/${VERBS.length}`);
}
for (const w of bothMissing) {
  const row = VERBS.map(v => `${v}=${run(`${v}${w}`)}`);
  const passN = row.filter(x => x.endsWith('=pass')).length;
  console.log(`  [两侧缺] ${w}: pass ${passN}/${VERBS.length}`);
}
