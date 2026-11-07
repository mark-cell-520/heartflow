// test/round-230-sleep-attribution-guard.test.js
// 第 230 轮守卫：pseudo_causal 乙半表「入睡」族扩面 + r227 族反向护栏补依据词
//
// 缺口实测（scripts/tmp-230-probe.js + scripts/tmp-230-ab.js，轮末已删）：
//   改前 18 条「未点名对象 + 服下即困/入睡」族攻击句 detector 0/18、gate 全 pass；
//   改后 18 条三层命中（detector + findings + gate 非 pass），
//        良性（点名真药 10 + 依据/替代解释 3 + 非药对象 2）与界线 5 条零误伤不变。
//
// 根因：r227 建的乙半表 PC_TAKE_RES_ZH 十二个结果词全是「症状消退/获益」
// （退了/好了/见效/不疼/止住/消了/轻了/康复/缓解/压住/稳了），**没有一条睡眠词**，
// 于是「这片药吞下去人就睡着了」「吃了这个保健品之后当晚就睡着了」整族零覆盖。
// 该表被 causalInvertedTakeZh（r227）与 causalSupplementZh（r229，经
// PC_SUPP_RES_ZH 拼装复用）两个子判据共用，扩一行同时收口两族。
//
// 取向裁定（本轮裁）：**「未点名对象 + 服下即困/入睡」判，「点名真药（安眠药/
// 褪黑素…）+ 医嘱/依据」不判**——与 r227「即愈」/r228「即退烧」/r229「即获益」
// 三刀同构，只是把结果从「愈」换成「困」。精度侧由两张反向表兜住。
//
// 本测试锁定七件事：
//   ① 18 条新攻击句三层命中（不只守 action）
//   ② 良性族零误伤 + gate 不劣化（含本轮新增的 3 条依据/替代解释对照）
//   ③ 结构性/语境界线不判（跨句、对冲谦辞、否定形「睡不着」、无甲半）
//   ④ 四处变异守卫 + 还原校验（整睡眠臂 / 沾枕就着臂 / 不再醒臂 / 反向护栏证据词）
//   ⑤ 存量族不塌（r227 15 + r228 19 + r229 26 攻击 / 44 良性）
//   ⑥ 源码常量完整 + halves 半身诊断 + 新臂不许窜进 PC_CAUSAL_ZH_PATS 十四支
//   ⑦ 两条已知未修（甲半缺口）登记为字面量，防下一轮无声退化或无声修好
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

// ─── 供 D/F 节变异用的源码锚点（与 src/index.js 当前实现逐字对应）────────
const ANCHOR_RES = 'const PC_TAKE_RES_ZH = /(?:';
const ANCHOR_SLEEP = '|睡[着了]';                                  // 睡眠臂起点
const ANCHOR_ZHA = '(?:沾|挨|靠)[枕床][^。]{0,3}[着睡]';            // 沾枕就着臂
const ANCHOR_NOWAKE = '不[再又]?醒[了]?';                          // 不再醒臂
const ANCHOR_MECH = 'const PC_DRUG_MECH_ZH = /(?:';
const ANCHOR_SUPP_MECH = 'const PC_SUPP_MECH_ZH = /(?:';
const ANCHOR_EVID = '|双盲|随机|对照组|安慰剂|样本量|大样本|自限|自愈|个例|孤例';
const ANCHOR_IV_FN = 'function causalInvertedTakeZh(text)';
const ANCHOR_SUP_FN = 'function causalSupplementZh(text)';

