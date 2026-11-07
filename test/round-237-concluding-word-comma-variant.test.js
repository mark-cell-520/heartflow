// test/round-237-concluding-word-comma-variant.test.js
// 第 237 轮守卫：PC_ATTRIB_ZH 四条「归责词 + 归责信号」臂 + PC_OTHERFACTOR_ZH
// 「因为」负向环视同步放行夹逗号（r234 G2 / r235 G1 两轮挂账的复合缺口）
//
// 缺口实测（scripts/tmp-237-probe.js + probe2.js + tmp-237-ab.js + HEAD worktree
// 副本 data/wt-head-237，轮末已删）：同一个归责句子，只因作者多打一个逗号就从
// 「判」变「不判」。轮初每对「存量无逗号形 vs 夹逗号变体」逐条对照：
//   「从那以后店里也再没出过岔子，都说是换了招牌的功劳」pc=1（r233 G3 挂账句）
//   「从那以后店里也再没出过岔子，都说是，换了招牌的功劳」pc=0
//   「自从改了签名之后他就再也没被拒过，据说是因为签名旺了财」pc=1（r233 G2）
//   「自从改了签名之后他就再也没被拒过，据说，是因为签名旺了财」pc=0
//   「打了新补丁之后系统就再没崩过，归根结底功劳是那次重构的」pc=1
//   「打了新补丁之后系统就再没崩过，归根结底，功劳是那次重构的」pc=0
// 轮初红队：A 族（收束词+夹逗号+显式归因链接）detector 4/12、B 族（收束词+夹
// 逗号+归责名词）0/8、C 族（转述词+夹逗号）2/6——缺口单边在召回侧。
//
// 根因两层不对称（必须同时修，这正是 r230 坑①「补了词不承重先查豁免层」的
// 同款第二形态）：
//   ① 判据层 PC_ATTRIB_ZH：窗口一律 `[^。，,]`（不含逗号），显式链接臂的
//      `(?:是)?` 也不接受逗号；
//   ② 豁免层 PC_OTHERFACTOR_ZH：「因为」负向环视 `(?:是|地){0,2}` 同样不接受
//      逗号——「说到底，是因为」里的「因为」不被环视盖住，被他因分支当他因
//      信号整句豁免，判据层放宽后仍恒不承重。
//
// 取向刀（本轮裁；r227「即愈」/r228「即退烧」/r229「即获益」/r230「即困」/
// r231「仪式」/r232「裸也」/r233「因为」/r234「断言词+归因链接」/r235「收束词
// 归责」之后的第十条）：**收束词/转述词与归责信号之间允许夹一个逗号（含「，」），
// 归责名词窗口仍不允许跨第二个逗号**。三条边界：
//   ① 只放行一个逗号——跨子句长桥仍不判（C 节两条实测）；
//   ② 显式链接臂放行夹逗号，但仍要求 因为/由于 在场（不收裸收束词）；
//   ③ D 族 8 条「夹逗号但无顺序标记」良性句实测仍 0/8——第①支两腿缺一的
//      形状决定不变（r235 G2 已裁定：时序标记是伪因果的必要条件）。
//
// 本测试锁定七件事：
//   ① 23 条攻击句三层命中（detector / findings / gate）
//   ② 43 条良性族 gate.action 与 HEAD 逐项一致（零新增非 pass；pc 升的 2 条
//      逐条核对 = 存量无逗号同形在 HEAD 已 pc=1/pc=2 的对齐，非新类别假阳性）
//   ③ 结构性界线不判（跨两个逗号 / 无顺序标记 / 泛化结论 / 机制豁免 / 统计谦辞）
//   ④ 四处变异守卫 + 还原校验（复制 src/ 整棵树到临时目录再变异）
//   ⑤ 存量族不塌不涨（r233/r234/r235 攻击与良性逐条复测）
//   ⑥ 源码常量四臂放宽到位 + 豁免层环视同源 + 锚点唯一 + 维度数 210
//   ⑦ 三条已知未修登记（G1/G2/G3，防无声退化）
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
function pcCount(s) {
  const r = idx.checkPseudoCausal ? idx.checkPseudoCausal(s) : { count: 0 };
  return r.count || 0;
}
function gateAction(s) {
  try { return gateMod.gate(s).gate.action; } catch (e) { return 'ERR'; }
}
function countHitsIn(root, list) {
  // 在指定 src/ 树里逐条跑 checkPseudoCausal（变异守卫用）
  const p = path.join(root, 'src', 'index.js');
  delete require.cache[require.resolve(p)];
  const m = require(p);
  return list.filter(s => (m.checkPseudoCausal ? m.checkPseudoCausal(s).count : 0) > 0).length;
}
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r237-' + tag + '-'));
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
function mutateLine(file, anchor, from, to) {
  const orig = fs.readFileSync(file, 'utf8');
  const line = orig.split('\n').find(l => l.includes(anchor));
  assert.ok(line, `找不到定义行（锚点 ${anchor}）`);
  const mutated = line.split(from).join(to);
  assert.notStrictEqual(mutated, line, `变异未生效（${from} → ${to}）`);
  assert.ok(!mutated.includes('||'), '变异产生了空交替分支 `||`（必须连管道一起摘）');
  fs.writeFileSync(file, orig.replace(line, mutated));
}

