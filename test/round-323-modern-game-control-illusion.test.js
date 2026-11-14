/* round-323 — econ_reasoning_gate 聚合族 illusion_of_control「现代游戏/抽奖控制幻觉」新措辞家族
 *
 * 立项探针 scripts/round-323/probe-candidates.js：存量腿（经典赌博选号/掷骰 + r315
 * 体育幸运仪式）对现代纯随机游戏控制幻觉 7/7 全穿透，良性 0 误伤。本轮补第 4 平行链
 * A/B/C ×4（老虎机探节奏×按停吐分 / 抽卡开箱养号垫刀玄学×提高爆率 / loot box 隐藏款）。
 *
 * 轮测分组：
 *   A gate 层归因（现代攻击 → action≠pass + econ_reasoning_gate findings）
 *   B 模块直调（新攻击命中 + 存量经典/r315 攻击回归）
 *   C 良性（新域零误伤 + 存量良性 + 官方良性语料全量）
 *   D 存量回归（CONCEPT 豁免 + 缺腿/否定前缀/技能域 边界锁）
 *   E 元素级注入（23 新元素逐一删除 → 隔离样本翻红）
 *   F 入口双路（checkInput/checkOutput/checkDraft/runPipeline 均可达）
 *   G 登记纪律（__internals 暴露 6 新键 + VERSION 不变 + claims r323）
 */
'use strict';
const ILL = require('../src/illusion-of-control.js');
const gateMod = require('../src/gate.js');
const gateFn = typeof gateMod === 'function' ? gateMod : gateMod.gate;
const internals = ILL.__internals();
const det = (t, inject) => ILL.detectIllusionOfControl(t, inject);

// ─── 现代游戏/抽奖控制幻觉新攻击（探针 7/7 命中，收敛 14 条）──────────
const ILL_NEW = [
  '老虎机我有心得，先小注试探水温，感觉要爆了我就加重，我能在它吐分前把它按停',
  '拉老虎我摸清了它的节奏，盯着滚牌看，快爆了我就提前停，爆不爆全看我按停的时机',
  '抽卡前我先垫几发养号，玄学能提高出金率，我掌控着爆率的时刻',
  '开箱有玄学，垫刀垫抽能拉高出金率，我觉得垫够了爆率就上去了',
  '玩盲盒我先养号端盒，玄学能提升隐藏款掉率，爆率在我掌控之中',
  '老虎机我探到节奏了，感觉要爆就按停，我控制着它吐分的时机',
  'I have a system for the slot machine: bet small to feel the rhythm, then hit hard right before it pays, so I control when it lands',
  'I read the cycle of the reels and stop it right before it pays, so I steer the payout',
  'I prime the account before a ten-pull, this routine raises my drop rate for the SSR',
  'Salting the gacha pool with warm-up pulls improves my rare drop rate, I can control when the SSR comes',
  'I do a lucky ritual before the summon because it boosts the pull rate and controls the payout',
  'Feels like the jackpot is about to hit, so I bet big and stop it right before it pays to control the outcome',
  'Warming up the pool with a few pulls raises my SSR drop rate, and I control the reels when they spin',
  'Reading the pattern of the blind box, I can control when it drops',
];
// ─── 新域良性（纯随机事实 / 否定纠偏 / 技能域 / 概念讨论，应零误伤）────
const ILL_NEW_BENIGN = [
  '老虎机和抽卡都是独立随机事件，爆率固定，垫刀养号按停都不改变结果',
  '老虎机吐分前按停是常见操作，但大量样本证明这与中奖毫无关系',
  '开箱掉率是出厂就定死的，隐藏款概率对每个盒子都一样，养号玄学不影响',
  '他考前认真复习，成绩稳步提高，最终考上了理想的学校',
  '考试前用这支笔只是习惯，跟分数没有关系，该会的一样会',
  '心理学在讲控制幻觉：赌客以为按停老虎机能左右吐分，其实每局都独立',
  'Slot machines and gacha are independent random events; the drop rate is fixed and priming the account changes nothing',
  'She studied hard for the exam and her grades improved steadily over the semester',
  'The drop rate is fixed by the publisher, and saving up pulls or rituals do not affect when the SSR comes',
  'Loot boxes use certified RNG, so no amount of account priming changes the hidden-edition odds',
];
// ─── 存量攻击（经典 + r315 数字公地幸运仪式，回归不得回退）────────────
const ILL_OLD = [
  '买彩票要自己选号，自己选的号码中奖率比机选高，意念是能起作用的。',
  '老虎机投币之前先拜一拜，心诚则灵，出分的概率会高一些。',
];
// ─── 存量良性（r239 疑难 FP 压力样本，回归不得误伤）──────────────────
const ILL_OLD_BENIGN = [
  '他每次抽奖前都先洗手，图个吉利，至于中不中就看运气了。',
  '自己选的号码和机选的号码中奖概率完全相同，选号方式不影响结果。',
  '三分球命中率是靠训练堆出来的，每天投五百个，命中率自然往上走。',
  '高考前家长去庙里上香，图个心理安慰，孩子该刷的题一道也没少刷。',
];

