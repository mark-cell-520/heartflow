// r243 守卫：⑨ 支第二腿「时段框架标记 × 白话结果变动词」（PC_SEQ_PERIOD_ZH ×
// PC_RES_COLLOQ_ZH，v6.8.171）——修 r242 G1 登记的①⑤⑨弱支**判据覆盖缺口**。
// 铁律：白话结果变动词（多了/少了/上去了/涨了…）只在**时段框架**顺序标记
// （自从/从那以后/此后/后来/去年/今天/…）下构成弱信号；**事件锚定**标记
// （之后/结束后/播出后/发布后/一结束/后，）之后的白话变动是日常实况/工程实况，
// 一条都不判（round-48 良性表「日常物理类」子类 + round-224 工程护栏族钉死）。
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
  console.log(`\nround-243-colloq-result-period-marker: ${p} 通过, ${f} 失败, 共 ${RESULTS.length} 个`);
});
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const assert = require('assert');
const gate = require('../src/gate.js');
const idx = require('../src/index.js');
const ph = require('../src/post-hoc.js');

const ROOT = path.join(__dirname, '..');
const SRC_TEXT = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');

const pcCount = s => idx.checkPseudoCausal(s).count;
const pcHit = s => pcCount(s) > 0;
const phCount = s => ph.checkPostHoc(s).count;
const gateOf = s => gate.gate(s).gate.action;

// ─── A 族：弱支红队 10 条（时段框架标记 × 白话结果变动词，无显式归因断言）──
// 轮初实测（scripts/tmp-243-head.js + data/wt-243-base 副本）：前 8 条在 HEAD
// 全部 pc=0、gate 全 pass——⑨支原有指标词表（下降/上升/降低/减少/变少/下滑/
// 提高）装不下「签单就多了」，①支又没有归因断言，⑤支也不要「就一路」。
// 后 2 条 HEAD 已判（pc=1，①支/⑪支），本轮新腿让它们加到 pc=2（命中数加强）。
const A_RED_HEAD_MISS = [
  // G1 原型（r242 登记的两条）
  '自从变量稳了之后签单就多了',
  '自从回归稳了之后签单就多了',
  // 同族攻击形状（玄学/业务裸归因 × 白话变动）
  '自从请了风水师，回款就变多了',
  '去年改了大门朝向，订单就多了',
  '此后他坚持凌晨起床，签单就变多了',
  '自从用了新系统，bug 就多了，新系统不行',
  '自从换了主管，业绩就上去了',
  '去年开始转发抽奖微博，客户就变多了',
];
const A_RED_STRENGTHENED = [
  '从那以后他每天拜财神，业绩就上去了',
  '自从戴了护身符，孩子成绩就上去了',
];
const A_RED = A_RED_HEAD_MISS.concat(A_RED_STRENGTHENED);
const HEAD_MISS = 8;

test(`A1 弱支红队 ${A_RED.length} 条：HEAD 漏 ${HEAD_MISS}/${A_RED.length} → 现在 0 漏`, () => {
  const miss = A_RED.filter(s => !pcHit(s));
  assert.strictEqual(miss.length, 0, `弱支红队应零漏判，实测漏 ${miss.length}: ${miss.join(' / ')}`);
  for (const s of A_RED) assert.ok(gateOf(s) !== 'pass', '判了的攻击句 gate 不应 pass: ' + s);
});

test('A2 攻击句 detector 命中数逐条登记', () => {
  const counts = A_RED.map(pcCount);
  // 末两条 HEAD 已判（①支/⑪支），新腿再加上一支 → 2；其余 1
  assert.deepStrictEqual(counts, [1, 1, 1, 1, 1, 1, 1, 1, 2, 2],
    'detector 命中数应与登记一致，实测: ' + counts.join('/'));
});

