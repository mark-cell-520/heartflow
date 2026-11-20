/**
 * test/round-424-straw-man-necessity-negation.js
 *
 * [r424] 第 138 维度 straw_man（稻草人谬误）新增「存在必要性否定形」措辞家族
 * （真升级②——既有维度全新措辞家族；src/index.js 零改动、dimMap 键数不变）。
 *
 * 立项依据（coordination/agent4/probes/r424-probe-pool.js，HEAD 6.8.210 实测）：
 * 五候选家族同池定拨（P1 straw_man 穿透 10/12 / P2 post_hoc 11/14 /
 * P3 post_hoc 11/12 / P4 gamblers 8/13 / P5 base_rate 3/12），P1 以
 * 「模块层良性零误伤 + 模块层攻击仅 1/12（增量最大）」定选。
 * 既有路由①-③判别腿是反驳尾巴 REFUTE / 绝对化负面归述 ABSOLUTE_NEG /
 * 荒诞 caricature DISTORT，而「照你这么说，这行业就没有存在的必要了」
 * 「按你的逻辑，这个部门也没有必要保留」「你的意思是这所学校不如关掉」
 * 这一族只靠「某事物不该存在/没有必要保留」这个歪曲内容承载谬误——把对方
 * 「改一点」的立场夸成「全盘取消」，句中无反驳尾巴、无绝对化负面归述、更无
 * DISTORT 要求的不可歧义荒诞，整族射程外：攻击穿透 10/12。
 *
 * 新路由④（union，与①②③互补）：转述标记（强 ATTRIB_STRONG / 弱 ATTRIB_WEAK /
 * 意图 ATTRIB_WANT_ZH / 推断 ATTRIB_INFER_ZH 任一，含 EN 支）× 存在必要性
 * 否定（NEEDLESS_ZH / NEEDLESS_EN）共现。
 *
 * 覆盖：模块层攻击命中（中英六支）/ 良性零误伤 / 精度保持（无转述单腿不判）/
 * 逐常量注入删条负例 / 加性证明（④是补丁非替换）/ gate 层端到端 /
 * 接线零改动 + 存量路由①-③不回归。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const { checkStrawMan } = require(path.join(HF, 'src/straw-man.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

const NEVER = '__r424_negtest_never__';

// ─── A. 模块层：新族攻击全命中（路由④） ────────────────────────────
test('A1 中文新族攻击命中（转述标记 × 存在必要性否定）', () => {
  const atk = [
    '照你这么说，这行业就没有存在的必要了',                 // STRONG × 没有存在的必要
    '按你的逻辑，这个部门也没有必要保留',                   // STRONG × 动词后置形
    '你的意思是整个团队都没有存在的价值',                   // WEAK × 没有存在的价值
    '按你的说法，这部法律也没有存在的意义',                 // STRONG × 没有存在的意义
    '你的意思是这所学校不如关掉',                           // WEAK × 不如关掉
    '按你的逻辑，这套制度干脆推倒重来算了',                 // STRONG × 干脆推倒重来
    '按你的意思，这个岗位不设也罢',                         // WEAK × 不设也罢
    '你的意思是把公司解散算了',                             // WEAK × 解散算了
    '照你这么说，大家以后都不用吃饭了',                     // STRONG × 环形极端化
    '你的意思是这样下去谁也活不了',                         // WEAK × 环形极端化
    '你无非是想把这个部门干脆解散，只留你一个人。',           // ATTRIB_WANT × 干脆解散
    '这说明他是想让整个部门直接推倒重来。',                 // ATTRIB_INFER × 直接推倒重来
  ];
  for (const t of atk) assert(checkStrawMan(t).hit, '未命中: ' + t);
});

test('A2 英文新族攻击命中（既有 EN 转述 × 存在必要性否定）', () => {
  const atk = [
    'So by your logic, this whole department has no reason to exist.',
    'What you mean is nobody would bother to work anymore.',
    "So you're saying we might as well shut the whole thing down?",
    'So you are saying we might as well scrap the entire department?',
    "By your logic there's no point in keeping this team at all.",
  ];
  for (const t of atk) assert(checkStrawMan(t).hit, '未命中: ' + t);
});

// ─── B. 良性：含转述标记的正当确认/澄清/推演质疑零误伤 ─────────────
test('B1 良性含转述标记零误伤（锁最易误伤族）', () => {
  const ben = [
    '你的意思是需要先跑测试再上线吗',
    '你的意思是我们需要先备份数据库吗',
    '按你的逻辑，第三步推不出来',
    '照你这么说，工期要延长两周',
    '按你的说法，成本还能再降两成',
    '你的方案会影响到下游团队，需要评估',
    '这个行业确实面临转型压力，这是行业报告的结论',
    'Do you mean we should run the tests first?',
    'We should evaluate the risks before changing the process.',
    "So you're saying the budget needs reallocation, not more funding?",
  ];
  for (const t of ben) assert(!checkStrawMan(t).hit, '误伤: ' + t);
});

// ─── C. 精度保持：无转述标记时单腿不判 ─────────────────────────
test('C1 精度保持——无转述标记的否定动作是正当方案讨论，不判', () => {
  assert(!checkStrawMan('这个岗位不设也罢，可以把人力挪到核心链路').hit,
    '无转述标记不应判（正当方案讨论）');
  assert(!checkStrawMan('行业要不要保留，取决于它是否还有真实需求').hit,
    '中性设问不应判');
  assert(!checkStrawMan('要推翻重来就得先拿出替代方案').hit,
    '「推翻重来」无强化前缀形刻意不入表');
});

// ─── D. 负例注入：逐条删掉本轮每个新模式，守卫必须变红 ────────────
test('D1 删 NEEDLESS_ZH → 中文样本转 miss', () => {
  const t = '照你这么说，这行业就没有存在的必要了';
  assert(checkStrawMan(t).hit, '正常应命中');
  assert(!checkStrawMan(t, { NEEDLESS_ZH: new RegExp(NEVER) }).hit, '删 NEEDLESS_ZH 后应 miss');
});
test('D2 删 NEEDLESS_EN → EN 样本转 miss', () => {
  const t = 'So by your logic, this whole department has no reason to exist.';
  assert(checkStrawMan(t).hit, '正常应命中');
  assert(!checkStrawMan(t, { NEEDLESS_EN: new RegExp(NEVER) }).hit, '删 NEEDLESS_EN 后应 miss');
});
test('D3 删 ATTRIB_STRONG_ZH → 「照你这么说」样本转 miss', () => {
  const t = '照你这么说，大家以后都不用吃饭了';
  assert(checkStrawMan(t).hit, '正常应命中');
  assert(!checkStrawMan(t, { ATTRIB_STRONG_ZH: new RegExp(NEVER) }).hit, '删 ATTRIB_STRONG_ZH 后应 miss');
});
test('D4 删 ATTRIB_WEAK_ZH → 「你的意思是」样本转 miss', () => {
  const t = '你的意思是这所学校不如关掉';
  assert(checkStrawMan(t).hit, '正常应命中');
  assert(!checkStrawMan(t, { ATTRIB_WEAK_ZH: new RegExp(NEVER) }).hit, '删 ATTRIB_WEAK_ZH 后应 miss');
});
test('D5 删 ATTRIB_WANT_ZH → 「你无非是想」样本转 miss', () => {
  const t = '你无非是想把这个部门干脆解散，只留你一个人。';
  assert(checkStrawMan(t).hit, '正常应命中');
  assert(!checkStrawMan(t, { ATTRIB_WANT_ZH: new RegExp(NEVER) }).hit, '删 ATTRIB_WANT_ZH 后应 miss');
});
test('D6 删 ATTRIB_INFER_ZH → 「这说明他是想让」样本转 miss', () => {
  const t = '这说明他是想让整个部门直接推倒重来。';
  assert(checkStrawMan(t).hit, '正常应命中');
  assert(!checkStrawMan(t, { ATTRIB_INFER_ZH: new RegExp(NEVER) }).hit, '删 ATTRIB_INFER_ZH 后应 miss');
});
test('D7 删 ATTRIB_WEAK_EN → EN 弱转述样本转 miss', () => {
  const t = 'What you mean is nobody would bother to work anymore.';
  assert(checkStrawMan(t).hit, '正常应命中');
  assert(!checkStrawMan(t, { ATTRIB_WEAK_EN: new RegExp(NEVER) }).hit, '删 ATTRIB_WEAK_EN 后应 miss');
});
test('D8 删 NEEDLESS_ZH → 动词后置形样本转 miss（锁 a2 支）', () => {
  const t = '按你的逻辑，这个部门也没有必要保留';
  assert(checkStrawMan(t).hit, '正常应命中');
  assert(!checkStrawMan(t, { NEEDLESS_ZH: new RegExp(NEVER) }).hit, '删 NEEDLESS_ZH 后应 miss');
});

// ─── E. 加性证明：杀全部新常量后，既有路由①-③攻击仍命中 ────────────
test('E1 加性——杀全部新常量，既有路由①攻击不受影响', () => {
  const t = '你无非就是想说不用加班，那公司业绩谁来管';
  const killed = checkStrawMan(t, {
    NEEDLESS_ZH: new RegExp(NEVER), NEEDLESS_EN: new RegExp(NEVER),
  });
  assert(killed.hit, '路由④是补丁非替换——既有路由①应仍命中');
});
test('E2 加性——杀全部新常量，既有路由③（荒诞歪曲）攻击不受影响', () => {
  const t = '按你的逻辑，这套制度干脆推倒重来算了';
  const killed = checkStrawMan(t, {
    NEEDLESS_ZH: new RegExp(NEVER), NEEDLESS_EN: new RegExp(NEVER),
  });
  assert(killed.hit, '路由③应仍命中（推倒重来由 REFUTE 干脆…算了 支承重）');
});
test('E3 存量路由②不回归（弱转述 × 反驳尾巴）', () => {
  assert(checkStrawMan('你的意思是我以前做的都是错的，只有你对').hit, '路由②不应回归');
});

// ─── F. gate 层端到端 ──────────────────────────────────────────
test('F1 gate 层攻击非 pass 且 straw_man finding 在场', () => {
  const atk = [
    '照你这么说，这行业就没有存在的必要了',
    '你的意思是这所学校不如关掉',
    'So by your logic, this whole department has no reason to exist.',
  ];
  for (const t of atk) {
    const g = gate.gate(t);
    assert(g.gate && g.gate.action && g.gate.action !== 'pass', 'gate 层放行: ' + t + ' action=' + (g.gate && g.gate.action));
    assert((g.findings || []).some((f) => f.dimension === 'straw_man'), '缺 straw_man finding: ' + t);
  }
});
test('F2 gate 层良性含转述标记 pass（锁死）', () => {
  const ben = ['你的意思是需要先跑测试再上线吗', 'Do you mean we should run the tests first?'];
  for (const t of ben) {
    const g = gate.gate(t);
    assert(g.gate && g.gate.action === 'pass', '良性应 pass: ' + t + ' action=' + (g.gate && g.gate.action));
  }
});

// ─── G. 接线零改动纪律（②：不新增 dimMap 键） ───────────────────
test('G1 src/index.js 接线零改动 + discriminate 命中 straw_man', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert((src.match(/straw_man: smw,/g) || []).length === 2, 'straw_man 登记应仍为 2 处（dimMap + dimensions，② 不新增键）');
  const disc = gate.discriminate('照你这么说，这行业就没有存在的必要了');
  assert(disc.dimensions.straw_man && (disc.dimensions.straw_man.count ?? 0) > 0, 'discriminate 应命中 straw_man');
});
test('G2 internals 导出 NEEDLESS 两常量（供后续轮注入删条）', () => {
  const it = require(path.join(HF, 'src/straw-man.js')).__internals();
  assert(it.NEEDLESS_ZH instanceof RegExp && it.NEEDLESS_EN instanceof RegExp, 'NEEDLESS_ZH/EN 应在 internals 中');
});

// ─── 汇总 ────────────────────────────────────────────────────
const pass = results.filter((r) => r.ok).length;
const fail = results.length - pass;
if (fail > 0) {
  console.log('失败项:');
  for (const r of results) if (!r.ok) console.log('  -', r.name, '::', r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');

// 清理：本轮仅用 inject 参数删条，无全局态、无临时文件；显式回收引用。
results.length = 0;
process.exit(fail > 0 ? 1 : 0);
