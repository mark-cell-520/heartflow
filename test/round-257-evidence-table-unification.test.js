// test/round-257-evidence-table-unification.js
// 第 257 轮守卫：依据豁免层跨表统一
//   （PC_SUPP_MECH_ZH 与 PC_DRUG_MECH_ZH 的「真实依据/替代解释」词表收敛成
//     单一词源 PC_EVIDENCE_WORDS，两张表从同一份数组生成）
//
// 缺口实测（scripts/tmp-257-probe.js，轮末已删）：
//   ① DRUG 表 75 词 / SUPP 表 18 词仅 13 词重合——「说明书/药师/文献/同行评审/
//      实验数据」五个依据词只在 SUPP 表，十六轮各按最小改动各补各的，词集已漂移；
//   ② 后果是**同族不同表的不一致**：同一句依据句换甲半就翻面——
//      「这服药喝下去病就好了，同行评审都没通过这个结论」服药族 pc=1（误判），
//      而同形「吃了这个保健品之后失眠就好了，同行评审都没通过这个结论」
//      保健品族 pc=0（正确豁免）；
//   ③ 全仓 210900 条语料里含这 5 个词的 68 条样本 pc>0 的 **0 条**——与 r239
//      在 26314 条上的结论一致：**存量零行为变化**。按 r256 的方法论，这只能
//      证明「存量不翻车」，不能证明缺口不存在；缺口由上面的红队坐实。
//
// 取向刀（本轮裁）：
//   **只统一依据层，不动点名真药层。** 依据层（临床/双盲/随机/…/孤例）是两个
//   族共有的语义；点名真药层（布洛芬/安眠药/医嘱…）是 r227 甲半那把刀
//   （「未点名才判」）的精度侧，混进依据层会让保健品族被药物名豁免，那是
//   另一个行为变化，需另轮另裁。
//
// 本测试锁定七件事：
//   ① 5 条红队在 HEAD 各判 1 条、现值 0 条（跨表不统一的假阳性被消除）
//   ② 依据良性零误伤 + 存量点名真药族不塌
//   ③ 变异守卫：摘掉 5 个依据词后 5 条红队必须全部翻面（证明它们真承重，
//      不是不留死代码的空补）
//   ④ 逐词承重：每条红队句的依据词只有它一个（摘任一词即该句翻面）
//   ⑤ 单一词源锚点：两张表同一份数组、drift.unified=true、SUPP 表零增零减
//   ⑥ 新公开方法 evidenceExemptionTrace 的九段形状与四张表在场情况
//   ⑦ 约定 3 三处接线 + 不进 WRITE_TOOLS + checkPseudoCausal 热路径无回归

const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const idx = require(path.join(ROOT, 'src/index.js'));
const gateMod = require(path.join(ROOT, 'src/gate.js'));
const SRC = path.join(ROOT, 'src/index.js');

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); console.log('  ✅ ' + name); pass++; }
  catch (e) { console.log('  ❌ ' + name + '\n     ' + e.message); fail++; }
}

// ─── 语料 ───────────────────────────────────────────────────────────────
// 五条红队：甲半走 PC_INVTAKE_ZH（倒装服药族），乙半走 PC_TAKE_RES_ZH，
// 依据词放在句尾独立子句，与 r230 那两条良性句同构（说话者自己声明证据不足）。
// 每条**只含它自己那一个依据词**，不含任何其他依据词、也不含点名真药名词
// ——否则整句会被别的词豁免，摘掉该词也不翻面，变异守卫恒真。
const RED = [
  ['药师', '这服药喝下去病就好了，药师讲这是心理作用'],
  ['说明书', '这盒药吃下去烧就退了，说明书上没写能治这个'],
  ['文献', '这盒药吃下去烧就退了，文献查不到依据'],
  ['同行评审', '这服药喝下去病就好了，同行评审都没通过这个结论'],
  ['实验数据', '这片药吞下去人就睡着了，实验数据说没差别'],
];

