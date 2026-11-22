/**
 * src/argumentum-ex-silentio.js — 「诉诸沉默 / 沉默即证据」检测器
 * （第 283 个判别维度，r449 接线；编号 provisional，最终编号由 1 号按
 * VERIFY_DIMS 登记序重排确认）
 *
 * [r449 立项] 缺口实证探针 /tmp/hf-probe-r449.js + /tmp/hf-probe-r449b.js
 * （直调 src/gate.js 与 src/manufactured-consent.js）在 v6.8.223 上实测：
 * 本族 8 条中文攻击样本中 7 条穿过硬闸门（gate=pass，零维度命中），
 * 6 条英文攻击样本 **6/6 穿透**；已有最接近的维度 manufactured_consent
 * （第 97 维附近，管「沉默现状×冒充集体同意」）只命中 1/8 中文、0/6
 * 英文（其 M2 腿只收「宣布通过/就这么定了/视为一致/代表你们同意」等
 * 会议程序形，且 M1×M2 两腿正则都对句式有强约束）。
 * 覆盖度检查：grep src/ 'tacit' = 零命中；'argumentum ex silentio' =
 * 零命中；「未提出异议」「沉默就是」「等于同意」宽形句式无任何维度承重。
 *
 * 外部来源（真实可查，非编造）：
 *   · HN Algolia "logical fallacy detection" / "hallucination" 检索命中
 *     均为 LLM 路线仓库（GitHub API sort=stars 最高 5 星）或无关新闻，
 *     Semantic Scholar 两次 HTTP 429 限流。无心虫可移植的纯规则方案。
 *   故本轮选题依据为**内部缺口实证**，判据为心虫自有纯规则实现。
 *   概念背景：argumentum ex silentio（诉诸沉默）是古典谬误清单的常列
 *   条目——「没有记录/没有反对/没有证据」被当作「某事为真/某人同意」
 *   的论据；其现代回声是 agent 系统的「silence means done」类静默验收。
 *
 * 辨别的族：诉诸沉默（argumentum ex silentio / silence-as-evidence）——
 * 把**沉默、无反对、无投诉、无反馈、未被记录**这一事实，当作
 * **某主张为真、某人同意、某事合格**的证据：
 *   大家都没有反对，说明都默认这个方案了。
 *   你没提出异议，就是同意我的判断。
 *   没有收到任何投诉，说明顾客都很满意。
 *   没人举报，就说明这个项目没问题。
 *   既然没人站出来说话，那就是全员通过。
 *   员工一言不发，说明他们认同新制度。
 *   Nobody disputed it, therefore it is correct.
 *   Since nobody objected, everyone clearly agrees with the plan.
 *   There were no complaints, so customers are satisfied.
 *
 * 为什么这是判别者的核心缺口：这是**缺席与在场的混淆**——沉默是
 * 一个**没有发生的事件**，它可以由同意、没注意到、没机会说、不敢说、
 * 说了没人记录、议程太快等无数原因造成；而推论把它当成一个**已发生
 * 的表态**。用缺席冒充在场，等于把「未被反驳」兑换成「已被证实」，
 * 让最省力的做法变成压制所有反对声音——只要没人出声，结论就自动
 * 成立。这与证据纪律直接冲突：证据必须是**在场**的，沉默恰恰是
 * 证据的反面。
 *
 * 与既有维度的边界（r449 归因）：
 *   · manufactured_consent（第 64 维附近）管**会议/决策程序被短路**
 *     （没有唱票、没有记录、没有复议，却宣布程序已完成并产生多数
 *     同意），其 M2 腿只收「宣布通过/就这么定了/视为一致/代表你们
 *     同意/全票通过」等程序宣告形；本族腿②宽得多——任何把沉默当
 *     证据的推论（说明…没问题/就是同意/证明…正确/深得人心/认同/
 *     满意）都收，且不要求集体或会议语境（一个人沉默也照样判：
 *     「你没提出异议，就是同意我的判断」）。
 *   · appeal_to_ignorance（第 62 维）管**以「无法证明/驳不倒」推定
 *     成立**（腿①是举证责任与无证据状态），本族腿①是**沉默/无反对
 *     这一具体事实**、腿②是由沉默得出的**任何**正面结论——「没人
 *     反对所以对」不经过任何「你驳不倒」结构。
 *   · social_norm 管「大家都这样所以你也该」的经验性从众压力，本族
 *     管的是**沉默被当作证据**的推理，不是从众压力。
 *   · absence_of_problems（第 182 维）管「没出问题所以没问题」的
 *     问题缺席推论，本族腿①是**人的沉默/无反对/无反馈**这一社会性
 *     缺席，不是问题或故障的缺席。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判）：
 *   ① 腿① SILENCE 沉默事实在场：没有反对/没人反对/无人反对/没意见/
 *      没有异议/没人举手/不表态/一言不发/没人出声/保持沉默/没有
 *      投诉/没人举报/没有举报/无异议/没有反馈/没有回应/没人质疑/
 *      无人质疑/没有反对声音/没有(任何)?(反对|投诉|质疑|异议|举报|
 *      反馈|回应|异议)(的)?(声音|意见|记录)?；EN no (one|body)
 *      (objected|raised|disputed|complained|questioned|came forward|
 *      spoke up) / did not object / no objection / no complaints /
 *      silence (from|means) / nobody disputed / not contested /
 *      no dissent / no response / without objection。
 *   ② 腿② INFERENCE 沉默即证据的推论：就是(同意|默认|认可)/说明
 *      (都)?(默认|同意|认同|认可|满意|没问题|是对的|没问题)/可见/
 *      证明/足以说明/深得人心/代表(大家|你们)/等于同意/视为同意/
 *      那就是(全员|大家)?(通过|同意)/大家都同意；EN therefore /
 *      which (means|shows|proves) / so it / everyone (agrees|
 *      approves|is satisfied) / it (stands|counts) as / must be /
 *      is correct / unanimous / approves of / consent。
 *   两腿落在 60 字（EN 160 字符）邻近窗内即视为同一次「沉默→结论」
 *   叙述。
 *
 * 为什么取 VERIFY 级：单句也可能是在**正当记录或批判**这种推理
 * （「没有人反对不等于都同意，还需要逐一向每个人确认」「沉默被如实
 *   记为未反馈，不作同意」正是本族要教的判别动作）、表决程序说明、
 *   舆情与客服工单统计、逻辑谬误教学案例；rewrite/block 会误伤。
 *   verify 的含义是「这段文本把沉默当成了同意或证据，需要先取得
 *   显式表态（记名表决、书面确认、显式反馈）再下结论」。
 *
 * 明确不判（豁免）：
 *   · 正当判别/如实记录（不等于/并不代表/不能说明/需要(逐一)?确认/
 *     如实记为/不作同意/未反馈/不代表/沉默不等于/不得推定/需显式/
 *     逐一向；EN does not mean / not the same as / cannot conclude /
 *     recorded as / no response recorded / explicitly confirm /
 *     not necessarily / not equate）——**破除该推理正是本族要教的
 *     判别动作**；
 *   · 具名票数与程序痕迹（X票赞成/X票反对/弃权/表决结果/唱票/会议
 *     记录/已归档/签收/回执/书面确认；EN X votes / abstained /
 *     minutes / recorded / written confirmation）——有在场证据，
 *     不是沉默推论；
 *   · 显式主动表态（已确认/已回复/已回执/已签字/反馈已收集/问卷
 *     已回收；EN confirmed / replied / signed / feedback collected）；
 *   · 元话语/教学转述（诉诸沉默/逻辑谬误/谬误/课程/教材/课堂/概念/
 *     称为/定义为/argumentum ex silentio；EN logical fallacy /
 *     appeal to silence / course / textbook / concept / defined）；
 *   · 显式对冲（可能/也许/未必/不一定/大概率/或许/似乎/might/maybe/
 *     possibly/perhaps/seems）；
 *   · 否定翻转（不意味着/推不出/并不能说明/不代表/does not mean）；
 *   · 疑问句（含 ?/？；反问标记出现时不豁免，同 r216 collider_bias
 *     口径：难道/岂/凭什么/何尝/岂不是/谈何/…吗？/ isn't it /
 *     doesn't that / how else / what else / who doesn't / if not）；
 *   · 缺腿②的纯沉默描述（「全场一片沉默。」「用户没有回复。」）——
 *     中性事实陈述，不由本族代拦。
 */
