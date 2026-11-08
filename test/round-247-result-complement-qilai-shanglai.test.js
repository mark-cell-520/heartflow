// r247 守卫：白话结果变动表补「V+起来 / V+上来」结果补语族
// （PC_RES_COLLOQ_ZH 新增 `(?:多|少|涨|好|火|旺)起来|上来了`，v6.8.175）——修 r246
// 交接簿候选池之外、轮初新实测的⑨'⑨''判据覆盖缺口。
// 铁律（本轮取向刀，r243 第十六条 / r244 第十七条 / r245 第十八条 / r246 第十九条
// 之后的第二十条）：**只收「度量/状态类动词 + 起来」与「上来」，不收裸「起来了」，
// 不收天气/物理类、人的状态类补语。**
//   收：多起来/少起来/涨起来/好起来/火起来/旺起来（语料实测：多起来 3 条、好起来
//     9 条、上来了 7 条，其余 0 条）、上来了。
//   不收：凉起来/冷起来/热起来/潮湿起来/高起来/稳起来（天气/物理，round-48「日常
//     物理类」同族）、忙起来/紧张起来/强起来（人的状态）、裸「起来了」（语料 18 条
//     全是方向补语：藏起来了/锁起来了/支起来了/一起来）、下去了（语料 7 条全是
//     撑不下去/写不下去/通知下去）。
// 轮初全仓 A/B 实测（scripts/tmp-247-ab.js，97981 条中文 quoted 样本，HEAD worktree
// 副本 data/wt-247-base）：checkPseudoCausal count 差异 7 条全升零降；gate.action
// 差异 5 条且全部落在本轮红队构造句上——存量良性零翻面。
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
  console.log(`\nround-247-result-complement-qilai-shanglai: ${p} 通过, ${f} 失败, 共 ${RESULTS.length} 个`);
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
const BASE = path.join(ROOT, 'data', 'wt-247-base');

const pcCount = s => idx.checkPseudoCausal(s).count;
const pcHit = s => pcCount(s) > 0;
const gateOf = s => gate.gate(s).gate.action;

// ─── A 族：红队（时段框架标记 / 玄学甲半 × 结果补语）────────────────────────
// 轮初实测（scripts/tmp-247-probe2.js + data/wt-247-base HEAD worktree 副本）：
// 15 条在 HEAD pc=0（gate 全 pass）——整族结果补语一个都不在原表里。
// 形状刻意避开其他判据：无归因断言词、无⑨支形式指标词（下降/上升/降低/减少/变少/
// 下滑/提高）、无机制名词，否则会被 ①/⑨/⑪/⑭ 支或 PC_MECH_WEAK_ZH 接管。
const A_RED = [
  // ── ⑨'腿：时段框架标记 × 结果补语（甲半是工程/管理/日常动作，HEAD 全漏）7 条
  '自从换了新包装以来，销量就涨起来了',
  '从那以后业绩就好起来了',
  '后来订单就慢慢多起来了',
  '去年改了版之后流水就上来了',
  '自从推广新活动以来，复购率就涨起来了',
  '去年换了新文案之后，转化率就上来了',
  '后来直播间就火起来了',
  // ── ⑨''腿：玄学动作甲半 × 正式顺序标记 × 结果补语 4 条
  '自从请了财神以来，进店客流就多起来了',
  '自从换了头像以来，咨询就多起来了',
  '自从供了财神以来，生意就旺起来了',
  '自从请了财神爷，店里就旺起来了',
  // ── 负向环视近亲：少起来（与裸「少了」腿对称）4 条
  '从那以后客诉就少起来了',
  '自从换了新包装以来，订单就多起来了',
  '后来回头客就渐渐多起来了',
  '从那以后差评就少起来了',
];
const A_PERIOD = A_RED.slice(0, 7);      // ⑨'腿形状
const A_MYSTIC = A_RED.slice(7, 11);     // ⑨''腿形状
const A_NEG = A_RED.slice(11);           // 少起来 / 多起来
const A_HEAD_MISS = 15;   // HEAD pc=0 条数（scripts/tmp-247-probe2.js 实测）
const A_HEAD_FLIP = 15;   // HEAD gate=pass → 现在 verify 的条数（实测）

