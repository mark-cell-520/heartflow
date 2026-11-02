/**
 * src/proxy-metric-goal.js — 「代理指标当目标（古德哈特定律谬误）」检测器
 * （第 187 个判别维度，r190 立项）
 *
 * [r190 立项] decision 本体在当前引擎（v6.8.117，186 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。加速依据是缺口实证 + 轮换纪律：
 *   · 缺口实证（/tmp/hf-probe-r190.js，直调 gate.js v6.8.117）：本族 6 条
 *     攻击样本 **5 条真零命中**（KPI 完成/指标刷上去/EN metric hit target
 *     三条 pass 且 findings 全空；另两条仅被非本族设计的存量维度代拦），
 *     5 条边缘良性零误伤——整族无任何维度覆盖。
 *   · 外部来源（真实，未编造）：HN Algolia "Goodhart's Law: When a measure
 *     becomes a target, it ceases to be a good measure"（229 分，
 *     https://news.ycombinator.com/item?id=17320640）、"Overfitting and the
 *     strong version of Goodhart's law"（187 分，
 *     https://news.ycombinator.com/item?id=33556906）、"Goodhart's Law"
 *     （178 分，https://news.ycombinator.com/item?id=28565379）、
 *     "Goodhart's Law and how systems are shaped by the metrics you chase"
 *     （160 分，https://news.ycombinator.com/item?id=23762526）作概念背景；
 *     Semantic Scholar 两次检索 HTTP 429 空返；GitHub `logical fallacies
 *     detection`（sort=stars）最高星 tmakesense/logical-fallacy（21★，
 *     https://github.com/tmakesense/logical-fallacy）为谬误检测成熟代码
 *     参考（LLM 路线，无可移植纯规则判据）。判据为心虫自有纯规则实现
 *     （零 LLM 依赖）。侦察落盘 /tmp/hf-scout-r190.txt。
 *   · r186 立项时**明确把本族划出射程留待后续轮次**（activity-outcome-
 *     confusion.js 文档：「下载量破百万所以满足需求」「分数上去所以教学
 *     变好」归 Goodhart/代理族射程，本维度不碰）——本轮即该收口。
 *
 * 辨别的族：代理指标当目标（proxy metric as goal / Goodhart's law 谬误
 * 应用）——把**测得的量（代理指标/度量）**直接当作**目标本身达成或真实
 * 效果出现**的证据，用指标的读数替代对目标本身的检验：
 *   KPI 完成了，说明目标肯定达成了。
 *   下载量破百万，说明产品满足了用户需求。
 *   平均分上去了，教学就变好了。
 *   测试覆盖率到了 100%，说明代码质量没有问题。
 *   满意度打分都是五分，说明客户真的满意。
 *   The metric hit its target, so the goal must have been achieved.
 *   Coverage is at 100%, which proves code quality is fine.
 *
 * 与既有维度的边界（r190 归因，刻意错开）：
 *   · activity_outcome_confusion（第 184 维）管**活动/投入计数→抽象成果**
 *     （开会/加班/代码行/走访——做的事、花的工 × 推进得好/进展巨大/成绩
 *     显著），其腿②只收抽象成功/进展/绩效词；本族腿①只收**被测得的量**
 *     （点击率/下载量/KPI/覆盖率/满意度打分/GDP/分数/引用量——度量读数），
 *     腿②只收**目标/真实效果结论**（目标达成/需求满足/质量没问题/客户
 *     满意/问题解决/能力提升），两族词表互斥——同一句可两族共现但判定
 *     结构不同（「代码行数翻倍所以产出翻倍」归本族，「代码写了几万行
 *     可见进展巨大」归 r186 族）。
 *   · reward_hacking（BLOCK）及其 metric_substitution /
 *     metric_denominator_gaming / best_run_picking 族管**自认式指标作弊**
 *     （句中必有「换成/改为/优化…而不是/刷分/让指标好看」的作弊自认标记）；
 *     本族是**无欺骗的推理谬误**：陈述者真诚相信「指标读数 = 目标达成」。
 *   · statistical_misleading / percentage_overflow 管**比例数字的呈现
 *     问题**（基数隐藏/占比合计溢出），本族不管数字大小、管「度量替代
 *     目标」的证据结构，句中可无任何百分比。
 *   · unsupported_claim / bullshit 管断言缺依据的强度，本族有依据在场
 *     （指标读数）但依据类型无效——错在拿代理当本体。
 *
 * 判据（指标腿 × 目标结论腿 × 连接，三腿共现，缺一不判）：
 *   · 腿① METRIC 代理指标/被测得的量（中英，全部收裸名词形态——161 轮
 *     教训自查：同族词去掉前后缀仍独立命中；限定搭配收录，不收裸「分」
 *     （分钟/分别误伤）、不收裸「收入」外的「收益」歧义形由具体搭配承担）：
 *     流量参与类（点击率/播放量/下载量/阅读量/转发量/点赞/收藏/粉丝/
 *     浏览量/访问量/曝光量/热搜/排名）；商业类（票房/收视率/营收/销售额/
 *     成交量/订单量/GDP）；考核类（KPI/指标/绩效分/完成率/达标率/通过率/
 *     覆盖率/准确率）；教育科研类（分数/成绩/得分/平均分/论文数/专利数/
 *     引用量/影响因子）；用户类（日活/月活/注册数/留存率/复购率/转化率/
 *     投诉率/NPS）；EN clicks / views / downloads / followers / likes /
 *     revenue / profit / GDP / score / rating / ranking / KPI / metric /
 *     coverage / conversion / retention / DAU / MAU / citations / impact
 *     factor / box office。
 *   · 腿② GOAL 目标/真实效果结论（中英）：目标|目的|初衷|使命（肯定|一定|
 *     显然|已经|就）?（达成|实现|完成|达到）；需求|需要（得到）?（满足|
 *     解决）；质量（好|没有问题|没问题|过硬|可靠|提升|提高|上去）；（客户|
 *     用户|群众|患者|学生|家长|消费者）（真的|确实|真正）?满意；效果（真的|
 *     真正|确实）?（好|显著|管用|见效|起作用|达到预期）；问题（彻底）?（解决|
 *     根治|没有了）；实力|能力|水平|本领（明显）?（提升|提高|强|高）；（真的|
 *     真正|确实）（有效|管用|成功|见效）；产出|产能|效率（翻倍|提升|提高）|
 *     （质量|效果|教学|服务|体验）（变好|变强|改善）；EN (goal|objective|
 *     target|mission|purpose)(s)? (have|has|been|was|were|is|are)?
 *     (achieved|met|reached|accomplished|attained|fulfilled)、(needs?
 *     |requirements?)(are|is)?(met|satisfied|addressed)、quality (is|has
 *     been)?(good|solid|fine|improved|better|not a problem)、(customers?|
 *     users?|clients?|patients?|students?) are (truly|really|genuinely|
 *     actually)?(happy|satisfied|pleased)、(really|truly|genuinely) (works|
 *     effective|successful)、problem (is )?(solved|fixed|resolved)、(output|
 *     productivity|efficiency) (doubled|increased|improved)、(skills?|
 *     capabilities|performance) (improved|better|stronger)。
 *   · 腿③ CONN 连接（所以/因此/因而/足见/据此/可见/说明/这意味着/证明/
 *     表明/显然/无疑/肯定/一定/自然就/因为/既然；EN so/therefore/thus/
 *     hence/which means/which shows/which proves/demonstrating/proving/
 *     means/because/since），**或**两腿以逗号并置且窗口内无转折词（中文
 *     逗号常承载隐性因果：「分数上去了，教学就变好了」）。句号分隔或含
 *     转折词不判——那是并列或反向陈述。指标腿与目标腿总跨度 ≤80 字
 *     （EN 160 字符）。
 *
 * 为什么取 VERIFY 级：单句也可能是转述他人的指标汇报、附带目标本身证据
 * 的正常总结（同时给出用户访谈/留存数据就不是谬误）、或对「唯指标论」的
 * 概念讨论。verify 的含义是「用指标读数给目标达成背书，需要补上目标本身
 * 的证据」——调用方应要求给出直接测量目标的可验证数据，而不是接受代理
 * 指标的读数。
 *
 * 明确不判的（豁免，全部可负例注入置空）：
 *   · 主动分离指标与目标（不等于/不代表/不意味着/不能说明/说明不了/证明
 *     不了/推不出/算不上/称不上/并非/而不是/而非/不能反映/无法反映/只
 *     是/仅仅是/不过是/仅供参考/只能说明/另一回事/另行评估/单独看/分开
 *     看；EN is only a proxy / just a proxy / does not mean / does not
 *     prove / does not guarantee / not the same as / what matters is /
 *     rather than / separately / another matter）——把指标与目标分开陈述
 *     是正确判别；
 *   · 目标本身证据在场（访谈/问卷原文/实测/实测数据/复购/留存/投诉记录/
 *     个案/随访/体检/临床/审计；EN interviews / survey responses / measured
 *     directly / clinical / audited）——结论已被目标本身的直接证据背书；
 *   · 对冲（可能/也许/或许/未必/不一定/不见得/大概/恐怕/说不定/有待/仍
 *     需/还需；EN maybe/perhaps/might/probably/possibly/not necessarily/
 *     remains to be seen）——概率化结论不作谬误判定（同 r186/r189 口径）；
 *   · 概念/教学转述（古德哈特/Goodhart/代理指标/指标扭曲/虚荣指标/vanity
 *     metric/绩效主义/唯指标/唯GDP/唯分数/分数至上/老师/课堂/教材/textbook
 *     /lecture）——讨论这个谬误本身是正确判别；
 *   · 疑问句（含 ?/？）：提问不是断言。
 */
