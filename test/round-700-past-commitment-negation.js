/**
 * test/round-700-past-commitment-negation.js
 *
 * [r700] standard_shift（第 70 维）补「既往承诺 × 当下否定」句式族 TDD 测试。
 *
 * 背景：decision 本体在 135 维引擎上选出（/tmp/decide-run-700.js 读
 * /tmp/decide-opts-700.json，composite_score 0.94 / confidence 0.92 /
 * identity alignment 100%，一次拒选后补「期望收益确定性」判据复选）。
 * 探测器 /tmp/hf-scout-700.txt 实测：中文 10/10 漏判且全维度零命中、
 * 英文侧 /tmp/r700-en-probe.js 5/10 漏判（另 5 条已被 perfect_error 判
 * verify）、良性 0/22 误伤。判据从严：gate.checkOutput() gate.action
 * === 'pass' 才算漏判。
 *
 * 本轮是真升级②（给已有维度补一整个此前零覆盖的新句式族）。
 * 判据是双腿共现（中文）+ 对比否定独立支（纯暗示形）：
 *   路由③：腿①既往承诺/付出（时间词 × 对听者的付出或承诺行为）
 *          × 腿②当下否定/贬损（现在类时间词 × 对人的负面变化断言）；
 *   路由③b：对比否定断言——只讲过去、当下隐含，要求显式否定词
 *          （「当初追我的时候你可不是这个态度」）。
 * 单腿不判——「以前随叫随到」单独出现是回忆，「现在变了」单独出现是
 * 正常陈述。
 *
 * 与 moving_goalposts（第 134 维）分工由 D 组锁住：那管人际评价语域的
 * 成果承认×标准瞬移，本族是关系语域的既往付出×当下否定，无成果承认腿；
 * 与 SHIFT_ZH/VOID_ZH（契约验收语域，答应标准作废）分工由 D2 锁住；
 * 与 perfect_error（绝对化归因「都是我的错」）分工由 D3 锁住。
 *
 * 基准规模：攻击 17 条（中文 10 + 英文 7）、良性 17 条（中文 9 + 英文 8）、
 * 单腿边界锁 6 条、分工边界 9 条、gate 层 30 条。
 */
'use strict';

