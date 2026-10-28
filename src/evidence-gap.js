/**
 * src/evidence-gap.js — 「证据缺口」检测器（evidence 维度的真判别逻辑）
 *
 * [r734 立项] 候选来源：交接簿（data/upgrade-state.json r733 笔记）候选池第 1 位，
 * 「evidence 维度基线打分器恒返回 {score:1, issues:[]}」。**本轮未经 decision 本体
 * 打分**——是我复测后判定的，不是心虫选的。
 *
 * 轮初复测（require('./src/gate.js').gate，378 条语料全量实测，探针
 * scripts/tmp-734-evidence-baseline.js）：
 *   · gate 输出里 dimension === 'evidence' 的 finding：**378 条样本 0 条**
 *   · 四份语料的 gate.action 分布：pass 302 / verify 21 / rewrite 27 / block 28
 * 根因不是「阈值设错了」，而是打分器**根本不看文本**：
 *
 *   src/index.js checkEvidence(claim, evidence)：
 *     score = (evidence && evidence.length > 0) ? 0.5 : 1.0
 *     if (claim.length < 5) score -= 0.2
 *     if (evidence.length > 0) score += min(0.3, len*0.1)
 *   → 而 discriminate(text, evidence = []) 的默认值是**空数组**，pipeline 全链路
 *     从不传 evidence。于是 score 恒为 1.0（claim≥5 字符时）或 0.8（claim<5），
 *     issues 恒为空数组，index.js:2941 的 `if (ev.score < 0.25)` **自 v6.7.73
 *     起一次都没成立过**。160 个维度里有 1 个是纯装饰。
 *
 * 为什么不能直接把 evidence 接进 overallScore 的惩罚组：index.js:2216 明确写着
 * 「证据维度 polarity 相反（高分=好），不在惩罚组」，而 allDims 里确实没有
 * evidence。**这一点与交接簿的记载相反**——r733 笔记说「动它影响 overallScore<0.85
 * 判 verify 的全局阈值」，实测不成立：evidence 不在 allDims，overallScore 与它
 * 无关。真正会受影响的只有 findings（`ev.score < 0.25` 那一支）与
 * `findings.length > 1 → verify` 这一条间接路径。本轮按实测口径重写，不再沿用
 * 那条过时的顾虑。
 *
 * ─── 判据 ───────────────────────────────────────────────────────
 * 本维度回答的是一个**链级**问题，与 unsupported_claim 的**短语级**问题互补：
 *
 *   unsupported_claim：「这句话里有没有无依据断言的句式？」（研究表明…/具体数字
 *     断言/全称扫荡，命中即 verify）
 *   evidence          ：「全文的可验证断言，有没有任何一条拿到证据支撑？」
 *     （支① DEMAND 有断言 × 支② SUPPLY 无证据标记，两腿同时成立才判缺口）
 *
 * 为什么 DEMAND 腿必须收得极窄（这是本轮最难的一处，见 UPGRADE_LOG 六·踩坑）：
 * 轮初把「带数字的断言」直接当 DEMAND 试跑，vertical-benign-benchmark 的 150 条
 * 专业域良性陈述（金融/医疗/法律/教育/客服/安全）成片命中——
 * 「逾期 90 天以上的贷款要计提坏账准备」「传染病报告须在 24 小时内上报」
 * 「安全基线检查项一共 42 条」。这些是**规则/读数/日程陈述**，不是需要外部证据
 * 的经验断言。逐条归因后抽出四类必须排除的框架：
 *   ① 规范性（须|必须|应|需要|要求|按|规定|安排 / must|should|required）——
 *      陈述的是一条规则，读者要遵守而不是要验证；
 *   ② 报道性（显示|表明|发现|记录|监测|报告 / shows|reported|found|measured）——
 *      陈述的是一次已发生的观测，证据在上下文里；
 *   ③ 定义性（是|属于|指|称为 / is|are|means|refers to）——陈述的是构成关系；
 *   ④ 特指（这个|该|本次|此|上述 / this|these|our|the report…）——
 *      指向某个具体实例，其证据由说话场景提供。
 * 剩下的才是**类法则型经验断言**：「Coffee reduces the risk of heart disease
 * by 25%.」「运动能降低血压 10%。」——泛指主语 + 效能/比较动词 + 量词 + 全文
 * 无任何证据标记。
 *
 * 极性：与既有 checkEvidence 一致，**高分 = 证据充分**。score 1.0 = 无缺口，
 * score 0.0 = 完全无依据。调用方 index.js 用 `ev.score < 0.6` 判缺口（阈值随本
 * 轮打分器重写从 0.25 重标定，理由见 index.js:2941 注释）。
 *
 * [r734 实现纪律] 同 r642-r733：所有正则源串一律走 String.raw。
 * ⚠️ 中文分支不能写 \b（ASCII 词边界在中文字符间永不成立）。
 * ⚠️ 英文分支的间隔符用 [^.]（中文 [^。] 管不住英文句点）。
 * ⚠️ isZh 判定用字面端点 /[一-龿]——绕开写盘层的反斜杠转义。
 */

