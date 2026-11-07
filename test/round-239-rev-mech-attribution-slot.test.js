// r239 守护：⑪⑫⑬⑭ 四支机制护栏从「整句在场」位置化为「归因对象位在场」
// （PC_SLOT_MECH_ZH 四条腿：显式归因链接 / 领属归责名词前后 / 同子句共现）
// 铁律：位置收窄不许掉召回之外的东西——存量 26321 条样本 gate.action 零差异，
// 良性句（机制词在归因位）一条不放，攻击句（机制词在时序侧/结果侧）一条不塌。
'use strict';
const { test: nodeTest } = require('node:test');
// 包一层记录成败，process.on('exit') 打汇总行（run-all 靠它判定通过；
// 缺「N 通过, M 失败」行会被计 1 个失败——memory 里记着的坑）。
const RESULTS = [];
function test(name, fn) {
  nodeTest(name, async (t) => {
    try { await fn(t); RESULTS.push({ name, ok: true }); }
    catch (e) { RESULTS.push({ name, ok: false }); throw e; }
  });
}
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const gate = require('../src/gate.js');
const idx = require('../src/index.js');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'index.js');
const SRC_TEXT = fs.readFileSync(SRC, 'utf8');

const pcCount = s => idx.checkPseudoCausal(s).count;
const pcHit = s => pcCount(s) > 0;
const gateOf = s => gate.gate(s).gate.action;

// ─── A 族：机制词在**非归因位**（时序侧 / 结果侧），玄学对象在归因位 ────────
// 22 个 PC_LUCK2_MECH_ZH 宽口径词 + 10 个 PC_REV_MECH_ZH 窄口径词 × 5 形状
const LUCK2_WORDS = ['数据', '指标', '方案', '报价', '沟通', '评审', '测试', '连续', '坚持', '习惯',
  '原因', '导致', '机制', '因果', '假设', '样本', '变量', '回归', '交付', '缓存', '排期', '复盘'];
const REV_WORDS = ['交付质量', '排班', '扩容', '根因', '时刻表', '压测', '抗生素', '供应链', '排期', '复盘'];
const SHAPES = [
  m => '自从' + m + '稳了之后签单就多了，说到底是因为穿了红袜子',        // ⑫ 反序：机制在时序侧
  m => '从那以后签单就多了，归根结底是穿了红袜子之功，' + m + '也稳了',    // ⑫ 变体：机制在结果侧
  m => '全靠穿了红袜子，所以签单也多了，' + m + '也稳了',                 // ⑬ 正序：机制在结果侧
  m => '穿了红袜子之后签单也多了，' + m + '也稳了',                       // ⑭ 无引导词
  m => '换了头像，所以业绩' + m + '也上去了',                             // ⑭ 甲半玄学 × 结果侧机制
];
function buildAttack(words) {
  const out = [];
  for (const w of words) for (const f of SHAPES) out.push({ w, s: f(w) });
  return out;
}
const A_LUCK2 = buildAttack(LUCK2_WORDS);
const A_REV = buildAttack(REV_WORDS);
// HEAD 实测漏判数（scripts/tmp-239-red.js，轮初在 HEAD 上跑）：63 / 20
const HEAD_MISS_LUCK2 = 63;
const HEAD_MISS_REV = 20;

test(`A1 宽口径机制词族：HEAD 漏 ${HEAD_MISS_LUCK2}/${A_LUCK2.length} → 现在 0 漏（变量/回归 已由 r241 修掉）`, () => {
  const miss = A_LUCK2.filter(r => !pcHit(r.s));
  // [v6.8.168 第 240 轮] 「机制」一词已由 r240 修掉（PC_HEDGE_ZH 裸词腿位置化成
  // PC_HEDGE_MECH_ZH 四腿），剩余漏判只剩 变量/回归 两个词（STAT_CONTEXT_ZH
  // 支③裸统计术语表，r240 登记为下一轮候选①）。
  // [v6.8.169 第 241 轮] 「变量/回归」也已修掉：支③位置化成统计搭配形
  // （STAT_VAR_ZH / STAT_REG_ZH），编程义与泛论宾词不再整句豁免。按
  // r226/r233 纪律同步：只按实测更新期望值与过期登记，行为断言一个没动。
  const words = [...new Set(miss.map(r => r.w))].sort();
  assert.deepStrictEqual(words, [],
    '宽口径族应零漏判（机制/变量/回归 三轮均已位置化），实测剩余漏判词: ' + words.join('/'));
  assert.strictEqual(miss.length, 0, `宽口径族应零漏判，实测 ${miss.length}`);
  // 除上述两词外，20 个宽口径词 × 5 形状 = 100 条必须全判
  const judged = A_LUCK2.filter(r => pcHit(r.s));
  assert.strictEqual(judged.length, A_LUCK2.length, `应判 ${A_LUCK2.length} 条，实测 ${judged.length}`);
  for (const r of judged) assert.ok(gateOf(r.s) !== 'pass', '判了的攻击句 gate 不应 pass: ' + r.s);
});

