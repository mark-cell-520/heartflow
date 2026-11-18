/**
 * src/significance-verdict-misread.js — 「显著性裁定误读」检测器
 * （r387 新建：econ_reasoning_gate 聚合族第 39 子族 / 插件层第 44 族，stats 组）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r387 立项探针（scripts/round-387/probe-candidates.js，v6.8.192 pristine 基线
 *   HEAD 56b31a0）：统计素养轴两族同池定拨——
 *     · 子族 1「边缘显著」族（borderline-as-effect）：20 条攻击穿透 **18/20**
 *       （gate=pass、零维度承重）。仅 2 条被代拦：zh[0]「结果接近显著水平
 *       （p = 0.06），说明干预措施确实有效」由 significance_effect_size（r250）
 *       以「显著性陈述 → 实质性裁定」代拦（sev 62），en[4] 由 vagueness 代拦。
 *     · 子族 2「不显著=无效应」族（nonsignificant-as-no-effect）：18 条攻击
 *       穿透 **14/18**。仅 4 条被 fallacy_of_relevance / mediator_confusion
 *       代拦（零归因、零 guidance）。
 *   两族为同一机制的两个方向：都把**一次统计检验的显著性结论**直接兑换成
 *   **确定性实质裁定**——一个把「差一点显著」讲成「效应存在」，一个把
 *   「不显著」讲成「效应不存在」。存量维度无一以「显著性结论 → 实质裁定」
 *   的**兑换结构本身**为射程（significance_effect_size 只收显式 p 值在场形，
 *   absence_of_problems 收工程检验阴性→无问题形），合并为一个子族落地。
 *   同池其余候选（p 值后验误读 / 置信区间误读 / 前置时间偏倚 / 时长偏倚 /
 *   Will Rogers / 赔率-概率 / 灵敏度-特异度）在 r386 已实测被存量维度全面
 *   代拦，本轮不复测。
 *
 * 外部来源（本轮海外扫描**有命中**，与 r386 全空返不同）：
 *   GitHub 检索 "p-value misinterpretation" / "confidence interval
 *   misinterpretation" 命中 Tessavana/Science_Scan（★1，规则式 + BERT/SciBERT
 *   双路线检测「non-significant p-value 统计误读」的学生研究项目）与其配套
 *   Tessavana/NLP-data 训练语料、Dekic648/significance-translator（把 p 值
 *   译成大白话并列出「你的结果不能说明什么」的常见误解清单）。已下载其规则式
 *   检测器的措辞表 Website/RuleBased Website/Nonsignificant incorrect2.xlsx，
 *   解出 **523 条**误读措辞（coordination/agent4/scout/nonsignificant-phrases.txt）：
 *     · 前 12 条为「无效应族」（No relationship / No difference / No effect /
 *       Not linked / No impact / Does not affect / No association / Not
 *       correlated …）——对应本模块子族 2 腿②；
 *     · 后 511 条为「边缘显著族」（Approaching significance / Marginally
 *       significant / A definite trend toward significance / Fell just short
 *       of significance / At the verge of significance …）——对应本模块子族 1
 *       腿①。
 *   该表由真实论文语料标注驱动，本模块的腿①/腿②常量以其为外部基准做了措辞
 *   覆盖度核对（511 条边缘显著措辞的动词-介词骨架全部落在 BORDER_EN 的 10 支
 *   正则射程内），但判据形状仍按心虫双腿共现范式自建（该 Python 项目是
 *   句内关键词命中，无「兑换结论」第二腿，直接照搬会把「结果边缘显著」这种
 *   正当报告句也判红）。
 *
 * 辨别的族：显著性裁定误读（statistical-significance verdict misread）——文本
 *   同时给出两个信号：
 *   子族 1 边缘显著→效应存在（borderline_significance，过claim方向）：
 *     腿①a BORDER 边缘显著标记在场（接近显著/边缘显著/几乎达到显著/趋向显著/
 *            趋势性显著/显著性的边缘；EN approached significance / borderline
 *            significant / marginally significant / fell just short of
 *            significance / trend toward significance）；
 *     腿②a CLAIM 效应存在结论在场（有效/更优/改善预后/存在真实效应/可以采信/
 *            支持假设；EN is effective / is superior / a real effect /
 *            supports our hypothesis）；
 *   子族 2 不显著→无效应（nonsignificant_no_effect，欠claim方向）：
 *     腿①b NONSIG 不显著标记在场（不显著/未达到显著/无显著性/p 值大于 0.05；
 *            EN not significant / no significant difference / failed to
 *            reach significance / p > 0.05）；
 *     腿②b NOEFFECT 无效应结论在场（没有差异/没有影响/不存在关系/毫无关联/
 *            无效/可以排除；EN no difference / no effect / does not affect /
 *            ineffective / can be ruled out）。
 *   两腿近距共现（以腿②为锚，腿①须落窗内：ZH 45 字 / EN 150 字符），且两腿
 *   之间须见推断标记（所以/说明/证明/意味着/可以认定；EN so / means /
 *   showing / proving）——裁定是由显著性结论**推出来的**，而不是把检验结果
 *   与结论并列陈述（「试验未达主要终点：p=0.12；两组生存率 60% 对 58%」是
 *   两个并列事实，无推断连接，不判）。
 *
 * 为什么良性边界因此干净（关键设计）：
 *   · 正当的报告句（「p=0.06 未达显著，我们报告为不确定」「The result was
 *     not significant and we report it as inconclusive」）腿②缺失——CLAIM 不
 *     收「不确定/未能拒绝」措辞，天然不判；
 *   · 概念教学（「不显著不等于没有效应」「边缘显著是一种常见的措辞包装」）
 *     由 CONCEPT 豁免（防「不显著≠无效应」前缀绕过，r368/r379/r386 同款教训）；
 *   · 正确对冲（「检验不显著，我们不能断定没有效应，可能是样本量不足」）由
 *     CORRECT 豁免；
 *   · 与 significance_effect_size（r250，显式 p 值 → 实质重要性）射程不重叠：
 *     本族不收显式 p 值在场为必要条件，「边缘显著」「趋向显著」这类无 p 值的
 *     措辞包装正是其漏判区；与 absence_of_problems（r184，工程检验阴性 →
 *     无问题）轴不同（本族锚统计显著性术语，不收测试/扫描/投诉类检验名词）；
 *     与 appeal_to_ignorance（第62维，举证责任分配）不论检验已执行的结果解读。
 *
 * 判据（两腿近距共现 + 推断标记 + 两组豁免 + 腿②守卫，缺一不判）：
 *   ① 腿①a BORDER 或 腿①b NONSIG 显著性结论标记在场；
 *   ② 对应腿②a CLAIM 或 腿②b NOEFFECT 实质裁定在场；
 *   ③ 两腿之间须见推断标记（限定性前缀后的连接词不算）；
 *   ④ 两腿须落在邻近窗内（以腿②为锚，ZH 45 字 / EN 150 字符），方向不限；
 *   ⑤ 豁免 A 概念讨论（显著性结论区别本身的教学/批评句）；
 *   ⑥ 豁免 B 正确对冲句（不能断定/不足以/样本量不足/未能拒绝原假设）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一项研究结果（「结果边缘显著，
 * 见表 3」——无推断连接，天然不判），命中的是把显著性结论直接兑换成实质
 * 裁定的断言。verify 的语义是「这段文本把一次统计检验的显著性结论当成了
 * 效应存在/不存在的证明，先把检验效力与结论口径对齐再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 正当报告句（未达显著，报告为不确定 / 未能拒绝原假设）——腿②缺失；
 *   · 并列实测发现无推断标记（p=0.12；两组生存率 60% 对 58%）；
 *   · 概念教学与批评句（不显著不等于没有效应 / 边缘显著是常见包装）——CONCEPT 豁免；
 *   · 正确对冲句（不能断定/样本量不足/检验效能有限）——CORRECT 豁免；
 *   · significance_effect_size / absence_of_problems / appeal_to_ignorance 领地。
 */

