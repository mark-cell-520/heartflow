#!/usr/bin/env node
/**
 * round-353 probe-3：被放过探针的逐层归因（只报数字，不回显原文）
 *
 * 对每条被放过的探针，直调各维度的 check* 函数，看 count/score，
 * 判定缺口在哪一层：
 *   - check* count=0      → 判据形状缺口（正则没覆盖这个族）
 *   - check* count>0 但 score=0 → 判据强度缺口（被后处理清零）
 *   - check* count>0 但 gate pass → findings 门槛/gate 集合缺口
 */
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));

const scanSrc = fs.readFileSync(path.join(ROOT, 'scripts/dimension-coverage-scan.js'), 'utf8');
const PROBES = {};
const pm = scanSrc.match(/const PROBES = \{([\s\S]*?)\n\};/);
if (pm) {
  const lineRe = /^\s*([a-z_]+):\s*\[(.*)\],?$/gm;
  let lm;
  while ((lm = lineRe.exec(pm[1])) !== null) {
    PROBES[lm[1]] = (lm[2].match(/'[^']*'/g) || []).map(s => s.slice(1, -1));
  }
}
const detail = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'round-353-gatemiss.json'), 'utf8'));
const passRows = detail.rows.filter(r => r.action === 'pass');

// 从 index.js 源码取函数体太脆，改用运行时 require 内部函数：
// 这些函数未导出，所以用「差值法」——构造一个只含目标词的最小串，看是否命中
// 但因需保原文形状，改用另一条路：直接在进程内 eval 出 index.js 的模块作用域
const idxMod = require(path.join(ROOT, 'src/index.js'));
console.log('index.js 导出键数:', Object.keys(idxMod).length);

// index.js 的 check* 未导出於模块对象，改用 monkey-patch require 缓存的方式：
// 读源码，取出目标函数定义，在 vm 里执行
const vm = require('vm');
const src = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');

function extractFn(name) {
  const start = src.indexOf('function ' + name + '(');
  if (start < 0) return null;
  // 花括号配平
  let i = src.indexOf('{', start), depth = 0, end = -1;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) { end = j; break; } }
  }
  return src.slice(start, end + 1);
}

// 目标维度对应的 check 函数名
const FNS = {
  emotional_manipulation: 'checkEmotionalManipulation',
  presupposition: 'checkPresupposition',
  tone_policing: 'checkTonePolicing',
  stereotype: 'checkStereotype',
};

// 依赖的模式表也要一起提取
const TABLES = ['EM_MANIPULATION_PATTERNS', 'PRESUPPOSITION_PATTERNS', 'TONE_POLICING_PATTERNS',
  'STEREOTYPE_PATTERNS', 'STER_GROUP_ZH', 'STER_GROUP_EN', 'STER_INNATE_ZH', 'STER_INNATE_EN',
  'STER_DEROG_ZH', 'STER_DEROG_EN', 'STER_ESSENCE_ZH', 'STER_CONTRAST'];

function buildFn(name) {
  let ctx = {};
  const seen = new Set();
  const parts = [];
  for (const t of TABLES) {
    // 同一常量在源码中可能多次声明（如 STER_GROUP_ZH 的数组形式与字面量形式），
    // 只取第一次声明，避免 vm 上下文中重复声明报错
    if (seen.has(t)) continue;
    seen.add(t);
    const start = src.indexOf('const ' + t + ' =');
    if (start < 0) continue;
    // 数组表以 '[' 收，对象表以 '{' 收，分别配平
    const isArray = /^const \w+ = \[/.test(src.slice(start, start + 30));
    const open = isArray ? '[' : '{';
    const close = isArray ? ']' : '}';
    let i = src.indexOf(open, start), depth = 0, end = -1;
    for (let j = i; j < src.length; j++) {
      if (src[j] === open) depth++;
      else if (src[j] === close) { depth--; if (depth === 0) { end = j; break; } }
    }
    if (end > 0) parts.push(src.slice(start, end + 1));
  }
  const fnSrc = extractFn(name);
  if (!fnSrc) return null;
  // checkStereotype 调用子函数 stereotypeInnateDerog，一并提取
  let extra = '';
  if (name === 'checkStereotype') {
    const sub = extractFn('stereotypeInnateDerog');
    if (sub) extra = '\n' + sub;
  }
  const wrapper = parts.join('\n') + '\n' + fnSrc + extra + '\nmodule.exports = ' + name + ';';
  try {
    const mod = { exports: {} };
    // 放在函数体内执行，return 合法
    return vm.runInNewContext('(function(module){\n' + wrapper + '\nreturn module.exports;\n})', {}, { timeout: 5000 })(mod);
  } catch (e) {
    console.log('提取失败 ' + name + ': ' + e.message);
    return null;
  }
}

console.log('\n逐层归因（被放过的探针）：');
console.log('维度'.padEnd(24) + '#   动作    check_count  check_score  缺口定位');
console.log('─'.repeat(78));
const report = [];
for (const row of passRows) {
  const fnName = FNS[row.dim];
  let layer = '?';
  if (!fnName) { layer = '无对应 check 函数（模块判据）'; console.log(row.dim.padEnd(24) + '#' + row.idx + '  pass   —模块判据—'); continue; }
  const fn = buildFn(fnName);
  if (!fn) { console.log(row.dim.padEnd(24) + '#' + row.idx + '  pass   提取失败'); continue; }
  const probe = (PROBES[row.dim] || [])[row.idx];
  const r = fn(probe);
  const cnt = r.count || 0;
  const sc = r.score || 0;
  layer = cnt === 0 ? '判据形状缺口（count=0）'
    : (sc === 0 ? '判据强度缺口（count>0 但 score=0）'
      : 'gate/findings 缺口（check 有分但 gate 放行）');
  console.log(row.dim.padEnd(24) + '#' + row.idx + '  pass   ' + String(cnt).padStart(6) + '   ' + sc.toFixed(2).padStart(6) + '   ' + layer);
  report.push({ dim: row.dim, idx: row.idx, count: cnt, score: sc, layer });
}
fs.writeFileSync(path.join(ROOT, 'data', 'round-353-layer-attribution.json'), JSON.stringify(report, null, 2));
console.log('\n已写入 data/round-353-layer-attribution.json');