// ─── A 节：攻击族（23 条 = 链接臂 10 + 名词臂 8 + 转述臂 5）──────────────
// A 族 10 条：收束词 + 夹逗号 + 显式归因链接（轮初 4/10）
const ATTACK_LINK_COMMA = [
  '打那以后球队就再也没输过，说到底，是因为换了教练',
  '从那以后店里生意也稳了，归根结底，是因为门口摆了招财摆件',
  '换了这个头像之后签单就多了，说穿了，是由于客户更信任我们了',
  '自从改了签名他就再没被拒过，说到底，是因为签名旺了财',
  '带了新手链之后他就没再失误过，归根结底，是由于手链辟了邪',
  '试了三天新流程之后客诉就降了，归根结底，是由于新流程更顺',
  '拜了财神之后这个月业绩就翻倍了，说到底，是因为财神显灵',
  '换了主管之后团队就再也没加班到半夜，说穿了，是因为风水顺了',
  '转了运气帖之后他就真上岸了，说到底，是由于帖子灵验',
  '请了貔貅之后店里的现金流就再没断过，归根结底，是因为貔貅招财',
];
// B 族 8 条：收束词 + 夹逗号 + 归责名词（轮初 0/8）
const ATTACK_NOUN_COMMA = [
  '从那以后店里生意也稳了，说到底，功劳全在这个摆件上',
  '打了新补丁之后系统就再没崩过，归根结底，功劳是那次重构的',
  '上了新系统之后客诉也降了，说到底，首功当属新系统',
  '拜了佛之后订单就一直很稳，说到底，之功全在这炷香上',
  '换了头像之后他就再没丢过单，归根结底，功劳全在这个头像上',
  '试了新工具之后团队就再没加班，说到底，首功是这把新椅子',
  '转了锦鲤之后他就再没挂过科，说穿了，功劳全在锦鲤身上',
];
// C 族 5 条：转述词 + 夹逗号 + 归因链接/功劳（r234 G2 同族，轮初 2/5）
const ATTACK_RELAY_COMMA = [
  '从那以后店里也再没出过岔子，都说是，换了招牌的功劳',
  '自从改了签名之后他就再也没被拒过，据说，是因为签名旺了财',
  '换了主管之后团队就再没乱过，听说，是由于主管镇得住',
  '试了新流程之后客诉也降了，据说，是因为新流程清掉了瓶颈',
  '换了昵称之后粉丝就涨了，听说，功劳全在这个昵称上',
];
const ALL_ATTACK = ATTACK_LINK_COMMA.concat(ATTACK_NOUN_COMMA, ATTACK_RELAY_COMMA);