// ─── A 节语料：攻击（r227 倒装服药族 12 + r229 保健品族 6）────────────
// A1 走 causalInvertedTakeZh：甲半 PC_INVTAKE_ZH 倒装臂（这/那/一 + 量词 +
// 未点名对象 + 服下动词）× 新补的睡眠结果词。对象一律未点名（药/汤药/药丸/胶囊）。
const ATTACK_R227_SLEEP = [
  '这片药吞下去人就睡着了',
  '这片药吞下去当晚就睡了个好觉',
  '这颗药吞下去我困得睁不开眼',
  '这包药喝下去，人很快就入睡了',
  '这盒药吃下去，当晚就一觉到天亮',
  '那片药吞下去夜里就不醒了',
  '这味汤药喝下去，当晚就睡踏实了',
  '这颗胶囊吞下去，沾枕就着',
  '这瓶药喝下去，我躺下就睡着了',
  '吞下这颗药丸人就睡着了',
  '那片药吞下去我就断片了似的睡过去',
  '那瓶药喝下去当晚就睡得死沉',
];
// A2 走 causalSupplementZh：甲半 PC_SUPP_ZH（服下动词/倒装 + 泛指指示 + 泛类
// 对象保健品/补品/营养品）× 经 PC_SUPP_RES_ZH 拼装复用进来的同一个睡眠臂。
const ATTACK_R229_SLEEP = [
  '吃了这个保健品之后当晚就睡着了',
  '吃了这个补品，现在沾枕就着',
  '这个保健品吃下去，当晚就睡了个整觉',
  '喝了这个营养品之后入睡就快了',
  '天天吃这个保健品，现在一觉睡到天亮',
  '吃了这个保健品，夜里就不再醒了',
];
const ATTACK = ATTACK_R227_SLEEP.concat(ATTACK_R229_SLEEP);
// D2/D3 变异守卫的 victim：只承重于单条臂的句子
const ATTACK_ZHA = ['这颗胶囊吞下去，沾枕就着', '吃了这个补品，现在沾枕就着'];
const ATTACK_NOWAKE = ['那片药吞下去夜里就不醒了', '吃了这个保健品，夜里就不再醒了'];
const ATTACK_OTHER = ATTACK.filter(s => !ATTACK_ZHA.includes(s) && !ATTACK_NOWAKE.includes(s));

// ─── B 节语料：良性（点名真药 / 依据 / 非药对象）────────────────────
// HEAD 实测这 10 条 detector 全 0、gate 全 pass——本轮扩面不许把它们拉进来。
const BENIGN = [
  // 点名真药：安眠药/褪黑素 + 医嘱 → 反向表 PC_DRUG_MECH_ZH 放行
  '这片安眠药吞下去人就睡着了',
  '睡前按医嘱服用一片褪黑素，半小时后就能入睡',
  '医生说这是安眠药，吃下半小時就能入睡',
  // 依据 / 替代解释在场：本轮新增的 3 条对照（D4 变异守卫的 victim）
  '这片药吞下去人就睡着了，但双盲实验显示和安慰剂没差别',
  '这片药吞下去人就睡着了，不过样本只有三个，可能是安慰剂效应',
  '喝了这个保健品之后当晚就睡着了，临床双盲已经验证过',
  // 无甲半：非药对象 / 无服下动词
  '他换了遮光窗帘之后，当晚就睡得很好',
  '坚持跑步一个月，现在晚上入睡快多了',
  // 甲半在场但句内无睡眠结果词
  '这个保健品吃了三个月，睡眠一直很好',
  '他每天吃一片维生素，已经坚持三年了',
];
const BENIGN_EVIDENCE = [
  '这片药吞下去人就睡着了，但双盲实验显示和安慰剂没差别',
  '这片药吞下去人就睡着了，不过样本只有三个，可能是安慰剂效应',
  '喝了这个保健品之后当晚就睡着了，临床双盲已经验证过',
];
// 前两条走 causalInvertedTakeZh，由 r227 的反向表 PC_DRUG_MECH_ZH 兜住；
// 第三条走 causalSupplementZh，由 r229 的反向表 PC_SUPP_MECH_ZH 兜住——
// **两张表各自承重**，所以 D4/D4b 分开变异才能分别证明（实测：只摘
// PC_DRUG_MECH_ZH 的证据词时第三条不受影响，2/3 翻转）。
const BENIGN_EVIDENCE_R227 = BENIGN_EVIDENCE.slice(0, 2);
const BENIGN_EVIDENCE_R229 = BENIGN_EVIDENCE.slice(2);

// ─── C 节语料：结构性/语境界线（不应判）─────────────────────────────
const BENIGN_STRUCT = [
  // 跨句：两个半身分居两句，是事后叙述不是「服下即困」的因果断言
  '这片药吞下去。三天后他自己睡着了。',
  // 否定形：乙半 `睡[着了]` 要求「睡」后紧跟 着/了，「睡不着」天然不进
  '这片药吞下去，但我还是睡不着',
  // 对冲谦辞：自认不确定
  '这片药吞下去人就睡着了，但样本太小不好归因',
  // 中性叙述：「该困还是困」不是「困了/困得」
  '这片药吞下去，白天该困还是困',
  // 无名对象但没有任何服下动词
  '这瓶药就放在桌上，谁也没动过',
];

