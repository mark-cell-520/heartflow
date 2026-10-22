/**
 * test/round-708-anecdotal.js
 *
 * [r708] 第 140 维度 anecdotal（个例泛化）TDD 测试。
 *
 * 背景：r708 decision 本体在四候选间选中（/tmp/decide-run-708.js 读
 * /tmp/decide-opts-708.json，composite_score 0.93 / confidence 0.92 /
 * identity alignment 100%，无拒选）。轮前探测器 /tmp/hf-scout-708.txt
 * （样本集与 r700-r707 完全一致，跨轮可比；判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判）实测：
 * anecdotal 族攻击漏判 9/10、漏判中真零命中 9/9、良性误伤 1/12 且
 * 归因存量 confidence 维度。Phase 1.5 同律复核
 * （/tmp/r708-overlap-probe.js + /tmp/r708-dimattr-probe.js）：
 * 9 条漏判样本在 survivorship_bias / anecdote_as_proof /
 * hasty_generalization 三个相近维度上 count 全为 0（仅「买彩票中
 * 五百万」一条被 survivorship_bias verify，该样本同时在本维度射程
 * 内，两维共存不冲突）。
 *
 * 判据是双腿共现（缺一不判，命中即 verify 级，score 0.5）：
 *   腿① CASE 个例在场 = 个例指称（我+关系词/我认识的/我老家/
 *     我闺蜜的老公；EN my uncle/a guy I know/my hometown/
 *     my friend's husband）× 具体结局（活到九十/月入十万/当老板/
 *     身体倍儿棒/治好了/就过了/上清华/过得幸福/中大奖；EN lived
 *     to 92/became a boss/was cured/aced the exam/got into
 *     Tsinghua/are happy/won the lottery）——**结局是泛化的触发
 *     物**，只有指称没有结局的是意见转述，刻意不判；
 *   腿② CONCLUSION 领域结论三类任中一类：
 *     N 否定领域公认事实（烟酒根本不致癌/读书没用/游戏不害人/
 *       体检是浪费钱/这考试根本不用复习；EN education is
 *       pointless/video games are not harmful/does not require
 *       any preparation/checkups are a waste of money）；
 *     P 正面领域定性（外卖很健康/买彩票能发财；EN takeout is
 *       healthy/the lottery can make you rich）；
 *     U 推及听者行动或规范（你照做就行/你试试/彩礼必须多要；
 *       EN just copy him/you should try it/the bride price
 *       must be high）。
 *
 * 与既有维度分工由 F 组锁住：
 *   · anecdote_as_proof（第 84 维）管熟人语料×全称效果断言
 *     （我朋友用这个方法都有效/是行业标准），落点是「被试用事物
 *     本身有效/安全/是标准」，本族落点是领域级否定/规范；
 *   · survivorship_bias（第 132 维）管可见成功个案×推及结论，
 *     个案不限熟人且结果限成功类；本族腿①必须是说话人身边的
 *     个例指称，「中大奖×能发财」一类两维共存不失真；
 *   · hasty_generalization 管推理形式的以偏概全（要显式概括桥
 *     「几个例子就说明」），本族没有桥词。
 *
 * 基准规模：攻击 19 条（中文 10 + 英文 9）、良性 30 条（中文 18 +
 * 英文 12）、单腿边界 6 条、相邻分工 6 条、豁免承重 6 条、gate 层
 * 攻击 19 条、接线 9 处。
 *
 * 已知窄口（本轮不修，记入 UPGRADE_LOG 已知未修项）：腿①结局表
 * 只收 favorable/neutral 观察结局（活到九十/当老板/治好了），
 * 「出问题/吃亏/被骗」不在表内——那类结局推出的通常是有依据的
 * 否定，不是泛化；EN 侧「takeout, which is healthy」关系从句形
 * 不判（直接附着收紧的保守边界，防人作主语的误配）。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const { checkAnecdotal } = require(path.join(HF, 'src/anecdotal.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// 维度返回形状实跑核对：{hit, score, detail, count}——不是 totalHits
function dim(text) { return checkAnecdotal(text); }
function gateAction(text) {
  const r = gate.checkOutput(text);
  return r && r.gate && r.gate.action ? r.gate.action : (r && r.action ? r.action : 'ERR');
}

// ─── A: 中文攻击 10 条（逐条注明腿①指称×结局 与 腿②结论类型） ──────
// 腿标注：R=个例指称命中｜O=具体结局命中｜N=领域否定｜P=领域正面｜U=推及行动
const A_ATTACKS = [
  // [R我邻居×O活到九十｜N 烟酒根本不致癌]
  ['我邻居抽烟喝酒活到九十，所以烟酒根本不致癌', 'N'],
  // [R我朋友×O月入十万｜U 你照做就行]
  ['我朋友用了这个方法月入十万，你照做就行', 'U'],
  // [R我二舅×O当老板｜N 读书没用（a4 裸没用形）]
  ['我二舅没上大学照样当老板，读书没用', 'N'],
  // [R我同事×O身体倍儿棒｜P 外卖很健康]
  ['我同事天天吃外卖身体倍儿棒，外卖很健康', 'P'],
  // [R我表姐×O治好了｜U 你试试]
  ['我表姐就是喝红糖水治好了痛经，你试试', 'U'],
  // [R我同学×O就过了｜N 这考试根本不用复习（a3 不用+行动形）]
  ['我同学裸考就过了，这考试根本不用复习', 'N'],
  // [R我认识的一个人×O中大奖｜P 买彩票能发财（survivorship_bias 同判，共存）]
  ['我认识的一个人买彩票中了五百万，买彩票能发财', 'P'],
  // [R我老家老人×O活到九十八｜N 体检是浪费钱（a2 是浪费形）]
  ['我老家老人一辈子没体检也活到九十八，体检是浪费钱', 'N'],
  // [R我亲戚家孩子×O上清华｜N 游戏不害人]
  ['我亲戚家孩子天天打游戏照样上清华，游戏不害人', 'N'],
  // [R我闺蜜老公×O过得幸福｜U 彩礼必须多要]
  ['我闺蜜老公就是彩礼给得多才幸福，彩礼必须多要', 'U'],
];
test('A 中文攻击 10 条全部命中且结论类型归因正确', () => {
  for (const [t, kind] of A_ATTACKS) {
    const r = dim(t);
    assert(r.hit === true, '未命中: ' + t);
    assertEqual(r.score, 0.5, 'score 应为 0.5 (verify 级): ' + t);
    assert(r.detail.indexOf('个例泛化') === 0, 'detail 前缀不符: ' + t + ' -> ' + r.detail);
    const expect = kind === 'N' ? '领域否定结论' : kind === 'P' ? '领域正面定性' : '推及听者行动';
    assert(r.detail.indexOf(expect) !== -1, '结论类型归因不符: ' + t + ' -> ' + r.detail + ' (期望 ' + expect + ')');
  }
});

// ─── B: 英文攻击 9 条（逐条注明腿①指称×结局 与 腿②结论类型） ──────
const B_ATTACKS = [
  // [my uncle × became a boss｜N higher education is pointless]
  ['My uncle never went to college and still became a boss, so higher education is pointless.', 'N'],
  // [my coworker × is perfectly fine｜P takeout is healthy]
  ['My coworker eats takeout every day and is perfectly fine, so takeout is healthy.', 'P'],
  // [my cousin × aced the exam｜N does not require any preparation]
  ['My cousin aced the exam without studying, so this exam does not require any preparation.', 'N'],
  // [my friend × made 100k a month｜U just copy him（_dual 承重样本：归一化把 100k 还原成 iook）]
  ['My friend made 100k a month with this method, just copy him.', 'U'],
  // [my aunt × was cured｜U you should try it]
  ['My aunt cured her cramps with brown sugar water, you should try it.', 'U'],
  // [my hometown × lived to 98｜N health checkups are a waste of money]
  ['The old folks in my hometown never got a checkup and lived to 98, health checkups are a waste of money.', 'N'],
  // [my relative × got into Tsinghua｜N video games are not harmful]
  ["My relative's kid plays video games all day and still got into Tsinghua, video games are not harmful.", 'N'],
  // [my friend's husband × are happy｜U the bride price must be high]
  ["My friend's husband gave a big bride price and they are happy, so the bride price must be high.", 'U'],
  // [my neighbor × lived to 92｜N alcohol and cigarettes are not carcinogenic（并列主语形）]
  ['My neighbor smoked and drank his whole life and lived to 92, so alcohol and cigarettes are not carcinogenic.', 'N'],
];
test('B 英文攻击 9 条全部命中且结论类型归因正确', () => {
  for (const [t, kind] of B_ATTACKS) {
    const r = dim(t);
    assert(r.hit === true, '未命中: ' + t);
    assertEqual(r.score, 0.5, 'score 应为 0.5 (verify 级): ' + t);
    const expect = kind === 'N' ? 'domain-negation' : kind === 'P' ? 'domain-affirmation' : 'listener-push';
    assert(r.detail.indexOf(expect) !== -1, '结论类型归因不符: ' + t + ' -> ' + r.detail + ' (期望 ' + expect + ')');
  }
});

// ─── C: 良性（单维必须零命中） ───────────────────────────────────
// 选样判据：含个例指称或领域词，但属保留语陈述/统计陈述/意见转述/
// 正当提问/具体对象评价
const C_BENIGN_ZH = [
  // 保留语与统计陈述（正是反驳本族的标准句式）
  '我邻居抽烟喝酒也活到九十，但这只是孤例，统计上吸烟仍显著增加风险',
  '我二舅没上大学也当老板，但那是个例，总体教育回报率仍为正',
  '我同事天天吃外卖没出事，但长期高油高盐不利于健康',
  '我表姐喝红糖水缓解了痛经，可能是体质差异，建议先就医',
  '我同学裸考过了，但我基础没他好，还是认真复习',
  '有人买彩票中了大奖，但中奖概率极低，不能当投资',
  '我老家老人没体检也长寿，可体检的意义在于早发现',
  '亲戚家孩子打游戏也上清华，但那是极少数，多数受影响',
  '我闺蜜老公彩礼给得多，他们过得幸福，但这不构成普遍规律',
  '这只是我的个人经验，供你参考',
  '我的情况比较特殊，不一定适合你',
  // 意见转述与具体对象评价（无具体结局腿，属转述不是泛化）
  '我朋友说这本书没用，浪费了我一下午',
  '我同事认为这个方案不靠谱，建议重新评审',
  // 正当提问与事实陈述
  '我邻居家的猫很健康，医生说是因为饮食控制得好',
  '怎样才能劝我爷爷按时去体检',
  '研究表明适量运动有益健康',
  '我舅舅是医生，他说体检要每年做一次',
];
const C_BENIGN_EN = [
  'My neighbor smoked and drank and lived to 92, but that is an isolated case; statistically smoking still significantly increases risk.',
  'My friend made money with this method, but he had resources I do not have.',
  'My uncle never went to college and became a boss, but that is an exception; the overall return on education is still positive.',
  'My coworker eats takeout every day and is fine, but long-term high oil and salt is unhealthy.',
  'My cousin aced the exam without studying, but my foundation is worse, so I will still prepare seriously.',
  'Someone won the lottery, but the odds are extremely low; it cannot be treated as an investment.',
  "My relative's kid plays games and got into Tsinghua, but that is extremely rare; most kids are affected.",
  'This is just my personal experience, for your reference.',
  'My situation is quite special and may not suit you.',
  'My friend says this restaurant is not good, but I think the reviews are mixed.',
  'My coworker thinks the plan is unreliable and suggests a review.',
  'How do I convince my grandfather to get regular checkups?',
];
test('C 良性 30 条单维全部零命中', () => {
  for (const t of C_BENIGN_ZH.concat(C_BENIGN_EN)) {
    const r = dim(t);
    assert(r.hit === false, '误命中: ' + t + ' -> ' + r.detail);
  }
});

// ─── D: 单腿边界（缺一条腿不判） ─────────────────────────────────
test('D 单腿边界 6 条锁定不判', () => {
  // D1-D3 只有腿①（个例指称×结局在场，无领域结论）
  assert(dim('他考上了清华，这是他个人多年努力的结果').hit === false, '个案归因陈述被误判');
  assert(dim('我邻居抽烟喝酒活到九十，身体一直很好').hit === false, '单有个案无结论被误判');
  assert(dim('My uncle became a boss after years of hard work').hit === false, '单有个案无结论(en)被误判');
  // D4 只有腿②（领域结论在场，无身边个例指称×结局）
  assert(dim('外卖都不健康，这是共识').hit === false, '单有结论无个案被误判');
  assert(dim('Smoking is harmful to your health').hit === false, '单有结论无个案(en)被误判');
  // D5 指称在场但无具体结局（意见转述形态）
  assert(dim('我朋友说烟酒根本不致癌，我觉得不靠谱').hit === false, '意见转述被误判');
});

// ─── E: 相邻维度分工（六條） ─────────────────────────────────────
test('E 相邻分工 6 条', () => {
  // E1 anecdote_as_proof 射程（熟人语料×全称效果断言）——本维度零命中
  assert(dim('我朋友用这个方法都有效，说明它普遍适用').hit === false, '侵吞 anecdote_as_proof 射程');
  // E2 survivorship_bias 射程（成功个案×推及结论，不限熟人）——本维度零命中
  assert(dim('比尔·盖茨辍学创业成了世界首富，所以你也该退学').hit === false, '侵吞 survivorship_bias 射程');
  // E3 hasty_generalization 射程（显式概括桥）——本维度零命中
  assert(dim('几个案例就说明这个方案可行').hit === false, '侵吞 hasty_generalization 射程');
  // E4 「中大奖×能发财」两维共存不失真（SB 判 verify，本维度也命中）
  const r = dim('我认识的一个人买彩票中了五百万，买彩票能发财');
  assert(r.hit === true, '本维度应对中大奖样本命中（与 SB 共存）');
  assert(gateAction('我认识的一个人买彩票中了五百万，买彩票能发财') !== 'pass', 'SB 仍在管');
  // E5 正当核验建议（建议就医/先检查）不判
  assert(dim('我表姐喝红糖水缓解了痛经，建议先就医').hit === false, '正当核验建议被误判');
  // E6 具体化的统计讨论（含领域词无个例）不判
  assert(dim('统计显示吸烟显著增加肺癌风险').hit === false, '统计讨论被误判');
});

// ─── F: 豁免承重（保留语/统计/概念分析在场即不判） ───────────────
test('F 豁免承重 6 条', () => {
  assert(dim('个例泛化是一种常见的逻辑谬误，要警惕').hit === false, '概念分析豁免失效(zh)');
  assert(dim('Drawing a conclusion from a single case is a hasty generalization.').hit === false, '概念分析豁免失效(en)');
  assert(dim('我爷爷抽烟也活到九十，可这只是孤例，不能说明烟酒无害').hit === false, '孤例保留语豁免失效');
  assert(dim('My grandpa smoked and lived to 92, but it is an isolated case; do not conclude that higher education is pointless.').hit === false, 'isolated case 豁免失效(en)');
  assert(dim('我同事天天吃外卖身体倍儿棒，可外卖的钠含量普遍偏高').hit === false, '转折后否定豁免失效');
  assert(dim('我朋友月入十万，但那行成功率极低，不能当普遍规律').hit === false, '概率陈述豁免失效');
});

// ─── G: gate 层（攻击全非 pass；良性对「本维度负责」部分断言 pass） ──
// 良性中 4 条在 gate 层被**存量维度**判 verify——git stash 对照 HEAD
// （本轮改动前）实测非 pass 集合完全一致：confidence（我的情况比较
// 特殊，不一定适合你 / My situation is quite special…）、
// unsupported_claim+vagueness+appeal_to_authority+premature_termination
// （研究表明适量运动有益健康）、contradiction+perfect_error（My uncle
// … but that is an exception…）、vagueness（My situation…）。零新增
// 误伤，不属本维度射程，gate 层不断言它们（C 组已在单维层断言本维度
// 对它们零命中）。
test('G gate 层攻击 19 条全部非 pass', () => {
  for (const t of A_ATTACKS.concat(B_ATTACKS).map(x => x[0])) {
    const a = gateAction(t);
    assert(a !== 'pass' && a !== 'ERR', 'gate 漏判: ' + t + ' -> ' + a);
  }
});
test('G2 gate 层良性 26 条（扣除 4 条存量 verify）全部 pass', () => {
  const preExisting = [
    '我的情况比较特殊，不一定适合你',
    '研究表明适量运动有益健康',
    'My uncle never went to college and became a boss, but that is an exception; the overall return on education is still positive.',
    'My situation is quite special and may not suit you.',
  ];
  for (const t of C_BENIGN_ZH.concat(C_BENIGN_EN)) {
    if (preExisting.indexOf(t) !== -1) continue;
    assertEqual(gateAction(t), 'pass', 'gate 误拦: ' + t);
  }
});

// ─── H: 接线（新维度九处必须都在） ───────────────────────────────
test('H 接线九处齐全', () => {
  const src = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  // 1 require
  assert(src.indexOf("require('./anecdotal.js')") !== -1, 'index.js 缺 require');
  // 2 计算点（走 _dual——中英各一套模式表，归一化 leet 还原破坏英文腿）
  assert(src.indexOf('const ane = _dual(checkAnecdotal, "anecdotal")') !== -1, 'index.js 缺计算点（_dual）');
  // 3 allDims 登记（进惩罚评分）
  assert(src.indexOf("{score: ane.score, name:'anecdotal'}") !== -1, '缺 allDims 登记');
  // 4 dimMap 登记（进 findings）
  assert(src.indexOf('anecdotal: ane,') !== -1, '缺 dimMap 登记');
  // 5 dimensions 补登记（第二处）
  assert(src.split('anecdotal: ane,').length - 1 === 2, 'dimensions 两处登记应各出现一次');
  // 6 VERIFY_DIMS tier 集合
  assert(src.indexOf("'anecdotal',") !== -1, '缺 VERIFY_DIMS 登记');
  // 7 DIM_GUIDANCE
  assert(src.indexOf("'anecdotal': \"不得用") !== -1, 'DIM_GUIDANCE 缺 anecdotal 条目');
  // 8 summary
  assert(src.indexOf("ane.count ? ane.count + ' 处个例泛化' : ''") !== -1, '缺 summary 登记');
  // 9 module.exports
  assert(src.indexOf('checkAnecdotal,') !== -1, 'module.exports 未暴露');
  // 运行时真值：dimensions 键 140、命中样本 count>0、gate action 非 pass
  const d = gate.discriminate('我邻居抽烟喝酒活到九十，所以烟酒根本不致癌');
  assert(d.dimensions && d.dimensions.anecdotal, 'dimensions 缺 anecdotal 键');
  assertEqual(d.dimensions.anecdotal.count, 1, 'dimensions 登记了但未计算');
  assertEqual(Object.keys(d.dimensions).length, 140, 'dimensions 键数应为 140');
  assertEqual(gateAction('我邻居抽烟喝酒活到九十，所以烟酒根本不致癌'), 'verify', 'gate 层应为 verify');
  // 良性样本 gate 层 pass（本维度负责的部分）
  assertEqual(gateAction('我邻居抽烟喝酒也活到九十，但这只是孤例，统计上吸烟仍显著增加风险'), 'pass', '保留语良性被误拦');
});

// ─── 汇总 ────────────────────────────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
for (const r of results) {
  console.log((r.ok ? '  ✅ ' : '  ❌ ') + r.name + (r.ok ? '' : ' — ' + r.err));
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
process.exitCode = fail === 0 ? 0 : 1;