'use strict';

// ─── 腿①a BORDER 边缘显著标记（子族 1，过claim方向）──────────
// 中文：接近显著/接近统计显著/接近统计学意义、边缘显著/边缘性显著/边际显著、
//   几乎达到显著/近乎显著/勉强达到显著、趋向显著/趋于显著、趋势性显著/
//   趋势显著、显著性的边缘、处于…边缘、接近临界值。
// 注意「趋势显著」收紧邻形（不收「趋势，显著」带标点形），防「增长趋势，
//   显著高于去年」误触。
const BORDER_ZH = [
  /接近(?:统计学意义上?的?|统计学?|统计)?(?:显著|显著性|意义)/,
  /(?:边缘|边际)(?:性)?(?:的)?(?:统计)?显著/,
  /(?:近乎|几乎|将近|差一点|勉强|大致)(?:达到|接近|算是|属于)?(?:统计学?|统计)?显著/,
  /(?:趋向|趋于)(?:统计学?|统计)?显著/,
  /(?:趋势|倾向)(?:性)?(?:的)?(?:统计)?显著/,
  /(?:显著性|显著水平|显著阈值)(?:的)?(?:边缘|临界|边界)/,
  /(?:处于|位于|逼近|游走于|徘徊于|贴近)[^。！？，；\n]{0,8}(?:显著[性]?的)?(?:边缘|临界)/,
  /(?:接近|逼近|临近)[^。！？，；\n]{0,8}临界(?:值|水平|线)/,
];
// 英文：approached/approaching significance、borderline significant、
//   marginally significant、near-significant、fell just short of significance、
//   (just|narrowly|barely) missed/failed to reach … significance、
//   trend/tendency toward(s) significance、close to (being) significant、
//   (brink|verge|edge|cusp|fringe|margin|boundary) of significance、
//   did not (quite) reach/achieve/attain … significance。
// i flag：gate 路径文本经 text-normalizer 英文小写化（v6.7.73），大小写不敏感
//   才可达（r386 同款教训）。
const BORDER_EN = [
  /\bapproach(?:ed|es|ing)?\s+(?:statistical\s+)?significance\b/i,
  /\bborderline\s+(?:statistically\s+)?significant\b/i,
  /\bmarginally\s+significant\b/i,
  /\bnear(?:ly)?[-\s]significant\b/i,
  /\bfell\s+just\s+short\s+of\s+(?:statistical\s+)?significance\b/i,
  /\b(?:just|narrowly|barely)\s+(?:missed|missed\s+achieving|failed\s+to\s+reach|short\s+of)\b[^.]{0,40}\bsignificance\b/i,
  /\b(?:trend|tendency)\s+towards?\s+(?:statistical\s+)?significance\b/i,
  /\b(?:close|closely)\s+to\s+(?:being\s+)?(?:statistically\s+)?significan(?:t|ce)\b/i,
  /\b(?:brink|verge|edge|cusp|fringe|margin|boundary)\s+of\s+(?:statistical\s+)?significance\b/i,
  /\bdid\s+not\s+(?:quite\s+)?(?:reach|achieve|attain)\b[^.]{0,45}\bsignificance\b/i,
];

