/**
 * src/simpsons-paradox.js — 「聚合层逆转」检测器
 * （第 206 个判别维度，r209）
 *
 * [r209 立项] philosophy_decision 在当前引擎（v6.8.137，205 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed=true；cognitiveLoad 与
 * uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。立项缺口实
 * 证：r209 族探针（/tmp/hf-probe-r209.js）在当前引擎复测——聚合层
 * 逆转（Simpson's paradox）族攻击样本 10/13 gate.action=pass（真零
 * 命中，含中英双语、裸名词、带修饰、长句变体；其余 3 条被
 * proxy_metric_goal / stereotype+perfect_error 代拦）、良性 7/7
 * pass（零误伤）。外部来源：GitHub ehart-altair/SimpsonsParadox
 *
 * [r267 扩展] 池化探针实测 2/3 穿透的新措辞家族（scripts/round-267/
 * r267-probe-pool.js，v6.8.157）：① 口语聚合族（合并两个校区看/合起来
 * 看/拢在一起看；EN pooling/aggregating/combining/lumping/merging）——
 * 长形在前，「合并…看」整体作 marker 才能把趋势窗拉到「压过」上；② 比较
 * 胜负动词族（压过/胜过/领先/反超/高于/低于；EN wins/leads/ahead/favors/
 * trails/lags/behind/declines）——**必须并入 TREND 列表首正则**：trendDirs
 * 只取列表首个正则，另起数组元素是死代码（r267 实测教训，同 selection-
 * bias 的 SAMPLE_SELF_SCOPES 分型）。良性对照（聚合层与子群层方向相反需
 * 分层解读/辛普森悖论形态/needs subgroup analysis）零误伤。
 *
 * ★18（"Function for automatically detecting Simpson's Paradox"
 * ——pairs of variables whose relationship with the dependent
 * variable reverses when conditioned on a second variable）+
 * ninoch/Trend-Simpsons-Paradox ★57 + HN/Wikipedia Simpson's
 * paradox 条目；Semantic Scholar / arXiv 本轮网络不可达（空返），
 * 未引论文。按心虫既有维度形态自建纯规则判据。
 *
 * 辨别的族：聚合层逆转（Simpson's paradox / 用总体趋势覆盖子群
 * 相反方向）——文本同时给出**聚合层（总体/整体/平均）的趋势结论**
 * 与**子群/分组层方向相反的数据**，并用聚合层结论做判断（覆盖推
 * 断形），或用聚合层「无差别」宣告抹平子群间的方向相悖（抹平
 * 形）：
 *   总体死亡率下降了，所以这个治疗方案更安全，然而每个科室的
 *   死亡率都在上升。
 *   平均薪资在上涨，所以大家的收入都提高了，但按收入段拆分后，
 *   每一段的薪资都在下降。
 *   总体上两种疗法没有区别，所以分组差异不重要，然而在每一个
 *   年龄段里两种药的效果都截然相反。
 *   Overall mortality went down, so the new treatment is safer,
 *   but in every department mortality actually rose.
 *
 * 为什么这是判别者的核心缺口（对齐「能符合宇宙规律」）：聚合量
 * （总体均值/总发生率/合计）是子群量的加权混合，子群构成一变，
 * 聚合量的方向可以与每一个子群的方向相反——这不是数据噪声，是
 * 聚合运算的结构性质（辛普森悖论）。拿聚合层结论给方案背书，等
 * 于用「混合权重」掩盖「每个分组里的真实方向」：每一个分组都可
 * 能正在恶化，而总体在改善。这与 whole_part_transfer（部分↔整体
 * 的**涌现性质量**迁移）互补：本族是**统计趋势方向**在聚合层与
 * 子群层之间的逆转，不涉及强弱/优劣这类不可加质量词；与
 * statistical_misleading（小基数比例）互补：本族不涉及基数大
 * 小，只涉及两个层级的方向关系。
 *
 * 与既有维度的边界（r209 归因）：
 *   · whole_part_transfer（第 170 维度）管涌现性质量（强/优秀/
 *     清廉）在部分↔整体间的搬运，判据腿是 QUALITY 质量词；本族
 *     判据腿是 TREND 趋势词（上升/下降）且**必须方向相反**，质
 *     量词可缺席。
 *   · statistical_misleading（第 58 维度）管小基数百分比（基数小
 *     到比例无意义），本族不涉及基数与百分比、只涉及聚合层与子
 *     群层的方向关系。
 *   · proxy_metric_goal（第 187 维度）管拿代理指标（分数/收视/
 *     KPI）当目标本身；聚合层结论「说明改革有效」形会被它代拦一
 *     部分（探针 3/13），但「更安全/更省钱/更可靠」等非代理落点
 *     的聚合覆盖它不判（探针零命中），本族补这一支。
 *   · base_rate_neglect 管忽视基础概率；selection_bias /
 *     survivorship_bias 管取样受限；本族两个层级的数据都在场，
 *     问题是**用哪一层的方向下结论**。
 *
 * 判据（主判据三腿共现 + 邻近窗，缺一不判；另设「抹平形」两腿
 * 融合分支）：
 *   · 腿① AGG 聚合层趋势：聚合标记（总体/整体/平均/合计/全局/
 *     总体上/整体上/总的来说/平均来看……含裸名词；EN overall /
 *     on average / average / aggregate / across the board / taken
 *     together）× TREND 趋势词（上升/下降/提高/降低/上涨/下跌/
 *     增长/减少/改善/恶化/更高/更低/更多/更少/在升/在降……；EN
 *     rose/fell/increased/decreased/improved/worsened/grew/
 *     declined/went up/went down/higher/lower/more/less），趋势词
 *     落在聚合标记 12 字（EN 45 字符）窗内，取其方向。
 *   · 腿② SUB 子群层趋势：子群标记（每个/各个/每一/各组/分层/
 *     细分/分组/子群/亚组/科室/班级/车间/阶段/年龄段/收入段/
 *     对照组/实验组/轻症/重症/每个县/各县……**r161 教训落地：收
 *     裸名词形态**，科室/班级/分层/亚组/对照组 去前后缀仍命中；
 *     EN each/every/per/subgroup/stratum/cohort/by age/by
 *     region/broken down/split by + 裸名词 subgroup/age group/
 *     department/region/county/stratum/cohort）× TREND 趋势词，
 *     **方向与腿①相反**（一升一降），两腿落在 160 字（EN 400
 *     字符）邻近窗内。
 *   · 腿③ USE 覆盖形（两形任一，缺一无判）：
 *     U-a 覆盖推断形：推断词（所以/因此/因而/可见/说明/意味着/
 *       证明/显然/据此/也就是说；EN so/therefore/thus/which
 *       means/shows/proves/implies）出现在聚合趋势后 60 字
 *       （EN 150 字符）内，且聚合侧肯定结论（更安全/安全/更有效/
 *       有效/没问题/更好/更可靠/改善/提升/省钱/成功/应当/应该/
 *       推荐/推广/采纳/继续/足以；EN safer/effective/works/
 *       worked/better/reliable/improved/successful/should/
 *       recommend/roll out/adopt）出现在推断词后 50 字（EN 120
 *       字符）内、且未被否定（匹配点前 8 字内不能/不应/不可/
 *       未必/不一定/并非/不代表；EN not/never/doesn't）。
 *     U-b 裸结论形：聚合侧肯定结论出现在子群相反趋势**之后** 80
 *       字（EN 200 字符）内、未被否定——「总体在降，每个科室都
 *       在升——这个方案很安全」。
 *   · 抹平形（两腿 + 逆转标记，缺一不判）：FLATTEN 聚合层无差别
 *     宣告（没有/没什么/并无/谈不上/算不上+区别/差别/差异/不同/
 *     差距；EN no difference / no real difference / makes no
 *     difference / doesn't matter / immaterial / nothing to
 *     choose between）× SUB 子群标记 × REVERSAL 方向相悖标记
 *     （截然相反/正好相反/完全相反/相反/反过来/相悖；EN opposite
 *     / reversed / conversely / in contrast）。
 *
 * 为什么取 VERIFY 级：单句也可能是医学/教育/工程报道中对分层数
 * 据的正当转述、小说对白、课堂案例、新闻报道的概括（"总体下降，
 * 但各科室上升"的客观描述本身是正确判别），rewrite 会误伤（与
 * r161-r208 全部评价族同口径）。verify 的含义是「这段文本用聚合
 * 层结论覆盖了子群相反数据，需要回到分层数据再下结论」。
 *
 * 明确不判的（豁免——这些是正当陈述与正确判别）：
 *   · 概念/教学转述（辛普森悖论/悖论/区群谬误/生态谬误/统计学/
 *     教材/课堂；EN Simpson's paradox / ecological fallacy /
 *     textbook / lecture / statistics——讨论这个概念本身不是运
 *     用它）；
 *   · 正确响应形（承认逆转并给出分层动作）：不能只看总体/整体/
 *     平均、要分层/分层看/分层分析、重新评估/重新审视/重新分析/
 *     重新考虑、逐层核对、分类核对、分组核对、进一步验证/尚需/
 *     仍待/有待、存疑/可疑/站不住/说不通/反常/反直觉、说明存在/
 *     提示存在；EN can't just look at the overall / must look at
 *     / need to examine / break it down / stratified /
 *     disaggregated / reassess / re-examine / reconsider /
 *     per-subgroup——**指出聚合层会骗人并要求看分层数据，正是
 *     本族要教的判别动作**；
 *   · 方向相同（总体升、子群也升）——缺「相反」即无逆转，不判；
 *   · 推理否定/对冲（不代表/不意味着/推不出/未必/不一定/取决于/
 *     还要看/而不是/而非；EN does not mean / not necessarily /
 *     depends on / cannot conclude）；
 *   · 疑问句（含 ?/？）。
 */
