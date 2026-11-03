/**
 * src/scale-dismissal.js — 「规模 dismiss」检测器
 * （第 205 个判别维度，r208）
 *
 * [r208 立项] philosophy_decision 在当前引擎（v6.8.136，204 维）上两次裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed=true；cognitiveLoad 与
 * uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。立项缺口实
 * 证：r208 族探针（/tmp/hf-probe-r208.js + /tmp/hf-probe-r208b.js +
 * /tmp/hf-scout-r208.txt）在当前引擎复测——12 个候选族逐族实测，
 * scale_dismissal 族攻击样本 8/8 gate.action=pass（现有 204 维真零命
 * 中，含中英双语、裸名词、带修饰、倒装、长句变体）、良性 4/4 pass
 * （零误伤）；其余候选族缺口不足（token_gesture 7/8、burden_inversion
 * 7/8、silence_as_consent 4/8、appeal_to_inevitability 2/4、
 * planned_as_done 2/4、uncertainty_weaponization 2/3、fatalism 1/3）。
 * 外部三层研究（HN Algolia / Semantic Scholar 429 / GitHub API）无可用
 * 纯规则实现，如实记录——按心虫既有维度形态自建纯规则判据。
 *
 * 辨别的族：规模 dismiss（scale dismissal / 以占比抹杀绝对伤害）——把
 * **小规模、低占比、少数个案**直接当成**风险、问题、伤害可以不予理会**
 * 的理由：才几个人不值得大惊小怪、个别案例没必要上纲上线、占比不到
 * 千分之一忽略不计、a few incidents out of millions, not a big deal：
 *   才死了几个人，这点风险根本不值得大惊小怪。
 *   不过是个别案例，影响范围有限，没必要上纲上线。
 *   就几起故障，占比不到千分之一，忽略不计，没必要为它调整方案。
 *   区区几个家庭的损失，比起宏大叙事不值一提。
 *   Only a handful of users are affected, so this is not a big deal.
 *   A few incidents out of millions — statistically negligible, so
 *   we can move on.
 *
 * 为什么这是判别者的核心缺口（对齐「能判断是非」）：风险与伤害的严重
 * 性取决于**绝对后果、可逆性、受害者的不可选择性**，不取决于它占总
 * 体的比例。相对占比是一张「免检通行证」：把 1% 说成「极小部分」，
 * 那 1% 里的每一条人命、每一次事故就被整体注销——这与 base_rate_
 * neglect（忽视基础概率高估/低估）恰好互补：本族是**用占比的存在
 * 掩护占比背后的绝对代价**。正当的规模陈述（统计报告、风险分级、
 * 资源排序）与 dismiss 的界线在于：**前者只陈述比例并给出处置，后
 * 者用比例取消处置**。
 *
 * 与既有维度的边界（r208 归因）：
 *   · selective_minimization（既有维度）管**过错/情节的严重性降级**
 *     （「属于轻微/够不上严重」——法律分级语境），落点是**已认定行
 *     为的定级**；本族落点是**用规模注销风险本身**（「占比小所以不
 *     用管」）。探针实测本族 8/8 攻击样本 selective_minimization 零
 *     命中。
 *   · harm_invalidation（既有维度）管**对已发生的具体伤害的否认/抹
 *     除**（「这点小伤不算什么」），要求伤害名词在场；本族不要求伤
 *     害已在场，**规模宣告 + dismiss 态度**即构成（「才几个人，没
 *     必要大惊小怪」）。
 *   · percentage_overflow（既有维度）管**百分比演算错误**，本族不涉
 *     及算术、只涉及「以比注销」的话语结构。
 *   · normalization_of_deviance 管**偏差被渐进接纳为正常**，本族管
 *     **一次性以规模注销**。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判；另设「忽略不计」融合分支）：
 *   · 腿① SMALL 小规模/低占比宣告（中英）：才/仅仅/不过+几…、占比/
 *     比例/发生率+不到/低于/不大、裸名词小量级（个别/极少数/一小部
 *     分/微不足道/微乎其微/区区/屈指可数——**r161 教训落地**：去后缀
 *     仍命中）、EN only a few / a handful of users / a tiny fraction
 *     / statistically negligible / a few out of millions / affects
 *     only a few。
 *   · 腿② DISMISS 风险/问题 dismiss（中英）：不值得/没必要/不必+大
 *     惊小怪/担心/在意/调整/处理/管、不是+大问题/大不了/要紧、可以/
 *     大可+忽略/无视/搁置、没什么大不了/无伤大雅/不足挂齿/不值一提、
 *     上纲上线/小题大做/大惊小做/反应过度、翻篇/告一段落、不影响大
 *     局；EN not a big deal / not worth the fuss / no need to worry /
 *     we can ignore / move on / overreacting / much ado about
 *     nothing / doesn't affect the big picture。
 *   · 融合分支：「忽略不计」单式同时含小规模（不计）与 dismiss（忽
 *     略），两腿齐备；统计测量语境的忽略不计（误差/偏差/舍入/精度）
 *     走豁免，不走判别。
 *   · 缺腿不判：只有腿①（「不良反应发生率低于万分之一，属临床可接
 *     受范围」）是统计陈述；只有腿②（「这个问题需要重视」的反面
 *     ——单纯 dismiss 无规模依据）不构成本族。
 *
 * 为什么取 VERIFY 级：单句可能是小说对白、军事伤亡通报的转述、工程
 * 取舍讨论（triage 语境下的正当优先级排序），rewrite 会误伤（与
 * r161-r207 全部评价族同口径）。verify 的含义是「这段文本用相对占
 * 比取消了绝对代价的权重，需要回到后果本身评估」。
 *
 * 明确不判的（豁免——这些是正当的统计陈述、让步转折与批判转述）：
 *   · 让步转折（事故率虽低，但…仍要防控 / although… yet…——明确
 *     承认规模小同时坚持处置的句子）；
 *   · 统计测量语境（舍入误差/偏差/精度+忽略不计——测量陈述不是伤
 *     害注销）；
 *   · 概念/批判转述（极小化/大事化小/比烂+是谬误·话术·问题；EN
 *     scale dismissal is a fallacy——讨论这个概念本身不是运用它）；
 *   · 腿②否定守卫（腿②匹配点前 8 字内出现不是/并非/绝不/不能/不
 *     应/别/不要/未必；EN not / never / doesn't——「占比小不是忽视
 *     它的理由」是对该谬误的否定）。
 */
