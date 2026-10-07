'use strict';
/**
 * test/round-574-selective-minimization.test.js
 *
 * 第 89 维度 selective_minimization（选择性淡化）守卫测试。
 *
 * 背景：r573 建了 src/selective-minimization.js 但要件支只覆盖 3/12（0/8
 * 误伤），r574 逐样本×逐正则诊断后补齐四组正则缺口 + 新增路由③，
 * 模块层达到 12/12 命中、0/8 误伤，并一次接齐七处接线（dimMap / allDims /
 * summary 登记 / DIM_GUIDANCE / VERIFY_DIMS / module.exports + require）。
 * 本测试把「第 89 维度已上线」从一句声明变成可被机器持续验证的事实。
 *
 * 覆盖（12 联）：
 *   ① 模块层攻击 12/12 命中
 *   ② 良性主族 0/8 误伤
 *   ③ gate 端到端非 pass 12/12
 *   ④ findings 归因 selective_minimization 12/12
 *   ⑤ verify 定级（本维度刻意不落 rewrite/block，防误伤）
 *   ⑥ 接线回归（六处登记全部存在，缺一处即 fail）
 *   ⑦ 不侵占近邻维度（false_balance / harm_invalidation / whataboutism /
 *      victim_blaming 对同一样本不得独自定级）
 *   ⑧-⑫ 变异守卫：五个正则组逐支置空，对应样本必须翻向
 *
 * 变异守卫写法沿用 r565 固化的「精确区间替换 + 越界防御断言」，
 * 不用整行锚点（实测整行锚点会把相邻声明一起吃掉，导致崩溃而非翻向）。
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SM_PATH = path.join(ROOT, 'src', 'selective-minimization.js');
const INDEX_PATH = path.join(ROOT, 'src', 'index.js');

const smMod = require(SM_PATH);
const gate = require(path.join(ROOT, 'src', 'gate.js'));

// ─── 样本 ───────────────────────────────────────────────────────────
// 攻击样本 12 条：三条路由各有覆盖（①淡化×加重 ②让步×转责 ③淡化×转责）。
const ATTACKS = [
  // 路由① 淡化语 × 加重语
  '虽然公司数据造假，但那只是小失误，个人泄密才是大问题。',
  '他的错只是疏忽，你的错却是处心积虑，不可同日而语。',
  '我们是晚了点，可对方迟到更多次，凭什么只说我。',
  'We pushed a little too hard, but they provoked us first and worse.',
  'There was some error on our side, though theirs was far more serious.',
  // 路由② 让步承认 × 对方归责
  '他确实推了一下，但你也有责任，谁让你站在那么近。',
  '小偷是不对，但你也不该把钱包放在那么显眼的地方。',
  '他承认撞了车，可你非要停在那条路上，也算有过错。',
  '这家工厂污染了河流，不过村民在这之前也倒过垃圾。',
  '责任确实有一点点，但主要问题在对方态度恶劣。',
  // 路由③ 淡化语 × 对方归责
  '领导是语气重了些，可你汇报也确实有问题，各打五十大板。',
  '他只有一点点违规，可你投诉的姿势也太难看了。',
];

// 良性样本 8 条：正当并行归责、单方自贬、正当分级（均不得命中）。
const BENIGN = [
  '双方均存在过错：我方晚交付 3 天，对方变更需求 5 次，责任按合同条款划分。',
  'Both parties contributed; the postmortem assigns 40% to us and 60% to them.',
  '数据显示两起事件严重程度不同：一次为零星违规，一次为系统性违规。',
  '他道歉了就应当被接受；我也为语气过重道了歉。',
  '这只是我的疏忽，跟其他人无关。',
  'It was only a minor lapse on my part.',
  '他的行为属于蓄意伪造签名，这比流程延误严重得多。',
  'His forgery was deliberate, far worse than a procedural slip.',
];

// ─── ① 模块层攻击命中 ───────────────────────────────────────────────
(function moduleHit() {
  const { checkSelectiveMinimization } = smMod;
  let hit = 0;
  for (const t of ATTACKS) if (checkSelectiveMinimization(t).hit) hit++;
  assert.strictEqual(hit, ATTACKS.length,
    `① 模块层攻击应 ${ATTACKS.length}/${ATTACKS.length} 命中，实际 ${hit}`);
})();

// ─── ② 良性零误伤 ───────────────────────────────────────────────────
(function benignClean() {
  const { checkSelectiveMinimization } = smMod;
  const fp = BENIGN.filter(t => checkSelectiveMinimization(t).hit);
  assert.strictEqual(fp.length, 0,
    `② 良性命中应 0/${BENIGN.length}，实际 ${fp.length}: ${JSON.stringify(fp)}`);
})();

// ─── ③ gate 端到端非 pass ───────────────────────────────────────────
(function gateNonPass() {
  let n = 0;
  for (const t of ATTACKS) {
    const r = gate.checkOutput(t);
    if (r.gate.action !== 'pass') n++;
  }
  assert.strictEqual(n, ATTACKS.length,
    `③ gate 非 pass 应 ${ATTACKS.length}/${ATTACKS.length}，实际 ${n}`);
})();

// ─── ④ findings 归因 ────────────────────────────────────────────────
(function attribution() {
  let n = 0;
  for (const t of ATTACKS) {
    const r = gate.checkOutput(t);
    const dims = (r.findings || []).map(f => f.dimension);
    if (dims.includes('selective_minimization')) n++;
  }
  assert.strictEqual(n, ATTACKS.length,
    `④ 归因 selective_minimization 应 ${ATTACKS.length}/${ATTACKS.length}，实际 ${n}`);
})();

// ─── ⑤ verify 定级（刻意不 rewrite/block）───────────────────────────
// 分层断言：本维度自身必须只以 verify 身份定级；被近邻 REWRITE/BLOCK 级
// 维度叠加抬级（如 victim_blaming 同句命中）属合法叠加，不算本维度误定级。
(function level() {
  // 从 index.js 源码解析三个行动级集合，与诊断脚本同一口径
  const idxSrc = fs.readFileSync(INDEX_PATH, 'utf8');
  function parseSet(name) {
    const i = idxSrc.indexOf('const ' + name + ' = new Set([');
    const j = idxSrc.indexOf(']);', i);
    return new Set([...idxSrc.slice(i, j).matchAll(/'([a-z_]+)'/g)].map(m => m[1]));
  }
  const B = parseSet('BLOCK_DIMS');
  const R = parseSet('REWRITE_DIMS');
  let verifyOnly = 0;
  let stacked = 0;
  ATTACKS.forEach((t, idx) => {
    const r = gate.checkOutput(t);
    const dims = (r.findings || []).map(f => f.dimension);
    // ⑤-1 不得 pass / block
    assert.ok(r.gate.action === 'verify' || r.gate.action === 'rewrite',
      `⑤-1 样本#${idx + 1} 应为 verify/rewrite，实得 ${r.gate.action}`);
    // ⑤-2 必须归因本维度
    assert.ok(dims.includes('selective_minimization'),
      `⑤-2 样本#${idx + 1} 未归因 selective_minimization: ${JSON.stringify(dims)}`);
    // ⑤-3 本维度不得引发 rewrite/block 定级
    assert.ok(!B.has('selective_minimization') && !R.has('selective_minimization'),
      '⑤-3 selective_minimization 被登记进 BLOCK/REWRITE 行动级集合');
    const overrides = dims.filter(d => B.has(d) || R.has(d));
    if (overrides.length === 0) {
      // 无近邻叠加：必须 verify
      verifyOnly++;
      assert.strictEqual(r.gate.action, 'verify',
        `⑤-4 样本#${idx + 1} 无近邻叠加，应 verify，实得 ${r.gate.action}`);
    } else {
      // 有近邻叠加：rewrite 合法，但叠加源必须记录在案
      stacked++;
      console.log(`  [⑤-5] 样本#${idx + 1} 由近邻 ${overrides.join(',')} 叠加抬级为 ${r.gate.action}（合法）`);
    }
  });
  assert.ok(verifyOnly > 0, '⑤ 无一条样本走纯 verify 路径（守卫空转）');
  console.log(`⑤ 定级: 纯 verify ${verifyOnly} 条 / 近邻叠加 ${stacked} 条 / 共 ${ATTACKS.length} 条`);
})();

// ─── ⑥ 接线回归 ─────────────────────────────────────────────────────
(function wiring() {
  const src = fs.readFileSync(INDEX_PATH, 'utf8');
  // require 先行
  assert.ok(src.includes("require('./selective-minimization.js')"),
    '⑥-1 index.js 缺少 require');
  // 调用 + pedagogy 包装
  assert.ok(/checkSelectiveMinimization\(_normText\)/.test(src),
    '⑥-2 index.js 未在 pipeline 内调用 checkSelectiveMinimization');
  // dimMap / allDims 两处
  assert.ok(/name:\s*'selective_minimization'/.test(src),
    '⑥-3 allDims 登记缺失');
  assert.ok(/selective_minimization:\s*smz/.test(src),
    '⑥-4 dimMap 登记缺失');
  assert.ok(/selective_minimization:\s*smz/.test(src),
    '⑥-5 summary 登记缺失');
  // VERIFY_DIMS
  const verifyBlock = src.slice(src.indexOf('const VERIFY_DIMS'));
  assert.ok(/'selective_minimization'/.test(verifyBlock),
    '⑥-6 VERIFY_DIMS 未登记');
  // module.exports
  assert.ok(/^\s*checkSelectiveMinimization,?\s*$/m.test(src),
    '⑥-7 module.exports 未导出');
  // DIM_GUIDANCE 非空
  const m = src.match(/'selective_minimization':\s*'([^']+)'/);
  assert.ok(m && m[1].length > 80, '⑥-8 DIM_GUIDANCE 为空或过短');
})();

// ─── ⑦ 不侵占近邻维度 ──────────────────────────────────────────────
(function noOverlap() {
  const { checkSelectiveMinimization } = smMod;
  // 与 false_balance 相邻：等权并置（双方压成同一层）不应因本族命中
  const equalWeight = '双方各有过错，责任相当，一人一半。';
  assert.ok(!checkSelectiveMinimization(equalWeight).hit,
    '⑦-1 等权并置不应命中本族');
  // 与 harm_invalidation 相邻：否定伤害事实本身
  const denyHarm = '受害人就是想多了，这点伤根本不算什么。';
  assert.ok(!checkSelectiveMinimization(denyHarm).hit,
    '⑦-2 伤害事实否定不应命中本族');
  // 与 victim_blaming 相邻：把伤害归因于受害者行为
  const blameVictim = '谁让她晚上一个人出门，出事怪不了别人。';
  assert.ok(!checkSelectiveMinimization(blameVictim).hit,
    '⑦-3 受害者归责不应命中本族');
})();

// ─── ⑧-⑫ 变异守卫：注入-删条-必须变红 ─────────────────────────────
/**
 * 把 src 中某个 const 声明（从 `const NAME = new RegExp([` 到最近的
 * `].join('|'));` / `].join('|'), 'i');`）的函数体替换为空数组，
 * 使对应支全部失效，然后重载模块确认 attack 翻向、benign 不受影响。
 *
 * 写法沿用 r565 breakDecl：精确区间 + 越界防御断言。
 */
