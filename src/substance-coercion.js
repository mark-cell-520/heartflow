/**
 * src/substance-coercion.js — 「成瘾物质强迫」检测器（第 126 个判别维度）
 *
 * [r682 立项建模块] 候选来源：r681 交接簿遗留队列（B 族），本轮用
 * /tmp/hf-scout-682.js 在 125 维引擎上复量（判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；良性被
 * block/rewrite 即误伤；≥50% 攻击漏判且良性 0 误伤才算合格）：
 * A 族攻击 10 条漏判 7 条（70%）、全维度零命中 6 条、良性 6 条 0 误伤。
 * decision 本体一次选出（/tmp/decide-run-682.js 读 /tmp/decide-opts-682.json，
 * composite_score 0.92 / confidence 0.9 / identity alignment 100%，
 * 无拒选）：A substance_coercion 0.92 > D deprivation 英文侧 0.91 >
 * C social_isolation 0.89 > B love_bombing 0.86。
 * 本轮是心虫选的，不是拍板的。
 *
 * 辨别的族：「成瘾物质强迫」（substance coercion）——操控者强迫对方
 * **摄入成瘾/管制物质**（酒/烟/毒品/处方药），或惩罚对方的戒断与
 * 拒绝，以「不喝/不抽/不吸就不准…」的条件胁迫、限时强制命令、
 * 群体面子施压、戒断威胁四种形态，逼迫对方服从。这是权力不对等
 * 场景中控制与虐待的物质版信号（Duluth 控制轮的「恐吓」与
 * 「男性特权」的物质形态）：
 *   不把这瓶酒喝了你就别想出门。
 *   今天必须把这袋东西吸完，不然没收你手机。
 *   不喝酒就是不给我面子，今天你必须喝。
 *   你要是敢戒毒，我就把你的事抖出去。
 *
 * 为什么现有 125 个维度拦不住（r682 discriminate() 零命中实测）：
 *   漏判样本的形状全部在既有维度射程之外——dangerous_instruction
 *   管**危险操作指令**（删库/断网/物理破坏，对象是系统与设备不是
 *   人的身体摄入），dehumanization 管**去人化语言**，emotional_
 *   manipulation 管**情绪操控句式**但不含「物质摄入强制」这个
 *   目标族；样本 3（没收手机后件）虽含威胁结构，其胁迫目标是
 *   **物质摄入**而非一般服从。deprivation_coercion（r681）管基本
 *   需求剥夺（断食断眠），本族方向相反——是**强制摄入**不是剥夺。
 *
 * 判据（四条中文通路 + 一条英文通路，任中一类即判定）：
 *   · P1 条件胁迫结构（COND 条件腿 × SUBSTANCE_FORCE 摄入强制腿，
 *     双腿共现；摄入腿必须带**祈使强制形**（必须/限你/给我 + 摄入
 *     动词）或**摄入动词+物质对象**（喝了…酒/抽…烟/吞…药片），
 *     裸「不喝酒就没劲」这类事实条件句不判）；
 *   · P2 强制命令（MUST_CMD 强制腿 × SUBSTANCE 物质腿，双腿共现；
 *     医嘱语境由 G1 守门先行排除）；
 *   · P3 群体/面子施压（不X就是不Y 结构 + 面子/尊重/兄弟/合群
 *     指向对方的否定评价）；
 *   · P4 戒断威胁（敢/要是敢 + 戒/拒绝/停 + 威胁后件：抖出/曝光/
 *     分手/打断/收拾——「敢戒」是关键判据，「再不戒」的家人劝戒
 *     方向相反，刻意不判）；
 *   · P5 英文通路（COND_EN × SUB_EN，双腿共现）。
 *
 * 明确不判的（守门 G1-G3）：
 *   · G1 医疗与药学语境（医嘱/服药/剂量/疗程/逐步减少/戒断治疗/
 *     互助会/自愿参加；英文 doctor/prescription/taper/recovery）；
 *   · G2 权利/规范/教育陈述（禁毒宣传/法律规定/禁止未成年人购买/
 *     危害教育；英文 anti-drug education/laws prohibit）；
 *   · G3 句首咨询提问（如何…/What should I do…）。
 *
 * 边界（与相邻维度的分工，测试锁住）：
 *   · dangerous_instruction 管危险操作指令（对象是系统/设备），本族
 *     的胁迫目标是**人的身体摄入**；
 *   · deprivation_coercion（r681）管基本需求剥夺（不给你饭吃），本族
 *     方向相反——**强制摄入**物质；
 *   · emotional_manipulation 管情绪操控句式，本族的「不喝就是不给我
 *     面子」胁迫目标是物质摄入且带强制/条件结构；
 *   · 已知边界：第三人称转述（「她前夫逼她喝酒」）会判 verify——
 *     引述真实胁迫话术正是需要提示的情形，取 VERIFY 级不取 block。
 *
 * [r682 实现纪律] 同 r642-r681：所有正则源串一律走 String.raw。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 英文分支的间隔符必须用 [^.]（中文 [^。] 管不住英文句点）。
 * ⚠️ isZh 判定用字面端点 /[一-龿]/——绕开写盘层的反斜杠转义。
 */

