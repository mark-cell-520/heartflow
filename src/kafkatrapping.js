/**
 * src/kafkatrapping.js — 「卡夫卡陷阱」检测器（第 143 个判别维度）
 *
 * [r712 立项] decision 本体在 142 维引擎上选出（/tmp/decide-run-r712.js 读
 * /tmp/decide-opts-r712.json，composite_score 0.93 / confidence 0.9 /
 * identity alignment 100%，无拒选；备选 B stereotype 补族 0.92 /
 * C darvo 0.91 / D void_zh 补族 0.86）。探测器证据 /tmp/hf-scout-712.txt
 * （r712 复量 r711 队列 4 族 + 新侦察 4 族；判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判）：
 * kafkatrapping 族攻击漏判 9/10、漏判中真零命中 9/9、良性误伤 0/12。
 * Phase 1.5 同律复核：9 条漏判样本逐条过 discriminate() 确认全维度零命中。
 *
 * 辨别的族：「卡夫卡陷阱」（kafkatrapping）——**把对方的否认/辩解/
 * 情绪反应本身当作有罪的证据**，使对方陷入「不解释=心虚、解释=掩饰」
 * 的双重束缚，任何自辩都被一句「你急了/你越描越黑」驳回：
 *   你反应这么大，正好说明被我说中了。
 *   你要是问心无愧，为什么急着否认。
 *   别狡辩了，否认本身就是证据。
 *   你这么激动，恰恰证明你心里有鬼。
 *   你没做错的话，为什么不让我说。
 *   The harder you deny it, the guiltier you look.
 *   Your protest just proves my point.
 *   If you were innocent, you would not need to explain.
 *   Your defensiveness is all the proof I need.
 *
 * 与既有维度的边界（r712 逐条实测归因，findings 零命中确认）：
 *   · sealioning 管**纠缠逼问**（反复质疑直到对方崩溃）——「你越解释
 *     就是越心虚」实测命中 sealioning，该样本在射程内但已由存量覆盖，
 *     本模块不重复声称（scout 已计为 HIT 非漏判）。
 *   · mind_reading（第 142 维）管**断言对方内心状态**（你就是心虚/
 *     别不承认）——断言形态；本族是把**外部可观察反应**（否认/激动）
 *     **推论成罪证**的逻辑谬误。
 *   · presupposition 管**问句预设**（你为什么不…了）——问句形态；
 *     本族是陈述断言形态（说明/证明/本身就是证据）。
 *
 * 为什么现有维度拦不住（discriminate() 逐条零命中实测 + 归因）：
 *   「反应/否认/无过框架 × 罪证化推论」两要素里，腿①的 REACTION 结构
 *   （你反应这么大/你这么激动/问心无愧/没做错；EN your protest /
 *   your defensiveness / the harder you deny / if you were innocent）
 *   在所有维度零覆盖；腿②的 PROOF 结构（说明/证明/恰恰/正好 + 心虚/
 *   有鬼/被我说中；EN proves / is proof / the guiltier / would not
 *   need to explain）不与任何反应框架共现判定。整族射程外，不是某个
 *   维度正则弱。
 *
 * 判据（三条路由任一命中，缺腿不判，命中即 verify 级，score 0.5）：
 *   · 路由① REACTION × PROOF：反应/情绪框架 × 罪证结论
 *     （你反应这么大/你这么激动；EN your protest / your defensiveness /
 *     the harder you deny / if you were innocent）×（说明/证明/表明/
 *     恰恰/正好 + 心虚/有鬼/被我说中/有问题/有错/有罪/在骗；
 *     EN proves / is proof / the guiltier / would not need to explain）；
 *   · 路由② INNOCENT × QUESTION：无过框架 × 质疑反问
 *     （问心无愧/没做错/清清白白/身正不怕影子斜）×（为什么/凭什么 +
 *     否认/解释/狡辩/辩解/不让/着急）；
 *   · 路由③ DENIAL × EVIDENCE：否认/狡辩框架 × 证据化宣告
 *     （否认/狡辩/辩解/抵赖/不承认）×（就是/本身 + 证据）。
 *
 * 为什么取 VERIFY 级：单句可能是逻辑课反面教材/案例分析引述/小说
 * 对白/法律课讨论（「当事人说：你反应这么大，正好说明…」），
 * rewrite/block 会误伤（与 r672-r709 全部评价/胁迫族同口径）。
 * verify 的含义是「这句话把对方的反应当成了罪证」——调用方应要求
 * 回到证据本身，而不是用对方的情绪状态定罪。
 *
 * 明确不判的（豁免）：
 *   · 法律/程序讨论：否认本身就是证据，这种推论在法律上不成立 /
 *     Treating your protest as proof of guilt is not admissible in
 *     court.（结构在场但是是在否定该推论——HEDGE 承重样本）；
 *   · 正当程序陈述：司法上不得强迫自证其罪/辩解权是正当程序的一部分 /
 *     态度不能替代事实，调查要看客观记录；
 *   · 概念分析：卡夫卡陷阱是一种常见的逻辑谬误 / Kafkatrapping is a
 *     common fallacy.
 */
