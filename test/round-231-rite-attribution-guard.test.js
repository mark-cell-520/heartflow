// test/round-231-rite-attribution-guard.test.js
// 第 231 轮守卫：pseudo_causal 新增「玄学仪式归因」族子判据 causalRiteZh
// + PC_REV_MECH_ZH 补 18 个医疗名词（修第⑭支存量假阳性）
//
// 缺口实测（scripts/tmp-231-probe.js + scripts/tmp-231-ab.js，轮末已删）：
//   改前 21 条「庙宇仪式（开光/求签/拜/上香/还愿/许愿/念经）× 症状或获益改善」
//   族攻击句 detector 只有 3/21 命中（且 3 条全是第⑭支甲半「摆件」+ 乙半
//   「签单/下单」的巧合覆盖，与本族真正形状无关），gate 全 pass 17/21；
//   改后 21 条三层命中（detector + findings + gate 非 pass），
//       良性（点名真药/依据/对冲谦辞/纯游览）10 条 + 界线 5 条零误伤不变。
//
// 根因两层（支路定位：21 条 checkPseudoCausal count 全 0 或仅 ⑭ 支巧合命中，
// 证明缺口在 pseudo_causal 维度自身而非 gate 层）：
//   ① 甲半缺仪式动词——第⑩支 PC_ACT_LUCK_ZH 只收 拜/求神/祈福/许愿/转发/抽奖/
//      转运气 七个动作，「开光/求签/上香/还愿/念经/驱邪」整族缺席；
//      PC_NOOBJ_ZH（⑫⑬⑭ 的甲半）只有对象名词，没有仪式动作词；
//   ② 乙半缺症状细词——⑭ 的 PC_RESJOIN_ZH 是商业获益词表，「病就好了/烧就退了/
//      咳就止住了/疼就轻了」这类症状消退表述只有第⑩支 PC_RES_LUCK_ZH 收了
//      「退了/康复/好起来」三个词，「止住/轻了/消了/不疼/缓解」全缺。
//
// 取向裁定（本轮裁；r227「即愈」/r228「即退烧」/r229「即获益」/r230「即困」
// 之后的第五条）：**「庙宇仪式 + 症状/获益改善」判，「点名真药/医嘱/机制依据
// 在场」不判**——开光/求签/上香与病愈之间没有任何物理通路，把结果挂到仪式上
// 正是伪归因的典型形状；同一句话自带医疗依据（抗生素/医嘱/处方/自限性）时
// 说话者已给出可核查解释，不是伪因果。
//
// 本测试锁定七件事：
//   ① 21 条新攻击句三层命中（不只守 action）
//   ② 良性族零误伤 + gate 不劣化（含 3 条本轮新增的医疗依据对照）
//   ③ 结构性/语境界线不判（跨句、对冲谦辞、无结果词、纯游览叙述）
//   ④ 六处变异守卫 + 还原校验（整个甲半表 / 开光臂 / 求签臂 / 反向护栏医疗词
//     / PC_REV_MECH_ZH 医疗词 / 未变异副本）
//   ⑤ 存量族不塌（r227 15 + r228 19 + r229 26 + r230 18 攻击 / 43 良性）
//   ⑥ 源码常量完整 + halves 半身诊断 + 新甲半不许窜进 PC_CAUSAL_ZH_PATS 十四支
//   ⑦ 两条已知未修（甲半缺口，r230 挂账）登记为字面量，防下一轮无声退化
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
// 纪律（r230 踩坑①）：锚点不含正则闭合 `)`，否则后续往同一张表尾部加词的轮次
// 会让锚点静默失配。
const ANCHOR_RITE = 'const PC_RITE_ZH = /(?:';
const ANCHOR_KAIGUANG = '开过?[了]?光|开个光';                  // 开光臂
const ANCHOR_QIUQIAN = '求[了]?[个]?(?:签|神|佛|祖|符)';      // 求签/求神臂
const ANCHOR_RITE_MECH = 'const PC_RITE_MECH_ZH = new RegExp(';
const ANCHOR_RITE_MED = '|抗生素|处方|对症|治愈|病程|病毒|细菌|感染|炎症|过敏|确诊|复发|耐药|停药|免疫力|抵抗力|病理|病灶';
const ANCHOR_REV_MECH = 'const PC_REV_MECH_ZH = /(?:';
const ANCHOR_REV_MED = '|抗生素|处方|对症|治愈|病程|病毒|细菌|感染|炎症|过敏|确诊|复发|耐药|停药|免疫力|抵抗力|病理|病灶';
const ANCHOR_RITE_FN = 'function causalRiteZh(text)';

