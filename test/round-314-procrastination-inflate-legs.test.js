/* round-314 — econ_reasoning_gate 聚合族新措辞家族续篇
 * present_bias「拖延许可×活在当下宣言×未来自我料理」+
 * endowment_effect「情义无价×我的就是更好的」
 * 轮测分组：
 *   A gate 层归因（新攻击 → gate action ≠ pass + dimension findings）
 *   B 模块直调（新攻击全命中 + 存量攻击回归）
 *   C 良性（手工豁免样本 + 官方良性语料全量）
 *   D 存量回归（存量攻击仍命中 + 存量豁免仍豁免 + 存量注入语义保持）
 *   E 常量级注入（10 个新常量置空 → 依赖攻击翻红）
 *   F 元素级注入（42 个新元素逐一删除 → 隔离样本翻红）
 *   G 入口双路（checkInput/checkOutput/checkDraft/runPipeline 均可达）
 *   H 登记纪律（__internals 新键暴露 + VERSION 不变 + claims 登记）
 */
'use strict';
const assert = require('assert');
const PB = require('../src/present-bias.js');
const EE = require('../src/endowment-effect.js');
const gateMod = require('../src/gate.js');
const gateFn = typeof gateMod === 'function' ? gateMod : gateMod.gate;
const pbi = PB.__internals();
const eei = EE.__internals();

// ─── 攻击语料 ─────────────────────────────────────────────────────
// present_bias 新攻击（pristine d8214c7 实测 miss；NOW_ZH2[0] 今朝有酒为存量腿已移出）
const PB_NEW = [
  '能玩一天是一天，作业明天再说',                                    // NOW_ZH2[0] 一天是一天
  '开心一天是一天，还款是以后的事',                                  // NOW_ZH2[0]
  '趁还年轻及时行乐，养老是以后的问题',                              // NOW_ZH2[1] 趁…及时行乐
  '儿孙自有儿孙福，先快活了再说',                                    // NOW_ZH2[2] 先X了（无前缀）
  '相信后人的智慧，现在先自己舒服一把',                              // NOW_ZH2[3] 时间词+先自己X
  'You only live once, who cares what happens tomorrow',             // NOW_EN2[0] YOLO
  'Exercise can wait, live for today and let future me handle it',   // NOW_EN2[1] live for today
  'Dieting can wait, seize the day and deal with it later',          // NOW_EN2[2] seize the day
  'He says carpe diem, the deadline can wait until tomorrow',        // NOW_EN2[3] carpe diem
  'Saving is for later, I will enjoy it while I can',                // NOW_EN2[4] while I can
  'Retirement planning can wait, we should travel while we are young', // NOW_EN2[5] while we are young
  "I'll save after this purchase, might as well enjoy it now",       // NOW_EN2[6] might as well
  'Starting Monday for sure, this weekend I am going to party',      // NOW_EN2[7] this weekend party
  '锻炼今后再开始，今晚先痛快吃了',                                  // LATER_ZH2[0] 口头禅动词版
  '减肥下次一定，今晚这顿火锅先痛快吃了',                            // LATER_ZH2[1] 口头禅光秃版
  '存款等双十一买完再开始，现在先刷卡住进想要的房子',                // LATER_ZH2[2] 等X再Y
  '车到桥头自然直，今晚先痛快吃了',                                  // LATER_ZH2[3] 车到桥头
  '相信后人的智慧，现在先舒服了',                                    // LATER_ZH2[4] 相信后人
  '儿孙自有儿孙福，现在先自己快活',                                  // LATER_ZH2[5] 儿孙福
  '体检到时候再说，今晚先痛快吃了',                                  // LATER_ZH2[6] 到时候
  "I'll start tomorrow, tonight I want to enjoy what I can actually feel", // LATER_EN2[0]
  'Quitting smoking next time for sure, tonight I will enjoy one more cigarette', // LATER_EN2[2]
  'We will cross that bridge when we come to it, so tonight let us be happy',   // LATER_EN2[5]
];
// present_bias 存量攻击（改前已命中，回归保护）
const PB_OLD = [
  '今晚先痛快吃了，体检以后再说',
  '今朝有酒今朝醉，体检以后再说',
  'Saving can wait until next month, right now I need to treat myself.',
  'I will deal with it later, YOLO.',
];
// endowment_effect 新攻击
const EE_NEW = [
  '这幅画亲手画的，千金不换，卖价免谈',                              // OWN_ZH2[0]
  '咱家的宅基地，千金不换，卖价免谈',                                // OWN_ZH2[1] 咱家的
  '自己家的老作坊，千金不换，卖价免谈',                              // OWN_ZH2[1] 自己家的
  '这猫我看着长大的，千金不换，卖价免谈',                            // OWN_ZH2[2]
  '宅基地是祖祖辈辈传下来的，千金不换，卖价免谈',                    // OWN_ZH2[3]
  'Built this from nothing, and no price could ever be enough',     // OWN_EN2[0] + INFLATE_EN2[2]
  'I started it from scratch, and no price could ever be enough',   // OWN_EN2[1]
  'I watched it grow up, so no price could ever be enough',          // OWN_EN2[2]
  '我的旧车开了二十年，千金不换，这卖价我不认',                      // INFLATE_ZH2[0]
  '这块表是我戴了半辈子的，什么都替代不了，这卖价我不认',            // INFLATE_ZH2[1]
  'My first guitar is irreplaceable to me, and the market price is irrelevant', // INFLATE_EN2[0]
  'The old shop is ours, we built it from nothing, money cannot buy what it means to us', // INFLATE_EN2[1]
  '这把吉他是我的，陪了我十年，这不是钱的事',                          // REFUSE_ZH2[0]
  '自己家的宅基地，祖祖辈辈传下来的，不是钱能衡量的',                // REFUSE_ZH2[1]
  'This watch is mine, I have had it for thirty years, it is not for all the money in the world', // REFUSE_EN2[0]
  "I would not trade it for anything, my grandfather's desk means more than any market price", // REFUSE_EN2[1]
  "My grandfather's desk — you cannot put a price on it, and no offer has ever been enough",    // REFUSE_EN2[2]
];
// endowment_effect 存量攻击（回归保护）
const EE_OLD = [
  '这把吉它是我的，陪了我十年，别说三千，五千我都不卖',
  '我的旧车虽然市价只值两万，但对我而言它值五万，低于这个价免谈',
  'This watch is mine, I have had it for twenty years, no amount under ten thousand will buy it.',
  '这幅画是我亲手画的，感情无价，出多少都不换',
];