test(`A2 窄口径机制词族：HEAD 漏 ${HEAD_MISS_REV}/${A_REV.length} → 现在 0 漏`, () => {
  const miss = A_REV.filter(r => !pcHit(r.s));
  assert.deepStrictEqual(miss.map(r => r.s), [], '窄口径词族应零漏判');
  for (const r of A_REV) assert.ok(gateOf(r.s) !== 'pass', '攻击句 gate 不应 pass: ' + r.s);
});

test('A3 HEAD 漏判基数登记（用 HEAD worktree 副本实测，不是记忆值）', () => {
  let headIdx = null;
  try {
    headIdx = require(path.join(ROOT, 'data', 'wt-head-239', 'src', 'index.js'));
  } catch (_) { headIdx = null; } // worktree 轮末已删 → 跳过本轮登记
  if (!headIdx || typeof headIdx.checkPseudoCausal !== 'function') {
    console.log('  （跳过：data/wt-head-239 不存在——HEAD 基数登记需在轮次进行中跑）');
    return;
  }
  const missL = A_LUCK2.filter(r => headIdx.checkPseudoCausal(r.s).count === 0).length;
  const missR = A_REV.filter(r => headIdx.checkPseudoCausal(r.s).count === 0).length;
  assert.strictEqual(missL, HEAD_MISS_LUCK2, `HEAD 宽口径族漏判应为 ${HEAD_MISS_LUCK2}，实测 ${missL}`);
  assert.strictEqual(missR, HEAD_MISS_REV, `HEAD 窄口径族漏判应为 ${HEAD_MISS_REV}，实测 ${missR}`);
});

// ─── B 族：机制词在**归因对象位**的良性句，一条都不许放出来 ────────────────
const BENIGN_SLOT = [
  // 腿 A：显式归因链接后 ≤16 字
  '从那以后签单就多了，说到底是因为交付质量稳了',
  '从那以后签单就多了，归根结底是扩容之功',
  '全靠交付质量稳了，所以签单也多了',
  '项目成功是因为前期做了充分压测',
  '他康复了因为按时吃了抗生素',
  '因为加了缓存，所以查询快了',
  '这个护身符在庙里开过光，但病情好转是因为按时吃了抗生素',
  '由于团队坚持复盘，连续三个季度业绩翻倍',
  '因为坚持锻炼，他的身体状况好转了很多',
  // 腿 D：机制词与玄学归因对象同子句（可核查努力族）
  '我每天早起跑步，所以体检指标好转了',
  '早起晨跑让他的心肺功能明显改善，这是体检数据支持的结论',
  '自从坚持早起，他的时间管理更规律了，日程表排得很满',
  // r346 存量良性族里依赖机制护栏的 9 条
  '因为加了缓存，所以查询快了',
  '由于重建了索引，接口耗时下去了',
  '因为部署了新版本，服务就恢复了',
  '由于补充了样本量，模型准确率上来了',
  '因为灰度发布，所以故障影响面收窄了',
  '由于这周加了班，所以进度赶上了',
  '因为沟通到位，需求评审一次通过了',
  '由于提前备料，产线没有停',
  '因为留了回滚方案，所以敢直接上线',
  '由于锁的粒度调细，并发冲突下降了',
];

test(`B1 归因位机制良性句零误伤（${BENIGN_SLOT.length} 条 detector + gate 都不劣化）`, () => {
  const bad = BENIGN_SLOT.filter(s => pcHit(s));
  assert.deepStrictEqual(bad, [], '以下良性句被误判:\n  ' + bad.join('\n  '));
  const findings = BENIGN_SLOT.filter(s => {
    const f = gate.gate(s).findings || [];
    return f.some(x => x.dimension === 'pseudo_causal');
  });
  assert.deepStrictEqual(findings, [], '以下良性句 findings 含 pseudo_causal:\n  ' + findings.join('\n  '));
});

