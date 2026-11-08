// r242 守卫：PC_MECH_WEAK_ZH 弱支机制豁免表的裸「变量/回归」词腿位置化——
// 裸抽象名词整句在场 → 复合术语在场（PC_MECH_WEAK_STAT_ZH 统计搭配形 +
// PC_MECH_WEAK_ENG_ZH 工程复合名词）
// 铁律：位置收窄只掉「变量/回归 被当作裸抽象名词用」的句子——统计搭配形
// （回归模型/协变量/异方差稳健回归）与工程复合名词（回归测试/环境变量/回归 suite）
// 照旧豁免；「自从变量稳了之后」这类把裸抽象名词当假机制的弱支攻击句整族翻面。
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
const SRC_TEXT = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');

const pcCount = s => idx.checkPseudoCausal(s).count;
const pcHit = s => pcCount(s) > 0;
const phCount = s => ph.checkPostHoc(s).count;
const gateOf = s => gate.gate(s).gate.action;

// ─── A 族：弱支红队 11 条（①⑤⑨ 支 × 变量/回归 作裸抽象名词）──────────────
// 轮初实测（scripts/tmp-242-red.js + data/wt-242-base 副本）：这 11 条在 HEAD
// 全部 pc=0、gate 全 pass——第⑨支（顺序词 × 指标变动）与第①支（顺序词 ×
// 归因断言）的形状都齐了，唯一挡住它们的是 PC_MECH_WEAK_ZH 的裸词腿。
const A_RED = [
  // ⑨ 支：顺序词 × 指标变动词
  '自从变量稳了之后，客诉就下滑了',
  '自从回归稳了之后，退货率就降低了',
  '回归之后，转化率提高了',
  '回归稳了之后，代码缺陷就变少了',
  '自从变量稳了之后，故障率下降了',
  '变量稳了之后，客诉就下滑了',
  // ⑤ 支：…后，就一路…
  '回归之后签单就一路多了',
  // ① 支：顺序词 × 显式归因断言
  '自从回归稳了之后签单就少了，看来是头像的问题',
  '自从变量稳了之后业绩就差了，显然是头像导致的',
  '回归稳了之后，签单就少了，可见是换了头像的功劳',
  // ①⑨ 双支
  '自从变量稳了之后，成本就下降了，说明是头像之功',
];
const HEAD_MISS = 11;

test(`A1 弱支红队 ${A_RED.length} 条：HEAD 漏 ${HEAD_MISS}/${A_RED.length} → 现在 0 漏`, () => {
  const miss = A_RED.filter(s => !pcHit(s));
  assert.strictEqual(miss.length, 0, `弱支红队应零漏判，实测漏 ${miss.length}: ${miss.join(' / ')}`);
  for (const s of A_RED) assert.ok(gateOf(s) !== 'pass', '判了的攻击句 gate 不应 pass: ' + s);
});

test('A2 攻击句 detector 命中数逐条登记', () => {
  const counts = A_RED.map(pcCount);
  // 前 10 条各命中 1 支；末条「成本就下降了，说明是头像之功」①⑨ 双支 = 2
  assert.deepStrictEqual(counts, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    'detector 命中数应与登记一致，实测: ' + counts.join('/'));
});

test('A3 HEAD 漏判基数登记（用 HEAD worktree 副本实测，不是记忆值）', () => {
  let headIdx = null;
  try {
    headIdx = require(path.join(ROOT, 'data', 'wt-242-base', 'src', 'index.js'));
  } catch (_) { headIdx = null; } // worktree 轮末已删 → 跳过本轮登记
  if (!headIdx || typeof headIdx.checkPseudoCausal !== 'function') {
    console.log('  （跳过：data/wt-242-base 不存在——HEAD 基数登记需在轮次进行中跑）');
    return;
  }
  const miss = A_RED.filter(s => headIdx.checkPseudoCausal(s).count === 0).length;
  assert.strictEqual(miss, HEAD_MISS, `HEAD 弱支红队漏判应为 ${HEAD_MISS}，实测 ${miss}`);
});