// ─── G 节语料：已知未修（甲半缺口，本轮不动，登记字面量）─────────────
// ① 「吃了这片药人就困了」——**两层都断**：PC_INVTAKE_ZH 正序臂（第三臂）对象表
//    只有 符水/香灰/偏方/…/丸/丹，没有裸「药」（r227 刻意只收第⑩支甲半没有的
//    对象词）；而承接它的第⑩支乙半 PC_RES_LUCK_ZH 也没有睡眠词。要修需同时动
//    两张表，属跨表重构。
// ② 「这服药喝下去当晚就睡得死沉」——**表层根因具有欺骗性**：看着像甲半量词类
//    缺「服」，本轮实测补上「服」后**仍然 0 命中**。真实根因是反向护栏
//    PC_DRUG_MECH_ZH 含「服药」整词，「这服药」命中它 → 整句被豁免。补量词是
//    不承重的死代码（r228 坑③ 同款纪律），已撤回；要修必须同时收窄
//    PC_DRUG_MECH_ZH 的「服药」腿，会动摇 r227/r228 两轮的良性豁免面。
const KNOWN_OPEN = [
  '吃了这片药人就困了',
  '这服药喝下去当晚就睡得死沉',
];

// ─── E 节语料：存量族（r227 15 + r228 19 攻击，逐字沿用）──────────────
const ATTACK_R227 = [
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
  '喝了这个偏方，病就好了，看来真有用',
  '喝了这符水病就好了，说明符水显灵',
  '吃了这个药烧就退了，肯定是药起作用',
  '拜了财神之后就签单了',
  '他戴上幸运手环后比赛就赢了',
];
const ATTACK_R228 = [
  '那支针打下去烧就退了，肯定是针起了作用',
  '这一针打下去烧就退了，肯定是这一针有效',
  '这支针剂打下去立马退烧，看来这一针有效',
  '那支针打下去咳嗽就停了，一定是针见效了',
  '这盒针剂打下去烧就退了，显然是针剂起了作用',
  '这针打下去烧就退了，肯定是这针起了作用',
  '一针打下去烧就退了，肯定是这一针有效',
  '这盒药吃下去烧就退了，肯定是药起了作用',
  '那片药吞下去烧就退了，准是药有效',
  '这粒药丸吃下去烧就退了，肯定是药丸起了作用',
  '那颗胶囊吞下去头疼就止住了，看来胶囊有用',
  '那盒丸吃下去病就好了，一定是丸的功劳',
  '这盒偏方吃下去烧就退了，显然是偏方起了作用',
  '这盒香灰吃下去烧就退了，肯定是香灰显灵',
  '那片丹药吃下去病就好了，说明仙丹灵验',
  '这粒药吞下去烧就退了，肯定是这药有效',
  '那颗药吞下去头就不疼了，说明药灵验',
  '那盒符水喝下去烧就退了，显然是符水的功效',
  '这盒秘方吃下去咳嗽就止住了，一定是秘方见效了',
];
const ATTACK_R229 = [
  '吃了这个保健品之后精神就好了',
  '喝了这个补品之后气色就好了',
  '吃了这个保健品之后睡眠就好了',
  '吃了这保健品之后感冒就少了',
  '吃了这个补品之后体力就好了',
  '他吃了这个保健品，没多久病就好了',
  '吃了这个保健品之后皮肤就变好了',
  '喝了这个补品之后记性就好了',
  '吃了这个保健品之后腰就不疼了',
  '坚持吃这个保健品，这个月业绩就上去了',
  '全办公室都吃这个保健品，这个月没人感冒',
  '隔壁大爷吃了这个保健品，高血压再没犯过',
  '我妈吃了这个补品，二十年的老胃病好了',
  '吃了这个保健品之后孩子成绩就上去了',
  '自从吃了这个保健品，失眠就彻底好了',
  '吃了这个保健品，头就不晕了，看来真有效',
  '他每天吃这个补品，业绩一路翻倍',
  '吃了这个保健品之后运气就好了',
  '王阿姨吃了这个保健品，广场舞跳得更有劲了',
  '吃了这个保健品之后血糖就降了',
  '这个保健品吃下去病就好了',
  '那盒补品喝下去气色就好了',
  '这款营养品吞下去人就精神起来了',
  '这保健品吃下去感冒就少了',
  '某种保健品吃下去失眠就好了',
  '吃了这个保健品之后财运就来了',
];
const BENIGN_R227 = [
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
const BENIGN_R228 = [
  '这盒感冒药吃下去烧就退了',
  '这片布洛芬吞下去烧就退了',
  '这盒阿莫西林吃下去感染就好了，说明疗程覆盖了致病菌',
  '这针胰岛素打下去血糖就稳了',
  '这支疫苗打下去感染就轻了，说明免疫应答生效了',
  '这片降压药吞下去血压就稳了',
  '那片奥美拉唑吞下去胃酸就少了',
  '这盒蒙脱石散吃下去腹泻就止住了',
  '这片安眠药吞下去人就睡着了',
  '这支流感疫苗打下去今年就没感冒',
];
const BENIGN_R229 = [
  '吃了螺旋藻片之后感冒就少了',
  '吃了蛋白粉之后肌肉就长了',
  '喝了深海鱼油之后血脂就降了',
  '吃了钙片之后腰就不疼了',
  '喝了乳酸菌素片之后肠胃就好了',
  '吃了辅酶Q10之后心慌就少了',
  '吃了叶黄素之后眼睛就不干了',
  '吃了葡萄籽之后皮肤就白了',
  '吃了月见草之后痛经就好了',
  '吃了番茄红素之后前列腺指标就正常了',
  '吃了螺旋藻片之后感冒少了，因为螺旋藻多糖能增强免疫力',
  '每天补充维生素C，感冒病程从7天缩短到3天',
  '喝了蛋白粉配合训练，三个月深蹲从60kg涨到100kg',
  '吃了深海鱼油之后血脂降了，医嘱是继续服用',
  '这款保健品临床实验做了两年，样本三千人',
  '钙片加维生素D一起补，骨密度从-1.2回到0.3',
  '乳酸菌素片调理肠胃，剂量按说明书来',
  '深海鱼油含欧米伽3，能降甘油三酯',
  '吃了螺旋藻片之后精神是好了点，但也可能是最近睡得早',
  '补了三年蛋白粉，体脂率从25%降到18%',
  '吃了螺旋藻这种保健品，双盲实验证明能预防感冒',
];
const LEGACY_ATTACK = ATTACK_R227.concat(ATTACK_R228, ATTACK_R229);
const LEGACY_BENIGN = BENIGN_R227.concat(BENIGN_R228, BENIGN_R229);

// ─── D 节：变异守卫（复制 src/ 整棵树到临时目录再变异，绝不在原地改写 src/）──
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r230-' + tag + '-'));
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

// ─── A 节：三层命中 ─────────────────────────────────────────────────
test(`A1 入睡族攻击句 detector 命中（${ATTACK.length} 条）`, () => {
  const bad = ATTACK.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], `以下攻击句 detector 零命中：\n  ${bad.join('\n  ')}`);
});
test(`A2 入睡族攻击句 findings 含 pseudo_causal（${ATTACK.length} 条）`, () => {
  const bad = ATTACK.filter(s => !hasDim(s, 'pseudo_causal'));
  assert.deepStrictEqual(bad, [], `以下攻击句 findings 不含维度：\n  ${bad.join('\n  ')}`);
});
test(`A3 入睡族攻击句 gate 非 pass（${ATTACK.length} 条）`, () => {
  const bad = ATTACK.filter(s => gateAction(s) === 'pass');
  assert.deepStrictEqual(bad, [], `以下攻击句 gate 仍 pass：\n  ${bad.join('\n  ')}`);
});
test('A4 两个子判据各接住自己那一半（r227 12 / r229 6）', () => {
  const a = ATTACK_R227_SLEEP.filter(s => pcCount(s) === 0);
  const b = ATTACK_R229_SLEEP.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual({ r227: a, r229: b }, { r227: [], r229: [] }, '两个族各有漏判');
});