'use strict';

// ─── 腿① SMALL 小规模/低占比宣告（中文）────────────────────────────
// 枚举腿自查（r161 教训）：小量级词收裸词形态（个别/极少数/微不足道/
// 区区 去后缀仍命中）。四种形状并列：才+几X、占比族、裸名词、量级对比。
const SMALL_ZH = [
  // S1 才/仅仅/不过/仅 + 小数量（才几个人/才几例/才两起/不过个别）
  /(?:才|仅仅|只是|不过|仅)[^。，！？!?]{0,6}(?:几|两|三|少数|个别|一点|一点点|少许|些许|零星)(?:个|人|例|起|次|条|件|笔|部|份|种|类|家|台|宗)/,
  // S2 占比族（占比/比例/发生率+不到/低于/不大——限定词后置）
  /(?:占比|所占比例|比例|比率|发生率|覆盖率|命中率|故障率|事故率|投诉率|失败率|复发率|死亡率|感染率|客诉率)[^。，！？!?]{0,10}(?:不到|不足|低于|小于|不大|不高|很少|仅|只有|极小|很小|微乎其微|忽略不计|屈指可数|少之又少)/,
  // S2b 占比族（限定词前置——倒装形「这么小的比例」）
  /(?:这么|如此|如此之|极|非常|相当|很|颇)[^。，！？!?]{0,2}(?:小|低|少)的?(?:占比|比例|比率|发生率|覆盖率|故障率|事故率|投诉率|失败率|复发率)/,
  // S3 裸名词小量级（r161 教训：去后缀仍命中）
  /(?:个别|极少数|一小部分|少数派|少数人|少数|微不足道|微乎其微|忽略不计|区区|屈指可数|少之又少|数量有限|零星的?|少量的?|为数不多|少数案例|个案)/,
  // S4 量级对比（区区X而已/不过X罢了）
  /(?:区区|不过)[^。，！？!?]{0,8}(?:而已|罢了)/,
  // S5 这么点/一小 + 损失/问题（这点损失/这么点伤亡）
  /(?:这点|这点儿|这么点|一小|点滴)[^。，！？!?]{0,6}(?:损失|伤亡|伤害|问题|事|事态|案例|事故|故障|投诉|差错|失误|瑕疵|缺陷|风险)/,
];