test(`A1 结果补语红队 ${A_RED.length} 条：HEAD 漏判 ${A_HEAD_MISS} → 现在 0 漏`, () => {
  const miss = A_RED.filter(s => !pcHit(s));
  assert.strictEqual(miss.length, 0, `红队应零漏判，实测漏 ${miss.length}: ${miss.join(' / ')}`);
});

test(`A2 攻击句 gate 翻面登记（${A_HEAD_FLIP} 条 pass→verify）`, () => {
  const flips = A_RED.filter(s => gateOf(s) === 'verify');
  assert.strictEqual(flips.length, A_HEAD_FLIP,
    `应有 ${A_HEAD_FLIP} 条 gate=verify，实测 ${flips.length}`);
  for (const s of A_RED) assert.strictEqual(gateOf(s), 'verify', `gate 应为 verify: ${s}`);
});

test('A3 HEAD 漏判基数登记（HEAD 副本存在时用 git worktree 实测，不是记忆值）', () => {
  const base = path.join(BASE, 'src', 'index.js');
  if (!fs.existsSync(base)) {
    console.log('  （跳过：data/wt-247-base 不存在——HEAD 基数登记需在轮次进行中跑）');
    return;
  }
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(base)});
const L=${JSON.stringify(A_RED)};
console.log(JSON.stringify(L.map(x=>idx.checkPseudoCausal(x).count)));`],
    { encoding: 'utf8' });
  const headCounts = JSON.parse(out.trim());
  assert.strictEqual(headCounts.filter(c => c === 0).length, A_HEAD_MISS,
    `HEAD 副本实测漏判数应为 ${A_HEAD_MISS}，实测 ${headCounts.filter(c => c === 0).length}: ${headCounts.join('/')}`);
  // ⑨'腿 7 条与⑨''腿 4 条在 HEAD 必须全漏（原表无任何结果补语）
  assert.strictEqual(headCounts.slice(0, 11).filter(c => c === 0).length, 11,
    `⑨'/⑨''腿 11 条在 HEAD 应全部漏判，实测漏 ${headCounts.slice(0, 11).filter(c => c === 0).length}`);
});

test('A4 HEAD gate 基数登记（HEAD 副本存在时实测，15 条全 pass）', () => {
  const base = path.join(BASE, 'src', 'gate.js');
  if (!fs.existsSync(base)) {
    console.log('  （跳过：data/wt-247-base 不存在——gate 基数登记需在轮次进行中跑）');
    return;
  }
  const out = cp.execFileSync(process.execPath,
    ['-e', `const g=require(${JSON.stringify(base)});
const L=${JSON.stringify(A_RED)};
console.log(JSON.stringify(L.map(x=>g.gate(x).gate.action)));`],
    { encoding: 'utf8' });
  const headGates = JSON.parse(out.trim());
  assert.strictEqual(headGates.filter(a => a === 'pass').length, A_HEAD_FLIP,
    `HEAD 副本实测 pass 数应为 ${A_HEAD_FLIP}，实测 ${headGates.filter(a => a === 'pass').length}: ${headGates.join('/')}`);
});

