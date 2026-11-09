// test/round-229-supplement-attribution-guard.test.js
// 第 229 轮守卫：pseudo_causal「未点名保健品/补品归因」族收口
//
// 缺口实测（scripts/tmp-229-probe.js + tmp-229-ab2.js，轮末已删）：
//   改前 25 条未点名保健品攻击句（20 正序 + 5 倒装）pseudo_causal detector 0/25，
//        其中 9 条仅被 post_hoc 兜住 gate=rewrite，16 条连 gate 都是 pass；
//   改后 26 条攻击句三层命中（detector + findings + gate 非 pass），
//        良性（点名补品 10 条 / 点名+依据 11 条 / 结构性界线 6 条）零误伤不变。
//
// 根因：第⑩支甲半 PC_ACT_LUCK_ZH 的服药臂 `吃了?[^。]{0,6}(?:药|保健品|补品)`
// 早在 v6.7.127 就收了「保健品/补品」对象，但乙半 PC_RES_LUCK_ZH 只收获益动词
// （签单/谈成/中了/赢了/涨了/赚了/好起来…），**没有一条症状/精力改善词**——
// 「吃了这个保健品之后精神就好了」整族在 pseudo_causal 维度零覆盖。
// 取向刀沿用 r227/r228 已裁定口径：**「未点名对象 + 服下即愈/获益」判，
// 「点名补品 + 真实依据」不判**。甲半对象词表只收泛类名词（保健品/补品/营养品）
// 就是这把刀的结构化身——点名产品（螺旋藻片/鱼油/蛋白粉/钙片…）进不了甲半。
//
// 本测试锁定六件事：
//   ① 26 条新攻击句三层命中（不只守 action）
//   ② 点名补品（无依据 10 条）+ 点名+依据（11 条）良性族零误伤、gate 不漂移
//   ③ 结构性/语境界线不判（跨句、对冲谦辞、替代解释、无结果词）
//   ④ 六处变异守卫 + 还原校验（整表 / 倒装臂 / 乙半特有臂 / 反向护栏 / 对象表）
//   ⑤ 存量族不塌（r227 15 条 + r228 19 条 + round-48 24 攻击 / 30 良性）
//   ⑥ 源码常量完整 + halves 半身诊断 + 新族不许窜进 PC_CAUSAL_ZH_PATS 十四支
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
const ANCHOR_SUPP = 'const PC_SUPP_ZH = /(?:';
const ANCHOR_OBJ = '(?:保健品|补品|营养品)';                    // 甲半对象表（定义行内 2 次）
const ANCHOR_INV_ARM = '|(?:这|那|某|啥|一)[^。]{0,3}(?:保健品|补品|营养品)[^。]{0,8}(?:吃|喝|服|补|吞|冲|泡)(?:下)?(?:去)?'; // 倒装臂
const ANCHOR_RES = 'const PC_SUPP_RES_ZH = new RegExp(';
const ANCHOR_MECH = 'const PC_SUPP_MECH_ZH = PC_EVIDENCE_ZH;';
const ANCHOR_FN = 'function causalSupplementZh(text)';
const ANCHOR_CALL = 'const sup = causalSupplementZh(text);';

// ─── A 节语料：未点名保健品/补品 × 获益结果（正序 20 + 倒装 5 + 玄学获益 1）──
const ATTACK_ORDER = [
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
];
const ATTACK_INVERTED = [
  '这个保健品吃下去病就好了',
  '那盒补品喝下去气色就好了',
  '这款营养品吞下去人就精神起来了',
  '这保健品吃下去感冒就少了',
  '某种保健品吃下去失眠就好了',
];
const ATTACK_LUCK = [
  '吃了这个保健品之后财运就来了',
];
const ATTACK = ATTACK_ORDER.concat(ATTACK_INVERTED, ATTACK_LUCK);
// 乙半里「保健品特有结果词」族（少了/上去/翻倍/没人感冒/更有劲/财运/指标升降）——
// D3 变异守卫的 victim：砍掉乙半特有臂后这些必须重新漏判
const ATTACK_RES_SPECIFIC = [
  '吃了这保健品之后感冒就少了',
  '坚持吃这个保健品，这个月业绩就上去了',
  '全办公室都吃这个保健品，这个月没人感冒',
  '隔壁大爷吃了这个保健品，高血压再没犯过',
  '吃了这个保健品之后孩子成绩就上去了',
  '他每天吃这个补品，业绩一路翻倍',
  '王阿姨吃了这个保健品，广场舞跳得更有劲了',
  '吃了这个保健品之后血糖就降了',
  '吃了这个保健品之后财运就来了',
];
// 乙半里复用 r227 症状表 PC_TAKE_RES_ZH 的句子（好了/不疼/有效/稳了）——
// D3 变异后必须仍然命中（证明砍掉的只是特有臂，没有伤共用表）
const ATTACK_RES_SHARED = ATTACK_ORDER.filter(s => !ATTACK_RES_SPECIFIC.includes(s));

