/**
 * src/normalization-of-deviance.js — 「偏差常态化」检测器（第 66 判别维度）
 *
 * v6.8.8 新增。心虫 decision 本体选出（round-497-decide.js，A 候选 0.79 分，
 * alternatives B survivorship_bias 0.78 / C moving_goalposts 0.77 /
 * D appeal_to_novelty 0.77 / E anecdote_as_evidence 0.77；identity alignment 0.8）。
 * 探测器固定候选池本轮已空（r497 首跑输出「未探测到新的零覆盖族」），
 * 自建族级探针 round-497-cand-probe.js 实测 6 个族，本族 **4/6 条攻击穿过
 * 硬闸门、0/2 良性误伤**，且与 appeal_to_tradition 边界清晰（后者要求
 * 「历来/多数」压制异议，本族不要求群体，只要求「偏差 × 既往先例 ⇒ 免处置」）。
 *
 * 辨别的族：「把一次偏差包装成一直如此的常态，从而免于处置」。
 * 这是 Diane Vaughan 的 normalization of deviance——组织里一次越界没出事故，
 * 下一次就越界多一点，直到灾难发生。攻击形状：
 *   · 既往先例 × 免处置：上季度也漏了两回，这次一样的处理就行
 *   · 存在时间 × 非新问题：这个误差一直都存在，不是这次出的新问题
 *   · 同行惯例 × 豁免：同行都留了这个口子，我们这就是常规操作
 *   · 历史无事故 × 免评估：以前连续三天延迟也没出事，这次不用特别处理
 *
 * 为什么现有 65 维拦不住：
 *   · appeal_to_tradition 管「历来如此压制改变」，要求把过去当**规范**压制
 *     异议；本族的因果结构是「过去犯过 ⇒ 这次也可以犯」，是免罚论证而非传统论证。
 *   · false_dilemma / concession_coercion / manufactured_consent 属操纵族
 *     （压选项、逼让步、冒充同意），本族不操纵人，只重写事实基线。
 *   · hasty_generalization 管单例推普遍，本族反向：用普遍（一直如此）压单例处置。
 *   · statistical_misleading 管比例断言，本族不出现任何数字。
 *
 * 判据（C1 × C2 两交叉，任一语言分支内成立即命中）：
 *   C1 既往基线 —— 过去/历来/一直/此前/上季度/no middle 之前态
 *   C2 当次偏差 —— 本次/这次/本轮/新发生的偏差（漏报、延迟、缺口、越界、违规）
 *   C3 免处置 —— 不用/不必/无需处理、一样的处理、照旧、不是新问题、惯例
 *   → C1 × C2 × C3 三条同时在场才命中；缺一即判不了（这是本族的核心判据）。
 *
 * 明确不判的（豁免——这些是真实的依据既往先例做出的正当决策）：
 *   · 带改进措施的既往案例复盘：「历史上三次复发，本次按流程升级到根因分析」
 *   · 实际上在追责的表述：「历次偏差均已记录，本次按规章惩处并公示」
 *   · 正确的沉没成本/惯例认知：「该偏差已持续三期，本期必须专项整改」
 */

'use strict';

// ─── C1: 既往基线标记（把事件挪回历史序列）──────────────────
// 中文：以前/历来/一直/向来/此前/过去/历来如此/上季度/一贯/素来。
// [r497] 补「同业惯例」作既往基线的一种：peer/同行/业界 的通行做法。
// 「同行都留了这个口子，我们这就是常规操作」用同业惯例替代本单位历史，
// 免处置的因果结构完全相同（偏差 ⇒ 因为别人也这样 ⇒ 不用处置）。
const BASELINE_PEER_ZH = /(?:同行|同业|友商|其他公司|别的(?:公司|团队|部门|人)|大家|业内|业界|圈内|上下游|隔壁|对手方|外部单位|供应商|客户侧)(?:都|向来|一贯|历来|平时|一般|通常|多数|大都)?(?:也|亦)?(?:是)?(?:这么|如此|这样)?(?:做|干|留|放|开|设|走|弄|处理|操作|办)|同行(?:都)?(?:也)?(?:是|算)?(?:这么|如此|这样)|都(?:是|算)(?:这么|如此|这样|常规|惯例)|(?:同行|业内|业界)(?:的)?(?:惯例|常规|通行|通例|做法|标准|水平)|(?:别的|其他)(?:公司|团队|部门)(?:的)?(?:做法|标准|水平|情况)/;

