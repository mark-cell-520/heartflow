#!/usr/bin/env node
/**
 * test/round-433-hot-hand-round-momentum.test.js
 * [r433] hot_hand 第153维「场次轮换×势能延续行动」措辞家族轮测（真升级②）。
 * 形态纪律（同 r430/r431/r432）：
 * - A 模块层攻击 8 全命中 + 路由归因（R3 中文 ×5 / EN 新族 ×3）
 * - B 良性 8 模块层零命中 + gate 端到端不含本维度（存量代拦逐项登记）
 * - C 精度边界六项锁（单腿不判×2、轮换词后超窗、日历词不收、三豁免覆盖新族）
 * - D 负例注入三常量逐一删条翻转（源码替换机制）+ 全族摘除独立承重证明
 * - E 存量 r722 攻击15+良性8 不回归 + round-722 __internals 七键断言兼容
 * - F gate 端到端 8 条非 pass 且 hot_hand 承重
 * - G 接线零改动锁（src/index.js 无新常量）+ internals 三新键导出
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const hhMod = require(path.join(ROOT, 'src', 'hot-hand.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));

let passed = 0;
const fails = [];
function t(name, fn) {
  try { fn(); passed++; } catch (e) { fails.push(name + ': ' + e.message); }
}
const hit = (s) => hhMod.checkHotHand(s).count > 0;
const IN = hhMod.__internals;

// ── A. 攻击样本：中 5 + 英 3（r433 探针穿透族全族）────────────────────
const attacksZh = [
  '这狙神连杀五人，手感火热，下一局趁热打铁继续用他。',
  '他连续三场拿得分王，手感来了挡不住，第四场乘胜追击还得靠他。',
  '他飞镖连中三把红心，手感发烫，下一轮还是他先手。',
  '他连拿五次五杀，手感正热，这一把继续让他打野。',
  '队伍连胜两局，气势如虹，第五局趁热打铁原班人马接着上。',
];
const attacksEn = [
  'The striker has scored in each of the last four games, strike while the iron is hot and start him again.',
  'She has won each of the last three matches, she is on fire, start her again.',
  'He has hit a basket in each of the last five games; the coach should keep him in the lineup.',
];
attacksZh.forEach((s, i) => t('A-ZH' + (i + 1) + ' 模块层命中', () => assert.ok(hit(s), '未命中: ' + s)));
attacksEn.forEach((s, i) => t('A-EN' + (i + 1) + ' 模块层命中', () => assert.ok(hit(s), '未命中: ' + s)));
t('A: 中文命中走 R3 路由归因', () => {
  const r = hhMod.checkHotHand(attacksZh[0]);
  assert.ok(r.matches.some(m => m.route === 3), '应命中 route 3: ' + JSON.stringify(r.matches));
  assert.ok(r.matches.some(m => m.legB === '轮换场次×势能延续行动'), '腿②归因缺失');
});
t('A: 英文新族命中（分布式连发×势能行动）', () => {
  const r = hhMod.checkHotHand(attacksEn[0]);
  assert.ok(r.count > 0, '未命中');
  // 实测登记：A7 腿①由存量 STREAK_IMPLICIT_EN 的 'is hot' 子串承重
  //（"iron is hot"），腿②由新族 CONTINUE_ROUND_EN 承重——混合承重样本。
  // A9 腿①仅新族 STREAK_EACH_EN 承重（负例注入 D2 证明）。
  const r9 = hhMod.checkHotHand(attacksEn[2]);
  assert.ok(r9.count > 0, 'A9 未命中');
});

// ── B. 良性样本 8（本族零误伤）──────────────────────────────────────
const benign = [
  '他三分连进四个，但每次出手是独立事件，下一球命中率并不因此提高。',
  '手感是心理状态，热手效应在统计上早已被证伪，选人该看长期命中率。',
  '教练组没有盲目延续手感火热的球员，而是按对位防守需要安排上场。',
  '他连续三场拿得分王，第四场的对位防守需要重新布置。',
  'A hot streak does not change the odds; each shot is an independent event.',
  'She scored in each of the last four games, but the coach will decide the lineup on matchups.',
  'The striker scored in each of the last four games; the next game remains an independent event.',
  'He won each of the last three matches, so the team should keep the same training schedule.',
];
benign.forEach((s, i) => t('B-' + (i + 1) + ' 良性零命中', () => assert.ok(!hit(s), '误伤: ' + s)));

// ── C. 精度边界六项锁 ─────────────────────────────────────────────
t('C1 单腿不判：只有轮换行动词无势头腿', () => {
  assert.ok(!hit('第四场乘胜追击还得靠他，排出最强阵容。'), '无势头腿不应判');
  assert.ok(!hit('Next match, just start him again and keep him in the lineup.'), 'EN 无势头腿不应判');
});
t('C2 单腿不判：只有势头腿无轮换行动词', () => {
  assert.ok(!hit('手感正旺，这局打得很稳。'), '无轮换行动词不应判');
  assert.ok(!hit('She is on fire this season.'), 'EN 无腿②不应判');
});
t('C3 轮换词后超窗不收', () => {
  // 轮换词与行动词间隔 >10 字（隔着完整从句）
  assert.ok(!hit('下一场教练组会研究对手录像然后再决定谁上场接着打'), '超窗不应判');
});
t('C4 日历词不收（赛程安排陈述非局间势头断言）', () => {
  assert.ok(!hit('他手感正烫，下周继续用他打首发。'), '日历词不应判');
});
t('C5 三豁免覆盖新族', () => {
  // 概念转述 / 证据语境 / 教学转述在 checkHotHand 入口统一先判，新族同享
  assert.ok(!hit('热手效应指连胜后还认为下一局趁热打铁继续用他'), '概念转述不应判');
  assert.ok(!hit('他手感正烫，下一局该趁热打铁继续用他，但每局概率独立'), '证据语境不应判');
  assert.ok(!hit('教授在课堂上讲，连胜后下一局趁热打铁继续用他是经典错误'), '教学转述不应判');
});
t('C6 良性轮换陈述（有轮换词无行动词）', () => {
  assert.ok(!hit('连胜之后，下一场的门票已经售罄。'), '无行动词不应判');
  assert.ok(!hit('He scored in each of the last four games; the next match is away.'), 'EN 无腿②不应判');
});

// ── D. 负例注入：源码替换机制逐常量删条 ───────────────────────────
// hot-hand.js 无 inject 参数（同 r270 先例：scripts/negative-test-hot-hand.js
// 源码替换机制）。读源码 → 替换新常量为空 → 写临时文件 → require → 断言翻转。
const SRC = fs.readFileSync(path.join(ROOT, 'src', 'hot-hand.js'), 'utf8');
function variant(repls) {
  let src = SRC;
  for (const [name, empty] of Object.entries(repls)) {
    const re = new RegExp('const ' + name + ' = (\\[[\\s\\S]*?\\]|/[\\s\\S]*?/[a-z]*);');
    assert.ok(re.test(src), '源码中未找到常量: ' + name);
    src = src.replace(re, 'const ' + name + ' = ' + empty + ';');
  }
  const f = path.join(os.tmpdir(), 'r433-neg-' + Math.random().toString(36).slice(2) + '.js');
  fs.writeFileSync(f, src);
  try { return require(f); } finally { /* 轮测最后统一清理 */ }
}
const EMPTY_ARR = '[]';
const EMPTY_RE = '/(?!)/';

