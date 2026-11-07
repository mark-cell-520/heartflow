// test/round-235-concluding-word-attribution.test.js
// 第 235 轮守卫：PC_ATTRIB_ZH 判据层补「收束词归责」族两个分支（pseudo_causal
// 第①支「顺序标记 × 归因断言」的归因断言词表第二次扩面）
//
// 缺口实测（scripts/tmp-235-probe.js + scripts/tmp-235-ab.js，HEAD 副本
// data/wt-head-235，轮末已删）：中文口语里最高频的归责遁形不是「显然/可见」
// 这类书面断言词，而是**篇章收束词**——「说到底/归根结底/归根到底/说穿了/总之」。
// 16 条同族攻击句 HEAD `checkPseudoCausal().count` **全 0**，其中 12 条连 gate
// 都是 pass：
//   「从那以后店里生意也稳了，总之功劳全在这个摆件上」
//   「打那以后球队就再也没输过，说到底是因为换了教练」
// 缺口单边在召回侧：形状本身（顺序标记 × 单因归责）早已被第①支覆盖，漏的是
// 断言词表里没有「收束词 + 归责」这一整个族。
//
// 取向刀（本轮裁；r227「即愈」/r228「即退烧」/r229「即获益」/r230「即困」/
// r231「仪式」/r232「裸也」/r233「因为」/r234「断言词+归因链接」之后的第九条）：
// **收束词 + 归责名词/显式归因链接判，收束词 + 泛化结论不判**。两个新分支：
//   ① 显式归因链接臂 `(?:说到底|归根结底|归根到底|说穿了)(?:是)?(?:因为|由于)`
//      ——与 r234「总之(?:是)?(?:因为|由于)」同轴，收束词 1→4（「总之」那一臂
//      已由 r234 补过，本轮既有分支逐字不改）；
//   ② 归责名词臂 `(?:总之|说到底|归根结底|归根到底|说穿了)[^。，,]{0,12}
//      (?:功劳|之功|首功|头功)`——本轮新轴：归责名词本身就是显式归责断言，
//      不需要「因为」在场。三点理由：
//      - 「功劳/之功/首功/头功」的语义就是把结果判给某个主体，与「显然/可见」
//        这类语气断言词是不同性质的信号（r234 裁定裸断言词不判，不适用于此）；
//      - 泛化结论词刻意**不收**：「试了三天，总之没什么效果」「说到底还是执行的
//        问题」是结论陈述不是单因归责（16 条良性对照实测，收「效果/作用/问题」
//        会让其中 4 条翻面）；
//      - 窗口取 `[^。，,]{0,12}`（不含逗号）——归责断言必须与收束词同子句，
//        「归根结底，由于时间不够只能砍需求」这类收束词后接别的子句的良性形
//        刻意不判（r233/r234 同款同子句纪律）。
// 纪律（承 r233/r234）：四个新收束词必须同步进 PC_OTHERFACTOR_ZH 的「因为」
// 负向环视词表，否则「说到底是因为换了教练」会被因为分支当他因信号整句豁免、
// 判据层新分支恒不承重。
//
// 本测试锁定七件事：
//   ① 16 条攻击句三层命中（detector / findings / gate）
//   ② 良性族零误伤（16 条新增良性 + 25 条存量良性 + gate 非 pass 集合与 HEAD 一致）
//   ③ 结构性界线不判（逗号变体 / 无顺序标记 / 泛化结论 / 对冲 / 排除性否定 / 数字护栏）
//   ④ 四处变异守卫 + 还原校验（复制 src/ 整棵树到临时目录再变异）
//   ⑤ 存量族不塌不涨（r234/r233/r232/r226/r225/r231 攻击与良性逐条复测）
//   ⑥ 源码常量两分支到位 + 豁免层环视词表同源 + 既有分支一个没少 + 维度数 210
//   ⑦ 四条已知未修登记（G1/G2/G3/G4，防无声退化）
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