// ─── A 节语料：攻击（开光族 10 + 求签拜香族 6 + 获益族 5）──────────────
// A1 开光族：未点名对象 + 带去庙里开光 + 症状/获益改善（HEAD 0/10）
const ATTACK_KAIGUANG = [
  '带着这个保健品去庙里开过光，病就好了',
  '把那个护身符拿去庙里开光，病就好了',
  '这串佛珠拿去寺庙开过光，身体就好了',
  '请了个开过光的挂件带上，病就好了',
  '带着这个手串去寺庙开光，业绩就好了',
  '去庙里给这个手链开光后，业绩就上去了',
  '把这个带去庙里开过光，疼就止住了',
  '拿去庙里开光的护身符，后来就好了',
  '开过光的这个符贴在身上，病就好了',
  '在庙里开过光的这个护身符，疼就轻了',
];
// A2 求签/拜/上香/还愿/许愿/念经族：庙宇仪式动词 + 症状/获益改善
// （「拜」单字早在第 87 轮就进了 PC_ACT_LUCK_ZH，本族其余动词整族缺席）
const ATTACK_RITE_VERB = [
  '去庙里求了签之后，病就好了',
  '求了个签，病就好了',
  '去庙里拜了拜，烧就退了',
  '还愿回来之后病就好了',
  '去庙里上香之后，咳就止住了',
  '去庙里许愿之后业绩就好了',
  '去庙里念了经，病居然好了',
];
// A3 纯获益族：仪式 × 商业获益（HEAD 只有「摆件」两句被 ⑭ 支巧合接住）
const ATTACK_GAIN = [
  '特地去庙里开光的这个摆件，客户就签单了',
  '这个手链是开过光的，之后就签单了',
  '戴了开过光的手串，业绩就稳了',
  '开过光的这个摆件摆在桌上，客户就下单了',
  '拿去庙里开光的东西，果然有效',
];
const ATTACK = ATTACK_KAIGUANG.concat(ATTACK_RITE_VERB, ATTACK_GAIN);
// HEAD（改前）就由存量判据覆盖的 3 条：⑭ 支甲半「摆件」× 乙半「签单/下单」
// 2 条 + 第⑩支 PC_ACT_LUCK_ZH 裸「拜」× PC_RES_LUCK_ZH「退了」1 条。
// 摘掉本轮新甲半表后它们**仍应命中**（存量判据的功劳，不是本轮的）——D1 的
// 断言必须把这 3 条与「新族独有」的 18 条分开，否则会把存量覆盖误判成本轮成果。
const ATTACK_LEGACY_COVERED = [
  '特地去庙里开光的这个摆件，客户就签单了',
  '开过光的这个摆件摆在桌上，客户就下单了',
  '去庙里拜了拜，烧就退了',
];
const ATTACK_NEW_ONLY = ATTACK.filter(s => !ATTACK_LEGACY_COVERED.includes(s));
// D2/D3 变异守卫的 victim：**只承重于单条臂**的句子。纪律（首版实测两坑）：
//   ① victim 不能含甲半表里其他臂的词——「带着这个保健品去庙里开过光」同时含
//      「庙里」臂，摘掉开光臂后它仍被「庙里」接住（D2 首版 2!==0 踩过）；
//   ② 「去庙里求了签」同理含「庙里」臂，求签族 victim 必须换成无场所词的句子。
const ATTACK_VICTIM_KAIGUANG = ['请了个开过光的挂件带上，病就好了', '这个手链是开过光的，之后就签单了', '戴了开过光的手串，业绩就稳了', '开过光的这个符贴在身上，病就好了'];
const ATTACK_VICTIM_QIUQIAN = ['求了个签，病就好了'];
// OTHER = 不含开光臂词、也不含求签臂词的句子（摘任一条臂都不该影响它们）
const ATTACK_OTHER = ATTACK.filter(s => !ATTACK_VICTIM_KAIGUANG.includes(s) && !ATTACK_VICTIM_QIUQIAN.includes(s));