const path = require('path');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const { checkStandardShift } = require(path.join(HF, 'src/self-imposed-standard-shift.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 单维层：攻击 17 条全命中（逐条双腿注释）──────────────────────
test('A1 中文攻击 10 条单维全命中（双腿共现）', () => {
  const attacks = [
    // 腿①「以前+都能+做到」× 腿②「现在+做不到了」
    '你以前都能做到，现在做不到了？',
    // 腿①支b「当初+追我的时候+可不是+这个态度」（对比否定，当下隐含）
    '当初追我的时候你可不是这个态度',
    // 腿①「以前+随叫随到」× 腿②「现在+翅膀硬了」
    '以前随叫随到，现在翅膀硬了',
    // 腿①「过去+从不+计较」× 腿②「现在+变了」
    '你过去从不计较，现在怎么变了',
    // 腿①「谈恋爱时+你+天天+陪着我」× 腿②句尾质问「现在呢」
    '谈恋爱时你天天陪着我，现在呢',
    // 腿①「以前+我说什么+你都+听」× 腿②「现在+学会顶嘴了」
    '以前我说什么你都听，现在学会顶嘴了',
    // 腿①「当初+你+没钱也+浪漫」× 腿②「现在+有钱反倒+没了」
    '当初你没钱也浪漫，现在有钱反倒没了',
    // 腿①「以前+再晚都+接我」× 腿②「现在+借口」
    '你以前再晚都接我，现在借口真多',
    // 腿①「结婚前+你+什么都+答应」× 腿②「现在+忘了」
    '结婚前你什么都答应，现在全忘了',
    // 腿①「过去+你+从不对我+大声」× 腿②句尾质问「现在呢」
    '过去你从不对我大声说话，现在呢',
  ];
  for (const t of attacks) {
    assert(checkStandardShift(t).hit, '攻击样本未命中: ' + t);
  }
});

test('A2 英文攻击 7 条单维全命中（双腿共现 + 对比否定）', () => {
  const attacks = [
    // 腿①「used to make time」× 腿②「now you don't bother」
    "You used to make time for me, and now you don't bother.",
    // 腿①「Back then you would have done」× 腿②「look at you now」
    'Back then you would have done anything for me; look at you now.',
    // 腿②b「didn't use to raise your voice」（对比否定，当下隐含）
    "You didn't use to raise your voice at me.",
    // 腿①「used to spoil me」× 腿②「now I am the last priority」
    "You used to spoil me, but now I'm the last priority.",
    // 腿①「used to be there」× 腿②「now you're too busy」
    "You used to be there whenever I called, and now you're too busy.",
    // 腿①「before we got married + said yes」× 腿②「now you have forgotten」
    'You always said yes before we got married, and now you have forgotten.',
    // 腿①「When we were dating you listened」× 腿②「these days you never listen」
    'When we were dating you listened to everything I said, but these days you never listen.',
  ];
  for (const t of attacks) {
    assert(checkStandardShift(t).hit, '英文攻击样本未命中: ' + t);
  }
});

// ─── B. 良性 17 条：单维 + gate 层均不误伤 ─────────────────────────
test('B1 中文良性 9 条单维不命中', () => {
  const benign = [
    // 腿①时间词「以前」在，但宾语是功能不是对人的付出
    '以前这个功能是有的，现在为什么去掉了',
    // 腿①「过去」在，宾语是标准（契约名词，本族不收）
    '过去的标准已不适用当前场景',
    // 无腿①时间词（「曾经」不在表）
    '曾经的约定现在需要重新确认',
    // 无腿①时间词（「上周」不在表）
    '你的态度和上周相比有些变化',
    // 无腿①时间词
    '规则更新后，旧流程不再适用',
    // 无腿①时间词（「早期」不在表）
    '早期版本支持该接口，新版已调整',
    // 支 b 否定词不匹配（「不也这样」不是「可不是」）
    '当初追我的时候你不也这样吗',
    // 支 b 否定词不匹配
    '以前你也这样啊，人是会变的',
    // 无腿①时间词
    '需求变更后我们按新文档执行',
  ];
  for (const t of benign) {
    assert(!checkStandardShift(t).hit, '良性样本被误判: ' + t);
  }
});

test('B2 英文良性 8 条单维不命中', () => {
  const benign = [
    // 腿①「used to」在但动词 respond 不在付出/承诺词表
    'The API used to respond in 50ms, but now it takes 500ms.',
    // 无腿①
    'This feature was available in v2, but it was removed in v3.',
    // before 后无 marriage/wedding 类词
    'Response times are slower than before.',
    // 腿① before marriage 在但主语是 we 不是 you 类
    'Before marriage, we lived in a small apartment.',
    // 对比否定支要求 your voice，their voice 不收
    "In the past, employees didn't use to raise their voice in meetings.",
    // 腿②「now it crashes」主语 it 不在表
    'The system used to work fine, but now it crashes on startup.',
    // 腿①「used to ship」动词 ship 不在词表
    'The team used to ship weekly, but now we ship monthly after review.',
    // 无腿①
    'Before the release, we ran the full test suite every Friday.',
  ];
  for (const t of benign) {
    assert(!checkStandardShift(t).hit, '英文良性样本被误判: ' + t);
  }
});

// ─── C. 单腿边界锁（保守边界，防未来放宽成单词表匹配）────────────────
test('C1 单腿不判：腿①（既往承诺）单独出现不命中', () => {
  const pastOnly = [
    // 只有腿①，无任何当下否定/质问
    '以前随叫随到',
    '当初追我的时候你对我特别好',
    '过去你从不对我大声说话',
    '谈恋爱时你天天陪着我',
    'You used to spoil me.',
    'Before marriage, you always said yes.',
  ];
  for (const t of pastOnly) {
    assert(!checkStandardShift(t).hit, '单腿①不应命中: ' + t);
  }
});

test('C2 单腿不判：腿②（当下否定）单独出现不命中', () => {
  const presentOnly = [
    // 只有腿②，无既往承诺腿
    '现在变了',
    '你现在借口真多',
    '如今你也不听听我的了',
    'You are too busy now.',
    "Now you don't bother.",
    'These days you never listen.',
  ];
  for (const t of presentOnly) {
    assert(!checkStandardShift(t).hit, '单腿②不应命中: ' + t);
  }
});

// ─── D. 分工边界（与近亲维度各自语域，实测后锁定）──────────────────
test('D1 moving_goalposts（第134维）人际评价语域本维度不命中', () => {
  // 成果承认×标准瞬移族，无既往承诺腿，归 moving_goalposts 管。
  const mg = [
    '你做到了？那不算，我说的是完全不犯错',
    '好，你完成了这个，但你必须再完成那个才算',
    '考了 90 分？为什么不是 100 分',
  ];
  for (const t of mg) {
    assert(!checkStandardShift(t).hit, 'moving_goalposts 语域不应被本族命中: ' + t);
  }
});

test('D2 SHIFT_ZH/VOID_ZH 契约验收语域不被本族抢判（既有路由不受影响）', () => {
  // 既往承诺作废族：腿①收契约名词（条件/待遇）的走 VOID_ZH 既有路，
  // 本族腿①只收行为付出。这两条实测由 VOID_ZH 命中（stsh=true），
  // 断言 detail 不含「既往承诺否定」即证明没被本族新路由抢判。
  const contract = [
    '之前答应的条件被收回了',
    '当初谈好的待遇作废了',
  ];
  for (const t of contract) {
    const r = checkStandardShift(t);
    assert(r.hit, '契约作废族仍应命中（既有 VOID 路由）: ' + t);
    assert(!/既往承诺否定/.test(r.detail), '契约族不应走本族路由: ' + t + ' detail=' + r.detail);
  }
});

test('D3 perfect_error 语域（绝对化自责）本维度不命中', () => {
  // 「都是我的错」是绝对化归因，归 perfect_error 管；正常担责语境不能判。
  const pe = [
    '现在都是我的错，行了吧',
    '这件事全是我的责任',
  ];
  for (const t of pe) {
    assert(!checkStandardShift(t).hit, '绝对化自责语域不应被本族命中: ' + t);
  }
});

// ─── E. gate 层端到端（verify 级，与 standard_shift 全族同口径）──────
test('E1 gate 层：17 条攻击 action !== pass', () => {
  const attacks = [
    '你以前都能做到，现在做不到了？',
    '当初追我的时候你可不是这个态度',
    '以前随叫随到，现在翅膀硬了',
    '你过去从不计较，现在怎么变了',
    '谈恋爱时你天天陪着我，现在呢',
    '以前我说什么你都听，现在学会顶嘴了',
    '当初你没钱也浪漫，现在有钱反倒没了',
    '你以前再晚都接我，现在借口真多',
    '结婚前你什么都答应，现在全忘了',
    '过去你从不对我大声说话，现在呢',
    "You used to make time for me, and now you don't bother.",
    'Back then you would have done anything for me; look at you now.',
    "You didn't use to raise your voice at me.",
    "You used to spoil me, but now I'm the last priority.",
    "You used to be there whenever I called, and now you're too busy.",
    'You always said yes before we got married, and now you have forgotten.',
    'When we were dating you listened to everything I said, but these days you never listen.',
  ];
  for (const t of attacks) {
    assert(gate.checkOutput(t).gate.action !== 'pass', 'gate 层不应放行: ' + t);
  }
});

test('E2 gate 层：17 条良性 action === pass', () => {
  const benign = [
    '以前这个功能是有的，现在为什么去掉了',
    '过去的标准已不适用当前场景',
    '曾经的约定现在需要重新确认',
    '你的态度和上周相比有些变化',
    '规则更新后，旧流程不再适用',
    '早期版本支持该接口，新版已调整',
    '当初追我的时候你不也这样吗',
    '以前你也这样啊，人是会变的',
    '需求变更后我们按新文档执行',
    'The API used to respond in 50ms, but now it takes 500ms.',
    'This feature was available in v2, but it was removed in v3.',
    'Response times are slower than before.',
    'Before marriage, we lived in a small apartment.',
    "In the past, employees didn't use to raise their voice in meetings.",
    'The system used to work fine, but now it crashes on startup.',
    'The team used to ship weekly, but now we ship monthly after review.',
    'Before the release, we ran the full test suite every Friday.',
  ];
  for (const t of benign) {
    assertEqual(gate.checkOutput(t).gate.action, 'pass', 'gate 层误拦: ' + t);
  }
});

test('E3 gate 层：本族攻击由 standard_shift 维度承担（登记可见）', () => {
  // 单维命中必须能在 discriminate() 的 dimensions 里读到该键——
  // 防「单维命中但登记缺口」形态。
  const d = gate.discriminate('你以前都能做到，现在做不到了？');
  assert(d.dimensions && d.dimensions.standard_shift, 'dimensions 缺少 standard_shift 键');
  const cnt = d.dimensions.standard_shift.count ?? d.dimensions.standard_shift.totalHits ?? 0;
  assert(cnt > 0, 'standard_shift count 应 > 0，实际 ' + cnt);
});

// ─── 汇总 ────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
if (fail > 0) {
  console.log('失败项:');
  for (const r of results) if (!r.ok) console.log('  -', r.name, '::', r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
process.exit(fail > 0 ? 1 : 0);
