// test/round-221-reasoning-coherence-exclusionary-negation.test.js
// 第 221 轮守卫：reasoning_coherence / moral_foundations 的方法学统计语境误伤
//   —— 修交接簿（data/upgrade-state.json r220 notes）候选①：
//     「reasoning_coherence 对『说明…不是…造成的』双重否定的误伤」
//
// 缺口实测（scripts/tmp-221-probe.js，轮末已删）：
//   改前 20 条方法学排除性否定句 reasoning_coherence 命中 20/20（gate 全非 pass）；
//   改后 reasoning_coherence 0/20、moral_foundations 0/20；
//   22 条攻击 rc 命中 14→14、gate 非 pass 19/22 不变（3 条为存量漏判）。
// 根因一（reasoning_coherence）：rcTemporalCausal 第三臂的形状判据是
//   「时间相关性(之后/以来/…) × 因果动词(造成/导致/…) × 无对冲 × 论断连接词」，
//   从不检查因果动词是否落在**否定辖域**内——「控制X之后，Y仍然显著，说明Z不是
//   由W造成的」的「之后」×「造成」恰好两腿齐备，被当成「把时间先后当因果」的
//   攻击话术。而拒绝无效归因（说明这个归因不成立）是正确判别动作。
// 根因二（moral_foundations）：liberty 通道的「控制」被当成自由/压迫关键词，
//   v6.7.73 的 TECH_CONTEXT 只收了字面「控制变量」，漏了动词形态
//   （控制了基线特征/控制选择偏差/调整协变量）。
//
// 本测试锁定七件事：
//   ① 方法学排除性否定句 reasoning_coherence 零误伤（维度层 + findings 层）
//   ② 同族句 moral_foundations 零误伤，且**不**洗掉真道德信号（反向守卫）
//   ③ 攻击样本零退化（rc count 值逐条锁定 + gate 非 pass）
//   ④ r364 存量语料不退化（第三臂自己的攻击族 + 良性族）
//   ⑤ 否定形边缘攻击（「这不是巧合造成的」）gate 不因豁免而塌
//   ⑥ 已知未修登记现值（3 条存量漏判 + 5 条其他维度误伤）
//   ⑦ 两处变异守卫必须变红（RC_EXCL_NEG_ZH / moral 新表 置恒假）
const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const idx = require(path.join(ROOT, 'src/index.js'));
const gateMod = require(path.join(ROOT, 'src/gate.js'));

// ── A 节语料：良性（方法学排除性否定结论）──
// 首 3 条为交接簿候选①登记的样本（r220 测试 A 节改后仍 verify 的那 3 条）
const BENIGN = [
  '控制了基线特征之后，干预效果仍然显著，说明效果不是由混杂造成的',
  '控制选择偏差之后，两组差异仍然存在，说明差异不是自选择造成的',
  '调整协变量之后，处理效应仍然显著，说明效应不是由选择偏差造成的',
  '控制了年龄因素之后，运动仍然与更低的事件率相关，说明关联不是由年龄造成的',
  '纳入固定效应之后，系数仍然显著，说明结果不是由遗漏变量造成的',
  '倾向得分匹配之后，两组差异仍然存在，说明差异不是由匹配失败造成的',
  '控制混淆变量之后，暴露与结局仍然相关，说明关联不是由混淆造成的',
  '剔除极端值之后，均值仍然稳健，说明结论不是由异常值造成的',
  '分层之后，各层效应方向一致，说明效应不是由层间差异造成的',
  '加权之后估计量仍然一致，说明偏差不是由样本结构造成的',
  '双重差分之后，处理效应仍然显著，说明效应不是由时间趋势造成的',
  '工具变量回归之后，结果仍然稳健，说明估计不是由内生性造成的',
  '调整了收入因素之后，教育仍然与更高的就业率相关，说明关联不是由收入造成的',
  '控制时间趋势之后，相关关系仍然显著，说明关系不是由共同趋势造成的',
  '考虑了季节因素之后，销量差异仍然显著，说明差异不是由季节造成的',
  '排除竞争性解释之后，结论仍然成立，说明结果不是由替代解释造成的',
  '加入控制变量之后，效应量仍然稳定，说明发现不是由模型设定造成的',
  '稳健性检验之后，主效应仍然显著，说明结论不是由单一模型造成的',
  '控制选择偏差之后，效应估计仍然无偏，说明偏误不是由样本选择造成的',
  '调整基线协变量之后，组间差异仍然显著，说明差异不是由基线不平衡造成的',
];
const REGISTERED = BENIGN.slice(0, 3);

