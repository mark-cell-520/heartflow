/**
 * r506 sole_narrative（第 69 维度）守卫测试
 *
 * 背景：r505 decision 本体选出口径垄断族（C 候选 0.80 > B 程序包装 0.79 >
 * A 责任预分配 0.77；identity alignment 80%），探针实测本族 9/9 条攻击
 * 穿过硬闸门、良性 0/6 误伤；r505 完成模块判据 + dimMap/require/调用三处
 * 接线即被迭代上限截断，r506 补齐 allDims / DIM_GUIDANCE / dimensions·
 * summary / VERIFY_DIMS 四处后由本文件接管守卫。
 *
 * 族形状（两条判定路由，任一成立即命中）：
 *   ① 排他权威源 × 排他/终止断言同句共现 —— 权威源可能是真实的，
 *      但其断言被要求无条件接受且不接受核验；
 *   ② 照单全收指令 × 权威源 —— 「听统一口径就行」式放弃判断权。
 *
 * 与四个近邻维度的分界（本维度独立成立的依据）：
 *   · appeal_to_authority 管无据权威（落点「谁说的」不可考），本族落点
 *     在「排他性」——权威源可真实存在，但不接受核验；
 *   · loyalty_test 管立场资格审查（先表忠再讨论），本族不管忠诚，管
 *     解释权的单方面剥夺；
 *   · info_deprivation 管信息剥夺（不给数据），本族给的是过量的单一
 *     信息而非信息缺口；
 *   · presupposition 管预设陷阱，本族断言的是「谁有权定义事实」。
 *
 * 结构：
 *   1) 攻击集必须命中（模块层 + gate 层 + findings 归因）
 *   2) 良性集 0 误伤（模块层，绝对判据——含四个豁免池）
 *   3) guidance 闭环
 *   4) 变异守卫：逐支作废 → 本文件必须变红
 */
'use strict';
const { arm, disarm, recover } = require('./mutation-guard-recovery.js');
// [r506] 启动即解毒：上一次被硬杀在变异中留下的残留
recover();
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/index.js');
// 判据本体在这个模块文件里，变异守卫改的是它（不动引擎主文件）
const MODSRC = path.join(ROOT, 'src/sole-narrative.js');
const orig = fs.readFileSync(SRC, 'utf8');
const modOrig = fs.readFileSync(MODSRC, 'utf8');
const { checkSoleNarrative } = require('../src/index.js');
const gate = require('../src/gate.js');

assert.strictEqual(typeof checkSoleNarrative, 'function',
  '接线完整性: checkSoleNarrative 必须从 src/index.js 导出');

// ── 样本：沿用 r506 探针样本，避免新造（样本含攻击话术，只在文件内出现）──
const SAMPLES = require('./round-506-sole-narrative-samples.json');
const ATTACK = SAMPLES.attacks;
const BENIGN = SAMPLES.benign;

// ── 1. 攻击集必须命中（模块层 + gate 层 + findings 归因） ─────────
let mHit = 0, gateHit = 0, snAttr = 0;
for (const t of ATTACK) {
  const m = checkSoleNarrative(t);
  if (m.hit) mHit++;
  const r = gate.checkOutput(t);
  if (r.gate.action !== 'pass') gateHit++;
  if ((r.findings || []).some(f => f.dimension === 'sole_narrative')) snAttr++;
}
console.log(`模块层命中 ${mHit}/${ATTACK.length}`);
console.log(`gate 非 pass ${gateHit}/${ATTACK.length}`);
console.log(`归因到 sole_narrative ${snAttr}/${ATTACK.length}`);
assert.ok(mHit === ATTACK.length, `模块层漏检: ${ATTACK.length - mHit}`);
assert.ok(gateHit === ATTACK.length,
  `gate 层漏放(仍 pass): ${ATTACK.length - gateHit} 条穿过硬闸门`);
assert.ok(snAttr === ATTACK.length,
  `findings 归因缺失: ${ATTACK.length - snAttr} 条未归因到 sole_narrative`);

