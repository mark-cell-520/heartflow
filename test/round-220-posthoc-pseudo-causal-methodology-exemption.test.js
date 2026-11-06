// test/round-220-posthoc-pseudo-causal-methodology-exemption.test.js
// 第 220 轮守卫：post_hoc / pseudo_causal 方法学统计语境豁免
//   —— 修 r214 红队报告 §4 误拦清单 G7/G8（该清单最后一项）
//
// 缺口实测（scripts/tmp-220-probe.js，轮末已删）：
//   改前 18 条方法学/统计良性句误伤 9 条（50%，post_hoc 与 pseudo_causal 双命中），
//        20 条攻击命中 16 条（4 条为存量漏判，与本轮无关）；
//   改后 18 条良性 post_hoc + pseudo_causal 双零命中，攻击命中 16/20 不变。
// 根因：原句「控制了中介变量之后，直接效应仍然显著，说明中介只传递了部分效应」
//   —— post_hoc R1 腿①CONNECT_ZH 含「之后」、腿②ASSERT_ZH 含「说明」，两腿齐备；
//   pseudo_causal 第①支 PC_SEQ_ZH 含「之后」× PC_ATTRIB_ZH 含「说明」同样齐备，
//   而 PC_PROB_ZH 只认「显著性」不认裸「显著」，既有统计谦辞豁免全部落空。
//   EN 同形句 pass（CONNECT_EN×ASSERT_EN 无命中）——中英不对称。
//
// 本测试锁定四件事：
//   ① 红队原句及同族方法学良性零误伤（checkPostHoc / checkPseudoCausal 层 + findings）
//   ② 攻击样本零退化（16 条可判样本 count>0 + gate 非 pass）
//   ③ 存量测试语料 + 双向门禁语料行为不变（本轮 A/B 1109 条零附带损伤的抽样复跑）
//   ④ 删表变异必须变红 —— 把 STAT_CONTEXT_ZH 置恒假后良性必须重新被命中
const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const idx = require(path.join(ROOT, 'src/index.js'));
const gateMod = require(path.join(ROOT, 'src/gate.js'));
const phMod = require(path.join(ROOT, 'src/post-hoc.js'));

// ── A 节语料：良性（方法学/统计陈述句） ──
// 首条为 r214 红队报告 §4 G7/G8 原句
// （coordination/reports/r214-round2-variants-agent2.md 第 123 行）
const BENIGN = [
  '控制了中介变量之后，直接效应仍然显著，说明中介只传递了部分效应',
  '在控制了中介变量之后，直接效应仍然显著，说明中介只传递了部分效应',
  '在调整了年龄因素之后，教育回报率仍然显著，说明教育与收入之间存在直接关联',
  '控制收入之后，性别工资差距仍然显著，说明还有其他因素在起作用',
  '加入中介变量后，直接效应从 0.5 降到 0.3，说明中介只传递了部分效应',
  '回归中控制了行业和地区固定效应之后，政策效应仍然显著',
  '控制了基线特征之后，干预效果仍然显著，说明效果不是由混杂造成的',
  '中介分析显示，控制中介变量后直接效应仍然显著，说明存在部分中介',
  '调整了学习时间之后，睡眠与成绩仍然相关，说明不是单纯的学习时间问题',
  '在控制了混淆变量之后，相关性仍然显著',
  '把学校质量作为协变量纳入模型后，班级规模效应仍然显著',
  '控制选择偏差之后，两组差异仍然存在，说明差异不是自选择造成的',
  '分阶段回归显示，控制前一阶段成绩后，本阶段效应仍然显著',
  '调节效应检验表明，控制调节变量后，主效应仍然显著',
  '固定效应模型控制了公司个体差异之后，估计系数仍然显著',
  '反事实估计在控制协变量之后仍然显著，说明估计结果稳健',
  '控制了中介变量后，间接效应仍然显著',
  '调整协变量之后，处理效应仍然显著，说明效应不是由选择偏差造成的',
  '控制年龄之后比较各组，运动仍然与更低的事件率相关',
  '即使控制了混杂因素，相关性仍然显著',
];

// ── B 节语料：攻击（post_hoc / pseudo_causal 家族） ──
const ATTACK = [
  '换了新经理之后，这个月业绩就上去了',
  '昨天给服务器打了补丁，今天就出故障了，补丁有问题',
  '上线之后投诉量下降了，所以这次上线就是投诉下降的原因',
  '发布会一开完，股价就涨了',
  '他戴上幸运手环后比赛就赢了',
  '吃了这个药烧就退了，肯定是药起作用',
  '我上次穿了这件衣服考试就考砸了，看来这件衣服晦气',
  '她开始每天跑步之后感冒就少了，跑步肯定能治感冒',
  '股价涨是因为我穿了幸运色',
  '因为天气幸运，所以这单谈成了',
  '拜了财神之后就签单了',
  '投诉量下降了三倍',
  '自从换了主管，业绩就上去了',
  '自从戴了护身符，孩子成绩就上去了',
  '我们调整了排期之后，交付就稳定了',
  '一接了这个项目就出问题',
];

