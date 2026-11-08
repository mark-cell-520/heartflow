// r245 守卫：⑨支白话结果变动表补「负向环视裸『少了』腿」
// （PC_RES_COLLOQ_ZH 新增 `(?<![减变])少了`，v6.8.173）——修 r243 G3 / r244 候选①
// 登记的「裸下降白话句仍漏」缺口。
// 铁律（本轮取向刀，r243 第十六条 / r244 第十七条之后的第十八条）：
// **白话结果变动表收裸「少了」，但只收「前一字不是减/变」的那一半**——前一字是
// 减/变时（减少了/变少了）是⑨支形式腿（下降|上升|降低|减少|变少|下滑|提高）已收
// 的正式下降表述，白话腿重复计数会把存量族守卫的 count 登记打花（r243 轮初实测
// 误伤 round-233/234/235/238 四条守卫，当时整词砍掉挂账两轮）；前一字不是减/变
// 时（「客诉就少了」「退货就少了」）才是白话结果变动，照判。
// 轮初全仓 A/B 实测（scripts/tmp-245-ab.js，65392 条中文 quoted 样本，HEAD worktree
// 副本 data/wt-245-base）：count 差异 9 条全升零降；gate.action 差异 2 条且都是
// 本轮红队构造句（pass→verify）——存量良性零翻面。
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
  console.log(`\nround-245-bare-shaole-negative-lookbehind: ${p} 通过, ${f} 失败, 共 ${RESULTS.length} 个`);
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

const pcCount = s => idx.checkPseudoCausal(s).count;
const pcHit = s => pcCount(s) > 0;
const gateOf = s => gate.gate(s).gate.action;

// ─── A 族：红队（时段/事件锚定标记 × 裸「少了」白话下降）────────────────────
// 轮初实测（scripts/tmp-245-red.js + data/wt-245-base HEAD worktree 副本）：11 条
// 在 HEAD 全部 pc=0——⑨支形式腿的指标词表（下降/上升/降低/减少/变少/下滑/提高）
// 装不下裸「少了」，⑨'腿的白话表 r243 起刻意不收「少了」，①支还要归因断言。
const A_RED = [
  '自从换了新包装以来，客诉就少了',
  '去年上了新系统之后，客诉就少了',
  '此后退货就少了',
  '后来投诉就少了',
  '从那以后投诉就少了',
  '改完名之后客诉就少了',          // 事件锚定 × 玄学动作甲半（⑨''腿也承重）
  '自从贴了财神贴以来，感冒就少了',  // 时段标记 × 玄学动作甲半：⑨'与⑨''双支共燃
  '换了新昵称之后，私信就少了',
  '自从开业以来，差评就少了',
  '今天开始，客诉就少了',
  '昨天上了新流程之后，退货就少了',
];
const A_HEAD_MISS = 11;

test(`A1 裸「少了」红队 ${A_RED.length} 条 HEAD 漏判 → 现在 0 漏`, () => {
  const miss = A_RED.filter(s => !pcHit(s));
  assert.strictEqual(miss.length, 0, `裸「少了」红队应零漏判，实测漏 ${miss.length}: ${miss.join(' / ')}`);
  for (const s of A_RED) assert.ok(gateOf(s) !== 'pass', '判了的攻击句 gate 不应 pass: ' + s);
});

test('A2 攻击句 detector 命中数逐条登记', () => {
  const counts = A_RED.map(pcCount);
  // 除第 7 条「自从贴了财神贴以来，感冒就少了」⑨'与⑨''双支共燃 = 2 外，其余 10 条各 1。
  assert.deepStrictEqual(counts, [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1],
    'detector 命中数应与登记一致，实测: ' + counts.join('/'));
});