'use strict';

// ─── 腿① 沉默事实在场（中文）──────────────────────────────────
// r161 教训：收裸名词形态——「沉默」「无异议」「没有反对」去掉前后缀
// 仍命中（不加尾部边界也能作为独立腿①命中）。
const SILENCE_ZH = [
  // 无反对/无异议族（含裸名词形）。「没」单字与「没有」同收（r449：
  // 「你没提出异议，就是同意我的判断」整句曾因只收「没有」而漏判）。
  /(?:没有|无|没人|无人|未|没)[^。！？!?]{0,4}(?:反对|异议|不同意见|不同看法)/,
  /(?:没人|无人|未|没)[^。！？!?]{0,4}(?:提出|发表|表达)[^。！？!?]{0,6}(?:反对|异议|意见|质疑|看法|想法)/,
  /(?:没有|无|没人|无人|未|没)[^。！？!?]{0,6}(?:反对|异议|质疑|抗议|不服)(?:的)?(?:声音|意见|记录|人)?/,
  /无异议|不表态|不置可否|一言不发|默不作声|保持沉默|选择沉默/,
  // 没人举手/没人出声/没人说话（裸形 + 修饰形）
  /(?:没人|无人|没有|未)[^。！？!?]{0,4}(?:举手|出声|作声|发言|说话|开口|吱声|响应|附和|答应|回话|答复)/,
  // 无投诉/无举报/无反馈族
  /(?:没有|无|没人|无人|未)[^。！？!?]{0,6}(?:投诉|举报|举报信|差评|抱怨|反馈|回应|回音|消息|动静)/,
  // 无人质疑/没人站出来
  /(?:没人|无人|没有|未)[^。！？!?]{0,4}(?:质疑|站出来|挺身而出|敢|出面|挑头)/,
  // 裸名词形态（r161：去前后缀仍命中）
  /(?:^|[，。；、！？\s])沉默(?:[，。；、！？\s]|$)/,
  /沉默/,
];

