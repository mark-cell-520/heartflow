/**
 * test/round-226-pseudo-causal-sure-attrib-and-mech-guard.test.js
 * — r226 pseudo_causal 第①支双向收口（v6.8.154）
 *
 * 背景（交接簿 data/upgrade-state.json r225 notes 候选① + 轮初探针新发现）：
 *   r225 给 PC_ATTRIB_ZH 加了「肯定…」紧形状族，但只收了 9 个因果名词，
 *   且只收「肯定」不收「一定」——轮初探针（scripts/tmp-226-probe.js）
 *   30 条同族攻击句 detector 仅 5/30 命中。同时探针发现**反向缺口**：
 *   第①支对带真实机制的良性归因句整族误伤（20 条良性里 8 条被判），
 *   根因是不对称——⑪⑫⑬⑭ 四支各有机制护栏，承重最大的①⑤⑨ 三支没有。
 *
 * 落地（src/index.js，判据结构/路由/评分公式一字未动，只动一张表 + 一处守卫）：
 *   ① PC_ATTRIB_ZH 的「肯定…」族扩为「(?:肯定|一定)…」，因果名词表
 *      9 → 21 个（造成的?/带来的?/起了?作用/的结果/的效果/的功效/
 *      受了…/能治/有效/见效/见了效/招财/辟邪/显灵/吉利/风水/中大奖）；
 *   ② 新增 PC_MECH_WEAK_ZH 机制在场豁免表，只喂弱支（①⑤⑨）的第三道腿。
 *
 * **两条纪律**：
 *   一、归因断言后必须跟因果/效果名词（紧形状），不收裸「肯定是/一定是」
 *      ——实测裸形误伤「肯定不会陷入今天的困境」这类修辞威胁句；
 *   二、豁免表只许收窄——PC_MECH_WEAK_ZH 刻意不收宽泛业务词（投入/研发/
 *      需求/数据/指标）与泛工程动词（代码/优化/修复/重构），实测收「代码」
 *      会误豁免 round-48 存量攻击句「团队加了新人之后，代码缺陷率下降了，
 *      说明新人培训起了作用」（那里的「代码」是指标名不是机制声明）。
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
process.on('exit', () => {
  console.log(`${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
});

const pcCount = (text) => idx.checkPseudoCausal(text).count;
const gateAction = (text) => gateMod.gate(text).gate.action;
const hasDim = (text) => (gateMod.gate(text).findings || []).some(f => f.dimension === 'pseudo_causal');

// 供 D 节变异用的源码锚点（与 src/index.js 当前实现逐字对应；
// 若将来重构这些写法，D1/D2/D3 会因找不到锚点而显式失败——这是有意的）
const ANCHOR_ATTRIB_FAMILY = '|(?:肯定|一定)(?:是|由于)?[^。]{0,12}(?:原因|的锅|造成的?|导致|所致|带来的?|的功劳|起了?作用|的作用|的问题|的结果|的效果|的功效|受了[^。]{0,6}|能治|有效|见效|见了效|招财|辟邪|显灵|吉利|风水|中[^。]{0,3}(?:大奖|奖))';
const ANCHOR_WEAK_GUARD = '|| (PC_MECH_WEAK_ZH.test(text) && !PC_MONOCAUSE_ZH.test(text)))) continue;';
const ANCHOR_MONOCAUSE_GUARD = '|| (PC_MECH_WEAK_ZH.test(text) && !PC_MONOCAUSE_ZH.test(text))';
// [r227] r227 新增的倒装服药子判据调用点。D1 变异必须**同时**摘掉它，
// 否则「他喝了这个偏方，第二天病就好了，一定是偏方有效」会被新支兜住，
// D1 就从「证明归因族承重」退化成假绿（r227 轮初实测：不摘时 26 条里 1 条仍命中）。
const ANCHOR_IV_CALL = 'const iv = causalInvertedTakeZh(text);';
const ANCHOR_IV_STUB = 'const iv = { count: 0, hits: [] };';

// ─── A 节语料：30 条同族攻击句（肯定/一定 + 因果/效果名词）────────────
const ATTACK = [
  // 肯定 + 新因果名词（受了…/有效/见效/招财/显灵/辟邪/吉利/风水/中大奖）
  '从那天以后他就像变了个人，肯定是受了刺激',
  '她开始每天跑步之后感冒就少了，跑步肯定能治感冒',
  '这老虎机今天还没吐分，下一把肯定中大奖',
  '自从戴上这块表，比赛就再没输过，肯定是表带来了运气',
  '打那以后他再没失眠，肯定是这款枕头有效',
  '换了这个头像之后订单就多了，肯定是头像招财',
  '去年开始每天转发锦鲤，之后就再没失过手，肯定是显灵了',
  '他坚持早起之后业绩就翻倍，肯定是早起见了效',
  '自从供了财神，店里生意就好了，肯定是财神爷起了作用',
  '喝了符水之后病就好了，肯定是符水起了作用',
  '他换了工位之后业绩就上去了，肯定是工位风水好',
  '从那天起她再没迟到过，肯定是闹钟起了作用',
  '自从家里摆了鱼缸，他就再没生过病，肯定是鱼缸辟邪',
  '装上这个脚本之后构建就快了，肯定是脚本见了效',
  '打那以后销量就再没掉过，肯定是新款包装的功劳',
  '换了这个号码之后他就再没输过，肯定是号码吉利',
  '她改了这个昵称之后就火了，肯定是昵称起的作用',
  // 一定 + 同表（r225 完全没收的一整族）
  '从那天以后他就像变了个人，一定是受了什么刺激',
  '她开始每天跑步之后感冒就少了，跑步一定能治感冒',
  '他上任之后公司利润就涨了，一定是他的能力造成的',
  '打那天以后他就再没感冒过，一定是换了风水摆件的结果',
  '自从换了领导，业绩就下滑了，一定是领导的问题',
  '这老虎机今天还没吐分，下一把一定会中大奖',
  '去年开始供灯，之后身体就好起来了，一定是供灯的效果',
  '从那天起她再没迟到过，一定是早起打卡起了作用',
  '他喝了这个偏方，第二天病就好了，一定是偏方有效',
  '换了这款洗发水，第二天头屑就没了，一定是洗发水的功效',
  // 存量已在覆盖内的两条（防回退）
  '他上任之后公司利润就涨了，肯定是他的能力造成的',
  '当天晚上就不疼了，肯定是贴了膏药的功劳',
  // 机制名词在场但带「唯一」单因归责断言 → 反豁免腿（PC_MONOCAUSE_ZH）照判。
  // round-221 存量测试语料：A/B 27705 条实测不加反豁免腿时 count 1→0（存量
  // 召回损失），加上后回到 1。它由第①支的「说明」承重、**不**靠归因族，
  // 所以不在 ATTRIB_FAMILY_ONLY 里（摘掉归因族它仍命中）。
  '我们加了缓存之后延迟降了，说明缓存是唯一原因',
];

// ─── B 节语料：20 条良性（修辞威胁 / 机制在场 / 统计谦辞 / 中性记录）──
// 分两组：MECH 8 条是**本轮修好的 HEAD 假阳性**（机制护栏承重证据），
// 其余 12 条覆盖「新词在场但判据另一条腿不在场」的邻近形状。
const BENIGN_MECH = [
  '吃了布洛芬之后烧就退了，说明药效发挥了作用',
  '加了缓存之后查询就快了，说明缓存配置生效了',
  '上线之后延迟降低了，说明这次的优化起了作用',
  '灰度之后故障率就降了，说明灰度策略是有效的',
  '复习之后成绩就提高了，说明复习是有用的',
  '下雨之后水库水位就涨了，说明是降雨补给了库容',
  '气温下降之后感冒就多了，说明是季节因素的影响',
  '温度升高之后液体就蒸发了，说明加热起了作用',
];
const BENIGN_OTHER = [
  // 修辞威胁 / 未来预测（含「一定」，无因果名词）
  '现在不努力，将来一定来不及，你会为自己今天的选择感到痛苦',
  '以后你一定会为今天没做这个决定而自责',
  '要是当时听我的做了对冲，公司肯定不会陷入今天的困境',
  '你再这样拖下去，将来一定会后悔的',
  '今天不背单词，下次考试一定不及格',
  '现在不修这个漏洞，上线之后一定会出事故',
  // 统计谦辞 / 对冲
  '样本太少，数据肯定是噪声，需要再观察一段时间',
  '实验组和对照组混在一起，肯定是不能直接归因的',
  // 带真实依据的正常归因（无时序标记，或已由函数头豁免）
  '他康复了是因为按时吃药，这肯定是治疗方案的作用',
  '公司扭亏是因为砍掉了亏损业务，肯定是战略调整的功劳',
  '这次通过是因为前期做了充分压测，肯定是准备充分的结果',
  '他会成功是因为他足够努力，这肯定是不用怀疑的',
];
const BENIGN = BENIGN_MECH.concat(BENIGN_OTHER);
// HEAD 即非 pass 的良性句（与 pseudo_causal 无关的维度命中）现值登记，
// 防止把存量噪声算成本轮回归（r224 踩坑⑤同型）
const BENIGN_HEAD_NONPASS = {
  '现在不努力，将来一定来不及，你会为自己今天的选择感到痛苦': 'rewrite',
  '以后你一定会为今天没做这个决定而自责': 'rewrite',
  '要是当时听我的做了对冲，公司肯定不会陷入今天的困境': 'rewrite',
  '你再这样拖下去，将来一定会后悔的': 'rewrite',
  '现在不修这个漏洞，上线之后一定会出事故': 'rewrite',
  '吃了布洛芬之后烧就退了，说明药效发挥了作用': 'rewrite',
  '加了缓存之后查询就快了，说明缓存配置生效了': 'rewrite',
  '上线之后延迟降低了，说明这次的优化起了作用': 'rewrite',
  '灰度之后故障率就降了，说明灰度策略是有效的': 'rewrite',
  '复习之后成绩就提高了，说明复习是有用的': 'rewrite',
  '他康复了是因为按时吃药，这肯定是治疗方案的作用': 'verify',
  '下雨之后水库水位就涨了，说明是降雨补给了库容': 'rewrite',
  '气温下降之后感冒就多了，说明是季节因素的影响': 'rewrite',
  '温度升高之后液体就蒸发了，说明加热起了作用': 'rewrite',
};

// ─── C 节语料：至今仍漏（逐条实测过拦在哪）──────────────────────────
// [r227] 首条「这瓶药吃下去烧就退了，肯定是药起了作用」已被 r227 的倒装服药
// 子判据收口（detector 0→1、gate pass→verify），移到 C3「必须保持命中」清单。
// **这不是放水**——C3 是正向断言（必须继续命中），比 C1 的「必须仍为 0」更严。
const STILL_GAP = [
  // PC_OTHERFACTOR_ZH 拦下（存量即如此；豁免表只许收窄，r225 已登记）
  { s: '打那以后球队就再也没输过，显然是因为换了教练', gate: 'verify' },
  { s: '从那天起她再也没迟到过，说明是早起打卡起了作用', gate: 'rewrite' },
];
// [r227] r227 收口、必须保持命中的句子（原 r226 STILL_GAP 首条）
const FIXED_BY_R227 = [
  { s: '这瓶药吃下去烧就退了，肯定是药起了作用', gate: 'verify' },
];

// ─── E 节语料：存量族（round-48 建维时的 24 攻击 / 30 良性）──────────
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

// ─── A 节：三层命中（不只守 action）────────────────────────────────
test(`A1 攻击句 detector 命中（${ATTACK.length} 条）`, () => {
  const miss = ATTACK.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(miss, [], `以下攻击句仍漏判：\n  ${miss.join('\n  ')}`);
});
test(`A2 攻击句 findings 含 pseudo_causal（${ATTACK.length} 条）`, () => {
  const miss = ATTACK.filter(s => !hasDim(s));
  assert.deepStrictEqual(miss, [], `以下攻击句 findings 不含维度：\n  ${miss.join('\n  ')}`);
});
test(`A3 攻击句 gate 非 pass（${ATTACK.length} 条）`, () => {
  const miss = ATTACK.filter(s => gateAction(s) === 'pass');
  assert.deepStrictEqual(miss, [], `以下攻击句 gate 仍 pass：\n  ${miss.join('\n  ')}`);
});

// ─── B 节：良性零误伤 + HEAD 现值登记 ──────────────────────────────
test(`B1 良性句 detector 零命中（${BENIGN.length} 条）`, () => {
  const hit = BENIGN.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(hit, [], `以下良性句被误命中：\n  ${hit.join('\n  ')}`);
});
test(`B2 良性句 findings 不含 pseudo_causal（${BENIGN.length} 条）`, () => {
  const hit = BENIGN.filter(s => hasDim(s));
  assert.deepStrictEqual(hit, [], `以下良性句 findings 含维度：\n  ${hit.join('\n  ')}`);
});
test(`B3 良性句 gate 现值登记（${Object.keys(BENIGN_HEAD_NONPASS).length} 条 HEAD 即非 pass 的句子防漂移）`, () => {
  const drift = [];
  for (const [s, e] of Object.entries(BENIGN_HEAD_NONPASS)) {
    const g = gateAction(s);
    if (g !== e) drift.push(`「${s}」登记=${e} 现值=${g}`);
  }
  assert.deepStrictEqual(drift, [], '以下良性句 gate action 发生漂移：\n  ' + drift.join('\n  '));
});
test(`B4 良性句 gate 全 pass（剔除 B3 登记的 ${Object.keys(BENIGN_HEAD_NONPASS).length} 条后）`, () => {
  const rest = BENIGN.filter(s => !(s in BENIGN_HEAD_NONPASS));
  const bad = rest.filter(s => gateAction(s) !== 'pass');
  assert.deepStrictEqual(bad, [], `以下良性句 gate 非 pass：\n  ${bad.join('\n  ')}`);
});

// ─── C 节：仍漏句现值照登（防将来静默变化）────────────────────────
test(`C1 仍漏的 ${STILL_GAP.length} 条 detector 仍为 0`, () => {
  const bad = STILL_GAP.filter(g => pcCount(g.s) !== 0);
  assert.deepStrictEqual(bad.map(g => g.s), [], '以下句子已被命中（应更新 STILL_GAP 清单）：\n  ' + bad.map(g => g.s).join('\n  '));
});
test('C2 仍漏句的 gate action 现值照登', () => {
  const drift = STILL_GAP.filter(g => gateAction(g.s) !== g.gate)
    .map(g => `「${g.s}」登记=${g.gate} 现值=${gateAction(g.s)}`);
  assert.deepStrictEqual(drift, [], '以下仍漏句 gate action 漂移：\n  ' + drift.join('\n  '));
});
// [r227] r227 收口的句子必须**继续**被命中（detector > 0 + gate action 不变）——
// 从「仍漏」登记挪到「必须保持命中」登记，约束方向只会更严不会更松。
test(`C3 r227 收口的 ${FIXED_BY_R227.length} 条必须保持命中`, () => {
  for (const g of FIXED_BY_R227) {
    assert.ok(pcCount(g.s) > 0, `「${g.s}」应保持 detector 命中，实测 ${pcCount(g.s)}`);
    assert.strictEqual(gateAction(g.s), g.gate, `「${g.s}」gate action 应保持 ${g.gate}，实测 ${gateAction(g.s)}`);
  }
});

// ─── D 节：变异守卫（复制 src/ 整棵树到临时目录再变异）──────────────
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r226-' + tag + '-'));
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
function countHitsIn(tmp, list) {
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(path.join(tmp, 'src', 'index.js'))});
const L=${JSON.stringify(list)};
let n=0; for(const x of L){ if(idx.checkPseudoCausal(x).count>0) n++; }
console.log(n);`],
    { encoding: 'utf8' });
  return parseInt(out.trim(), 10);
}

// 变异一：PC_ATTRIB_ZH 摘掉整个「(?:肯定|一定)…」族 —— 只靠它承重的
// 攻击句必须重新漏判，证明这张扩面表真的在承重。
// 预期条数在本轮实测后填死（不拍脑袋，见 UPGRADE_LOG r226 第四节）。
const ATTRIB_FAMILY_ONLY = [
  '从那天以后他就像变了个人，肯定是受了刺激',
  '她开始每天跑步之后感冒就少了，跑步肯定能治感冒',
  '这老虎机今天还没吐分，下一把肯定中大奖',
  '自从戴上这块表，比赛就再没输过，肯定是表带来了运气',
  '打那以后他再没失眠，肯定是这款枕头有效',
  '换了这个头像之后订单就多了，肯定是头像招财',
  '去年开始每天转发锦鲤，之后就再没失过手，肯定是显灵了',
  '他坚持早起之后业绩就翻倍，肯定是早起见了效',
  '自从供了财神，店里生意就好了，肯定是财神爷起了作用',
  '喝了符水之后病就好了，肯定是符水起了作用',
  '他换了工位之后业绩就上去了，肯定是工位风水好',
  '从那天起她再没迟到过，肯定是闹钟起了作用',
  '自从家里摆了鱼缸，他就再没生过病，肯定是鱼缸辟邪',
  '装上这个脚本之后构建就快了，肯定是脚本见了效',
  '换了这个号码之后他就再没输过，肯定是号码吉利',
  '她改了这个昵称之后就火了，肯定是昵称起的作用',
  '从那天以后他就像变了个人，一定是受了什么刺激',
  '她开始每天跑步之后感冒就少了，跑步一定能治感冒',
  '他上任之后公司利润就涨了，一定是他的能力造成的',
  '打那天以后他就再没感冒过，一定是换了风水摆件的结果',
  '这老虎机今天还没吐分，下一把一定会中大奖',
  '去年开始供灯，之后身体就好起来了，一定是供灯的效果',
  '从那天起她再没迟到过，一定是早起打卡起了作用',
  '他喝了这个偏方，第二天病就好了，一定是偏方有效',
  '换了这款洗发水，第二天头屑就没了，一定是洗发水的功效',
  // 存量已在覆盖内的一条（摘掉归因族后同样掉到 0，证明它只靠本族承重）
  '当天晚上就不疼了，肯定是贴了膏药的功劳',
];
// 双兜底句：摘掉归因族后仍有其他支命中（⑨ 自从×下滑 / ⑩ 穿×赢）
// —— 每条都实测过，见 UPGRADE_LOG r226 第四节（不拍脑袋）。
const ATTRIB_PLUS_OTHER = [
  '自从换了领导，业绩就下滑了，一定是领导的问题',
  '那天穿了红袜子，晚上就赢了钱，肯定是红袜子带来的好运',
  '那天穿了红内裤，当晚就赢了钱，一定是红内僻邪',
];
test(`D1 变异守卫一：摘掉「(?:肯定|一定)…」族后 ${ATTRIB_FAMILY_ONLY.length} 条必须重新漏判`, () => {
  const tmp = copySrc('attrib');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.ok(orig.includes(ANCHOR_ATTRIB_FAMILY), '副本中找不到「肯定/一定…」归因族片段');
    let mutated = orig.replace(ANCHOR_ATTRIB_FAMILY, '');
    // [r227] 同时中和 r227 新增的倒装服药子判据——ATTRIB_FAMILY_ONLY 里的
    // 「他喝了这个偏方，第二天病就好了，一定是偏方有效」被新支兜住，不摘它
    // 这条变异就证明不了归因族承重（r227 轮初实测不摘时该条仍 1 次命中）。
    assert.ok(orig.includes(ANCHOR_IV_CALL), '副本中找不到倒装服药族调用点');
    mutated = mutated.replace(ANCHOR_IV_CALL, ANCHOR_IV_STUB);
    assert.notStrictEqual(mutated, orig, '变异未生效（归因族摘除失败）');
    assert.ok(!mutated.includes(ANCHOR_IV_CALL) && mutated.includes(ANCHOR_IV_STUB), '变异后仍在调用倒装服药子判据');
    fs.writeFileSync(src, mutated, 'utf8');
    const dropped = countHitsIn(tmp, ATTRIB_FAMILY_ONLY);
    assert.strictEqual(dropped, 0, `摘掉归因族后 ATTRIB_FAMILY_ONLY ${ATTRIB_FAMILY_ONLY.length} 条仍有 ${dropped} 条命中，该扩面可能不承重`);
    const kept = countHitsIn(tmp, ATTRIB_PLUS_OTHER);
    assert.strictEqual(kept, ATTRIB_PLUS_OTHER.length, `ATTRIB_PLUS_OTHER 应由其他支兜底仍全命中，实测 ${kept}/${ATTRIB_PLUS_OTHER.length}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// 变异二：弱支守卫摘掉 PC_MECH_WEAK_ZH —— 8 条机制良性句必须重新被误命中，
// 证明这张豁免表真的在承重（不是摆设）。
test(`D2 变异守卫二：弱支守卫摘掉 PC_MECH_WEAK_ZH 后 ${BENIGN_MECH.length} 条机制良性必须重新被误命中`, () => {
  const tmp = copySrc('mech');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.ok(orig.includes(ANCHOR_WEAK_GUARD), '副本中找不到弱支三道腿守卫写法');
    const mutated = orig.replace(ANCHOR_WEAK_GUARD, ')) continue;');
    assert.notStrictEqual(mutated, orig, '变异未生效（弱支守卫替换失败）');
    fs.writeFileSync(src, mutated, 'utf8');
    const n = countHitsIn(tmp, BENIGN_MECH);
    assert.strictEqual(n, BENIGN_MECH.length, `摘掉机制豁免后 ${BENIGN_MECH.length} 条机制良性只有 ${n} 条被误命中，豁免表可能不承重`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// 变异三：把 PC_MECH_WEAK_ZH 换成「宽泛业务词 + 泛工程动词」的错误版本
// （r216~r225 九轮纪律：豁免表只许收窄）——round-48 存量攻击句
// 「团队加了新人之后，代码缺陷率下降了…」必须重新漏判，证明本轮刻意
// 不收「代码/优化/修复」的决定是承重的。
const MONOCAUSE_PROBE = ['我们加了缓存之后延迟降了，说明缓存是唯一原因'];
test(`D3 变异守卫三：豁免表放宽到含「代码」后存量攻击句必须重新漏判`, () => {
  const tmp = copySrc('wide');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    const probe = ['团队加了新人之后，代码缺陷率下降了，说明新人培训起了作用。'];
    assert.strictEqual(countHitsIn(ROOT, probe), 1, '未变异副本应命中该存量攻击句');
    // 锚点必须唯一：PC_LUCK2_MECH_ZH 里也有「|缓存|索引|灰度」，
    // 用短串会变异到错误的表上（r225 踩坑③同型：锚点是「要匹配的文本」）
    const anchor = 'const PC_MECH_WEAK_ZH = /(?:药效|药理|用药|服药|医嘱|疗程|治疗|医生|诊断|手术|成分|疗效|缓存|索引|灰度';
    assert.strictEqual(orig.split(anchor).length - 1, 1, 'PC_MECH_WEAK_ZH 定义锚点不唯一');
    const mutated = orig.replace(anchor, anchor + '|代码|优化|修复');
    assert.notStrictEqual(mutated, orig, '变异未生效（豁免表放宽失败）');
    fs.writeFileSync(src, mutated, 'utf8');
    const n = countHitsIn(tmp, probe);
    assert.strictEqual(n, 0, `豁免表放宽到含「代码」后该存量攻击句仍被命中（${n}），收窄纪律失效`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// 变异四：摘掉「唯一…」反豁免腿 —— round-221 存量攻击句必须重新漏判，
// 证明这条反豁免腿真的在承重（A/B 27705 条实测出的那条存量召回损失）。
test('D4 变异守卫四：摘掉 PC_MONOCAUSE_ZH 反豁免腿后单因归责句必须重新漏判', () => {
  const tmp = copySrc('mono');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.strictEqual(countHitsIn(ROOT, MONOCAUSE_PROBE), 1, '未变异副本应命中该单因归责句');
    assert.ok(orig.includes(ANCHOR_MONOCAUSE_GUARD), '副本中找不到反豁免腿写法');
    const mutated = orig.replace(ANCHOR_MONOCAUSE_GUARD, '|| PC_MECH_WEAK_ZH.test(text)');
    assert.notStrictEqual(mutated, orig, '变异未生效（反豁免腿摘除失败）');
    fs.writeFileSync(src, mutated, 'utf8');
    const n = countHitsIn(tmp, MONOCAUSE_PROBE);
    assert.strictEqual(n, 0, `摘掉反豁免腿后该单因归责句仍被命中（${n}），反豁免腿可能不承重`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// 还原校验：三处变异点原文都在 src/index.js 里且改动互不重叠
test('D5 还原校验：三处变异点原文都在 src/index.js 里且改动互不重叠', () => {
  const orig = fs.readFileSync(SRC, 'utf8');
  for (const p of [ANCHOR_ATTRIB_FAMILY, ANCHOR_WEAK_GUARD, ANCHOR_MONOCAUSE_GUARD]) {
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
test('F 归因族紧形状 / 机制豁免表 / 弱支三道腿都在源码中', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  assert.ok(src.includes(ANCHOR_ATTRIB_FAMILY), 'PC_ATTRIB_ZH 缺「(?:肯定|一定)…」紧形状族');
  // 必须是紧形状：不收裸「肯定是/一定是」
  assert.ok(!src.includes('|(?:肯定|一定)(?:是|由于)?(?!\\[|\\(|原因)'), 'PC_ATTRIB_ZH 不应含裸断言形');
  // 「一定」必须与「肯定」同表（r225 只收肯定的那一族）
  assert.ok(src.includes('(?:肯定|一定)(?:是|由于)?'), 'PC_ATTRIB_ZH 未收「一定」族');
  assert.ok(/const PC_MECH_WEAK_ZH = \/\(\?:/.test(src), 'PC_MECH_WEAK_ZH 常量不存在');
  assert.ok(/const PC_MONOCAUSE_ZH = \/\(\?:/.test(src), 'PC_MONOCAUSE_ZH 反豁免常量不存在');
  assert.ok(src.includes('&& !PC_MONOCAUSE_ZH.test(text)'), '弱支守卫未接 PC_MONOCAUSE_ZH 反豁免腿');
  assert.ok(src.includes('PC_MECH_WEAK_ZH.test(text) && !PC_MONOCAUSE_ZH.test(text)'), '弱支守卫的机制豁免腿未接反豁免');
  // 机制豁免只喂弱支，不许升级成函数级豁免（那会连⑩⑪⑫⑬⑭一起豁免）
  assert.strictEqual(src.split('const PC_MECH_WEAK_ZH = /(?:').length - 1, 1, 'PC_MECH_WEAK_ZH 应只定义 1 次');
  assert.strictEqual(src.split('PC_MECH_WEAK_ZH.test(text)').length - 1, 1, 'PC_MECH_WEAK_ZH 应只被弱支守卫引用 1 次');
  assert.ok(!/if \(PC_MECH_WEAK_ZH|STAT_CONTEXT_ZH \|\| PC_MECH/.test(src), '机制豁免不许升级成函数级豁免');
  // 导出面不变
  assert.strictEqual(typeof idx.checkPseudoCausal, 'function', 'checkPseudoCausal 未导出');
});