// ─── 腿①b NONSIG 不显著标记（子族 2，欠claim方向）────────────
// 中文：不显著/未达到显著/不具有显著性/无显著性/统计学意义不明显。
// p 值形单独拆出（PVALUE_ZH）——须验数值 ≥0.05 才算不显著锚（p = 0.03 是
// 显著结果，不能作不显著锚）。拆开是因为数值过滤只能作用于 p 值形，不能
// 连带把「不显著」这类无数值标记一起滤掉（r387 实现期实测：混在一张表里
// 会让 pvalueNonSig 把无小数位数的匹配全部判 false，子族 2 归零）。
const NONSIG_ZH = [
  /(?:不|未)(?:达到?|具有?|存在|构成|出现)?(?:统计学?的?|统计)?(?:显著|显著性)/,
  /(?:统计学?意义?|统计意义)(?:不|未)(?:明显|显著|存在)/,
];
const PVALUE_ZH = [
  /(?:p|P)\s*(?:值)?\s*(?:大于|高于|超过|>|＞)\s*0?\.\d+/,
  /(?:p|P)\s*(?:值)?\s*(?:=|＝)\s*0?\.\d+/,
];
const NONSIG_EN = [
  /\bnot\s+(?:statistically\s+)?significant\b/i,
  /\bno\s+significant\s+(?:difference|effect|association|relationship|impact|correlation)\b/i,
  /\bfailed\s+to\s+reach\s+(?:statistical\s+)?significance\b/i,
];
const PVALUE_EN = [
  /\b(?:p|P)\s*(?:-|—)?\s*value\s*(?:of\s*)?(?:exceeded?|greater\s+than|above)\s*0?\.\d+/i,
  /\bexceeded\s+(?:the\s+)?(?:0\.\d+|conventional\s+threshold)\b/i,
  /\b(?:p|P)\s*[>＞=]\s*0?\.\d+/,
];

