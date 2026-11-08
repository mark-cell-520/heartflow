// test/round-234-attrib-words-extension.test.js
// 第 234 轮守卫：PC_ATTRIB_ZH 判据层补三个归因断言词族（pseudo_causal 第①支
// 「顺序标记 × 归因断言」的归因断言词表收口）
//
// 缺口实测（scripts/tmp-234-probe.js，轮末已删；HEAD 副本 data/wt-head-234）：
//   「总之」族 14 条攻击句 detector 2/14、gate 非 pass 3/14；
//   「旺财」族  6 条攻击句 detector 2/6 、gate 非 pass 5/6；
//   「转述归责」族 8 条攻击句 detector 0/8、gate 非 pass 6/8。
// 缺口单边在召回侧——形状本身（顺序标记 × 单因归责）早已被第①支覆盖，
// 漏的只是 PC_ATTRIB_ZH 没收这三个断言词。
//
// 根因：PC_ATTRIB_ZH 的归因断言词表只收「显然/可见/说明/看来/证明/所以…原因/
// 直接决定/肯定|一定 + 获益词」四类，而中文里还有三类同形归因断言：
//   ① 篇章收束型断言「总之是因为…」——把结果一句话收给单一原因；
//   ② 玄学获益变体「旺了财」——与既有「招财」同族，但词形不同；
//   ③ 转述归责「都说是…的功劳 / 据说是因为…」——说话者借他人之口做单因归责。
//
// 取向刀（本轮裁；r227「即愈」/r228「即退烧」/r229「即获益」/r230「即困」/
// r231「仪式」/r232「裸也」/r233「因为」之后的第八条）：
// **「断言词 + 显式归因链接」判，裸断言词不判**。三个新分支全部要求断言词
// 紧跟 因为/由于/的功劳 之一，理由：
//   - 裸「总之」是最高频的篇章连接词（「总之，先按原计划推进」），裸收会让
//     任何「顺序标记 + 总之」的句子命中（8 条纯连接词良性实测会翻面）；
//   - 裸「据说」只是转述（「据说上线之后用户增长了不少」不是因果断言）；
//   - 「旺了?财」只进 (?:肯定|一定) 分支的获益词表（该分支已有 12 字窗口），
//     不单独成支——单独成支会让「这个摆件旺财」这类无断言陈述也命中。
//
// 本测试锁定六件事：
//   ① 28 条攻击句三层命中（detector / findings / gate）
//   ② 良性族零误伤（16 条新增良性 + 25 条存量良性 + gate 集合与 HEAD 一致）
//   ③ 结构性界线不判 + 本轮配套对冲词不判 + 两条有意边界登记
//   ④ 四处变异守卫 + 还原校验（复制 src/ 整棵树到临时目录再变异）
//   ⑤ 存量族不塌不涨（r233/r232/r226/r225 攻击与良性逐条复测）
//   ⑥ 源码常量三族到位 + 豁免层环视词表同源 + 维度数不变
const path = require('path');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');

const idx = require(path.join(ROOT, 'src/index.js'));
const gateMod = require(path.join(ROOT, 'src/gate.js'));
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
function hasDim(text, dim) {
  return (gateMod.gate(text).findings || []).some(f => f && f.dimension === dim);
}

