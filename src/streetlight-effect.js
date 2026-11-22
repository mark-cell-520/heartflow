/**
 * src/streetlight-effect.js — 「路灯效应 / 可得性限定证据」检测器
 * （第 284 个判别维度，r451 接线；编号 provisional，最终编号由 1 号按
 *   VERIFY_DIMS 登记序重排确认）
 *
 * [r451 立项] 缺口实证探针 scripts/round-449/probe-r449-core.js（直调
 * src/gate.js）在 v6.8.224 上实测：本族 17 条攻击样本 **11 条穿透**
 * （gate=pass，零维度代拦）；既有最接近的维度：
 *   · availability_bias（第 200 维）管**媒体曝光度**（新闻/热搜/传闻
 *     决定主观概率），腿①是曝光线索，不是「测量工具决定数据范围」；
 *   · vivid_case_availability（第 252 维）管**生动个案**的可得性；
 *   · proxy_metric_goal（第 187 维）管**代理指标被当作目标本身**，
 *     腿①是「指标成为 KPI」，不是「未测量部分被判定不存在」；
 *   · selection_bias / self_selection_bias / baseline_omission 管**样本
 *     进入机制**（谁被纳入），本族管的是**测量工具的可见性边界**（什么
 *     能被观测到）——两者交集但不重合：路灯效应的经典形是「只有路灯下
 *     看得见」，没有任何「谁选择进入」结构。
 * 覆盖度检查：grep src/ 'streetlight' 零命中；「路灯」「只有那里看得见」
 * 「无法量化」「没有数据」「按不存在处理」宽形句式无任何维度承重。
 *
 * 外部来源（真实可查，非编造）：
 *   · arXiv:2311.04909 "Streetlight Effect in Post-Publication Peer
 *     Review: Are Open Access Publications More Scrutinized?"（经 arXiv
 *     API 检索 "streetlight effect" 直接命中的唯一样式文献，论述开放
 *     获取出版物因更易被检索而受到更多同行评议——即可得性决定审查
 *     范围）。
 *   · HN Algolia 命中 Wikipedia "Streetlight effect" 条目（故事 45578685，
 *     4 分）——路灯效应的标准定义出处（人在路灯下找钥匙，因为只有那里
 *     有光）。
 *   · 概念背景：streetlight effect（路灯效应，drunkard's search）——
 *     「在灯光下找钥匙，因为那里看得见，不是因为钥匙丢在那里」。其
 *     现代回声是数据科学里的「只有可采集的指标才纳入分析」与循证决策
 *     里的「没有数据的部分按不存在处理」。心虫判据为自有纯规则实现
 *     （零 LLM 依赖）。
 * 侦察落盘 /tmp/hf-scout-1.json（S2 429）、/tmp/hf-scout-7.xml（arXiv
 * 命中）、/tmp/hf-scout-9/10.xml（Goodhart 代理指标族，已有维度覆盖）。
 *
 * 辨别的族：路灯效应（streetlight effect / measurement-availability
 * confound）——把**测量工具的可见性边界**（能采集/有数据/在监控范围/
 * 量得到/看得见）当作**事实存在的边界**，并据此对整体下结论：
 *   我们只在路灯下找丢了钥匙，因为只有那里看得见。
 *   因为只有有路灯的区域才查得到数据，结论就说盗窃都发生在照明区。
 *   凡是无法量化的因素，都可以认为没有影响。
 *   没有数据的部分按不存在处理，统计口径就干净了。
 *   不能度量的风险不需要管理。
 *   What cannot be measured can be treated as nonexistent.
 *   Anything not captured in the dashboard is outside our consideration.
 *   评价一个老师只看学生分数，其他都不用管。
 *
 * 为什么这是判别者的核心缺口：这是**可见性与存在性的混淆**——能测到
 * 的只是事实的一个子集，子集的形状由工具的射程决定，不由事实的分布
 * 决定。推论把「我没测到」兑换成「它不存在/不重要」，于是最省力的
 * 观测方式自动成为结论本身：只看得到路灯下的盗窃，就宣称盗窃都发生
 * 在照明区；只看得到下载量，就宣称市场没有创新。这与证据纪律直接
 * 冲突：证据的缺失必须表述为**未测量**，不能被兑换为**不存在**。
 *
 * 与既有维度的边界（r451 归因）：
 *   · availability_bias（第200维）管**主观概率**被媒体曝光度带偏
 *     （「热搜上都是这种新闻，所以很常见」），其腿①是曝光/报道线索；
 *     本族腿①是**测量可得性**（能采集/有数据/量得到/看得见），腿②
 *     是**把未测量部分排除出结论域**（按不存在/不重要/不用管），
 *     不经过任何「主观概率」结构。
 *   · proxy_metric_goal（第187维）管**指标反噬目标**（KPI 成为目的，
 *     为刷分而刷分）；本族腿①是观测手段的边界，腿②是「未测量＝不
 *     存在」的存在性抹除，不是刷分行为。
 *   · selection_bias / self_selection_bias 管**谁进入样本**（自愿
 *     参与者、存活者、被筛中的医院）；本族管**什么能被观测到**——
 *     样本可能是全体，但观测维度只覆盖易测部分。
 *   · baseline_omission 管**缺少对照组**使效果无法归因；本族不涉及
 *     前后对比，是观测维度覆盖不全。
 *   · absence_of_problems（第182维）管**问题缺席**推论（没出故障所以
 *     没问题）；本族腿①是**测量能力**的边界（量不到/没数据），不是
 *     问题是否发生。
 *   · unfalsifiable_assertion / appeal_to_ignorance 管**举证结构**
 *     （无法证伪/你驳不倒）；本族两腿是「可见性限定 + 存在性抹除」，
 *     与举证责任无关。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判）：
 *   ① 腿① AVAILABILITY 测量可得性在场：只有…才(查得到|看得见|采集|
 *      纳入|统计|监测|覆盖|知道|能测)/只(看|测|统计|统计|覆盖|纳入)…/
 *      只能…(数据|指标|渠道|来源)/有(数据|记录|监控|统计)的/能(量化|
 *      采集|自动采集|监测|观测|测)的/无法(量化|测量|观测|采集|度量的)/
 *      没有(数据|记录|监测|统计)的/不(在|纳入)(监控|统计|监测|采集|
 *      仪表盘|数据库)/可见的/看得见的/路灯下/仪表盘(里|中)(没有|未)；
 *      EN only (what|where|those) (we|you) (can|could) (measure|see|
 *      observe|collect|access|monitor) / not (captured|measured|
 *      collected|visible|tracked) / no data on / what cannot be measured /
 *      cannot be quantified / outside (our )?(consideration|scope|view) /
 *      dashboard / under the streetlight / all we can see。
 *   ② 腿② ELISION 存在性抹除或整体结论：按不存在(处理|算|看待)/认为
 *      没有影响/不需要(管理|关注|考虑|处理|在意)/不重要/不用管/不重要/
 *      据此(推断|判断|得出|认为|得出)…(整体|全部|所有|整个)/就(断定|认定|
 *      说明|意味着|足以证明)/都发生在/都一样/就够了/就够了/足够说明；
 *      EN treated as nonexistent / does not matter / does not exist /
 *      (no|not) (need|needs) (to be )?(managed|considered|measured) /
 *      outside our consideration / irrelevant / can be ignored /
 *      so (it|we) (can|must) / therefore / thus / so we conclude /
 *      this means (the whole|all|everything) / is enough / suffices。
 *   两腿落在 80 字（EN 200 字符）邻近窗内即视为同一次「可得性→抹除/
 *   整体结论」叙述。
 *
 * 为什么取 VERIFY 级：单句也可能是在**正当记录测量局限或批判**这种
 * 推理（「只统计了愿意填问卷的人，这个样本有偏」「未测量的混杂因素
 * 可能存在，因此只能作关联性解读」正是本族要教的判别动作）、测量方法
 * 与工具选型的正当陈述、科研预算与阶段计划的如实说明；rewrite/block
 * 会误伤。verify 的含义是「这段文本把测量边界当成了事实边界，需先
 * 说明未测量部分的状态（缺失≠不存在），再下结论」。
 *
 * 明确不判（豁免）：
 *   · 局限承认与补齐计划（样本有偏/有偏/不能推广/暂缺(数据)?/需补充
 *     调研/下一轮扩展/遗漏/局限/不足/存在选择偏倚/只能回答/不可外推/
 *     扩展/补齐/后续补充/待补；EN biases the sample / extrapolation is
 *     unwarranted / incomplete / incomplete, not / may exist / as
 *     associational / only / limitation / cannot be generalized /
 *     will expand / missing）；
 *   · 方法论陈述（可量化是为了可追踪/设代理指标/专家评审作为代理/
 *     因(为)?成本限制/警力有限/预算/人手不足/分阶段/本轮只测/由于资源；
 *     EN due to (budget|resource|cost|staffing) / for trackability /
 *     proxy indicator / expert review as a proxy / phased）；
 *   · 元话语/教学转述（路灯效应/谬误/课程/教材/课堂/概念/称为/定义为/
 *     举例/例如/比如；EN streetlight effect / logical fallacy / drunkard's
 *     search / course / textbook / lecture / concept / defined /
 *     for example / e.g.）；
 *   · 显式对冲（可能/也许/未必/不一定/大概率/或许/似乎/估计/might/
 *     maybe/possibly/perhaps/seems/appears/probably/likely）；
 *   · 否定翻转（不能据此/推不出/不足以证明/并不代表/不等于/不可推定；
 *     EN cannot conclude / does not imply / not necessarily / cannot be
 *     treated as）；
 *   · 疑问句（含 ?/？；反问标记出现时不豁免，同 r216 collider_bias
 *     口径：难道/岂/凭什么/何尝/岂不是/谈何/ isn't it / doesn't that /
 *     how else / what else / who doesn't / if not）；
 *   · 缺腿②的纯可得性描述（「我们只测了三个城市。」「数据只来自白
 *     天进店的人。」）——中性事实陈述，不由本族代拦。
 */
