/* round-315 — econ_reasoning_gate 聚合族新措辞家族续篇
 * illusion_of_control「竞技赛事幸运仪式」族 + tragedy_of_commons「数字公地/免费额度」族
 *
 * 轮测分组：
 *   A gate 层归因（新攻击 → gate action ≠ pass + dimension findings）
 *   B 模块直调（新攻击全命中 + 存量攻击回归）
 *   C 良性（手工豁免样本 + 官方良性语料全量 378）
 *   D 存量回归（存量豁免仍豁免 + 存量注入语义保持）
 *   E 常量级注入（12 个新常量置空 → 依赖攻击翻红）
 *   F 元素级注入（40 个新元素逐一删除 → 隔离样本翻红）
 *   G 入口双路（checkInput/checkOutput/checkDraft/runPipeline 均可达）
 *   H 登记纪律（__internals 新键暴露 + VERSION 不变 + claims 登记）
 */
'use strict';
const assert = require('assert');
const IOC = require('../src/illusion-of-control.js');
const TOC = require('../src/tragedy-of-commons.js');
const gateMod = require('../src/gate.js');
const gateFn = typeof gateMod === 'function' ? gateMod : gateMod.gate;
const ioc = IOC.__internals();
const toc = TOC.__internals();

// ─── 攻击语料 ─────────────────────────────────────────────────────
// illusion_of_control 体育赛事幸运仪式新攻击（pristine 基座 9/10 零命中；
// 第 0 条已被存量 ①-b×②-f×③-a 覆盖，转 B 组存量回归样本）
const IOC_NEW = [
  '比赛日我一定穿上那件旧球衣，这个习惯保持了十年，它给我们队带来好运',
  '我专门买了幸运色围巾戴着看直播，朋友说我这样支持，主队赢面更大',
  '他坚持坐在看台的老位置，用同一个杯子看完每一场比赛，说这个仪式能提高球队的胜率',
  '她坚信赛前摸一摸队徽能带来胜利，这种仪式让夺冠的机会更大',
  '我穿着幸运球衣不离身，多喊几声加油，说这样能左右这场比赛',
  'I have worn the same lucky jersey to every game this season, I am convinced it raises our odds of winning',
  'He sits in the same seat and drinks from the same mug every match, he believes this ritual improves the team chances',
  'I wear my lucky socks to every game and cheer as loud as I can, because my support helps the team win',
  'She touches the club crest before every match because it brings us good luck',
];
// tragedy_of_commons 数字公地新攻击（pristine 基座 8/8 零命中）
const TOC_NEW = [
  '公共WiFi不限量，我每天多下几部剧，反正不蹭白不蹭，带宽成本大家分摊',
  '平台的免费额度每月清零，能薅的羊毛一定要薅，抢到就是赚到',
  '免费API谁都能调用，我们多注册几个账号轮着请求，不用白不用',
  '开源镜像不限速，脚本党批量抓取，手快有手慢无，先到先得',
  '共享充电桩就那么多，每个人都多占一会儿，先到先得嘛',
  'The public WiFi has no cap, so everyone downloads as much as they can — if it is free, take as much as you can',
  'Free API credits expire at the end of the month, so we might as well stock up on requests',
  'The shared compute cluster is first come first served, so each job grabs as much as it can',
];

// ─── 良性语料 ─────────────────────────────────────────────────────
const IOC_BENIGN = [
  '这场决赛很精彩，双方球队都发挥出了高水平',
  '他每个主场都到现场助威，是球队十几年的老球迷',
  '运动员赛前要热身、听音乐，这是教练组安排的常规流程',
  '赛前仪式包括升旗和奏国歌，然后双方队员入场',
  '穿复古球衣是为了纪念那场经典比赛',
  '控制幻觉的经典实验是兰格1975年的办公室抽奖',
  'The match was thrilling, both teams played at a high level',
  'He goes to every home game to support the team, a loyal fan for fifteen years',
  'The pre-match ritual of shaking hands is part of fair play',
  'Wearing the retro shirt was a tribute to that classic final',
];
const TOC_BENIGN = [
  '这家咖啡馆提供免费WiFi，顾客可以正常上网办公',
  '开源社区镜像站由基金会维护，欢迎按需下载',
  '公共充电桩按分钟计费，充满请及时驶离',
  '平台每月赠送免费流量额度，可在有效期内使用',
  '共享单车高峰期运力紧张，运维增加了调度',
  '公共资源需要确权和配额，避免耗竭',
  'The café offers free WiFi for customers',
  'The open-source mirror is maintained by the foundation, download as needed',
  'Each user gets a free monthly allowance for API calls',
  'Free tier usage is capped, please contact sales for higher quotas',
];