// ─── 腿②a CLAIM 效应存在结论（子族 1）────────────────────
const CLAIM_ZH = [
  /(?:确实|显然|明明|的确)?(?:有效|起作用|有用|有效果|有作用|起了作用|发挥了作用)/,
  /(?:更优|更好|更佳|优于|胜过|领先于)/,
  /(?:改善|提升)(?:了)?(?:预后|疗效|效果|表现|结局|生存)/,
  /(?:存在|有)(?:真实的?|实际的?|真正的?)?效应/,
  /(?:真实|真正|实际)(?:的)?(?:效应|效果|作用)/,
  /(?:可以|能够|足以)(?:认定|采信|相信|认为|下定)/,
  /(?:支持|印证|佐证|验证|支撑)(?:了)?(?:我们|该|这一|这个|上述)?(?:假设|理论|预期|观点|结论|说法)/,
  /(?:方向)?(?:符合|印证|佐证)(?:预期|假设|设想)/,
  /(?:有理由|足以)(?:相信|认为|认定)/,
];
const CLAIM_EN = [
  /\b(?:is|are|was|were)\s+(?:effective|efficacious|beneficial|superior)\b/i,
  /\b(?:can|could)\s+be\s+(?:considered|regarded|deemed|judged)\s+(?:statistically\s+)?(?:effective|superior|better|significant)\b/i,
  /\b(?:works?|worked|functioned)\s+(?:well|as\s+intended|better)\b/i,
  /\bthe\s+(?:effect|intervention|treatment|drug|program|policy|vaccine)\s+(?:works|is\s+effective|is\s+beneficial)\b/i,
  /\b(?:real|true|actual|genuine|clear|definite|substantial|marked|strong|robust|reliable)\s+effect\b/i,
  /\bthe\s+effect\s+(?:is|was)\s+real\b/i,
  /\b(?:supports?|supporting|confirms?|confirming|validates?|validating|substantiates?|corroborates?)\b[^.]{0,60}\b(?:hypothes\w+|theor(?:y|ies)|prediction|expectation|claim|conclusion)\b/i,
  /\b(?:in\s+line\s+with|consistent\s+with|matches)\s+(?:our|the)\s+(?:hypothesis|theory|prediction|expectation)\b/i,
  /\b(?:the\s+)?(?:expected|predicted|hypothesised|hypothesized)\s+direction\b/i,
  /\bthe\s+direction\s+(?:supports|is\s+consistent\s+with|favours?|favors?)\b/i,
  /\b(?:improves?|improved|improving)\b[^.]{0,40}\b(?:outcome|survival|prognosis|performance)\b/i,
];

// ─── 腿②b NOEFFECT 无效应结论（子族 2）──────────────────
// 注意不收「没有显著差异 / no significant difference」——那是腿①b 的复述，
//   收进来会让「检验不显著，两组无显著差异」这种正当报告句误判。
const NOEFFECT_ZH = [
  /没有(?:任何)?(?:差异|区别|差别|不同)/,
  /没有(?:任何)?(?:影响|作用|效果|关联|关系|联系|功效|效应)/,
  /不(?:存在|构成)(?:任何)?(?:关系|关联|联系|差异|影响|效应)/,
  /毫无(?:关联|关系|联系|作用)/,
  /(?:不能|无法|不足以)(?:预防|阻止|降低|减少|改善)/,
  /(?:无效|不起作用|没有用|毫无用处)/,
  /(?:可以|应当|应该|足以|大可)(?:排除|否定|忽略|不予考虑|剔除)/,
  /(?:证明|说明|表明|意味着)(?:了)?(?:该|此|这|上述)?(?:疗法|药物|干预|方法|因素|疫苗|政策|措施)(?:完全)?(?:没有|无)(?:效果|作用|影响|功效)/,
];
const NOEFFECT_EN = [
  /\bno\s+(?:difference|effect|impact|association|relationship|correlation|benefit)\b/i,
  /\bnot\s+(?:affect|affecting|impact|impacting|influence|influencing|associated)\b/i,
  /\bdoes\s+not\s+(?:affect|impact|influence|work|help|change|improve|prevent|reduce)\b/i,
  /\b(?:ineffective|inefficacious|useless|no\s+benefit|no\s+value)\b/i,
  /\bcan\s+be\s+(?:ruled\s+out|excluded|dismissed|ignored|discarded)\b/i,
  /\b(?:rule|rules|ruled)\s+out\b/i,
  /\bthere\s+is\s+no\b/i,
];

