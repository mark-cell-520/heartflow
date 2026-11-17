/**
 * src/negative-existential-import.js — 「否定前提推存在」检测器
 * （第 260 个判别维度，r367 立项）
 *
 * [r367 立项] decision 本体在当前引擎（v6.8.189，259 维）上裁决
 * accelerate（philosophy_decision：type=accelerate / confidence 0.7 /
 * priority 40 / trigger optimal_conditions / goalReviewed=true；
 * cognitiveLoad 与 uncertainty 均为 "unknown"，按轮次纪律不当实质
 * 背书）。立项依据：
 *   · 缺口实证（scripts/round-367/probe-neg-existential.js，直调
 *     src/gate.js v6.8.189）：本族 10 条攻击样本中 **2 条真零命中**
 *     （gate.action=pass，零维度代拦）：
 *     A6「目前尚未发现外星生命，所以外星生命必定存在于我们看不到
 *     的维度。」；A7「没人反驳过这个观点，说明它已经被所有人接受
 *     了。」。其余 8 条虽非 pass，但归因维度是
 *     fallacy_of_relevance / reasoning_coherence / absolute_claim /
 *     illicit_conversion 等**代拦**，判的不是「否定/未发现前提→
 *     肯定存在结论」这一推论方向；且代拦只覆盖结论**绝对化**
 *     （就是对的/必然出自），对「必定存在于…」这种纯存在位移形
 *     （A6）与「被所有人接受」这种全称接受形（A7）完全无覆盖。
 *   · 外部来源（真实，未编造）：arXiv 2405.02318「Translating
 *     natural language to first-order logic for logical fallacy
 *     detection」（Lalwani et al.，HN Algolia 258 分，
 *     https://news.ycombinator.com/item?id=43257719）——框架 NL2FOL
 *     把自然论证形式化为 FOL 后用 SMT 求解器检验逻辑有效性，其
 *     LOGIC 数据集高频失效族之一即**否定前提的存在导入**：从
 *     「未观测到 X」/「无证据显示 X」推「X 必定存在于……」，在
 *     布尔解释下否定前提（¬∃x 观测(x)）与存在断言之间没有任何
 *     逻辑通道（观测失败 ¬Observe 不断言 ¬Exist）。GitHub 搜索
 *     （logical fallacy detection，sort=stars）最高 21★，全部为
 *     LLM 微调/推理方案，与心虫纯规则定位不符，无可参考实现。
 *     心虫判据为自有纯规则实现（零 LLM 依赖，不引入 FOL 求解器）。
 *     侦察落盘 /tmp/hf-scout-367/。
 *
 * 辨别的族：否定前提推存在（negative existential import / argument
 * from failed observation）——从**否定性或未发现的前提**（没人见过
 * X、没有证据显示、尚未发现、无人反驳、你说不出理由）推出**肯定性
 * 的存在或全称结论**（X 必定存在于……、它已经被所有人接受、所以
 * 它是对的、必定出自某种神秘机制）。否定命题（¬Observe、¬Evidence、
 * ¬Refute）不断言其补域的正面内容：没观测到不等于不存在，观测
 * 失败也不等于存在移位。结论必须**由该否定前提支撑**，且结论形状
 * 是存在/全称断言而非合规限定（「未被证实」是正当结论）。
 *   「没有人见过龙，所以龙一定存在于我们尚未探索的地方。」
 *   「从来没有人证明这个理论是错的，因此这个理论就是对的。」
 *   「你说不出反对的理由，说明这个方案是对的。」
 *   「没有科学家能解释这个现象，所以这一定是超自然力量造成的。」
 *   「没人反驳过这个观点，说明它已经被所有人接受了。」
 *   No one has ever seen a dragon, so dragons must exist beyond
 *   what we have explored.
 *   Nobody has refuted this theory, so it must be true.
 *
 * 与既有维度的边界（r367 归因，刻意错开）：
 *   · appeal_to_ignorance（第62维）管**举证责任分配**：I1 举证
 *     责任在场（你证明不了/拿不出反证）× I2 推定成立/照办/推广。
 *     本族管**推论方向**：否定/未发现前提→存在或全称结论，且
 *     结论段必须是存在/全称断言形状（必定存在于…/被所有人
 *     接受），不含「举证责任指向对方、对方须先自证」的倒置结构。
 *     探针实证：A6/A7 在 appeal_to_ignorance 在场时仍零命中
 *     （its I1 模式只认「你证明不了/拿不出反证」窄形，且 I2 只收
 *     「成立/照办/推广」兑换形，不收「必定存在于…」纯存在位移）。
 *   · existential_fallacy（第259维）管**肯定无存在承诺前提**
 *     （全称/条件/规范/定义）→存在结论；本族管**否定性前提**
 *     （无人见过/无证据/尚未发现/无人反驳）。两类前提在逻辑上
 *     互补（¬∃ 前提 vs vacuous-true 前提），结论侧共用存在断言
 *     形状但前提射程互斥（探针实证：A6/A7 在 existential_fallacy
 *     在场时仍零命中——其腿①四族均不收否定形）。
 *   · illicit_conversion / affirming_the_consequent /
 *     denying_the_antecedent 管条件句方向错误或换位；本族句中
 *     否定前提本身合法（真的没人见过），错的是从否定前提兑换
 *     存在/全称结论。
 *   · hasty_generalization 管证据不足的归纳；本族是**演绎形式
 *     无效**：否定前提为真而结论无据。
 *
 * 判据（双腿共现 + 邻近窗 + 豁免组，缺一不判）：
 *   · 腿① NEGATIVE_PREMISE 否定/未发现前提：观测否定（没人见过/
 *     看不见/听不到）、证据否定（没有证据/无证据显示/无法证实）、
 *     发现否定（尚未发现/至今没有发现/未被发现）、反驳否定
 *     （没人反驳/无人质疑/你说不出理由）、解释否定（没有科学家
 *     能解释/无人理解）。EN：nobody has seen / no evidence shows /
 *     has not been found / no one has refuted / cannot explain。
 *     **前提段不得带存在承诺词**（有些/有的/例如；EN some/there
 *     is）——带承诺的前提是非空域（豁免）。
 *   · 腿② AFFIRMATIVE_CONCLUSION 肯定存在/全称结论：结论段出现
 *     存在断言（必定存在/一定存在于/必然存在于/必有；EN must
 *     exist / must be out there）或全称接受断言（被所有人接受/
 *     人人都相信/就是对的/就是正确的；EN is accepted by
 *     everyone / must be true），且结论段跟在前提段之后（跟句
 *     模式）或带推断词前置（倒装模式）。
 *   · 邻近窗：前提段与结论段之间隔 ≤3 个子句。
 *   · 豁免（全部可负例注入置空）：EXISTENCE_COMMITMENT 前提带
 *     存在承诺、OBSERVATION 直接观察/经验报告（有正面观测支撑
 *     的存在结论）、META_CONCEPT 谬误概念转述与教学、TEACH 教学
 *     语境、HEDGE 对冲结论、COMPLIANT_CONCLUSION 合规限定结论
 *     （「未被证实」「不等于」——本维度保护的行为）、SCIENCE_
 *     CONDUCT 科学共同体的正当程序陈述（同行评审/可复现性）。
 *
 * 为什么取 VERIFY 级：否定前提下的结论偶然可能为真（龙可能真有、
 * 理论可能真对），错的是**推理形式**没给结论提供支撑；verify 的
 * 含义是「该结论缺少有效推理支撑，需补正面证据或独立论证」。
 */