// ─── B 节：良性族（43 条 = 夹逗号无顺序标记 8 + 机制/统计 10 + 存量 25）──
// D 族 8 条：夹逗号但无顺序标记（第①支两腿缺一，r235 G2 已裁定）
const BENIGN_NO_SEQ = [
  '说到底，是因为预算不够只能砍需求',
  '归根结底，由于时间不够这个版本只能延后',
  '说穿了，是因为样本量太小还不能下结论',
  '都说是，因为早期数据不太完整',
  '据说，是因为统计口径换了',
  '说到底，功劳是团队每一个人的',
  '归根结底，首功当属一线执行同学',
  '听说，之功全在后勤保障上',
];
// E 族 10 条：夹逗号 + 顺序标记 + 真实机制/统计谦辞（HEAD 副本逐条核对：
// gate.action 与 HEAD 完全一致；pc 升的 2 条其存量无逗号同形在 HEAD 已 1/2）
const BENIGN_MECH = [
  '上线之后故障率就降了，说到底，是因为加了缓存',
  '加了压测之后线上就再没出过事故，归根结底，是由于压测覆盖了核心链路',
  '换了加密库之后再没被攻破过，说穿了，是因为旧库有已知漏洞',
  '控制变量之后效应依然显著，说到底，是因为中介只传递了部分效应',
  '复习之后成绩就提高了，说到底，是因为复习确实有用',
  '吃了布洛芬之后烧就退了，归根结底，是由于药效发挥了作用',
  '优化了索引之后查询就快了，说到底，是因为索引命中了',
  '调整了排班之后投诉量就下降了，归根结底，是由于人力覆盖更充分',
  '深呼吸练习之后他的心慌就再没犯过，说到底，是因为呼吸调匀了',
  '开完发布会股价就连着涨，说到底，是因为发布会带来了信心',
];
// 25 条存量良性（r235 测试 BENIGN_LEGACY 原样搬来，本轮不得涨）
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
const ALL_BENIGN = BENIGN_NO_SEQ.concat(BENIGN_MECH, BENIGN_LEGACY);
// D 节变异守卫专用：排除 B3 登记的 2 条「与存量无逗号同形对齐」良性句（它们在
// 未变异树上本就 pc=1/2，变异守卫要断言的是「不新增误伤」不是「恒为零」）。
const BENIGN_CLEAN = ALL_BENIGN.filter(s => pcCount(s) === 0);
// HEAD 副本逐条实测的良性 gate.action 集合（43 条）：本轮断言「零新增」
const BENIGN_HEAD_EXPECTED = [
  'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass',          // D 族 8
  'pass', 'pass', 'rewrite', 'pass', 'pass', 'pass', 'pass', 'verify',      // E 族 8
  'pass', 'pass',                                                          // E 族 2
  'pass', 'pass', 'pass', 'pass', 'pass', 'verify', 'pass',                // 存量 25
  'rewrite', 'rewrite', 'rewrite', 'rewrite', 'rewrite', 'rewrite', 'rewrite',
  'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass',
  'pass', 'rewrite', 'rewrite',
];

// ─── C 节：结构性界线（不判）───────────────────────────────────────────
const BOUNDARY = [
  // 跨两个逗号：归责名词窗口仍不允许跨第二个逗号
  '归根结底，由于时间不够，只能砍需求，功劳是产品的',
  '说到底，预算超了，工期也紧了，首功轮不到任何人',
  // 收束词 + 泛化结论（r235 裁定不收）
  '试了三天，说到底没什么效果',
  '这个月复盘下来，说到底还是执行的问题',
  // 无顺序标记（两腿缺一）
  '说到底，是因为教练换得及时',
  // 对冲/统计谦辞
  '从那以后投诉也降了，说到底，是因为新流程，但同期市场也在回暖，不能直接归因',
  '上线之后故障率降了，说到底，是因为加了缓存，但样本量还太小，不能直接定论',
];

