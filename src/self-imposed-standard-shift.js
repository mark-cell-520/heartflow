/**
 * src/self-imposed-standard-shift.js — 「事后加码」检测器（第 70 个判别维度）
 *
 * [v6.8.15] 第 507 轮新增。心虫 decision 本体选出
 * （scripts/round-507-decide3.js，C 候选 0.80 > B 自我豁免族 0.77 >
 * E 举证责任倒置族 0.74；identity alignment 80%）。
 * 固定 scout 池已连续第四轮空（/tmp/hf-scout-507.txt 为「未探测到新的
 * 零覆盖族」），本轮按 r505 先例自建族级探针
 * scripts/round-507-cand-probe.js 全走真实 gate 实测：6 族扫描后本族
 * **9/9 条攻击穿过硬闸门（gate=pass）且逐条归因零维度命中**，良性 0/6 误伤。
 *
 * 辨别的族：「事后加码 × 移动验收标准（moving the goalposts）」——
 * 受话人已达成事先约定的标准后，要求方不承认该结果，而是把标准临时
 * 抬到别处（"还能更好"／"情况变了"／"按新标杆来"），使已达标的成果
 * 持续作废、义务永不结题。这不是标准本身的合理演进，而是**只针对
 * 已交付一方事后单方面抬高门槛**的话术。
 *
 * 攻击形状（两条判定路由，任一成立即命中）：
 *   · 路由①（主）：**达成确认 × 标准位移** 同句共现 —— 前段承认
 *     "做到了/达标了/合格了"，后段用转折把标准抬走；
 *   · 路由②（次）：**既往承诺作废**——直接宣布先前答应的标准"不算数"，
 *     以更高门槛替换（无达成确认也构成，因为单方面作废已构成加码）。
 *
 * 为什么现有维度拦不住：
 *   · concession_coercion 管让步胁迫（要对方先认错再谈），落点在让步，
 *     本族落点是**标准被事后移动**，对方并无让步动作；
 *   · false_urgency 管虚假紧迫（时间窗压迫），本族制造的是持续压力，
 *     不依赖时间窗；
 *   · no_fallback 管封死退路，本族的退出通道一直存在，只是被不断移走；
 *   · perfect_error 管至善论式的吹毛求疵，但那是针对产出质量的无标准
 *     挑剔；本族的要件是**先有可验证的达成确认，再事后否认**；
 *   · unsupported_claim 管无依据断言，本族的断言对象是"标准在哪里"而不是
 *     "某个事实是否成立"；
 *   · src/index.js 的 BADFAITH_ATTACK_EN 里虽出现 moving the goalposts，
 *     但那是把「你在移动球门柱」当作**指责对方**的话来识别，方向相反，
 *     不识别本族的实施结构。
 *
 * → verify 级：须回溯并引用事先书面约定的验收标准；若标准确有调整，
 *   应说明变更理由、生效时点并经双方确认，而非以"还能更好"驳回已达标的成果。
 *
 * 明确不判的（豁免——这些是正当的标准管理与变更）：
 *   · 正式需求/验收变更流程（书面修订、变更单、ADR 记录理由）
 *   · 未达标时的正当驳回（对方并未达成，如实指出差距）
 *   · 分级晋升机制（本轮合格＋下一轮按已公布的新标准复测）
 *   · 在评析这套话术本身（「移动球门柱是一种谬误」）
 */

'use strict';

// ─── 要件一：达成确认（受话人已达成本方先前提出的标准）────────────────
// 中文：做到/达标/合格/完成/过关，含「要求你做到了」形与既往标准指向。
const ACHIEVED_ZH = new RegExp(
  '(?:你|你们|他|她|对方|这)?(?:已经|早已|确实|的确|其实|明明|都)?' +
  '(?:做到|做到位|做了|做完|干完|完成|达成|达标|合格|过关|通过|兑现|搞定|解决)' +
  '|(?:要求|标准|目标|任务|指标|条件|承诺)(?:你|你们)?(?:都|已经)?(?:做到|完成|达成|兑现)' +
  '|(?:达到|满足|符合|够)(?:了|到)?(?:要求|标准|目标|指标|条件|门槛|基准)' +
  '|(?:按|照|依照)(?:先前|之前|原来|当初|说好|约定|既定|事先)(?:的)?' +
  '(?:要求|标准|目标|指标|条件|门槛|承诺)(?:来|说|看|衡量)(?:你|你们)?' +
  '(?:已经|都)?(?:做到|完成|达标|合格|达标了)' +
  // 口语化达成：「进度够了」「量到位了」——不加这支会漏掉口语形样本。
  '|(?:进度|工作量|任务|活|活儿|事情|部分)(?:已经|差不多|基本|大致|快)?(?:够|到量|到位)(?:了|啦)?'
);

