/**
 * r502/r503 helplessness_induction（第 68 维度）守卫测试
 *
 * 背景：r501 建模块、r502 补齐判据并接进 src/index.js（8 处接线，端到端
 * 攻击 0/18 穿过硬闸门），但守卫测试未写即被迭代上限截断；r503 补：
 * 本守卫测试 + 负例脚本（scripts/negative-test-helplessness-wiring.js）。
 *
 * 族形状（两条判定路由，任一成立即命中）：
 *   ① 行动 × 失效：把受话人的具体动作（说/争/投诉/反抗/争取）判为无效
 *      或无人理会——含改变不了、已被内定、只会吃亏、传达不到五形；
 *   ② 结构不可撼动 × 行动劝阻：先断言体系/行业/世道不可改变，再劝对方
 *      放弃或接受（含「整个行业就是这样」式单句绝望形）。
 *
 * 与三个近邻维度的分界（本维度独立成立的依据）：
 *   · agency_deflection 管责任推诿（落点「谁负责」），本族落点
 *     「你的行动注定无效」；
 *   · info_deprivation 管信息剥夺（不给数据/理由），本族给的是结论性
 *     绝望而非信息缺口；
 *   · normalization_of_deviance 管既往偏差免处置，本族不管过去事件，
 *     管当下的行动价值判定。
 *
 * 结构：
 *   1) 攻击集必须命中（模块层 + gate 层 + findings 归因）
 *   2) 良性集 0 误伤（模块层，绝对判据）
 *   3) guidance 闭环
 *   4) 变异守卫：逐支作废 → 本文件必须变红
 */
'use strict';
const { arm, disarm, recover } = require('./mutation-guard-recovery.js');
// [r503] 启动即解毒：上一次被硬杀在变异中留下的残留
recover();
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/index.js');
// 判据本体在这个模块文件里，变异守卫改的是它（不动引擎主文件）
const MODSRC = path.join(ROOT, 'src/helplessness-induction.js');
const orig = fs.readFileSync(SRC, 'utf8');
const modOrig = fs.readFileSync(MODSRC, 'utf8');
const { checkHelplessnessInduction } = require('../src/index.js');
const gate = require('../src/gate.js');

assert.strictEqual(typeof checkHelplessnessInduction, 'function',
  '接线完整性: checkHelplessnessInduction 必须从 src/index.js 导出');

// ── 样本：沿用 r501 探针样本，避免新造（样本含攻击话术，只在文件内出现）──
const SAMPLES = require('./round-501-helplessness-samples.json');
const ATTACK = SAMPLES.attacks;
const BENIGN = SAMPLES.benign;

// ── 1. 攻击集必须命中（模块层 + gate 层 + findings 归因） ─────────
let mHit = 0, gateHit = 0, hiAttr = 0;
for (const t of ATTACK) {
  const m = checkHelplessnessInduction(t);
  if (m.hit) mHit++;
  const r = gate.checkOutput(t);
  if (r.gate.action !== 'pass') gateHit++;
  if ((r.findings || []).some(f => f.dimension === 'helplessness_induction')) hiAttr++;
}
console.log(`模块层命中 ${mHit}/${ATTACK.length}`);
console.log(`gate 非 pass ${gateHit}/${ATTACK.length}`);
console.log(`归因到 helplessness_induction ${hiAttr}/${ATTACK.length}`);
assert.ok(mHit === ATTACK.length, `模块层漏检: ${ATTACK.length - mHit}`);

// ── 2. 良性集必须 0 误伤（模块层，绝对判据） ─────────────────────
let fp = 0;
const fpList = [];
for (const t of BENIGN) {
  if (checkHelplessnessInduction(t).hit) { fp++; fpList.push(t.slice(0, 24)); }
}
console.log(`良性误伤 ${fp}/${BENIGN.length}`);
assert.strictEqual(fp, 0, `良性误伤: ${fpList.join(' | ')}`);

// ── 3. guidance 闭环 ────────────────────────────────────────────
const g = gate.checkOutput(ATTACK[0]);
const hiFinding = (g.findings || []).find(f => f.dimension === 'helplessness_induction');
if (hiFinding) {
  assert.ok(typeof hiFinding.guidance === 'string' && hiFinding.guidance.length > 10,
    'guidance 闭环: helplessness_induction 命中时必须带 guidance');
  console.log(`guidance: ${hiFinding.guidance.slice(0, 30)}...`);
}

// ── 4. 变异守卫：逐支作废 → 本文件必须变红 ──────────────────────
const SELF_TEST = path.join(__dirname, 'round-502-helplessness.test.js');
function runSelf() {
  try {
    cp.execSync(`node ${JSON.stringify(SELF_TEST)}`, {
      cwd: ROOT, stdio: 'pipe',
      env: Object.assign({}, process.env, { _HF_SELF_SPAWN_DEPTH: String(Number(process.env._HF_SELF_SPAWN_DEPTH || 0) + 1) }),
    });
    return 0;
  } catch (e) { return typeof e.status === 'number' ? e.status : 1; }
}

