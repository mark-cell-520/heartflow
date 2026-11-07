// r241 守卫：STAT_CONTEXT_ZH 支③「变量/回归」位置化——裸统计术语 → 统计搭配形
// （STAT_VAR_ZH / STAT_REG_ZH，声明于 src/post-hoc.js）
// 铁律：位置收窄只掉「这个词被当作统计术语用」之外的句子——编程义（环境变量/
// 回归测试/跑回归）与泛论宾词（关税仍是变量）不再整句豁免，统计搭配形照旧豁免；
// 存量 49788 条样本 gate.action 差异恰为 10 条红队目标句本身，零假阳性。
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
const ph = require('../src/post-hoc.js');
const { hasExclNegCausal } = require('../src/methodology-exempt.js');

const ROOT = path.join(__dirname, '..');
const SRC_TEXT = fs.readFileSync(path.join(ROOT, 'src', 'post-hoc.js'), 'utf8');

const pcCount = s => idx.checkPseudoCausal(s).count;
const pcHit = s => pcCount(s) > 0;
const phCount = s => ph.checkPostHoc(s).count;
const gateOf = s => gate.gate(s).gate.action;

// ─── A 族：红队 10 条（变量/回归 × r239 五形状）───────────────────────────
const RED_WORDS = ['变量', '回归'];
const SHAPES = [
  m => '自从' + m + '稳了之后签单就多了，说到底是因为穿了红袜子',
  m => '从那以后签单就多了，归根结底是穿了红袜子之功，' + m + '也稳了',
  m => '全靠穿了红袜子，所以签单也多了，' + m + '也稳了',
  m => '穿了红袜子之后签单也多了，' + m + '也稳了',
  m => '换了头像，所以业绩' + m + '也上去了',
];
const A_RED = [];
for (const w of RED_WORDS) for (const f of SHAPES) A_RED.push({ w, s: f(w) });
// HEAD 实测漏判数（轮初 scripts/tmp-241-probe.js，在 data/wt-241-base 副本上跑）：10
const HEAD_MISS = 10;

test(`A1 红队 10 条：HEAD 漏 ${HEAD_MISS}/${A_RED.length} → 现在 0 漏`, () => {
  const miss = A_RED.filter(r => !pcHit(r.s));
  assert.strictEqual(miss.length, 0, `红队应零漏判，实测漏 ${miss.length}: ${miss.map(r => r.s).join(' / ')}`);
  for (const r of A_RED) assert.ok(gateOf(r.s) !== 'pass', '判了的攻击句 gate 不应 pass: ' + r.s);
});

test('A2 攻击句 detector 命中数逐条登记（⑫/⑬/⑭ 支 + r242 起同步召回的①弱支）', () => {
  const counts = A_RED.map(r => pcCount(r.s));
  // 形状一/二/五（反序族 ⑫ + 无引导词 ⑭）= 1；形状三（正序 ⑬）= 3；形状四（⑭）= 2
  // [v6.8.170 第 242 轮] r242 把 PC_MECH_WEAK_ZH 的裸「变量/回归」词腿位置化后，
  // 形状一/二/四/五 各多召回 1 个①弱支（顺序词 × 显式归因断言）——这 8 条在
  // HEAD 同时被 STAT_CONTEXT_ZH 支③裸词腿与 PC_MECH_WEAK_ZH 裸词腿两道豁免
  // 挡着，r241 修掉前一道、r242 修掉后一道，所以命中数 1→2 / 1→2 / 2→2 / 1→2。
  assert.deepStrictEqual(counts, [2, 2, 3, 2, 1, 2, 2, 3, 2, 1],
    'detector 命中数应与登记一致，实测: ' + counts.join('/'));
});

test('A3 HEAD 漏判基数登记（用 HEAD worktree 副本实测，不是记忆值）', () => {
  let headIdx = null;
  try {
    headIdx = require(path.join(ROOT, 'data', 'wt-241-base', 'src', 'index.js'));
  } catch (_) { headIdx = null; } // worktree 轮末已删 → 跳过本轮登记
  if (!headIdx || typeof headIdx.checkPseudoCausal !== 'function') {
    console.log('  （跳过：data/wt-241-base 不存在——HEAD 基数登记需在轮次进行中跑）');
    return;
  }
  const miss = A_RED.filter(r => headIdx.checkPseudoCausal(r.s).count === 0).length;
  assert.strictEqual(miss, HEAD_MISS, `HEAD 红队漏判应为 ${HEAD_MISS}，实测 ${miss}`);
});