// ── B 节语料：攻击（时序共现 × 单向因果归属）──
// 前 6 条为 r364 第三臂自己的攻击族（scripts/round-364/probe-5-guard.js 原文）
const ATTACK = [
  '每次他带伞，下午就下雨，所以伞能招雨',
  '我们加了缓存之后延迟降了，说明缓存是唯一原因',
  '他上任以来股价翻倍，可见他改变了基本面',
  '两组数据同时上升，因此一组上升引起了另一组上升',
  '自从推出新规以来投诉量下降，可见新规是唯一原因',
  '每逢活动销量就涨，说明活动能带来全部增长',
  '他上任之后公司利润就涨了，肯定是他的能力造成的',
  '他喝了这个偏方，第二天病就好了，看来偏方真有用',
  '从那天以后他就像变了个人，肯定是受了刺激',
  '昨天我在电梯里摔了一跤，今天就下雨了',
  '自从换了风水布局之后，订单就来了，说明风水带来了财运',
  '每次转发锦鲤之后就涨薪，说明转发带来了好运',
  '他坚持早起之后业绩就翻倍，可见早起造成了改变',
  '产品上新之后销售额持续增长，说明改版导致了增长',
  '他换了头像之后单子就谈成了，可见头像改变了运势',
  '每到初一十五之后店里就有客流，说明上香带来了生意',
  '团队换了新框架之后故障率下降，说明框架是唯一原因',
  '新规上线以来投诉量下降，可见新规带来了全部改善',
];
// ── F 节语料：否定形边缘攻击（因果动词在否定辖域内，但整句仍在归因）──
// 「这不是巧合造成的」= 用排除法下归因断言。豁免 reasoning_coherence 后
// 必须仍有 post_hoc / pseudo_causal 兜住 gate，不许塌成 pass。
const NEG_EDGE = [
  '他上任之后利润就涨了，这不是巧合造成的',
  '自从换了风水布局之后订单就来了，这不是巧合带来的',
  '他坚持早起之后业绩就翻倍，可见早起不是运气造成的',
  '产品上新之后销量持续增长，这说明增长不是偶然导致的',
];
// ── C 节语料：r364 良性族原文（对冲词/非归因顺承/其他语境时间词）──
const BENIGN_364 = [
  '两条曲线同时上升，可能是同一个第三方因素',
  '他上任以来股价翻倍，但也可能是市场整体上涨',
  '缓存上线后延迟下降，我们做了 A/B 对照',
  '两组数据同步变化，还需要排除同期其他变量',
  '这个问题需要更多数据才能下结论',
  '女性平均预期寿命比男性长，这是统计数据',
  '数据下降说明策略有效，我们下周复盘确认',
  '升级之后事故率降低了，团队认为多因素共同作用',
  '每天写代码，技术上就一定进步得快',
  '同时推进三个模块，说明资源分配是均衡的',
  '上市以来股价稳步上升，可见公司经营稳健',
  '之后我们还会复盘，看看是否需要继续投入',
];
// ── G 节语料一：已知未修的存量漏判（r220 D 节同值，方向相反，本轮不修）──
const KNOWN_GAP = [
  '他喝了这个偏方，第二天病就好了，看来偏方真有用',
  '从那天以后他就像变了个人，肯定是受了刺激',
  '昨天我在电梯里摔了一跤，今天就下雨了',
];
// ── G 节语料二：同族句在其他维度的误伤（本轮只修两维，其余登记现值）──
// 排除性否定形状同时被 post_hoc / cum_hoc / common_cause / mediator_confusion
// 命中——根因各不相同（r220 的 STAT_CONTEXT_ZH 覆盖不到 >14 字间隔；cum_hoc /
// common_cause / mediator_confusion 完全没有方法学语境豁免），需单独轮次。
const OTHER_DIM_FP = [
  '分层之后，各层效应方向一致，说明效应不是由层间差异造成的',
  '加权之后估计量仍然一致，说明偏差不是由样本结构造成的',
  '调整了收入因素之后，教育仍然与更高的就业率相关，说明关联不是由收入造成的',
  '控制时间趋势之后，相关关系仍然显著，说明关系不是由共同趋势造成的',
  '排除竞争性解释之后，结论仍然成立，说明结果不是由替代解释造成的',
];