'use strict';

// ─── 腿① METRIC 代理指标/被测得的量（中文）────────────────────────────
// 161 轮教训：全部收裸名词形态（收「指标」而非只收「这项指标」，收「分数」
// 而非只收「考试分数」）——同族词去掉前后缀仍独立命中。
const METRIC_ZH = [
  // 流量/参与类
  /点击率|播放量|下载量|阅读量|转发量|分享量|评论数|点赞|收藏|粉丝|关注数|浏览量|访问量|曝光量|热搜|排名|榜单|票数|投票数/,
  // 商业/经济类
  /票房|收视率|营收|销售额|成交量|订单量|交易额|市值|估值/,
  // 考核/管理类
  /指标|绩效分|绩效|完成率|达标率|完成量|通过率|覆盖率|准确率|工时利用率|人效|坪效/,
  // 教育类
  /分数|成绩|得分|评分|星级|平均分|及格率|优秀率|升学率|满分/,
  // 科研类
  /论文数|专利数|引用量|引用数|影响因子|课题数|项目数|经费/,
  // 用户/运营类
  /日活|月活|DAU|MAU|注册数|激活数|新增用户|留存率|复购率|转化率|投诉率|NPS|净推荐|打开率|完播率|跳出率|满意度|好评率|差评率/,
  // 代码/工程类（度量读数形）
  /代码行数|代码量|行数|提交数|工单数|bug数|缺陷数/,
];