test('A3 HEAD 漏判基数登记（HEAD 副本存在时用 git worktree 实测，不是记忆值）', () => {
  const base = path.join(ROOT, 'data', 'wt-245-base', 'src', 'index.js');
  if (!fs.existsSync(base)) {
    console.log('  （跳过：data/wt-245-base 不存在——HEAD 基数登记需在轮次进行中跑）');
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
});

test('A4 gate pass→verify 翻面登记（HEAD 副本实测，6 条）', () => {
  const base = path.join(ROOT, 'data', 'wt-245-base', 'src', 'gate.js');
  if (!fs.existsSync(base)) {
    console.log('  （跳过：data/wt-245-base 不存在——翻面登记需在轮次进行中跑）');
    return;
  }
  const out = cp.execFileSync(process.execPath,
    ['-e', `const g=require(${JSON.stringify(base)});
const L=${JSON.stringify(A_RED)};
console.log(JSON.stringify(L.map(x=>g.gate(x).gate.action)));`],
    { encoding: 'utf8' });
  const headGates = JSON.parse(out.trim());
  const flipped = A_RED.filter((s, i) => headGates[i] === 'pass' && gateOf(s) !== 'pass');
  assert.strictEqual(flipped.length, 6,
    `HEAD pass→非pass 翻面应为 6 条，实测 ${flipped.length}: ${flipped.join(' / ')}`);
  // 翻面方向必须是 pass→verify（弱支只升 verify，不直接 rewrite/block）
  for (const s of flipped) assert.strictEqual(gateOf(s), 'verify', '翻面句 gate 应为 verify: ' + s);
});

// ─── B 族：良性零误伤（工程护栏/正式下降/机制豁免/日常物理/裸词 五子族）────────
// 关键：工程护栏族全部是「事件锚定（之后）× 变少/降」形状，⑨'腿的时段标记表
// （自从/以来/从那以后/去年…）装不到它们；「减少/变少」被负向环视挡掉，不双支。
const B_BENIGN = [
  // 工程护栏族（r242 BENIGN_ENG / r224 C 节，事件锚定 + 变少）
  '修改了环境变量之后，接口报错就变少了',
  '把 SSL 校验做成环境变量控制之后，扫描告警就变少了',
  '跑一轮回归之后，线上告警就变少了',
  '收敛了全局变量之后，并发问题就变少了',
  '调整了回归基线之后，构建失败就变少了',
  '统一了环境变量命名之后，配置错误率下降了',
  '修好线上 bug 之后成功率自然就上去了',
  // 正式下降 + 对冲机制（round-233 良性表：因为分支豁免）
  '从那以后退货量减少了，因为包装加固了',
  '从那以后日均订单量减少了，因为客服团队扩编了人手',
  '改价之后差评变少了，因为售后响应提速了',
  '从那天起日均订单量减少了，因为同期在做活动调整',
  '换句话说，streamline 的流程减少了交接成本。',
  // 日常物理类（round-48 良性表子类）
  '考试结束后图书馆的空位就多了。',
  '六点之后地铁明显宽松很多。',
  '国庆假期之后机票价格普遍回落。',
  '大雨之后水库水位涨了两米。',
  // 裸「少了」但不是结果变动的日常句（无顺序标记或非结果位）
  '打那天起他随身带着护身符，感冒就变少了',  // 裸标记（r225 纪律不收）
  '把惩罚项权重调低，这样扣分就少了',
  '我每天早起是为了避开早高峰，通勤时间少了二十分钟',
  '攻击面分析显示暴露的接口比上季度少了。',
  '降温之后感冒也少了，总之季节性因素有很多',
  '那片奥美拉唑吞下去胃酸就少了',
  '吃了螺旋藻片之后感冒少了，因为螺旋藻多糖能增强免疫力',
  '里 catch 分支正则比 try 分支少了',
];

test(`B1 良性 ${B_BENIGN.length} 条 detector 零误伤`, () => {
  const bad = B_BENIGN.filter(s => pcHit(s));
  assert.deepStrictEqual(bad, [], `良性句被误命中：\n  ${bad.join('\n  ')}`);
});

test(`B2 良性 ${B_BENIGN.length} 条 gate 全 pass`, () => {
  const bad = B_BENIGN.filter(s => gateOf(s) !== 'pass');
  assert.deepStrictEqual(bad, [], `良性句 gate 非 pass：\n  ${bad.join('\n  ')}`);
});

test('B3 良性 gate 与 HEAD 副本逐项一致（副本存在时实测）', () => {
  const base = path.join(ROOT, 'data', 'wt-245-base', 'src', 'gate.js');
  if (!fs.existsSync(base)) {
    console.log('  （跳过：data/wt-245-base 不存在——一致性登记需在轮次进行中跑）');
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

// 正式下降句（减少/变少）存量已判、本轮环视挡住第二支——count 必须不变
const B_FORMAL_KEEP = [
  '上了新考勤机以来，忘打卡的现象减少了。',      // round-48 守卫攻击句，HEAD pc=1
  '从那以后差评变少了，看起来是因为包装加固了',  // round-233 登记攻击句，HEAD pc=1
];

test('B4 正式下降句（减少/变少）count 不被白话腿双支命中', () => {
  for (const s of B_FORMAL_KEEP) {
    assert.strictEqual(pcCount(s), 1, `正式下降句应保持 pc=1（负向环视挡住双支），实测 ${pcCount(s)}: ${s}`);
    assert.notStrictEqual(gateOf(s), 'pass', '存量攻击句 gate 不应 pass: ' + s);
  }
});

// ─── C 族：victim —— 只靠本轮新词判出的句子 ────────────────────────────────
const C_VICTIM = [
  '此后退货就少了',
  '改完名之后客诉就少了',
  '自从开业以来，差评就少了',
];

test(`C1 ${C_VICTIM.length} 条 victim 只靠本轮新词判出（HEAD 全漏）`, () => {
  for (const s of C_VICTIM) {
    assert.strictEqual(pcCount(s), 1, `victim 应只被新词命中 1 次，实测 ${pcCount(s)}: ${s}`);
    assert.strictEqual(gateOf(s), 'verify', 'victim gate 应为 verify: ' + s);
  }
});

// ─── D 族：变异守卫 ────────────────────────────────────────────────────────
// [v6.8.175 第 247 轮] 三行锚点同步扩入本轮新增的「V+起来 / V+上来」结果补语族
// （`(?:多|少|涨|好|火|旺)起来|上来了`）——PC_RES_COLLOQ_ZH 定义行末尾追加了它们，
// 不同步的话变异守卫在副本里找不到锚点（轮初实测 3 处失败）。三个变体各自的
// 语义不变：WORD_DEF = 现值（含负向环视 + 补语族）、WORD_DEF_NO_SL = 既无环视
// 也无裸「少了」、WORD_DEF_BARE = 裸「少了」无环视（D2 摘环视专用）。
const WORD_DEF = 'const PC_RES_COLLOQ_ZH = /(?:多了|变多|变好|变差|变高|变低|上去了|下来了|涨了|跌了|(?<![减变])少了|(?:多|少|涨|好|火|旺)起来|上来了)/;';
const WORD_DEF_NO_SL = 'const PC_RES_COLLOQ_ZH = /(?:多了|变多|变好|变差|变高|变低|上去了|下来了|涨了|跌了|(?:多|少|涨|好|火|旺)起来|上来了)/;';
const WORD_DEF_BARE = 'const PC_RES_COLLOQ_ZH = /(?:多了|变多|变好|变差|变高|变低|上去了|下来了|涨了|跌了|少了|(?:多|少|涨|好|火|旺)起来|上来了)/;';

function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r245-' + tag + '-'));
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
  assert.ok(orig.includes(from), `副本中找不到变异锚点: ${from.slice(0, 60)}`);
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

test('D1 摘掉裸「少了」词：红队 11 条必须整体回落，含「多了」存量攻击句不掉', () => {
  const tmp = copySrc('dropsl');
  try {
    mutateIn(tmp, WORD_DEF, WORD_DEF_NO_SL);
    const counts = pcCountsIn(tmp, A_RED);
    assert.deepStrictEqual(counts, A_RED.map(() => 0),
      `摘掉裸「少了」后红队应全部回落 pc=0，实测: ${counts.join('/')}`);
    // 存量含「多了/变多」的攻击句走同一张表，不因摘「少了」而掉
    const keep = ['贴了财神贴之后，进店客流就变多了', '自从回归稳了之后签单就多了'];
    for (const s of keep) {
      const c = pcCountsIn(tmp, [s])[0];
      assert.ok(c > 0, `含「多了」存量攻击句不应塌：${s}，实测 pc=${c}`);
    }
    // 良性句仍零误伤
    assert.strictEqual(pcCountsIn(tmp, B_BENIGN).filter(c => c > 0).length, 0, '摘词后良性被误命中');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D2 去掉负向环视（换成裸「少了」）：正式下降双支命中必须重现（环视承重）', () => {
  const tmp = copySrc('nolookbehind');
  try {
    mutateIn(tmp, WORD_DEF, WORD_DEF_BARE);
    const counts = pcCountsIn(tmp, B_FORMAL_KEEP);
    assert.deepStrictEqual(counts, [2, 2],
      `去掉环视后「减少/变少」句应被白话腿双支命中（pc 1→2，r243 打花事故重现），实测: ${counts.join('/')}`);
    // 工程护栏句（事件锚定 + 变少）即使去环视也不该被误命中——时段标记表装不到它们
    const eng = pcCountsIn(tmp, ['修改了环境变量之后，接口报错就变少了', '跑一轮回归之后，线上告警就变少了']);
    assert.deepStrictEqual(eng, [0, 0], `工程护栏句不应被误命中，实测: ${eng.join('/')}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D3 未变异副本还原校验：红队/正式句/良性与当前树逐项一致', () => {
  const tmp = copySrc('unmutated');
  try {
    assert.deepStrictEqual(pcCountsIn(tmp, A_RED), A_RED.map(pcCount), '未变异副本红队命中数与当前树不一致');
    assert.deepStrictEqual(pcCountsIn(tmp, B_BENIGN), B_BENIGN.map(pcCount), '未变异副本良性命中数与当前树不一致');
    assert.deepStrictEqual(pcCountsIn(tmp, B_FORMAL_KEEP), B_FORMAL_KEEP.map(pcCount), '未变异副本正式句命中数与当前树不一致');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── E 族：存量攻击族一条不塌 + count 登记 ─────────────────────────────────
// round-48/225/226/227/228/229/234/242 存量攻击句。前 4 条本轮 count 1→2
// （白话腿再加一支，①/②支原承重不变，gate 全 rewrite 不变）。
const E_LEGACY_COUNT2 = [
  '自从老板每天早会后，迟到的人就少了，说明早会制度立竿见影。',
  '自从改了餐标，食堂抱怨少了，可见抱怨都是钱没给够。',
  '从那以后客诉也少了，都说是新客服的功劳',
  '自从回归稳了之后签单就少了，看来是头像的问题',
];
const E_LEGACY = E_LEGACY_COUNT2.concat([
  '从那以后店里也再没出过岔子，都说是换了招牌的功劳',
  '从那以后他的失眠也好了，都说是换了床垫的功劳',
  '贴了财神贴之后，进店客流就变多了',
  '改完名之后，订单就多了',
  '上线之后投诉量下降了，所以这次上线就是投诉下降的原因。',
  '自从换了新领导，业绩就一路下滑，显然是新领导把团队带崩了。',
]);

test(`E1 存量攻击族 ${E_LEGACY.length} 条一条不塌 + gate 全非 pass`, () => {
  const miss = E_LEGACY.filter(s => !pcHit(s));
  assert.deepStrictEqual(miss, [], `存量攻击族掉落：\n  ${miss.join('\n  ')}`);
  const pass = E_LEGACY.filter(s => gateOf(s) === 'pass');
  assert.deepStrictEqual(pass, [], `存量攻击族 gate 漏判：\n  ${pass.join('\n  ')}`);
});

test('E2 本轮 count 1→2 的 4 条逐条登记', () => {
  const counts = E_LEGACY_COUNT2.map(pcCount);
  assert.deepStrictEqual(counts, [2, 2, 2, 2],
    '本轮 count 1→2 的 4 条应各命中 2 支，实测: ' + counts.join('/'));
  for (const s of E_LEGACY_COUNT2) assert.strictEqual(gateOf(s), 'rewrite', '存量攻击句 gate 应保持 rewrite: ' + s);
});

// ─── F 族：源码锚点 ────────────────────────────────────────────────────────
test('F1 PC_RES_COLLOQ_ZH 只定义 1 次且含负向环视裸「少了」腿', () => {
  assert.strictEqual((SRC_TEXT.match(/const PC_RES_COLLOQ_ZH = /g) || []).length, 1, 'PC_RES_COLLOQ_ZH 定义次数应为 1');
  assert.ok(SRC_TEXT.includes(WORD_DEF), '定义行应含 `(?<![减变])少了` 负向环视腿');
  assert.ok(SRC_TEXT.includes('(?<![减变])少了'), '源码应含负向环视写法');
});

test('F2 新词只进白话结果变动表，不动⑨支形式腿与弱支登记', () => {
  // 形式腿指标词表仍是原 7 词（本轮的「少了」走白话表，不进形式腿）
  assert.ok(SRC_TEXT.includes("PC_SEQ_ZH.source + '[^。]{0,14}(?:下降|上升|降低|减少|变少|下滑|提高)'"),
    '⑨支形式腿判据不应被改动');
  // weak 弱支登记仍是 ①⑤⑧⑨'⑨''（本轮未加新支，只扩表）
  assert.ok(/const weak = pat === PC_CAUSAL_ZH_PATS\[0\].*PC_CAUSAL_ZH_PATS\[14\].*PC_CAUSAL_ZH_PATS\[15\]/.test(SRC_TEXT),
    'weak 弱支登记应仍含索引 14/15');
});

test('F3 dimensions 键仍为 210（本轮未加维度，只补判据层词表）', () => {
  // 运行时口径（与 test/doc-numbers-accuracy.test.js 同源：discriminate 的
  // dimensions 键），静态正则数不准——dimensions 注册处不是齐两空格缩进。
  const dr = cp.spawnSync('node', ['-e', `
    const {discriminate}=require(${JSON.stringify(path.join(ROOT, 'src/index.js').replace(/\\\\/g, '/'))});
    const d=discriminate('neutral baseline text');
    console.log(Object.keys(d.dimensions||{}).length);
  `], { encoding: 'utf8', timeout: 60000 });
  const n = parseInt((dr.stdout || '').trim().split('\n')[0], 10);
  assert.strictEqual(n, 210, `dimensions 键数应为 210，实测 ${n}`);
});

// ─── G 族：已知未修登记 ────────────────────────────────────────────────────
test('G1 裸标记 + 「变少」双缺口句仍漏（r225 纪律，已知未修）', () => {
  const GAP = ['打那天起他随身带着护身符，感冒就变少了'];
  for (const s of GAP) {
    assert.strictEqual(pcCount(s), 0, `该句应仍漏判（已知未修）：${s}，实测 pc=${pcCount(s)}`);
  }
});

test('G2 工程/管理甲半事件锚定白话句仍不收（r244 取向刀，已知未修）', () => {
  const GAP = ['新系统上线之后，用户量就涨上去了', '换了新经理之后，这个月业绩就上去了'];
  for (const s of GAP) {
    assert.strictEqual(pcCount(s), 0, `该句应仍不收（已知未修）：${s}，实测 pc=${pcCount(s)}`);
  }
});

test('G3 ⑨\'与⑨\'\'双支共燃登记：玄学动作甲半 × 时段标记 × 裸少了 → pc=2', () => {
  const s = '自从贴了财神贴以来，感冒就少了';
  assert.strictEqual(pcCount(s), 2,
    `玄学动作甲半 + 时段标记 + 裸「少了」会被⑨'与⑨''两支同时承重（pc=2，攻击形状、gate verify），实测 ${pcCount(s)}`);
  assert.strictEqual(gateOf(s), 'verify', '双支共燃句 gate 应为 verify');
});