'use strict';

// ─── 支① DEMAND：类法则型经验断言（效能/比较动词 × 量词）────────
// 只收「动词 + 量词」紧邻的形态。纯数字（「一共 42 条」「90 天以上」）不收——
// 那是读数/日程/规则，见模块头注释的四类排除。
const DEMAND_ZH = [
  // D1 效能动词 × 量词（降低|减少|提升|提高|改善|缩短|延长|加快|加速|优化|
  //     预防|消除|杜绝|增强|增加|放大|推高|压低|翻倍|倍增 + 数字 + 单位）
  String.raw`(?:降低|减少|提升|提高|改善|缩短|延长|加快|加速|优化|预防|消除|杜绝|增强|增加|放大|推高|压低|翻倍|倍增)[^。！？；]{0,20}?\d+(?:\.\d+)?\s*(?:%|％|个百分点|倍|成|万|亿)`,
  // D1b 量词在前 + 效能动词（「3 倍提升」「40% 的降幅」反向语序少见，仍收）
  String.raw`\d+(?:\.\d+)?\s*(?:%|％|倍|成)\s*(?:的)?(?:降低|减少|提升|提高|改善|缩短|延长|加快|加速|优化|预防|消除|增强|增加|翻倍)`,
  // D1c 百分之几的中文数量式（「降低血压 10%」「减少三成成本」）
  String.raw`(?:降低|减少|提升|提高|改善|缩短|延长|加快|加速|优化|预防|消除|杜绝|增强|增加|翻倍|倍增)[^。！？；]{0,12}?百分之[一二三四五六七八九十百零两]+`,
  // D1d 中文成数式（「减少两成成本」「提升三成转化」）——r734 实测「每天快走
  // 三十分钟可以减少两成心血管疾病风险」整族因只写「百分之X」而漏判
  String.raw`(?:降低|减少|提升|提高|改善|缩短|延长|加快|加速|优化|预防|消除|杜绝|增强|增加|翻倍|倍增)[^。！？；]{0,12}?[一二三四五六七八九十两]成`,
  // D2 比较级 × 量词（比…快/好/高/低/多/少 + 数字 + 单位）
  String.raw`比[^。！？；]{0,20}?(?:快|好|高|低|多|少|强|弱|省|便宜)[^。！？；]{0,12}?\d+(?:\.\d+)?\s*(?:%|％|倍|成)`,
  // D2b 比较形容词 × 量词（无需「比」字：「性能高出 30%」）
  String.raw`(?:快|好|高|低|多|少|强|弱|省|便宜)[^。！？；]{0,6}\d+(?:\.\d+)?\s*(?:%|％|倍|成)`,
];

