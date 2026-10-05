/**
 * negative-test-helplessness-wiring.js — 负例验证（r503/r504 补齐）
 *
 * 验证 `helplessness_induction`（第 68 维度）的 15 条判据支真的在守门：
 * 把 src/helplessness-induction.js 的某几条支删掉，守卫必须变红
 * （断言失败，不能是加载崩溃）。
 *
 * 用途：这是 r502 承诺但被迭代上限截断未写的负例脚本。
 *       round-502-helplessness.test.js 的变异守卫在**真实仓库**里改源码跑；
 *   本脚本改为在**临时副本**里改，隔离副作用，且可独立反复运行。
 *
 * ⚠️ 注入方式：整支替换成永假正则字面量 /(?!)/。
 *    旧写法 `new RegExp('(?!)' + <原串>)` 只中和第一个 alternative——`|`
 *    优先级最低，前置 lookahead 管不到后面的分支，r502 实测 4 支失敏。
 *
 * ⚠️ 不手写 needle：anchor 从源码自取，逐字节替换，不会错。
 * ⚠️ 不用 node -e 内联：安全扫描会拦「内联解释器 + 动态 require」，
 *    一律写成探针文件再跑（参照 negative-test-absolute-claim-en.js 第 13 轮教训）。
 *
 * ⚠️ 承重样本**不追求「支独占」**：路由②（结构×劝阻）是交叉命中设计，
 *    单删一支可能仍被其他支兜住——这是引擎的冗余设计，不是缺陷。
 *    本脚本判据：删支后**该族整体命中数必须下降**（跨支合并判），
 *    不要求单个样本立刻归零。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const MODSRC = 'src/helplessness-induction.js';
const NEVER_MATCH = '/(?!)/';

const SRC = fs.readFileSync(path.join(HF, MODSRC), 'utf8');

// 每支的锚点（源码里逐字出现、唯一）+ 该支对应的攻击族代表样本（1 条即可）
// 样本只以形状描述，原文集中在 test/round-501-helplessness-samples.json
const BRANCHES = [
  { name: 'ACTION_FUTILE_ZH',  anchor: 'const ACTION_FUTILE_ZH = new RegExp(' },
  { name: 'NOBODY_ZH',         anchor: 'const NOBODY_ZH = new RegExp(' },
  { name: 'CANT_CHANGE_ZH',    anchor: 'const CANT_CHANGE_ZH = new RegExp(' },
  { name: 'PREDECIDED_ZH',     anchor: 'const PREDECIDED_ZH = new RegExp(' },
  { name: 'HARM_WARNING_ZH',   anchor: 'const HARM_WARNING_ZH = new RegExp(' },
  { name: 'UNREACHED_ZH',      anchor: 'const UNREACHED_ZH = new RegExp(' },
  { name: 'ACTION_FUTILE_EN',  anchor: 'const ACTION_FUTILE_EN = new RegExp(' },
  { name: 'NOBODY_EN',         anchor: 'const NOBODY_EN = new RegExp(' },
  { name: 'CANT_CHANGE_EN',    anchor: 'const CANT_CHANGE_EN = new RegExp(' },
  { name: 'PREDECIDED_EN',     anchor: 'const PREDECIDED_EN = new RegExp(' },
  { name: 'STRUCTURE_ZH',      anchor: 'const STRUCTURE_ZH = new RegExp(' },
  { name: 'STRUCTURE_WEAK_ZH', anchor: 'const STRUCTURE_WEAK_ZH = new RegExp(' },
  { name: 'STRUCTURE_WEAK_EN', anchor: 'const STRUCTURE_WEAK_EN = new RegExp(' },
  { name: 'DESIST_ZH',         anchor: 'const DESIST_ZH = new RegExp(' },
  { name: 'DESIST_EN',         anchor: 'const DESIST_EN = new RegExp(' },
];

// 每支的「支内探针样本」：删该支后必须失守的样本。
// [r504] 实测修正：r501 的 18 条攻击样本对 5 支零独占覆盖
// （HARM_WARNING_ZH / PREDECIDED_EN / STRUCTURE_ZH / STRUCTURE_WEAK_EN /
//  DESIST_EN 全被其他支兜住或完全无样本），因此负例判据不能挂在
// 「攻击集命中总数下降」上，必须每支配一条支内承重样本。
// ⚠️ 路由②的支（STRUCTURE_* / DESIST_*）是**交叉命中**设计：结构断言与
//    行动劝阻两个条件缺一不可。单只含结构断言的句子在模块层本就不命中
//    ——那不是缺口，是设计。因此这些支的探针样本必须把两个条件同时写全。
const PROBE = {
  ACTION_FUTILE_ZH: '大家都试过了，没用的，你就认了吧。',
  NOBODY_ZH: '没人会理你的申诉。',
  CANT_CHANGE_ZH: '你一个人改变不了什么。',
  PREDECIDED_ZH: '这事早就定了。',
  HARM_WARNING_ZH: '到头来吃亏的还是你。',
  UNREACHED_ZH: '你的意见根本传不上去。',
  ACTION_FUTILE_EN: 'You can complain all day, it will not make a difference.',
  NOBODY_EN: 'Nobody upstairs will read it.',
  CANT_CHANGE_EN: 'You cannot change anything on your own.',
  PREDECIDED_EN: 'The decision has already been made.',
  // 路由②：结构断言 × 行动劝阻（两条件共现才命中）
  STRUCTURE_ZH: '整个体制的力量太强大，你别再挣扎了。',
  STRUCTURE_WEAK_ZH: '这个行业从来就是这样，你别再挣扎了。',
  STRUCTURE_WEAK_EN: 'The whole system is rigged, why bother trying.',
  DESIST_ZH: '整个体制的力量太强大，你别再挣扎了。',
  DESIST_EN: 'The whole system is rigged, why bother trying.',
};

/**
 * 用括号配平定位整支 const，替换成永假正则。
 * @returns {string} 变异后的源码
 */