// ─── B 族：编程义 × 弱支的良性句，一条都不许被收窄误伤 ───────────────────
// 这一族是本轮设计定型的关键：只收统计搭配形不收工程复合名词时，轮初实测
// 这 12 条里 8 条 pc 0→1（「补了回归测试之后，线上故障率下降了」等）。
const BENIGN_ENG = [
  '把环境变量改成配置文件之后，故障率下降了',
  '修改了环境变量之后，接口报错就变少了',
  '补了回归测试之后，线上故障率下降了',
  '调整了回归基线之后，构建失败就变少了',
  '重构了缓存层之后，延迟就一路下降了',
  '把 SSL 校验做成环境变量控制之后，扫描告警就变少了',
  '上了回归 suite 之后，线上事故就下滑了',
  '统一了环境变量命名之后，配置错误率下降了',
  '补了回归用例之后，缺陷密度就立刻下降了',
  '跑一轮回归之后，线上告警就变少了',
  '做了回归基线对比之后，构建失败率下降了',
  '收敛了全局变量之后，并发问题就变少了',
];

test(`B1 编程义×弱支良性句零误伤（${BENIGN_ENG.length} 条，detector 不判）`, () => {
  for (const s of BENIGN_ENG) {
    assert.strictEqual(pcCount(s), 0, '该句 pseudo_causal 不应命中: ' + s);
  }
});

test('B2 编程义良性句 gate / post_hoc 不劣化（逐条与 HEAD 副本比对）', () => {
  let headGate = null, headPh = null;
  try {
    headGate = require(path.join(ROOT, 'data', 'wt-242-base', 'src', 'gate.js'));
    headPh = require(path.join(ROOT, 'data', 'wt-242-base', 'src', 'post-hoc.js'));
  } catch (_) { headGate = null; headPh = null; }
  if (!headGate || !headPh) { console.log('  （跳过：副本不存在）'); return; }
  for (const s of BENIGN_ENG) {
    assert.strictEqual(gateOf(s), headGate.gate(s).gate.action,
      'gate.action 不应变化: ' + s + ' HEAD=' + headGate.gate(s).gate.action + ' CUR=' + gateOf(s));
    assert.strictEqual(phCount(s), headPh.checkPostHoc(s).count,
      'post_hoc 不应变化: ' + s + ' HEAD=' + headPh.checkPostHoc(s).count + ' CUR=' + phCount(s));
  }
});

// ─── C 族：统计搭配形的方法学良性句，一条都不许放出来 ─────────────────────
const BENIGN_STAT = [
  '调整了回归模型之后，预测误差仍然稳定，说明模型没有过拟合',
  '做了多重线性回归之后，R方提高了，说明解释力更强了',
  '把因变量换成对数形式之后，回归结果的方向不变，说明结论稳健',
  '把因变量取对数之后，系数的解释就变了，说明存在量纲问题',
  '加入协变量之后，自变量的系数下降了，说明存在混杂',
  '做了异方差稳健回归之后，标准误变大了，说明原先的显著性被高估',
  '剔除异常值之后重新跑回归，估计系数基本没变，说明结果稳健',
  '控制了中介变量之后，直接效应仍然显著，说明中介只传递了部分效应',
];

test(`C1 统计搭配形方法学良性句仍被豁免（${BENIGN_STAT.length} 条，pc/ph 双零）`, () => {
  for (const s of BENIGN_STAT) {
    assert.strictEqual(pcCount(s), 0, '该句 pseudo_causal 不应命中: ' + s);
    assert.strictEqual(phCount(s), 0, '该句 post_hoc 不应命中: ' + s);
  }
});

