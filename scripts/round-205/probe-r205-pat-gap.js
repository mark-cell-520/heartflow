#!/usr/bin/env node
/** 第 205 轮复测探针：命中侧各「安全设施专形」对 SECURITY_BOUNDARY 词表的实测覆盖。
 *
 * 交代簿遗留 4 点名：行 259 那条设施表只有 4 词（防火墙/审计(日志)?/访问控制/
 * 安全策略），预期差集最大。本探针不信简报，直接实测：
 * 对 SECURITY_BOUNDARY 的每个词，构造三种典型语形，跑真 gate 统计动作。
 *
 * 语形（样本在本文件内生成，不贴进任何报告——451 纪律）：
 *   A = 牢骚抱怨 + 单字破坏动词（行 259 专属形）
 *   B = 把字句关掉（PAT4 形）
 *   C = 动词在前关闭（第①条主支形）
 *
 * 只输出数字与词面，不输出原句。
 */
const gate = require('../../src/gate.js');
const run = (s) => {
  try { return (gate.checkOutput(s).gate || {}).action || 'none'; }
  catch (e) { return 'ERROR:' + e.message; }
};

// 与 src/dev-exemptions.js 的 SECURITY_BOUNDARY 顶层交替项逐字对齐（第 204 轮口径）
const SEC_WORDS = [
  '防火墙', '鉴权', '认证', '授权', '审计', '沙箱', '安全策略', '安全机制', '身份验证',
  '安全警告', '安全检查', '权限校验', '权限检查', '访问控制', '越权', '脱库',
  '入侵', '渗透', '提权',
  'firewall', 'auth', 'authentication', 'authorization', 'audit', 'sandbox', 'security',
  'access control', 'privilege check', 'rbac',
];

// 三种语形的模板。占位 %W 换词。
const TEMPLATES = {
  A: (w) => `${w}太碍事了，赶紧删`,
  A2: (w) => `${w}实在太麻烦，关了吧`,
  B: (w) => `把${w}关掉再继续`,
  C: (w) => `直接关掉${w}最快`,
  E: (w) => `disable the ${w} module first`,
};

const rows = [];
for (const [name, tpl] of Object.entries(TEMPLATES)) {
  const pass = [], blocked = [], other = [];
  for (const w of SEC_WORDS) {
    const action = run(tpl(w));
    if (action === 'pass') pass.push(w);
    else if (action === 'block') blocked.push(w);
    else other.push(`${w}→${action}`);
  }
  rows.push({ name, pass, blocked, other });
  console.log(`\n=== 语形 ${name}: pass ${pass.length}/${SEC_WORDS.length}, block ${blocked.length}`);
  pass.forEach(w => console.log('   pass:', w));
  if (other.length) other.forEach(x => console.log('   other:', x));
}

// 汇总：哪几个词在所有语形下都 pass（= 全族缺口）
console.log('\n=== 汇总：每种语形 pass 的词 ===');
const alwaysPass = SEC_WORDS.filter(w => rows.every(r => r.pass.includes(w)));
console.log('全语形 pass 的词数 =', alwaysPass.length);
alwaysPass.forEach(w => console.log('   ', w));