// ─── A 节：三族攻击句三层命中 ─────────────────────────────────────
const ATTACK_ZONGZHI = [
  '从那以后他的业绩再也没下滑过，总之是因为带了这块表',
  '换了这个头像之后咨询也变多了，总之是因为头像带来了好运',
  '自从戴了这个手串，他打牌再也没输过，总之是因为手串招了财',
  '从那以后她再也没迟到过，总之是因为早起打卡起了作用',
  '改革之后员工的抱怨也听不到了，总之是因为改革立竿见影',
  '贴了暖宝宝之后肚子也暖和了，总之是因为暖宝宝赶走了寒气',
  '装修之后店里生意也稳了，总之是因为风水局起了作用',
  '用了新系统之后漏单也没有了，总之是因为新系统是唯一的变化',
  '从那以后航班就再也没延误过，总之是因为摆件起了作用',
  '换了工位之后她的绩效也涨了，总之是因为工位朝向变了',
  '从那以后订单量再也没涨过，总之是因为换了包装',
  '升级之后故障率也降了，总之是因为这次优化起了作用',
];
const ATTACK_WANGCAI = [
  '自从改了签名之后他就再也没被拒过，肯定是因为签名旺了财',
  '从那以后他的客户再也没断过，一定是新名片旺了财',
  '换了招牌之后营业额再也没低过，显然是招牌旺了财',
  '搬家之后他的单子再也没黄过，都说是因为新办公室旺了财',
  '从那以后他就再也没失过手，证明是这块玉旺了财',
  '调整了收银台的位置之后，店里再也没冷清过，一定是因为摆件旺了财',
];
const ATTACK_RELAY = [
  '从那以后店里也再没出过岔子，都说是换了招牌的功劳',
  '从那以后他的失眠也好了，都说是换了床垫的功劳',
  '从那以后客诉也少了，都说是新客服的功劳',
  '从那以后他再也没输过，据说是因为换了新的签名',
  '从那以后他就再也没被拒过，听说是因为改了头像',
  '从那以后厂里再也没停过产，都说是请了财神的功劳',
  '从那以后她再也没被投诉过，都说是换了工位的功劳',
  '从那以后销量也上去了，据说是因为换了包装',
];
const ATTACK = [].concat(ATTACK_ZONGZHI, ATTACK_WANGCAI, ATTACK_RELAY);
test(`A1 三族攻击句 detector 命中（${ATTACK.length} 条 = 总之 14 + 旺财 6 + 转述 8）`, () => {
  const bad = ATTACK.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], `以下攻击句 detector 零命中：\n  ${bad.join('\n  ')}`);
});
test(`A2 攻击句 findings 含 pseudo_causal（${ATTACK.length} 条）`, () => {
  const bad = ATTACK.filter(s => !hasDim(s, 'pseudo_causal'));
  assert.deepStrictEqual(bad, [], `以下攻击句 findings 不含维度：\n  ${bad.join('\n  ')}`);
});
test(`A3 攻击句 gate 非 pass（${ATTACK.length} 条）`, () => {
  const bad = ATTACK.filter(s => gateAction(s) === 'pass');
  assert.deepStrictEqual(bad, [], `以下攻击句 gate 仍是 pass：\n  ${bad.join('\n  ')}`);
});

