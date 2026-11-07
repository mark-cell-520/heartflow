/**
 * test/round-225-pseudo-causal-bare-temporal-marker.test.js
 * — r225 pseudo_causal「裸时序标记族 × 归因断言」召回扩面（v6.8.153）
 *
 * 背景（交接簿 data/upgrade-state.json r224 notes 候选①，原文点名
 * post_hoc / pseudo_causal 两维，r224 只修了 post_hoc 一维）：
 *   causalOverclaimZh 的第①支判据形状是 PC_SEQ_ZH × PC_ATTRIB_ZH，
 *   但 PC_SEQ_ZH 只收「带框的紧邻形」（从那以后/从此/此后/自从…以来）与
 *   粗粒度年月日标记（\d{4}/去年/今天/昨天/前天）——「从那天以后」不是
 *   「从那以后」的子串，裸「第二天/隔天/当天/从那天起/打那以后」整族漏网。
 *   轮初探针（scripts/tmp-225-probe.js）20 条同族攻击句 detector 仅 3/20，
 *   其中 2 条连 gate 都是 pass。
 *
 * 落地（src/index.js，判据结构/路由/评分公式一字未动，只动两张词表）：
 *   ① 新增 PC_SEQ_BARE_ZH —— 短时距裸标记（隔天/当天/第二天/次日）与
 *      「那天」族（从那天以后/从那天起/打那以后/打那天起/那天以后/那天起）；
 *   ② 第①支顺序表改为 PC_SEQ_ZH ∪ PC_SEQ_BARE_ZH；
 *   ③ PC_ATTRIB_ZH + 紧形状「肯定(?:是|由于)?…{0,12}…(原因/的锅/造成的/
 *      导致/所致/带来的/的功劳/的作用/的问题)」——与存量「所以…原因/造成的」
 *      同纪律（归因断言后必须跟因果名词），不含「一定/无疑是」等裸断言形
 *      （实测裸形会误伤「将来一定来不及」「肯定不会陷入今天的困境」这类
 *      修辞威胁句）。
 *
 * **关键纪律：裸时序族只进第①支，不进第⑨支。** 第⑨支（顺序词 × 指标
 * 变动）没有任何归因断言在场，是纯弱形状——实测把裸标记喂给它会新造两条
 * 良性假阳性（「第二天投诉量下降了，我们继续观察了三天」「当天访问量
 * 上升了一些，运营做了记录」都是中性记录句，无任何因果推断）。所以本轮
 * 不污染 PC_SEQ_ZH，另建 PC_SEQ_BARE_ZH 只喂第①支（D3 变异守卫证明这个
 * 分表是承重的：把裸族喂回第⑨支，两条中性记录句必须重新被误命中）。
 *
 * 守五件事：
 *   一、20 条同族攻击句 detector + findings + gate 三层命中；
 *   二、26 条良性（时序叙述/中性记录/技术测量/方法学/修辞威胁）零误伤，
 *       且 HEAD 即非 pass 的 6 条登记现值防漂移（r224 踩坑⑤同型）；
 *   三、三处变异守卫：摘 PC_SEQ_BARE_ZH / 摘「肯定…」族 / 把裸族喂回第⑨支；
 *   四、存量攻击族（round-48 24 条）不塌、存量良性族（round-48 30 条）不涨；
 *   五、源码常量完整（后续轮次与负例脚本要能注入）。
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cp = require('child_process');
const ROOT = path.join(__dirname, '..');

const idx = require('../src/index.js');
const gateMod = require('../src/gate.js');
const SRC = path.join(ROOT, 'src', 'index.js');

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + '\n     ' + e.message); process.exitCode = 1; }
}

// 末尾统一收口：run-all.js 靠 `N 通过, M 失败` 汇总行计数，
// 缺该行的测试文件会被计入 1 个失败（见 test/run-all.js）。
process.on('exit', () => {
  console.log(`${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
});

const pcCount = (text) => idx.checkPseudoCausal(text).count;
const gateAction = (text) => gateMod.gate(text).gate.action;
function realFindings(text) {
  return (gateMod.gate(text).findings || []).filter(f => f && f.severity > 0);
}
const hasDim = (text, dim) => realFindings(text).some(f => f.dimension === dim);

// 供 D 节变异用的源码锚点（与 src/index.js 当前实现逐字对应；
// 若将来重构这些写法，D1/D2/D4 会因找不到锚点而显式失败——这是有意的）
const ANCHOR_P1_UNION = "'(?:' + PC_SEQ_ZH.source + '|' + PC_SEQ_BARE_ZH.source + ')' + '[^。]{0,44}?' + PC_ATTRIB_ZH.source";
// [r226] 「肯定…」族扩为「(?:肯定|一定)…」并补因果/效果名词表，
// 锚点随 src/index.js 同步更新（原 r225 锚点见 git show 53a29702）。
const ANCHOR_ATTRIB_SURE = '|(?:肯定|一定)(?:是|由于)?[^。]{0,12}(?:原因|的锅|造成的?|导致|所致|带来的?|的功劳|起了?作用|的作用|的问题|的结果|的效果|的功效|受了[^。]{0,6}|能治|有效|见效|见了效|招财|辟邪|显灵|吉利|风水|中[^。]{0,3}(?:大奖|奖))';
const ANCHOR_P9 = "new RegExp(PC_SEQ_ZH.source + '[^。]{0,14}(?:下降|上升|降低|减少|变少|下滑|提高)')";
// [r227] 倒装服药族子判据的调用点。D1 变异必须**同时**摘掉它，否则
// 「他喝了这个偏方，第二天病就好了…」这类句子会被新支兜住，D1 就从
// 「证明 PC_SEQ_BARE_ZH 承重」退化成「证明新支也命中」的假绿。
const ANCHOR_IV_CALL = 'const iv = causalInvertedTakeZh(text);';
const ANCHOR_IV_STUB = 'const iv = { count: 0, hits: [] };';
// 只靠「肯定…」族承重的攻击句（无第二支兜底）
const ATTRIB_ONLY = [
  '他上任之后公司利润就涨了，肯定是他的能力造成的',
  '当天晚上就不疼了，肯定是贴了膏药的功劳',
];
// 「肯定…」族 + 第⑨支（自从 × 下滑）双兜底句：摘归因族后仍剩 1 次命中
const ATTRIB_PLUS_P9 = ['自从换了领导，业绩就下滑了，肯定是领导的问题'];

// ─── A 节语料：20 条同族攻击句（裸时序标记族 × 归因断言）────────────
const ATTACK = [
  // 短时距裸标记（隔天/当天/第二天/次日）× 归因断言
  '他喝了这个偏方，第二天病就好了，看来偏方真有用',
  '她戴上这款手环，当天睡眠就好了，显然手环有效',
  '他换了新主管，第二天业绩就上去了，可见是新主管带得好',
  '装上这个插件第二天网站就快了，说明是插件起了作用',
  '隔天投诉量就降了一半，可见是改版起了作用',
  '当天注册量就涨了，说明是这次投放起了作用',
  '他搬到这座城市第二天就找到了工作，显然是风水好',
  '用上新脚本隔天构建就快了，可见是脚本优化得好',
  '第二天股价就涨了，显然是受到了消息刺激',
  '当天订单就翻倍，说明新品发布起了作用',
  '换上红色球衣第二天就赢了比赛，可见红色真的带来好运',
  '贴上新膜当天屏幕就不花了，显然是膜的质量好',
  '隔天病人就能下床了，显然是这味药的神奇效果',
  '她换了这款洗发水，第二天头屑就没了，显然是洗发水的功劳',
  '从那以后公司就再没出过事故，说明是换了风水摆件',
  // 「那天」族（打那天以后/从那天以后）× 归因断言
  '打那天以后销量就再没掉过，显然是新品包装的功劳',
  '从那天以后他业绩就再没垫底，说明是拜了财神',
  // 归因断言扩面（肯定…造成的/的功劳/的问题）支①
  '他上任之后公司利润就涨了，肯定是他的能力造成的',
  '当天晚上就不疼了，肯定是贴了膏药的功劳',
  '自从换了领导，业绩就下滑了，肯定是领导的问题',
];

// ─── C 节语料：结构性 / 既有豁免表拦下、至今仍漏 ─────────────────────
// 每一条都逐条实测过拦在哪。原 r225 清单里前 3 条（「肯定是受了刺激」
// 「跑步肯定能治感冒」「下一把肯定中大奖」）已由 **r226** 收口——PC_ATTRIB_ZH
// 的「肯定…」族扩成「(?:肯定|一定)…」并补因果/效果名词表（见
// test/round-226-*.test.js），此处只留真正还漏的 2 条（PC_OTHERFACTOR_ZH 拦下）。
// [r232] 「从那天起她再也没迟到过，说明是早起打卡起了作用」已被本轮收窄
// [r233] 原 STILL_GAP 唯一一条（「因为」分支拦下的归因链接句）已由 r233 收口：
// PC_OTHERFACTOR_ZH 的「因为」腿加归因链接负向环视后不再整句豁免。按 r226/r227
// 纪律移入 C5「必须保持命中」登记——**这不是放水**，正向断言比「必须仍为 0」更严。
const STILL_GAP = [];
// [r232] r232 收口、必须保持命中的句子（原 STILL_GAP 第二条）
const FIXED_BY_R232 = [
  '从那天起她再也没迟到过，说明是早起打卡起了作用',
];
// [r233] r233 收口、必须保持命中的句子（原 STILL_GAP 唯一一条）
const FIXED_BY_R233 = [
  '打那以后球队就再也没输过，显然是因为换了教练',
];
// r226 起被收口的 3 条（原 r225 清单前三条）——登记在此防回退
const GAP_CLOSED_BY_R226 = [
  '从那天以后他就像变了个人，肯定是受了刺激',
  '她开始每天跑步之后感冒就少了，跑步肯定能治感冒',
  '这老虎机今天还没吐分，下一把肯定中大奖',
];

// ─── B 节语料：26 条良性 ────────────────────────────────────────────
// 新增的「第二天/隔天/当天」是高频日常时序词，「从那天以后/打那天以后」
// 与存量「从那以后」同族——误伤面全押在 B 节上，所以良性语料要覆盖
// 「新增词在场但无归因断言 / 有既有豁免」的各种邻近形状。
const BENIGN = [
  // 时序叙述（有裸时序词，无归因断言）
  '我昨天提交了代码，第二天发现有个小 bug',
  '第二天我们开了个会，讨论了明年的预算',
  '当天下午我就把报告交给主管了',
  '隔天快递就到了，包装完好',
  '从那天以后我们一直保持着联系',
  '打那以后他每天都会早起跑步',
  '当天晚上九点，系统自动触发了备份',
  '隔天上午客户回复了邮件，同意这个方案',
  '从那天起团队每周做一次复盘',
  '第二天审计报告出来，问题都列清楚了',
  '当天双方确认了交付范围',
  '隔天财务把发票开了出来',
  // 中性记录（裸时序词 × 指标变动，无归因断言 —— 第⑨支不收裸标记）
  // 这三条是「不分表」错误做法的照妖镜：把裸族喂回第⑨支它们立刻假阳性
  '第二天投诉量下降了，我们继续观察了三天',
  '隔天数据有波动，但幅度在正常范围内',
  '当天访问量上升了一些，运营做了记录',
  '从那天起日均订单量减少了，因为同期在做活动调整',
  // 技术测量（数字护栏）
  '上线之后延迟下降了 40%，吞吐保持稳定',
  '更新之后错误率从 2% 降到 0.3%',
  // 方法学 / 统计谦辞（r220 STAT_CONTEXT_ZH / r222 共表豁免同族）
  '控制变量之后，相关关系仍然显著',
  '需要分析具体原因，不能只看时间先后',
  // 真实机制
  '吃了这片退烧药，隔天体温就正常了',
  '打完疫苗第二天胳膊有点酸，这是正常反应',
  '部署了回滚方案，当天故障率就降到了零',
  // 修辞威胁（不是因果推断 —— 归因词扩面的护栏对象）
  '现在不努力，将来一定来不及，你会为自己今天的选择感到痛苦',
  '以后你一定会为今天没做这个决定而自责',
  '要是当时听我的做了对冲，公司肯定不会陷入今天的困境。',
];
// HEAD 实测即非 pass 的 6 条（全部来自无关维度：agency_deflection /
// statistical_misleading / post_hoc / affective_forecast /
// counterfactual_overclaim），登记字面量防漂移——不放水也不把存量
// 噪声算成本轮回归（r224 踩坑⑤同型）。
const BENIGN_HEAD_NONPASS = {
  '当天晚上九点，系统自动触发了备份': 'rewrite',
  '更新之后错误率从 2% 降到 0.3%': 'verify',
  '吃了这片退烧药，隔天体温就正常了': 'rewrite',
  '现在不努力，将来一定来不及，你会为自己今天的选择感到痛苦': 'rewrite',
  '以后你一定会为今天没做这个决定而自责': 'rewrite',
  '要是当时听我的做了对冲，公司肯定不会陷入今天的困境。': 'rewrite',
};

// ─── E 节语料：round-48 存量族（24 攻击 / 30 良性）──────────────────
const LEGACY_ATTACK = [
  '上线之后投诉量下降了，所以这次上线就是投诉下降的原因。',
  '自从换了新领导，业绩就一路下滑，显然是新领导把团队带崩了。',
  '自从公司开始抓考勤，离职率就降了，说明抓考勤确实有用。',
  '他一来我们组项目就延期了，看来他就是问题所在。',
  '这部剧播出后当地旅游就火了，可见这部剧带火了整座城市。',
  '换了新 Logo 之后销量起来了，说明新 Logo 是成功的。',
  '去年开始用新系统，从那以后事故就没再出过，可见新系统解决了安全隐患。',
  '自从老板每天早会后，迟到的人就少了，说明早会制度立竿见影。',
  '这次促销一结束，退货量就上来了，显然促销把不合适的人吸引来了。',
  '调整了首页布局之后留存就涨了，证明之前的布局确实有问题。',
  '我把闹钟提前半小时后，上班就不再迟到了，可见闹钟是关键。',
  '团队加了新人之后，代码缺陷率下降了，说明新人培训起了作用。',
  '自从搬进了新办公室，大家的加班反而变少了，看来环境改善提高了效率。',
  '上了新考勤机以来，没人再忘打卡了，说明机器比制度管用。',
  '这两次延期都发生在你值班那周，所以问题就出在你身上。',
  '前年亏今年赚，中间只差了一次团建，显然是团建把士气带起来了。',
  '昨天改了配置，今天服务就稳了，说明就是配置的问题。',
  '自从改了餐标，食堂抱怨少了，可见抱怨都是钱没给够。',
  '他接手后投诉立刻少了，说明前任主管根本不会管理。',
  '发布新版本后崩溃率下降，证明是旧版本的锅。',
  '改了标题风格之后阅读量翻倍，可见读者就吃这一套。',
  '换了供应商之后交期变短，说明这家供应商明显更专业。',
  '下雨天的销售额总是低，所以天气直接决定了我们的业绩。',
  '周一出事故最多，可见周一大家状态最差。',
];
const LEGACY_BENIGN = [
  '上线之后投诉量有所下降，我们也同步调整了客服排班，具体原因还要再看两周数据。',
  '换了新领导之后业绩有变化，但这几个月市场环境也变了很多，不好归因。',
  '考勤收紧后离职率有下降，同期也普调了薪资，两件事混在一起还看不出主因。',
  '项目延期发生在他加入之后，但他只负责后端，延期主要在前端联调。',
  '旅游热度上升与剧的播出时间接近，但同期还有免门票政策，权重待评估。',
  '新 Logo 上线和销量回暖都发生在三季度，我们还做了两轮促销，需要拆开看。',
  '崩溃率下降与发版时间重合，不过同期还换了机器，不能直接归因。',
  '早会后迟到变少，也可能是天气变冷大家出门更早了。',
  '改配置后服务变稳，我怀疑跟当晚流量下降也有关，需要再观察。',
  '换了供应商后交期变短，今年整体物流都比去年通畅。',
  '采用新架构后请求 Latency 从 800ms 降到 120ms。',
  '这个版本发布后崩溃率从 2.1% 降到 0.4%。',
  '改版之后日活从 3 万涨到 4.5 万。',
  '灰度上线后转化率提升了 30%。',
  '去年导入新 CRM 后，销售人均单量提升了 1.8 倍。',
  '算法调整后检索准确率从 71% 提到 79%。',
  '六点之后地铁明显宽松很多。',
  '大雨之后水库水位涨了两米。',
  '国庆假期之后机票价格普遍回落。',
  '考试结束后图书馆的空位就多了。',
  '我们给查询加了索引，Explain 显示扫描行数从 120 万降到 3 千，慢查询随之消失。',
  '增加了缓存之后接口耗时降到 40ms，因为重复计算被省掉了。',
  '把超时从 30s 改成 5s，用户投诉中「转圈」的描述少了很多。',
  '加了单元测试之后线上回滚次数下降，边界 case 在提测前就被挡住了。',
  '换上 SSD 后编译时间从 14 分钟降到 3 分钟。',
  '灰度只放 5% 流量，有问题可以立刻关掉。',
  '上线后我们盯着看板守了半小时，没有异常再走人。',
  '发版后先观察 24 小时，指标不动再回滚。',
  '周一的事故率最高，p<0.05，样本 14 个月。',
  '下雨天销售额低，r=-0.62，是强相关不是因果。',
];

// ─── A 节：同族攻击句三层命中 ───────────────────────────────────────
test(`A1 攻击句 detector 命中（${ATTACK.length} 条）`, () => {
  const miss = ATTACK.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(miss, [], `以下攻击句 checkPseudoCausal 漏判：\n  ${miss.join('\n  ')}`);
});

test(`A2 攻击句 findings 含 pseudo_causal（${ATTACK.length} 条）`, () => {
  const miss = ATTACK.filter(s => !hasDim(s, 'pseudo_causal'));
  assert.deepStrictEqual(miss, [], `以下攻击句 findings 不含 pseudo_causal：\n  ${miss.join('\n  ')}`);
});

test(`A3 攻击句 gate 非 pass（${ATTACK.length} 条）`, () => {
  const miss = ATTACK.filter(s => gateAction(s) === 'pass');
  assert.deepStrictEqual(miss, [], `以下攻击句 gate 仍为 pass：\n  ${miss.join('\n  ')}`);
});

// ─── B 节：良性零误伤 ───────────────────────────────────────────────
test(`B1 良性句 detector 零命中（${BENIGN.length} 条）`, () => {
  const hit = BENIGN.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(hit, [], `checkPseudoCausal 误命中：\n  ${hit.join('\n  ')}`);
});

test(`B2 良性句 findings 不含 pseudo_causal（${BENIGN.length} 条）`, () => {
  const hit = BENIGN.filter(s => hasDim(s, 'pseudo_causal'));
  assert.deepStrictEqual(hit, [], `findings 误含 pseudo_causal：\n  ${hit.join('\n  ')}`);
});

test(`B3 良性句 gate 现值登记（${Object.keys(BENIGN_HEAD_NONPASS).length} 条 HEAD 即非 pass 的句子防漂移）`, () => {
  const drift = [];
  for (const [s, expect] of Object.entries(BENIGN_HEAD_NONPASS)) {
    const got = gateAction(s);
    if (got !== expect) drift.push(`「${s}」HEAD=${expect} 现值=${got}`);
  }
  assert.deepStrictEqual(drift, [], '以下良性句的 gate action 相对 HEAD 发生漂移：\n  ' + drift.join('\n  '));
});

test(`B4 良性句 gate 全 pass（剔除 B3 登记的 ${Object.keys(BENIGN_HEAD_NONPASS).length} 条 HEAD 非 pass 后）`, () => {
  const rest = BENIGN.filter(s => !(s in BENIGN_HEAD_NONPASS));
  const bad = rest.filter(s => gateAction(s) !== 'pass');
  assert.deepStrictEqual(bad, [], `以下良性句 gate 非 pass：\n  ${bad.join('\n  ')}`);
});

// ─── C 节：仍漏句现值登记（诚实标注，不是放水）──────────────────────
test(`C1 结构性/豁免拦下的 ${STILL_GAP.length} 条现值仍漏（detector 0 + gate pass 或现值照登）`, () => {
  const bad = STILL_GAP.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad, [], `以下句子已被命中（应更新 STILL_GAP 清单）：\n  ${bad.join('\n  ')}`);
});

test('C2 仍漏句的 gate action 现值照登（防将来静默变化）', () => {
  const expect = {};
  const drift = [];
  for (const [s, e] of Object.entries(expect)) {
    const g = gateAction(s);
    if (g !== e) drift.push(`「${s}」登记=${e} 现值=${g}`);
  }
  assert.deepStrictEqual(drift, [], '以下仍漏句的 gate action 发生漂移：\n  ' + drift.join('\n  '));
});

// C4：[r232] 收口的 1 条必须保持命中（防回退——该句原登记为「仍漏」）
test(`C4 r232 收口的 ${FIXED_BY_R232.length} 条必须保持 detector 命中`, () => {
  const bad = FIXED_BY_R232.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], '以下句子又被漏判了（r232 收口被回退）：\n  ' + bad.join('\n  '));
  assert.strictEqual(gateAction(FIXED_BY_R232[0]), 'rewrite', 'r232 收口句 gate action 应保持 rewrite');
});

// C5：[r233] 收口的 1 条必须保持命中（防回退——该句原登记为「仍漏」）
test(`C5 r233 收口的 ${FIXED_BY_R233.length} 条必须保持 detector 命中`, () => {
  const bad = FIXED_BY_R233.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], '以下句子又被漏判了（r233 收口被回退）：\n  ' + bad.join('\n  '));
  assert.notStrictEqual(gateAction(FIXED_BY_R233[0]), 'pass', 'r233 收口句 gate action 不应回落到 pass');
});

// C3：r226 收口的 3 条必须保持命中（防回退到 r225 状态）
test(`C3 r226 收口的 ${GAP_CLOSED_BY_R226.length} 条必须保持 detector 命中`, () => {
  const bad = GAP_CLOSED_BY_R226.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], '以下句子又被漏判了（r226 收口被回退）：\n  ' + bad.join('\n  '));
});

// ─── D 节：变异守卫（复制 src/ 整棵树到临时目录再变异）──────────────
/** 复制 src/ 到临时目录，返回目录路径（绝不在原地改写 src/） */
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r225-' + tag + '-'));
  for (const f of ['VERSION', 'package.json']) {
    try { fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f)); } catch (e) { /* 缺文件不致命 */ }
  }
  cp.execFileSync(process.execPath,
    ['-e', `const fs=require('fs'),p=require('path');
function w(s,d){fs.mkdirSync(d,{recursive:true});
for(const e of fs.readdirSync(s,{withFileTypes:true})){
const a=p.join(s,e.name),b=p.join(d,e.name);
if(e.isDirectory())w(a,b);else fs.copyFileSync(a,b);}}
w(process.argv[1],process.argv[2]);`,
      path.join(ROOT, 'src'), path.join(tmp, 'src')],
    { stdio: 'ignore' });
  return tmp;
}
/** 在临时副本上跑：统计 list 里被 checkPseudoCausal 命中的条数 */
function countHitsIn(tmp, list) {
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(path.join(tmp, 'src', 'index.js'))});
const L=${JSON.stringify(list)};
let n=0; for(const x of L){ if(idx.checkPseudoCausal(x).count>0) n++; }
console.log(n);`],
    { encoding: 'utf8' });
  return parseInt(out.trim(), 10);
}

// 变异一：第①支摘掉 PC_SEQ_BARE_ZH（顺序表退回 PC_SEQ_ZH 原表）——
// 裸时序族攻击句必须重新漏判，证明这张新表真的在承重。
test('D1 变异守卫一：第①支摘掉 PC_SEQ_BARE_ZH 后同族攻击句必须重新漏判', () => {
  const tmp = copySrc('seqbare');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.ok(orig.includes(ANCHOR_P1_UNION), '副本中找不到第①支的联合顺序表写法');
    let mutated = orig.replace(ANCHOR_P1_UNION,
      "PC_SEQ_ZH.source + '[^。]{0,44}?' + PC_ATTRIB_ZH.source");
    // [r227] 同时中和 r227 新增的倒装服药子判据，否则该族攻击句被新支兜住，
    // D1 会假绿（r227 轮初实测：不摘它时 20 条里 5 条仍命中，其中 1 条
    // 「他喝了这个偏方，第二天病就好了…」正是新支兜的）。
    assert.ok(orig.includes(ANCHOR_IV_CALL), '副本中找不到倒装服药族调用点');
    mutated = mutated.replace(ANCHOR_IV_CALL, ANCHOR_IV_STUB);
    assert.notStrictEqual(mutated, orig, '变异未生效（第①支顺序表替换失败）');
    assert.ok(!mutated.includes('PC_SEQ_BARE_ZH.source'), '变异后第①支仍引用 PC_SEQ_BARE_ZH');
    assert.ok(!mutated.includes(ANCHOR_IV_CALL) && mutated.includes(ANCHOR_IV_STUB), '变异后仍在调用倒装服药子判据');
    fs.writeFileSync(src, mutated, 'utf8');
    const n = countHitsIn(tmp, ATTACK);
    assert.ok(n <= 4, `摘掉 PC_SEQ_BARE_ZH 后仍有 ${n}/${ATTACK.length} 条命中，新表可能不承重`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// 变异二：PC_ATTRIB_ZH 摘掉「肯定…」紧形状族 —— 只靠它承重的 2 条攻击句
// 必须重新漏判（第 3 条「自从换了领导…」还有第⑨支 自从×下滑 兜底，应仍命中）。
test('D2 变异守卫二：PC_ATTRIB_ZH 摘掉「肯定…」族后归因扩面句必须重新漏判', () => {
  const tmp = copySrc('attrib');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.ok(orig.includes(ANCHOR_ATTRIB_SURE), '副本中找不到「肯定…」归因族片段');
    const mutated = orig.replace(ANCHOR_ATTRIB_SURE, '');
    assert.notStrictEqual(mutated, orig, '变异未生效（归因族摘除失败）');
    fs.writeFileSync(src, mutated, 'utf8');
    const dropped = countHitsIn(tmp, ATTRIB_ONLY);
    assert.strictEqual(dropped, 0, `摘掉「肯定…」族后 ATTRIB_ONLY ${ATTRIB_ONLY.length} 条仍有 ${dropped} 条命中，该扩面可能不承重`);
    const kept = countHitsIn(tmp, ATTRIB_PLUS_P9);
    assert.strictEqual(kept, ATTRIB_PLUS_P9.length, `ATTRIB_PLUS_P9 应由第⑨支兜底仍全命中，实测 ${kept}/${ATTRIB_PLUS_P9.length}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// 变异三：把裸时序族喂回第⑨支（「不分表」的错误做法）—— 2 条中性记录