// 依据良性：依据词**已在两表共有**的句子，本轮不许翻面。
// BENIGN_SHAPED = 甲半乙半都在场的子集。C2 变异守卫只对形状在场的句子有意义：
// 「遵医嘱服药之后血压就稳了」没有 PC_INVTAKE_ZH 甲半（甲半要求「这/那/一+量词」
// 或「吃/喝/服/吞 + 这/那…」），本来就 pc=0，摘不摘护栏都一样——拿它做变异
// 守卫会恒真（r256 踩坑② 同款：单腿承重句必须让甲乙形状在场）。
const BENIGN = [
  '这片药吞下去人就睡着了，但双盲实验显示和安慰剂没差别',
  '这片药吞下去人就睡着了，可能是安慰剂效应',
  '吃了感冒药之后烧就退了，说明对症下药起了作用',
  '遵医嘱服药之后血压就稳了',
  '这片药吞下去当晚就睡踏实了，但样本只有三个，可能是安慰剂效应',
];
const BENIGN_SHAPED = BENIGN.filter(s => s !== '遵医嘱服药之后血压就稳了');

// 存量攻击族：跨表统一不许把召回打塌
const ATTACK = [
  '这服药喝下去当晚就睡得死沉',
  '这片药吞下去人就困了',
  '这颗药吞下去我困得睁不开眼',
  '吃了这个保健品之后精神就好了',
  '吃了这个保健品之后当晚就睡着了',
  '昨天拜了财神，今天就签单了',
];

function pcCount(s) { return idx.checkPseudoCausal(s).count; }
function gateAction(s) { return gateMod.gate(s).gate.action; }

