// r248 守卫：第⑭支结果表 PC_RESJOIN_ZH 接入结果补语族 + 白话「变多/变少」
// （结果补语族抽成共享常量 PC_RES_COMPLEMENT_ZH，v6.8.176）——修 r247 交接簿
// 候选池① / r247 G2 登记的⑭支结果表缺口。
// **取向刀（第二十一条，本轮裁）**：第⑭支只收「度量/状态类 V+起来」结果补语族
// （多/少/涨/好/火/旺 + 起来，与 r247 第二十条刀同族同源）与白话「变多/变少」，
// **不收裸「少了」**——轮初变体实测（scripts/tmp-248-collide2.js，96037 条全仓
// 语料）：裸「少了」会造真良性假阳性「我每天早起是为了避开早高峰，通勤时间少了
// 二十分钟」（早起 ∈ PC_NOOBJ_ZH × 真实机制句），而「变多/变少」两条白话腿零良性
// 命中。r247 第二十条刀的其余各侧（不收裸「起来了」、不收天气/物理类与人的状态类
// 补语）原样继承，见 B 族。
// 轮初矩阵实测（scripts/tmp-248-probe3.js，19 甲半 × 23 结果 × 5 形状 = 2185 条
// 组合句）：HEAD 漏判 **901 条（41.2%）**，且整族只有补语形漏——同句的「订单明显
// 多了」HEAD 早已 pc=1/verify。根因是**表间不一致**：补语族只写在白话结果变动表
// PC_RES_COLLOQ_ZH 里，⑭支的结果表没同步（r238「跨表一致性」纪律）。
// 全仓 A/B 实测（scripts/tmp-248-ab.js，96037 条中文 quoted 样本，HEAD worktree
// 副本 data/wt-248-base）：checkPseudoCausal count 差异 24 条全升零降；gate.action
// 差异 5 条全 pass→verify 且全是攻击形状/文档引用句——存量良性零翻面。
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
  console.log(`\nround-248-resjoin-result-complement: ${p} 通过, ${f} 失败, 共 ${RESULTS.length} 个`);
});
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');
const assert = require('assert');
const idx = require('../src/index.js');
const gate = require('../src/gate.js').gate;

const ROOT = path.join(__dirname, '..');
const SRC_TEXT = fs.readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
// HEAD worktree 副本（轮次进行中由 git worktree add 建立，轮末删）——HEAD 基数
// 全部实测，不是记忆值。
const BASE = path.join(ROOT, 'data', 'wt-248-base');

const pcCount = s => idx.checkPseudoCausal(s).count;
const pcHit = s => pcCount(s) > 0;
const gateOf = s => gate(s).gate.action;

// ─── A 族：红队（⑭支 × 结果补语族 + 白话变多变少）──────────────────────
// 甲半全部是 PC_NOOBJ_ZH 成员（玄学对象），三个形状都不带时段框架标记
// （自从/以来/从那以后）也不带事件锚定标记（之后/结束后），所以⑨'/⑨''两条弱支
// 都够不着；甲半也不是 PC_EVENT_ACT_ZH 的玄学动作。HEAD 唯一够得着的结果词是
// 裸「涨」（`涨了?` 的「了」可选）——故「业绩就涨起来了」30 条在 HEAD 已判，
// 其余 270 条 HEAD 全漏、gate 全 pass。
const A_OBJ = ['幸运色袜子', '财神贴', '护身符', '新昵称', '头像', '招财壁纸', '红袜子', '风水摆件', '转运珠', '星座运势'];
const A_RES = ['订单明显多起来了', '订单就多起来了', '生意就火起来了', '店里就旺起来了', '业绩就涨起来了', '客诉就少起来了', '订单就变多了', '客流就变多了', '咨询就变少了', '差评就变少了'];
const A_SHAPE = [
  (o, r) => `商店上架了${o}，所以${r}`,
  (o, r) => `我换了${o}，所以${r}`,
  (o, r) => `${o}真的有用，总之${r}`,
];
const A_RED = [];
for (const o of A_OBJ) for (const r of A_RES) for (const s of A_SHAPE) A_RED.push(s(o, r));
const A_HEAD_MISS = 270;   // HEAD 副本实测（A3 用 worktree 复核）
const A_HEAD_FLIP = 270;   // HEAD gate=pass 且现在非 pass 的条数（A2 复核）

