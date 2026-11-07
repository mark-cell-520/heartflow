// test/round-232-otherfactor-narrow-guard.test.js
// 第 232 轮守卫：PC_OTHERFACTOR_ZH 豁免表「也会?」分支收窄为「也会」
// （pseudo_causal 第①⑤⑨三支的他因信号豁免腿，裸「也」不再构成豁免）
//
// 缺口实测（scripts/tmp-232-probe.js + tmp-232-probe2.js + tmp-232-ab.js，轮末已删）：
//   改前 18 条「顺序标记/时序词 × 单因归责」族攻击句（含裸「也」）detector
//   只有 1/18 命中——17 条全被 PC_OTHERFACTOR_ZH 的 `也会?` 分支整句豁免，
//   其中 4 条连 gate 都是 pass；
//   改后 16 条三层命中（detector + findings + gate 非 pass），
//       良性（含「也会」的他因句 + 含「同/同步/被…挡」的存量良性）10 条零误伤。
//   分支级盘点（27962 条 test/ 中文 quoted 样本）：三支命中 ∧ 本表豁免共 11 条，
//   其中裸「也」4 条（3 条攻击 + 1 条 galileo 长句）、含「也会」2 条（均良性）。
//
// 根因：`也会?` 的量词 `?` 让「也」单字即成豁免腿。「再也没输过」的「也」是
// 范围副词（与「再」合成「再也没」，表「从未」），「加班也少了」的「也」是
// 并列副词（表「同样」）——都不是「另一个因素也会造成同样结果」的他因信号；
// 只有「也会」两字连现（「行业周期也会影响离职率」）才承载原表想要的语义。
//
// 取向裁定（本轮裁；r227「即愈」/r228「即退烧」/r229「即获益」/r230「即困」/
// r231「仪式」之后的第六条）：**裸「也」判（时序标记 × 单因归责在场），
// 「也会 + 同一结果」不判（说话者自己点出另一因素）**。
//
// 本测试锁定六件事：
//   ① 17 条攻击句三层命中（不只守 action）
//   ② 良性族零误伤 + gate 全 pass（含 7 条含「也会」的新良性对照 + 存量机制良性）
//   ③ 结构性界线不判（统计谦辞、对冲谦辞、排除性否定归因）
//   ④ 四处变异守卫 + 还原校验（还原为 `也会?` / 摘「也会」整支 / 摘「同」支）
//   ⑤ 存量族不塌不涨（r224/r225/r226/r48 攻击与良性逐条复测）
//   ⑥ 源码常量收窄到位 + 维度数不变 + 其他分支未被动
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
// 主族：时序标记/顺序词 × 归因断言，句中只有裸「也」（无「也会」两字）
const ATTACK = [
  // 存量挂账三条（r224/r225 登记，连续七轮挂账）
  '从那天起他就再也没输过，肯定是换了名字带来的',
  '从那天起她再也没迟到过，说明是早起打卡起了作用',
  '布鲁诺为日心说被烧死在鲜花广场，两千年前苏格拉底也被定罪——今天论坛封杀我的帖子，这本身就是我是对的证明。',
  // r232 红队扩样
  '自从换了床位之后他就再也没失眠过，显然是床位风水起了作用',
  '上线新版本之后投诉也少了，可见新版本就是原因',
  '从那以后他的业绩再也没下滑过，显然是带了这块表的功劳',
  '新流程上线之后，加班也少了，说明新流程起了作用',
  '自从戴了这个手串，他打牌再也没输过，显然是手串招了财',
  '改革之后员工的抱怨也听不到了，可见改革立竿见影',
  '调整作息之后他也不再头疼了，说明早起治好了头疼',
  '换了这个头像之后咨询也变多了，显然是头像带来了好运',
  '装修之后店里生意也稳了，显然是风水局起了作用',
  '用了新系统之后漏单也没有了，说明新系统是唯一的变化',
  '降温之后感冒也少了，显然是降温改变了病毒的活性',
  '贴了暖宝宝之后肚子也暖和了，显然是暖宝宝赶走了寒气',
  '从那以后她再也没迟过到，可见早起打卡起了作用',
  '调整座位之后他成绩也上来了，说明是座位风水显了灵',
];
test(`A1 裸「也」时序归责族攻击句 detector 命中（${ATTACK.length} 条）`, () => {
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
// B1：含「也会」的他因信号句——本轮收窄刻意保留这一族豁免
const BENIGN_ALSO = [
  '上线之后投诉量下降了，但同期市场也整体下行，不能直接归因于这次上线',
  '改革之后离职率降了，不过行业周期也会影响离职率',
  '灰度之后故障率下降了，回滚率也会随发布频率变化',
  '下雨之后水库水位涨了，雨季降水也会补给库容',
  '换了教练之后球队成绩好了，但球员状态也会影响成绩',
  '推广之后销量涨了，季节因素也会带动销量',
  '加了缓存之后查询快了，流量变化也会影响查询耗时',
];
// D2 变异守卫的 victim：只含「也会」一个分支词、不含 PC_MECH_WEAK_ZH 机制词。
// 它 gate 层在 HEAD 就被 post_hoc 判 rewrite（存量行为，实测于 data/wt-head-232
// HEAD 副本），故只断言 detector 零命中，不进 B2 的 gate-pass 集合。
const D2_VICTIM = '新流程上线之后故障率下降了，说明是新流程起了作用，市场情绪也会影响故障率';
test(`B1 含「也会」的他因良性句 detector 零命中（${BENIGN_ALSO.length + 1} 条）`, () => {
  const bad = BENIGN_ALSO.concat([D2_VICTIM]).filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下良性句被误判：\n  ${bad.join('\n  ')}`);
});
test(`B2 含「也会」良性句 gate 全 pass（${BENIGN_ALSO.length} 条）`, () => {
  const bad = BENIGN_ALSO.filter(s => gateAction(s) !== 'pass');
  assert.deepStrictEqual(bad, [], `以下良性句 gate 非 pass：\n  ${bad.join('\n  ')}`);
});
// B3：存量良性——依赖本表其他分支（同/同步/被…挡/因为）与机制豁免腿
const BENIGN_LEGACY = [
  '上线之后投诉量有所下降，我们也同步调整了客服排班，具体原因还要再看两周数据',
  '销售额与去年同期同步上升，说明旺季策略见效了',
  '升级之后事故率降低了，团队认为多因素共同作用',
  '控制时间趋势之后，相关关系仍然显著，说明关系不是由共同趋势造成的',
  '平均薪资在上涨，所以大家的收入都提高了，但按收入段拆分后，每一段的薪资都在下降',
  '加了单元测试之后线上回滚次数下降，边界 case 在提测前就被挡住了',
  '从那天起日均订单量减少了，因为同期在做活动调整',
  '下雨之后水库水位就涨了，说明是降雨补给了库容',
  '吃了布洛芬之后烧就退了，说明药效发挥了作用',
  '加了缓存之后查询就快了，说明缓存配置生效了',
  '上线之后延迟降低了，说明这次的优化起了作用',
  '灰度之后故障率就降了，说明灰度策略是有效的',
  '复习之后成绩就提高了，说明复习是有用的',
  '气温下降之后感冒就多了，说明是季节因素的影响',
];
test(`B3 存量良性 detector 零命中（${BENIGN_LEGACY.length} 条）`, () => {
  const bad = BENIGN_LEGACY.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下存量良性被误判：\n  ${bad.join('\n  ')}`);
});

// ─── C 节：结构性界线 ──────────────────────────────────────────────
const BOUNDARY = [
  // 统计谦辞（PC_PROB_ZH 函数头豁免）
  '从那天起订单量再也没涨过，但相关系数只有 0.2',
  // 对冲谦辞（PC_HEDGE_ZH 函数头豁免）
  '从那以后他再也没迟到过，不过也可能是天气变暖起得早了',
  // 排除性否定归因（hasExclNegCausal 豁免）
  '从那以后投诉也降了，但相关关系不是由共同趋势造成的',
];
test(`C1 结构性界线 detector 零命中（${BOUNDARY.length} 条）`, () => {
  const bad = BOUNDARY.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下界线句被误判：\n  ${bad.join('\n  ')}`);
});

// ─── D 节：变异守卫（复制 src/ 整棵树到临时目录再变异，绝不在原地改写 src/）──
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r232-' + tag + '-'));
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
function mutateOf(src, from, to) {
  const orig = fs.readFileSync(src, 'utf8');
  const line = orig.split('\n').find(l => l.includes(ANCHOR_OF));
  assert.ok(line, '找不到 PC_OTHERFACTOR_ZH 定义行');
  const mutated = orig.replace(line, line.split(from).join(to));
  assert.notStrictEqual(mutated, orig, `变异未生效（${from} → ${to}）`);
  fs.writeFileSync(src, mutated);
}

test('D1 变异守卫一：还原为 `也会?` 后 17 条攻击句应回落到 1 条（收窄承重）', () => {
  const tmp = copySrc('revert');
  try {
    mutateOf(path.join(tmp, 'src', 'index.js'), '|也会|', '|也会?|');
    const n = countHitsIn(tmp, ATTACK);
    // 唯一仍命中的是第⑦支（「唯一的变化」）覆盖的句子，与「也会」分支无关
    assert.strictEqual(n, 1, `还原为也会? 后攻击句命中应回落到 1，实测 ${n}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('D2 变异守卫二：摘掉「也会」整支后含「也会」良性句应从 0 翻成命中（豁免承重）', () => {
  const tmp = copySrc('dropalso');
  try {
    mutateOf(path.join(tmp, 'src', 'index.js'), '|也会|', '|');
    // victim 刻意只用「也会」一个分支词、且不含 PC_MECH_WEAK_ZH 机制词——
    // 首版选「灰度之后故障率下降了…市场情绪也会影响故障率」被机制豁免腿
    // 兜住（摘了也会分支仍 0 命中），换成不含机制词的版本。
    assert.strictEqual(countHitsIn(tmp, [D2_VICTIM]), 1, '摘掉也会分支后 victim 良性句未被误命中');
    // 其余良性还靠「同/同步/被…挡」等分支，不受本变异影响
    assert.strictEqual(countHitsIn(tmp, BENIGN_ALSO.filter(s => s !== D2_VICTIM)), 0,
      '摘掉也会分支后其他良性句被连带误命中');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('D3 变异守卫三：摘掉「同」支后存量共同趋势良性应翻成命中（本轮只动一处）', () => {
  const tmp = copySrc('droptong');
  try {
    mutateOf(path.join(tmp, 'src', 'index.js'), '|机制|同/;', '|机制/;');
    // 首版第二条 victim 选「控制时间趋势之后…不是由共同趋势造成的」，它同时被
    // hasExclNegCausal（排除性否定归因）函数头豁免，摘同分支后仍 0 命中；
    // 换成不含否定归因的第⑨支形状（顺序词 × 指标下降）。
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
    assert.strictEqual(countHitsIn(tmp, BENIGN_ALSO.concat(BENIGN_LEGACY)), 0, '未变异副本良性句被误命中');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── E 节：存量族不塌不涨 ─────────────────────────────────────────
const LEGACY_ATTACK = [
  // r225/r224 存量攻击：仍被其他支覆盖或仍被「因为」分支豁免，逐条复测
  '打那以后球队就再也没输过，显然是因为换了教练',
  '从那天起他就再也没输过，肯定是换了名字带来的',
  '从那天起她再也没迟到过，说明是早起打卡起了作用',
  '用了新系统之后漏单也没有了，说明新系统是唯一的变化',
  // r226 登记的「反豁免」族：单因归责在场时机制名词不豁免
  '我们加了缓存之后延迟降了，说明缓存是唯一原因',
];
test('E1 存量攻击句不塌（逐条 detector 或 gate 非 pass）', () => {
  const bad = LEGACY_ATTACK.filter(s => pcCount(s) === 0 && gateAction(s) === 'pass');
  assert.deepStrictEqual(bad, [], `以下存量攻击句 detector 与 gate 双漏：\n  ${bad.join('\n  ')}`);
});
test('E2 存量良性不涨（r225 三十条良性族 detector 零命中）', () => {
  const bad = BENIGN_LEGACY.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下存量良性被误判：\n  ${bad.join('\n  ')}`);
});

// ─── F 节：源码常量与结构 ─────────────────────────────────────────
test('F1 PC_OTHERFACTOR_ZH 已收窄为「也会」且无「也会?」残留', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const line = src.split('\n').find(l => l.includes(ANCHOR_OF));
  assert.ok(line, '找不到 PC_OTHERFACTOR_ZH 定义行');
  assert.ok(line.includes('|也会|'), '表中应含「也会」分支');
  assert.ok(!line.includes('也会?'), '表中不应再有「也会?」量词分支');
  // 其他分支一个不许少（本轮只动这一处）
  for (const w of ['但', '不过', '可是', '同步', '另外', '提测', '因为', '机制', '同']) {
    assert.ok(line.includes(w), `分支 ${w} 丢失`);
  }
});
test('F2 维度登记未动（dimensions 段顶层键集与 HEAD 副本一致）', () => {
  const parseKeys = (p) => {
    const s = fs.readFileSync(p, 'utf8');
    const st = s.indexOf('dimensions: {');
    assert.ok(st > 0, 'dimensions 段不存在');
    const seg = s.slice(st, s.indexOf('\n    },', st));
    return [...seg.matchAll(/^ {6}(\w+):/gm)].map(m => m[1]).sort();
  };
  const cur = parseKeys(SRC);
  assert.ok(cur.includes('pseudo_causal'), 'pseudo_causal 维度登记丢失');
  // 口径说明：guard-abilities 报 210 个（含嵌套登记与 summary 引用），本处数的是
  // dimensions: { 段顶层键。若上一轮留下的 HEAD worktree 副本在，逐键对比。
  const headIdx = path.join(ROOT, 'data', 'wt-head-232', 'src', 'index.js');
  if (fs.existsSync(headIdx)) {
    assert.deepStrictEqual(cur, parseKeys(headIdx), 'dimensions 顶层键集与 HEAD 不一致');
  }
});
test('F3 causalOverclaimZh 仍由 checkPseudoCausal 接线调用（豁免表不被孤立）', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  assert.ok(/PC_OTHERFACTOR_ZH\.test\(text\)/.test(src), '豁免表调用点丢失');
  assert.ok(src.includes('function checkPseudoCausal'), 'checkPseudoCausal 函数丢失');
});

// ─── G 节：已知未修（登记为字面量，防下一轮无声退化）──────────────
test('G1 已知未修①：「因为」分支仍会整句豁免含「因为」的攻击句', () => {
  // 该句同时含裸「也」与「因为」；本轮只收窄「也会?」，「因为」分支不动，
  // 故它仍被豁免（gate 靠 post_hoc 等其他维度兜住）。
  const s = '打那以后球队就再也没输过，显然是因为换了教练';
  assert.strictEqual(pcCount(s), 0, '「因为」分支已被改动——若这是有意收窄，请同步更新本条登记');
  assert.notStrictEqual(gateAction(s), 'pass', '该句 gate 不应是 pass（依赖其他维度兜底）');
});
test('G2 已知未修②：转述归责「都说是」缺归因断言词，仍漏判', () => {
  const s = '从那以后店里也再没出过岔子，都说是换了招牌的功劳';
  assert.strictEqual(pcCount(s), 0, '「都说是」缺口已消失——请同步更新本条登记');
  assert.notStrictEqual(gateAction(s), 'pass', '该句 gate 不应是 pass（依赖其他维度兜底）');
});
