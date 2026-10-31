/**
 * src/base-rate-neglect.js — 「基础概率忽视（基准率忽视）」检测器（第 169 个判别维度）
 *
 * [r171 立项] decision 本体在当前引擎（v6.8.98，168 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。探测器证据：本族攻击在当前引擎漏判（阳性信号×
 * 高置信度结论双腿在模式库无对应腿，见下「为什么现有维度拦不住」）。
 *
 * 辨别的族：基础概率忽视（base rate neglect / base rate fallacy）——拿**单个
 * 阳性信号或具体证据**直接下**高置信度后验结论**，却**无视基础概率/先验/
 * 患病率/假阳性率**，把「命中了」当成「就是它」：
 *   你检测呈阳性，所以你几乎肯定得了这个病。
 *   系统把你标记成匹配对象，这意味着你很可能是个骗子。
 *   他符合恐怖分子的画像，所以他八成是危险人物。
 *   测谎仪显示他在说谎，因此他显然是有罪的。
 *   筛查结果呈阳性，你铁定感染了病毒。
 *   The test came back positive, so you almost certainly have the disease.
 *   The algorithm flagged you, which means you're probably a fraud.
 *
 * 与既有维度的边界（r171 归因）：
 *   · appeal_to_probability（第 152 维）管**基数/重复/规模→一定发生**（宇宙
 *     这么大肯定有外星人），落点是「规模替代必然」；本族要件是**单个阳性
 *     信号在场**（阳性/标记/命中/画像匹配/测谎），结论指向**个体归属或状态**
 *     （得病/是骗子/有罪），不是事件必然发生。
 *   · selection_bias（第 168 维）管**受限样本→总体推广**（取样框问题）；本族
 *     全程可无样本、无数字，是**单点证据→个体结论**的后验更新错误。
 *   · confidence / absolute_claim 管**断言强度**（肯定/一定/毫无疑问），本族
 *     管**忽略基础概率的后验跳跃**，强度词可缺席而仍成立（「八成感染」）。
 *   · unsupported_claim 管**泛泛的无依据断言**，本族有**具体阳性证据在场**，
 *     错在证据→结论的跳跃未计基础概率，不是「无依据」。
 *
 * 判据（双腿共现，缺一不判）：
 *   · 腿① SIGNAL 阳性信号/具体证据（中英）：检测/筛查/检查阳性、被（系统|
 *     算法|风控）标记或预警、命中（名单|黑名单|数据库|档案）、符合/吻合/匹配
 *     （嫌疑人|画像|特征|指纹|DNA|profile）、测谎仪（显示|表明|测出）、被识别
 *     为匹配、人脸/指纹匹配；tested positive / flagged / matched the profile /
 *     fits the profile / polygraph showed / positive for / identified as a match。
 *   · 腿② CONFIDENT 高置信度后验结论（模态词×状态归属，中英）：几乎肯定/肯定/
 *     一定/显然/毫无疑问/很可能/必然/确定/八成/铁定/多半 + 得|患|感染|染上|
 *     确诊|是|有|属于|中招|罪|骗子|罪犯|嫌疑人|高危；almost certainly have /
 *     definitely has / most likely is / very likely guilty / clearly is /
 *     beyond doubt / so you probably have。
 *   · 缺腿不判：只有腿①（「你检测阳性，医生安排了复查」）是待确认的正确处置；
 *     只有腿②（「这事一定能成」）无论据来源，归 confidence/wishful_thinking。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人错误、医学/刑侦教学中的反例讲解、
 * 风险沟通里的背景陈述。verify 的含义是「这个后验结论忽略了基础概率，需要
 * 回到贝叶斯常识：阳性预测值取决于患病率与假阳性率」——调用方应要求补上基础
 * 概率、假阳性率或确证检测，而不是接受「命中即中招」的确定性跳跃。
 *
 * 明确不判的（豁免——这些是计及基础概率的正确陈述、待确认处置）：
 *   · 基础概率语言在场（基础概率/基准率/先验/患病率/发病率/假阳性率/真阳性/
 *     阳性预测值/贝叶斯/罕见/万分之…；base rate / prior / prevalence / false
 *     positive / positive predictive value / Bayes）：陈述概率原理或引述谬误
 *     概念（其名称必含「基础概率/base rate」字样）都是在破除或分析它，不是运用它；
 *   · 待确认/不妄断（需进一步确认/复查/排查/待确诊/不能据此断定/不足以确诊/
 *     只是初筛/还需要更多证据；not conclusive / needs confirmation / rule out
 *     / cannot conclude / a positive result alone）：没有跳到确定性结论。
 */