test(`A1 红队 ${A_RED.length} 条：HEAD 漏 ${A_HEAD_MISS} → 现在 0 漏`, () => {
  const miss = A_RED.filter(s => !pcHit(s));
  assert.strictEqual(miss.length, 0, `红队应零漏判，实测漏 ${miss.length}: ${miss.slice(0, 3).join(' / ')}`);
  for (const s of A_RED) assert.notStrictEqual(gateOf(s), 'pass', '判了的攻击句 gate 不应 pass: ' + s);
});

test(`A2 红队 gate 翻面登记（${A_HEAD_FLIP} 条 pass→verify，${A_RED.length} 条现值全 verify）`, () => {
  // 现值：300 条全 verify（含 HEAD 已判的 30 条「涨起来了」——HEAD 对它们已是 verify）
  const nowVerify = A_RED.filter(s => gateOf(s) === 'verify');
  assert.strictEqual(nowVerify.length, A_RED.length,
    `应有 ${A_RED.length} 条 gate=verify，实测 ${nowVerify.length}`);
  // 翻面：HEAD gate=pass 且现在非 pass 的条数（A2b 用 HEAD 副本实测）
  const bGate = path.join(BASE, 'src', 'gate.js');
  if (!fs.existsSync(bGate)) {
    console.log('  （跳过翻面基数：data/wt-248-base 不存在）');
    return;
  }
  const out = cp.execFileSync(process.execPath,
    ['-e', `const g=require(${JSON.stringify(bGate)});const G=g.gate||g;
console.log(JSON.stringify(${JSON.stringify(A_RED)}.map(x=>G(x).gate.action)));`],
    { encoding: 'utf8' });
  const headGates = JSON.parse(out.trim());
  const flips = A_RED.filter((s, i) => headGates[i] === 'pass' && gateOf(s) !== 'pass');
  assert.strictEqual(flips.length, A_HEAD_FLIP,
    `应有 ${A_HEAD_FLIP} 条 pass→非pass 翻面，实测 ${flips.length}`);
  for (const g of headGates) assert.ok(g === 'pass' || g === 'verify', 'HEAD 对红队只应 pass/verify');
});

test('A3 HEAD 漏判基数登记（git worktree 副本实测，不是记忆值）', () => {
  const base = path.join(BASE, 'src', 'index.js');
  if (!fs.existsSync(base)) {
    console.log('  （跳过：data/wt-248-base 不存在——HEAD 基数登记需在轮次进行中跑）');
    return;
  }
  const out = cp.execFileSync(process.execPath,
    ['-e', `const m=require(${JSON.stringify(base)});
console.log(JSON.stringify(${JSON.stringify(A_RED)}.map(x=>m.checkPseudoCausal(x).count)));`],
    { encoding: 'utf8' });
  const headCounts = JSON.parse(out.trim());
  const miss = headCounts.filter(c => c === 0).length;
  assert.strictEqual(miss, A_HEAD_MISS, `HEAD 副本实测漏判数应为 ${A_HEAD_MISS}，实测 ${miss}`);
  // HEAD 已判的 30 条必须全部是「业绩就涨起来了」——裸「涨」被 `涨了?` 的
  // 「了」可选意外覆盖，证明缺口单边在补语族其余词形，不在判据形状。
  const headHit = A_RED.filter((s, i) => headCounts[i] > 0);
  assert.strictEqual(headHit.length, A_RED.length - A_HEAD_MISS, 'HEAD 已判条数应对上');
  for (const s of headHit) assert.ok(s.endsWith('业绩就涨起来了'), `HEAD 已判句应全是「涨起来了」形: ${s}`);
  // 当前树对这 30 条也必须是 pc≥1（不能因重构回落）
  for (const s of headHit) assert.ok(pcCount(s) >= 1, `HEAD 已判句当前树不应回落: ${s}`);
});