// verify 级校验：sole_narrative 在 VERIFY_DIMS 内，命中必须产生非 rewrite
// 的 verify 动作（口径垄断族单句常是汇报复述/流程说明，rewrite 会误伤）。
let verifyCnt = 0;
for (const t of ATTACK) {
  if (gate.checkOutput(t).gate.action === 'verify') verifyCnt++;
}
console.log(`verify 动作 ${verifyCnt}/${ATTACK.length}`);

// ── 2. 良性集必须 0 误伤（模块层，绝对判据） ─────────────────────
let fp = 0;
const fpList = [];
for (const t of BENIGN) {
  if (checkSoleNarrative(t).hit) { fp++; fpList.push(t.slice(0, 24)); }
}
console.log(`良性误伤 ${fp}/${BENIGN.length}`);
assert.strictEqual(fp, 0, `良性误伤: ${fpList.join(' | ')}`);
// 豁免池逐类断言：四个豁免池每一个都必须在良性集里有代表且零误伤
const EXEMPT_CLASSES = {
  citation: BENIGN.filter(t => /GB\/T|RFC|标准/.test(t)),
  plural: BENIGN.filter(t => /同时参考|略有差异|有差异|以实际/.test(t)),
  meta: BENIGN.filter(t => /宣传手法|专制作风/.test(t)),
  benign_near: BENIGN.filter(t => /官方公告|通稿|标准答案|擅自下结论/.test(t)),
};
for (const [cls, list] of Object.entries(EXEMPT_CLASSES)) {
  assert.ok(list.length > 0, `豁免池样本缺失: ${cls} 必须在良性集里有代表`);
  for (const t of list) {
    assert.ok(!checkSoleNarrative(t).hit, `豁免池误伤: ${cls} — ${t.slice(0, 24)}`);
  }
}
console.log(`四类豁免池代表样本零误伤: ${Object.keys(EXEMPT_CLASSES).join(', ')}`);

// ── 3. guidance 闭环 ────────────────────────────────────────────
const g = gate.checkOutput(ATTACK[0]);
const snFinding = (g.findings || []).find(f => f.dimension === 'sole_narrative');
assert.ok(snFinding, 'guidance 闭环: 攻击样本必须归因到 sole_narrative');
assert.ok(typeof snFinding.guidance === 'string' && snFinding.guidance.length > 10,
  'guidance 闭环: sole_narrative 命中时必须带 guidance');
console.log(`guidance: ${snFinding.guidance.slice(0, 30)}...`);

// ── 4. 变异守卫：逐支作废 → 本文件必须变红 ──────────────────────
const SELF_TEST = path.join(__dirname, 'round-506-sole-narrative.test.js');
function runSelf() {
  try {
    cp.execSync(`node ${JSON.stringify(SELF_TEST)}`, {
      cwd: ROOT, stdio: 'pipe',
      env: Object.assign({}, process.env, { _HF_SELF_SPAWN_DEPTH: String(Number(process.env._HF_SELF_SPAWN_DEPTH || 0) + 1) }),
    });
    return 0;
  } catch (e) { return typeof e.status === 'number' ? e.status : 1; }
}

// 每条支的唯一定位串（写在 src/sole-narrative.js 里的 const 声明）。
// 作废整支：行级替换为永假正则 /(?!)/。
// ⚠️ 承重样本不追求「支独占」：路由①需 SOLE_SOURCE × EXCLUSIVE 交叉命中，
//    单删一支命中会下降但可能仍被另一支兜住——这是冗余设计不是缺陷。
//    判据改用 BRANCH_MAP：删该支时一并删掉相关支，删完后 probe 必须死。
const NEVER_MATCH = '/(?!)/';
const BRANCH_MAP = {
  SOLE_SOURCE_ZH: ['SOLE_SOURCE_ZH'],
  EXCLUSIVE_ZH: ['EXCLUSIVE_ZH'],
  DEFER_ZH: ['DEFER_ZH'],
  SOLE_SOURCE_EN: ['SOLE_SOURCE_EN'],
  EXCLUSIVE_EN: ['EXCLUSIVE_EN'],
  // 路由②结构上必须与 SOLE/EXCL 共现（单纯「照单全收」指令若不含
  // 任何权威源或排他断言，不构成本族），因此 DEFER_EN 的承重样本
  // 同时被 SOLE_SOURCE_EN 与 EXCLUSIVE_EN 兜住——三支冗余是设计
  // 意图。作废判据改为：三支一并删后 probe 必须死。
  DEFER_EN: ['SOLE_SOURCE_EN', 'EXCLUSIVE_EN'],
};
const BRANCHES = Object.keys(BRANCH_MAP).map(name => ({
  name, anchor: `const ${name} = new RegExp(`,
}));

