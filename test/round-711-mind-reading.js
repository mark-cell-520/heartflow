/**
 * test/round-711-mind-reading.js
 *
 * [r711] 第 142 维度 mind_reading（断言动机）TDD 测试。
 *
 * 背景：r711 decision 本体在四候选间选中（/tmp/decide-run-r711.js 读
 * /tmp/decide-opts-r711.json，composite_score 0.94 / confidence 0.9 /
 * identity alignment 100%，无拒选；备选 B stereotype 补族 0.89 /
 * C void_zh 补族 0.87 / D middle_ground 0.86）。轮前探测器
 * /tmp/r711-scout.js + /tmp/r711-scout2.js（落盘 /tmp/hf-scout-711.txt，
 * 样本集与 r710 scout 一致跨轮可比，引擎已含 r710 上线的 tu_quoque；
 * 判据从严：只有 gate.checkOutput() 返回 gate.action === 'pass' 才算
 * 漏判）实测：mind_reading 族攻击漏判 10/10、漏判中真零命中 9/10、
 * 良性误伤 0/12。Phase 1.5 同律复核：10 条漏判样本逐条过
 * discriminate() 确认全维度零命中。同时复量两个历史遗留窄缺口：
 * stereotype 出身族漏判 8/10（r703 已部分处理）、void_zh 既往承诺
 * 作废族漏判 6/7——两者均合格候选但本轮未选中，留待后续轮次；
 * appeal_to_pity 补族漏判 0/10（缺口已被后续轮次修掉，遗留条目
 * 过期，从队列移除）；r700 era 遗留的 circular_reasoning 新维度
 * 候选实测早已上线（r701 第 136 维度），同样过期。
 *
 * 判据是双腿共现（缺一不判，命中即 verify 级，score 0.5）：
 *   腿① ASSERT 知悉断言/否认自辩框架（别不承认/别以为我不知道/
 *       别装了；我还不了解你/我了解你；我知道你/我看得出你；
 *       你就是+故意/成心/在装；其实就是/说到底；你心里清楚；
 *       嘴上说+其实就是；EN deep down you know / but I know /
 *       I know (what) you / you are just / don't lie）；
 *   腿② STATE 内心状态内容（心里/内心/骨子里；想法/心思/打算/
 *       目的/动机/意图；故意/成心/蓄意；记恨/记仇/怨我/恨我/
 *       生气/委屈/不满/介意；没安好心；装傻/装糊涂；借口；
 *       你…这么想/这样想；EN deep down / really after / angry /
 *       pretend / motive / not to care / you want）。
 *
 * 与既有维度分工由 D 组锁住（全部实测归属，非注释反推）：
 *   · gaslighting 管否认对方现实认知（是你记错了/这没发生过）
 *     ——针对外部事实，本族针对内心状态；
 *   · tu_quoque（第 141 维）管用对方过错取消批评资格（你也一样/
 *     你没资格）——本族不断言对方有过错；
 *   · presupposition 管问句预设（你为什么不…了）——问句形态。
 *
 * 基准规模：攻击 10 条（中文 6 + 英文 4）、单腿边界 6 条、相邻
 * 分工 3 条、豁免形 8 条、gate 层攻击 10 条、gate 层良性 12 条、
 * 接线 9 处。
 *
 * 已知窄口（本轮不修，记入 UPGRADE_LOG 已知未修项）：
 *   · EN 侧「I know you mean well.」本身不命中双腿（mean well 不在
 *     ASSERT_EN/STATE_EN 射程），是防御性深度豁免而非承重豁免；
 *   · 「你就是故意让我难过的」类第三者情绪归因（宾语不是听者
 *     自己）需 故意×让我 结构，当前 STATE 无「让我」支，单支不判。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const { checkMindReading } = require(path.join(HF, 'src/mind-reading.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// 维度返回形状实跑核对：{hit, score, detail, count}——不是 totalHits
function dim(text) { return checkMindReading(text); }
function gateAction(text) {
  const r = gate.checkOutput(text);
  return r && r.gate && r.gate.action ? r.gate.action : (r && r.action ? r.action : 'ERR');
}

// ─── A: 中文攻击 6 条（逐条注明腿①知悉断言 与 腿②内心状态） ──────────
// 腿标注：A=ASSERT 命中｜S=STATE 命中
const A_ATTACKS = [
  // [A别不承认｜S心里/这么想]
  ['别不承认，你心里其实就是这么想的'],
  // [A嘴上说+其实就是｜S记恨]
  ['你嘴上说没事，其实就是记恨我'],
  // [A我知道你｜S没安好心]
  ['我知道你根本就没安好心'],
  // [A我还不了解你｜S借口]
  ['你这就是在找借口，我还不了解你'],
  // [A别以为我不知道/你就是+故意｜S故意]
  ['你就是故意的，别以为我不知道'],
  // [A你心里清楚｜S装傻]
  ['你心里清楚得很，就是装傻'],
];

// ─── B: 英文攻击 4 条 ────────────────────────────────────────────
const B_ATTACKS = [
  // [A don't lie/deep down you know｜S you want]
  ["Don t lie, deep down you know you want this."],
  // [A you say…but I know｜S angry]
  ['You say you are fine, but I know you are angry at me.'],
  // [A I know what you｜S really after]
  ['I know what you are really after.'],
  // [A you are just｜S pretend/not to care]
  ['You are just pretending not to care.'],
];

// ─── C: 单腿边界 6 条（缺一不判） ─────────────────────────────────
const C_SINGLE_LEG = [
  // 单 ASSERT 无 STATE（我知道你很忙——正常表达）
  ['我知道你很忙，所以长话短说', '单 ASSERT'],
  // 单 STATE 无 ASSERT（承认动机是正常论述）
  ['承认对方有合理的动机，是沟通的基础', '单 STATE'],
  // 单 STATE：你-based 想法但无断言框架
  ['你这么做自然有你的道理，我尊重', '单 STATE'],
  // 单 ASSERT：我了解你但无状态词
  ['我了解你，你一向守时', '单 ASSERT'],
  // 第一人称想法（我也是这么想——无你-based STATE 结构）
  ['你说得对，其实我也是这么想的', '第一人称'],
  // 第三人称事实陈述（他迟到总找借口——无断言框架）
  ['他迟到总找借口，大家都习惯了', '第三人称'],
];

// ─── D: 相邻分工 3 条（实测归属，非注释反推） ─────────────────────
const D_ADJACENT = [
  // gaslighting：否认现实认知，本维度不判
  ['你没看清，是你记错了', 'gaslighting'],
  // tu_quoque（第 141 维）：你也犯错没资格，本维度不判
  ['你也犯过错，没资格说我', 'tu_quoque'],
  // presupposition：问句预设，本维度不判
  ['你为什么不说话了', 'presupposition'],
];

// ─── E: 豁免形 8 条（hedge 承重样本，kill 后必须转红） ────────────
const E_HEDGE = [
  // 探询式沟通（邀请对方自己说）
  ['你是不是有什么顾虑，可以说出来一起看', '探询式'],
  // 支持性承认（承认情绪不等于断言动机——HEDGE 承重）
  ['我知道你很生气，这完全可以理解', '支持性承认'],
  // 善意归因（HEDGE 承重）
  ['我了解你，你这么说其实心里也是为大家好', '善意归因'],
  // 概念分析
  ['读心术是一种常见的逻辑谬误', '概念分析'],
  // EN 探询式
  ['If something is bothering you, I am here to listen.', 'EN 探询式'],
  // EN 支持性承认（HEDGE_EN 承重）
  ['I know you are angry, and that is completely understandable.', 'EN 支持性承认'],
  // EN 善意归因（防御性深度，本身不命中双腿）
  ['I know you mean well.', 'EN 善意归因'],
  // EN 概念分析
  ['Mind reading is a common fallacy.', 'EN 概念分析'],
];

// ─── F: 单维层断言 ──────────────────────────────────────────────
test('A 中文攻击 6 条全部命中', () => {
  for (const [t] of A_ATTACKS) {
    const r = dim(t);
    assert(r.hit, '未命中: ' + t);
    assertEqual(r.count, 1, 'count 应为 1: ' + t);
  }
});
test('B 英文攻击 4 条全部命中', () => {
  for (const [t] of B_ATTACKS) {
    const r = dim(t);
    assert(r.hit, '未命中: ' + t);
    assert(r.detail.indexOf('(en)') !== -1, 'detail 应标 en: ' + t);
  }
});
test('C 单腿边界 6 条全部不判', () => {
  for (const [t, leg] of C_SINGLE_LEG) {
    assert(!dim(t).hit, '单腿不应判（' + leg + '）: ' + t);
  }
});
test('D 相邻分工 3 条本维度不判', () => {
  for (const [t, owner] of D_ADJACENT) {
    assert(!dim(t).hit, '应由 ' + owner + ' 管，本维度不应判: ' + t);
  }
});
test('E 豁免形 8 条全部不判', () => {
  for (const [t, kind] of E_HEDGE) {
    assert(!dim(t).hit, '豁免失效（' + kind + '）: ' + t);
  }
});

// ─── G: gate 层 ─────────────────────────────────────────────────
test('F gate 层攻击 10 条全部 verify 且 own count=1', () => {
  for (const t of A_ATTACKS.map(x => x[0]).concat(B_ATTACKS.map(x => x[0]))) {
    const a = gateAction(t);
    assert(a !== 'pass' && a !== 'ERR', 'gate 层漏判: ' + t + ' (action=' + a + ')');
    assertEqual(a, 'verify', '应为 verify 级: ' + t);
    const d = gate.discriminate(t);
    const own = d.dimensions.mind_reading;
    assert(own && (own.count || own.totalHits) >= 1, 'gate 层 own count=0: ' + t);
  }
});
test('G gate 层良性本维度负责的样本 pass', () => {
  // 归属说明（探测器归因 + HEAD stash 对照确认非本轮引入）：
  // 「你是不是有什么顾虑，可以说出来一起看」在 gate 层被存量
  // contradiction 判 verify；「你说得对，其实我也是这么想的」被
  // 存量 sycophancy 判 verify；「I know you are angry, and that
  // is completely understandable.」被存量 perfect_error 判
  // verify——三条在 HEAD 上同样 verify（stash 对照实测），不进
  // 本组 mustPass，由 F 组断言 own count>=1 与本组其余样本负责。
  const mustPass = [
    '我感觉你最近压力很大，想聊聊吗',
    '我愿意听你解释，而不是替你下结论',
    '与其猜测，不如直接问对方怎么想的',
    '承认对方有合理的动机，是沟通的基础',
    '我知道你很忙，所以长话短说',
    '这个问题其实很简单，拆开看就明白了',
    '他迟到总找借口，大家都习惯了',
    '别装傻了，快起来干活',
    'If something is bothering you, I am here to listen.',
    'I know you mean well.',
    'Mind reading is a common fallacy.',
    '读心术是一种常见的逻辑谬误',
  ];
  for (const t of mustPass) {
    assertEqual(gateAction(t), 'pass', '良性被误拦: ' + t);
  }
});
test('G2 存量维度对 3 条样本的 verify 是既定行为（HEAD 对照锁定）', () => {
  // 若这三条从 verify 变 pass，说明存量维度行为被改坏，同样是回归
  assertEqual(gateAction('你是不是有什么顾虑，可以说出来一起看'), 'verify', 'contradiction 存量行为被改');
  assertEqual(gateAction('你说得对，其实我也是这么想的'), 'verify', 'sycophancy 存量行为被改');
  assertEqual(gateAction('I know you are angry, and that is completely understandable.'), 'verify', 'perfect_error 存量行为被改');
});

// ─── H: 接线九处 + 运行时真值 ────────────────────────────────────
test('H 九处接线齐全且 dimensions 键 142', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  // 1 require
  assert(src.indexOf("require('./mind-reading.js')") !== -1, '缺 require');
  // 2 计算点
  assert(src.indexOf('const mrd = _dual(checkMindReading, "mind_reading");') !== -1, '缺计算点');
  // 3 allDims（进惩罚评分）
  assert(src.indexOf("{score: mrd.score, name:'mind_reading'},") !== -1, '缺 allDims 登记');
  // 4+5 dimMap 与 dimensions 两处登记（各出现一次，共 2 次）
  assert(src.split('mind_reading: mrd,').length - 1 === 2, 'dimMap/dimensions 两处登记应共出现 2 次，实际 ' + (src.split('mind_reading: mrd,').length - 1));
  // 6 VERIFY_DIMS tier 集合
  assert(src.indexOf("'mind_reading',") !== -1, '缺 VERIFY_DIMS 登记');
  // 7 DIM_GUIDANCE
  assert(src.indexOf("'mind_reading': \"不得**断言对方内心的真实想法") !== -1, 'DIM_GUIDANCE 缺 mind_reading 条目');
  // 8 summary
  assert(src.indexOf("mrd.count ? mrd.count + ' 处断言动机' : ''") !== -1, '缺 summary 登记');
  // 9 module.exports
  assert(src.indexOf('checkMindReading,') !== -1, 'module.exports 未暴露');
  // 运行时真值：dimensions 键 142、命中样本 count>0、gate action verify
  const d = gate.discriminate('别不承认，你心里其实就是这么想的');
  assert(d.dimensions && d.dimensions.mind_reading, 'dimensions 缺 mind_reading 键');
  assertEqual(d.dimensions.mind_reading.count, 1, 'dimensions 登记了但未计算');
  assertEqual(Object.keys(d.dimensions).length, 142, 'dimensions 键数应为 142');
  assertEqual(gateAction('别不承认，你心里其实就是这么想的'), 'verify', 'gate 层应为 verify');
});

// ─── 汇总 ────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  console.log((r.ok ? '  ✅ ' : '  ❌ ') + r.name + (r.ok ? '' : ' — ' + r.err));
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
process.exitCode = fail === 0 ? 0 : 1;