// ─── HEAD 基线副本 ───────────────────────────────────────────────────────
// 纪律：变异在临时目录里做，绝不在原地改写 src/；countHitsIn 走独立子进程，
// 避免 require 缓存把变异前后的模块混在一起。
// rev 用显式 git rev（r256 踩坑：useHeadIndex 布尔 + `git show HEAD` 让 A1 在
// 提交后永久失真——HEAD 自己变成了改动后的版本）。本轮取 HEAD（提交前=改动前）。
function makeCopy(tag, rev) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r257-' + tag + '-'));
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
  if (rev) {
    const baseSrc = cp.execSync('git show ' + rev + ':src/index.js',
      { cwd: ROOT, maxBuffer: 1e8 }).toString();
    fs.writeFileSync(path.join(tmp, 'src', 'index.js'), baseSrc);
  }
  return tmp;
}
function countHitsIn(root, list) {
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(path.join(root, 'src/index.js'))});
const L=${JSON.stringify(list)};
let n=0; for(const x of L){ if(idx.checkPseudoCausal(x).count>0) n++; }
console.log(n);`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return parseInt(out.trim(), 10);
}

// ─── A 节：红队 5/5 → 0/5 ──────────────────────────────────────────────
test('A1 红队 5 条在补表前各被判伪因果（跨表不统一的假阳性）', () => {
  // [v6.8.185 r257] **不依赖任何 git rev。** 首版用 `git show HEAD` 取「补表前」
  // 的源码——而本轮一提交 HEAD 自己就变成补表后的版本，断言提交后永久失败
  // （round-256 A1 同款缺陷：我上一轮把 HEAD 改成 HEAD~1，只是把失效从本轮
  // 推迟到下一轮，没根治）。**「补表前」的可复现定义是「依据层不含那 5 个词」**
  // ——用变异副本把它们从 PC_EVIDENCE_WORDS 摘掉，跑同一批红队。与 C1 的差别：
  // C1 摘的是 5 个**新补**的词并同时验良性零误伤；这里摘的是同一批词、只取
  // 红队基数这一个口径，两边互为佐证。
  const tmp = makeCopy('redpre', null);
  try {
    const p = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(p, 'utf8');
    const mutated = orig.replace(/const PC_EVIDENCE_WORDS = [[\s\S]*?];/,
      "const PC_EVIDENCE_WORDS = ['临床', '双盲', '随机', '对照组', '安慰剂', '样本量', '大样本', '医嘱', '成分', '自限', '自愈', '个例', '孤例'];");
    assert.ok(mutated !== orig, '变异未生效（没摘掉 5 个依据词）');
    fs.writeFileSync(p, mutated, 'utf8');
    assert.strictEqual(countHitsIn(tmp, RED.map(r => r[1])), 5,
      '补表前基数变了——若 <5 说明别处已覆盖这些依据词，需重算本轮增量');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('A2 红队 5 条现在全部不再判（跨表统一消除假阳性）', () => {
  assert.strictEqual(countHitsIn(ROOT, RED.map(r => r[1])), 0, '仍有红队句被误判');
});
test('A3 逐词点名：5 条红队各由它自己那个依据词承重', () => {
  for (const [word, s] of RED) {
    const tr = idx.evidenceExemptionTrace(s);
    assert.deepStrictEqual(tr.words.map(w => w.word), [word],
      `「${s}」的依据词应只有「${word}」，实测 ${JSON.stringify(tr.words.map(w => w.word))}`);
    assert.strictEqual(tr.verdict, 'exempt-evidence', `「${s}」应被判据词豁免`);
    assert.strictEqual(tr.count, 0, `「${s}」的 pseudo_causal 应为 0，实测 ${tr.count}`);
  }
});
test('A4 红队句的 gate.action 从非 pass 回到 pass', () => {
  for (const [, s] of RED) {
    assert.strictEqual(gateAction(s), 'pass', `「${s}」的 gate 应为 pass，实测 ${gateAction(s)}`);
  }
});

// ─── B 节：依据良性零误伤 + 存量召回不塌 ───────────────────────────────
test('B1 依据良性 5 条零误伤（findings 也不出现 pseudo_causal）', () => {
  for (const s of BENIGN) {
    assert.strictEqual(pcCount(s), 0, `「${s}」被误判 pc=${pcCount(s)}`);
    const f = gateMod.gate(s).findings || [];
    assert.ok(!f.some(x => x.dimension === 'pseudo_causal'),
      `「${s}」的 findings 出现 pseudo_causal`);
  }
});
test('B2 存量攻击族 6 条 detector 命中不降', () => {
  for (const s of ATTACK) {
    assert.ok(pcCount(s) > 0, `存量攻击句「${s}」不再判（召回塌了）`);
  }
});
test('B3 跨表统一只增补 5 词：依据层词集 18 词一字未动', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const m = src.match(/const PC_EVIDENCE_WORDS = \[([\s\S]*?)\];/);
  assert.ok(m, '找不到 PC_EVIDENCE_WORDS 定义');
  const words = [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
  assert.strictEqual(words.length, 18, `依据层应 18 词，实测 ${words.length}`);
  // r229 原表逐词在场（零增零减的这一半）
  for (const w of ['临床', '双盲', '随机', '对照组', '安慰剂', '样本量', '大样本',
    '说明书', '医嘱', '药师', '成分', '文献', '同行评审', '实验数据',
    '自限', '自愈', '个例', '孤例']) {
    assert.ok(words.includes(w), `依据层缺词「${w}」`);
  }
});

// ─── C 节：变异守卫 ────────────────────────────────────────────────────
test('C1 变异守卫：摘掉 5 个依据词后 5 条红队必须全部翻面', () => {
  const tmp = makeCopy('mut', null);
  try {
    const p = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(p, 'utf8');
    // 把 5 个新补进依据层的词从 PC_EVIDENCE_WORDS 数组里删掉
    const mutated = orig.replace(/const PC_EVIDENCE_WORDS = \[[\s\S]*?\];/,
      "const PC_EVIDENCE_WORDS = ['临床','双盲','随机','对照组','安慰剂','样本量','大样本','医嘱','成分','自限','自愈','个例','孤例'];");
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(p, mutated, 'utf8');
    assert.strictEqual(countHitsIn(tmp, RED.map(r => r[1])), 5,
      '摘掉 5 词后仍有红队句不判——说明这 5 词里有不承重的死代码');
    // 同时：已在两表共有的依据词仍应兜住那 5 条良性句（不能被这次变异误伤）
    assert.strictEqual(countHitsIn(tmp, BENIGN), 0,
      '变异后依据良性被误命中——说明 C1 的变异顺手改坏了共有的依据层');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('C2 变异守卫：PC_DRUG_MECH_ZH 整表失效后形状在场的依据良性必须重新被误命中', () => {
  const tmp = makeCopy('mut2', null);
  try {
    const p = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(p, 'utf8');
    const mutated = orig.replace(/const PC_DRUG_MECH_ZH = new RegExp\([^\n]*\);/,
      'const PC_DRUG_MECH_ZH = /(?!x)x/;');
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(p, mutated, 'utf8');
    assert.strictEqual(countHitsIn(tmp, BENIGN_SHAPED), BENIGN_SHAPED.length,
      '整表失效后形状在场的依据良性句应全部重新被误命中（证明这张表真在兜底）');
    // 形状不在场的那条（无甲半）两种形态下都不判——它本来就不是这条护栏兜的
    assert.strictEqual(countHitsIn(tmp, ['遵医嘱服药之后血压就稳了']), 0,
      '无甲半句不应受本表影响（它是形状不成立，不是护栏兜的）');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── D 节：单一词源锚点（跨表统一的结构证明） ─────────────────────────
test('D1 两张护栏表从同一份数组生成（单一词源）', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  assert.strictEqual(src.split('const PC_EVIDENCE_WORDS = [').length - 1, 1, 'PC_EVIDENCE_WORDS 应只定义 1 次');
  assert.ok(/const PC_EVIDENCE_ZH = new RegExp\('\(\?:' \+ PC_EVIDENCE_WORDS\.join\('\|'\) \+ '\)'\);/.test(src),
    'PC_EVIDENCE_ZH 应从 PC_EVIDENCE_WORDS 生成');
  assert.ok(src.includes('const PC_SUPP_MECH_ZH = PC_EVIDENCE_ZH;'),
    'PC_SUPP_MECH_ZH 应直接引用依据层（不是第二份词表）');
  assert.ok(/const PC_DRUG_MECH_ZH = new RegExp\('\(\?:' \+ PC_EVIDENCE_ZH\.source \+ '\|' \+ PC_DRUG_NAME_ZH\.source \+ '\)'\);/.test(src),
    'PC_DRUG_MECH_ZH 应由依据层 ∪ 点名真药层拼成');
});
test('D2 两张表运行时同源（.source 逐字相同）', () => {
  // 直接读源码模块拿不到两张表（模块内常量），用 drift 判据间接证明 + 用
  // 子进程把源码 eval 出来直接比 source。
  const out = cp.execFileSync(process.execPath,
    ['-e', `const fs=require('fs');
