/**
 * src/mediator-confusion.js — 「中介变量混淆 / 过度控制偏差」检测器
 * （第 210 个判别维度，r213）
 *
 * [r213 立项] philosophy_decision 在当前引擎（v6.8.141，209 维）上裁决
 * accelerate（type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions / goalReviewed=true；cognitiveLoad 与
 * uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。立项缺口实
 * 证：r213 族探针 /tmp/hf-probe-r213.js 在当前引擎复测——中介混淆
 * 族攻击样本 6 条 **全部 gate.action=pass 且零维度命中**（真零命中，
 * 含中英双语、裸名词「止痛药」「消炎药」、带修饰「因为患者都吃了」、
 * 倒装「Once you control for income」、长句变体）；良性样本 6 条
 * pass（其中 2 条被 moral_foundations 弱信号命中但 action 仍 pass，
 * 不构成误拦）。覆盖度检查：mediator / 中介 / overcontrol / 过度
 * 控制 在 src/ 下 0 文件命中；reverse_causation / common_cause /
 * post_hoc / cum_hoc / simpsons_paradox / collider_bias 均未覆盖本
 * 族——它们分别判方向倒置、共同原因、时间先后、相关≠因果、聚合层
 * 逆转、条件筛选后子样本相关，没有一个判「控制/解释掉因果链的中
 * 间环节 → 否定上游原因」。
 *
 * 外部来源：arXiv 2406.12158（EMNLP 2024，*LLMs Are Prone to
 * Fallacies in Causal Inference*；代码与数据仓库
 * github.com/joshinh/causal-fallacies）系统给出 LLM 因果推断违反
 * 的规则，其中「把中介路径当成替代解释」「在控制中介后宣称效应消
 * 失即无因果」正是本族；另有因果推断通识中的过度控制偏差
 * （overcontrol bias / controlling for a mediator）作概念支撑。按
 * 心虫既有维度形态自建纯规则判据。
 *
 * 辨别的族：中介变量混淆（mediator-outcome confusion /
 * overcontrol bias）——把因果链 A→M→B 上的**中间传递环节 M**
 * 当成**替代原因**或**可排除项**，从而否定 A 的真实因果作用：
 *   因为患者都吃了止痛药，所以疼痛和骨折没有关系。
 *   控制了消炎药用量之后，炎症和发烧就不相关了。
 *   止痛药完全解释了损伤与痛苦之间的联系。
 *   一旦控制了收入，教育对健康就没有影响了。
 *   因为中介变量是睡眠，所以运动和健康没有因果关系。
 *   Once you control for income, education has no effect on health.
 *   Painkillers fully explain the link between injury and suffering.
 *
 * 为什么这是判别者的核心缺口（对齐「能符合宇宙规律」）：当 A 通过
 * M 影响 B（A→M→B），M 是**效应的传递通道**而不是**效应的替代解
 * 释**。控制 M（或宣称 M 完全解释了 A→B）会**切断这条通道**，此
 * 时 A 与 B 的相关消失是**干预的直接后果**，不是「A 本来就不是原
 * 因」的证据。混杂因素与中介变量的判别方向正好相反：混杂因素
 * （同时导致 A 与 B 的第三方）控制它是**正确的去偏**，中介变量控
 * 制它是**制造偏差**。把两者混同，等于用「排除中间环节」冒充「排
 * 除混杂」，是最容易以严谨统计外观出现的一类假严谨。
 *
 * 与既有维度的边界（r213 归因）：
 *   · common_cause（第 174 维度）管共同原因/混杂因素，本族管的是
 *     被控制的那个变量本身处在**因果链中间**（中介），控制它会切
 *     断本应存在的总效应；
 *   · collider_bias（第 209 维度）管条件筛选后子样本内的相关被当
 *     成总体因果结论，本族不依赖任何筛选/子样本标记；
 *   · reverse_causation（第 172 维度）管因果方向整体倒置，本族
 *     方向没错、错在把中间环节当成可排除的替代解释；
 *   · monocause（第 161 维度）管多因压成单因，本族不是压缩原因
 *     数量而是取消上游原因；
 *   · necessity_sufficiency_confusion（第 183 维度）管必要条件与
 *     充分条件混用，本族不涉及条件类型判断。
 *
 * 判据（主判据两腿共现 + 邻近窗，缺一不判）：
 *   · 腿① CONTROL 控制/解释动作：控制/调整/校正/校正了/扣掉/剔除/
 *     除去/排除了/解释掉/完全解释/充分说明/可以解释/归结为/归因于/
 *     之所以/只因为/正是因为（EN control(s|led) for / adjust(ed) for
 *     / account(s) for / explain(s|ed) / fully explain / attribute to
 *     / because of / due to）——**r161 教训：收裸动词形态**，控制/
 *     解释/调整 去前后缀仍命中。
 *   · 腿② NULL 效应否定结论：没有关系/无关/不存在因果/不是原因/没
 *     有因果/并无关系/不相关/没有效果/没有作用/没有影响/不起作用/
 *     无效/算不上原因/不是真正的原因/真正的…是/真实原因是/替代解
 *     释是/只是/不过是（EN no effect / no relationship / no
 *     correlation / not causal / is not the cause / no longer /
 *     nothing to do with / doesn't explain / the real cause is /
 *     the actual driver is / merely / just a）——且位于腿①之后
 *     40 字（EN 120 字符）窗内、未被否定。
 *
 * 为什么取 VERIFY 级：单句也可能是对中介分析的正确描述、课堂案例、
 * 论文转述（「控制了中介变量后直接效应仍显著」是正当的路径分析报
 * 告），rewrite 会误伤（与 r206-r209 评价族同口径）。verify 的含义
 * 是「这段文本用控制/解释中间环节的方式否定了上游原因，需要先补
 * 上直接效应检验或因果识别策略再采信」——调用方应要求区分中介与
 * 混杂、补上直接效应（controlled direct effect）估计。
 *
 * 明确不判的（豁免——这些是正当陈述与正确判别）：
 *   · 概念/教学转述（中介变量/中介效应/中介分析/中介路径/传导机制/
 *     过度控制/直接效应/间接效应/路径分析/因果链/统计学/教材/课堂/
 *     论文/悖论；EN mediator / mediation / mediating pathway /
 *     overcontrol / direct effect / indirect effect / path analysis
 *     / causal chain / textbook / statistics——讨论这个概念本身不
 *     是运用它）；
 *   · 正确响应形（承认 M 是传递通道并要求补直接效应/区分混杂与中
 *     介）：不能控制/不应控制/控制中介/控制中间环节/切断/混淆了中
 *     介/不是混杂/并非混杂/需要直接效应/需要区分中介与混杂/需要路
 *     径分析/是传递通道/是中介而非/应保留中介；EN controlling a
 *     mediator / not a confounder / needs the direct effect /
 *     mediator not confounder / blocks the pathway——**指出控制中
 *     介会切断通道并要求区分混杂与中介，正是本族要教的判别动作**；
 *   · 混杂控制形（同时/既导致/共同导致/第三方因素/外在因素/外生变
 *     量 + 控制；EN confounder / confounds / jointly causes /
 *     third factor / exogenous——**控制真正的混杂因素是正确的去
 *     偏，本族明确不判**）；
 *   · 无腿②（没有出现效应否定结论）——缺「否定结论」即无假严谨可
 *     断言，不判；
 *   · 推理否定/对冲（不代表/不意味着/推不出/未必/不一定/取决于/
 *     还要看/而不是/而非；EN does not mean / not necessarily /
 *     depends on / cannot conclude）；
 *   · 疑问句（含 ?/？）。
 */