// ─── 腿① SMALL（英文）──────────────────────────────────────────────
const SMALL_EN = [
  /\bonly\s+(?:a\s+)?(?:few|handful|couple|small\s+number|tiny\s+fraction|tiny\s+minority|tiny\s+share|small\s+share)\b/i,
  /\b(?:a\s+)?(?:few|handful|couple)\s+(?:out\s+of|of)\s+(?:millions?|thousands?|billions?|the\s+many|all\s+the)\b/i,
  /\b(?:a\s+)?(?:tiny|small|minute|negligible|insignificant)\s+(?:fraction|percentage|proportion|share|number|subset|portion|minority)\b/i,
  /\b(?:statistically\s+)?(?:negligible|insignificant|minuscule)\b/i,
  /\b(?:only\s+)?(?:affects?|affected|involves?|impacted|hit)\s+(?:a\s+)?(?:few|handful|small|tiny)\b/i,
  /\bless\s+than\s+(?:a\s+)?(?:fraction|percent|per\s+mille|one\s+in|0?\.\d+\s*(?:percent|%))\b/i,
  /\b(?:a\s+)?(?:few|handful)\s+(?:users?|customers?|people|cases?|incidents?|reports?|deaths?|victims?|complaints?|failures?)\b/i,
];

// ─── 腿② DISMISS 风险/问题 dismiss（中文）──────────────────────────
// 自查（r161 教训）：dismiss 动词收裸词形态（忽略/无视/翻篇/上纲上线
// 去后缀仍命中）。八种形状并列。
const DISMISS_ZH = [
  // D1 不值得/没必要/不必/无须 + 反应/处置动作（不值得大惊小怪/没必要调整）
  /(?:不值得|不值|没必要|不必|无须|无需|犯不着)[^。，！？!?]{0,6}(?:大惊小怪|担心|担忧|在意|关注|重视|焦虑|恐慌|紧张|反应|调整|投入|处理|理会|干预|采取|升级|上报|整改|回应)/,
  // D2 不是/算不上 + 大问题/大不了/要紧/严重
  /(?:不是|算不上|算不得|称不上|谈不上)[^。，！？!?]{0,4}(?:大问题|大事|大毛病|大风险|大不了|要紧|严重|什么大问题|什么大事)/,
  // D3 可以/大可/直接 + 忽略/无视/搁置（可以忽略/大可无视）
  /(?:可以|大可|直接|尽可|姑且|暂且|索性)[^。，！？!?]{0,4}(?:忽略|无视|漠视|搁置|放一边|不予理会|不当回事|不放在心上)/,
  // D4 没什么大不了/无伤大雅/不足挂齿/不值一提/无关痛痒
  /(?:没什么|算不上|小事一桩|无伤大雅|不足挂齿|何足挂齿|不值一提|无关痛痒|不痛不痒)/,
  // D5 翻篇/告一段落/就此揭过（事情翻篇）
  /(?:翻篇|翻过这篇|就此揭过|一笔勾销|告一段落|揭过这篇)/,
  // D6 上纲上线/小题大做/大惊小怪/反应过度（把关切贬为过度）
  /(?:上纲上线|小题大做|小题大作|大惊小怪|反应过度|过度反应|过度紧张)/,
  // D7 不影响大局/全局/整体（不影响大局）
  /(?:不影响|无损于|动摇不了|改变不了|决定不了)[^。，！？!?]{0,6}(?:大局|全局|整体|大势|根本|根基)/,
  // D8 忽略不计（融合短语：单式同时含小规模与 dismiss）
  /忽略不计/,
];