// ─── B 节：良性零误伤 + gate 不劣化 ─────────────────────────────────
test(`B1 良性族 detector 零命中（${BENIGN.length} 条）`, () => {
  const bad = BENIGN.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad.map(s => `${s} → ${pcCount(s)}`), [], '以下良性句被本轮误伤');
});
test(`B2 良性族 findings 不含 pseudo_causal（${BENIGN.length} 条）`, () => {
  const bad = BENIGN.filter(s => hasDim(s, 'pseudo_causal'));
  assert.deepStrictEqual(bad, [], '以下良性句 findings 含维度');
});
test(`B3 良性族 gate 不劣化（${BENIGN.length} 条全 pass，HEAD 实测即全 pass）`, () => {
  const bad = BENIGN.filter(s => gateAction(s) !== 'pass');
  assert.deepStrictEqual(bad.map(s => `${s} → ${gateAction(s)}`), [], '以下良性句 gate 非 pass');
});
test(`B4 依据/替代解释对照 3 条 detector 零命中（本轮反向护栏的直接证据）`, () => {
  const bad = BENIGN_EVIDENCE.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad.map(s => `${s} → ${pcCount(s)}`), [], '依据在场仍被误判');
});

// ─── C 节：界线 ─────────────────────────────────────────────────────
test(`C1 结构性/语境界线不判（${BENIGN_STRUCT.length} 条 detector 零命中）`, () => {
  const bad = BENIGN_STRUCT.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad.map(s => `${s} → ${pcCount(s)}`), [], '以下界线句被误判');
});