// ─── B 族：良性（天气 / 工程 / 日常物理 / 人的状态 × 结果补语）────────────────
// 轮初实测（scripts/tmp-247-probe2.js）：10 条良性对照收词后必须全部保持 pc=0，
// 另加 2 条 round-48/round-224 存量护栏形状。
const B_BENIGN = [
  '入秋以来，早晚就凉起来了',
  '入冬以来，气温就冷起来了',
  '项目上线以来，系统就稳起来了',
  '开学以来，孩子就忙起来了',
  '自从学会复盘以来，团队就强起来了',
  '梅雨季节以来，车间就潮湿起来了',
  '自从换了缓存策略以来，接口延迟就下来了',
  '过完年之后，工地就热闹起来了',
  '入夏以来，用电负荷就高起来了',
  '考试结束后图书馆的空位就多了',
  '修好线上 bug 之后成功率自然就上去了',
];
// 唯一一条翻面的「良性」：工程实况 × 上来了。**不是本轮新造的假阳性类别**——
// HEAD 对同形「上去了」早已同判（scripts/tmp-247-reg.js 实测：
// 「新设备投产以来，良品率就上去了」HEAD pc=1/gate=verify），本轮只是让
// 「上来了」这一同义口语形与「上去了」行为一致。登记在 G1。
const B_ENG_FLIP = '新设备投产以来，良品率就上来了';

test(`B1 良性 ${B_BENIGN.length} 条 detector 零误伤`, () => {
  const hits = B_BENIGN.filter(pcHit);
  assert.strictEqual(hits.length, 0, '良性句不应命中，实测命中 ' + hits.length + ': ' + hits.join(' / '));
});

test(`B2 良性 ${B_BENIGN.length} 条 gate 全 pass`, () => {
  const bad = B_BENIGN.filter(s => gateOf(s) !== 'pass');
  assert.strictEqual(bad.length, 0, '良性句 gate 应全 pass，实测异常: ' + bad.join(' / '));
});

test('B3 良性句 gate 与 HEAD 副本逐项一致（HEAD 副本存在时）', () => {
  const base = path.join(BASE, 'src', 'gate.js');
  if (!fs.existsSync(base)) {
    console.log('  （跳过：data/wt-247-base 不存在——良性基线登记需在轮次进行中跑）');
    return;
  }
  const out = cp.execFileSync(process.execPath,
    ['-e', `const g=require(${JSON.stringify(base)});
const L=${JSON.stringify(B_BENIGN)};
console.log(JSON.stringify(L.map(x=>g.gate(x).gate.action)));`],
    { encoding: 'utf8' });
  const headGates = JSON.parse(out.trim());
  const cur = B_BENIGN.map(gateOf);
  assert.deepStrictEqual(cur, headGates,
    `良性句 gate 应与 HEAD 逐项一致，HEAD: ${headGates.join('/')} 现在: ${cur.join('/')}`);
});

test('B4 工程实况 × 「上来了」翻面登记：与 HEAD 对同形「上去了」的行为一致', () => {
  // HEAD：上来了 pc=0/pass，上去了 pc=1/verify —— 同义形行为不一致（本轮的缺口本身）
  assert.strictEqual(pcCount(B_ENG_FLIP), 1, `工程实况句现在应 pc=1，实测 ${pcCount(B_ENG_FLIP)}`);
  assert.strictEqual(gateOf(B_ENG_FLIP), 'verify');
  const base = path.join(BASE, 'src', 'index.js');
  if (!fs.existsSync(base)) {
    console.log('  （跳过：data/wt-247-base 不存在——HEAD 同形对照需在轮次进行中跑）');
    return;
  }
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(base)});
console.log(JSON.stringify([${JSON.stringify(B_ENG_FLIP)}, '新设备投产以来，良品率就上去了'].map(x=>idx.checkPseudoCausal(x).count)));`],
    { encoding: 'utf8' });
  const [headFlip, headQush] = JSON.parse(out.trim());
  assert.strictEqual(headFlip, 0, `HEAD 对「上来了」应 pc=0，实测 ${headFlip}`);
  assert.strictEqual(headQush, 1, `HEAD 对同形「上去了」应早已 pc=1，实测 ${headQush}——若为 0 则本轮翻面是新类别，须重新评估`);
});

// ─── C 族：victim（只靠新补语族判出，HEAD 全漏）─────────────────────────────
const C_VIC = [
  '从那以后生意就旺起来了',
  '自从上架了幸运色袜子，订单就火起来了',
  '后来直播间的在线人数就涨起来了',
];

test(`C1 victim ${C_VIC.length} 条只靠新补语族判出（HEAD 全漏）`, () => {
  for (const s of C_VIC) {
    assert.ok(pcHit(s), `victim 应命中: ${s}`);
    assert.strictEqual(gateOf(s), 'verify', `victim gate 应为 verify: ${s}`);
  }
  const base = path.join(BASE, 'src', 'index.js');
  if (!fs.existsSync(base)) {
    console.log('  （跳过：data/wt-247-base 不存在——victim HEAD 基数需在轮次进行中跑）');
    return;
  }
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(base)});
const L=${JSON.stringify(C_VIC)};
console.log(JSON.stringify(L.map(x=>idx.checkPseudoCausal(x).count)));`],
    { encoding: 'utf8' });
  const headCounts = JSON.parse(out.trim());
  assert.ok(headCounts.every(c => c === 0),
    `victim 在 HEAD 应全部漏判，实测 ${headCounts.join('/')}`);
});