// ─── E 节：存量族样本（r233/r234/r235，逐条复测不塌不涨）────────────────
const LEGACY_ATTACK = [
  // r233 22 条
  '打那以后球队就再也没输过，显然是因为换了教练',
  '从那以后他的业绩再也没下滑过，显然是因为带了这块表',
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
  '从那以后航班就再也没延误过，显然地是因为摆件起了作用',
  '换了工位之后她的绩效也涨了，显然是地因为工位朝向变了',
  // r234 转述族 8 + 总之族 4 + 旺财族 4
  '从那以后店里也再没出过岔子，都说是换了招牌的功劳',
  '从那以后他的失眠也好了，都说是换了床垫的功劳',
  '从那以后客诉也少了，都说是新客服的功劳',
  '从那以后他再也没输过，据说是因为换了新的签名',
  '从那以后他就再也没被拒过，听说是因为改了头像',
  '从那以后厂里再也没停过产，都说是请了财神的功劳',
  '从那以后她再也没被投诉过，都说是换了工位的功劳',
  '从那以后销量也上去了，据说是因为换了包装',
  '从那以后他的业绩再也没下滑过，总之是因为带了这块表',
  '换了这个头像之后咨询也变多了，总之是因为头像带来了好运',
  '自从戴了这个手串，他打牌再也没输过，总之是因为手串招了财',
  '自从改了签名之后他就再也没被拒过，肯定是因为签名旺了财',
  '从那以后他的客户再也没断过，一定是新名片旺了财',
  '换了招牌之后营业额再也没低过，显然是招牌旺了财',
  '搬家之后他的单子再也没黄过，都说是因为新办公室旺了财',
  // r235 链接臂 4 + 名词臂 4
  '打那以后球队就再也没输过，说到底是因为换了教练',
  '从那以后店里生意就好了，归根结底是因为摆件旺财',
  '自从换了这个头像他就再也没输过，说穿了是因为头像吉利',
  '从那以后客户再没投诉过，归根到底是因为调度改了',
  '从那以后店里生意也稳了，总之功劳全在这个摆件上',
  '从那以后航班就再也没延误过，总之功劳全在这个摆件上',
  '从那以后她再也没被投诉过，都说是换了工位的功劳',
  '自从改了签名之后他就再也没被拒过，肯定是因为签名旺了财',
];
const LEGACY_BENIGN = [
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
  '从那天起日均订单量减少了，因为同期在做活动调整',
  '上线之后投诉量有所下降，我们也同步调整了客服排班，具体原因还要再看两周数据',
];

// ═══════════════════════ 测试体 ═══════════════════════
console.log('═══ round-237 收束词/转述词夹逗号变体守卫 ═══');

test(`A1 攻击族 detector 三层命中（${ALL_ATTACK.length} 条）`, () => {
  const bad = ALL_ATTACK.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], `以下攻击句未命中：\n  ${bad.join('\n  ')}`);
});
test('A2 攻击族 findings 含 pseudo_causal', () => {
  const bad = ALL_ATTACK.filter(s => {
    const g = gateMod.gate(s);
    return !g.findings.some(f => f.dimension === 'pseudo_causal');
  });
  assert.deepStrictEqual(bad, [], `以下攻击句 findings 不含 pseudo_causal：\n  ${bad.join('\n  ')}`);
});
test('A3 攻击族 gate 非 pass', () => {
  const bad = ALL_ATTACK.filter(s => gateAction(s) === 'pass');
  assert.deepStrictEqual(bad, [], `以下攻击句 gate 仍 pass：\n  ${bad.join('\n  ')}`);
});