// 英文：met / hit / satisfied / fulfilled the (already) agreed target。
const ACHIEVED_EN = new RegExp(
  "\\b(?:you|he|she|they|we)\\s+(?:have\\s+)?(?:already\\s+|did\\s+|actually\\s+)?" +
  "(?:met|hit|satisfied|fulfilled|achieved|complied\\s+with|completed|delivered|finished)\\b" +
  "|\\b(?:the|that|this)\\s+(?:target|goal|bar|standard|requirement|milestone|quota|criteria)\\s+" +
  "(?:has\\s+been|was|were|is)\\s+(?:met|reached|satisfied|hit|fulfilled|achieved)\\b" +
  "|\\byou\\s+(?:met|satisfied)\\s+(?:the|every|all\\s+(?:the|of\\s+the))\\s+" +
  "(?:requirement|target|goal|criteria|bar|standard)s?\\b" +
  "|\\bfine\\b,?\\s+\\byou\\s+(?:finished|completed|met|delivered)\\b" +
  "|\\bby\\s+(?:the|our|that)\\s+(?:agreed|original|stated|previous)\\s+" +
  "(?:standard|criteria|bar|goal)s?\\b",
  'i'
);

// ─── 要件二：标准位移（把标准抬到别处 / 既往承诺作废）────────────────
// 中文：达标之后把要求抬高；或以"还能更好/现在情况变了"驳回已达成的成果。
const SHIFT_ZH = new RegExp(
  // 「还能更好 / 可以更……」事后升格
  '(?:但|但是|可是|不过|然而|现在|这会儿|如今|眼下)(?:我|我们|觉得|认为|看|要求)?' +
  '(?:还)?(?:能|可以|应该|得|要|必须)(?:更|再|进一步|提升|进步)' +
  '|(?:还能|还可以|应该|可以)(?:更好|更好一点|更强|更快|更完善|更完美|更优秀|更出色)' +
  '|(?:别|先别|不要|先不要|且慢)(?:谈条件|提要求|收工|结项|谈报酬|谈钱|松懈|松口气|停下来|说完成)' +
  '|(?:现状|情况|形势|局势)(?:变|有变|起了变化|不同了|现在不一样)' +
  '|(?:按|照)(?:新|最新|更高|重新)(?:的)?(?:标准|标杆|要求|门槛|基准|规范)(?:来|衡量|要求)' +
  '|(?:重新|又|另行)(?:定|设定|提高|抬|立)(?:了)?(?:标准|标杆|要求|门槛|基准|规矩)' +
  '|(?:之前|先前|当初|原来|上次|早先)(?:答应|说|讲|约定|承诺)(?:的)?(?:不算数|不作数|作废|不算|取消|推翻|不算了)' +
  '|(?:门槛|标准|要求|标杆)(?:比|比那个|比以前|比说好的|比原来)(?:还|要)?(?:高|严格|高得多|更高)' +
  '|(?:又|再)(?:想到|提出|冒出来)(?:几个|一些|新的)?(?:新)?(?:问题|要求|条件|疑点)' +
  '|(?:继续|接着|再)(?:改|做|完善|优化|打磨)(?:，|。|直到|到)?(?:我|我们)?(?:满意|认可|批准|点头)(?:为止)?' +
  '|(?:达标|合格|完成)(?:不|并不|也不|不代表)(?:意味着|等于|代表)?(?:能|可以)?(?:收工|结项|结束|完工|达标|交差|画句号)'
);

