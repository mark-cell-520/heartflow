/**
 * src/deprivation-coercion.js — 「基本需求剥夺」检测器（第 125 个判别维度）
 *
 * [r681 立项建模块] 候选来源：r678 探测器 B 族遗留队列，本轮用
 * scripts/round-680-family-probe.js 在 124 维引擎上复量（判据从严：
 * 只有 gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；良性被
 * block/rewrite 即误伤；≥50% 攻击漏判且良性 0 误伤才算合格）：
 * B 族攻击 10 条漏判 8 条（80%）、全维度零命中 8 条、良性 6 条 0 误伤
 * （另 2 条分别被 medical_coercion / liberty_restriction 判 verify，
 * 新维度仍命中）。decision 本体一次选出（/tmp/decide-run.js 读
 * /tmp/decide-opts.json，composite_score 0.92 / confidence 0.85 /
 * identity alignment 100%，无拒选）：A deprivation_coercion 0.92 >
 * B substance_coercion 0.89 > C love_bombing 0.84 > D 探新族 0.77。
 * 本轮是心虫选的，不是拍板的。
 *
 * 辨别的族：「基本需求剥夺」（deprivation coercion）——操控者把对方
 * 的**基本生存需求**（睡眠/食物/如厕/饮水/取暖/庇护所/医疗可及）
 * 当成惩罚或胁迫的杠杆：以「不服从就不给」的条件结构、强制姿势
 * 与位置惩罚、需求剥夺作惩罚宣告三种形态，逼迫对方服从。这是权力
 * 不对等场景中虐待与控制的早期生存信号（Duluth 控制轮的「恐吓」
 * 与「经济/健康控制」的生存版）：
 *   今晚不许睡，跪到我原谅你为止。
 *   不听话就不给你饭吃，饿到你知道错。
 *   不认错就别想上厕所，憋着。
 *   No dinner until you apologize. Stay in your room, hungry.
 *
 * 为什么现有 124 个维度拦不住（r681 discriminate() 零命中实测）：
 *   漏判样本的形状全部在既有维度射程之外——economic_control 管
 *   **经济支配结构**（收入归属移交/支出审批/工作断绝，是持续管辖
 *   不是以剥夺为罚），liberty_restriction 管**人身自由与行动物品**
 *   （锁屋里/没收手机/禁足），medical_coercion 管**医疗自主**
 *   （禁止就医/强制停药/替代疗法），都不覆盖「以睡眠/饭食/如厕/
 *   取暖/庇护所/医疗可及的剥夺作惩罚杠杆」这个组合；样本 4（停了
 *   你的药）虽被 medical_coercion 判 verify、样本 7（锁阳台）虽被
 *   liberty_restriction 判 verify，但剥夺对象分别是**基本需求**且
 *   本维度提供「条件/惩罚目的」判据。
 *
 * 判据（三条独立通路 + 一条英文通路，任中一类即判定）：
 *   · P1 条件剥夺结构（COND 条件腿 × NEED_DEPRIVE 需求剥夺腿，双腿
 *     共现；需求腿必须带**祈使禁止形**（不许/不准/不让/别想+需求）
 *     或**指向对方**的剥夺形（不给/停/断/扣 + 你/他/她的 + 需求），
 *     裸「不吃药就看不好」这类事实条件句不判）；
 *   · P2 强制姿势/位置惩罚（POSTURE 姿势腿 × PUNISH_TIME 时限腿，
 *     中英双腿）；
 *   · P3 需求剥夺作惩罚宣告（WITHHOLD 剥夺动词 × NEED_OBJ 需求对象
 *     × PUNISH_PURPOSE 惩罚目的，三腿共现——缺惩罚目的后件的
 *     「我不给你开空调」可能只是陈述）；
 *   · P4 英文条件剥夺（COND_EN × NEED_EN，双腿共现）。
 *
 * 明确不判的（守门 G1-G4）：
 *   · G1 权利/规范/教育陈述（剥夺基本生活需求属于虐待/应当保障/
 *     有权获得/不得以…剥夺/可以报警；英文 is a form of abuse /
 *     basic needs / human rights）；
 *   · G2 正当管教讨论（暂停孩子的零食是常见的教育方式/合理的零花
 *     钱管理/培养金钱观念；英文 reasonable consequences / time-out）；
 *   · G3 医疗与流程语境（术前禁食/空腹/医嘱/服药期间——正当医疗
 *     指令不是剥夺）；
 *   · G4 句首咨询提问（如何…/What should I do…）。
 *
 * 边界（与相邻维度的分工，测试锁住）：
 *   · economic_control（r668）管经济支配结构（工资卡上交/支出审批/
 *     我养你），本族的「零花钱全扣了」须带惩罚目的后件且不涉收入
 *     归属移交；
 *   · liberty_restriction（r679）管人身自由（锁屋里/没收证件/禁足），
 *     本族的「不许进屋/楼道站着」侧重点是庇护所与生存条件剥夺且
 *     须带条件或时限结构；
 *   · medical_coercion（r680）管医疗自主（禁止就医/强制替代疗法），
 *     本族的「停了你的药/不给钱治病」侧重点是基本需求作惩罚杠杆。
 *
 * [r681 实现纪律] 同 r642-r680：所有正则源串一律走 String.raw。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 英文分支的间隔符必须用 [^.]（中文 [^。] 管不住英文句点）。
 * ⚠️ isZh 判定用字面端点 /[一-龿]/——绕开写盘层的反斜杠转义。
 */

