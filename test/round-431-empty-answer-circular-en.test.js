// 第 431 轮：empty_answer 循环重述族英文侧（EMPTY_CIRCULAR_EN）
//
// 背景：r417 补循环重述型空答时只实现了中文支 EMPTY_CIRCULAR_ZH，
//       英文支 EMPTY_CIRCULAR_EN 留下 /(?!x)x/ 恒假空壳（r420 commit
//       f69a9826 带入，至 r428 共 9 轮未还），英文该族全支失活。
//       轮初实测（scripts/round-431-probe-empty-circular-en.js）：
//       攻击 10 条 0/10 命中，9 条 gate=pass 全放。
//
// 形状（均不贴攻击话术原文以外的完整句，样本集中在 test/ 内）：
//   ① because 前后同一词干复现
//   ② 系动词 + 解释介词短语 + 前后同一词干复现
// 分界：良性解释引入新实体/新信息（不重复主词），且本族命中仍走
//       EMPTY_NUMERIC_ZH 数值豁免口径，与中文支同一套闸门。

'use strict';
const assert = require('assert');
const { execFileSync } = require('child_process');
const path = require('path');

const hf = require('../src/gate.js');

// ── 攻击族（期望 empty_answer 命中，gate 非 pass）──────────────────
const ATTACK = [
  'The migration failed because failure is inherent to every migration.',
  'The build is slow because slowness is a property of the build.',
  'The error recurs because recurrence is what errors do here.',
  'The module is fragile because fragility is built into the module.',
  'The system is flaky because flakiness characterizes the system.',
  'The job timed out because timeouts happen on every job run.',
  'The API leaks memory because leakage is an API problem.',
  'The queue backs up because backup is normal for the queue.',
  'The cluster drifts because drift accumulates across the cluster.',
  'The test is red because redness means the test caught itself.',
];

// ── 良性（有实质信息，期望不命中 empty_answer）────────────────────
const BENIGN = [
  'It crashed. No root cause has been identified yet.',
  'The build is slow. Profiling shows the bottleneck is the regex pass.',
  'It is complex. The spec runs to 40 pages with three interacting modes.',
  'The service is flaky. We traced it to the connection pool leaking handles.',
  'It is unreliable. Two of five runs timed out at the network stage.',
  'The build is slow because the regex pass backtracks on nested groups.',
  'The deploy failed because the TLS certificate had expired.',
  'It is slow because dependency resolution takes 40 seconds.',
  'The service is flaky because the pool leaks handles under load.',
  'It fails under load because the allocator is not thread-safe.',
  'The queue backs up because the consumer restarts drop in-flight items.',
  'The test is red because the assertion compares against a stale fixture.',
];

function diag(text) {
  const r = hf.checkOutput(text);
  const dims = (r.findings || []).map(f => f.dimension);
  return { action: r.gate.action, dims, empty: dims.includes('empty_answer') };
}

let pass = 0;
let fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' :: ' + extra : '')); }
}

console.log('── 攻击族命中 ──');
let hits = 0;
const missDetail = [];
for (const t of ATTACK) {
  const d = diag(t);
  if (d.empty) hits++;
  else missDetail.push(d.action + ' dims=' + d.dims.join(','));
}
console.log('  命中 ' + hits + '/' + ATTACK.length + (missDetail.length ? ' 漏出: ' + missDetail.join(' | ') : ''));
check('攻击族全部命中 empty_answer', hits === ATTACK.length, hits + '/' + ATTACK.length);

console.log('── 良性零误伤 ──');
let benignHits = 0;
const fpDetail = [];
for (const t of BENIGN) {
  const d = diag(t);
  if (d.empty) { benignHits++; fpDetail.push(d.action + ' dims=' + d.dims.join(',')); }
}
console.log('  误伤 ' + benignHits + '/' + BENIGN.length + (fpDetail.length ? ' :: ' + fpDetail.join(' | ') : ''));
check('良性集零误伤', benignHits === 0, benignHits + '/' + BENIGN.length);

console.log('── gate 动作 ──');
let gateCaught = 0;
for (const t of ATTACK) if (diag(t).action !== 'pass') gateCaught++;
check('攻击族 gate 全部非 pass', gateCaught === ATTACK.length, gateCaught + '/' + ATTACK.length);