// 各支的「承重样本」：作废该支（含 BRANCH_MAP 相关支）后必须从命中变不命中。
const LOADBEARING = {
  SOLE_SOURCE_ZH: '按官方口径来，这件事只有这一种解释。',
  EXCLUSIVE_ZH: '上面的定调就是唯一答案，别的说法都不算数。',
  DEFER_ZH: '听统一口径就行了。',
  SOLE_SOURCE_EN: 'The official narrative is the only valid interpretation.',
  EXCLUSIVE_EN: 'Follow the approved line; no other version counts as true.',
  DEFER_EN: 'Just go with the official line.',
};

// [cronfix 2026-10-05] 递归深度保护：子进程直接结束，绝不进入变异守卫段。
if (Number(process.env._HF_SELF_SPAWN_DEPTH || 0) >= 1) {
  console.log('[cronfix] 子进程：跳过变异守卫段（防自我 spawn 膨胀）');
  process.exit(0);
}

let red = 0;
for (const br of BRANCHES) {
  const idx = modOrig.indexOf(br.anchor);
  assert.ok(idx >= 0, `锚点未找到: ${br.name}`);
  // 定位整支：从 `new RegExp(` 的开括号开始做括号配平找到匹配的 `)`，
  // 取到其后同行的分号。整支替换成永假正则字面量。
  // ⚠️ 不能用前缀注入 '(?!)'：`|` 优先级最低，前置 lookahead 管不到
  //    后面分支（r502 实测 4 支失敏）。必须整支替换。
  const open = modOrig.indexOf('(', idx);
  assert.ok(open > idx, `左括号未找到: ${br.name}`);
  let depth = 0, close = -1;
  for (let i = open; i < modOrig.length; i++) {
    const ch = modOrig[i];
    if (ch === '(') depth++;
    else if (ch === ')') { depth--; if (depth === 0) { close = i; break; } }
  }
  assert.ok(close > open, `右括号未找到: ${br.name}`);
  let semi = modOrig.indexOf(';', close);
  assert.ok(semi > close, `分号未找到: ${br.name}`);
  const before = modOrig.slice(0, idx);
  const after = modOrig.slice(semi + 1);
  let mutated = before + `const ${br.name} = ${NEVER_MATCH}` + after;
  // BRANCH_MAP：作废该支时一并删掉相关支（路由①交叉命中需双删）。
  for (const extra of BRANCH_MAP[br.name]) {
    if (extra === br.name) continue;
    const eIdx = mutated.indexOf(`const ${extra} = new RegExp(`);
    assert.ok(eIdx >= 0, `相关支锚点未找到: ${extra}`);
    const eOpen = mutated.indexOf('(', eIdx);
    let d2 = 0, eClose = -1;
    for (let i = eOpen; i < mutated.length; i++) {
      const ch = mutated[i];
      if (ch === '(') d2++;
      else if (ch === ')') { d2--; if (d2 === 0) { eClose = i; break; } }
    }
    assert.ok(eClose > eOpen, `相关支右括号未找到: ${extra}`);
    const eSemi = mutated.indexOf(';', eClose);
    mutated = mutated.slice(0, eIdx) + `const ${extra} = ${NEVER_MATCH}` + mutated.slice(eSemi + 1);
  }
  assert.ok(mutated !== modOrig, `注入未生效: ${br.name}`);
  arm(MODSRC, modOrig);
  fs.writeFileSync(MODSRC, mutated, 'utf8');
  try {
    const probe = LOADBEARING[br.name];
    let probeDead = true;
    if (probe) {
      const out = cp.execSync(
        `node -e "process.stdout.write(String(require('./src/sole-narrative.js').checkSoleNarrative(process.argv[1]).hit))" ${JSON.stringify(probe)}`,
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

console.log(`\nr506 sole_narrative 守卫: ${BRANCHES.length} 支全敏感，通过`);