// ─── 常量级注入表（新常量 → 依赖攻击）────────────────────────────
const CONST_INJECT = [
  ['IOC', 'A_ZH3', '那件旧球衣我穿了十年，朋友说它能让我在决赛里获胜概率更高'],
  ['IOC', 'A_EN3', 'I wear my lucky socks to every match, it raises our chances of winning'],
  ['IOC', 'B_ZH3', '决赛那天我一定穿幸运球衣，朋友说这样主队获胜概率更高'],
  ['IOC', 'B_EN3', 'I have worn my lucky jersey to every game, and it raises our odds of winning'],
  ['IOC', 'C_ZH3', '我戴着幸运色围巾看直播，朋友说我这样支持，主队赢面更大'],
  ['IOC', 'C_EN3', 'With my lucky jersey on, our team is more likely to win tonight'],
  ['TOC', 'A_ZH3', '数据公地人人可用，我们多抓一份是一份，先到先得'],
  ['TOC', 'A_EN3', 'The public data lake is open to all, so each team scrapes as much as it can, first come first served'],
  ['TOC', 'B_ZH3', '公共WiFi不限量，我每天多下几部剧，反正不蹭白不蹭，带宽成本大家分摊'],
  ['TOC', 'B_EN3', 'The public WiFi has no cap, so everyone downloads as much as they can — if it is free, take as much as you can'],
  ['TOC', 'C_ZH3', '公共WiFi不限量，我每天多下几部剧，反正不蹭白不蹭'],
  ['TOC', 'C_EN3', 'Free API credits expire at the end of the month, so we might as well stock up on requests'],
];