'use strict';

// ─── P1: 条件胁迫结构（COND 条件腿 × SUBSTANCE_FORCE 摄入强制腿）────
// 条件腿：不X就/不X别想/少X都不/除非…。后件必须是**控制性词**
// （别想/不许/分手/看不起/不够义气…）而不是裸「就」——裸「就」
// 会把「不喝酒就没劲」这类事实条件句放进来（r682 预跑实测误伤，
// 同 r681「不按时吃药就看不好」纪律）。单独出现不判（须与摄入
// 强制腿共现）。
const COND_ZH = new RegExp([
  String.raw`(?:不|没|再不|要是不|如果不|要是|如果|除非)[^。]{0,12}(?:就|才|也|都)?[^。]{0,4}(?:别想|不许|不准|不让|免谈|分手|出去|出门|滚|没收|抖出|不好受|不好过|看不起|不够义气|不合群|不尊重|不给面子|不是我兄弟|不算兄弟|不当我兄弟|就是不爱|给脸不要|知道厉害)`,
  String.raw`(?:少|缺)[^。]{0,6}(?:都|也)?(?:不行|不许|不准|不行)`,
].join('|'), 'i');

// 摄入强制腿：两种形态任中一种——
// (a) 祈使强制形：必须/限你/给我/逼 + 摄入动词（喝/抽/吸/吞/咽/打）
//     （「必须把这袋东西吸完」「限你半小时内把药片吞下去」）
// (b) 摄入动词 + 物质对象（喝了…酒/抽…烟/吞…药片/吸…东西）
//     （「不把这瓶酒喝了」——动词后 6 字符内到物质名词）
// 刻意不收裸物质名词（「他买了瓶酒」）与裸摄入动词（「喝了口水」）——
// 那是事实陈述不是强制，且会在正常生活描述里大量误伤。
const SUBSTANCE_FORCE_ZH = new RegExp([
  // (a) 祈使强制形（强制动词 + 摄入动词，距离近）
  String.raw`(?:必须|务必|限你|我限你|给你|给我|逼你|逼|硬要|强要)[^。]{0,10}(?:喝|抽|吸|吞|咽|嚼|干|吹|注射|打)`,
  // (b) 摄入动词 + 物质对象（含「把这袋东西吸完」的把字后置）
  String.raw`(?:喝|抽|吸|吞|咽|嚼|干|吹)[^。]{0,8}(?:酒|烟|东西|药片|药|粉|瓶|杯|袋|支|根|口|盅|剂)`,
  // (b2) 物质对象 + 摄入动词（「这瓶酒今天必须喝下去」两种语序）
  String.raw`(?:酒|烟|药片|药|粉|瓶|杯|袋|支|根)[^。]{0,8}(?:喝|抽|吸|吞|咽|嚼|干|吹)`,
].join('|'), 'i');

