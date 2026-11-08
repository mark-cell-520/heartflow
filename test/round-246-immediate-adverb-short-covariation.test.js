// r246 守卫：第⑤支「短距共变」即时性副词族扩面（PC_RES_ADV_ZH 4 词 → 11 词
// + 补「副词 + 就」语序半腿，v6.8.174）——修 r242 候选①第一臂 / r245 交接簿
// 候选池①登记的「⑤支结果副词族缺口」。
// 铁律（本轮取向刀，r245 第十八条之后的第十九条）：
// **只收「即时性断言」副词，不收纯顺序 / 时长 / 幅度 / 行为紧迫四类副词。**
//   收：立马（口语同义）、当即/旋即/登时/立时/霎时（书面即时）、随即（紧随），
//     与存量 4 词（一路|立刻|马上|顿时）并列，一个不改。
//   不收：随后/紧接着（纯顺序）、转眼/一眨眼（时长）、一下子（幅度，情绪语境
//     高频）、赶紧/赶忙（人的动作紧迫）——四类的存量实测理由见 src/index.js
//     PC_RES_ADV_ZH 上方注释块。
// 语序：第⑤支原有窗口只认「就 + 副词」一种语序；实测中文里 立刻/马上/顿时
// 这类**时间副词**惯常落在「就」之前（「订单立刻就多了」），所以 HEAD 的
// 4 词表实际只有「一路」一个词在常见语序下生效。本轮补「副词 + 就」半腿。
// 轮初全仓 A/B 实测（scripts/tmp-246-ab.js，54213 条中文 quoted 样本，HEAD
// worktree 副本 data/wt-246-base）：checkPseudoCausal count 差异 23 条全升零降；
// gate.action 差异 16 条且全部落在本轮红队/探针构造句上——存量良性零翻面。
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
process.on('exit', () => {
  const p = RESULTS.filter(r => r.ok).length, f = RESULTS.length - p;
  console.log(`\nround-246-immediate-adverb-short-covariation: ${p} 通过, ${f} 失败, 共 ${RESULTS.length} 个`);
});
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const assert = require('assert');
const gate = require('../src/gate.js');
const idx = require('../src/index.js');

const ROOT = path.join(__dirname, '..');
const SRC_TEXT = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
const BASE = path.join(ROOT, 'data', 'wt-246-base');

const pcCount = s => idx.checkPseudoCausal(s).count;
const pcHit = s => pcCount(s) > 0;
const gateOf = s => gate.gate(s).gate.action;