'use strict';

// ─── 腿① 测量可得性在场（中文）──────────────────────────────────
// r161 教训：收裸名词形态——「路灯」「没有数据」去掉前后缀仍命中
// （不加尾部边界也能作为独立腿①命中）。
const AVAILABILITY_ZH = [
  // 「只有…才查得到/看得见/采集/纳入」族（含裸形）
  /只有[^。！？!?]{0,12}(?:查得到|看得见|采集|纳入|统计|监测|覆盖|知道|能测|可测|有数据|有记录|能查到|能采集)/,
  /只(?:有|看|测|统计|覆盖|纳入|关注|考虑)[^。！？!?]{0,10}(?:才|所)?(?:能|可以|够)/,
  // [r451 矩阵修复] 「只测了三个城市」——量词对象为地域/机构名的样本限定形
  /只(?:测|统计|覆盖|纳入|采集|调查|监控)了?[^。！？!?]{0,12}(?:城市|地区|区域|门店|工厂|学校|医院|省份|国家|大区|片区|路口|站点)/,
  // [r451 矩阵修复] 「只看能拿到的财报数字」——"只看"+可得性短语的宽形
  /只(?:看|用|采信|采用)?[^。！？!?]{0,6}能(?:拿|采集|获取|得到)到的?/,
  // 只看/只测/只统计/只覆盖 + 对象（「只用能拿到的财报数字」「只看来投资的金额」）
  // [r451 矩阵修复] 宽形：只…(数字|指标|数据|来源|维度|方面|的人|样本)——
  // 「数据只来自白天进店的人」「研究只覆盖了愿意填问卷的人」曾漏判。
  /只(?:看|测|统计|覆盖|纳入|采信|采用|用|来自|采集)[^。！？!?]{0,16}(?:就够了|即可|够用|的数字|的指标|的数据|来源|维度|方面|的人|样本)/,
  /只(?:看|测|统计|覆盖|纳入|用)[^。！？!?]{0,10}(?:金额|分数|排名|指标|财报|数据|报表)/,
  // 只覆盖…的人（样本覆盖形，含裸形）
  /只(?:覆盖|纳入|统计|采集)了?[^。！？!?]{0,12}(?:的人|样本|客户|用户|群体|人群|部分)/,
  // 只能拿到/能拿到的
  /(?:只)?能(?:拿|采集|获取|得到)到的?[^。！？!?]{0,10}(?:数字|指标|数据|来源|报表|信息)/,
  // 有数据/有记录/有监控的部分（「有数据就说没问题」）
  /(?:有|存在)(?:数据|记录|监控|统计|台账|留痕)(?:的)?(?:部分|方面|维度)?/,
  // 无法量化/不能度量族（含裸名词形）
  /(?:无法|不能|难以|没法|无从)(?:量化|测量|观测|采集|度量|测算|统计)/,
  /(?:不可|未|无法)(?:量化|度量|测量|观测)/,
  // 没有数据/没有记录的部分
  /(?:没有|无|未|缺)[^。！？!?]{0,6}(?:数据|记录|监测|统计|留痕|痕迹)/,
  // 不在监控/统计/仪表盘范围内
  /(?:不|未)(?:在|纳入|列入)[^。！？!?]{0,10}(?:监控|统计|监测|采集|仪表盘|看板|数据库|台账|视野)/,
  // 看得见/可见的（路灯经典形）
  /看得见|可见的|可见部分|照明区|有光(?:的)?(?:地方|区域)/,
  // 路灯下（经典比喻 + 裸名词）
  /路灯/,
  // [r451 矩阵修复] 「因为只有那里看得见」结论形：可见性被当作搜索范围
  // 正当性的自证（找钥匙就在看得见的地方找）
  /因为只有(?:那里|这里|看得见|照明|有光|灯下)/,
  // 仪表盘/数据里没有（「仪表盘里没有的就不重要」）
  /(?:仪表盘|看板|报表|数据库|后台)[^。！？!?]{0,8}(?:没有|未|看不到|不显示)/,
  // 可量化/能自动采集的才纳入（倒装形）
  /(?:可量化|能自动采集|可采集|可观测|可监测)(?:的)?(?:才|只|方|指标)?(?:纳入|计入|统计)/,
];

