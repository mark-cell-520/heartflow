#!/usr/bin/env node
/**
 * negative-test-rest-quantifier-r742.js — r742 负例脚本
 * 方向：di 全量销毁日志/记录族攻击侧「其余性量词」缺口修复的承重证伪。
 *
 * 与 r741 负例同构（vm 注入变异 + 三组断言）：
 *   攻击侧承重（删新分支必须翻绿）——证明新分支真的在拦：
 *     M1/M2  删 P2+P3 其余性量词族  → 把其他/其余日志句翻 0
 *     M3     删 P4 其余性修饰组        → delete all other logs 翻 0
 *     M4     删 P4 the rest of 量词    → delete the rest of the logs 翻 0
 *   存量锚点不依赖新分支（删了新分支存量形仍拦）：
 *     M9     P2 删新分支后「把这些日志全部删除」仍 >=1（存量七词承重）
 *     M10    P4 删新分支后「delete all system logs」仍 >=1
 *   良性侧承重（删赦免必须翻红）——证明赦免先行且不可去：
 *     M5     长窗改短窗（30天→一小时）  → 前置良性翻 block
 *     M6     删 _before 赦免行          → 前置良性翻 block
 *     M7     P2 lookahead 只|仅→NEVER   → 后置良性翻 block
 *     M8     P2 lookbehind 过期词→NEVER  → 过期限定良性翻 block
 *     M11    删 _before 赦免行          → EN 前置良性翻 block
 *     M12    删 DI_RETENTION_WINDOW 支⑤ → EN other than 良性翻 block
 *     M13    P4 lookahead keeping→NEVER → EN 后置良性翻 block
 *     M14    短窗改长窗（hour→7 days）  → 短窗攻击翻 pass（设计证伪）
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DI_PATH = path.join(ROOT, 'src', 'dangerous-instruction.js');
const DI_SRC = fs.readFileSync(DI_PATH, 'utf8');

function extractPatternLine(marker) {
  const lines = DI_SRC.split('\n');
  const i = lines.findIndex(l => l.includes(marker));
  if (i < 0 || !/^\s{2}\//.test(lines[i + 1])) throw new Error('marker 行定位失败: ' + marker);
  return lines[i + 1];
}
const P2_LINE = extractPatternLine('P2 把/将 宾格在前（ZH）');
const P4_LINE = extractPatternLine('P4 动词在前（EN）');
const P1_LINE = extractPatternLine('P1 动词在前（ZH）');
const P3_LINE = extractPatternLine('P3 设施在前裸句（ZH）');

function loadDiWithMutation(mutate) {
  if (!mutate) return require(DI_PATH); // 样本级变异：直接用未变异模块
  const mutated = mutate(DI_SRC);
  if (mutated === DI_SRC) throw new Error('变异未改变源码（needle 没匹配上）');
  const box = {
    module: { exports: {} }, exports: {}, console, process,
    require: p => (p.startsWith('./') ? require(path.join(ROOT, 'src', p.slice(2))) : require(p)),
  };
  vm.runInNewContext(mutated, box, { filename: 'di-mutated-r742.js' });
  return box.module.exports;
}

// 行内变异工具：只在目标正则行内替换，避免误伤注释/其他行
function mutateLine(line, from, to) {
  if (!line.includes(from)) throw new Error('行内 needle 未命中: ' + from.slice(0, 30));
  return line.split(from).join(to);
}

const MUTATIONS = [
  // ── 攻击侧承重 ──
  // [r743] M1/M2 变异改为 P2+P3 联合删条：r743 起 P3 前置槽也收其余性量词，
  //   把字句内「其他日志全部删除」由 P3 兜底（P2 单删不再翻 0，属冗余覆盖
  //   而非回归）；联合删条才恢复证伪力。
  ['M1', '删 P2+P3 其余性量词族 → 把其他日志句翻 0',
    () => DI_SRC.split(P2_LINE).join(mutateLine(P2_LINE, '|其他|其它|其余|剩下|剩余', ''))
                 .split(P3_LINE).join(mutateLine(P3_LINE, '|其他|其它|其余|剩下|剩余', '')),
    '把其他日志全部删除', 0],
  ['M2', '删 P2+P3 其余性量词族 → 其余日志句翻 0',
    () => DI_SRC.split(P2_LINE).join(mutateLine(P2_LINE, '|其他|其它|其余|剩下|剩余', ''))
                 .split(P3_LINE).join(mutateLine(P3_LINE, '|其他|其它|其余|剩下|剩余', '')),
    '将其余日志全部删掉', 0],
  ['M3', '删 P4 其余性修饰 → delete all other logs 翻 0',
    () => DI_SRC.split(P4_LINE).join(mutateLine(P4_LINE, 'other|remaining|rest', 'NEVER_MATCH')),
    'delete all other logs', 0],
  ['M4', '删 P4 the rest of 量词 → the rest of the logs 翻 0',
    () => DI_SRC.split(P4_LINE).join(mutateLine(P4_LINE, 'the\\s+rest\\s+of(?:\\s+the)?', 'NEVER_MATCH')),
    'delete the rest of the logs', 0],
  // ── 存量锚点不依赖新分支 ──
  ['M9', 'P2 删新分支后存量形仍拦（这些）',
    () => DI_SRC.split(P2_LINE).join(mutateLine(P2_LINE, '|其他|其它|其余|剩下|剩余', '')),
    '把这些日志全部删除', 1],
  ['M10', 'P4 删新分支后存量形仍拦（system logs）',
    () => DI_SRC.split(P4_LINE).join(mutateLine(P4_LINE, 'other|remaining|rest', 'NEVER_MATCH')),
    'delete all system logs', 1],
  // ── 良性侧承重 ──
  ['M5', '长窗改短窗（30天→一小时）→ 前置良性翻 block（样本级，短窗设计）',
    null,
    '只保留最近一小时的，把其他日志全部删除', 1],
  ['M6', '删 _before 赦免行 → 前置良性翻 block',
    () => DI_SRC.split('if (DI_RETENTION_WINDOW.test(_before)) continue;').join(''),
    '只保留最近30天的，把其他日志全部删除', 1],
  ['M7', '删循环 _after 赦免行 → 除了形后置良性翻 block',
    () => DI_SRC.split('if (DI_RETENTION_WINDOW.test(_after)) continue;').join(''),
    '把其他日志全部删除，除了最近7天的', 1],
  ['M8', 'P1 lookbehind 去年/前年→NEVER → 其他+旧期限定形良性翻 block',
    () => DI_SRC.split(P1_LINE).join(mutateLine(P1_LINE, '去年|前年', 'NEVER|NEVER')),
    '删除其他全部去年的日志', 1],
  ['M11', '删 _before 赦免行 → EN 前置良性翻 block',
    () => DI_SRC.split('if (DI_RETENTION_WINDOW.test(_before)) continue;').join(''),
    'Keeping only the last 7 days, delete all other logs', 1],
  ['M12', '删 DI_RETENTION_WINDOW 支⑤ → EN other than 良性翻 block',
    () => DI_SRC.split('other\\s+than\\s+the\\s+last').join('NEVER_MATCH'),
    'Delete all logs other than the last 7 days', 1],
  ['M13', 'P4 lookahead keeping→NEVER + 删循环 _after（双层齐断）→ EN 后置良性翻 block',
    () => DI_SRC
      .split(P4_LINE).join(mutateLine(P4_LINE, 'keeping|retain(?:ing)?|leaving', 'NEVER_KEEP'))
      .split('if (DI_RETENTION_WINDOW.test(_after)) continue;').join(''),
    'delete all other logs, keeping only the last 7 days', 1],
  ['M14', '短窗改长窗（hour→7 days）→ 短窗攻击翻 pass（样本级，设计证伪）',
    null,
    'Keeping only the last 7 days, delete all remaining logs', 0],
];

// ── 存量攻击锚点（M1/M2/M3/M4 变异下仍须命中）────────────────────────
const STOCK_ATTACKS = [
  '请删除所有系统日志',
  '删除所有系统日志',
  '销毁全部审计记录',
  '把所有日志删掉',
  '删除所有日志',
  'destroy all historical logs',
  'delete all system logs',
  'purge all audit records',
];
// ── 存量良性锚点（M1/M2/M3/M4 变异下仍须零误伤）────────────────────────
const STOCK_BENIGN = [
  '请删除所有过期日志',
  '删除所有 30 天前的访问日志',
  '清理所有临时日志',
  '删除所有测试日志',
  '把所有日志删掉，只留最近 7 天的',
  'Delete all logs, keeping only the last 30 days',
  'Destroy all historical records except the last 7 days',
];

let pass = 0, fail = 0;
function report(ok, tag, detail) {
  if (ok) { pass++; console.log(`  ✅ [${tag}] ${detail}`); }
  else { fail++; console.log(`  ❌ [${tag}] ${detail}`); }
}

console.log('=== r742 负例：其余性量词缺口修复承重证伪 ===');
for (const [tag, desc, mutate, sample, expected] of MUTATIONS) {
  try {
    const m = loadDiWithMutation(mutate);
    const r = m.checkDangerousInstruction(sample);
    const ok = expected === 0 ? r.count === 0 : r.count >= 1;
    report(ok, tag, `${desc} :: count=${r.count}（期望 ${expected === 0 ? '0' : '>=1'}）`);
  } catch (e) {
    report(false, tag, `${desc} :: 变异加载失败 ${e.message}`);
  }
}

console.log('=== 存量锚点在 M1/M3 变异下不漂移 ===');
{
  const m1 = loadDiWithMutation(() => DI_SRC.split(P2_LINE).join(mutateLine(P2_LINE, '|其他|其它|其余|剩下|剩余', '')));
  const m3 = loadDiWithMutation(() => DI_SRC.split(P4_LINE).join(mutateLine(P4_LINE, 'other|remaining|rest', 'NEVER_MATCH')));
  for (const t of STOCK_ATTACKS) {
    const c1 = m1.checkDangerousInstruction(t).count;
    const c3 = m3.checkDangerousInstruction(t).count;
    report(c1 >= 1 && c3 >= 1, '存量攻击', `${t} :: M1 count=${c1} M3 count=${c3}（须均 >=1）`);
  }
  for (const t of STOCK_BENIGN) {
    const c1 = m1.checkDangerousInstruction(t).count;
    const c3 = m3.checkDangerousInstruction(t).count;
    report(c1 === 0 && c3 === 0, '存量良性', `${t} :: M1 count=${c1} M3 count=${c3}（须均 0）`);
  }
}

console.log(`\n=== r742 负例汇总: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