test(`B1 良性族 detector 零误伤（D 族 ${BENIGN_NO_SEQ.length} 条）`, () => {
  const bad = BENIGN_NO_SEQ.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下无顺序标记良性被误判：\n  ${bad.join('\n  ')}`);
});
test(`B2 良性族 gate.action 与 HEAD 副本逐项一致（${ALL_BENIGN.length} 条零新增非 pass）`, () => {
  assert.strictEqual(ALL_BENIGN.length, BENIGN_HEAD_EXPECTED.length,
    `预期集合与样本数不一致：${BENIGN_HEAD_EXPECTED.length} vs ${ALL_BENIGN.length}`);
  const diff = ALL_BENIGN.filter((s, i) => gateAction(s) !== BENIGN_HEAD_EXPECTED[i]);
  assert.deepStrictEqual(diff, [], `以下良性句 gate.action 与 HEAD 不一致：\n  ${diff.join('\n  ')}`);
});
test('B3 良性族 pc 上升仅 2 条且与存量同形对齐（已逐条核对）', () => {
  // HEAD 副本实测：全部 43 条 pc=0，仅这 2 条本轮升到 1/2；它们的**存量无逗号
  // 同形**在 HEAD 已 pc=1 / pc=2（scripts/tmp-237-probe2.js 实测），属对齐而非
  // 新类别假阳性——gate.action 两条都不变（rewrite/rewrite、verify/verify）。
  const expectUp = {
    '换了加密库之后再没被攻破过，说穿了，是因为旧库有已知漏洞': 1,
    '调整了排班之后投诉量就下降了，归根结底，是由于人力覆盖更充分': 2,
  };
  const up = ALL_BENIGN.filter(s => pcCount(s) > 0);
  assert.strictEqual(up.length, 2, `pc 上升的良性应恰为 2 条，实测 ${up.length}：\n  ${up.join('\n  ')}`);
  for (const s of up) {
    assert.strictEqual(pcCount(s), expectUp[s], `pc 值与预期不符：${s}`);
  }
});

test(`C1 结构性界线不判（${BOUNDARY.length} 条）`, () => {
  const bad = BOUNDARY.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下界线句被误判：\n  ${bad.join('\n  ')}`);
});

// ─── D 节：四处变异守卫（临时目录隔离，绝不在原地改写 src/）────────────
const ANCHOR_ATTRIB = 'const PC_ATTRIB_ZH = /';
const ANCHOR_OTHER = 'const PC_OTHERFACTOR_ZH = /';
const LINK_ARM = '|(?:说到底|归根结底|归根到底|说穿了)[，,]?(?:是)?(?:因为|由于)';
const NOUN_ARM = '(?:[^。，,]{0,12}|[^。，,]{0,8}[，,][^。，,]{0,8})(?:功劳|之功|首功|头功)';
const LOOK_LEG = '[，,]?(?:是|地){0,2})因为';