'use strict';

// ─── 腿① AGG 聚合层标记（中文；r161 教训：裸名词 总体/整体/平均/
// 合计/全局 去前后缀仍命中）────────────────────────────────────
const AGG_ZH = [
  /总体|整体|平均|合计|总共|全院|全校|全市|全国|全局|宏观|汇总|累计/,
  /总体上|整体上|总的来说|总体而言|总体看|整体来看|平均来看|综合来看|合计来看|汇总来看|整体地说/,
  // [r267] 口语聚合族（合并两个校区看/合起来看/拢在一起看/拼在一起）——
  // 探针 2/3 穿透落地：聚合层措辞不限于「总体/整体」。长形在前：
  // 「合并…看」整体作 marker 才能把后窗拉到趋势词（压过）上。
  /合并[^。，！？!?]{0,8}?看|合并|合起来|合到一块|拢在一起|掺在一起|掺和在一起|拼在一起|堆在一起|放到一起|汇总成|两笔账合/,
];

// ─── TREND 趋势词（中文，带方向）────────────────────────────────
const TREND_UP_ZH = [
  // [r267] 比较胜负动词族（压过/胜过/领先/反超/高于）并入首正则——
  // trendDirs 只取列表首个正则，另起数组元素是死代码（r267 实测教训）
  /上升|升高|上涨|提高|提升|增长|增加|涨了|涨价|涨薪|改善|好转|越高|更高|更多|变好|更好|翻倍|翻番|进步|在升|渐升|走高|压过|胜过|赢过|领先|反超|占优|力压|赶超|高于/,
];
const TREND_DOWN_ZH = [
  // [r267] 比较胜负动词族（低于）并入首正则（trendDirs 只取首个）
  /下降|降低|下跌|下滑|回落|减少|缩减|恶化|变差|越差|更低|更少|变少|萎缩|在降|渐降|走低|低于|落后/,
];