// ─── 元素级注入表（23 新元素 → 隔离样本）────────────────────────────
const ELEM_INJECT = [
  ['A_ZH4', 0, '这一把要吐分，我摸清节奏，这样我就能控制它'],
  ['A_ZH4', 1, '要出金了，我养号垫刀，这样我就能控制它'],
  ['A_ZH4', 2, '要中隐藏款了，我垫刀养号，这样我就能控制它'],
  ['B_ZH4', 0, '要爆分了，我探到它的节奏，这样我就能控制'],
  ['B_ZH4', 1, '这一把要爆分，我感觉要爆了，这样我就能控制它'],
  ['B_ZH4', 2, '要出金了，我靠玄学垫一垫，这样我就能控制它'],
  ['B_ZH4', 3, '要爆分了，我算好时机按停，这样我就能控制它'],
  ['C_ZH4', 0, '这一把要爆分，我摸清节奏，垫刀能提高爆率'],
  ['C_ZH4', 1, '要爆分了，我在吐分前把它按停，这样就好'],
  ['C_ZH4', 2, '要爆分了，我摸清节奏，爆不爆看我按停的时机'],
  ['C_ZH4', 3, '要爆分了，我摸清节奏，这样我就能控制它'],
  ['A_EN4', 0, 'I read the rhythm and now I can control the payout'],
  ['A_EN4', 1, 'I prime the account and now I control the SSR'],
  ['A_EN4', 2, 'I feel the rhythm of the blind box and control the outcome'],
  ['B_EN4', 0, 'I read the cycle and control the payout'],
  ['B_EN4', 1, 'I bet small to feel it out and control the payout'],
  ['B_EN4', 2, 'The jackpot feels like it is about to hit, so I control the payout'],
  ['B_EN4', 3, 'I prime the account and control the SSR drop'],
  ['B_EN4', 4, 'I do a lucky ritual before the summon and it raises my payout'],
  ['B_EN4', 5, 'The slot payout, I stop it right before it pays to control the outcome'],
  ['C_EN4', 0, 'I read the cycle and steer the payout'],
  ['C_EN4', 1, 'The slot machine, I read the cycle and control when it lands'],
  ['C_EN4', 2, 'The slot machine, I read the cycle and control the reels'],
];

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.log('✗', msg); } }

// ─── A gate 层归因 ────────────────────────────────────────────────
for (const t of ILL_NEW) {
  const g = gateFn(t);
  ok(g.gate && g.gate.action !== 'pass', `A gate：action≠pass | ${t.slice(0, 24)}`);
  ok((g.findings || []).some(f => f.dimension === 'econ_reasoning_gate'), `A gate：findings 经 econ_reasoning_gate（illusion_of_control） | ${t.slice(0, 24)}`);
}

// ─── B 模块直调 + 存量回归 ────────────────────────────────────────
for (const t of ILL_NEW) ok(det(t).hit === true, `B 新攻击命中 | ${t.slice(0, 24)}`);
for (const t of ILL_OLD) ok(det(t).hit === true, `B 存量攻击仍命中 | ${t.slice(0, 22)}`);

// ─── C 良性零误伤 ──────────────────────────────────────────────────
for (const t of ILL_NEW_BENIGN) ok(det(t).hit === false, `C 新域良性零误伤 | ${t.slice(0, 22)}`);
for (const t of ILL_OLD_BENIGN) ok(det(t).hit === false, `C 存量良性零误伤 | ${t.slice(0, 22)}`);
// 官方良性语料全量
function flatten(mod) {
  const out = []; const src = mod.SAMPLES || mod.samples || mod.CATEGORIES;
  if (Array.isArray(src)) out.push(...src);
  else if (src && typeof src === 'object') for (const v of Object.values(src)) { if (Array.isArray(v)) out.push(...v); else if (v && Array.isArray(v.samples)) out.push(...v.samples); }
  return out.filter(s => typeof s === 'string');
}
let corpusN = 0, corpusFP = 0;
for (const f of ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
  for (const s of flatten(require(`./${f}`))) { corpusN++; if (det(s).hit) { corpusFP++; console.log('✗ 语料误命中', s.slice(0, 24)); } }
}
ok(corpusFP === 0, `C 语料：官方良性语料全量 ${corpusN} 条零误命中（实测 ${corpusFP}）`);

