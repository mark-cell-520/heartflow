// test/round-227-pseudo-causal-inverted-take-drug-guard.test.js
// 第 227 轮守卫：pseudo_causal「倒装服药归因」族双向收口
//
// 缺口实测（scripts/tmp-227-probe.js + scripts/tmp-227-branch.js，轮末已删）：
//   改前 10 条同族攻击句 detector 0/10 全漏（gate 全 pass），
//        12 条「点名真药 + 真实药理」良性句 5 条被误伤（pc=1/2、gate rewrite）；
//   改后 攻击 15/15 三层命中（detector + findings + gate），
//        良性 12/12 detector 零命中、findings 不含维度。
//
// 根因两条，同属「服药/疗法归因」一族：
//   ① 召回侧**语序单向**：第⑩支甲半 PC_ACT_LUCK_ZH 的服药臂写作
//      `吃了?[^。]{0,6}(?:药|保健品|补品)`，只认「动词在前」；「对象在前 +
//      服下动词」（这瓶药吃下去 / 那袋香灰喝下去 / 这味偏方服下去）整族零覆盖，
//      且这些句子全句无时序标记，也落不到第①支。
//   ② 精度侧**护栏够不着**：点名真药句「吃了感冒药之后烧就退了，说明对症下药
//      起了作用」被第①支 + 第⑩支双误伤；第⑩支是**强支**，r226 那道机制豁免
//      （PC_MECH_WEAK_ZH）只喂弱支（①⑤⑨），而 PC_MECH_WEAK_ZH 本身也未收录
//      二甲双胍/奥美拉唑/退热贴/疫苗 这些医疗机制词（另 4 条走第①支被误伤）。
//
// 本测试锁定六件事：
//   ① 攻击族三层命中（不只守 action）
//   ② 点名真药 + 真实药理良性族零误伤（并把 HEAD 即非 pass 的登记为字面量）
//   ③ 结构性/语境界线不判（跨句、对冲谦辞、统计谦辞）
//   ④ 五处变异守卫 + 还原校验（甲半表 / 乙半表 / 本族反向护栏 / 第⑩支护栏 /
//      弱支表新增族），全部「复制 src/ 整棵树到临时目录再变异」
//   ⑤ 存量攻击族不塌、存量良性族不涨
//   ⑥ 源码常量完整 + 半身诊断（halves）真的在返回，且机制豁免不许升级成函数级
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
const gateAction = (text) => gateMod.gate(text).gate.action;
function realFindings(text) {
  return (gateMod.gate(text).findings || []).filter(f => f && f.severity > 0);
}
const hasDim = (text, dim) => realFindings(text).some(f => f.dimension === dim);

// ─── 供 D 节变异用的源码锚点（与 src/index.js 当前实现逐字对应）────────
const ANCHOR_INVTAKE = 'const PC_INVTAKE_ZH = /(?:';
const ANCHOR_TAKERES = 'const PC_TAKE_RES_ZH = /(?:';
const ANCHOR_DRUGMECH = 'const PC_DRUG_MECH_ZH = /(?:';
const ANCHOR_BRANCH10_GUARD = 'if (pat === PC_CAUSAL_ZH_PATS[9] && PC_DRUG_MECH_ZH.test(text)) continue;';
// 弱支表尾部新补的「点名真药 + 临床证据」族（整段，D5 摘整段）
const ANCHOR_WEAK_DRUG_TAIL = '|布洛芬|对乙酰氨基酚|阿司匹林|阿莫西林|青霉素|头孢|二甲双胍|胰岛素|奥美拉唑|氯雷他定|连花清瘟|板蓝根|感冒药|退烧药|退热药|止疼药|止痛药|消炎药|抗生素|处方药|非处方药|维生素|钙片|疫苗|免疫[力应]|血糖|糖尿病|退热贴|物理降温|质子泵|前列腺素|组胺|非甾体|药典|临床|对症|剂量|毫克|\\d+\\s*mg';
const ANCHOR_IV_CALL = 'const iv = causalInvertedTakeZh(text);';