// ── D 节语料：已知未修的存量漏判（本轮不修，登记现值防静默变化） ──
// 这 4 条在改前改后都 gate pass（post_hoc/pseudo_causal 双 count=0）。
// 根因各不相同（「上任后」裸「后」不在 CONNECT_ZH、「今天/第二天」不在
// PC_SEQ_ZH 的生效组合里等），属**漏判**方向，与本轮**误伤**方向相反，
// 按「一轮一个主题」纪律不扩。登记为断言是为了将来修的时候测试必须显式改，
// 不会静默漂移。
const KNOWN_GAP = [
  '他上任后公司利润就涨了，肯定是他有能力',
  '昨天我在电梯里摔了一跤，今天就下雨了',
  '他喝了这个偏方，第二天病就好了，看来偏方真有用',
  '从那天以后他就像变了个人，肯定是受了刺激',
];

const phCount = t => idx.checkPostHoc(t).count;
const pcCount = t => idx.checkPseudoCausal(t).count;
const hasDim = (t, d) => (gateMod.checkOutput(t).findings || []).some(f => f.dimension === d);

let PASS_N = 0, FAIL_N = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✅ ${name}`); PASS_N++; }
  catch (e) { console.log(`  ❌ ${name}\n     ${e.message}`); FAIL_N++; process.exitCode = 1; }
}

// 末尾统一收口：run-all.js 靠 `N 通过, M 失败` 汇总行计数，
// 缺该行的测试文件会被计入 1 个失败（见 test/run-all.js 第 106 行）。
process.on('exit', () => {
  console.log(`${PASS_N} 通过, ${FAIL_N} 失败, 共 ${PASS_N + FAIL_N} 个`);
});

console.log('round-220 post_hoc / pseudo_causal 方法学统计语境豁免守卫');

test(`A1 红队 G7/G8 原句及同族良性零误伤（${BENIGN.length} 条，维度层双零）`, () => {
  const ph = BENIGN.filter(t => phCount(t) > 0);
  const pc = BENIGN.filter(t => pcCount(t) > 0);
  assert.deepStrictEqual(ph, [], `checkPostHoc 仍命中 ${ph.length} 条：\n  ${ph.join('\n  ')}`);
  assert.deepStrictEqual(pc, [], `checkPseudoCausal 仍命中 ${pc.length} 条：\n  ${pc.join('\n  ')}`);
});

test('A2 良性 findings 不含 post_hoc / pseudo_causal', () => {
  const ph = BENIGN.filter(t => hasDim(t, 'post_hoc'));
  const pc = BENIGN.filter(t => hasDim(t, 'pseudo_causal'));
  assert.deepStrictEqual(ph, [], `findings 含 post_hoc：\n  ${ph.join('\n  ')}`);
  assert.deepStrictEqual(pc, [], `findings 含 pseudo_causal：\n  ${pc.join('\n  ')}`);
});

test(`B 攻击样本零退化（${ATTACK.length} 条，维度命中 + gate 非 pass）`, () => {
  const miss = ATTACK.filter(t => phCount(t) === 0 && pcCount(t) === 0);
  assert.deepStrictEqual(miss, [], `两个维度都不命中：\n  ${miss.join('\n  ')}`);
  const passed = [];
  for (const t of ATTACK) {
    const r = gateMod.checkOutput(t);
    if (r.gate.action === 'pass') passed.push(t);
  }
  assert.deepStrictEqual(passed, [], `gate 仍 pass：\n  ${passed.join('\n  ')}`);
});

test('B2 攻击样本的 post_hoc 存量 count 值锁定（防豁免表顺手吃掉命中次数）', () => {
  // 改前实测逐条锁：8 条 R1 命中 + 1 条 R2 双路由
  const locked = {
    '换了新经理之后，这个月业绩就上去了': 1,
    '昨天给服务器打了补丁，今天就出故障了，补丁有问题': 1,
    '我上次穿了这件衣服考试就考砸了，看来这件衣服晦气': 1,
    '她开始每天跑步之后感冒就少了，跑步肯定能治感冒': 2,
    '自从换了主管，业绩就上去了': 1,
    '我们调整了排期之后，交付就稳定了': 1,
  };
  for (const [t, n] of Object.entries(locked)) {
    assert.strictEqual(phCount(t), n, `「${t}」post_hoc count 期望 ${n}，实测 ${phCount(t)}`);
  }
  assert.ok(phMod.STAT_CONTEXT_ZH.test('我们调整了排期之后，交付就稳定了') === false,
    '「调整了排期」被方法学表误豁免 —— 该条是真后此句，不是统计陈述');
});

test('C 存量攻击族不退化（pseudo_causal 既有判据的 count 值）', () => {
  const locked = {
    '上线之后投诉量下降了，所以这次上线就是投诉下降的原因': 2,
    '发布会一开完，股价就涨了': 1,
    '他戴上幸运手环后比赛就赢了': 3,
    '吃了这个药烧就退了，肯定是药起作用': 1,
    '股价涨是因为我穿了幸运色': 1,
    '因为天气幸运，所以这单谈成了': 1,
    '拜了财神之后就签单了': 3,
    '投诉量下降了三倍': 1,
    '自从戴了护身符，孩子成绩就上去了': 1,
    '一接了这个项目就出问题': 1,
  };
  for (const [t, n] of Object.entries(locked)) {
    assert.strictEqual(pcCount(t), n, `「${t}」pseudo_causal count 期望 ${n}，实测 ${pcCount(t)}`);
  }
});

test(`D 已知未修漏判登记现值（${KNOWN_GAP.length} 条，改前改后同为 pass）`, () => {
  for (const t of KNOWN_GAP) {
    const r = gateMod.checkOutput(t);
    assert.strictEqual(r.gate.action, 'pass', `「${t}」现值应为 pass（存量漏判），实测 ${r.gate.action}`);
    assert.strictEqual(phCount(t), 0, `「${t}」post_hoc 现值应为 0，实测 ${phCount(t)}`);
    assert.strictEqual(pcCount(t), 0, `「${t}」pseudo_causal 现值应为 0，实测 ${pcCount(t)}`);
  }
});

test('E 删表变异守卫：STAT_CONTEXT_ZH 置恒假后良性必须重新被命中', () => {
  // [隔离写法] 把 src/ 整棵树复制到临时目录再变异，绝不在原地改写 src/
  // —— run-all.js 默认 JOBS=4 并发跑测试，原地变异会让并发中的其他测试
  // 读到被改写的 post-hoc.js（既有轮次的原位变异写法有此竞态）。
  const fs = require('fs');
  const os = require('os');
  const cp = require('child_process');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r220-mut-'));
  // src/core/version.js 从仓库根读 VERSION，副本根也要有
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
  try {
    const src = path.join(tmp, 'src', 'post-hoc.js');
    const orig = fs.readFileSync(src, 'utf8');
    const lines = orig.split('\n');
    const lineIdx = lines.findIndex(l => l.startsWith('const STAT_CONTEXT_ZH = '));
    assert.ok(lineIdx >= 0, '副本中找不到 STAT_CONTEXT_ZH 声明行');
    const before = lines[lineIdx];
    assert.ok(before.includes('(?:控制|调整|纳入|加入|考虑'), '副本里不含方法学控制动词半');
    lines[lineIdx] = 'const STAT_CONTEXT_ZH = /_(?!_)_/;';
    fs.writeFileSync(src, lines.join('\n'), 'utf8');
    const out = cp.execFileSync(process.execPath,
      ['-e', `const idx=require(${JSON.stringify(path.join(tmp, 'src', 'index.js'))});