// ─── B 族：良性零误伤（七子族）──────────────────────────────────────────
const B_BENIGN = [
  // ① 工程/管理动作 × 补语族（甲半不是玄学对象，⑭/⑮ 两支都够不着）
  '商店上架了新款手机壳，所以订单明显多起来了',
  '商店换了收银系统，所以订单明显多起来了',
  '商店延长了营业时间，所以订单明显多起来了',
  '团队换了排班表，所以人效就变多了',
  '运营改了推送文案，所以打开率就变多了',
  '工厂换了新模具，所以良品率就变多了',
  // ② 天气/物理/人的状态补语族（r247 第二十条刀，刻意不收）
  '入秋以来，早晚就凉起来了',
  '入冬以来，气温就冷起来了',
  '入夏以来，用电负荷就高起来了',
  '项目上线以来，系统就稳起来了',
  '开学以来，孩子就忙起来了',
  '自从学会复盘以来，团队就强起来了',
  // ③ 裸「起来了」/「下去了」（r247 刀：语料 18+7 条全是方向补语）
  '他把钱藏起来了',
  '把架子支起来了',
  '我撑不下去了，先撤',
  '这篇文章写不下去了',
  '通知已经传达下去了',
  // ④ 早起 × 裸「少了」（本轮第二十一条刀：不收裸少了）
  '我每天早起是为了避开早高峰，通勤时间少了二十分钟',
  '坚持早起之后，通勤时间少了二十分钟',
  '把惩罚项权重调低，这样扣分就少了',
  '攻击面分析显示暴露的接口比上季度少了。',
  '里 catch 分支正则比 try 分支少了',
  // ⑤ 未收词形（变好/变高/跌了/裸「起来了」不进⑭支结果表）
  '商店上架了幸运色袜子，所以订单明显变好了',
  '商店上架了幸运色袜子，所以订单明显变高了',
  '商店上架了幸运色袜子，所以差评就跌了',
  '商店上架了幸运色袜子，所以客流明显起来了',
  // ⑥ 自然现象豁免（PC_NOSUPERSTITION_ZH）
  '大雨之后水库水位涨了起来',
  // ⑦ 机制/统计/资金依据在场（两道机制护栏）
  '全靠这个风水摆件，今年业绩翻倍了，因为前期做了充分压测',
  '商店上架了幸运色袜子，所以订单明显多起来了，主要是新渠道拓展的功劳',
];

test(`B1 良性 ${B_BENIGN.length} 条 detector 零误伤`, () => {
  const bad = B_BENIGN.filter(s => pcHit(s));
  assert.deepStrictEqual(bad, [], `良性句被误命中：\n  ${bad.join('\n  ')}`);
});

test(`B2 良性 ${B_BENIGN.length} 条 gate 全 pass`, () => {
  const bad = B_BENIGN.filter(s => gateOf(s) !== 'pass');
  assert.deepStrictEqual(bad, [], `良性句 gate 非 pass：\n  ${bad.join('\n  ')}`);
});

test(`B3 良性 ${B_BENIGN.length} 条与 HEAD 副本逐项一致（pc 与 gate）`, () => {
  const bIdx = path.join(BASE, 'src', 'index.js');
  const bGate = path.join(BASE, 'src', 'gate.js');
  if (!fs.existsSync(bIdx)) {
    console.log('  （跳过：data/wt-248-base 不存在）');
    return;
  }
  const out = cp.execFileSync(process.execPath,
    ['-e', `const m=require(${JSON.stringify(bIdx)});const g=require(${JSON.stringify(bGate)});const G=g.gate||g;
console.log(JSON.stringify(${JSON.stringify(B_BENIGN)}.map(x=>[m.checkPseudoCausal(x).count,G(x).gate.action])));`],
    { encoding: 'utf8' });
  const head = JSON.parse(out.trim());
  const diff = B_BENIGN.filter((s, i) => head[i][0] !== pcCount(s) || head[i][1] !== gateOf(s));
  assert.deepStrictEqual(diff, [], `以下良性句与 HEAD 副本不一致：\n  ${diff.join('\n  ')}`);
});