// ─── 腿①（英文）───────────────────────────────────────────────
const SILENCE_EN = [
  // [r449] since/with nobody 前置形（原表只收 no one/nobody 主语句，
  // 「Since nobody objected…」整句曾因此漏判）
  /\b(?:since|with|because|when|if)\s+(?:nobody|no\s+one)\s+(?:else\s+)?(?:objected|objects|raised|disputed|disputes|complained|complains|questioned|questions|came\s+forward|spoke\s+up|speaks\s+up|responded|responds|protested|dissent(?:ed)?|said\s+anything|spoke)\b/i,
  /\bno\s+(?:one|body)\s+(?:else\s+)?(?:objected|objects|raised|disputed|disputes|complained|complains|questioned|questions|came\s+forward|spoke\s+up|speaks\s+up|responded|responds|protested|dissent(?:ed)?)\b/i,
  /\b(?:did|does|do)\s+not\s+(?:object|respond|reply|protest|raise\s+(?:any\s+)?(?:objection|concern|question))\b/i,
  /\b(?:nobody|no\s+one)\s+(?:disputed|questioned|challenged|contested)\b/i,
  /\bno\s+(?:objection|objections|complaints?|dissent|response|responses|feedback|pushback|protest)\b/i,
  /\b(?:without|absent)\s+(?:any\s+)?(?:objection|dissent|complaint|response|opposition)\b/i,
  // [r449 矩阵修复] nobody has spoken/voiced against（「nobody has spoken against it」）
  /\b(?:nobody|no\s+one)\s+(?:has|have|had)?\s*(?:been\s+)?(?:spoken|voiced|said\s+anything)\b[^.]{0,30}\b(?:against|opposed|contrary)\b/i,
  /\bsilence\s+(?:from|of)\b/i,
  /\bmet\s+with\s+silence\b|\bsilence\s+greeted\b/i,
  /\bwent\s+unanswered\b|\bunremarked\b/i,
];