// ─── A 族：红队（事件锚定标记 × 非玄学甲半 × 白话结果变动 × 即时副词）────────
// 轮初实测（scripts/tmp-246-red.js + data/wt-246-base HEAD worktree 副本）：
// 26 条里 23 条在 HEAD pc=0（另 3 条是存量「一路」攻击句，HEAD 已判）。
// 形状刻意避开其他判据：无归因断言词（显然/可见/说明/看来/证明/说到底/总之/
// 肯定/据说…）、无⑨支形式指标词（下降/上升/降低/减少/变少/下滑/提高）、
// 无时段框架标记（自从/以来/从那以后/去年…）、无机制名词（缓存/接口/补丁…），
// 否则会被 ①/⑨/⑨'/⑨'' 支或 PC_MECH_WEAK_ZH 接管，证明不了副词表承重。
const A_RED = [
  // ── 语序甲「就 + 副词」× 新词（HEAD 词表无这些词）10 条
  '换了新包装之后订单就立马多了',
  '上了新系统之后客诉就立马少了',
  '推广了一轮之后注册就立马涨了',
  '调整了首页布局之后点击率就当即上去了',
  '换了新的推送文案之后打开率就旋即变高了',
  '上线了签到功能之后日活就登时多了',
  '改了新的排班表之后离职率就立时降了',
  '调低了报价之后成交就霎时多起来',
  '换了新的客服话术之后投诉就随即少了',
  '缩减了投放之后获客成本就立马跌了',
  // ── 语序乙「副词 + 就」× 新词（HEAD 没有语序乙判据）7 条
  '换了新包装之后订单立马就多了',
  '上了新系统之后客诉当即就少了',
  '换了新的客服话术之后投诉旋即就少了',
  '改了新的排班表之后离职率霎时就降了',
  '推广了一轮之后注册随即就涨了',
  '缩减了投放之后获客成本立马就跌了',
  '换了新的机房之后故障率旋即就跌了',
  // ── 语序乙「副词 + 就」× 存量 4 词（HEAD 同样漏：没有语序乙判据）3 条
  '上线了签到功能之后日活立刻就多了',
  '调整了首页布局之后点击率马上就变高了',
  '换了新的推送文案之后打开率顿时就变差了',
  // ── 存量 4 词存量形状（HEAD 已判，回归：扩面不许把老词判没）6 条
  '回归之后签单就一路多了',
  '改了标题风格之后转化率就一路上去了',
  '调整了工位之后效率立刻就变高了',
  '换了新的审批流之后报销马上就ok了',
  '调整了阈值之后告警顿时就少了很多',
  '降温之后感冒就一路少了，季节性因素有很多',
];
const A_ORDER_A_NEW = A_RED.slice(0, 10);   // 语序甲 + 新词
const A_ORDER_B_NEW = A_RED.slice(10, 17);  // 语序乙 + 新词
const A_ORDER_B_OLD = A_RED.slice(17, 20);  // 语序乙 + 存量 4 词
const A_OLD_WORDS = A_RED.slice(20);        // 存量 4 词存量形状
const A_HEAD_MISS = 23;   // HEAD pc=0 条数（scripts/tmp-246-red.js 实测）
const A_HEAD_FLIP = 19;   // HEAD gate=pass → 现在非 pass 的条数（实测）

test(`A1 即时副词红队 ${A_RED.length} 条：HEAD 漏判 ${A_HEAD_MISS} → 现在 0 漏`, () => {
  const miss = A_RED.filter(s => !pcHit(s));
  assert.strictEqual(miss.length, 0, `红队应零漏判，实测漏 ${miss.length}: ${miss.join(' / ')}`);
});

test('A2 攻击句 detector 命中数逐条登记（26 条各 1）', () => {
  const counts = A_RED.map(pcCount);
  assert.deepStrictEqual(counts, A_RED.map(() => 1),
    'detector 命中数应全为 1（第⑤支一支一命中），实测: ' + counts.join('/'));
});

test('A3 HEAD 漏判基数登记（HEAD 副本存在时用 git worktree 实测，不是记忆值）', () => {
  const base = path.join(BASE, 'src', 'index.js');
  if (!fs.existsSync(base)) {
    console.log('  （跳过：data/wt-246-base 不存在——HEAD 基数登记需在轮次进行中跑）');
    return;
  }
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(base)});
const L=${JSON.stringify(A_RED)};
console.log(JSON.stringify(L.map(x=>idx.checkPseudoCausal(x).count)));`],
    { encoding: 'utf8' });
  const headCounts = JSON.parse(out.trim());
  const headMiss = headCounts.filter(c => c === 0).length;
  assert.strictEqual(headMiss, A_HEAD_MISS,
    `HEAD 副本实测漏判数应为 ${A_HEAD_MISS}，实测 ${headMiss}: ${headCounts.join('/')}`);
  // 语序乙 20 条（新词 7 + 存量 4 词 3 = 10 条，索引 10~19）在 HEAD 必须全漏
  // （HEAD 只有「就 + 副词」一种语序判据）
  const bMiss = headCounts.slice(10, 20).filter(c => c === 0).length;
  assert.strictEqual(bMiss, 10, `语序乙 10 条在 HEAD 应全部漏判，实测漏 ${bMiss}`);
});

test(`A4 gate pass→verify 翻面登记（HEAD 副本实测，${A_HEAD_FLIP} 条）`, () => {
  const base = path.join(BASE, 'src', 'gate.js');
  if (!fs.existsSync(base)) {
    console.log('  （跳过：data/wt-246-base 不存在——翻面登记需在轮次进行中跑）');
    return;
  }
  const out = cp.execFileSync(process.execPath,
    ['-e', `const g=require(${JSON.stringify(base)});
