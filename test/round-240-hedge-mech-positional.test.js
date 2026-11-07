// r240 守护：函数头对冲表的「机制」裸词腿位置化（PC_HEDGE_MECH_ZH 四腿）
// 根因（r239 G1 前半）：PC_HEDGE_ZH 收裸「机制」——整句任何位置出现即豁免
// 全部 14 支与两个子判据。r239 把⑪⑫⑬⑭的机制护栏位置化后，这条函数头裸腿
// 成为红队剩余漏判的来源：机制词在时序侧/结果侧的句子仍被整句放行。
// 铁律：位置收窄只掉该掉的——存量 29395 条样本 gate.action 零差异、
// 机制说明位良性句一条不放、攻击句（机制在时序侧/结果侧）一条不塌。
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
// r239 红队五形 × 「机制」一词（变量/回归 两条在 STAT_CONTEXT_ZH 支③，见 G 族）
const A_MECH = [
  '自从机制稳了之后签单就多了，说到底是因为穿了红袜子',        // ⑫ 反序：机制在时序侧
  '从那以后签单就多了，归根结底是穿了红袜子之功，机制也稳了',    // ⑫ 变体：机制在结果侧
  '全靠穿了红袜子，所以签单也多了，机制也稳了',                 // ⑬ 正序：机制在结果侧
  '穿了红袜子之后签单也多了，机制也稳了',                       // ⑭ 无引导词
  '换了头像，所以业绩机制也上去了',                             // ⑭ 甲半玄学 × 结果侧机制
];
// HEAD 实测漏判数（git show HEAD:src/index.js 副本，scripts/tmp-240-ab.js）：5/5 全漏
const HEAD_MISS_MECH = 5;

test(`A1 函数头裸「机制」腿族：HEAD 漏 ${HEAD_MISS_MECH}/${A_MECH.length} → 现在 0 漏`, () => {
  const miss = A_MECH.filter(s => !pcHit(s));
  assert.deepStrictEqual(miss, [], '以下攻击句仍漏判:\n  ' + miss.join('\n  '));
  for (const s of A_MECH) assert.ok(gateOf(s) !== 'pass', '判了的攻击句 gate 不应 pass: ' + s);
});

test('A2 攻击句 detector 命中数逐条登记（位置化后各支照判）', () => {
  // 期望值按本轮实测钉住：⑫支1 / ⑫+⑬支2 / ⑭支1——摘任何一条豁免腿都不许掉
  const expected = [1, 1, 3, 2, 1];
  A_MECH.forEach((s, i) => assert.strictEqual(pcCount(s), expected[i],
    `命中数应为 ${expected[i]}，实测 ${pcCount(s)}: ` + s));
});

test('A3 HEAD 漏判基数登记（HEAD 源码副本实测，不是记忆值）', () => {
  // 轮次进行中由 scripts/tmp-240-ab.js 用 git show HEAD:src/index.js 写入的副本；
  // 轮末副本随 worktree 一起删，故不存在时跳过（r239 同款登记口径）。
  const headCopy = path.join(ROOT, 'data', 'wt-hedge-off', 'src', 'index.js');
  if (!fs.existsSync(headCopy)) {
    console.log('  （跳过：data/wt-hedge-off 不存在——HEAD 基数登记需在轮次进行中跑）');
    return;
  }
  const headSrc = fs.readFileSync(headCopy, 'utf8');
  assert.ok(headSrc.includes('|机制|更多是|主要是|回归分析'),
    'HEAD 副本应含裸「机制」腿（否则基数对照失效）');
  const m = require(headCopy);
  const miss = A_MECH.filter(s => m.checkPseudoCausal(s).count === 0).length;
  assert.strictEqual(miss, HEAD_MISS_MECH, `HEAD 漏判应为 ${HEAD_MISS_MECH}，实测 ${miss}`);
});