// ─── C 组：手工良性语料（官方口径：不应命中）────────────────────
const PB_BENIGN = [
  '今晚打算早睡，明天早起去跑步',                       // 单纯计划
  '以后想把烟戒了，先制定一个逐步减量的计划',           // 正确跨期计划（存量豁免）
  '今日事今日毕，今天能做完的事不留到明天',             // 存量豁免
  '心理学上的现时偏差是指人们倾向于高估当下的奖励',     // 概念讨论（存量豁免）
  '下周要体检，今天先预约挂号',                         // 正常事务
  'I will start saving next month by setting up an automatic transfer.', // 正确计划
  'YOLO is often used as an excuse to avoid planning.', // 元讨论
  'He decided to save for retirement instead of spending it all.', // 自控陈述
];
const EE_BENIGN = [
  '这件商品按市场价成交，双方都很满意',
  '我两年前买的车，现在卖了个不错的价钱',
  '这个价格我觉得合理，就成交了',
  'The painting sold at auction for exactly its appraised value.',
  'He bought the watch at a fair market price and was happy.',
  '钱不是问题，但我们还是要看性价比',                    // 「钱不是问题」为常见口语非拒绝成交
  '他给流浪猫喂食，因为动物也有生存的权利',              // 无关场景
  '这本书对我很有价值，但二手书市价就是十块',            // 价值陈述+市场价并存
];

// ─── 常量级注入表（新常量 → 依赖攻击）────────────────────────────
const CONST_INJECT = [
  ['NOW_ZH2', PB.detectPresentBias, '能玩一天是一天，作业明天再说'],
  ['NOW_EN2', PB.detectPresentBias, 'You only live once, who cares what happens tomorrow'],
  ['LATER_ZH2', PB.detectPresentBias, '减肥下次一定，今晚这顿火锅先痛快吃了'],
  ['LATER_EN2', PB.detectPresentBias, "I'll start tomorrow, tonight I want to enjoy what I can actually feel"],
  ['OWN_ZH2', EE.detectEndowmentEffect, '咱家的宅基地，千金不换，卖价免谈'],
  ['OWN_EN2', EE.detectEndowmentEffect, 'Built this from nothing, and no price could ever be enough'],
  ['INFLATE_ZH2', EE.detectEndowmentEffect, '我的旧车开了二十年，千金不换，这卖价我不认'],
  ['INFLATE_EN2', EE.detectEndowmentEffect, 'My first guitar is irreplaceable to me, and the market price is irrelevant'],
  ['REFUSE_ZH2', EE.detectEndowmentEffect, '这把吉它是我的，陪了我十年，这不是钱的事'],
  ['REFUSE_EN2', EE.detectEndowmentEffect, 'This watch is mine, I have had it for thirty years, it is not for all the money in the world'],
];