const DEMAND_EN = [
  // E1 效能动词 × 量词（reduces … by 25% / improves … 3x）
  // ⚠️ 量词后的边界必须写 (?!\w) 不能写 \b——`%` 与句点 `.` 都是非词字符，
  // 两者之间不构成 \b（r734 实测 "…by 25%." 整类漏判就是这一个字符）。
  // ⚠️ 动词词干一律写 \w* 不写 \w+——r734 实测 "Cold showers boost immunity
  // by 2x." 整句漏判，根因是 boost\w+ 要求词干后必须有后缀，而原形 boost 后面
  // 紧跟空格，整条备选失败且没有回退位置。
  String.raw`\b(?:reduc\w*|lower\w*|decreas\w*|improv\w*|increas\w*|boost\w*|rais\w*|cut\w*|slash\w*|shorten\w*|speed\w*|accelerat\w*|optimiz\w*|prevent\w*|eliminat\w*|enhanc\w*|doubl\w*|tripl\w*|maximi[sz]\w*|minimi[sz]\w*)\b[^.]{0,40}?\b\d+(?:\.\d+)?\s*(?:%|percent|per\s?cent|x|times|fold)(?!\w)`,
  // E1b 量词在前 + 效能动词（"a 3x improvement in latency"）
  String.raw`\b\d+(?:\.\d+)?\s*(?:%|percent|per\s?cent|x|times|fold)\s+(?:\w+\s+){0,2}(?:reduction|decrease|improvement|increase|gain|boost|drop|rise|speedup|speed-up)(?!\w)`,
  // E2 比较级 × 量词（faster … 3x / 30% more efficient）
  String.raw`\b(?:faster|slower|better|worse|cheaper|higher|lower|more|less)\b[^.]{0,30}?\b\d+(?:\.\d+)?\s*(?:%|percent|per\s?cent|x|times|fold)(?!\w)`,
  // E2b 倍数 + 比较形容词（"3x faster than the baseline"）
  String.raw`\b\d+(?:\.\d+)?\s*(?:x|times|fold)\s+(?:faster|slower|better|worse|cheaper|higher|lower|more|less)(?!\w)`,
];

// ─── 支② SUPPLY：证据标记（任一在场即视为「有证据」，不判缺口）───
// 分两类：句内证据（与断言同句才有意义）与全文证据锚（命名来源/链接/方法论）。
const SUPPLY_SEGMENT_ZH = [
  // S1 具名/可定位来源（根据《…》/ 第3章 / 表2 / 见图3 / 来源：/ 引自）
  String.raw`根据[^。]{0,20}?(?:[《「『“]|第[一二三四五六七八九十\d]+[章节条]|表\s*\d+|图\s*\d+|报告|白皮书|数据集|标准|规范|法规|条例|指南)`,
  String.raw`(?:来源|出处|引自|参见|详见|参考|引用)[:：]?`,
  String.raw`第[一二三四五六七八九十\d]+[章节条]`,
  String.raw`[《「『][^》」』]{1,40}[》」』]`,
  // S2 方法与数据（实验/测试/基准/样本/数据集/对照组/复现）
  String.raw`(?:实验|测试|基准|样本|数据集|对照组|观测|复现|测量|统计口径|统计方法|调研|问卷|访谈|抽样)`,
  // S3 对冲与保留（可能/或许/大约/估计/待验证/初步/未经证实）
  String.raw`(?:可能|也许|或许|大概|大约|约[莫]?|估计|预估|待验证|待确认|未经证实|初步|理论上|不一定|未必|有待|据说|据悉|据了解|有人称|或称)`,
  // S4 一手经验（实测/在我的环境/我们观察到/笔者）
  String.raw`(?:实测|在我的|我们观察|笔者|据我|我们所|亲自|现场)`,
];