'use strict';

// ─── 腿① CONTROL 控制/解释动作（中文；r161 教训：裸动词形态，
// 控制/解释/调整 去前后缀仍命中）────────────────────────────────
const CONTROL_ZH = [
  /控制|调控|校正|矫正|调整|调准|扣掉|扣除|剔除|除去|去掉|排除|排除了|剔除掉|屏蔽|抵消/,
  /解释|解释掉|完全解释|充分说明|说通|说明白|归因|归结|还原为/,
  /只因为|正是因为|是由于|归根到底|本质上是因为|说到底是因为/,
  // C1-b 替代解释框架：因为 + 中介性行为/变量陈述（患者都吃了止痛药 /
  // 因为中介变量是睡眠 / 因为大家都接受了治疗）——把中间环节当成
  // 既成解释，r161 教训：裸动词形态（吃/服/用/接受）去修饰仍命中
  /因为[^。；，!?]{0,16}(?:都|全|皆|普遍|一律|各自)?(?:吃|服|用|接受|采取|做|进行|打了|注射|服用|使用|经历|处于|呆在|住在)/,
  /因为[^。；，!?]{0,14}(?:变量是|因素是|原因是|就是|在于|为)/,
  // r213 补腿：只有…才… 形——「只有吃了止痛药才会不痛，所以疼痛和骨折
  // 无关」把中间环节（服药）当成唯一通道从而否定上游原因（骨折）
  /只有[^。；，!?]{0,16}(?:才|才会|方能|方能)/,
];