// ─── A 节：16 条攻击句三层命中 ─────────────────────────────────────
// A 族：收束词 + 归责名词（功劳/之功/首功/头功）——本轮新轴（10 条）
const ATTACK_NOUN = [
  '从那以后店里生意也稳了，总之功劳全在这个摆件上',
  '自从换了新教练，球队成绩就上去了，说到底还是教练的功劳',
  '打那以后身体好起来了，归根结底是这套养生操的功劳',
  '从那以后业绩翻了一倍，归根到底是团队之功',
  '从那以后宿舍再没丢过东西，总之是宿管阿姨之功',
  '换了头像之后他就再也没输过，说到底全是头像之功',
  '从那以后孩子成绩上来了，归根结底是这套教辅的功劳',
  '自从供了这个财神，店里就再没亏过，说到底是财神爷之功',
  '从那以后航班就再也没延误过，归根结底是调度之功',
  '自从戴上这个手串，他就再也没输过，说到底首功全靠这个手串',
  '从那以后宿舍再没丢过东西，说到底头功是宿管阿姨的',
];
// B 族：收束词 + 显式归因链接（因为/由于）——与 r234「总之」族同轴扩词（4 条）
const ATTACK_LINK = [
  '打那以后球队就再也没输过，说到底是因为换了教练',
  '从那以后店里生意就好了，归根结底是因为摆件旺财',
  '自从换了这个头像他就再也没输过，说穿了是因为头像吉利',
  '从那以后客户再没投诉过，归根到底是因为调度改了',
];
const ATTACK = ATTACK_NOUN.concat(ATTACK_LINK);

test(`A1 攻击句 detector 命中（${ATTACK.length}/${ATTACK.length}，HEAD 实测 0/16）`, () => {
  const bad = ATTACK.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], `以下攻击句 detector 漏判：\n  ${bad.join('\n  ')}`);
});
test('A2 攻击句 findings 含 pseudo_causal（16/16）', () => {
  const bad = ATTACK.filter(s => !hasDim(s, 'pseudo_causal'));
  assert.deepStrictEqual(bad, [], `以下攻击句 findings 缺 pseudo_causal：\n  ${bad.join('\n  ')}`);
});
test('A3 攻击句 gate 非 pass（16/16，HEAD 实测 12 条 gate=pass）', () => {
  const bad = ATTACK.filter(s => gateAction(s) === 'pass');
  assert.deepStrictEqual(bad, [], `以下攻击句 gate 仍 pass：\n  ${bad.join('\n  ')}`);
});

// ─── B 节：良性族零误伤 ────────────────────────────────────────────
// 16 条新增良性：裸收束词连接词 / 泛化结论 / 否定归属 / 转述 + 另起子句
const BENIGN_NEW = [
  '上线之后我们继续观察了三天，总之还要再等两周数据',
  '总之，先按原计划推进',
  '会议开了两个小时，总之问题还没解决',
  '试了三天，总之没什么效果',
  '这个方案运行了一个月，总之比之前稳定一些',
  '试了新工具两周，总之效率高了一些',
  '他坚持锻炼了半年，总之身体好多了',
  '经过三轮测试，总之系统达标了',
  '从那天以后我们每天复盘，总之养成了习惯',
  '总之功劳是大家的，不能算我一个人头上',
  '总之，功劳是团队的，问题是个别人的',
  '说到底，因为成本超了我们才换的方案',
  '归根结底，由于时间不够只能砍需求',
  '试了三天，说到底没什么效果',
  '这个月复盘下来，说到底还是执行的问题',
  '功劳是大家的，不能算我一个人头上',
];
// 25 条存量良性（r234 测试 BENIGN_LEGACY 原样搬来，本轮不得涨）
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
const ALL_BENIGN = BENIGN_NEW.concat(BENIGN_LEGACY);