// ─── 腿② 沉默即证据的推论（中文）──────────────────────────────
const INFERENCE_ZH = [
  // 「就是同意/默认/认可」等值形
  /(?:就是|等于|等同于|视为|算作|当作|看作)(?:默认|大家|你们|各位)?(?:同意|赞成|默许|认可|认同|通过了?)/,
  /(?:就是|等于|视作|看作)(?:大家|你们|各位|全员)?(?:都)?(?:同意|默认|认了)/,
  // 说明/证明/可见/足以 推论族
  /(?:说明|证明|可见|足以说明|足以证明|可见一斑|表明|意味着)[^。！？!?]{0,12}(?:同意|赞成|默认|认同|认可|默许|满意|没问题|是对的|正确|没问题|没问题|成立|通过|深得人心|拥护|支持)/,
  /(?:大家|所有人|全员|顾客|客户|用户|员工|群众|团队|人们)[^。！？!?]{0,8}(?:都)?(?:很)?(?:满意|认同|认可|赞成|同意|拥护|支持)/,
  // 深得人心/有口皆碑（口碑由沉默推出）
  /深得人心|有口皆碑|众望所归|人心所向/,
  // 那就是通过/一致
  /(?:那就是|即视为|视为|相当于|算)(?:全员|全体|大家|一致)?(?:通过|同意|一致|认可)/,
  // [r449 矩阵修复] 即/亦即/也即 + 表态词（「沉默即赞成」「不表态即视为同意」）
  /(?:即|亦即|也即|便)(?:是)?(?:赞成|同意|认可|默许|通过|拥护|支持)/,
  // 那就这么定了（沉默推程序完成）
  /(?:那就|那就这么|就这么|即)(?:这么)?(?:定了?|定下|敲定)/,
  /(?:默认|视为|等于|视作)(?:这个|该|此)?(?:方案|提案|结论|结果|决定|事项)/,
  // 毋庸置疑/毫无疑问/显然（正确性推断的宽收口）
  /毋庸置疑|毫无疑问|无可争辩|无可指摘|板上钉钉|铁证如山/,
  // 代表（大家/你们）同意
  /代表(?:大家|你们|各位|全员|全体)?(?:都)?(?:同意|赞成|默许|认可|认了)/,
  // 没人反对 → 就是对的（正确性推断）
  /(?:就是|那就是|说明|足以说明)[^。！？!?]{0,6}(?:对的|正确的|没问题|成立|真的)/,
  // 没问题/没有毛病（安全性推断）
  /(?:说明|证明)[^。！？!?]{0,10}(?:没问题|没有毛病|没有隐患|安全|可靠|靠得住)/,
];