'use strict';

// ─── P1: 条件剥夺结构（COND 条件腿 × NEED_DEPRIVE 需求剥夺腿）────────
// 条件腿：不X就/不X别想/直到…为止/先…再/什么时候…再。单独出现不判
// （「不吃饭就没力气」是事实条件句，须与需求腿共现）。
const COND_ZH = new RegExp([
  String.raw`(?:不|没|再不|要是不|如果不|要是|如果|除非)[^。]{0,10}(?:就|才|别想|不许|不准|不让)`,
  String.raw`(?:到|等到|等)[^。]{0,12}(?:为止|再|才|再说)`,
  String.raw`先[^。]{0,10}再`,
  String.raw`(?:什么时候|何时)[^。]{0,10}(?:再|才)`,
].join('|'), 'i');

// 需求剥夺腿：两种形态任中一种——
// (a) 祈使禁止形：不许/不准/不让/别想/禁止/免谈 + 基本需求
//     （「不许睡」「别想上厕所」「不准进屋」「别想吃东西」）
// (b) 指向对方的剥夺形：不给/没有/停/断/扣/收 + 你/他/她的 + 需求
//     （「不给你饭吃」「停了你的药」「扣了他的生活费」）
// (b2) 饿/渴/冻/热作剥夺（「饿你三天」「饿到求饶」）
// 刻意不收裸事实条件（「不吃药就看不好」/「不睡觉会头疼」）——
// 那是事实陈述不是剥夺，且会在正常医疗/健康建议里大量误伤。
const NEED_DEPRIVE_ZH = new RegExp([
  // (a) 祈使禁止形（禁止动词直接贴需求，隐含对方为对象）
  String.raw`(?:不许|不准|不让|别想|禁止|免谈|甭想)[^。]{0,6}(?:睡|睡觉|觉|吃|喝|饭吃|吃饭|饭|食物|上厕所|如厕|洗手间|开空调|空调|暖气|取暖|热水|喝水|水喝|进屋|进门|回家|治病|治疗|买药|吃药|打针|复查)`,
  // (b) 指向对方的剥夺形（剥夺动词 + 人称 + 需求）
  String.raw`(?:不给|没有|没|停|断|扣|收|关)[^。]{0,4}(?:你|您|他|她|孩子|对方的)的?[^。]{0,6}(?:饭吃|吃饭|饭|食物|吃|喝|睡|睡觉|觉|上厕所|如厕|洗手间|空调|暖气|取暖|热水|喝水|水喝|进屋|进门|回家|治病|治疗|药|药品|疗程|零花钱|生活费)`,
  // (b2) 饿/渴/冻/热作剥夺（目标为对方或时限量化）
  String.raw`(?:饿|渴|冻|热)[^。]{0,6}(?:你|您|他|她|几天|三天|两顿|一顿|求饶)`,
  // (b3) 条件准入形（「什么时候认错了再给你进屋」——准入本身被条件化）
  String.raw`(?:再|才)[^。]{0,4}(?:给|让|准)[^。]{0,2}(?:你|您|他|她|孩子)[^。]{0,4}(?:进屋|进门|回家|饭吃|吃饭|饭|睡|睡觉|吃|喝|上厕所|如厕|药|治疗|空调|暖气)`,
  // (b4) 人称前置形（「你就没有饭吃」——剥夺动词在人称后）
  String.raw`(?:你|您|他|她|孩子|对方)(?:就|也|都)?(?:没有|没)[^。]{0,4}(?:饭吃|吃饭|饭|食物|睡|睡觉|吃|喝|水|药|治疗|空调|暖气|热水)`,
].join('|'), 'i');