test(`B1 新增良性 detector 零命中（${BENIGN_NEW.length} 条）`, () => {
  const bad = BENIGN_NEW.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下新增良性被误判：\n  ${bad.join('\n  ')}`);
});
test(`B2 存量良性 detector 零命中（${BENIGN_LEGACY.length} 条）`, () => {
  const bad = BENIGN_LEGACY.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下存量良性被误判：\n  ${bad.join('\n  ')}`);
});
// B3：良性 gate 非 pass 集合与 HEAD 逐项一致（A/B 26187 条样本 gate.action 只差
// 1 条且正是攻击句「…总之功劳全在这个摆件上」，见 scripts/tmp-235-ab.js；本清单
// 13 条已用 HEAD 副本 data/wt-head-235 逐条复核同为非 pass）。10 条 rewrite 是
// r226 机制护栏句的存量判定（其他维度），3 条 verify 是 confidence/vagueness 一类
// 的存量判定，都不是本轮引入。
const PRE_EXISTING_NONPASS = [
  '试了三天，总之没什么效果',
  '试了新工具两周，总之效率高了一些',
  '试了三天，说到底没什么效果',
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
];
test('B3 良性 gate 非 pass 集合与 HEAD 一致（3 条存量，零新增）', () => {
  const nonpass = ALL_BENIGN.filter(s => gateAction(s) !== 'pass');
  const extra = nonpass.filter(s => !PRE_EXISTING_NONPASS.includes(s));
  assert.deepStrictEqual(extra, [], `以下良性 gate 非 pass 是新增翻面：\n  ${extra.join('\n  ')}`);
  const missing = PRE_EXISTING_NONPASS.filter(s => gateAction(s) === 'pass');
  assert.deepStrictEqual(missing, [], `以下存量非 pass 良性变成 pass（集合与 HEAD 不一致）：\n  ${missing.join('\n  ')}`);
});

// ─── C 节：结构性界线 ──────────────────────────────────────────────
// C1：本轮裁的刀——收束词 + 泛化结论词（效果/作用/问题/稳定）不判。
// 根因：「试了三天，总之没什么效果」「说到底还是执行的问题」是结论陈述不是
// 单因归责；收「效果/作用/问题」这 4 条会翻面（轮初探针实测）。
const BOUNDARY_GENERIC = [
  '试了三天，总之没什么效果',
  '试了新工具两周，总之效率高了一些',
  '这个月复盘下来，说到底还是执行的问题',
  '这个方案运行了一个月，总之比之前稳定一些',
];
test(`C1 泛化结论臂不判：收束词 + 效果/效率/问题/稳定 detector 零命中（${BOUNDARY_GENERIC.length} 条）`, () => {
  const bad = BOUNDARY_GENERIC.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下界线句被误判：\n  ${bad.join('\n  ')}`);
});
// C2：同子句纪律——收束词与归责名词/归因链接之间夹标点（另起子句）不判。
// 与 r234 G2 登记同源（「据说，是因为…」不判），放行夹标点会连带放行
// 「说到底，因为成本超了…」这类良性形。
// [v6.8.165 第 237 轮] r237 放行夹逗号，原界线集前两条（「说到底，是因为」
// 「归根结底，功劳是…」）正是本轮修的攻击句，按 r226/r227/r233 纪律移出界线集、
// 翻成 G1 的 FIXED_BY_R237 正向断言；保留的两条仍不判（无顺序标记，两腿缺一）。
const BOUNDARY_COMMA = [
  '说到底，因为成本超了我们才换的方案',
  '归根结底，由于时间不够只能砍需求',
];
test(`C2 同子句纪律：收束词与归责名词夹逗号不判（${BOUNDARY_COMMA.length} 条）`, () => {
  const bad = BOUNDARY_COMMA.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下界线句被误判：\n  ${bad.join('\n  ')}`);
});
// C3：无顺序标记的收束词归责句不判——第①支判据形状是「顺序标记 × 归因断言」，
// 单有归责名词（「说到底还是教练的功劳」）是普通结论句，不是时序归责。
const BOUNDARY_NOSEQ = [
  '说到底还是教练的功劳',
  '会议开了两个小时，说到底功劳是大家的',
  '功劳是大家的，不能算我一个人头上',
  '说到底功劳全在这个摆件上',
];
test(`C3 无顺序标记不判：第①支两腿缺一不命中（${BOUNDARY_NOSEQ.length} 条）`, () => {
  const bad = BOUNDARY_NOSEQ.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下界线句被误判：\n  ${bad.join('\n  ')}`);
});
// C4：函数头三道豁免（对冲谦辞 / 排除性否定归因 / 数字护栏）对新族同样生效。
const BOUNDARY_EXEMPT = [
  '自从换了这个教练，球队就再也没输过，说到底是因为换了教练，也可能是赛程变轻松了',  // 对冲谦辞
  '控制时间趋势之后，相关关系仍然显著，说到底是因为效应不是由共同趋势造成的',        // 排除性否定归因
  '从那以后客单价从 45 涨到 68，说到底是因为换了教练',                                // 数字护栏
  '从那以后店里生意也稳了，总之功劳全在这个摆件上，但样本太小不好归因',              // 对冲谦辞
];
test(`C4 函数头豁免对新族生效：对冲/排除性否定/数字护栏（${BOUNDARY_EXEMPT.length} 条）`, () => {
  const bad = BOUNDARY_EXEMPT.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下界线句被误判：\n  ${bad.join('\n  ')}`);
});

