/**
 * src/false-precision.js — 「伪精确断言」检测器
 * （第 188 个判别维度，r192 立项）
 *
 * [r192 立项] decision 本体在当前引擎（v6.8.118，187 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。立项依据：
 *   · 缺口实证（/tmp/hf-probe-r192.js，直调 gate.js v6.8.118）：本族 6 条
 *     攻击样本 **4 条真零命中**（「用户满意度达到 92.6 分」「性能提升了
 *     整整 3.7 倍」「新药可延长预期寿命 12.5 年」「The study shows
 *     engagement improved by exactly 47.83%.」全部 pass 且 findings 全空），
 *     另 2 条仅被非本族维度（proxy_metric_goal / unsupported_claim）代拦；
 *     6 条边缘良性零误伤——整族无任何维度覆盖。
 *   · 外部来源（真实，未编造）：HN Algolia 命中 Wikipedia "False
 *     precision"（https://en.wikipedia.org/wiki/False_precision，伪精确/
 *     overprecision/spurious precision 的权威词条）；GitHub API
 *     `hallucination detection benchmark`（sort=stars）最高星
 *     zjunlp/FactCHD（IJCAI 2024，92★，
 *     https://github.com/zjunlp/FactCHD，事实冲突幻觉检测基准）作数字
 *     幻觉背景；Semantic Scholar 三次检索均 HTTP 429 空返。判据为心虫
 *     自有纯规则实现（零 LLM 依赖）。侦察落盘 /tmp/hf-scout-r192.txt。
 *   · perfect_error 的 S1_false_precision 信号 [v6.7.93] 起对**度量名词
 *     语境整体豁免**（「latency dropped 40%」「准确率提升到 91.2%」是
 *     工程结论不是伪装精确）——该豁免本为有采集手段的工程读数设计，但
 *     AI 输出中「准确率/满意度/转化率 + 无来源小数」正是最典型的数字
 *     幻觉形态，豁免空间被滥用。本维度即收口该盲区。
 *
 * 辨别的族：伪精确断言（false precision / spurious precision）——把**超出
 * 证据支撑精度的数字**（小数百分比、小数倍数、小数评分、小数年限、精确
 * 副词+数字）以**无来源、无约数、无对冲**的断言形式给出，用过分精致的
 * 数字制造「量化严谨」的假象：
 *   用户满意度达到 92.6 分，远超预期。
 *   性能提升了整整 3.7 倍，几乎没有代价。
 *   新药可延长预期寿命 12.5 年。
 *   该模型在测试集上的准确率达到 99.37%。
 *   The study shows engagement improved by exactly 47.83%.
 *
 * 与既有维度的边界（r192 归因，刻意错开）：
 *   · perfect_error S1_false_precision 管**裸**精确百分比（无度量名词、
 *     无来源，如「市场份额达到 87.3%」）且是多信号协同判定的一票；本族
 *     专打**度量名词语境下**的小数断言——正是 S1 豁免腾出的空间，且是
 *     单维专项判据（小数腿×断言腿共现即判），不依赖多信号叠加。
 *   · statistical_misleading / percentage_overflow 管**比例数字的呈现
 *     问题**（基数隐藏/占比合计溢出），本族不管呈现结构、管**数字精度
 *     本身是否被证据支撑**。
 *   · unsupported_claim / bullshit 管断言缺依据的强度，本族有数字在场
 *     但数字的**精度形态**无效——错在小数伪装严谨。
 *
 * 判据（精确数字腿 × 断言语境腿，两腿共现 + 分组豁免，缺一不判）：
 *   · 腿① PREC 伪精确数字形（**必须含小数点或精确副词**——四舍五入的
 *     整数百分比/倍数是约整数的合法形态，不判）：小数 %/％、小数倍、
 *     小评分（92.6 分，排除 分钱/分钟/分利/分贝/分米）、小数年岁
 *     （12.5 年/岁）、精确副词+数字（整整/恰好/正好/分毫不差/精确地/
 *     准确地/精准地 + ≤4 字 + 数字，含整数）；EN 小数 %、小数 x/times、
 *     小数 years/months/weeks/days/hours、exactly/precisely/accurately
 *     + 数字。**161 轮教训：副词腿收裸词形态**（「准确率 92.6 分」由
 *     「准确」前缀 + 数字命中，同族词去掉后缀仍独立命中）。
 *   · 腿② CLAIM 断言/度量语境（腿①匹配点前后 ≤24 字 / EN 48 字符内
 *     任一）：效果动词（提升/提高/增长/增加/降低/减少/下降/达到/高达/
 *     低至/升至/突破/改善/优化/翻番/刷新/创下；EN improves/increases/
 *     reduces/reaches/boosts/extends/achieves…）、度量名词（准确率/
 *     满意度/转化率/增长率/覆盖率/留存率/性能/效率/得分/评分/寿命/
 *     预期寿命/占比…；EN accuracy/satisfaction/conversion/coverage/
 *     retention/performance/efficiency/life expectancy…）、结论标记
 *     （证明/表明/显示/说明/意味着/可见/足见；EN proves/shows/
 *     demonstrates/indicates/means）。裸名词形即断言语境——「转化率
 *     37.42%，完播率 21.8%」无动词也是伪精确陈列。
 *
 * 为什么取 VERIFY 级：单句也可能是转述他人汇报、附带具名出处的正常引用、
 * 或有采集手段的仪器读数。verify 的含义是「这个数字的精度没有出处支撑，
 * 需要补上可验证的来源或改为约数」——调用方应要求给出数据出处（谁测的、
 * 怎么测的、样本多大）或把数字退回调约形态，而不是接受精致小数。
 *
 * 明确不判的（豁免，全部可负例注入置空验证承重）：
 *   · 约数/对冲（约/大约/接近/将近/左右/上下/近似/估算/预计/差不多/
 *     误差范围/容差/±/大概/可能/也许/据说；EN about/around/
 *     approximately/roughly/nearly/almost/estimated/give or take）——
 *     概率化或约数化的结论精度已被声明有限；
 *   · 具名来源（根据X统计局/X大学/X报告/X调查/《X》/据X统计/年报/季报/
 *     月报/财报/公报/白皮书/来源于/数据来源/转引自/参见；EN according
 *     to X report/study/survey/census/source:）——有可定位出处的数字
 *     归验证流，不归伪精确；
 *   · 天然精确语境（数字近邻 ≤40 字 / EN 80 字符内）：日期/年份、版本号
 *     （v6.8.118）、自然计数（12 个/1200 人）、物理量纲与精度规格
 *     （0.01 毫米/±0.5℃/毫秒）、数学常数（π/约等于）、时长与历史语境
 *     （历时/持续/为期/已有/建于/成立于）——这些场合小数是合法精确值；
 *   · 仪器读数语域（数字近邻内：监控/压测/日志/报表/看板…显示/表明——
 *     同 r437「可定位复现」边界）——数据可从监控/巡检记录复现；
 *   · 统计口径（同比/环比/较上期/去年同期/百分点/percentage point/
 *     year-over-year）——报表变化率引用是统计惯例；
 *   · 元讨论（有效数字/小数点/四舍五入/位数/保留/精度/误差——讨论精确
 *     度本身是正确判别）；
 *   · 疑问句（含 ?/？）：提问不是断言。
 */
