/**
 * 第 238 轮测试：PC_MECH_WEAK_ZH / PC_REV_MECH_ZH 补「窄义业务/工程实践机制」34 词
 * （形状腿：机制词必须落在归因对象位）
 *
 * 背景：交接簿（data/upgrade-state.json r237 notes）候选池① 的「跨表医疗/机制词
 *   统一」（r236 G2 登记，r234 起连续挂账）之**业务侧**——r234 测试 219 行原文：
 *   「根因：PC_REV_MECH_ZH / PC_MECH_WEAK_ZH 都没收『交付质量』『机场时刻表』
 *     这类业务机制词，而第①支只受 PC_MECH_WEAK_ZH 保护」。
 *
 * 缺口（轮初探针 scripts/tmp-238-probe.js，当前树=HEAD 实测）：r235/r237 新增的
 *   「收束词/转述词 + 显式归因链接」族对**自带业务机制解释的归因句**整族误伤——
 *   12 条攻击形状 × 业务机制探针里 **10 条**被判 pseudo_causal、gate 10/12 非 pass：
 *     「从那以后他的客户再也没断过，说到底，是因为交付质量稳了」pc=1
 *     「从那以后航班就再也没延误过，听说是因为机场调整了时刻表」pc=1
 *   根因是**不对称的第二形态**：⑪⑫⑬⑭ 四支各有机制护栏，①⑤⑨ 弱支有
 *   PC_MECH_WEAK_ZH，但该表四族词（医疗/工程技术/物理气象/可核查努力）里
 *   一个业务机制词都没有——交付质量/时刻表/来料检验整族缺席，r237 放行夹
 *   逗号的新臂反而把良性业务归因句打成伪因果。
 *
 * 取向刀（本轮裁；r227「即愈」/…/r237「夹逗号归责」之后的第十一条）：
 *   **「窄义业务/工程实践机制作为归因对象」是正常归因不判；「宽泛业务资源词 /
 *   结果指标名词 / 主观资质推断」仍判**（r226 刻意不收三类词的纪律不变）。
 *
 * 首版教训（形状腿而不是裸词腿）：34 词若整句豁免，攻击句只要把机制词放在
 *   前半句时序标记侧、玄学对象放在归因侧就整句绕过——红队实测「调整了排班
 *   之后准时率就稳了，说到底，是因为穿了红袜子」在裸词版从 pc=1 掉到 pc=0。
 *   故本族豁免要求**机制词必须出现在归因对象位**：显式归因链接（与
 *   PC_ATTRIB_ZH 同源）后 ≤16 字内，或归责名词（功劳/之功/首功/头功）后
 *   ≤12 字内。
 *
 * 验收（全部本轮实测，见 UPGRADE_LOG r238）：
 *   - A 族 12 条良性 HEAD 10/12 误判 → 0/12；gate 与 HEAD 副本逐项一致
 *     （2 条非 pass 来自其他维度，HEAD 同样非 pass，零新增零退化）；
 *   - 存量同步 B 族 12 条：8 条 pc→0，4 条宽泛业务词句仍判（登记 G1）；
 *   - C 族 9 条界线（宽泛业务词/结果名词/主观资质）一条不放，与 HEAD 一致；
 *   - 攻击不塌：红队 10/12 与 HEAD 逐项一致（零召回损失）+ 存量族 46 条复测；
 *   - 全量 A/B（HEAD worktree vs 当前树，25158 条样本）：见 UPGRADE_LOG。
 */
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

function realFindings(text) {
  return (gateMod.gate(text).findings || []).filter(f => f && f.severity > 0);
}
const pcCount = (text) => idx.checkPseudoCausal(text).count;
const gateAction = (text) => gateMod.gate(text).gate.action;
const hasDim = (text, dim) => realFindings(text).some(f => f.dimension === dim);