// ─── 腿② SUB 子群层标记（中文；r161 教训：裸名词 科室/班级/分层/
// 亚组/对照组 去「每个/各」前后缀仍命中）──────────────────────
const SUB_ZH = [
  /每个|各个|每一|各组|各家|各科|各类|各段|各层|各组别|逐[个条类项段层]/,
  /分层|细分|分组|子群|亚组|拆解|拆开|分类|分组后|拆解后|分类看|分组看|单独看|分开看/,
  /科室|班级|车间|组别|阶段|年龄段|收入段|分数段|对照组|实验组|轻症|重症|年龄段|年龄组|性别组|地区组/,
  /每个县|各县|每县|各县市|各市|每个市|各省|每个省|各州|各校|各院|各部门|各团队|各组|各段|各阶层|各收入/,
];

// ─── 腿③ INFER 推断词（中文）────────────────────────────────────
const INFER_ZH = [
  /所以|因此|因而|可见|说明|意味着|证明|显然|据此|也就是说|故而|足以证明|足以说明/,
];

// ─── 腿③ AFFIRM 聚合侧肯定结论（中文；r161 教训：裸词 有效/安全/
// 成功 去修饰仍命中）──────────────────────────────────────────
const AFFIRM_ZH = [
  /更安全|很安全|安全|更有效|很有效|有效|没问题|更好|很好|更可靠|可靠|更稳定|稳定|改善|提升|提高|更高|更省|省钱|更省钱|更便宜|便宜|成功|更成功|有效益|有成效|出成效|见效/,
  /应当|应该|推荐|推广|采纳|继续|采用|足以|可以放心|不成问题|无需再|不必再|值得推广|全面推广|照常|按原计划|维持原判|维持原方案|放心使用|放心采用/,
];