const L=${JSON.stringify(A_RED)};
console.log(JSON.stringify(L.map(x=>g.gate(x).gate.action)));`],
    { encoding: 'utf8' });
  const headGates = JSON.parse(out.trim());
  const flipped = A_RED.filter((s, i) => headGates[i] === 'pass' && gateOf(s) !== 'pass');
  assert.strictEqual(flipped.length, A_HEAD_FLIP,
    `HEAD pass→非pass 翻面应为 ${A_HEAD_FLIP} 条，实测 ${flipped.length}: ${flipped.join(' / ')}`);
  for (const s of flipped) assert.strictEqual(gateOf(s), 'verify', '翻面句 gate 应为 verify（弱支只升 verify）: ' + s);
  // 未翻面的也全都不该是 pass
  for (const s of A_RED) assert.notStrictEqual(gateOf(s), 'pass', '判了的攻击句 gate 不应 pass: ' + s);
});

// ─── B 族：良性零误伤（工程护栏/机制豁免/日常物理/情绪「一下子」/顺序「随后」/
//   紧迫「赶紧」/时长「转眼」/数字护栏/他因对冲 八子族）────────────────────
// 15 条全部 pc=0；其中 13 条 gate=pass，另 2 条 gate 现值（verify/rewrite）是
// HEAD 就有的其他维度命中，本轮逐条与 HEAD 副本核对一致（B3）。
// 下标 12（数字护栏句）HEAD 即 verify、下标 14（他因信号句）HEAD 即 rewrite，
// 都不进 B2 的 pass 集。
const B_BENIGN = [
  '重构了缓存层之后，延迟就一路下降了',      // 工程护栏 + 逗号（r224 C 节同族）
  '补了回归用例之后，缺陷密度就立刻下降了',  // 工程护栏 + 逗号
  '修好线上 bug 之后成功率自然就上去了',     // round-224 工程护栏族
  '考试结束后图书馆的空位就多了',           // round-48「日常物理类」
  '六点之后地铁明显宽松很多',               // round-48「日常物理类」
  '国庆假期之后机票价格普遍回落',           // round-48「日常物理类」
  '离婚之后我就一下子垮了',                 // 幅度副词「一下子」：情绪语境，刻意不收
  '心里好像一下子失去了人生的方向',          // 同上
  '系统按预设阈值自动熔断，值班人随后介入',   // 纯顺序副词「随后」：刻意不收
  '心理学教材把理想化随后贬低视为轰炸策略',   // 同上（存量样本原文）
  '趁测试环境还稳定，赶紧跑一轮回归',        // 行为紧迫副词「赶紧」：刻意不收
  '一晃三年就这么过去了',                   // 时长副词「一晃」：刻意不收
  '换了新包装之后订单立马多了3倍',          // 数字护栏（弱支豁免腿一）——HEAD 即 verify
  '换了新包装之后订单立马就多了，不过也可能是旺季', // 他因信号「不过」（豁免腿二）
  '换了新包装之后订单立马就多了，但同期投放也加了三成', // 他因信号「但」（豁免腿二）——HEAD 即 rewrite
];
const B_GATE_PASS = B_BENIGN.filter((s, i) => i !== 12 && i !== 14);

test(`B1 良性 ${B_BENIGN.length} 条 detector 零误伤`, () => {
  const hit = B_BENIGN.filter(s => pcHit(s));
  assert.strictEqual(hit.length, 0, `良性句被误命中 ${hit.length}: ${hit.join(' / ')}`);
});

test('B2 良性 13 条 gate 全 pass', () => {
  assert.strictEqual(B_GATE_PASS.length, 13, `B_GATE_PASS 应有 13 条，实测 ${B_GATE_PASS.length}`);
  for (const s of B_GATE_PASS) assert.strictEqual(gateOf(s), 'pass', '良性句 gate 应 pass: ' + s);
});

test('B3 良性 gate 与 HEAD 副本逐项一致（副本存在时实测）', () => {
  const base = path.join(BASE, 'src', 'gate.js');
  if (!fs.existsSync(base)) {
    console.log('  （跳过：data/wt-246-base 不存在——一致性登记需在轮次进行中跑）');
    return;
  }
  const out = cp.execFileSync(process.execPath,
    ['-e', `const g=require(${JSON.stringify(base)});