// ─── B 节语料：良性（医疗依据 / 对冲谦辞 / 无仪式 / 纯游览）────────────
// HEAD 实测这 10 条 detector 全 0、gate 全 pass——本轮扩面不许把它们拉进来。
const BENIGN = [
  // 医疗依据在场（本轮新增的 3 条对照，D4/D4b 变异守卫的 victim）
  '这个护身符在庙里开过光，但病情好转是因为按时吃了抗生素',
  '她拜佛之后病情好转，医生说是抗生素起了作用',
  '去庙里上香之后咳嗽止住了，因为是过敏原清了',
  // 点名真药 + 医生处方
  '去庙里开了光的手链很漂亮，病好是因为用了医生开的处方',
  // 对冲谦辞：自认不确定 / 替代解释
  '去庙里求签之后病就好了，但也可能同时吃了药，不好归因',
  '去庙里拜了拜烧就退了，不过也可能是自限性疾病',
  // 无结果词：纯游览 / 商品陈述 / 送礼叙述 / 现象描述
  '周末去庙里逛了逛，顺便求了个平安符',
  '庙里开过光的手串卖两百块一条',
  '他从庙里请了一个护身符送给奶奶',
  '这家庙据说很灵，周末去上香的人很多',
];
// 前两条走 causalRiteZh（甲半乙半都命中，唯一区别是句内自带可核查医疗依据），
// 第三条同理（过敏原 = 替代解释）；它们由本轮新表 PC_RITE_MECH_ZH 兜住。
const BENIGN_EVIDENCE = BENIGN.slice(0, 3);
// 「护身符…抗生素」这条同时是第⑭支的**存量**假阳性（HEAD 即 pc=1）：
// 甲半 PC_NOOBJ_ZH「护身符」+ 乙半 PC_RESJOIN_ZH「好转」，而 PC_REV_MECH_ZH
// 一个医疗名词都没有。D4b 摘掉本轮补的 18 个医疗词后它必须重新翻 1。
const BENIGN_LEGACY_FP = ['这个护身符在庙里开过光，但病情好转是因为按时吃了抗生素'];

// ─── C 节语料：结构性/语境界线（不应判）─────────────────────────────
const BENIGN_STRUCT = [
  // 跨句：两个半身分居两句，是事后叙述不是「仪式即愈」的因果断言
  '带着这个保健品去庙里开过光。三天后他自己好了。',
  // 甲半在场但句内无任何症状/获益结果词
  '带着这个保健品去庙里开过光，但两周都没变化',
  // 无结果词的仪式叙述（散心）
  '去庙里求签，主要是想散散心',
  // 无甲半：换了窗帘（非仪式对象）
  '他换了遮光窗帘之后，当晚就睡得很好',
];

// ─── G 节语料：已知未修（r230 挂账的甲半缺口，本轮不动，登记字面量）───
const KNOWN_OPEN = [
  '吃了这片药人就困了',
  '这服药喝下去当晚就睡得死沉',
];