// ─── 抹平形 FLATTEN（中文）──────────────────────────────────────
const FLATTEN_ZH = [
  /(?:没有|没什么|并无|谈不上|算不上|不见得|未有)[^。；，!?]{0,4}(?:区别|差别|差异|不同|差距|分化)/,
  /(?:差异|区别|差别|不同|差距)[^。；，!?]{0,6}(?:不重要|无所谓|可以忽略|忽略不计|无关紧要|不影响|不妨|不必在意|无需在意|无视|抹平|不重要)/,
];
const REVERSAL_ZH = [
  /截然相反|正好相反|完全相反|截然不同|相反|反过来|逆反|反转|逆转|相悖|相互矛盾/,
];

// ─── 英文常量 ───────────────────────────────────────────────────
const AGG_EN = [
  /\b(?:overall|in\s+total|on\s+average|average|aggregate|across\s+the\s+board|taken\s+together|combined|pooled|pooling|all\s+told|as\s+a\s+whole)\b/i,
  // [r267] 口语聚合动词族（pooling/aggregating/combining/lumping/merging）
  // ——探针 2/3 穿透落地：聚合层措辞不限于 taken together/combined
  /\b(?:pooling|aggregating|combining|lumping|merging|collapsing)\b/i,
];
const TREND_UP_EN = [
  // [r267] 偏好胜负动词族（wins/leads/ahead/favors/outpaces/beats）并入
  // 首正则——trendDirs 只取列表首个正则
  /\b(?:rose|risen|rise|rises|rising|increased|improved|climbed|grew|gone\s+up|went\s+up|got\s+up|higher|more|better|best|improvement|up|wins?|leads?|led|ahead|favors?|outpaces?|edges?\s+ahead|beats?)\b/i,
];
const TREND_DOWN_EN = [
  // [r267] 偏好落后动词族（loses/trails/lags/behind/declines）并入首正
  // 则——trendDirs 只取列表首个正则
  /\b(?:fell|fall|falls|falling|dropped|declined|declines|decreased|worsened|got\s+worse|went\s+down|gone\s+down|lower|less|worse|down|reduction|shrank|loses?|lost|trails?|lags?|behind|falls?\s+behind|falls?\s+short)\b/i,
];
const SUB_EN = [
  /\b(?:each|every|per)\b/i,
  /\b(?:subgroup|sub-group|stratum|strata|cohort|separately|disaggregated|stratified)\b/i,
  /\b(?:by\s+age|by\s+region|by\s+department|by\s+gender|by\s+income|broken\s+down|broken\s+up|split\s+by|within\s+each)\b/i,
  /\b(?:age\s+group|department|region|county|district|grade|class|income\s+bracket|severity|phase|stage|step|ward|batch)\b/i,
];
const INFER_EN = [
  /\b(?:so|therefore|thus|which\s+means|that\s+means|it\s+shows|shows|proves|suggests|implies|hence|consequently)\b/i,
];
const AFFIRM_EN = [
  /\b(?:safer|safe|effective|works|worked|better|best|reliable|improved|improvement|success|successful|cheaper|saves?\s+money|proven)\b/i,
  /\b(?:should|ought\s+to|recommend\w*|roll(?:ed)?\s+out|adopt\w*|continue\w*|justified|valid|no\s+problem)\b/i,
];
const FLATTEN_EN = [
  /\b(?:no\s+(?:real\s+|meaningful\s+|significant\s+)?difference|not\s+different|makes?\s+no\s+difference|doesn'?t\s+matter|immaterial|irrelevant|insignificant|nothing\s+to\s+choose\s+between)\b/i,
];
const REVERSAL_EN = [
  /\b(?:opposite|reversed|reverse|conversely|in\s+contrast|mirror\w*|flip\w*)\b/i,
];

// ─── 豁免一：概念/教学转述 ──────────────────────────────────────
const EXEMPT_META_ZH = [
  /辛普森|悖论|区群谬误|生态谬误|聚合谬误|统计学|教材|课堂|教科书|讲座|教案|习题|论文|研究指出/,
];
const EXEMPT_META_EN = [
  /\bsimpson'?s\s+paradox\b/i,
  /\b(?:ecological|aggregation)\s+fallacy\b/i,
  /\b(?:textbook|lecture|statistics|stats\s+class)\b/i,
];

// ─── 豁免二：正确响应形（承认逆转 + 分层动作）──────────────────
// 注意：只收「结论层」的正确响应（模态词+分层动作/重新评估/不能只看
// 总体），不收裸「分层来看」——「可分层来看每个科室都在上升，但总体
// 下降说明有效」是用分层数据开场、仍以聚合层结论背书 的攻击形，
// r209 实测教训（裸分层词豁免把该攻击样本整句放过）。
const EXEMPT_CORRECT_ZH = [
  /不能只看总体|不能只看整体|不能只看平均|不能只看合计|不能只看总数|光看总体|仅看总体/,
  /(?:需要|应当|应该|必须|要|需)[^。；，!?]{0,6}(?:分层|分组|分类)(?:看|分析|复核|核对|验证|统计)/,
  /重新评估|重新审视|重新分析|重新考虑|另行评估|逐层|分层统计/,
  /进一步验证|进一步核实|尚需|仍待|有待验证|还需验证|仍需要|尚需验证|仍待验证/,
  /存疑|可疑|站不住|说不通|反常|反直觉|说明存在|提示存在|警示|暴露了|反映了问题/,
];
const EXEMPT_CORRECT_EN = [
  /can'?t\s+just\s+look\s+at\s+the\s+(?:overall|average|aggregate)/i,
  /(?:overall|average|aggregate)\s+(?:figure|number|data)?\s*(?:alone|by\s+itself)/i,
  /\b(?:must|need\s+to|have\s+to|should)\s+(?:look\s+at|examine|check)\b[^.]{0,40}\b(?:subgroup|sub-group|break\s*down|breakdown|stratif\w+|disaggregat\w+)/i,
  /\b(?:break\s+it\s+down|break\s+down\s+by|look\s+at\s+the\s+breakdown|disaggregat\w+|stratified|per-subgroup|subgroup\s+level)\b/i,
  /\b(?:reassess\w*|re-examin\w+|reconsider\w+|re-evaluat\w+)\b/i,
];

// ─── 否定守卫 ───────────────────────────────────────────────────
const NEG_ZH = /(?:不能|不应|不可|未必|不一定|并非|不代表|很难|别|不要|用不着|无须|无需)$/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t)$/i;