// ─── C 族：结构性界线（位置条件的边界，一条不放）──────────────────────────
const BOUNDARY = [
  // 跨子句长桥不豁免：机制词与玄学对象分居两个子句
  ['改了昵称之后签单也多了，我每天跑步', '跨子句（努力词在结果子句）仍判'],
  ['换了头像，所以业绩指标也上去了', '机制词在结果短语内仍判'],
  ['全靠穿了红袜子，所以签单也多了，数据也稳了', '机制词在第三个子句仍判'],
  // 单因归责反豁免照判（PC_MONOCAUSE_ZH 与本轮位置化正交）
  ['我们扩了容之后延迟降了，说到底是因为穿了红袜子，扩容是唯一原因', '排他性归责仍判'],
  // 收束词单腿（不接 因为/由于）不作归因链接
  ['摆了财神之后签单也多了，说到底，数据也稳了', '裸收束词不作链接'],
];

test('C1 结构性界线：跨子句长桥 / 结果侧机制词 / 排他性归责仍判', () => {
  for (const [s, why] of BOUNDARY) {
    assert.ok(pcHit(s), `应判（${why}）：${s}`);
  }
});

// ─── D 族：变异守卫（临时目录隔离，绝不在原地改写 src/）──────────────────
// 五条腿各自是命名常量（src/index.js），变异按常量名摘单腿
const LEG_NAMES = ['PC_SLOT_MECH_LEG_A', 'PC_SLOT_MECH_LEG_B', 'PC_SLOT_MECH_LEG_C',
  'PC_SLOT_MECH_LEG_D', 'PC_SLOT_MECH_LEG_E'];
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'r239-' + tag + '-'));
  fs.cpSync(ROOT, tmp, {
    recursive: true,
    filter: p => !p.includes('node_modules') && !p.includes(path.join(ROOT, 'data')) && !p.includes('.git'),
  });
  return tmp;
}
// 把某条腿的赋值行改成恒不匹配；断言「行找到」且「行形状没变」——首版只断言行找到，
// replace 没命中时静默不变异，守卫看着绿其实失效（r239 自踩，钉在这里）。
// 返回 tmp 路径（不是 require 结果），调用方自己 require。
function dropLeg(tmp, legName) {
  const f = path.join(tmp, 'src', 'index.js');
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  const i = lines.findIndex(l => l.startsWith('const ' + legName + ' = '));
  assert.ok(i >= 0, '变异锚点行未找到: const ' + legName);
  assert.ok(lines[i].includes("'(?:"), '腿 ' + legName + ' 的赋值行形状变了，请同步本条守卫');
  lines[i] = "const " + legName + " = '(?:ZZZNOMATCH)';";
  fs.writeFileSync(f, lines.join('\n'));
  return tmp;
}


