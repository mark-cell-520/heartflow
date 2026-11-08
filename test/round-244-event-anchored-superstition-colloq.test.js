// r244 守卫：⑨ 支第三腿「事件锚定标记 × 玄学动作甲半 × 白话结果变动词」
// （PC_EVENT_ACT_ZH × PC_SEQ_ZH × PC_RES_COLLOQ_ZH，v6.8.172）——修 r243 G2 登记的
// 「事件锚定侧白话攻击句仍漏」缺口。
// 铁律（本轮取向刀，r243 第十六条之后的第十七条）：事件锚定标记（之后/结束后/
// 播出后/发布后/一结束/后，）之后的**白话结果变动**，只在甲半是**玄学动作**时
// 构成弱信号；甲半是工程/管理动作（修 bug/新系统上线/换架构/推广/改价）时不判
// ——那是工程实况，round-48 良性表「日常物理类」+ round-224 工程护栏族 + r143
// 良性表钉死的一侧（「修好线上 bug 之后成功率自然就上去了」）。
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
  console.log(`\nround-244-event-anchored-superstition-colloq: ${p} 通过, ${f} 失败, 共 ${RESULTS.length} 个`);
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

// ─── A 族：红队（事件锚定标记 × 玄学动作甲半 × 白话结果变动）────────────────
// 轮初实测（scripts/tmp-244-red.js + data/wt-244-base HEAD worktree 副本）：15 条
// 在 HEAD 全部 pc=0 / gate=pass——⑨支原有指标词表装不下「变多/多了/跌了」，
// ⑨' 腿只收时段框架标记（自从/从那以后/去年…）不收事件锚定标记（之后/结束后），
// ⑪支的结果侧 PC_RES_LUCK_ZH 也没有「咨询就变多了」这种白话量增。
const A_RED = [
  '贴了财神贴之后，进店客流就变多了',      // r243 G2 登记
  '改完名之后，订单就多了',                // r243 G2 登记
  '那天换了头像之后，咨询就变多了',        // r243 G1 登记
  '去庙里开了光之后，营业额就变多了',
  '换了新昵称之后，私信就变多了',
  '拜了财神之后，到店人数就变多了',
  '请了财神爷回来之后，生意就变好了',
  '换上招财壁纸之后，询单就变多了',
  '改了名之后，咨询量就变高了',
  '换个新头像之后，订单就变多了',
  '上香之后，进店的客人就变多了',
  '换了风水摆件之后，差评就跌了',
];
// HEAD 已判（pc=1：⑭支摆件/⑩支拜/⑪支手链），本轮新腿再加一支 → 2
const A_RED_STRENGTHENED = [
  '戴了开光手链之后，中奖就变多了',
  '贴了财神贴之后，用户量就涨上去了',
];
const A_ALL = A_RED.concat(A_RED_STRENGTHENED);

test(`A1 事件锚定红队 ${A_RED.length} 条 HEAD 漏判 → 现在 0 漏`, () => {
  const miss = A_RED.filter(s => !pcHit(s));
  assert.strictEqual(miss.length, 0, `事件锚定红队应零漏判，实测漏 ${miss.length}: ${miss.join(' / ')}`);
  for (const s of A_ALL) assert.ok(gateOf(s) !== 'pass', '判了的攻击句 gate 不应 pass: ' + s);
});

test('A2 攻击句 detector 命中数逐条登记', () => {
  const counts = A_ALL.map(pcCount);
  // 前 12 条 1（只走新支）；后 2 条 HEAD 已判（⑪/⑭），新腿再加一支 → 2
  assert.deepStrictEqual(counts, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2],
    'detector 命中数应与登记一致，实测: ' + counts.join('/'));
});

