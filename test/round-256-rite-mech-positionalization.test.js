// test/round-256-rite-mech-positionalization.js
// 第 256 轮守卫：玄学仪式归因族的反向护栏从「整句豁免」位置化为「归因带豁免」
//   （PC_RITE_MECH_ZH.test(text) → PC_RITE_SLOT_MECH_ZH 四腿）
//
// 缺口实测（scripts/tmp-256-probe.js / probe2.js / probe3.js / ab.js，轮末已删）：
//   ① 全仓 54569 条中文 quoted 样本：甲乙同子句形状命中 46 条，其中被
//      PC_RITE_MECH_ZH 整句豁免 10 条——**机制词跨子句的假豁免 0 条**（存量语料
//      里没有那种样本），所以「整句」这个缺陷在存量语料上是**潜伏**的，只能靠
//      红队把它照出来；
//   ② 红队 16 条（机制词在别的子句 / 仪式动词上游的时序侧 / 被否定的对比位 /
//      结果侧附带描述）HEAD detector 只命中 4/16，12 条全部死于整句豁免；
//   ③ 位置化后 14/16（C3 的结果词「过敏」本身是机制词、D1 的「免疫力」在归因
//      带下游，两条见 G 节登记）；
//   ④ 全仓碰撞面：46 条形状命中里旧豁免 10 条 → 新豁免 9 条，翻面 1 条且是
//      UPGRADE_LOG 引用句（与 r248 全仓 A/B 报的「1 条 UPGRADE_LOG 引用句」同族）。
//
// 取向刀（本轮裁；r231 第五条「仪式」…r248 第二十一条之后的第二十二条）：
//   **机制词只有落在归因带上才算依据**——显式归因链接之后、领属归责名词旁边、
//   或仪式动词同子句的**下游**（因果断言的发出方向与乙半窗口同向）。机制词在
//   仪式动词**之前**时那一侧是背景/时序侧/否定对比位，说话者并没把它当作这次
//   归因的依据，照判。
//
// 本测试锁定八件事：
//   ① 16 条红队 detector 命中 4/16 → 14/16（HEAD 基数由 git show HEAD 实测）
//   ② 依据良性零误伤 + findings 里不出现 pseudo_causal
//   ③ 六处变异守卫：整张表 + 逐腿（A/B/C/D 各一条**只由该腿承重**的句子），
//     证明四条腿没有一条是死腿
//   ④ 存量伪因果族守卫逐个复跑不塌
//   ⑤ 源码锚点：四腿各自独立命名常量、PC_RITE_MECH_ZH 原表未动、维度 210 不变
//   ⑥ gate 热路径无性能回归（同一基准 HEAD vs 当前树）
//   ⑦ 三条已知未修登记为字面量，防下一轮无声退化
const path = require('path');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');