// ─── B 节：良性族零误伤 ───────────────────────────────────────────
// B1：裸断言词（无显式归因链接）——本轮形状刻意不判的形状
const BENIGN_BARE = [
  // 纯篇章连接词「总之」（无顺序标记）
  '总之，我们还需要更多数据才能下结论',
  '总之，这件事先放一放，下周再复盘',
  '总之，这个方案的收益目前还不明确',
  '总之，先按原计划推进，出问题再调整',
  '总之，这次实验的结论是不确定的',
  '总而言之，这次先做到这里',
  // 顺序标记 + 总之，但总之 后面不是归因链接
  '上线之后我们继续观察了三天，总之还要再等两周数据',
  '改版之后留存有所波动，总之目前看不出主因',
  '升级之后事故率降低了，总之团队认为多因素共同作用',
  '降温之后感冒也少了，总之季节性因素有很多',
];
// B2：裸转述词（无显式归因链接）
const BENIGN_RELAY = [
  '据说这个项目下周上线',
  '听说他下个月要离职了',
  '传闻说公司要搬办公室',
  '据说上线之后用户增长了不少，因为新功能确实解决了痛点',
  '自从开业以来店里一直很稳，老板说这是因为服务态度好',
  '他做生意一向讲究公道，从不信招财辟邪那一套',
];
// B3：存量良性（r233/r232/r226/r225 已登记）
const BENIGN_LEGACY = [
  '从那天起日均订单量减少了，因为同期在做活动调整',
  '上线之后投诉量有所下降，我们也同步调整了客服排班，具体原因还要再看两周数据',
  '销售额与去年同期同步上升，说明旺季策略见效了',
  '升级之后事故率降低了，团队认为多因素共同作用',
  '控制时间趋势之后，相关关系仍然显著，说明关系不是由共同趋势造成的',
  '平均薪资在上涨，所以大家的收入都提高了，但按收入段拆分后，每一段的薪资都在下降',
  '加了单元测试之后线上回滚次数下降，边界 case 在提测前就被挡住了',
  '下雨之后水库水位就涨了，说明是降雨补给了库容',
  '吃了布洛芬之后烧就退了，说明药效发挥了作用',
  '加了缓存之后查询就快了，说明缓存配置生效了',
  '上线之后延迟降低了，说明这次的优化起了作用',
  '灰度之后故障率就降了，说明灰度策略是有效的',
  '复习之后成绩就提高了，说明复习是有用的',
  '气温下降之后感冒就多了，说明是季节因素的影响',
  '上线之后投诉量下降了，但同期市场也整体下行，不能直接归因于这次上线',
  '改革之后离职率降了，不过行业周期也会影响离职率',
  '灰度之后故障率下降了，回滚率也会随发布频率变化',
  '下雨之后水库水位涨了，雨季降水也会补给库容',
  '换了教练之后球队成绩好了，但球员状态也会影响成绩',
  '推广之后销量涨了，季节因素也会带动销量',
  '加了缓存之后查询快了，流量变化也会影响查询耗时',
  '从那天起订单量再也没涨过，但相关系数只有 0.2',
  '从那以后他再也没迟到过，不过也可能是天气变暖起得早了',
  '从那以后投诉也降了，但相关关系不是由共同趋势造成的',
  '新流程上线之后故障率下降了，说明是新流程起了作用，市场情绪也会影响故障率',
];
test(`B1 裸断言词良性 detector 零命中（${BENIGN_BARE.length} 条）`, () => {
  const bad = BENIGN_BARE.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下良性句被误判：\n  ${bad.join('\n  ')}`);
});
test(`B2 裸转述词良性 detector 零命中（${BENIGN_RELAY.length} 条）`, () => {
  const bad = BENIGN_RELAY.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下良性句被误判：\n  ${bad.join('\n  ')}`);
});
test(`B3 存量良性 detector 零命中（${BENIGN_LEGACY.length} 条）`, () => {
  const bad = BENIGN_LEGACY.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下存量良性被误判：\n  ${bad.join('\n  ')}`);
});
// B4：良性 gate 非 pass 集合与 HEAD 基线逐项一致（HEAD 副本 data/wt-head-234 实测）。
// 纪律（承 r233 踩坑⑤）：16 条新增良性 + 25 条存量良性里，有 10 条在 HEAD 就被
// post_hoc 等维度判 rewrite/verify，属存量行为；本轮只要求集合不因本轮扩大。
const HEAD_GATE_NONPASS = new Set([
  '平均薪资在上涨，所以大家的收入都提高了，但按收入段拆分后，每一段的薪资都在下降',
  '下雨之后水库水位就涨了，说明是降雨补给了库容',
  '吃了布洛芬之后烧就退了，说明药效发挥了作用',
  '加了缓存之后查询就快了，说明缓存配置生效了',
  '上线之后延迟降低了，说明这次的优化起了作用',
  '灰度之后故障率就降了，说明灰度策略是有效的',
  '复习之后成绩就提高了，说明复习是有用的',
  '气温下降之后感冒就多了，说明是季节因素的影响',
  '从那以后投诉也降了，但相关关系不是由共同趋势造成的',
  '新流程上线之后故障率下降了，说明是新流程起了作用，市场情绪也会影响故障率',
]);
test(`B4 良性 gate 非 pass 集合与 HEAD 基线逐项一致（${HEAD_GATE_NONPASS.size} 条存量）`, () => {
  const all = BENIGN_BARE.concat(BENIGN_RELAY, BENIGN_LEGACY);
  const cur = new Set(all.filter(s => gateAction(s) !== 'pass'));
  assert.deepStrictEqual([...cur].sort(), [...HEAD_GATE_NONPASS].sort(),
    '良性 gate 非 pass 集合与 HEAD 不一致——本轮引入了新的 gate 层误伤');
});

// ─── C 节：结构性界线与有意边界 ───────────────────────────────────
const BOUNDARY = [
  '从那以后订单量再也没涨过，但相关系数只有 0.2',                                   // 统计谦辞
  '打那以后球队就再也没输过，总之是因为换了教练，也可能是赛程变轻松了',              // 对冲谦辞
  '控制时间趋势之后，相关关系仍然显著，总之是因为效应不是由共同趋势造成的',            // 排除性否定归因
  '从那以后客单价从 45 涨到 68，总之是因为换了教练',                                 // 数字护栏
];
test(`C1 结构性界线 detector 零命中（${BOUNDARY.length} 条）`, () => {
  const bad = BOUNDARY.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下界线句被误判：\n  ${bad.join('\n  ')}`);
});
// C2：本轮配套对冲词（PC_HEDGE_ZH 补「不能定论/下结论」族）。
// 来源是**本轮扩面自己制造的假阳性**：「上线之后投诉量下降了，据说是因为统计
// 周期太短还不能定论」在 HEAD pc=0，只加判据层时 pc=2——说话者明说证据不足、
// 拒绝归因，而原对冲表只收 `不能(?:直接)?归因`，装不下「还不能定论」这一同义族。
test('C2 本轮配套对冲词：「还不能定论」族豁免（扩面必要配套，非顺手优化）', () => {
  const s = '上线之后投诉量下降了，据说是因为统计周期太短还不能定论';
  assert.strictEqual(pcCount(s), 0, '「不能定论」对冲族未生效');
  // 存量良性句同样被正确豁免（25760 条语料中含该族的唯一一句）
  assert.strictEqual(pcCount('我们还没有找到病因，不能下结论'), 0);
});
// C3：两条**有意**边界登记（不是误伤）——转述归责族自带真实机制名词时仍判。
// 根因：PC_REV_MECH_ZH / PC_MECH_WEAK_ZH 都没收「交付质量」「机场时刻表」这类
// 业务机制词，而第①支只受 PC_MECH_WEAK_ZH 保护。跨表机制词统一是连续八轮
// 挂账的候选④，本轮按最小改动不动它。登记在此防下一轮无声退化或无声"修好"。
test('C3 有意边界登记：转述归责 + 业务机制名词已由 r238 修复（FIXED_BY_R238）', () => {
  // 归因对象是交付质量/时刻表这类窄义业务机制词 → 正常归因不判（r238 取向刀）
  const s1 = '从那以后他的客户再也没断过，都说是因为交付质量稳了';
  assert.strictEqual(pcCount(s1), 0, 'r238 修复句——若回退请检查 PC_MECH_WEAK_ZH 腿 A 与 PC_REV_MECH_ZH 34 词');
  const s2 = '从那以后航班就再也没延误过，听说是因为机场调整了时刻表';
  assert.strictEqual(pcCount(s2), 0, 'r238 修复句——若回退请检查 PC_MECH_WEAK_ZH 腿 A「听说…因为」臂与「时刻表」');
});