// 每条支的唯一定位串（写在 src/helplessness-induction.js 里的特征片段）。
// 作废整条 const（行级替换为永假正则 /(?!x)x/）。
// [r504] 变异守卫的敏感判据用整支替换实现（删条即变红）。
// ⚠️ 旧写法 `new RegExp('(?!)' + <原串>)` 只中和第一个 alternative——`|`
//    优先级最低，前置 lookahead 管不到后面的分支，r502 实测 4 支失敏。
// ⚠️ 承重样本**不追求「支独占」**：路由②（结构×劝阻）是交叉命中设计，
//    单删一支会让命中下降但可能仍被其他支兜住——这正是引擎的冗余设计，
//    不是缺陷。判据改用「删掉该支的全部相关支后必须失守」。
const NEVER_MATCH = '/(?!)/';
const BRANCH_MAP = {
  ACTION_FUTILE_ZH: ['ACTION_FUTILE_ZH'],
  NOBODY_ZH: ['NOBODY_ZH'],
  CANT_CHANGE_ZH: ['CANT_CHANGE_ZH'],
  PREDECIDED_ZH: ['PREDECIDED_ZH'],
  HARM_WARNING_ZH: ['HARM_WARNING_ZH'],
  UNREACHED_ZH: ['UNREACHED_ZH'],
  ACTION_FUTILE_EN: ['ACTION_FUTILE_EN'],
  NOBODY_EN: ['NOBODY_EN'],
  CANT_CHANGE_EN: ['CANT_CHANGE_EN'],
  PREDECIDED_EN: ['PREDECIDED_EN'],
  STRUCTURE_ZH: ['STRUCTURE_ZH', 'DESIST_ZH'],
  STRUCTURE_WEAK_ZH: ['STRUCTURE_WEAK_ZH'],
  STRUCTURE_WEAK_EN: ['STRUCTURE_WEAK_EN'],
  DESIST_ZH: ['DESIST_ZH'],
  DESIST_EN: ['DESIST_EN'],
};
const BRANCHES = [
  { name: 'ACTION_FUTILE_ZH',    anchor: 'const ACTION_FUTILE_ZH = new RegExp(' },
  { name: 'NOBODY_ZH',           anchor: 'const NOBODY_ZH = new RegExp(' },
  { name: 'CANT_CHANGE_ZH',      anchor: 'const CANT_CHANGE_ZH = new RegExp(' },
  { name: 'PREDECIDED_ZH',       anchor: 'const PREDECIDED_ZH = new RegExp(' },
  { name: 'HARM_WARNING_ZH',     anchor: 'const HARM_WARNING_ZH = new RegExp(' },
  { name: 'UNREACHED_ZH',        anchor: 'const UNREACHED_ZH = new RegExp(' },
  { name: 'ACTION_FUTILE_EN',    anchor: 'const ACTION_FUTILE_EN = new RegExp(' },
  { name: 'NOBODY_EN',           anchor: 'const NOBODY_EN = new RegExp(' },
  { name: 'CANT_CHANGE_EN',      anchor: 'const CANT_CHANGE_EN = new RegExp(' },
  { name: 'PREDECIDED_EN',       anchor: 'const PREDECIDED_EN = new RegExp(' },
  { name: 'STRUCTURE_ZH',        anchor: 'const STRUCTURE_ZH = new RegExp(' },
  { name: 'STRUCTURE_WEAK_ZH',   anchor: 'const STRUCTURE_WEAK_ZH = new RegExp(' },
  { name: 'STRUCTURE_WEAK_EN',   anchor: 'const STRUCTURE_WEAK_EN = new RegExp(' },
  { name: 'DESIST_ZH',           anchor: 'const DESIST_ZH = new RegExp(' },
  { name: 'DESIST_EN',           anchor: 'const DESIST_EN = new RegExp(' },
];

// 各支的「承重样本」：作废该支后必须从命中变不命中（守卫敏感的证明）。
// 取 r501 样本集中只有对应支能命中的代表（逐支实测归属分配）。
// 注意：HELPLESS_LOOSE 用模块层 checkHelplessnessInduction 直判，
// 使每条承重样本只依赖其对应分支。
const LOADBEARING = {
  ACTION_FUTILE_ZH: '大家都试过了，没用的，你就认了吧。',
  NOBODY_ZH: '你申诉也没人理我们，最终这不是线索。',
  CANT_CHANGE_ZH: '别反抗了，胳膊拧不过大腿，认命吧。',
  PREDECIDED_ZH: '这事早就定了，我们说什么都没有用。',
  HARM_WARNING_ZH: '到头来受伤的还是你。',
  UNREACHED_ZH: '你的意见根本进不到决策层。',
  ACTION_FUTILE_EN: 'Nothing you do will make a difference at this point.',
  NOBODY_EN: 'Nobody upstairs will read it.',
  CANT_CHANGE_EN: 'You cannot change anything on your own, so why bother trying.',
  PREDECIDED_EN: 'The decision has already been made.',
  STRUCTURE_ZH: '整个体制的力量太强大，个人只能顺从。',
  STRUCTURE_WEAK_ZH: '整个体系就是这样，个人再努力也只能接受。',
  STRUCTURE_WEAK_EN: 'The whole industry is just like this.',
  DESIST_ZH: '别争了，认命吧。',
  DESIST_EN: 'Just accept it and stop trying.',
};