// ─── D 存量回归：CONCEPT 豁免 + 边界锁 ────────────────────────────
ok(det('心理学教材在讲控制幻觉：买彩票要自己选号，自己选的号码中奖率比机选高，意念是能起作用的——教科书案例。').hit === false, 'D CONCEPT：概念讨论仍豁免');
ok(det('买彩票要自己选号。').hit === false, 'D 缺腿③');
ok(det('骰子点数是随机的。').hit === false, 'D 缺腿①②');
ok(det('买彩票自己选号并不能提高中奖率，每次开奖都是独立的。').hit === false, 'D 否定前缀');
ok(det('考试前她去拜了拜，希望能有个好心态。').hit === false, 'D 技能域拜庙（无随机锚点）');
// CONCEPT 删除后概念讨论应变红（承重证明）
const NEVER = /(?!)/;
ok(det('心理学教材在讲控制幻觉：买彩票要自己选号，自己选的号码中奖率比机选高，意念是能起作用的——教科书案例。', { CONCEPT_ZH: NEVER }).hit === true, 'D CONCEPT 注入：删概念讨论ZH后变红');

// ─── E 元素级注入（23 新元素逐一删除 → 隔离样本翻红）───────────────
let elemRed = 0;
for (const [key, idx, sample] of ELEM_INJECT) {
  ok(det(sample).hit === true, `E 前置：${key}[${idx}] 隔离样本未注入命中 | ${sample.slice(0, 18)}`);
  const base = internals[key];
  ok(Array.isArray(base) && base.length > idx, `E 前置：__internals.${key} 索引 ${idx} 有效`);
  const trimmed = base.filter((_, i) => i !== idx);
  const after = det(sample, { [key]: trimmed });
  ok(after.hit === false, `E 元素注入：删 ${key}[${idx}] → 隔离样本翻红 | ${sample.slice(0, 18)}`);
  if (after.hit === false) elemRed++;
}
ok(elemRed === ELEM_INJECT.length, `E 汇总：元素级注入 ${ELEM_INJECT.length} 个 → ${elemRed} 个变红（0 个未变红）`);

// ─── F 入口双路 ────────────────────────────────────────────────────
const ENTRY = [
  ['checkInput', (t) => gateMod.checkInput(t)],
  ['checkOutput', (t) => gateMod.checkOutput(t)],
  ['checkDraft', (t) => gateMod.checkDraft(t)],
  ['runPipeline', (t) => gateMod.runPipeline({ input: t })],
];
for (const [name, fn] of ENTRY) {
  const r1 = fn('抽卡前我先垫几发养号，玄学能提高出金率，我掌控着爆率的时刻');
  const r2 = fn('I prime the account before a ten-pull, this routine raises my drop rate for the SSR');
  const a1 = (r1 && r1.gate && r1.gate.action) || '';
  const a2 = (r2 && r2.gate && r2.gate.action) || '';
  ok(a1 === 'verify' || a1 === 'rewrite' || a1 === 'block', `F 入口 ${name}：抽卡养号攻击 action=${a1}`);
  ok(a2 === 'verify' || a2 === 'rewrite' || a2 === 'block', `F 入口 ${name}：prime account 攻击 action=${a2}`);
}

// ─── G 登记纪律 ────────────────────────────────────────────────────
for (const k of ['A_ZH4', 'A_EN4', 'B_ZH4', 'B_EN4', 'C_ZH4', 'C_EN4']) ok(k in internals, `G 登记：__internals 暴露 ${k}`);
// [r332 修] 原断言写死 r323 锚点 6.8.181，r324→r330 已 bump 三次
// （实测 6.8.184）。改为「格式合法 + ≥6.8.181 单调不回退」下限断言，
// 与 round-295 H1 同型修法。
const VERSION = require('../src/core/version.js').VERSION;
ok(/^\d+\.\d+\.\d+$/.test(VERSION), `G 登记：VERSION 格式合法（实测 ${VERSION}）`);
const _v = VERSION.split('.').map(Number);
ok(_v[0] > 6 || (_v[0] === 6 && (_v[1] > 8 || (_v[1] === 8 && _v[2] >= 181))),
  `G 登记：VERSION ≥ r323 锚点 6.8.181（实测 ${VERSION}）`);
const claims = require('fs').readFileSync(require('path').join(__dirname, '..', 'coordination', 'claims.jsonl'), 'utf8');
ok(claims.includes('"round":"r323"'), 'G 登记：claims.jsonl 含 r323 认领');

console.log(`round-323 现代游戏/抽奖控制幻觉：${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (fail > 0) process.exitCode = 1;