test('A3 HEAD 漏判基数登记（HEAD 副本存在时用 git worktree 实测，不是记忆值）', () => {
  const base = path.join(ROOT, 'data', 'wt-244-base', 'src', 'index.js');
  if (!fs.existsSync(base)) {
    console.log('  （跳过：data/wt-244-base 不存在——HEAD 基数登记需在轮次进行中跑）');
    return;
  }
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(base)});
const L=${JSON.stringify(A_ALL)};
console.log(JSON.stringify(L.map(x=>idx.checkPseudoCausal(x).count)));`],
    { encoding: 'utf8' });
  const headCounts = JSON.parse(out.trim());
  const headMiss = headCounts.filter(c => c === 0).length;
  assert.strictEqual(headMiss, A_RED.length,
    `HEAD 副本实测漏判数应为 ${A_RED.length}（A_RED 全集），实测 ${headMiss}: ${headCounts.join('/')}`);
});

// ─── B 族：良性零误伤（工程/管理/物理/日常/统计 六子族）────────────────────
// 事件锚定侧钉死的两族护栏：round-48 良性表「日常物理类」子类 + round-224 C 节
// 工程护栏族 + r143 良性表；再加工程/管理/日常/统计形状。
const B_BENIGN = [
  // 日常物理类（round-48 良性表子类，事件锚定侧钉死）
  '考试结束后图书馆的空位就多了。',
  '六点之后地铁明显宽松很多。',
  '国庆假期之后机票价格普遍回落。',
  '大雨之后水库水位涨了两米。',
  // 工程护栏族（round-224 C 节 + r143 良性表）
  '修好线上 bug 之后成功率自然就上去了',
  '下雨之后水库水位涨了，雨季降水也会补给库容',
  '推广之后销量涨了，季节因素也会带动销量',
  '换了架构之后延迟就下来了，归根结底，是因为链路短了两跳',
  // 工程/管理动作 × 白话变动（甲半不是玄学动作 → 本轮取向刀不判）
  '换了新经理之后，这个月业绩就上去了',
  '新系统上线之后，用户量就涨上去了',
  '改完参数之后成功率就变高了',
  '改了推送文案之后打开率就变高了',
  '调整了详情页之后转化率就涨了',
  '换了新领导之后团队氛围就变好了',
  // 真实行为 × 白话变动（PC_LUCK2_ACT_ZH 里的早起/转发/分享/抽奖，新表刻意不收）
  '早起之后精神就变好了',
  '分享之后粉丝就变多了',
  '抽奖之后参与人数就变多了',
  '换了新发型之后心情就变好了',
  // 对冲/他因信号（函数头四道豁免）
  '降温之后感冒也少了，总之季节性因素有很多',
];

// 存量即被其他维度判 rewrite 的句子（HEAD 同为 rewrite，见 B2 逐项一致断言）——
// 按 r226 B3/B4 纪律单独登记，不混进「gate 必须 pass」的断言。
// 两条都是 **post_hoc 维度**（severity 6800）存量触发的 rewrite，pseudo_causal
// 实测 0 命中、HEAD 副本 gate.action 逐项相同（B2 断言）——不是本轮引入。
const B_GATE_NONPASS = [
  '换了新经理之后，这个月业绩就上去了',
  '调整了详情页之后转化率就涨了',
];

test(`B1 良性 ${B_BENIGN.length} 条 detector 零误伤`, () => {
  const bad = B_BENIGN.filter(s => pcHit(s));
  assert.deepStrictEqual(bad, [], `以下良性句被误判：\n  ${bad.join('\n  ')}`);
});

test(`B1b 良性句 gate 全 pass（剔除 ${B_GATE_NONPASS.length} 条存量非 pass 登记项）`, () => {
  const rest = B_BENIGN.filter(s => !B_GATE_NONPASS.includes(s));
  for (const s of rest) assert.strictEqual(gateOf(s), 'pass', '良性句 gate 应保持 pass: ' + s);
});

test(`B1c 存量非 pass 登记项 ${B_GATE_NONPASS.length} 条现值照登（HEAD 同为 rewrite，非本轮引入）`, () => {
  for (const s of B_GATE_NONPASS) {
    assert.strictEqual(gateOf(s), 'rewrite', '登记项 gate 应仍为 rewrite: ' + s);
    assert.strictEqual(pcCount(s), 0, '登记项 pseudo_causal 应零命中: ' + s);
  }
});

test('B2 良性句 gate 与 HEAD 副本逐项一致（HEAD 副本存在时）', () => {
  const base = path.join(ROOT, 'data', 'wt-244-base', 'src', 'gate.js');
  if (!fs.existsSync(base)) {
    console.log('  （跳过：data/wt-244-base 不存在）');
    return;
  }
  const gHead = require(base);
  const diff = B_BENIGN.filter(s => gHead.gate(s).gate.action !== gateOf(s));
  assert.deepStrictEqual(diff, [], `以下良性句 gate 与 HEAD 副本不一致：\n  ${diff.join('\n  ')}`);
});

// ─── C 族：victim —— 只靠新支判出的句子（摘掉新支必须回落）────────────────
const C_VICTIM = [
  '贴了财神贴之后，进店客流就变多了',
  '换了新昵称之后，私信就变多了',
  '上香之后，进店的客人就变多了',
];

test(`C1 ${C_VICTIM.length} 条 victim 只靠新支判出（HEAD 全漏）`, () => {
  for (const s of C_VICTIM) {
    assert.strictEqual(pcCount(s), 1, `victim 应只被新支命中 1 次，实测 ${pcCount(s)}: ${s}`);
    assert.notStrictEqual(gateOf(s), 'pass', 'victim gate 应非 pass: ' + s);
  }
});

// ─── D 族：变异守卫 ────────────────────────────────────────────────────────
const NEW_LEG = "  new RegExp(PC_EVENT_ACT_ZH.source + '[^.。]{0,24}' + PC_SEQ_ZH.source + '[^.。]{0,14}' + PC_RES_COLLOQ_ZH.source),";
const ACT_DEF = 'const PC_EVENT_ACT_ZH = /(?:';

function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r244-' + tag + '-'));
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

test('D1 摘掉整条新支（索引 15）：红队 12 条必须整体回落到 HEAD 漏判态', () => {
  const tmp = copySrc('dropleg');
  try {
    mutateIn(tmp, NEW_LEG, '  /(?!x)x/,');
    const counts = pcCountsIn(tmp, A_RED);
    assert.deepStrictEqual(counts, A_RED.map(() => 0),
      `摘掉新支后红队应全部漏判，实测: ${counts.join('/')}`);
    const kept = pcCountsIn(tmp, A_RED_STRENGTHENED);
    assert.deepStrictEqual(kept, [1, 1], `HEAD 已判的 2 条应保持 pc=1，实测: ${kept.join('/')}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test("D2 只清空 PC_EVENT_ACT_ZH 甲半表：同样整体回落且⑨/⑨'腿不受影响", () => {
  const tmp = copySrc('dropact');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    const line = orig.split('\n').find(l => l.includes(ACT_DEF));
    assert.ok(line, '副本中找不到 PC_EVENT_ACT_ZH 定义行');
    fs.writeFileSync(src, orig.replace(line, 'const PC_EVENT_ACT_ZH = /(?!x)x/;'), 'utf8');
    const counts = pcCountsIn(tmp, A_RED);
    assert.deepStrictEqual(counts, A_RED.map(() => 0),
      `清空甲半表后红队应全部漏判，实测: ${counts.join('/')}`);
    // ⑨/⑨' 两条腿必须照判（证明摘的是新腿不是整族）
    const legacy = pcCountsIn(tmp, [
      '上线之后投诉量下降了',
      '自从回归稳了之后签单就多了',
    ]);
    assert.deepStrictEqual(legacy, [1, 1], `⑨/⑨'形式腿应照判，实测: ${legacy.join('/')}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D3 甲半表换成工程动作表：红队必须整体回落且工程句开始被误命中', () => {
  const tmp = copySrc('engact');
  try {
    // 把甲半表换成工程动作词——同样形状下「修 bug 之后成功率上去了」会被判，
    // 证明新支的判据形状本身不区分甲半类型，区分力全在甲半表上（取向刀承重）。
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    const line = orig.split('\n').find(l => l.includes(ACT_DEF));
    assert.ok(line, '副本中找不到 PC_EVENT_ACT_ZH 定义行');
    fs.writeFileSync(src, orig.replace(line, 'const PC_EVENT_ACT_ZH = /(?:修[了好]?|上线|部署|推广|改价|换架构)/;'), 'utf8');
    const counts = pcCountsIn(tmp, A_RED);
    assert.deepStrictEqual(counts, A_RED.map(() => 0),
      `甲半表换成工程动作后红队应全部回落，实测: ${counts.join('/')}`);
    const eng = pcCountsIn(tmp, ['修好线上 bug 之后成功率自然就上去了', '推广之后销量涨了']);
    assert.deepStrictEqual(eng, [1, 1], `工程句应被误命中（证明形状承重、甲半表是唯一闸门），实测: ${eng.join('/')}`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('D4 未变异副本还原校验：红队/良性与当前树逐项一致', () => {
  const tmp = copySrc('restore');
  try {
    const cur = A_ALL.concat(B_BENIGN).map(pcCount);
    const cp2 = pcCountsIn(tmp, A_ALL.concat(B_BENIGN));
    assert.deepStrictEqual(cp2, cur, '未变异副本应与当前树逐项一致');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── E 族：存量攻击族一条不塌 ──────────────────────────────────────────────
const E_LEGACY = [
  '自从回归稳了之后签单就多了',                                    // r242 G1 / r243 ⑨'
  '从那以后他每天拜财神，业绩就上去了',                            // r243 ⑨' 加强族
  '换了这个头像之后订单就多了，肯定是头像招财',                    // r226 归因族
  '去庙里给这个手链开光后，业绩就上去了',                          // r231 仪式族
  '换了这个头像之后咨询也变多了，显然是头像带来了好运',            // r232
  '换了这个头像之后咨询也变多了，看来是因为头像带来了好运',        // r233
  '换了这个头像之后咨询也变多了，总之是因为头像带来了好运',        // r234
  '换了这个头像之后签单就多了，说穿了，是由于客户更信任我们了',    // r237
  '换了昵称之后粉丝就涨了，听说，功劳全在这个昵称上',              // r237
  '扩了容之后故障就再也没复发，都说是因为拜了财神',                // r238
  '改了昵称之后签单也多了，我每天跑步',                            // r239
  '上线之后投诉量下降了，所以这次上线就是投诉下降的原因',          // r226 存量
];

test(`E1 存量攻击族 ${E_LEGACY.length} 条一条不塌`, () => {
  const miss = E_LEGACY.filter(s => !pcHit(s));
  assert.deepStrictEqual(miss, [], `以下存量攻击句塌陷：\n  ${miss.join('\n  ')}`);
});

test(`E2 存量攻击族 gate 全非 pass`, () => {
  const pass = E_LEGACY.filter(s => gateOf(s) === 'pass');
  assert.deepStrictEqual(pass, [], `以下存量攻击句 gate 回落成 pass：\n  ${pass.join('\n  ')}`);
});

// ─── F 族：源码锚点 ────────────────────────────────────────────────────────
test('F1 新甲半表只定义 1 次且在 PC_CAUSAL_ZH_PATS 之前（const TDZ 铁律）', () => {
  assert.strictEqual(SRC_TEXT.split(ACT_DEF).length - 1, 1, 'PC_EVENT_ACT_ZH 定义行应恰好 1 处');
  assert.ok(SRC_TEXT.indexOf(ACT_DEF) < SRC_TEXT.indexOf('const PC_CAUSAL_ZH_PATS = ['),
    'PC_EVENT_ACT_ZH 必须声明在 PC_CAUSAL_ZH_PATS 之前（TDZ）');
});

test("F2 新腿追加在数组末尾（⑨'之后，索引 15）", () => {
  const start = SRC_TEXT.indexOf('const PC_CAUSAL_ZH_PATS = [');
  assert.ok(start >= 0, '找不到 PC_CAUSAL_ZH_PATS');
  const arr = SRC_TEXT.slice(start, SRC_TEXT.indexOf('];', start));
  assert.strictEqual(arr.split(NEW_LEG).length - 1, 1, '新腿应在数组里出现 1 次');
  // 新腿必须排在⑨''腿之后（追加末尾纪律：按索引认支的数组不能插中间）
  assert.ok(arr.indexOf("PC_SEQ_PERIOD_ZH.source + '[^。]{0,14}' + PC_RES_COLLOQ_ZH.source") < arr.indexOf(NEW_LEG.trim()),
    '新腿必须排在⑨\'\'腿之后');
});

test('F3 弱支登记含索引 15', () => {
  assert.ok(/const weak = pat === PC_CAUSAL_ZH_PATS\[0\][\s\S]{0,400}PC_CAUSAL_ZH_PATS\[15\]/.test(SRC_TEXT),
    'weak 弱支集合应含索引 15');
});

test('F4 甲半表不收裸对象词与场所词（避免与⑭支、仪式族子判据双支命中打花 count）', () => {
  const line = SRC_TEXT.split('\n').find(l => l.includes(ACT_DEF));
  // ⑭支甲半表已收的静态对象词：财神/护身符/红袜子/星座/属相/血型/本命年/手气/
  // 福气/运势/锦鲤/风水(裸)/摆件(裸)/符咒/罗盘
  // ⑭支甲半表（PC_NOOBJ_ZH）与仪式族子判据已收的**静态对象裸腿**一个都不收
  for (const bare of ['|财神|', '|护身符|', '|红袜子|', '|星座|', '|锦鲤|', '|风水|',
    '|符咒|', '|罗盘|', '|属相|', '|血型|', '|本命年|', '|手气|', '|福气|', '|运势|']) {
    assert.ok(!line.includes(bare), `甲半表不应收裸对象词 ${bare}`);
  }
  // 昵称/头像/壁纸 只以「换|改|更 + ≤2 字 + 中心词」形状出现，不是裸词腿
  assert.ok(line.includes("(?:换|改|更)[了完过]?[^。，,]{0,2}(?:昵称|头像|壁纸)"),
    '昵称/头像/壁纸 必须是带动词前缀的形状腿');
  assert.ok(!line.includes('|(?:昵称|头像|壁纸)|'), '昵称/头像/壁纸 不许是裸词腿');
  // 「摆件」只允许出现在招财/开运/风水三个复合形里（各 1 次）
  assert.strictEqual(line.split('摆件').length - 1, 3, '「摆件」应只出现在招财/开运/风水三个复合形中');
  // 场所词：庙里/寺庙/道观/佛堂/祠堂/庵里
  for (const place of ['庙里', '寺庙', '道观', '佛堂', '祠堂', '庵里']) {
    assert.ok(!line.includes(place), `甲半表不应收场所词 ${place}`);
  }
  // 真实行为词：早起/转发/分享/抽奖（PC_LUCK2_ACT_ZH 同标准）
  for (const act of ['早起', '转发', '分享', '抽奖']) {
    assert.ok(!line.includes(act), `甲半表不应收真实行为词 ${act}`);
  }
});

test('F5 dimensions 键 210 不变（本轮未加维度，只补⑨支第三腿）', () => {
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
test('G1 已知未修：工程/管理动作甲半的事件锚定白话句刻意不收（本轮取向刀）', () => {
  const GAP = [
    '新系统上线之后，用户量就涨上去了',
    '换了新经理之后，这个月业绩就上去了',
    '改完参数之后成功率就变高了',
  ];
  for (const s of GAP) {
    assert.strictEqual(pcCount(s), 0, `工程实况句应仍漏判（已知未修）：${s}，实测 pc=${pcCount(s)}`);
  }
});

test('G2 已知未修：裸标记时段句仍漏（r225 纪律，PC_SEQ_BARE_ZH 不进⑨族）', () => {
  const GAP = [
    '打那天起他随身带着护身符，感冒就变少了',
  ];
  for (const s of GAP) {
    assert.strictEqual(pcCount(s), 0, `裸标记句应仍漏判（已知未修）：${s}，实测 pc=${pcCount(s)}`);
  }
});