// ─── A 节语料：攻击（倒装语序 10 + 正序未点名对象 5）──────────────────
const ATTACK_INV = [
  '这瓶药吃下去烧就退了，肯定是药起了作用',
  '那包药吃下去烧就退了，肯定是药起了作用',
  '这碗符水喝下去病就好了，说明符水显灵',
  '那袋香灰喝下去烧就退了，显然是香灰的功效',
  '这味偏方吃下去烧就退了，肯定是偏方起了作用',
  '那瓶药喝下去咳嗽就停了，一定是药见效了',
  '这包土方吃下去感冒就好了，说明土方有效',
  '那碗药喝下去疼就止住了，显然是药起了作用',
  '这瓶药服下去烧就退了，肯定是这药有效',
  '那杯符水喝下去头就不疼了，说明符水灵验',
];
// 正序未点名对象 2 条：走本轮新支的**正序臂**（PC_INVTAKE_ZH 第二支），
// 存量判据（第⑩支甲半 PC_ACT_LUCK_ZH）根本没有「符水/偏方」这些对象词
const ATTACK_FWD_NEW = [
  '喝了这个偏方，病就好了，看来真有用',
  '喝了这符水病就好了，说明符水显灵',
];
// 正序存量 3 条：由 round-48/220 建的第⑩⑪⑫ 支承重，本轮不许退化
const ATTACK_FWD_LEGACY = [
  '吃了这个药烧就退了，肯定是药起作用',   // 存量（round-220 攻击族）
  '拜了财神之后就签单了',                  // 存量（round-48 攻击族）
  '他戴上幸运手环后比赛就赢了',            // 存量（round-48 攻击族）
];
const ATTACK = ATTACK_INV.concat(ATTACK_FWD_NEW, ATTACK_FWD_LEGACY);

// ─── B 节语料：良性（点名真药 + 真实药理）────────────────────────────
const BENIGN_DRUG = [
  '吃了布洛芬之后烧就退了，说明药效发挥了作用',
  '布洛芬吃下去半小时烧就退了，这是抑制前列腺素合成的结果',
  '服用阿莫西林一周后感染就好了，说明青霉素类成分起效了',
  '吃了二甲双胍之后血糖就降了，说明这个药对我的糖尿病有效',
  '注射胰岛素之后血糖降了，这是外源性补充胰岛素的直接效果',
  '吃了奥美拉唑之后胃酸就少了，说明质子泵抑制剂起了作用',
  '服用抗生素三天后退了烧，说明疗程覆盖了致病菌',
  '吃了氯雷他定之后过敏症状就消了，说明抗组胺成分有效',
  '吃了感冒药之后烧就退了，说明对症下药起了作用',
  '服药之后疼痛就缓解了，说明非甾体抗炎成分在起作用',
  '贴了退热贴之后体温降了，说明物理降温起了作用',
  '打了疫苗之后感染就轻了，说明免疫应答生效了',
  '这瓶感冒药吃下去烧就退了',
];
// HEAD 实测即非 pass 的良性句（被**无关维度**命中，与本轮 pseudo_causal 无关）
// ——登记为字面量防漂移，且不计入 B4 的「全 pass」断言，
// 否则会把存量噪声算成本轮回归（r226 踩坑⑤ 同款纪律）。
const BENIGN_HEAD_NONPASS = {
  '吃了布洛芬之后烧就退了，说明药效发挥了作用': 'rewrite',
  '吃了二甲双胍之后血糖就降了，说明这个药对我的糖尿病有效': 'rewrite',
  '吃了奥美拉唑之后胃酸就少了，说明质子泵抑制剂起了作用': 'rewrite',
  '吃了氯雷他定之后过敏症状就消了，说明抗组胺成分有效': 'rewrite',
  '吃了感冒药之后烧就退了，说明对症下药起了作用': 'rewrite',
  '服药之后疼痛就缓解了，说明非甾体抗炎成分在起作用': 'rewrite',
  '贴了退热贴之后体温降了，说明物理降温起了作用': 'rewrite',
  '打了疫苗之后感染就轻了，说明免疫应答生效了': 'rewrite',
};
const BENIGN_REST = BENIGN_DRUG.filter(s => !(s in BENIGN_HEAD_NONPASS));