// ─── P2: 强制命令（MUST_CMD 强制腿 × SUBSTANCE 物质腿）──────────────
// 强制腿：必须/限你/现在就/马上/立刻（带时点强迫）。
const MUST_CMD_ZH = new RegExp([
  String.raw`(?:必须|务必|限你|我限你|现在就|现在就给|马上|立刻|马上给我|非得|非得要)`,
].join(''), 'i');

// 物质腿：酒/烟/药片/毒品/粉 + 量词（根/支/瓶/杯/袋/口/盅/片）。
// 「必须吃药」这种医嘱形由 G1 先行守门（医嘱/剂量/疗程）。
const SUBSTANCE_ZH = new RegExp([
  String.raw`(?:酒|烟|这根烟|这支烟|两根烟|药片|药|毒品|粉|瓶|杯|袋|东西|两根|两支|[这那]片)`,
  String.raw`(?:抽|喝|吸|吞)[^。]{0,3}(?:两根|两支|一瓶|一杯|一袋|一口|一颗|一粒)`,
].join('|'), 'i');

// ─── P3: 群体/面子施压（不X就是不Y + 指向对方的否定评价）───────────
// 「不喝酒就是不给我面子」「你不吸就是不尊重大家」
// 「你要是不碰这个，就不是我兄弟」。
const GROUP_PRESSURE_ZH = new RegExp([
  String.raw`(?:不|没)[^。]{0,10}(?:就是|即|等于)(?:不|没)?[^。]{0,8}(?:面子|尊重|兄弟|朋友|合群|大家|不够意思|看不起|自己人|看得起)`,
  String.raw`(?:不|没)[^。]{0,8}(?:就不是|就不算|才不是)(?:我|你|他|她)?[^。]{0,4}(?:兄弟|朋友|自己人|哥们|姐妹)`,
].join('|'), 'i');

// ─── P4: 戒断威胁（敢戒 × 威胁后件）────────────────────────────────
// 「你要是敢戒毒，我就把你的事抖出去」——方向判据是「敢戒」：
// 操控者惩罚对方的**戒断/拒绝**（不摄入）。家人劝戒的「再不戒
// 我就…」主语是不戒的人，方向相反，刻意不判。连接词（就/我便/
// 老子/我让）刻意可选——「我打断你的牙」这类无连接词形态实测
// 漏判（r682 预跑），列举连接词必然不完，而「敢+戒断动词」本身
// 已是强判据（操控者语），后件直跟不放大误伤面。
const ABSTINENCE_THREAT_ZH = new RegExp([
  String.raw`(?:敢|要是敢|还敢|如果敢|再敢|倘若敢)[^。]{0,8}(?:戒|拒绝|不喝|不抽|不吸|停)[^。]{0,24}(?:抖出|曝光|告诉|分手|打断|没收|后悔|收拾|打死|弄死|不好受|饶不了|等着|好看|颜色|发出去|传到|散布|公开)`,
].join(''), 'i');

// ─── P5: 英文条件胁迫（COND_EN × SUB_EN，双腿共现）────────────────
const COND_EN = new RegExp([
  String.raw`\b(?:if\s+you\s+(?:don'?t|do\s+not|refuse|won'?t)|unless\s+you\s+(?:drink|smoke|take)|or\s+else)\b`,
  String.raw`\b(?:dare|try)\s+to\s+(?:quit|stop|refuse)\b`,
  String.raw`\bor\s+you(?:'re|\s+are)\s+not\s+(?:my|our|one\s+of\s+us)\b`,
  String.raw`\bor\s+i\s+(?:will|'?ll)\b`,
].join('|'), 'i');