// ─── 腿②（英文）───────────────────────────────────────────────
const INFERENCE_EN = [
  /\btherefore\s+it\s+(?:is|stands)\b/i,
  /\bwhich\s+(?:means|shows|proves)\s+(?:that\s+)?(?:everyone|they|all|it)\b/i,
  /\bso\s+it\s+(?:must|is|stands)\b/i,
  /\b(?:everyone|everybody|they|all)\s+(?:clearly\s+)?(?:agrees?|approves?|consents?|is\s+satisfied|are\s+satisfied|supports?)\b/i,
  // [r449] which shows/proves/demonstrates + 对象 + approved/agreed/satisfied
  /\b(?:means|shows|proves|demonstrates|indicates)\s+(?:that\s+)?[^.]{0,40}\b(?:is\s+|are\s+|was\s+|were\s+)?(?:approved|agreed|satisfied|happy|content|on\s+board|unanimous)\b/i,
  // [r449] 群体满意/满意形（「customers are satisfied」「users are happy」
  // 曾因只收 agrees/approves 而漏判）
  /\b(?:customers?|users?|clients?|employees?|staff|team|members|residents|people|audience|voters?|consumers?|community)\s+(?:are|is)\s+(?:all\s+)?(?:clearly\s+)?(?:satisfied|happy|pleased|content|on\s+board)\b/i,
  // [r449 矩阵修复] 群体 endorse/embrace/accept 形（「community clearly endorses the plan」）
  /\b(?:community|team|staff|users?|customers?|voters?|members|employees?|residents|audience)\s+(?:clearly\s+|obviously\s+)?(?:endorse|endorses|embrace|embraces|accept|accepts|welcome|welcomes|approve|approves|back|backs|support|supports)\b/i,
  /\bit\s+(?:stands|counts)\s+as\s+(?:approved|agreed|unanimous|consent)\b/i,
  /\bmust\s+be\s+(?:correct|true|right|safe|approved)\b/i,
  /\bpassed\s+unanimously\b|\bunanimous\s+(?:approval|consent|agreement)\b/i,
  /\bsilence\s+(?:means|counts\s+as|is)\b[^.]{0,30}\b(?:agree|approve|consent|accept|correct|true)\b/i,
  /\byou\s+(?:consent|agree)\s+to\b/i,
  /\bis\s+(?:therefore\s+)?correct\b/i,
];

// ─── 豁免表 ────────────────────────────────────────────────────
// 正当判别/如实记录：破除该推理正是本族要教的判别动作
const EXEMPT_DISCERN_ZH = /不等于|并不代表|并不能说明|不能说明|不能证明|说明不了|推不出|不得推定|不可推定|需要逐一|逐一确认|逐一向|如实记为|不作同意|未反馈|不代表|沉默不等于|不等于同意|须(显式|另行)确认|另行确认|收集(显式)?(反馈|意见)|问卷|记名表决|暂不|暫不|尚不|仍待|有待|待确认|待定|不视为|不视为通过|不宜|不宜视为|不足以|不足以证明|无法据此|据此(不|并)不能/;
const EXEMPT_DISCERN_EN = /\bdoes\s+not\s+mean\b|\bdoesn'?t\s+mean\b|\bnot\s+the\s+same\s+as\b|\bcannot\s+conclude\b|\bnot\s+necessarily\b|\bnot\s+equate\b|\brecorded\s+as\b|\bexplicitly\s+confirm\b|\bwritten\s+confirmation\b|\bsilence\s+is\s+not\b|\bnot\s+the\s+same\b|\babsent\s+a\s+response\b|\bno\s+response\s+recorded\b|\bmust\s+be\s+confirmed\b|\bpending\b|\bawaiting\b|\bnot\s+yet\s+(?:treated|deemed|counted|considered)\b|\binsufficient\b|\bcan(?:not|'t)\s+be\s+(?:treated|counted|inferred)\b|\btentatively\b/i;

// 具名票数与程序痕迹（有在场证据，不是沉默推论）
const EXEMPT_VOTE_ZH = /\d+\s*票(?:赞成|反对|弃权|通过)|表决结果|唱票|会议记录|已归档|签收|回执|书面(确认|表决|记录)|会议纪要/;
const EXEMPT_VOTE_EN = /\b\d+\s+votes?\b|\babstained\b|\bminutes\b|\brecorded\s+in\s+the\s+minutes\b|\broll\s+call\b|\bsigned\s+off\b/i;