// ─── 腿①（英文）───────────────────────────────────────────────
const AVAILABILITY_EN = [
  /only\s+(?:what|where|those|the\s+ones?)\s+(?:we|you|one)\s+(?:can|could)\s+(?:measure|see|observe|collect|access|monitor|track|quantify)/i,
  /only\s+(?:what|where)\s+(?:is|are)\s+(?:measurable|observable|visible|tracked|accessible)/i,
  // [r451 矩阵修复] only by / solely by（「Judge the hospital only by the
  // mortality rate」「Rank teachers solely by test scores」）
  /\b(?:only|solely)\s+(?:by|on|based\s+on|judged\s+by|evaluated\s+by|measured\s+by)\b/i,
  /(?:what|anything|everything)\s+(?:that\s+)?(?:cannot|can'?t|couldn'?t)\s+be\s+(?:measured|quantified|observed|tracked|collected)/i,
  /not\s+(?:captured|measured|collected|visible|tracked|monitored|recorded|observable)/i,
  /\bno\s+data\s+(?:on|for|about|exists)\b/i,
  /\b(?:we|you)\s+(?:only|just)\s+(?:measure|measure[d]?|see|observe|collect|track|monitor|look(?:ed)?\s+at)\b/i,
  /only\s+(?:the|those)\s+(?:metrics?|numbers?|figures?|data|indicators?)\s+(?:we|you|available|that\s+are\s+available)/i,
  /\bcan(?:not|'t)\s+be\s+quantified\b|\bunquantifiable\b|\bunmeasurable\b/i,
  /\boutside\s+(?:our|the)\s+(?:consideration|scope|view|purview|analysis|dashboard)\b/i,
  /\bnot\s+(?:on|in)\s+the\s+dashboard\b|\bnot\s+shown\s+on\s+the\s+dashboard\b/i,
  /\bunder\s+the\s+(?:streetlight|lamppost|street\s+light)\b|\bstreetlight\s+effect\b/i,
  /\ball\s+we\s+(?:can\s+)?(?:see|measure|observe)\b|\bonly\s+(?:visible|observable)\b/i,
];

// ─── 腿② 存在性抹除 / 整体结论（中文）─────────────────────────
const ELISION_ZH = [
  // 按不存在处理/视为没有（裸形）
  /按(?:不存在|没有|无)(?:处理|算|看待|对待|计|记)/,
  /(?:认为|视为|当作|看作|认定为)(?:没有|无|不存在)/,
  /(?:都)?(?:可以|可|应|应当)?(?:认为|视为)(?:没有|不存在|无)/,
  // 没有影响/无影响
  /(?:没有|无|不构成|不产生)(?:任何)?(?:影响|作用|效果|风险|危害|关系)/,
  // 不需要管理/关注/考虑（含裸形）
  /(?:不|无需|无须|用不着)(?:需要|必)?(?:管理|关注|考虑|处理|在意|理会|担心|防备)/,
  // 不重要/不用管/无所谓
  /不重要|不用管|不必管|无关紧要|无所谓|不足虑|可忽略|忽略不计/,
  // 据此推断整体（「据此判断项目整体」「就断定整个市场」）
  /(?:据此|就此|由此|因此|所以|可见)?(?:推断|判断|认定|断定|得出结论?|得出)[^。！？!?]{0,12}(?:整体|全部|所有|整个|总体|全公司|全员|全国|全局)/,
  /就(?:断定|认定|说明|意味着|足以证明|可以认为)/,
  // [r451 矩阵修复] 部分结论外推为整体（「全公司员工的满意度就是这个数」
  // —— 只覆盖样本的数被当作全体的值）
  /(?:全|整个|全部|总体|所有)[^。！？!?]{0,14}(?:就是|即为|等于)(?:这个|该|此|那个)?(?:数|数值|数字|值|水平|结果|结论|样子|情况)/,
  // [r451 矩阵修复] 「整体经营状况就是这个结论」——整体主语在前、
  // 结论在后的外推形（主语与"就是这个X"不相邻）
  /(?:整体|全局|总体|全部|整个)[^。！？!?]{0,16}(?:情况|状况|水平|表现|质量|面貌|满意度|满意度|口碑|评分|估值|营收|利润|数值|结果|结论|规模|增速|转化率|留存率)(?:就是|即为|等于|不过是|只是)/,
  // 都发生在/都一样（外推形）
  /都发生在|全都(?:是|在)|也一样|并无不同|都一样/,
  // [r451 矩阵修复] 可见性反推存在位置形（「钥匙一定在照明区」——
  // 用"看得见的地方"反推丢失物所在，路灯效应的标准结论腿）
  /(?:一定|必定|肯定|必然|想必|定然)(?:在|是|位于|就在)/,
  /(?:钥匙|东西|物品|问题|原因|根源|答案|真相)(?:一定|必定|肯定|必然|定然|想必)/,
  // 就够了/即可（评价维度缺失）
  /(?:就|便)?(?:够了|即可|足够|足矣|足以)/,
  // 统计口径就干净了（手段正当化形）
  /口径(?:就)?(?:干净|清晰|统一)(?:了)?/,
];

// ─── 腿②（英文）───────────────────────────────────────────────
const ELISION_EN = [
  /treated?\s+as\s+(?:nonexistent|nothing|zero|irrelevant|insignificant)/i,
  /does\s+not\s+(?:matter|exist|count|carry\s+weight)/i,
  /(?:no|not)\s+(?:need|needs)\s+(?:to\s+be\s+)?(?:managed|considered|measured|addressed|tracked|monitored)/i,
  /can\s+be\s+(?:ignored|disregarded|excluded|left\s+out|treated\s+as\s+zero)/i,
  /(?:is|are)\s+(?:therefore\s+)?(?:irrelevant|immaterial|insignificant|of\s+no\s+consequence)/i,
  /so\s+(?:it|we|the\s+conclusion)\s+(?:can|must|should)/i,
  /(?:this|which)\s+means\s+(?:the\s+whole|all|everything|the\s+entire)/i,
  /(?:therefore|thus|so)\s+(?:we\s+)?(?:conclude|infer|assume)\b/i,
  /is\s+(?:therefore\s+)?(?:enough|sufficient|all\s+that\s+matters|the\s+only\s+thing)/i,
  // [r451 矩阵修复] 「Judge the hospital only by the mortality rate we
  // already have」——可得指标自证腿
  /(?:already|currently|presently)\s+(?:have|has|had|possess(?:es)?)/i,
  /nothing\s+else\s+(?:needs|matters|counts)/i,
  /outside\s+our\s+consideration/i,
  /\ball\s+(?:of|the)\s+(?:theft|crime|problems?|cases?)\s+(?:happen|occur)/i,
];

// ─── 豁免表 ────────────────────────────────────────────────────
// 局限承认与补齐计划（正确的方法论陈述正是本族要教的判别动作）
const EXEMPT_LIMIT_ZH = /样本有偏|有偏|不能推广|不可外推|暂缺|暂缺数据|需补充|补充调研|下一轮(?:扩展|扩大|补)|扩展到|遗漏|局限|不足|存在选择偏倚|只能回答|不可外推|外推(?:是)?(?:不)?(?:恰当|合理)?的|补齐|后续(?:补充|完善)|待补|口径外|未覆盖|尚未覆盖|盲区|数据缺口/;
const EXEMPT_LIMIT_EN = /\bbiases?\s+the\s+sample\b|\bbias(?:ed)?\s+sample\b|\bextrapolation\s+is\s+unwarranted\b|\bincomplete\b|\bmay\s+exist\b|\bmight\s+exist\b|\bassociational\b|\blimitation\b|\blimited\s+to\b|\bcannot\s+be\s+generalized\b|\bwill\s+expand\b|\bwill\s+extend\b|\bmissing\b|\bnot\s+covered\b|\bblind\s+spot\b|\bsubset\s+only\b|\bsample\s+only\b/i;

// 方法论陈述（资源约束下的阶段安排，不是存在性抹除）
const EXEMPT_METHOD_ZH = /可量化(?:是)?(?:为了|是为)?(?:了)?(?:可追踪|可度量|便于)|设(?:定)?代理指标|代理指标|专家(?:评审|打分)作为代理|因为(?:成本|预算|资源|人力|警力|人手|时间)(?:限制|有限|不足)|受(?:成本|预算|资源)(?:限制|约束)|分阶段|阶段性|本轮只测|本轮只(?:做|覆盖)|下一(?:步|阶段|轮)|因(?:此)?暂(?:不|未)|资源有限|条件受限|受限于|只在(?:此|这)(?:范围|阶段|条件下)/;
const EXEMPT_METHOD_EN = /\bdue\s+to\s+(?:budget|budgetary|resource|resourcing|cost|staffing|staffing\s+constraints?|time)\b|\bfor\s+trackability\b|\bproxy\s+(?:indicator|metric|measure)\b|\bexpert\s+review\s+as\s+a\s+proxy\b|\bphased\b|\bin\s+phases\b|\bthis\s+(?:round|phase|phase)\s+only\b|\bwill\s+(?:expand|extend|broaden)\s+(?:next|in\s+the\s+next)\b|\bnext\s+(?:phase|quarter|round|stage)\b|\bstaged\s+rollout\b|\bbecause\s+of\s+(?:limited|budget|resource)\b/i;

// 元话语/教学转述
const EXEMPT_META_ZH = /路灯效应|逻辑谬误|谬误|课程|教材|课堂|教案|概念|称为|定义为|叫作|比喻|举例|例如|比如|俗语|谚语|寓言|典故/;
const EXEMPT_META_EN = /\bstreetlight\s+effect\b|\blogical\s+fallacy\b|\bdrunkard'?s\s+search\b|\bcourse\b|\btextbook\b|\blecture\b|\bconcept\b|\bdefined\b|\bdefinition\b|\bfor\s+example\b|\be\.g\.\b|\bmetaphor(?:ically)?\b|\bcalled\s+the\b/i;

// 显式对冲
const EXEMPT_HEDGE_ZH = /可能|也许|未必|不一定|大概率|或许|似乎|貌似|说不定|大概|估计|倾向于|恐怕|八成|多半/;
const EXEMPT_HEDGE_EN = /\bmight\b|\bmaybe\b|\bpossibly\b|\bperhaps\b|\bnot\s+necessarily\b|\bcould\s+be\b|\bseems?\b|\bappears?\b|\bprobably\b|\blikely\b/i;

// 否定翻转（「未测量不等于不存在」正是本族要教的判别动作）
const EXEMPT_NEG_ZH = /不能据此|据此(?:不|并)能|推不出|不足以(?:证明|说明|据此)|并不代表|不等于|不可推定|未能说明|说明不了|证明不了|不(?:能|可)(?:据此|因此)/;
const EXEMPT_NEG_EN = /\bcannot\s+conclude\b|\bcan'?t\s+conclude\b|\bdoes\s+not\s+imply\b|\bnot\s+necessarily\b|\bcannot\s+be\s+treated\s+as\b|\bdoes\s+not\s+(?:mean|entail)\b|\bno\s+proof\b|\binsufficient\s+evidence\b/i;

// 疑问句（反问标记出现时不豁免，同 r216 collider_bias 口径）
const EXEMPT_QUESTION = /[?？]/;
const RHETORICAL_ZH = /难道|岂|凭什么|何尝|岂不是|谈何|莫非|难不成/;
const RHETORICAL_EN = /\bisn'?t\s+it\b|\bdoesn'?t\s+that\b|\bhow\s+else\b|\bwhat\s+else\b|\bwho\s+doesn'?t\b|\bif\s+not\b|\bwhy\s+else\b/i;

const NEAR_WINDOW_ZH = 80;
const NEAR_WINDOW_EN = 200;

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
 * 路灯效应检测器。
 * @param {string} rawText 待判文本
 * @returns {{score:number, findings:Array, legs:Object, exempt:boolean}}
 */
function checkStreetlightEffect(rawText) {
  const text = _normText(rawText);
  if (!text || text.length < 4) return { score: 0, findings: [], legs: {}, exempt: false };

  const en = _isEnglish(text);
  const leg1 = en ? AVAILABILITY_EN : AVAILABILITY_ZH;
  const leg2 = en ? ELISION_EN : ELISION_ZH;
  const window = en ? NEAR_WINDOW_EN : NEAR_WINDOW_ZH;

  // ── 豁免层 ──
  const hasQ = EXEMPT_QUESTION.test(text);
  const hasRhet = en ? RHETORICAL_EN.test(text) : RHETORICAL_ZH.test(text);
  if (hasQ && !hasRhet) return { score: 0, findings: [], legs: {}, exempt: true };

  // 局限承认优先于一切（本族最核心的良性形）
  if ((en ? EXEMPT_LIMIT_EN : EXEMPT_LIMIT_ZH).test(text)) {
    return { score: 0, findings: [], legs: {}, exempt: true };
  }
  if ((en ? EXEMPT_METHOD_EN : EXEMPT_METHOD_ZH).test(text)) {
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
  // 强抹除形（按不存在处理/treated as nonexistent/can be ignored）
  if (/按(?:不存在|没有|无)(?:处理|算|看待|对待|计|记)/.test(text) ||
      /treated?\s+as\s+(?:nonexistent|nothing|zero)/i.test(text) ||
      /can\s+be\s+(?:ignored|disregarded|excluded)/i.test(text)) {
    score += 14;
  }
  // 强可得性形（路灯/仪表盘外/what cannot be measured）
  if (/路灯/.test(text) ||
      /(?:无法|不能|难以|没法|无从)(?:量化|测量|观测|采集|度量|测算|统计)/.test(text) ||
      /\bcannot\s+be\s+(?:measured|quantified)\b|\bunmeasurable\b|\bunquantifiable\b|\bstreetlight\b/i.test(text)) {
    score += 10;
  }
  if ((en ? EXEMPT_HEDGE_EN : EXEMPT_HEDGE_ZH).test(text)) score -= 8;

  if (score > 96) score = 96;
  if (score < 40) score = 40;

  return {
    score,
    findings: [{
      dimension: 'streetlight_effect',
      severity: score,
      details: `路灯效应（测量可得性→存在性抹除/整体结论）：腿①测量可得性限定在场，腿②未测量部分被抹除或据此对整体下结论，两腿相距 ${NEAR_WINDOW_ZH} 字（EN ${NEAR_WINDOW_EN} 字符）内`,
      guidance: '把「测量边界」与「事实边界」分开：能测到的只是事实的一个子集，子集的形状由工具的射程决定，不由事实的分布决定。未测量部分必须表述为「未测量/缺失」，不能兑换为「不存在/不重要」；要对整体下结论，须说明未覆盖范围及其影响，或补齐观测维度',
    }],
    legs: { availability: true, elision: true },
    exempt: false,
  };
}

module.exports = { checkStreetlightEffect };