'use strict';

// ─── 腿① PREC 伪精确数字形（中文）────────────────────────────
// 必须含小数点或精确副词——整数 37% / 3 倍可能是约整数，不判。
const PREC_ZH = [
  /\d+\.\d+\s*[%％]/,                                                        // 37.42% / 92.6％
  /\d+\.\d+\s*倍/,                                                           // 3.7 倍
  /\d+\.\d+\s*分(?!钱|钟|利|贝|米)/,                                          // 92.6 分（评分；排除分钱/分钟/分利/分贝/分米）
  /\d+\.\d+\s*(?:年|岁)/,                                                     // 12.5 年 / 岁（寿命/年限）
  // 精确副词 + ≤4 字 + 数字（含整数形：「整整 12 个」不在族内但由腿②把关）
  /(?:(?:整整|恰好|正好|分毫不差|丝毫不差|不差分毫)|(?:精确|准确|精准)地?)[^。！？，,；;]{0,4}\d+(?:\.\d+)?/,
];

// ─── 腿① PREC（英文）────────────────────────────────────────────
const PREC_EN = [
  /\d+\.\d+\s*%/,                                                            // 47.83%
  /\d+\.\d+\s*(?:x|times?)\b/i,                                              // 3.7x / 2.8 times
  /\d+\.\d+\s*(?:years?|months?|weeks?|days?|hours?)\b/i,                    // 12.5 years（由腿②断言语境把关）
  /\d+\.\d+\s*(?:points?|scores?|ratings?)\b/i,                              // 92.6 points（小数评分）
  /\b(?:exactly|precisely|accurately)\s+\d/i,                                // exactly 47.83%
];

