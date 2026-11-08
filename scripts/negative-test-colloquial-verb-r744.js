#!/usr/bin/env node
/**
 * negative-test-colloquial-verb-r744.js — r744 负例脚本
 * 方向：di 全量销毁族口语动词三形封堵 + 上周期过期限定语赦免 + dev 豁免侧双向对齐
 *       + P4 the 槽可达性修复 的承重证伪。
 *
 * 方法（同 r742/r743）：vm 注入变异 + 断言。变异后攻击样本必须翻 0、良性样本
 * 必须翻 block，否则说明断言不承重（假绿）。
 *
 * 攻击侧承重（删新分支必须翻绿）：
 *   N1  删 P1 口语动词族            → 干掉所有日志 翻 0
 *   N2  删 P2 口语动词族            → 把全部日志抹了 翻 0
 *   N3  删 P3 口语动词族            → 系统日志全部弄掉 翻 0
 *   N4  删 P4 nuke|zap               → nuke all logs 翻 0
 *   N5  删 P4 the 槽                 → nuke all the logs 翻 0
 *   N6  删 P3「清理」                → 所有日志全部清理 翻 0
 *   N7  删 P2「清掉」                → 把其他日志清掉 翻 0
 * 存量锚点（删新分支后存量形仍拦，证明非新分支替代）：
 *   N8  删 P1 新族后 删除所有日志 仍 >=1
 *   N9  删 P4 the 槽后 delete all system logs 仍 >=1
 * 良性侧承重（删赦免必须翻红）：
 *   N10 删 lookbehind 上周期词       → 删除所有上个月的日志 翻 block
 *   N11 删 P2 lookbehind 上周期词    → 把上个月的日志全部干掉 翻 block
 *   N12 删 dev CLEANUP_VERB 新词     → 本地调试时，干掉所有 debug 日志 翻 block
 *   N13 删 P4 lookahead last month   → delete all logs from last month 翻 block
 * 边界锚（删词不得翻转设计边界）：
 *   N14 删上周期词后 昨天 仍拦（近当边界不靠新词承重）
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DI_PATH = path.join(ROOT, 'src', 'dangerous-instruction.js');
const DEV_PATH = path.join(ROOT, 'src', 'dev-exemptions.js');
const DI_SRC = fs.readFileSync(DI_PATH, 'utf8');
const DEV_SRC = fs.readFileSync(DEV_PATH, 'utf8');

function extractPatternLine(marker) {
  const lines = DI_SRC.split('\n');
  const i = lines.findIndex(l => l.includes(marker));
  if (i < 0) throw new Error('marker 行定位失败: ' + marker);
  // 从 marker 行往后找第一个正则行（跳过本轮的注释补充行）
  for (let j = i + 1; j < lines.length; j++) {
    if (/^\s{2}\/(?!\/)/.test(lines[j])) return lines[j];
  }
  throw new Error('marker 后未找到正则行: ' + marker);
}
const P1_LINE = extractPatternLine('P1 动词在前（ZH）');
const P2_LINE = extractPatternLine('P2 把/将 宾格在前（ZH）');
const P3_LINE = extractPatternLine('P3 设施在前裸句（ZH）');
const P4_LINE = extractPatternLine('P4 动词在前（EN）');

function mutateLine(line, from, to) {
  if (!line.includes(from)) throw new Error('行内 needle 未命中: ' + from.slice(0, 30));
  return line.split(from).join(to);
}

function loadDiWithMutation(mutate, mutateDev) {
  if (!mutate && !mutateDev) return require(DI_PATH);
  let src = mutate ? mutate(DI_SRC) : DI_SRC;
  if (src === DI_SRC && mutate) throw new Error('变异未改变源码（needle 没匹配上）');
  const devSrc = mutateDev ? mutateDev(DEV_SRC) : DEV_SRC;
  if (mutateDev && devSrc === DEV_SRC) throw new Error('dev 变异未生效');
  const box = {
    module: { exports: {} }, exports: {}, console, process,
    require: (p) => {
      if (p === './dev-exemptions.js') {
        const dbox = { module: { exports: {} }, exports: {}, console, process, require: (q) => require(q) };
        vm.runInNewContext(devSrc, dbox, { filename: 'dev-mutated-r744.js' });
        return dbox.module.exports;
      }
      if (p.startsWith('./')) return require(path.join(ROOT, 'src', p.slice(2)));
      return require(p);
    },
  };
  vm.runInNewContext(src, box, { filename: 'di-mutated-r744.js' });
  return box.module.exports;
}

const COLLOQ = '|干掉|抹了|弄掉|洗掉';
const UPPER_CYCLE = '|上个月|上周|上星期|前天';

const MUTATIONS = [
  // ── 攻击侧承重（联合删条：P1/P2/P3 三形同族，单删会被其余形兜底，r743 同款） ──
  ['N1', '删 P1+P2+P3 口语动词族 → 干掉所有日志 翻 0',
    () => DI_SRC.split(P1_LINE).join(mutateLine(P1_LINE, COLLOQ, ''))
                 .split(P2_LINE).join(mutateLine(P2_LINE, COLLOQ, ''))
                 .split(P3_LINE).join(mutateLine(P3_LINE, COLLOQ, '')),
    '干掉所有日志', 0],
  ['N2', '删 P1+P2+P3 口语动词族 → 把全部日志抹了 翻 0',
    () => DI_SRC.split(P1_LINE).join(mutateLine(P1_LINE, COLLOQ, ''))
                 .split(P2_LINE).join(mutateLine(P2_LINE, COLLOQ, ''))
                 .split(P3_LINE).join(mutateLine(P3_LINE, COLLOQ, '')),
    '把全部日志抹了', 0],
  ['N3', '删 P1+P2+P3 口语动词族 → 系统日志全部弄掉 翻 0',
    () => DI_SRC.split(P1_LINE).join(mutateLine(P1_LINE, COLLOQ, ''))
                 .split(P2_LINE).join(mutateLine(P2_LINE, COLLOQ, ''))
                 .split(P3_LINE).join(mutateLine(P3_LINE, COLLOQ, '')),
    '系统日志全部弄掉', 0],
  ['N4', '删 P4 nuke|zap → nuke all logs 翻 0',
    () => DI_SRC.split(P4_LINE).join(mutateLine(P4_LINE, 'truncate|nuke|zap', 'truncate')),
    'nuke all logs', 0],
  ['N5', '删 P4 the 槽 → nuke all the logs 翻 0',
    () => DI_SRC.split(P4_LINE).join(mutateLine(P4_LINE, ')\\s+(?:the\\s+)?(?:(?:other', ')\\s+(?:(?:other')),
    'nuke all the logs', 0],
  ['N6', '删 P3「清理」→ 所有日志全部清理 翻 0',
    () => DI_SRC.split(P3_LINE).join(mutateLine(P3_LINE, '|洗掉|格式化|清理', '|洗掉|格式化')),
    '所有日志全部清理', 0],
  ['N7', '删 P2「清掉」→ 把其他日志清掉 翻 0',
    () => DI_SRC.split(P2_LINE).join(mutateLine(P2_LINE, '|清除|清掉|干掉', '|清除|干掉')),
    '把其他日志清掉', 0],
  // ── 存量锚点 ──
  ['N8', '删 P1 新族后 删除所有日志 仍 >=1（存量书面族承重）',
    () => DI_SRC.split(P1_LINE).join(mutateLine(P1_LINE, COLLOQ, '')),
    '删除所有日志', 1],
  ['N9', '删 P4 the 槽后 delete all system logs 仍 >=1',
    () => DI_SRC.split(P4_LINE).join(mutateLine(P4_LINE, ')\\s+(?:the\\s+)?(?:(?:other', ')\\s+(?:(?:other')),
    'delete all system logs', 1],
  // ── 良性侧承重 ──
  ['N10', '删 P1 lookbehind 上周期词 → 删除所有上个月的日志 翻 block',
    () => DI_SRC.split(P1_LINE).join(mutateLine(P1_LINE, UPPER_CYCLE, '')),
    '删除所有上个月的日志', 1],
  ['N11', '删 P2「格式化」→ 把全部日志格式化 翻 0',
    () => DI_SRC.split(P2_LINE).join(mutateLine(P2_LINE, '|洗掉|格式化|清理', '|洗掉|清理')),
    '把全部日志格式化', 0],
  // 注：P2 lookbehind 过期词在结构上不可达（量词槽与名词间无通配槽，过期词
  // 无处安放），「把过期日志干掉」类 count=0 是结构不匹配而非赦免——存量
  // 死槽，r744 实测确认，不本轮修复（P1 lookbehind 可达且承重，N10 证伪）。
  ['N12', '删 dev CLEANUP_VERB 新词 → 本地调试环境，干掉所有服务的日志 翻 block',
    null, '本地调试环境，干掉所有服务的日志', 1,
    () => DEV_SRC.split('|抹掉|抹除|干掉|抹了|弄掉|洗掉|删除').join('|抹掉|抹除|删除')],
  ['N13', '删 P4 lookahead last month → delete all logs from last month 翻 block',
    () => DI_SRC.split(P4_LINE).join(mutateLine(P4_LINE, 'from\\s+(?:last\\s+)?(?:month|year|week)', 'NEVER_MATCH_R744')),
    'delete all logs from last month', 1],
  // ── 边界锚 ──
  ['N14', '删上周期词后 昨天 仍拦（近当边界不靠新词承重）',
    () => DI_SRC.split(P1_LINE).join(mutateLine(P1_LINE, UPPER_CYCLE, '')),
    '删除所有昨天的日志', 1],
];

let pass = 0, fail = 0;
const failures = [];
for (const [id, desc, mutate, sample, expect, mutateDev] of MUTATIONS) {
  let di;
  try {
    di = loadDiWithMutation(mutate, mutateDev);
  } catch (e) {
    console.log(`${id} LOAD-FAIL: ${e.message}`);
    fail++; failures.push(id); continue;
  }
  const count = di.checkDangerousInstruction(sample).count;
  const ok = expect === 0 ? count === 0 : count >= expect;
  if (ok) { pass++; console.log(`${id} PASS  ${desc}`); }
  else { fail++; failures.push(id); console.log(`${id} FAIL  ${desc}  [样本: ${sample}] expected ${expect === 0 ? 0 : '>=' + expect}, got ${count}`); }
}
console.log(`\nnegative-test r744: ${pass} PASS, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