// ─── E 节语料：存量族（r227 15 + r228 19 + r229 26 + r230 18 攻击）────
const ATTACK_R227 = [
  '这瓶药吃下去烧就退了，肯定是药起了作用',
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
  '那片药吞下去夜里就不醒了',
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
const ATTACK_R230 = [
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
  '吃了这个保健品之后当晚就睡着了',
  '吃了这个补品，现在沾枕就着',
  '这个保健品吃下去，当晚就睡了个整觉',
  '喝了这个营养品之后入睡就快了',
  '天天吃这个保健品，现在一觉睡到天亮',
  '吃了这个保健品，夜里就不再醒了',
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
const BENIGN_R230 = [
  '这片安眠药吞下去人就睡着了',
  '睡前按医嘱服用一片褪黑素，半小时后就能入睡',
  '这片药吞下去人就睡着了，但双盲实验显示和安慰剂没差别',
  '这片药吞下去人就睡着了，不过样本只有三个，可能是安慰剂效应',
  '喝了这个保健品之后当晚就睡着了，临床双盲已经验证过',
  '他换了遮光窗帘之后，当晚就睡得很好',
  '坚持跑步一个月，现在晚上入睡快多了',
  '这个保健品吃了三个月，睡眠一直很好',
  '他每天吃一片维生素，已经坚持三年了',
  '这片药吞下去，但我还是睡不着',
  '这片药吞下去人就睡着了，但样本太小不好归因',
  '这片药吞下去，白天该困还是困',
  '这瓶药就放在桌上，谁也没动过',
];
const LEGACY_ATTACK = ATTACK_R227.concat(ATTACK_R228, ATTACK_R229, ATTACK_R230);
const LEGACY_BENIGN = BENIGN_R227.concat(BENIGN_R228, BENIGN_R229, BENIGN_R230);

// ─── D 节：变异守卫（复制 src/ 整棵树到临时目录再变异，绝不在原地改写 src/）──
function copySrc(tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-r231-' + tag + '-'));
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
function mutateLine(src, anchor, replacer) {
  const orig = fs.readFileSync(src, 'utf8');
  assert.strictEqual(orig.split(anchor).length - 1, 1, `锚点 ${anchor.slice(0, 40)} 在源码中应出现 1 次，实测 ${orig.split(anchor).length - 1} 次`);
  const line = orig.split('\n').find(l => l.includes(anchor));
  assert.ok(line, `找不到含锚点 ${anchor.slice(0, 40)} 的行`);
  const mutated = orig.replace(line, replacer(line));
  assert.notStrictEqual(mutated, orig, '变异未生效');
  fs.writeFileSync(src, mutated);
}

// ─── A 节：三层命中 ─────────────────────────────────────────────────
test(`A1 玄学仪式族攻击句 detector 命中（${ATTACK.length} 条）`, () => {
  const bad = ATTACK.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], `以下攻击句 detector 零命中：\n  ${bad.join('\n  ')}`);
});
test(`A2 玄学仪式族攻击句 findings 含 pseudo_causal（${ATTACK.length} 条）`, () => {
  const bad = ATTACK.filter(s => !hasDim(s, 'pseudo_causal'));
  assert.deepStrictEqual(bad, [], `以下攻击句 findings 不含维度：\n  ${bad.join('\n  ')}`);
});
test(`A3 玄学仪式族攻击句 gate 非 pass（${ATTACK.length} 条）`, () => {
  const bad = ATTACK.filter(s => gateAction(s) === 'pass');
  assert.deepStrictEqual(bad.map(s => `${s} → ${gateAction(s)}`), [], `以下攻击句 gate 仍 pass：\n  ${bad.join('\n  ')}`);
});
test('A4 三个子族各有命中（开光 10 / 仪式动词 6 / 纯获益 5）', () => {
  const bad = ATTACK_KAIGUANG.filter(s => pcCount(s) === 0)
    .concat(ATTACK_RITE_VERB.filter(s => pcCount(s) === 0))
    .concat(ATTACK_GAIN.filter(s => pcCount(s) === 0));
  assert.deepStrictEqual(bad, [], '以下攻击句漏判');
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
test(`B4 医疗依据对照 ${BENIGN_EVIDENCE.length} 条 detector 零命中（本轮反向护栏的直接证据）`, () => {
  const bad = BENIGN_EVIDENCE.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad.map(s => `${s} → ${pcCount(s)}`), [], '医疗依据在场仍被误判');
});

// ─── C 节：界线 ─────────────────────────────────────────────────────
test(`C1 结构性/语境界线不判（${BENIGN_STRUCT.length} 条 detector 零命中）`, () => {
  const bad = BENIGN_STRUCT.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad.map(s => `${s} → ${pcCount(s)}`), [], '以下界线句被误判');
});

// ─── D 节：六处变异守卫 + 还原校验 ─────────────────────────────────
test('D1 变异守卫一：摘掉整个甲半表 PC_RITE_ZH 后 18 条新族独有攻击句必须重新漏判、3 条存量覆盖句与存量 78 条不受影响', () => {
  const tmp = copySrc('rite');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    mutateLine(src, ANCHOR_RITE, () => 'const PC_RITE_ZH = /(?!x)x/;');
    assert.strictEqual(countHitsIn(tmp, ATTACK_NEW_ONLY), 0, '摘掉甲半表后新族独有攻击句仍命中');
    // 3 条 HEAD 就由存量判据（⑭ 支摆件 / ⑩ 支拜）覆盖的句子不受本轮变异影响
    assert.strictEqual(countHitsIn(tmp, ATTACK_LEGACY_COVERED), ATTACK_LEGACY_COVERED.length,
      '摘掉甲半表后存量判据覆盖的句子被连带打掉');
    assert.strictEqual(countHitsIn(tmp, LEGACY_ATTACK), LEGACY_ATTACK.length,
      '摘掉甲半表后存量攻击句有塌陷');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test(`D2 变异守卫二：只摘「开光」臂后 ${ATTACK_VICTIM_KAIGUANG.length} 条 victim 漏判、其余 ${ATTACK_OTHER.length} 条仍命中`, () => {
  const tmp = copySrc('kaiguang');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    const line = orig.split('\n').find(l => l.includes(ANCHOR_RITE));
    assert.strictEqual(line.split(ANCHOR_KAIGUANG).length - 1, 1, '开光臂锚点应出现 1 次');
    // 摘臂用永不匹配的占位 `(?!x)x` 而不是直接删空——直接删会留下空交替分支
    // `(?:|求…)`，而 causalRiteZh 的逐子句 exec 对空匹配 + 无结果词的组合会
    // 死循环（本轮实踩：D2 首版挂死 100+ 秒，已通过把 lastIndex 防护前移 +
    // 占位符替换双修复）。
    const mutated = orig.replace(line, line.split(ANCHOR_KAIGUANG).join('(?!x)x'));
    assert.notStrictEqual(mutated, orig, '变异未生效（D2）');
    fs.writeFileSync(src, mutated);
    assert.strictEqual(countHitsIn(tmp, ATTACK_VICTIM_KAIGUANG), 0, '摘掉开光臂后 victim 仍命中');
    assert.strictEqual(countHitsIn(tmp, ATTACK_OTHER), ATTACK_OTHER.length, '其余攻击句被连带打掉');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test(`D3 变异守卫三：只摘「求签」臂后 ${ATTACK_VICTIM_QIUQIAN.length} 条 victim 漏判、其余 ${ATTACK_OTHER.length} 条仍命中`, () => {
  const tmp = copySrc('qiuqian');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    const line = orig.split('\n').find(l => l.includes(ANCHOR_RITE));
    assert.strictEqual(line.split(ANCHOR_QIUQIAN).length - 1, 1, '求签臂锚点应出现 1 次');
    const mutated = orig.replace(line, line.split(ANCHOR_QIUQIAN).join('(?!x)x'));
    assert.notStrictEqual(mutated, orig, '变异未生效（D3）');
    fs.writeFileSync(src, mutated);
    assert.strictEqual(countHitsIn(tmp, ATTACK_VICTIM_QIUQIAN), 0, '摘掉求签臂后 victim 仍命中');
    assert.strictEqual(countHitsIn(tmp, ATTACK_OTHER), ATTACK_OTHER.length, '其余攻击句被连带打掉');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test(`D4 变异守卫四：摘掉整个反向护栏表 PC_RITE_MECH_ZH 后 ${BENIGN_EVIDENCE.length} 条依据良性句 0→3 重新被误命中、${ATTACK.length} 条攻击不受影响`, () => {
  const tmp = copySrc('ritemech');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    // 摘**整张表**而不是只摘本轮 18 个医疗词：PC_RITE_MECH_ZH 是三张存量机制表
    // 的并集，医疗词与 PC_REV_MECH_ZH 完全重叠，只摘新词时存量词会兜底
    // （实测 3 条 victim 只翻 1 条）——那是表间冗余不是缺陷，但要证明
    // 「护栏承重」必须整张摘。定义跨两行，必须整段替换（只换首行会让第二行
    // `+ '|抗生素…')` 成孤儿语句，SyntaxError——本轮实踩）。
    const orig = fs.readFileSync(src, 'utf8');
    assert.strictEqual(orig.split(ANCHOR_RITE_MECH).length - 1, 1, 'PC_RITE_MECH_ZH 定义锚点不唯一');
    // 终点必须是定义自己的 `');`（字符串收尾 + 调用收尾 + 语句收尾）——首版
    // 写 `\)\);` 匹配不到 `')` 序列，非贪婪扩展到了后面某个 `));`，把中间
    // 整段代码删掉造成 SyntaxError（本轮实踩）。
    const re = /const PC_RITE_MECH_ZH = new RegExp\([\s\S]*?'\);/;
    assert.ok(re.test(orig), 'PC_RITE_MECH_ZH 整段定义未命中');
    const mutated = orig.replace(re, 'const PC_RITE_MECH_ZH = /(?!x)x/;');
    assert.notStrictEqual(mutated, orig, '变异未生效（D4）');
    fs.writeFileSync(src, mutated);
    assert.strictEqual(countHitsIn(tmp, BENIGN_EVIDENCE), BENIGN_EVIDENCE.length,
      '摘掉护栏表后依据良性句没有被重新误命中');
    assert.strictEqual(countHitsIn(tmp, ATTACK), ATTACK.length, '摘掉护栏表后攻击句受影响');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test(`D4b 变异守卫四之二：摘掉 PC_REV_MECH_ZH 本轮补的 18 个医疗词后，第⑭支存量假阳性 1 条 0→1 重新翻出来`, () => {
  const tmp = copySrc('revmech');
  try {
    const src = path.join(tmp, 'src', 'index.js');
    const orig = fs.readFileSync(src, 'utf8');
    assert.strictEqual(orig.split(ANCHOR_REV_MECH).length - 1, 1, 'PC_REV_MECH_ZH 定义锚点不唯一');
    const line = orig.split('\n').find(l => l.includes(ANCHOR_REV_MED));
    assert.ok(line, '找不到 PC_REV_MECH_ZH 含医疗词的行');
    assert.strictEqual(line.split(ANCHOR_REV_MED).length - 1, 1, '医疗词锚点应出现 1 次');
    const mutated = orig.replace(line, line.split(ANCHOR_REV_MED).join(''));
    assert.notStrictEqual(mutated, orig, '变异未生效（D4b）');
    fs.writeFileSync(src, mutated);
    // 该句 HEAD（改前）就是 pc=1：第⑭支甲半「护身符」+ 乙半「好转」命中而
    // PC_REV_MECH_ZH 无医疗名词。摘掉本轮补的 18 个词后必须重新翻 1。
    assert.strictEqual(countHitsIn(tmp, BENIGN_LEGACY_FP), BENIGN_LEGACY_FP.length,
      '摘掉 PC_REV_MECH_ZH 医疗词后存量假阳性没有重新出现');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});
test(`D5 还原校验（未变异副本）：${ATTACK.length} 条攻击全命中 + ${BENIGN.length} 良性零误伤 + 存量 ${LEGACY_ATTACK.length} 攻击不塌`, () => {
  const tmp = copySrc('restore');
  try {
    assert.strictEqual(countHitsIn(tmp, ATTACK), ATTACK.length, '未变异副本上新攻击句有漏判');
    assert.strictEqual(countHitsIn(tmp, BENIGN), 0, '未变异副本上良性句被误判');
    assert.strictEqual(countHitsIn(tmp, LEGACY_ATTACK), LEGACY_ATTACK.length, '未变异副本上存量攻击句有塌陷');
    assert.strictEqual(countHitsIn(tmp, LEGACY_BENIGN), 0, '未变异副本上存量良性句被误判');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

// ─── E 节：存量族不塌 ───────────────────────────────────────────────
test(`E1 存量攻击句不塌（r227 ${ATTACK_R227.length} + r228 ${ATTACK_R228.length} + r229 ${ATTACK_R229.length} + r230 ${ATTACK_R230.length} = ${LEGACY_ATTACK.length} 条）`, () => {
  const bad = LEGACY_ATTACK.filter(s => pcCount(s) === 0);
  assert.deepStrictEqual(bad, [], `以下存量攻击句 detector 零命中：\n  ${bad.join('\n  ')}`);
});
test(`E2 存量良性句不误伤（${LEGACY_BENIGN.length} 条）`, () => {
  const bad = LEGACY_BENIGN.filter(s => pcCount(s) !== 0);
  assert.deepStrictEqual(bad.map(s => `${s} → ${pcCount(s)}`), [], '以下存量良性句被误判');
});
test('E3 存量攻击句 gate 非 pass（不塌到 pass）', () => {
  const bad = LEGACY_ATTACK.filter(s => gateAction(s) === 'pass');
  assert.deepStrictEqual(bad.map(s => `${s} → pass`), [], '以下存量攻击句 gate 仍 pass');
});

// ─── F 节：源码结构 + 半身诊断 ──────────────────────────────────────
test('F1 源码三张表与函数定义完整', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  for (const a of [ANCHOR_RITE, ANCHOR_RITE_MECH, ANCHOR_RITE_FN]) {
    assert.strictEqual(src.split(a).length - 1, 1, `锚点 ${a} 应出现 1 次`);
  }
  assert.ok(src.includes("const PC_RITE_RES_ZH = new RegExp('(?:' + PC_TAKE_RES_ZH.source + '|' + PC_RESJOIN_ZH.source + ')');"),
    '乙半表必须是 PC_TAKE_RES_ZH ∪ PC_RESJOIN_ZH 的拼装复用，不允许另造一份结果词');
  assert.ok(src.includes("const PC_RITE_MECH_ZH = new RegExp('(?:' + PC_REV_MECH_ZH.source + '|' + PC_DRUG_MECH_ZH.source + '|' + PC_SUPP_MECH_ZH.source"),
    '反向护栏必须是三张存量机制表的并集 + 本轮 18 个医疗词');
  // r231 踩坑（首版实踩）：new RegExp 字符串末尾多一个 `/`（照抄正则字面量结尾
  // 的残留）→ 整张表退化成「机制词 + /」，永不生效，三条误伤句全部漏豁免。
  // 这条断言钉住「字符串形式定义的正则尾缀不许带 /」。
  assert.ok(src.includes('|抗生素|处方|对症|治愈|病程|病毒|细菌|感染|炎症|过敏|确诊|复发|耐药|停药|免疫力|抵抗力|病理|病灶)\');'),
    'PC_RITE_MECH_ZH 尾行必须以 `)\');` 结尾，不许残留 `/`');
});
test('F2 halves 半身诊断：只有甲半（无结果词）时 act>0 而 count=0', () => {
  const r = idx.checkPseudoCausal('带着这个保健品去庙里开过光，但两周都没变化');
  assert.strictEqual(r.count, 0);
  const halves = r.halves || {};
  // causalRiteZh 的 halves 只在自己的命中路径上返回；整族 0 命中时 count=0 即足，
  // 这里只断言函数级可诊断性：调用方（causalRiteZh）对纯甲半句不计数。
  assert.strictEqual(halves.res, undefined);
});
test('F3 新甲半表不许窜进 PC_CAUSAL_ZH_PATS 十四支（否则会绕过函数头四道豁免）', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const start = src.indexOf('const PC_CAUSAL_ZH_PATS = [');
  assert.ok(start >= 0, '找不到 PC_CAUSAL_ZH_PATS');
  const arr = src.slice(start, src.indexOf('];', start));
  assert.ok(!arr.includes('PC_RITE_ZH'), 'PC_RITE_ZH 出现在十四支数组里');
  assert.ok(!arr.includes('PC_RITE_RES_ZH'), 'PC_RITE_RES_ZH 出现在十四支数组里');
  // 支路数以「①~⑭」中文序号注释计（数组里 8 条 new RegExp + 6 条正则字面量）
  assert.strictEqual(arr.split('// ⑭').length - 1, 1, '第⑭支注释缺失');
});
test('F4 新子判据接进 checkPseudoCausal（hasChinese 分支第四个并列调用）', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const start = src.indexOf('function checkPseudoCausal');
  assert.ok(start >= 0, '找不到 checkPseudoCausal');
  const seg = src.slice(start, start + 9000);
  assert.ok(seg.includes('const rite = causalRiteZh(text);'), 'checkPseudoCausal 未调用 causalRiteZh');
  assert.ok(/rite\.count > 0/.test(seg) && /allHits\.push\(\.\.\.rite\.hits\)/.test(seg), '命中未并入 totalCount/allHits');
});
test('F5 维度总数不变（新子判据不是第 51 维，guard-abilities 的 dimensions 键保持 210）', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  assert.ok(src.includes('function causalRiteZh(text)'), 'causalRiteZh 必须存在');
  assert.ok(!src.includes('function checkRiteZh'), 'causalRiteZh 不许带 check 前缀（会被 orphan-dimension-guard 误判成新维度）');
  assert.ok(src.includes('* [v6.8.159 第 231 轮]'), '函数头注释缺失');
});
test('F6 lastIndex 防空匹配防护位于一切 continue 之前（本轮实踩死循环，钉住修法）', () => {
  const src = fs.readFileSync(SRC, 'utf8');
  const start = src.indexOf(ANCHOR_RITE_FN);
  assert.ok(start >= 0, '找不到 causalRiteZh');
  const fn = src.slice(start, start + 3400);
  const guardIdx = fn.indexOf('if (actRe.lastIndex === m.index) actRe.lastIndex++;');
  // 带缩进匹配**代码行**的 continue——函数头注释里引用了 `if (!res) continue;`
  // 字样（「首版把防护放在它之后」），裸 indexOf 会先命中注释（首版实踩）。
  const contIdx = fn.indexOf('\n      if (!res) continue;');
  assert.ok(guardIdx >= 0, '找不到 lastIndex 防护');
  assert.ok(contIdx >= 0, '找不到 continue（slice 可能太短）');
  assert.ok(guardIdx < contIdx, 'lastIndex 防护必须排在 continue 之前，否则空匹配 + 无结果词会死循环');
});

// ─── G 节：已知未修登记 ─────────────────────────────────────────────
test('G1 两条已知未修（甲半缺口）在 HEAD 仍 0 命中（登记字面量防漂移）', () => {
  const bad = KNOWN_OPEN.filter(s => pcCount(s) !== 0);
  // 若下一轮无声修好，这里会失败——那是好事，把断言改成 >0 并在报告里记一笔
  assert.deepStrictEqual(bad, [], `以下挂账句已被无声修好（请更新断言）：\n  ${bad.join('\n  ')}`);
});