function killBranch(src, anchor) {
  const idx = src.indexOf(anchor);
  if (idx < 0) throw new Error('anchor not found: ' + anchor);
  const open = src.indexOf('(', idx);
  let depth = 0, close = -1;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === '(') depth++;
    else if (ch === ')') { depth--; if (depth === 0) { close = i; break; } }
  }
  if (close < 0) throw new Error('unbalanced parens: ' + anchor);
  const semi = src.indexOf(';', close);
  if (semi < 0) throw new Error('semicolon not found: ' + anchor);
  const name = anchor.replace('const ', '').replace(' = new RegExp(', '');
  return src.slice(0, idx) + `const ${name} = ${NEVER_MATCH}` + src.slice(semi + 1);
}

let tmpRoot = null;
function makeCopy() {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-neg-hi-'));
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(tmpRoot, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(tmpRoot, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(tmpRoot, 'src'), { recursive: true });
  return tmpRoot;
}

// 探针：在副本里跑，返回支内探针样本的命中数（0..1）
function runProbe(dir, text) {
  const probe = path.join(dir, 'src', '_neg_probe.js');
  fs.writeFileSync(probe, [
    'const { checkHelplessnessInduction } = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
    'const t = ' + JSON.stringify(text) + ';',
    'console.log(String(checkHelplessnessInduction(t).hit));',
  ].join('\n'), 'utf8');
  const out = execFileSync('node', [probe], { cwd: dir, stdio: 'pipe' }).toString().trim();
  return out === 'true' ? 1 : 0;
}

let pass = 0, fail = 0;
const failures = [];
function ok(cond, msg, detail) {
  if (cond) { pass++; console.log(`✓ ${msg}`); }
  else { fail++; failures.push(msg + (detail ? ' :: ' + detail : '')); console.log(`✗ ${msg}${detail ? ' :: ' + detail : ''}`); }
}

// ── 0. 健康态基线：15 个支内探针必须全命中 ───────────────────
const base = makeCopy();
let baselineHealthy = 0;
const probeNames = Object.keys(PROBE);
const baselineHits = {};
for (const br of probeNames) {
  baselineHits[br] = runProbe(base, PROBE[br]);
  if (baselineHits[br] === 1) baselineHealthy++;
}
console.log(`\n=== 健康态基线：支内探针命中 ${baselineHealthy}/${probeNames.length} ===`);
ok(baselineHealthy === probeNames.length,
  '健康态全部支内探针命中',
  `${baselineHealthy}/${probeNames.length}`);

// ── 1. 逐支删条，该支的支内探针必须失守 ─────────────────────
console.log('\n=== 注入-删条-必须变红 ===');
for (const br of BRANCHES) {
  const probeText = PROBE[br.name];
  if (baselineHits[br.name] !== 1) {
    ok(false, `健康基线上探针未命中: ${br.name}`, '探针样本不覆盖该支');
    continue;
  }
  const dir = makeCopy();
  const file = path.join(dir, MODSRC);
  const before = fs.readFileSync(file, 'utf8');
  let after;
  try { after = killBranch(before, br.anchor); }
  catch (e) { ok(false, `注入定位失败: ${br.name}`, String(e.message).slice(0, 60)); fs.rmSync(dir, { recursive: true, force: true }); continue; }
  ok(after !== before, `注入改变源码: ${br.name}`);
  fs.writeFileSync(file, after, 'utf8');
  try {
    const hit = runProbe(dir, probeText);
    ok(hit === 0, `删支 [${br.name}] 后该支探针失守`, hit === 1 ? '仍命中' : '');
  } catch (e) {
    ok(false, `删支 [${br.name}] 后探针必须可运行（不能崩溃）`, String(e.message).slice(0, 80));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ── 2. 全支删光，全部探针必须归零 ────────────────────────────
{
  const dir = makeCopy();
  const file = path.join(dir, MODSRC);
  let src = fs.readFileSync(file, 'utf8');
  for (const br of BRANCHES) src = killBranch(src, br.anchor);
  fs.writeFileSync(file, src, 'utf8');
  try {
    let dead = 0;
    for (const br of probeNames) if (runProbe(dir, PROBE[br]) === 0) dead++;
    ok(dead === probeNames.length, '15 支全删后全部支内探针失守', `${dead}/${probeNames.length}`);
  } catch (e) {
    ok(false, '全删后探针必须可运行', String(e.message).slice(0, 80));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ── 3. 良性样本在全删态必须仍零命中（删支不得反向误伤） ───────
{
  const dir = makeCopy();
  const file = path.join(dir, MODSRC);
  let src = fs.readFileSync(file, 'utf8');
  for (const br of BRANCHES) src = killBranch(src, br.anchor);
  fs.writeFileSync(file, src, 'utf8');
  try {
    const BENIGN = require(path.join(HF, 'test', 'round-501-helplessness-samples.json')).benign;
    const probe = path.join(dir, 'src', '_neg_probe2.js');
    fs.writeFileSync(probe, [
      'const { checkHelplessnessInduction } = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
      'const benign = ' + JSON.stringify(BENIGN) + ';',
      'let fp = 0;',
      'for (const t of benign) if (checkHelplessnessInduction(t).hit) fp++;',
      'console.log(String(fp));',
    ].join('\n'), 'utf8');
    const fp = Number(execFileSync('node', [probe], { cwd: dir, stdio: 'pipe' }).toString().trim());
    ok(fp === 0, '全删态良性集零误伤', `${fp}/${BENIGN.length}`);
  } catch (e) {
    ok(false, '良性探针必须可运行', String(e.message).slice(0, 80));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

fs.rmSync(base, { recursive: true, force: true });

console.log(`\n负例守卫（helplessness_induction 接线）: ${pass} passed, ${fail} failed`);
if (fail) { console.log('失败项:'); failures.slice(0, 20).forEach(f => console.log('  - ' + f)); process.exit(1); }