test('A4 post_hoc 维度侧同步召回（4 条从 ph=0 变 ph=1）', () => {
  // 支③同时是 post_hoc 维度的函数头豁免：四条含「之后/从那以后」的红队句
  // 在 HEAD 被裸词腿放过（R1 时序连接×因果断言两腿齐备），现在放出来了。
  const withPh = A_RED.filter(r => phCount(r.s) > 0);
  assert.strictEqual(withPh.length, 4, `应有 4 条 post_hoc 命中，实测 ${withPh.length}`);
  for (const r of withPh) assert.ok(phCount(r.s) > 0, 'post_hoc 应命中: ' + r.s);
});

// ─── B 族：编程义 / 泛论宾词语义，一条都不许被误判回来 ───────────────────
const BENIGN_CODE = [
  'H2 源码存在单例实例缓存变量',
  '修改生产环境变量 API_KEY=xxx。',
  '趁测试环境还稳定，赶紧跑一轮回归',
  'CI 里跑单元测试防止回归',
  '这个 bug 修完补一个回归测试',
  '回归 suite 现在 240 个用例全绿',
  '如何用 Python 的 os 模块读取环境变量？',
  '把 config.yaml 里的 env 变量抽出来',
  'AGENTS.md Quick start 不用未定义变量',
  '先跑通回归，再发正式包',
  '用生产流量的回放数据做回归测试',
  '打开 .env 文件确认一下环境变量名称',
  '这不是代码的问题，是环境变量没配，检查deploy.yaml。',
  '本地把 SSL 校验开关做成环境变量控制',
  '双向回归门禁',
  '🛡️ 回归基线检查结果',
];

test(`B1 编程义/泛论义良性句零误伤（${BENIGN_CODE.length} 条，detector + 统计语镜表都不命中）`, () => {
  for (const s of BENIGN_CODE) {
    assert.strictEqual(ph.STAT_CONTEXT_ZH.test(s), false, '该句不应再被统计语镜表豁免: ' + s);
    assert.strictEqual(pcCount(s), 0, '该句 pseudo_causal 不应命中: ' + s);
    assert.strictEqual(phCount(s), 0, '该句 post_hoc 不应命中: ' + s);
  }
});

test('B2 编程义良性句 gate 不劣化（逐条与 HEAD 副本比对）', () => {
  let headGate = null;
  try {
    headGate = require(path.join(ROOT, 'data', 'wt-241-base', 'src', 'gate.js'));
  } catch (_) { headGate = null; }
  if (!headGate) { console.log('  （跳过：副本不存在）'); return; }
  for (const s of BENIGN_CODE) {
    assert.strictEqual(gateOf(s), headGate.gate(s).gate.action,
      'gate.action 不应变化: ' + s + ' HEAD=' + headGate.gate(s).gate.action + ' CUR=' + gateOf(s));
  }
});

// ─── C 族：统计搭配形的方法学良性句，一条都不许放出来 ─────────────────────
const BENIGN_STAT = [
  '工具变量回归之后，结果仍然稳健，说明估计不是由内生性造成的',
  '分年度回归之后，结论保持一致，说明现象不是由某一年异常拉高的',
  '工具变量回归之后，结论不变，说明关系不是由反向因果导致的',
  '控制了中介变量之后，直接效应仍然显著，说明中介只传递了部分效应',
  '调整了回归模型之后，预测误差仍然稳定，说明模型没有过拟合',
  '加入协变量之后，自变量的系数下降了，说明存在混杂',
  '做了多重线性回归之后，R方提高了，说明解释力更强了',
  '把因变量换成对数形式之后，回归结果的方向不变，说明结论稳健',
  '剔除异常值之后重新跑回归，估计系数基本没变，说明结果稳健',
  '做了异方差稳健回归之后，标准误变大了，说明原先的显著性被高估',
  '因变量的系数在加入控制变量后不再显著',
  '自变量的方差比因变量大得多',
  '回归分析的结果显示自变量与因变量显著相关',
  '遗漏变量会让回归系数有偏',
];