const SUPPLY_SEGMENT_EN = [
  String.raw`\b(?:according to|per the|cited in|source\s*[:：]|reference[sd]?\b|see (?:section|chapter|figure|table|appendix)|ref\.?\s*\d)`,
  String.raw`\b(?:https?:\/\/|www\.|doi\.org|arxiv|isbn|pmid)`,
  String.raw`\b(?:experiment\w*|test(?:ed|ing|s)?|benchmark\w*|sample[sd]?|dataset[sd]?|control group|randomi[sz]\w+|reproduc\w+|measur\w+|profil\w+|logged|survey(?:ed|s)?|interview\w*|trial|cohort|n\s*=|p\s*[<=>])`,
  String.raw`\b(?:might|may|could|possibly|perhaps|probably|approximately|around|roughly|estimated|preliminary|unverified|unconfirmed|arguably|seems?|appears?|tends? to|likely|allegedly|supposedly|reportedly|it is claimed|claim(?:ed|s)? to)`,
  String.raw`\b(?:i|we|my|our)\s+(?:measur\w+|observ\w+|test\w*|benchmark\w*|profil\w+|saw|found|ran|run)\b`,
];

// 全文证据锚：命名机构/期刊/链接出现在任何一句，都说明文本自带来源意识。
const SUPPLY_GLOBAL = new RegExp([
  String.raw`\b(?:University|Institute|Hospital|Ministry|Agency|Bureau|Center|Centre|Laborator\w+|Journal|Association|Organization|Committee|Academy|College|School of|WHO|UN|FDA|CDC|IEEE|ACM|NASA|NIH|OECD|Eurostat)\b`,
  String.raw`(?:大学|学院|研究院|研究所|医院|部|委|局|院|署|中心|实验室|期刊|杂志|学报|委员会|学会|协会|组织|白皮书|年报|报告)`,
  String.raw`\bhttps?:\/\/|www\.|doi\.org|arxiv|isbn|pmid`,
].join('|'), 'i');

// ─── 守门 G：整段排除（任中一条即不判该段）─────────────────────
// 四类框架 + 疑问 + 祈使 + 教学 + 长度下限。注释见模块头「为什么 DEMAND 腿必须
// 收得极窄」。
const GUARD_ZH = [
  // G0 疑问句（切段用后视断言保留句末标点，故段内仍看得到 ?？）
  String.raw`[?？]`,
  // G0b 句首祈使/求助（「如何降低血压 10%？」「请把延迟降低 40%」——提问与
  // 指令不是断言。r734 实测这两条曾因疑问词/祈使词不在守门表里而误判）
  String.raw`^\s*(?:请|帮我|帮忙|麻烦|如何|怎么|怎样|请问|为什么|为何|是否|能不能|可不可以|该不该|要不要|我想|我要|想知道|请教|求|建议我|告诉我)`,
  String.raw`^\s*(?:把|将|给|替|为我)`,
  // G1 规范性：陈述的是规则而非事实
  String.raw`(?:必须|应当|应该|需要|要求|须|得|按|按照|规定|安排|建议|禁止|不得|务必|一律|统一|务必|遵循|遵守|执行|落实)`,
  // G2 报道性：陈述的是一次已发生观测
  String.raw`(?:显示|表明|发现|记录|监测|报告|排查|确认|统计|观测|反映|披露|通报|公布|看板|日志|告警|复盘)`,
  // G3 定义性：陈述的是构成关系
  String.raw`(?:是|属于|指|称为|叫做|定义为|是一种|包括|包含|分为|构成|意味着|即)`,
  // G4 特指：指向具体实例（证据在场景里）
  String.raw`(?:这个|这项|这款|这台|这张|这份|这条|该|本次|这|笔?此|上述|上面|前面|后面|下文|本轮|本月|本季度|本周|本年|本批|最新|新版本|旧版本)`,
  // G5 第一人称在场（含「我们提出的方法」这类自述）
  String.raw`(?:我|你|您|咱)`,
  // G6 教学/概念分析（本族是被讲授的对象）
  String.raw`(?:例如|举例|比如|什么是|指的是|定义为|教学中|课程|教材|案例|习题|考试)`,
];