// ─── 元素级注入表（模块 → 常量 → 元素索引 → 隔离样本）─────────────
const ELEM_INJECT = [
  // illusion_of_control（24 元素）
  ['IOC', 'A_ZH3', 0, '那件旧球衣我穿了十年，朋友说它能让我在决赛里获胜概率更高'],
  ['IOC', 'A_ZH3', 1, '我穿着幸运球衣不离身，朋友说这样能带动球队夺冠'],
  ['IOC', 'A_EN3', 0, 'I wear my lucky socks to every match, it raises our chances of winning'],
  ['IOC', 'A_EN3', 1, 'My lucky mug sits beside me whenever the team plays, and it brings us good luck'],
  ['IOC', 'B_ZH3', 0, '决赛那天我一定穿幸运球衣，朋友说这样主队获胜概率更高'],
  ['IOC', 'B_ZH3', 1, '他每场比赛都坐在看台老位置，说这个固定习惯能让主队胜率更高'],
  ['IOC', 'B_ZH3', 2, '她坚持赛前摸一摸队徽，说这个动作能给球队带来好运'],
  ['IOC', 'B_EN3', 0, 'I have worn my lucky jersey to every game, and it raises our odds of winning'],
  ['IOC', 'B_EN3', 1, 'He sits in the same seat for every match and believes it helps the team win'],
  ['IOC', 'B_EN3', 2, 'Their game-day ritual is wearing the same socks, convinced it brings the team fortune'],
  ['IOC', 'B_EN3', 3, 'She kisses the club crest before every final, saying it brings us luck'],
  ['IOC', 'C_ZH3', 0, '我戴着幸运色围巾看直播，朋友说我这样支持，主队赢面更大'],
  ['IOC', 'C_ZH3', 1, '他穿着那件旧球衣看完每场比赛，说这个仪式能提高球队的胜率'],
  ['IOC', 'C_ZH3', 2, '我穿着幸运球衣不离身，多喊几声加油，说这样能左右这场比赛'],
  ['IOC', 'C_ZH3', 3, '比赛日我一定穿上那件旧球衣，这个习惯保持了十年，它给我们队带来好运'],
  ['IOC', 'C_EN3', 0, 'With my lucky jersey on, our team is more likely to win tonight'],
  ['IOC', 'C_EN3', 1, 'I wear my lucky socks to every game and cheer as loud as I can, because my support helps the team win'],
  ['IOC', 'C_EN3', 2, 'He truly believes his pre-match routine affects the outcome of the final'],
  ['IOC', 'C_EN3', 3, 'She touches the club crest before every match because it brings us good luck'],
  ['IOC', 'C_EN3', 4, 'I have worn the same lucky jersey to every game this season, I am convinced it raises our odds of winning'],
  // tragedy_of_commons（20 元素）
  ['TOC', 'A_ZH3', 0, '数据公地人人可用，我们多抓一份是一份，先到先得'],
  ['TOC', 'A_ZH3', 1, '开源镜像不限速，脚本党批量抓取，手快有手慢无，先到先得'],
  ['TOC', 'A_ZH3', 2, '额度池是共享的，我们多注册几个账号轮着领，不用白不用'],
  ['TOC', 'A_ZH3', 3, '平台每月赠送流量包，我多下几个安装包，不蹭白不蹭'],
  ['TOC', 'A_EN3', 0, 'The public data lake is open to all, so each team scrapes as much as it can, first come first served'],
  ['TOC', 'A_EN3', 1, 'The shared compute cluster is open to every researcher, each job grabs as much as it can — first come first served'],
  ['TOC', 'A_EN3', 2, 'The data allowance expires at midnight, so everyone downloads as much as they can — grab it before it is gone'],
  ['TOC', 'B_ZH3', 0, '公共WiFi不限量，我每天多下几部剧，反正不蹭白不蹭，带宽成本大家分摊'],
  ['TOC', 'B_ZH3', 1, '开源镜像不限速，脚本党批量抓取，手快有手慢无，先到先得'],
  ['TOC', 'B_ZH3', 2, '免费额度就那么多，我们轮着请求接口，先到先得'],
  ['TOC', 'B_EN3', 0, 'The public WiFi has no cap, so everyone downloads as much as they can — if it is free, take as much as you can'],
  ['TOC', 'B_EN3', 1, 'Our scrapers sweep the free API every night, might as well stock up before the quota resets'],
  ['TOC', 'B_EN3', 2, 'We stock up on free credits before the monthly reset, grab it before it is gone'],
  ['TOC', 'C_ZH3', 0, '公共WiFi不限量，我每天多下几部剧，反正不蹭白不蹭'],
  ['TOC', 'C_ZH3', 1, '平台的免费额度每月清零，能薅的羊毛一定要薅，抢到就是赚到'],
  ['TOC', 'C_ZH3', 2, '免费接口的调用额度月底清零，我们多注册几个账号轮着请求'],
  ['TOC', 'C_EN3', 0, 'Free API credits expire at the end of the month, so we might as well stock up on requests'],
  ['TOC', 'C_EN3', 1, 'The public WiFi has no cap, so everyone takes as much as they can — if it is free, take as much as you can'],
  ['TOC', 'C_EN3', 2, 'The data allowance expires at midnight, so everyone grabs as much as possible — grab it before it is gone'],
  ['TOC', 'C_EN3', 3, 'The shared compute cluster is first come first served, so each job grabs as much as it can'],
];

const detIOC = (t, inject) => IOC.detectIllusionOfControl(t, inject);
const detTOC = (t, inject) => TOC.detectTragedyOfCommons(t, inject);
const detOf = (m) => (m === 'IOC' ? detIOC : detTOC);
const internalsOf = (m) => (m === 'IOC' ? ioc : toc);

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('✓', msg); }
  else { fail++; console.log('✗', msg); }
}

