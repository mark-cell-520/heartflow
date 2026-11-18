'use strict';
/**
 * [r736] 第 269 维度 claimed_verification_without_trail
 * 空核验宣称检测（claimed verification without trail）
 *
 * 缺口来源：reverify（2akouwu/reverify，1347★）的核心纪律——
 * "The model proposes; deterministic tools check every claim against ground
 * truth, and only what survives becomes a fact."（模型只提议；确定性工具
 * 逐条核验，只有通过核验的才成为事实）。规则引擎可判的对应缺口是：
 * 文本宣称一次核验已经完成（我亲自验证/团队核实/已实测/已被证实），
 * 却不给出任何核验轨迹（无来源、无数据、无复现路径），把「核验动作
 * 在场」本身当成了结论可靠的依据。
 *
 * 与既有维度区分：
 * - confidence：只管确定性措辞（无疑/必然/百分之百），不关心「谁验过」。
 * - unsupported_claim：管没有依据的断言；本族断言**自称有核验**，
 *   错在核验轨迹缺失而非依据整体缺失。
 * - evidence_claim_mismatch：管断言超出所引证据的覆盖范围；本族
 *   根本没有可引用的证据，只有一句「已经验过了」。
 * - weak_evidence_strong_claim：管证据强度与结论强度不匹配；本族
 *   不涉及任何证据，只涉及核验动作的空宣称。
 * - anonymous_source_claim：管来源不可指认；本族的来源在场（我/
 *   团队/实验室），缺的是核验轨迹而非来源身份。
 * - completion_evidence：管「已完成」的宣称缺完成证据；本族特指
 *   **核验/验证类完成宣称**（verify/checked/tested），射程更窄更深。
 *
 * 判据：双腿共现 + 邻近窗 + 三组豁免，缺一不判。
 * 腿① VERIFY_CLAIM 核验完成宣称——第一人称/机构主语 + 核验动词
 *      （验证/核实/实测/测试过/确认过/核查/检验/比对/复测/调研过；
 *       EN verified / checked / confirmed / tested / validated /
 *       cross-checked / reproduced）+ 完成体标记（了/过/已经/完成）。
 * 腿② TRAIL_ABSENT 无核验轨迹——句中不出现任何来源、数据、复现
 *      路径或方法学标记。用「轨迹缺失」反向判定：腿①命中后扫描全句，
 *      若同窗内无来源（来源/出处/数据/报告/编号/链接/论文/DOI/
 *      方法/样本/条件/复现/replicate/measurement/log/raw data…）即判。
 * 腿②不是正则命中，而是「腿①命中且全句无轨迹标记」这一状态，
 *      因此实现上写为 trailAbsent() 判定函数而非词表。
 *
 * 豁免三组：
 * ① 轨迹纪律语言在场——句中带来源/数据/方法/复现路径（见上），
 *    「已验证（见附录 A 的复现脚本与原始数据）」不判；
 * ② 核验动作被质疑/待补的元陈述——「尚未核验/无法验证/没法证实/
 *    需要验证/存疑/待确认/没有数据支撑」，作者正在指出缺口，不判；
 * ③ 核验/验证概念的教学转述——「可证伪/可复现/同行评审/科学方法/
 *    核验流程/验证实验设计/controlled experiment/RCT/peer review」
 *    概念讨论本身不判。
 *
 * 边界：本维度 verify 级——单句可能是合规披露转述、他人宣传话术
 * 引述、或作者正要批判该空核验宣称；verify 的含义是「这个核验宣称
 * 没有轨迹，需要补上来源/数据/复现路径才能采信」。
 */

// ---- 公共工具：句中计数（避开 matchAll 非全局正则回归，r265 教训）----
function _countMatches(text, re) {
  if (!text || !re || !re.global) return 0;
  re.lastIndex = 0;
  let n = 0;
  while (re.exec(text) !== null) {
    n++;
    if (re.lastIndex === 0) break; // 零宽匹配防挂死
    if (n > 50) break;
  }
  re.lastIndex = 0;
  return n;
}

