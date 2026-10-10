/**
 * src/commitment-coercion.js — 「承诺一致性胁迫」检测器（第 100 个判别维度）
 *
 * [r647 立项建模块] 候选来源：r646 探测器（scripts/round-646-family-probe.js，
 * 脚本本轮直接复用，族 D 实测）：攻击 7 条中 6 条 gate.checkOutput() 全 pass
 * （漏判 86%），其中 3 条全维度零命中；良性 6 条 0 误伤。
 * decision 本体选出（scripts/round-647-decide.js，A=0.91 / confidence 0.85 /
 * identity 100%）。Phase 1.5 同律复核：3 条零命中样本的 dimensions 除
 * evidence 弱信号外全空——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：「承诺一致性胁迫」——把**对方过去做过的承诺/保证/誓言**重新
 * 定义为当下必须履约的债务，把「重新考虑、改变主意、按新信息决策」重新
 * 定义为背信、欺骗或人格缺陷，从而剥夺对方基于当下情境重新决策的权利。
 *
 * 为什么现有维度拦不住（r646 discriminate() 零命中实测）：
 *   · favor_ledger 管把单方历史**付出**折算成对方当下的义务（人情债），
 *     本族不需要任何付出——一句「你答应过」即可，落点是承诺的约束力；
 *   · sunk_cost_coercion 管自身**沉没成本**（投入 ⇒ 必须继续），本族的
 *     主体是对方、对象是承诺而不是投入物；
 *   · double_bind / gaslighting 管矛盾指令与认知否定，本族是单向的
 *     历史承诺追溯，无「怎样都不对」的两难结构；
 *   · emotional_manipulation 管情绪施压本身，本族可以完全冷静
 *     （「按你签的条款，现在变更属于违约」）。
 *
 * 判据（双腿共现才判定，缺一不判）：
 *   · 支① PROMISE 承诺陈述（中英各一套）：承诺动词（答应/承诺/保证/
 *     发誓/起誓/签了/说好/允诺/promised/swore/guaranteed/committed）
 *     + 承诺对象（或第二人称在场）；
 *   · 支② BREACH 背信定性：改变/反悔/退出 + 说话不算话/失信/背弃/欺骗/
 *     撒谎/违约/出尔反尔，或 breaking your word / going back on it /
 *     that makes you a liar。
 *   · 单有承诺陈述不判：「他信守承诺，按时完成了交付」「守信是中华
 *     民族的传统美德」是客观陈述——缺背信定性这一腿；
 *   · 单有背信定性不判：「背弃客户信任最终会受到惩罚」没有指向对方
 *     的具体历史承诺作前提。
 *
 * 明确不判的（看守 P1-P4）：
 *   · P1 决策/合同分析语境：承诺是被分析的对象（"这是承诺一致性胁迫"/
 *     "承诺必须遵循"）——正确运用该概念的说法不判；
 *   · P2 正当履约陈述：陈述自己守信/他人守信的事实，无胁迫对象；
 *   · P3 法律/规则引述：合同条款、法律条文的客观描述（"依据合同法第X条"）；
 *   · P4 疑问/咨询句式：「怎么判断一个人是否守信？」是提问，无指向
 *     对方的背信指控。
 *
 * [r647 实现纪律] 所有正则源串一律走 String.raw：单反斜杠写进普通单引号
 * 字符串会让磁盘文本"看起来正确"而运行时值全错（同 r643/r642 先例）。
 * ⚠️ 中文分支不能写 \b：JS 的 \b 是 ASCII 词边界，中文字符之间永远不成立
 * （r645/r646 实测，症状是正则看起来正确但一条都不命中且不报错）。
 */

'use strict';