test('D1 变异守卫一：摘掉腿 A（显式归因链接）后归因位良性句必须重新被误判', () => {
  const tmp = copySrc('droplegA');
  try {
    dropLeg(tmp, 'PC_SLOT_MECH_LEG_A');
    const m = require(path.join(tmp, 'src', 'index.js'));
    // victim 必须满足「⑫支会触发 且 四条腿里只有腿 A 能豁免」——机制词落在
    // 第二个归因从句里（也是因为交付质量稳了），与玄学对象分居两个子句（腿 D 够不着）、
    // 无领属归责名词（腿 B/C 够不着）。摘掉腿 A 后该句必须从 pc=0 翻成 pc>0。
    const victim = '从那以后签单就多了，都是因为摆了财神，也是因为交付质量稳了';
    assert.strictEqual(pcCount(victim), 0, '未变异树上 victim 应被腿 A 豁免');
    assert.ok(m.checkPseudoCausal(victim).count > 0,
      '摘腿 A 后 victim 应恢复误判，实测 pc=' + m.checkPseudoCausal(victim).count);
    // 攻击句命中数不许变（摘豁免腿不会让攻击句掉命中）
    const before = A_LUCK2.filter(r => pcHit(r.s)).length;
    const after = A_LUCK2.filter(r => m.checkPseudoCausal(r.s).count > 0).length;
    assert.strictEqual(after, before, '摘腿 A 不应改变攻击句命中数');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D2 变异守卫二：摘掉同子句双腿（D+E）后第⑭支良性 victim 必须重新被误判', () => {
  // 腿 D / 腿 E 是同子句判据的两个方向，「我每天早起跑步」里努力词与玄学对象
  // 同子句且努力词在后，两条腿都盖得住——必须同时摘才钉得住同子句判据的承重。
  const tmp = copySrc('droplegDE');
  try {
    dropLeg(tmp, 'PC_SLOT_MECH_LEG_E');
    dropLeg(tmp, 'PC_SLOT_MECH_LEG_D');
    const m = require(path.join(tmp, 'src', 'index.js'));
    const victim = '我每天早起跑步，所以体检指标好转了';
    assert.strictEqual(pcCount(victim), 0, '未变异树上 victim 应被同子句双腿豁免');
    assert.ok(m.checkPseudoCausal(victim).count > 0,
      '摘同子句双腿后 victim 应恢复误判，实测 pc=' + m.checkPseudoCausal(victim).count);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// [v6.8.170 第 242 轮] slotMech 恒真变异体下的判出数：HEAD 实测 47 条，
// r242 把 PC_MECH_WEAK_ZH 的裸「变量/回归」词腿位置化成统计搭配形后变 51 条
// （+4 = 变量/回归 × 形状一/二：这 4 条在变异体里改走①弱支路径判出，而
// PC_MECH_WEAK_ZH 的旧裸词腿正是挡住它们的那道豁免）。HEAD_MISS_LUCK2 仍是
// HEAD 的真实漏判数（63），不动；这里单独记一个变异体期望值。
const HEAD_JUDGED_LUCK2_SLOTTRUE = 51;
test('D3 变异守卫三：把 slotMech 改恒真后 A 族攻击句必须整体回落到 HEAD 漏判态', () => {
  const tmp = copySrc('slottrue');
  try {
    const f = path.join(tmp, 'src', 'index.js');
    let text = fs.readFileSync(f, 'utf8');
    const anchor = 'const slotMech = (luckMech || revMech) && PC_SLOT_MECH_ZH.test(text);';
    assert.strictEqual(text.split(anchor).length - 1, 1, 'slotMech 赋值行锚点应唯一');
    text = text.replace(anchor, 'const slotMech = true;');
    fs.writeFileSync(f, text);
    const m = require(f);
    const judgedL = A_LUCK2.filter(r => m.checkPseudoCausal(r.s).count > 0).length;
    const judgedR = A_REV.filter(r => m.checkPseudoCausal(r.s).count > 0).length;
    assert.strictEqual(judgedL, HEAD_JUDGED_LUCK2_SLOTTRUE,
      `slotMech 恒真后宽口径族应判出 ${HEAD_JUDGED_LUCK2_SLOTTRUE} 条（HEAD 47 + r242 弱支收窄增量 4），实测 ${judgedL}`);
    assert.strictEqual(judgedR, A_REV.length - HEAD_MISS_REV,
      `slotMech 恒真后窄口径族应回落到 HEAD 的 ${A_REV.length - HEAD_MISS_REV} 条，实测 ${judgedR}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D4 变异守卫四：未变异副本还原校验（A 族判 110/110 + B 族零误伤）', () => {
  const tmp = copySrc('pristine');
  try {
    const m = require(path.join(tmp, 'src', 'index.js'));
    const judgedL = A_LUCK2.filter(r => m.checkPseudoCausal(r.s).count > 0).length;
    const judgedR = A_REV.filter(r => m.checkPseudoCausal(r.s).count > 0).length;
    // [v6.8.168 第 240 轮] 95 → 100：r240 修掉「机制」一词 5 条，宽口径族
    // 判 数从 95 升到 100（剩余 10 条漏判全是 变量/回归）。
    // [v6.8.169 第 241 轮] 100 → 110：r241 把支③「变量/回归」位置化成统计
    // 搭配形，剩余 10 条也判出来了，宽口径族满判。
    assert.strictEqual(judgedL, A_LUCK2.length, `未变异副本宽口径族应判 ${A_LUCK2.length}，实测 ${judgedL}`);
    assert.strictEqual(judgedR, A_REV.length, `未变异副本窄口径族应判 ${A_REV.length}，实测 ${judgedR}`);
    const fp = BENIGN_SLOT.filter(s => m.checkPseudoCausal(s).count > 0);
    assert.deepStrictEqual(fp, [], '未变异副本良性句应零误伤');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── E 族：存量攻击族一条不许塌（r233~r238 六轮红队集）───────────────────
const LEGACY_ATTACK = [
  // r237 A 族（收束词 + 夹逗号 + 显式归因链接）
  '打那以后球队就再也没输过，说到底，是因为换了教练',
  '从那以后店里生意也稳了，归根结底，是因为门口摆了招财摆件',
  '换了这个头像之后签单就多了，说穿了，是由于客户更信任我们了',
  '自从改了签名他就再也没被拒过，说到底，是因为签名旺了财',
  '带了新手链之后他就没再失误过，归根结底，是由于手链辟了邪',
  '试了三天新流程之后客诉就降了，归根结底，是由于新流程更顺',
  '拜了财神之后这个月业绩就翻倍了，说到底，是因为财神显灵',
  '换了主管之后团队就再也没加班到半夜，说穿了，是因为风水顺了',
  '转了运气帖之后他就真上岸了，说到底，是由于帖子灵验',
  '请了貔貅之后店里的现金流就再没断过，归根结底，是因为貔貅招财',
  // r237 B 族（收束词 + 夹逗号 + 归责名词）
  '从那以后店里生意也稳了，说到底，功劳全在这个摆件上',
  '打了新补丁之后系统就再没崩过，归根结底，功劳是那次重构的',
  '上了新系统之后客诉也降了，说到底，首功当属新系统',
  '拜了佛之后订单就一直很稳，说到底，之功全在这炷香上',
  '换了头像之后他就再没丢过单，归根结底，功劳全在这个头像上',
  '试了新工具之后团队就再没加班，说到底，首功是这把新椅子',
  '转了锦鲤之后他就再没挂过科，说穿了，功劳全在锦鲤身上',
  // r237 C 族（转述词 + 夹逗号）
  '从那以后店里也再没出过岔子，都说是，换了招牌的功劳',
  '自从改了签名之后他就再也没被拒过，据说，是因为签名旺了财',
  '换了主管之后团队就再没乱过，听说，是由于主管镇得住',
  '试了新流程之后客诉也降了，据说，是因为新流程清掉了瓶颈',
  '换了昵称之后粉丝就涨了，听说，功劳全在这个昵称上',
  // r360 正序族
  '因为今天下雨，所以股票会涨',
  '由于他穿了红衣服，所以项目顺利签单',
  '因为早上转了锦鲤，所以这单谈成了',
  '全靠这个风水摆件，今年业绩翻了倍',
  '多亏那天穿了红袜子，这次中标了',
  '由于星座运势好，所以这轮考核通过了',
  '由于本命年戴了辟邪手链，所以他升职了',
  '因为转发了好运帖，所以客户当天就下单',
  '由于换了招财头像，这个月的订单明显多了',
];

test(`E1 存量攻击族一条不塌（${LEGACY_ATTACK.length} 条全命中）`, () => {
  const bad = LEGACY_ATTACK.filter(s => !pcHit(s));
  assert.deepStrictEqual(bad, [], '以下存量攻击句塌陷:\n  ' + bad.join('\n  '));
});

// ─── F 族：源码常量锚点 ─────────────────────────────────────────────────
test('F1 PC_SLOT_MECH_ZH 五条腿齐备 + 两张机制表词一个没删', () => {
  const legLine = n => SRC_TEXT.split('\n').find(l => l.startsWith('const ' + n + ' = '));
  for (const n of LEG_NAMES) assert.ok(legLine(n), '缺腿定义: ' + n);
  assert.ok(legLine('PC_SLOT_MECH_LEG_A').includes("PC_ATTR_LINK_ZH.source + '[^。，,]{0,16}"),
    '缺腿 A（显式归因链接 ≤16 字）');
  assert.ok(legLine('PC_SLOT_MECH_LEG_B').includes("[^。，,]{0,6}(?:的功劳|之功|首功|头功)"),
    '缺腿 B（机制词 + 领属归责名词 ≤6 字）');
  assert.ok(legLine('PC_SLOT_MECH_LEG_C').includes("(?:的功劳|之功|首功|头功)[^。，,]{0,12}"),
    '缺腿 C（归责名词在前 ≤12 字）');
  assert.ok(legLine('PC_SLOT_MECH_LEG_D').includes('PC_ATTROBJ_UNION_ZH.source'),
    '缺腿 D（机制词在前 × 同子句共现）');
  assert.ok(legLine('PC_SLOT_MECH_LEG_E').includes('PC_ATTROBJ_UNION_ZH.source'),
    '缺腿 E（玄学对象在前 × 同子句共现）');
  // 位置收窄的纪律：每条腿的窗口都是**否定字符类**，句读一律在排除表里；
  // 腿 A/B/C 只排句号逗号（与 r238 同款），同子句双腿 D/E 还要排 ！？；; 与换行。
  for (const n of LEG_NAMES) {
    const l = legLine(n);
    const open = l.indexOf('[^');
    assert.ok(open >= 0, '腿 ' + n + ' 找不到否定字符类窗口');
    const close = l.indexOf(']', open);
    assert.ok(close > open, '腿 ' + n + ' 的字符类没闭合');
    const cls = l.slice(open + 2, close);
    for (const ch of ['。', '，', ',']) {
      assert.ok(cls.includes(ch), '腿 ' + n + ' 的窗口未排除子句界字符 ' + ch);
    }
    if (n === 'PC_SLOT_MECH_LEG_D' || n === 'PC_SLOT_MECH_LEG_E') {
      // 换行排除串单放常量 PC_SLOT_NL（round-324 双转义 lint），字符类里拼的是它的名字
      for (const ch of ['！', '？', '；', ';']) {
        assert.ok(cls.includes(ch), '同子句腿 ' + n + ' 的窗口未排除 ' + ch + '（跨子句不豁免）');
      }
      assert.ok(cls.includes('PC_SLOT_NL'), '同子句腿 ' + n + ' 的窗口未拼 PC_SLOT_NL（换行不跨）');
    }
  }
  assert.ok(SRC_TEXT.includes('PC_SLOT_MECH_LEG_A, PC_SLOT_MECH_LEG_B, PC_SLOT_MECH_LEG_C, PC_SLOT_MECH_LEG_D, PC_SLOT_MECH_LEG_E'),
    'PC_SLOT_MECH_ZH 拼装行缺腿');
  assert.ok(SRC_TEXT.includes('const PC_LUCK2_MECH_ZH = /'), 'PC_LUCK2_MECH_ZH 定义丢失');
  assert.ok(SRC_TEXT.includes('const PC_REV_MECH_ZH = /'), 'PC_REV_MECH_ZH 定义丢失');
  // 四处 guard 调用点都带 slotMech
  for (const anchor of [
    "if (pat === PC_CAUSAL_ZH_PATS[10] && luckMech && slotMech) continue;",
    "if (pat === PC_CAUSAL_ZH_PATS[11] && revMech && slotMech) continue;",
    "if (pat === PC_CAUSAL_ZH_PATS[12] && revMech && slotMech) continue;",
    "if (pat === PC_CAUSAL_ZH_PATS[13] && (luckMech || revMech) && slotMech) continue;",
  ]) {
    assert.strictEqual(SRC_TEXT.split(anchor).length - 1, 1, `guard 调用点缺失或不唯一: ${anchor}`);
  }
});

test('F2 PC_LUCK2_MECH_ZH 补的 11 个可核查努力词在场（既有词一个没删）', () => {
  const line = SRC_TEXT.split('\n').find(l => l.includes('const PC_LUCK2_MECH_ZH = /'));
  for (const w of ['跑步', '晨跑', '夜跑', '健身', '早睡', '节食', '冥想', '拉伸', '游泳', '步行', '深呼吸']) {
    assert.ok(line.includes(w), `缺可核查努力词 ${w}`);
  }
  // 既有词抽查（防止整表被重写）
  for (const w of ['缓存', '索引', '灰度', '回滚', '样本量', '实验组', '对照组', '复盘', '排期', '交付',
    '坚持', '习惯', '自律', '锻炼', '复习', '加班', '排查', '机制', '原因', '导致', '方案', '报价', '攻坚']) {
    assert.ok(line.includes(w), `既有词 ${w} 丢失`);
  }
  // 纪律：不收结果指标名词
  for (const w of ['瘦了', '轻了']) {
    assert.ok(!line.includes(w), `不应收结果指标名词 ${w}`);
  }
});

test('F3 dimensions 键数 210 不变（本轮未加维度，只改护栏位置）', () => {
  const keys = Object.keys(idx.discriminate('测试句子').dimensions || {});
  assert.strictEqual(keys.length, 210, `dimensions 键数应为 210，实测 ${keys.length}`);
});

// ─── G 族：已知未修登记 ─────────────────────────────────────────────────
test('G1 已知未修①【r240 修一半、r241 修完，登记翻正】：支③「变量/回归」已位置化为统计搭配形', () => {
  // [v6.8.168 第 240 轮] 「机制」一词已修（PC_HEDGE_ZH 裸词腿位置化成
  // PC_HEDGE_MECH_ZH 四腿，红队 5 条 HEAD 漏判 → 0）。
  // [v6.8.169 第 241 轮] 「变量/回归」也已修（STAT_CONTEXT_ZH 支③位置化成
  // STAT_VAR_ZH / STAT_REG_ZH 统计搭配形，红队 10 条 HEAD 漏判 → 0）。
  // 剩余缺口见 r241 测试 G1：统计搭配形出现在**结果侧**时仍整句豁免
  // （「换了头像，所以业绩自变量也上去了」），该缺口对支③全部词条成立
  // （「…红袜子之功，工具变量也控制了」同样漏），是豁免表层性问题而非
  // 本轮引入，需单独轮次做「归因对象位」化。
  for (const s of ['自从机制稳了之后签单就多了，说到底是因为穿了红袜子',
    '自从变量稳了之后签单就多了，说到底是因为穿了红袜子',
    '自从回归稳了之后签单就多了，说到底是因为穿了红袜子']) {
    assert.ok(pcCount(s) > 0, '该句已被 r240/r241 修掉（裸词腿位置化），应判: ' + s);
  }
});

test('G2 已知未修②：PC_DRUG_MECH_ZH / PC_SUPP_MECH_ZH 跨表医疗词统一仍未做', () => {
  const drug = SRC_TEXT.match(/const PC_DRUG_MECH_ZH = [^\n]*;/)[0];
  const supp = SRC_TEXT.match(/const PC_SUPP_MECH_ZH = [^\n]*;/)[0];
  assert.ok(drug.includes('药师') === false && supp.includes('药师'),
    'DRUG 表仍无「药师」——跨表统一未做（若已统一请同步本条）');
});

test('G3 已知未修③：PC_RITE_MECH_ZH（仪式族）仍是整句豁免，未位置化', () => {
  // 仪式族子判据 causalRiteZh 用的 PC_RITE_MECH_ZH 是 REV∪DRUG∪SUPP 的并集，
  // 仍是整句在场即豁免——同一形态的第二处，本轮只做⑪⑫⑬⑭ 四支（一个主题）。
  assert.ok(SRC_TEXT.includes('const PC_RITE_MECH_ZH = new RegExp('), 'PC_RITE_MECH_ZH 定义应仍在');
  // 仪式族专属 victim：甲半「去庙里/开了光」× 乙半「签单」，无⑪⑫⑬⑭ 的形状
  // （无 REV_RES 前置、无 NOOBJ 在归因位），只有 causalRiteZh 自己判——它吃的
  // PC_RITE_MECH_ZH 仍是 REV∪DRUG∪SUPP 整句并集，机制词在别处就整句放行。
  const s = '去庙里开了光之后签单就多了，都是因为庙里很灵';
  assert.strictEqual(pcCount(s), 2, '仪式族 victim 仍由 causalRiteZh 判（整句豁免未位置化）: ' + s);
  const s2 = '去庙里开了光之后签单就多了，都是因为庙里很灵，扩容也确实上了';
  assert.strictEqual(pcCount(s2), 0, '机制词在第三个子句仍被仪式族整句豁免（缺口未修）: ' + s2);
});

test('G4 已知未修④：causalInvertedTakeZh / causalSupplementZh 的 lastIndex 防空匹配防护前移仍未做', () => {
  // r231/r233/r236/r238 四次记过的同款脆弱结构：防空匹配防护在 continue 之后。
  const src = SRC_TEXT;
  const inv = src.indexOf('function causalInvertedTakeZh');
  assert.ok(inv > 0, 'causalInvertedTakeZh 定义应存在');
  assert.ok(src.includes('if (actRe.lastIndex === m.index) actRe.lastIndex++;'),
    '防空匹配防护应仍在原位置（本轮未动，登记备查）');
});

process.on('exit', () => {
  const pass = RESULTS.filter(r => r.ok).length;
  console.log(`round-239-rev-mech-attribution-slot: ${pass} 通过, ${RESULTS.length - pass} 失败, 共 ${RESULTS.length} 个`);
});
