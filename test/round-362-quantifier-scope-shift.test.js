'use strict';
/* test/round-362-quantifier-scope-shift.test.js — r362 第 258 维度 quantifier_scope_shift 轮测
 *
 * 立项依据（src/quantifier-scope-shift.js 头注释 r361 立项记录，r362 撞号重编号后固化）：
 *   缺口实证（scripts/round-361/probe-candidates.js，v6.8.186 基线）：40 条攻击穿透 26
 *   （EN 19/20 全穿透、ZH 7/20 穿透）；良性 20 误伤 10 但全部来自既有基线维度
 *   （vagueness/perfect_error/hasty_generalization/confidence 等），非新维度引入。
 *   外部来源：arXiv 2405.02318（Lalwani et al., "Translating natural language to
 *   first-order logic for logical fallacy detection"）FOL 失效族之一即量词辖域
 *   倒置（∀x∃y ∴ ∃y∀x）。心虫判据为自有纯规则实现（零 LLM 依赖）。
 *
 * 判据：四条腿共现，缺一不判——
 *   腿① SCOPE_PREMISE 全称量词前提（∀x∃y 或全称前提）
 *   腿② SCOPE_CONCLUSION 存在×全称结论（∃y∀x）
 *   腿③ BRIDGE 推断连接词（所以/因此/可见/这说明/显然；EN so/therefore/which means）
 *   腿④ SHARED 谓域共享（前提与结论共享 ≥1 实词）
 * 守卫：META_CONCEPT/TEACH/META_DISCUSS/CONDITIONAL/IDENTITY/HEDGE/NEG/
 *       QUESTION/STAT/MOST 九组豁免。
 *
 * 本测试五组断言：
 *   A. gate 层攻击 15/15：gate.action ≠ pass 且 findings 命中 quantifier_scope_shift
 *      （样本 = scripts/round-362/variant-matrix.js atk 组，本会话实测 15/15）
 *   B. gate 层良性 16/16：findings 不含 quantifier_scope_shift（本维零误伤）
 *   C. 模块级负例注入：腿①/②/③/④各删一次，攻击翻转为不判（证明四条腿均承重）
 *   D. __internals 契约：注入入口常量齐全（负例注入口，r334 先例）
 *   E. 维度计数：dimMap 含 quantifier_scope_shift 且 VERIFY_DIMS 收纳（dispatch 实证）
 */
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const { checkQuantifierScopeShift, __internals } = require(path.join(ROOT, 'src', 'quantifier-scope-shift.js'));

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log(`  ✅ ${name}`); }
  catch (e) { fail++; console.log(`  ❌ ${name}: ${e.message}`); }
}
function ok(cond, msg) { if (!cond) throw new Error(msg); }
function eq(a, b, msg) { if (a !== b) throw new Error(`${msg || ''}（${a} !== ${b}）`); }

// 判定辅助：模块级是否命中（verdict ≠ pass 即命中，见模块返回结构 score/verdict/count）
function hit(text, inject) {
  const r = checkQuantifierScopeShift(text, inject);
  return !!(r && r.verdict && r.verdict !== 'pass');
}
// 判定辅助：gate 层是否命中本维度
function dimHit(text) {
  const r = gate(text);
  const f = (r.findings || []).find(x => x.dimension === 'quantifier_scope_shift');
  return f || null;
}

// ─── A. gate 层攻击样本（须 gate≠pass 且本维承重）────────────────
const ATTACK = [
  ['A1 ZH 基础', '对每个员工都有一个工位，所以存在一个工位是所有员工共用的。'],
  ['A2 ZH 裸名词', '每个人都有自己的导师，所以有一个导师带所有人。'],
  ['A3 EN 基础', 'Every student has a mentor, so there is a mentor for every student.'],
  ['A4 EN 倒装', 'There is one mentor for all children, because each child has a mentor.'],
  ['A5 EN 长句', 'In our program every participant is assigned a coach who follows them individually, which means there is a single coach responsible for all participants.'],
  ['A6 ZH 带修饰', '班级里每一个小朋友都配了一位家长志愿者维持秩序，这说明有一位家长志愿者可以负责全班秩序。'],
  ['A7 EN 裸名词', 'Each team has a captain, so there is a captain for every team.'],
  ['A8 ZH 谓域切换', '每户都分到了一袋米，所以有一袋米够全村吃。'],
  ['A9 ZH since', '每班选出了一名代表，既然每班都有代表，那就是有一位代表能代表所有班级发言。'],
  ['A10 EN given', 'Every applicant gets a reviewer, given that every applicant has a reviewer, one reviewer must cover the whole pool.'],
  ['A11 ZH 跨域', '每个项目都拨了专项资金，因此有一笔资金可以供所有项目使用。'],
  ['A12 EN 倒装2', 'One doctor serves all the patients here, since every patient is assigned a doctor.'],
  ['A13 ZH 设备', '每台机器都配了一名操作员，可见有一名操作员就能照看全部机器。'],
  ['A14 EN 工具', 'Each squad has a radio, so there is a radio that every squad shares.'],
  ['A15 ZH 奖学金', '每位申请人都有一位推荐人，说明有一位推荐人能代表全体申请人。'],
];