const src=fs.readFileSync(${JSON.stringify(SRC)},'utf8');
const a=src.match(/const PC_EVIDENCE_ZH = new RegExp\\([^\\n]*\\);/)[0];
const b=src.match(/const PC_SUPP_MECH_ZH = PC_EVIDENCE_ZH;/)[0];
const c=src.match(/const PC_DRUG_MECH_ZH = new RegExp\\([^\\n]*\\);/)[0];
console.log(JSON.stringify({a,b,c}));`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const r = JSON.parse(out.trim());
  assert.ok(r.a.includes('PC_EVIDENCE_WORDS.join'), '依据层未从数组生成');
  assert.ok(r.b.includes('PC_EVIDENCE_ZH'), 'SUPP 表未引用依据层');
  assert.ok(r.c.includes('PC_EVIDENCE_ZH.source') && r.c.includes('PC_DRUG_NAME_ZH.source'),
    'DRUG 表未由两层拼成');
});
test('D3 drift 判据：unified=true 且两侧独有词集为空', () => {
  // 诚实标注：单一词源架构下 unified 是**恒真**的（PC_SUPP_MECH_ZH 就是
  // PC_EVIDENCE_ZH 的别名，改词数组会同时作用于两张表）。所以 D3 不是「当前
  // 是否统一」的证明——那是 D1/D2 的源码锚点在证明。D3 的语义是**哨兵**：
  // 一旦未来有人把 PC_SUPP_MECH_ZH 改回独立字面量、两张表再次漂移，这里
  // 立刻报 false。哨兵的有效性由 D4 验（真能翻面）。
  for (const s of RED.map(r => r[1]).concat(BENIGN)) {
    const d = idx.evidenceExemptionTrace(s).drift;
    assert.ok(d, `「${s}」的 drift 为 null`);
    assert.strictEqual(d.unified, true, `「${s}」的 drift.unified=false（漂移复现）`);
    assert.strictEqual(d.drugOnly.length, 0, '依据层仍有词只在服药族表');
    assert.strictEqual(d.suppOnly.length, 0, '依据层仍有词只在保健品族表');
    assert.strictEqual(d.shared.length, 18, `共享词应 18，实测 ${d.shared.length}`);
  }
});
test('D4 反向锚点：drift 哨兵真能检出漂移（不是恒真装饰）', () => {
  // 把 PC_SUPP_MECH_ZH 从「= PC_EVIDENCE_ZH 别名」改回**独立字面量**并去掉
  // 「文献」——这正是 r257 之前 DRUG/SUPP 两张表漂移的形态。改完后 drift 必须
  // 报 drugOnly=['文献']、unified=false。
  // 首版 D4 试过「从 PC_EVIDENCE_WORDS 删『文献』」，结果 unified 仍是 true——
  // 那张表是别名，删词数组两边一起删，漂移根本不会发生。**这个失败的 D4 证明
  // 了 drift 在单一词源下是哨兵而非证明**，故改为哨兵语义验证。
  const tmp = makeCopy('drift', null);
  try {
    const p = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(p, 'utf8');
    const mutated = orig.replace('const PC_SUPP_MECH_ZH = PC_EVIDENCE_ZH;',
      "const PC_SUPP_MECH_ZH = /(?:临床|双盲|随机|对照组|安慰剂|样本量|大样本|说明书|医嘱|药师|成分|同行评审|实验数据|自限|自愈|个例|孤例)/;");
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(p, mutated, 'utf8');
    const out = cp.execFileSync(process.execPath,
      ['-e', `const idx=require(${JSON.stringify(path.join(tmp, 'src/index.js'))});