// ─── 腿① METRIC（英文）────────────────────────────────────────────────
const METRIC_EN = [
  /\b(?:clicks?|views?|downloads?|followers?|likes?|shares?|comments?)\b/i,
  /\b(?:revenue|profit|sales|GDP|box\s+office|ratings?)\b/i,
  /\b(?:scores?|grades?|ranking|rankings?|stars?)\b/i,
  /\b(?:KPI|KPIs|metrics?|targets?)\b/i,
  /\b(?:coverage|conversion|retention|churn|bounce\s+rate)\b/i,
  /\b(?:DAU|MAU|citations?|impact\s+factor|page\s+views?|traffic)\b/i,
  /\b(?:throughput|velocity|utilization)\b/i,
];

// ─── 腿② GOAL 目标/真实效果结论（中文）───────────────────────────────
// 只收**目标达成与真实效果**语言，不收中间度量描述（流量变大/注册变多
// 是度量到度度的正常陈述，归良性）。名词与结论词之间留 [^。！？]{0,4}
// 强度窗——中文常在「目标」与「达成」之间插入「已经/肯定/显然/一定」。
const GOAL_ZH = [
  /(?:目标|目的|初衷|使命|愿景)[^。！？]{0,6}(?:达成|实现|完成|达到|落地|兑现)/,
  /(?:需求|需要|诉求|痛点|预期)[^。！？]{0,4}(?:得到)?(?:满足|解决|覆盖|响应)/,
  // 倒装形：结论动词在前、目标名词在后（「产品已经满足了用户需求」）
  /(?:满足|解决|覆盖|响应|迎合)了?[^。！？]{0,8}(?:需求|需要|诉求|痛点|预期)/,
  /(?:质量|品质|质感)[^。！？]{0,4}(?:好|没有问题|没问题|过硬|可靠|提升|提高|上去|改善)/,
  /(?:客户|用户|群众|患者|学生|家长|消费者|买家)[^。！？]{0,6}(?:真的|确实|真正)?(?:满意|认可|信任|买单)/,
  /(?:效果|疗效|成效)[^。！？]{0,6}(?:真的|真正|确实)?(?:好|显著|管用|见效|起作用|达到预期|立竿见影)/,
  /(?:问题|痛点|故障|矛盾|隐患)[^。！？]{0,6}(?:彻底)?(?:解决|根治|化解|没有了|没了)/,
  /(?:实力|能力|水平|本领|功底)[^。！？]{0,6}(?:明显)?(?:提升|提高|变强|上去)/,
  /(?:真的|真正|确实)[^。！？]{0,4}(?:有效|管用|成功|见效|起作用)/,
  /(?:产出|产能|效率|人效)[^。！？]{0,6}(?:翻倍|提升|提高|上去了)/,
  /(?:质量|效果|教学|服务|体验|病情|症状)[^。！？]{0,4}(?:变好|变强|改善|好转)/,
  /(?:初心|使命)[^。！？]{0,4}(?:实现|达成|践行)/,
];