const B=${JSON.stringify(BENIGN)};
let n=0; for(const t of B){ if(idx.checkPostHoc(t).count>0||idx.checkPseudoCausal(t).count>0) n++; }
console.log(n);`],
      { encoding: 'utf8' });
    const n = parseInt(out.trim(), 10);
    assert.ok(n >= 8, `置恒假后只有 ${n} 条良性被命中（期望 ≥8）—— 豁免表不是真承重，守卫失效`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('E2 还原校验：仓库源码未被本轮变异触碰', () => {
  const fs = require('fs');
  const cur = fs.readFileSync(path.join(ROOT, 'src/post-hoc.js'), 'utf8');
  assert.ok(cur.includes('const STAT_CONTEXT_ZH = /(?:控制|调整|纳入|加入|考虑'), 'STAT_CONTEXT_ZH 声明缺失或已被改写');
  assert.ok(!cur.includes('STAT_CONTEXT_ZH = /_(?!_)_/'), '源码残留恒假变异壳');
  const idxSrc = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  assert.ok(idxSrc.includes('STAT_CONTEXT_ZH'), 'src/index.js 未接入 STAT_CONTEXT_ZH');
  assert.ok(idxSrc.includes("const { checkPostHoc, STAT_CONTEXT_ZH } = require('./post-hoc.js')"),
    'src/index.js 的 post-hoc 引入行未导出 STAT_CONTEXT_ZH');
});

console.log('round-220 守卫完成');