// ─── B 节语料：点名补品（无依据 10）+ 点名+依据（11）────────────────────
// 甲半对象词表只收泛类名词，点名产品（螺旋藻片/蛋白粉/鱼油/钙片/辅酶Q10/叶黄素/
// 葡萄籽/月见草/番茄红素/乳酸菌素片）根本进不了甲半——HEAD 实测本就零命中。
const BENIGN_NAMED = [
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
];
// HEAD 实测 gate=pass 的 5 条与 gate=rewrite 的 5 条（post_hoc 存量捕获，与本维度
// 无关）——按 r226 纪律分别登记为字面量防漂移。分类口径：3 遍独立进程实测稳定值
// （引擎会把 auto-rules/behavior-tracker 写进 data/，跨进程累积会让 borderline 句
// 的 gate action 波动——r227 踩坑④ 记载过 3 条同款非确定性样本，本轮又撞到 2 条，
// 故只登记稳定值，不碰波动句）。
const BENIGN_NAMED_PASS = [
  '吃了蛋白粉之后肌肉就长了',
  '喝了深海鱼油之后血脂就降了',
  '喝了乳酸菌素片之后肠胃就好了',
  '吃了叶黄素之后眼睛就不干了',
  '吃了葡萄籽之后皮肤就白了',
];
const BENIGN_NAMED_NONPASS = [
  '吃了螺旋藻片之后感冒就少了',
  '吃了钙片之后腰就不疼了',
  '吃了辅酶Q10之后心慌就少了',
  '吃了月见草之后痛经就好了',
  '吃了番茄红素之后前列腺指标就正常了',
];
const BENIGN_EVIDENCE = [
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
const BENIGN = BENIGN_NAMED.concat(BENIGN_EVIDENCE);

// ─── C 节语料：结构性/语境界线（不判）────────────────────────────────
const BENIGN_STRUCT = [
  // 跨句：甲半与乙半分居两句，是事后叙述不是「服下即愈」的因果断言
  '吃了这个保健品。三天后他自己好了。',
  // 对冲谦辞：自认不确定
  '吃了这个保健品之后精神是好了，但同期还调整了作息，不好归因',
  // 替代解释在场（安慰剂/自限性疾病）→ 反向护栏放行
  '吃了这个保健品之后精神就好了，样本只有三个，可能是安慰剂效应',
  '吃了这个保健品之后精神就好了，医生说可能是自限性疾病',
  // 甲半在场但乙半（获益结果）不在同子句
  '这个保健品就放在桌上，谁也没吃过',
  '吃了这个保健品，具体效果还要看后续体检数据',
];

// ─── E 节语料：存量族（r227 15 + r228 19 + round-48 24 攻击 / 30 良性，逐字沿用）──
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

// ─── D 节：变异守卫（复制 src/ 整棵树到临时目录再变异，绝不在原地改写 src/）──
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r229-' + tag + '-'));
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

test(`A1 未点名保健品攻击句 detector 命中（${ATTACK.length} 条）`, () => {
  const bad = ATTACK.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], `以下攻击句 detector 零命中：\n  ${bad.join('\n  ')}`);
});
test(`A2 未点名保健品攻击句 findings 含 pseudo_causal（${ATTACK.length} 条）`, () => {
  const bad = ATTACK.filter(s => !hasDim(s, 'pseudo_causal'));
  assert.deepStrictEqual(bad, [], `以下攻击句 findings 不含维度：\n  ${bad.join('\n  ')}`);
});
test(`A3 未命名保健品攻击句 gate 非 pass（${ATTACK.length} 条）`, () => {
  const bad = ATTACK.filter(s => gateAction(s) === 'pass');
  assert.deepStrictEqual(bad, [], `以下攻击句 gate 仍 pass：\n  ${bad.join('\n  ')}`);
});