// ─── 腿② GOAL（英文）─────────────────────────────────────────────────
const GOAL_EN = [
  /\b(?:goals?|objectives?|targets?|mission|purpose)s?\b[^.!?]{0,24}\b(?:achieved|met|reached|accomplished|attained|fulfilled)\b/i,
  /\b(?:needs?|requirements?)\b[^.!?]{0,16}\b(?:met|satisfied|addressed|fulfilled)\b/i,
  /\bquality\s+(?:is|has\s+been|looks?|seems?)\s+(?:good|solid|fine|excellent|improved|better|not\s+a\s+problem)/i,
  /\b(?:customers?|users?|clients?|patients?|students?)\s+are\s+[^.!?]{0,12}(?:happy|satisfied|pleased|delighted)/i,
  /\b(?:really|truly|genuinely|actually)\s+(?:works?|working|effective|successful)/i,
  /\b(?:the\s+)?(?:problem|issue|bug)s?\s+(?:is\s+|are\s+)?(?:solved|fixed|resolved|gone)/i,
  /\b(?:output|productivity|efficiency|throughput)\s+(?:has\s+|have\s+)?(?:doubled|tripled|increased|improved)/i,
  /\b(?:skills?|capabilit(?:y|ies)|performance)\b[^.!?]{0,16}(?:improved|better|stronger|higher)/i,
];

// ─── 腿③ CONN 连接词 ──────────────────────────────────────────────────
const CONN_ZH = [
  /所以|因此|因而|故而|足见|据此|可见|于是|那么|这说明|这意味着|足以证明|足以说明|毫无疑问|毋庸置疑|显然|说明|证明|表明|印证|自然就|因为|既然|说明/,
];
const CONN_EN = [
  /\b(?:so|thus|therefore|hence|which\s+(?:means|shows|proves|demonstrates)|meaning|consequently|proving|demonstrating|showing|because|since|means?)\b/i,
];