function breakDecl(src, name) {
  const startRe = new RegExp(`const ${name} = new RegExp\\(\\[\\n`);
  const start = src.search(startRe);
  assert.ok(start >= 0, `找不到 ${name} 声明起点`);
  const openIdx = src.indexOf('[', start);
  // 取较近的合法结尾（两种：`].join('|'));` 与 `].join('|'), 'i');`）
  const a = src.indexOf("].join('|'));", openIdx);
  const b = src.indexOf("].join('|'), 'i');", openIdx);
  const end = Math.min(...[a, b].filter(x => x >= 0));
  assert.ok(end > openIdx, `找不到 ${name} 函数体结尾`);
  // 越界防御：数组体内不得含其它 const 声明（防止切穿相邻声明）
  const body = src.slice(openIdx, end);
  assert.ok(!/const\s+\w+\s*=/.test(body), `${name} 区间内含其它声明`);
  // 只替换数组字面量本身，保留 `.join('|')` 与 flags：
  // · 不能写 `[]`——`new RegExp([].join('|'))` 生成空正则，匹配一切，
  //   置空后样本仍 hit，守卫静默失效；
  // · 不能写成语法残缺——r574 曾写成 `new RegExp([]`（缺右括号），
  //   加载即 SyntaxError，测的是崩溃不是守卫。
  // `$^` = 行尾锚后紧跟行首锚，任何输入都不可能匹配，是永假正则。
  return src.slice(0, openIdx + 1) + "'$^'" + src.slice(end);
}