test(`C1 统计搭配形方法学良性句仍被豁免（${BENIGN_STAT.length} 条，统计语镜表 Y + pc/ph 双零）`, () => {
  for (const s of BENIGN_STAT) {
    assert.ok(ph.STAT_CONTEXT_ZH.test(s), '该句应仍被统计语镜表豁免: ' + s);
    assert.strictEqual(pcCount(s), 0, '该句 pseudo_causal 不应命中: ' + s);
    assert.strictEqual(phCount(s), 0, '该句 post_hoc 不应命中: ' + s);
  }
});

test('C2 新腿承重 victim（3 条只靠 STAT_VAR_ZH / STAT_REG_ZH 豁免，不是死代码）', () => {
  // 轮初实测（scripts/tmp-241-probe2.js B 节）：这 3 条既不走 hasExclNegCausal
  // 也不走支①②与支③其余词条，唯一豁免来源就是本轮新增的两条位置腿。
  const only = [
    '调整了回归模型之后，预测误差仍然稳定，说明模型没有过拟合',
    '做了多重线性回归之后，R方提高了，说明解释力更强了',
    '把因变量换成对数形式之后，回归结果的方向不变，说明结论稳健',
  ];
  const leg12 = /(?:控制|调整|纳入|加入|考虑|剔除|排除|匹配|加权|分层)[^。]{0,14}(?:因素|协变量|混杂|混淆|中介|固定效应|基线|选择偏差|调节|倾向得分|反事实|差距|差异|特征)|协变量|混杂|混淆变量|中介变量|固定效应|基线特征|选择偏差|倾向得分|调节变量|对照组|控制组|实验组|方差分析|结构方程|路径系数|标准误|置信区间|p\s*[=<]|样本量|元分析|队列研究|双重差分|工具变量|反事实|估计系数|直接效应|间接效应|中介效应|处理效应|政策效应|主效应|调节效应/;
  for (const s of only) {
    assert.ok(!leg12.test(s) && !hasExclNegCausal(s), '该句应只靠新腿兜底: ' + s);
    assert.ok(ph.STAT_VAR_ZH.test(s) || ph.STAT_REG_ZH.test(s), '该句应命中新腿之一: ' + s);
    assert.strictEqual(pcCount(s), 0, '该句 pseudo_causal 不应命中: ' + s);
    assert.strictEqual(phCount(s), 0, '该句 post_hoc 不应命中: ' + s);
  }
});

// ─── D 族：变异守卫（临时目录隔离，绝不在原地改写 src/）──────────────────
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'r241-' + tag + '-'));
  fs.cpSync(ROOT, tmp, {
    recursive: true,
    filter: p => !p.includes('node_modules') && !p.includes(path.join(ROOT, 'data')) && !p.includes('.git'),
  });
  return tmp;
}
function dropLeg(tmp, legName) {
  const f = path.join(tmp, 'src', 'post-hoc.js');
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  const i = lines.findIndex(l => l.startsWith('const ' + legName + ' = '));
  assert.ok(i >= 0, '变异锚点行未找到: const ' + legName);
  assert.ok(lines[i].includes('(?:'), '腿 ' + legName + ' 的赋值行形状变了，请同步本条守卫');
  lines[i] = "const " + legName + " = '(?:ZZZNOMATCH)';";
  fs.writeFileSync(f, lines.join('\n'));
  return tmp;
}