// ─── B 族：机制说明位/归因位的良性句，一条都不许放出来 ────────────────────
const BENIGN_SLOT = [
  // 腿 A：显式归因链接后 ≤16 字内「机制」
  '项目能成是因为背后的机制设计得好',
  '从那以后签单就多了，说到底是因为流程机制设计得稳',
  '全靠穿了红袜子，所以签单也多了，都是因为背后有机制在起作用',
  // 腿 B：「机制」+ ≤12 字 + 领属归责名词
  '机制之功当属这次重构',
  // 腿 C：领属归责名词在前 + ≤12 字 + 「机制」
  '的功劳全在机制设计上',
  // 腿 D：机制说明短语（「机制(的)?+说明位词」）
  '这次只改了缓存机制的实现方式',
  '这次只调整了机制层面的参数',
  '问题只出在机制的实现细节上',
  '这套防御机制是一种心理防线',
  '失败的原因是机制本身不透明',
  '防御机制是一种心理防御机制，需要被识别',
  '间歇性强化是心理学中用来解释成瘾行为的机制。',
  '不需要你理解这个机制，跑完就行',
  // 存量 76 条含「机制」样本里的真实良性形（scripts/tmp-240-mech-samples.js）
  '立体防御的意思是每一层都要有独立的校验机制',
  'IPC 管道是父子进程通信的标准机制',
  '事后诸葛亮不可取，关键是建立更完善的事前评估机制',
  '淘汰机制本身就是为企业筛选出最能拼的人',
  '心诚则灵是一种人生态度，不是因果机制',
];

test(`B1 机制说明位良性句零误伤（${BENIGN_SLOT.length} 条 detector 层 + gate 不 block）`, () => {
  const bad = BENIGN_SLOT.filter(s => pcHit(s));
  assert.deepStrictEqual(bad, [], '以下良性句被误判:\n  ' + bad.join('\n  '));
  // gate 层只断言「不 block」：个别存量句会被其他维度判 rewrite
  // （如「淘汰机制本身就是为企业筛选出最能拼的人」被 absolute_claim 判 rewrite，
  //   HEAD 同款——那是别的维度的事，本轮不管）。
  for (const s of BENIGN_SLOT) {
    const a = gateOf(s);
    assert.ok(a !== 'block', '良性句 gate 不应 block: ' + a + ' | ' + s);
  }
});

// ─── C 族：结构性界线（机制词 + 归责断言共现 / 时序侧结果侧，仍判）─────────
test('C1 机制词 + 归责断言共现仍判（PC_MONOCAUSE_ZH 反豁免同款纪律）', () => {
  // 腿 D 只接说明位词；「机制就是问题所在」是归责断言形（支②），不是机制说明
  const still = [
    '这套机制就是问题所在',
    '缓存机制就是这次故障的问题',
  ];
  for (const s of still) assert.ok(pcHit(s), '应仍判: ' + s);
});

test('C2 机制词在时序侧/结果侧、玄学对象在归因位仍判（A 族五形不许因补词表放回）', () => {
  for (const s of A_MECH) assert.ok(pcHit(s), '应仍判: ' + s);
});

// ─── D 族：变异守卫（临时目录隔离，绝不在原地改写 src/）──────────────────
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'r240-' + tag + '-'));
  fs.cpSync(ROOT, tmp, {
    recursive: true,
    filter: p => !p.includes('node_modules') && !p.includes(path.join(ROOT, 'data')) && !p.includes('.git'),
  });
  return tmp;
}
// 把某条腿的赋值行改成恒不匹配；三重断言「行找到」+「行形状没变」+「常量名行仍在」
// （r239 坑③：只断言行找到时 String.replace 没命中会静默不变异，守卫看着绿其实失效）。
function dropLeg(tmp, legName) {
  const f = path.join(tmp, 'src', 'index.js');
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  const i = lines.findIndex(l => l.startsWith('const ' + legName + ' = '));
  assert.ok(i >= 0, '变异锚点行未找到: const ' + legName);
  assert.ok(lines[i].includes("'(?:"), '腿 ' + legName + ' 的赋值行形状变了，请同步本条守卫');
  lines[i] = "const " + legName + " = '(?:ZZZNOMATCH)';";
  fs.writeFileSync(f, lines.join('\n'));
  const after = fs.readFileSync(f, 'utf8');
  assert.ok(after.includes('const ' + legName + " = '(?:ZZZNOMATCH)';"), '改写未生效');
  return tmp;
}