'use strict';

// ─── 腿① SIGNAL 阳性信号/具体证据（中文）──────────────────────────
// 锚「检测/筛查/标记/命中/画像匹配/测谎」等具体阳性证据，不限主语。
// 枚举腿自查（161 轮教训）：核心词取裸名词形态（阳性/标记/命中/画像/测谎），
// 同族词去后缀仍命中。
const SIGNAL_ZH = [
  // 检测/筛查/检查呈阳性（含裸「阳性」）
  /(?:检测|筛查|检查|血检|尿检|化验|样本|结果|试纸|试剂|核酸|抗原)?呈?阳性/,
  /阳性(?:结果|反应)?/,
  // 被系统/算法/风控/平台标记、预警、标注
  /(?:被|遭|受)?(?:系统|算法|机器|模型|风控|平台|软件|大数据|ai|AI)?(?:标记|标注|预警|预警命中|判为|列为|列入|识别为)/,
  // 命中名单/黑名单/数据库/档案/通缉
  /(?:被)?命中(?:名单|黑名单|红名单|观察名单|监控名单|重点名单|数据库|档案|通缉|在逃|布控)/,
  // 符合/吻合/匹配 嫌疑人/画像/特征/指纹/DNA/profile（允许 ≤6 字修饰间隔，
  // r171 教训：「符合在逃嫌疑人的画像」这类带修饰的不能因紧邻要求而漏判）
  /(?:符合|吻合|匹配)(?:了)?[^。，！？!?]{0,6}(?:嫌疑人|罪犯|特征|画像|图谱|档案|模板|指纹|声纹|DNA|样本|profile|侧写)/,
  // 测谎仪/测谎 显示、表明、测出、结果；通过测谎
  /(?:测谎|测谎仪|polygraph)(?:显示|表明|测出|结果|反馈|指)/,
  /(?:通过|过了)(?:测谎|测谎仪)/,
  // 被识别为（嫌疑/匹配/目标）；人脸/指纹/声纹识别匹配
  /(?:被)?识别为(?:嫌疑|匹配|目标|高危)/,
  /(?:人脸|指纹|声纹|虹膜|DNA)(?:识别)?匹配/,
];

// ─── 腿① SIGNAL 阳性信号/具体证据（英文）──────────────────────────
const SIGNAL_EN = [
  /(?:test|screen|scan|blood|lab)(?:ed|s)?\s+(?:came\s+back|was|were|is|are)?\s*positive/i,
  /tested\s+positive/i,
  /screened\s+positive/i,
  /(?:came\s+back|was|were|is)\s+positive/i,
  /positive\s+for\b/i,
  /\bflagged\b/i,
  /(?:the\s+)?(?:system|algorithm|model|software|engine|AI)\s+flagged/i,
  /(?:matched|matches|fit|fits)\s+the\s+(?:profile|suspect|description|fingerprint|template)/i,
  /(?:showed\s+up|came\s+up)\s+(?:as\s+)?(?:a\s+)?(?:match|hit)/i,
  /identified\s+as\s+a\s+match/i,
  /polygraph\s+(?:showed|indicated|detected|suggested)/i,
  /(?:hit|matched)\s+(?:on\s+)?(?:the\s+)?(?:watchlist|blacklist|database|no-?fly)/i,
];