const rcCount = t => { const d = idx.discriminate(t) || {}; return ((d.dimensions || {}).reasoning_coherence || {}).count || 0; };
const mfCount = t => idx.checkMoralFoundations(t).count;
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

console.log('round-221 reasoning_coherence 排除性否定因果豁免 / moral_foundations 统计控制动词守卫');

test(`A1 方法学排除性否定句 reasoning_coherence 零误伤（${BENIGN.length} 条，维度层）`, () => {
  const hit = BENIGN.filter(t => rcCount(t) > 0);
  assert.deepStrictEqual(hit, [], `reasoning_coherence 仍命中 ${hit.length}/${BENIGN.length} 条：\n  ${hit.join('\n  ')}`);
});

test('A2 同族句 moral_foundations 零误伤（统计控制动词不是自由/压迫话题）', () => {
  const hit = BENIGN.filter(t => mfCount(t) > 0);
  assert.deepStrictEqual(hit, [], `moral_foundations 仍命中 ${hit.length}/${BENIGN.length} 条：\n  ${hit.join('\n  ')}`);
});

test('A3 登记样本（交接簿候选①的 3 条）无实质 finding 且 gate pass', () => {
  for (const t of REGISTERED) {
    const r = gateMod.checkOutput(t);
    assert.strictEqual(r.gate.action, 'pass', `「${t}」应为 pass，实测 ${r.gate.action}`);
    // gate 在 findings 为空时会塞一条 dimension='none' / severity=0 的占位
    // （details「未发现明显问题」），故判 severity>0 的实质 finding 数
    const real = (r.findings || []).filter(f => f.severity > 0);
    assert.strictEqual(real.length, 0,
      `「${t}」不应有实质 finding，实测 ${JSON.stringify(real.map(f => f.dimension))}`);
  }
});

test(`A4 良性 findings 不含 reasoning_coherence / moral_foundations（不只守 action）`, () => {
  const rc = BENIGN.filter(t => hasDim(t, 'reasoning_coherence'));
  const mf = BENIGN.filter(t => hasDim(t, 'moral_foundations'));
  assert.deepStrictEqual(rc, [], `findings 含 reasoning_coherence：\n  ${rc.join('\n  ')}`);
  assert.deepStrictEqual(mf, [], `findings 含 moral_foundations：\n  ${mf.join('\n  ')}`);
});

test('D 反向守卫：真道德信号不被方法学表洗掉', () => {
  // 「控制」+ 统计对象不在场（人民的自由），liberty 必须保留
  assert.strictEqual(mfCount('政府控制了人民的自由，这是暴政') > 0, true,
    '「政府控制了人民的自由」的 liberty 信号被误豁免');
  // 强道德词在场（压迫）时 TECH_CONTEXT 不生效（weakOnly + STRONG_MORAL 双闸）
  assert.strictEqual(mfCount('他们控制民族差异，实行压迫统治') > 0, true,
    '「控制民族差异+压迫统治」的道德信号被误豁免');
  // 提到回归分析不等于洗掉道德信号
  assert.strictEqual(mfCount('这项回归分析表明控制者剥夺了人民的自由') > 0, true,
    '「回归分析+控制者剥夺自由」的道德信号被误豁免');
});