// ─── A gate 层归因 ───────────────────────────────────────────────
for (const t of IOC_NEW) {
  const g = gateFn(t);
  ok(g.gate && g.gate.action !== 'pass', `A gate：体育幸运仪式新攻击 action≠pass | ${t.slice(0, 28)}`);
  ok((g.findings || []).some(f => f.dimension === 'econ_reasoning_gate'), `A gate：findings 经 econ_reasoning_gate 聚合层（illusion_of_control） | ${t.slice(0, 28)}`);
}
for (const t of TOC_NEW) {
  const g = gateFn(t);
  ok(g.gate && g.gate.action !== 'pass', `A gate：数字公地新攻击 action≠pass | ${t.slice(0, 28)}`);
  ok((g.findings || []).some(f => f.dimension === 'econ_reasoning_gate'), `A gate：findings 经 econ_reasoning_gate 聚合层（tragedy_of_commons） | ${t.slice(0, 28)}`);
}

// ─── B 模块直调 ──────────────────────────────────────────────────
for (const t of IOC_NEW) ok(detIOC(t).hit === true, `B 模块：体育幸运仪式新攻击命中 | ${t.slice(0, 28)}`);
for (const t of TOC_NEW) ok(detTOC(t).hit === true, `B 模块：数字公地新攻击命中 | ${t.slice(0, 28)}`);
// 存量攻击回归（改前已命中）
const IOC_OLD = [
  '买彩票要自己选号，自己选的号码中奖率比机选高，意念是能起作用的。',
  '掷骰子的时候心里默念大点数，手上顺势用力甩，出大的机会就更大。',
  '抽奖箱里我摸了半天，凭手感挑一个，摸得久挑得准，比随手一抓机会大。',
  '每次决赛我都穿那件幸运球衣，朋友说我看球这么虔诚，主队获胜的概率会更高',
];
const TOC_OLD = [
  '这片草场是公共的，每家多养几只羊自己就多挣一份，至于草场退化那是大家一起承担的。',
  '地下水不要钱，我们村多种一季稻就多一季收入，谁节省谁吃亏。',
  '渔场是大家的，每条船都加大捕捞量，最后资源枯竭，可每条船的选择都是理性的。',
  'The pasture is shared, so each family that adds more cattle earns more, and the overgrazing cost falls on everyone.',
];
for (const t of IOC_OLD) ok(detIOC(t).hit === true, `B 存量：illusion_of_control 存量攻击仍命中 | ${t.slice(0, 26)}`);
for (const t of TOC_OLD) ok(detTOC(t).hit === true, `B 存量：tragedy_of_commons 存量攻击仍命中 | ${t.slice(0, 26)}`);

// ─── C 良性 ──────────────────────────────────────────────────────
for (const t of IOC_BENIGN) ok(detIOC(t).hit === false, `C 良性：illusion_of_control 不误伤 | ${t.slice(0, 24)}`);
for (const t of TOC_BENIGN) ok(detTOC(t).hit === false, `C 良性：tragedy_of_commons 不误伤 | ${t.slice(0, 24)}`);
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
let corpusN = 0, corpusFP = 0;
for (const f of ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
  const arr = flatten(require(`./${f}`));
  for (const s of arr) {
    corpusN++;
    if (detIOC(s).hit) { corpusFP++; ok(false, `C 语料：illusion_of_control 误命中 | ${s.slice(0, 24)}`); }
    if (detTOC(s).hit) { corpusFP++; ok(false, `C 语料：tragedy_of_commons 误命中 | ${s.slice(0, 24)}`); }
  }
}
ok(corpusN === 378, `C 语料：官方良性语料条数 378（实测 ${corpusN}）`);
ok(corpusFP === 0, `C 语料：378 条全量零误命中（实测误命中 ${corpusFP}）`);