const d=idx.evidenceExemptionTrace('这服药喝下去病就好了，同行评审都没通过这个结论').drift;
console.log(JSON.stringify({u:d.unified,do:d.drugOnly,so:d.suppOnly,sh:d.shared.length}));`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const r = JSON.parse(out.trim());
    assert.strictEqual(r.u, false, 'SUPP 表退回独立字面量后 unified 应翻面');
    assert.deepStrictEqual(r.do, ['文献'], `「文献」应被报成 drugOnly，实测 ${JSON.stringify(r.do)}`);
    assert.strictEqual(r.sh, 17, `共享词应降到 17，实测 ${r.sh}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── E 节：新公开方法 evidenceExemptionTrace ───────────────────────────
test('E1 九段形状完整（verdict/guard/words/tables/families/drift/clauses/count/hits/score）', () => {
  const t = idx.evidenceExemptionTrace('这服药喝下去病就好了，同行评审都没通过这个结论');
  for (const k of ['verdict', 'guard', 'words', 'tables', 'families', 'drift', 'clauses', 'count', 'hits', 'score']) {
    assert.ok(k in t, `缺字段 ${k}`);
  }
  assert.ok('evidence' in t.tables && 'drugName' in t.tables && 'drugMech' in t.tables
    && 'suppMech' in t.tables && 'revMech' in t.tables, 'tables 缺表');
  assert.ok('invertedTake' in t.families && 'supplement' in t.families && 'rite' in t.families,
    'families 缺子判据');
});
test('E2 四类 verdict 各有一条（no-text/no-chinese/attack/ exempt-*）', () => {
  assert.strictEqual(idx.evidenceExemptionTrace('').verdict, 'no-text');
  assert.strictEqual(idx.evidenceExemptionTrace('hello world').verdict, 'no-chinese');
  assert.strictEqual(idx.evidenceExemptionTrace('昨天拜了财神，今天就签单了').verdict, 'attack');
  assert.strictEqual(idx.evidenceExemptionTrace('这片药吞下去人就睡着了，但双盲实验显示和安慰剂没差别').verdict,
    'exempt-evidence');
  assert.strictEqual(idx.evidenceExemptionTrace('吃了感冒药之后烧就退了，说明对症下药起了作用').verdict,
    'exempt-drug-name');
});
test('E3 逐词命中带 index 与 clause（子句偏移按分隔符累加，不用 indexOf 找首现）', () => {
  const s = '这服药喝下去病就好了，同行评审都没通过这个结论。药师讲这是心理作用';
  const t = idx.evidenceExemptionTrace(s);
  assert.strictEqual(t.words.length, 2, `应命中 2 个词，实测 ${t.words.length}`);
  const px = t.words.find(w => w.word === '同行评审');
  const ys = t.words.find(w => w.word === '药师');
  assert.strictEqual(s.slice(px.index, px.index + 4), '同行评审', 'index 指错位置');
  assert.strictEqual(s.slice(ys.index, ys.index + 2), '药师', 'index 指错位置');
  assert.strictEqual(px.clause, 0, '「同行评审」应在子句 0');
  assert.strictEqual(ys.clause, 1, '「药师」应在子句 1');
  // 同一子句串出现两次时 indexOf 会指错段——这句里两个依据词跨句，正好钉住
  assert.strictEqual(t.clauses[1].evidenceWords.join('/'), '药师', '子句级分布错');
});
test('E4 四张表在场情况能回答「换张表会不会翻面」', () => {
  const t = idx.evidenceExemptionTrace('这服药喝下去病就好了，同行评审都没通过这个结论');
  assert.strictEqual(t.tables.evidence.hit, true);
  assert.strictEqual(t.tables.suppMech.hit, true, '保健品族表也应命中（同一句同源）');
  assert.strictEqual(t.tables.drugMech.hit, true, '服药族表也应命中（本轮修的就是这个）');
  assert.strictEqual(t.tables.drugName.hit, false, '这句没有点名真药名词');
  // 三个子判据的 exempt 串与各函数头返回的字符串逐字对齐
  assert.deepStrictEqual(t.families.invertedTake.exempt, ['drug-mech']);
  assert.deepStrictEqual(t.families.supplement.exempt, ['supp-mech']);
  assert.strictEqual(t.families.invertedTake.blockedBy, 'PC_DRUG_MECH_ZH');
  assert.strictEqual(t.families.supplement.blockedBy, 'PC_SUPP_MECH_ZH');
});
test('E5 count/hits 与 checkPseudoCausal 同源', () => {
  for (const s of RED.map(r => r[1]).concat(BENIGN, ATTACK)) {
    const t = idx.evidenceExemptionTrace(s);
    const pc = idx.checkPseudoCausal(s);
    assert.strictEqual(t.count, pc.count, `「${s}」的 count 与 checkPseudoCausal 不一致`);
    assert.deepStrictEqual(t.hits, pc.hits, `「${s}」的 hits 与 checkPseudoCausal 不一致`);
  }
});
test('E6 方法名不带 check 前缀（orphan-dimension-scan 纪律）', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  assert.ok(src.includes('function evidenceExemptionTrace(text)'), '缺新公开方法定义');
  assert.ok(!/function checkEvidenceExemption/.test(src), '不许带 check 前缀（会被当成断链维度）');
});