// 邻近窗
const WIN_AGG_TREND_ZH = 12;   // 聚合标记 ↔ 趋势词
const WIN_AGG_TREND_EN = 45;
const WIN_SUB_TREND_ZH = 14;   // 子群标记 ↔ 趋势词
const WIN_SUB_TREND_EN = 45;
const WIN_LAYERS_ZH = 160;     // 聚合腿 ↔ 子群腿
const WIN_LAYERS_EN = 400;
const WIN_INFER_ZH = 60;       // 聚合趋势 ↔ 推断词
const WIN_INFER_EN = 150;
const WIN_AFFIRM_ZH = 50;      // 推断词 ↔ 肯定结论
const WIN_AFFIRM_EN = 120;
const WIN_AFFIRM_AFTER_SUB_ZH = 80; // 子群趋势之后的裸结论形
const WIN_AFFIRM_AFTER_SUB_EN = 200;
const WIN_FLAT_ZH = 120;       // 抹平形内窗
const WIN_FLAT_EN = 300;

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

// 注入语义：腿常量列表（AGG_ZH/SUB_ZH…）可注入空数组；TREND/INFER 等
// 单正则常量注入一个替换正则（负例脚本用 /(?!x)x/ 永假式抹掉该腿）。
function pickRe(injected, def) {
  return (injected && typeof injected.exec === 'function') ? injected : def;
}
function trendDirs(isZh, R) {
  return isZh
    ? [{ re: pickRe(R.TREND_UP_ZH, TREND_UP_ZH[0]), d: 1 },
       { re: pickRe(R.TREND_DOWN_ZH, TREND_DOWN_ZH[0]), d: -1 }]
    : [{ re: pickRe(R.TREND_UP_EN, TREND_UP_EN[0]), d: 1 },
       { re: pickRe(R.TREND_DOWN_EN, TREND_DOWN_EN[0]), d: -1 }];
}

