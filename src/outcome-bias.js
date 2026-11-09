/**
 * src/outcome-bias.js — 「结果偏误（outcome bias / 结局偏见）」检测器
 * （第 173 个判别维度）
 *
 * [r175 立项] decision 本体在当前引擎（v6.8.102，172 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。候选来自三层研究（HN Algolia "outcome bias"
 * 命中 "Outcome Bias and the Interpreter: How Our Minds Confuse Skill and
 * Luck"（objectID 6563620）、"Introduction to the Outcome Bias – Don't Judge
 * Decisions by Their Outcome"（16543449）、"Outcome Bias: The Bias Behind
 * the World's Greatest Catastrophes"（21131582）——确认「把结果当决策质量
 * 判据、混淆技能与运气」是公认的判断失误；GitHub 无纯规则实现，
 * jbarach2012/AIBF_API ★195 属招聘反歧视域不同构，仅概念背景；
 * Semantic Scholar 关键词检索无返回，如实记录）+ 引擎差距实测（r175 探针
 * /tmp/hf-probe-r175.js，直调 src/gate.js）：结果偏误族 8 条攻击样本
 * **7 条穿过硬闸门且零维度命中**（仅 1 条被 reasoning_coherence 兜住），
 * 良性 5 条零误判。
 *
 * 辨别的族：结果偏误（outcome bias）——用**结果的好坏**来评判**决策/选择的
 * 质量**，忽视决策当时可获得的信息与论证质量，把运气当成能力：
 *   他这次赌对了，说明当初的选择是明智的。
 *   手术成功了，足以证明医生的方案是正确的。
 *   球队夺冠了，可见主教练的战术安排英明果断。
 *   这只股票翻了三倍，证明他当初的买入决定眼光独到。
 *   他亏得血本无归，可见当初的投资决策非常愚蠢。
 *   新产品卖爆了，这说明当初的市场定位判断是对的。
 *   The bet paid off, which proves his decision was wise.
 *   She lost everything, showing that her choice was clearly reckless.
 *
 * 与既有维度的边界（r175 归因）：
 *   · overclaim_already_knew / overclaim_predict（capability_overclaim 的
 *     子信号，仅计分不触发闸门）管「早就知道/不出所料」式的**预测能力**
 *     自夸，本族管**已发生结果 × 决策质量归因**，不依赖任何预测声明；
 *   · perfect_error 的 S1_false_precision 管**数字精度**失真，本族不管
 *     数字管「结果→决策质量」的推断方向；
 *   · post_hoc / pseudo_causal 管「A 在 B 前所以 A 导致 B」的因果断言，
 *     本族不断言世界因果，评判的是**决策本身的好坏**；
 *   · hasty_generalization 管样本不足的归纳，本族是单结果对单决策的
 *     质量倒推；
 *   · helplessness_induction 管「注定失败」式的无助诱导，本族的评价
 *     对象是决策者的眼光/水平而非处境的不可改变。
 *
 * 判据（三腿共现，缺一不判）：
 *   腿① OUTCOME 高方差结果事件：运气支配型结果词（赌对/赌错/押对/蒙对/
 *      翻倍/翻了三倍/血本无归/亏光/爆仓/套牢/割肉/暴涨/暴跌/翻车/踩雷/
 *      暴雷/翻身/夺冠/出局/淘汰/落榜/考上/没考上/卖爆/大卖/滞销/中奖/
 *      活下来/去世/救回来/没救回来/手术成功/手术失败/赢麻了/躺赢……
 *      裸名词形态；EN paid off / won / lost / hit the jackpot / struck it
 *      rich / made a fortune / went bankrupt / lost everything / came out
 *      ahead / fell flat / crashed / tanked / gamble / jackpot）；
 *   腿② EVAL 决策评价：决策类名词（决策/决定/选择/判断/策略/方案/战术/
 *      布局/操作/下注/押注/买入/卖出/投资/出手/转型/放弃/坚持/路线/赌注/
 *      定夺/拍板；EN decision / choice / call / bet / gamble / strategy /
 *      plan / move / pick）× 评价词（明智/英明/睿智/高明/正确/果断/清醒/
 *      理性/精明/厉害/眼光独到/有远见/愚蠢/草率/鲁莽/失误/失策/错误/糊涂/
 *      短视/冒进/不该/欠妥/败笔；EN wise / correct / brilliant / shrewd /
 *      reckless / foolish / hasty / poor / well-judged / ill-judged）落在
 *      15 字（EN 60 字符）窗内（前后双向）；
 *   腿③ LINK 归因连接词：说明/证明/可见/足以证明/表明/意味着/证实/印证/
 *      体现出/反映出/所以/因此/因而/故而/毕竟/说到底/事实证明/结果证明/
 *      归功于/全靠/多亏；EN proves / proving / shows / showing /
 *      demonstrates / confirms / means / which means / indicating /
 *      therefore / thus / hence / so / after all / thanks to / proof。
 *   连接结构：LINK 匹配点前 60 字（EN 120 字符）内有 OUTCOME 且后有
 *   EVAL（决策名词×评价词共现），或前有 EVAL 且后有 OUTCOME（结论先行的
 *   倒装形）——两种朝向任一。
 *   缺腿不判：「他赌对了纯属运气」无决策名词×评价词；「这个方案当时论证
 *   充分」无结果事件；「他赌对了」单独出现无评价归因。
 *
 * 为什么取 VERIFY 级：结果好坏能否证明决策质量，取决于该决策的方差结构
 * （一次性高方差事件里结果主要由运气决定，受控实验里结果才是方法的有效
 * 证据）——规则引擎无法独立判定方差结构，只能识别「结果→决策质量」的
 * 推断形态。verify 的含义是「这个决策评价需要先过 ex-ante 检验再采信」：
 *   调用方应要求补上**决策当时的**信息条件与论证过程（做决定时知道什么、
 * 排除过哪些选项、为什么选它），而不是接受「结果好所以决策好」的默认
 * 推断；结果只能作为事后信息之一，不能单独充当决策质量的证据。
 *
 * [r267 扩展] 池化探针实测 3/5 穿透的新措辞家族（scripts/round-267/
 * r267-probe-pool.js，v6.8.157）：① OUTCOME_ZH 结果评价短语族（结果
 * 不错/结局不好）与人生大事结果族（跳槽/转行/创业成功失败/上岸/被裁/
 * 复合/离婚）；② EVAL_ZH 口语评价族（没问题/没毛病/在理/靠谱/说得
 * 过去）；③ OUTCOME_EN 顺当结果族（went fine/went well/turned out
 * fine/worked out fine）；④ DECISION_EN 判断名词族（judgment/
 * verdict/read/instinct/hunch）。良性对照（要看决策时的信息集/评估
 * 决策质量要看出血量控制/at the time）零误伤。
 *
 * 明确不判的（豁免）：
 *   · 概念/教学转述（结果偏误/结局偏见/outcome bias/以结果论/以成败论/
 *     事后诸葛亮/认知偏差/行为经济学/卡尼曼/教材/课堂；EN outcome bias /
 *     result-oriented evaluation / hindsight / cognitive bias / textbook /
 *     lecture）——讨论这个谬误本身是正确判别；
 *   · 实验/证据语境（随机对照/对照组/实验组/双盲/前瞻性研究/队列研究/
 *     元分析/临床试验/实验表明/数据显示/统计显示/研究表明/实测/证据表明/
 *     EN randomized / controlled trial / RCT / control group / placebo /
 *     double-blind / cohort study / meta-analysis / experiment / data show /
 *     evidence shows / studies show）——受控实验中结果经设计成为方法的
 *     有效证据，ex-ante 论证就是实验设计本身；
 *   · ex-ante 推理/推理否定/反向承认（不能说明/不代表/不等于/并不意味着/
 *     推不出/不足以/未必/不一定/很难说/不见得/不能只凭/不能只看/不能仅凭/
 *     不能以/不要以/并非只看/在当时/事前/当时的信息/做决定时/下决定时/
 *     决策当时/反过来/恰恰相反/反之；EN does not mean / cannot conclude /
 *     not necessarily / not only / at the time / ex ante / given the
 *     information available / the reverse / conversely）——明确要求按决策
 *     当时的信息评价、或拒绝该推断本身，是正确判别；
 *   · 对冲与运气承认（可能/也许/或许/大概/恐怕/倾向于/似乎/有待/运气/
 *     偶然/碰巧/侥幸；EN maybe / perhaps / might / possibly / probably /
 *     seems / luck / chance / fluke / lucky）——概率化结论或明确承认运气
 *     成分的陈述不作谬误判定；
 *   · 疑问句（含 ?/？）：提问不是断言。
 */
