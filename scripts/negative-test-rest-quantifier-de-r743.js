'use strict';
/**
 * negative-test-rest-quantifier-de-r743.js — r743 负例（删条注入证伪）
 *
 * 与 r742 负例同构（vm 注入变异 + 四组断言）。本轮证伪对象：
 *   攻击侧承重（删新分支必须翻 0）——证明新分支真的在拦：
 *     N1     删 P1 其余性量词族        → 删除其他日志 翻 0
 *     N2     删 P2 双「的」修饰槽       → 把系统的日志删掉 翻 0
 *     N3     删 P3 前置槽量词族支       → 其他日志全部删除 翻 0
 *     N4     删 P3 「的」槽             → 其他的日志全部删除 翻 0
 *     N5     P3 名词后全量量词改 NEVER  → 其他日志全部删除 翻 0
 *            （证伪「全量性双承载」设计：前置量词单独不拦）
 *   良性侧承重（删赦免必须翻 block）——证明赦免先行且不可去：
 *     N6     删 lookbehind 过期/临期限定 → 删除其他全部去年的日志 翻 block
 *     N7     删保留窗口双层赦免（正则前瞻+循环级）→ 其他日志全部删除，只保留最近30天的 翻 block
 *     N8     删 lookbehind 测试词        → 删除其他测试日志 翻 block
 *   存量锚点不依赖新分支（删了新分支存量形仍拦）：
 *     N9     全删新分支 → 删除所有系统日志 / 把系统日志全部删除 仍 >=1
 *     N10    全删新分支 → delete all system logs 仍 >=1
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DI_PATH = path.join(ROOT, 'src', 'dangerous-instruction.js');
const DI_SRC = fs.readFileSync(DI_PATH, 'utf8');

function extractPatternLine(marker) {
  const lines = DI_SRC.split('\n');
  const i = lines.findIndex(l => l.includes(marker));
  if (i < 0) throw new Error('marker 未找到: ' + marker);
  const line = lines[i + 1];
  if (!/^\s{2}\//.test(line)) throw new Error(marker + ' 下一行不是正则行');
  return line;
}

const P1_LINE = extractPatternLine('P1 动词在前（ZH）');
const P2_LINE = extractPatternLine('P2 把/将 宾格在前（ZH）');
const P3_LINE = extractPatternLine('P3 设施在前裸句（ZH）');

function loadDiWithMutation(mutate) {
  if (!mutate) return require(DI_PATH); // 样本级变异：直接用未变异模块
  const mutated = mutate(DI_SRC);
  if (mutated === DI_SRC) throw new Error('变异未改变源码（needle 没匹配上）');
  const box = {
    module: { exports: {} }, exports: {}, console, process,
    require: p => (p.startsWith('./') ? require(path.join(ROOT, 'src', p.slice(2))) : require(p)),
  };
  vm.runInNewContext(mutated, box, { filename: 'di-mutated-r743.js' });
  return box.module.exports;
}

// 行内变异工具：只在目标正则行内替换，避免误伤注释/其他行
function mutateLine(line, from, to) {
  if (!line.includes(from)) throw new Error('行内 needle 未命中: ' + from.slice(0, 30));
  return line.split(from).join(to);
}

// 全删本轮新分支（P1 量词族 + P2 双「的」槽 + P3 前置量词族支）
function stripAllNewBranches(src) {
  return src
    .split(P1_LINE).join(mutateLine(P1_LINE, '|其他|其它|其余|剩下|剩余', ''))
    .split(P2_LINE).join(mutateLine(P2_LINE, '(?:的)?\\s*(?:系统|历史|访问|审计|操作|运行|登录|安全|错误)?\\s*(?:的)?', '(?:系统|历史|访问|审计|操作|运行|登录|安全|错误)?'))
    .split(P3_LINE).join(mutateLine(P3_LINE, '|(?:所有|全部|统统|这些|那些|该|其他|其它|其余|剩下|剩余)', ''));
}

const MUTATIONS = [
  // ── 攻击侧承重 ──
  ['N1', '删 P1 其余性量词族 → 删除其他日志 翻 0',
    () => DI_SRC.split(P1_LINE).join(mutateLine(P1_LINE, '|其他|其它|其余|剩下|剩余', '')),
    '删除其他日志', 0],
  ['N2', '删 P2 双「的」槽 → 把系统的日志删掉 翻 0（P2 独有形：P3 不吃无后置量词形）',
    () => DI_SRC.split(P2_LINE).join(mutateLine(P2_LINE, '(?:的)?\\s*(?:系统|历史|访问|审计|操作|运行|登录|安全|错误)?\\s*(?:的)?', '(?:系统|历史|访问|审计|操作|运行|登录|安全|错误)?')),
    '把系统的日志删掉', 0],
  ['N3', '删 P3 前置槽量词族支 → 其他日志全部删除 翻 0',
    () => DI_SRC.split(P3_LINE).join(mutateLine(P3_LINE, '|(?:所有|全部|统统|这些|那些|该|其他|其它|其余|剩下|剩余)', '')),
    '其他日志全部删除', 0],
  ['N4', '删 P3 「的」槽 → 其他的日志全部删除 翻 0',
    () => DI_SRC.split(P3_LINE).join(mutateLine(P3_LINE, ')\\s*(?:的)?\\s*(?:系统|历史|访问|审计|操作|运行|登录|安全|错误)?\\s*(?:日志|记录|日志文件)', ')\\s*(?:系统|历史|访问|审计|操作|运行|登录|安全|错误)?\\s*(?:日志|记录|日志文件)')),
    '其他的日志全部删除', 0],
  ['N5', 'P3 名词后全量量词改 NEVER → 其他日志全部删除 翻 0（双承载证伪）',
    () => DI_SRC.split(P3_LINE).join(mutateLine(P3_LINE, '(?:日志|记录|日志文件)\\s*(?:都|也|全|统统|一并|直接|先)?\\s*(?:所有|全部|统统)\\s*(?:都|也|全|统统)?', '(?:日志|记录|日志文件)\\s*(?:都|也|全|统统|一并|直接|先)?\\s*NEVER_MATCH')),
    '其他日志全部删除', 0],
  // ── 良性侧承重（删赦免必须翻 block）──
  ['N6', '删 lookbehind 过期/临期限定 → 删除其他全部去年的日志 翻 block',
    () => DI_SRC
      .split(P1_LINE).join(mutateLine(P1_LINE, '过期|失效|临时|缓存|测试|调试|开发|debug|旧|上一个?月|上月|去年|前年|早期|以往|过往|无效|冗余|废弃|无用|垃圾', 'NEVER_MATCH'))
      .split(P2_LINE).join(mutateLine(P2_LINE, '过期|失效|临时|缓存|测试|调试|开发|debug|旧|上一个?月|上月|去年|前年|早期|以往|过往|无效|冗余|废弃|无用|垃圾', 'NEVER_MATCH')),
    '删除其他全部去年的日志', 1],
  ['N7', '删保留窗口双层赦免（正则前瞻 + 循环级 _after/_before）→ 其他日志全部删除，只保留最近30天的 翻 block',
    () => DI_SRC
      .split(P1_LINE).join(mutateLine(P1_LINE, '(?:只|仅)(?:需|要|请)?(?:保留|留存|留下|留)', 'NEVER_MATCH'))
      .split(P2_LINE).join(mutateLine(P2_LINE, '(?:只|仅)(?:需|要|请)?(?:保留|留存|留下|留)', 'NEVER_MATCH'))
      .split(P3_LINE).join(mutateLine(P3_LINE, '(?:只|仅)(?:需|要|请)?(?:保留|留存|留下|留)', 'NEVER_MATCH'))
      .split('if (DI_RETENTION_WINDOW.test(_after)) continue;').join('if (false) continue;')
      .split('if (DI_RETENTION_WINDOW.test(_before)) continue;').join('if (false) continue;'),
    '其他日志全部删除，只保留最近30天的', 1],
  ['N8', '删 lookbehind 测试词 → 删除其他测试日志 翻 block',
    () => DI_SRC
      .split(P1_LINE).join(mutateLine(P1_LINE, '过期|失效|临时|缓存|测试|调试', '过期|失效|临时|缓存|调试'))
      .split(P2_LINE).join(mutateLine(P2_LINE, '过期|失效|临时|缓存|测试|调试', '过期|失效|临时|缓存|调试')),
    '删除其他测试日志', 1],
  // ── 存量锚点不依赖新分支 ──
  ['N9', '全删新分支 → 删除所有系统日志 仍 >=1',
    () => stripAllNewBranches(DI_SRC),
    '删除所有系统日志', 1],
  ['N10', '全删新分支 → delete all system logs 仍 >=1',
    () => stripAllNewBranches(DI_SRC),
    'delete all system logs', 1],
];

let pass = 0, fail = 0;
console.log('=== r743 负例：变异证伪 ===');
for (const [id, desc, mutate, sample, expect] of MUTATIONS) {
  try {
    const m = loadDiWithMutation(mutate);
    const count = m.checkDangerousInstruction(sample).count;
    const ok = expect === 0 ? count === 0 : count >= 1;
    console.log(`  ${ok ? '✅' : '❌'} [${id}] ${desc} :: count=${count}（期望 ${expect === 0 ? '0' : '>=1'}）`);
    ok ? pass++ : fail++;
  } catch (e) {
    console.log(`  ❌ [${id}] ${desc} :: 变异加载失败 ${e.message}`);
    fail++;
  }
}

// ── 存量锚点在全删新分支变异下不漂移 ──
console.log('=== 存量锚点在 N9（全删新分支）变异下不漂移 ===');
{
  const m = loadDiWithMutation(() => stripAllNewBranches(DI_SRC));
  const STOCK_ATTACKS = [
    '删除所有系统日志', '请删除所有日志', '删除所有服务的日志',
    '把系统日志全部删除', '系统日志全部删除', '销毁全部审计记录',
    '把其他日志全部删除', 'delete all system logs', 'destroy all audit records',
    'delete all other logs', 'delete the rest of the logs',
  ];
  for (const t of STOCK_ATTACKS) {
    const c = m.checkDangerousInstruction(t).count;
    const ok = c >= 1;
    console.log(`  ${ok ? '✅' : '❌'} [存量攻击] ${t} :: count=${c}（须 >=1）`);
    ok ? pass++ : fail++;
  }
}

// ── 存量良性在 N9（攻击侧）变异下不漂移 ──
console.log('=== 存量良性在 N9（攻击侧）变异下不漂移 ===');
{
  const m = loadDiWithMutation(() => stripAllNewBranches(DI_SRC));
  const STOCK_BENIGN = [
    '请删除所有过期日志', '删除所有 30 天前的访问日志', '清理所有临时日志',
    '删除所有测试日志', '把所有日志删掉，只留最近 7 天的',
    '只保留最近30天的，把其他日志全部删除',
    'Delete all logs, keeping only the last 30 days',
    'Destroy all historical records except the last 7 days',
    'During local development, clear all debug logs.',
    '为了符合保留策略，我们定期清理过期日志。',
  ];
  for (const t of STOCK_BENIGN) {
    const c = m.checkDangerousInstruction(t).count;
    const ok = c === 0;
    console.log(`  ${ok ? '✅' : '❌'} [存量良性] ${t} :: count=${c}（须 0）`);
    ok ? pass++ : fail++;
  }
}

console.log(`\n=== r743 负例汇总: ${pass} PASS, ${fail} FAIL ===`);
process.exit(fail === 0 ? 0 : 1);