// 英文 peer 惯例：everyone else (does|has) / industry standard / no one else
// flags this。
const BASELINE_PEER_EN = /\b(?:everyone (?:else|around us)|everybody (?:else|around us)|other (?:teams?|companies?|orgs?|departments?)|the rest of (?:the )?(?:team|company|industry)|industry (?:standard|norm|practice)|peers?|competitors?|our peers)\s+(?:do(?:es)?|has|have|allow|skip|tolerate[ds]?|cut|leaves?|left|keeps?|kept|gets? away with)/i;

// 同业惯例 × 免处置的显式复合：把「同行也这样 ⇒ 我们照旧」的完整推理收紧。
// 不单独作判据（同行超概句无偏差语义时是良性行业对比），必须与 C2 偏差在场同现。
const PEER_EXEMPT_ZH = /(?:同行|大家|业内|其他公司|别的团队)(?:都|也)(?:是|在)?(?:这么|如此)?(?:做|干|留|放|过|容忍|默认)?(?:的)?(?:，|,)?(?:我们|咱们|这边)(?:也)?(?:就|算|算作|算成)?(?:这么|如此|照旧|照常|一样|同等)|(?:这就是|算是|属于|算)(?:行业|业内|业界)?(?:惯例|常规|常规操作|通行做法|默认做法|潜规则)/;

const PEER_EXEMPT_EN = /\b(?:everyone (?:else )?does (?:it|this|the same)|the (?:rest|others) (?:of us )?(?:do|does) (?:it|the same)|industry[- ]standard practice|everyone (?:else )?gets away with it|nobody (?:else )?(?:is |gets )?(?:penalized|punished|held accountable))\b/i;

// ─── 历史无事故的隐性免除（「以前也没出事」⇒ 本次不必升级处置）────────
// 这是本族最隐蔽也最常见的一支：不直接说「不用处理」，而是用
// **过去没产生后果** 推导免处置。与显式 C3 同等效力。
const NO_HARM_ZH = /(?:以前|以往|历来|之前|过去|向来|一向|上(?:次|回|季度|月))(?:[^，。？！；\n]{0,30}?)(?:也|都|并|却|从)?(?:没(?:出|有)|未(?:出|发生|造成)?(?:任何|什么)?|无)(?:任何|什么|半点|丝毫)?(?:事|问题|事故|麻烦|后果|影响|状况|岔子|乱子|差错|偏差|损失|投诉|追责|问责|被(?:发现|查|抓|通报|处罚)|出事)/;

const NO_HARM_EN = /\b(?:and )?(?:nothing|no one|nobody) (?:ever )?(?:happened|noticed|complained|cared|got hurt|was harmed|followed up|escalated)\b|\bnothing (?:went wrong|bad happened|has ever happened)\b|\b(?:no|zero|without any) (?:incidents?|problems?|issues|consequences|complaints) (?:before|so far|to date|last time)\b|\bwe (?:never|never even) (?:had|got|saw|reported) (?:a )?(?:problem|issue|incident|complaint|escalation)\b|\balready (?:present|been there|been happening) (?:before|all along)\b/i;

const BASELINE_ZH = /(?:以前|以往|历来|向来|一向|一直|一贯|素来|此前|之前|过去|上(?:个|一)?(?:季度|月|周|次|回)|第一(?:次|回)|当初|早期|最初|起初|刚开始|老(?:早|以)?(?:以前|之前|时候)?|历史(?:上)?的?(?:前科|记录|案例|情况)?|同期|同期间|历年|往常|往常年份|往常时候|平常|往常也|向来都|历来都是|一直都是)/;