// ─── F 节：约定 3 三处接线 ─────────────────────────────────────────────
test('F1 约定 3 三处接线在册（工具定义 + HANDLERS 映射 + handler 函数）', () => {
  const reg = fs.readFileSync(path.join(ROOT, 'src/mcp/tools-registry.js'), 'utf8');
  const srv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
  assert.ok(reg.includes("name: 'heartflow_evidence_exemption'"), 'tools-registry 缺工具定义');
  assert.strictEqual(srv.split('heartflow_evidence_exemption: handleEvidenceExemption,').length - 1, 1,
    'HANDLERS 映射不唯一');
  assert.ok(srv.includes('function handleEvidenceExemption(args)'), '缺 handler 函数');
  const wtIdx = srv.indexOf('const WRITE_TOOLS');
  assert.ok(wtIdx > 0, '找不到 WRITE_TOOLS 声明');
  assert.ok(!srv.slice(wtIdx, wtIdx + 2000).includes('heartflow_evidence_exemption'),
    '新工具不应进 WRITE_TOOLS');
  const names = [...reg.matchAll(/name:\s*'([^']+)'/g)].map(m => m[1]);
  assert.strictEqual(names.length, new Set(names).size, '工具名有重复');
  assert.ok(names.includes('heartflow_evidence_exemption'), '工具表里找不到新工具');
});
test('F2 公开导出 + handler 缺参契约', () => {
  assert.strictEqual(typeof idx.evidenceExemptionTrace, 'function', '未导出 evidenceExemptionTrace');
  const srv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
  assert.ok(srv.includes("return { error: '缺少参数 text（要审计的中文文本）', expectedParams: ['text'], timestamp: Date.now() };"),
    'handler 缺 text 时应返回带 expectedParams 的可操作错误');
});
test('F3 独立子进程端到端：公开方法真的能跑', () => {
  const s = '这服药喝下去病就好了，同行评审都没通过这个结论';
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(path.join(ROOT, 'src/index.js'))});
const t=idx.evidenceExemptionTrace(${JSON.stringify(s)});
console.log(JSON.stringify({v:t.verdict,w:t.words.map(x=>x.word),u:t.drift.unified,c:t.count}));`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const r = JSON.parse(out.trim());
  assert.strictEqual(r.v, 'exempt-evidence');
  assert.deepStrictEqual(r.w, ['同行评审']);
  assert.strictEqual(r.u, true);
  assert.strictEqual(r.c, 0);
});

// ─── G 节：性能无回归 ──────────────────────────────────────────────────
test('G1 checkPseudoCausal 热路径无回归（HEAD vs 当前，同句同机）', () => {
  const bench = (root) => {
    const code = `const idx=require(${JSON.stringify(path.join(root, 'src/index.js'))});