// ─── P2: 强制姿势/位置惩罚（POSTURE 姿势腿 × PUNISH_TIME 时限腿）────
// 姿势腿只收**惩罚性姿势**（跪/面壁/罚站/特定位置站立），不收裸
// 「站着」——「他站在车站等车，天亮再出发」会误伤。
const POSTURE_ZH = new RegExp([
  String.raw`(?:跪下|跪着|跪在|面壁|罚站|扎马步|马步|顶书|举着手|双手举|趴着|蹲着)`,
  String.raw`(?:在|于)[^。]{0,4}(?:楼道|走廊|阳台|雪地|太阳下|门外|角落|院里|客厅|地上|厕所)(?:里|中|下|外)?(?:站|蹲|跪|趴|坐)`,
  String.raw`(?:楼道|走廊|阳台|门外|雪地|太阳下|角落|院里|客厅|地上)(?:里|中|外)?(?:站|蹲|跪|坐)`,
].join('|'), 'i');

// 时限腿：到我原谅你为止/天亮再进来/不写完检讨不许/反思一小时…
const PUNISH_TIME_ZH = new RegExp([
  String.raw`(?:什么时候|何时)[^。]{0,10}(?:再|才)`,
  String.raw`(?:到|等到|等)[^。]{0,12}(?:为止|再|才|再说)`,
  String.raw`(?:天亮|明天|中午|下午|晚上|深夜|一小时后|两小时|几个小时|反思[^。]{0,4}|反省[^。]{0,4})(?:之后|以后|再|才)`,
  String.raw`(?:再|才)(?:进来|进屋|进门|回家|出来|吃饭|睡觉|上床|进屋去)`,
  String.raw`不[^。]{0,8}(?:不许|不准|别想|才能|再说)`,
].join('|'), 'i');

// P2 英文侧（kneel / stand there / face the wall × until I forgive you…）
const POSTURE_EN = new RegExp([
  String.raw`\b(?:kneel|kneeling|kneel\s+down)\b`,
  String.raw`\b(?:stand|standing)\s+(?:there|in\s+the\s+corner|outside)\b`,
  String.raw`\bface\s+the\s+wall\b`,
].join('|'), 'i');

const PUNISH_TIME_EN = new RegExp([
  String.raw`\buntil\s+(?:i|he|she|they)\s+(?:forgive|forgives|forgave|calm|calms|calmed|say\s+otherwise)\b`,
  String.raw`\b(?:not|no)\s+\w+[^.]{0,20}\buntil\b`,
  String.raw`\buntil\s+(?:you|he|she|they)\s+(?:finish|complete|write|learn|admit|confess)\w*`,
].join('|'), 'i');

// ─── P3: 需求剥夺作惩罚宣告（三腿共现，缺一不判）────────────────────
// 剥夺动词腿（停/扣/断/关/不给…）
const WITHHOLD_ZH = new RegExp([
  String.raw`(?:不给|不许|不准|不让|免谈|停了|停掉|扣了|扣光|断了|断掉|断了粮|断了水|收了|关了|关掉|断水|断电|停水|停电)`,
].join(''), 'i');

// 需求对象腿（基本需求与可及性）
const NEED_OBJ_ZH = new RegExp([
  String.raw`(?:饭|食物|吃饭|水|喝水|睡|睡觉|觉|厕所|如厕|洗手间|空调|暖气|取暖|热水|电|药|药品|治病|治疗|疗程|零花钱|生活费|粮|口粮|回家|进屋|进门|复查|产检)`,
].join(''), 'i');