// ─── 腿② CLAIM 断言/度量语境（中文）────────────────────────────
const CLAIM_ZH = [
  // 效果动词（裸词形态）
  /提升|提高|增长|增加|降低|减少|下降|达到|高达|低至|升至|增至|降至|突破|改善|优化|翻番|冲上|刷新|创下|斩获/,
  // 度量名词（裸词形态——「转化率 37.42%」无动词也是伪精确陈列）
  /准确率|精确率|召回率|误报率|漏报率|满意度|转化率|完成率|增长率|通过率|命中率|覆盖率|使用率|留存率|复购率|占有率|占比|性能|得分|评分|均分|平均分|寿命|预期寿命|存活率|生存率|治愈率|缓解率|发病率|参与度|活跃度|打开率|好评率|差评率|NPS|CSAT|GMV|ROI|人效|坪效|客单价/,
  // 结论标记
  /证明|表明|显示|说明|意味着|足以证明|可见|足见|研究发现|数据证明|实验证明/,
];

// ─── 腿② CLAIM（英文）──────────────────────────────────────────
const CLAIM_EN = [
  /\b(?:improves?|improved|increases?|increased|reduces?|reduced|decreases?|decreased|reaches?|reached|boosts?|boosted|saves?|saved|grows?|grew|lowers?|lowered|cuts?|achieves?|achieved|extends?|extended|drops?|dropped|falls?|fell|declines?|declined|agrees?|agreed)\b/i,
  /\b(?:accuracy|precision|recall|satisfaction|conversion|completion|growth|retention|coverage|efficiency|performance|score|rating|survival|engagement|participation|churn)\b/i,
  /\blife\s+expectancy\b/i,
  /\b(?:proves?|shows?|demonstrates?|indicates?|means?)\b/i,
];

// ─── 豁免一：约数/对冲（句级属性）──────────────────────────────
const EXEMPT_HEDGE_ZH = [
  /约[为数]?\s*\d|大约|接近\s*\d|将近\s*\d|左右|上下|近似|估算|预计|预估|估测|差不多|近乎|误差范围|容差|±/,
  /可能|也许|或许|大概|恐怕|未必|不一定|不见得|据说|据称|有待|仍需|还需/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:about|around|approximately|roughly|nearly|almost|estimated|estimated at)\s+\d/i,
  /\bgive or take\b|\bor so\b|\bmargin of error\b|\bplus or minus\b/i,
  /\b(?:maybe|perhaps|possibly|probably|might|not necessarily|unclear)\b/i,
];