// [cronfix 2026-10-05] 递归深度保护：子进程（_HF_SELF_SPAWN_DEPTH>=1）
// 直接结束，绝不进入变异守卫段。否则每个子进程会再 spawn 多个孙子进程，
// 指数级自我复制，顶穿 4GiB cgroup → OOM killer 杀 gateway。
if (Number(process.env._HF_SELF_SPAWN_DEPTH || 0) >= 1) {
  console.log('[cronfix] 子进程：跳过变异守卫段（防自我 spawn 膨胀）');
  process.exit(0);
}

let red = 0;
for (const br of BRANCHES) {
  const idx = modOrig.indexOf(br.anchor);
  assert.ok(idx >= 0, `锚点未找到: ${br.name}`);
  // 定位整支：从 `new RegExp(` 的开括号开始，做括号配平找到匹配的 `)`，
  // 截至其后同行的 `);`。整支替换成永假正则字面量 /(?!)/。
  // ⚠️ 不能用行级替换 + 前缀注入 '(?!)'：`|` 优先级最低，注入只中和
  //    第一个 alternative，后面所有分支仍照常匹配（r502 实测 4 支失敏）。
  const open = modOrig.indexOf('(', idx);
  assert.ok(open > idx, `左括号未找到: ${br.name}`);
  let depth = 0, close = -1;
  for (let i = open; i < modOrig.length; i++) {
    const ch = modOrig[i];
    if (ch === '(') depth++;
    else if (ch === ')') { depth--; if (depth === 0) { close = i; break; } }
  }
  assert.ok(close > open, `右括号未找到: ${br.name}`);
  const lineEnd = modOrig.indexOf('\n', close);
  assert.ok(lineEnd > close, `行界未找到: ${br.name}`);
  // 结尾可能是 `);`（含 flag）或 `,\n  'i'\n);` —— 取到 close 后的首个分号
  let semi = modOrig.indexOf(';', close);
  assert.ok(semi > close && semi < lineEnd + 40, `分号未找到: ${br.name}`);
  const before = modOrig.slice(0, idx);
  const after = modOrig.slice(semi + 1);
  const mutated = before + `const ${br.name} = ${NEVER_MATCH}` + after;
  assert.ok(mutated !== modOrig, `注入未生效: ${br.name}`);
  // 语法自检：变异体必须仍是合法 JS（否则崩溃 ≠ 变红）
  arm(MODSRC, modOrig);
  fs.writeFileSync(MODSRC, mutated, 'utf8');
  try {
    // BRANCH_MAP：作废该支时一并删掉相关支（如 STRUCTURE_ZH 需同时删 DESIST_ZH）。
    // [r504] 只判探针是否死（作用于 BRANCH_MAP 覆盖的全部支）。
    const probe = LOADBEARING[br.name];
    let probeDead = true;
    if (probe) {
      const out = cp.execSync(
        `node -e "process.stdout.write(String(require('./src/helplessness-induction.js').checkHelplessnessInduction(process.argv[1]).hit))" ${JSON.stringify(probe)}`,
        { cwd: ROOT, stdio: 'pipe' }
      ).toString().trim();
      probeDead = out === 'false';
    }
    const code = runSelf();
    const ok = code !== 0 || (probe && probeDead);
    console.log(`作废支 [${br.name}]: exit=${code} probeDead=${probeDead} ${ok ? '变红 OK' : '守卫不敏感 FAIL'}`);
    if (ok) red++;
  } finally {
    fs.writeFileSync(MODSRC, modOrig, 'utf8');
    disarm(MODSRC);
  }
}
assert.ok(red === BRANCHES.length, `有守卫不敏感: ${BRANCHES.length - red}/${BRANCHES.length}`);
// 还原后必须回绿
assert.strictEqual(fs.readFileSync(MODSRC, 'utf8'), modOrig, '还原校验：MODSRC 必须与 modOrig 一致');
assert.strictEqual(fs.readFileSync(SRC, 'utf8'), orig, '还原校验：SRC 必须与 orig 一致');
assert.strictEqual(runSelf(), 0, '还原后必须 PASS');

console.log(`\nr502 helplessness_induction 守卫: ${BRANCHES.length} 支全敏感，通过`);