// 在 marker 匹配点之后找趋势词（子群腿专用：子群趋势词只许出现在子群
// 标记之后，防止回窗把聚合层的趋势词误当成子群趋势——EN "every
// subgroup declined" 曾因回窗吃到前面的 went up 而漏判），返回
// {dir, idx}；dir: +1 升 / -1 降
function findTrendAfter(text, markerIdx, markerLen, dirs, isZh) {
  const fwd = isZh ? 14 : 45;
  const from = markerIdx;
  const to = Math.min(text.length, markerIdx + markerLen + fwd);
  const seg = text.slice(from, to);
  for (const dir of dirs) {
    const m = dir.re.exec(seg);
    if (m) return { dir: dir.d, idx: from + m.index };
  }
  return null;
}

// 在 marker 匹配点附近找趋势词，返回 {dir, idx}；dir: +1 升 / -1 降
function findTrendNear(text, markerIdx, markerLen, dirs, isZh) {
  const back = isZh ? 12 : 40;
  const fwd = isZh ? (markerLen >= 0 ? 14 : 14) : 45;
  const from = Math.max(0, markerIdx - back);
  const to = Math.min(text.length, markerIdx + markerLen + fwd);
  const seg = text.slice(from, to);
  for (const dir of dirs) {
    const m = dir.re.exec(seg);
    if (m) return { dir: dir.d, idx: from + m.index };
  }
  return null;
}

// 逐 marker 找聚合腿（AGG 标记 + 邻近趋势词）
function findAggLeg(text, isZh, R) {
  const markers = isZh ? (R.AGG_ZH || AGG_ZH) : (R.AGG_EN || AGG_EN);
  const dirs = trendDirs(isZh, R);
  for (const re of markers) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      const t = findTrendNear(text, m.index, m[0].length, dirs, isZh);
      if (t) return { dir: t.dir, idx: m.index, trendIdx: t.idx };
    }
  }
  return null;
}

// 逐 marker 找子群腿（SUB 标记 + 邻近趋势词 + 方向与聚合腿相反）
function findSubLeg(text, isZh, R, aggDir, aggIdx) {
  const markers = isZh ? (R.SUB_ZH || SUB_ZH) : (R.SUB_EN || SUB_EN);
  const dirs = trendDirs(isZh, R);
  const win = isZh ? WIN_LAYERS_ZH : WIN_LAYERS_EN;
  for (const re of markers) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      if (Math.abs(m.index - aggIdx) > win) continue;
      const t = findTrendAfter(text, m.index, m[0].length, dirs, isZh);
      if (t && t.dir !== aggDir) return { dir: t.dir, idx: m.index, trendIdx: t.idx };
    }
  }
  return null;
}

function negatedBefore(text, idx, isZh) {
  if (idx < 0) return false;
  const n = isZh ? 8 : 14;
  const pre = text.slice(Math.max(0, idx - n), idx);
  return isZh ? NEG_ZH.test(pre) : NEG_EN.test(pre);
}