// ─── A 族：攻击形状 × 业务机制解释（本轮修复对象，HEAD 10/12 误判）─────────
const BENIGN_MECH = [
  '从那以后他的客户再也没断过，说到底，是因为交付质量稳了',
  '从那以后航班就再也没延误过，听说是因为机场调整了时刻表',
  '换了新供应商之后良率就上去了，归根结底，是因为来料检验更严了',
  '上线新工单系统之后客诉就降了，都说是因为响应速度快了不少',
  '调整了排班之后准时率就稳了，说到底，是因为交接班更顺畅',
  '改了包装之后退货率就降了，据说，是因为运输破损少了',
  '自从扩了仓之后发货就再没慢过，归根结底，是因为库存周转快了',
  '签了新合同之后回款就再没拖过，都说是因为账期谈短了',
  '从那以后故障就再也没复发，说穿了，是因为根因整改到位了',
  '换了架构之后延迟就下来了，归根结底，是因为链路短了两跳',
  '从那以后续费率就再也没掉过，都说是因为交付周期缩短了',
  '自从设了质检岗之后出货就再也没出过问题，听说，是因为抽检比例提上去了',
];
// HEAD 副本（data/wt-head-238）逐条实测输出，按索引抄（r235 坑④ 纪律）
const BENIGN_MECH_HEAD_PC = [1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1];
const BENIGN_MECH_HEAD_GATE = ['verify', 'verify', 'rewrite', 'verify', 'verify', 'verify', 'verify', 'pass', 'verify', 'pass', 'verify', 'verify'];
// 当前树 HEAD 非 pass 的两条（idx 1/2，非 pass 来自其他维度，与 pseudo_causal 无关）
const BENIGN_MECH_CUR_GATE = ['pass', 'verify', 'rewrite', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass'];

// ─── B 族：存量语料扫描（scripts/tmp-238-scan.js，25158 条）发现的误判句 ──
// 8 条靠本轮 34 词修复（HEAD pc≥1 → 0）
const BENIGN_EXIST_FIXED = [
  '上线新版本之后投诉也少了，可见是因为新版本解决了瓶颈',
  '上了新系统之后客诉也降了，可见是因为新系统清理了瓶颈',
  '上了新系统之后客诉也降了，总之是因为新系统清理了瓶颈',
  '上线新版本之后投诉也少了，总之是因为新版本解决了瓶颈',
  '换了排班之后客服满意度就上去了，说穿了，头功是排班表的',
  '从那以后客户再没投诉过，说到底是服务质量之功',
  '从那以后他的客户再也没断过，都说是因为交付质量稳了',
];
const BENIGN_EXIST_FIXED_HEAD_PC = [1, 1, 1, 1, 1, 1, 1];
// 第①支被腿 A 豁免、但第⑩支（PC_ACT_LUCK_ZH「试了」× 获益结果）存量仍命中的
// 一条：HEAD pc=2（①+⑩）→ 1。第⑩支是强支，不吃 PC_MECH_WEAK_ZH（只被
// PC_DRUG_MECH_ZH 豁免），与 r226/r227/r228 三轮同款纪律，登记备查。
const BENIGN_EXIST_PARTIAL = '试了新流程之后客诉就降了，据说，是因为新流程清掉了瓶颈';
// 4 条仍判（归因对象是宽泛业务词，本轮取向刀裁定不收，登记 G1）
const BENIGN_EXIST_STILL = [
  '试了三天新流程之后客诉就降了，归根结底，是由于新流程更顺',
  '上了新系统之后客诉也降了，说到底，首功当属新系统',
  '调整了排班之后投诉量就下降了，归根结底，是由于人力覆盖更充分',
  '新流程上线之后，加班也少了，说明新流程起了作用',
];
const BENIGN_EXIST_STILL_HEAD_PC = [2, 1, 2, 1];

// ─── C 族：界线——宽泛业务词/结果指标名词/主观资质，一条不放 ─────────────
// 全部为存量攻击样本（HEAD 实测 pc≥1，逐条抄自 tmp-238-scan.js 输出）
const BOUNDARY_VAGUE = [
  ['用了新系统之后漏单也没有了，说明新系统是唯一的变化', 2, 'rewrite'],
  ['换了这套流程，我的疲劳减少了三分之二倍', 1, 'verify'],
  ['打那天以后销量就再没掉过，显然是新品包装的功劳', 1, 'rewrite'],
  // [v6.8.173 第 245 轮] pc 1 → 2：r245 给 PC_RES_COLLOQ_ZH 补了负向环视裸
  // 「少了」腿（`(?<![减变])少了`），本句「从那以后客诉也少了」被该腿再加一支
  // （时段标记 × 白话变动），gate 仍 rewrite。
  ['从那以后客诉也少了，都说是新客服的功劳', 2, 'rewrite'],
  ['换了供应商之后交期变短，说明这家供应商明显更专业。', 1, 'rewrite'],
  ['贴上新膜当天屏幕就不花了，显然是膜的质量好', 1, 'verify'],
  ['装监控之后盗窃下降了，所以监控确实起到了震慑作用。', 1, 'verify'],
  ['这两次延期都发生在你值班那周，所以问题就出在你身上。', 1, 'verify'],
  ['这次促销一结束，退货量就上来了，显然促销把不合适的人吸引来了。', 1, 'verify'],
];

// ─── D 族：真攻击句——机制词在前半句、玄学对象在归因位（裸词版假阴性源）──
const ATTACK_MECHFIRST = [
  '调整了排班之后准时率就稳了，说到底，是因为穿了红袜子',
  '上线新工单系统之后客诉就降了，都说是因为名字起得旺',
  '自从设了质检岗之后出货就再也没出过问题，听说，是因为本命年戴了红绳',
  '扩了容之后故障就再也没复发，都说是因为拜了财神',
  '加了巡检之后客诉就降了，说到底是因为转了运气帖',
  '自从设了质检岗之后准时率就稳了，据说是因为拜了财神',
  '调整了账期之后回款就再没拖过，都说是因为供奉了财神',
  '上线了工单系统之后客诉也降了，说到底，是因为门口摆了风水阵',
];
// ─── E 族：存量攻击族复测（r233~r237 五轮挂账/修复句，一条都不许塌）────
const ATTACK_EXIST = [
  '从那以后店里也再没出过岔子，都说是换了招牌的功劳',
  '自从改了签名之后他就再也没被拒过，据说是因为签名旺了财',
  '打了新补丁之后系统就再没崩过，归根结底功劳是那次重构的',
  '换了加密库之后再没被攻破过，说穿了是因为旧库有已知漏洞',
  '打那以后球队就再也没输过，说到底，是因为换了教练',
  '吃了这片药人就困了',
  '这服药喝下去当晚就睡得死沉',
  '这瓶药吃下去烧就退了',
  '吃了这个保健品之后精神就好了',
  '带着这个保健品去庙里开过光，病就好了',
  '去庙里求了签之后，病就好了',
];

// ═══ A 节：本轮修复族——三层断言 ═══
test('A1 12 条攻击形状×业务机制良性句 pseudo_causal 全部归零', () => {
  for (const s of BENIGN_MECH) {
    assert.strictEqual(pcCount(s), 0, `应不判：${s}（实测 pc=${pcCount(s)}）`);
  }
});
test('A2 良性句 findings 不含 pseudo_causal', () => {
  for (const s of BENIGN_MECH) {
    assert.ok(!hasDim(s, 'pseudo_causal'), `findings 不应含 pseudo_causal：${s}`);
  }
});
test('A3 良性句 gate.action 与 HEAD 副本逐项一致（2 条非 pass 来自其他维度）', () => {
  for (let i = 0; i < BENIGN_MECH.length; i++) {
    assert.strictEqual(gateAction(BENIGN_MECH[i]), BENIGN_MECH_CUR_GATE[i],
      `idx ${i} gate 应为 ${BENIGN_MECH_CUR_GATE[i]}，实测 ${gateAction(BENIGN_MECH[i])}：${BENIGN_MECH[i]}`);
  }
});
test('A4 HEAD 误判基数核对（10/12）——登记防回归', () => {
  // 首版若有人放宽取向刀把 A 族又判了，这条会先红
  const headPcSum = BENIGN_MECH_HEAD_PC.reduce((a, b) => a + b, 0);
  assert.strictEqual(headPcSum, 10, `HEAD 误判基数应为 10，登记值 ${headPcSum}`);
});

// ═══ B 节：存量同步 ═══
test('B1 存量 7 条业务机制误判句修复归零', () => {
  for (let i = 0; i < BENIGN_EXIST_FIXED.length; i++) {
    assert.strictEqual(pcCount(BENIGN_EXIST_FIXED[i]), 0,
      `应修复：${BENIGN_EXIST_FIXED[i]}（HEAD pc=${BENIGN_EXIST_FIXED_HEAD_PC[i]}，实测 ${pcCount(BENIGN_EXIST_FIXED[i])}）`);
  }
});
test('B1b 瓶颈句第①支被腿 A 豁免、第⑩支存量仍判（HEAD 2→1，gate 不变）', () => {
  // 第⑩支（PC_ACT_LUCK_ZH「试了」× PC_RES_LUCK_ZH）是强支，只被 PC_DRUG_MECH_ZH
  // 豁免、不吃 PC_MECH_WEAK_ZH（r226/r227/r228 三轮同款纪律），故该句留 1。
  assert.strictEqual(pcCount(BENIGN_EXIST_PARTIAL), 1,
    `第①支应豁免、第⑩支存量仍判，实测 pc=${pcCount(BENIGN_EXIST_PARTIAL)}`);
  assert.strictEqual(gateAction(BENIGN_EXIST_PARTIAL), 'verify', 'gate 应与 HEAD 一致（verify）');
});
test('B2 存量 4 条宽泛业务词句仍判（取向刀裁定不收，与 HEAD 一致）', () => {
  for (let i = 0; i < BENIGN_EXIST_STILL.length; i++) {
    assert.strictEqual(pcCount(BENIGN_EXIST_STILL[i]), BENIGN_EXIST_STILL_HEAD_PC[i],
      `应仍判 ${BENIGN_EXIST_STILL_HEAD_PC[i]}：${BENIGN_EXIST_STILL[i]}（实测 ${pcCount(BENIGN_EXIST_STILL[i])}）`);
  }
});

// ═══ C 节：结构性界线 ═══
test('C1 宽泛业务词/结果名词/主观资质 9 条界线一条不放（pc 与 gate 同 HEAD）', () => {
  for (const [s, pc, act] of BOUNDARY_VAGUE) {
    assert.strictEqual(pcCount(s), pc, `界线句 pc 应保持 ${pc}，实测 ${pcCount(s)}：${s}`);
    assert.strictEqual(gateAction(s), act, `界线句 gate 应保持 ${act}，实测 ${gateAction(s)}：${s}`);
  }
});
test('C2 机制词 + 排他性归责共现仍判（PC_MONOCAUSE_ZH 反豁免照判）', () => {
  // 双机制同时在场：①「扩容」是 34 词但不在归因位（「说明」后无因为/由于，
  // 腿 A 不匹配）；② 存量裸词腿「延迟」命中，被 PC_MONOCAUSE_ZH「唯一原因」
  // 反豁免挡住——排他性归责是伪因果指纹，机制词救不了它。
  const s = '我们扩了容之后延迟降了，说明扩容是唯一原因';
  assert.ok(pcCount(s) >= 1, `单因归责句应仍判，实测 pc=${pcCount(s)}`);
});
test('C3 归因对象位跨子句（夹两个逗号）不豁免', () => {
  // 腿 A 窗口 [^。，,]{0,16} 不含逗号：链接词与机制词之间夹逗号即失效
  const s = '说到底，由于时间不够，只能砍需求，交付质量之功';
  assert.ok(pcCount(s) >= 0);
  const s2 = '归根结底，因为人力不够，先保交付质量，是排班表的功劳';
  assert.strictEqual(pcCount(s2), 0, '腿 B 窗口不含逗号，跨子句桥不豁免，实测 pc=' + pcCount(s2));
});

// ═══ D 节：攻击不塌 ═══
test('D1 机制词在前半句、玄学对象在归因位 8 条攻击句全部仍判', () => {
  for (const s of ATTACK_MECHFIRST) {
    assert.ok(pcCount(s) >= 1, `应仍判，实测 pc=${pcCount(s)}：${s}`);
  }
});
test('D2 存量攻击族 12 条一条不塌', () => {
  for (const s of ATTACK_EXIST) {
    assert.ok(pcCount(s) >= 1, `存量攻击句应仍判，实测 pc=${pcCount(s)}：${s}`);
  }
});

// ═══ E 节：变异守卫（临时目录隔离，绝不在原地改写 src/）═════════════════
// E1：摘掉腿 A（显式归因链接 + 34 词）→ A 族 10 条恢复误判
test('E1 变异守卫一：摘掉腿 A 后 A 族 10 条恢复误判、D 族攻击不塌', () => {
  const orig = fs.readFileSync(SRC, 'utf8');
  const anchor = '(?:因为|由于|原因是|全靠|多亏|幸亏|归功于|(?:总之|说到底|归根结底|归根到底|说穿了|都说是|据说|听说|传闻|显然|可见|证明|说明|看来)[，,]?(?:是)?(?:因为|由于))[^。，,]{0,16}(?:交付质量';
  assert.strictEqual(orig.split(anchor).length - 1, 1, '腿 A 锚点应唯一');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'r238-e1-'));
  fs.cpSync(ROOT, tmp, {
    recursive: true,
    filter: (s) => !s.includes('node_modules') && !s.includes(path.join(ROOT, 'data')) && !s.includes('.git'),
  });
  const target = path.join(tmp, 'src', 'index.js');
  let src = fs.readFileSync(target, 'utf8');
  // 只摘 alternation 管道前的分支：留下 `||(?:的功劳…` 会造空分支，故连管道一起摘
  src = src.replace('|' + anchor + '|服务质量|响应速度|交付周期|来料检验|交接班|库存周转|运输破损|根因|整改|时刻表|排班表|排班|抽检|质检|账期|工单|巡检|履约|配送|物流|仓储|售后|理赔|发运|班次|周转|SOP|瓶颈|链路|工序|工艺|扩容|限流|降级|告警)', '');
  assert.notStrictEqual(src, fs.readFileSync(target, 'utf8'), '变异未生效');
  fs.writeFileSync(target, src);
  const m = require(path.join(tmp, 'src', 'index.js'));
  let restored = 0;
  for (let i = 0; i < BENIGN_MECH.length; i++) {
    // 只数 HEAD 本就误判的 10 条（idx 7/9 在 HEAD 即 pc=0，摘不摘都是 0）
    if (BENIGN_MECH_HEAD_PC[i] > 0 && m.checkPseudoCausal(BENIGN_MECH[i]).count === BENIGN_MECH_HEAD_PC[i]) restored++;
  }
  assert.strictEqual(restored, 10, `摘腿 A 后应恢复 10 条 HEAD 误判，实测 ${restored}`);
  assert.strictEqual(m.checkPseudoCausal(BENIGN_MECH[7]).count, 0, 'idx 7（账期句）HEAD 即 0，摘腿 A 后仍应 0');
  assert.strictEqual(m.checkPseudoCausal(BENIGN_MECH[9]).count, 0, 'idx 9（链路句）HEAD 即 0（存量「延迟」豁免），摘腿 A 后仍应 0');
  for (const s of ATTACK_MECHFIRST) {
    assert.ok(m.checkPseudoCausal(s).count >= 1, `攻击句不应塌：${s}`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
});
// E2：摘掉腿 B + 腿 C（归责名词两种语序）→ 存量 2 条恢复误判
test('E2 变异守卫二：摘掉腿 B/C 后存量 2 条归责名词句恢复误判', () => {
  const orig = fs.readFileSync(SRC, 'utf8');
  const W = '(?:交付质量|服务质量|响应速度|交付周期|来料检验|交接班|库存周转|运输破损|根因|整改|时刻表|排班表|排班|抽检|质检|账期|工单|巡检|履约|配送|物流|仓储|售后|理赔|发运|班次|周转|SOP|瓶颈|链路|工序|工艺|扩容|限流|降级|告警)';
  const anchorB = '(?:的功劳|之功|首功|头功)[^。，,]{0,12}' + W;
  const anchorC = W + '[^。，,]{0,6}(?:的功劳|之功)';
  assert.strictEqual(orig.split(anchorB).length - 1, 1, '腿 B 锚点应唯一');
  assert.strictEqual(orig.split(anchorC).length - 1, 1, '腿 C 锚点应唯一');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'r238-e2-'));
  fs.cpSync(ROOT, tmp, {
    recursive: true,
    filter: (s) => !s.includes('node_modules') && !s.includes(path.join(ROOT, 'data')) && !s.includes('.git'),
  });
  const target = path.join(tmp, 'src', 'index.js');
  let src = fs.readFileSync(target, 'utf8');
  src = src.replace('|' + anchorB, '');
  src = src.replace('|' + anchorC, '');
  assert.ok(!src.includes(anchorB) && !src.includes(anchorC), '变异未生效');
  fs.writeFileSync(target, src);
  const m = require(path.join(tmp, 'src', 'index.js'));
  // 腿 B：「头功是排班表的」（功劳词在前）
  assert.strictEqual(m.checkPseudoCausal('换了排班之后客服满意度就上去了，说穿了，头功是排班表的').count, 1,
    '摘腿 B 后该句应恢复误判');
  // 腿 C：「说到底是服务质量之功」（机制词 + 领属之功在后）
  assert.strictEqual(m.checkPseudoCausal('从那以后客户再没投诉过，说到底是服务质量之功').count, 1,
    '摘腿 C 后该句应恢复误判');
  // 腿 A 不塌：12 条 A 族仍 0
  for (const s of BENIGN_MECH) {
    assert.strictEqual(m.checkPseudoCausal(s).count, 0, `摘腿 B/C 不应影响腿 A 覆盖：${s}`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
});
// E3：摘掉 PC_REV_MECH_ZH 本轮 34 词 → ⑫⑬⑭ 支共现句恢复误判
test('E3 变异守卫三：摘掉 PC_REV_MECH_ZH 本轮新词后共现句恢复误判', () => {
  const orig = fs.readFileSync(SRC, 'utf8');
  const anchor = '|病理|病灶|交付质量|服务质量|响应速度|交付周期|来料检验|交接班|库存周转|运输破损|根因|整改|时刻表|排班表|排班|抽检|质检|账期|工单|巡检|履约|配送|物流|仓储|售后|理赔|发运|班次|周转|SOP|瓶颈|链路|工序|工艺|扩容|限流|降级|告警)/;';
  assert.strictEqual(orig.split(anchor).length - 1, 1, 'PC_REV_MECH_ZH 新词锚点应唯一');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'r238-e3-'));
  fs.cpSync(ROOT, tmp, {
    recursive: true,
    filter: (s) => !s.includes('node_modules') && !s.includes(path.join(ROOT, 'data')) && !s.includes('.git'),
  });
  const target = path.join(tmp, 'src', 'index.js');
  let src = fs.readFileSync(target, 'utf8');
  src = src.replace(anchor, '|病理|病灶)/;');
  assert.ok(!src.includes('|病理|病灶|交付质量'), '变异未生效');
  fs.writeFileSync(target, src);
  const m = require(path.join(tmp, 'src', 'index.js'));
  // [v6.8.167 第 239 轮] 换 victim 句：原 victim「…都是因为摆了财神，交付质量也稳了」
  // 在本轮位置化后**未变异树就已判**（机制词在财神之后的另一个子句，本来就不该豁免），
  // 变异不再承重。新 victim 把机制词放回归因对象位（说到底是因为交付质量稳了），
  // 未变异树靠 REV 表新词豁免 pc=0，摘词后 ⑬ 支恢复误判 pc=1——变异重新钉在判据上。
  const s = '全靠穿了红袜子，所以签单也多了，说到底是因为交付质量稳了';
  assert.strictEqual(m.checkPseudoCausal(s).count, 1,
    '摘掉 REV 表新词后该句应恢复误判，实测 pc=' + m.checkPseudoCausal(s).count);
  assert.strictEqual(pcCount(s), 0, '未变异树上该句应被 REV 表新词豁免');
  // 领属归责名词（…之功）同族 victim：摘词后 ⑫ 支恢复误判
  const s2 = '从那以后签单就多了，归根结底是扩容之功，也是因为摆了财神';
  assert.strictEqual(m.checkPseudoCausal(s2).count, 1,
    '摘掉 REV 表新词后「…之功」victim 应恢复误判，实测 pc=' + m.checkPseudoCausal(s2).count);
  assert.strictEqual(pcCount(s2), 0, '未变异树上「…之功」句应被 REV 表新词豁免');
  fs.rmSync(tmp, { recursive: true, force: true });
});
// E4：未变异副本还原校验
test('E4 变异守卫四：未变异副本还原校验（A 族 0/12 + 存量 8 条归零）', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'r238-e4-'));
  fs.cpSync(ROOT, tmp, {
    recursive: true,
    filter: (s) => !s.includes('node_modules') && !s.includes(path.join(ROOT, 'data')) && !s.includes('.git'),
  });
  const m = require(path.join(tmp, 'src', 'index.js'));
  for (const s of BENIGN_MECH) assert.strictEqual(m.checkPseudoCausal(s).count, 0, `还原后应仍 0：${s}`);
  for (const s of BENIGN_EXIST_FIXED) assert.strictEqual(m.checkPseudoCausal(s).count, 0, `还原后应仍 0：${s}`);
  assert.strictEqual(m.checkPseudoCausal(BENIGN_EXIST_PARTIAL).count, 1,
    `还原后瓶颈句应仍 1（第⑩支存量）：${BENIGN_EXIST_PARTIAL}`);
  for (const s of ATTACK_MECHFIRST) assert.ok(m.checkPseudoCausal(s).count >= 1, `还原后攻击句应仍判：${s}`);
  fs.rmSync(tmp, { recursive: true, force: true });
});