'use strict';

// ─── 腿① REACTION 反应/情绪/否认框架（中文）──────────────────────
const REACTION_ZH = new RegExp([
  // 你反应这么大/你反应如此强烈
  '(?:你|您)反应(?:这么|如此)?(?:大|强烈|激烈)',
  // 你这么激动/您如此生气（主语可选——「别这么激动」同样指听者）
  '(?:你|您)?(?:这么|如此)(?:激动|生气|急躁|冲动)',
  // 急什么/急了/发这么大火/火气这么大/声音这么大
  '(?:急什么|急了|发这么大火|火气这么大|声音这么大声)',
  // 情绪这么激动/情绪如此激烈
  '情绪(?:这么|如此)(?:激动|激烈|强烈)',
].join('|'));

// 腿① INNOCENT 无过框架（中文，路由②用）
const INNOCENT_ZH = new RegExp([
  // 问心无愧/没做错/清清白白/身正不怕影子斜
  '(?:问心无愧|没做错|清清白白|身正不怕影子斜|光明正大)',
].join('|'));

// 腿①c DENIAL 否认/狡辩框架（中文，路由③用）
const DENIAL_ZH = new RegExp([
  // 否认/狡辩/辩解/抵赖/不承认
  '(?:否认|狡辩|辩解|抵赖|不承认)',
].join('|'));

// ─── 腿② PROOF 罪证结论（中文）──────────────────────────────────
const PROOF_ZH = new RegExp([
  // 说明/证明/表明/恰恰/正好 + （你）+ 罪证词
  '(?:说明|证明|表明|恰恰|正好|就是)(?:你|您)?[^。]{0,8}(?:心虚|有鬼|被我说中|说中|心里有鬼|有问题|有错|有罪|在骗)',
].join('|'));

// 腿②b QUESTION 质疑反问（中文，路由②用）
const QUESTION_ZH = new RegExp([
  // 为什么/凭什么 + 否认/解释/狡辩/辩解/不让/着急
  '(?:为什么|凭什么)[^。]{0,8}(?:否认|解释|狡辩|辩解|不让|着急|急)',
].join('|'));

// 腿②c EVIDENCE 证据化宣告（中文，路由③用）
const EVIDENCE_ZH = new RegExp([
  // 就是/本身 + 证据
  '(?:就是|本身)[^。]{0,2}证据',
].join('|'));

// ─── 英文腿 ─────────────────────────────────────────────────────
// 腿① REACTION_EN：your protest / your defensiveness / the harder you
// deny / if you were innocent。全部要求 you/your-based（r700 教训：
// 第三人称主语不在射程——"his angry reaction proves..." 是陈述不是
// 对听者用反应定罪）。
const REACTION_EN = new RegExp([
  // your protest / your defensiveness / your denial
  "\\byour\\s+(?:protest|protests|denial|defensiveness|defensive\\s+reaction)\\b",
  // you are denying / you deny / you are defensive / you protest
  "\\byou\\s+(?:are\\s+)?(?:deny|denying|protest|protesting|defensive)\\b",
  // the harder you deny/protest/explain/argue
  "\\bthe\\s+harder\\s+you\\s+(?:deny|protest|explain|argue)\\b",
  // if you were innocent / if you are innocent / if you did nothing wrong
  "\\bif\\s+you\\s+(?:were|are)\\s+innocent\\b",
  "\\bif\\s+you\\s+did\\s+nothing\\s+wrong\\b",
].join('|'), 'i');

// 腿② PROOF_EN：proves / is (all the) proof / as proof / the guiltier /
// would not need to explain。
const PROOF_EN = new RegExp([
  // proves / shows / means（罪证推论动词）
  "\\b(?:proves|shows|means)\\b",
  // is (all the) proof / as (proof|evidence)
  "\\bis\\s+(?:all\\s+the\\s+)?proof\\b",
  "\\bas\\s+(?:proof|evidence)\\b",
  // the guiltier / the more guilty
  "\\bthe\\s+(?:guiltier|more\\s+guilty)\\b",
  // would not need to (explain|deny|protest|defend)
  "\\bwould\\s*n[o']?t\\s+need\\s+to\\s+(?:explain|deny|protest|defend)\\b",
  "\\bwou?ldn'?t\\s+need\\b",
].join('|'), 'i');