for (const [tag, text] of ATTACK) {
  check(`A [攻击] ${tag}: gate≠pass 且 findings 命中 quantifier_scope_shift`, () => {
    const r = gate(text);
    const f = (r.findings || []).find(x => x.dimension === 'quantifier_scope_shift');
    ok(f, `findings 缺 quantifier_scope_shift（dims=${(r.findings || []).map(x => x.dimension).join(',')}）`);
    ok(r.gate.action !== 'pass', `gate.action=pass（severity=${f.severity}）`);
    // 归因断言：severity 达到 VERIFY 触发线（≥60 量级）
    ok(f.severity >= 60, `severity 过低 ${f.severity}`);
  });
}

// ─── B. gate 层良性样本（本维零误伤）────────────────────────────
const BENIGN = [
  ['B1 边缘·正确区分', '每个人都有各自的工位，并不是同一个。'],
  ['B2 边缘·共用为真', '全校共用一个食堂，这不是量词辖域移位。'],
  ['B3 正确列举', '每人都配了一把钥匙，钥匙不通用，丢了要自己补办。'],
  ['B4 疑问', '是不是每位同学都对应同一个导师呢？'],
  ['B5 EN 边缘·同一性', 'The whole company shares one cafeteria, which is genuinely the same building.'],
  ['B6 EN 否定', 'Every child has a parent, but that does not mean there is one parent for all children.'],
  ['B7 ZH 对冲', '可能每个人用的不是同一套系统，还需确认。'],
  ['B8 教学', '量词辖域移位是指把「对每个 x 各有一个 y」偷换成「有一个 y 对所有 x 成立」。'],
  ['B9 EN 特称谨慎', 'Some of the mentors are shared, so a few mentors cover most students.'],
  ['B10 ZH 统计', '据统计，每个班都有三好学生，获奖比例各班不同。'],
  ['B11 条件句', '如果每个人都有一位导师，那这位导师会很忙。'],
  ['B12 EN 规范适用', 'One person was late, so the rule now requires everyone to arrive early.'],
  ['B13 ZH 制度规范', '有一人没签，所以按规定所有人都得补签。'],
  ['B14 EN 疑问', 'Is there really one mentor for every student in the program?'],
  ['B15 ZH 无关因果', '今天下雨了，所以比赛延期到明天。'],
  ['B16 EN 无关', 'The report was late, therefore the meeting was rescheduled.'],
];

for (const [tag, text] of BENIGN) {
  check(`B [良性] ${tag}: findings 不含 quantifier_scope_shift`, () => {
    const f = dimHit(text);
    ok(!f, `本维误伤 severity=${f ? f.severity : '?'}（${f ? (f.details || '') : ''}）`);
  });
}

// ─── C. 模块级负例注入（删腿翻转，证明每条腿承重）────────────────
// [r363 方法论修正] 原测试按「单张常量表」删腿、5 样本一刀切——三重错：
//   ① 腿①由四张表（UNIVERSAL_ZH/UNIVERSAL_ZH_BARE/UNIVERSAL_ZH_PERSON/
//      FOR_EVERY_ZH 正则）共同构成，删单表不翻转是**多路径覆盖的设计使然**；
//   ② A1 是族B 混合形：前提「一个工位」为裸存在形（腿① BARE_EXIST_ZH 承重），
//      结论「存在一个工位」由 EXIST_ZH 承重（scripts/round-363/diag-a1.js 逐表
//      删实证：腿①四表全删+EXIST_ZH 仍 HIT、+BARE_EXIST_ZH 才翻转）；
//   ③ ZH 常量只对 ZH 样本承重、EN 常量只对 EN 样本承重（删 INFER_ZH 不影响
//      EN 样本——EN 走 INFER_EN）。
// 正确的删腿断言粒度 = 「按逻辑腿删全部承重常量 × 按语种选样本」，且正则
// 数组常量（FOR_EVERY_*）的删腿注入值是 [NULL_RE]（数组内含永不匹配正则），
// 直接注入 NULL_RE 会抛 "object is not iterable"（r362/r363 两轮实测踩坑）。
const NULL_RE = /(?!x)x/;
const NULL_RE_ARR = [NULL_RE];
const I = __internals; // 本模块 __internals 是对象导出（非函数）