// ─── D 节：变异守卫（复制 src/ 整棵树到临时目录再变异，绝不在原地改写 src/）──
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r235-' + tag + '-'));
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
const ANCHOR_OF2 = 'const PC_OTHERFACTOR_ZH = /';
function mutateLine(srcFile, anchor, from, to) {
  const orig = fs.readFileSync(srcFile, 'utf8');
  const line = orig.split('\n').find(l => l.includes(anchor));
  assert.ok(line, '找不到定义行: ' + anchor);
  const mutatedLine = line.split(from).join(to);
  assert.notStrictEqual(mutatedLine, line, `变异未生效（${from} → ${to}）`);
  // 纪律：摘除 alternation 分支时必须连管道一起摘，否则留下空交替分支 `||`，
  // 正则会匹配空串、让整表恒真——r231 记过、r233 D2 撞上的同款脆弱结构。
  assert.ok(!mutatedLine.includes('||'), '变异产生了空交替分支 `||`（必须连管道一起摘）');
  fs.writeFileSync(srcFile, orig.replace(line, mutatedLine));
}

test('D1 变异守卫一：摘掉显式归因链接臂后 B 族 4 条回落到 0（判据层承重）', () => {
  const tmp = copySrc('droplink');
  try {
    mutateLine(path.join(tmp, 'src', 'index.js'), ANCHOR_OF,
      '|(?:说到底|归根结底|归根到底|说穿了)[，,]?(?:是)?(?:因为|由于)', '');
    assert.strictEqual(countHitsIn(tmp, ATTACK_LINK), 0,
      '摘掉显式归因链接臂后 B 族未全部回落（说明该臂不承重）');
    assert.strictEqual(countHitsIn(tmp, ATTACK_NOUN), ATTACK_NOUN.length, '摘掉链接臂后归责名词族塌陷');
    assert.strictEqual(countHitsIn(tmp, ALL_BENIGN), 0, '摘掉链接臂后良性被误命中');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('D2 变异守卫二：摘掉归责名词臂后 12 条回落到 0（判据层承重）', () => {
  const tmp = copySrc('dropnoun');
  try {
    mutateLine(path.join(tmp, 'src', 'index.js'), ANCHOR_OF,
      '|(?:总之|说到底|归根结底|归根到底|说穿了)(?:[^。，,]{0,12}|[^。，,]{0,8}[，,][^。，,]{0,8})(?:功劳|之功|首功|头功)', '');
    assert.strictEqual(countHitsIn(tmp, ATTACK_NOUN), 0,
      '摘掉归责名词臂后未全部回落（说明该臂不承重）');
    assert.strictEqual(countHitsIn(tmp, ATTACK_LINK), ATTACK_LINK.length, '摘掉名词臂后链接族塌陷');
    assert.strictEqual(countHitsIn(tmp, ALL_BENIGN), 0, '摘掉名词臂后良性被误命中');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
// D3：豁免层同源纪律的承重守卫——把四个新收束词从「因为」负向环视词表摘掉后，
// B 族 4 条会被因为分支当他因信号整句豁免（回到 HEAD 的 0 命中）。
test('D3 变异守卫三：环视词表摘掉四个收束词后 B 族回落到 0（同源纪律承重）', () => {
  const tmp = copySrc('droplook');
  try {
    mutateLine(path.join(tmp, 'src', 'index.js'), ANCHOR_OF2,
      '|说到底|归根结底|归根到底|说穿了', '');
    assert.strictEqual(countHitsIn(tmp, ATTACK_LINK), 0,
      '摘掉环视词表新词后 B 族未回落（说明同源同步不承重）');
    assert.strictEqual(countHitsIn(tmp, ATTACK_NOUN), ATTACK_NOUN.length, '摘掉环视词表后归责名词族塌陷');
    assert.strictEqual(countHitsIn(tmp, ALL_BENIGN), 0, '摘掉环视词表后良性被误命中');
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
// r234 测试 LEGACY_ATTACK 原样搬来（r233 归因链接族 + r232/r225 裸「也」族 +
// r226 反豁免族 + r231 玄学仪式族），本轮不得回退。
const LEGACY_ATTACK = [
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
  '从那天起他就再也没输过，肯定是换了名字带来的',
  '从那天起她再也没迟到过，说明是早起打卡起了作用',
  '我们加了缓存之后延迟降了，说明缓存是唯一原因',
  '他坚持早起之后业绩就翻倍了，可见早起不是运气造成的',
];
test(`E1 存量攻击句不塌（${LEGACY_ATTACK.length} 条逐条 detector 或 gate 非 pass）`, () => {
  const bad = LEGACY_ATTACK.filter(s => pcCount(s) === 0 && gateAction(s) === 'pass');
  assert.deepStrictEqual(bad, [], `以下存量攻击句 detector 与 gate 双漏：\n  ${bad.join('\n  ')}`);
});
test(`E2 存量良性不涨（${ALL_BENIGN.length} 条全部 detector 零命中）`, () => {
  const bad = ALL_BENIGN.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下存量良性被误判：\n  ${bad.join('\n  ')}`);
});

// ─── F 节：源码常量与结构 ─────────────────────────────────────────
test('F1 PC_ATTRIB_ZH 已含两个新分支，既有分支一个没少', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const line = src.split('\n').find(l => l.includes(ANCHOR_OF));
  assert.ok(line, '找不到 PC_ATTRIB_ZH 定义行');
  // 两个新分支
  assert.ok(line.includes('|(?:说到底|归根结底|归根到底|说穿了)[，,]?(?:是)?(?:因为|由于)'), '缺显式归因链接臂');
  assert.ok(line.includes('|(?:总之|说到底|归根结底|归根到底|说穿了)(?:[^。，,]{0,12}|[^。，,]{0,8}[，,][^。，,]{0,8})(?:功劳|之功|首功|头功)'), '缺归责名词臂');
  // 既有分支一个不许少、一个不许改（r234 三个新族 + 原有四类）
  // [v6.8.165 第 237 轮] 「总之」臂与转述臂的夹逗号放宽后字面量同源同步
  // （只同步字面量，本清单守的是「分支还在」，不是「逐字不变」）。
  for (const w of ['显然', '可见', '说明', '看来', '证明', '直接决定', '这才是[^。]{0,8}的?原因',
    '所以[^。]{0,16}(?:原因|的锅|造成的|导致|所致|问题就出在|都是|就是因为)',
    '总之[，,]?(?:是)?(?:因为|由于)',
    '(?:都说是|据说|听说|传闻)(?:是)?(?:[^。，,]{0,12}|[^。，,]{0,8}[，,][^。，,]{0,8})(?:因为|由于|的功劳)',
    '(?:肯定|一定)(?:是|由于)?[^。]{0,12}', '招财', '旺了?财', '辟邪', '显灵', '吉利', '风水',
    '能治', '见效', '中[^。]{0,3}(?:大奖|奖)']) {
    assert.ok(line.includes(w), `既有分支 ${w} 丢失`);
  }
});
test('F2 豁免层环视词表与判据层同源（四个收束词已进负向环视）', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const other = src.split('\n').find(l => l.includes(ANCHOR_OF2));
  assert.ok(other, '找不到 PC_OTHERFACTOR_ZH 定义行');
  // 纪律：判据层新增的断言词必须同步进豁免层的「因为」负向环视词表，
  // 否则「说到底是因为…」会被因为分支当他因信号整句豁免（r233 修的就是这条）。
  for (const w of ['说到底', '归根结底', '归根到底', '说穿了']) {
    assert.ok(other.includes(w), `环视词表缺 ${w}（判据层与豁免层必须同源）`);
  }
  // 环视结构本身不许被改坏（负向环视 + 可选至两个「是/地」）
  assert.ok(other.includes('(?<!(?:显然'), '「因为」负向环视结构丢失');
  assert.ok(other.includes('(?:是|地){0,2})因为'), '环视可选组结构丢失');
});
test('F3 第①支拼装调用点仍在（判据层不被孤立）', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  assert.ok(/PC_ATTRIB_ZH\.source/.test(src), 'PC_ATTRIB_ZH 拼装调用点丢失');
  assert.ok(src.includes('function checkPseudoCausal'), 'checkPseudoCausal 函数丢失');
});
test('F4 dimensions 键数 210 不变（本轮未加维度，只补判据层词表）', () => {
  const keys = Object.keys(idx.discriminate('测试句子').dimensions || {});
  assert.strictEqual(keys.length, 210, `dimensions 键数应为 210，实测 ${keys.length}`);
});

// ─── G 节：已知未修登记 ───────────────────────────────────────────
// G1：同子句纪律的已知缺口——收束词与归因链接之间夹逗号时不判（与 r234 G2 同源）。
// [v6.8.165 第 237 轮] 原 G1 登记（「夹逗号仍漏判」）已由 r237 修复，按
// r226/r227/r233/r234 纪律翻成 FIXED_BY_R237 正向断言——登记反过来守本轮修复
// 不退步：这两句今后必须判命中，且必须三层（detector/findings/gate）都算。
test('G1 FIXED_BY_R237：收束词与归责信号夹逗号已判命中（r235 G1 / r234 G2 挂账）', () => {
  const fixed = [
    '打那以后球队就再也没输过，说到底，是因为换了教练',
    '打那以后球队就再也没输过，归根结底，功劳是教练的',
  ];
  for (const s of fixed) {
    assert.strictEqual(pcCount(s), 1, `夹逗号变体应判命中：${s}`);
    const g = gateMod.gate(s);
    assert.notStrictEqual(g.gate.action, 'pass', `夹逗号变体 gate 不应 pass：${s}`);
    assert.ok(g.findings.some(f => f.dimension === 'pseudo_causal'),
      `findings 应含 pseudo_causal：${s}`);
  }
});
// G2：无顺序标记的收束词归责句不判（第①支两腿缺一，属设计而非缺口，登记备查）。
test('G2 已知未修②：无顺序标记的收束词归责句不判（第①支形状决定，非本轮缺口）', () => {
  assert.strictEqual(pcCount('说到底还是教练的功劳'), 0,
    '该句已判命中——若这是有意扩面，请同步更新本条登记');
});
// G3：r230 挂账甲半缺口两条已由 r236 修复（PC_INVTAKE_ZH 正序臂对象表补裸「药」
// + 量词类补「服」、PC_DRUG_MECH_ZH「服药」腿加 `(?<![这那一])` 负向环视）。
test('G3 已修复③：r230 甲半缺口两条已修（r236 FIXED，登记翻正）', () => {
  assert.strictEqual(pcCount('吃了这片药人就困了'), 1,
    '该句回归 0 命中——r236 修复被回退');
  assert.strictEqual(pcCount('这服药喝下去当晚就睡得死沉'), 1,
    '该句回归 0 命中——r236 修复被回退');
  assert.notStrictEqual(gateAction('吃了这片药人就困了'), 'pass', '该句 gate 已回落到 pass');
  assert.notStrictEqual(gateAction('这服药喝下去当晚就睡得死沉'), 'pass', '该句 gate 已回落到 pass');
});
// G4：跨表医疗/机制词统一仍未做（连续九轮挂账）——四张机制表用词高度重叠但
// 不完全一致，且都没收「交付质量/机场时刻表」这类业务机制词。
test('G4 已知未修④：跨表医疗/机制词统一的业务侧已由 r238 修复（FIXED_BY_R238）', () => {
  assert.strictEqual(pcCount('从那以后他的客户再也没断过，都说是因为交付质量稳了'), 0,
    'r238 修复句——若回退请检查 PC_MECH_WEAK_ZH 腿 A 与 PC_REV_MECH_ZH 34 词');
  assert.strictEqual(pcCount('从那以后航班就再也没延误过，听说是因为机场调整了时刻表'), 0,
    'r238 修复句——若回退请检查「时刻表」');
});