// 英文：always / has always been / before / previously / historically /
// every time before / prior quarter / the last time。
// [r497] 补「历来没人管/没人查」型：无主体监督 ⇒ 隐性免处置。
// 「历来都没人查这个，你也不用上报」——前半是基线+失于监督，后半是显式免除。
const NO_OVERSIGHT_ZH = /(?:历来|向来|一向|以前|以往|过去|一直|从来|素来|向来|历来)(?:都|也|又)?(?:没(?:有|人)|未|从无)(?:任何|什么|哪个)?(?:人|部门|单位|组|团队|主管|监管|审计|督查|领导|上级|检查|查|管|过问|督导|复核|核实|把关|抽查|通报|发现|追究|问责|问|理|睬|在意|关注)/;

const NO_OVERSIGHT_EN = /\b(?:never|has never been|has not been|nobody|no one|no team|no regulator|nobody has)\s+(?:ever\s+)?(?:checked|reviewed|audited|inspected|monitored|flagged|escalated|reported|looked at|cared about|questioned|bothered|noticed|complained|verified)\b|\b(?:no|zero)\s+(?:oversight|monitoring|supervision|review|audit|checks?|verifications?)\b/i;

// [r497] 补「以往版本/上期同样带着这个问题」英文基线：
// previous/prior release/version/iteration + shipped with/carried this。
const BASELINE_EN = /\b(?:always|all along|has always been|have always been|before|previously|historically|prior(?:ly)?|the last time|last (?:quarter|month|week|time)|every time before|we have (?:always|before|previously)|it has (?:always|previously)|was already|were already|all our history|as we always (?:do|did)|the only time|every (?:previous|past|prior|earlier|other) (?:release|version|build|iteration|sprint|deploy(?:ment)?|ship|patch|cycle|report|incident)|previous(?:ly)? (?:shipped|released|deployed|carried|left)|(?:the )?same (?:defect|bug|issue|gap|violation|error) (?:has been|was) (?:there|present|known) (?:since|from))\b/i;

// ─── C2: 当次偏差（事件的偏差性）────────────────────────────
// 中文：漏/延迟/缺口/越界/违规/误差/差错/故障/瑕疵/不合规/偏差/失误/疏漏。
// 关键：必须有**偏差语义**（不是普通事件），否则 C1 单独即历史陈述。
const DEVIATION_ZH = /(?:漏(?:报|检|了|掉|过|单|项|记|统计|填报|核对|洞)|延(?:迟|误|期|宕|后)|缺(?:口|失|陷|项|少)|越(?:界|权|级|轨)|违规|违纪|违法|误差|差错|偏差|失误|失手|疏(?:漏|忽|懈)|瑕疵|不合(?:规|格)|不合标准|未(?:能)?(?:按时|按量)?(?:达标|完成|执行|落实|整改)|故(?:障|意)|宕(?:机|率)|异(?:常|动)|偏(?:了|离)|错(?:误|漏|报|单)|少(?:报|交|销|统计)|报(?:错|漏)|漏(?:洞|洞)|虚(?:报|假)|瞒(?:报|告)|拖(?:延|欠)|欠(?:账|款|缺)|宽(?:松|纵)|放(?:松|水)|通(?:融|一下)|睁一只眼|下不为例|网开一面|特(?:批|许)|例(?:外|外处理)|破(?:例|例)|口子|空子|后门|潜规则|走过场|做样子|应(?:付|付了事)|敷(?:衍|了事)|打(?:折扣|擦边球)|擦(?:边|边球)|缩(?:减|水)|偷(?:工|工减料)|省(?:步骤|流程|环节)|跳(?:过|步骤|流程)|免(?:检|测|审)|免(?:审批|流程|检)|降(?:标|标准|要求)|降(?:配|配版)|劣(?:质|化)|豆腐渣|以(?:次|旧)(?:充|替)|不合(?:标准|规范)|不符(?:标准|规范)|不(?:按|依照)(?:流程|规范|标准|制度))/;

// 英文：missed / late / delay / gap / violation / breach / error / deviation。
const DEVIATION_EN = /\b(?:miss(?:ed|es|ing)?|late|delayed?|delays?|gap[s]?|violation[s]?|breach(?:es|ed)?|error[s]?|deviation[s]?|mistake[s]?|omission[s]?|oversight[s]?|defect[s]?|non[- ]?compliance|shortcut[s]?|skipped|skipping|fudge[sd]?|bent|loose|we (?:all|usually) (?:skip|ignore)|cut (?:corner[s]?|corners)|slipped through|glossed over|went unnoticed|let (?:it|them) (?:slide|go)|look(?:ed)? the other way)/i;