// 良性句必须重新被误命中。这条守卫证明本轮的分表决定是承重的，不是摆设。
test('D3 变异守卫三：裸族喂回第⑨支后中性记录良性必须重新被误命中', () => {
  const tmp = copySrc('ninelimb');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.ok(orig.includes(ANCHOR_P9), '副本中找不到第⑨支的写法');
    const mutated = orig.replace(ANCHOR_P9,
      "new RegExp('(?:' + PC_SEQ_ZH.source + '|' + PC_SEQ_BARE_ZH.source + ')' + '[^。]{0,14}(?:下降|上升|降低|减少|变少|下滑|提高)')");
    assert.notStrictEqual(mutated, orig, '变异未生效（第⑨支联合表替换失败）');
    fs.writeFileSync(src, mutated, 'utf8');
    const probes = [
      '第二天投诉量下降了，我们继续观察了三天',
      '当天访问量上升了一些，运营做了记录',
    ];
    const n = countHitsIn(tmp, probes);
    assert.strictEqual(n, probes.length, `裸族喂回第⑨支后 ${probes.length} 条中性记录句只有 ${n} 条被误命中，分表可能不承重`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// 还原三重校验：三项变异点互不影响，未变异副本必须全命中
test('D4 还原校验：三项变异点原文都在 src/index.js 里且改动互不重叠', () => {
  const orig = fs.readFileSync(SRC, 'utf8');
  for (const p of [ANCHOR_P1_UNION, ANCHOR_ATTRIB_SURE, ANCHOR_P9]) {
    const n = orig.split(p).length - 1;
    assert.strictEqual(n, 1, `变异点应恰好出现 1 次，实测 ${n} 次：\n  ${p}`);
  }
  assert.strictEqual(countHitsIn(ROOT, ATTACK), ATTACK.length, '未变异副本应全命中');
});

// ─── E 节：存量族不退化 ─────────────────────────────────────────────
test(`E1 存量攻击族 detector 命中 ${LEGACY_ATTACK.length} 条`, () => {
  const miss = LEGACY_ATTACK.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(miss, [], `存量攻击句退化：\n  ${miss.join('\n  ')}`);
});

test(`E2 存量良性族 detector 零命中 ${LEGACY_BENIGN.length} 条`, () => {
  const hit = LEGACY_BENIGN.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(hit, [], `存量良性句被误命中：\n  ${hit.join('\n  ')}`);
});

// ─── F 节：源码常量完整（后续轮次与负例脚本要能注入）────────────────
test('F PC_SEQ_BARE_ZH / 第①支联合表 / 归因族在源码中且含全部新词', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  assert.ok(/const PC_SEQ_BARE_ZH = \/\(\?:/.test(src), 'PC_SEQ_BARE_ZH 常量不存在');
  for (const w of ['隔天', '当天', '第二天', '次日', '从那天(?:以后|起)', '打那(?:天)?(?:以后|起)', '那天(?:以后|起)']) {
    assert.ok(src.includes(w), `PC_SEQ_BARE_ZH 缺「${w}」`);
  }
  // PC_SEQ_ZH 必须保持原样（第⑨支不收裸标记）
  assert.ok(src.includes("const PC_SEQ_ZH = /(?:自从|之后|以来|从此|从那以后|此后|后来|结束后|播出后|发布后|一结束|后[，,]|\\d{4}|去年|今天|昨天|前天)/;"),
    'PC_SEQ_ZH 被污染（第⑨支的弱形状不应收裸时序标记）');
  // 第①支必须同时引用两张表
  assert.ok(src.includes("'(?:' + PC_SEQ_ZH.source + '|' + PC_SEQ_BARE_ZH.source + ')'"),
    '第①支未同时引用 PC_SEQ_ZH 与 PC_SEQ_BARE_ZH');
  // 归因族必须是紧形状（后跟因果/效果名词），不是裸「肯定是」
  assert.ok(src.includes('|(?:肯定|一定)(?:是|由于)?[^。]{0,12}(?:原因|的锅|造成的?|导致|所致|带来的?|的功劳|起了?作用|的作用|的问题|的结果|的效果|的功效|受了[^。]{0,6}|能治|有效|见效|见了效|招财|辟邪|显灵|吉利|风水|中[^。]{0,3}(?:大奖|奖))'),
    'PC_ATTRIB_ZH 缺「肯定/一定…」紧形状族');
  assert.ok(!src.includes('|(?:肯定|一定)(?:是|由于)?(?!\\[|\\(|原因)'), 'PC_ATTRIB_ZH 不应含裸「肯定是」断言形');
  // 导出面不变：checkPseudoCausal 仍可从 idx 直接调用
  assert.strictEqual(typeof idx.checkPseudoCausal, 'function', 'checkPseudoCausal 未导出');
});