// ─── 腿② CONFIDENT 高置信度后验结论（中文：模态词×状态归属）─────────
// 模态词几乎肯定/肯定/一定/显然/毫无疑问/很可能/必然/确定/八成/铁定/多半，
// 紧邻状态归属词（得/患/感染/染上/确诊/是/有/属于/中招/罪/骗子/罪犯/嫌疑人/
// 恐怖/间谍/作弊/高危）。归属词表在各模态路由保持一致（r171 教训：铁定路线
// 漏收「感染」导致「铁定感染了病毒」整句漏判）。
const CONFIDENT_ZH = [
  /(?:几乎|基本|大致)?肯定[^。，！？!?]{0,6}(?:得|患|感染|染上|确诊|是|有|属于|中招|罪|骗子|小偷|罪犯|嫌疑人|恐怖|间谍|作弊|高危|带上)/,
  /一定[^。，！？!?]{0,6}(?:得|患|感染|染上|确诊|是|有|属于|中招|罪|骗子|小偷|罪犯|嫌疑人|恐怖|间谍|作弊|高危|带上)/,
  /显然[^。，！？!?]{0,6}(?:是|有|得|患|感染|染上|确诊|属于|中招|罪|高危|带上)/,
  /毫无疑问[^。，！？!?]{0,8}(?:是|有|得|患|感染|染上|确诊|属于|中招|高危|带上)/,
  /(?:很|极|颇)?可能[^。，！？!?]{0,4}(?:是|有|得|患|感染|染上|确诊|属于|中招|罪|高危|骗子|罪犯|嫌疑人|间谍|带上)/,
  /必然[^。，！？!?]{0,6}(?:是|有|得|患|感染|染上|确诊|属于|中招|高危|带上)/,
  /(?:基本)?确定[^。，！？!?]{0,6}(?:是|有|得|患|感染|染上|确诊|属于|中招|高危|带上)/,
  /八成[^。，！？!?]{0,4}(?:是|有|得|患|感染|染上|确诊|属于|中招|高危|带上)/,
  /铁定[^。，！？!?]{0,4}(?:是|有|得|患|感染|染上|确诊|属于|中招|高危|带上)/,
  /多半[^。，！？!?]{0,4}(?:是|有|得|患|感染|染上|确诊|属于|中招|高危|带上)/,
  /(?:说明|意味着|足以证明|证明|可见)[^。，！？!?]{0,8}(?:你|他|她)?(?:几乎)?肯定/,
];