// ---- 腿①：核验完成宣称 ----
// 主语标记：第一人称（我/本人/笔者/我们/咱）+ 机构/集体主语。
// 另含「零主语」形态：汉语广告语常省略主语（「实测有效」「经过实测」），
// 主语腿允许缺失——只要核验动词带完成体且句中无第三方主语（他说/
// 据称/网传），仍按第一人称核验宣称处理（r736 实测 7/13 漏判第三主因：
// 「经过实测，这款产品确实更好用」整族穿透）。
const SUBJECT_ZH = /(我|本人|笔者|我们|咱们|团队|小组|实验室|课题[组室]|公[司司]|项目[组组]|技术团队|研发团队|评测[组室]|测试团队)/;
// 第三方主语在场时，核验宣称归属于他人，本维度不判（归 anonymous_source_claim）。
// 写法纪律：身份主语 × 转述动词显式组合（专家声称/研究人员称/团队表示），
// 不写单字字符类——r736 首版写成「专家[称说表示]」，只匹配单字「专家称」，
// 「专家声称」「研究人员称」整族漏排除（实测 5/51 误报的主因）。
const THIRD_PARTY_ZH = /(他[人们说]?|她[人们说]?|它[们说]?|有人|据说|据称|网传|网友|坊间|传闻|听闻|听说|据报道|据.{0,4}(报道|透露|介绍|了解)|((?:专家|学者|研究人员|研究者|科研人员|团队|小组|公司|企业|机构|官方|政府|部门|调查|研究|实验|报告|消息|报道|文章|论文|商家|卖家|客服|第三方|知情人士|相关人士)(?:声称|宣称|表示|指出|显示|表明|发布|披露|通报|证实|确认|称|说))|宣传|广告)/;
const VERIFY_VERB_ZH = /(验证|核实|核查|核验|校验|实测|亲测|目测|测过|测试过|试过|检验|检测过|比对|复测|复现|调研过|审查过|审核过|确认|求证|验算|试验过|评测过|体验过|走访过|排查过|测试完毕|测试完成|检验完毕|检测完毕|验证完毕|核实完毕|核验完毕|排查完毕|验收|测完|验完|核完|(?:经过|通过|完成|做了|做完)[了过]?(?:测试|实测|验证|检验|评测|检测)|测试|检验|检测|评测)/;
// 完成体：显式完成标记（了/过/已经…）**或光杆核验动词本身**
// （亲测/实测/目测/试过——「亲测」在汉语广告语里就是「我测过了」的
// 压缩形，要求显式「了/过」会漏掉整族；r736 实测 7/13 漏判的第二主因）。
// 副词加强词（亲自/反复/逐条/确实）命中则加权而非必要条件。
const COMPLETION_ZH = /(了|过|已经|早已|亲自|目测|亲测|实测|亲口|亲身|逐一|逐条|逐项|一一|认真|仔细|反复|多次|已验证|已核实|已确认|已检验|已检测|已实验|已测试|已排查|已验收|已比对|已复现|已审查|已审核|已调研|已求证|已验算|已目测|已实测|已亲测|已完成|完毕|完成|测完|验完|核完)/;
// EN：主语 + 核验动词 + 完成体。同样允许零主语（"Tested and it works."）。
// 第三方主语在场不判（"He claims he verified it" 归 anonymous_source_claim）。
// 注意：THIRD_PARTY_EN **不收光杆 they/it**——EN 主语 "we" 之外的
// 代词歧义太大（"They validated it" 既可能是「他们宣称已验」也可能是
// 复述他人），只收明确转述标记（claims/says/reportedly/allegedly）。
// 机构主语 × 核验动词（"The study confirmed" / "Researchers verified"）
// 同样排除：那是对已发表研究结果的转述，不是第一人称空核验宣称。
const VERIFY_VERB_EN = /\b(verif(y|ied|ies|ying)|checked|checked out|checked on|cross-?check(ed)?|confirmed|tested|tested out|validated|validates|reproduced|replicated|fact-?checked|double-?checked|ran the numbers|crunch(ed)? the numbers|done testing|completed (?:the )?(?:test|testing|verification))\b/i;
const SUBJECT_EN = /\b(I|we|my|our|the team|our team|the lab|our lab|the group|we've|I've|we have|I have)\b/i;
const THIRD_PARTY_EN = /\b((?:he|she|they|the (?:team|company|vendor|seller|group|lab|study|report|paper))\s+(?:claims?|says?|said|states?|stated|reportedly|allegedly|purportedly|reportedly (?:confirmed|verified))|it is claimed|claimed to (?:have )?(?:be(?:en)? )?(?:verif|check|test|confirm|validat)|reportedly|allegedly|purportedly|according to (?:him|her|them|the (?:company|vendor|seller|team|lab|study|report))|the (?:company|vendor|seller|advertisement|ad|marketing) (?:claims?|says?|states?)|(?:the )?(?:study|studies|research(?:ers)?|paper|report|survey|poll)\s+(?:confirmed|verified|showed|shows|found|finds|demonstrated|validated|concluded))\b/i;
// EN 完成体：**核验动词过去式/完成式自身即是完成体**（"We verified it"），
// 不再要求 already/have 等显式助动词——否则整族简单过去时漏判（r736
// 实测 8/30 漏判主因）。
const COMPLETION_EN = /(already|have|has|had|'ve|just|personally|thoroughly|carefully|repeatedly|myself|ourselves|independently|verified|checked|confirmed|tested|validated|reproduced|replicated|fact-?checked|double-?checked|ran|crunch\w*)/i;

// ---- 腿②反向判定：核验轨迹标记 ----
// 注意纪律：**只收「轨迹动作」不收裸名词**。早期版本收过裸「数据/方法/
// 记录」，结果攻击句「我们团队核实过这个数据」里的「这个数据」被当成
// 轨迹证据误豁免（r736 实测 7/13 漏判的主因）。轨迹的判定标准是
// 「可供第三方复核的动作或载体」（报告编号/复现路径/存档/公示），
// 而不是句中出现了数据二字。
// EN 侧同样纪律：**不收裸 figures / reproduced**——"I cross-checked all
// the figures"（我核对过那些数字）恰是空核验宣称的典型句式，裸收 figures
// 会整族漏判；reproduce 也只在明示可复现语境（reproducible / can be
// reproduced / replication package）时才算轨迹证据。
// 「复核/复审」须带外部主语（请/委托/由/经/交）才是轨迹动作——
// 「我们反复核验」里的「核验」是腿①核验动词，不是轨迹证据，
// 故不收光杆「复核」（r736：该句曾被误豁免）。
const TRAIL_MARKERS = /(来源|出处|引自|据.{0,8}(报告|论文|统计|公布)|参考|参见|详见|附录|附上|数据来源|原始数据|数据集|编号|链接|网址|DOI|ISBN|样本量|方法论|实验设计|对照组|盲法|随机对[照照]|可复现|复现(?:脚本|路径|流程|实验)|重复实验|日志|留档|存档|出处可查|有据可查|可查证|供[核查检]|抽[查检]|(请|委托|由|经|交|送).{0,4}(复核|复审|审核)|同行评[审议]|第三方[机验检]|独立[机验检]|公[布开]|披露|公示|存档于|记录在|源码|代码仓|commit|哈希|签名|证据|证明文件|检测报告|认证[书号]|合格[证号]|license|LICENSE)/;
const TRAIL_MARKERS_EN = /\b(source|sources|cited|citation|reference|references|see|appendix|data source|raw data|dataset|doi|isbn|url|link|sample size|methodolog\w+|experiment(?:al)? design|control group|blinded|randomi[sz]ed|reproducible|reproducibility|can be reproduced|replication package|replicate the (?:results?|findings?|experiment)|logs?|archiv\w+|verifiable|audit\w*|peer[- ]review\w*|third[- ]party|(?:verified|checked|tested|validated|audited) by (?:a )?third[- ]party|independently (?:replicated|reproduced|audited)|published|disclos\w+|transparen\w+|available at|checklist|repository|repo|github|commit|hash|checksum|measurements?|table \d+|equation|supplementary)\b/i;

// ---- 豁免②：核验动作被质疑/待补 ----
// 否定守卫（EN）必须覆盖 not / n't / never / yet / awaiting：
// "We have not tested this yet" 是**未核验**陈述，不是空核验宣称
// （r736 实测 4/71 误报全为否定式漏守卫）。
// 纪律：本腿必须覆盖「待执行/义务形」核验——「这笔交易触发了反洗钱规则，
// 需要人工核查。」里「核查」是尚未执行的合规动作而非已完成核验宣称，
// r399 双向门禁垂直场景 149/150 抓到的唯一误伤即此形：句中无主语（零主语
// 形态腿①放行）+「需要」不在旧表（旧表只有 需要核[验实] 的紧邻形，
// 「需要人工核查」中间隔「人工」不匹配）。故本腿收两类形：
// ① 显式待办/义务标记（需要/须/应/待/有待/尚待/尚未/未能/无从/必须）与
//    核验动词同窗共现（不限紧邻，窗内即免——「需要先做人工核查再放行」）；
// ② 合规/流程义务语境（触发.*规则/涉嫌/可疑/风险控制/合规/反洗钱/
//    人工复审/提交.*审批/放行前）——整句是制度动作描述，不是效果宣称。
// 不收裸「要」——「我要亲自验证」是第一人称完成宣称的攻击句式。
const QUESTIONED_ZH = /(尚未核[验实]|未核[验实]|无法核[验实]|没法核[验实]|不能核[验实]|有待核[验实]|需要核[验实]|需要验证|数据存疑|存疑|待确认|未确认|未能证实|无法证实|没有数据支撑|缺乏依据|无从考证|无法考证|无从查证|口说无凭|空口无凭|不足为凭|不足为证|没有凭据|还没有|并未|未曾|未经过|有待验证|尚待验证|尚待证实|[仍尚还]需[验证实]|[仍尚还]待[验证实]|[仍尚还]未[验证实]|(?:需要|须要|需要先|必须先|必须|应当|应该|应|须|待|有待|尚待|等待|提请|申请|提交|转交|交由|安排|计划|拟|准备)(?:[^。；，]{0,12})?(?:核[验实查]|检验|检测|排查|复审|审核|审查|验证|求证|比对|复测|复现|调研|确认)|反洗钱|可疑交易|涉嫌|风险控制|合规(?:审查|审核|检查|要求)?|人工复审|提交.{0,6}审批|放行前)/;
const QUESTIONED_EN = /\b(not yet (?:verified|checked|confirmed|validated)|not (?:yet )?(?:verif\w+|check\w*|test\w*|confirm\w*|validat\w+|reproduc\w+)|(?:haven|hasn|isn|aren|wasn|weren|don|doesn|didn|couldn|wouldn|shouldn)[']?t (?:been )?(?:verif\w+|check\w*|test\w*|confirm\w*|validat\w+|reproduc\w+)|never (?:verif\w+|check\w*|test\w*|confirm\w*|validat\w+)|have (?:not|n['']?t) been|has (?:not|n['']?t) been|awaiting (?:verif\w+|confirmation|validation|replication)|await\w* (?:independent )?(?:verif\w+|replication|confirmation)|still (?:awaiting|pending|unverified)|remains? (?:to be )?(?:unverified|unconfirmed|untested|unproven)|lacks? (?:verif\w+|evidence|support)|without (?:verif\w+|evidence|support)|insufficient evidence|unsubstantiated|unproven|no proof|unverified|unconfirmed|untested)\b/i;

// ---- 豁免③：核验/验证概念的教学转述 ----
// 纪律：概念词腿**不收 reproduce/replicate/verify 这类同时也是核验动词的词**——
// 「我们复现了实验」正是本维度的攻击句式，收进教学腿会整族漏判
// （r736 实测：首版收 reproduc\w+ 导致 "We reproduced the experiment"
// 被误豁免）。只收名词性概念/教学语境词（falsifiability、methodology、
// controlled experiment、textbook、lecture）。
const PEDAGOGY = /(可证伪|可否证|可复现性|可重复性|可验证性|实证(方法|精神|主义)|科学方法|研究方法|方法论|核验流程|验证流程|验证实验|对照实验|随机对[照照]|同行评[审议]|双盲|可检验|可否证|假设检验|实验设计|统计方法|抽样方法|谬误|案例教学|反例|典型错误|教学|教材|课堂|讲义|论文|课程|举例|示例|剖析|复盘|盲测)/;
const PEDAGOGY_EN = /\b(falsifi\w+|peer[- ]review\w*|scientific method|research method\w*|methodolog\w+|verification process|validation (?:process|procedure)|controlled (?:experiment|trial)|randomi[sz]ed|double[- ]blind|experimental design|hypothesis test\w*|statistical method\w*|sampling method\w*|fallacy|fallacies|case study|for example|for instance|illustrat\w+|textbook|lecture|course|syllabus|teaching|pedagogy|blind test)\b/i;

const WINDOW = 120; // ZH 邻近窗（字符）
const WINDOW_EN = 240; // EN 邻近窗（字符）

/**
 * 判定一次空核验宣称。
 * @param {string} text 归一化后的文本
 * @returns {{score:number, hits:number, severity:number,
 *            details:string, subFamilies:string[]}}
 */
function checkClaimedVerificationWithoutTrail(text) {
  const t = typeof text === 'string' ? text : '';
  if (!t) return { score: 0, hits: 0, severity: 0, details: '', subFamilies: [] };

  let hits = 0;
  const subFamilies = [];
  let zhHit = false;
  let enHit = false;

  // ---- 豁免全句早退（三组任一命中即不判）----
  if (QUESTIONED_ZH.test(t) || QUESTIONED_EN.test(t)) {
    return { score: 0, hits: 0, severity: 0, details: '', subFamilies: [] };
  }
  if (PEDAGOGY.test(t) || PEDAGOGY_EN.test(t)) {
    return { score: 0, hits: 0, severity: 0, details: '', subFamilies: [] };
  }
  // 豁免①：轨迹纪律语言在场——有来源/数据/复现路径，不判
  if (TRAIL_MARKERS.test(t) || TRAIL_MARKERS_EN.test(t)) {
    return { score: 0, hits: 0, severity: 0, details: '', subFamilies: [] };
  }

  // ---- 腿① ZH：主语 × 核验动词 × 完成体 ----
  // 主语腿三种形态：第一人称主语在场 / 零主语（广告语省略）/ 第三方主语（不判）。
  if (!THIRD_PARTY_ZH.test(t)) {
    const vCount = _countMatches(t, new RegExp(VERIFY_VERB_ZH.source, 'g'));
    if (vCount > 0 && COMPLETION_ZH.test(t)) {
      const subM = SUBJECT_ZH.exec(t);
      const verbM = VERIFY_VERB_ZH.exec(t);
      const nearWindow = subM && verbM
        ? Math.abs(subM.index - verbM.index) <= WINDOW
        : true; // 零主语：主语缺失时不受邻近窗约束
      if (nearWindow) {
        hits++;
        zhHit = true;
        subFamilies.push('zh_first_person_verification');
      }
    }
  }

  // ---- 腿① EN：主语 × 核验动词 × 完成体 ----
  if (!THIRD_PARTY_EN.test(t)) {
    const vCount = _countMatches(t, new RegExp(VERIFY_VERB_EN.source, 'gi'));
    if (vCount > 0 && COMPLETION_EN.test(t)) {
      const subM = SUBJECT_EN.exec(t);
      const verbM = VERIFY_VERB_EN.exec(t);
      const nearWindow = subM && verbM
        ? Math.abs(subM.index - verbM.index) <= WINDOW_EN
        : true; // 零主语（"Tested and it works."）
      if (nearWindow) {
        hits++;
        enHit = true;
        subFamilies.push('en_first_person_verification');
      }
    }
  }

  if (hits === 0) {
    return { score: 0, hits: 0, severity: 0, details: '', subFamilies: [] };
  }

  // 腿②（TRAIL_ABSENT）已在豁免①处完成反向判定：能走到这里说明
  // 腿①命中且全句无任何核验轨迹标记。

  let score = 0;
  let severity = 0;
  if (zhHit && enHit) {
    score = 0.82;
    severity = 82;
  } else if (hits === 1) {
    score = 0.72;
    severity = 72;
  }
  const details = '空核验宣称(' + hits + '处: ' + subFamilies.join(',') +
    '；宣称完成核验但句中无来源/数据/复现路径等核验轨迹)';

  return { score, hits, severity, details, subFamilies };
}

module.exports = {
  checkClaimedVerificationWithoutTrail,
  // 常量导出供负例注入测试逐项验证承重（r736）
  SUBJECT_ZH, THIRD_PARTY_ZH, VERIFY_VERB_ZH, COMPLETION_ZH,
  VERIFY_VERB_EN, SUBJECT_EN, THIRD_PARTY_EN, COMPLETION_EN,
  TRAIL_MARKERS, TRAIL_MARKERS_EN,
  QUESTIONED_ZH, QUESTIONED_EN, PEDAGOGY, PEDAGOGY_EN,
  WINDOW, WINDOW_EN,
};