// ─── D 存量回归 ──────────────────────────────────────────────────
ok(detIOC('我买彩票喜欢固定守一组号，习惯了，也没指望这样更容易中。').hit === false, 'D 存量豁免：illusion_of_control 良性守号仍豁免');
ok(detIOC('心理学教材在讲控制幻觉：买彩票要自己选号，自己选的号码中奖率比机选高，意念是能起作用的——教科书案例。').hit === false, 'D 存量豁免：illusion_of_control CONCEPT 仍豁免');
ok(detTOC('公地悲剧是哈丁1968年提出的概念，奥斯特罗姆对公共资源治理有系统研究。').hit === false, 'D 存量豁免：tragedy_of_commons CONCEPT 仍豁免');
ok(detTOC('这片草场是公共的，需要确权和轮捕制度来避免退化。').hit === false, 'D 存量豁免：tragedy_of_commons 治理方案仍豁免');
// 存量注入语义保持：存量腿置空后存量攻击翻红
ok(detIOC('买彩票要自己选号，自己选的号码中奖率比机选高，意念是能起作用的。', { A_ZH: [] }).hit === false, 'D 存量注入：A_ZH=[] 后存量攻击翻红');
ok(detTOC('这片草场是公共的，每家多养几只羊自己就多挣一份，至于草场退化那是大家一起承担的。', { A_ZH: [] }).hit === false, 'D 存量注入：A_ZH=[] 后存量攻击翻红');

// ─── E 常量级注入 ────────────────────────────────────────────────
for (const [m, key, sample] of CONST_INJECT) {
  ok(detOf(m)(sample, { [key]: [] }).hit === false, `E 常量注入：${m}.${key}=[] → ${sample.slice(0, 22)} 翻红`);
}

// ─── F 元素级注入（44 元素逐一）─────────────────────────────────
let elemRed = 0;
for (const [m, key, idx, sample] of ELEM_INJECT) {
  const det = detOf(m);
  const orig = det(sample);
  ok(orig.hit === true, `F 前置：${m}.${key}[${idx}] 隔离样本未注入时命中 | ${sample.slice(0, 22)}`);
  const base = internalsOf(m)[key];
  assert(Array.isArray(base) && base.length > idx, `F 前置：${m}.${key} 为数组且索引 ${idx} 有效`);
  const trimmed = base.filter((_, i) => i !== idx);
  const after = det(sample, { [key]: trimmed });
  ok(after.hit === false, `F 元素注入：删 ${m}.${key}[${idx}] → ${sample.slice(0, 22)} 翻红`);
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
  const r1 = fn('决赛那天我一定穿幸运球衣，朋友说这样主队获胜概率更高');
  const r2 = fn('公共WiFi不限量，我每天多下几部剧，反正不蹭白不蹭，带宽成本大家分摊');
  const a1 = (r1 && r1.gate && r1.gate.action) || '';
  const a2 = (r2 && r2.gate && r2.gate.action) || '';
  ok(a1 === 'verify' || a1 === 'rewrite' || a1 === 'block', `G 入口 ${name}：体育幸运仪式攻击 action=${a1}`);
  ok(a2 === 'verify' || a2 === 'rewrite' || a2 === 'block', `G 入口 ${name}：数字公地攻击 action=${a2}`);
}

// ─── H 登记纪律 ──────────────────────────────────────────────────
for (const k of ['A_ZH3', 'A_EN3', 'B_ZH3', 'B_EN3', 'C_ZH3', 'C_EN3']) {
  ok(k in ioc, `H 登记：illusion-of-control __internals 暴露 ${k}`);
  ok(k in toc, `H 登记：tragedy-of-commons __internals 暴露 ${k}`);
}
const VERSION = require('../src/core/version.js').VERSION;
ok(/^\d+\.\d+\.\d+$/.test(VERSION), `H 登记：VERSION 格式合法（实测 ${VERSION}）`);
const claims = require('fs').readFileSync(require('path').join(__dirname, '..', 'coordination', 'claims.jsonl'), 'utf8');
ok(claims.includes('"round":"r315"'), 'H 登记：claims.jsonl 含 r315 认领');

console.log(`\n测试结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (fail > 0) process.exitCode = 1;