// ─── 腿① CONTROL 控制/解释动作（英文）────────────────────────
const CONTROL_EN = [
  /\b(?:control(?:s|led|ling)?|adjust(?:s|ed|ing)?|correct(?:s|ed|ing)?\s+for|account(?:s|ed|ing)?\s+for|hold(?:s|ing)?\s+constant|condition(?:s|ed|ing)?\s+on|net(?:ted)?\s+out|partial(?:led|ling)?\s+out)\b/i,
  /\b(?:explain(?:s|ed|ing)?|fully\s+explain\w*|completely\s+explain\w*|account(?:s|ed)?\s+for|attribut\w+\s+to|reduc\w+\s+to|boil(?:s|ed)?\s+down\s+to|comes\s+down\s+to|is\s+just)\b/i,
  /\b(?:only\s+because|simply\s+because|precisely\s+because|just\s+because|due\s+to|owing\s+to|because\s+of)\b/i,
  // C1-b 替代解释框架：because + 中介性行为陈述（all patients took
  // painkillers / because the mediator is sleep）——把中间环节当成既成解释
  /\b(?:because|since|as)\s+(?:all|every|most|the|these|those|patients?|people|they|everyone)\s+(?:take|took|takes|use|used|uses|receive|received|receives?|get|got|gets|had|have|underwent|underwent)\b/i,
  /\b(?:because|since)\s+(?:the\s+)?(?:mediator|mechanism|pathway|channel|variable)\s+is\b/i,
  // r213 补腿：only/simply because + 中介性陈述（only because it improves
  // sleep）——裸动词 improves/reduces 承接，把中间环节当成唯一解释
  /\b(?:only|simply|merely|just)\s+because\s+(?:it|they|he|she|the\s+\w+)\s+(?:improves?|improved|reduces?|reduced|boosts?|boosted|helps?|helped|makes?|made|drives?|drove|causes?|caused|leads?|led)\b/i,
  // r213 补腿：fully/completely explain the link/connection between ——
  // 「完全解释掉联系」本身即宣称上游原因可被替代
  /\b(?:fully|completely|entirely|totally)\s+explain\w*\s+(?:the\s+)?(?:link|connection|relationship|association|correlation|effect)\s+between\b/i,
  // r213 补腿（测试实测 miss 修复）：经由中介/经由通道形——works through /
  // flows through / runs through + 中介名词，即「效应全部经中间环节传递」
  // 的传递路径宣告，把中间环节当成承载全部效应的通道。
  /\b(?:works?|worked|flows?|flowed|runs?|ran|operates?|operated|acts?|acted|comes?|came)\s+(?:entirely\s+|only\s+|largely\s+|mainly\s+)?through\s+(?:the\s+)?(?:mediator|mechanism|pathway|channel|variable|effect|cortisol|diet|trust)\b/i,
  // r213 补腿：is (entirely/fully) mediated by —— 被动中介化宣告，
  // 宣称 A→B 的联系完全由 M 承载（连接被中间环节整体接管）。
  /\b(?:is|are|was|were)\s+(?:entirely\s+|fully\s+|completely\s+|largely\s+|mostly\s+)?mediat\w+\s+by\b/i,
  // r213 补腿（测试实测 miss 修复）：**前置于句首的 explain-away 复合腿**——
  // 「The connection between wealth and health is entirely mediated by diet」
  // 的 explain-away 语义（link/connection between A and B）出现在句首，
  // 位于被动中介化腿之前，单一腿无法满足「腿②须在腿①后」的次序判据。
  // 该复合模式本身即「连接被中间环节整体接管」的完整话语形状，作为腿①
  // 起点前移；副词取 entirely/fully/completely/largely/mostly/totally
  // （完全解释掉），裸「is mediated by」的中性转述不进入本腿。
  /\b(?:link|connection|relationship|association|correlation)\s+between\s+\w+\s+and\s+\w+\s+(?:is|are|was|were)\s+(?:entirely|fully|completely|largely|mostly|totally)\s+mediat\w+\s+by\b/i,
];