// ─── 腿② DISMISS（英文）────────────────────────────────────────────
const DISMISS_EN = [
  /\b(?:not|no)\s+(?:a\s+)?(?:big\s+deal|biggie|serious\s+(?:issue|problem|concern)|major\s+(?:issue|problem|concern))\b/i,
  /\bnot\s+worth\s+(?:the\s+)?(?:fuss|worry|worrying|attention|concern|panic|panicking|reacting|overreacting|effort|responding|acting)\b/i,
  /\b(?:no\s+(?:need|reason|point)\s+to\s+(?:worry|panic|panicking|act|respond|overreact|care))\b/i,
  /\b(?:we\s+can\s+)?(?:just\s+)?(?:ignore|ignoring|disregard|dismiss|brush\s+(?:it\s+)?(?:off|aside)|sweep\s+(?:it\s+)?(?:under|aside)|shelve)\b/i,
  /\b(?:move|moving)\s+on\b/i,
  /\b(?:let\s+it\s+go|get\s+over\s+it|water\s+under\s+the\s+bridge)\b/i,
  /\b(?:nothing\s+to\s+(?:worry|see|be\s+alarmed)\s+(?:about|here))\b/i,
  /\b(?:overreact(?:ing|ed)?|making\s+a\s+(?:big\s+)?fuss|much\s+ado\s+about\s+nothing)\b/i,
  /\b(?:does\s+not|doesn'?t|won'?t)\s+(?:affect|impact|change|threaten)\s+(?:the\s+)?(?:big\s+picture|overall|bottom\s+line|grand\s+scheme)\b/i,
];

// ─── 豁免一：让步转折（承认规模小但坚持处置——正当的风险陈述）────────
const EXEMPT_CONCESSION_ZH = [
  /(?:虽|虽然|尽管|固然|诚然)[^。！？!?]{0,14}(?:低|小|少|罕见|不高|不大|有限)[^。！？!?]{0,30}(?:仍|依然|还是|也要|更要|不能|不可|每一起|每一个|都要|需要|应当|应该|必须|值得|仍需|防控|整改|复盘|闭环|处置|处理|重视|关注)/,
  /(?:占比|所占比例|比例|比率|发生率|覆盖率|命中率|故障率|事故率|投诉率|失败率|复发率|死亡率|感染率|客诉率|数量|人数|案例|故障|投诉)[^。！？!?]{0,8}(?:不大|不高|很少|有限)[^。！？!?]{0,30}(?:但|但是|然而|不过|可是)[^。！？!?]{0,20}(?:仍|依然|还是|也要|更要|不能|不可|每一起|每一个|都要|需要|应当|应该|必须|值得|仍需|防控|整改|复盘|闭环|处置|处理|重视|关注)/,
];
const EXEMPT_CONCESSION_EN = [
  /\b(?:although|though|while|even\s+(?:if|though)|despite|in\s+spite\s+of)\b[^.]{0,100}?\b(?:but|yet|still|nevertheless|nonetheless|remains?|must|should|cannot|can'?t)\b/i,
];

// ─── 豁免二：统计测量语境（舍入/误差/精度+忽略不计——测量陈述）─────
const EXEMPT_MEASURE_ZH = [
  /(?:误差|偏差|噪声|舍入|尾差|四舍五入|精度|公差|波动|漂移|扰动|残差)[^。！？!?]{0,12}(?:可)?忽略不计/,
  /忽略不计[^。！？!?]{0,12}(?:误差|偏差|噪声|舍入|尾差|精度|公差|波动|漂移|残差)/,
];
const EXEMPT_MEASURE_EN = [
  /\b(?:rounding|round[- ]off|error|noise|precision|tolerance|measurement|deviation|drift|residual)\s+(?:is|are|was|were)?\s*(?:statistically\s+)?negligible\b/i,
];

// ─── 豁免三：概念/批判转述（讨论这个概念本身不是运用它）────────────
const EXEMPT_META_ZH = [
  /(?:极小化|大事化小|小事化大|比烂|和稀泥|淡化|轻描淡写|规模 dismiss|规模dismissal)[^。！？!?]{0,24}(?:是|属于|构成|正是|就是)[^。！？!?]{0,16}(?:谬误|问题|陷阱|错误|不对|诡辩|话术|手法|手段|策略|伎俩|套路|现象|偏见|逻辑)/,
  /(?:是|属于|构成|正是|就是)[^。！？!?]{0,16}(?:典型的|常见的|经典的|明显的|标准的|地地道道的)?[^。！？!?]{0,8}(?:极小化|大事化小|小事化大|比烂|和稀泥|淡化|轻描淡写)[^。！？!?]{0,6}(?:谬误|话术|逻辑错误|诡辩|套路|问题|错误|偏见|现象)/,
  /把[^。！？!?]{0,24}说成[^。！？!?]{0,24}(?:是|属于|构成)[^。！？!?]{0,16}(?:谬误|错误|不对|诡辩|话术|问题)/,
  /(?:讨论|分析|识别|警惕|所谓|被称为|叫作|称之为|批判|驳斥|拆穿|反对|拒绝)[^。！？!?]{0,14}(?:极小化|大事化小|比烂|和稀泥|淡化|轻描淡写)/,
];
const EXEMPT_META_EN = [
  /\b(?:scale\s+dismissal|harm\s+minimi[sz]ation|minimi[sz]ing)\s+(?:is|are)\s+(?:a\s+)?(?:classic|textbook|typical|common)?\s*(?:fallacy|manipulation|tactic|rhetorical|technique|form\s+of)\b/i,
];

// ─── 腿②否定守卫（腿②匹配点前的否定词——「占比小不是忽视它的理由」）─
const NEG_ZH = /(?:不是|并非|绝不是|绝不|从不|不代表|不等于|未必|很难说|谈不上|岂是|不见得|不能|不应|不该|别|不要|不许)$/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t)$/i;