// 英文：now the bar is higher / that was the old bar / keep going until I say so。
const SHIFT_EN = new RegExp(
  "\\b(?:but|however|yet|now|and\\s+now|these\\s+days|since\\s+then)\\s+" +
  "(?:the\\s+)?(?:bar|standard|target|goal|requirement|benchmark|mark)s?\\s+" +
  "(?:is|are|has\\s+(?:been\\s+)?(?:moved|raised|shifted|changed)|have\\s+been\\s+raised)\\b" +
  "|\\b(?:that|this|those)\\s+(?:was|were|is)\\s+(?:the\\s+)?(?:old|previous|former|original)\\s+" +
  "(?:bar|standard|target|goal|requirement|bar)\\b" +
  "|\\b(?:we|I|they)\\s+(?:have\\s+)?(?:raised|moved|shifted|changed)\\s+(?:the\\s+)?(?:bar|goal|goalposts|target|standard)s?\\b" +
  "|\\b(?:you|he|they)\\s+(?:could|should|can)\\s+(?:do|be)\\s+(?:better|even\\s+better|more)\\b" +
  "|\\b(?:do|did)\\s+it\\s+(?:again|once\\s+more)\\s+to\\s+(?:a\\s+)?(?:higher|better|newer)\\s+(?:standard|bar|level)\\b" +
  "|\\b(?:keep|keep\\s+on|continue)\\s+(?:going|working|revising|iterating|polishing|refining)\\b" +
  "|\\bnot\\s+(?:good\\s+)?enough\\s+(?:yet|anymore|now)\\b" +
  "|\\bnow\\s+(?:the\\s+)?(?:expectation|expectations|bar|standard)s?\\s+(?:is|are)\\s+(?:elsewhere|different|higher)\\b" +
  "|\\b(?:that|this)\\s+(?:is|was)\\s+(?:no\\s+longer\\s+)?(?:the\\s+)?(?:deal|agreement|the\\s+bargain)\\b",
  'i'
);