// ─── 支①左腿: 承诺陈述（承诺动词 + 承诺对象/第二人称）──────────────────
const PROMISE_ZH = new RegExp([
  // 第二人称 + 承诺动词（你答应过 / 你保证过 / 你亲口说的 / 你发了誓的）
  // [r647] 完成态助词「了」必须允许插在动词中间——「你发了誓」是「发+了+誓」
  // 结构，只写「发誓」原形整条漏判（首版实测 3/7）。正确形状是把前缀与
  // 动词都设为可选并允许「了」居中，且「誓/诺/约/言」本身就是承诺动词尾部
  // （「发了誓」后面不再接任何动词，实测教训见 locate2.js）。
  String.raw`(?:你|您|你们|当初的?你|你自己)(?:[^。]{0,4})?(?:亲口|亲口说|当面|亲口答应)?(?:[^。]{0,4})?(?:发|许|立|赌|指天)?(?:了|过)?(?:誓|诺|约|言|答应|承诺|保证|发誓|起誓|应下|应允|允诺|说好|讲好|许下|许愿|担保|保票|拍胸脯|立字据|签约|签字)(?:过|的|了)?`,
  // 承诺名词 + 完成/在场（承诺过/话说在前面/话已出口/字据签了）
  String.raw`(?:承诺|诺言|誓言|誓约|保证|保票|话|字据|契约|合同|协议|条款|约定)(?:都|已经|早就|早就说|早已)?(?:[^。]{0,3})?(?:说出|说在|说在前面|出了口|出口|算数|算得了数|签了|立下|许下|白纸黑字)(?:来|的|了)?`,
  // 「你自己说的/你亲口说的/你先前说的」类：第二人称 + 说的 + 内容
  // （「你自己说的会改，现在不改就是撒谎成性」——承诺动词是「说的」而
  // 承诺内容在后，首版只认「答应/承诺/保证」动词表整条漏判，r647 实测补）。
  String.raw`(?:你|您|你们)(?:自己|当初|先前|以前|过去|当时|一开始)?(?:[^。]{0,2})?(?:说|讲|提)(?:的|过|到)?`,
  // 「当初说好的」类（当初/开始/一开始 + 说好/讲定/应下）
  String.raw`(?:当初|一开始|最初|刚开始|开始|从前|此前|当时)(?:[^。]{0,4})?(?:说好|讲好|讲定|说定|约定|答应|应下|说好的)`,
  // 无条件式承诺（我什么都答应你 / 说什么都依你）
  String.raw`(?:说|讲)(?:[^。]{0,3})?(?:都|全)(?:答应|依|听|算数|照办)`,
  // 英文：you promised / you swore / you gave your word
  String.raw`\b(?:you|u)\s+(?:promised|swore|guaranteed|vowed|committed|gave\s+your\s+word|pledged|assured)\b`,
  String.raw`\b(?:you|u)\s+(?:said|told\s+(?:me|us|everyone))\s+(?:that\s+)?(?:you\s+)?(?:would|will|always)\b`,
  String.raw`\b(?:we|i)\s+(?:made|have)\s+(?:a\s+)?(?:promise|commitment|pact|deal|agreement)\b`,
  String.raw`\b(?:your|the)\s+(?:promise|word|commitment|vow|pledge)\b`,
  String.raw`\b(?:you|u)\s+(?:have|had)\s+(?:already\s+)?(?:promised|committed)\b`,
  String.raw`\b(?:signed|agreed\s+to|contracted\s+to|locked\s+in)\b`,
  String.raw`\b(?:you|u)\s+(?:are|were)\s+(?:the\s+one\s+who\s+)?(?:promised|committed)\b`,
].join('|'));