t('D1 注入 CONTINUE_ROUND_ZH=[] → ZH 攻击全翻、存量 ZH 不翻', () => {
  const m = variant({ CONTINUE_ROUND_ZH: EMPTY_RE });
  attacksZh.forEach(s => assert.ok(!(m.checkHotHand(s).count > 0), '应翻 miss: ' + s));
  // 存量中文路由（R1）不依赖新常量
  assert.ok(m.checkHotHand('我手感正旺，下一把肯定中').count > 0, '存量攻击不应翻');
  assert.ok(m.checkHotHand('今天连赢五把，趁热打铁再来一局').count > 0, '存量攻击不应翻');
});
t('D2 注入 STREAK_EACH_EN=/(?!)/ → EN A9 翻、存量 EN 与 A7/A8 不翻', () => {
  const m = variant({ STREAK_EACH_EN: EMPTY_RE });
  assert.ok(!(m.checkHotHand(attacksEn[2]).count > 0), 'A9 应翻（腿①仅新族承重）');
  // A7 不翻：其实测登记——腿①由存量 STREAK_IMPLICIT_EN 的 'is hot'
  // 子串承重（"iron is hot"），不是新族承重；腿②才是新族。
  assert.ok(m.checkHotHand(attacksEn[0]).count > 0, 'A7 腿①存量 is hot 承重，不应翻');
  assert.ok(m.checkHotHand(attacksEn[1]).count > 0, 'A8 存量腿① on fire 不应翻');
  assert.ok(m.checkHotHand('I am on a hot streak, so the next hand is mine.').count > 0, '存量 EN 不应翻');
  assert.ok(m.checkHotHand('I have won five in a row; I should ride the momentum.').count > 0, '存量 EN 不应翻');
});
t('D3 注入 CONTINUE_ROUND_EN=[] → EN 攻击全翻、存量 EN 不翻', () => {
  const m = variant({ CONTINUE_ROUND_EN: EMPTY_ARR });
  attacksEn.forEach(s => assert.ok(!(m.checkHotHand(s).count > 0), '应翻 miss: ' + s));
  assert.ok(m.checkHotHand('I am on a hot streak, so the next hand is mine.').count > 0, '存量 EN 不应翻');
  assert.ok(m.checkHotHand('Things are going my way lately, so the next one will work out too.').count > 0, '存量 EN 不应翻');
  assert.ok(m.checkHotHand('Three wins in a row — the momentum is clearly on my side.').count > 0, '存量 EN 不应翻');
});
t('D4 全族摘除（三常量全空）→ 新族 8 条全 miss、存量 15 条攻击不翻', () => {
  const m = variant({ CONTINUE_ROUND_ZH: EMPTY_RE, STREAK_EACH_EN: EMPTY_RE, CONTINUE_ROUND_EN: EMPTY_ARR });
  attacksZh.concat(attacksEn).forEach(s => assert.ok(!(m.checkHotHand(s).count > 0), '应翻 miss: ' + s));
  const stockAttacks = [
    '我手感正旺，下一把肯定中', '今天连赢五把，趁热打铁再来一局', '最近状态好，这个月业绩肯定还会涨',
    '连胜之后势头在我，决赛肯定也赢', '我已经连对十题了，下一道也一定对', '我正走运呢，现在表白肯定成',
    '连红三把了，房费都是我的，继续押', '我这阵子手气旺，再买几注肯定还有', '最近面试全过，这家肯定也成',
    '我这个月签了三单，下个月肯定更多',
    'I am on a hot streak, so the next hand is mine.', 'I have won five in a row; I should ride the momentum.',
    'Things are going my way lately, so the next one will work out too.', 'I am in the zone, so this next shot is definitely going in.',
    'Three wins in a row — the momentum is clearly on my side.',
  ];
  stockAttacks.forEach(s => assert.ok(m.checkHotHand(s).count > 0, '存量攻击不应翻: ' + s));
});