// ─── 豁免：正当的标准管理、变更与推迟驳回 ─────────────────────────────
// 正式变更流程：书面修订、变更单、ADR、重新评估工时等。
const PROCESS_ZH = new RegExp(
  '(?:书面|正式|按)(?:修订|变更)(?:版|本|单|说明)?' +
  '|(?:变更|修订|调整)(?:流程|程序|需|要|应|须)(?:走|经|由)?' +
  '|(?:ADR|决策记录|变更单|变更申请|工单|ticket|issue)\\s*[##编号]?' +
  '|(?:重新|另行)(?:评估|核算|核定)(?:工时|工期|工作量|成本|排期)' +
  '|(?:以|按)(?:书面|正式)(?:修订版|版本|文件|通知)(?:为准)?'
);
const PROCESS_EN = new RegExp(
  "\\b(?:change|revision|amendment)\\s+(?:request|order|record|control|log|process|ADR)\\b" +
  "|\\b(?:documented|formal|written|approved)\\s+" +
  "(?:change|revision|revised)\\s+(?:process|criteria|standard|requirements?|version)\\b" +
  "|\\bre-?estimat(?:e|ed|ing)\\s+(?:the\\s+)?(?:effort|timeline|schedule|cost|delivery)\\b" +
  "|\\bper\\s+(?:the\\s+)?(?:revised|updated)\\s+(?:spec|specification|document|contract)\\b",
  'i'
);
// 未达标时的正当驳回：明确指出未达成，而非事后抬高标准。
const NOT_MET_ZH = new RegExp(
  '(?:你|你们)(?:还|尚未|并未|并没|仍)(?:没|未)(?:做到|完成|达标|合格|解决|交付)' +
  '|(?:尚未|还未|没有)(?:达到|满足|完成)(?:要求|标准|目标|指标)' +
  '|(?:目前|现在|眼下)(?:尚未|还未|并未)(?:达到|满足)(?:要求|标准)' +
  '|(?:差距|缺口)(?:在|是|仍)(?:于|在|有)'
);
const NOT_MET_EN = new RegExp(
  "\\b(?:you|they|we)\\s+(?:haven'?t|have\\s+not|hasn'?t)\\s+" +
  "(?:met|done|completed|delivered|achieved)\\b" +
  "|\\b(?:not|not\\s+yet|still\\s+not)\\s+(?:met|satisfied|achieved|delivered)\\b" +
  "|\\b(?:the\\s+)?(?:gap|shortfall)\\s+(?:is|remains|lies)\\b",
  'i'
);
// 分级晋升机制：本轮合格 + 下一轮按已公布的新标准复测。
const STAGE_ZH = new RegExp(
  '(?:本轮|本轮|本阶段|本阶段|此轮)(?:合格|达标|通过)' +
  '|(?:下一轮|下一阶段|下一环节|下一阶段)(?:将|按|会)(?:在|按)(?:新|更高)?(?:标准|标杆)(?:下)?(?:复测|重测|考核|评审)' +
  '|(?:标准|门槛)(?:已|提前|事先|之前)(?:公布|公开|说明|告知)'
);
const STAGE_EN = new RegExp(
  "\\b(?:this|the)\\s+(?:round|stage|phase|gate)\\s+(?:is\\s+)?(?:passed|complete|cleared)\\b" +
  "|\\b(?:the\\s+)?next\\s+(?:round|stage|phase|gate)\\s+(?:will\\s+be|is)\\s+" +
  "(?:assessed|measured|evaluated)\\s+(?:under|against|by)\\s+(?:a\\s+)?(?:new|higher|published)\\s+" +
  "(?:standard|rubric|bar|criteria)s?\\b" +
  "|\\b(?:the\\s+)?(?:new|higher)\\s+(?:standard|criteria|bar)s?\\s+(?:was|were)\\s+" +
  "(?:published|announced|shared)\\s+(?:in\\s+advance|upfront|beforehand)\\b",
  'i'
);
// 在评析这套话术本身。
const META_EXEMPT_ZH = /(?:移动球门|移动球柱|事后加码|临时抬高标准|标准位移|抬高门槛)(?:是|属于|是一种|正是|属于)(?:一种|典型的|常见的)?(?:谬误|谬说|逻辑错误|错误论证|话术|手法|手段|策略|伎俩|套路|推责|现象|问题|错误)/;
const META_EXEMPT_EN = /\b(?:moving\s+the\s+goalposts?|shifting\s+the\s+goalposts?|raising\s+the\s+bar|goalpost\s+shift)\s+(?:is|are)\s+(?:a\s+)?(?:fallacy|manipulation|tactic|rhetorical|technique|form\s+of|symptom\s+of|common)\b/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkStandardShift(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 在评析这套话术 → 不是运用它
  if (META_EXEMPT_ZH.test(text) || META_EXEMPT_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 豁免：正式变更流程 / 未达标时的正当驳回 / 分级晋升机制
  if (PROCESS_ZH.test(text) || PROCESS_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (NOT_MET_ZH.test(text) || NOT_MET_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (STAGE_ZH.test(text) || STAGE_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const shiftZh = SHIFT_ZH.test(text);
  const shiftEn = SHIFT_EN.test(text);
  const shift = shiftZh || shiftEn;

  // 路由②：既往承诺直接作废（无达成确认也构成单方面加码）
  if (shiftZh || shiftEn) {
    const voidZh = /(?:之前|先前|当初|原来|上次|早先|说好|约定|讲好)(?:答应|说|讲|约定|承诺|定的)(?:的)?(?:不算数|不作数|作废|不算|取消|推翻|不算了|不算了)/.test(text);
    const voidEn = /\b(?:that|this|those|our|the)\s+(?:was|were|is)\s+(?:no\s+longer\s+)?(?:the\s+)?(?:deal|agreement|bargain)\b|\b(?:we|I|they)\s+(?:are\s+)?(?:no\s+longer|not)\s+(?:honou?ring|bound\s+by)\s+(?:that|this)\b/i.test(text);
    if (voidZh || voidEn) {
      return {
        hit: true,
        score: 0.66,
        count: 1,
        detail: isZh ? '事后加码×既往承诺作废(zh)' : '事后加码×既往承诺作废(en)',
      };
    }
  }

  // 路由①：达成确认 × 标准位移（主判定）
  const okZh = ACHIEVED_ZH.test(text) && shiftZh;
  const okEn = ACHIEVED_EN.test(text) && shiftEn;
  if (okZh || okEn) {
    return {
      hit: true,
      score: 0.70,
      count: 1,
      detail: isZh ? '事后加码×移动验收标准(zh)' : '事后加码×移动验收标准(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = { checkStandardShift };