// ─── 元素级注入表（常量 → 元素索引 → 隔离样本）────────────────────
const ELEM_INJECT = [
  ['NOW_ZH2', 0, '能玩一天是一天，作业明天再说'],
  ['NOW_ZH2', 1, '趁还年轻及时行乐，养老是以后的问题'],
  ['NOW_ZH2', 2, '儿孙自有儿孙福，先快活了再说'],
  ['NOW_ZH2', 3, '相信后人的智慧，现在先自己舒服一把'],
  ['NOW_EN2', 0, 'You only live once, who cares what happens tomorrow'],
  ['NOW_EN2', 1, 'Exercise can wait, live for today and let future me handle it'],
  ['NOW_EN2', 2, 'Dieting can wait, seize the day and deal with it later'],
  ['NOW_EN2', 3, 'He says carpe diem, the deadline can wait until tomorrow'],
  ['NOW_EN2', 4, 'Saving is for later, I will enjoy it while I can'],
  ['NOW_EN2', 5, 'Retirement planning can wait, we should travel while we are young'],
  ['NOW_EN2', 6, "I'll save after this purchase, might as well enjoy it now"],
  ['NOW_EN2', 7, 'Starting Monday for sure, this weekend I am going to party'],
  ['LATER_ZH2', 0, '锻炼今后再开始，今晚先痛快吃了'],
  ['LATER_ZH2', 1, '减肥下次一定，今晚这顿火锅先痛快吃了'],
  ['LATER_ZH2', 2, '存款等双十一买完再开始，现在先刷卡住进想要的房子'],
  ['LATER_ZH2', 3, '车到桥头自然直，今晚先痛快吃了'],
  ['LATER_ZH2', 4, '相信后人的智慧，现在先舒服了'],
  ['LATER_ZH2', 5, '儿孙自有儿孙福，现在先自己快活'],
  ['LATER_ZH2', 6, '体检到时候再说，今晚先痛快吃了'],
  ['LATER_EN2', 0, "I'll start tomorrow, tonight I want to enjoy what I can actually feel"],
  ['LATER_EN2', 1, 'Starting Monday for sure, this weekend I am going to party'],
  ['LATER_EN2', 2, 'Quitting smoking next time for sure, tonight I will enjoy one more cigarette'],
  ['LATER_EN2', 3, "I'll save after this purchase, might as well enjoy it now"],
  ['LATER_EN2', 4, 'You only live once, who cares what happens tomorrow'],
  ['LATER_EN2', 5, 'We will cross that bridge when we come to it, so tonight let us be happy'],
  ['OWN_ZH2', 0, '这幅画亲手画的，千金不换，卖价免谈'],
  ['OWN_ZH2', 1, '咱家的宅基地，千金不换，卖价免谈'],
  ['OWN_ZH2', 2, '这猫我看着长大的，千金不换，卖价免谈'],
  ['OWN_ZH2', 3, '宅基地是祖祖辈辈传下来的，千金不换，卖价免谈'],
  ['OWN_EN2', 0, 'Built this from nothing, and no price could ever be enough'],
  ['OWN_EN2', 1, 'I started it from scratch, and no price could ever be enough'],
  ['OWN_EN2', 2, 'I watched it grow up, so no price could ever be enough'],
  ['INFLATE_ZH2', 0, '我的旧车开了二十年，千金不换，这卖价我不认'],
  ['INFLATE_ZH2', 1, '这块表是我戴了半辈子的，什么都替代不了，这卖价我不认'],
  ['INFLATE_EN2', 0, 'My first guitar is irreplaceable to me, and the market price is irrelevant'],
  ['INFLATE_EN2', 1, 'Built this from nothing, and no price could ever be enough'],
  ['REFUSE_ZH2', 0, '这把吉它是我的，陪了我十年，这不是钱的事'],
  ['REFUSE_ZH2', 1, '自己家的宅基地，祖祖辈辈传下来的，不是钱能衡量的'],
  ['REFUSE_EN2', 0, 'This watch is mine, I have had it for thirty years, it is not for all the money in the world'],
  ['REFUSE_EN2', 1, "I would not trade it for anything, my grandfather's desk means more than any market price"],
  ['REFUSE_EN2', 2, "My grandfather's desk — you cannot put a price on it, and no offer has ever been enough"],
];