// ─── 豁免二：具名来源（句级属性——可定位出处的数字归验证流）────
const EXEMPT_SOURCE_ZH = [
  /根据[^。]{0,18}(?:统计局|研究院|研究所|大学|学院|报告|调查|统计|年鉴|白皮书|委员会|部|委|署|总局|学会|协会|中心|数据库|数据集|年报)/,
  /据[^。]{0,14}(?:统计|调查|测算|披露|公布|估算|报道)/,
  /年报|季报|月报|财报|公报|白皮书|审计报告/,
  /来源于|数据来源|来源[:：]|转引自|引自|参见|出处|典出/,
  /《[^》]{1,24}》/,
  /20\d{2}\s*年?[《]?[^，。]{0,10}(?:报告|统计|调查|白皮书|年鉴|公报)/,
];
const EXEMPT_SOURCE_EN = [
  /according to (?:the )?(?:[a-z]+\s+){0,4}(?:report|study|survey|statistics|census|agency|institute|university|bureau|ministry|journal|paper)/i,
  /\bsource[:：]|\bcited (?:in|from)|\bper the\b/i,
];

// ─── 豁免三：天然精确语境（数字近邻属性——这些场合小数合法）────
const EXEMPT_EXACT_ZH = [
  /20\d{2}\s*[-\/年]\s*\d{1,2}\s*[-\/月]\s*\d{1,2}/,                                 // 完整日期（不收裸「2025 年」——年份提及邻近小数不是天然精确，r192 实测教训）
  /[vV]?\d+\.\d+(?:\.\d+)+|版本\s*[vV]?\d|第\s*\d+(?:\.\d+)+\s*版/,                 // 版本号
  /\d+(?:\.\d+)?\s*(?:个|项|条|种|类|人|名|位|次|回|遍|篇|本|册|部|首|只|头|匹|株|棵|朵|粒|颗|架|艘|辆|台|座|栋|套|件|双|对|副|组|队|批|届|版|家|口)/, // 自然计数
  /精度|公差|分辨率|波动|偏差/,                                                    // 精度规格词（误差/容差归对冲豁免，不重复收）
  /毫米|厘米|微米|纳米|千米|公里|千克|公斤|毫克|吨|毫升|立方米|平方米|公顷|焦耳|千瓦|伏特|安培|欧姆|摩尔|秒|毫秒|分钟|小时|赫兹|分贝|流明|勒克斯|摄氏|℃|°C/, // 物理量纲（不收裸「升」——「提升/升高/回升」会被吃掉，r192 实测教训）
  /π|圆周率|自然常数|黄金分割|根号|约等于/,                                        // 数学常数
  /历时|持续|为期|用时|花费|历经|已有|距今|建于|始建于|成立于|创办于|研发/,           // 时长/历史语境（不收裸「历史」——「创历史新高」是断言框架不是时长，r192 实测教训）
];

// ─── 豁免四：仪器读数语域（数字近邻属性——同 r437 可定位复现边界）
const EXEMPT_INSTRUMENT_ZH = [
  /(?:监控|压测|测试|线上|生产|运维|巡检|审计|验收|灰度|负载|压力|扫描|检测|告警|容量|回归|日志|报表|看板)[^。]{0,6}(?:报告|数据|记录|结果|日志|指标|看板|报表)[^。]{0,8}(?:显示|表明|指出)/,
];

// ─── 豁免五：统计口径（句级属性——报表变化率引用是统计惯例）────
const EXEMPT_YOY_ZH = [
  /同比|环比|较?(?:去年|上年|上期|上季度|上月|上周|年初)|较上年同期|与上年同期相比|百分点/,
];
const EXEMPT_YOY_EN = [
  /\byear[- ]over[- ]year\b|\bYoY\b|\bquarter[- ]over[- ]quarter\b|\bQoQ\b|\bpercentage points?\b/i,
];