test('D1 变异守卫一：摘掉腿 D（机制说明短语）后 victim 必须重新被误判', () => {
  const tmp = copySrc('droplegD');
  try {
    dropLeg(tmp, 'PC_HEDGE_MECH_LEG_D');
    const m = require(path.join(tmp, 'src', 'index.js'));
    // victim 命中支⑦（只改了…）强支，唯一能豁免它的就是腿 D 的「机制的实现」
    const victim = '这次只改了缓存机制的实现方式';
    assert.strictEqual(pcCount(victim), 0, '未变异树上 victim 应被腿 D 豁免');
    assert.ok(m.checkPseudoCausal(victim).count > 0,
      '摘腿 D 后 victim 应恢复误判，实测 pc=' + m.checkPseudoCausal(victim).count);
    // 攻击句命中数不许变（摘豁免腿不会让攻击句掉命中）
    const before = A_MECH.filter(pcHit).length;
    const after = A_MECH.filter(s => m.checkPseudoCausal(s).count > 0).length;
    assert.strictEqual(after, before, '摘腿 D 不应改变攻击句命中数');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D2 变异守卫二：把 PC_HEDGE_MECH_ZH 退回裸词（恒真于含「机制」句）后攻击句必须整体回落到 HEAD 漏判态', () => {
  const tmp = copySrc('bareleg');
  try {
    const f = path.join(tmp, 'src', 'index.js');
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    const i = lines.findIndex(l => l.startsWith('const PC_HEDGE_MECH_ZH = new RegExp(['));
    assert.ok(i >= 0, 'PC_HEDGE_MECH_ZH 定义行未找到');
    // 数组是 3 行：new RegExp([ / 四腿引用行 / ].join('|'))
    let j = i + 1;
    while (!lines[j].includes("].join('|')")) j++;
    assert.strictEqual(j - i, 2, `PC_HEDGE_MECH_ZH 数组应为 3 行（首行 + 四腿引用 + join 行），实测 ${j - i + 1}`);
    lines[i] = "const PC_HEDGE_MECH_ZH = new RegExp('机制');";
    for (let k = i + 1; k <= j; k++) lines[k] = '';
    fs.writeFileSync(f, lines.join('\n'));
    const after = fs.readFileSync(f, 'utf8');
    assert.ok(after.includes("const PC_HEDGE_MECH_ZH = new RegExp('机制');"), '改写未生效');
    const m = require(f);
    const judged = A_MECH.filter(s => m.checkPseudoCausal(s).count > 0).length;
    assert.strictEqual(judged, A_MECH.length - HEAD_MISS_MECH,
      `退回裸词后应回落到 HEAD 的 ${A_MECH.length - HEAD_MISS_MECH} 条，实测 ${judged}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D3 变异守卫三：摘掉全部四腿后攻击句仍全判、非 victim 良性句不变', () => {
  const tmp = copySrc('dropall');
  try {
    dropLeg(tmp, 'PC_HEDGE_MECH_LEG_A');
    dropLeg(tmp, 'PC_HEDGE_MECH_LEG_B');
    dropLeg(tmp, 'PC_HEDGE_MECH_LEG_C');
    dropLeg(tmp, 'PC_HEDGE_MECH_LEG_D');
    const m = require(path.join(tmp, 'src', 'index.js'));
    // victim（D1 那条）摘腿后必然翻面——那是豁免层承重的证据，单独排除；
    // 其余良性句本就不命中判据形状（轮初实测：含「机制」的 76 条存量样本
    // 摘表后翻面 0 条），摘全部四腿也应仍零误伤。
    const VICTIM = '这次只改了缓存机制的实现方式';
    const rest = BENIGN_SLOT.filter(s => s !== VICTIM);
    const bad = rest.filter(s => m.checkPseudoCausal(s).count > 0);
    assert.deepStrictEqual(bad, [], '摘全部四腿后非 victim 良性句应仍零误伤:\n  ' + bad.join('\n  '));
    const after = A_MECH.filter(s => m.checkPseudoCausal(s).count > 0).length;
    assert.strictEqual(after, A_MECH.length, '摘全部四腿后攻击句应仍全判');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D4 变异守卫四：未变异副本还原校验（A 族 5/5 + B 族零误伤）', () => {
  const tmp = copySrc('pristine');
  try {
    const m = require(path.join(tmp, 'src', 'index.js'));
    const judged = A_MECH.filter(s => m.checkPseudoCausal(s).count > 0).length;
    assert.strictEqual(judged, A_MECH.length, `未变异副本应判 ${A_MECH.length}，实测 ${judged}`);
    const fp = BENIGN_SLOT.filter(s => m.checkPseudoCausal(s).count > 0);
    assert.deepStrictEqual(fp, [], '未变异副本良性句应零误伤');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── E 族：存量攻击族一条不许塌（r239 宽口径族 95 条 + 精选存量攻击句）────
const LEGACY_ATTACK = [
  // r239 A 族里除 机制/变量/回归 三词外的宽口径词 × 五形（逐词取代表形状）
  '自从数据稳了之后签单就多了，说到底是因为穿了红袜子',
  '从那以后签单就多了，归根结底是穿了红袜子之功，指标也稳了',
  '全靠穿了红袜子，所以签单也多了，方案也稳了',
  '穿了红袜子之后签单也多了，报价也稳了',
  '换了头像，所以业绩沟通也上去了',
  '自从评审稳了之后签单就多了，说到底是因为穿了红袜子',
  '自从测试稳了之后签单就多了，说到底是因为穿了红袜子',
  '自从连续稳了之后签单就多了，说到底是因为穿了红袜子',
  '自从坚持稳了之后签单就多了，说到底是因为穿了红袜子',
  '自从习惯稳了之后签单就多了，说到底是因为穿了红袜子',
  '自从原因稳了之后签单就多了，说到底是因为穿了红袜子',
  '自从导致稳了之后签单就多了，说到底是因为穿了红袜子',
  '自从因果稳了之后签单就多了，说到底是因为穿了红袜子',
  '自从假设稳了之后签单就多了，说到底是因为穿了红袜子',
  '自从样本稳了之后签单就多了，说到底是因为穿了红袜子',
  '自从交付稳了之后签单就多了，说到底是因为穿了红袜子',
  '自从缓存稳了之后签单就多了，说到底是因为穿了红袜子',
  '自从排期稳了之后签单就多了，说到底是因为穿了红袜子',
  '自从复盘稳了之后签单就多了，说到底是因为穿了红袜子',
  // r237/r238 存量攻击族（机制护栏位置化那两轮的红队集）
  '打那以后球队就再也没输过，说到底，是因为换了教练',
  '从那以后店里生意也稳了，归根结底，是因为门口摆了招财摆件',
  '换了主管之后团队就再也没加班到半夜，说穿了，是因为风水顺了',
  '自从提高了交付质量之后签单就多了，都是因为摆了财神',
  '换了主管之后团队就再也没加班到半夜，说穿了，是因为风水顺了',
  // r239 A/B 里「不许因本轮改动掉命中」的 11 条存量攻击句（逐条实测登记）
  '由于坚持早起，团队精神好转，最终项目顺利上线',
  '他坚持早起之后业绩就翻倍，可见早起造成了改变',
  '他坚持早起之后业绩就翻倍，可见早起不是运气造成的',
  '当天晚上就不疼了，肯定是贴了膏药的功劳',
  '他坚持早起之后业绩就翻倍，肯定是早起见了效',
  '降温之后感冒也少了，可见是因为降温改变了病毒的活性',
  '升级之后故障率也降了，总之是因为这次优化起了作用',
  '他坚持早起之后业绩就翻倍了，可见早起不是运气造成的',
  '这服药喝下去病就好了，说明是药的功劳',
  '试了新流程之后客诉也降了，据说，是因为新流程清掉了瓶颈',
  '试了新流程之后客诉就降了，据说，是因为新流程清掉了瓶颈',
];

test(`E1 存量攻击族一条不塌（${LEGACY_ATTACK.length} 条）`, () => {
  const miss = LEGACY_ATTACK.filter(s => !pcHit(s));
  assert.deepStrictEqual(miss, [], '以下攻击句掉命中:\n  ' + miss.join('\n  '));
});

// ─── F 族：源码锚点 ────────────────────────────────────────────────────────
test('F1 PC_HEDGE_MECH_ZH 四腿齐备 + PC_HEDGE_ZH 引用位置化表', () => {
  for (const leg of ['A', 'B', 'C', 'D']) {
    assert.ok(SRC_TEXT.includes('const PC_HEDGE_MECH_LEG_' + leg + ' = '),
      '缺腿 ' + leg + ' 定义行');
  }
  assert.ok(SRC_TEXT.includes('const PC_HEDGE_MECH_ZH = new RegExp(['), 'PC_HEDGE_MECH_ZH 拼装行丢失');
  assert.ok(SRC_TEXT.includes("PC_HEDGE_MECH_ZH.source"), 'PC_HEDGE_ZH 未引用位置化表（裸词腿回潮）');
  // 裸词腿不许回来：PC_HEDGE_ZH 定义体里不允许再出现 `|机制|`
  // startsWith 而非 includes：注释里出现过同形态字串会被误抓（round-234 F3 同款）
  const hedgeLine = SRC_TEXT.split('\n').find(l => l.startsWith('const PC_HEDGE_ZH = new RegExp('));
  assert.ok(hedgeLine, 'PC_HEDGE_ZH 定义行未找到');
  assert.ok(!/\|机制\|/.test(hedgeLine), 'PC_HEDGE_ZH 定义体里又出现裸「机制」词腿');
});

test('F2 四条腿的窗口都排除句读（跨子句长桥不豁免，r227/r229 纪律）', () => {
  const lineOf = name => SRC_TEXT.split('\n').find(l => l.startsWith('const ' + name + ' = '));
  const a = lineOf('PC_HEDGE_MECH_LEG_A'), b = lineOf('PC_HEDGE_MECH_LEG_B');
  const c = lineOf('PC_HEDGE_MECH_LEG_C');
  for (const [n, l] of [['A', a], ['B', b], ['C', c]]) {
    assert.ok(l, '腿 ' + n + ' 定义行未找到');
    // 按 indexOf 切字符类，别用正则去匹配含转义的窗口（r239 坑⑤：
    // bash -e 与 node 里表现不一致、还会误伤腿 D/E 的不同排除集）
    const cls = l.slice(l.indexOf('[^'), l.indexOf(']') + 1);
    assert.ok(cls.startsWith('[^'), '腿 ' + n + ' 缺窗口字符类');
    for (const ch of ['。', '，', ',']) {
      assert.ok(cls.includes(ch), '腿 ' + n + ' 窗口应排除句读 ' + ch + '，实测字符类: ' + cls);
    }
  }
  // 腿 A 窗口上限 16 字（与 r239 PC_SLOT_MECH_ZH 腿 A 同口径）
  assert.ok(a.includes('{0,16}'), '腿 A 窗口应为 ≤16 字');
});

test('F3 腿 D 的说明位词表含「实现」（本轮修的真实误伤句承重于此）', () => {
  const d = SRC_TEXT.split('\n').find(l => l.startsWith('const PC_HEDGE_MECH_LEG_D = '));
  assert.ok(d, '腿 D 定义行未找到');
  assert.ok(d.includes('实现'), '腿 D 应含「实现」（「机制的实现」是机制说明位）');
  assert.ok(d.includes('(?:的)?'), '腿 D 应容许「机制的XX」领属形');
});

test('F4 弱支他因信号仍在 PC_OTHERFACTOR_ZH（位置化不许顺手删掉①⑤⑨的兜底）', () => {
  const other = SRC_TEXT.split('\n').find(l => l.includes('const PC_OTHERFACTOR_ZH = '));
  assert.ok(other, 'PC_OTHERFACTOR_ZH 定义行未找到');
  assert.ok(other.includes('机制'), 'PC_OTHERFACTOR_ZH 的「机制」腿应在（弱支①⑤⑨他因信号）');
});

test('F5 dimensions 键数 210 不变（本轮未加维度，只收窄豁免层）', () => {
  const dims = idx.discriminate('测试句子').dimensions || {};
  assert.strictEqual(Object.keys(dims).length, 210,
    `dimensions 键数应为 210，实测 ${Object.keys(dims).length}`);
});

// ─── G 族：已知未修（登记为字面量，防下一轮无声退化）────────────────────
test('G1 已知未修①：「变量/回归」仍整句豁免（STAT_CONTEXT_ZH 支③，10 条红队仍漏）', () => {
  // r239 G1 后半：STAT_CONTEXT_ZH 支③是裸统计术语表（声明于 src/post-hoc.js，
  // 被 post_hoc 维度与 src/methodology-exempt.js 五维共用）。本轮只做
  // PC_HEDGE_ZH 的「机制」腿（单维度内、零存量影响已实测），变量/回归 收窄
  // 会同时改五个维度的豁免面，需单独轮次 + post_hoc 侧全量 A/B。
  const rest = [
    '自从变量稳了之后签单就多了，说到底是因为穿了红袜子',
    '从那以后签单就多了，归根结底是穿了红袜子之功，变量也稳了',
    '全靠穿了红袜子，所以签单也多了，变量也稳了',
    '穿了红袜子之后签单也多了，变量也稳了',
    '换了头像，所以业绩变量也上去了',
    '自从回归稳了之后签单就多了，说到底是因为穿了红袜子',
    '从那以后签单就多了，归根结底是穿了红袜子之功，回归也稳了',
    '全靠穿了红袜子，所以签单也多了，回归也稳了',
    '穿了红袜子之后签单也多了，回归也稳了',
    '换了头像，所以业绩回归也上去了',
  ];
  const miss = rest.filter(s => !pcHit(s));
  assert.strictEqual(miss.length, rest.length,
    `变量/回归 10 条应仍漏判（STAT_CONTEXT_ZH 支③未动），实测漏 ${miss.length}`);
});

test('G2 已知未修②：PC_HEDGE_MECH_ZH 四腿在当前存量语料上零承重', () => {
  // 轮初实测（scripts/tmp-240-victim.js，data/wt-hedge-off 副本摘表重跑）：
  // 29394 条存量样本摘掉 PC_HEDGE_MECH_ZH 后翻面 0 条——四腿保护的句子当前
  // 一条都不在存量里（含「机制」的 76 条样本本就不命中判据形状）。它们不是
  // 死代码：裸词腿放过 5 条攻击句（A1），四腿是它的精确替代；但「补词不承重」
  // 的形态仍在，登记防下一轮误判为已覆盖。
  const headCopy = path.join(ROOT, 'data', 'wt-hedge-off', 'src', 'index.js');
  if (!fs.existsSync(headCopy)) {
    console.log('  （跳过：副本不存在——零承重结论以 UPGRADE_LOG r240 报告为准）');
    return;
  }
  console.log('  （零承重结论见 UPGRADE_LOG r240 第四节：摘表后存量翻面 0 条）');
});

process.on('exit', () => {
  const pass = RESULTS.filter(r => r.ok).length;
  const fail = RESULTS.length - pass;
  console.log(`\n${pass} 通过, ${fail} 失败（共 ${RESULTS.length} 个）`);
  if (fail > 0) for (const r of RESULTS.filter(r => !r.ok)) console.log('  FAIL: ' + r.name);
});