// ─── 腿② CONFIDENT 高置信度后验结论（英文）────────────────────────
const CONFIDENT_EN = [
  /(?:almost\s+)?certainly\s+(?:have|has|had|are|is|contracted|infected|a|the|guilty)/i,
  /(?:almost\s+)?definitely\s+(?:have|has|are|is|contracted|infected|a|guilty)/i,
  /most\s+likely\s+(?:has|have|is|are|a|the|guilty|contracted|infected)/i,
  /(?:very|highly|pretty|quite)\s+likely\s+(?:has|have|is|are|a|guilty|to\s+have|to\s+be)/i,
  /clearly\s+(?:has|have|is|are|guilty|a)/i,
  /obviously\s+(?:has|have|is|are|guilty|a)/i,
  /beyond\s+(?:a\s+)?(?:reasonable\s+)?doubt/i,
  /means\s+(?:you|he|she|they)(?:'re|\s+are)?\s+(?:almost\s+)?(?:certainly|probably|likely)/i,
  /so\s+(?:you|he|she|they)\s+probably\s+(?:have|has|are|is)/i,
  /it'?s\s+almost\s+certain/i,
  /no\s+doubt\s+(?:you|he|she)\s+(?:have|has|are|is)/i,
];

// ─── 豁免一：基础概率语言在场（计及基础概率 = 在破除/分析谬误）───────
// 注：谬误概念名（基础概率忽视/base rate fallacy）必含「基础概率/base rate」
// 字样，已被本豁免一并覆盖，故无需单列「概念引述」豁免（r171 注入测试实测
// 该单列豁免不承重、与本节冗余，已移除）。
const EXEMPT_BASERATE_ZH = [
  /基础概率|基准率|基础率|先验|患病率|发病率|流行率|带菌率|感染率/,
  /假阳性|假阳性率|真阳性|阳性预测值|阴性预测值|特异性|灵敏度|敏感度/,
  /贝叶斯|后验概率|人群基数|基础比/,
  /罕见|十万分之|万分之一|千分之一|百分之一|罕见病/,
  /(?:需要|要|得)?(?:结合|考虑|参考|计入)[^。]{0,6}(?:基础|先验|患病率|发病率|概率|假阳性)/,
  /(?:鉴于|考虑到|基于)[^。]{0,8}(?:患病率|基础|先验|概率|假阳性)/,
];
const EXEMPT_BASERATE_EN = [
  /base[\s-]?rate/i,
  /\bprior\b|\bpriors\b/i,
  /prevalence|incidence\s+rate/i,
  /false[\s-]?positive/i,
  /positive\s+predictive|negative\s+predictive|\bPPV\b|\bNPV\b/i,
  /Bayes|Bayesian/i,
  /sensitivity|specificity/i,
  /given\s+the\s+(?:low|rare|small|tiny)/i,
  /out\s+of\s+every|1\s+in\s+\d|per\s+[\d,]+\s+people/i,
];

// ─── 豁免二：待确认/不妄断（没有跳到确定性结论）───────────────────
const EXEMPT_NOOVERCLAIM_ZH = [
  /(?:需要|要|需|得|去|安排|做)(?:进一步|再次|重新|去|安排|做)?(?:确认|复查|复核|检测|检查|排查|随访|诊断|验证|排除)/,
  /进一步(?:确认|复查|复核|排查|诊断|检测)/,
  /待(?:确认|排查|复查|诊断|核实)/,
  /初筛|初步(?:筛查|检测|筛选|诊断)|筛查(?:只|仅)是/,
  /只是(?:一个)?(?:初筛|第一步|参考|线索|预警|标记)/,
  /不能(?:据此|单凭|仅凭|光凭|就此)(?:确诊|断定|下结论|判定|认定|定论)/,
  /不足以(?:确诊|证明|断定|判定|认定)/,
  /单凭[^。]{0,8}不能|不能确诊|不能说明|不能证明|不能断定/,
  /(?:还|仍)(?:需要|要|得)(?:其他|更多|进一步|额外)/,
  /只是线索|仅是线索|只是参考|仅是参考/,
  /证据(?:不足|不够|不充分)|需要更多证据/,
  /排除[^。]{0,4}(?:可能|嫌疑|嫌疑对象)/,
];
const EXEMPT_NOOVERCLAIM_EN = [
  /not\s+conclusive|inconclusive/i,
  /needs?\s+(?:further|more|additional|confirmatory)/i,
  /requires?\s+(?:further|confirmation|more|additional)/i,
  /(?:a\s+)?positive\s+(?:result\s+)?alone/i,
  /alone\s+(?:is|does|can'?t|cannot)/i,
  /cannot\s+conclude|can'?t\s+conclude/i,
  /rule\s+out|to\s+rule\s+out/i,
  /pending\s+(?:confirmation|further)/i,
  /follow[\s-]?up\s+(?:test|testing|scan|appointment)/i,
  /(?:only|just)\s+a\s+(?:first|initial|preliminary|first[\s-]pass)/i,
  /preliminary|initial\s+screen|first[\s-]?pass/i,
  /just\s+a\s+(?:lead|clue|start|flag)/i,
  /needs?\s+more\s+evidence/i,
  /isn'?t\s+(?:conclusive|enough)|not\s+enough\s+to/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkBaseRateNeglect(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const SIGNAL_ZH_ = R.SIGNAL_ZH || SIGNAL_ZH;
  const SIGNAL_EN_ = R.SIGNAL_EN || SIGNAL_EN;
  const CONFIDENT_ZH_ = R.CONFIDENT_ZH || CONFIDENT_ZH;
  const CONFIDENT_EN_ = R.CONFIDENT_EN || CONFIDENT_EN;
  const EB_Z = R.EXEMPT_BASERATE_ZH || EXEMPT_BASERATE_ZH;
  const EB_E = R.EXEMPT_BASERATE_EN || EXEMPT_BASERATE_EN;
  const EN_Z = R.EXEMPT_NOOVERCLAIM_ZH || EXEMPT_NOOVERCLAIM_ZH;
  const EN_E = R.EXEMPT_NOOVERCLAIM_EN || EXEMPT_NOOVERCLAIM_EN;

  // 基础概率语言在场 / 待确认不妄断 → 不是运用它
  if (anyHit(EB_Z, text) || anyHit(EB_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EN_Z, text) || anyHit(EN_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const signal = anyHit(SIGNAL_ZH_, text) || anyHit(SIGNAL_EN_, text);
  if (!signal) return { hit: false, score: 0, detail: '', count: 0 };
  const confident = anyHit(CONFIDENT_ZH_, text) || anyHit(CONFIDENT_EN_, text);
  if (!confident) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true,
    score: 0.58,
    count: 1,
    detail: isZh
      ? '基础概率忽视×阳性信号推高置信度结论(zh)'
      : 'base rate neglect×positive-signal-to-confident-conclusion(en)',
  };
}

module.exports = {
  checkBaseRateNeglect,
  __internals: () => ({
    SIGNAL_ZH, SIGNAL_EN, CONFIDENT_ZH, CONFIDENT_EN,
    EXEMPT_BASERATE_ZH, EXEMPT_BASERATE_EN,
    EXEMPT_NOOVERCLAIM_ZH, EXEMPT_NOOVERCLAIM_EN,
  }),
};