test(`B 攻击样本零退化（${ATTACK.length} 条：rc count 值逐条锁定 + gate 非 pass）`, () => {
  // 改后实测：14 条 rc=1、8 条 rc=0（3 条存量漏判 + 1 条已被 post_hoc 抓住的
  // 真后此句 + 4 条否定形边缘攻击改由 F 节单独守）
  const locked1 = ATTACK.slice(0, 6).concat([
    '自从换了风水布局之后，订单就来了，说明风水带来了财运',
    '每次转发锦鲤之后就涨薪，说明转发带来了好运',
    '他坚持早起之后业绩就翻倍，可见早起造成了改变',
    '产品上新之后销售额持续增长，说明改版导致了增长',
    '他换了头像之后单子就谈成了，可见头像改变了运势',
    '每到初一十五之后店里就有客流，说明上香带来了生意',
    '团队换了新框架之后故障率下降，说明框架是唯一原因',
    '新规上线以来投诉量下降，可见新规带来了全部改善',
  ]);
  for (const t of locked1) {
    assert.strictEqual(rcCount(t), 1, `「${t}」reasoning_coherence count 期望 1，实测 ${rcCount(t)}`);
  }
  // 存量漏判 3 条 + 「肯定是他有能力」1 条：rc=0（改前改后同值）
  for (const t of KNOWN_GAP.concat(['他上任之后公司利润就涨了，肯定是他的能力造成的'])) {
    assert.strictEqual(rcCount(t), 0, `「${t}」reasoning_coherence 现值应为 0，实测 ${rcCount(t)}`);
  }
  // gate 非 pass（3 条存量漏判除外——它们在 G 节登记为 pass）
  const passed = ATTACK.filter(t => !KNOWN_GAP.includes(t))
    .filter(t => gateMod.checkOutput(t).gate.action === 'pass');
  assert.deepStrictEqual(passed, [], `gate 仍 pass：\n  ${passed.join('\n  ')}`);
});

test('C r364 存量语料不退化（第三臂自己的攻击族 6/6 + 良性族 11/12）', () => {
  const attack364 = ATTACK.slice(0, 6);
  for (const t of attack364) {
    assert.strictEqual(rcCount(t), 1, `r364 攻击族「${t}」rc count 期望 1，实测 ${rcCount(t)}`);
  }
  let passN = 0;
  const nonPass = [];
  for (const t of BENIGN_364) {
    if (gateMod.checkOutput(t).gate.action === 'pass') passN++;
    else nonPass.push(t);
  }
  assert.strictEqual(passN, 11, `r364 良性族 pass 期望 11/12，实测 ${passN}/12：\n  ${nonPass.join('\n  ')}`);
});

test('F 否定形边缘攻击 gate 不塌（豁免 rc 后仍有 post_hoc / pseudo_causal 兜底）', () => {
  const soft = NEG_EDGE.filter(t => gateMod.checkOutput(t).gate.action === 'pass');
  assert.deepStrictEqual(soft, [], `gate 塌成 pass：\n  ${soft.join('\n  ')}`);
  // 且这 4 条的 rc 必须已被豁免（否则说明豁免表没生效，兜底只是碰巧）
  const stillHit = NEG_EDGE.filter(t => rcCount(t) > 0);
  assert.deepStrictEqual(stillHit, [], `rc 仍命中（豁免未生效）：\n  ${stillHit.join('\n  ')}`);
});

test('G 已知未修登记现值（3 条存量漏判 + 5 条其他维度误伤）', () => {
  for (const t of KNOWN_GAP) {
    const r = gateMod.checkOutput(t);
    assert.strictEqual(r.gate.action, 'pass', `「${t}」存量漏判现值应为 pass，实测 ${r.gate.action}`);
    assert.strictEqual(rcCount(t), 0, `「${t}」rc 现值应为 0，实测 ${rcCount(t)}`);
  }
  // 5 条其他维度误伤：现值逐条锁定（post_hoc / cum_hoc / common_cause / mediator_confusion）
  const locked = {
    '分层之后，各层效应方向一致，说明效应不是由层间差异造成的': ['post_hoc', 'pseudo_causal'],
    '加权之后估计量仍然一致，说明偏差不是由样本结构造成的': ['post_hoc', 'pseudo_causal'],
    '调整了收入因素之后，教育仍然与更高的就业率相关，说明关联不是由收入造成的': ['cum_hoc', 'common_cause'],
    '控制时间趋势之后，相关关系仍然显著，说明关系不是由共同趋势造成的': ['cum_hoc', 'common_cause'],
    '排除竞争性解释之后，结论仍然成立，说明结果不是由替代解释造成的': ['mediator_confusion'],
  };
  for (const [t, dims] of Object.entries(locked)) {
    for (const d of dims) {
      assert.strictEqual(hasDim(t, d), true, `「${t}」应仍命中 ${d}（现值登记），实测未命中`);
    }
    assert.strictEqual(rcCount(t), 0, `「${t}」rc 应已清零，实测 ${rcCount(t)}`);
  }
});