// ─── C3: 免处置（把偏差从问责里摘出来）──────────────────────
// 关键：这是本族的**落点**——没有它，只算「回顾一次历史偏差」，那是复盘。
const EXEMPTION_ZH = /(?:不用|不必|无需|毋需|不须|不需要|没必要|用不着|不必再|不必特别|无需特别|不用特别|不(?:用|需|必)(?:再)?(?:特别|格外)?(?:处理|处置|追究|问责|整改|上报|记录|通报|处罚|处分|问责|审|检查|核查|评估|复盘|分析|根因)|一样的?(?:处理|方式|办法|做法|流程|标准)|照(?:旧|常|老|样)|按(?:往常|惯例|老例|旧例|前例)|继(?:续|续)?(?:走|按|照|沿|用|循)(?:老|旧|原来|原来那套|往常|原来)?(?:流程|做法|方式|办法|标准|规矩|流程|一套|路径)|维(?:持|持)?(?:原状|现状)|不(?:用|需|必)?(?:特别|格外)?(?:上报|通报|记录|公示|整改|复盘|追责)|不是(?:新|全)?(?:问题|新问题|这一?次?才|本次才)|不是这(?:一|个)?次(?:才|出的|出现)|不(?:是|算)?新(?:出现|发生)|惯例|常规|常规操作|常规处理|常规做法|常规做法|行(?:规|内|内做法|内操作)|业(?:内|界)?(?:惯例|常规|通例)|大家(?:都|一直)?(?:这么|如此)|向(?:来|一直)?(?:都)?(?:这么|如此)|既(?:往|定)|已成(?:(?:惯例|常态|定例|规矩))|默(?:认|许)|睁一?只眼|放(?:松|一?马)|下不为例|网开一面|通融|不必(?:小题大做|大惊小怪|过分))/;

// 英文：no need to / same as before / treat it as usual / routine /
// not a new issue / business as usual。
const EXEMPTION_EN = /\b(?:no need to (?:flag|report|escalate|fix|address|investigate|do anything|treat)|nothing (?:special|new) (?:to do|about it|needed)|same (?:as|treatment) (?:before|last time|as (?:before|usual))|treat (?:it|this) (?:as|like) (?:usual|before|routine)|business as usual|routine (?:operation|handling|practice|procedure|matter)|not a (?:new|special) (?:issue|problem|case|development)|no special (?:handling|treatment|action|response)|handled? (?:the same|as usual)|we (?:always|usually) (?:handle|deal with) it (?:this|the same) way|nothing (?:new|different) (?:this time|about it)|no different (?:than|from) (?:before|usual|last time)|let (?:it|this) (?:slide|go|stand)|not (?:worth|worthwhile) (?:escalating|reporting|fixing)|minor (?:enough|enough to ignore)|ignore (?:this|it) (?:as|like) (?:before|usual)|same (?:treatment|handling) as (?:the )?(?:last time|previous))/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string}}
 */