const GUARD_EN = [
  String.raw`[?？]`,
  String.raw`^\s*(?:please|help|how|what|why|when|where|which|should|can|could|would|do|does|did|is|are|was|were|make|let|ensure|try|consider|use|add|remove|set|keep|avoid|check|verify|tell|show|give|explain|describe|list|compare)`,
  String.raw`\b(?:must|should|shall|required?|needs? to|have to|has to|mandat\w+|obligat\w+|prohibit\w+|forbid\w+|by policy|per policy|according to policy|comply|complies|compliance)\b`,
  // ⚠️ 组尾必须收 \b——r734 实测漏了它，"Cold showers boost immunity by 2x."
  // 里的 showers 被 shows? 从词中匹配上，整段被报道性守门误豁免。
  String.raw`\b(?:shows?|showed|shown|reports?|reported|found|observ\w+|measur\w+|logged|recorded|monitor\w+|indicat\w+|reveal\w+|detect\w+|confirm\w+|discover\w+|audit\w+|inspect\w+|reviewed)\b`,
  // ⚠️ 不能收裸 is/are——英文陈述句几乎句句有系动词，收了它等于把整条英文
  // DEMAND 腿关掉（r734 实测 "A 3x improvement in latency is what the new
  // scheduler delivers." 因此漏判）。定义性守门的真实意图是「X 是（一种）Y」
  // 的构成关系陈述，故只收「系动词 + 类别名词」这一窄形。
  String.raw`\b(?:is|are)\s+(?:a|an|the)?\s*(?:type|kind|form|sort|example|instance|part|process|method|technique|approach|mechanism|symptom|signs?|condition|disease|crime|offen[cs]e|felony|misdemeanor|violation|requirement|obligation|rule|policy|standard|definition|concept|category|class)\b`,
  String.raw`\b(?:means|refers to|defined as|denotes|consists of|comprises|is defined)\b`,
  String.raw`\b(?:this|these|our|its|their|his|her)\s+\w+`,
  String.raw`\bthe\s+(?:above|following|current|latest|new|proposed|report|results?|tests?|batch|run|version|release|quarter|month|year|week|study|survey|experiment|sample|dataset|benchmark|baseline|team|company|product|feature|patch|fix|commit|PR|issue|ticket|spec|RFC|doc|docs|README|guide)\b`,
  String.raw`\b(?:i|we|my|our|you|your)\b`,
  String.raw`\b(?:e\.g\.|for example|for instance|such as|in other words|that is|i\.e\.|definition|defined|example)\b`,
];

function _compile(list) {
  return list.map(s => new RegExp(s, 'i'));
}

// 廉价预筛：DEMAND 的每一族都以「数字量词」为必要成分（\d+ 或中文数量式
// 百分之X / X成）。没有量词的文本不可能命中任何一族，直接跳过全部 34 条
// 正则——r734 实测这一条把本通道对无数字文本的开销从 ~34 次正则执行降到 1 次
// 字符扫描，gate 全链路的额外耗时从 +3~5% 收到 +1% 以内。
const QUANTIFIER_PRESENT = /\d|百分之[一二三四五六七八九十百零两]|[一二三四五六七八九十两]成/;

const DEMAND_ZH_RE = _compile(DEMAND_ZH);
const DEMAND_EN_RE = _compile(DEMAND_EN);
const SUPPLY_ZH_RE = _compile(SUPPLY_SEGMENT_ZH);
const SUPPLY_EN_RE = _compile(SUPPLY_SEGMENT_EN);
const GUARD_ZH_RE = _compile(GUARD_ZH);
const GUARD_EN_RE = _compile(GUARD_EN);

