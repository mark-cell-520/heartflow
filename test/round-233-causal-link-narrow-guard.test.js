// test/round-233-causal-link-narrow-guard.test.js
// 第 233 轮守卫：PC_OTHERFACTOR_ZH 豁免表「因为」分支加归因链接负向环视
// （pseudo_causal 第①⑤⑨三支的他因信号豁免腿，「<断言词>是因为」不再是豁免）
//
// 缺口实测（scripts/tmp-233-probe.js / probe2.js / probe3.js / tmp-233-ab.js，轮末已删）：
//   分支级盘点（23699 条 test/ 中文 quoted 样本）：摘除「因为」整支在存量语料
//     只新增 1 条 detector 命中，且正是 r232 G1 登记的已知未修攻击句
//     「打那以后球队就再也没输过，显然是因为换了教练」；
//   但摘除后 16 条只依赖本腿的良性句 16/16 翻面成假阳性——所以不能整支删除，
//     必须按语义切。
//   红队真伪对照（20 攻击 / 16 良性 / 25 存量良性）：HEAD 攻击 detector 2/20、
//     良性 0/41；收窄后 20/20、良性仍 0/41。
//   A/B（HEAD worktree vs 当前树，23699 条样本）：gate.action 差异 0 条
//     （pass 17663 / verify 3082 / block 1475 / rewrite 1479 两侧逐项一致）；
//     detector 层 count 升 1、降 0。
//
// 根因：`因为` 同一个分支在中文里承载两种相反语义——
//   ① 他因信号（良性）：「上线之后投诉量下降了，因为客服排班做了调整」
//      ——「因为」在子句边界引出**别的**因素，正是本表想要的豁免形状；
//   ② 归因链接（攻击）：「打那以后球队就再也没输过，显然是因为换了教练」
//      ——「因为」紧跟归因断言词，是把时序先后**说成**因果的那一环；把它当
//      他因信号，等于让伪因果句自己的断言充当反驳自己的证据。
// 收窄形状：`(?<!(?:<断言词>)(?:是|地){0,2})因为`。
//
// 取向裁定（本轮裁；r227「即愈」/r228「即退烧」/r229「即获益」/r230「即困」/
// r231「仪式」/r232「裸也」之后的第七条）：**「因为」引出的他因判良性，
// 「<断言词>是因为」的归因链接不判**。
//
// 本测试锁定六件事：
//   ① 22 条攻击句三层命中（不只守 action）
//   ② 良性族零误伤（16 条只依赖「因为」腿 + 25 条存量良性）
//   ③ 结构性界线不判（统计谦辞 / 对冲谦辞 / 排除性否定归因 / 数字护栏）
//   ④ 四处变异守卫 + 还原校验（还原裸「因为」/ 摘「因为」整支 / 摘「同」支）
//   ⑤ 存量族不塌不涨（r224/r225/r226/r232 攻击与良性逐条复测）
//   ⑥ 源码常量收窄到位 + 其他分支未被动 + 维度数不变
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