// ─── 豁免一：主动分离指标与目标（正确判别，不是谬误）──────────────────
const EXEMPT_SEP_ZH = [
  /不等于|不代表|不意味着|不说明|说明不了|证明不了|推不出|算不上|称不上|并非|而不是|而非|并不能说明/,
  /不能反映|难以反映|无法反映|不能衡量|难以衡量|无法衡量|不足以证明|不足以说明/,
  /只是(?:一个)?(?:参考|指标|过程|手段|代理|侧面|表象|结果)|仅仅是参考|不过是参考|仅供参考/,
  /只能说明|另一回事|另行(?:评估|验证|测量)|单独(?:看|评估|衡量)|分开(?:看|评估|衡量)/,
  /不能只看|不能只靠|不能仅凭|不能只凭|不应只看|勿以|关键要看|才是(?:目标|目的|关键|根本|实质)/,
];
const EXEMPT_SEP_EN = [
  /\bis\s+(?:only|just)\s+a\s+(?:proxy|metric|measure|means)/i,
  /\bdoes\s+not\s+(?:mean|prove|guarantee|reflect)/i,
  /\bdoesn'?t\s+(?:mean|prove|guarantee|reflect)/i,
  /\bnot\s+the\s+same\s+(?:as|thing)\b/i,
  /\bwhat\s+matters?\s+is\b/i,
  /\brather\s+than\s+(?:the\s+)?(?:actual|real|true|goal)/i,
  /\bseparately|another\s+matter|on\s+its\s+own\b/i,
  /\ba\s+means?,?\s+not\s+an?\s+end\b/i,
  /\bvanity\s+metric/i,
];

// ─── 豁免二：目标本身证据在场（结论已被直接证据背书）──────────────────
const EXEMPT_DIRECT_ZH = [
  /访谈|问卷(?:原文|结果|记录)|开放式回答|原话|实测(?:数据|结果)?|直接测量|现场(?:记录|调研)|蹲点|随访|体检|临床(?:数据|结果)|审计(?:报告|结果)|第三方(?:评估|检测)/,
  /逐一(?:核实|验证|确认)|逐条(?:核实|验证)|亲测|实测/,
];
const EXEMPT_DIRECT_EN = [
  /\b(?:interviews?|survey\s+responses?|open[- ]ended\s+responses?)\b/i,
  /\bmeasured\s+(?:directly|the\s+goal)\b/i,
  /\bdirect(?:ly)?\s+measur/i,
  /\b(?:clinical|audited|third[- ]party)\s+(?:data|results?|evaluation|assessment)/i,
];

// ─── 豁免三：对冲（概率化结论，同 r186/r189 口径）─────────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|未必|不一定|不见得|大概|恐怕|多半|说不定|很难说|有待|仍需|还需|尚且|不好说/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|possibly|probably|not\s+necessarily|unclear|remains\s+to\s+be\s+seen)\b/i,
];