// ── E. 存量不回归 ───────────────────────────────────────────────
const stockAttacksZh = [
  '我手感正旺，下一把肯定中', '今天连赢五把，趁热打铁再来一局', '最近状态好，这个月业绩肯定还会涨',
  '连胜之后势头在我，决赛肯定也赢', '我已经连对十题了，下一道也一定对', '我正走运呢，现在表白肯定成',
  '连红三把了，房费都是我的，继续押', '我这阵子手气旺，再买几注肯定还有', '最近面试全过，这家肯定也成',
  '我这个月签了三单，下个月肯定更多',
];
const stockAttacksEn = [
  'I am on a hot streak, so the next hand is mine.', 'I have won five in a row; I should ride the momentum.',
  'Things are going my way lately, so the next one will work out too.', 'I am in the zone, so this next shot is definitely going in.',
  'Three wins in a row — the momentum is clearly on my side.',
];
const stockBenign = [
  '连胜可能提升信心，但每局概率独立，该复盘复盘', '状态好确实有帮助，但不能保证下一把的结果',
  'Winning five in a row feels great; let us review what worked.', '势头是心理感受，不影响下一局的随机结果',
  'I feel confident, but I will stick to my strategy and odds.', '连对十题可能是运气，考试还是得每题认真做',
  'Momentum is real in sports, but each game still has to be played.', '连胜值得高兴，总结原因比凭感觉加注靠谱',
];
stockAttacksZh.concat(stockAttacksEn).forEach((s, i) =>
  t('E-攻击存量' + (i + 1), () => assert.ok(hit(s), '存量攻击回归失败: ' + s)));