// ─── C 节语料：结构性/语境界线（不应判）─────────────────────────────
const BENIGN_STRUCT = [
  // 跨句：两个半身分居两句，是事后叙述不是「服下即愈」的因果断言
  '这瓶药吃下去。三天后他自己好了。',
  '这碗符水喝下去。他第二天自己去了医院。',
  // 对冲谦辞 / 统计谦辞：自认不确定
  '这味偏方吃下去烧就退了，但样本太小不好归因',
  '这味偏方吃下去烧就退了，相关不等于因果',
  // 甲半在场但乙半（症状消退）不在同子句的 24 字窗口内
  '这瓶药吃下去之后他照常上班，一周后体检指标全部正常',
  // 无名对象但没有任何服下动词
  '这瓶药就放在桌上，谁也没动过',
];

// ─── E 节语料：存量族（round-48 建维时的 24 攻击 / 30 良性，与 r226 E 节逐字一致）──
const LEGACY_ATTACK = [
  '上线之后投诉量下降了，所以这次上线就是投诉下降的原因。',
  '自从换了新领导，业绩就一路下滑，显然是新领导把团队带崩了。',
  '自从公司开始抓考勤，离职率就降了，说明抓考勤确实有用。',
  '他一来我们组项目就延期了，看来他就是问题所在。',
  '这部剧播出后当地旅游就火了，可见这部剧带火了整座城市。',
  '换了新 Logo 之后销量起来了，说明新 Logo 是成功的。',
  '去年开始用新系统，从那以后事故就没再出过，可见新系统解决了安全隐患。',
  '自从老板每天早会后，迟到的人就少了，说明早会制度立竿见影。',
  '这次促销一结束，退货量就上来了，显然促销把不合适的人吸引来了。',
  '调整了首页布局之后留存就涨了，证明之前的布局确实有问题。',
  '我把闹钟提前半小时后，上班就不再迟到了，可见闹钟是关键。',
  '团队加了新人之后，代码缺陷率下降了，说明新人培训起了作用。',
  '自从搬进了新办公室，大家的加班反而变少了，看来环境改善提高了效率。',
  '上了新考勤机以来，没人再忘打卡了，说明机器比制度管用。',
  '这两次延期都发生在你值班那周，所以问题就出在你身上。',
  '前年亏今年赚，中间只差了一次团建，显然是团建把士气带起来了。',
  '昨天改了配置，今天服务就稳了，说明就是配置的问题。',
  '自从改了餐标，食堂抱怨少了，可见抱怨都是钱没给够。',
  '他接手后投诉立刻少了，说明前任主管根本不会管理。',
  '发布新版本后崩溃率下降，证明是旧版本的锅。',
  '改了标题风格之后阅读量翻倍，可见读者就吃这一套。',
  '换了供应商之后交期变短，说明这家供应商明显更专业。',
  '下雨天的销售额总是低，所以天气直接决定了我们的业绩。',
  '周一出事故最多，可见周一大家状态最差。',
];
const LEGACY_BENIGN = [
  '上线之后投诉量有所下降，我们也同步调整了客服排班，具体原因还要再看两周数据。',
  '换了新领导之后业绩有变化，但这几个月市场环境也变了很多，不好归因。',
  '考勤收紧后离职率有下降，同期也普调了薪资，两件事混在一起还看不出主因。',
  '项目延期发生在他加入之后，但他只负责后端，延期主要在前端联调。',
  '旅游热度上升与剧的播出时间接近，但同期还有免门票政策，权重待评估。',
  '新 Logo 上线和销量回暖都发生在三季度，我们还做了两轮促销，需要拆开看。',
  '崩溃率下降与发版时间重合，不过同期还换了机器，不能直接归因。',
  '早会后迟到变少，也可能是天气变冷大家出门更早了。',
  '改配置后服务变稳，我怀疑跟当晚流量下降也有关，需要再观察。',
  '换了供应商后交期变短，今年整体物流都比去年通畅。',
  '采用新架构后请求 Latency 从 800ms 降到 120ms。',
  '这个版本发布后崩溃率从 2.1% 降到 0.4%。',
  '改版之后日活从 3 万涨到 4.5 万。',
  '灰度上线后转化率提升了 30%。',
  '去年导入新 CRM 后，销售人均单量提升了 1.8 倍。',
  '算法调整后检索准确率从 71% 提到 79%。',
  '六点之后地铁明显宽松很多。',
  '大雨之后水库水位涨了两米。',
  '国庆假期之后机票价格普遍回落。',
  '考试结束后图书馆的空位就多了。',
  '我们给查询加了索引，Explain 显示扫描行数从 120 万降到 3 千，慢查询随之消失。',
  '增加了缓存之后接口耗时降到 40ms，因为重复计算被省掉了。',
  '把超时从 30s 改成 5s，用户投诉中「转圈」的描述少了很多。',
  '加了单元测试之后线上回滚次数下降，边界 case 在提测前就被挡住了。',
  '换上 SSD 后编译时间从 14 分钟降到 3 分钟。',
  '灰度只放 5% 流量，有问题可以立刻关掉。',
  '上线后我们盯着看板守了半小时，没有异常再走人。',
  '发版后先观察 24 小时，指标不动再回滚。',
  '周一的事故率最高，p<0.05，样本 14 个月。',
  '下雨天销售额低，r=-0.62，是强相关不是因果。',
];

