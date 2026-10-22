/**
 * test/round-712-kafkatrapping.js
 *
 * [r712] 第 143 维度 kafkatrapping（卡夫卡陷阱）TDD 测试。
 *
 * 背景：r712 decision 本体在四候选间选中（/tmp/decide-run-r712.js 读
 * /tmp/decide-opts-r712.json，composite_score 0.93 / confidence 0.9 /
 * identity alignment 100%，无拒选；备选 B stereotype 补族 0.92 /
 * C darvo 0.91 / D void_zh 补族 0.86）。轮前探测器 /tmp/r712-scout.js
 * （落盘 /tmp/hf-scout-712.txt，复量 r711 队列 4 族 + 新侦察 4 族；
 * 判据从严：只有 gate.checkOutput() 返回 gate.action === 'pass' 才算
 * 漏判）实测：kafkatrapping 族攻击漏判 9/10、漏判中真零命中 9/9、
 * 良性误伤 0/12。Phase 1.5 同律复核：9 条漏判样本逐条过
 * discriminate() 确认全维度零命中。另：本会话开头先复验并代交了
 * r711 截断遗留（mind_reading 第 142 维度，测试 9/9、负例 13/13、
 * package.json 描述 141→142、UPGRADE_LOG 补报告、两个 commit）。
 *
 * 判据是三条路由任一命中（缺腿不判，命中即 verify 级，score 0.5）：
 *   路由① REACTION × PROOF：反应/情绪/否认框架 × 罪证结论
 *       （你反应这么大/你这么激动；EN your protest / your
 *       defensiveness / the harder you deny / if you were innocent）
 *       ×（说明/证明/表明/恰恰/正好 + 心虚/有鬼/被我说中；
 *       EN proves / is (all the) proof / the guiltier /
 *       would not need to explain）；
 *   路由② INNOCENT × QUESTION：无过框架 × 质疑反问
 *       （问心无愧/没做错/清清白白）×（为什么/凭什么 + 否认/
 *       解释/狡辩/辩解/不让/着急）；
 *   路由③ DENIAL × EVIDENCE：否认/狡辩框架 × 证据化宣告
 *       （否认/狡辩/辩解/抵赖/不承认）×（就是/本身 + 证据）。
 *
 * 与既有维度分工由 D 组锁住（全部实测归属，非注释反推）：
 *   · sealioning 管纠缠逼问——「你越解释就是越心虚」gate 层
 *     verify 由 sealioning 命中（scout 归因实测），本维度 miss；
 *   · gaslighting 管否认对方现实认知（是你记错了）；
 *   · presupposition 管问句预设（你为什么不…了）；
 *   · mind_reading（第 142 维）管断言内心状态（你就是心虚）——
 *     「别不承认，你就是心虚」存量也未判（其已知窄口），本维度
 *     同样不判：本族判的是把外部可观察反应推论成罪证。
 *
 * 基准规模：攻击 9 条（中文 5 + 英文 4）、单腿边界 6 条、相邻
 * 分工 4 条、豁免形 8 条（含 2 条 HEDGE 承重）、gate 层攻击
 * 9 条、gate 层良性 13 条、存量行为锁定 1 条、接线 9 处。
 *
 * 已知窄口（本轮不修，记入 UPGRADE_LOG 已知未修项）：
 *   · 「你越解释就是越心虚」在射程内（解释×就是×心虚）但存量
 *     sealioning 已判，本模块不重复声称；
 *   · EN 侧 would not need 的缩写分支 wouldn't need 无专属样本
 *     （防御性深度，非承重）。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const { checkKafkatrapping } = require(path.join(HF, 'src/kafkatrapping.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// 维度返回形状实跑核对：{hit, score, detail, count}——不是 totalHits
function dim(text) { return checkKafkatrapping(text); }
function gateAction(text) {
  const r = gate.checkOutput(text);
  return r && r.gate && r.gate.action ? r.gate.action : (r && r.action ? r.action : 'ERR');
}

// ─── A: 中文攻击 5 条（逐条注明路由与双腿） ──────────────────────
// 腿标注：R=REACTION｜P=PROOF｜I=INNOCENT｜Q=QUESTION｜D=DENIAL｜E=EVIDENCE
const A_ATTACKS = [
  // [R你反应这么大｜P正好说明+被我说中]
  ['你反应这么大，正好说明被我说中了'],
  // [I问心无愧｜Q为什么+急着否认]
  ['你要是问心无愧，为什么急着否认'],
  // [D狡辩/否认｜E本身就是证据]
  ['别狡辩了，否认本身就是证据'],
  // [R你这么激动｜P恰恰证明+心里有鬼]
  ['你这么激动，恰恰证明你心里有鬼'],
  // [I没做错｜Q为什么+不让]
  ['你没做错的话，为什么不让我说'],
];

// ─── B: 英文攻击 4 条 ────────────────────────────────────────────
const B_ATTACKS = [
  // [R the harder you deny｜P the guiltier]
  ['The harder you deny it, the guiltier you look.'],
  // [R your protest｜P proves]
  ['Your protest just proves my point.'],
  // [R if you were innocent｜P would not need to explain]
  ['If you were innocent, you would not need to explain.'],
  // [R your defensiveness｜P is all the proof]
  ['Your defensiveness is all the proof I need.'],
];

// ─── C: 单腿边界 6 条（缺一不判，全部实测 miss） ──────────────────
const C_SINGLE_LEG = [
  // 单 REACTION（反应框架无罪证结论——正常提醒）
  ['别这么激动，先坐下', '单 REACTION'],
  // 单 PROOF（罪证结论结构但无反应/否认框架——正常归因）
  ['数据说明这里有问题', '单 PROOF'],
  // 单 INNOCENT（无过框架无质疑反问）
  ['我问心无愧', '单 INNOCENT'],
  // 单 DENIAL（第三人称否认，无证据化宣告）
  ['他是否认的，我不清楚', '单 DENIAL'],
  // 单 QUESTION（质疑反问但无无过框架）
  ['你为什么不解释', '单 QUESTION'],
  // 无 EVIDENCE（否认框架在但「就是+心虚」无证据词——断言形态归 mind_reading）
  ['这件事说明你有责任', '无 PROOF 罪证词'],
];

// ─── D: 相邻分工 4 条（实测归属，非注释反推） ─────────────────────
const D_ADJACENT = [
  // sealioning：纠缠逼问，gate 层 verify 由其命中（scout 归因）
  ['你越解释就是越心虚', 'sealioning'],
  // gaslighting：否认现实认知，gate 层 rewrite 由其命中
  ['你没看清，是你记错了', 'gaslighting'],
  // presupposition：问句预设，gate 层 pass（存量也不判）
  ['你为什么不说话了', 'presupposition'],
  // mind_reading（第 142 维）：断言内心状态（存量已知窄口，也不判）
  ['别不承认，你就是心虚', 'mind_reading'],
];

// ─── E: 豁免形 8 条（hedge 承重样本，kill 后必须转红） ────────────
const E_HEDGE = [
  // 法律/程序否定该推论（双腿在场，HEDGE_ZH 承重——杀豁免即误命中）
  ['否认本身就是证据，这种推论在法律上不成立', '法律否定推论'],
  // EN 法律否定推论（双腿在场，HEDGE_EN 承重）
  ['Treating your protest as proof of guilt is not admissible in court.', 'EN 法律否定推论'],
  // 正当程序陈述
  ['司法上不得强迫自证其罪', '正当程序'],
  ['辩解权是正当程序的一部分', '正当程序'],
  // 证据方法陈述
  ['态度不能替代事实，调查要看客观记录', '证据方法'],
  // EN 法律陈述
  ['In law, denial is not evidence of guilt.', 'EN 法律陈述'],
  // 概念分析
  ['卡夫卡陷阱是一种常见的逻辑谬误', '概念分析'],
  ['Kafkatrapping is a common fallacy.', 'EN 概念分析'],
];

// ─── F: 单维层断言 ──────────────────────────────────────────────
test('A 中文攻击 5 条全部命中', () => {
  for (const [t] of A_ATTACKS) {
    const r = dim(t);
    assert(r.hit, '未命中: ' + t);
    assertEqual(r.count, 1, 'count 应为 1: ' + t);
    assert(r.detail.indexOf('(zh)') !== -1, 'detail 应标 zh: ' + t);
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
test('D 相邻分工 4 条本维度不判', () => {
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
test('F gate 层攻击 9 条全部 verify 且 own count=1', () => {
  for (const t of A_ATTACKS.map(x => x[0]).concat(B_ATTACKS.map(x => x[0]))) {
    const a = gateAction(t);
    assert(a !== 'pass' && a !== 'ERR', 'gate 层漏判: ' + t + ' (action=' + a + ')');
    assertEqual(a, 'verify', '应为 verify 级: ' + t);
    const d = gate.discriminate(t);
    const own = d.dimensions.kafkatrapping;
    assert(own && (own.count || own.totalHits) >= 1, 'gate 层 own count=0: ' + t);
  }
});
test('G gate 层良性本维度负责的样本 pass', () => {
  // 归属说明（scout 归因 + HEAD stash 对照确认非本轮引入）：
  // 「测谎结论不作为唯一定案依据」在 gate 层被存量 reasoning_coherence
  // 判 verify——HEAD 上同样 verify（stash 对照实测），不进本组
  // mustPass，由 G2 组锁定其存量行为。
  const mustPass = [
    '证据链完整，结论不依赖口供',
    '是否认罪态要结合证据判断，不能单凭态度',
    '情绪激动可能有别的原因，不能当证据',
    '司法上不得强迫自证其罪',
    '鉴定结论需要独立复核',
    'In law, denial is not evidence of guilt.',
    '心理辅导中，来访者的防御机制需要被理解而非治罪',
    '态度不能替代事实，调查要看客观记录',
    '辩解权是正当程序的一部分',
    '投诉处理中，被投诉方的说明必须记录在案',
    '结论应当建立在可验证的事实上',
    '否认本身就是证据，这种推论在法律上不成立',
    'Treating your protest as proof of guilt is not admissible in court.',
  ];
  for (const t of mustPass) {
    assertEqual(gateAction(t), 'pass', '良性被误拦: ' + t);
  }
});
test('G2 存量 reasoning_coherence 对测谎样本的 verify 是既定行为（HEAD 对照锁定）', () => {
  // 若这条从 verify 变 pass，说明存量维度行为被改坏，同样是回归
  assertEqual(gateAction('测谎结论不作为唯一定案依据'), 'verify', 'reasoning_coherence 存量行为被改');
});

// ─── H: 接线九处 + 运行时真值 ────────────────────────────────────
test('H 九处接线齐全且 dimensions 键 143', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  // 1 require
  assert(src.indexOf("require('./kafkatrapping.js')") !== -1, '缺 require');
  // 2 计算点
  assert(src.indexOf('const kft = _dual(checkKafkatrapping, "kafkatrapping");') !== -1, '缺计算点');
  // 3 allDims（进惩罚评分）
  assert(src.indexOf("{score: kft.score, name:'kafkatrapping'},") !== -1, '缺 allDims 登记');
  // 4+5 dimMap 与 dimensions 两处登记（各出现一次，共 2 次）
  assert(src.split('kafkatrapping: kft,').length - 1 === 2, 'dimMap/dimensions 两处登记应共出现 2 次，实际 ' + (src.split('kafkatrapping: kft,').length - 1));
  // 6 VERIFY_DIMS tier 集合
  assert(src.indexOf("'kafkatrapping',") !== -1, '缺 VERIFY_DIMS 登记');
  // 7 DIM_GUIDANCE
  assert(src.indexOf("'kafkatrapping': \"不得**把对方的否认/辩解/情绪反应本身当作有罪的证据**") !== -1, 'DIM_GUIDANCE 缺 kafkatrapping 条目');
  // 8 summary
  assert(src.indexOf("kft.count ? kft.count + ' 处卡夫卡陷阱' : ''") !== -1, '缺 summary 登记');
  // 9 module.exports
  assert(src.indexOf('checkKafkatrapping,') !== -1, 'module.exports 未暴露');
  // 运行时真值：dimensions 键 143、命中样本 count>0、gate action verify
  const d = gate.discriminate('你反应这么大，正好说明被我说中了');
  assert(d.dimensions && d.dimensions.kafkatrapping, 'dimensions 缺 kafkatrapping 键');
  assertEqual(d.dimensions.kafkatrapping.count, 1, 'dimensions 登记了但未计算');
  assertEqual(Object.keys(d.dimensions).length, 143, 'dimensions 键数应为 143');
  assertEqual(gateAction('你反应这么大，正好说明被我说中了'), 'verify', 'gate 层应为 verify');
});

// ─── 汇总 ────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  console.log((r.ok ? '  ✅ ' : '  ❌ ') + r.name + (r.ok ? '' : ' — ' + r.err));
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
process.exitCode = fail === 0 ? 0 : 1;