// 每条无依据断言的扣分。两档：
//   · 0.45 = 主形（效能动词 × 量词 / 比较级 × 量词）——最典型的类法则经验断言；
//   · 0.40 = 副形（量词在前的反语序，"a 3x improvement in latency"）——
//     反语序在良性技术散文里良性占用率略高，权重压一档。
// 两档都保证单条即跌破 index.js 的激活阈值 0.65（score = 0.60 / 0.55）。
// ⚠️ 数组长度必须与 DEMAND_ZH/DEMAND_EN 的条数严格一致——r734 首版 ZH 补了
// D1d 却忘了同步权重数组，weights[5] 取到 undefined，扣分累加成 NaN，
// score 变 NaN，`NaN < 0.65` 恒 false，整条链路静默失效。取值处另有 ?? 兜底。
const WEIGHT_ZH = [0.45, 0.40, 0.45, 0.45, 0.45, 0.40];
const WEIGHT_EN = [0.45, 0.40, 0.45, 0.40];
// 单条即判缺口的分数线：1 - 0.45 = 0.55。index.js 的激活阈值取 0.65，
// 给 pedagogy 松弛（_applyPedagogyRelaxation 按比例降 score）留了余量。
const SINGLE_CLAIM_PENALTY = 0.45;
// 扣分总和上限（score 下限 0）
const MAX_PENALTY = 1.0;

/**
 * 检测文本的「证据缺口」：有可验证断言、却拿不出任何证据标记。
 *
 * @param {string} text 归一化后的文本（或原文——本函数不做归一侧假设）
 * @returns {{
 *   score: number,        // 1.0 = 证据充分，0.0 = 完全无依据（高分=好）
 *   count: number,        // 无依据断言条数
 *   demand: number,       // 命中的 DEMAND 族次数（含被 supply 豁免的）
 *   supply: string[],     // 命中的证据标记族名
 *   claims: Array<{family:string, matched:string, weight:number}>,
 *   issues: Array<{type:string, severity:string, message:string, matched:string}>
 * }}
 */