test(`A1 攻击句 detector 命中（${ATTACK.length} 条）`, () => {
  const bad = ATTACK.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], `以下攻击句 detector 零命中：\n  ${bad.join('\n  ')}`);
});
test(`A2 攻击句 findings 含 pseudo_causal（${ATTACK.length} 条）`, () => {
  const bad = ATTACK.filter(s => !hasDim(s, 'pseudo_causal'));
  assert.deepStrictEqual(bad, [], `以下攻击句 findings 不含 pseudo_causal：\n  ${bad.join('\n  ')}`);
});
test(`A3 攻击句 gate 非 pass（${ATTACK.length} 条）`, () => {
  const bad = ATTACK.filter(s => gateAction(s) === 'pass');
  assert.deepStrictEqual(bad, [], `以下攻击句 gate 为 pass：\n  ${bad.join('\n  ')}`);
});
test(`A4 倒装族每条都带半身诊断（halves.act>0 且 halves.res>0）`, () => {
  for (const s of ATTACK_INV) {
    const r = idx.checkPseudoCausal(s);
    const iv = r.hits.filter(h => String(h).startsWith('倒装服药归因:'));
    assert.ok(iv.length === 1, `「${s}」应恰好 1 条倒装服药命中，实测 ${iv.length}`);
    assert.ok(iv[0].includes('→'), `「${s}」命中串应含甲半→乙半诊断，实测 ${iv[0]}`);
  }
});