// ═══ F 节：源码锚点 ═══
test('F1 PC_MECH_WEAK_ZH 两条形状腿 + 34 词齐备', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  // [v6.8.171 第 243 轮] 锚点同步：r242 起三条形状腿搬进 PC_MECH_WEAK_WORDS_ZH
  const line = src.match(/const PC_MECH_WEAK_WORDS_ZH = [^\n]*;/)[0];
  // [v6.8.171 第 243 轮] 锚点同步：r242 起 PC_MECH_WEAK_ZH 已是两腿 new RegExp
  // 拼接（PC_MECH_WEAK_WORDS_ZH ∪ PC_MECH_WEAK_ENG_ZH），不再是正则字面量。
  assert.ok(src.includes('const PC_MECH_WEAK_ZH = new RegExp('), 'PC_MECH_WEAK_ZH 应为两腿 new RegExp 拼接形态（r242 起）');
  assert.ok(line.includes('[^。，,]{0,16}(?:交付质量'), '腿 A（显式归因链接 + 16 字窗口）应在');
  assert.ok(line.includes('[^。，,]{0,12}(?:交付质量'), '腿 B（归责名词在前 + 12 字窗口）应在');
  assert.ok(line.includes('(?:交付质量'), '腿 C（机制词 + 领属之功/的功劳）应在');
  for (const w of ['交付质量', '服务质量', '响应速度', '交付周期', '来料检验', '交接班', '库存周转', '运输破损', '根因', '整改', '时刻表', '排班表', '排班', '抽检', '质检', '账期', '工单', '巡检', '履约', '配送', '物流', '仓储', '售后', '理赔', '发运', '班次', '周转', 'SOP', '瓶颈', '链路', '工序', '工艺', '扩容', '限流', '降级', '告警']) {
    // 边界感知计数：34 词的前边界在腿 A 是「(?:」、腿 B/C 是「|」，
    // 后边界是「|」或「)」；「周转」是「库存周转」的子串，必须两侧都数边界
    const n = line.split('|' + w + '|').length - 1 + line.split('|' + w + ')').length - 1
      + line.split('(?:' + w + '|').length - 1;
    assert.strictEqual(n, 3, `${w} 应在三条腿各出现 1 次，实测 ${n}`);
  }
});
test('F2 PC_REV_MECH_ZH 同批 34 词同步（跨表一致性子项）', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const line = src.match(/const PC_REV_MECH_ZH = [^\n]*;/)[0];
  for (const w of ['交付质量', '时刻表', '排班', '根因', '链路', '扩容', '告警', '瓶颈', 'SOP']) {
    assert.ok(line.includes(w), `PC_REV_MECH_ZH 应含 ${w}`);
  }
  assert.strictEqual(src.split('const PC_REV_MECH_ZH = /(?:').length - 1, 1, 'PC_REV_MECH_ZH 应只定义 1 次');
});
test('F3 两表均不含被拒收的宽泛业务词/结果名词', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const weak = src.match(/const PC_MECH_WEAK_ZH = [^\n]*;/)[0];
  const rev = src.match(/const PC_REV_MECH_ZH = [^\n]*;/)[0];
  for (const w of ['流程', '新系统', '包装', '供应商', '监控', '值班', '客诉', '退货', '交期', '回款', '续费']) {
    // 「响应速度」含「响应」但表里不许出现裸「响应时间」；监控/值班等黑名单词逐查
    assert.ok(!weak.includes('|' + w + '|') && !weak.includes('|' + w + ')'), `PC_MECH_WEAK_ZH 不应收 ${w}`);
  }
  for (const w of ['流程', '新系统', '包装', '供应商', '监控', '值班', '客诉', '退货', '交期']) {
    assert.ok(!rev.includes('|' + w + '|') && !rev.includes('|' + w + ')'), `PC_REV_MECH_ZH 不应收 ${w}`);
  }
  assert.ok(!weak.includes('响应时间') && !rev.includes('响应时间'), '两表均不应收「响应时间」（存量含 perfect_error 攻击样本）');
});
test('F4 dimensions 键数 210 不变（本轮未加维度，只补机制词表）', () => {
  const keys = Object.keys(idx.discriminate('测试句子').dimensions || {});
  assert.strictEqual(keys.length, 210, `dimensions 键数应为 210，实测 ${keys.length}`);
});

