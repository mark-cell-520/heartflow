/**
 * test/round-222-excl-neg-causal-five-dimensions.test.js
 * — r222 方法学「排除性否定因果归属」豁免五维收口（v6.8.150）
 *
 * 背景（交接簿 data/upgrade-state.json r221 notes 候选①）：r221 给
 * reasoning_coherence 补了 RC_EXCL_NEG_ZH 之后，同一句话族的另外五条误伤
 * 仍挂着——r221 测试 G 节登记的 5 条方法学良性句改后 gate 仍非 pass。r222
 * 扩样 30 条复测：**11 条 gate 非 pass、五维合计 25 次命中**（post_hoc 6 /
 * pseudo_causal 12 / cum_hoc 3 / common_cause 3 / mediator_confusion 1）。
 *
 * 落地：src/methodology-exempt.js 新增 hasExclNegCausal 共表（方法学动词 ×
 * 论断连接词 × 「不是由 Z 造成的」三腿链 + 运气对象守卫；副支「不能归因
 * 于」），接入 post_hoc / pseudo_causal(causalOverclaimZh) / cum_hoc /
 * common_cause / mediator_confusion 五维函数头早退；顺带把 r221 的
 * RC_EXCL_NEG_ZH 动词表对齐补齐（漏「决定/驱动/带来…」导致
 * 「说明差异不是由选择偏差决定的」仍命中 reasoning_coherence）。
 *
 * 守四件事：
 *   一、25 条方法学排除性否定良性五维零误伤（detector 层 + gate 层 + findings 层）；
 *   二、27 条攻击（含 9 条对抗形：方法学动词 × 「不是由…造成的」）命中值逐条
 *      锁定、gate 非 pass——豁免不许吃掉攻击；
 *   三、r221 F 节 3 条否定形边缘攻击 gate 不塌（豁免 rc 后又豁免五维，仍须
 *      有维度兜住）；
 *   四、两张守卫承重：三腿链置恒假后良性必须重新被命中；运气对象守卫置恒假后
 *      两条运气归因攻击必须转为被误豁免（证明守卫在承重）。
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cp = require('child_process');
const ROOT = path.join(__dirname, '..');

const idx = require('../src/index.js');
const gateMod = require('../src/gate.js');
const { checkPostHoc } = require('../src/post-hoc.js');
const { checkCumHoc } = require('../src/cum-hoc.js');
const { checkCommonCause } = require('../src/common-cause.js');
const { checkMediatorConfusion } = require('../src/mediator-confusion.js');
const me = require('../src/methodology-exempt.js');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + '\n     ' + e.message); process.exitCode = 1; }
}

// 末尾统一收口：run-all.js 靠 `N 通过, M 失败` 汇总行计数，
// 缺该行的测试文件会被计入 1 个失败（见 test/run-all.js）。
process.on('exit', () => {
  console.log(`${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
});

// ─── A 节语料：25 条方法学「排除性否定因果归属」良性（支①三腿链）────────
// 全部形状 = 方法学动词 × 论断连接词(说明) × 「不是由 Z 造成的」；Z 覆盖
// 层间差异/样本结构/收入/共同趋势/替代解释/年龄/选择偏差/异常值/混淆变量/
// 遗漏变量/通胀/季节波动/生源结构/测量误差/模型设定/节假日/题目难度…
const BENIGN = [
  '分层之后，各层效应方向一致，说明效应不是由层间差异造成的',
  '加权之后估计量仍然一致，说明偏差不是由样本结构带来的',
  '调整了收入因素之后，教育仍然与更高的就业率相关，说明关联不是由收入导致的',
  '控制时间趋势之后，相关关系仍然显著，说明关系不是由共同趋势引起的',
  '排除竞争性解释之后，结论仍然成立，说明结果不是由替代解释造成的',
  '控制年龄之后，两个群体的死亡率差异大幅缩小，说明差距不是由年龄驱动的',
  '匹配了可比样本之后，处理组与对照组结果接近，说明差异不是由选择偏差决定的',
  '加入地区固定效应之后，系数依然稳健，说明结果不是由地区差异造就的',
  '剔除极端值之后，相关系数几乎没有变化，说明关联不是由异常值诱发的',
  '做了倾向得分匹配之后，效应估计明显下降，说明原始差异不是由混淆变量促成的',
  '分年度回归之后，结论保持一致，说明现象不是由某一年异常拉高的',
  '标准化了各科成绩之后，班级间差距缩小，说明差异不是由题目难度推高的',
  '双重差分之后，政策效应仍然显著，说明效果不是由时间趋势带来的',
  '安慰剂对照之后，药物组改善更明显，说明疗效不是由安慰剂效应造成的',
  '工具变量回归之后，结论不变，说明关系不是由反向因果导致的',
  '控制家庭背景之后，学校回报率依然显著，说明回报不是由家庭背景造成的',
  '分层抽样之后，各层估计量接近，说明结论不是由样本选择造成的',
  '调整测量误差之后，信度提高，说明差异不是由测量误差引起的',
  '做了敏感性分析之后，核心结论稳健，说明结果不是由单一模型设定造成的',
  '固定个体与时间效应之后，系数仍显著，说明关联不是由遗漏变量造成的',
  '剔除季节因素之后，销量依然增长，说明上升不是由节假日造成的',
  '平减了价格之后，实际产出仍提高，说明增长不是由通胀带来的',
  '做了季节性调整之后，失业率仍下降，说明变化不是由季节波动引起的',
  '控制了学段之后，校际差距依然存在，说明差距不是由生源结构驱动的',
  '做了子样本检验之后，核心结论稳健，说明结果不是由样本外异常造成的',
];

// ─── A2 节语料：5 条支②「归因于否定形」（无需方法学语境共现）──────────
const BENIGN_ATTRIB = [
  '增长不能归因于新规',
  '下降不能归因于竞争对手的促销',
  '效应估计的差异不能归咎于抽样误差',
  '两组的差距难以归因于测量工具的不同',
  '结论的变化无从归因于分析脚本的调整',
];

// ─── B/C/D 节语料：攻击（含 9 条对抗形：方法学动词 × 「不是由…造成的」）─
// 计数锁定数组顺序 = [post_hoc, pseudo_causal, cum_hoc, common_cause, mediator_confusion]
const ATTACK = [
  { text: '我们调整了排期之后，交付量就稳定了，这不是由巧合造成的', counts: [2, 0, 0, 0, 0], note: '对抗形①：r220 登记的真后此句 + 排除法否定（无论断连接词，链不成立）' },
  { text: '我们调整了排期之后，交付量仍然在涨，可见增长不是由运气带来的', counts: [1, 1, 0, 0, 0], note: '对抗形②：三腿齐备但 Z=运气，运气对象守卫拦住' },
  { text: '公司控制了成本之后，利润就翻倍了，这不是由市场行情带来的', counts: [1, 0, 0, 0, 0], note: '对抗形③：无论断连接词' },
  { text: '他调整了作息之后，业绩仍然在涨，可见增长不是由运气带来的', counts: [1, 1, 0, 0, 0], note: '对抗形④：Z=运气，守卫拦住' },
  { text: '团队排除了干扰之后，效率就提高了，这不是由工具升级带来的', counts: [1, 1, 0, 0, 0], note: '对抗形⑤：无论断连接词' },
  { text: '我们匹配了关键词之后，流量就上去了，这不是由算法变动造成的', counts: [1, 0, 0, 0, 0], note: '对抗形⑥：无论断连接词' },
  { text: '他上任之后利润就涨了，这不是巧合造成的', counts: [1, 0, 0, 0, 0], note: 'r221 F 节边缘攻击①：无方法学动词、无「由」' },
  { text: '自从换了风水布局之后订单就来了，这不是巧合带来的', counts: [1, 0, 0, 0, 0], note: 'r221 F 节边缘攻击②：无方法学动词、无「由」' },
  { text: '他坚持早起之后业绩就翻倍，可见早起不是运气造成的', counts: [1, 1, 0, 0, 0], note: 'r221 F 节边缘攻击③：有连接词但无方法学动词、无「由」' },
  { text: '冰淇淋销量和溺水死亡率高度相关，所以吃冰淇淋会导致溺水。', counts: [0, 0, 1, 1, 0], note: 'cum_hoc/common_cause 存量攻击' },
  { text: '夏天冰淇淋销量和溺水死亡同步上升，说明吃冰淇淋导致溺水。', counts: [0, 0, 1, 1, 0], note: 'common_cause 存量攻击' },
  { text: '因为患者都吃了止痛药，所以疼痛和骨折没有关系。', counts: [0, 0, 0, 0, 1], note: 'mediator_confusion 存量攻击' },
  { text: '控制了消炎药用量之后，炎症和发烧就不相关了。', counts: [0, 0, 0, 0, 1], note: 'mediator_confusion 存量攻击（含控制动词）' },
  { text: '止痛药完全解释了损伤与痛苦之间的联系。', counts: [0, 0, 0, 0, 1], note: 'mediator_confusion 存量攻击' },
  { text: '一旦控制了收入，教育对健康就没有影响了。', counts: [0, 0, 0, 0, 1], note: 'mediator_confusion 存量攻击（含控制动词）' },
];

const phCount = x => checkPostHoc(x).count;
const pcCount = x => idx.checkPseudoCausal(x).count;
const cumCount = x => checkCumHoc(x).count;
const ccCount = x => checkCommonCause(x).count;
const mcCount = x => checkMediatorConfusion(x).count;
const fiveCounts = x => [phCount(x), pcCount(x), cumCount(x), ccCount(x), mcCount(x)];
// r221 踩坑②：gate 无 finding 时会塞 {dimension:'none', severity:0} 占位条目，
// 「findings.length===0」恒 false——判「无实质 finding」必须数 severity>0。
const realFindings = x => (gateMod.checkOutput(x).findings || []).filter(f => f.severity > 0);
const TARGET_DIMS = ['post_hoc', 'pseudo_causal', 'cum_hoc', 'common_cause', 'mediator_confusion'];

console.log('r222 方法学排除性否定因果归属豁免 / 五维收口');

t(`A1 方法学良性五维 detector 层零误伤（${BENIGN.length} 条）`, () => {
  const bad = BENIGN.filter(x => fiveCounts(x).some(c => c > 0));
  assert.deepStrictEqual(bad, [], `五维仍命中 ${bad.length} 条：\n  ${bad.join('\n  ')}`);
});

t(`A2 方法学良性 gate 层 pass 且 findings 不含五维（${BENIGN.length} 条）`, () => {
  const nonPass = BENIGN.filter(x => gateMod.checkOutput(x).gate.action !== 'pass');
  assert.deepStrictEqual(nonPass, [], `gate 非 pass ${nonPass.length} 条：\n  ${nonPass.join('\n  ')}`);
  const withDim = BENIGN.filter(x => realFindings(x).some(f => TARGET_DIMS.includes(f.dimension)));
  assert.deepStrictEqual(withDim, [], `findings 仍含目标五维 ${withDim.length} 条：\n  ${withDim.join('\n  ')}`);
});

t(`A3 支②归因于否定形豁免（${BENIGN_ATTRIB.length} 条：hasExclNegCausal + gate pass）`, () => {
  for (const x of BENIGN_ATTRIB) {
    assert.strictEqual(me.hasExclNegCausal(x), true, `「${x}」hasExclNegCausal 应为 true`);
    assert.strictEqual(gateMod.checkOutput(x).gate.action, 'pass', `「${x}」gate 应为 pass`);
  }
});

t(`B 攻击样本五维计数逐条锁定 + gate 非 pass（${ATTACK.length} 条）`, () => {
  for (const a of ATTACK) {
    assert.deepStrictEqual(fiveCounts(a.text), a.counts,
      `「${a.text}」五维计数期望 ${JSON.stringify(a.counts)}，实测 ${JSON.stringify(fiveCounts(a.text))}（${a.note}）`);
    assert.notStrictEqual(gateMod.checkOutput(a.text).gate.action, 'pass',
      `「${a.text}」gate 不应为 pass（${a.note}）`);
  }
});

t('C 运气对象守卫：Z=运气时三腿链成立也不豁免（2 条对抗攻击）', () => {
  const luck = [
    '我们调整了排期之后，交付量仍然在涨，可见增长不是由运气带来的',
    '他调整了作息之后，业绩仍然在涨，可见增长不是由运气带来的',
  ];
  for (const x of luck) {
    assert.strictEqual(me.EXCL_NEG_METHOD_ZH.test(x), true, `「${x}」三腿链本身应成立（证明是守卫在拦）`);
    assert.strictEqual(me.hasExclNegCausal(x), false, `「${x}」Z=运气，hasExclNegCausal 应为 false`);
  }
});

// ─── E 节：变异守卫（隔离写法：复制 src/ 整棵树到临时目录再变异）───────
// run-all.js 默认 JOBS=4 并发跑测试，原位变异会让并发中的其他测试读到被
// 改写的源码（r220/r221 同款隔离写法）。
function mutateSrc(replacements) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r222-mut-'));
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
  const meSrc = path.join(tmp, 'src', 'methodology-exempt.js');
  let cur = fs.readFileSync(meSrc, 'utf8');
  for (const [from, to] of replacements) {
    assert.ok(cur.includes(from), `副本 methodology-exempt.js 找不到变异点：${from.slice(0, 40)}`);
    cur = cur.replace(from, to);
  }
  fs.writeFileSync(meSrc, cur, 'utf8');
  return tmp;
}

t('E1 三腿链置恒假后良性必须重新被五维命中（共表承重）', () => {
  const tmp = mutateSrc([['const m = EXCL_NEG_METHOD_ZH.exec(text);', 'const m = null; // [r222-E1 变异] 支①链置恒假']]);
  try {
    const out = cp.execFileSync(process.execPath,
      ['-e', `const ph=require(${JSON.stringify(path.join(tmp, 'src', 'post-hoc.js'))}).checkPostHoc;
const pc=require(${JSON.stringify(path.join(tmp, 'src', 'index.js'))}).checkPseudoCausal;
const cum=require(${JSON.stringify(path.join(tmp, 'src', 'cum-hoc.js'))}).checkCumHoc;
const cc=require(${JSON.stringify(path.join(tmp, 'src', 'common-cause.js'))}).checkCommonCause;
const mc=require(${JSON.stringify(path.join(tmp, 'src', 'mediator-confusion.js'))}).checkMediatorConfusion;
const B=${JSON.stringify(BENIGN)};
let n=0; for(const x of B){ if(ph(x).count>0||pc(x).count>0||cum(x).count>0||cc(x).count>0||mc(x).count>0) n++; }
console.log(n);`],
      { encoding: 'utf8' });
    const n = parseInt(out.trim(), 10);
    assert.ok(n >= 12, `三腿链置恒假后只有 ${n}/${BENIGN.length} 条良性重新被命中（期望 ≥12）——共表不是真承重，守卫失效`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

t('E2 运气对象守卫置恒假后两条运气攻击必须转为被误豁免（守卫承重）', () => {
  const tmp = mutateSrc([['if (LUCK_OBJECT_ZH.test(m[1])) return false;', 'if (false && LUCK_OBJECT_ZH.test(m[1])) return false; // [r222-E2 变异] 守卫置恒假']]);
  try {
    const out = cp.execFileSync(process.execPath,
      ['-e', `const me=require(${JSON.stringify(path.join(tmp, 'src', 'methodology-exempt.js'))});
const L=${JSON.stringify([
  '我们调整了排期之后，交付量仍然在涨，可见增长不是由运气带来的',
  '他调整了作息之后，业绩仍然在涨，可见增长不是由运气带来的',
])};
let n=0; for(const x of L){ if(me.hasExclNegCausal(x)) n++; }
console.log(n);`],
      { encoding: 'utf8' });
    const n = parseInt(out.trim(), 10);
    assert.strictEqual(n, 2, `运气守卫置恒假后只有 ${n}/2 条运气攻击转为被误豁免（期望 2）——守卫不是真承重`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

t('E3 还原校验：仓库源码未被本轮变异触碰', () => {
  const cur = fs.readFileSync(path.join(ROOT, 'src', 'methodology-exempt.js'), 'utf8');
  assert.ok(!cur.includes('[r222-E1 变异]') && !cur.includes('[r222-E2 变异]'), '源码残留变异壳');
  assert.ok(cur.includes('const m = EXCL_NEG_METHOD_ZH.exec(text);'), '源码三腿链执行句被改动');
  assert.ok(cur.includes('if (LUCK_OBJECT_ZH.test(m[1])) return false;'), '源码运气守卫句被改动');
});

t('F 共表常量导出完整（负例脚本与后续轮次要能注入）', () => {
  for (const k of ['hasExclNegCausal', 'METHOD_ACT_ZH', 'ASSERT_CONNECTIVE_ZH', 'EXCL_NEG_BY_ZH', 'EXCL_NEG_METHOD_ZH', 'EXCL_NEG_ATTRIB_ZH', 'LUCK_OBJECT_ZH']) {
    assert.ok(me[k] !== undefined, `methodology-exempt.js 缺导出 ${k}`);
  }
  assert.strictEqual(typeof me.__internals, 'function', '__internals 应为函数');
  const internals = me.__internals();
  assert.ok(internals.EXCL_NEG_METHOD_ZH instanceof RegExp, '__internals 应导出各常量');
});