// 惩罚目的腿（长记性/知道错/饿着/看你…）
// 刻意不含「为你好」「教育」等正当管教措辞。
const PUNISH_PURPOSE_ZH = new RegExp([
  String.raw`(?:长记性|长点记性|吃苦头|吃苦|知道错|知道厉害|认错|错在哪|错在哪儿|反省|反思|惩罚|罚你|饿着|饿到|冷着|热着|冻着|憋着|看你|受苦|教训|记住教训|什么都不用|啥都不给|服不服|求饶)`,
].join(''), 'i');

// ─── P4: 英文条件剥夺（COND_EN × NEED_EN，双腿共现）────────────────
const COND_EN = new RegExp([
  String.raw`\buntil\s+(?:you|he|she|they)\b`,
  String.raw`\bif\s+you\s+(?:don'?t|do\s+not|refuse|fail|won'?t)\b`,
  String.raw`\b(?:no|not)\s+\w+[^.]{0,24}\buntil\b`,
].join('|'), 'i');

const NEED_EN = new RegExp([
  String.raw`\bno\s+(?:dinner|food|meals?|breakfast|lunch|supper|sleep|water|bathroom|heat|medication|medicine|treatment|air\s+conditioning)\b`,
  String.raw`\b(?:go\s+to\s+bed|sleep)\s+hungry\b`,
  String.raw`\bwithh(?:old|olding)\s+(?:your\s+)?(?:food|meals?|medication|medicine|treatment|money)\b`,
  String.raw`\b(?:not\s+allowed|can'?t|cannot|forbidden)\s+(?:to\s+)?(?:sleep|eat|use\s+the\s+bathroom|see\s+a\s+doctor|come\s+in|enter)\b`,
  String.raw`\b(?:starve|starving)\s+(?:you|him|her)\b`,
].join('|'), 'i');

// ─── G1/G2/G3: 守门（权利/规范/教育、正当管教、医疗流程语境）────────
const CONCEPT_ZH = new RegExp([
  // 权利与规范陈述
  String.raw`(?:剥夺|扣留|限制|削减)[^。]{0,12}(?:基本生活需求|生存需求|基本需求|人身权利|生存权利|生活必需品)`,
  String.raw`(?:属于|构成|涉嫌|是)[^。]{0,8}(?:虐待|忽视|遗弃|违法|犯罪|暴力)`,
  String.raw`(?:有权|权利|权益)[^。]{0,10}(?:获得|享有|保障|需求|生存)`,
  String.raw`(?:应当|必须|要|应)[^。]{0,6}(?:保障|确保|满足)[^。]{0,10}(?:需求|生存|生活|饮食|如厕|饮水)`,
  String.raw`不得以[^。]{0,14}剥夺`,
  String.raw`(?:报警|求助|妇联|居委会|村委会|未成年人保护|反家暴|儿童保护|民政部门|社工)`,
  // 正当管教与教育讨论
  String.raw`暂停[^。]{0,8}(?:零食|甜食|玩具|游戏|手机|电视|娱乐)`,
  String.raw`(?:合理|适度|适当|正常|常见的)的?(?:零花钱|零用钱|管理|管教|惩罚|教育|教育方式|做法)`,
  String.raw`(?:培养|树立)[^。]{0,8}(?:金钱观念|理财观念|消费观念|习惯)`,
  // 医疗与流程语境
  String.raw`术前|产后|检验前|检查前|空腹|禁食|禁水|医嘱|服药期间|治疗期间|隔离|医学观察|术后`,
].join('|'), 'i');

const CONCEPT_EN = new RegExp([
  String.raw`\bwithholding\s+food[^.]{0,40}\b(?:is|as)\s+(?:a\s+form\s+of\s+)?(?:abuse|neglect)\b`,
  String.raw`\bbasic\s+needs\b`,
  String.raw`\bhuman\s+rights\b`,
  String.raw`\bchild\s+(?:abuse|neglect|protection)\b`,
  String.raw`\b(?:is|are)\s+(?:a\s+form\s+of\s+)?(?:abuse|neglect)\b`,
  String.raw`\breasonable\s+(?:consequences?|discipline|punishment|allowance)\b`,
  String.raw`\btime-?out\b`,
].join('|'), 'i');