// 存量即被其他维度判非 pass 的良性句（HEAD 同判）——按 r226/r244 纪律单独登记，
// 不混进「gate 必须 pass」的断言。pseudo_causal 实测 0 命中。
const B_GATE_NONPASS = [
  ['文件被锁起来了', 'verify'],
  ['下雨之后水库水位就涨起来了，说明是降雨补给了库容', 'rewrite'],
];
// 两条 HEAD 起就是 pc=1 的存量句（⑭支原表「上去了」/白话表「变少」承重）——
// 本轮只把⑭支结果表对齐，未改它们。单独登记。
const B_LEGACY_PC1 = [
  ['降温之后感冒也变少了，总之季节性因素有很多', 'verify', 1],
  ['换了头像，所以业绩指标也上去了，数据是排期表排出来的', 'block', 1],
];

test(`B4 存量非 pass 登记项 ${B_GATE_NONPASS.length} 条现值照登（HEAD 同判，非本轮引入）`, () => {
  for (const [s, act] of B_GATE_NONPASS) {
    assert.strictEqual(gateOf(s), act, `登记项 gate 应仍为 ${act}: ${s}`);
    assert.strictEqual(pcCount(s), 0, `登记项 pseudo_causal 应零命中: ${s}`);
  }
});

test(`B5 存量 pc=1 登记项 ${B_LEGACY_PC1.length} 条现值照登（HEAD 起即 verify，非本轮引入）`, () => {
  for (const [s, act, pc] of B_LEGACY_PC1) {
    assert.strictEqual(gateOf(s), act, `登记项 gate 应仍为 ${act}: ${s}`);
    assert.strictEqual(pcCount(s), pc, `登记项 pseudo_causal 应为 ${pc} 命中: ${s}`);
  }
});

// ─── C 族：victim —— 只靠本轮新词判出的句子（摘掉共享常量必须回落）──────
const C_VICTIM = [
  '商店上架了幸运色袜子，所以订单明显多起来了',   // r247 G2 / r248 候选①
  '根据我改了昵称的说法，总之现在订单多起来了',   // r247 G2 / r248 候选①
  '抽奖之后参与人数就变多了',                     // r244 B 族移入
  '打那天起他随身带着护身符，感冒就变少了',       // r243 G1 / r244 G2 / r245 G1 三代挂账
];

test(`C1 ${C_VICTIM.length} 条 victim 本轮起判出（HEAD 全漏）`, () => {
  for (const s of C_VICTIM) {
    assert.ok(pcCount(s) >= 1, `victim 本轮应判出，实测 pc=${pcCount(s)}: ${s}`);
    assert.strictEqual(gateOf(s), 'verify', 'victim gate 应为 verify: ' + s);
  }
});

// ─── D 族：变异守卫 ────────────────────────────────────────────────────────
const D_COMP_DEF = 'const PC_RES_COMPLEMENT_ZH = /(?:多|少|涨|好|火|旺)起来|上来了/;';
const D_VERBS = '(?:多|少|涨|好|火|旺)起来';
const D_SHANGLAI = '起来|上来了/;';
const D_BIAN = "'|变多|变少)');";