// ─── 豁免：法律/程序讨论/正当程序陈述/概念分析 ────────────────────
const HEDGE_ZH = new RegExp([
  // 概念分析（卡夫卡陷阱是一种常见的逻辑谬误）
  '(?:卡夫卡|kafka)(?:陷阱)?(?:是|属于|是一种|正是|称为|叫做|指|举例|例如|比如|案例|教学|分析|识别|检测)',
  // 法律/程序否定该推论（这种推论不成立/无效/错误——HEDGE 承重）
  '(?:这种|这类|此)(?:推论|逻辑|论证|说法)[^。]{0,8}(?:不成立|无效|错误|是?谬误)',
  '(?:在)?法律上[^。]{0,12}(?:不|没|非)',
  '(?:不能|不应|不得|不可)[^。]{0,10}(?:仅凭|因为|就把|将)',
  // 正当程序陈述
  '(?:不得|不能|严禁)强迫自证其罪',
  '(?:辩解权|申辩权|陈述权)(?:是|属于|受)',
  '正当程序',
  // 证据方法陈述
  '(?:不能|不应|不得|不可)单凭(?:态度|情绪|反应)',
  '结合证据判断',
  '不作为[^。]{0,6}依据',
  '需要独立复核',
].join('|'));

const HEDGE_EN = new RegExp([
  // 概念分析
  "\\bkafka\\s?trapping\\b",
  // 法律/程序否定该推论（HEDGE 承重）
  "\\bnot\\s+admissible\\b",
  "\\bin\\s+(?:a\\s+)?court\\b",
  "\\bis\\s+(?:legally\\s+)?(?:invalid|inadmissible|a\\s+legal\\s+error)\\b",
  "\\bis\\s+not\\s+(?:proof|evidence)\\b",
  // 正当程序
  "\\bdue\\s+process\\b",
  "\\bright\\s+to\\s+(?:remain\\s+silent|a\\s+defense)\\b",
  "\\bself-?incrimination\\b",
  // 证据方法
  "\\bnot\\s+(?:evidence|proof)\\s+of\\s+guilt\\b",
  "\\bdenial\\s+is\\s+not\\b",
].join('|'), 'i');

/**
 * @param {string} text 待判文本（_dual 会分别喂原文与归一化文本）
 * @param {object} [inject] 负例脚本注入用：以永不匹配串替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkKafkatrapping(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const RE_ZH_ = R.REACTION_ZH || REACTION_ZH;
  const IN_ZH_ = R.INNOCENT_ZH || INNOCENT_ZH;
  const DE_ZH_ = R.DENIAL_ZH || DENIAL_ZH;
  const PR_ZH_ = R.PROOF_ZH || PROOF_ZH;
  const QU_ZH_ = R.QUESTION_ZH || QUESTION_ZH;
  const EV_ZH_ = R.EVIDENCE_ZH || EVIDENCE_ZH;
  const RE_EN_ = R.REACTION_EN || REACTION_EN;
  const PR_EN_ = R.PROOF_EN || PROOF_EN;
  const HEDGE_ZH_ = R.HEDGE_ZH || HEDGE_ZH;
  const HEDGE_EN_ = R.HEDGE_EN || HEDGE_EN;

  // 豁免在场 → 不是运用它（是在否定/分析该推论）
  if (HEDGE_ZH_.test(text) || HEDGE_EN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿①
  const reZh = RE_ZH_.test(text);
  const reEn = RE_EN_.test(text);
  const inZh = IN_ZH_.test(text);
  const deZh = DE_ZH_.test(text);
  // 腿②
  const prZh = PR_ZH_.test(text);
  const prEn = PR_EN_.test(text);
  const quZh = QU_ZH_.test(text);
  const evZh = EV_ZH_.test(text);

  // 路由① REACTION × PROOF（反应框架 × 罪证结论）
  const route1 = (reZh || reEn) && (prZh || prEn);
  // 路由② INNOCENT × QUESTION（无过框架 × 质疑反问）
  const route2 = inZh && quZh;
  // 路由③ DENIAL × EVIDENCE（否认框架 × 证据化宣告）
  const route3 = deZh && evZh;

  if (route1 || route2 || route3) {
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: isZh ? '卡夫卡陷阱×否认/反应×罪证推论(zh)' : 'kafkatrapping×denial-as-proof(en)',
    };
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkKafkatrapping,
  __internals: () => ({
    REACTION_ZH, REACTION_EN,
    INNOCENT_ZH,
    DENIAL_ZH,
    PROOF_ZH, PROOF_EN,
    QUESTION_ZH,
    EVIDENCE_ZH,
    HEDGE_ZH, HEDGE_EN,
  }),
};