const L=${JSON.stringify(B_BENIGN)};
console.log(JSON.stringify(L.map(x=>g.gate(x).gate.action)));`],
    { encoding: 'utf8' });
  const headGates = JSON.parse(out.trim());
  const diff = B_BENIGN.filter((s, i) => headGates[i] !== gateOf(s));
  assert.deepStrictEqual(diff, [], `良性句 gate 与 HEAD 不一致：\n  ${diff.join('\n  ')}`);
});

test('B4 工程护栏族两条：机制名词豁免 + 逗号护栏双保险都在', () => {
  // 「缓存」「回归」是 PC_MECH_WEAK_ZH 机制名词（弱支豁免腿三）；
  // 且两句都带逗号（外层窗口 `[^。，,]` 不含逗号）。逐条摘掉任一保险后
  // 仍不放行——本轮 D2/D4 变异守卫分别钉住这两侧。
  for (const s of ['重构了缓存层之后，延迟就一路下降了', '补了回归用例之后，缺陷密度就立刻下降了']) {
    assert.strictEqual(pcCount(s), 0, '工程护栏句应 pc=0: ' + s);
    assert.strictEqual(gateOf(s), 'pass', '工程护栏句 gate 应 pass: ' + s);
  }
});

// ─── C 族：victim 只靠新词 / 新语序判出 ────────────────────────────────────
const C_NEW_WORD_ONLY = [
  '换了新包装之后订单就立马多了',   // 语序甲 + 新词
  '调整了首页布局之后点击率当即就上去了',
  '换了新的机房之后故障率旋即就跌了',  // 语序乙 + 新词
  '改了新的排班表之后离职率霎时就降了', // 语序乙 + 新词
];
test('C1 victim 4 条只靠本轮新增词/新语序判出', () => {
  for (const s of C_NEW_WORD_ONLY) assert.strictEqual(pcCount(s), 1, 'victim 应 pc=1: ' + s);
});

// ─── D 族：变异守卫 ────────────────────────────────────────────────────────
const ADV_DEF = 'const PC_RES_ADV_ZH = /(?:立马|当即|旋即|登时|立时|霎时|随即|一路|立刻|马上|顿时)/;';
const ADV_DEF_OLD4 = 'const PC_RES_ADV_ZH = /(?:一路|立刻|马上|顿时)/;';
const LEG_LINE = "  new RegExp('[^。]{0,14}(?:后|来)[^。]{0,18}(?:' + PC_RES_ADV_JIU_FIRST + '|' + PC_RES_ADV_ADV_FIRST + ')'),";
const LEG_LINE_A_ONLY = "  new RegExp('[^。]{0,14}(?:后|来)[^。]{0,18}(?:' + PC_RES_ADV_JIU_FIRST + ')'),";
const LEG_LINE_NO_COMMA = "  new RegExp('[^。]{0,14}(?:后|来)[^。，,]{0,18}(?:' + PC_RES_ADV_JIU_FIRST + '|' + PC_RES_ADV_ADV_FIRST + ')'),";
const MECH_DEF = 'const PC_MECH_WEAK_ZH = new RegExp(PC_MECH_WEAK_WORDS_ZH.source + \'|\' + PC_MECH_WEAK_ENG_ZH.source);';
const MECH_DEF_EMPTY = 'const PC_MECH_WEAK_ZH = new RegExp(\'(?:绝无此词XYZ)\');';

function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r246-' + tag + '-'));
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
function mutateIn(tmp, from, to) {
  const src = path.join(tmp, 'src', 'index.js');
  const orig = fs.readFileSync(src, 'utf8');
  assert.ok(orig.includes(from), `副本中找不到变异锚点: ${from.slice(0, 70)}`);
  const mutated = orig.replace(from, to);
  assert.notStrictEqual(mutated, orig, '变异未生效');
  fs.writeFileSync(src, mutated, 'utf8');
}
function pcCountsIn(tmp, list) {
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(path.join(tmp, 'src', 'index.js'))});
const L=${JSON.stringify(list)};
console.log(JSON.stringify(L.map(x=>idx.checkPseudoCausal(x).count)));`],
    { encoding: 'utf8' });
  return JSON.parse(out.trim());
}