function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r248-' + tag + '-'));
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
console.log(JSON.stringify(${JSON.stringify(list)}.map(x=>idx.checkPseudoCausal(x).count)));`],
    { encoding: 'utf8' });
  return JSON.parse(out.trim());
}

test('D1 摘掉整个结果补语族（共享常量置恒假）：红队 300 条必须整体回落', () => {
  const tmp = copySrc('family');
  try {
    mutateIn(tmp, D_COMP_DEF, 'const PC_RES_COMPLEMENT_ZH = /(?!x)x/;');
    const counts = pcCountsIn(tmp, A_RED);
    const by = (pred) => A_RED.map((s, i) => [s, counts[i]]).filter(([s]) => pred(s));
    // ① 「起来」族里除「涨起来」外必须全部回落（多起来/火起来/旺起来/少起来）
    const qilai = by(s => s.includes('起来') && !s.endsWith('涨起来了'));
    assert.strictEqual(qilai.length, 150, `「起来」族（除涨起来）应有 150 条，实测 ${qilai.length}`);
    assert.strictEqual(qilai.filter(([, c]) => c === 0).length, qilai.length,
      `摘掉补语族后「起来」句应全部回落，实测: ${qilai.map(([, c]) => c).join('/')}`);
    // ② 「涨起来」30 条不许掉——它们的承重腿是⑭支表里原有的 `涨了?`（「了」可选），
    //    与共享常量无关。这是本轮新实测的发现：HEAD 对「涨起来了」早已判，
    //    缺口单边在补语族其余词形，不在判据形状。
    const zhang = by(s => s.endsWith('涨起来了'));
    assert.strictEqual(zhang.length, 30, `「涨起来」句应有 30 条，实测 ${zhang.length}`);
    assert.ok(zhang.every(([, c]) => c > 0),
      '「涨起来」句不应回落（`涨了?` 独立承重）: ' + zhang.filter(([, c]) => c === 0).map(([s]) => s).join(' / '));
    // ③ 「变多/变少」120 条也不掉——它们是 PC_RESJOIN_ZH 里的字面词，不属于共享常量
    const bian = by(s => s.endsWith('就变多了') || s.endsWith('就变少了'));
    assert.strictEqual(bian.length, 120, `「变多/变少」句应有 120 条，实测 ${bian.length}`);
    assert.ok(bian.every(([, c]) => c > 0),
      `「变多/变少」句不应回落（字面词独立承重）: ${bian.filter(([, c]) => c === 0).map(([s]) => s).join(' / ')}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D2 只摘「起来」动词表：「起来」句回落而「变多变少」句不掉', () => {
  const tmp = copySrc('verbs');
  try {
    mutateIn(tmp, D_VERBS, '(?!x)x');
    const counts = pcCountsIn(tmp, A_RED);
    const by = (pred) => A_RED.map((s, i) => [s, counts[i]]).filter(([s]) => pred(s));
    // 「变多/变少」句（无「起来」形）不应回落
    const bian = by(s => s.endsWith('就变多了') || s.endsWith('就变少了'));
    assert.strictEqual(bian.length, 120, `「变多/变少」句应有 120 条，实测 ${bian.length}`);
    assert.ok(bian.every(([, c]) => c > 0), `「变多/变少」句不应回落: ${bian.filter(([, c]) => c === 0).map(([s]) => s).join(' / ')}`);
    // 「起来」句里除「涨起来」（`涨了?` 独立承重）外应全部回落
    const qilai = by(s => s.includes('起来') && !s.endsWith('涨起来了'));
    assert.strictEqual(qilai.filter(([, c]) => c === 0).length, qilai.length,
      `「起来」句应全部回落，实测: ${qilai.map(([, c]) => c).join('/')}`);
    const zhang = by(s => s.endsWith('涨起来了'));
    assert.ok(zhang.every(([, c]) => c > 0), '「涨起来」句不应回落（`涨了?` 独立承重）');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D3 只摘「上来了」：「上来了」相关回落而「起来/变多变少」句不掉', () => {
  const tmp = copySrc('shanglai');
  try {
    mutateIn(tmp, D_SHANGLAI, '起来/;');
    const counts = pcCountsIn(tmp, A_RED);
    // A_RED 里没有「上来了」形句子，故摘它不应让任何红队回落（⑭支表内原有的
    // 「上来了」也一并摘掉，但本族句子不依赖它）
    assert.strictEqual(counts.filter(c => c === 0).length, 0,
      `摘「上来了」后红队不应回落，实测: ${counts.join('/')}`);
    // 摘「上来了」后含「上来了」的存量攻击句必须回落（证明锚点真的摘到了它）
    const legacy = pcCountsIn(tmp, ['去年改了版之后流水就上来了', '自从戴了护身符，孩子成绩就上去了']);
    assert.ok(legacy[0] === 0, `「流水就上来了」应回落，实测 pc=${legacy[0]}`);
    assert.ok(legacy[1] > 0, `「成绩就上去了」不应回落（上去了是另一个词形），实测 pc=${legacy[1]}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D4 只摘白话「变多/变少」：白话腿回落而补语族不掉', () => {
  const tmp = copySrc('bian');
  try {
    mutateIn(tmp, D_BIAN, "')');");
    const counts = pcCountsIn(tmp, A_RED);
    const bian = A_RED.map((s, i) => [s, counts[i]]).filter(([s]) => s.endsWith('就变多了') || s.endsWith('就变少了'));
    assert.strictEqual(bian.filter(([, c]) => c === 0).length, bian.length,
      `摘掉白话腿后「变多/变少」句应全部回落，实测: ${bian.map(([, c]) => c).join('/')}`);
    const qilai = A_RED.map((s, i) => [s, counts[i]]).filter(([s]) => s.includes('起来'));
    assert.strictEqual(qilai.filter(([, c]) => c === 0).length, 0,
      `摘掉白话腿后「起来」句不应回落，实测: ${qilai.map(([, c]) => c).join('/')}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D5 未变异副本还原校验：红队/良性与当前树逐项一致', () => {
  const tmp = copySrc('restore');
  try {
    const all = A_RED.concat(B_BENIGN);
    assert.deepStrictEqual(pcCountsIn(tmp, all), all.map(pcCount), '未变异副本应与当前树逐项一致');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── E 族：存量攻击族一条不塌 + count 登记 ──────────────────────────────
const E_LEGACY = [
  '换了头像，所以业绩指标也上去了',                       // r239 位置化族
  '全靠穿了红袜子，所以签单也多了，数据也稳了',           // r239 红队
  '拜了财神之后就签单了',                                 // ⑭支存量
  '昨天拜了财神，今天就签单了',                           // ⑭支存量
  '他戴上幸运手环后比赛就赢了',                           // ⑭支存量
  '贴了财神贴之后，进店客流就变多了',                     // r244
  '自从请了风水师，回款就变多了',                         // r243
  '换了这个头像之后咨询也变多了，显然是头像带来了好运',   // r232
  '去庙里开了光之后，营业额就变多了',                     // r244
  '上香之后，进店的客人就变多了',                         // r244
];

test(`E1 存量攻击族 ${E_LEGACY.length} 条一条不塌`, () => {
  const miss = E_LEGACY.filter(s => !pcHit(s));
  assert.deepStrictEqual(miss, [], `以下存量攻击句塌陷：\n  ${miss.join('\n  ')}`);
});

test(`E2 存量攻击族 gate 全非 pass`, () => {
  const pass = E_LEGACY.filter(s => gateOf(s) === 'pass');
  assert.deepStrictEqual(pass, [], `以下存量攻击句 gate 回落成 pass：\n  ${pass.join('\n  ')}`);
});

// 本轮 count 上升的存量句逐条登记（pc 1→2 或 2→3，gate 一律不变）
const E_COUNT_UP = [
  ['换了这个头像之后咨询也变多了，显然是头像带来了好运', 2, 3, 'rewrite'],
  ['自从请了风水师，回款就变多了', 1, 2, 'verify'],
  ['去年开始转发抽奖微博，客户就变多了', 1, 2, 'verify'],
  ['贴了财神贴之后，进店客流就变多了', 1, 2, 'verify'],
  ['那天换了头像之后，咨询就变多了', 1, 2, 'verify'],
  ['去庙里开了光之后，营业额就变多了', 1, 3, 'verify'],
  ['换了新昵称之后，私信就变多了', 1, 2, 'verify'],
  ['拜了财神之后，到店人数就变多了', 1, 3, 'verify'],
  ['换上招财壁纸之后，询单就变多了', 1, 2, 'verify'],
  ['换个新头像之后，订单就变多了', 1, 2, 'verify'],
  ['上香之后，进店的客人就变多了', 1, 2, 'verify'],
  ['自从请了财神以来，进店客流就多起来了', 2, 3, 'verify'],
  ['自从换了头像以来，咨询就多起来了', 2, 3, 'verify'],
  ['自从供了财神以来，生意就旺起来了', 2, 3, 'verify'],
  ['自从请了财神爷，店里就旺起来了', 1, 2, 'verify'],
  ['自从上架了幸运色袜子，订单就火起来了', 1, 2, 'verify'],
];

test(`E3 本轮 count 上升的 ${E_COUNT_UP.length} 条逐条登记（现值 + gate 不变）`, () => {
  for (const [s, , now, act] of E_COUNT_UP) {
    assert.strictEqual(pcCount(s), now, `现值应为 pc=${now}: ${s}，实测 ${pcCount(s)}`);
    assert.strictEqual(gateOf(s), act, `gate 应保持 ${act}: ${s}，实测 ${gateOf(s)}`);
  }
});

test('E4 全仓 A/B 差异清单条数登记（24 条全升零降，scripts/tmp-248-ab.js）', () => {
  // 轮次进行中实测：96037 条样本 count 差异 24 条（升 24 / 降 0）、gate.action
  // 差异 5 条全 pass→verify。这里只做清单长度与方向的静态登记锚点。
  const abFile = path.join(ROOT, 'scripts', 'tmp-248-ab.json');
  if (!fs.existsSync(abFile)) {
    console.log('  （跳过：scripts/tmp-248-ab.json 不存在——A/B 结果需在轮次进行中跑）');
    return;
  }
  const ab = JSON.parse(fs.readFileSync(abFile, 'utf8'));
  assert.strictEqual(ab.total, 96037, `语料条数应为 96037，实测 ${ab.total}`);
  assert.strictEqual(ab.diffs.length, 24, `count 差异应为 24 条，实测 ${ab.diffs.length}`);
  assert.strictEqual(ab.diffs.filter(d => d.cc < d.cb).length, 0, '不允许有 count 下降');
  assert.strictEqual(ab.gateDiffs.length, 5, `gate.action 差异应为 5 条，实测 ${ab.gateDiffs.length}`);
  for (const d of ab.gateDiffs) {
    assert.strictEqual(d.from, 'pass', 'gate 差异只允许 pass 起跳');
    assert.strictEqual(d.to, 'verify', 'gate 差异只允许到 verify');
  }
});

// ─── F 族：源码锚点 ────────────────────────────────────────────────────────
test('F1 共享常量只定义 1 次且排在两张表之前（const TDZ 铁律）', () => {
  assert.strictEqual((SRC_TEXT.match(/const PC_RES_COMPLEMENT_ZH = /g) || []).length, 1,
    'PC_RES_COMPLEMENT_ZH 定义次数应为 1');
  const iComp = SRC_TEXT.indexOf('const PC_RES_COMPLEMENT_ZH = ');
  const iJoin = SRC_TEXT.indexOf('const PC_RESJOIN_ZH = new RegExp(');
  const iColloq = SRC_TEXT.indexOf('const PC_RES_COLLOQ_ZH = new RegExp(');
  assert.ok(iComp > 0 && iComp < iJoin, '共享常量必须排在 PC_RESJOIN_ZH 之前');
  assert.ok(iComp > 0 && iComp < iColloq, '共享常量必须排在 PC_RES_COLLOQ_ZH 之前');
});

test('F2 两张表都用 .source 拼共享常量（不另抄一份词形）', () => {
  assert.ok(SRC_TEXT.includes("const PC_RESJOIN_ZH = new RegExp('(?:中奖|"),
    'PC_RESJOIN_ZH 应为 new RegExp 拼接形态');
  assert.ok(SRC_TEXT.includes("' + PC_RES_COMPLEMENT_ZH.source + '|变多|变少)');"),
    'PC_RESJOIN_ZH 应拼共享常量 + 白话「变多/变少」');
  assert.ok(SRC_TEXT.includes("const PC_RES_COLLOQ_ZH = new RegExp('(?:多了|变多|变好|变差|变高|变低|上去了|下来了|涨了|跌了|(?<![减变])少了|' + PC_RES_COMPLEMENT_ZH.source + ')');"),
    'PC_RES_COLLOQ_ZH 应拼共享常量（重构后行为不变）');
  // 白话「变多」两表都有（跨表一致性）；「变少」只在⑭支表（白话表的负向形是
  // 环视裸「少了」，r245 纪律）
  assert.ok(/(?<![减变])少了/.test(SRC_TEXT), '白话表的负向环视腿应仍在');
});

test('F3 PC_CAUSAL_ZH_PATS 数组长度不变（仍 16 支，本轮只扩表不加支）', () => {
  const m = SRC_TEXT.match(/const PC_CAUSAL_ZH_PATS = \[([\s\S]*?)\n\];/);
  assert.ok(m, '找不到 PC_CAUSAL_ZH_PATS 数组');
  // 支腿计数口径：每条腿都以「两空格缩进 + new RegExp( 或正则字面量 /」起行
  // （跨行的腿只在首行计入一次）。数组里不得新增/删除腿。
  const legs = m[1].split('\n').filter(l => /^\s{2}(?:new RegExp\(|\/(?!\/))/.test(l));
  assert.strictEqual(legs.length, 16, `支腿数应为 16，实测 ${legs.length}`);
  // ⑭支判据行逐字未动（本轮只改它引用的结果表）
  assert.ok(SRC_TEXT.includes("new RegExp(PC_NOOBJ_ZH.source + '[^。]{0,44}?' + PC_RESJOIN_ZH.source),"),
    '⑭支判据行应逐字未动');
  // weak 弱支登记仍是 ①⑤⑧⑨⑨'⑨''（本轮未加新支）
  assert.ok(/const weak = pat === PC_CAUSAL_ZH_PATS\[0\].*PC_CAUSAL_ZH_PATS\[14\].*PC_CAUSAL_ZH_PATS\[15\]/.test(SRC_TEXT),
    'weak 弱支登记应仍含索引 14/15');
});

test('F4 dimensions 键 210 不变（本轮未加维度，只扩结果表）', () => {
  const dr = cp.spawnSync('node', ['-e', `
    const {discriminate}=require(${JSON.stringify(path.join(ROOT, 'src/index.js').replace(/\\\\/g, '/'))});
    const d=discriminate('neutral baseline text');
    console.log(Object.keys(d.dimensions||{}).length);
  `], { encoding: 'utf8', timeout: 60000 });
  const n = parseInt((dr.stdout || '').trim().split('\n')[0], 10);
  assert.strictEqual(n, 210, `dimensions 键数应为 210，实测 ${n}`);
});

// ─── G 族：已知未修登记 ────────────────────────────────────────────────────
test('G1 工程/管理甲半 × 白话结果仍不收（r244 第十七条刀，连续五轮挂账）', () => {
  const GAP = [
    '新系统上线之后，用户量就涨上去了',
    '换了新经理之后，这个月业绩就上去了',
    '改完参数之后成功率就变高了',
  ];
  for (const s of GAP) {
    assert.strictEqual(pcCount(s), 0, `工程实况句应仍漏判（已知未修）：${s}，实测 pc=${pcCount(s)}`);
  }
});

test('G2 天气/物理/人的状态 × 白话结果仍不收（r247 第二十条刀）', () => {
  const GAP = [
    '入秋以来，早晚就凉起来了',
    '入冬以来，气温就冷起来了',
    '项目上线以来，系统就稳起来了',
    '开学以来，孩子就忙起来了',
  ];
  for (const s of GAP) {
    assert.strictEqual(pcCount(s), 0, `天气/物理/状态补语不应收: ${s}，实测 pc=${pcCount(s)}`);
  }
});

test('G3 裸「起来了」/裸「少了」仍不收（r247 第二十条 + 本轮第二十一条刀）', () => {
  const GAP = [
    '他把钱藏起来了',
    '把架子支起来了',
    '我撑不下去了，先撤',
    '我每天早起是为了避开早高峰，通勤时间少了二十分钟',
    '把惩罚项权重调低，这样扣分就少了',
  ];
  for (const s of GAP) {
    assert.strictEqual(pcCount(s), 0, `裸补语/裸「少了」不应收: ${s}，实测 pc=${pcCount(s)}`);
  }
});