// ─── D 族：变异守卫 ─────────────────────────────────────────────────────────
const D_DEF_ANCHOR = 'const PC_RES_COLLOQ_ZH = /(?:多了|变多|变好|变差|变高|变低|上去了|下来了|涨了|跌了|(?<![减变])少了|(?:多|少|涨|好|火|旺)起来|上来了)/;';
const D_FAMILY = '|(?:多|少|涨|好|火|旺)起来|上来了)/;';
const D_VERBS = '(?:多|少|涨|好|火|旺)起来';
const D_SHANGLAI = '|上来了)/;';

function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r247-' + tag + '-'));
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
  assert.ok(orig.includes(from), `副本中找不到变异锚点: ${from.slice(0, 50)}`);
  const mutated = orig.replace(from, to);
  assert.notStrictEqual(mutated, orig, '变异未生效');
  fs.writeFileSync(src, mutated, 'utf8');
}
function pcCountsIn(tmp, list) {
  const src = path.join(tmp, 'src', 'index.js');
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(src)});
const L=${JSON.stringify(list)};
console.log(JSON.stringify(L.map(x=>idx.checkPseudoCausal(x).count)));`],
    { encoding: 'utf8' });
  return JSON.parse(out.trim());
}

test('D1 摘掉整个结果补语族：红队 15 条整体回落且存量攻击句不掉', () => {
  const tmp = copySrc('family');
  try {
    mutateIn(tmp, D_FAMILY, ')/;');
    const counts = pcCountsIn(tmp, A_RED);
    assert.strictEqual(counts.filter(c => c === 0).length, A_RED.length,
      `摘掉补语族后红队应全部回落，实测 ${counts.join('/')}`);
    // 含存量白话词（多了/涨了/上去了）的攻击句不许掉——证明摘的只是新族
    const kept = pcCountsIn(tmp, [
      '自从回归稳了之后签单就多了',
      '改了标题风格之后，转化率就一路走高，说明标题起效了。',
      '换了新包装之后，订单立马就多了',
    ]);
    assert.ok(kept.every(c => c > 0), `存量攻击句不应回落，实测 ${kept.join('/')}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D2 只摘「起来」动词表：「起来」句回落而「上来了」句不掉', () => {
  const tmp = copySrc('verbs');
  try {
    mutateIn(tmp, D_VERBS, '(?!x)x');
    const counts = pcCountsIn(tmp, A_RED);
    // A_RED 里只有「上来了」两条（索引 3、5）应保持命中
    const shanglaiIdx = [3, 5];
    for (const i of shanglaiIdx) {
      assert.ok(counts[i] > 0, `「上来了」句不应回落（索引 ${i}）: ${A_RED[i]}`);
    }
    const qilai = counts.filter((c, i) => !shanglaiIdx.includes(i));
    assert.strictEqual(qilai.filter(c => c === 0).length, qilai.length,
      `「起来」句应全部回落，实测 ${counts.join('/')}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D3 只摘「上来了」：「上来了」句回落而「起来」句不掉', () => {
  const tmp = copySrc('shanglai');
  try {
    mutateIn(tmp, D_SHANGLAI, ')/;');
    const counts = pcCountsIn(tmp, A_RED);
    const shanglaiIdx = [3, 5];
    for (const i of shanglaiIdx) {
      assert.strictEqual(counts[i], 0, `「上来了」句应回落（索引 ${i}）: ${A_RED[i]}`);
    }
    const qilai = counts.filter((c, i) => !shanglaiIdx.includes(i));
    assert.ok(qilai.every(c => c > 0), `「起来」句不应回落，实测 ${counts.join('/')}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D4 未变异副本还原校验：与当前树逐项一致', () => {
  const tmp = copySrc('restore');
  try {
    const counts = pcCountsIn(tmp, A_RED.concat(B_BENIGN, C_VIC));
    const cur = A_RED.concat(B_BENIGN, C_VIC).map(pcCount);
    assert.deepStrictEqual(counts, cur, '未变异副本应与当前树逐项一致');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── E 族：存量攻击族一条不塌 ───────────────────────────────────────────────
// 前 7 条 count 与 gate 全不变；后 2 条是轮初 A/B 实测的 count 1→2 登记
// （①支归因断言原已承重，本轮⑨'腿再加一支，gate rewrite 不变）。
const E_EXIST = [
  ['自从回归稳了之后签单就多了', 1],
  ['自从变量稳了之后签单就多了', 1],
  ['自从换了新包装以来，客诉就少了', 1],
  ['改了标题风格之后，转化率就一路走高，说明标题起效了。', 2],
  ['换了新包装之后，订单立马就多了', 1],
  ['那次促销一结束，退货量就上来了，显然促销把不合适的人吸引来了。', 1],
  ['调整座位之后他成绩也上来了，说明是座位风水显了灵', 1],
  ['从那以后孩子成绩上来了，归根结底是这套教辅的功劳', 2],
  ['去年开始供灯，之后身体就好起来了，一定是供灯的效果', 2],
];

test(`E1 存量攻击族 ${E_EXIST.length} 条一条不塌 + count 登记`, () => {
  for (const [s, n] of E_EXIST) {
    assert.strictEqual(pcCount(s), n, `存量攻击句 count 应为 ${n}: ${s}（实测 ${pcCount(s)}）`);
    assert.notStrictEqual(gateOf(s), 'pass', `存量攻击句 gate 不应为 pass: ${s}`);
  }
});

test('E2 count 1→2 的两条双支共燃登记：gate 不变（①支原已 rewrite）', () => {
  for (const s of ['从那以后孩子成绩上来了，归根结底是这套教辅的功劳',
    '去年开始供灯，之后身体就好起来了，一定是供灯的效果']) {
    assert.strictEqual(gateOf(s), 'rewrite', `gate 应保持 rewrite: ${s}`);
  }
});

// ─── F 族：源码锚点 ─────────────────────────────────────────────────────────
test('F1 PC_RES_COLLOQ_ZH 只定义 1 次且含结果补语族', () => {
  assert.strictEqual((SRC_TEXT.match(/const PC_RES_COLLOQ_ZH = /g) || []).length, 1,
    'PC_RES_COLLOQ_ZH 定义次数应为 1');
  assert.ok(SRC_TEXT.includes(D_DEF_ANCHOR), '定义行应含结果补语族');
});

test('F2 两条弱支腿仍在用 PC_RES_COLLOQ_ZH.source（未改成别的表）', () => {
  assert.ok(SRC_TEXT.includes("  new RegExp(PC_SEQ_PERIOD_ZH.source + '[^。]{0,14}' + PC_RES_COLLOQ_ZH.source),"),
    '⑨\'腿（时段框架 × 白话结果变动）应仍用 PC_RES_COLLOQ_ZH');
  assert.ok(SRC_TEXT.includes("  new RegExp(PC_EVENT_ACT_ZH.source + '[^.。]{0,24}' + PC_SEQ_ZH.source + '[^.。]{0,14}' + PC_RES_COLLOQ_ZH.source),"),
    '⑨\'\'腿（玄学动作甲半 × 白话结果变动）应仍用 PC_RES_COLLOQ_ZH');
});

test('F3 dimensions 键数 210 不变（子进程口径——dimensions 运行期由 discriminate 输出）', () => {
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(path.join(ROOT, 'src', 'index.js'))});
const r=idx.discriminate('测试一句');
console.log(Object.keys(r.dimensions||{}).length);`],
    { encoding: 'utf8' });
  assert.strictEqual(Number(out.trim()), 210, `dimensions 键数应为 210，实测 ${out.trim()}`);
});

test('F4 weak 弱支登记未动（①⑤⑧⑨⑨\'⑨\'\' 六个索引不变）', () => {
  assert.ok(SRC_TEXT.includes(
    "const weak = pat === PC_CAUSAL_ZH_PATS[0] || pat === PC_CAUSAL_ZH_PATS[4] || pat === PC_CAUSAL_ZH_PATS[8] || pat === PC_CAUSAL_ZH_PATS[14] || pat === PC_CAUSAL_ZH_PATS[15];"),
    'weak 弱支登记行应逐字未动');
  assert.strictEqual((SRC_TEXT.match(/const PC_CAUSAL_ZH_PATS = \[/g) || []).length, 1,
    'PC_CAUSAL_ZH_PATS 仍应只有一个定义');
});

// ─── G 族：已知未修（含为什么不修）─────────────────────────────────────────
test('G1 工程实况 × 「上来了」仍会误判（登记：与 HEAD 对同形「上去了」同类）', () => {
  // 「新设备投产以来，良品率就上来了」pc=1/verify。不修的原因：HEAD 对同形
  // 「上去了」早已同判（pc=1/verify），本轮只是消除同义形行为不一致；要收窄需给
  // 机制豁免表 PC_MECH_WEAK_ZH 补「投产/良品率」等词，而豁免表按 r216~r232 十七轮
  // 纪律只许收窄不许放宽，是单独轮次的题。
  assert.strictEqual(pcCount(B_ENG_FLIP), 1);
  assert.strictEqual(gateOf(B_ENG_FLIP), 'verify');
});

test('G2 ⑭支结果表 PC_RESJOIN_ZH 仍不收结果补语族（两条存量攻击句仍漏）', () => {
  // 「商店上架了幸运色袜子，所以订单明显多起来了」「根据我改了昵称的说法，总之
  // 现在订单多起来了」——两句都是仓里存量语料，形状是 ⑭支（玄学对象 × 获益结果）
  // 而非弱支：甲半「上架了幸运色袜子」不在 PC_EVENT_ACT_ZH（玄学动作表），句中也
  // 无时段框架标记，所以⑨'⑨''都够不着。不修的原因：PC_RESJOIN_ZH 是⑭支（强支）
  // 的结果表，与 PC_LUCK2_MECH / PC_REV_MECH 两道机制护栏交互，扩它要单独一轮 + 全量 A/B。
  for (const s of ['商店上架了幸运色袜子，所以订单明显多起来了',
    '根据我改了昵称的说法，总之现在订单多起来了']) {
    assert.strictEqual(pcCount(s), 0, `该句本轮仍应漏判（⑭支缺口，非本轮范围）: ${s}`);
  }
});

test('G3 天气/物理/人的状态补语族仍不收（十条良性保持 pc=0）', () => {
  for (const s of ['入秋以来，早晚就凉起来了', '入冬以来，气温就冷起来了',
    '项目上线以来，系统就稳起来了', '开学以来，孩子就忙起来了',
    '自从学会复盘以来，团队就强起来了']) {
    assert.strictEqual(pcCount(s), 0, `天气/物理/状态补语不应收: ${s}`);
  }
});