test(`B1 点名真药良性句 detector 零命中（${BENIGN_DRUG.length} 条）`, () => {
  const bad = BENIGN_DRUG.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad.map(s => `${s} → ${pcCount(s)}`), [], '以下良性句被误伤');
});
test(`B2 点名真药良性句 findings 不含 pseudo_causal（${BENIGN_DRUG.length} 条）`, () => {
  const bad = BENIGN_DRUG.filter(s => hasDim(s, 'pseudo_causal'));
  assert.deepStrictEqual(bad, [], `以下良性句 findings 含 pseudo_causal：\n  ${bad.join('\n  ')}`);
});
test(`B3 良性句 gate 现值登记（${Object.keys(BENIGN_HEAD_NONPASS).length} 条 HEAD 即非 pass，防漂移）`, () => {
  for (const [s, a] of Object.entries(BENIGN_HEAD_NONPASS)) {
    assert.strictEqual(gateAction(s), a, `「${s}」HEAD 现值应为 ${a}，实测 ${gateAction(s)}`);
  }
});
test(`B4 其余 ${BENIGN_REST.length} 条良性句 gate 全 pass`, () => {
  const bad = BENIGN_REST.filter(s => gateAction(s) !== 'pass');
  assert.deepStrictEqual(bad, [], `以下良性句 gate 非 pass：\n  ${bad.join('\n  ')}`);
});

test(`C1 结构性/语境界线不判（${BENIGN_STRUCT.length} 条 detector 零命中）`, () => {
  const bad = BENIGN_STRUCT.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad.map(s => `${s} → ${pcCount(s)}`), [], '以下界线句被误判');
});

// ─── D 节：变异守卫（复制 src/ 整棵树到临时目录再变异，绝不在原地改写 src/）──
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r227-' + tag + '-'));
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
function countHitsIn(tmp, list) {
  const out = cp.execFileSync(process.execPath,
    ['-e', `const idx=require(${JSON.stringify(path.join(tmp, 'src', 'index.js'))});
const L=${JSON.stringify(list)};
let n=0; for(const x of L){ if(idx.checkPseudoCausal(x).count>0) n++; }
console.log(n);`],
    { encoding: 'utf8' });
  return parseInt(out.trim(), 10);
}
function mutate(tag, fn) {
  const tmp = copySrc(tag);
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    const mutated = fn(orig);
    assert.notStrictEqual(mutated, orig, '变异未生效');
    fs.writeFileSync(src, mutated, 'utf8');
    return tmp;
  } finally { /* tmp 由调用方删 */ }
}