'use strict';

// ─── 腿① OUTCOME 高方差结果事件（中文，裸名词形态）────────────────────
// 161 轮教训：全部取可独立出现的裸词形（赌对/翻倍/夺冠/卖爆），不收
// 「赌对了钱」「翻了三倍之多」这类带后缀组合——同族词去掉后缀必须仍命中。
// 收录口径：**运气支配型结果**——单次试验中结果主要由不确定性而非决策
// 质量决定的事件（赌/押/股/比赛/一次性手术/爆品/中奖）。刻意不收泛化的
// 「成功/失败/赢了/输了」：那类词的良性暴露面过大（「项目成功了」），
// 由决策名词×评价词×连接词三腿兜住精度。
const OUTCOME_ZH = [
  /赌对|赌错|赌赢|赌输|押对|押错|蒙对|蒙错|猜对|猜错|赚翻|翻倍|翻了三倍|翻了几倍|翻了好几倍|获利|盈利|赚了|血本无归|亏光|亏了|爆仓|套牢|割肉|跌停|涨停|暴涨|暴跌|翻车|踩雷|暴雷|翻身|夺冠|出局|淘汰|落榜|考上|没考上|卖爆|大卖|滞销|中了|中奖|活下来|去世|救回来|没救回来|手术成功|手术失败|赌赢了|赌输了|赢麻了|躺赢|押中|买中|彩票/,
  // [r267] 结果评价短语族（结果不错/结局不好）与人生大事结果族
  // （跳槽/转行/创业成功失败/上岸/被裁/复合/离婚）——探针 3/5 穿透落地
  /结果不错|结果很好|结果不好|结果还行|结局不错|结局不好|收成不错|收成不好|跳槽成功|跳槽失败|转行成功|转行失败|创业成功|创业失败|考公上岸|成功上岸|离了职|被裁员|裁了员|复合了|离了婚|和好了|闹翻了|散伙了/,
];