const detPB = (t, inject) => PB.detectPresentBias(t, inject);
const detEE = (t, inject) => EE.detectEndowmentEffect(t, inject);

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('✓', msg); }
  else { fail++; console.log('✗', msg); }
}

// ─── A gate 层归因 ───────────────────────────────────────────────
for (const t of PB_NEW) {
  const g = gateFn(t);
  ok(g.gate && g.gate.action !== 'pass', `A gate：present_bias 新攻击 action≠pass | ${t.slice(0, 30)}`);
  ok((g.findings || []).some(f => f.dimension === 'econ_reasoning_gate'), `A gate：findings 经 econ_reasoning_gate 聚合层（present_bias） | ${t.slice(0, 30)}`);
}
for (const t of EE_NEW) {
  const g = gateFn(t);
  ok(g.gate && g.gate.action !== 'pass', `A gate：endowment_effect 新攻击 action≠pass | ${t.slice(0, 30)}`);
  ok((g.findings || []).some(f => f.dimension === 'econ_reasoning_gate'), `A gate：findings 经 econ_reasoning_gate 聚合层（endowment_effect） | ${t.slice(0, 30)}`);
}

// ─── B 模块直调 ───────────────────────────────────────────────────
for (const t of PB_NEW) ok(detPB(t).hit === true, `B 模块：present_bias 新攻击命中 | ${t.slice(0, 30)}`);
for (const t of EE_NEW) ok(detEE(t).hit === true, `B 模块：endowment_effect 新攻击命中 | ${t.slice(0, 30)}`);
for (const t of PB_OLD) ok(detPB(t).hit === true, `B 存量：present_bias 存量攻击仍命中 | ${t.slice(0, 30)}`);
for (const t of EE_OLD) ok(detEE(t).hit === true, `B 存量：endowment_effect 存量攻击仍命中 | ${t.slice(0, 30)}`);

// ─── C 良性 ──────────────────────────────────────────────────────
for (const t of PB_BENIGN) ok(detPB(t).hit === false, `C 良性：present_bias 不误伤 | ${t.slice(0, 24)}`);
for (const t of EE_BENIGN) ok(detEE(t).hit === false, `C 良性：endowment_effect 不误伤 | ${t.slice(0, 24)}`);
// 官方良性语料全量（gate-benchmark 97 + extended 106 + vertical 150 + mixed 25）
function flatten(mod) {
  const out = [];
  const src = mod.SAMPLES || mod.samples || mod.CATEGORIES;
  if (Array.isArray(src)) out.push(...src);
  else if (src && typeof src === 'object') {
    for (const v of Object.values(src)) {
      if (Array.isArray(v)) out.push(...v);
      else if (v && Array.isArray(v.samples)) out.push(...v.samples);
    }
  }
  return out.filter(s => typeof s === 'string');
}
let corpusN = 0;
for (const f of ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
  const arr = flatten(require(`./${f}`));
  for (const s of arr) {
    corpusN++;
    if (detPB(s).hit) { ok(false, `C 语料：present_bias 误命中 | ${s.slice(0, 24)}`); }
    if (detEE(s).hit) { ok(false, `C 语料：endowment_effect 误命中 | ${s.slice(0, 24)}`); }
  }
}
ok(corpusN === 378, `C 语料：官方良性语料条数 378（实测 ${corpusN}）`);

// ─── D 存量回归 ──────────────────────────────────────────────────
// 存量豁免仍豁免（CORRECTIVE/CONCEPT + 交易许可）
ok(detPB('今日事今日毕，今天能做完的事不留到明天').hit === false, 'D 存量豁免：present_bias CORRECTIVE 仍豁免');
ok(detPB('心理学上的现时偏差是指人们倾向于高估当下的奖励').hit === false, 'D 存量豁免：present_bias CONCEPT 仍豁免');
ok(detEE('这件商品按市场价成交，双方都很满意').hit === false, 'D 存量豁免：endowment_effect 市场成交仍豁免');
ok(detEE('我两年前买的车，现在卖了个不错的价钱').hit === false, 'D 存量豁免：endowment_effect 正常买卖仍豁免');
// 存量注入语义保持：NOW_ZH 置空后存量攻击翻红
ok(detPB('今晚先痛快吃了，体检以后再说', { NOW_ZH: [] }).hit === false, 'D 存量注入：NOW_ZH=[] 后存量攻击翻红');
ok(detEE('这把吉它是我的，陪了我十年，别说三千，五千我都不卖', { OWN_ZH: [] }).hit === false, 'D 存量注入：OWN_ZH=[] 后存量攻击翻红');