test(`B1 点名补品（无依据）+ 点名+依据良性句 detector 零命中（${BENIGN.length} 条）`, () => {
  const bad = BENIGN.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad.map(s => `${s} → ${pcCount(s)}`), [], '以下良性句被本轮误伤');
});
test(`B2 点名补品 + 依据良性句 findings 不含 pseudo_causal（${BENIGN.length} 条）`, () => {
  const bad = BENIGN.filter(s => hasDim(s, 'pseudo_causal'));
  assert.deepStrictEqual(bad, [], '以下良性句 findings 含维度');
});
test(`B3a 点名补品良性句 gate 全 pass（${BENIGN_NAMED_PASS.length} 条，3 遍独立进程实测稳定 pass）`, () => {
  const bad = BENIGN_NAMED_PASS.filter(s => gateAction(s) !== 'pass');
  assert.deepStrictEqual(bad.map(s => `${s} → ${gateAction(s)}`), [], '以下良性句 gate 非 pass');
});
test(`B3b 点名补品 5 条 HEAD 即非 pass 句 gate 不漂移（post_hoc 存量捕获，登记字面量 rewrite）`, () => {
  const bad = BENIGN_NAMED_NONPASS.filter(s => gateAction(s) !== 'rewrite');
  assert.deepStrictEqual(bad.map(s => `${s} → ${gateAction(s)}`), [], '以下良性句 gate 动作发生变化');
});
test(`B3c 点名+依据良性句 gate 不劣化（11 条：9 pass / 2 条 perfect_error 存量 verify，零 block）`, () => {
  const bad = BENIGN_EVIDENCE.filter(s => gateAction(s) === 'block');
  assert.deepStrictEqual(bad.map(s => `${s} → ${gateAction(s)}`), [], '以下良性句 gate 被 block');
});

test(`C1 结构性/语境界线不判（${BENIGN_STRUCT.length} 条 detector 零命中）`, () => {
  const bad = BENIGN_STRUCT.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad.map(s => `${s} → ${pcCount(s)}`), [], '以下界线句被误判');
});