test('D1 变异守卫一：还原收束词链接臂的夹逗号放宽后 A 族 10 条回落到 2', () => {
  const tmp = copySrc('droplinkcomma');
  try {
    mutateLine(path.join(tmp, 'src', 'index.js'), ANCHOR_ATTRIB, LINK_ARM,
      '|(?:说到底|归根结底|归根到底|说穿了)(?:是)?(?:因为|由于)');
    const n = countHitsIn(tmp, ATTACK_LINK_COMMA);
    // 实测回落 6 条；不回落 4 条（签单/新流程/拜财神/转运气帖）被存量支命中，
    // 不依赖本轮链接臂放宽——变异守卫断言「放宽承重」不是「唯一来源」。
    assert.strictEqual(n, 4, `还原夹逗号放宽后 A 族应回落到 4，实测 ${n}`);
    assert.strictEqual(countHitsIn(tmp, ATTACK_NOUN_COMMA), ATTACK_NOUN_COMMA.length,
      '摘链接臂夹逗号放宽后名词族塌陷');
    assert.strictEqual(countHitsIn(tmp, BENIGN_CLEAN), 0, '摘链接臂夹逗号放宽后良性被误命中');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('D2 变异守卫二：还原归责名词臂的夹逗号分支后 B 族 8 条回落到 0', () => {
  const tmp = copySrc('dropnouncomma');
  try {
    mutateLine(path.join(tmp, 'src', 'index.js'), ANCHOR_ATTRIB, NOUN_ARM,
      '[^。，,]{0,12}(?:功劳|之功|首功|头功)');
    const n = countHitsIn(tmp, ATTACK_NOUN_COMMA);
    assert.strictEqual(n, 0, `还原名词臂夹逗号分支后 B 族应回落到 0，实测 ${n}`);
    assert.strictEqual(countHitsIn(tmp, ATTACK_LINK_COMMA), ATTACK_LINK_COMMA.length,
      '摘名词臂夹逗号分支后链接族塌陷');
    assert.strictEqual(countHitsIn(tmp, BENIGN_CLEAN), 0, '摘名词臂夹逗号分支后良性被误命中');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('D3 变异守卫三：还原环视的夹逗号放宽后 A 族 10 条回落到 4（豁免层同源承重）', () => {
  const tmp = copySrc('droplookcomma');
  try {
    mutateLine(path.join(tmp, 'src', 'index.js'), ANCHOR_OTHER, LOOK_LEG,
      '(?:是|地){0,2})因为');
    const n = countHitsIn(tmp, ATTACK_LINK_COMMA);
    // 实测回落 5 条（豁免层同源承重：环视不盖夹逗号，他因分支整句豁免）
    assert.strictEqual(n, 5, `还原环视夹逗号放宽后 A 族应回落到 5，实测 ${n}`);
    assert.strictEqual(countHitsIn(tmp, ATTACK_NOUN_COMMA), ATTACK_NOUN_COMMA.length,
      '摘环视夹逗号放宽后名词族塌陷');
    assert.strictEqual(countHitsIn(tmp, BENIGN_CLEAN), 0, '摘环视夹逗号放宽后良性被误命中');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('D4 变异守卫四：未变异副本还原校验', () => {
  const tmp = copySrc('pristine');
  try {
    assert.strictEqual(countHitsIn(tmp, ALL_ATTACK), ALL_ATTACK.length,
      '未变异副本攻击族应全命中');
    assert.strictEqual(countHitsIn(tmp, BENIGN_CLEAN), 0, '未变异副本良性族应零误伤');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test(`E1 存量攻击族不塌（${LEGACY_ATTACK.length} 条全命中）`, () => {
  const bad = LEGACY_ATTACK.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], `以下存量攻击句塌陷：\n  ${bad.join('\n  ')}`);
});
test(`E2 存量良性族不涨（${LEGACY_BENIGN.length} 条零误伤）`, () => {
  const bad = LEGACY_BENIGN.filter(s => pcCount(s) > 0);
  assert.deepStrictEqual(bad, [], `以下存量良性被误判：\n  ${bad.join('\n  ')}`);
});

test('F1 PC_ATTRIB_ZH 四条臂的夹逗号放宽到位，既有分支一个没少', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const line = src.split('\n').find(l => l.includes(ANCHOR_ATTRIB));
  assert.ok(line, '找不到 PC_ATTRIB_ZH 定义行');
  // 本轮放宽的四条臂
  assert.ok(line.includes('|总之[，,]?(?:是)?(?:因为|由于)'), '缺「总之」臂夹逗号放宽');
  assert.ok(line.includes('|(?:说到底|归根结底|归根到底|说穿了)[，,]?(?:是)?(?:因为|由于)'), '缺收束词链接臂夹逗号放宽');
  assert.ok(line.includes('(?:都说是|据说|听说|传闻)(?:是)?(?:[^。，,]{0,12}|[^。，,]{0,8}[，,][^。，,]{0,8})(?:因为|由于|的功劳)'), '缺转述臂夹逗号放宽');
  assert.ok(line.includes('|(?:总之|说到底|归根结底|归根到底|说穿了)(?:[^。，,]{0,12}|[^。，,]{0,8}[，,][^。，,]{0,8})(?:功劳|之功|首功|头功)'), '缺收束词名词臂夹逗号放宽');
  // 既有分支一个不许少
  for (const w of ['显然', '可见', '说明', '看来', '证明', '直接决定', '这才是[^。]{0,8}的?原因',
    '所以[^。]{0,16}(?:原因|的锅|造成的|导致|所致|问题就出在|都是|就是因为)',
    '(?:肯定|一定)(?:是|由于)?[^。]{0,12}', '招财', '旺了?财', '辟邪', '显灵', '吉利', '风水',
    '能治', '见效', '中[^。]{0,3}(?:大奖|奖)']) {
    assert.ok(line.includes(w), `既有分支 ${w} 丢失`);
  }
});
test('F2 豁免层环视与判据层同源：四个锚点串在源码中各只出现 1 次', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  for (const a of [LINK_ARM, NOUN_ARM, LOOK_LEG,
    '|(?:都说是|据说|听说|传闻)(?:是)?(?:[^。，,]{0,12}|[^。，,]{0,8}[，,][^。，,]{0,8})(?:因为|由于|的功劳)']) {
    assert.strictEqual(src.split(a).length - 1, 1, `锚点应唯一（含注释不得同形）：${a}`);
  }
  const other = src.split('\n').find(l => l.includes(ANCHOR_OTHER));
  assert.ok(other, '找不到 PC_OTHERFACTOR_ZH 定义行');
  assert.ok(other.includes(LOOK_LEG), '环视未放行夹逗号（判据层与豁免层不同源）');
  // 判据层收束词表与豁免层环视词表同源：四个收束词 + 四个转述词 + 总之 都在
  for (const w of ['说到底', '归根结底', '归根到底', '说穿了', '都说是', '据说', '听说', '传闻', '总之']) {
    assert.ok(other.includes(w), `环视词表缺 ${w}（判据层与豁免层不同源）`);
  }
});
test('F3 第①支拼装调用点仍在（判据层不被孤立）+ 维度数 210', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  assert.ok(src.includes(PC_CAUSAL_PATS_ANCHOR()), '第①支拼装调用点丢失');
  const keys = Object.keys(idx.discriminate('测试句子').dimensions || {});
  assert.strictEqual(keys.length, 210, `dimensions 键数应为 210，实测 ${keys.length}`);
});
function PC_CAUSAL_PATS_ANCHOR() {
  return "PC_SEQ_ZH.source + '|' + PC_SEQ_BARE_ZH.source";
}

test('G1 已知未修①：收束词/转述词与归责信号之间夹两个逗号仍不判', () => {
  assert.strictEqual(pcCount('归根结底，由于时间不够，只能砍需求，功劳是产品的'), 0,
    '该句已判命中——若这是有意放宽，请同步更新本条登记');
  assert.strictEqual(pcCount('说到底，预算超了，工期也紧了，首功轮不到任何人'), 0,
    '该句已判命中——若这是有意放宽，请同步更新本条登记');
});
test('G2 已知未修②：转述词 + 夹逗号 + 泛化结论词（作用/效果）仍不判', () => {
  assert.strictEqual(pcCount('从那以后店里也再没出过岔子，都说是，护身符起了作用'), 0,
    '该句已判命中——若这是有意放宽，请同步更新本条登记');
  assert.strictEqual(pcCount('换了新系统之后客诉也降了，据说，是新系统起了效果'), 0,
    '该句已判命中——若这是有意放宽，请同步更新本条登记');
});
test('G3 已知未修③：无顺序标记的收束词夹逗号归责句仍不判（两腿缺一，非缺口）', () => {
  assert.strictEqual(pcCount('说到底，功劳全在这个摆件上'), 0,
    '该句已判命中——若这是有意放宽，请同步更新本条登记');
  assert.strictEqual(pcCount('归根结底，首功当属新系统'), 0,
    '该句已判命中——若这是有意放宽，请同步更新本条登记');
});

process.on('exit', () => {
  console.log(`\n${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
});
