/**
 * test/round-426-post-hoc-omen-attribution.test.js
 *
 * [r426] 第 151 维度 post_hoc（后此谬误）新增「事件先后×玄学归因」措辞家族
 * （真升级②——既有维度全新措辞家族；src/index.js 零改动、dimMap 键数 273 不变、
 * VERSION 不 bump，同 r406-r424 扩族先例）。
 *
 * 立项依据（coordination/agent4/probes/r426-probe-pool.js，HEAD 6.8.211 实测）：
 * 四候选家族同池定拨——Q1 玄学归因形穿透 11/12、Q2 无「就」突变族 11/14、
 * Q3 每次共现族 7/12、Q4 straw_man 新形 8/12。Q1 以「模块层攻击 0/12 真零命中
 * + 模块层良性 0/12 零误伤」定选（接线后增量全族承重）。
 * 存量四路由射程外：R1 的 CONNECT 表不收裸时序形（「后来项目就黄了」的
 * 「后来」与「就」不相邻，'后来就' 子串匹配不到）、ASSERT 表只收
 * 晦气/玄学/显灵/灵验/邪门 五窄形，旺运财帛/仪式动作/器物破损兆整族不在场。
 *
 * 新路由⑤（union，与①-④互补）：腿①事件先后标记（存量 CONNECT ∪ 新裸时序形
 * SEQ_ZH_R5 / EN 强时序词 SEQ_EN_R5 / 逗号并置 JUXTAPOSE_EN）× 腿②玄学归因标记
 * （OMEN_ZH / OMEN_BREAK_ZH / OMEN_EN）共现，R5_NEGATE 否定对冲只作用本路由。
 *
 * 覆盖：模块层攻击全命中（中英）/ 良性零误伤 / 精度边界（单腿不判、昨天今天不收、
 * 旺季不中旺、unlucky/charmed 词边界、摔了一跤不中器物兆）/ 存量豁免不回归 /
 * 逐常量注入删条负例 / gate 层端到端 / 接线零改动 + 存量路由①-④不回归。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const { checkPostHoc } = require(path.join(HF, 'src/post-hoc.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

const NEVER = '__r426_negtest_never__';

// ─── A. 模块层：新族攻击全命中（路由⑤） ────────────────────────────
test('A1 中文新族攻击命中（事件先后 × 玄学归因）', () => {
  const atk = [
    ['那天出门摔了一跤，果然当天就下雨了', ['果然']],                 // 裸时序形 × 归因副词
    ['他上次说了句晦气话，后来项目就黄了', ['晦气']],                  // 「后来」与「就」不相邻，存量 CONNECT 匹配不到
    ['我出门前忘了拜一拜，结果客户就没签成', ['拜一拜']],              // 仪式动作 × 结果
    ['上次开会前打印机坏了，果然那天谈得不太顺', ['果然']],
    ['我生日那天买了这只猫，之后财运一直不错', ['财运']],              // 存量 CONNECT（之后）× 旺运财帛
    ['他临走前把杯子摔了，后来团队就散了', ['杯子摔了']],              // 器物破损兆（宾语锁）
    ['早上喜鹊叫了两声，果然下午就来了好消息', ['果然']],
    ['我昨天穿了红衣服，结果中了彩票，这衣服真旺', ['真旺']],
    ['自从请了这尊财神，店里的生意就旺了起来', ['财神']],              // 存量 CONNECT（自从）× 迷信物象
    ['搬进这栋房子之后，我接二连三遇到好事，这房子旺我', ['旺我']],
    ['他改了名之后事业就顺了起来，看来天意如此', ['天意']],
    ['自从每天念这道符咒，我失眠就好了', ['符咒']],                    // 与 R2（就好了）互不依赖：念了非 INTERVENE
  ];
  for (const [t, legs] of atk) {
    const r = checkPostHoc(t);
    assert(r.score > 0, '未命中: ' + t);
    assert(r.matches.some((m) => m.route === 5), '应走路由⑤: ' + t + ' ' + JSON.stringify(r.matches));
  }
});

test('A2 英文新族攻击命中（强时序/并置 × 词边界 OMEN）', () => {
  const atk = [
    'I wore my lucky tie and got the deal, so the tie works.',        // 逗号并置 × lucky
    'The printer jammed before the meeting, and sure enough the talks went badly.',
    'He forgot to say the blessing, and the client walked away.',     // 逗号并置 × blessing
    'We skipped the ritual, and the whole launch fell apart.',
    'He landed the client right afterward and credited the new watch as his lucky charm.', // 强时序 × lucky
  ];
  for (const t of atk) {
    const r = checkPostHoc(t);
    assert(r.score > 0, '未命中: ' + t);
    assert(r.matches.some((m) => m.route === 5), '应走路由⑤: ' + t + ' ' + JSON.stringify(r.matches));
  }
});

test('A3 模块层 details 标注后此谬误（路由⑤归因）', () => {
  const r = checkPostHoc('那天出门摔了一跤，果然当天就下雨了');
  assert(/后此谬误/.test(r.details), 'details 应含后此谬误: ' + r.details);
});

// ─── B. 良性：否认因果/叙事句/民俗陈述零误伤 ───────────────────────
test('B1 良性否认先后因果零误伤（R5_NEGATE 承重）', () => {
  const ben = [
    '昨天穿了红衣服，今天下雨了，这两件事没有关系',
    '他摔了一跤之后我扶他起来，这只是先后发生',
    '项目黄了需要复盘原因，不能只归因于一句话',
    '生日买猫和财运是同时发生的事，没有因果证据',
    '喜鹊叫和好消息只是时间上的巧合',
    '忘拜一拜和丢单没有关系，要看销售过程',
    '跳过仪式和发布失败之间需要对照数据',
    '打印机坏了是偶发故障，和谈判结果没有因果关系',
    'I wore a new tie and the deal closed, but that is coincidence.',
    'The printer jam is a hardware issue, unrelated to how the talks went.',
  ];
  for (const t of ben) assert(checkPostHoc(t).score === 0, '误伤: ' + t);
});

test('B2 良性调查语境/测量报告豁免不回归', () => {
  const ben = [
    '那天确实有点晦气，不过团队需要排查问题',           // EXEMPT 调查语境
    '换了新硬件之后，延迟降低了40%',                     // QUANT_MEASURE × TECH_METRIC
    '结果CRM出了问题，正在排查是不是接口的原因',
    'After the ritual, the team needed more data before drawing conclusions.',
  ];
  for (const t of ben) assert(checkPostHoc(t).score === 0, '误伤: ' + t);
});

// ─── C. 精度边界：单腿不判 / 词形锁 ───────────────────────────────
test('C1 单腿不判（只有先后标记或只有玄学词）', () => {
  const only = [
    '结果客户没签成，我们复盘了整个销售过程',              // 只有 SEQ
    '奶奶信佛，常年吃素祈福',                              // 只有 OMEN（无 SEQ）
    '风水学是一门研究环境与人的关系的学问',
    '传说戴上这个能转运，但我一个朋友试了完全没变化',
    'He found a four-leaf clover last summer and kept it as a souvenir.',
  ];
  for (const t of only) assert(checkPostHoc(t).score === 0, '单腿不应判: ' + t);
});

test('C2 昨天/今天不作时序腿（裸「昨天…今天」叙事不判）', () => {
  // 设计取舍：昨天/今天 过于日常，与「果然」共现也不判——保住民俗句与
  // 日常叙事的精度；强归因形必须带 结果/后来/那天/上次 等标记。
  const t = '昨天调整了参数，今天果然稳定了一些';
  assert(checkPostHoc(t).score === 0, '昨天/今天不应作 SEQ 腿: ' + t);
});

test('C3 旺字后缀锁（旺季/旺铺不判）', () => {
  const t = '之后就是旺季，销量一直不错';
  assert(checkPostHoc(t).score === 0, '「旺季」不应中 OMEN: ' + t);
});

test('C4 EN 词边界（unlucky/charmed 不中）', () => {
  const t = 'We had an unlucky start, but the project recovered after that.';
  assert(checkPostHoc(t).score === 0, 'unlucky 不应中 \\bluck\\b: ' + t);
});

test('C5 器物兆宾语锁（摔了一跤不中）', () => {
  const t = '他摔了一跤，后来去医务室处理了一下';
  assert(checkPostHoc(t).score === 0, '「摔了一跤」不应中器物兆: ' + t);
});

// ─── D. 负例注入：逐条删掉本轮每个新模式，守卫必须变红 ────────────
test('D1 删 OMEN_ZH → 中文样本转 miss', () => {
  const t = '那天出门摔了一跤，果然当天就下雨了';
  assert(checkPostHoc(t).score > 0, '正常应命中');
  assert(checkPostHoc(t, { OMEN_ZH: [] }).score === 0, '删 OMEN_ZH 后应 miss');
});

test('D2 删 SEQ_ZH_R5 → 裸时序样本转 miss', () => {
  const t = '那天出门摔了一跤，果然当天就下雨了';
  assert(checkPostHoc(t).score > 0, '正常应命中');
  assert(checkPostHoc(t, { SEQ_ZH_R5: [] }).score === 0, '删 SEQ_ZH_R5 后应 miss');
});

test('D3 删 OMEN_BREAK_ZH → 器物兆样本转 miss', () => {
  const t = '他临走前把杯子摔了，后来团队就散了';
  assert(checkPostHoc(t).score > 0, '正常应命中');
  assert(checkPostHoc(t, { OMEN_BREAK_ZH: new RegExp(NEVER) }).score === 0, '删 OMEN_BREAK_ZH 后应 miss');
});

test('D4 删 OMEN_EN → 英文样本转 miss', () => {
  const t = 'He forgot to say the blessing, and the client walked away.';
  assert(checkPostHoc(t).score > 0, '正常应命中');
  assert(checkPostHoc(t, { OMEN_EN: [] }).score === 0, '删 OMEN_EN 后应 miss');
});

test('D5 删 SEQ_EN_R5 → 强时序样本转 miss（并置形样本不受影响）', () => {
  const t = 'He landed the client right afterward and credited the new watch as his lucky charm.';
  assert(checkPostHoc(t).score > 0, '正常应命中');
  assert(checkPostHoc(t, { SEQ_EN_R5: [] }).score === 0, '删 SEQ_EN_R5 后应 miss');
  // 并置形样本（逗号-and）不走 SEQ_EN_R5，删后仍命中——证明两腿独立承重
  const t2 = 'He forgot to say the blessing, and the client walked away.';
  assert(checkPostHoc(t2, { SEQ_EN_R5: [] }).score > 0, '并置形样本不应受 SEQ_EN_R5 删条影响');
});

test('D6 删 JUXTAPOSE_EN → 并置样本转 miss', () => {
  const t = 'He forgot to say the blessing, and the client walked away.';
  assert(checkPostHoc(t).score > 0, '正常应命中');
  assert(checkPostHoc(t, { JUXTAPOSE_EN: new RegExp(NEVER) }).score === 0, '删 JUXTAPOSE_EN 后应 miss');
});

test('D7 删 R5_NEGATE_ZH → 否认因果样本转 hit（豁免承重证明）', () => {
  const t = '那天他摔了杯子，后来果然下雨了，不过这只是巧合';
  assert(checkPostHoc(t).score === 0, '正常应被否定对冲豁免');
  assert(checkPostHoc(t, { R5_NEGATE_ZH: new RegExp(NEVER) }).score > 0, '删 R5_NEGATE_ZH 后应命中');
});

test('D8 删 R5_NEGATE_EN → 否认因果样本转 hit（豁免承重证明）', () => {
  const t = 'He found the four-leaf clover that day, and sure enough we won, but it was just a coincidence.';
  assert(checkPostHoc(t).score === 0, '正常应被否定对冲豁免');
  assert(checkPostHoc(t, { R5_NEGATE_EN: new RegExp(NEVER) }).score > 0, '删 R5_NEGATE_EN 后应命中');
});

test('D9 全删新族常量 → 存量路由样本不受影响（加性证明）', () => {
  const legacy = '吃了这个药，病就好了'; // R2
  assert(checkPostHoc(legacy).score > 0, 'R2 样本正常应命中');
  assert(checkPostHoc(legacy, {
    SEQ_ZH_R5: [], SEQ_EN_R5: [], JUXTAPOSE_EN: new RegExp(NEVER),
    OMEN_ZH: [], OMEN_BREAK_ZH: new RegExp(NEVER), OMEN_EN: [],
    R5_NEGATE_ZH: new RegExp(NEVER), R5_NEGATE_EN: new RegExp(NEVER),
  }).score > 0, '存量路由不受新族删条影响');
});

// ─── E. 存量路由①-④不回归 ────────────────────────────────────────
test('E1 存量四路由样本仍命中', () => {
  const r1 = '自从上线新版本，用户投诉明显增多，这说明是新版本的问题'; // R1
  const r2 = '吃了这个药，病就好了';                                    // R2
  const r3 = '出门没带伞，结果就出了乱子，以后再也不敢不带了';          // R3
  const r4 = 'He sat down at the table, and we lost every hand.';        // R4
  assert(checkPostHoc(r1).matches.some((m) => m.route === 1), 'R1 应命中');
  assert(checkPostHoc(r2).matches.some((m) => m.route === 2), 'R2 应命中');
  assert(checkPostHoc(r3).matches.some((m) => m.route === 3), 'R3 应命中');
  assert(checkPostHoc(r4).matches.some((m) => m.route === 4), 'R4 应命中');
});

// ─── F. gate 层端到端 ─────────────────────────────────────────────
test('F1 gate 层新族攻击转非 pass 且归因 post_hoc', () => {
  const atk = [
    '那天出门摔了一跤，果然当天就下雨了',
    '他临走前把杯子摔了，后来团队就散了',
    'He forgot to say the blessing, and the client walked away.',
  ];
  for (const t of atk) {
    const g = gate.checkOutput(t);
    assert(g.gate.action !== 'pass', 'gate 应非 pass: ' + t);
    const dims = (g.findings || []).map((f) => f.dimension);
    assert(dims.includes('post_hoc'), 'findings 应含 post_hoc: ' + t + ' ' + dims.join(','));
  }
});

test('F2 gate 层良性样本仍 pass', () => {
  const ben = [
    '昨天穿了红衣服，今天下雨了，这两件事没有关系',
    '风水学是一门研究环境与人的关系的学问',
    'We had an unlucky start, but the project recovered after that.',
  ];
  for (const t of ben) assert(gate.checkOutput(t).gate.action === 'pass', '应 pass: ' + t);
});

// ─── G. 接线零改动纪律（②：不新增 dimMap 键） ────────────────────
test('G1 src/index.js 接线零改动 + discriminate 命中 post_hoc', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert((src.match(/post_hoc: phoc,/g) || []).length === 2, 'post_hoc 登记应仍为 2 处（dimMap + dimensions，② 不新增键）');
  const disc = gate.discriminate('那天出门摔了一跤，果然当天就下雨了');
  assert(disc.dimensions.post_hoc && (disc.dimensions.post_hoc.count ?? 0) > 0, 'discriminate 应命中 post_hoc');
});

test('G2 internals 导出 R5 全部新常量（供后续轮注入删条）', () => {
  // post-hoc.js 的 __internals 是普通对象导出（非函数），与 straw-man.js 的函数式不同
  const it = require(path.join(HF, 'src/post-hoc.js')).__internals;
  for (const k of ['SEQ_ZH_R5', 'SEQ_EN_R5', 'JUXTAPOSE_EN', 'OMEN_ZH', 'OMEN_BREAK_ZH', 'OMEN_EN', 'R5_NEGATE_ZH', 'R5_NEGATE_EN']) {
    assert(it[k] !== undefined, 'internals 应含 ' + k);
  }
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