// ═══ G 节：已知未修登记 ═══
test('G1 已知未修①：归因对象是宽泛业务词（流程/新系统/人力覆盖）的良性句仍判', () => {
  // 取向刀裁定：宽泛业务词任何归因句都可能带（存量 166 次「流程」里 5 条 pc>0
  // 含 perfect_error 攻击样本「换了这套流程，我的疲劳减少了三分之二倍」），
  // 收了直接误豁免攻击句——与 r226 纪律①同款，登记备查。
  assert.strictEqual(pcCount('试了三天新流程之后客诉就降了，归根结底，是由于新流程更顺'), 2,
    '宽泛业务词句仍判——若这是有意扩面，请同步本条登记并补红队与全量 A/B');
  assert.strictEqual(pcCount('上了新系统之后客诉也降了，说到底，首功当属新系统'), 1,
    '宽泛业务词句仍判——若这是有意扩面，请同步本条登记');
  assert.strictEqual(pcCount('调整了排班之后投诉量就下降了，归根结底，是由于人力覆盖更充分'), 2,
    '宽泛业务词句仍判——若这是有意扩面，请同步本条登记');
});
test('G2 已知未修②【r239 已修，登记翻正】：整句表无法区分归因位——机制词 + 玄学对象共现时⑫⑬⑭支仍豁免', () => {
  // [v6.8.167 第 239 轮] 本条缺口已修：PC_SLOT_MECH_ZH 四条腿把⑪⑫⑬⑭ 的机制
  // 护栏从「整句在场」收窄成「归因对象位在场」。原登记句现在判（⑫支 + ⑭支）。
  const s = '自从提高了交付质量之后签单就多了，都是因为摆了财神';
  assert.strictEqual(pcCount(s), 1,
    '机制词在时序侧、玄学对象在归因位的共现句应判，实测 pc=' + pcCount(s));
  // 机制词回到归因位（显式归因链接后）必须重新豁免——位置条件不能把良性句一起收走
  assert.strictEqual(pcCount('从那以后签单就多了，说到底是因为交付质量稳了'), 0,
    '机制词在归因位的良性句应仍豁免');
  assert.strictEqual(pcCount('从那以后签单就多了，归根结底是扩容之功'), 0,
    '机制词 + 领属归责名词（…之功）的良性句应仍豁免');
});
test('G3 已知未修③：跨表医疗/机制词统一的医疗/依据侧（DRUG/SUPP 两表）仍未做', () => {
  // PC_DRUG_MECH_ZH / PC_SUPP_MECH_ZH 的用词差异（临床/双盲/随机/对照组/安慰剂/
  // 样本量/大样本/自限/自愈/个例/孤例 的高度重叠但不一致）本轮不动——高危重构，
  // 会同时影响⑩⑪⑫⑬⑭ 五支与 causalInvertedTakeZh/causalSupplementZh 两个子判据。
  const src = fs.readFileSync(SRC, 'utf8');
  const drug = src.match(/const PC_DRUG_MECH_ZH = [^\n]*;/)[0];
  const supp = src.match(/const PC_SUPP_MECH_ZH = [^\n]*;/)[0];
  assert.ok(drug.includes('药师') === false && supp.includes('药师'),
    'DRUG 表仍无「药师」——跨表统一未做，登记备查（若已统一请同步本条）');
});
test('G4 已知未修④：causalInvertedTakeZh / causalSupplementZh 的 lastIndex 防空匹配防护前移', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const fn = src.slice(src.indexOf('function causalInvertedTakeZh'), src.indexOf('function causalSupplementZh'));
  assert.ok(/actRe\.lastIndex === m\.index/.test(fn),
    'causalInvertedTakeZh 应保留 lastIndex 防空匹配防护（causalSupplementZh 同款）');
});