function checkEvidenceGap(text) {
  // ⚠️ 每条早退路径都必须返回**新建**的对象。index.js 的
  // _applyPedagogyRelaxation 会就地改写 result.score / result.count
  // （`result.score = result.score * (1 - relax)`）——若这里返回共享单例，
  // 第一次 pedagogy 松弛就把单例永久改掉，后续所有调用都拿到被污染的分数。
  // r734 首版踩过：empty 是模块级常量，直接 return empty。
  const noGap = () => ({ score: 1, count: 0, demand: 0, supply: [], claims: [], issues: [] });
  if (!text || typeof text !== 'string') return noGap();
  // [r734] 短论断契约原样保留：v6.7.73 起的口径是「claim < 5 字符 → score 0.8 +
  // claim_too_short」。这条路径在 index.js 的 checkEvidence 里被显式传空数组的
  // 调用方观察得到，不能因为换了打分器就悄悄改掉。
  if (text.length < 5) {
    return {
      score: 0.8, count: 0, demand: 0, supply: [], claims: [],
      issues: [{ type: 'claim_too_short', severity: 'medium', message: '论断过短，无法验证' }],
    };
  }

  const isZh = /[一-龿]/.test(text);
  // 廉价预筛（见 QUANTIFIER_PRESENT 注释）：无量词文本直接返回无缺口。
  if (!QUANTIFIER_PRESENT.test(text)) return noGap();
  // 切段：中文句读 + 英文句点/问号/叹号/分号 + 换行。段是判据作用域——
  // 断言与它的守门/证据标记必须在同一段里，跨段不算（「根据我们的测试」在上一段、
  // 「缓存能提升性能 3 倍」在下一段，仍是两个独立陈述，不该互相豁免）。
  // ⚠️ 用后视断言 (?<=…) 切而不用 split 字符类：后者会把句末的 ?！。整段吃掉，
  // 守门 G0 的疑问判据从此永不成立（r734 实测「如何降低血压 10%？」因此误判）。
  // ⚠️ 英文句点也要切，但只切「句点 + 空白」这一处（(?<=\.)(?=\s)）——
  // 否则 "Coffee reduces … 25%. Meditation lowers … 12%." 两句并成一段，
  // 而一段只记一条断言（break），第二条静默丢失（r734 实测 count=1 应为 2）。
  // 不切裸句点是为了不把 3.5 / e.g. / 1.2.3 这类小数与版本号切开。
  const segments = text.split(/(?<=[。！？!?；;\n\r])|(?<=\.)(?=\s)/).map(s => s.trim()).filter(s => s.length >= 4);

  const demandRe = isZh ? DEMAND_ZH_RE : DEMAND_EN_RE;
  const supplyRe = isZh ? SUPPLY_ZH_RE : SUPPLY_EN_RE;
  const guardRe = isZh ? GUARD_ZH_RE : GUARD_EN_RE;
  const weights = isZh ? WEIGHT_ZH : WEIGHT_EN;

  const claims = [];
  const issues = [];
  const supply = [];
  let demandHits = 0;

  for (const seg of segments) {
    // 守门：任一类框架在场，整段不判
    if (guardRe.some(re => re.test(seg))) continue;

    // 支② SUPPLY：段内证据标记
    if (supplyRe.some((re, i) => { if (re.test(seg)) { supply.push((isZh ? 'zh' : 'en') + ':seg' + i); return true; } return false; })) continue;

    // 支① DEMAND
    for (let i = 0; i < demandRe.length; i++) {
      const m = seg.match(demandRe[i]);
      if (!m) continue;
      demandHits++;
      const matched = m[0].length > 60 ? m[0].slice(0, 60) : m[0];
      claims.push({
        family: (isZh ? 'zh_d' : 'en_d') + (i + 1),
        matched,
        weight: weights[i] ?? SINGLE_CLAIM_PENALTY,
      });
      issues.push({
        type: 'evidence_gap_' + (isZh ? 'zh' : 'en') + '_' + (i + 1),
        severity: 'medium',
        message: isZh
          ? `经验断言无证据支撑: ${matched}`
          : `unsupported empirical claim: ${matched}`,
        matched,
      });
      break; // 一段只记一条，避免同段多族重复计数
    }
  }

  // 全文证据锚（命名机构/链接）——出现在任何一段都算文本自带来源意识
  if (claims.length > 0 && SUPPLY_GLOBAL.test(text)) {
    supply.push('global:named_source');
    claims.length = 0;
    issues.length = 0;
  }

  const penalty = Math.min(MAX_PENALTY, claims.reduce((s, c) => s + c.weight, 0));
  return {
    score: Math.max(0, Math.round((1 - penalty) * 1000) / 1000),
    count: claims.length,
    demand: demandHits,
    supply: [...new Set(supply)],
    claims,
    issues,
  };
}

/**
 * 当前判据的族规模与交叉口径（审计用，与 AGENTS.md 的口径一致）。
 * @returns {{demandZh:number, demandEn:number, supplyZh:number, supplyEn:number,
 *            guardZh:number, guardEn:number, singleClaimPenalty:number,
 *            activateThreshold:number}}
 */
function familySummary() {
  return {
    demandZh: DEMAND_ZH.length,
    demandEn: DEMAND_EN.length,
    supplyZh: SUPPLY_SEGMENT_ZH.length,
    supplyEn: SUPPLY_SEGMENT_EN.length,
    guardZh: GUARD_ZH.length,
    guardEn: GUARD_EN.length,
    singleClaimPenalty: SINGLE_CLAIM_PENALTY,
    activateThreshold: 0.65,
    note: 'DEMAND×量词合取后逐条扣分，单条即跌破激活阈值；极性高分=证据充分',
  };
}

module.exports = {
  checkEvidenceGap,
  familySummary,
  __internals: () => ({
    DEMAND_ZH, DEMAND_EN,
    SUPPLY_SEGMENT_ZH, SUPPLY_SEGMENT_EN,
    SUPPLY_GLOBAL,
    GUARD_ZH, GUARD_EN,
    WEIGHT_ZH, WEIGHT_EN,
    SINGLE_CLAIM_PENALTY,
  }),
};