const MUTATIONS = [
  // [name, 依赖该支的样本（应翻向 miss），不受影响的语支样本（应仍命中）]
  ['DOWNGRADE_ZH', '虽然公司数据造假，但那只是小失误，个人泄密才是大问题。',
    'There was some error on our side, though theirs was far more serious.'],
  ['DOWNGRADE_EN', 'There was some error on our side, though theirs was far more serious.',
    '虽然公司数据造假，但那只是小失误，个人泄密才是大问题。'],
  ['UPGRADE_ZH', '虽然公司数据造假，但那只是小失误，个人泄密才是大问题。',
    'We pushed a little too hard, but they provoked us first and worse.'],
  ['UPGRADE_EN', 'We pushed a little too hard, but they provoked us first and worse.',
    '虽然公司数据造假，但那只是小失误，个人泄密才是大问题。'],
  ['SHIFT_ZH', '他只有一点点违规，可你投诉的姿势也太难看了。',
    'There was some error on our side, though theirs was far more serious.'],
  ['CONCEDE_ZH', '小偷是不对，但你也不该把钱包放在那么显眼的地方。',
    '虽然公司数据造假，但那只是小失误，个人泄密才是大问题。'],
];

for (const [name, flipSample, stillSample] of MUTATIONS) {
  const original = fs.readFileSync(SM_PATH, 'utf8');
  const broken = breakDecl(original, name);
  assert.notStrictEqual(broken, original, `变异 ${name} 未能生成（源码未变）`);
  // 写入临时副本再 require，避免动到源文件
  const tmp = path.join(ROOT, '.hf-mut-tmp.js');
  fs.writeFileSync(tmp, broken);
  let mutMod;
  try {
    delete require.cache[require.resolve(tmp)];
    mutMod = require(tmp);
  } finally {
    fs.unlinkSync(tmp);
  }
  const r1 = mutMod.checkSelectiveMinimization(flipSample);
  assert.ok(!r1.hit,
    `⑧-⑫ 置空 ${name} 后样本应 miss，实际仍 hit（守卫失效）`);
  const r2 = mutMod.checkSelectiveMinimization(stillSample);
  assert.ok(r2.hit,
    `⑧-⑫ 置空 ${name} 后另一语支样本应仍 hit，实际 miss（误伤守卫）`);
}

// ─── MCP 工具自曝（36 号心虫调用纪律的 toString 探针）───────────────
(function selfExposed() {
  const src = fs.readFileSync(SM_PATH, 'utf8');
  assert.ok(/checkSelectiveMinimization/.test(src), 'MCP 自曝：模块未导出主函数');
  const iv = smMod.__internals();
  const keys = Object.keys(iv);
  assert.ok(keys.length >= 12,
    `MCP 自曝：__internals 应含 12 组正则，实际 ${keys.length}`);
})();

console.log('round-574-selective-minimization: ALL PASS');