test('D1 副词表退回 HEAD 的 4 词：语序甲/乙的新词句必须整体回落，存量 4 词句不掉', () => {
  const tmp = copySrc('old4');
  try {
    mutateIn(tmp, ADV_DEF, ADV_DEF_OLD4);
    const a = pcCountsIn(tmp, A_ORDER_A_NEW);
    assert.deepStrictEqual(a, A_ORDER_A_NEW.map(() => 0),
      `退回 4 词后语序甲新词句应全部回落 pc=0，实测: ${a.join('/')}`);
    const b = pcCountsIn(tmp, A_ORDER_B_NEW);
    assert.deepStrictEqual(b, A_ORDER_B_NEW.map(() => 0),
      `退回 4 词后语序乙新词句应全部回落 pc=0，实测: ${b.join('/')}`);
    // 存量 4 词句（语序甲一路 + 语序乙立刻/马上/顿时）不因退回 4 词而掉——
    // 语序乙存量词句由本轮新增的语序乙半腿承重，与词表无关
    const old = pcCountsIn(tmp, A_OLD_WORDS.concat(A_ORDER_B_OLD));
    assert.deepStrictEqual(old, A_OLD_WORDS.concat(A_ORDER_B_OLD).map(() => 1),
      `存量 4 词句应保持 pc=1，实测: ${old.join('/')}`);
    // 良性句仍零误伤
    assert.strictEqual(pcCountsIn(tmp, B_BENIGN).filter(c => c > 0).length, 0, '退回 4 词后良性被误命中');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D2 摘掉语序乙半腿（只留「就+副词」）：语序乙 10 条回落，语序甲不动', () => {
  const tmp = copySrc('noorderb');
  try {
    mutateIn(tmp, LEG_LINE, LEG_LINE_A_ONLY);
    const b = pcCountsIn(tmp, A_ORDER_B_NEW.concat(A_ORDER_B_OLD));
    assert.deepStrictEqual(b, A_ORDER_B_NEW.concat(A_ORDER_B_OLD).map(() => 0),
      `摘掉语序乙后语序乙句应全部回落 pc=0，实测: ${b.join('/')}`);
    const a = pcCountsIn(tmp, A_ORDER_A_NEW);
    assert.deepStrictEqual(a, A_ORDER_A_NEW.map(() => 1),
      `摘掉语序乙不应影响语序甲，实测: ${a.join('/')}`);
    // 存量 6 条里 3 条走语序甲（一路）不受影响，3 条走语序乙（立刻/马上/顿时）随之回落
    const old = pcCountsIn(tmp, A_OLD_WORDS);
    assert.deepStrictEqual(old, [1, 1, 0, 0, 0, 1],
      `摘掉语序乙后存量 6 条应呈 [1,1,0,0,0,1]，实测: ${old.join('/')}`);
    assert.strictEqual(pcCountsIn(tmp, B_BENIGN).filter(c => c > 0).length, 0, '摘语序乙后良性被误命中');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D3 未变异副本还原校验：红队/良性与当前树逐项一致', () => {
  const tmp = copySrc('unmutated');
  try {
    assert.deepStrictEqual(pcCountsIn(tmp, A_RED), A_RED.map(pcCount), '未变异副本红队命中数与当前树不一致');
    assert.deepStrictEqual(pcCountsIn(tmp, B_BENIGN), B_BENIGN.map(pcCount), '未变异副本良性命中数与当前树不一致');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D4 外层窗口收回「不含逗号」：带逗号红队必须整体回落（钉住本轮放宽承重）', () => {
  const tmp = copySrc('nocomma');
  try {
    mutateIn(tmp, LEG_LINE, LEG_LINE_NO_COMMA);
    const comma = ['换了新包装之后，订单立马就多了', '上了新系统之后，客诉当即就少了'];
    const c = pcCountsIn(tmp, comma);
    assert.deepStrictEqual(c, comma.map(() => 0),
      `收回逗号窗口后带逗号红队应全部回落 pc=0，实测: ${c.join('/')}——本轮放宽的收益侧`);
    // 无逗号红队不受影响
    assert.strictEqual(pcCountsIn(tmp, A_ORDER_A_NEW).filter(x => x === 0).length, 0, '收回逗号不该影响无逗号句');
    assert.strictEqual(pcCountsIn(tmp, B_BENIGN).filter(x => x > 0).length, 0, '收回逗号后良性被误命中');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D5 机制名词豁免承重：摘掉 PC_MECH_WEAK_ZH 后两条工程护栏句必须被误命中（钉住放宽的安全性）', () => {
  const tmp = copySrc('nomech');
  try {
    // 工程护栏两句的逗号窗口本轮已放宽，它们继续 pass 靠的是机制名词豁免
    // （缓存/回归）——摘掉豁免表后必须被误命中，否则说明护栏失效
    mutateIn(tmp, MECH_DEF, MECH_DEF_EMPTY);
    const eng = pcCountsIn(tmp, ['重构了缓存层之后，延迟就一路下降了', '补了回归用例之后，缺陷密度就立刻下降了']);
    assert.ok(eng.every(c => c > 0),
      `摘掉机制豁免后两条工程护栏句应被误命中（pc>0），实测: ${eng.join('/')}——放宽逗号后护栏改由机制表承重的实证`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── E 族：存量攻击族一条不塌 ──────────────────────────────────────────────
const E_EXISTING = [
  '回归之后签单就一路多了',                    // 存量 ⑤支唯一语料样本
  '从那以后店里生意也稳了，总之功劳全在这个摆件上',  // r235 收束词归责族
  '贴了财神贴之后，进店客流就变多了',           // r244 事件锚定玄学动作族
  '自从换了新包装以来，客诉就少了',             // r245 裸「少了」负向环视族
  '上线之后投诉量下降了，所以这次上线就是投诉下降的原因。', // round-48 ①支
  '改了标题风格之后，转化率就一路走高，说明标题起效了。',   // round-48 ⑤支样例
];
test('E1 存量攻击族 6 条一条不塌 + gate 全非 pass', () => {
  for (const s of E_EXISTING) {
    assert.ok(pcHit(s), '存量攻击句不应塌: ' + s);
    assert.notStrictEqual(gateOf(s), 'pass', '存量攻击句 gate 不应 pass: ' + s);
  }
});

// ─── F 族：源码锚点 ────────────────────────────────────────────────────────
test('F1 副词表定义恰好 1 次且含 11 词（7 新 + 4 存量）', () => {
  const n = (SRC_TEXT.match(/const PC_RES_ADV_ZH = /g) || []).length;
  assert.strictEqual(n, 1, `PC_RES_ADV_ZH 定义应恰好 1 次，实测 ${n}`);
  const line = SRC_TEXT.split('\n').find(l => l.includes('const PC_RES_ADV_ZH = '));
  for (const w of ['立马', '当即', '旋即', '登时', '立时', '霎时', '随即', '一路', '立刻', '马上', '顿时']) {
    assert.ok(line.includes(w), `副词表缺词: ${w}`);
  }
  for (const w of ['随后', '紧接着', '转眼', '一下子', '赶紧', '赶忙']) {
    assert.ok(!line.includes(w), `本轮裁定不收的副词不该在表里: ${w}`);
  }
});

test('F2 两个语序半腿各定义 1 次，第⑤支仍是数组第 5 项（索引 4）', () => {
  assert.strictEqual((SRC_TEXT.match(/const PC_RES_ADV_JIU_FIRST = /g) || []).length, 1);
  assert.strictEqual((SRC_TEXT.match(/const PC_RES_ADV_ADV_FIRST = /g) || []).length, 1);
  // 第⑤支必须引用两个语序半腿
  assert.ok(SRC_TEXT.includes("PC_RES_ADV_JIU_FIRST + '|' + PC_RES_ADV_ADV_FIRST"),
    '第⑤支应由两个语序半腿交替构成');
  // 函数体按索引认弱支（PC_CAUSAL_ZH_PATS[4]），第⑤支必须排在第 5 项：
  // 从数组起点到第⑤支那一行之间，只能数出 4 个判据项（new RegExp 或正则字面量）
  const arrStart = SRC_TEXT.indexOf('const PC_CAUSAL_ZH_PATS = [');
  assert.ok(arrStart > 0, '找不到 PC_CAUSAL_ZH_PATS 数组');
  const legIdx = SRC_TEXT.indexOf("PC_RES_ADV_JIU_FIRST + '|' + PC_RES_ADV_ADV_FIRST");
  const legLineStart = SRC_TEXT.lastIndexOf('  new RegExp(', legIdx);
  const before = SRC_TEXT.slice(arrStart, legLineStart);
  const nItems = (before.match(/new RegExp\(/g) || []).length + (before.match(/^ {2}\/[^/]/gm) || []).length;
  assert.strictEqual(nItems, 4, `第⑤支之前应有 4 个判据项，实测 ${nItems}`);
});

test('F3 弱支登记未动：函数体 weak 行仍含索引 0/4/8/14/15', () => {
  const weakLine = SRC_TEXT.split('\n').find(l => l.includes('const weak = pat === PC_CAUSAL_ZH_PATS[0]'));
  assert.ok(weakLine, '找不到 weak 登记行');
  for (const i of [0, 4, 8, 14, 15]) assert.ok(weakLine.includes(`PC_CAUSAL_ZH_PATS[${i}]`), `weak 缺索引 ${i}`);
});

test('F4 dimensions 键数 210 不变（子进程口径——dimensions 运行期由 discriminate 输出）', () => {
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(path.join(ROOT, 'src', 'index.js'))});
const r=idx.discriminate('测试一句');
console.log(Object.keys(r.dimensions||{}).length);`],
    { encoding: 'utf8' });
  assert.strictEqual(Number(out.trim()), 210, `dimensions 键数应为 210，实测 ${out.trim()}`);
});

// ─── G 族：已知未修登记 ────────────────────────────────────────────────────
test('G1 对冲从句缺口登记：「季节性因素有很多」类多因素陈述仍被⑤支判出（存量对冲表缺腿）', () => {
  // HEAD 对「就一路」语序同样判 pc=1（scripts/tmp-246-chk2.js 实测），故这是
  // 存量对冲表缺腿、不是本轮新造的假阳性类别；本轮只让它对「立马就」语序同样可见。
  const s = '降温之后感冒立马就少了，季节性因素有很多';
  assert.strictEqual(pcCount(s), 1, '登记值：该句当前 pc=1');
  assert.strictEqual(gateOf(s), 'verify');
  // 带显式对冲词（但/不过/另外）的同类句仍放行——对冲表的既有腿承重
  for (const ok of ['降温之后感冒立马就少了，但季节性因素有很多',
    '换了新包装之后订单立马就多了，不过也可能是旺季']) {
    assert.strictEqual(pcCount(ok), 0, '带显式对冲词的同类句应放行: ' + ok);
  }
});

test('G2 裸标记族仍不进⑤支（r225 纪律）：无顺序标记的短距共变句不判', () => {
  // 「打那天起」是 PC_SEQ_BARE_ZH 裸标记，第①支专属；⑤支只认 PC_SEQ_ZH。
  for (const s of ['打那天起他随身带着护身符，感冒立马就少了', '隔天订单立马就多了']) {
    assert.strictEqual(pcCount(s), 0, '裸标记句不应被⑤支判出: ' + s);
  }
});

test('G3 甲半窗口 ≤14 字 + 「后/来」与副词之间 ≤18 字仍漏（长桥不判）', () => {
  // 第⑤支是**短距**共变判据：甲半 ≤14 字、后/来与副词之间 ≤18 字。超过的
  // 长桥句子本轮刻意不收（与①支的 44 字长桥互补，不重叠）。
  for (const s of ['换了新包装之后经过整整三个促销周期再回头对比数据，订单立马就多了',
    '换了新包装之后经过一整个促销周期再回头对比数据，订单立马就多了']) {
    assert.strictEqual(pcCount(s), 0, '长桥句当前漏判（登记）: ' + s);
  }
});