test('C2 工程复合名词腿承重 victim（3 条只靠 PC_MECH_WEAK_ENG_ZH 豁免，不是死代码）', () => {
  // 前置筛选：既不走 hasExclNegCausal、不走 STAT_CONTEXT_ZH（统计方法学良性句
  // 全被函数头兜住，见 src/index.js 该腿上方注释），也不含 PC_MECH_WEAK_WORDS_ZH
  // 的任何机制名词——唯一豁免来源就是本轮新增的工程复合名词腿。
  // 三条分别压在后缀族①③与动词族④上（前缀族②由 B1 的「环境变量」族覆盖）。
  const only = [
    '补了回归测试之后，线上故障率下降了',                 // 族③ 回归+工程名词后缀
    '统一了环境变量命名之后，配置错误率下降了',           // 族① 变量+工程名词后缀
    '跑一轮回归之后，线上告警就变少了',                   // 族④ 工程动词+≤4字+回归
  ];
  const wordsLine = SRC_TEXT.split('\n').find(l => l.startsWith('const PC_MECH_WEAK_WORDS_ZH = '));
  const engLine = SRC_TEXT.split('\n').find(l => l.startsWith('const PC_MECH_WEAK_ENG_ZH = '));
  const WORDS = eval(wordsLine.slice('const PC_MECH_WEAK_WORDS_ZH = '.length).replace(/;$/, ''));
  const ENG = eval(engLine.slice('const PC_MECH_WEAK_ENG_ZH = '.length).replace(/;$/, ''));
  for (const s of only) {
    assert.ok(!hasExclNegCausal(s), '该句不应走排除性否定归因豁免: ' + s);
    assert.ok(!ph.STAT_CONTEXT_ZH.test(s), '该句不应被统计语镜表整句豁免: ' + s);
    assert.ok(!WORDS.test(s), '该句不应含 PC_MECH_WEAK_WORDS_ZH 的机制名词: ' + s);
    assert.ok(ENG.test(s), '该句应命中工程复合名词腿: ' + s);
    assert.strictEqual(pcCount(s), 0, '该句 pseudo_causal 不应命中: ' + s);
  }
});

// ─── D 族：变异守卫（临时目录隔离，绝不在原地改写 src/）──────────────────
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'r242-' + tag + '-'));
  fs.cpSync(ROOT, tmp, {
    recursive: true,
    filter: p => !p.includes('node_modules') && !p.includes(path.join(ROOT, 'data')) && !p.includes('.git'),
  });
  return tmp;
}
function dropLeg(tmp, legName) {
  const f = path.join(tmp, 'src', 'index.js');
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  const i = lines.findIndex(l => l.startsWith('const ' + legName + ' = '));
  assert.ok(i >= 0, '变异锚点行未找到: const ' + legName);
  assert.ok(lines[i].includes("(?:"), '腿 ' + legName + ' 的赋值行形状变了，请同步本条守卫');
  lines[i] = "const " + legName + " = '(?:ZZZNOMATCH)';";
  fs.writeFileSync(f, lines.join('\n'));
  return tmp;
}