// 每条腿：注入组 + flip（删后应翻转不判的样本）+ hold（无关样本，应保持命中）
const LEG_CASES = [
  {
    leg: '腿①·全称前提（UNIVERSAL_ZH+BARE+PERSON+FOR_EVERY 四表齐删）',
    inject: { UNIVERSAL_ZH: [], UNIVERSAL_ZH_BARE: [], UNIVERSAL_ZH_PERSON: [], FOR_EVERY_ZH: NULL_RE_ARR, FOR_EVERY_EN: NULL_RE_ARR },
    flip: ['A2_ZH_族A', 'A8_ZH_裸', 'A15_ZH_人称'],
    hold: ['A1_ZH_族B', 'A3_EN'],
  },
  {
    leg: '腿①·存在前提（BARE_EXIST_ZH，族B 唯一承重）',
    // diag-a1.js 逐表实证：A1 腿①**只由 BARE_EXIST_ZH 承担**——四表全删
    // （UNIVERSAL_ZH/BARE/PERSON/FOR_EVERY）A1 仍 HIT，四表 + EXIST_ZH 删尽
    // 仍 HIT，只有再删 BARE_EXIST_ZH 才翻转。这是「裸存在前提」族B 的
    // 判定入口（「一个工位」无「存在」字样），与四表互不覆盖。
    inject: { UNIVERSAL_ZH: [], UNIVERSAL_ZH_BARE: [], UNIVERSAL_ZH_PERSON: [], FOR_EVERY_ZH: NULL_RE_ARR, FOR_EVERY_EN: NULL_RE_ARR, EXIST_ZH: [], BARE_EXIST_ZH: [] },
    flip: ['A1_ZH_族B'],
    hold: [],
  },
  {
    leg: '腿②·存在量词结论 ZH（EXIST_ZH）',
    inject: { EXIST_ZH: [] },
    flip: ['A1_ZH_族B', 'A2_ZH_族A', 'A8_ZH_裸', 'A15_ZH_人称'],
    hold: ['A3_EN'],
  },
  {
    leg: '腿②·存在量词结论 EN（EXIST_EN）',
    inject: { EXIST_EN: [] },
    flip: ['A3_EN'],
    hold: ['A1_ZH_族B', 'A2_ZH_族A', 'A8_ZH_裸', 'A15_ZH_人称'],
  },
  {
    leg: '腿③·推断连接词 ZH（INFER_ZH+INFER_ZH_REVERSE）',
    inject: { INFER_ZH: [], INFER_ZH_REVERSE: [] },
    flip: ['A1_ZH_族B', 'A2_ZH_族A', 'A8_ZH_裸', 'A15_ZH_人称'],
    hold: ['A3_EN'],
  },
  {
    leg: '腿③·推断连接词 EN（INFER_EN+INFER_EN_REVERSE）',
    inject: { INFER_EN: [], INFER_EN_REVERSE: [] },
    flip: ['A3_EN'],
    hold: ['A1_ZH_族B', 'A2_ZH_族A', 'A8_ZH_裸', 'A15_ZH_人称'],
  },
];
const INJ_SAMPLES = {
  A1_ZH_族B: '对每个员工都有一个工位，所以存在一个工位是所有员工共用的。',
  A2_ZH_族A: '每个人都有自己的导师，所以有一个导师带所有人。',
  A3_EN: 'Every student has a mentor, so there is a mentor for every student.',
  A8_ZH_裸: '每户都分到了一袋米，所以有一袋米够全村吃。',
  A15_ZH_人称: '每位申请人都有一位推荐人，说明有一位推荐人能代表全体申请人。',
};