// ─── 推断标记（裁定由显著性结论推出，而非并列陈述）───────────
// 限定性前缀（只/仅/仅仅；EN only/merely/just/simply）后面的连接词不算——
// 「不显著只说明样本不够，不等于没有效应」是正当表述。
const INFER_ZH = /(?:所以|因此|据此|可见|说明|表明|证明|意味着|足以|当然|显然|肯定|一定|反映出|体现出|足见|充分说明|充分证明|足以表明|足以证明|结论就是|就是说|毋庸置疑|毫无疑问|分明|就代表|代表着|据此可以|就可以|可以说|可以认为|可以认定|可以采信|可以断定|足以认定|足以相信|有理由相信|等于|相当于|提示|预示着|(?<![使倘若])即|方向(?:符合|一致|印证|佐证))/;
const INFER_EN = /\b(?:so|therefore|thus|hence|means|meaning|which\s+(?:means|proves|shows|supports?|suggests?|indicates?|confirms?|demonstrates?|implies?)|that\s+means|proves?|proving|shows?|showing|indicates?|indicating|demonstrates?|demonstrating|suggests?|suggesting|confirms?|confirming|implies?|establish(?:es|ing)?|concludes?|concluding|it\s+follows|this\s+shows|this\s+proves|clearly|obviously|giv(?:es|ing)\s+(?:us\s+)?reason|(?:and|but)\s+(?:in\s+)?the\s+(?:expected|predicted|hypothes\w+)\s+direction|(?:and|but)\s+the\s+direction\s+(?:supports?|favou?rs?))\b/i;

// ─── 距离窗（腿②为锚，腿①须落窗内）─────────────────
const WINDOW_ZH = 45;
const WINDOW_EN = 150;