// ─── D 节：四处变异守卫 + 还原校验 ─────────────────────────────────
test('D1 变异守卫一：摘掉整个睡眠臂后 18 条攻击句必须重新漏判、存量 60 条不受影响', () => {
  const tmp = copySrc('sleep');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.strictEqual(orig.split(ANCHOR_RES).length - 1, 1, 'PC_TAKE_RES_ZH 定义锚点不唯一');
    const line = orig.split('\n').find(l => l.includes(ANCHOR_RES));
    assert.ok(line, '找不到 PC_TAKE_RES_ZH 定义行');
    assert.strictEqual(line.split(ANCHOR_SLEEP).length - 1, 1, `睡眠臂锚点应出现 1 次，实测 ${line.split(ANCHOR_SLEEP).length - 1} 次`);
    // 从 `|睡[着了]` 起整段砍到行尾（睡眠臂是本轮追加的尾部段，其后无存量词）
    const mutated = orig.replace(/const PC_TAKE_RES_ZH = [^\n]*;/m,
      line.slice(0, line.indexOf(ANCHOR_SLEEP)) + ')/;');
    assert.notStrictEqual(mutated, orig, '变异未生效（D1）');
    fs.writeFileSync(src, mutated);
    assert.strictEqual(countHitsIn(tmp, ATTACK), 0, '摘掉睡眠臂后新攻击句仍命中');
    assert.strictEqual(countHitsIn(tmp, LEGACY_ATTACK), LEGACY_ATTACK.length,
      '摘掉睡眠臂后存量攻击句有塌陷');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test(`D2 变异守卫二：只摘「沾枕就着」臂后 ${ATTACK_ZHA.length} 条 victim 漏判、其余 ${ATTACK_OTHER.length} 条仍命中`, () => {
  const tmp = copySrc('zha');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    const line = orig.split('\n').find(l => l.includes(ANCHOR_RES));
    assert.strictEqual(line.split(ANCHOR_ZHA).length - 1, 1, '沾枕就着臂锚点应出现 1 次');
    const mutated = orig.replace(/const PC_TAKE_RES_ZH = [^\n]*;/m,
      line.split('|' + ANCHOR_ZHA).join(''));
    assert.notStrictEqual(mutated, orig, '变异未生效（D2）');
    fs.writeFileSync(src, mutated);
    assert.strictEqual(countHitsIn(tmp, ATTACK_ZHA), 0, '摘掉沾枕就着臂后 victim 仍命中');
    assert.strictEqual(countHitsIn(tmp, ATTACK_OTHER), ATTACK_OTHER.length, '其余攻击句被连带打掉');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test(`D3 变异守卫三：只摘「不再醒」臂后 ${ATTACK_NOWAKE.length} 条 victim 漏判、其余 ${ATTACK_OTHER.length} 条仍命中`, () => {
  const tmp = copySrc('nowake');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    const line = orig.split('\n').find(l => l.includes(ANCHOR_RES));
    assert.strictEqual(line.split(ANCHOR_NOWAKE).length - 1, 1, '不再醒臂锚点应出现 1 次');
    const mutated = orig.replace(/const PC_TAKE_RES_ZH = [^\n]*;/m,
      line.split('|' + ANCHOR_NOWAKE).join(''));
    assert.notStrictEqual(mutated, orig, '变异未生效（D3）');
    fs.writeFileSync(src, mutated);
    assert.strictEqual(countHitsIn(tmp, ATTACK_NOWAKE), 0, '摘掉不再醒臂后 victim 仍命中');
    assert.strictEqual(countHitsIn(tmp, ATTACK_OTHER), ATTACK_OTHER.length, '其余攻击句被连带打掉');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test(`D4 变异守卫四：摘掉 r227 反向表 PC_DRUG_MECH_ZH 的证据词后 ${BENIGN_EVIDENCE_R227.length} 条依据良性句 0→1 重新被误命中、${ATTACK.length} 条攻击不受影响`, () => {
  const tmp = copySrc('mech');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.strictEqual(orig.split(ANCHOR_MECH).length - 1, 1, 'PC_DRUG_MECH_ZH 定义锚点不唯一');
    const line = orig.split('\n').find(l => l.includes(ANCHOR_MECH));
    assert.strictEqual(line.split(ANCHOR_EVID).length - 1, 1, '证据词锚点应出现 1 次');
    const mutated = orig.replace(/const PC_DRUG_MECH_ZH = [^\n]*;/m,
      line.split(ANCHOR_EVID).join(''));
    assert.notStrictEqual(mutated, orig, '变异未生效（D4）');
    fs.writeFileSync(src, mutated);
    assert.strictEqual(countHitsIn(tmp, BENIGN_EVIDENCE_R227), BENIGN_EVIDENCE_R227.length,
      '摘掉证据词后依据良性句没有被重新误命中');
    assert.strictEqual(countHitsIn(tmp, ATTACK), ATTACK.length, '摘掉证据词后攻击句受影响');
    // 第三条走 r229 的反向表，本轮变异不该碰到它（证明两张表作用域分离）
    assert.strictEqual(countHitsIn(tmp, BENIGN_EVIDENCE_R229), 0,
      '摘 PC_DRUG_MECH_ZH 证据词却影响了走 PC_SUPP_MECH_ZH 的句子');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test(`D4b 变异守卫四之二：摘掉 r229 反向表 PC_SUPP_MECH_ZH 的证据词后 ${BENIGN_EVIDENCE_R229.length} 条依据良性句 0→1 重新被误命中`, () => {
  const tmp = copySrc('suppmech');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.strictEqual(orig.split(ANCHOR_SUPP_MECH).length - 1, 1, 'PC_SUPP_MECH_ZH 定义锚点不唯一');
    const line = orig.split('\n').find(l => l.includes(ANCHOR_SUPP_MECH));
    assert.ok(line.includes('临床') && line.includes('双盲'), 'PC_SUPP_MECH_ZH 应含证据词');
    const mutated = orig.replace(/const PC_SUPP_MECH_ZH = [^\n]*;/m,
      line.split('临床').join('__X__').split('双盲').join('__X__'));
    assert.notStrictEqual(mutated, orig, '变异未生效（D4b）');
    fs.writeFileSync(src, mutated);
    assert.strictEqual(countHitsIn(tmp, BENIGN_EVIDENCE_R229), BENIGN_EVIDENCE_R229.length,
      '摘掉证据词后依据良性句没有被重新误命中');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test('D5 还原校验（未变异副本）', () => {
  const tmp = copySrc('restore');
  try {
    assert.strictEqual(countHitsIn(tmp, ATTACK), ATTACK.length, '未变异副本攻击句未全命中');
    assert.strictEqual(countHitsIn(tmp, BENIGN), 0, '未变异副本良性句被误命中');
    assert.strictEqual(countHitsIn(tmp, LEGACY_ATTACK), LEGACY_ATTACK.length, '未变异副本存量攻击句有塌陷');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── E 节：存量族不塌不涨 ──────────────────────────────────────────
test(`E1 存量攻击族不塌（r227 15 + r228 19 + r229 26 = ${LEGACY_ATTACK.length} 条）`, () => {
  const bad = LEGACY_ATTACK.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], `以下存量攻击句塌陷：\n  ${bad.join('\n  ')}`);
});
test(`E2 存量良性族不涨（r227 13 + r228 10 + r229 21 = ${LEGACY_BENIGN.length} 条）`, () => {
  const bad = LEGACY_BENIGN.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad.map(s => `${s} → ${pcCount(s)}`), [], '以下存量良性句被误伤');
});
test(`E3 存量良性族 findings 不含 pseudo_causal（${LEGACY_BENIGN.length} 条）`, () => {
  const bad = LEGACY_BENIGN.filter(s => hasDim(s, 'pseudo_causal'));
  assert.deepStrictEqual(bad, [], '以下存量良性句 findings 含维度');
});

// ─── F 节：源码常量完整 + 结构纪律 ─────────────────────────────────
test('F1 乙半表含本轮新增的睡眠臂（7 个结果词族）', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const line = src.split('\n').find(l => l.includes(ANCHOR_RES));
  assert.ok(line, '找不到 PC_TAKE_RES_ZH 定义行');
  for (const arm of ['睡[着了]', '睡过去', '睡踏实', '睡得(?:踏实|死沉|香|沉|安稳)',
    '入睡', '一觉', '不[再又]?醒[了]?', ANCHOR_ZHA, '困[了得]']) {
    assert.ok(line.includes(arm), `乙半表缺少臂：${arm}`);
  }
});
test('F2 反向护栏 PC_DRUG_MECH_ZH 含本轮补的 10 个证据/替代解释词', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const line = src.split('\n').find(l => l.includes(ANCHOR_MECH));
  assert.ok(line, '找不到 PC_DRUG_MECH_ZH 定义行');
  for (const w of ['双盲', '随机', '对照组', '安慰剂', '样本量', '大样本', '自限', '自愈', '个例', '孤例']) {
    assert.ok(line.includes(w), `反向护栏缺少证据词：${w}`);
  }
  // 纪律：仍然不收裸「药」（r227/r228 两轮同款，收了会放掉未点名攻击句）
  assert.ok(!/\|药\|/.test(line), '反向护栏被收进了裸「药」');
});
test('F3 两个子判据函数各定义 1 次且 halves 半身诊断仍在返回', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  assert.strictEqual(src.split(ANCHOR_IV_FN).length - 1, 1, 'causalInvertedTakeZh 应只定义 1 次');
  assert.strictEqual(src.split(ANCHOR_SUP_FN).length - 1, 1, 'causalSupplementZh 应只定义 1 次');
  assert.ok(/halves:\s*\{\s*act:\s*actN,\s*res:\s*resN/.test(src), 'halves 半身诊断丢失');
});
test('F4 睡眠臂不许窜进 PC_CAUSAL_ZH_PATS 十四支（只能走独立子判据）', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const m = src.match(/const PC_CAUSAL_ZH_PATS = \[[\s\S]*?\n\];/);
  assert.ok(m, '取不到 PC_CAUSAL_ZH_PATS 数组块');
  assert.ok(!/睡着|入睡|一觉|沾枕/.test(m[0]), '睡眠词窜进了十四支数组');
});

// ─── G 节：已知未修登记翻正（r236 FIXED）────────────────────────
// r230 挂账的两条甲半缺口已由第 236 轮修复（PC_INVTAKE_ZH 正序臂对象表补裸
// 「药」+ 量词类补「服」、PC_DRUG_MECH_ZH「服药」腿加 `(?<![这那一])` 负向环视），
// 按 r226/r227/r233/r234/r235 纪律翻成正向断言：反过来守本轮修复不退步。
test(`G1 两条甲半缺口句已被 r236 修复（登记翻正，${KNOWN_OPEN.length} 条）`, () => {
  const bad = KNOWN_OPEN.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad.map(s => `${s} → ${pcCount(s)}`), [],
    '甲半缺口句回归 0 命中——r236 的修复被回退了，需查 PC_INVTAKE_ZH / PC_DRUG_MECH_ZH');
  for (const s of KNOWN_OPEN) {
    assert.ok(hasDim(s, 'pseudo_causal'), `findings 应含 pseudo_causal：${s}`);
    assert.notStrictEqual(gateMod.gate(s).gate.action, 'pass', `gate 应非 pass：${s}`);
  }
});