// ── 删条变异：删掉英文判据常量后攻击命中必须下降 ──────────────────
// 用子进程加载改后的 src（父进程 require 缓存会污染 gate.js 内部引用）。
// 变异体必须与 src/ 同目录 —— 里面有 ./pedagogy.js 等相对 require。
// gate.js require('./index.js')，所以同时复制 index.js + gate.js 两份，
// 让 gate 副本指向 index 副本，才能走完整 pipeline。
console.log('── 删条变异守卫（删 EMPTY_CIRCULAR_EN 主体）──');
const SRC = path.join(__dirname, '..', 'src', 'index.js');
const MUT_INDEX = path.join(__dirname, '..', 'src', 'round-431-mutant-index.js');
const MUT_GATE = path.join(__dirname, '..', 'src', 'round-431-mutant-gate.js');
const SAMPLES = path.join(__dirname, 'round-431-en-circular-samples.json');
require('fs').writeFileSync(SAMPLES, JSON.stringify(ATTACK));

function loadMutantHits(mutated) {
  let src = require('fs').readFileSync(SRC, 'utf8');
  const fnStart = src.indexOf('function _emptyCircularEnTest(text) {');
  assert.ok(fnStart > 0, '找不到 _emptyCircularEnTest 定义');
  // 函数体以「}\n」结束 —— 从 fnStart 往后找第一个位于行首的 '}'
  const afterFn = src.indexOf('\n}', fnStart);
  assert.ok(afterFn > fnStart, '找不到函数结束括号');
  const fnEndLine = afterFn + 2;
  if (mutated) {
    src = src.slice(0, fnStart) + 'function _emptyCircularEnTest() { return false; }\n' + src.slice(fnEndLine);
  }
  require('fs').writeFileSync(MUT_INDEX, src);

  let gate = require('fs').readFileSync(path.join(__dirname, '..', 'src', 'gate.js'), 'utf8');
  gate = gate.replace("require('./index.js')", "require('./round-431-mutant-index.js')");
  require('fs').writeFileSync(MUT_GATE, gate);

  const runner = path.join(__dirname, 'round-431-mutant-runner.js');
  const out = execFileSync(process.execPath, [runner], { maxBuffer: 1 << 24, env: Object.assign({}, process.env, { R431_GATE: MUT_GATE, R431_SAMPLES: SAMPLES }) });
  return Number(out.toString().trim());
}

require('fs').writeFileSync(path.join(__dirname, 'round-431-mutant-runner.js'), `
'use strict';
const g = require(process.env.R431_GATE);
const list = require('fs').readFileSync(process.env.R431_SAMPLES, 'utf8');
const gate = typeof g.gate === 'function' ? g.gate : null;
if (!gate) { console.error('mutant has no gate() export; keys=' + Object.keys(g).slice(0,20).join(',')); process.exit(9); }
let h = 0;
for (const t of JSON.parse(list)) {
  const r = gate(t);
  const dims = (r.findings || []).map(f => f.dimension);
  if (dims.includes('empty_answer')) h++;
}
console.log(h);
`);

// 基线：原始文件命中数
const baseHits = loadMutantHits(false);
// 变异：英文支失效
const mutHits = loadMutantHits(true);
console.log('  基线命中 ' + baseHits + '，删条后命中 ' + mutHits);
check('删除英语判据后命中下降', mutHits < baseHits, baseHits + ' -> ' + mutHits);
check('删除英语判据命中归零（该族无其他通道兜底）', mutHits === 0, '残留 ' + mutHits);

// 还原校验：不变体 = 原文件，命中数应与基线一致
const restoredHits = loadMutantHits(false);
check('还原后回到基线', restoredHits === baseHits, baseHits + ' -> ' + restoredHits);

require('fs').unlinkSync(MUT_INDEX);
require('fs').unlinkSync(MUT_GATE);
require('fs').unlinkSync(SAMPLES);
require('fs').unlinkSync(path.join(__dirname, 'round-431-mutant-runner.js'));

console.log('  ── 结果: ' + pass + ' pass / ' + fail + ' fail ──');
if (fail > 0) process.exit(1);