test('E 变异守卫一：RC_EXCL_NEG_ZH 置恒假后良性必须重新被 reasoning_coherence 命中', () => {
  // [隔离写法] 把 src/ 整棵树复制到临时目录再变异，绝不在原地改写 src/
  // —— run-all.js 默认 JOBS=4 并发跑测试，原地变异会让并发中的其他测试
  // 读到被改写的 index.js（r220 踩坑：原位变异有并发竞态）。
  const fs = require('fs');
  const os = require('os');
  const cp = require('child_process');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r221-mut-'));
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
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    const lines = orig.split('\n');
    const lineIdx = lines.findIndex(l => l.startsWith('const RC_EXCL_NEG_ZH = '));
    assert.ok(lineIdx >= 0, '副本中找不到 RC_EXCL_NEG_ZH 声明行');
    assert.ok(lines[lineIdx].includes('(?:不是|并非|并不是|绝不是'), '副本里不含排除性否定词半');
    lines[lineIdx] = 'const RC_EXCL_NEG_ZH = /_(?!_)_/;';
    fs.writeFileSync(src, lines.join('\n'), 'utf8');
    const out = cp.execFileSync(process.execPath,
      ['-e', `const idx=require(${JSON.stringify(path.join(tmp, 'src', 'index.js'))});
const B=${JSON.stringify(BENIGN)};
let n=0; for(const t of B){ const d=idx.discriminate(t)||{}; const rc=((d.dimensions||{}).reasoning_coherence||{}).count||0; if(rc>0) n++; }
console.log(n);`],
      { encoding: 'utf8' });
    const n = parseInt(out.trim(), 10);
    assert.ok(n >= 15, `置恒假后只有 ${n}/${BENIGN.length} 条良性被 rc 命中（期望 ≥15）—— 豁免表不是真承重，守卫失效`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('E2 变异守卫二：moral 统计控制动词表置恒假后误伤必须重现', () => {
  const fs = require('fs');
  const os = require('os');
  const cp = require('child_process');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r221-mut2-'));
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
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    const lines = orig.split('\n');
    const lineIdx = lines.findIndex(l => l.includes('(?:控制|调整|纳入|加入|考虑|剔除|排除|匹配|加权|分层)'));
    assert.ok(lineIdx >= 0, '副本中找不到统计控制动词表行');
    assert.ok(lines[lineIdx].includes('(?:变量|因素|协变量'), '副本里不含统计对象半');
    lines[lineIdx] = '    /_(?!_)_/i,';
    fs.writeFileSync(src, lines.join('\n'), 'utf8');
    const out = cp.execFileSync(process.execPath,
      ['-e', `const idx=require(${JSON.stringify(path.join(tmp, 'src', 'index.js'))});
const B=${JSON.stringify(BENIGN)};
let n=0; for(const t of B){ if(idx.checkMoralFoundations(t).count>0) n++; }
console.log(n);`],
      { encoding: 'utf8' });
    const n = parseInt(out.trim(), 10);
    assert.ok(n >= 3, `置恒假后只有 ${n}/${BENIGN.length} 条良性被 moral_foundations 命中（期望 ≥3）—— 新表不是真承重，守卫失效`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('E3 还原校验：仓库源码未被本轮变异触碰', () => {
  const fs = require('fs');
  const cur = fs.readFileSync(path.join(ROOT, 'src/index.js'), 'utf8');
  assert.ok(cur.includes('const RC_EXCL_NEG_ZH = /(?:不是|并非|并不是|绝不是'), 'RC_EXCL_NEG_ZH 声明缺失或已被改写');
  assert.ok(!cur.includes('RC_EXCL_NEG_ZH = /_(?!_)_/'), '源码残留恒假变异壳');
  assert.ok(cur.includes('&& !RC_EXCL_NEG_ZH.test(text)'), 'rcTemporalCausal 未接入 RC_EXCL_NEG_ZH');
  assert.ok(cur.includes('(?:控制|调整|纳入|加入|考虑|剔除|排除|匹配|加权|分层)[了]?'), '统计控制动词表缺失或已被改写');
});

console.log('round-221 守卫完成');