// 腿③ USE：U-a 覆盖推断形 / U-b 裸结论形
function findUseLeg(text, isZh, R, agg, sub) {
  const winInfer = isZh ? WIN_INFER_ZH : WIN_INFER_EN;
  const winAffirm = isZh ? WIN_AFFIRM_ZH : WIN_AFFIRM_EN;
  const winAfterSub = isZh ? WIN_AFFIRM_AFTER_SUB_ZH : WIN_AFFIRM_AFTER_SUB_EN;

  // U-a：推断词在聚合趋势后，肯定结论在推断词后、未被否定
  const infers = isZh ? (R.INFER_ZH || INFER_ZH) : (R.INFER_EN || INFER_EN);
  const affirms = isZh ? (R.AFFIRM_ZH || AFFIRM_ZH) : (R.AFFIRM_EN || AFFIRM_EN);
  for (const re of infers) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      if (m.index < agg.trendIdx || m.index - agg.trendIdx > winInfer) continue;
      for (const ar of affirms) {
        const arG = new RegExp(ar.source, ar.flags.includes('g') ? ar.flags : ar.flags + 'g');
        let am;
        while ((am = arG.exec(text)) !== null) {
          if (am.index < m.index || am.index - m.index > winAffirm) continue;
          if (!negatedBefore(text, am.index, isZh)) return { form: 'U-a', idx: am.index };
        }
      }
    }
  }

  // U-b：肯定结论在子群相反趋势之后、未被否定（无推断词的裸结论形）
  for (const ar of affirms) {
    const arG = new RegExp(ar.source, ar.flags.includes('g') ? ar.flags : ar.flags + 'g');
    let am;
    while ((am = arG.exec(text)) !== null) {
      if (am.index < sub.trendIdx || am.index - sub.trendIdx > winAfterSub) continue;
      if (!negatedBefore(text, am.index, isZh)) return { form: 'U-b', idx: am.index };
    }
  }
  return null;
}

// 抹平形：FLATTEN × SUB × REVERSAL
function findFlattenLeg(text, isZh, R) {
  const flats = isZh ? (R.FLATTEN_ZH || FLATTEN_ZH) : (R.FLATTEN_EN || FLATTEN_EN);
  const subs = isZh ? (R.SUB_ZH || SUB_ZH) : (R.SUB_EN || SUB_EN);
  const revs = isZh ? (R.REVERSAL_ZH || REVERSAL_ZH) : (R.REVERSAL_EN || REVERSAL_EN);
  const win = isZh ? WIN_FLAT_ZH : WIN_FLAT_EN;
  const fIdx = firstAny(flats, text);
  if (fIdx < 0) return null;
  const sIdx = firstAny(subs, text);
  if (sIdx < 0 || Math.abs(sIdx - fIdx) > win) return null;
  const rIdx = firstAny(revs, text);
  if (rIdx < 0) return null;
  if (Math.min(Math.abs(rIdx - fIdx), Math.abs(rIdx - sIdx)) > win) return null;
  return { form: 'FLAT', idx: fIdx };
}

function firstAny(list, text) {
  for (const re of list) {
    const m = re.exec(text);
    if (m) return m.index;
  }
  return -1;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkSimpsonsParadox(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };
  // 概念/教学转述：讨论这个概念本身不是运用它
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 正确响应形：承认逆转并要求看分层数据，正是本族要教的判别动作
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) || anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 主判据：聚合腿 × 子群腿（方向相反）× USE 腿
  const agg = findAggLeg(text, isZh, R);
  if (agg) {
    const sub = findSubLeg(text, isZh, R, agg.dir, agg.idx);
    if (sub) {
      const use = findUseLeg(text, isZh, R, agg, sub);
      if (use) {
        return {
          hit: true,
          score: 0.6,
          count: 1,
          detail: isZh
            ? '聚合层结论覆盖子群相反数据(zh)'
            : 'aggregate conclusion overrides subgroup reversal(en)',
        };
      }
    }
  }

  // 抹平形：聚合层无差别宣告 × 子群方向相悖
  const flat = findFlattenLeg(text, isZh, R);
  if (flat) {
    return {
      hit: true,
      score: 0.6,
      count: 1,
      detail: isZh
        ? '聚合层无差别宣告抹平子群相悖(zh)'
        : 'aggregate no-difference claim flattens subgroup divergence(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkSimpsonsParadox,
  __internals: () => ({
    AGG_ZH, TREND_UP_ZH, TREND_DOWN_ZH, SUB_ZH, INFER_ZH, AFFIRM_ZH,
    FLATTEN_ZH, REVERSAL_ZH, EXEMPT_META_ZH, EXEMPT_CORRECT_ZH,
    AGG_EN, TREND_UP_EN, TREND_DOWN_EN, SUB_EN, INFER_EN, AFFIRM_EN,
    FLATTEN_EN, REVERSAL_EN, EXEMPT_META_EN, EXEMPT_CORRECT_EN,
  }),
};