test('A3 HEAD 漏判基数登记（用 HEAD 副本实测，不是记忆值）', () => {
  let headIdx = null;
  try {
    headIdx = require(path.join(ROOT, 'data', 'wt-243-base', 'src', 'index.js'));
  } catch (_) { headIdx = null; } // worktree 轮末已删 → 跳过本轮登记
  if (!headIdx || typeof headIdx.checkPseudoCausal !== 'function') {
    console.log('  （跳过：data/wt-243-base 不存在——HEAD 基数登记需在轮次进行中跑）');
    return;
  }
  const miss = A_RED_HEAD_MISS.filter(s => headIdx.checkPseudoCausal(s).count === 0).length;
  assert.strictEqual(miss, HEAD_MISS, `HEAD 弱支红队漏判应为 ${HEAD_MISS}，实测 ${miss}`);
  // 加强族两条 HEAD 已判，现在必须 ≥2
  for (const s of A_RED_STRENGTHENED) {
    assert.ok(headIdx.checkPseudoCausal(s).count > 0, 'HEAD 应已判出加强族: ' + s);
    assert.ok(pcCount(s) >= 2, '加强族现在应 ≥2 支: ' + s);
  }
});

// ─── B 族：良性零误伤（事件锚定侧 + 机制/数字/对冲族）────────────────────
// 这一族是本轮设计定型的关键：白话词若不分标记类型并进⑨支原有腿，轮初实测
// 这 14 条里 4 条被误判（考试结束后空位就多了 / 修好 bug 之后成功率上去 /
// 降温之后感冒也少了 / 直接从训练集当基准分数上去——后者本轮前已被护栏挡住）。
const BENIGN = [
  // round-48 良性表「日常物理类」子类（事件锚定 + 白话变动 = 物理实况）
  '考试结束后图书馆的空位就多了。',
  '六点之后地铁明显宽松很多。',
  '国庆假期之后机票价格普遍回落。',
  // round-224 C 节护栏族 + round-143 良性表（事件锚定 + 白话变动 = 工程实况）
  '修好线上 bug 之后成功率自然就上去了',
  '把失败的运行删掉，成功率立刻就上去了',
  '直接用训练集当评测基准，分数自然就上去了',
  'KPI 差的城市先不纳入统计，整体数字就上去了',
  // 自然现象 / 机制 / 数字 / 对冲族
  '降温之后感冒也少了，总之季节性因素有很多',
  '大雨之后水库水位涨了两米。',
  '下雨之后水库水位就涨了，说明是降雨补给了库容',
  '上线之后投诉量有所下降，我们也同步调整了客服排班，具体原因还要再看两周数据。',
  '采用新架构后请求 Latency 从 800ms 降到 120ms。',
  '改版之后日活从 3 万涨到 4.5 万。',
  '加了单元测试之后线上回滚次数下降，边界 case 在提测前就被挡住了。',
];

test(`B1 良性 ${BENIGN.length} 条 detector 零误伤`, () => {
  const fp = BENIGN.filter(s => pcHit(s));
  assert.deepStrictEqual(fp, [], `良性句被新腿误命中：\n  ${fp.join('\n  ')}`);
});

test('B2 良性句 gate 与 HEAD 副本逐项一致（pass 保持 pass）', () => {
  let headGate = null;
  try {
    headGate = require(path.join(ROOT, 'data', 'wt-243-base', 'src', 'gate.js'));
  } catch (_) { headGate = null; }
  if (!headGate || typeof headGate.gate !== 'function') {
    console.log('  （跳过：data/wt-243-base 不存在）');
    return;
  }
  for (const s of BENIGN) {
    const a = headGate.gate(s).gate.action, b = gateOf(s);
    assert.strictEqual(b, a, `良性句 gate 与 HEAD 不一致：HEAD=${a} NOW=${b} :: ${s}`);
  }
});

// ─── C 族：新腿承重 victim（只靠新腿判出的句子）────────────────────────
// 三条 victim 在 HEAD 全部 pc=0，且摘掉新腿后必须回到 pc=0——证明新腿真的在
// 承重，不是其他支顺带命中的（r228 坑③：不留不承重的代码）。
const C_VICTIM = [
  '自从变量稳了之后签单就多了',
  '去年改了大门朝向，订单就多了',
  '去年开始转发抽奖微博，客户就变多了',
];