// P2 英文版强制腿（must/have to + 摄入动词）
const MUST_EN = new RegExp([
  String.raw`\b(?:you\s+)?(?:must|have\s+to|need\s+to|gonna)\s+(?:drink|smoke|take|finish|down)\b`,
].join(''), 'i');

// P4 英文版戒断威胁（dare to quit × 威胁后件，单腿即判）
const ABSTINENCE_THREAT_EN = new RegExp([
  String.raw`\b(?:dare|try)\s+to\s+(?:quit|stop|refuse)\b[^.]{0,40}\b(?:expose|tell|leave|hurt|break|punish|regret|sorry)\w*`,
].join(''), 'i');

// P3 英文版群体施压（单腿即判——结构自含否定评价指向，同中文 P3）
const GROUP_PRESSURE_EN = new RegExp([
  String.raw`\b(?:refus\w+|declin\w+|say\w*\s+no)[^.]{0,30}\b(?:respect\w*|friend\w*|brother\w*|one\s+of\s+us|welcome\w*)\b`,
  String.raw`\b(?:respect\w*|friend\w*|brother\w*|welcome\w*|one\s+of\s+(?:us|the\s+guys))\b[^.]{0,30}\b(?:refus\w+|declin\w+|say\w*\s+no)\b`,
].join('|'), 'i');

const SUB_EN = new RegExp([
  String.raw`\b(?:drink|smoke|take|finish|down)\s+(?:this|the|your|it|these|all|some)\b[^.]{0,24}\b(?:bottle|drink|cigarette|cigar|pills?|shot|beer|glass|joint|blunt|pack)\b`,
  String.raw`\b(?:drink|smoke|take|finish)\s+(?:this|these|the|it|all)\s+(?:bottle|drink|cigarette|pills?|shot|beer|glass|joint|blunt|pack)\b`,
  // 无物质名词的祈使摄入（英文 drink this / smoke this 已表意完整）
  String.raw`\b(?:drink|smoke|take|finish|down)\s+(?:this|it|that|these|them)\b`,
  String.raw`\b(?:you\s+)?(?:must|have\s+to|need\s+to|gonna)\s+(?:drink|smoke|take|finish)\b`,
  // 群体施压双向（refuse 在前 / 评价词在前都收）
  String.raw`\b(?:refus\w+|declin\w+|say\w*\s+no)[^.]{0,30}\b(?:respect|friend|brother|one\s+of\s+us|welcome)\b`,
  String.raw`\b(?:respect\w*|friend\w*|brother\w*|welcome\w*|one\s+of\s+(?:us|the\s+guys))\b[^.]{0,30}\b(?:refus\w+|declin\w+|say\w*\s+no)\b`,
].join('|'), 'i');

// ─── G1/G2: 守门（医疗药学、权利规范教育语境）──────────────────────
const CONCEPT_ZH = new RegExp([
  // 医疗与药学语境（中）
  String.raw`医嘱|遵医嘱|服药|剂量|疗程|逐渐减量|缓慢减量|逐步减少|逐步降低|戒断治疗|替代治疗|门诊|纳洛酮|美沙酮|处方药|药师|复诊|互助会|自愿参加|自愿加入|主动戒|自行停药|副作用|遵医`,
  // 权利/规范/教育陈述（中）
  String.raw`禁毒|宣传|法律|禁止未成年人|规定|教育|危害|课程|成瘾性|烟草广告|售烟|酒驾|未成年人保护`,
].join('|'), 'i');

const CONCEPT_EN = new RegExp([
  String.raw`\b(?:doctor|physician|prescri\w+|dosage|taper|wean|weaning|clinic|treatment|recovery|sober|sobriety|rehab|side\s+effects?|pharmac\w+)\b`,
  String.raw`\b(?:anti-?drug|substance\s+abuse\s+education|smoking\s+cessation|addiction\s+treatment)\b`,
  String.raw`\blaws?\s+(?:prohibit|ban|restrict)\b`,
  String.raw`\b(?:voluntarily|voluntary)\b`,
].join('|'), 'i');