// ─── 腿② NULL 效应否定结论（中文；r161 教训：裸名词形态，关系/
// 影响/作用 去修饰仍命中）────────────────────────────────────────
const NULL_ZH = [
  /没有关系|没有关联|毫无关系|无关|不相干|并不相关|没有联系|没有牵联/,
  /不存在因果|不是原因|算不上原因|并非原因|称不上原因|没有因果|并无因果关系|没有因果关系/,
  /没有效果|没有作用|没有影响|不起作用|无效果|无作用|毫无作用|没有效果可言|没有意义/,
  /无效|失效|不成立|站不住|推不出|说明不了|证明不了|不足为凭/,
  /真正的原因|真实原因|真实的原因|真正的解释|实际原因|实际的原因|替代解释|另一种解释|唯一解释|唯一的原因/,
  /只是|不过是|无非是|仅仅是|仅仅是因为|只不过/,
  // r213 补腿：被消解的相关对象（…之间的联系/关联/关系 被解释掉后
  // 宣称无关）——「完全解释了损伤与痛苦之间的联系」+ 否定结论
  /之间的联系|之间的关联|之间的关系|之间的牵联/,
  // r213 补腿：「之后/以后」+ 否定（控制了X之后，Y就不相关了）——
  // 窗由 CONTROL→NULL 邻近窗覆盖，此处只需否定词本身
  /就不|便不|再无|再无任何|并没有|并无|并未/,
  // r214 补腿：效应消失类动词（控制了中间环节后，效应「消散/蒸发/
  // 荡然无存」）——反问形「谈何作用/何谈因果」同族
  /烟消云散|荡然无存|不复存在|消解|消散|谈何|何谈|无从谈起|谈不上|有何关系|有什么关系|有何关联|什么关系/,
  // [r216 修订] 效应消失类动词补词（agent-2 r214-round2 P1，补丁实证
  // 5/5 全覆盖）：现表缺「消失了」（第一轮已报）、「化为乌有」「不见
  // 踪影」「互不相关」「再也观测不到」「再也看不到」五族。C5（关系就
  // 消失了）/C6（互不相关）/C7（再也观测不到）/R8（化为乌有）/F16（互
  // 不相关）五条攻击句 base false → patched true。ZH 良性 197 条注入
  // 实证 0 新增误伤。
  /消失了|化为乌有|不见踪影|互不相关|互不相干|再也观测不到|再也看不到|再也无法观测|观测不到|再也检验不到/,
];