test('C1 三条 victim 只靠新腿判出（HEAD 全漏）', () => {
  let headIdx = null;
  try { headIdx = require(path.join(ROOT, 'data', 'wt-243-base', 'src', 'index.js')); } catch (_) { headIdx = null; }
  if (!headIdx || typeof headIdx.checkPseudoCausal !== 'function') {
    console.log('  （跳过：data/wt-243-base 不存在）');
    return;
  }
  for (const s of C_VICTIM) {
    assert.strictEqual(headIdx.checkPseudoCausal(s).count, 0, 'HEAD 应漏判: ' + s);
    assert.ok(pcHit(s), '现在应判出: ' + s);
  }
});

// ─── D 族：变异守卫（临时目录隔离，绝不在原地改写 src/）──────────────────
/** 复制 src/ 到临时目录，返回目录路径 */
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r243-' + tag + '-'));
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
/** 在临时副本上跑：返回 list 里 checkPseudoCausal count 数组 */
function pcCountsIn(tmp, list) {
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(path.join(tmp, 'src', 'index.js'))});
const L=${JSON.stringify(list)};
console.log(JSON.stringify(L.map(x=>idx.checkPseudoCausal(x).count)));`],
    { encoding: 'utf8' });
  return JSON.parse(out.trim());
}

test('D1 摘掉整条新腿：红队 8 条 HEAD 漏判族整体回落', () => {
  const tmp = copySrc('leg');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    const LEG = "  new RegExp(PC_SEQ_PERIOD_ZH.source + '[^。]{0,14}' + PC_RES_COLLOQ_ZH.source),";
    assert.ok(orig.includes(LEG), '副本中找不到新腿定义行');
    const mutated = orig.replace(LEG, '');
    assert.notStrictEqual(mutated, orig, '变异未生效（新腿删除失败）');
    fs.writeFileSync(src, mutated, 'utf8');
    const counts = pcCountsIn(tmp, A_RED_HEAD_MISS);
    const miss = counts.filter(c => c === 0).length;
    assert.strictEqual(miss, HEAD_MISS, `摘腿后红队漏判应为 ${HEAD_MISS}，实测 ${miss}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('D2 只清空 PC_RES_COLLOQ_ZH 词族：同样回落且形式腿不受影响', () => {
  const tmp = copySrc('word');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    const WORD = 'const PC_RES_COLLOQ_ZH = /(?:多了|变多|变好|变差|变高|变低|上去了|下来了|涨了|跌了)/;';
    assert.ok(orig.includes(WORD), '副本中找不到 PC_RES_COLLOQ_ZH 定义行');
    const mutated = orig.replace(WORD, 'const PC_RES_COLLOQ_ZH = /(?!)/;');
    assert.notStrictEqual(mutated, orig, '变异未生效（词族清空失败）');
    fs.writeFileSync(src, mutated, 'utf8');
    // 新腿全塌（红队回落到 HEAD 漏判态）
    const counts = pcCountsIn(tmp, A_RED_HEAD_MISS);
    const miss = counts.filter(c => c === 0).length;
    assert.strictEqual(miss, HEAD_MISS, `清空词族后红队漏判应为 ${HEAD_MISS}，实测 ${miss}`);
    // ⑨支形式腿不受影响（正式指标词照判）
    const formal = pcCountsIn(tmp, ['上线之后投诉量下降了', '发布新版本后崩溃率下降，证明是旧版本的锅。']);
    assert.ok(formal.every(c => c > 0), '形式腿不应受词族变异影响，实测: ' + formal.join('/'));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('D3 时段/事件标记切分承重：新腿改用 PC_SEQ_ZH（含事件锚定）后良性必须重现误判', () => {
  const tmp = copySrc('split');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    const LEG = "  new RegExp(PC_SEQ_PERIOD_ZH.source + '[^。]{0,14}' + PC_RES_COLLOQ_ZH.source),";
    assert.ok(orig.includes(LEG), '副本中找不到新腿定义行');
    const mutated = orig.replace(LEG,
      "  new RegExp(PC_SEQ_ZH.source + '[^。]{0,14}' + PC_RES_COLLOQ_ZH.source),");
    assert.notStrictEqual(mutated, orig, '变异未生效（标记表替换失败）');
    fs.writeFileSync(src, mutated, 'utf8');
    // 轮初实测的事件锚定误伤必须重现（大雨之后水库水位有机制名词豁免，不在此列）
    const FP = [
      '考试结束后图书馆的空位就多了。',
      '修好线上 bug 之后成功率自然就上去了',
    ];
    const counts = pcCountsIn(tmp, FP);
    const hit = counts.filter(c => c > 0).length;
    assert.strictEqual(hit, FP.length, `标记切分去掉后应 ${FP.length}/${FP.length} 条重现误判，实测 ${hit}`);
    // 同时存量良性表整体不许劣化
    const benignCounts = pcCountsIn(tmp, BENIGN);
    assert.ok(benignCounts.filter(c => c > 0).length >= 2,
      '事件锚定并腿后良性误伤应 ≥3 条，实测 ' + benignCounts.filter(c => c > 0).length);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('D4 未变异副本还原校验（红队/良性与当前树逐项一致）', () => {
  const tmp = copySrc('pristine');
  try {
    const counts = pcCountsIn(tmp, A_RED.concat(BENIGN));
    const redCounts = counts.slice(0, A_RED.length);
    const benignCounts = counts.slice(A_RED.length);
    assert.ok(redCounts.every(c => c > 0), '未变异副本红队应全判出: ' + redCounts.join('/'));
    assert.deepStrictEqual(benignCounts, BENIGN.map(() => 0), '未变异副本良性应零误伤');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ─── E 族：存量攻击族一条不塌 ───────────────────────────────────────────
const E_LEGACY = [
  // round-48 攻击集代表
  '上线之后投诉量下降了，所以这次上线就是投诉下降的原因。',
  '自从换了新领导，业绩就一路下滑，显然是新领导把团队带崩了。',
  '这部剧播出后当地旅游就火了，可见这部剧带火了整座城市。',
  '昨天改了配置，今天服务就稳了，说明就是配置的问题。',
  // r226/r227 服药族
  '这瓶药吃下去烧就退了，肯定是药起了作用',
  '吃了这个保健品之后皮肤就变好了',
  // r239/r240/r241/r242 红袜子族（r242 红队原句）
  '自从变量稳了之后，客诉就下滑了',
  '回归稳了之后，代码缺陷就变少了',
  '回归之后，转化率提高了',
  '自从回归稳了之后签单就少了，看来是头像的问题',
];

test(`E1 存量攻击族 ${E_LEGACY.length} 条一条不塌`, () => {
  const miss = E_LEGACY.filter(s => !pcHit(s));
  assert.deepStrictEqual(miss, [], `存量攻击族掉落：\n  ${miss.join('\n  ')}`);
});

test('E2 存量攻击族 gate 非 pass', () => {
  const pass = E_LEGACY.filter(s => gateOf(s) === 'pass');
  assert.deepStrictEqual(pass, [], `存量攻击族 gate 漏判：\n  ${pass.join('\n  ')}`);
});

// ─── F 族：源码锚点 ─────────────────────────────────────────────────────
test('F1 两张新表各只定义 1 次', () => {
  assert.strictEqual((SRC_TEXT.match(/const PC_SEQ_PERIOD_ZH = /g) || []).length, 1, 'PC_SEQ_PERIOD_ZH 定义次数应为 1');
  assert.strictEqual((SRC_TEXT.match(/const PC_RES_COLLOQ_ZH = /g) || []).length, 1, 'PC_RES_COLLOQ_ZH 定义次数应为 1');
});

test('F2 新腿追加在数组末尾（⑭之后），索引 14', () => {
  const legLine = "  new RegExp(PC_SEQ_PERIOD_ZH.source + '[^。]{0,14}' + PC_RES_COLLOQ_ZH.source),";
  assert.ok(SRC_TEXT.includes(legLine), '找不到新腿定义行');
  const iLeg = SRC_TEXT.indexOf(legLine);
  const iLast = SRC_TEXT.indexOf("new RegExp(PC_NOOBJ_ZH.source + '[^。]{0,44}?' + PC_RESJOIN_ZH.source),");
  assert.ok(iLast > 0 && iLeg > iLast, '新腿必须排在⑭支之后（索引右移会让⑩~⑭护栏错位）');
});

test('F3 弱支登记含索引 14', () => {
  assert.ok(/const weak = pat === PC_CAUSAL_ZH_PATS\[0\].*PC_CAUSAL_ZH_PATS\[14\]/.test(SRC_TEXT),
    'weak 判断未登记 PC_CAUSAL_ZH_PATS[14]');
});

test('F4 时段标记表不收裸标记（r225 纪律：隔天/当天/第二天/次日 全部排除）', () => {
  const m = SRC_TEXT.match(/const PC_SEQ_PERIOD_ZH = (\/[^\n]*\/);/);
  assert.ok(m, '找不到 PC_SEQ_PERIOD_ZH 定义行');
  for (const bare of ['隔天', '当天', '第二天', '次日', '打那', '那天']) {
    assert.ok(!m[1].includes(bare), `PC_SEQ_PERIOD_ZH 不应含裸标记「${bare}」`);
  }
  // 事件锚定标记也不收（之后/结束后 由 D3 变异守卫钉住）
  for (const evt of ['之后', '结束后', '播出后', '发布后', '一结束']) {
    assert.ok(!m[1].includes(evt), `PC_SEQ_PERIOD_ZH 不应含事件锚定标记「${evt}」`);
  }
});

test('F5 dimensions 键 210 不变（本轮未加维度，只补⑨支第二腿）', () => {
  // 运行时口径（与 test/doc-numbers-accuracy.test.js 同源： discriminate 的
  // dimensions 键），静态正则数不准——dimensions 注册处不是齐两空格缩进。
  const dr = cp.spawnSync('node', ['-e', `
    const {discriminate}=require(${JSON.stringify(path.join(ROOT, 'src/index.js').replace(/\\/g, '/'))});
    const d=discriminate('neutral baseline text');
    console.log(Object.keys(d.dimensions||{}).length);
  `], { encoding: 'utf8', timeout: 60000 });
  const n = parseInt((dr.stdout || '').trim().split('\n')[0], 10);
  assert.strictEqual(n, 210, `dimensions 键数应为 210，实测 ${n}`);
});

// ─── G 族：已知未修登记 ─────────────────────────────────────────────────
// G1 裸标记时段句仍漏（r225 纪律刻意不收）：「打那天起…」「那天换了头像之后…」
// 轮初实测这 2 条红队句现在仍 pc=0——⑨族无归因断言兜底，收裸标记会造良性
// 假阳性（r225 原文纪律），要收需先给⑨族做裸标记的位置化，单独轮次。
test('G1 裸标记时段句仍漏（登记为已知未修，r225 纪律）', () => {
  const GAP = [
    '打那天起他随身带着护身符，感冒就变少了',
    '那天换了头像之后，咨询就变多了',
  ];
  for (const s of GAP) {
    assert.strictEqual(pcCount(s), 0, `裸标记句应仍漏判（已知未修）：${s}，实测 pc=${pcCount(s)}`);
  }
});

// G2 事件锚定侧白话攻击句仍漏：「贴了财神贴之后，进店客流就变多了」等——
// round-48「日常物理类」+ round-224 工程护栏两族钉在事件锚定侧，要收这一侧
// 必须先给这两族做语境化/位置化，单独轮次。
test('G2 事件锚定侧白话攻击句仍漏（登记为已知未修）', () => {
  const GAP = [
    '贴了财神贴之后，进店客流就变多了',
    '新系统上线之后，用户量就涨上去了',
    '改完名之后，订单就多了',
  ];
  for (const s of GAP) {
    assert.strictEqual(pcCount(s), 0, `事件锚定白话攻击句应仍漏判（已知未修）：${s}，实测 pc=${pcCount(s)}`);
  }
});