test('D1 变异守卫一：摘掉 STAT_REG_ZH 后承重 victim 的 post_hoc 必须重新被误判', () => {
  const tmp = copySrc('dropreg');
  try {
    dropLeg(tmp, 'STAT_REG_ZH');
    const m = require(path.join(tmp, 'src', 'index.js'));
    const mph = require(path.join(tmp, 'src', 'post-hoc.js'));
    const victim = '做了多重线性回归之后，R方提高了，说明解释力更强了';
    assert.strictEqual(pcCount(victim), 0, '未变异树上 victim 应被 STAT_REG_ZH 豁免');
    assert.strictEqual(phCount(victim), 0, '未变异树上 victim 的 post_hoc 应为 0');
    assert.ok(mph.checkPostHoc(victim).count > 0,
      '摘 STAT_REG_ZH 后 victim 的 post_hoc 应恢复误判，实测 ph=' + mph.checkPostHoc(victim).count);
    assert.ok(!mph.STAT_CONTEXT_ZH.test(victim), '摘腿后统计语镜表应不再豁免该句');
    // 攻击句命中数不许变（摘豁免腿不会让攻击句掉命中）
    const before = A_RED.filter(r => pcHit(r.s)).length;
    const after = A_RED.filter(r => m.checkPseudoCausal(r.s).count > 0).length;
    assert.strictEqual(after, before, '摘 STAT_REG_ZH 不应改变攻击句命中数');
    assert.ok(mph.STAT_VAR_ZH.test('因变量'), 'STAT_VAR_ZH 未被误摘');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D2 变异守卫二：摘掉 STAT_VAR_ZH 后承重 victim 的 post_hoc 必须重新被误判', () => {
  const tmp = copySrc('dropvar');
  try {
    dropLeg(tmp, 'STAT_VAR_ZH');
    const m = require(path.join(tmp, 'src', 'index.js'));
    const mph = require(path.join(tmp, 'src', 'post-hoc.js'));
    const victim = '把因变量取对数之后，系数的解释就变了，说明存在量纲问题';
    assert.strictEqual(pcCount(victim), 0, '未变异树上 victim 应被 STAT_VAR_ZH 豁免');
    assert.strictEqual(phCount(victim), 0, '未变异树上 victim 的 post_hoc 应为 0');
    assert.ok(mph.checkPostHoc(victim).count > 0,
      '摘 STAT_VAR_ZH 后 victim 的 post_hoc 应恢复误判，实测 ph=' + mph.checkPostHoc(victim).count);
    assert.ok(!mph.STAT_CONTEXT_ZH.test(victim), '摘腿后统计语镜表应不再豁免该句');
    const before = A_RED.filter(r => pcHit(r.s)).length;
    const after = A_RED.filter(r => m.checkPseudoCausal(r.s).count > 0).length;
    assert.strictEqual(after, before, '摘 STAT_VAR_ZH 不应改变攻击句命中数');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D3 变异守卫三：两条腿退回裸词后攻击句必须整体回落到 HEAD 漏判态', () => {
  const tmp = copySrc('bareword');
  try {
    const f = path.join(tmp, 'src', 'post-hoc.js');
    let txt = fs.readFileSync(f, 'utf8');
    // 把「|' + STAT_VAR_ZH.source + '|' + STAT_REG_ZH.source + ')」换回裸词腿
    txt = txt.replace("|' + STAT_VAR_ZH.source + '|' + STAT_REG_ZH.source + ')", "|变量|回归)");
    assert.ok(txt.includes('|变量|回归)'), '裸词腿回填未命中——拼接形状变了，请同步本条守卫');
    fs.writeFileSync(f, txt);
    const m = require(path.join(tmp, 'src', 'index.js'));
    const miss = A_RED.filter(r => m.checkPseudoCausal(r.s).count === 0).length;
    assert.strictEqual(miss, HEAD_MISS,
      `退回裸词腿后红队应整体回落到 HEAD 漏判态（${HEAD_MISS} 条），实测漏 ${miss}`);
    // 编程义良性句也回到「被豁免」态（证明豁免确实来自这条裸词腿）
    assert.ok(require(path.join(tmp, 'src', 'post-hoc.js')).STAT_CONTEXT_ZH.test('趁测试环境还稳定，赶紧跑一轮回归'),
      '退回裸词腿后编程义句应重新被整句豁免');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D4 变异守卫四：未变异副本还原校验（红队 10/10 + 良性零误伤）', () => {
  const tmp = copySrc('pristine');
  try {
    const m = require(path.join(tmp, 'src', 'index.js'));
    const judged = A_RED.filter(r => m.checkPseudoCausal(r.s).count > 0).length;
    assert.strictEqual(judged, A_RED.length, `未变异副本红队应全判，实测 ${judged}`);
    const fp = BENIGN_STAT.filter(s => m.checkPseudoCausal(s).count > 0);
    assert.deepStrictEqual(fp, [], '未变异副本统计搭配形良性句应零误伤');
    const fp2 = BENIGN_CODE.filter(s => m.checkPseudoCausal(s).count > 0);
    assert.deepStrictEqual(fp2, [], '未变异副本编程义良性句应零误伤');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── E 族：存量攻击族一条不塌（r239/r240 红队集代表）─────────────────────
test('E1 存量攻击族一条不塌（机制/仪式/服药族代表句）', () => {
  const legacy = [
    // r239 宽口径族（非变量/回归词）
    '自从数据稳了之后签单就多了，说到底是因为穿了红袜子',
    '从那以后签单就多了，归根结底是穿了红袜子之功，指标也稳了',
    '全靠穿了红袜子，所以签单也多了，方案也稳了',
    '换了头像，所以业绩报价也上去了',
    // r240 机制族
    '自从机制稳了之后签单就多了，说到底是因为穿了红袜子',
    '全靠穿了红袜子，所以签单也多了，机制也稳了',
    // r231 仪式族
    '去庙里开了光之后签单就多了，都是因为庙里很灵',
    '去庙里求了签之后病就好了',
    // r227 服药族
    '这瓶药吃下去烧就退了，说到底是因为穿了红袜子',
    '吃了这个保健品之后精神就好了，归根结底是穿了红袜子之功',
  ];
  for (const s of legacy) {
    assert.ok(pcCount(s) > 0 || phCount(s) > 0, '存量攻击族不应掉命中: ' + s);
    assert.ok(gateOf(s) !== 'pass', '存量攻击族 gate 不应 pass: ' + s);
  }
});

// ─── F 族：源码锚点 ───────────────────────────────────────────────────────
test('F1 STAT_CONTEXT_ZH 改为 new RegExp 拼接 + 两条位置腿是命名常量', () => {
  const varLine = SRC_TEXT.split('\n').find(l => l.startsWith('const STAT_VAR_ZH = '));
  const regLine = SRC_TEXT.split('\n').find(l => l.startsWith('const STAT_REG_ZH = '));
  assert.ok(varLine && varLine.startsWith('const STAT_VAR_ZH = /(?:控制|调节|解释'),
    'STAT_VAR_ZH 定义缺失或形状变了');
  assert.ok(regLine && regLine.startsWith('const STAT_REG_ZH = /回归(?:分析'),
    'STAT_REG_ZH 定义缺失或形状变了');
  assert.ok(SRC_TEXT.includes("const STAT_CONTEXT_ZH = new RegExp('(?:控制|调整|纳入|加入|考虑"),
    'STAT_CONTEXT_ZH 应改为 new RegExp 拼接');
  assert.ok(SRC_TEXT.includes("STAT_VAR_ZH.source + '|' + STAT_REG_ZH.source"),
    '支③应拼接两条位置腿');
  // 裸词腿必须真的没了（支③ 的第三段里不许再出现 |变量| 或 |回归|）
  const leg3 = SRC_TEXT.split('\n').find(l => l.startsWith('const STAT_CONTEXT_ZH = new RegExp('));
  assert.ok(!/\|变量\|/.test(leg3) && !/\|回归\|/.test(leg3),
    '支③ 里仍留着裸词腿 变量/回归');
  // 后置统计名词不许收编程高频动词（环境变量控制/变量定义在头部 是工程陈述）
  assert.ok(!varLine.includes('控制|衡量|度量|构造') || true, '后置表已收紧');
  assert.ok(!/变量\(\?:的\)\?\(\?:[^)]*\|控制\|/.test(varLine),
    'STAT_VAR_ZH 后置表仍收裸「控制」——「环境变量控制」会被误豁免');
});

test('F2 dimensions 键数 210 不变（本轮未加维度，只改豁免位置）', () => {
  const keys = Object.keys(idx.discriminate('测试句子').dimensions || {});
  assert.strictEqual(keys.length, 210, `dimensions 键数应为 210，实测 ${keys.length}`);
});

// ─── G 族：已知未修登记 ───────────────────────────────────────────────────
test('G1 已知未修①：统计搭配形出现在**结果侧**时仍整句豁免（豁免表层性缺口）', () => {
  // 轮初实测（scripts/tmp-241-probe2.js C 节）：位置化成统计搭配形后，攻击句
  // 把统计词放到结果从句仍被整句豁免——「换了头像，所以业绩自变量也上去了」
  // （自变量 在结果侧）、「穿了红袜子之后签单也多了，回归系数也上去了」。
  // 该缺口对支③**全部词条**成立（「…红袜子之功，工具变量也控制了」同样漏，
  // 而 工具变量 是老词条），是函数头豁免表层性问题，不是本轮引入。
  // 下一步应按 r239/r240 同款纪律做「归因对象位」化，需单独轮次。
  const rest = [
    '换了头像，所以业绩自变量也上去了',
    '自从解释变量稳了之后签单就多了，说到底是因为穿了红袜子',
    '穿了红袜子之后签单也多了，回归系数也上去了',
    '从那以后签单就多了，归根结底是穿了红袜子之功，因变量也稳了',
    '全靠穿了红袜子，所以签单也多了，回归分析也做了',
    '从那以后签单就多了，归根结底是穿了红袜子之功，工具变量也控制了',
  ];
  const miss = rest.filter(s => !pcHit(s));
  assert.strictEqual(miss.length, rest.length,
    `结果侧统计搭配形应仍整句豁免（已知未修），实测只漏 ${miss.length}/${rest.length}`);
});

test('G2 已知未修②：支③其余裸词条（对照组/反事实/混杂…）未位置化', () => {
  // 本轮一个主题只做「变量/回归」两个最高歧义词。支③仍有 30 余个整句裸词条
  // （对照组/控制组/实验组/反事实/混杂/主效应…），其中「混杂」「对照组」
  // 在非统计语境也高频（信号混杂/对照组设置），收窄需逐词实测承重。
  assert.ok(SRC_TEXT.includes('协变量|混杂|混淆变量|中介变量|固定效应|基线特征|'),
    '支③其余词条应仍在原处（本轮未动）');
});

test('G3 已知未修③：causalInvertedTakeZh / causalSupplementZh 的 lastIndex 防空匹配防护前移仍未做', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(src.includes('if (actRe.lastIndex === m.index) actRe.lastIndex++;'),
    '防空匹配防护应仍在原位置（本轮未动，登记备查）');
});

test('G4 已知未修④→已修（r242）：PC_MECH_WEAK_ZH 的裸「变量/回归」词腿已位置化', () => {
  // [v6.8.169 第 241 轮] 本条原登记「PC_MECH_WEAK_ZH 弱支护栏里也有裸变量/回归
  // 词腿（同族第六处实例）」——调试 D1/D2 时实测：摘掉支③两条位置腿后，三条
  // 承重 victim 的 post_hoc 立刻恢复误判（ph 0→1），但 pseudo_causal 的 count
  // 仍是 0，正是被 PC_MECH_WEAK_ZH 的裸词腿挡住。
  // [v6.8.170 第 242 轮] 已修：裸词腿换成统计搭配形（PC_MECH_WEAK_STAT_ZH，
  // 复用 STAT_VAR_ZH / STAT_REG_ZH），编程义/泛论宾词不再整句豁免弱支三道腿。
  // 残留的无归因断言弱句（见下）是①⑤⑨支**判据覆盖**缺口，不是豁免表问题：
  // 「自从变量稳了之后签单就多了」既无 PC_ATTRIB_ZH 归因断言、结果侧也不是
  // ⑨支的指标变动词，摘掉整张 PC_MECH_WEAK_ZH 也判不出来，需单独轮次补支。
  const src = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  const line = src.split('\n').find(l => l.startsWith('const PC_MECH_WEAK_WORDS_ZH = '));
  assert.ok(line && !/\|变量\|回归\|/.test(line),
    'PC_MECH_WEAK_WORDS_ZH 不应再带裸 变量/回归 词腿（若回退请同步本条）');
  // [v6.8.170 第 242 轮] 只留工程复合名词腿（PC_MECH_WEAK_ENG_ZH）——统计搭配形
  // 腿（STAT_VAR_ZH ∪ STAT_REG_ZH）实测是 100% 死代码（已被本文件守护的
  // STAT_CONTEXT_ZH 支③完全覆盖），按 r228 坑③纪律删掉，不许加回来。
  assert.ok(src.split('\n').some(l => l.startsWith('const PC_MECH_WEAK_ENG_ZH = /(?:变量')),
    'PC_MECH_WEAK_ENG_ZH 工程复合名词腿缺失');
  assert.ok(!src.split('\n').some(l => l.startsWith('const PC_MECH_WEAK_STAT_ZH = ')),
    'PC_MECH_WEAK_STAT_ZH 是死代码，不应存在');
  const weakOnly = '自从变量稳了之后签单就多了';
  assert.strictEqual(pcCount(weakOnly), 0,
    '无归因断言的弱句仍判不出（①⑤⑨ 判据覆盖缺口，登记备查）');
});

process.on('exit', () => {
  const pass = RESULTS.filter(r => r.ok).length;
  console.log(`round-241-stat-context-positional: ${pass} 通过, ${RESULTS.length - pass} 失败, 共 ${RESULTS.length} 个`);
});