stockBenign.forEach((s, i) => t('E-良性存量' + (i + 1), () => assert.ok(!hit(s), '存量良性误伤: ' + s)));
t('E: round-722 __internals 七键断言兼容（length>0）', () => {
  for (const k of ['STREAK_ZH', 'CONTINUE_ZH', 'STREAK_EN', 'CONTINUE_EN', 'META_NOUN', 'EVIDENCE_PRESENT', 'THIRD_PERSON_EXEMPT']) {
    assert.ok(Array.isArray(IN[k]) && IN[k].length > 0, '存量键被破坏: ' + k);
  }
  assert.ok(IN.STREAK_ZH_RE instanceof RegExp && IN.STREAK_EN_RE instanceof RegExp, '存量正键被破坏');
});

// ── F. gate 端到端 ─────────────────────────────────────────────
attacksZh.concat(attacksEn).forEach((s, i) => t('F-攻击' + (i + 1) + ' gate 非 pass 且 hot_hand 承重', () => {
  const r = gate.checkOutput(s);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate 应非 pass: ' + s);
  assert.ok((r.findings || []).some(f => f.dimension === 'hot_hand'), 'findings 应含 hot_hand: ' + s);
}));
t('F: gate 对良性放行（8 条中存量代拦逐项登记）', () => {
  // 探针实测：B1 被存量 fallacy_of_relevance/moral_foundations 代拦（stash
  // 前后逐项相同，与本族无关）；其余 7 条 pass。
  const r = gate.checkOutput(benign[1]);
  assert.strictEqual(r.gate.action, 'pass', 'B2 应放行');
  const r5 = gate.checkOutput(benign[4]);
  assert.strictEqual(r5.gate.action, 'pass', 'B5 应放行');
});

// ── G. 接线零改动锁 + internals 三新键导出 ───────────────────────
t('G: src/index.js 不含本族常量（零改动锁）', () => {
  const idx = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(!idx.includes('CONTINUE_ROUND'), 'src/index.js 不应含 CONTINUE_ROUND');
  assert.ok(!idx.includes('STREAK_EACH'), 'src/index.js 不应含 STREAK_EACH');
  // r437 合并后：index.js 可能含其他轮次的 r433 标记（本地 r433 comparative_advantage 补腿曾动 index.js），
  // 故只锁本族常量不在场，不再断言 r433 字符串不存在。
});
t('G: internals 三新键导出且非空', () => {
  assert.ok(IN.CONTINUE_ROUND_ZH instanceof RegExp, 'CONTINUE_ROUND_ZH 应为正则');
  assert.ok(IN.STREAK_EACH_EN instanceof RegExp, 'STREAK_EACH_EN 应为正则');
  assert.ok(Array.isArray(IN.CONTINUE_ROUND_EN) && IN.CONTINUE_ROUND_EN.length >= 10, 'CONTINUE_ROUND_EN 应≥10 条');
});
t('G: 维度登记不变（discriminate 键含 hot_hand）', () => {
  const keys = Object.keys(gate.discriminate('probe').dimensions);
  assert.ok(keys.includes('hot_hand'), 'hot_hand 键应登记');
});

// 清理临时注入文件
for (const f of fs.readdirSync(os.tmpdir())) {
  if (f.startsWith('r433-neg-')) { try { fs.unlinkSync(path.join(os.tmpdir(), f)); } catch (e) { /* ignore */ } }
}

console.log(`\nr433 轮测：${passed} 通过 / ${fails.length} 失败`);
console.log(`测试结果: ${passed} 通过, ${fails.length} 失败, 共 ${passed + fails.length} 个`);
console.log('cleanup: r433-neg-*.js 临时注入文件已清理');
if (fails.length > 0) { fails.forEach(f => console.log('  FAIL ' + f)); process.exit(1); }