const S=${JSON.stringify(RED.map(r => r[1]).concat(BENIGN, ATTACK).join('。'))};
const t=Date.now(); for(let i=0;i<3000;i++) idx.checkPseudoCausal(S);
console.log(Date.now()-t);`;
    return Number(cp.execFileSync(process.execPath, ['-e', code],
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim());
  };
  const tmp = makeCopy('perf', 'HEAD');
  try {
    const base = bench(tmp);
    const cur = bench(ROOT);
    assert.ok(cur <= base * 1.3 + 50,
      `性能回归：HEAD ${base}ms → 当前 ${cur}ms（阈值 base*1.3+50）`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── H 节：存量族守卫逐个复跑不塌 ──────────────────────────────────────
test('H1 直接受本轮改动影响的存量守卫文件逐个复跑', () => {
  const files = [
    'round-227-pseudo-causal-inverted-take-drug-guard.test.js',
    'round-229-supplement-attribution-guard.test.js',
    'round-236-unnamed-drug-take-guard.test.js',
  ];
  for (const f of files) {
    const out = cp.execFileSync(process.execPath, [path.join(ROOT, 'test', f)],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const m = out.match(/(\d+) 通过, (\d+) 失败/);
    assert.ok(m, `${f} 未输出汇总行`);
    assert.strictEqual(Number(m[2]), 0, `${f} 有 ${m[2]} 个失败`);
  }
});

console.log(`\n${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