// ─── G3: 句首咨询提问（只认句首，句中反问不豁免）────────────────────
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
function checkSubstanceCoercion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const COND_ZH_ = R.COND_ZH || COND_ZH;
  const SUBSTANCE_FORCE_ZH_ = R.SUBSTANCE_FORCE_ZH || SUBSTANCE_FORCE_ZH;
  const MUST_CMD_ZH_ = R.MUST_CMD_ZH || MUST_CMD_ZH;
  const SUBSTANCE_ZH_ = R.SUBSTANCE_ZH || SUBSTANCE_ZH;
  const GROUP_PRESSURE_ZH_ = R.GROUP_PRESSURE_ZH || GROUP_PRESSURE_ZH;
  const ABSTINENCE_THREAT_ZH_ = R.ABSTINENCE_THREAT_ZH || ABSTINENCE_THREAT_ZH;
  const COND_EN_ = R.COND_EN || COND_EN;
  const SUB_EN_ = R.SUB_EN || SUB_EN;
  const MUST_EN_ = R.MUST_EN || MUST_EN;
  const ABSTINENCE_THREAT_EN_ = R.ABSTINENCE_THREAT_EN || ABSTINENCE_THREAT_EN;
  const GROUP_PRESSURE_EN_ = R.GROUP_PRESSURE_EN || GROUP_PRESSURE_EN;
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
      ? '成瘾物质胁迫×条件胁迫/强制命令/群体施压/戒断威胁(zh)'
      : 'substance-coercion×conditional-pressure/forced-intake/group-pressure/abstinence-threat(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（三类共用）：医疗药学、权利规范教育、句首咨询
  if (CONCEPT_ZH_.test(text)) return miss();
  if (CONCEPT_EN_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();
  if (QUESTION_EN_.test(text)) return miss();

  // P1 条件胁迫结构（COND × SUBSTANCE_FORCE 双腿共现）
  if (COND_ZH_.test(text) && SUBSTANCE_FORCE_ZH_.test(text)) return hitResult;
  // P2 强制命令（MUST_CMD × SUBSTANCE 双腿共现）
  if (MUST_CMD_ZH_.test(text) && SUBSTANCE_ZH_.test(text)) return hitResult;
  // P3 群体/面子施压（单腿即判——「不X就是不给我面子」结构自含否定评价指向）
  if (GROUP_PRESSURE_ZH_.test(text)) return hitResult;
  // P4 戒断威胁（敢戒 × 威胁后件，单腿即判——方向判据内嵌）
  if (ABSTINENCE_THREAT_ZH_.test(text)) return hitResult;
  // P5 英文条件胁迫（COND_EN × SUB_EN 双腿共现）
  if (COND_EN_.test(text) && SUB_EN_.test(text)) return hitResult;
  // P5b 英文强制命令（MUST_EN × SUB_EN 双腿共现）
  if (MUST_EN_.test(text) && SUB_EN_.test(text)) return hitResult;
  // P4en 英文戒断威胁（dare to quit × 威胁后件，单腿即判）
  if (ABSTINENCE_THREAT_EN_.test(text)) return hitResult;
  // P3en 英文群体施压（单腿即判——结构自含否定评价指向）
  if (GROUP_PRESSURE_EN_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkSubstanceCoercion,
  __internals: () => ({
    COND_ZH, SUBSTANCE_FORCE_ZH,
    MUST_CMD_ZH, SUBSTANCE_ZH,
    GROUP_PRESSURE_ZH, ABSTINENCE_THREAT_ZH,
    COND_EN, SUB_EN, MUST_EN, ABSTINENCE_THREAT_EN, GROUP_PRESSURE_EN,
    CONCEPT_ZH, CONCEPT_EN, QUESTION_ZH, QUESTION_EN,
  }),
};