// ─── 腿② NULL 效应否定结论（英文）────────────────────────────
const NULL_EN = [
  /\b(?:no\s+effect|no\s+relationship|no\s+correlation|no\s+link|no\s+connection|nothing\s+to\s+do\s+with|irrelevant|unrelated)\b/i,
  /\b(?:not\s+causal|isn'?t\s+causal|no\s+causal|not\s+the\s+cause|isn'?t\s+the\s+cause|no\s+longer\s+(?:significant|matters|relevant|affects?|influences?|explains?)|doesn'?t\s+explain|does\s+not\s+explain)\b/i,
  /\b(?:no\s+(?:impact|influence|effect\s+at\s+all)|has\s+no\s+(?:effect|impact|influence)|makes\s+no\s+difference|is\s+meaningless|is\s+irrelevant)\b/i,
  /\b(?:the\s+real\s+cause|the\s+actual\s+cause|the\s+true\s+cause|the\s+real\s+driver|the\s+actual\s+driver|the\s+real\s+reason|the\s+only\s+(?:cause|driver|explanation)|the\s+alternative\s+explanation|a\s+better\s+explanation)\b/i,
  /\b(?:merely|just\s+a|nothing\s+but|only\s+a|is\s+just)\b/i,
  // r213 补腿：效应否定在动词后置形（education no longer affects health）
  /\b(?:no\s+longer)\b[^.]{0,40}\b(?:affects?|influences?|causes?|matters?|works?|significant)\b/i,
  // r213 补腿：explain-away 形——「完全解释了 A 与 B 之间的联系」本身即
  // 宣称上游原因可被中间环节替代（腿① 已命中 fully explain the link，
  // 此处收承重对象：link/connection between A and B 被解释掉）
  /\b(?:link|connection|relationship|association|correlation)\s+between\s+\w+\s+and\s+\w+/i,
  // r213 补腿：only/simply/merely because 形——「X reduces Y only
  // because it improves Z」中「only because」本身就是「唯一解释」宣称，
  // 上游原因被降格为可替代项（与腿① only/simply because 配对）。
  // [r213 收窄] 要求 because 后是中介性动词（improves/reduces/boosts/
  // helps 类改变中间状态的动词），裸「simply because he studied hard」
  // （努力→结果的直接因果，非中介链条）不命中——良性实测 FP 一例。
  /\b(?:only|simply|merely)\s+because\s+(?:it|they|he|she|the\s+\w+|\w+)\s+(?:improves?|improved|reduces?|reduced|boosts?|boosted|helps?|helped|drives?|drove|raises?|raised|lowers?|lowered|increases?|increased|decreases?|decreased|enhances?|enhanced|mediates?|mediated|channels?|channeled)\b/i,
  // r214 补腿：效应消失类动词（the apparent effect vanishes /
  // dissipates / evaporates once you partial out the mediating steps）
  // ——与 ZH「烟消云散/荡然无存」同族，需与腿① partial out/account for 配对
  /\b(?:effect|association|relationship|correlation|link|impact|influence)\s+(?:vanishes|vanished|disappears|disappeared|dissipates|dissipated|evaporates|evaporated|collapses|collapsed|fades|faded|is\s+gone|goes\s+away)\b/i,
  // [r216 修订] 效应消失类动词宽松腿（agent-2 r214-round2 P1 根因坐实）：
  // 上一行要求名词与动词**相邻**，但自然语言里两者常被介词短语隔开——
  // 「The effect of exercise on health disappears once you account for
  // sleep.」（effect of ... on ... disappears）与 R11 对比证明缺口精确
  // 形状：R11「The association between exercise and health completely
  // disappears」相邻故命中（且由 r213 explain-away 腿抓住），D4 隔了
  // 「of exercise on health」故漏。宽松腿允许名词与动词之间隔最多 40
  // 字符（同一句内，不跨句）。EN 良性 27 条注入实证 0 新增误伤。
  /\b(?:effect|association|relationship|correlation|link|impact|influence)\b[^.]{0,40}?\b(?:disappears?|vanishes|vanished|fades|evaporates?|dissipates?|collapses?|is\s+gone|goes\s+away)\b/i,
  /\b(?:never|was\s+never|is\s+never|were\s+never)\s+(?:causal|a\s+cause|the\s+cause|real|meaningful|relevant|significant)\b/i,
  // [r216 修订] no longer + 形容词宽松腿（agent-2 建议式）：「is no
  // longer predictive / observable / detectable」等形——原腿只收
  // significant/matters/relevant/affects/influences/explains/works
  // 七词，predictive/observable/detectable 类形容词漏。
  /\b(?:no\s+longer)\s+(?:causal|a\s+cause|the\s+cause|predictive|observable|detectable|meaningful|relevant|significant|present|apparent)\b/i,
];

// ─── 豁免一：概念/教学转述 ──────────────────────────────────────
const EXEMPT_META_ZH = [
  /中介变量|中介效应|中介分析|中介路径|中介作用|中介机制|中介模型|调节变量|传导机制|传递机制|因果链|因果路径|路径分析|结构方程|过度控制|控制过度|直接效应|间接效应|总效应|因果推断|统计学|统计/,
  /教材|课堂|教科书|讲座|教案|习题|悖论|论文|文献|方法论|范式/,
];
const EXEMPT_META_EN = [
  // r213 收窄（测试实测修复）：mediat\w+ 只豁免**概念/教学**语境，
  // 不再裸命中「is mediated by」这类**被动中介化宣告**（「The connection
  // between wealth and health is entirely mediated by diet」是把联系整体
  // 交给中间环节的攻击句，不是概念转述）。改为要求伴随教学/学术框架标记。
  /\b(?:mediation|mediating\s+(?:variable|pathway|role|mechanism)|moderat\w+|overcontrol|over-?control|direct\s+effect|indirect\s+effect|total\s+effect|path\s+analysis|structural\s+equation|causal\s+(?:chain|path|inference|identification))\b/i,
  /\b(?:textbook|lecture|statistics|stats\s+class|methodology|paper|literature)\b/i,
];

// ─── 豁免二：正确响应形（承认控制中介会切断通道 + 要求区分混杂与中介）
// 只收「结论层」的正确响应——「控制了中介变量之后，直接效应需要重新
// 估计」是本族要教的判别动作（r213 探针实测：良性样本「消炎药可能只
// 是中介变量，不能据此否定炎症的作用」必须落在本豁免）。
const EXEMPT_CORRECT_ZH = [
  /不能控制|不应控制|不应去控制|不能去控制|控制中介|控制中间环节|控制传导|控制通道/,
  /切断|阻断|隔断|堵塞/,
  // [r216 修订] 原 `/混淆了中介|混同了中介|误把中介|错把中介|把中介|中介而非|是中介/`
  // 中 `把中介`、`是中介` 两条裸词把「把中介变量控制掉之后两者互不相关」
  // （r216 NULL_ZH 补词后新召回的攻击句）误判为正确响应形。收窄为要求
  // 判别动词（混淆/混同/误判/辨别/区分）或否定式（不是中介/并非中介）
  // 伴随——「把中介变量控制掉」是**运用**中介概念作攻击，不是判别它。
  /混淆了中介|混同了中介|误把中介|错把中介|混淆中介|区分中介|辨别中介|中介而非|是中介而非|不是中介|并非中介|不属于中介|区别于中介/,
  /不是混杂|并非混杂|不属于混杂|有别于混杂/,
  /需要直接效应|需要估计直接效应|需要间接效应|需要路径分析|需要因果识别|需要中介分析|需要区分中介/,
  /是传递通道|是传导通道|是中间环节|是通路/,
  /应保留中介|应报告直接效应|需要补充直接效应/,
];
const EXEMPT_CORRECT_EN = [
  /\b(?:can'?t|cannot|should\s+not|must\s+not)\s+(?:control|adjust\s+for|condition\s+on)\b/i,
  /\b(?:controlling\s+(?:a|the)\s+mediator|conditioning\s+on\s+(?:a|the)\s+mediator|blocks?\s+the\s+pathway|cuts?\s+off\s+the\s+pathway|closes?\s+the\s+pathway)\b/i,
  /\b(?:mediator\s+not\s+confounder|not\s+a\s+confounder|distinguish\s+mediat\w+|separate\s+mediat\w+)/i,
  /\b(?:needs?|requires?)\s+(?:the\s+)?(?:direct\s+effect|indirect\s+effect|path\s+analysis|mediation\s+analysis|causal\s+identification)\b/i,
  /\b(?:is\s+a\s+(?:mediator|transmission\s+channel|pathway|conduit)|as\s+a\s+mediator)\b/i,
];

// ─── 豁免三：混杂控制形（控制真正的混杂因素是正确的去偏，本族不判）──
// 关键：句中同时出现「共同导致/同时导致/第三方/外生」类混杂标记时，
// 被控制的变量被判为混杂而非中介，整句豁免。
const EXEMPT_CONFOUNDER_ZH = [
  /共同导致|同时导致|既导致|同时影响|既影响|第三方因素|第三因素|外在因素|外部因素|外生变量|混杂因素|混淆因素|混淆变量|共同原因|背景因素/,
];
const EXEMPT_CONFOUNDER_EN = [
  /\b(?:confound\w*|jointly\s+caus\w+|simultaneously\s+caus\w+|third(?:-|\s+)?party\s+(?:factor|cause)|exogenous\s+(?:variable|factor|shock)|common\s+cause|lurking\s+variable)\b/i,
];

// ─── 否定守卫（窗口化：查腿② 命中前的否定标记）────────────────
const NEG_ZH = /不能|不应|不可|未必|不一定|并非|不代表|不意味着|很难|不要|用不着|无须|无需|不足以|不构成|称不上|算不上|并不|并不会|怀疑|质疑|警惕|小心|未必是/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t|unlikely|beware|careful|doubt\w*|question\w*)\b/i;

// 邻近窗：腿① → 腿②
const WIN_CONTROL_NULL_ZH = 40;
const WIN_CONTROL_NULL_EN = 120;

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

// 注入语义：腿常量列表可注入空数组；单正则常量注入替换正则（负例脚本
// 用 /(?!x)x/ 永假式抹掉该腿）。
function pickRe(injected, def) {
  return (injected && typeof injected.exec === 'function') ? injected : def;
}

function firstIdx(list, text) {
  for (const re of list) {
    const m = re.exec(text);
    if (m) return m.index;
  }
  return -1;
}

function negatedBefore(text, idx, isZh) {
  if (idx < 0) return false;
  const n = isZh ? 8 : 14;
  const pre = text.slice(Math.max(0, idx - n), idx);
  return isZh ? NEG_ZH.test(pre) : NEG_EN.test(pre);
}

// 腿①：取所有命中位置（控制动作可能多处出现）
function findControlLeg(text, isZh, R) {
  const list = isZh ? (R.CONTROL_ZH || CONTROL_ZH) : (R.CONTROL_EN || CONTROL_EN);
  const idxs = [];
  for (const re of list) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      idxs.push(m.index);
      if (m.index === reG.lastIndex) reG.lastIndex++;
    }
  }
  return idxs.sort((a, b) => a - b);
}