// ─── 支②右腿: 背信定性（改变/反悔/退出 + 失信指控）──────────────────────
const BREACH_ZH = new RegExp([
  // 反悔/变卦/退出 + 失信词（现在反悔就是说话不算话）
  String.raw`(?:反悔|变卦|改口|翻供|反口|撤回了|收回|不认|赖账|食言|悔棋|掉头|转向|改主意|改变主意|中途|现在|这时候|如今|回头|退出|放弃|停止|收手|撤出|走人|离开|分手|离婚|辞退|解约|退订|退课|退会|转投|改换|更换|跳槽|倒戈|背离|偏离)(?:[^。]{0,10})?(?:就是|等于|意味着|属于|算是|无非是|不过是)?(?:[^。]{0,10})?(?:说话不算话|说话不算数|说了不算|不算数|不算话|失信|背信|背弃|违背|背叛|食言|出尔反尔|翻脸不认|不认账|赖账|违约|违反|欺骗|撒谎|蒙骗|诈欺|不守信用|不守信|不讲信用|没有信用|人品问题|人格缺陷|不负责任|没担当|靠不住)`,
  // 「立场呢」「信用呢」类质问（无失信词，靠立场/信用/诚意名词质问）
  String.raw`(?:立场|信用|信誉|诚意|承诺|保证|誓言|诺言|契约精神|责任心|担当)(?:呢|去哪儿了|在哪里|何在|安在|哪去了|到哪去了)[?？]?`,
  // 「怎么对得起」类（反悔 + 对不起指控，含反问）
  String.raw`(?:对得起|对不住|对不起|怎么说得过去|岂不|怎么)(?:[^。]{0,10})?(?:当初|以前|过去|那时|那时候)(?:[^。]{0,6})?(?:的)?(?:承诺|誓言|诺言|保证|约定|话|自己|信誓旦旦)?`,
  // 「信誓旦旦」类（承诺时的郑重 × 现在的背离）
  String.raw`信誓旦旦`,
  // 「当初是你说…现在却…」对照结构（无需失信词，对照即定性）
  String.raw`(?:当初|开始|一开始|当初|从前|那时)(?:[^。]{0,12})?(?:说|讲|承诺|保证|答应)(?:[^。]{0,14})?(?:现在|如今|而今|眼下|这时候|到头来|结果|后来|时至今日)(?:[^。]{0,12})?(?:却|竟然|居然|反而|反倒|又|还是)?(?:[^。]{0,8})?(?:反悔|变卦|改口|不认|推翻|不算|否认|拒绝|不同意|不肯|不愿|不行|做不到)`,
  // 英文：breaking your word / going back on it / that makes you a liar
  String.raw`\b(?:breaking|break|broke|went\s+back\s+on|going\s+back\s+on|backing\s+out\s+of)\s+(?:your|his|her|their|the)\s+(?:word|promise|vow|commitment|pledge|oath)\b`,
  String.raw`\b(?:that|this|which)\s+(?:makes|would\s+make|means)\s+you\s+(?:a\s+)?(?:liar|oathbreaker|untrustworthy|a\s+promise[- ]breaker)\b`,
  String.raw`\b(?:so\s+)?(?:leaving|quitting|changing|backing\s+out|withdrawing|walking\s+away)\s+(?:now|right\s+now)\s+(?:is|would\s+be)\s+(?:breaking|betraying|violating)\s+(?:your|the)\s+(?:word|promise|commitment)\b`,
  String.raw`\b(?:you|u)\s+(?:are|re)\s+(?:going\s+back\s+on|breaking)\s+(?:your|it)\b`,
  String.raw`\b(?:you\s+)?(?:promised|swore)\s+(?:and\s+)?(?:now\s+)?(?:you\s+)?(?:are\s+)?(?:breaking|betraying)\b`,
  String.raw`\b(?:you\s+cannot|cannot|can\s+not)\s+(?:just\s+)?(?:go\s+back|walk\s+back|renege|back\s+out)\b`,
  String.raw`\b(?:that\s+is\s+)?(?:a\s+)?(?:broken|breach\s+of)\s+(?:promise|commitment|vow)\b`,
  String.raw`\b(?:after\s+all\s+)?(?:you\s+)?(?:promised|swore|guaranteed)\b[^.]{0,40}?\b(?:so|therefore|thus)\b`,
].join('|'), 'i');

// ─── P1: 决策/概念分析语境（承诺一致性是被分析的对象，正确运用）──────────
const ANALYSIS_ZH = new RegExp([
  String.raw`承诺一致性(?:原理|效应|策略|胁迫|谬误|陷阱|手法|套路|话术)`,
  String.raw`(?:这是|属于|正是|典型的?)(?:[^。]{0,8})(?:承诺一致性|登门槛|承诺胁迫)`,
  String.raw`(?:应该|应当|必须|要|别|不要|勿)(?:[^。]{0,6})(?:警惕|识别|拒绝|打破|摆脱|跳脱)(?:[^。]{0,8})(?:承诺一致性|承诺胁迫|过往承诺|过去的承诺)`,
  String.raw`(?:心理学家|研究|实验|费斯汀格|西奥迪尼)(?:[^。]{0,12})(?:承诺一致性|登门槛)`,
  String.raw`\b(?:commitment\s+and\s+consistency|consistency\s+principle|foot[- ]in[- ]the[- ]door)\b`,
  String.raw`(?:这是|属于|典型的?)(?:[^。]{0,8})(?:登门槛|套路|胁迫)`,
].join('|'), 'i');