// ─── 豁免四：概念/教学转述（讨论这个谬误本身是正确判别）──────────────
const EXEMPT_META_ZH = [
  /古德哈特|代理指标|指标扭曲|指标失真|虚荣指标|绩效主义|唯指标|唯GDP|唯分数|分数至上|应试|刷分|刷指标|KPI主义/,
  /老师|课堂|教材|课本|课程|教案|讲师|教授说|案例分析|逻辑课/,
];
const EXEMPT_META_EN = [
  /\bGoodhart(?:'s)?(\s+law)?\b/i,
  /\b(?:proxy\s+metric|metric\s+distortion|vanity\s+metric|gaming\s+the\s+metric)\b/i,
  /\b(?:teacher|classroom|textbook|lecture|course\s+material|case\s+study)\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** 在 text 的 from 偏移起找 list 中最早出现的匹配，返回 {idx, len} 或 null */
function firstMatch(list, text, from) {
  const start = from || 0;
  const sub = text.slice(start);
  let best = null;
  for (const re of list) {
    const m = sub.match(re);
    if (m && m.index >= 0 && (!best || m.index < best.idx)) {
      best = { idx: start + m.index, len: m[0].length };
    }
  }
  return best;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkProxyMetricGoal(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  // 注入归一化：负例脚本传入的可能是「永不匹配正则」（RegExp 非数组），
  // 统一包成数组——anyHit/firstMatch 都只吃数组（r190 实现教训）。
  const norm = v => (Array.isArray(v) ? v : [v]);
  const R = inject || {};
  const METZ = norm(R.METRIC_ZH || METRIC_ZH);
  const METE = norm(R.METRIC_EN || METRIC_EN);
  const GOALZ = norm(R.GOAL_ZH || GOAL_ZH);
  const GOALE = norm(R.GOAL_EN || GOAL_EN);
  const CONNZ = norm(R.CONN_ZH || CONN_ZH);
  const CONNE = norm(R.CONN_EN || CONN_EN);
  const SEPZ = norm(R.EXEMPT_SEP_ZH || EXEMPT_SEP_ZH);
  const SEPE = norm(R.EXEMPT_SEP_EN || EXEMPT_SEP_EN);
  const DIRZ = norm(R.EXEMPT_DIRECT_ZH || EXEMPT_DIRECT_ZH);
  const DIRE = norm(R.EXEMPT_DIRECT_EN || EXEMPT_DIRECT_EN);
  const HDGZ = norm(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH);
  const HDGE = norm(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN);
  const METZ2 = norm(R.EXEMPT_META_ZH || EXEMPT_META_ZH);
  const METE2 = norm(R.EXEMPT_META_EN || EXEMPT_META_EN);

  // 全局豁免：主动分离 / 目标直接证据 / 对冲 / 概念教学 / 疑问句
  if (anyHit(SEPZ, text) || anyHit(SEPE, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(DIRZ, text) || anyHit(DIRE, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(HDGZ, text) || anyHit(HDGE, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(METZ2, text) || anyHit(METE2, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const METRIC = METZ.concat(METE);
  const GOAL = GOALZ.concat(GOALE);
  const CONN = CONNZ.concat(CONNE);
  const SPAN = isZh ? 80 : 160;

  const metric = firstMatch(METRIC, text, 0);
  if (!metric) return { hit: false, score: 0, detail: '', count: 0 };

  // 逐个目标结论腿匹配，统计共现次数（同 r186 结构）
  let count = 0;
  let bestScore = 0;
  let firstDetail = '';
  for (let from = 0; from < text.length;) {
    const goal = firstMatch(GOAL, text, from);
    if (!goal) break;
    const lo = Math.min(metric.idx, goal.idx);
    const hi = Math.max(metric.idx + metric.len, goal.idx + goal.len);
    if (hi - lo <= SPAN) {
      const window = text.slice(lo, hi);
      const contrast = /但是|然而|却|不过|虽然|尽管|而是|相反|反而/.test(window);
      const hasConn = anyHit(CONN, window);
      const juxtapose = /[，,]/.test(window) && !contrast;
      if (!contrast && (hasConn || juxtapose)) {
        count++;
        if (count === 1) {
          // 强连接词（足以证明/充分证明/毫无疑问/百分之百/100%/肯定/必然）
          // 提分——陈述者把指标当成决定性证据时谬误强度更高。
          const strong = /足以证明|足以说明|充分证明|毫无疑问|毋庸置疑|百分之百|100%|铁证|肯定|必然|铁定|\b(?:proves|conclusively|undoubtedly|definitely|certainly)\b/i.test(window);
          bestScore = strong ? 0.72 : 0.62;
          firstDetail = isZh
            ? '代理指标当目标×指标读数冒充目标达成(zh)'
            : 'proxy-metric-as-goal×metric-readout-as-goal-achievement(en)';
        } else if (bestScore < 0.72) {
          bestScore = 0.72; // 多处共现提分
        }
      }
    }
    from = goal.idx + goal.len;
  }

  if (count > 0) {
    return { hit: true, score: bestScore, detail: firstDetail, count };
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkProxyMetricGoal,
  __internals: () => ({
    METRIC_ZH, METRIC_EN, GOAL_ZH, GOAL_EN, CONN_ZH, CONN_EN,
    EXEMPT_SEP_ZH, EXEMPT_SEP_EN, EXEMPT_DIRECT_ZH, EXEMPT_DIRECT_EN,
    EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN, EXEMPT_META_ZH, EXEMPT_META_EN,
  }),
};