// ─── 豁免 A：概念讨论（显著性结论区别本身的教学/批评句）─────
const CONCEPT_ZH = /(?:不显著|未达显著|未达到显著|无显著性|边缘显著|接近显著|趋向显著|趋势显著|显著性)[^。！？，；\n]{0,30}(?:不等于|并非|不代表|不意味着|不能|不可|不宜|不应|区别|区分|混淆|误读|误解|误区|错误|谬误|常见|典型|所谓|概念|定义|教学|讨论|包装|话术|委婉|托词)/;
const CONCEPT_EN = /\b(?:not\s+significant|no\s+significant|borderline|marginally\s+significant|approaching\s+significance|significance)\b[^.]{0,110}\b(?:does\s+not|doesn'?t|do\s+not|don'?t|is\s+not|are\s+not|cannot|can'?t|not\s+the\s+same|distinct\s+from|misread|misinterpret\w*|confus\w+|misconception|fallacy|common\s+mistake|mistaken|myth|weasel\w*)\b/i;

// ─── 豁免 B：正确对冲句（不能断定/不足以/样本量不足/未能拒绝）──
const CORRECT_ZH = /(?:未能|无法|不足以|不能|不宜|不应|并非|不等于|不代表|不意味着|很难|难以)[^。！？，；\n]{0,25}(?:断定|证明|排除|下结论|说明|认为|认定|确定|否定|排除掉)|(?:拒绝|推翻)原假设|(?:样本量|检验效能|功效|统计功效|把握度)(?:不足|偏低|有限|过小|不够|有限)|(?:不能|无法)(?:排除|否定)|(?:报告|表述|表述为|写成)(?:为)?(?:不确定|不明确|无法确定)/;
const CORRECT_EN = /(?:\b(?:cannot|can'?t|could\s+not|couldn'?t|does\s+not|doesn'?t|not\s+enough|insufficient|underpowered|low\s+power|limited\s+power|fails?\s+to\s+reject|null\s+hypothesis)\b[^.]{0,70}\b(?:conclude|prove|rule\s+out|mean|establish|show|determine|infer)\b|\breport\w*\s+(?:it|the\s+result|these\s+findings?)\s+as\s+(?:inconclusive|uncertain|unclear)\b|\bwe\s+(?:therefore\s+)?report\s+(?:the\s+result|it)\s+as\s+inconclusive\b)/i;

// 工具 ─────────────────────────────────────────────────────────
function allMatches(re, text) {
  const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = [];
  let m;
  while ((m = reG.exec(text)) !== null) {
    out.push({ idx: m.index, end: m.index + m[0].length, raw: m[0] });
    if (m.index === reG.lastIndex) reG.lastIndex++;
  }
  return out;
}

// p 值数值过滤：只把 ≥0.05 的 p 值当不显著锚（p = 0.03 是显著结果，不能作
// 不显著锚）。按数值真值判，不按小数位数判——r387 实现期实测按位数判会把
// "0.03"（两位、但 0.03 < 0.05）误放行，必须 parseFloat 后比 0.05。
function pvalueNonSig(m) {
  const num = m.raw.match(/(\d*\.\d+)/);
  if (!num) return false;
  const v = parseFloat(num[1]);
  return Number.isFinite(v) && v >= 0.05;
}

// 腿②守卫（r375/r377/r378/r379/r381/r385/r386 同款）：紧前否定窗（ZH 6 字 /
//   EN 20 字符，含否定即「并非更优/不等于无差异」纠正形）+ 对冲短语（腿②
//   前后出现「不意味着/误解/混淆」类）。两者均可负例注入证明承重。
const NEG_ZH = /(?:并不|并非|未必|不一|不|没|无)/;
const NEG_EN = /\b(?:not|never|hardly|cannot|can'?t|doesn'?t|don'?t|isn'?t|aren'?t|no)\b/i;
const HEDGE_ZH = /(?:不意味着|并不意味着|并不等于|不代表|不说明|不证明|误解|错误|谬误|不对|不成立|站不住|想当然|混淆|误区|误读|简单化|一刀切|偏离|误用|偏误|偏差|非理性|不可取|不应|忽略了|跳过|绝非|并不是)/;
const HEDGE_EN = /(?:misconception|mistaken|incorrect|wrong|fallacy|myth|confus\w+|bias|does\s+not\s+mean|doesn'?t\s+mean|misread|misinterpret\w*|irrational|shouldn'?t|ignores?|overlooks?|not\s+the\s+same)/i;

function matchAlive(text, x, opts, R) {
  opts = opts || {};
  if (opts.neg) {
    const negZh = (R && R.NEG_ZH !== undefined) ? R.NEG_ZH : NEG_ZH;
    const negEn = (R && R.NEG_EN !== undefined) ? R.NEG_EN : NEG_EN;
    const hedgeZh = (R && R.HEDGE_ZH !== undefined) ? R.HEDGE_ZH : HEDGE_ZH;
    const hedgeEn = (R && R.HEDGE_EN !== undefined) ? R.HEDGE_EN : HEDGE_EN;
    const negZhList = Array.isArray(negZh) ? negZh : [negZh];
    const negEnList = Array.isArray(negEn) ? negEn : [negEn];
    const hedgeZhList = Array.isArray(hedgeZh) ? hedgeZh : [hedgeZh];
    const hedgeEnList = Array.isArray(hedgeEn) ? hedgeEn : [hedgeEn];
    const beforeZh = text.slice(Math.max(0, x.idx - 6), x.idx);
    const beforeEn = text.slice(Math.max(0, x.idx - 20), x.idx);
    const afterZh = text.slice(x.end, x.end + 20);
    const afterEn = text.slice(x.end, x.end + 40);
    for (const re of negZhList) { if (re && re.test && re.test(beforeZh)) return false; }
    for (const re of negEnList) { if (re && re.test && re.test(beforeEn)) return false; }
    for (const re of hedgeZhList) { if (re && re.test && (re.test(beforeZh) || re.test(afterZh))) return false; }
    for (const re of hedgeEnList) { if (re && re.test && (re.test(beforeEn) || re.test(afterEn))) return false; }
  }
  return true;
}

function dedupeOverlap(arr) {
  const sorted = arr.slice().sort((a, b) => a.idx - b.idx || b.end - a.end);
  const out = [];
  for (const x of sorted) {
    if (out.some(k => x.idx < k.end && k.idx < x.end)) continue;
    out.push(x);
  }
  return out.sort((a, b) => a.idx - b.idx);
}

function collect(text, list, opts, R) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (opts && opts.pvalue && !pvalueNonSig(x)) continue;
    if (matchAlive(text, x, opts, R)) m.push(x);
  }
  return dedupeOverlap(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

// 注入 normalize：负例脚本可用空数组（删条）/永假正则（替换）注入常量；
// 默认值本身是 RegExp 或数组。统一成数组供消费（r385/r386 同款）。
function _normInject(x, def) {
  if (Array.isArray(x)) return x;
  if (x instanceof RegExp) return [x];
  if (Array.isArray(def)) return def;
  return [def];
}
function exempt(list, text) {
  for (const re of list) { if (re && re.test && re.test(text)) return true; }
  return false;
}

// 限定性前缀（腿①侧）：「只说明/仅表示」后面的连接词不是推断。窗口收到 15
//   字符——r387 实测 45 字符窗会把腿①自身携带的 "fell just short of
//   significance" 里的 "just" 误判成限定前缀，把该攻击形整个杀掉。
const RESTRICTIVE_BEFORE = /(?:只|仅|仅仅|只不|不过|充其量|仅只|顶多)[^。！？，；\n]{0,3}$/;
const RESTRICTIVE_BEFORE_EN = /\b(?:only|merely|just|simply|at\s+most)\s+(\w+\s){0,2}$/i;
function inferAlive(text, x, R) {
  const rb = (R && R.RESTRICTIVE_BEFORE !== undefined) ? R.RESTRICTIVE_BEFORE : RESTRICTIVE_BEFORE;
  const rbe = (R && R.RESTRICTIVE_BEFORE_EN !== undefined) ? R.RESTRICTIVE_BEFORE_EN : RESTRICTIVE_BEFORE_EN;
  if (rb.test(x.raw)) return false;
  const before = text.slice(Math.max(0, x.idx - 8), x.idx);
  if (rb.test(before)) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 15), x.idx);
  return !rbe.test(beforeEn);
}

// 签名收集：腿②实质裁定为锚（窗内），腿①显著性结论标记在场，两腿之间须见
// 推断标记（腿①在前或腿②在前均可）。两腿缺一不判。
// 子族 1：BORDER × CLAIM；子族 2：NONSIG × NOEFFECT。两族独立成签名，
//   互不代判（删一边锚只死对应子族，r386 C6 同款纪律）。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      sub1: { a: [..._normInject(R.BORDER_ZH, BORDER_ZH)], b: [..._normInject(R.CLAIM_ZH, CLAIM_ZH)], pv: [] },
      sub2: { a: [..._normInject(R.NONSIG_ZH, NONSIG_ZH)], b: [..._normInject(R.NOEFFECT_ZH, NOEFFECT_ZH)], pv: [..._normInject(R.PVALUE_ZH, PVALUE_ZH)] },
      infer: R.INFER_ZH != null ? R.INFER_ZH : INFER_ZH,
      win: R.WINDOW_ZH != null ? R.WINDOW_ZH : WINDOW_ZH, lang: 'zh',
    },
    {
      sub1: { a: [..._normInject(R.BORDER_EN, BORDER_EN)], b: [..._normInject(R.CLAIM_EN, CLAIM_EN)], pv: [] },
      sub2: { a: [..._normInject(R.NONSIG_EN, NONSIG_EN)], b: [..._normInject(R.NOEFFECT_EN, NOEFFECT_EN)], pv: [..._normInject(R.PVALUE_EN, PVALUE_EN)] },
      infer: R.INFER_EN != null ? R.INFER_EN : INFER_EN,
      win: R.WINDOW_EN != null ? R.WINDOW_EN : WINDOW_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const inferM = allMatches(L.infer, text).filter(x => inferAlive(text, x, R));
    if (inferM.length === 0) continue;
    for (const sub of [['borderline_significance', L.sub1], ['nonsignificant_no_effect', L.sub2]]) {
      const subName = sub[0], cfg = sub[1];
      // 腿①：文本标记 + p 值形（p 值形须过数值过滤）
      const aM = dedupeOverlap([
        ...collect(text, cfg.a, {}, R),
        ...collect(text, cfg.pv, { pvalue: true }, R),
      ]);
      if (aM.length === 0) continue;
      const bM = collect(text, cfg.b, { neg: true }, R);
      if (bM.length === 0) continue;
      for (const b of bM) {
        const a = aM.find(x => dist(x, b) <= L.win);
        if (!a) continue;
        // 推断标记须落在两腿之间（方向不限），或与腿②重合——「可以采信」
        // 「可以认为」这类结论短语同时充当连接词与结论（r387 实现期实测：
        // 「检验结果接近临界值，可以采信」两腿间无其他连接词，严格介于会把
        // 该攻击形漏掉）。与腿①重合不计（腿①标记本身不含推断词）。
        const between = inferM.find(x =>
          (x.idx >= a.end && x.end <= b.idx) ||
          (x.idx >= b.end && x.end <= a.idx) ||
          (x.idx <= b.end && x.end >= b.idx));
        if (!between) continue;
        sigs.push({ lang: L.lang, sub: subName, leg1: a.raw, leg2: b.raw, infer: between.raw });
      }
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.sub + '|' + s.leg1 + '|' + s.leg2;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * 显著性裁定误读签名：显著性结论标记 × 实质裁定 两腿近距共现，且两腿之间
 * 见推断标记。子族 1「边缘显著→效应存在」，子族 2「不显著→无效应」。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectSignificanceVerdictMisread(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念讨论（显著性结论区别本身是学术讨论）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：正确对冲句（不能断定/样本量不足/未能拒绝原假设）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const bothSubs = new Set(sigs.map(x => x.sub)).size >= 2;
  const score = bothSubs ? 0.72 : (sigs.length >= 2 ? 0.70 : 0.62);
  const subLabel = s.sub === 'borderline_significance'
    ? '边缘显著→效应存在'
    : '不显著→无效应';
  const subLabelEn = s.sub === 'borderline_significance'
    ? 'borderline-as-effect'
    : 'nonsignificant-as-no-effect';
  return {
    hit: true,
    dimension: 'significance_verdict_misread',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    sub: s.sub,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '显著性结论「' + x.leg1 + '」→ 实质裁定「' + x.leg2 + '」（推断标记「' + x.infer + '」，' + (x.sub === 'borderline_significance' ? '边缘显著→效应存在' : '不显著→无效应') + '）'
      : 'significance verdict "' + x.leg1 + '" -> substantive verdict "' + x.leg2 + '" (via "' + x.infer + '", ' + (x.sub === 'borderline_significance' ? 'borderline-as-effect' : 'nonsignificant-as-no-effect') + ')')),
    details: s.lang === 'zh'
      ? '显著性裁定误读(' + sigs.length + '处: 拿「' + s.leg1 + '」直接推出「' + s.leg2 + '」——' + subLabel + '，显著性结论不等于效应存在或不存在的证明)(zh)'
      : 'significance-verdict misread(' + sigs.length + 'x: "' + s.leg1 + '" directly converted into "' + s.leg2 + '" — ' + subLabelEn + ', a significance verdict is not proof an effect exists or does not)(en)',
    guidance: '显著性裁定误读（statistical-significance verdict misread）：把一次统计检验的显著性结论直接兑换成确定性实质裁定，两个方向都错。过claim方向——「结果边缘显著/接近显著/趋向显著，所以干预有效」：p 值差一点没过线，只说明「在现有样本下证据不足」，不说明「效应存在」，「趋势显著」「几乎达到显著」这类措辞包装（weasel words）不改变检验未过线的事实；欠claim方向——「p > 0.05，说明没有差异/没有影响/可以排除」：未达显著只说明「这次检验没能检出差异」，不说明「差异不存在」，功效不足、效应量小、测量噪声都会让真实差异检不出来。请先把检验效力与结论口径对齐再下裁定：报告确切的 p 值与置信区间（而不是「接近显著」）、说明检验效能与样本量、把结论限定在检验实际支持的范围（「本次检验未检出差异，不足以断定无效」）、需要下无效应结论时给出等效性检验（equivalence test）或置信区间上界，而不是拿单次不显著当证明。正确做法还包括：指出「不显著不等于没有效应」、说明「边缘显著」是常见的措辞包装、讨论功效不足导致假阴性的可能。若这段话只是并列陈述检验结果与实测数据（试验未达主要终点：p=0.12；两组生存率 60% 对 58%），那是正当的报告方式，无需修改。',
    tags: ['statistics', 'statistical-literacy', 'significance', 'p-value', 'weasel-words', 'absence-of-evidence', 'epidemiology', 'inference', 'judgment-and-decision-making'],
  };
}

module.exports = {
  detectSignificanceVerdictMisread,
  __internals: () => ({
    BORDER_ZH, BORDER_EN, NONSIG_ZH, NONSIG_EN, PVALUE_ZH, PVALUE_EN,
    CLAIM_ZH, CLAIM_EN, NOEFFECT_ZH, NOEFFECT_EN,
    WINDOW_ZH, WINDOW_EN,
    INFER_ZH, INFER_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    NEG_ZH, NEG_EN, HEDGE_ZH, HEDGE_EN,
    RESTRICTIVE_BEFORE, RESTRICTIVE_BEFORE_EN,
    findSignatures,
  }),
};