test('D1 变异守卫一：摘掉 PC_MECH_WEAK_ENG_ZH 后工程复合名词 victim 必须重新被误判', () => {
  const tmp = copySrc('dropeng');
  try {
    dropLeg(tmp, 'PC_MECH_WEAK_ENG_ZH');
    const m = require(path.join(tmp, 'src', 'index.js'));
    for (const victim of ['补了回归测试之后，线上故障率下降了', '统一了环境变量命名之后，配置错误率下降了',
      '跑一轮回归之后，线上告警就变少了']) {
      assert.strictEqual(pcCount(victim), 0, '未变异树上 victim 应被工程复合名词腿豁免: ' + victim);
      assert.ok(m.checkPseudoCausal(victim).count > 0,
        '摘 PC_MECH_WEAK_ENG_ZH 后 victim 应恢复误判，实测 pc=' + m.checkPseudoCausal(victim).count + ': ' + victim);
    }
    // 攻击句命中数不许变（摘豁免腿不会让攻击句掉命中）
    const before = A_RED.filter(pcHit).length;
    const after = A_RED.filter(s => m.checkPseudoCausal(s).count > 0).length;
    assert.strictEqual(after, before, '摘 PC_MECH_WEAK_ENG_ZH 不应改变攻击句命中数');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D2 变异守卫二：只留变量两族（①②）时回归两族（③④）victim 必须重新被误判', () => {
  // 证明工程复合名词腿的四个族**各自承重**——只留变量的后缀族①与前缀族②时，
  // 「补了回归测试」（族③）失去庇护，而「统一了环境变量命名」（族①）仍被庇护。
  const tmp = copySrc('varonly');
  try {
    const f = path.join(tmp, 'src', 'index.js');
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    const i = lines.findIndex(l => l.startsWith('const PC_MECH_WEAK_ENG_ZH = '));
    assert.ok(i >= 0, '变异锚点行未找到: const PC_MECH_WEAK_ENG_ZH');
    lines[i] = 'const PC_MECH_WEAK_ENG_ZH = /(?:变量\\s?(?:名称|命名|作用域|生命周期|类型|声明|定义|初始化|赋值|取值|默认值|个数|数量)|(?:环境|全局|局部|静态|实例|成员|私有|公有|临时|常量|配置|入参|出参|返回|形参|实参|未定义|未声明|默认|可选|必填|中间|自由|核心|关键)变量)/;';
    fs.writeFileSync(f, lines.join('\n'));
    const m = require(f);
    assert.ok(m.checkPseudoCausal('补了回归测试之后，线上故障率下降了').count > 0,
      '只留变量两族时回归族③ victim 应恢复误判');
    assert.ok(m.checkPseudoCausal('跑一轮回归之后，线上告警就变少了').count > 0,
      '只留变量两族时回归族④ victim 应恢复误判');
    assert.strictEqual(m.checkPseudoCausal('统一了环境变量命名之后，配置错误率下降了').count, 0,
      '只留变量两族时变量族① victim 应仍被庇护');
    const before = A_RED.filter(pcHit).length;
    const after = A_RED.filter(s => m.checkPseudoCausal(s).count > 0).length;
    assert.strictEqual(after, before, '只留变量两族不应改变攻击句命中数');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D3 变异守卫三：工程腿退回裸词 + 机制名词表加回裸词后攻击句必须整体回落到 HEAD 漏判态', () => {
  const tmp = copySrc('bareword');
  try {
    const f = path.join(tmp, 'src', 'index.js');
    let txt = fs.readFileSync(f, 'utf8');
    // ① 工程复合名词腿摘掉（恒不匹配）
    txt = txt.replace('const PC_MECH_WEAK_ENG_ZH = /(?:变量', "const PC_MECH_WEAK_ENG_ZH = '(?:ZZZNOMATCH)';\nconst _DEAD_ENG_ZH = /(?:变量");
    assert.ok(txt.includes('const _DEAD_ENG_ZH = /(?:变量'), '工程复合名词腿摘除未命中');
    // ② 机制名词表加回裸 变量|回归（退回 r226 建表时的原状）
    txt = txt.replace('|原理|样本|实验组|', '|原理|样本|变量|回归|实验组|');
    assert.ok(txt.includes('|原理|样本|变量|回归|实验组|'), '裸词腿回填未命中');
    fs.writeFileSync(f, txt);
    const m = require(f);
    const miss = A_RED.filter(s => m.checkPseudoCausal(s).count === 0).length;
    assert.strictEqual(miss, HEAD_MISS,
      `退回裸词腿后红队应整体回落到 HEAD 漏判态（${HEAD_MISS} 条），实测漏 ${miss}`);
    // 编程义良性句也回到「被整句豁免」态（证明豁免确实来自这条裸词腿）
    const reJudged = BENIGN_ENG.filter(s => m.checkPseudoCausal(s).count > 0).length;
    assert.ok(reJudged < BENIGN_ENG.length,
      `退回裸词腿后应有部分编程义句重新被整句豁免，实测仍全判 ${reJudged}/${BENIGN_ENG.length}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D4 变异守卫四：未变异副本还原校验（红队 11/11 + 良性零误伤）', () => {
  const tmp = copySrc('pristine');
  try {
    const m = require(path.join(tmp, 'src', 'index.js'));
    const judged = A_RED.filter(s => m.checkPseudoCausal(s).count > 0).length;
    assert.strictEqual(judged, A_RED.length, `未变异副本红队应全判，实测 ${judged}`);
    const fp1 = BENIGN_STAT.filter(s => m.checkPseudoCausal(s).count > 0);
    assert.deepStrictEqual(fp1, [], '未变异副本统计搭配形良性句应零误伤');
    const fp2 = BENIGN_ENG.filter(s => m.checkPseudoCausal(s).count > 0);
    assert.deepStrictEqual(fp2, [], '未变异副本编程义良性句应零误伤');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── E 族：存量攻击族一条不塌（r226/r227/r231/r239/r240/r241 代表）────────
test('E1 存量攻击族一条不塌', () => {
  const legacy = [
    // r239 宽口径族（非变量/回归词）
    '自从数据稳了之后签单就多了，说到底是因为穿了红袜子',
    '从那以后签单就多了，归根结底是穿了红袜子之功，指标也稳了',
    '全靠穿了红袜子，所以签单也多了，方案也稳了',
    '换了头像，所以业绩报价也上去了',
    // r240 机制族
    '自从机制稳了之后签单就多了，说到底是因为穿了红袜子',
    '全靠穿了红袜子，所以签单也多了，机制也稳了',
    // r241 变量/回归 × 五形状（走⑫⑬⑭，不受弱支表影响）
    '自从变量稳了之后签单就多了，说到底是因为穿了红袜子',
    '从那以后签单就多了，归根结底是穿了红袜子之功，变量也稳了',
    '全靠穿了红袜子，所以签单也多了，回归也稳了',
    '穿了红袜子之后签单也多了，回归也稳了',
    '换了头像，所以业绩变量也上去了',
    // r231 仪式族
    '去庙里开了光之后签单就多了，都是因为庙里很灵',
    '去庙里求了签之后病就好了',
    // r227 服药族
    '这瓶药吃下去烧就退了，说到底是因为穿了红袜子',
    '吃了这个保健品之后精神就好了，归根结底是穿了红袜子之功',
    // r226 建表时的机制良性族（反豁免照判）
    '我们加了缓存之后延迟降了，说明缓存是唯一原因',
    '团队加了新人之后，代码缺陷率下降了，说明新人培训起了作用。',
  ];
  for (const s of legacy) {
    assert.ok(pcHit(s) || phCount(s) > 0, '存量攻击族不应掉命中: ' + s);
  }
});

// ─── F 族：源码锚点 ───────────────────────────────────────────────────────
test('F1 两条腿是命名常量 + 机制名词表不再带裸 变量/回归', () => {
  const wordsLine = SRC_TEXT.split('\n').find(l => l.startsWith('const PC_MECH_WEAK_WORDS_ZH = '));
  const engLine = SRC_TEXT.split('\n').find(l => l.startsWith('const PC_MECH_WEAK_ENG_ZH = '));
  const unionLine = SRC_TEXT.split('\n').find(l => l.startsWith('const PC_MECH_WEAK_ZH = '));
  assert.ok(wordsLine && wordsLine.startsWith('const PC_MECH_WEAK_WORDS_ZH = /(?:药效|药理'),
    'PC_MECH_WEAK_WORDS_ZH 定义缺失或形状变了');
  assert.ok(!/\|变量\|回归\|/.test(wordsLine), '机制名词表里仍留着裸 变量/回归 词腿');
  assert.ok(engLine && engLine.startsWith('const PC_MECH_WEAK_ENG_ZH = /(?:变量'),
    'PC_MECH_WEAK_ENG_ZH 定义缺失或形状变了');
  assert.ok(unionLine && unionLine.startsWith('const PC_MECH_WEAK_ZH = new RegExp(PC_MECH_WEAK_WORDS_ZH.source'),
    'PC_MECH_WEAK_ZH 应改为两腿 new RegExp 拼接');
  assert.ok(unionLine.includes("'|' + PC_MECH_WEAK_ENG_ZH.source)"), '并集应拼接两条腿');
  // 统计搭配形腿不许回来（它是 100% 死代码，见 src/index.js 该腿上方注释）
  assert.ok(!SRC_TEXT.split('\n').some(l => l.startsWith('const PC_MECH_WEAK_STAT_ZH = ')),
    'PC_MECH_WEAK_STAT_ZH 是死代码（被 STAT_CONTEXT_ZH 支③完全覆盖），不许加回来');
  // 工程复合名词腿必须真的收窄：不许退化成「变量|回归」裸词
  assert.ok(!/\|变量\|/.test(engLine) && !/^\|\?/.test(engLine), '工程腿退化成裸词腿了');
});

test('F2 dimensions 键数 210 不变（本轮未加维度，只改豁免位置）', () => {
  const keys = Object.keys(idx.discriminate('测试句子').dimensions || {});
  assert.strictEqual(keys.length, 210, `dimensions 键数应为 210，实测 ${keys.length}`);
});

test('F3 机制豁免仍只喂弱支（①⑤⑨），不许升级成函数级豁免', () => {
  assert.ok(SRC_TEXT.includes('PC_MECH_WEAK_ZH.test(text) && !PC_MONOCAUSE_ZH.test(text)'),
    '弱支守卫的机制豁免腿未接反豁免');
  assert.strictEqual(SRC_TEXT.split('PC_MECH_WEAK_ZH.test(text)').length - 1, 1,
    'PC_MECH_WEAK_ZH 应只被弱支守卫引用 1 次');
  assert.ok(!/if \(PC_MECH_WEAK_ZH/.test(SRC_TEXT), '机制豁免不许升级成函数级豁免');
});

// ─── G 族：已知未修登记 ─────────────────────────────────────────────────
test('G1 已知未修①【r243 已修】：无归因断言的弱句现可判出（⑨支第二腿，时段标记 × 白话结果变动词）', () => {
  // [v6.8.170 第 242 轮] 原登记：「自从变量稳了之后签单就多了」既无 PC_ATTRIB_ZH
  // 归因断言，结果侧也不是⑨支的指标变动词——摘掉整张 PC_MECH_WEAK_ZH 也判不出
  // 来，是判据覆盖缺口，需单独轮次补①⑤⑨的词表。
  // [v6.8.171 第 243 轮] **已修**：⑨支新增第二腿「时段框架标记 × 白话结果变动词」
  // （PC_SEQ_PERIOD_ZH × PC_RES_COLLOQ_ZH），这两句现在 pc=1、gate=verify。
  const rest = [
    '自从变量稳了之后签单就多了',
    '自从回归稳了之后签单就多了',
  ];
  for (const s of rest) assert.ok(pcCount(s) > 0, '该句现在应判得出（r243 已修）: ' + s);
});

test('G2 已知未修②：统计搭配形出现在结果侧时仍整句豁免（r241 G1 转挂）', () => {
  const rest = [
    '换了头像，所以业绩自变量也上去了',
    '自从解释变量稳了之后签单就多了，说到底是因为穿了红袜子',
    '从那以后签单就多了，归根结底是穿了红袜子之功，因变量也稳了',
    '从那以后签单就多了，归根结底是穿了红袜子之功，工具变量也控制了',
  ];
  const miss = rest.filter(s => !pcHit(s));
  assert.strictEqual(miss.length, rest.length,
    `结果侧统计搭配形应仍整句豁免（已知未修），实测只漏 ${miss.length}/${rest.length}`);
});

test('G3 已知未修③：causalInvertedTakeZh / causalSupplementZh 的 lastIndex 防空匹配防护前移仍未做', () => {
  assert.ok(SRC_TEXT.includes('if (actRe.lastIndex === m.index) actRe.lastIndex++;'),
    '防空匹配防护应仍在原位置（本轮未动，登记备查）');
});

test('G4 已知未修④：支③其余 30 余个裸统计词条未位置化（r241 G2 转挂）', () => {
  const phSrc = fs.readFileSync(path.join(ROOT, 'src', 'post-hoc.js'), 'utf8');
  assert.ok(phSrc.includes('协变量|混杂|混淆变量|中介变量|固定效应|基线特征|'),
    '支③其余词条应仍在原处（本轮未动）');
});

process.on('exit', () => {
  const pass = RESULTS.filter(r => r.ok).length;
  console.log(`round-242-weak-mech-stat-positional: ${pass} 通过, ${RESULTS.length - pass} 失败, 共 ${RESULTS.length} 个`);
});