// 显式主动表态（有在场反馈，不是沉默）
const EXEMPT_REPLY_ZH = /已确认|已回复|已回执|已签字|已反馈|反馈已(收集|回收|收到)|问卷已(回收|收集)|回复率|已回函/;
const EXEMPT_REPLY_EN = /\bconfirmed\b|\breplied\b|\bhas\s+responded\b|\bfeedback\s+(?:was\s+)?collected\b|\bresponse\s+rate\b|\bhas\s+signed\b/i;

// 元话语/教学转述
const EXEMPT_META_ZH = /诉诸沉默|逻辑谬误|谬误|谬误清单|课程|教材|课堂|教案|概念|称为|定义为|沉默的谬误|论证谬误|举例|例如|比如/;
const EXEMPT_META_EN = /\blogical\s+fallacy\b|\bappeal\s+to\s+silence\b|\bargumentum\s+ex\s+silentio\b|\bcourse\b|\btextbook\b|\blecture\b|\bconcept\b|\bdefined\b|\bdefinition\b|\bfor\s+example\b|\be\.g\.\b/i;

// 显式对冲
const EXEMPT_HEDGE_ZH = /可能|也许|未必|不一定|大概率|或许|似乎|貌似|说不定|大概/;
const EXEMPT_HEDGE_EN = /\bmight\b|\bmaybe\b|\bpossibly\b|\bperhaps\b|\bnot\s+necessarily\b|\bcould\s+be\b|\bseems?\b|\bappears?\b|\bprobably\b/i;

// 否定翻转
const EXEMPT_NEG_ZH = /不意味着|并不能说明|推不出|不等于|不代表|不能证明|说明不了|证明不了/;
const EXEMPT_NEG_EN = /\bdoes\s+not\s+mean\b|\bdoesn'?t\s+mean\b|\bcannot\s+conclude\b|\bnot\s+necessarily\b|\bno\s+proof\b/i;

// 疑问句
const EXEMPT_QUESTION = /[?？]/;
// 反问标记出现时**不**豁免（与 r216 collider_bias 同口径）
const RHETORICAL_ZH = /难道|岂|凭什么|何尝|岂不是|谈何|莫非|难不成/;
const RHETORICAL_EN = /\bisn'?t\s+it\b|\bdoesn'?t\s+that\b|\bhow\s+else\b|\bwhat\s+else\b|\bwho\s+doesn'?t\b|\bif\s+not\b|\bwhy\s+else\b/i;

const NEAR_WINDOW_ZH = 60;
const NEAR_WINDOW_EN = 160;

function _isEnglish(text) {
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  return cjk === 0 && /[a-zA-Z]{3,}/.test(text);
}

function _normText(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/\s+/g, ' ').trim();
}

function _anyIn(text, list) {
  for (const re of list) if (re.test(text)) return true;
  return false;
}

function _nearWindow(text, leg1List, leg2List, window) {
  let p1 = -1;
  for (const re of leg1List) {
    const m = text.search(re);
    if (m >= 0 && (p1 < 0 || m < p1)) p1 = m;
  }
  if (p1 < 0) return false;
  let p2 = -1;
  for (const re of leg2List) {
    const m = text.search(re);
    if (m >= 0 && (p2 < 0 || m < p2)) p2 = m;
  }
  if (p2 < 0) return false;
  return Math.abs(p2 - p1) <= window;
}

/**
 * 诉诸沉默检测器。
 * @param {string} rawText 待判文本
 * @returns {{score:number, findings:Array, legs:Object, exempt:boolean}}
 */