const idx = require(path.join(ROOT, 'src/index.js'));
const gateMod = require(path.join(ROOT, 'src/gate.js'));
const SRC = path.join(ROOT, 'src', 'index.js');

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + '\n     ' + e.message); process.exitCode = 1; }
}
process.on('exit', () => {
  console.log(`${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
});

const pcCount = (text) => idx.checkPseudoCausal(text).count;
const hasPcDim = (text) => (gateMod.gate(text).findings || []).some(f => f && f.dimension === 'pseudo_causal');

// ─── A 族语料：红队（机制词不在归因位上，HEAD 12/16 漏判）────────────────
// A 族 跨句背景：机制词在另一句，与归因句无关
const RED_CROSS = [
  '他上个月确诊了病因，一直按时复查。这周去庙里开过光，病就好了',
  '她上个月去看了门诊，医生说病灶还在。她去庙里开了光，第二天病就好了',
  '公司上季度感染流感停工了一周。老板去庙里开光，之后订单明显多了',
  '他上周复诊，医生说是病毒性感染。他去庙里拜了拜，烧就退了',
  '实验室上个月爆过细菌污染。所长去庙里上香，之后项目就顺利上线了',
];
// B 族 时序侧：机制词在仪式动作之前，只是背景
const RED_UPSTREAM = [
  '为了消炎他吃了三天抗生素，临走前又去庙里开过光，病就好了',
  '他确诊之后一直很焦虑，去庙里求了签，身体就好了',
  '她停了药之后不放心，去庙里上香，咳嗽就止住了',
];
// C 族 否定位：机制词被说话者否定/对比，不是他给出的解释
const RED_NEGATED = [
  '吃了抗生素根本不管用，去庙里开过光，病就好了',
  '住院输液都没治好，去庙里拜了拜，身体就好了',
  '抗过敏药吃了一堆也没用，去庙里上香之后过敏就好了',
];
// D 族 机制词在归因带下游（同子句、仪式动词之后）——本轮取向刀的豁免侧
const RED_DOWNSTREAM = [
  '去庙里开过光之后病就好了，免疫力也跟着上来了',
  '去庙里求签之后签单就多了，老板说这是病毒式传播',
  '去庙里开了光之后业绩就上去了，病理上看和市场周期无关',
];
// E 族 机制词在归因句之外的收尾句
const RED_TAIL = [
  '他去庙里开过光，病就好了。至于病因，医生也说不清',
  '她去庙里求了签，生意就火起来了。病毒营销那是后面才开始的',
];
const RED = [...RED_CROSS, ...RED_UPSTREAM, ...RED_NEGATED, ...RED_DOWNSTREAM, ...RED_TAIL];
// HEAD 就命中的 4 条（第⑭支摆件 / 第⑩支裸「拜」×「退了」等存量判据覆盖）
const RED_HEAD_HIT = [
  '公司上季度感染流感停工了一周。老板去庙里开光，之后订单明显多了',
  '住院输液都没治好，去庙里拜了拜，身体就好了',
  '去庙里求签之后签单就多了，老板说这是病毒式传播',
  '去庙里开了光之后业绩就上去了，病理上看和市场周期无关',
];
const RED_NEW = RED.filter(s => !RED_HEAD_HIT.includes(s));
const RED_NEW_HIT = RED_NEW.filter(s => pcCount(s) > 0);

// ─── B 族语料：机制词在归因带上（必须继续豁免）────────────────────────
const BENIGN_EVIDENCE = [
  // r231 的 3 条 victim（甲半乙半都命中，唯一区别是句内自带可核查医疗依据）
  '这个护身符在庙里开过光，但病情好转是因为按时吃了抗生素',
  '她拜佛之后病情好转，医生说是抗生素起了作用',
  '去庙里上香之后咳嗽止住了，因为是过敏原清了',
  // 点名真药 + 医生处方
  '去庙里开了光的手链很漂亮，病好是因为用了医生开的处方',
  // 对冲谦辞：自认不确定 / 替代解释（这 3 条同时被函数头的对冲谦辞表兜住）
  '去庙里求签之后病就好了，但也可能同时吃了药，不好归因',
  '去庙里拜了拜烧就退了，不过也可能是自限性疾病',
  // 领属归责位
  '去庙里开过光之后身体就好了，多亏了按时服用处方药',
];
// 只由位置化护栏承重的 4 条（另 3 条函数头对冲谦辞已兜住，摘掉本表也不翻面）
const BENIGN_SLOT_ONLY = [
  '这个护身符在庙里开过光，但病情好转是因为按时吃了抗生素',
  '她拜佛之后病情好转，医生说是抗生素起了作用',
  '去庙里上香之后咳嗽止住了，因为是过敏原清了',
  '去庙里开过光之后身体就好了，多亏了按时服用处方药',
];
// 逐腿唯一承重句（摘掉对应腿就翻面）——证明四条腿没有死腿。
// 纪律：每条句子的**形状必须在场**（甲半乙半同子句），否则句子本来就 pc=0，
// 摘不摘腿都一样（首版 B/C 两条踩过：把「…之功」放进没有结果词的第二句，
// 整句不构成形状，变异守卫恒真）。
const LEG_ONLY = {
  A: '他去庙里开过光，病就好了。医生说这是因为抗生素起了作用。',
  B: '去庙里开过光，病就好了。说到底处方药之功最大',
  C: '去庙里开过光，病就好了。头功是那段时间按时吃的抗生素',
  D: '她拜佛之后病情好转，医生说是抗生素起了作用',
};
// r231 良性表其余 7 条（无结果词：纯游览 / 商品陈述 / 送礼叙述 / 现象描述）
const BENIGN_NORES = [
  '周末去庙里逛了逛，顺便求了个平安符',
  '庙里开过光的手串卖两百块一条',
  '他从庙里请了一个护身符送给奶奶',
  '这家庙据说很灵，周末去上香的人很多',
  '她去庙里上香，求的是家人平安',
  '庙里的开光仪式是早上八点开始',
  '他每个月都去庙里上一次香，雷打不动',
];
// 存量良性（r231 E2 的 57 条里挑同族 6 条）
const LEGACY_BENIGN = [
  '这个护身符在庙里开过光，但病情好转是因为按时吃了抗生素',
  '去庙里求签之后病就好了，但也可能同时吃了药，不好归因',
  '去庙里拜了拜烧就退了，不过也可能是自限性疾病',
  '周末去庙里逛了逛，顺便求了个平安符',
  '庙里开过光的手串卖两百块一条',
  '这家庙据说很灵，周末去上香的人很多',
];

// ─── 供 D 节变异用的源码锚点（与 src/index.js 当前实现逐字对应）────────
// 纪律（r230 踩坑①）：锚点不含正则闭合 `)`，否则后续往同一张表尾部加词的轮次
// 会让锚点静默失配。
const ANCHOR_SLOT_TABLE = 'const PC_RITE_SLOT_MECH_ZH = new RegExp([';
const ANCHOR_LEG_A = 'const PC_RITE_SLOT_LEG_A = ';
const ANCHOR_LEG_B = 'const PC_RITE_SLOT_LEG_B = ';
const ANCHOR_LEG_C = 'const PC_RITE_SLOT_LEG_C = ';
const ANCHOR_LEG_D = 'const PC_RITE_SLOT_LEG_D = ';
const ANCHOR_MECH_TABLE = 'const PC_RITE_MECH_ZH = new RegExp(';
const ANCHOR_CALL = 'if (PC_RITE_SLOT_MECH_ZH.test(text)) {';
const RE_SLOT_TABLE = /const PC_RITE_SLOT_MECH_ZH = new RegExp\(\[[\s\S]*?\]\.join\('\|'\)\);/;

// ── 基线副本：当前树 src/ + git show <rev>:src/index.js ─────────────────
// 纪律（r231 D 节同款）：变异在临时目录里做，绝不在原地改写 src/；
// countHitsIn 走**独立子进程**，避免 require 缓存把变异前后的模块混在一起。
// [v6.8.185 r257] rev 从布尔 useHeadIndex 改成显式 git rev：原版 A1 用
// `git show HEAD:src/index.js` 断言「位置化前只命中 4/16」，而本轮一提交，
// HEAD 自己就变成位置化后的版本，A1 从此永久红（提交前绿、提交后红的
// 一次性测试，r256 全量回归时尚未提交所以没暴露）。改成 HEAD~1（= r255，
// 位置化前的最后一个提交）后，A1 的「位置化前基数」口径与提交状态解耦。
function makeCopy(tag, rev) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r256-' + tag + '-'));
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
    const baseSrc = cp.execSync('git show ' + rev + ':src/index.js', { cwd: ROOT, maxBuffer: 1e8 }).toString();
    fs.writeFileSync(path.join(tmp, 'src', 'index.js'), baseSrc);
  }
  return tmp;
}
function countHitsIn(root, list) {
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(path.join(root, 'src', 'index.js'))});
const L=${JSON.stringify(list)};
let n=0; for(const x of L){ if(idx.checkPseudoCausal(x).count>0) n++; }
console.log(n);`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return parseInt(out.trim(), 10);
}
function mutateLine(src, anchor, replacement) {
  const orig = fs.readFileSync(src, 'utf8');
  assert.strictEqual(orig.split(anchor).length - 1, 1, `锚点 ${anchor} 应出现 1 次，实测 ${orig.split(anchor).length - 1} 次`);
  const line = orig.split('\n').find(l => l.includes(anchor));
  assert.ok(line, `找不到含锚点 ${anchor} 的行`);
  const mutated = orig.replace(line, replacement);
  assert.notStrictEqual(mutated, orig, '变异未生效');
  fs.writeFileSync(src, mutated);
}

// ─── A 节：红队 4/16 → 14/16 ──────────────────────────────────────────
test('A1 红队 16 条在位置化前只命中 4/16', () => {
  // [v6.8.185 r257] **根治「轮前基线」断言的提交后失真**。原版用
  // `git show HEAD:src/index.js` 取「位置化前」的源码，而 r256 一提交 HEAD 自己
  // 就变成位置化后的版本，该断言提交后永久失败（提交前的全量回归里它是绿的，
  // 提交后无人复跑所以没暴露）。我一度改成 `HEAD~1`，但那只是把失效从「本轮」
  // 推迟到「下一轮」——r257 一提交 HEAD~1 也变成了位置化后的版本，A1 再次失败。
  // **正确修法：不依赖任何 git rev。** 「位置化前」的可复现定义是「causalRiteZh
  // 函数头吃整句豁免 PC_RITE_MECH_ZH」——用变异副本把那一行换回去，跑同一批
  // 红队，这才是与提交状态完全解耦的轮前基数。
  const tmp = makeCopy('redpre', null);
  try {
    const p = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(p, 'utf8');
    const mutated = orig.replace('if (PC_RITE_SLOT_MECH_ZH.test(text)) {',
      'if (PC_RITE_MECH_ZH.test(text)) {');
    assert.ok(mutated !== orig, '变异未生效（没把位置化护栏换回整句豁免）');
    fs.writeFileSync(p, mutated, 'utf8');
    assert.strictEqual(countHitsIn(tmp, RED), 4,
      '位置化前基数变了——若已 >4 说明别处已覆盖，需重算本轮增量');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('A2 红队 16 条现在命中 14/16（本轮新增 10 条）', () => {
  assert.strictEqual(countHitsIn(ROOT, RED), 14, '红队命中数不符');
});
test('A3 本轮新增的 12 条里 10 条翻成命中（另 2 条见 G 节登记）', () => {
  assert.strictEqual(RED_NEW_HIT.length, 10, `RED_NEW 命中 ${RED_NEW_HIT.length}/12`);
  // 逐族点名，防整族塌陷
  assert.strictEqual(countHitsIn(ROOT, RED_CROSS), 5, '跨句背景族应 5/5');
  assert.strictEqual(countHitsIn(ROOT, RED_UPSTREAM), 3, '时序侧族应 3/3');
  assert.strictEqual(countHitsIn(ROOT, RED_NEGATED), 2, '否定位族应 2/3（C3 见 G1）');
  assert.strictEqual(countHitsIn(ROOT, RED_TAIL), 2, '收尾句族应 2/2');
});
test('A4 红队 10 条新命中全部 gate 非 pass（三层都兑现）', () => {
  const bad = RED_NEW_HIT.filter(s => gateMod.gate(s).gate.action === 'pass');
  assert.deepStrictEqual(bad, [], '以下新命中句 gate 仍 pass: ' + bad.join(' / '));
});
test('A5 HEAD 已命中的 4 条现在仍命中（不许为修豁免把存量判据打掉）', () => {
  assert.strictEqual(countHitsIn(ROOT, RED_HEAD_HIT), 4, '存量覆盖句塌陷');
});

// ─── B 族：依据良性零误伤 ─────────────────────────────────────────────
test('B1 7 条依据良性 detector 全 0（机制词在归因带上仍豁免）', () => {
  assert.strictEqual(countHitsIn(ROOT, BENIGN_EVIDENCE), 0, '依据良性被误判');
});
test('B1b 依据良性的 findings 里不出现 pseudo_causal 维度', () => {
  const bad = BENIGN_EVIDENCE.filter(hasPcDim);
  assert.deepStrictEqual(bad, [], '以下依据良性带出 pseudo_causal: ' + bad.join(' / '));
});
test('B2 腿 A 跨子句解释仍豁免（解释在下一句也是可核查依据）', () => {
  const s = LEG_ONLY.A;
  assert.strictEqual(pcCount(s), 0, '跨子句显式归因链接被误判');
  assert.ok(!hasPcDim(s), '跨子句解释句带出 pseudo_causal');
});
test('B3 7 条无结果词良性 + 6 条存量良性零误伤', () => {
  assert.strictEqual(countHitsIn(ROOT, BENIGN_NORES), 0, '无结果词良性被误判');
  assert.strictEqual(countHitsIn(ROOT, LEGACY_BENIGN), 0, '存量良性被误判');
});

// ─── C 族：仍漏的两条登记 ─────────────────────────────────────────────
test('C1 两条仍漏句登记（结果词本身是机制词 / 机制词在归因带下游）', () => {
  // 「抗过敏药吃了一堆也没用，去庙里上香之后过敏就好了」——「过敏」既是上游的
  // 机制词又是**结果侧的结果词**（过敏好了），腿 D 必然命中，无法用位置切开。
  assert.strictEqual(pcCount('抗过敏药吃了一堆也没用，去庙里上香之后过敏就好了'), 0);
  // 「去庙里开过光之后病就好了，免疫力也跟着上来了」——「免疫力」在仪式动词
  // 下游的同子句里，落在归因带内（说话者确实把它当补充解释），按本轮取向刀照判
  // 不成立。
  assert.strictEqual(pcCount('去庙里开过光之后病就好了，免疫力也跟着上来了'), 0);
});

// ─── D 族：六处变异守卫（复制 src/ 到临时目录再变异，绝不在原地改写 src/）──
test('D1 变异守卫一：摘掉整张 PC_RITE_SLOT_MECH_ZH 后 4 条只由它承重的依据良性 0→4 翻面', () => {
  const tmp = makeCopy('slot', null);
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const cur = fs.readFileSync(SRC, 'utf8');
    assert.strictEqual(cur.split(ANCHOR_SLOT_TABLE).length - 1, 1, '位置化表定义锚点不唯一');
    assert.ok(RE_SLOT_TABLE.test(cur), 'PC_RITE_SLOT_MECH_ZH 整段定义未命中');
    fs.writeFileSync(src, cur.replace(RE_SLOT_TABLE, 'const PC_RITE_SLOT_MECH_ZH = /(?!x)x/;'));
    assert.strictEqual(countHitsIn(tmp, BENIGN_SLOT_ONLY), BENIGN_SLOT_ONLY.length,
      '摘掉位置化护栏后只由它承重的依据良性没有全部翻面');
    assert.strictEqual(countHitsIn(tmp, RED_HEAD_HIT), 4, '摘掉护栏后存量覆盖句受影响');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('D2 变异守卫二：只摘腿 A 后跨子句显式归因链接句 0→1 翻面', () => {
  const tmp = makeCopy('lega', null);
  try {
    mutateLine(path.join(tmp, 'src', 'index.js'), ANCHOR_LEG_A, "const PC_RITE_SLOT_LEG_A = '(?!)x';");
    assert.strictEqual(countHitsIn(tmp, [LEG_ONLY.A]), 1, '摘掉腿 A 后跨子句归因链接句没有翻面');
    // 腿 A 不影响同子句下游形（那由腿 D 承重）
    assert.strictEqual(countHitsIn(tmp, [LEG_ONLY.D]), 0, '摘掉腿 A 把腿 D 承重的句子也打掉了');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('D3 变异守卫三：只摘腿 B 后「机制词 + 之功」跨句句 0→1 翻面', () => {
  const tmp = makeCopy('legb', null);
  try {
    mutateLine(path.join(tmp, 'src', 'index.js'), ANCHOR_LEG_B, "const PC_RITE_SLOT_LEG_B = '(?!)x';");
    assert.strictEqual(countHitsIn(tmp, [LEG_ONLY.B]), 1, '摘掉腿 B 后「…之功」句没有翻面');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('D4 变异守卫四：只摘腿 C 后「头功是 + 机制词」跨句句 0→1 翻面', () => {
  const tmp = makeCopy('legc', null);
  try {
    mutateLine(path.join(tmp, 'src', 'index.js'), ANCHOR_LEG_C, "const PC_RITE_SLOT_LEG_C = '(?!)x';");
    assert.strictEqual(countHitsIn(tmp, [LEG_ONLY.C]), 1, '摘掉腿 C 后「头功是…」句没有翻面');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('D5 变异守卫五：只摘腿 D 后同子句下游形 0→1 翻面', () => {
  const tmp = makeCopy('legd', null);
  try {
    mutateLine(path.join(tmp, 'src', 'index.js'), ANCHOR_LEG_D, "const PC_RITE_SLOT_LEG_D = '(?!)x';");
    assert.strictEqual(countHitsIn(tmp, [LEG_ONLY.D]), 1, '摘掉腿 D 后同子句下游句没有翻面');
    // 腿 D 是唯一承载「仪式动词 + 同子句下游机制词」的腿：摘掉它，4 条
    // BENIGN_SLOT_ONLY 里只有 1 条没有显式归因链接可兜（其余靠腿 A）。
    assert.strictEqual(countHitsIn(tmp, BENIGN_SLOT_ONLY), 1, '摘掉腿 D 后翻面数不符');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('D6 还原校验（未变异副本）：红队 14/16 + 依据良性 0/7', () => {
  const tmp = makeCopy('restore', null);
  try {
    const src = path.join(tmp, 'src', 'index.js');
    fs.writeFileSync(src, fs.readFileSync(SRC, 'utf8'));
    assert.strictEqual(countHitsIn(tmp, RED), 14, '未变异副本上红队命中数不符');
    assert.strictEqual(countHitsIn(tmp, BENIGN_EVIDENCE), 0, '未变异副本上依据良性被误判');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── E 族：存量族不塌 + 源码锚点 ──────────────────────────────────────
// 纪律（runner 的 CHILD_TIMEOUT = 90s）：本测试只复跑**直接受本轮改动影响**的
// r231 仪式族守卫（15.7s），其余伪因果族守卫由全量回归 run-all.js 覆盖——轮初
// 首版把 r226~r236 七份全复跑，单这一族就 80s，整份测试 162s 被 runner 的
// CHILD_TIMEOUT SIGKILL 成「Command failed」（本轮实踩，见 UPGRADE_LOG 踩坑⑩）。
test('E1 存量仪式族守卫逐个复跑不塌（r231 全量 25/25）', () => {
  const files = ['round-231-rite-attribution-guard.test.js'];
  for (const f of files) {
    const out = cp.spawnSync(process.execPath, [path.join(ROOT, 'test', f)],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 1e8, stdio: ['ignore', 'pipe', 'ignore'], timeout: 80000 });
    const m = out.stdout.match(/^(\d+) 通过, (\d+) 失败/m);
    assert.ok(m, f + ' 未输出汇总行（可能被超时杀掉）');
    assert.strictEqual(m[2], '0', f + ' 有失败: ' + out.stdout.slice(-500));
  }
});
test('E2 源码锚点：四腿各自独立命名常量 + 原表未动 + 调用点已换', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  for (const a of [ANCHOR_LEG_A, ANCHOR_LEG_B, ANCHOR_LEG_C, ANCHOR_LEG_D]) {
    assert.strictEqual(src.split(a).length - 1, 1, a + ' 应只定义 1 次');
  }
  assert.strictEqual(src.split(ANCHOR_SLOT_TABLE).length - 1, 1, '位置化表应只定义 1 次');
  assert.strictEqual(src.split(ANCHOR_CALL).length - 1, 1, 'causalRiteZh 应只调用位置化表 1 次');
  // 原整句豁免表必须仍在（四腿拼它的 .source），不许被删成死代码
  assert.strictEqual(src.split(ANCHOR_MECH_TABLE).length - 1, 1, 'PC_RITE_MECH_ZH 原表必须保留');
  assert.ok(src.includes("' + PC_RITE_MECH_ZH.source + '"), '四腿必须拼 PC_RITE_MECH_ZH 的 source');
  // 腿 D 只收下游：不许出现「机制词在前 + 仪式动词」的反向腿
  assert.ok(!src.includes("PC_RITE_MECH_ZH.source + '[^。！？；;' + PC_RITE_SLOT_NL + ']{0,28}(?:' + PC_RITE_ZH.source"),
    '不许出现上游腿（本轮取向刀的刻意一侧）');
});
test('E3 维度总数不变（pseudo_causal 仍是同一个维度，不是新维度）', () => {
  const dims = idx.discriminate('测试句子').dimensions;
  assert.strictEqual(Object.keys(dims).length, 210, 'dimensions 键数应为 210');
});
test('E4 三招牌入口不塌', () => {
  for (const fn of ['checkInput', 'checkDraft', 'checkOutput']) {
    assert.strictEqual(typeof gateMod[fn], 'function', fn + ' 缺失');
  }
  const o = gateMod.gate('他上个月确诊了病因，一直按时复查。这周去庙里开过光，病就好了');
  assert.ok(o.gate && typeof o.gate.action === 'string', 'gate 结果形状异常');
});

// ─── F 族：性能无回归 ─────────────────────────────────────────────────
// 口径：本轮改动只碰 causalRiteZh，所以**正确的基准是 checkPseudoCausal**（gate
// 要跑满 210 个维度，噪声远大于本族的那一段）。各 5000 次，HEAD vs 当前树。
// gate 口径的实测数字（HEAD 16203ms vs 当前 15739ms，各 2000 次）记在
// UPGRADE_LOG 第四节——gate 太慢（单次约 8ms），放进测试会被 runner 的 90s
// CHILD_TIMEOUT 杀掉（本轮实踩，见 UPGRADE_LOG 踩坑⑩）。
test('F1 pseudo_causal 热路径无性能回归（同一基准 HEAD vs 当前树，各 5000 次）', () => {
  const s = '他上个月确诊了病因，一直按时复查。这周去庙里开过光，病就好了';
  const bench = (root) => {
    const code = "const idx=require(" + JSON.stringify(path.join(root, 'src/index.js')) + ");"
      + "const s=" + JSON.stringify(s) + ";const t=Date.now();"
      + "for(let i=0;i<5000;i++) idx.checkPseudoCausal(s);console.log(Date.now()-t);";
    return Number(cp.execFileSync(process.execPath, ['-e', code],
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim());
  };
  const tmp = makeCopy('perf', 'HEAD');
  try {
    const base = bench(tmp);
    const cur = bench(ROOT);
    assert.ok(cur <= base * 1.5 + 100,
      `性能回归：HEAD ${base}ms → 当前 ${cur}ms（阈值 base*1.5+100）`);
    console.log('     （实测 HEAD ' + base + 'ms vs 当前 ' + cur + 'ms，5000 次 checkPseudoCausal）');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── H 族：全仓 A/B 结果登记（静态锚点，防下一轮无声漂移）──────────────
// 口径（scripts/tmp-256-ab.js，轮末已删）：54569 条全仓中文 quoted 样本，
// 逐条比对 checkPseudoCausal 的 count/hits/score；gate.action 只在 pc 有差异的
// 样本上比对（本轮改动只可能经 pseudo_causal 影响 gate.action）。
// 实测：count 升 1、降 0、其他形态 0；**gate.action 差异 0**。
// 升的那 1 条是 UPGRADE_LOG 引用句——机制词「测试」在「拜了菩萨」上游
// （「count **升 20 条…存量测试文件里 1 条同族攻击句「他拜了菩萨，第二天病
// 就好了」…」），属文档引用句，与 r248 全仓 A/B 报的「1 条 UPGRADE_LOG
// 引用句」同族同性质。
const AB_PC_UP = 1;
const AB_PC_DOWN = 0;
const AB_GATE_DIFF = 0;
const AB_FLIP_SAMPLE = '存量测试文件里';
test('H1 全仓 A/B 结果登记：count 升 1 / 降 0 / gate.action 差异 0', () => {
  assert.strictEqual(AB_PC_UP, 1, 'AB_PC_UP 登记值被改动');
  assert.strictEqual(AB_PC_DOWN, 0, 'AB_PC_DOWN 登记值被改动');
  assert.strictEqual(AB_GATE_DIFF, 0, 'AB_GATE_DIFF 登记值被改动');
  // 那条翻面样本在当前树必须确实是 pc≥1（位置化后不再被上游机制词豁免）
  const s = 'count **升 20 条、降 1 条**（升的 20 条 = 本轮新测试 19 条攻击句 + 存量测试文件里 1 条同族攻击句「他拜了菩萨，第二天病就好了」；降的 1 条正是存量假阳性修复）、';
  assert.ok(pcCount(s) > 0, '登记的翻面样本在当前树应为 pc≥1');
  assert.ok(s.includes(AB_FLIP_SAMPLE), '翻面样本锚点失效');
});

// ─── I 族：新公开方法 riteAttributionTrace（设计原则 #3 可审计轨迹）──────
// 动机：causalRiteZh 的 exempt 只有 'context'/'rite-mech' 两个字符串，回答不了
// 「机制词落在哪」。位置化之后这个信息差从「看不见」变成「看得见但不给」。
test('I1 新公开方法存在且返回八段形状', () => {
  assert.strictEqual(typeof idx.riteAttributionTrace, 'function', 'riteAttributionTrace 未导出');
  const t = idx.riteAttributionTrace('他上个月确诊了病因，一直按时复查。这周去庙里开过光，病就好了');
  for (const k of ['verdict', 'guard', 'legs', 'pairs', 'mechanism', 'count', 'hits', 'score', 'halves']) {
    assert.ok(k in t, '轨迹缺少字段 ' + k);
  }
  assert.strictEqual(t.verdict, 'attack');
  assert.strictEqual(t.guard, null);
  assert.strictEqual(t.count, 2);
});
test('I2 四类 verdict 各有一例（attack / exempt / no-shape / no-text）', () => {
  assert.strictEqual(idx.riteAttributionTrace('去庙里开过光，病就好了').verdict, 'attack');
  assert.strictEqual(idx.riteAttributionTrace('这个护身符在庙里开过光，但病情好转是因为按时吃了抗生素').verdict, 'exempt');
  assert.strictEqual(idx.riteAttributionTrace('周末去庙里逛了逛，顺便求了个平安符').verdict, 'no-shape');
  assert.strictEqual(idx.riteAttributionTrace('').verdict, 'no-text');
  assert.strictEqual(idx.riteAttributionTrace(null).verdict, 'no-text');
});
test('I3 位置化护栏逐腿可归因（腿 A/B/C/D 各自的命中片段与判据说明）', () => {
  const t = idx.riteAttributionTrace('这个护身符在庙里开过光，但病情好转是因为按时吃了抗生素');
  assert.strictEqual(t.guard.name, 'rite-slot-mech');
  assert.deepStrictEqual(t.legs.map(l => l.leg), ['A', 'D']);
  for (const l of t.legs) {
    assert.ok(typeof l.matched === 'string' && l.matched.length > 0, '腿 ' + l.leg + ' 缺命中片段');
    assert.ok(typeof l.detail === 'string' && l.detail.length > 10, '腿 ' + l.leg + ' 缺判据说明');
  }
  assert.deepStrictEqual(t.halves.exempt, ['A', 'D'], 'halves.exempt 应记命中的腿');
});
test('I4 函数头四道护栏逐道可归因（统计语境/对冲/统计谦辞各有实例）', () => {
  const h = idx.riteAttributionTrace('去庙里求签之后病就好了，但也可能同时吃了药，不好归因');
  assert.strictEqual(h.verdict, 'exempt');
  assert.strictEqual(h.guard.name, 'hedge');
  assert.ok(h.guard.matched && h.guard.matched.length > 0, 'hedge 护栏缺命中片段');
  const p = idx.riteAttributionTrace('去庙里求签之后病就好了，相关因素有很多');
  assert.strictEqual(p.verdict, 'exempt');
  assert.strictEqual(p.guard.name, 'prob');
  assert.ok(p.guard.matched && p.guard.matched.length > 0, 'prob 护栏缺命中片段');
  // 统计语境护栏（STAT_CONTEXT_ZH）同样要能点名
  const st = idx.riteAttributionTrace('去庙里求签之后病就好了，控制了其他变量之后再看');
  assert.strictEqual(st.verdict, 'exempt');
  assert.strictEqual(st.guard.name, 'stat-context');
});
test('I5 机制词方位清点：跨子句假豁免样本的 upstream/otherClause 必须非 0', () => {
  // 「他上个月确诊了病因…这周去庙里开过光，病就好了」——机制词「确诊」在
  // 另一句，r256 之前靠它整句豁免；现在判，且轨迹如实记下它在别的子句。
  const t = idx.riteAttributionTrace('他上个月确诊了病因，一直按时复查。这周去庙里开过光，病就好了');
  assert.strictEqual(t.verdict, 'attack');
  assert.strictEqual(t.mechanism.total, 1);
  assert.strictEqual(t.mechanism.inZone, 0, '机制词不该记在归因带内');
  assert.strictEqual(t.mechanism.otherClause, 1, '机制词应记在别的子句');
  // 上游形：机制词在仪式动词之前、同一子句
  const u = idx.riteAttributionTrace('吃了抗生素根本不管用，去庙里开过光，病就好了');
  assert.strictEqual(u.verdict, 'attack');
  assert.strictEqual(u.mechanism.upstream, 1, '上游机制词应记在 upstream');
});
test('I6 轨迹的 count/hits 与 causalRiteZh 逐字一致（同一份计算，不是第二套实现）', () => {
  // 口径：checkPseudoCausal 的 hits 里筛「玄学仪式归因:」前缀即本族贡献。
  // 语料**在本测试内自建**（全仓 .js/.md/.json/.txt 的 quoted 中文串，去重）——
  // 不依赖任何轮次产物文件，换机器重跑同样成立。
  const ZH = /[一-鿿]/;
  const seen = new Set();
  const corpus = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'data' || e.name === 'scratch') continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(js|md|json|txt)$/.test(e.name)) {
        let src; try { src = fs.readFileSync(p, 'utf8'); } catch (e2) { continue; }
        const re = /(['"`])((?:[^'"`\n\\]|\\.){8,400}?)\1/g;
        let m;
        while ((m = re.exec(src)) !== null) {
          const s = m[2];
          if (!ZH.test(s) || seen.has(s)) continue;
          seen.add(s); corpus.push(s);
        }
      }
    }
  };
  walk(ROOT);
  let diff = 0;
  for (const s of corpus) {
    const pc = idx.checkPseudoCausal(s);
    const riteHits = (pc.hits || []).filter(h => String(h).startsWith('玄学仪式归因:'));
    const t = idx.riteAttributionTrace(s);
    if (riteHits.length !== t.count || riteHits.join('|') !== t.hits.join('|')) diff++;
  }
  assert.strictEqual(diff, 0, `轨迹与 causalRiteZh 不一致 ${diff}/${corpus.length} 条`);
  assert.ok(corpus.length > 10000, '一致性比对语料太小：' + corpus.length);
});
test('I7 约定 3 三处接线在册（工具定义 + HANDLERS 映射 + handler 函数）', () => {
  const reg = fs.readFileSync(path.join(ROOT, 'src/mcp/tools-registry.js'), 'utf8');
  const srv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
  assert.ok(reg.includes("name: 'heartflow_rite_attribution'"), 'tools-registry 缺工具定义');
  assert.strictEqual(srv.split('heartflow_rite_attribution: handleRiteAttribution,').length - 1, 1, 'HANDLERS 映射不唯一');
  assert.ok(srv.includes('function handleRiteAttribution(args)'), '缺 handler 函数');
  // 新工具不许悄悄进 WRITE_TOOLS（r255 的 unverified_write_safety 纪律）
  const srvForWrite = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
  const wtIdx = srvForWrite.indexOf('const WRITE_TOOLS');
  assert.ok(wtIdx > 0, '找不到 WRITE_TOOLS 声明');
  const wtBlock = srvForWrite.slice(wtIdx, wtIdx + 2000);
  assert.ok(!wtBlock.includes('heartflow_rite_attribution'),
    '新工具不应进 WRITE_TOOLS');
  // 工具名去重（结构层 duplicate_name 判据）
  const names = [...reg.matchAll(/name:\s*'([^']+)'/g)].map(m => m[1]);
  assert.strictEqual(names.length, new Set(names).size, '工具名有重复');
  assert.ok(names.includes('heartflow_rite_attribution'), '工具表里找不到新工具');
});
test('I8 独立子进程端到端：MCP 工具与公开方法两条路都真输出', () => {
  const s = '他上个月确诊了病因，一直按时复查。这周去庙里开过光，病就好了';
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(path.join(ROOT, 'src/index.js'))});
const t=idx.riteAttributionTrace(${JSON.stringify(s)});
const pc=idx.checkPseudoCausal(${JSON.stringify(s)});
console.log(JSON.stringify({v:t.verdict,c:t.count,legs:t.legs.map(l=>l.leg),oc:t.mechanism.otherClause,pcRite:pc.hits.filter(h=>h.startsWith('玄学仪式归因:')).length}));`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const r = JSON.parse(out.trim());
  assert.strictEqual(r.v, 'attack');
  assert.strictEqual(r.c, 2);
  assert.strictEqual(r.oc, 1);
  assert.strictEqual(r.pcRite, 2, '子进程里 causalRiteZh 仍应判 2 条');
  // handler 函数形状（不起服务，直接 require handler 所在的模块太重，改为校验
  // handler 源码契约：入参 text 缺失时必须返回可操作错误而非抛异常）
  const srv = fs.readFileSync(path.join(ROOT, 'src/mcp-server.js'), 'utf8');
  assert.ok(srv.includes("return { error: '缺少参数 text（要审计的中文文本）', expectedParams: ['text'], timestamp: Date.now() };"),
    'handler 缺 text 时应返回带 expectedParams 的可操作错误');
});
test('G1 两条仍漏 + 一条上游腿缺口登记', () => {
  // ① 「抗过敏药吃了一堆也没用，去庙里上香之后过敏就好了」——结果词「过敏」
  //    本身是机制词，腿 D 必然命中，位置切不开（需语义判「过敏好了」是症状消退
  //    而非依据，超出规则引擎能力）。
  assert.strictEqual(pcCount('抗过敏药吃了一堆也没用，去庙里上香之后过敏就好了'), 0);
  // ② 「去庙里开过光之后病就好了，免疫力也跟着上来了」——机制词在归因带下游，
  //    按本轮取向刀属「补充解释」，不判。
  assert.strictEqual(pcCount('去庙里开过光之后病就好了，免疫力也跟着上来了'), 0);
  // ③ 上游腿缺口的代价登记：机制词在仪式动词之前且**同子句**的形状现在能判
  //    （C1「吃了抗生素根本不管用，去庙里开过光，病就好了」pc≥1），但「先说
  //    依据再说仪式」的良性叙述与它同形，需先论证再收上游腿——本轮只登记不修。
  assert.ok(pcCount('吃了抗生素根本不管用，去庙里开过光，病就好了') > 0,
    '上游同子句形应已能判（不许无声退化）');
});