test('D1 变异守卫一：摘掉整个甲半表 PC_SUPP_ZH 后新攻击句必须重新漏判、存量族不受影响', () => {
  const tmp = copySrc('supp');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.strictEqual(orig.split(ANCHOR_SUPP).length - 1, 1, 'PC_SUPP_ZH 定义锚点不唯一');
    // 整行替换（只换 `const PC_SUPP_ZH = ` 前缀会把正则体留在行内变成语法错误）
    const mutated = orig.replace(/const PC_SUPP_ZH = [^\n]*;/m, 'const PC_SUPP_ZH = /(?!x)x/;');
    assert.ok(!mutated.includes(ANCHOR_SUPP), '变异后甲半表仍在');
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(src, mutated, 'utf8');
    const n = countHitsIn(tmp, ATTACK);
    assert.strictEqual(n, 0, `摘掉甲半表后仍有 ${n}/${ATTACK.length} 条命中，该表可能不承重`);
    const kept = countHitsIn(tmp, ATTACK_R227.slice(12));
    assert.strictEqual(kept, 3, `存量 3 条正序族（第⑩⑪⑫支承重）应不受影响，实测 ${kept}/3`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('D2 变异守卫二：摘掉倒装臂后 5 条倒装攻击句必须重新漏判、正序臂不受影响', () => {
  const tmp = copySrc('invarm');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    // 只在 PC_SUPP_ZH 定义行内计数/替换——函数头注释里写着同款示例文本
    const line = orig.match(/const PC_SUPP_ZH = [^\n]*;/m)[0];
    assert.strictEqual(line.split(ANCHOR_INV_ARM).length - 1, 1, `倒装臂锚点应出现 1 次，实测 ${line.split(ANCHOR_INV_ARM).length - 1} 次`);
    const mutated = orig.replace(/const PC_SUPP_ZH = [^\n]*;/m, line.split(ANCHOR_INV_ARM).join(''));
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(src, mutated, 'utf8');
    const inv = countHitsIn(tmp, ATTACK_INVERTED);
    assert.strictEqual(inv, 0, `摘掉倒装臂后仍有 ${inv}/${ATTACK_INVERTED.length} 条倒装句命中，倒装臂可能不承重`);
    const ord = countHitsIn(tmp, ATTACK_ORDER);
    assert.strictEqual(ord, ATTACK_ORDER.length, `正序臂应不受影响，实测 ${ord}/${ATTACK_ORDER.length}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test(`D3 变异守卫三：乙半砍掉保健品特有臂后 ${ATTACK_RES_SPECIFIC.length} 条特有结果词句必须重新漏判、复用症状表句不受影响`, () => {
  const tmp = copySrc('resarm');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.strictEqual(orig.split(ANCHOR_RES).length - 1, 1, 'PC_SUPP_RES_ZH 定义锚点不唯一');
    // 整条语句替换成复用表——砍掉的只是保健品特有的三类结果词
    // （症状名词+变少/精力财运/指标与业绩升降），共用的 PC_TAKE_RES_ZH 保留
    const mutated = orig.replace(/const PC_SUPP_RES_ZH = new RegExp\([\s\S]*?'\);/, 'const PC_SUPP_RES_ZH = PC_TAKE_RES_ZH;');
    assert.ok(!mutated.includes(ANCHOR_RES), '变异后乙半定义仍在');
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(src, mutated, 'utf8');
    const spec = countHitsIn(tmp, ATTACK_RES_SPECIFIC);
    assert.strictEqual(spec, 0, `砍掉特有臂后仍有 ${spec}/${ATTACK_RES_SPECIFIC.length} 条命中，特有臂可能不承重`);
    const shared = countHitsIn(tmp, ATTACK_RES_SHARED);
    assert.strictEqual(shared, ATTACK_RES_SHARED.length, `复用症状表的句子应不受影响，实测 ${shared}/${ATTACK_RES_SHARED.length}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('D4 变异守卫四：摘掉反向护栏 PC_SUPP_MECH_ZH 后两条依据句必须重新被误命中', () => {
  const tmp = copySrc('mech');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.strictEqual(orig.split(ANCHOR_MECH).length - 1, 1, 'PC_SUPP_MECH_ZH 定义锚点不唯一');
    const mutated = orig.replace(/const PC_SUPP_MECH_ZH = [^\n]*;/m, 'const PC_SUPP_MECH_ZH = /(?!x)x/;');
    assert.ok(!mutated.includes(ANCHOR_MECH), '变异后反向护栏仍在');
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(src, mutated, 'utf8');
    // 安慰剂效应 / 自限性疾病两句是「替代解释在场」的良性句，护栏一摘就必须假阳性
    const n = countHitsIn(tmp, [
      '吃了这个保健品之后精神就好了，样本只有三个，可能是安慰剂效应',
      '吃了这个保健品之后精神就好了，医生说可能是自限性疾病',
    ]);
    assert.strictEqual(n, 2, `摘掉反向护栏后依据句未重新被误命中（${n}/2），护栏可能不承重`);
    // 攻击句召回不受影响（护栏只放行不拦截）
    const kept = countHitsIn(tmp, ATTACK_ORDER);
    assert.strictEqual(kept, ATTACK_ORDER.length, `攻击句应不受影响，实测 ${kept}/${ATTACK_ORDER.length}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('D5 变异守卫五：对象表收窄成只有「保健品」后补品/营养品句必须重新漏判', () => {
  const tmp = copySrc('obj');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    const line = orig.match(/const PC_SUPP_ZH = [^\n]*;/m)[0];
    const nObj = line.split(ANCHOR_OBJ).length - 1;
    assert.strictEqual(nObj, 2, `甲半对象表应出现 2 次（正序臂/倒装臂），实测 ${nObj} 次`);
    const mutated = orig.replace(/const PC_SUPP_ZH = [^\n]*;/m, line.split(ANCHOR_OBJ).join('(?:保健品)'));
    assert.ok(mutated !== orig, '变异未生效');
    fs.writeFileSync(src, mutated, 'utf8');
    // 正序 20 条里 5 条对象是「补品」的必须掉（15 条保健品句仍命中）
    const ord = countHitsIn(tmp, ATTACK_ORDER);
    assert.strictEqual(ord, 15, `收窄对象表后正序句应剩 15/20（5 条补品句掉），实测 ${ord}/20`);
    // 倒装 5 条里 2 条（补品/营养品）必须掉（3 条保健品句仍命中）
    const inv = countHitsIn(tmp, ATTACK_INVERTED);
    assert.strictEqual(inv, 3, `收窄对象表后倒装句应剩 3/5（补品/营养品句掉），实测 ${inv}/5`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test(`D6 变异守卫六：还原校验（未变异副本必须 ${ATTACK.length}/${ATTACK.length} 命中 + 良性零误伤）`, () => {
  const tmp = copySrc('restore');
  try {
    const n = countHitsIn(tmp, ATTACK);
    assert.strictEqual(n, ATTACK.length, `未变异副本攻击句应全命中，实测 ${n}/${ATTACK.length}`);
    const b = countHitsIn(tmp, BENIGN.concat(BENIGN_STRUCT));
    assert.strictEqual(b, 0, `未变异副本良性/界线句应零命中，实测 ${b}/${BENIGN.length + BENIGN_STRUCT.length}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test(`E1 存量攻击族不塌（r227 15 + r228 19 + round-48 24 = ${ATTACK_R227.length + ATTACK_R228.length + LEGACY_ATTACK.length} 条）`, () => {
  const all = ATTACK_R227.concat(ATTACK_R228, LEGACY_ATTACK);
  const bad = all.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], `以下存量攻击句 detector 零命中：\n  ${bad.join('\n  ')}`);
});
test(`E2 存量良性族不涨（${LEGACY_BENIGN.length} 条 detector 零命中）`, () => {
  const bad = LEGACY_BENIGN.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad.map(s => `${s} → ${pcCount(s)}`), [], '以下存量良性句被误判');
});

test('F 源码常量完整 + halves 半身诊断真的在返回 + 新族不许窜进十四支', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  // 甲半表定义唯一 + 对象表在定义行内 2 次 + 倒装臂 1 次
  assert.strictEqual(src.split(ANCHOR_SUPP).length - 1, 1, 'PC_SUPP_ZH 定义应唯一');
  const suppLine = src.match(/const PC_SUPP_ZH = [^\n]*;/m)[0];
  assert.strictEqual(suppLine.split(ANCHOR_OBJ).length - 1, 2, '甲半对象表应出现 2 次（正序臂/倒装臂）');
  assert.strictEqual(suppLine.split(ANCHOR_INV_ARM).length - 1, 1, '倒装臂应只出现 1 次');
  // 乙半定义唯一 + 反向护栏表存在
  assert.strictEqual(src.split(ANCHOR_RES).length - 1, 1, 'PC_SUPP_RES_ZH 定义应唯一');
  assert.ok(/const PC_SUPP_MECH_ZH = PC_EVIDENCE_ZH;/.test(src), 'PC_SUPP_MECH_ZH 反向护栏表不存在');
  // 子判据函数唯一、调用点唯一
  assert.strictEqual(src.split(ANCHOR_FN).length - 1, 1, '子判据函数应只定义 1 次');
  assert.strictEqual(src.split(ANCHOR_CALL).length - 1, 1, '子判据调用点应唯一');
  // 新族是独立子判据，不许窜进 PC_CAUSAL_ZH_PATS 十四支（扁平正则会丢子句级配对）。
  // 注意：causalSupplementZh 函数体内合法使用 `new RegExp(PC_SUPP_ZH.source, 'g')`，
  // 所以断言必须限定在 PC_CAUSAL_ZH_PATS 数组块内，不能全文搜 PC_SUPP_ZH.source。
  const arrBlock = src.match(/const PC_CAUSAL_ZH_PATS = \[[\s\S]*?\n\];/m);
  assert.ok(arrBlock, 'PC_CAUSAL_ZH_PATS 数组块未找到');
  assert.ok(!/PC_SUPP/.test(arrBlock[0]), 'PC_SUPP_* 不许被接进 PC_CAUSAL_ZH_PATS 十四支');
  // halves 诊断（D 节变异守卫的判据来源）仍在返回：命中串带甲半→乙半
  const r = idx.checkPseudoCausal('吃了这个保健品之后精神就好了');
  assert.ok(r.hits.some(h => String(h).startsWith('未点名保健品归因:') && String(h).includes('→')),
    '未点名保健品命中串未带甲半→乙半半身诊断');
});