function checkArgumentumExSilentio(rawText) {
  const text = _normText(rawText);
  if (!text || text.length < 4) return { score: 0, findings: [], legs: {}, exempt: false };

  const en = _isEnglish(text);
  const leg1 = en ? SILENCE_EN : SILENCE_ZH;
  const leg2 = en ? INFERENCE_EN : INFERENCE_ZH;
  const window = en ? NEAR_WINDOW_EN : NEAR_WINDOW_ZH;

  // ── 豁免层 ──
  const hasQ = EXEMPT_QUESTION.test(text);
  const hasRhet = en ? RHETORICAL_EN.test(text) : RHETORICAL_ZH.test(text);
  if (hasQ && !hasRhet) return { score: 0, findings: [], legs: {}, exempt: true };

  // 正当判别/如实记录优先于一切（本族最核心的良性形）
  if ((en ? EXEMPT_DISCERN_EN : EXEMPT_DISCERN_ZH).test(text)) {
    return { score: 0, findings: [], legs: {}, exempt: true };
  }
  if ((en ? EXEMPT_VOTE_EN : EXEMPT_VOTE_ZH).test(text)) {
    return { score: 0, findings: [], legs: {}, exempt: true };
  }
  if ((en ? EXEMPT_REPLY_EN : EXEMPT_REPLY_ZH).test(text)) {
    return { score: 0, findings: [], legs: {}, exempt: true };
  }
  if ((en ? EXEMPT_META_EN : EXEMPT_META_ZH).test(text)) {
    return { score: 0, findings: [], legs: {}, exempt: true };
  }
  if ((en ? EXEMPT_NEG_EN : EXEMPT_NEG_ZH).test(text)) {
    return { score: 0, findings: [], legs: {}, exempt: true };
  }

  // ── 两腿判据 ──
  const hit1 = _anyIn(text, leg1);
  const hit2 = _anyIn(text, leg2);
  if (!hit1 || !hit2) return { score: 0, findings: [], legs: {}, exempt: false };
  if (!_nearWindow(text, leg1, leg2, window)) {
    return { score: 0, findings: { leg1: hit1, leg2: hit2, window }, exempt: false };
  }

  // ── 打分 ──
  let score = 60;
  if (en) score += 6;
  // 强等值形（就是同意/等于同意/consent to/stands as approved）
  if (/(?:就是|等于|等同于|视作|看作)(?:默认|大家|你们|各位)?(?:同意|赞成|默许|认可|认同|通过了?)/.test(text) ||
      /\byou\s+(?:consent|agree)\s+to\b|\bstands\s+as\s+(?:approved|agreed)\b|\bpassed\s+unanimously\b/i.test(text)) {
    score += 14;
  }
  // 强沉默形（一言不发/保持沉默/met with silence/no objections）
  if (/一言不发|默不作声|保持沉默|选择沉默/.test(text) ||
      /\bno\s+(?:one|body)\s+(?:else\s+)?(?:objected|disputed|questioned|spoke\s+up)\b|\bmet\s+with\s+silence\b/i.test(text)) {
    score += 10;
  }
  if ((en ? EXEMPT_HEDGE_EN : EXEMPT_HEDGE_ZH).test(text)) score -= 8;

  if (score > 96) score = 96;
  if (score < 40) score = 40;

  return {
    score,
    findings: [{
      dimension: 'argumentum_ex_silentio',
      severity: score,
      details: `诉诸沉默（沉默事实→同意/证据推论）：腿①沉默事实在场，腿②沉默即证据推论在场，两腿相距 ${NEAR_WINDOW_ZH} 字（EN ${NEAR_WINDOW_EN} 字符）内`,
      guidance: '把「沉默」与「表态」分开：沉默是没有发生的事件，可能出于同意、没注意到、没机会、不敢说或未被记录，不能当作同意或证据。要下结论须取得在场证据——记名表决、书面确认、逐一的显式反馈；若确无反对，应表述为「未收到异议，待确认」而不是「大家都同意」',
    }],
    legs: { silence: true, inference: true },
    exempt: false,
  };
}

module.exports = { checkArgumentumExSilentio };