'use strict';

// ─── 腿①：否定/未发现前提（中文，含裸名词形态；161 轮教训：
// 去后缀仍命中。长的在前，同类族可合并）
const NEG_PREMISE_ZH = [
  // 观测否定：没人见过/看不见/无人看见
  /(?:没有|没|无|未曾|从未|至今没有|迄今为止没有)(?:任何)?人?(?:曾经|曾|从来|至今|以前|过去)?(?:见过|看见|看到|目睹|观察[到过]|遇见|碰过|遇到)/,
  /(?:没人|无人|谁也没|没有人|从未有人|未曾有人)(?:能够|可以|得以|真正|亲自|直接)?(?:见到|看见|看到|目睹|遇见|观测[到过]?|检测[到过]?|探测[到过]?|记录[到过]?)/,
  // r367 补腿：「从来/至今没有人（真正）观测到/检测到」——副词+否定+人+动词组合
  /(?:从来|至今|迄今|到现在|到目前为止)(?:从未|未曾|还没有|未有|没有)(?:有人|人|人们)?(?:真正|亲自|直接|能够|可以)?(?:观测[到过]?|检测[到过]?|探测[到过]?|目睹|看见|看到|遇见|记录[到过]?)/,
  // 证据否定：没有证据/无证据显示/无法证实
  /(?:没有|没|无|缺乏|找不出|找不到)(?:任何|充分|直接|可靠)?(?:的)?(?:证据|凭据|实据|依据|数据)(?:来)?(?:表明|显示|说明|证明|支持)/,
  // r367 补腿：「没有任何研究/调查/试验显示」——研究类名词作证据主语
  /(?:没有|没|无|缺乏)(?:任何|充分|直接|可靠|足够)?(?:的)?(?:研究|调查|试验|实验|分析|报告|记录|文献|论文)(?:来)?(?:表明|显示|说明|证明|支持)/,
  // r369 补腿：「没有任何调查发现异常」——研究名词 + 发现/观测动词形
  // （r369 缺口实证 G1c：改前腿①只收「名词+表明/显示」，发现形整句穿透）
  /(?:没有|没|无|缺乏)(?:任何|充分|直接|可靠|足够)?(?:的)?(?:研究|调查|试验|实验|分析|报告|记录|文献|论文|监测|排查|审计|评估)(?:发现|注意到|观测到|记录到|检测到|揭示)/,
  /(?:无法|不能|没能|尚不能|未能)(?:被)?(?:证实|证明|验证|确证)/,
  // 发现否定：尚未发现/至今没有发现/未被发现
  /(?:尚未|还未|还没有|至今|迄今|到目前为止|迄今为止|从未|未曾)(?:被)?(?:发现|找到|找到过|探测到|观测到)/,
  /(?:没有|没|未)(?:被)?(?:找到|发现|探测到|观测到)(?:任何)?/,
  // r367 补腿：「至今没有人成功复现/重复/重现」——复现否定形
  /(?:至今|迄今|到目前为止|迄今为止|从未|未曾|还没有|未能)(?:没有|没能|未能)?(?:有人|人|研究者|科学家|团队|实验室)?(?:成功)?(?:复现|重复|重现|再现)(?:该|这|此)?(?:结果|实验|研究|发现|现象)?/,
  // r369 补腿：「从来没人能重复这个实验」——「从来+没人+能」动词序
  // （r369 缺口实证 G3b：改前腿①只收「从来没/从未有人」否定词前置形，
  //  「从来没人能+动词」序整句穿透）
  /(?:从来|向来|一向)(?:没人|无人|没有人|未曾有人)(?:能够|可以|得以|能)?(?:成功)?(?:重复|复现|重现|再现|验证|证实)/,
  // r369 补腿：「至今无人重现该效应」——「至今/至今无人+动词」形（无「有」字）
  /(?:至今|迄今|到目前为止|迄今为止|从未|未曾|从来)(?:无人|没人|没有人|未曾有人|无任何人)(?:能够|可以|得以|能)?(?:成功)?(?:重现|复现|重复|再现|验证|证实|观测|检测)/,
  // 反驳否定：没人反驳/无人质疑/说不出反对理由/没人能证明是错的
  /(?:没人|无人|没有任何人|没有人)(?:曾经|曾)?(?:能够|可以|得以|能)?(?:反驳|驳倒|推翻|质疑|否定|反对|证明(?:其)?(?:是)?(?:错|假|伪|不成立))(?:过)?/,
  /(?:至今|迄今|到目前为止|从未|未曾|从来)(?:没有|未|无)(?:人|任何人)?(?:能|能够|可以)?(?:反驳|驳倒|推翻|质疑|否定|反对|证明|证伪)/,
  /(?:你|你们)(?:说|讲|提)(?:不出|不出个|不到)(?:任何)?(?:反对|反驳|质疑|异议|反对)(?:的)?(?:理由|依据|道理|地方)/,
  // r369 补腿：「说不出/给不出反对的理由」——裸形（无第二人称主语）
  // （r369 缺口实证 G2a/G2c：「说不出反对的理由，说明这个方案是对的」
  //  改前腿①只收第二人称「你说不出」，裸主语形整句穿透；动词族扩
  //  说/讲/提/给/举/找/列，宾语扩理由/依据/道理/说法/论点）
  /(?:说|讲|提|给|举|找|列)(?:不出|不出个|不到)(?:任何)?(?:反对|反驳|质疑|异议)(?:的)?(?:理由|依据|道理|说法|论点|论据|证据)/,
  // 解释否定：没有科学家能解释/无人理解/无法解释
  /(?:没有|无)(?:任何)?(?:人|科学家|研究者|专家|学者)(?:能|能够|可以)?(?:解释|说明|理解|解开|破解)/,
  /(?:无法|不能|未能|尚不能)(?:被)?(?:解释|说明|理解|破解)/,
  /(?:没人|无人)(?:能|能够|可以)?(?:理解|看懂|弄明白)/,
];