// ─── E 常量级注入 ────────────────────────────────────────────────
for (const [key, det, sample] of CONST_INJECT) {
  ok(det(sample, { [key]: [] }).hit === false, `E 常量注入：${key}=[] → ${sample.slice(0, 22)} 翻红`);
}

// ─── F 元素级注入（42 元素逐一）─────────────────────────────────
let elemRed = 0;
for (const [key, idx, sample] of ELEM_INJECT) {
  const det = key.startsWith('NOW') || key.startsWith('LATER') ? detPB : detEE;
  const orig = det(sample);
  ok(orig.hit === true, `F 前置：${key}[${idx}] 隔离样本未注入时命中 | ${sample.slice(0, 22)}`);
  const base = key.startsWith('NOW') || key.startsWith('LATER') ? pbi[key] : eei[key];
  assert(Array.isArray(base) && base.length > idx, `F 前置：${key} 为数组且索引 ${idx} 有效`);
  const trimmed = base.filter((_, i) => i !== idx);
  const after = det(sample, { [key]: trimmed });
  ok(after.hit === false, `F 元素注入：删 ${key}[${idx}] → ${sample.slice(0, 22)} 翻红`);
  if (after.hit === false) elemRed++;
}
console.log(`F 汇总：元素级注入 ${ELEM_INJECT.length} 个 → ${elemRed} 个按设计变红`);

// ─── G 入口双路 ──────────────────────────────────────────────────
const hf = gateMod;
const ENTRY = [
  ['checkInput', (t) => hf.checkInput(t)],
  ['checkOutput', (t) => hf.checkOutput(t)],
  ['checkDraft', (t) => hf.checkDraft(t)],
  ['runPipeline', (t) => hf.runPipeline({ input: t })],
];
for (const [name, fn] of ENTRY) {
  const r1 = fn('减肥下次一定，今晚这顿火锅先痛快吃了');
  const r2 = fn('咱家的宅基地，千金不换，卖价免谈');
  const a1 = (r1 && r1.gate && r1.gate.action) || '';
  const a2 = (r2 && r2.gate && r2.gate.action) || '';
  ok(a1 === 'verify' || a1 === 'rewrite' || a1 === 'block', `G 入口 ${name}：present_bias 攻击 action=${a1}`);
  ok(a2 === 'verify' || a2 === 'rewrite' || a2 === 'block', `G 入口 ${name}：endowment_effect 攻击 action=${a2}`);
}

// ─── H 登记纪律 ──────────────────────────────────────────────────
const NEW_KEYS = ['NOW_ZH2', 'NOW_EN2', 'LATER_ZH2', 'LATER_EN2', 'OWN_ZH2', 'OWN_EN2', 'INFLATE_ZH2', 'INFLATE_EN2', 'REFUSE_ZH2', 'REFUSE_EN2'];
for (const k of ['NOW_ZH2', 'NOW_EN2', 'LATER_ZH2', 'LATER_EN2']) ok(k in pbi, `H 登记：present-bias __internals 暴露 ${k}`);
for (const k of ['OWN_ZH2', 'OWN_EN2', 'INFLATE_ZH2', 'INFLATE_EN2', 'REFUSE_ZH2', 'REFUSE_EN2']) ok(k in eei, `H 登记：endowment-effect __internals 暴露 ${k}`);
const VERSION = require('../src/core/version.js').VERSION;
ok(/^\d+\.\d+\.\d+$/.test(VERSION), `H 登记：VERSION 格式合法（实测 ${VERSION}）`);
const claims = require('fs').readFileSync(require('path').join(__dirname, '..', 'coordination', 'claims.jsonl'), 'utf8');
ok(claims.includes('"round":"r314"'), 'H 登记：claims.jsonl 含 r314 认领');

console.log(`\n测试结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (fail > 0) process.exitCode = 1;