// ─── P2: 正当履约陈述（陈述守信事实，无胁迫对象）────────────────────────
const KEEPING_ZH = new RegExp([
  String.raw`(?:信守|遵守|履行|兑现|践行|说到做到|言行一致)(?:[^。]{0,6})(?:承诺|诺言|誓言|约定|保证)`,
  String.raw`(?:承诺|信用|诚信)(?:[^。]{0,6})(?:是|为)(?:[^。]{0,8})(?:美德|传统|底线|基石|根本|立身|之本|无价|重要|可贵|品质|准则|核心)`,
  String.raw`(?:他|她|他们|公司|团队|企业|国家|政府)(?:[^。]{0,6})(?:信守|遵守|履行|兑现)(?:[^。]{0,6})(?:承诺|约定)`,
  String.raw`(?:人而无信|一诺千金|言而有信|言必信|君子一言|驷马难追|金口玉言)`,
  String.raw`\b(?:keep|kept|keeping|honou?red|honou?ring|fulfill(?:ed|ing)?|keeps)\s+(?:your|his|her|their|our|the)?\s*(?:promise|word|commitment|vow|pledge)\b`,
  String.raw`\b(?:promise|commitment|integrity)\s+(?:is|are)\s+(?:important|sacred|a\s+virtue|everything)\b`,
].join('|'), 'i');

// ─── P3: 法律/规则客观引述（合同条款、法条描述，无指向对方的背信指控）────
const LEGAL_ZH = new RegExp([
  String.raw`(?:依据|按照|根据)(?:[^。]{0,8})(?:合同法|民法典|法律|法规|条款|协议|章程|制度)`,
  String.raw`(?:合同法|民法典|公司法|劳动法|担保法|物权法|招标投标法)(?:[^。]{0,10})(?:规定|第[0-9一二三四五六七八九十百]+条)`,
  String.raw`(?:违约|毁约)(?:[^。]{0,8})(?:责任|金|条款|情形|后果|处理)`,
  String.raw`\b(?:pursuant\s+to|according\s+to|under)\s+(?:the\s+)?(?:contract|agreement|clause|section|article)\b`,
  String.raw`\b(?:contract(?:ual)?|legal)\s+(?:obligations?|terms?|provisions?|liability)\b`,
].join('|'), 'i');

// ─── P4: 疑问/咨询句式（提问无指向对方的背信指控）──────────────────────
const QUESTION_ZH = new RegExp([
  String.raw`(?:如何|怎么|怎样|为什么|凭什么|是否|能不能|可不可以|该不该|要不要)[^。]{0,20}[?？]`,
  String.raw`(?:how|why|what|when|should|is\s+it|can\s+i|do\s+i)\b[^.]{0,40}\?`,
].join('|'), 'i');

/**
 * @param {string} text 归一化后的文本
 * @param {Object} [inject] 仅供守卫测试的变异注入（生产调用不传）
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkCommitmentCoercion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const PROMISE_ZH_ = R.PROMISE_ZH || PROMISE_ZH;
  const BREACH_ZH_ = R.BREACH_ZH || BREACH_ZH;
  const ANALYSIS_ZH_ = R.ANALYSIS_ZH || ANALYSIS_ZH;
  const KEEPING_ZH_ = R.KEEPING_ZH || KEEPING_ZH;
  const LEGAL_ZH_ = R.LEGAL_ZH || LEGAL_ZH;
  const QUESTION_ZH_ = R.QUESTION_ZH || QUESTION_ZH;

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hitResult = {
    hit: true,
    score: 0.5,
    count: 1,
    detail: isZh
      ? '承诺一致性胁迫×历史承诺×背信指控(zh)'
      : 'commitment-coercion×you-promised×breaking-word(en)',
  };
  const miss = () => ({ hit: false, score: 0, detail: '', count: 0 });

  // 守门前置（四类共用）：概念分析 / 正当履约 / 法律引述 / 疑问咨询 → 不判
  if (ANALYSIS_ZH_.test(text)) return miss();
  if (KEEPING_ZH_.test(text)) return miss();
  if (LEGAL_ZH_.test(text)) return miss();
  if (QUESTION_ZH_.test(text)) return miss();

  // 支① 双腿共现：历史承诺陈述 × 背信定性
  if (!PROMISE_ZH_.test(text)) return miss();
  if (BREACH_ZH_.test(text)) return hitResult;

  return miss();
}

module.exports = {
  checkCommitmentCoercion,
  __internals: () => ({
    PROMISE_ZH, BREACH_ZH,
    ANALYSIS_ZH, KEEPING_ZH, LEGAL_ZH, QUESTION_ZH,
  }),
};