// 英文：no one has seen / no evidence shows / has not been found /
// no one has refuted / cannot explain
const NEG_PREMISE_EN = [
  /\b(?:no\s+one|nobody|no\s+person|none|no\s+scientist|no\s+researcher)\s+(?:has\s+|have\s+)?(?:ever\s+|never\s+)?(?:been\s+)?(?:seen|observed|witnessed|found|refuted|disproved|disproven|explained|explains|understood|demonstrated|proven|shown|proved)\b/i,
  // r367 补腿：「no evidence of X has been found」——evidence 被动发现否定
  /\b(?:no|zero)\s+(?:evidence|proof|sign|trace|indication)\s+of\s+[^.]{0,40}?\s+(?:has\s+|have\s+)?(?:ever\s+)?(?:been\s+)?(?:found|discovered|observed|detected|seen)\b/i,
  /\b(?:no|zero)\s+(?:one|scientists?|researchers?|experts?|people)\s+(?:has\s+|have\s+)?(?:ever\s+|never\s+)?(?:seen|explained|refuted|shown|proved)\b/i,
  /\b(?:no|not\s+any|lack\s+of|absence\s+of)\s+(?:evidence|proof|data|support)\s+(?:has\s+been\s+|was\s+|is\s+)?(?:found|presented|shown|provided|offered)?\b/i,
  /\bhas\s+not\s+been\s+(?:found|observed|seen|detected|discovered|explained|refuted|proven|demonstrated)\b/i,
  /\bhas\s+(?:never|not)\s+been\s+(?:shown|proven|demonstrated|refuted|explained)\b/i,
  /\b(?:cannot|can'?t|could\s+not|couldn'?t)\s+(?:be\s+)?(?:explained|understood|proven|verified)\b/i,
  /\b(?:you|they|we)\s+(?:cannot|can'?t|could\s+not)\s+(?:prove|show|explain|refute)\b/i,
  /\bnobody\s+(?:has\s+)?(?:ever\s+)?(?:complained|objected|protested|refuted)\b/i,
  // r369 补腿：EN 主动复现否定「No one has ever reproduced/replicated」
  // （r369 缺口实证 G4b：改前腿① nobody 族动词表无复现动词）
  /\b(?:no\s+one|nobody|none)\s+(?:has\s+|have\s+)?(?:ever\s+|never\s+)?(?:replicat|reproduc|repeat|verif|confirm)\w*\b/i,
  // r369 补腿：EN 研究名词否定形「No study has shown / No evidence of X has been found」
  // （r369 单测失败实证：「No study has shown this drug to be harmful, so it must be safe」
  //  改前腿①只收 no evidence/no data 名词表，study/report 族缺位）
  /\bno\s+(?:study|studies|research|paper|papers|report|reports|experiment|experiments|trial|trials|analysis|analyses|meta-analysis|survey|surveys|data|evidence|record|records|literature)\s+(?:has|have)\s+(?:ever\s+|never\s+)?(?:shown|showed|found|demonstrated|indicated|reported|observed)\b/i,
  /\bno\s+(?:study|research|paper|report|experiment|trial|analysis|survey|data|evidence|record|literature)\s+of\s+[\w-]+(?:\s+[\w-]+)?\s+(?:has|have)\s+(?:ever\s+|never\s+)?been\s+(?:found|shown|demonstrated|reported|observed)\b/i,
  // r369 补腿：No + 施事者 + has ever + 复现动词（「No researcher has ever replicated」）
  /\bno\s+(?:researcher|researchers|scientist|scientists|lab|labs|laboratory|laboratories|team|teams|group|groups|one)\s+(?:has|have)\s+(?:ever\s+|never\s+)?(?:been\s+able\s+to\s+)?(?:replicat|reproduc|repeat|verif|confirm)\w*\b/i,
  // r369 补腿：「has never been replicated / has not been reproduced」
  // 被动复现否定形（r369 缺口实证 G4：改前腿①只收主动形 nobody/no one，
  // 被动主语 The study/This result 族整句穿透）
  /\b(?:has|have)\s+(?:never|not|hardly|barely)\s+(?:ever\s+)?been\s+(?:successfully\s+|independently\s+)?(?:replicat|reproduc|repeat|verified|confirm|proven|demonstrated)\w*\b/i,
];

// ─── 腿①：存在承诺词（前提段出现即豁免——非空域，合法推出存在结论）
const EXISTENCE_ZH = [
  /(?:有些|有的|某些|不少人|许多人|很多人|有人)/,
  /存在/, /(?:例如|比如|举例|举例说|譬如)/,
];
const EXISTENCE_EN = [
  /\bsome\b/i, /\bsomeone\b/i, /\bsomething\b/i,
  /\bthere\s+(?:is|are|exists?)\b/i, /\bexists?\b/i,
  /\bfor\s+(?:example|instance)\b/i,
];

// ─── 腿②：肯定存在/全称结论（中文，含裸名词与倒装形）────────────
// 存在断言形状（必定存在于…/必然存在于…/一定存在于…）
const EXIST_CONCL_ZH = [
  /(?:所以|因此|因而|故而|可见|可知|这说明|这表明|这就证明|足以证明|意味着|那就是|由此)[^。；，,]{0,30}?(?:必定存在|一定存在|必然存在|势必存在|肯定存在|确有|必有)/,
  /(?:必定|必然|势必|一定|肯定|只能)[^。；，,]{0,24}?(?:存在于|存在于|存在于|藏在|躲在|躲在|来自|出自)/,
  /(?:一定|必定|必然)[^。；，,]{0,20}?(?:有|存在于)/,
  /(?:可见|可知|这说明|这表明)[^。；，,]{0,30}(?:大有人在|不乏其人|比比皆是)/,
  // 全称接受断言形状（被所有人接受/人人都相信/就是对的）
  /(?:所以|因此|因而|可见|可知|说明|表明|这就证明|足以证明|意味着|那就是|由此)[^。；，,]{0,30}?(?:被所有人|被大家|被每一个|已被人人|人人都|所有人(?:都)?(?:接受|相信|认同|同意))/,
  // r367 补腿：「说明它已经被所有人接受了」——「被+经」插入形（体标记隔断）
  /(?:所以|因此|因而|可见|可知|说明|表明|这就证明|足以证明|意味着|那就是|由此)[^。；，,]{0,30}?(?:被[^。；，,]{0,6}?(?:所有人|每一个|人人|大家))(?:都)?(?:接受|相信|认同|同意)/,
  /(?:所以|因此|因而|可见|可知|这说明|这表明|这就证明|足以证明|意味着|那就是)[^。；，,]{0,30}?(?:就是对的|就是正确的|就是真的|即为真|成立|有效)/,
  // 倒装形（结论在前、前提在后作理由）：「这个理论就是对的，从来没人能证明它是错的。」
  // ——结论段在句首，无推断词引导，由腿①邻近窗保证逻辑关联（r367 失败实证：
  // 首版只收推断词前置形，倒装族零命中）。
  /(?:^|[。；;!！?？\n])(?:[^。；，,]{0,24}?)(?:就是对的|就是正确的|就是真的|即为真|是清白的|是正当的|是无辜的)/,
  /(?:^|[。；;!！?？\n])(?:[^。；，,]{0,24}?)(?:必定存在|一定存在|必然存在|势必存在|肯定存在)/,
  // r369 补腿：结论形「必定真实/确实存在/确有其事」——复现失败前提族
  // （r369 缺口实证 G3：「至今没有人成功复现这个结果，因此该结果必定真实」
  //  改前 gate.action=pass，腿①命中、腿②「必定真实」不在存在族也不在全称接受族）
  /(?:所以|因此|因而|可见|可知|说明|表明|这就证明|足以证明|意味着|那就是|由此)[^。；，,]{0,30}?(?:必定|必然|一定|肯定|确实|势必)[^。；，,]{0,12}?(?:真实|属实|确有其事|是真的|为真)/,
  // r369 补腿：裸「确实存在/真实存在」形（G3c「这说明效应确实存在」——
  //  无强断言副词前置，「确实」直接修饰存在动词）
  /(?:所以|因此|因而|可见|可知|说明|表明|这就证明|足以证明|意味着|那就是|由此)[^。；，,]{0,30}?(?:确实|的确|实有|确有)(?:存在|有过|发生过|是真的|属实)/,
  // r369 补腿：否定性全称结论族——否定前提推出**否定性**确定结论同样无效
  // （「没有任何研究显示有效，所以它一定是无效的」：没研究过不等于无效，
  //  ¬Evidence 不断言 ¬P。这是本族最被低估的形状——结论极性为负，易与
  //  「保护正当否定结论」的 COMPLIANT_CONCLUSION 混淆，故用「一定/必定」
  //  强断言词 + 推断词引导双条件收口，且 COMPLIANT 豁免整句先判不冲突）
  /(?:所以|因此|因而|可见|可知|说明|表明|这就证明|足以证明|意味着|那就是|由此)[^。；，,]{0,30}?(?:一定是|必定是|必然是|肯定是|势必是|确实是)[^。；，,]{0,16}?(?:无效|无用|假的|不成立|错误|安全|无害|合规|无风险|没有问题|没有危害)/,
  // r369 补腿：裸强断言否定结论（无「是」系词：「因此该结果必定虚假」）
  /(?:所以|因此|因而|可见|可知|说明|表明|这就证明|足以证明|意味着|那就是|由此)[^。；，,]{0,30}?(?:必定|必然|一定|肯定|势必)[^。；，,]{0,10}?(?:虚假|无效|不真|不实)/,
  // r369 补腿：裸强断言否定结论二形——「所以它必定无害/绝对没有问题」
  // （r369 单测失败实证：「没有试验显示有毒，所以它必定无害」的「必定无害」
  //  不在负极性词表；「他绝对没有问题」的「绝对」不在强断言词表）
  /(?:所以|因此|因而|可见|可知|说明|表明|这就证明|足以证明|意味着|那就是|由此)[^。；，,]{0,30}?(?:必定|必然|一定|肯定|势必|绝对)[^。；，,]{0,10}?(?:无害|无风险|合规|没有问题|没有危害|无效|无问题)/,
  // r369 补腿：裸强断言正面结论族——「必定正确/肯定是真的/一定可靠」
  // （r369 单测失败实证：G2 三条样本的结论形容词「正确/可靠/是真的」
  //  不在既有结论词表；否定前提推正面确定性结论同样无效）
  /(?:所以|因此|因而|可见|可知|说明|表明|这就证明|足以证明|意味着|那就是|由此)[^。；，,]{0,30}?(?:必定|必然|一定|肯定|势必|绝对)[^。；，,]{0,10}?(?:正确|可靠|是真的|成立|有效|可信|没错)/,
  // r369 补腿：裸可靠性/正当性结论族——无强断言词的「说明该模型是可靠的」
  // （r369 穿透实证：「说不出反对的理由，说明该模型是可靠的」腿①命中、
  //  腿②不命中——「可靠的」前无「必定/一定」，既有结论族全部要求强断言词。
  //  但「推断词引导 + 可靠性/正当性形容词结论」同样是从否定前提兑换
  //  确定性结论：说不出反对理由 ≠ 模型可靠。收口条件：必须由推断词引导
  //  （说明/表明/可见/证明等），且结论形容词限于可靠性/正当性族——
  //  「研究显示该方法安全有效，因此可以进入临床」这类有正面证据支撑的
  //  表述走 OBSERVATION 豁免，不会被误判）
  /(?:所以|因此|因而|可见|可知|这说明|这表明|这就证明|足以证明|意味着|那就是|由此|说明|表明)[^。；，,]{0,30}?(?:是|为)(?:可靠的|正确的|正当的|可行的|有效的|可信的|没有问题的)/,
  // 「他是清白的/无罪」形（否定证据前提→清白结论：证据缺失不等于无罪事实）
  /(?:所以|因此|因而|可见|可知|这说明|这表明|这就证明|足以证明|意味着|那就是)[^。；，,]{0,30}?(?:是清白|是无辜|并无罪|是正当|是有效|确实有效)/,
  // r367 补腿：裸「是对的/正确」形（「说明这个方案是对的」无「就是」加强，
  // 且推断词是裸「说明」而非「这说明」——r367 失败实证补裸推断词族）
  /(?:所以|因此|因而|可见|可知|说明|表明|这就证明|足以证明|意味着|那就是|由此)[^。；，,]{0,30}?(?:是对的|是正确的|是真实的|是没错的|并无问题)/,
  // r367 补腿：「所以这一定是超自然力量造成的」——超自然/神秘归因结论形
  /(?:所以|因此|因而|可见|可知|说明|表明|这就证明|足以证明|意味着|那就是|由此)[^。；，,]{0,30}?(?:一定是|必然是|肯定是|必定是|势必是)[^。；，,]{0,24}?(?:造成的|所致的|使然|的杰作|的力量|所为)/,
];

const EXIST_CONCL_EN = [
  /\b(?:so|therefore|thus|hence|then|which\s+means|this\s+proves)\b[^.]{0,60}?\b(?:must|has\s+to)\s+(?:therefore\s+)?(?:exist|be\s+out\s+there)\b/i,
  /\b(?:must|has\s+to)\s+(?:therefore\s+)?exist\b/i,
  /\b(?:must|has\s+to)\s+be\s+(?:out\s+there|somewhere|real|true|correct|valid)\b/i,
  /\b(?:so|therefore|thus|hence|this\s+proves)\b[^.]{0,60}?\b(?:is\s+accepted\s+by\s+everyone|everyone\s+accepts|everyone\s+believes|is\s+true|is\s+correct)\b/i,
  // r367 补腿：「which means it is accepted by everyone」——mean 族推断词
  /\b(?:which\s+means|meaning|proving|showing)\b[^.]{0,60}?\b(?:is\s+accepted\s+by\s+everyone|everyone\s+accepts|everyone\s+believes|is\s+true|is\s+correct)\b/i,
  // r369 补腿：genuine/authentic 结论族——「must be a genuine discovery」
  // （r369 缺口实证 G4a/G4c/G4d：EN 腿②只收 must be real/true/correct，
  //  genuine 族整句穿透）
  /\b(?:so|therefore|thus|hence|then|which\s+means|this\s+proves|proving|showing)\b[^.]{0,60}?\b(?:must|has\s+to)\s+(?:therefore\s+)?be\s+(?:a\s+)?(?:genuine|authentic|real|legitimate|bona\s+fide)\b/i,
  // r369 补腿：EN 裸「so it must be <adj>」形——「so it must be safe/harmless」
  // （r369 单测失败实证：腿② must be 族只收 real/true/correct/valid + genuine 族，
  //  形容词补语形整句穿透；含 safe/harmless 否定极性结论）
  /\b(?:so|therefore|thus|hence|then)\b[^.]{0,40}?\bit\s+(?:must|has\s+to)\s+(?:therefore\s+)?be\s+(?:a\s+)?[\w-]+/i,
  // r369 补腿：EN certainly/surely + 系词结论形
  // （「therefore it is certainly harmless」——修饰副词前置形）
  /\b(?:so|therefore|thus|hence|then|which\s+means|this\s+proves)\b[^.]{0,60}?\bit\s+is\s+(?:certainly|surely|definitely|absolutely)\s+[\w-]+/i,
  /\b(?:so|therefore|thus|hence|which\s+means|this\s+proves|proving|showing)\b[^.]{0,60}?\bit\s+is\s+(?:genuine|authentic|real|legitimate)\b/i,
  // r369 补腿：prove 族裸系词形——「which proves it is genuine」
  // （r369 缺口实证 G4c：腿② prove 族只收「must be」形，裸「it is genuine」穿透）
  /\b(?:which\s+proves|this\s+proves|proving|thus\s+proving|so\s+proving)\b[^.]{0,40}?\b(?:it|this|that)\s+(?:is|was)\s+(?:genuine|authentic|real|legitimate|true|correct)\b/i,
];

// ─── 豁免：直接观察/经验报告（有正面观测支撑的存在结论合法）──────
const OBSERVATION = [
  /(?:我看(?:到|见)|调查(?:显示|发现)|调研(?:显示|发现)|数据(?:显示|表明)|统计(?:显示|表明)|研究(?:发现|表明)|实验(?:证明|表明)|记录(?:显示|表明)|观测(?:到|发现)|观察(?:到|发现)|探测到|拍摄到|捕捉到)/,
  // r367 修复：原 /\b(?:I\s+)?(?:saw|see|observed|found|photographed|captured)\b/i 的
  // (?:I\s+)? 可选前缀使被动形「has been found」也被豁免，误杀了「no evidence ...
  // has been found」这类否定前提（VARIANT[6] 失败实证）。OBSERVATION 本意豁免
  // 第一人称主动观察报告，改为强制第一人称主语。
  /\bI\s+(?:saw|see|observed|found|photographed|captured)\b/i,
  /\b(?:data|survey|study|research|experiment|records?)\s+(?:show|shows|found|indicate|indicates|suggest|suggests)\b/i,
  /\baccording\s+to\b/i, /\breport(?:ed|s)?\b/i,
];

// ─── 豁免：谬误概念转述/教学（「诉诸无知是指…」不是犯谬误）──────
const META_CONCEPT = [
  /诉诸无知/, /举证(?:责任|倒置)/, /存在谬误/, /存在推论/,
  /argument\s+from\s+ignorance/i, /existential\s+fallacy/i,
  /illicit\s+subalternation/i, /vacuously\s+true/i,
  /形式逻辑/, /谓词逻辑/, /一阶逻辑/, /first[- ]order\s+logic/i,
];

// ─── 教学语境（只收句法性/动词性标记）──────────────────────────
const TEACH = [
  /例如/, /比如/, /举例/, /举个/, /例题/, /课本里/, /教材里/, /课堂上/, /课堂里/,
  /老师(?:说|讲|在)/, /学生(?:问|答|在)/, /作业里/, /习题/, /讲解/, /假设/, /设想/, /反例/,
  /(?:for|as an?)\s+example/i, /for instance/i, /suppose/i, /consider/i,
  /in (?:this|the) (?:lecture|class|textbook)/i,
];

// ─── 对冲结论——概率化/限定化的结论不作谬误判定
const HEDGE = [
  /可能/, /也许/, /大概/, /或许/, /未必/, /不一定/, /恐怕/, /看来/,
  /似乎/, /好像/, /估计/, /八成/, /倾向于/,
  /\bmaybe\b/i, /\bperhaps\b/i, /\bpossibly\b/i, /\bmight\b/i, /\bprobably\b/i,
  /\bit seems\b/i, /\bappears\b/i,
];

// ─── 合规限定结论：「不等于/不代表/不意味着/未被证实」是正当结论
// （本维度保护的行为——否定前提推出否定/存疑结论是正确的）
const COMPLIANT_CONCLUSION = [
  /(?:不能|无法|不足以|推不出|得不出|证明不了)[^。；，,]{0,24}?(?:存在|有)/,
  /(?:并非|不等于|不代表|不意味着|尚未|仍未|还不能)[^。；，,]{0,24}?(?:存在|有|接受|相信|成立)/,
  /(?:未被证实|尚未证实|没有证实|仍待|尚待|有待)[^。；，,]{0,16}?(?:证实|验证|确认)/,
  /(?:按|依照|依据)(?:无罪推定|疑罪从无)/,
  /(?:存疑|可信度|证据不足|不能证明)/,
  /\b(?:cannot|can't|does\s+not|doesn't|do\s+not|don't|not\s+necessarily)\b[^.]{0,40}\b(?:exist|there\s+(?:is|are)|true|proven)\b/i,
  /\bnot\s+(?:yet\s+)?(?:been\s+)?(?:proven|verified|confirmed|accepted)\b/i,
];

// ─── 科学共同体的正当程序陈述（同行评审/可复现性是程序而非谬误）
const SCIENCE_CONDUCT = [
  /同行评审/, /可复现/, /可重复/, /复现(?:结果|实验)/, /同行评议/,
  /匿名评审/, /盲审/, /实验设计/, /对照组/, /样本量/,
  /\bpeer\s+review/i, /\breproducib/i, /\breplicat/i, /\bcontrol\s+group/i,
  /\bsample\s+size/i, /\bpre[- ]?regist/i,
];

// 疑问句——提问不是存在断言。
function _isQuestion(text) {
  return /[?？]/.test(text) || /^(?:请问|试问|难道|是否|是不是|能不能|为什么|怎么)/.test(text.trim());
}

// [r367] 未命中返回值。引擎惯例：维度函数永不返回 null，未命中返回零分
// 对象（对照 src/existential-fallacy.js 的 _MISS）。
function _MISS() {
  return { hit: false, score: 0, detail: '', count: 0, name: 'negative_existential_import' };
}

// ─── 子句切分：中文按句内停顿（逗号/冒号/分号）与句末标点同级切分
// （「没人见过龙，所以龙必定存在于X」是逗号分句）；英文只按句末
// 标点切。与 existential-fallacy 同口径。
function _splitClauses(text, isEN) {
  const s = String(text || '');
  const segs = isEN
    ? s.split(/[.;!?\n]+|(?<=[.]) /).map(x => x.trim()).filter(Boolean)
    : s.split(/[。；;!！?？\n]+|(?<=[.]) |[，,：:]/).map(x => x.trim()).filter(Boolean);
  return segs;
}

// ─── 主检测函数。返回 { score, name, hit, detail, legs }（命中）或零分
// 对象（未命中）——**永不返回 null**。
// 负例注入测试通过把常量置空验证每条腿承重。
function checkNegativeExistentialImport(text) {
  const raw = String(text || '');
  if (!raw || raw.length < 8) return _MISS();
  if (_isQuestion(raw)) return _MISS();

  const isEN = /[a-zA-Z]{3,}/.test(raw) && !/[\u4e00-\u9fa5]/.test(raw);
  const segs = _splitClauses(raw, isEN);
  if (segs.length < 1) return _MISS();

  // 整句级豁免（先判，全部可负例注入置空）
  for (const re of META_CONCEPT) if (re.test(raw)) return _MISS();
  // OBSERVATION 豁免带否定守卫（r367 失败实证）：「从来没有人真正观测到」
  // 「无人观测到」等第三人称否定前提曾被 OBS[0]「观测到」误杀——OBSERVATION
  // 本意豁免第一人称观察报告（有正面观测支撑），否定前提形不属此列。
  // 守卫规则：豁免词前 12 字内出现「没有/没人/无人/从未/未曾/无/未」等
  // 否定词时，该豁免词不生效；EN 侧同理会话主语 no one/nobody/none。
  const OBS_NEG_CTX_ZH = /(?:没有|没人|无人|从未|未曾|未有|无|未|绝非)/;
  const OBS_NEG_CTX_EN = /\b(?:no\s+one|nobody|none|never|not|no|ever)\s*$/i;
  for (const re of OBSERVATION) {
    const om = raw.match(re);
    if (!om) continue;
    const ctx = raw.slice(Math.max(0, om.index - 12), om.index);
    if (OBS_NEG_CTX_ZH.test(ctx)) continue;
    if (isEN) {
      // EN 否定语境窗口扩至 40 字符：「no evidence of X has been found」中
      // 否定词 no 距豁免词 found 可超过 12 字符（r367 VARIANT[6] 失败实证）。
      const ctxWide = raw.slice(Math.max(0, om.index - 40), om.index);
      if (OBS_NEG_CTX_EN.test(ctx) || /\b(?:no|not|nobody|none|never|zero|without)\b/i.test(ctxWide)) continue;
    }
    return _MISS();
  }
  for (const re of TEACH) if (re.test(raw)) return _MISS();
  for (const re of HEDGE) if (re.test(raw)) return _MISS();
  for (const re of COMPLIANT_CONCLUSION) if (re.test(raw)) return _MISS();
  // SCIENCE_CONDUCT 豁免带否定守卫（r369 失败实证）：「至今没有人成功复现」
  // 「The study has never been replicated」是**复现失败的事实陈述**，不是
  // 「我们重视可复现性」的程序陈述——本维度要判的恰是这类前提。守卫规则：
  // 豁免词前 12 字（EN 40 字）窗内出现否定词时该豁免词不生效。
  // 与 OBSERVATION 守卫同口径，方向相反：OBS 守卫保护「第一人称观察」，
  // SCI 守卫剥掉「科学程序词误吞失败陈述」。
  const SCI_NEG_CTX_ZH = /(?:没有|没人|无人|从未|未曾|未有|无|未|难以|无法)/;
  const SCI_NEG_CTX_EN = /\b(?:no\s+one|nobody|none|never|not|no|zero|without|fail)/i;
  for (const re of SCIENCE_CONDUCT) {
    const sm = raw.match(re);
    if (!sm) continue;
    const ctx = raw.slice(Math.max(0, sm.index - 12), sm.index);
    if (SCI_NEG_CTX_ZH.test(ctx)) continue;
    if (isEN) {
      const ctxWide = raw.slice(Math.max(0, sm.index - 40), sm.index);
      if (SCI_NEG_CTX_EN.test(ctxWide)) continue;
    }
    return _MISS();
  }

  const NEGP = isEN ? NEG_PREMISE_EN : NEG_PREMISE_ZH;
  const EXISTENCE = isEN ? EXISTENCE_EN : EXISTENCE_ZH;

  // 腿①：找否定/未发现前提段。一个段只要含否定前提标记、且**前提
  // 标记之前**的文本不含存在承诺词，即是候选前提。
  // 同 existential-fallacy 口径：存在承诺只看到前提标记**之前**的
  // 文本，结论侧的肯定断言不污染前提资格。
  const premiseIdxs = [];
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    let premisePos = -1;
    for (const re of NEGP) {
      const pm = seg.match(re);
      if (pm) { premisePos = pm.index; break; }
    }
    if (premisePos === -1) continue;
    const before = seg.slice(0, premisePos);
    if (EXISTENCE.some(re => re.test(before))) continue;
    premiseIdxs.push(i);
  }
  if (premiseIdxs.length === 0) return _MISS();

  // 腿②：找肯定存在/全称结论段，且与某前提段距离 ≤3 子句（邻近窗）。
  // 倒装模式（结论在前、前提在后作理由）也覆盖。
  // 同 existential-fallacy：同段共现时要求前提标记与结论标记错开
  // 位置，同位置重合视为同语复述，豁免。
  const CONCL = isEN ? EXIST_CONCL_EN : EXIST_CONCL_ZH;
  let best = null;
  for (let ci = 0; ci < segs.length; ci++) {
    let conclMatched = null;
    for (const re of CONCL) {
      const m = segs[ci].match(re);
      if (m) { conclMatched = { re, idx: m.index }; break; }
    }
    if (!conclMatched) continue;
    for (const pi of premiseIdxs) {
      if (Math.abs(pi - ci) > 3) continue;
      if (pi === ci) {
        let premisePos = -1;
        for (const re of NEGP) {
          const pm = segs[pi].match(re);
          if (pm) { premisePos = pm.index; break; }
        }
        if (premisePos === conclMatched.idx) continue;
      }
      best = { premiseIdx: pi, conclIdx: ci, seg: segs[ci] };
      break;
    }
    if (best) break;
  }
  if (!best) return _MISS();

  const premiseSeg = segs[best.premiseIdx];
  const conclSeg = segs[best.conclIdx];

  // 结论族归类（供 detail 报告）
  const conclKind = /(?:被所有人|被大家|被每一个|人人都|所有人(?:都)?(?:接受|相信|认同|同意)|accepted\s+by\s+everyone|everyone\s+(?:accepts|believes))/.test(conclSeg)
    ? (isEN ? 'universal acceptance' : '全称接受')
    : (isEN ? 'existence claim' : '存在断言');

  return {
    score: 0.7,
    name: 'negative_existential_import',
    hit: true,
    detail: `否定前提推存在：否定/未发现前提（${isEN ? 'negative premise' : '无人见过/无证据/尚未发现'}）推不出${conclKind}——否定命题不断言其补域的正面内容，观测失败/证据缺失不等于对象不存在${isEN ? '(en)' : ''}`,
    legs: {
      premise: premiseSeg,
      conclusion: conclSeg,
      conclKind,
      windowGap: Math.abs(best.premiseIdx - best.conclIdx),
    },
    count: 1,
  };
}

module.exports = {
  checkNegativeExistentialImport,
  // 导出常量供负例注入测试逐条置空验证承重
  NEG_PREMISE_ZH, NEG_PREMISE_EN, EXISTENCE_ZH, EXISTENCE_EN,
  EXIST_CONCL_ZH, EXIST_CONCL_EN,
  OBSERVATION, META_CONCEPT, TEACH, HEDGE, COMPLIANT_CONCLUSION,
  SCIENCE_CONDUCT,
};
