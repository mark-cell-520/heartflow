#!/usr/bin/env node
/** 第 205 轮探针：拉出 DANGEROUS_PATTERNS 本体，逐条试打点，确认样本命中序号。
 * 只报序号与动作，不贴原句（451 纪律）。 */
const fs = require('fs');
const path = require('path');
const gate = require('../../src/gate.js');

const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'dangerous-instruction.js'), 'utf8');
const lines = src.split('\n');
const start = lines.findIndex(l => l.startsWith('const DANGEROUS_PATTERNS = ['));
if (start < 0) throw new Error('找不到 DANGEROUS_PATTERNS');
let end = -1;
for (let i = start + 1; i < lines.length; i++) {
  if (/^\];/.test(lines[i])) { end = i; break; }
}
const body = lines.slice(start + 1, end).join('\n');
const PATTERNS = new Function('"use strict";return [' + body + '];')();
console.log('DANGEROUS_PATTERNS 条数 =', PATTERNS.length);

const run = (s) => (gate.checkOutput(s).gate || {}).action || 'none';
const which = (s) => PATTERNS.map((p, i) => (p.test(s) ? i : -1)).filter(i => i >= 0);

const W = '防火墙';
const CASES = [
  ['A1 无副词 + 删',      `${W}太碍事了，删`],
  ['A0 副词=赶紧 + 删',   `${W}太碍事了，赶紧删`],
  ['A4 副词=先 + 关掉',   `${W}太碍事了，先关掉`],
  ['A5 副词=直接 + 卸载', `${W}太碍事了，直接卸载`],
  ['PAT4-1 把 鉴权 关掉',   '把鉴权关掉'],
  ['PAT4-2 把 沙箱 关掉',   '把沙箱关掉'],
  ['PAT4-3 把 越权 关掉',   '把越权关掉'],
  ['PAT4-4 把 提权 关掉',   '把提权关掉'],
  ['PAT4-5 把 安全检查 关掉', '把安全检查关掉'],
  ['PAT4-6 把 身份验证 关掉', '把身份验证关掉'],
  ['PAT4-7 把 权限检查 关掉', '把权限检查关掉'],
  ['PAT4-8 把 安全机制 关掉', '把安全机制关掉'],
  ['PAT4-9 把 入侵 关掉',    '把入侵关掉'],
  ['PAT4-10 把 渗透 关掉',   '把渗透关掉'],
  ['PAT4-11 把 脱库 关掉',   '把脱库关掉'],
  ['PAT4-12 把 安全警告 关掉', '把安全警告关掉'],
];
for (const [name, s] of CASES) {
  console.log(`${name}: gate=${run(s)} 命中序号=${JSON.stringify(which(s))}`);
}

console.log('\n--- 行259 专形（idx=' + which('防火墙太碍事了，删') + '）源文本 ---');
console.log(String(PATTERNS[which('防火墙太碍事了，删')[0]]));