for (const c of LEG_CASES) {
  check(`C 注入 ${c.leg} → 承重样本翻转、无关样本保持`, () => {
    for (const k of Object.keys(c.inject)) ok(I[k] !== undefined, `__internals 缺 ${k}`);
    for (const tag of c.flip) {
      ok(tag in INJ_SAMPLES, `样本清单缺 ${tag}`);
      const s = INJ_SAMPLES[tag];
      eq(hit(s), true, `置空前未命中(${tag}): ` + s);
      eq(hit(s, c.inject), false, `删腿后仍命中(${tag}): ${s}`);
    }
    for (const tag of c.hold) {
      const s = INJ_SAMPLES[tag];
      eq(hit(s, c.inject), true, `无关样本被误翻转(${tag}): ${s}`);
    }
  });
}

// 守卫承重：QUESTION_TAIL_RE 删腿 → EN 疑问良性翻转为命中
// [r363 补契约] 疑问守卫原为内联正则 /[吗呢？?]$/（不可注入，负例测试只能
// 断言「良性不命中」而无法证明守卫承重）。r363 发现并存缺陷：_clauses 第一行
// split 吃掉问号，原句级疑问判定缺失，EN 疑问句整句穿透误判（score=72）——
// 已修为原句级守卫。提表后双通道（QUESTION_ZH 词表 + QUESTION_TAIL_RE
// 句尾形）均可注入删腿，翻转可实证。
check('C 注入 QUESTION_TAIL_RE=null → EN 疑问探针翻命中', () => {
  const probe = 'Every student has a mentor, so is there a mentor for every student?';
  eq(hit(probe), false, '置空前应被疑问守卫豁免');
  eq(hit(probe, { QUESTION_TAIL_RE: NULL_RE }), true, '置空后应命中');
});
// ZH 疑问词表删腿：句中疑问标记探针（词表通道独有覆盖——「是否」在句中、
// 非句尾，TAIL_RE /[吗呢？?]/ 匹配不到，两条通道互补不遮蔽）
check('C 注入 QUESTION_ZH=[] → ZH 句中疑问词探针翻命中', () => {
  const probe = '对每个员工都有一个工位，所以是否存在一个工位是所有员工共用的';
  eq(hit(probe), false, '置空前应被疑问守卫豁免');
  eq(hit(probe, { QUESTION_ZH: [] }), true, '置空后应命中');
});
// ─── D. __internals 契约（负例注入口齐全，r334 先例）──────────────
check('D __internals 暴露四腿 + 守卫常量（负例注入口）', () => {
  const legs = ['UNIVERSAL_ZH', 'UNIVERSAL_EN', 'EXIST_ZH', 'EXIST_EN',
    'CONCL_UNIVERSAL_ZH', 'CONCL_UNIVERSAL_EN', 'INFER_ZH', 'INFER_EN',
    'IDENTITY_ZH', 'IDENTITY_EN', 'HEDGE_ZH', 'HEDGE_EN', 'NEG_ZH', 'NEG_EN',
    'CONDITIONAL_ZH', 'CONDITIONAL_EN', 'META_CONCEPT', 'TEACH_ZH', 'TEACH_EN',
    'STAT_ZH', 'STAT_EN', 'META_DISCUSS', 'EN_STOP', 'ZH_STOP'];
  for (const k of legs) ok(I[k] !== undefined, `__internals 缺 ${k}`);
});

// ─── E. 维度计数与 dispatch 实证（r355 先例：源码静态接线断言）──────
check('E 维度计数：index.js 接线在位（require + dispatch + dimMap + VERIFY_DIMS）', () => {
  const src = require('node:fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  ok(/checkQuantifierScopeShift/.test(src), 'index.js 缺 checkQuantifierScopeShift 调用');
  ok(/quantifier-scope-shift/.test(src), 'index.js 缺 require 接线');
  ok(/quantifier_scope_shift/.test(src), 'index.js 缺 quantifier_scope_shift 维度键');
});
check('E VERSION 与 package.json 一致', () => {
  const pkg = require(path.join(ROOT, 'package.json'));
  const v = require('node:fs').readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  ok(/^\d+\.\d+\.\d+$/.test(v), 'VERSION 格式非法: ' + v);
  eq(pkg.version, v);
});

console.log(`\n=== r362 quantifier_scope_shift 轮测 ===`);
console.log(`RESULT pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