// 腿②：取腿①邻近窗内、未被否定的首个否定结论位置
// [r214 修订] 原实现要求 NULL 必须在 CONTROL **之后**（d >= 0）。缺陷：
// 「The effect vanishes once you partial out the mediating steps.」——
// 效应否定出现在控制动作之前，是"先给结论再给原因"的因果倒装，
// 语义上完全成立，原实现漏判。修订为允许 NULL 出现在 CONTROL 之前
// （限距 win 内），前后双向配对。
function findNullLeg(text, isZh, R, controlIdxs) {
  const list = isZh ? (R.NULL_ZH || NULL_ZH) : (R.NULL_EN || NULL_EN);
  const win = isZh ? WIN_CONTROL_NULL_ZH : WIN_CONTROL_NULL_EN;
  let best = -1;
  let bestDist = Infinity;
  for (const ci of controlIdxs) {
    for (const re of list) {
      const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      let m;
      while ((m = reG.exec(text)) !== null) {
        const d = m.index - ci;
        if (Math.abs(d) > win) continue;
        // 后置形要求未被否定对冲；前置形（NULL 在 CONTROL 前）跳过该
        // 检查——前置否定词多属"不再/从未"等效应否定本身的一部分
        if (d > 0 && negatedBefore(text, m.index, isZh)) continue;
        if (Math.abs(d) < bestDist) { bestDist = Math.abs(d); best = m.index; }
        if (m.index === reG.lastIndex) reG.lastIndex++;
      }
    }
  }
  return best;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkMediatorConfusion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 疑问句豁免 [r214 修订]
  // 原实现：整句含 ?/？ 即豁免。缺陷：反问句（"难道…还能说…？"、
  // "这不是心虚是什么？"）是操控话术最常用的包装——用问号把断言
  // 伪装成提问。修订为：仅当句中**没有反问标记**时才豁免；出现
  // 反问标记（难道/岂/凭什么/何尝/岂不是/谈何/还能说/…吗？+
  // rhetorical 形）时不豁免，按正常判据走。
  if (/[?？]/.test(text)) {
    const RHETORICAL_ZH = /难道|岂|凭什么|何尝|岂不是|岂不|还能说|怎能|怎么可以|不是说|谈何|何谈|岂有此理|天晓得|谁不知道|谁不|谁都知道|你敢说|你敢保证|这不是|又是什么|是什么|能不|难道说|有何|有什么关系|什么关系|可言|何来|从何|岂不是|岂非|焉能|哪来|哪有什么|哪来的/;
    // [r216 修订] EN 反问标记补倒装形（与 collider-bias.js 同步，避免两
    // 模块反问豁免边界不对称）：原表漏「doesn't education have no
    // effect...」——助动词否定 + 主语 + 实义动词倒装（doesn't X have /
    // aren't we / isn't that / don't we ...）。倒装问句自带预设（问者已
    // 认定答案），与真·无标记疑问（..., right?）区分，故不豁免。
    const RHETORICAL_EN = /\b(?:isn'?t\s+it|doesn'?t\s+that|doesn'?t\s+\w+|aren'?t\s+we|aren'?t\s+you|don'?t\s+we|don'?t\s+you|wasn'?t\s+it|how\s+(?:else|could|can)|what\s+else|who\s+doesn'?t|who\s+wouldn'?t|if\s+not|rhetorical)\b/i;
    if (!RHETORICAL_ZH.test(text) && !RHETORICAL_EN.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }
  // 概念/教学转述：讨论这个概念本身不是运用它
  // [r213 收窄] 原豁免把「中介变量」整体命中即豁免，导致「因为中介变量
  // 是睡眠，所以运动和健康没有因果关系」这类**运用中介概念作攻击**的
  // 句子被放过（r213 探针实测）。改为：元话语豁免要求句中同时出现
  // 教学/学术框架标记（教材/课堂/论文/称为/称为/概念/定义为/分析中）
  // 或否定标记（不能/不应/未必）；裸「中介变量」出现在因果陈述中不豁免。
  const metaZh = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const metaEn = R.EXEMPT_META_EN || EXEMPT_META_EN;
  const META_FRAME_ZH = /教材|课堂|教科书|讲座|教案|习题|悖论|论文|文献|方法论|范式|称为|定义为|概念|所谓|理论|分析中|研究中|课程|教学中|复习|考点|考题/;
  const META_FRAME_EN = /\b(?:textbook|lecture|syllabus|exam|quiz|paper|literature|methodology|called|defined|concept|notion|theory|in\s+this\s+(?:paper|study|analysis|chapter|lesson)|what\s+is\s+a)\b/i;
  if (anyHit(metaZh, text) || anyHit(metaEn, text)) {
    const hasFrame = META_FRAME_ZH.test(text) || META_FRAME_EN.test(text);
    const hasNeg = NEG_ZH.test(text) || NEG_EN.test(text);
    if (hasFrame || hasNeg) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }
  // 正确响应形：指出控制中介会切断通道并要求区分混杂与中介
  if (anyHit(R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH, text) || anyHit(R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 混杂控制形：被控制的变量被明确标记为混杂因素（共同导致/第三方/
  // 外生）时，控制它是正确的去偏，本族不判
  if (anyHit(R.EXEMPT_CONFOUNDER_ZH || EXEMPT_CONFOUNDER_ZH, text) || anyHit(R.EXEMPT_CONFOUNDER_EN || EXEMPT_CONFOUNDER_EN, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 主判据：腿① 控制/解释动作 × 腿② 效应否定结论（邻近窗）
  const controlIdxs = findControlLeg(text, isZh, R);
  if (controlIdxs.length > 0) {
    const nullIdx = findNullLeg(text, isZh, R, controlIdxs);
    if (nullIdx >= 0) {
      return {
        hit: true,
        score: 0.6,
        count: 1,
        detail: isZh
          ? '控制/解释掉因果链中间环节被用来否定上游原因(zh)'
          : 'controlling-or-explaining-away the mediator used to deny the upstream cause(en)',
      };
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkMediatorConfusion,
  __internals: () => ({
    CONTROL_ZH, NULL_ZH,
    EXEMPT_META_ZH, EXEMPT_CORRECT_ZH, EXEMPT_CONFOUNDER_ZH,
    CONTROL_EN, NULL_EN,
    EXEMPT_META_EN, EXEMPT_CORRECT_EN, EXEMPT_CONFOUNDER_EN,
  }),
};