const WIN_ZH = 80;    // 中文邻近窗（字）
const WIN_EN = 200;   // 英文邻近窗（字符）

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

function firstHit(list, text) {
  for (const re of list) {
    const m = re.exec(text);
    if (m) return m.index;
  }
  return -1;
}

// 腿②否定守卫：leg2 匹配点前 8 字（EN 12 字符）内出现否定词 → 不是
// 在 dismiss 风险，而是在否定 dismiss。
function negatedBefore(text, idx, isZh) {
  if (idx < 0) return false;
  const n = isZh ? 8 : 12;
  const pre = text.slice(Math.max(0, idx - n), idx);
  return isZh ? NEG_ZH.test(pre) : NEG_EN.test(pre);
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkScaleDismissal(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const S_Z = R.SMALL_ZH || SMALL_ZH;
  const S_E = R.SMALL_EN || SMALL_EN;
  const D_Z = R.DISMISS_ZH || DISMISS_ZH;
  const D_E = R.DISMISS_EN || DISMISS_EN;
  const C_Z = R.EXEMPT_CONCESSION_ZH || EXEMPT_CONCESSION_ZH;
  const C_E = R.EXEMPT_CONCESSION_EN || EXEMPT_CONCESSION_EN;
  const M_Z = R.EXEMPT_MEASURE_ZH || EXEMPT_MEASURE_ZH;
  const M_E = R.EXEMPT_MEASURE_EN || EXEMPT_MEASURE_EN;
  const X_Z = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const X_E = R.EXEMPT_META_EN || EXEMPT_META_EN;

  // 概念/批判转述在场 → 不是运用它
  if (anyHit(X_Z, text) || anyHit(X_E, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 让步转折在场 → 承认规模小但坚持处置，不是 dismiss
  if (anyHit(C_Z, text) || anyHit(C_E, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 统计测量语境 → 舍入/精度陈述不是伤害注销
  if (anyHit(M_Z, text) || anyHit(M_E, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿① 小规模/低占比宣告
  const sZhIdx = firstHit(S_Z, text);
  const sEnIdx = firstHit(S_E, text);
  const sIdx = sZhIdx >= 0 ? sZhIdx : sEnIdx;
  if (sIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿② 风险/问题 dismiss（带否定守卫：逐匹配点确认未被否定）
  let dIdx = -1;
  const dList = isZh ? D_Z : D_E;
  for (const re of dList) {
    const m = re.exec(text);
    if (m && !negatedBefore(text, m.index, isZh)) { dIdx = m.index; break; }
    if (m && negatedBefore(text, m.index, isZh)) {
      // 该匹配点被否定——继续找下一个匹配点（同一正则/下一正则）
      let mm;
      const re2 = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      while ((mm = re2.exec(text)) !== null) {
        if (!negatedBefore(text, mm.index, isZh)) { dIdx = mm.index; break; }
      }
      if (dIdx >= 0) break;
    }
  }
  if (dIdx < 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 邻近窗：两腿须落在同一次「规模→注销」叙述内
  const win = isZh ? WIN_ZH : WIN_EN;
  if (Math.abs(sIdx - dIdx) > win) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '规模 dismiss×小占比注销绝对代价(zh)'
      : 'scale dismissal×small-share erasure(en)',
  };
}

module.exports = {
  checkScaleDismissal,
  __internals: () => ({
    SMALL_ZH, SMALL_EN, DISMISS_ZH, DISMISS_EN,
    EXEMPT_CONCESSION_ZH, EXEMPT_CONCESSION_EN,
    EXEMPT_MEASURE_ZH, EXEMPT_MEASURE_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
  }),
};