// ─── G4: 句首咨询提问（只认句首，句中反问不豁免）────────────────────
// 疑问形状含疑问词与指示代词主语（「这个惩罚方式合适吗？」是咨询
// 不是胁迫——同 r680 教训，指示代词开头必须豁免）。
const QUESTION_ZH = new RegExp([
  String.raw`^\s*(?:如何|怎么|怎样|为什么|为何|是否|能不能|可不可以|该不该|要不要|应不应该|遇到|面对|这个|那个|这种|那种|有人|别人|大家|网上|据说|听说)[^。]{0,40}[?？]`,
].join(''), 'i');

const QUESTION_EN = new RegExp([
  String.raw`^\s*(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i|does|are\s+there|what\s+can\s+i)\b[^.]{0,50}\?`,
].join(''), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkDeprivationCoercion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const COND_ZH_ = R.COND_ZH || COND_ZH;
  const NEED_DEPRIVE_ZH_ = R.NEED_DEPRIVE_ZH || NEED_DEPRIVE_ZH;
  const POSTURE_ZH_ = R.POSTURE_ZH || POSTURE_ZH;
  const PUNISH_TIME_ZH_ = R.PUNISH_TIME_ZH || PUNISH_TIME_ZH;
  const POSTURE_EN_ = R.POSTURE_EN || POSTURE_EN;
  const PUNISH_TIME_EN_ = R.PUNISH_TIME_EN || PUNISH_TIME_EN;
  const WITHHOLD_ZH_ = R.WITHHOLD_ZH || WITHHOLD_ZH;
  const NEED_OBJ_ZH_ = R.NEED_OBJ_ZH || NEED_OBJ_ZH;
  const PUNISH_PURPOSE_ZH_ = R.PUNISH_PURPOSE_ZH || PUNISH_PURPOSE_ZH;
  const COND_EN_ = R.COND_EN || COND_EN;
  const NEED_EN_ = R.NEED_EN || NEED_EN;
  const CONCEPT_ZH_ = R.CONCEPT_ZH || CONCEPT_ZH;
  const CONCEPT_EN_ = R.CONCEPT_EN || CONCEPT_EN;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;
  const QUESTION_EN_ = R.QUESTION_EN || QUESTION_EN;

  // isZh 判定用字面端点 /[一-龿]/（等价 一-鿿）——绕开写盘层的
  // 反斜杠转义（r675/r676 的 \u 形式曾被写成双层反斜杠恒 false，
  // 只影响 detail 文案；字面端点不含任何反斜杠，零风险）。
  const isZh = /[一-龿]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '基本需求剥夺×条件剥夺/姿势惩罚/惩罚宣告(zh)'
      : 'deprivation-coercion×conditional-withholding/posture-punishment/punishment-declaration(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（三类共用）：权利/规范/教育、正当管教、医疗流程、句首咨询
  if (CONCEPT_ZH_.test(text)) return miss();
  if (CONCEPT_EN_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();
  if (QUESTION_EN_.test(text)) return miss();

  // P1 条件剥夺结构（COND × NEED_DEPRIVE 双腿共现）
  if (COND_ZH_.test(text) && NEED_DEPRIVE_ZH_.test(text)) return hitResult;
  if (COND_EN_.test(text) && NEED_EN_.test(text)) return hitResult;
  // P2 强制姿势/位置惩罚（POSTURE × PUNISH_TIME 双腿共现，中英）
  if (POSTURE_ZH_.test(text) && PUNISH_TIME_ZH_.test(text)) return hitResult;
  if (POSTURE_EN_.test(text) && PUNISH_TIME_EN_.test(text)) return hitResult;
  // P3 需求剥夺作惩罚宣告（WITHHOLD × NEED_OBJ × PUNISH_PURPOSE 三腿共现）
  if (WITHHOLD_ZH_.test(text) && NEED_OBJ_ZH_.test(text) && PUNISH_PURPOSE_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkDeprivationCoercion,
  __internals: () => ({
    COND_ZH, NEED_DEPRIVE_ZH,
    POSTURE_ZH, PUNISH_TIME_ZH, POSTURE_EN, PUNISH_TIME_EN,
    WITHHOLD_ZH, NEED_OBJ_ZH, PUNISH_PURPOSE_ZH,
    COND_EN, NEED_EN,
    CONCEPT_ZH, CONCEPT_EN, QUESTION_ZH, QUESTION_EN,
  }),
};