// ─── 腿② DECISION 决策类名词（中文，裸名词形态）────────────────────────
const DECISION_ZH = [
  /决策|决断|决定|抉择|选择|判断|策略|方案|战术|思路|想法|做法|打法|套路|布局|操作|下注|押注|买入|卖出|投资|出手|转型|放弃|坚持|路线|赌注|赌局|定夺|拍板|取舍/,
];

// ─── 腿② EVAL 决策评价词（中文：褒贬两类 + 评价名词短语）──────────────
const EVAL_ZH = [
  /明智|英明|睿智|高明|正确|是对的|是错的|没错|果断|清醒|理性|聪明|精明|厉害|漂亮|眼光独到|眼光毒|眼光好|眼光准|有眼光|有远见|远见卓识|独到|愚蠢|弱智|草率|鲁莽|失误|失策|错误|糊涂|短视|冒进|贪心|不该|欠妥|败笔|选对|押对|买对|卖对|下对|投对/,
  // [r267] 口语评价族（没问题/没毛病/在理/靠谱/说得过去）——探针穿透落地
  /没问题|没毛病|在理|靠谱|说得过去|过得去|像回事|没选错|没看错|赌对了|押对了/,
];

// ─── 腿③ LINK 归因连接词（中文）───────────────────────────────────────
const LINK_ZH = [
  /说明|证明|可见|足以证明|表明|意味着|证实|印证|体现出|反映出|所以|因此|因而|故而|毕竟|说到底|事实证明|结果证明|归功于|全靠|多亏|正说明|这就说明|可见一斑/,
];

// ─── 英文侧腿① OUTCOME ────────────────────────────────────────────────
const OUTCOME_EN = [
  /\b(?:paid\s+off|pays\s+off|payoff|won|wins|winning|lost|loses|losing|loss|hit\s+the\s+jackpot|jackpot|struck\s+it\s+rich|striking\s+it\s+rich|made\s+a\s+fortune|making\s+a\s+fortune|went\s+bankrupt|goes\s+bankrupt|lost\s+everything|losing\s+everything|came\s+out\s+ahead|comes\s+out\s+ahead|fell\s+flat|falls\s+flat|crashed|tanked|gamble|bet\s+paid|break[- ]even|broke\s+even|profitable|doubled|tripled|quadrupled|lottery)\b/i,
  // [r267] 顺当结果族（went fine/went well/turned out fine/worked out
  // fine/panned out）——手术/项目/合作类结果的顺当表述
  /\b(?:went|goes|going|turn(?:ed)?\s+out|work(?:ed)?\s+out|pann?ed\s+out|came\s+out)\s+(?:just\s+)?(?:fine|well|ok|okay|great|alright)\b/i,
];