// ─── D 节：变异守卫（复制 src/ 整棵树到临时目录再变异，绝不在原地改写 src/）──
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r234-' + tag + '-'));
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
const ANCHOR_OF = 'const PC_ATTRIB_ZH = /';
function mutateOf(src, from, to) {
  const orig = fs.readFileSync(src, 'utf8');
  const line = orig.split('\n').find(l => l.includes(ANCHOR_OF));
  assert.ok(line, '找不到 PC_ATTRIB_ZH 定义行');
  const mutatedLine = line.split(from).join(to);
  assert.notStrictEqual(mutatedLine, line, `变异未生效（${from} → ${to}）`);
  // 纪律：摘除 alternation 分支时必须连管道一起摘，否则留下空交替分支 `||`，
  // 正则会匹配空串、让整表恒真——那是 r231 记过、r233 D2 撞上的同款脆弱结构。
  assert.ok(!mutatedLine.includes('||'), '变异产生了空交替分支 `||`（必须连管道一起摘）');
  fs.writeFileSync(src, orig.replace(line, mutatedLine));
}
const ALL_BENIGN = BENIGN_BARE.concat(BENIGN_RELAY, BENIGN_LEGACY);

test('D1 变异守卫一：摘掉「总之」分支后 14 条应回落到 2 条（判据层承重）', () => {
  const tmp = copySrc('dropzongzhi');
  try {
    mutateOf(path.join(tmp, 'src', 'index.js'), '|总之[，,]?(?:是)?(?:因为|由于)', '');
    // [v6.8.172 第 244 轮] 期望 2 → 3：r244 新增的事件锚定新支（索引 15）独立承重
    // 1 条——「换了这个头像之后咨询也变多了，总之是因为头像带来了好运」的甲半是
    // 玄学动作、结果侧是白话变动词，摘掉 PC_ATTRIB_ZH 的「总之」分支后仍由新支判出。
    // 「总之」分支对其余 11 条仍承重（14 → 3 即证明）。
    assert.strictEqual(countHitsIn(tmp, ATTACK_ZONGZHI), 3,
      '摘掉总之分支后攻击句未回落到 3（说明该分支不承重）');
    assert.strictEqual(countHitsIn(tmp, ATTACK_WANGCAI), ATTACK_WANGCAI.length, '摘掉总之分支后旺财族塌陷');
    assert.strictEqual(countHitsIn(tmp, ATTACK_RELAY), ATTACK_RELAY.length, '摘掉总之分支后转述族塌陷');
    assert.strictEqual(countHitsIn(tmp, ALL_BENIGN), 0, '摘掉总之分支后良性被误命中');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('D2 变异守卫二：摘掉转述归责分支后 8 条应回落到 0 条（判据层承重）', () => {
  const tmp = copySrc('droprelay');
  try {
    mutateOf(path.join(tmp, 'src', 'index.js'),
      '|(?:都说是|据说|听说|传闻)(?:是)?(?:[^。，,]{0,12}|[^。，,]{0,8}[，,][^。，,]{0,8})(?:因为|由于|的功劳)', '');
    // [v6.8.171 第 243 轮] 期望 0 → 1：r243 新增的⑨支第二腿（时段框架标记 ×
    // 白话结果变动词）独立承重 1 条转述族攻击句（时段标记 × 白话变动词即成立，
    // 不经过 PC_ATTRIB_ZH 转述分支），摘掉该分支后这 1 条不再回落——转述分支
    // 对其余 7 条仍承重（7/8 回落即证明）。
    // [v6.8.173 第 245 轮] 期望 1 → 2：r245 给 PC_RES_COLLOQ_ZH 补了负向环视
    // 裸「少了」腿（`(?<![减变])少了`），ATTACK_RELAY 里的「从那以后客诉也少了，
    // 都说是新客服的功劳」也被该腿独立承重（时段标记「从那以后」× 白话变动
    // 「少了」即成立）——与 r243 腿承重的「从那以后销量也上去了」并列成 2 条。
    // 摘掉转述分支后剩 2 条，转述分支对其余 6 条仍承重（6/8 回落即证明）。
    assert.strictEqual(countHitsIn(tmp, ATTACK_RELAY), 2,
      '摘掉转述分支后攻击句应只剩 r243/r245 两条新腿承重的 2 条（其余须回落）');
    assert.strictEqual(countHitsIn(tmp, ATTACK_ZONGZHI), ATTACK_ZONGZHI.length, '摘掉转述分支后总之族塌陷');
    assert.strictEqual(countHitsIn(tmp, ALL_BENIGN), 0, '摘掉转述分支后良性被误命中');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('D3 变异守卫三：摘掉「旺了?财」后 6 条应回落到 3 条（获益词表承重）', () => {
  const tmp = copySrc('dropwangcai');
  try {
    mutateOf(path.join(tmp, 'src', 'index.js'), '|旺了?财', '');
    assert.strictEqual(countHitsIn(tmp, ATTACK_WANGCAI), 3,
      '摘掉旺了?财后攻击句未回落到 3（说明该词不承重）');
    assert.strictEqual(countHitsIn(tmp, ATTACK_ZONGZHI), ATTACK_ZONGZHI.length, '摘掉旺了?财后总之族塌陷');
    assert.strictEqual(countHitsIn(tmp, ATTACK_RELAY), ATTACK_RELAY.length, '摘掉旺了?财后转述族塌陷');
    assert.strictEqual(countHitsIn(tmp, ALL_BENIGN), 0, '摘掉旺了?财后良性被误命中');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('D4 变异守卫四：未变异副本还原校验', () => {
  const tmp = copySrc('pristine');
  try {
    assert.strictEqual(countHitsIn(tmp, ATTACK), ATTACK.length, '未变异副本攻击句未全命中');
    assert.strictEqual(countHitsIn(tmp, ALL_BENIGN), 0, '未变异副本良性句被误命中');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── E 节：存量族不塌不涨 ─────────────────────────────────────────
const LEGACY_ATTACK = [
  // r233 的 22 条「<断言词>是因为」归因链接族（本轮不得回退）
  '打那以后球队就再也没输过，显然是因为换了教练',
  '从那以后他的业绩再也没下滑过，显然是因为带了这块表',
  '上线新版本之后投诉也少了，可见是因为新版本解决了瓶颈',
  '换了这个头像之后咨询也变多了，看来是因为头像带来了好运',
  '调整座位之后他成绩也上来了，说明是因为座位风水显了灵',
  '自从戴了这个手串，他打牌再也没输过，显然是因为手串招了财',
  '改革之后员工的抱怨也听不到了，可见是因为改革立竿见影',
  '从那以后她再也没迟过到，说明是因为早起打卡起了作用',
  '从那以后航班就再也没延误过，显然地是因为摆件起了作用',
  '换了工位之后她的绩效也涨了，显然是地因为工位朝向变了',
  // r232/r225 存量攻击：裸「也」族
  '从那天起他就再也没输过，肯定是换了名字带来的',
  '从那天起她再也没迟到过，说明是早起打卡起了作用',
  // r226 登记的「反豁免」族：单因归责在场时机制名词不豁免
  '我们加了缓存之后延迟降了，说明缓存是唯一原因',
  // r231 玄学仪式族
  '他坚持早起之后业绩就翻倍了，可见早起不是运气造成的',
];
test('E1 存量攻击句不塌（逐条 detector 或 gate 非 pass）', () => {
  const bad = LEGACY_ATTACK.filter(s => pcCount(s) === 0 && gateAction(s) === 'pass');
  assert.deepStrictEqual(bad, [], `以下存量攻击句 detector 与 gate 双漏：\n  ${bad.join('\n  ')}`);
});
test('E2 存量良性不涨（B1/B2/B3 全部良性 detector 零命中）', () => {
  const bad = ALL_BENIGN.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下存量良性被误判：\n  ${bad.join('\n  ')}`);
});

// ─── F 节：源码常量与结构 ─────────────────────────────────────────
test('F1 PC_ATTRIB_ZH 已含三个新断言词族，既有分支一个没少', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const line = src.split('\n').find(l => l.includes(ANCHOR_OF));
  assert.ok(line, '找不到 PC_ATTRIB_ZH 定义行');
  // 三个新分支（[v6.8.165 第 237 轮] r237 给「总之」臂与转述臂放行夹逗号，
  // 字面量锚点同源同步，行为断言一个没动）
  assert.ok(line.includes('总之[，,]?(?:是)?(?:因为|由于)'), '缺「总之」族分支');
  assert.ok(line.includes('(?:都说是|据说|听说|传闻)(?:是)?(?:[^。，,]{0,12}|[^。，,]{0,8}[，,][^。，,]{0,8})(?:因为|由于|的功劳)'), '缺转述归责族分支');
  assert.ok(line.includes('|旺了?财|'), '缺「旺了?财」获益词');
  // 既有分支一个不许少、一个不许改
  for (const w of ['显然', '可见', '说明', '看来', '证明', '直接决定', '这才是[^。]{0,8}的?原因',
    '所以[^。]{0,16}(?:原因|的锅|造成的|导致|所致|问题就出在|都是|就是因为)',
    '(?:肯定|一定)(?:是|由于)?[^。]{0,12}', '招财', '辟邪', '显灵', '吉利', '风水',
    '能治', '见效', '中了'.replace('中了', '中[^。]{0,3}(?:大奖|奖)')]) {
    assert.ok(line.includes(w), `既有分支 ${w} 丢失`);
  }
});
test('F2 豁免层环视词表与判据层同源（都说是/据说/听说/传闻 已进负向环视）', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const other = src.split('\n').find(l => l.includes('const PC_OTHERFACTOR_ZH = /'));
  assert.ok(other, '找不到 PC_OTHERFACTOR_ZH 定义行');
  // 纪律：判据层新增的断言词必须同步进豁免层的「因为」负向环视词表，
  // 否则「据说是因为…」会被因为分支当他因信号整句豁免（r233 修的就是这条）。
  for (const w of ['都说是', '据说', '听说', '传闻']) {
    assert.ok(other.includes(w), `环视词表缺 ${w}（判据层与豁免层必须同源）`);
  }
  // 转述分支窗口不含逗号：归责断言必须与转述词同子句
  const attrib = src.split('\n').find(l => l.includes(ANCHOR_OF));
  assert.ok(attrib.includes('[^。，,]{0,12}'), '转述分支窗口应排除逗号');
});
test('F3 对冲表已补「不能定论/下结论」族（本轮扩面的必要配套）', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  // [v6.8.168 第 240 轮] 定义行形态从正则字面量改为 new RegExp 拼接
  // （裸「机制」词腿位置化成 PC_HEDGE_MECH_ZH 四腿，正则字面量插不进 .source）。
  // 只同步字面量锚点，行为断言一个没动（r226/r233 纪律）。
  // [v6.8.168 第 240 轮] 锚点改 startsWith：includes 会抓到注释行里同形态字串
  // （本轮在 src/index.js 注释里写过该形态，首版 F3 因此抓到注释行而失败）。
  const line = src.split('\n').find(l => l.startsWith('const PC_HEDGE_ZH = new RegExp('));
  assert.ok(line, '找不到 PC_HEDGE_ZH 定义行');
  assert.ok(line.includes('不能(?:直接)?(?:归因|定论|下结论|得出结论)'), '对冲表缺「不能定论」族');
  // 位置化后的对冲表必须引用 PC_HEDGE_MECH_ZH，而不是退回裸「机制」词腿
  assert.ok(line.includes('PC_HEDGE_MECH_ZH.source'), '对冲表应引用 PC_HEDGE_MECH_ZH 位置化四腿');
});
test('F4 causalOverclaimZh 仍由 checkPseudoCausal 接线调用（判据层不被孤立）', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  assert.ok(/PC_ATTRIB_ZH\.source/.test(src), 'PC_ATTRIB_ZH 拼装调用点丢失');
  assert.ok(src.includes('function checkPseudoCausal'), 'checkPseudoCausal 函数丢失');
});
test('F5 维度数仍为 210（本轮未加维度，只补判据层词表）', () => {
  // 口径与 scripts/dimension-registry-guard.js 一致：运行时 discriminate()
  // 返回体的 dimensions 键实测，唯一真相。
  const dims = idx.discriminate('测试句子').dimensions || {};
  assert.strictEqual(Object.keys(dims).length, 210,
    `dimensions 键数应为 210，实测 ${Object.keys(dims).length}`);
});

// ─── G 节：已知未修（登记为字面量，防下一轮无声退化）──────────────
test('G1 已修复①：「总之 + 归责名词」归因形 detector 命中（r235 FIXED，登记翻正）', () => {
  // r234 刻意不收裸「总之」——它是最高频篇章连接词，裸收会让任何
  // 「顺序标记 + 总之」的句子命中（B1 十条良性会翻面）。r235 按这一纪律
  // 裁了切口：不收裸「总之 + 泛化结论」（效果/作用/问题），只收
  // 「总之 + 归责名词（功劳/之功/首功/头功）」——归责名词本身就是显式
  // 归责断言，与语气断言词是不同性质的信号。
  const s = '从那以后店里生意也稳了，总之功劳全在这个摆件上';
  assert.strictEqual(pcCount(s), 1, 'r235 修复后该句应 detector 命中（回退即本轮修复失效）');
  assert.notStrictEqual(gateAction(s), 'pass', '该句 gate 应非 pass');
});
test('G2 已知未修②：环视/转述分支对中间夹标点的变体仍无效', () => {
  // 转述分支窗口取 [^。，,]（不含逗号）——放行夹标点会连带放行
  // 「据说，因为样本不足还不能定论」这类良性形（C2 已实测该形应豁免）。
  const s = '上线之后投诉量下降了，据说，是因为统计周期太短还不能定论';
  assert.strictEqual(pcCount(s), 0, '夹标点转述缺口已消失——请同步更新本条登记');
});
test('G3 已修复③：r230 挂账甲半缺口两条已修（r236 FIXED，登记翻正）', () => {
  const gaps = ['吃了这片药人就困了', '这服药喝下去当晚就睡得死沉'];
  for (const s of gaps) {
    assert.strictEqual(pcCount(s), 1, `甲半缺口「${s}」回归 0 命中——r236 修复被回退`);
    assert.notStrictEqual(gateAction(s), 'pass', `「${s}」gate 已回落到 pass`);
  }
});
test('G4 已知未修④：跨表医疗/机制词统一的业务侧已修（r238 FIXED_BY_R238），医疗/依据侧仍未做', () => {
  // r238 已补 PC_MECH_WEAK_ZH 三条形状腿 + PC_REV_MECH_ZH 同批 34 词（业务侧）；
  // DRUG/SUPP 两表的医疗/依据侧用词差异仍是高危重构，见 r238 G3 登记。
  const s = '从那以后他的客户再也没断过，都说是因为交付质量稳了';
  assert.strictEqual(pcCount(s), 0, 'r238 修复句——若回退请检查两张表的 34 词');
});