// ─── A 节：三层命中 ─────────────────────────────────────────────────
// 主族：时序标记/顺序词 × 归因断言 × 「<断言词>是因为」归因链接。
// 刻意避开 STAT_CONTEXT_ZH / hasExclNegCausal / PC_HEDGE_ZH / PC_PROB_ZH /
// PC_NUMERIC_ZH / PC_MECH_WEAK_ZH 与 PC_OTHERFACTOR_ZH 其余全部分支
// （尤其单字「同」——含「同」的句子会被同分支兜住，测不出「因为」腿）。
const ATTACK = [
  '打那以后球队就再也没输过，显然是因为换了教练',
  '从那以后他的业绩再也没下滑过，显然是因为带了这块表',
  '上线新版本之后投诉也少了，可见是因为新版本解决了瓶颈',
  '换了这个头像之后咨询也变多了，看来是因为头像带来了好运',
  '调整座位之后他成绩也上来了，说明是因为座位风水显了灵',
  '自从戴了这个手串，他打牌再也没输过，显然是因为手串招了财',
  '改革之后员工的抱怨也听不到了，可见是因为改革立竿见影',
  '从那以后她再也没迟过到，说明是因为早起打卡起了作用',
  '贴了暖宝宝之后肚子也暖和了，看来是因为暖宝宝赶走了寒气',
  '降温之后感冒也少了，可见是因为降温改变了病毒的活性',
  '装修之后店里生意也稳了，显然是因为风水局起了作用',
  '用了新系统之后漏单也没有了，可见是因为新系统是唯一的变化',
  '自从换了床位之后他就再也没失眠过，显然是因为床位风水起了作用',
  '新流程上线之后，加班也少了，说明是因为新流程起了作用',
  '从那以后店里也再没出过岔子，显然是因为换了招牌的功劳',
  '自从改了签名之后他就再也没被拒过，肯定是签名带来的好运',
  '从那以后航班就再也没延误过，看来是因为摆件起了作用',
  '换了工位之后她的绩效也涨了，证明是因为工位朝向变了',
  '从那以后他的失眠也好了，显然是因为睡前仪式的功劳',
  '上了新系统之后客诉也降了，可见是因为新系统清理了瓶颈',
  // 「是/地」两字间插形：单可选组 `(?:是|地)?` 下这两形豁免恒真、收窄整段失效
  '从那以后航班就再也没延误过，显然地是因为摆件起了作用',
  '换了工位之后她的绩效也涨了，显然是地因为工位朝向变了',
];
test(`A1 归因链接族攻击句 detector 命中（${ATTACK.length} 条）`, () => {
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

// ─── B 节：良性族零误伤 ────────────────────────────────────────────
// B1：只依赖「因为」一条腿的良性他因句——本轮收窄刻意保留这一族豁免
const BENIGN_CAUSE = [
  '上线之后投诉量下降了，因为客服排班做了调整',
  '改版之后留存就下滑了，因为新手引导改动了',
  '从那以后日均订单量减少了，因为客服团队扩编了人手',
  '升级之后事故率降低了，因为值班表调整了',
  '换季之后退货率上升了，因为尺码标注有误',
  '从那以后客单价下滑了，因为优惠券发得多了',
  '上线之后崩溃率下降了，因为启动项裁剪了一批',
  '改价之后差评变少了，因为售后响应提速了',
  '从那以后复购率提高了，因为会员券改版了',
  '从那以后等待时长降低了，因为值班的人手增加了',
  '上线之后跳出率下降了，因为首屏加载提速了',
  '从那以后退货量减少了，因为包装加固了',
  // 形状变体：因为在句首 / 无逗号 / 断言词后接非 because 子句
  '因为客服排班做了调整，上线之后投诉量下降了',
  '上线之后投诉量下降了因为客服排班做了调整',
  '数据证明上线之后投诉量下降了，因为客服排班做了调整',
  '统计说明改版之后留存下滑了，因为新手引导改动了',
];
test(`B1 只依赖「因为」腿的良性他因句 detector 零命中（${BENIGN_CAUSE.length} 条）`, () => {
  const bad = BENIGN_CAUSE.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下良性句被误判：\n  ${bad.join('\n  ')}`);
});
// B2：存量良性（r232/r226/r225 已登记，靠机制词/对冲词/其他分支词兜住）
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
test(`B2 存量良性 detector 零命中（${BENIGN_LEGACY.length} 条）`, () => {
  const bad = BENIGN_LEGACY.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下存量良性被误判：\n  ${bad.join('\n  ')}`);
});
// B3：良性 gate 非 pass 集合与 HEAD 逐项一致。
// 纪律（承 r232 踩坑③）：gate 层断言只对全维度干净的句子用——上表里有 12 条
// 在 HEAD 就被 post_hoc 等维度判 rewrite/verify，属存量行为；本轮只要求
// detector 层零误伤 + gate 非 pass 集合不因本轮扩大。
const HEAD_GATE_NONPASS = new Set([
  '数据证明上线之后投诉量下降了，因为客服排班做了调整',
  '统计说明改版之后留存下滑了，因为新手引导改动了',
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
test(`B3 良性 gate 非 pass 集合与 HEAD 基线逐项一致（${HEAD_GATE_NONPASS.size} 条存量）`, () => {
  const all = BENIGN_CAUSE.concat(BENIGN_LEGACY);
  const cur = new Set(all.filter(s => gateAction(s) !== 'pass'));
  assert.deepStrictEqual([...cur].sort(), [...HEAD_GATE_NONPASS].sort(),
    '良性 gate 非 pass 集合与 HEAD 不一致——本轮引入了新的 gate 层误伤');
});

// ─── C 节：结构性界线 ──────────────────────────────────────────────
// 这四条同时含「因为」归因链接形状，但被函数头四条豁免（统计谦辞 / 对冲谦辞 /
// 排除性否定归因 / 数字护栏）拦在 detector 之前。gate 层有两条在 HEAD 就被
// post_hoc 判 verify（存量行为），故只断言 detector 零命中。
const BOUNDARY = [
  '从那以后订单量再也没涨过，但相关系数只有 0.2',
  '打那以后球队就再也没输过，显然是因为换了教练，也可能是赛程变轻松了',
  '控制时间趋势之后，相关关系仍然显著，说明关系不是由共同趋势造成的',
  '从那以后客单价从 45 涨到 68，显然是因为换了教练',
];
test(`C1 结构性界线 detector 零命中（${BOUNDARY.length} 条）`, () => {
  const bad = BOUNDARY.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下界线句被误判：\n  ${bad.join('\n  ')}`);
});
// C2：本轮裁定的边界——「看起来」在 PC_ATTRIB_ZH 里是「看来」的子串，两者
// 必须同判，否则同形攻击句只换一个副词就能绕过豁免收窄。该句判定为命中
// 是**有意**的取向，不是误伤（登记在此防下一轮无声退化）。
test('C2 边界登记：「看起来是因为」按归因链接判（与「看来是因为」同判）', () => {
  const s = '从那以后差评变少了，看起来是因为包装加固了';
  assert.strictEqual(pcCount(s), 1, '「看起来是因为」已不再判——若这是有意放宽，请同步更新本条登记');
});

// ─── D 节：变异守卫（复制 src/ 整棵树到临时目录再变异，绝不在原地改写 src/）──
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r233-' + tag + '-'));
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
const ANCHOR_OF = 'const PC_OTHERFACTOR_ZH = /';
// 本轮「因为」腿的完整字面（含负向环视），D1/D2 的变异锚点
const CAUSE_LEG = '|(?<!(?:显然|可见|说明|看来|看起来|证明|肯定|一定|所以|总之|这就是|这才是|直接决定|足见|足以证明)(?:是|地){0,2})因为';
function mutateOf(src, from, to) {
  const orig = fs.readFileSync(src, 'utf8');
  const line = orig.split('\n').find(l => l.includes(ANCHOR_OF));
  assert.ok(line, '找不到 PC_OTHERFACTOR_ZH 定义行');
  const mutatedLine = line.split(from).join(to);
  assert.notStrictEqual(mutatedLine, line, `变异未生效（${from} → ${to}）`);
  // 纪律：摘除 alternation 分支时必须连管道一起摘，否则留下空交替分支 `||`，
  // 正则会匹配空串、让整表恒真——那是 r231 记过的同款脆弱结构。
  assert.ok(!mutatedLine.includes('||'), '变异产生了空交替分支 `||`（必须连管道一起摘）');
  fs.writeFileSync(src, orig.replace(line, mutatedLine));
}

test('D1 变异守卫一：还原为裸「因为」后 22 条攻击句应回落到 2 条（收窄承重）', () => {
  const tmp = copySrc('revert');
  try {
    mutateOf(path.join(tmp, 'src', 'index.js'), CAUSE_LEG, '|因为');
    const n = countHitsIn(tmp, ATTACK);
    assert.strictEqual(n, 2, `还原为裸因为后攻击句命中应回落到 2，实测 ${n}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('D2 变异守卫二：摘掉「因为」整支后良性他因句应从 0 翻成 16/16（豁免承重）', () => {
  const tmp = copySrc('dropcause');
  try {
    mutateOf(path.join(tmp, 'src', 'index.js'), CAUSE_LEG, '');
    assert.strictEqual(countHitsIn(tmp, BENIGN_CAUSE), BENIGN_CAUSE.length,
      '摘掉因为分支后良性他因句未被误命中（说明该腿仍承重，本轮不能整支删除）');
    // 存量良性另靠「同/同步/被…挡/因为以外的对冲词」兜住，不受本变异影响
    assert.strictEqual(countHitsIn(tmp, BENIGN_LEGACY), 0,
      '摘掉因为分支后存量良性被连带误命中');
    // 攻击句不依赖本腿即命中（被摘后仍全命中）
    assert.strictEqual(countHitsIn(tmp, ATTACK), ATTACK.length, '摘掉因为分支后攻击句有塌陷');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('D3 变异守卫三：摘掉「同」支后存量共同趋势良性应翻成命中（本轮只动一处）', () => {
  const tmp = copySrc('droptong');
  try {
    mutateOf(path.join(tmp, 'src', 'index.js'), '|机制|同/;', '|机制/;');
    const victims = [
      '升级之后事故率降低了，团队认为多因素共同作用',
      '从那以后客服满意度下降了，团队认为多因素共同作用',
    ];
    assert.strictEqual(countHitsIn(tmp, victims), victims.length,
      '摘掉同分支后共同趋势良性句未被误命中（说明该分支仍承重）');
    assert.strictEqual(countHitsIn(tmp, ATTACK), ATTACK.length, '摘掉同分支后攻击句有塌陷');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('D4 变异守卫四：未变异副本还原校验', () => {
  const tmp = copySrc('pristine');
  try {
    assert.strictEqual(countHitsIn(tmp, ATTACK), ATTACK.length, '未变异副本攻击句未全命中');
    assert.strictEqual(countHitsIn(tmp, BENIGN_CAUSE.concat(BENIGN_LEGACY)), 0, '未变异副本良性句被误命中');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── E 节：存量族不塌不涨 ─────────────────────────────────────────
const LEGACY_ATTACK = [
  // r225/r224 存量攻击：裸「也」族（r232 已修，本轮不得回退）
  '从那天起他就再也没输过，肯定是换了名字带来的',
  '从那天起她再也没迟到过，说明是早起打卡起了作用',
  '布鲁诺为日心说被烧死在鲜花广场，两千年前苏格拉底也被定罪——今天论坛封杀我的帖子，这本身就是我是对的证明。',
  // r226 登记的「反豁免」族：单因归责在场时机制名词不豁免
  '我们加了缓存之后延迟降了，说明缓存是唯一原因',
];
test('E1 存量攻击句不塌（逐条 detector 或 gate 非 pass）', () => {
  const bad = LEGACY_ATTACK.filter(s => pcCount(s) === 0 && gateAction(s) === 'pass');
  assert.deepStrictEqual(bad, [], `以下存量攻击句 detector 与 gate 双漏：\n  ${bad.join('\n  ')}`);
});
test('E2 存量良性不涨（r232/r226/r225 良性族 detector 零命中）', () => {
  const bad = BENIGN_LEGACY.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下存量良性被误判：\n  ${bad.join('\n  ')}`);
});

// ─── F 节：源码常量与结构 ─────────────────────────────────────────
test('F1 PC_OTHERFACTOR_ZH 的「因为」腿已加负向环视，其余分支逐字未动', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const line = src.split('\n').find(l => l.includes(ANCHOR_OF));
  assert.ok(line, '找不到 PC_OTHERFACTOR_ZH 定义行');
  assert.ok(line.includes(CAUSE_LEG), '「因为」腿未加负向环视');
  assert.ok(!/\|因为\|/.test(line), '表中不应再有裸「因为」分支');
  // 其余 10 个分支一个不许少、一个不许改（本轮只动这一处）
  for (const w of ['但', '不过', '可是', '也会', '同步', '另外', '提测', '机制', '同']) {
    assert.ok(line.includes(w), `分支 ${w} 丢失`);
  }
  assert.ok(line.includes('被[^。]{0,8}(?:挡|省|发现|减少|降低|抵消)'), '被…挡 分支丢失');
});
test('F2 环视词表与 PC_ATTRIB_ZH 同源且含「看起来」', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const line = src.split('\n').find(l => l.includes(ANCHOR_OF));
  for (const w of ['显然', '可见', '说明', '看来', '看起来', '证明', '肯定', '一定', '所以', '总之']) {
    assert.ok(line.includes(w), `环视词表缺 ${w}`);
  }
  // 「看来」必须是「看起来」的子串关系，否则同形句只换副词即可绕过
  assert.ok(line.indexOf('看起来') > line.indexOf('看来'), '「看起来」应排在「看来」之后（同族收全）');
  assert.ok(line.includes('(?:是|地){0,2}'), '可选组应为 {0,2}（覆盖「显然地是因为」两字间插形）');
});
test('F3 causalOverclaimZh 仍由 checkPseudoCausal 接线调用（豁免表不被孤立）', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  assert.ok(/PC_OTHERFACTOR_ZH\.test\(text\)/.test(src), '豁免表调用点丢失');
  assert.ok(src.includes('function checkPseudoCausal'), 'checkPseudoCausal 函数丢失');
});

// ─── G 节：已知未修（登记为字面量，防下一轮无声退化）──────────────
test('G1 已知未修①：「总之」不在 PC_ATTRIB_ZH，同形句仍漏判', () => {
  const s = '上了新系统之后客诉也降了，总之是因为新系统清理了瓶颈';
  assert.strictEqual(pcCount(s), 0, '「总之」缺口已消失——请同步更新本条登记');
  assert.strictEqual(gateAction(s), 'pass', '该句 gate 已是 pass 之外的值');
});
test('G2 已知未修②：「旺财」不在 PC_ATTRIB_ZH 的获益词表，同形句仍漏判', () => {
  const s = '自从改了签名之后他就再也没被拒过，肯定是因为签名旺了财';
  assert.strictEqual(pcCount(s), 0, '「旺财」缺口已消失——请同步更新本条登记');
});
test('G3 已知未修③：转述归责「都说是」缺归因断言词，仍漏判（r232 结转）', () => {
  const s = '从那以后店里也再没出过岔子，都说是换了招牌的功劳';
  assert.strictEqual(pcCount(s), 0, '「都说是」缺口已消失——请同步更新本条登记');
  assert.notStrictEqual(gateAction(s), 'pass', '该句 gate 不应是 pass（依赖其他维度兜底）');
});
test('G4 已知未修④：r230 挂账甲半缺口两条仍未修（HEAD 同为 0/pass，存量非本轮引入）', () => {
  const gaps = ['吃了这片药人就困了', '这服药喝下去当晚就睡得死沉'];
  for (const s of gaps) {
    assert.strictEqual(pcCount(s), 0, `甲半缺口「${s}」已被修复——请同步更新本条登记并移出候选池`);
    assert.strictEqual(gateAction(s), 'pass', `「${s}」gate 已非 pass`);
  }
});