test(`D1 变异守卫一：摘掉甲半表 PC_INVTAKE_ZH 后 ${ATTACK_INV.length} 条倒装攻击句必须重新漏判`, () => {
  const tmp = copySrc('invtake');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.strictEqual(orig.split(ANCHOR_INVTAKE).length - 1, 1, 'PC_INVTAKE_ZH 定义锚点不唯一');
    // 整行替换（只换 `const PC_INVTAKE_ZH = ` 前缀会把后面的正则体留在行内变成语法错误）
    const mutated = orig.replace(/const PC_INVTAKE_ZH = [^\n]*;/m, 'const PC_INVTAKE_ZH = /(?!x)x/;');
    assert.ok(!mutated.includes(ANCHOR_INVTAKE), '变异后甲半表仍在');
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(src, mutated, 'utf8');
    const n = countHitsIn(tmp, ATTACK_INV);
    assert.strictEqual(n, 0, `摘掉甲半表后仍有 ${n}/${ATTACK_INV.length} 条命中，该表可能不承重`);
    const n2 = countHitsIn(tmp, ATTACK_FWD_NEW);
    assert.strictEqual(n2, 0, `摘掉甲半表后正序臂仍有 ${n2}/${ATTACK_FWD_NEW.length} 条命中，正序臂可能不承重`);
    const kept = countHitsIn(tmp, ATTACK_FWD_LEGACY);
    assert.strictEqual(kept, ATTACK_FWD_LEGACY.length,
      `存量族（第⑩⑪⑫支承重）不应受影响，实测 ${kept}/${ATTACK_FWD_LEGACY.length}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test(`D2 变异守卫二：摘掉乙半表 PC_TAKE_RES_ZH 后倒装攻击句必须重新漏判`, () => {
  const tmp = copySrc('takeres');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.strictEqual(orig.split(ANCHOR_TAKERES).length - 1, 1, 'PC_TAKE_RES_ZH 定义锚点不唯一');
    const mutated = orig.replace(/const PC_TAKE_RES_ZH = [^\n]*;/m, 'const PC_TAKE_RES_ZH = /(?!x)x/;');
    assert.ok(!mutated.includes(ANCHOR_TAKERES), '变异后乙半表仍在');
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(src, mutated, 'utf8');
    const n = countHitsIn(tmp, ATTACK_INV);
    assert.strictEqual(n, 0, `摘掉乙半表后仍有 ${n}/${ATTACK_INV.length} 条命中，该表可能不承重`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test(`D3 变异守卫三：摘掉本族反向护栏 PC_DRUG_MECH_ZH 后点名真药句必须重新被误命中`, () => {
  const tmp = copySrc('drugmech');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.strictEqual(orig.split(ANCHOR_DRUGMECH).length - 1, 1, 'PC_DRUG_MECH_ZH 定义锚点不唯一');
    const mutated = orig.replace(/const PC_DRUG_MECH_ZH = [^\n]*;/m, 'const PC_DRUG_MECH_ZH = /(?!x)x/;');
    assert.ok(!mutated.includes(ANCHOR_DRUGMECH), '变异后反向护栏仍在');
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(src, mutated, 'utf8');
    // 「这瓶感冒药吃下去烧就退了」只有本族护栏挡着，摘掉必须重新被误命中
    const n = countHitsIn(tmp, ['这瓶感冒药吃下去烧就退了']);
    assert.strictEqual(n, 1, `摘掉反向护栏后该良性句未重新被误命中（实测 ${n}），护栏可能是摆设`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('D4 变异守卫四：摘掉第⑩支的点名真药护栏后存量误伤句必须重新被误命中', () => {
  const tmp = copySrc('branch10');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.strictEqual(orig.split(ANCHOR_BRANCH10_GUARD).length - 1, 1, '第⑩支护栏锚点不唯一');
    const mutated = orig.replace(ANCHOR_BRANCH10_GUARD, '');
    assert.ok(!mutated.includes(ANCHOR_BRANCH10_GUARD), '变异后第⑩支护栏仍在');
    fs.writeFileSync(src, mutated, 'utf8');
    // HEAD 实测该句 pc=2（第①支 + 第⑩支双误伤）；本轮 PC_MECH_WEAK_ZH 补了
    // 「感冒药/对症」后第①支已豁免，只剩第⑩支这一路——摘掉第⑩支护栏后应回到 1。
    const out = cp.execFileSync(process.execPath,
      ['-e', `const idx=require(${JSON.stringify(path.join(tmp, 'src', 'index.js'))});
console.log(idx.checkPseudoCausal('吃了感冒药之后烧就退了，说明对症下药起了作用').count);`],
      { encoding: 'utf8' });
    assert.strictEqual(parseInt(out.trim(), 10), 1,
      `摘掉第⑩支护栏后该句应回到 count 1（第⑩支误伤重现），实测 ${out.trim()}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('D5 变异守卫五：弱支表摘掉新补的点名真药族后 4 条第①支误伤必须重现', () => {
  const tmp = copySrc('weakdrug');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.strictEqual(orig.split(ANCHOR_WEAK_DRUG_TAIL).length - 1, 1, '弱支表新增族锚点不唯一');
    const mutated = orig.replace(ANCHOR_WEAK_DRUG_TAIL, '');
    assert.ok(!mutated.includes(ANCHOR_WEAK_DRUG_TAIL), '变异后弱支表新增族仍在');
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(src, mutated, 'utf8');
    const victims = [
      '吃了二甲双胍之后血糖就降了，说明这个药对我的糖尿病有效',
      '吃了奥美拉唑之后胃酸就少了，说明质子泵抑制剂起了作用',
      '贴了退热贴之后体温降了，说明物理降温起了作用',
      '打了疫苗之后感染就轻了，说明免疫应答生效了',
    ];
    const out = cp.execFileSync(process.execPath,
      ['-e', `const idx=require(${JSON.stringify(path.join(tmp, 'src', 'index.js'))});
const L=${JSON.stringify(victims)};
for(const x of L) console.log(idx.checkPseudoCausal(x).count);`],
      { encoding: 'utf8' });
    const counts = out.trim().split('\n').map(Number);
    victims.forEach((s, i) => {
      assert.ok(counts[i] > 0, `「${s}」摘掉新增族后未重新被误命中（实测 ${counts[i]}），该族可能是摆设`);
    });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('D6 还原校验：五处变异点原文都在 src/index.js 里且改动互不重叠', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  for (const [name, anchor] of Object.entries({
    PC_INVTAKE_ZH: ANCHOR_INVTAKE,
    PC_TAKE_RES_ZH: ANCHOR_TAKERES,
    PC_DRUG_MECH_ZH: ANCHOR_DRUGMECH,
    '第⑩支护栏': ANCHOR_BRANCH10_GUARD,
    弱支表新增族: ANCHOR_WEAK_DRUG_TAIL,
    子判据调用点: ANCHOR_IV_CALL,
  })) {
    assert.ok(src.includes(anchor), `源码中找不到「${name}」锚点`);
    assert.strictEqual(src.split(anchor).length - 1, 1, `「${name}」锚点应唯一，实测 ${src.split(anchor).length - 1} 处`);
  }
});

test(`E1 存量攻击族 detector 命中 ${LEGACY_ATTACK.length} 条`, () => {
  const bad = LEGACY_ATTACK.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], `以下存量攻击句 detector 零命中：\n  ${bad.join('\n  ')}`);
});
test(`E2 存量良性族 detector 零命中 ${LEGACY_BENIGN.length} 条`, () => {
  const bad = LEGACY_BENIGN.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad.map(s => `${s} → ${pcCount(s)}`), [], '以下存量良性句被误伤');
});

test('F 源码常量完整 + 半身诊断返回 + 豁免不许升级成函数级', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  assert.ok(/const PC_INVTAKE_ZH = \/\(\?:/.test(src), 'PC_INVTAKE_ZH 甲半表不存在');
  assert.ok(/const PC_TAKE_RES_ZH = \/\(\?:/.test(src), 'PC_TAKE_RES_ZH 乙半表不存在');
  assert.ok(/const PC_DRUG_MECH_ZH = \/\(\?:/.test(src), 'PC_DRUG_MECH_ZH 反向护栏表不存在');
  assert.ok(src.includes('function causalInvertedTakeZh(text)'), '倒装服药子判据函数不存在');
  assert.ok(src.includes(ANCHOR_IV_CALL), 'checkPseudoCausal 未调用倒装服药子判据');
  assert.strictEqual(src.split('function causalInvertedTakeZh(text)').length - 1, 1, '子判据函数应只定义 1 次');
  assert.strictEqual(src.split(ANCHOR_IV_CALL).length - 1, 1, '子判据调用点应唯一');
  assert.ok(src.includes(ANCHOR_BRANCH10_GUARD), '第⑩支未接点名真药护栏');
  // 机制豁免不许升级成函数级豁免（r226 F 节同款纪律）——只许逐支护栏
  assert.ok(!/if \(PC_DRUG_MECH_ZH\.test\(text\)\) return \{ count: 0/.test(src),
    'PC_DRUG_MECH_ZH 不许升级成函数级豁免（那会连⑩⑪⑫⑬⑭ 的真攻击一起放掉）');
  // 半身诊断真的在返回（D 节变异守卫的判据来源）
  const r = idx.checkPseudoCausal('这瓶药吃下去烧就退了，肯定是药起了作用');
  assert.ok(r.hits.some(h => String(h).startsWith('倒装服药归因:') && String(h).includes('→')),
    '倒装服药命中串未带甲半→乙半半身诊断');
});