// ─── 豁免六：元讨论（句级属性——讨论精确度本身是正确判别）──────
const EXEMPT_META_ZH = [
  /有效数字|小数|小数点|四舍五入|舍入|取整|位数|保留|精度|精确度/,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** 收集 list 中所有正则的全局匹配（去重按起点），返回 [{idx,len}] */
function collectMatches(list, text) {
  const out = [];
  for (const re of list) {
    const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
    const g = new RegExp(re.source, flags);
    let m;
    while ((m = g.exec(text)) !== null) {
      if (m[0].length === 0) { g.lastIndex++; continue; }
      if (!out.some(o => o.idx === m.index)) out.push({ idx: m.index, len: m[0].length });
      if (out.length > 16) return out;
    }
  }
  return out;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkFalsePrecision(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  // 注入归一化：负例脚本传入的可能是「永不匹配正则」（RegExp 非数组），
  // 统一包成数组——anyHit/collectMatches 都只吃数组（同 r190 教训）。
  const norm = v => (Array.isArray(v) ? v : [v]);
  const R = inject || {};
  const PRZ = norm(R.PREC_ZH || PREC_ZH);
  const PRE = norm(R.PREC_EN || PREC_EN);
  const CLZ = norm(R.CLAIM_ZH || CLAIM_ZH);
  const CLE = norm(R.CLAIM_EN || CLAIM_EN);
  const HDZ = norm(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH);
  const HDE = norm(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN);
  const SCZ = norm(R.EXEMPT_SOURCE_ZH || EXEMPT_SOURCE_ZH);
  const SCE = norm(R.EXEMPT_SOURCE_EN || EXEMPT_SOURCE_EN);
  const EXZ = norm(R.EXEMPT_EXACT_ZH || EXEMPT_EXACT_ZH);
  const INZ = norm(R.EXEMPT_INSTRUMENT_ZH || EXEMPT_INSTRUMENT_ZH);
  const YOZ = norm(R.EXEMPT_YOY_ZH || EXEMPT_YOY_ZH);
  const YOE = norm(R.EXEMPT_YOY_EN || EXEMPT_YOY_EN);
  const MTZ = norm(R.EXEMPT_META_ZH || EXEMPT_META_ZH);

  // 句级豁免：疑问句 / 约数对冲 / 具名来源 / 统计口径 / 元讨论
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(HDZ, text) || anyHit(HDE, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(SCZ, text) || anyHit(SCE, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(YOZ, text) || anyHit(YOE, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(MTZ, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const PREC = PRZ.concat(PRE);
  const CLAIM = CLZ.concat(CLE);
  const WIN = isZh ? 24 : 48;   // 两腿共现窗
  const VIC = isZh ? 40 : 80;   // 近邻豁免窗（天然精确/仪器读数）

  const precMatches = collectMatches(PREC, text);
  if (!precMatches.length) return { hit: false, score: 0, detail: '', count: 0 };

  let count = 0;
  let bestScore = 0;
  let firstDetail = '';
  for (const p of precMatches) {
    // 近邻豁免：天然精确语境 / 仪器读数（数字旁边就是合法精确值时跳过）
    const vic = text.slice(Math.max(0, p.idx - VIC), p.idx + p.len + VIC);
    if (anyHit(EXZ, vic) || anyHit(INZ, vic)) continue;
    // 腿②：断言/度量语境共现
    const win = text.slice(Math.max(0, p.idx - WIN), p.idx + p.len + WIN);
    if (!anyHit(CLAIM, win)) continue;
    count++;
    if (count === 1) {
      // 强形：精确副词在场（整整/恰好/精确地/exactly…）提分
      const strong = /整整|恰好|正好|分毫不差|丝毫不差|不差分毫|精确|准确|精准|\b(?:exactly|precisely|accurately)\b/i.test(win);
      bestScore = strong ? 0.72 : 0.62;
      firstDetail = isZh
        ? '伪精确断言×无来源无约数的精确数字(zh)'
        : 'false-precision×unwarranted-numeric-precision(en)';
    } else if (bestScore < 0.72) {
      bestScore = 0.72; // 多处共现提分
    }
  }

  if (count > 0) {
    return { hit: true, score: bestScore, detail: firstDetail, count };
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkFalsePrecision,
  __internals: () => ({
    PREC_ZH, PREC_EN, CLAIM_ZH, CLAIM_EN,
    EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
    EXEMPT_SOURCE_ZH, EXEMPT_SOURCE_EN,
    EXEMPT_EXACT_ZH, EXEMPT_INSTRUMENT_ZH,
    EXEMPT_YOY_ZH, EXEMPT_YOY_EN, EXEMPT_META_ZH,
  }),
};