// ─── 英文侧腿② DECISION ───────────────────────────────────────────────
const DECISION_EN = [
  /\b(?:decision|decisions|choice|choices|call|calls|bet|bets|betting|gamble|gambling|strategy|strategies|tactics|tactic|tactical|coaching|plan|plans|move|moves|pick|picks|investment|investments|trade|trades|wager|wagers|gambit)\b/i,
  // [r267] 判断名词族（judgment/judgement/verdict/read）——主刀医生的判断
  /\b(?:judgment|judgement|verdict|read|instinct|hunch)\b/i,
];

// ─── 英文侧腿② EVAL ───────────────────────────────────────────────────
const EVAL_EN = [
  /\b(?:wise|correct|right|wrong|brilliant|smart|shrewd|sound|reckless|foolish|stupid|hasty|poor|well[- ]judged|ill[- ]judged|good\s+call|bad\s+call|good\s+decision|bad\s+decision|savvy|prudent|imprudent|rash|ill[- ]advised|ill[- ]conceived|astute|clueless)\b/i,
];

// ─── 英文侧腿③ LINK ───────────────────────────────────────────────────
const LINK_EN = [
  /\b(?:proves|prove|proving|proved|shows|show|showing|showed|demonstrates|demonstrating|demonstrated|confirms|confirming|confirmed|means|which\s+means|indicating|indicates|therefore|thus|hence|so|after\s+all|thanks\s+to|proof|evidence\s+that|showing\s+that|proving\s+that)\b/i,
];

// ─── 豁免一：概念/教学转述 ────────────────────────────────────────────
const EXEMPT_META_ZH = [
  /结果偏误|结局偏见|结果导向|以结果论|以结果评判|以成败论|凭结果|事后诸葛亮|认知偏误|认知偏差|行为经济学|卡尼曼|丹尼尔|教材|课本|课堂|教案|论文里|文章里|科普|谬误/,
];
const EXEMPT_META_EN = [
  /\b(?:outcome\s+bias|outcome[- ]based\s+evaluation|result[- ]oriented|judging\s+decisions?\s+by\s+(?:their\s+)?outcomes?|hindsight|cognitive\s+bias|behavioral\s+economic\w+|kahneman|tversky|textbook|lecture|methodology|fallacy)\b/i,
];

// ─── 豁免二：实验/证据语境（结果经设计成为有效证据）───────────────────
const EXEMPT_EVID_ZH = [
  /随机对照|对照组|实验组|干预组|双盲|安慰剂|前瞻性研究|回顾性研究|队列研究|元分析|实验证明|实验表明|实验显示|临床试验|有效性试验|数据显示|数据表明|统计显示|研究表明|调查显示|调研显示|实测|证据表明|有证据|样本量/,
];
const EXEMPT_EVID_EN = [
  /\b(?:randomi[sz]ed|controlled\s+trial|RCT|control\s+group|treatment\s+group|placebo|double[- ]blind|prospective|retrospective\s+cohort|cohort\s+study|meta[- ]analysis|experiment\w*|clinical\s+trial|data\s+show|data\s+suggest|evidence\s+shows|studies\s+show|survey\w*|sample\s+size)\b/i,
];

// ─── 豁免三：ex-ante 推理 / 推理否定 / 反向承认 ───────────────────────
const EXEMPT_NEG_ZH = [
  /不能说明|不能只凭|不能只看|不能仅凭|不能以|不要以|并非只看|不代表|不等于|并不意味着|不意味着|推不出|不足以|未必|不一定|很难说|不见得|在当时|事前|当时的信息|做决定时|下决定时|决策当时|反过来|恰恰相反|反之|要看当时|取决于当时/,
];
const EXEMPT_NEG_EN = [
  /\b(?:does\s+not\s+mean|doesn'?t\s+mean|cannot\s+conclude|can'?t\s+conclude|not\s+necessarily|insufficient\s+evidence|no\s+evidence|does\s+not\s+prove|doesn'?t\s+prove|cannot\s+prove|can'?t\s+prove|is\s+because|actually\s+because|not\s+only|at\s+the\s+time|ex\s+ante|given\s+the\s+information|information\s+available|the\s+reverse|conversely|on\s+the\s+contrary|depends\s+on\s+what)\b/i,
];