function checkNormalizationOfDeviance(text) {
  if (!text || typeof text !== 'string' || text.length < 6) {
    return { hit: false, score: 0, detail: '' };
  }

  const hasBaselineZh = BASELINE_ZH.test(text);
  const hasBaselineEn = BASELINE_EN.test(text);
  const hasDeviationZh = DEVIATION_ZH.test(text);
  const hasDeviationEn = DEVIATION_EN.test(text);
  const hasExemptionZh = EXEMPTION_ZH.test(text);
  const hasExemptionEn = EXEMPTION_EN.test(text);
  const hasPeerZh = BASELINE_PEER_ZH.test(text);
  const hasPeerEn = BASELINE_PEER_EN.test(text);
  const hasPeerExemptZh = PEER_EXEMPT_ZH.test(text);
  const hasPeerExemptEn = PEER_EXEMPT_EN.test(text);
  const hasNoHarmZh = NO_HARM_ZH.test(text);
  const hasNoHarmEn = NO_HARM_EN.test(text);
  const hasNoOversightZh = NO_OVERSIGHT_ZH.test(text);
  const hasNoOversightEn = NO_OVERSIGHT_EN.test(text);

  const baseline = hasBaselineZh || hasBaselineEn;
  const deviation = hasDeviationZh || hasDeviationEn;
  const exemption = hasExemptionZh || hasExemptionEn;
  // 隐性免处置 A：用「过去没造成后果」替代显式「不用处理」，效力等同 C3。
  const implicitExemption = hasNoHarmZh || hasNoHarmEn;
  // 隐性免处置 B：用「历来无人监督」推导免处置——与前两支等价，
  // 这是本族在中文长文本里更常见的形态（审计/内控语境）。
  const implicitOversightGap = hasNoOversightZh || hasNoOversightEn;

  // 核心判据 A：既往基线 × 当次偏差 × 免处置，三条同时在场。
  // 缺一不判：只谈历史偏差（复盘/案例），或只说「按惯例处理」而无偏差语义。
  if (baseline && deviation && exemption) {
    return {
      hit: true,
      score: 0.85,
      detail: '偏差常态化(既往先例×偏差×免处置)',
    };
  }

  // 核心判据 B：既往基线 × 历史无事故 ⇒ 隐性免处置。
  // 「以前连续三天延迟也没出事，这次不用特别处理」的省略形——后半句
  // 可以完全不说，仅凭「过去没出事」即可推导免升级。
  if ((baseline || (hasPeerZh && hasDeviationZh)) && implicitExemption) {
    return {
      hit: true,
      score: 0.8,
      detail: '偏差常态化(历史无事故⇒免升级)',
    };
  }

  // 核心判据 B2：既往基线 × 无人监督 ⇒ 隐性免处置（长文本/审计语境）。
  // 「历来都没人查，你也不用报」与「过去也没出事，不用管」结构等价。
  // [r498] 放宽：无人监督本身即隐性基线（一直没人管 ⇒ 事实基线就是无人管），
  // 不再强求显式 baseline 词在场。英文「No one ever audited this step」
  // 后半句才是处置结论，前置历史基线常被省略。
  if (implicitOversightGap) {
    return {
      hit: true,
      score: 0.8,
      detail: '偏差常态化(无人监督⇒免处置)',
    };
  }

  // 核心判据 B3：当次偏差 × 隐性免处置（无历史基线也可命中）。
  // 覆盖「同侪压力型」：用他人先例替代历史基线承担压制功能时，
  // 偏差语义在场即已构成免处置论证。
  if (deviation && (implicitExemption || implicitOversightGap)) {
    return {
      hit: true,
      score: 0.72,
      detail: '偏差常态化(偏差×隐性免处置)',
    };
  }

  // 核心判据 C：同业惯例 × 当次偏差 × 照旧结论（完整「别人也这样」推理）。
  if ((hasPeerZh || hasPeerEn) && deviation && (hasPeerExemptZh || hasPeerExemptEn || exemption)) {
    return {
      hit: true,
      score: 0.8,
      detail: '偏差常态化(同业惯例×免处置)',
    };
  }

  // 强单独形：既往基线 × 免处置 × 「不是新问题」句式
  // （「一直都这样 / 向来如此 ⇒ 不是新出的问题」）——偏差语义弱化时仍应命中。
  const notNewProblem = /(?:不是|算不上|也算不上|并非|不算是)(?:什么|啥)?(?:新|全新的|这一?次才有的)(?:问题|毛病|状况|情况|事|毛病)/i.test(text)
    || /\bnot (?:a |an )?(?:new|novel|recent|unprecedented) (?:problem|issue|development|concern|phenomenon)\b/i.test(text);
  if (baseline && exemption && notNewProblem) {
    return {
      hit: true,
      score: 0.78,
      detail: '偏差常态化(既往存在⇒非新问题)',
    };
  }

  return { hit: false, score: 0, detail: '' };
}

module.exports = { checkNormalizationOfDeviance };