// ─── 豁免四：对冲与运气承认 ───────────────────────────────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|大概|恐怕|倾向于|似乎|好像|说不定|多半|有待|待验证|待确认|运气|偶然|碰巧|侥幸|造化|命好|福气/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|may\s+be|possibly|probably|seems?|appears?|i\s+suspect|could\s+be|luck|lucky|chance|fluke|fortunate|fortune)\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** source 列表中任一匹配的 win 字窗内（可选双向）出现 target 列表匹配 */
function nearAny(sourceList, targetList, text, win, bothWays) {
  for (const re of sourceList) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + win);
      if (anyHit(targetList, after)) return true;
      if (bothWays) {
        const before = text.slice(Math.max(0, m.index - win), m.index);
        if (anyHit(targetList, before)) return true;
      }
      if (m.index === g.lastIndex) g.lastIndex++; // 防空匹配死循环
    }
  }
  return false;
}

/** 中文腿：LINK 连接词前 60 字内有 OUTCOME 且后有 EVAL（决策名词×评价词
 *  15 字窗共现），或前有 EVAL 且后有 OUTCOME（结论先行倒装形）。 */
function outcomeZh(text, R) {
  const OUTCOME = R.OUTCOME_ZH || OUTCOME_ZH;
  const DECISION = R.DECISION_ZH || DECISION_ZH;
  const EVAL = R.EVAL_ZH || EVAL_ZH;
  const LINK = R.LINK_ZH || LINK_ZH;
  const evalNear = (seg) => nearAny(DECISION, EVAL, seg, 15, true);
  for (const re of LINK) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const before = text.slice(Math.max(0, m.index - 60), m.index);
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + 60);
      // 朝向一（主形）：结果 → 连接词 → 决策评价
      if (anyHit(OUTCOME, before) && evalNear(after)) return true;
      // 朝向二（倒装）：决策评价 → 连接词 → 结果
      if (evalNear(before) && anyHit(OUTCOME, after)) return true;
      if (m.index === g.lastIndex) g.lastIndex++;
    }
  }
  return false;
}

/** 英文腿：同结构，窗 120 字符（OUTCOME/LINK）× 60 字符（DECISION×EVAL） */
function outcomeEn(text, R) {
  const OUTCOME = R.OUTCOME_EN || OUTCOME_EN;
  const DECISION = R.DECISION_EN || DECISION_EN;
  const EVAL = R.EVAL_EN || EVAL_EN;
  const LINK = R.LINK_EN || LINK_EN;
  const evalNear = (seg) => nearAny(DECISION, EVAL, seg, 60, true);
  for (const re of LINK) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const before = text.slice(Math.max(0, m.index - 120), m.index);
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + 120);
      if (anyHit(OUTCOME, before) && evalNear(after)) return true;
      if (evalNear(before) && anyHit(OUTCOME, after)) return true;
      if (m.index === g.lastIndex) g.lastIndex++;
    }
  }
  return false;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkOutcomeBias(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 全局豁免：概念教学 / 实验证据 / ex-ante 推理否定 / 对冲运气 / 疑问句
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_EVID_ZH || EXEMPT_EVID_ZH, text) || anyHit(R.EXEMPT_EVID_EN || EXEMPT_EVID_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH, text) || anyHit(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH, text) || anyHit(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hit = isZh ? outcomeZh(text, R) : outcomeEn(text, R);
  if (!hit) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true, score: 0.6, count: 1,
    detail: isZh
      ? '结果偏误×用结果好坏评判决策质量(zh)'
      : 'outcome bias×result-as-decision-quality(en)',
  };
}

module.exports = {
  checkOutcomeBias,
  __internals: () => ({
    OUTCOME_ZH, DECISION_ZH, EVAL_ZH, LINK_ZH,
    OUTCOME_EN, DECISION_EN, EVAL_EN, LINK_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN, EXEMPT_EVID_ZH, EXEMPT_EVID_EN,
    EXEMPT_NEG_ZH, EXEMPT_NEG_EN, EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
  }),
};
