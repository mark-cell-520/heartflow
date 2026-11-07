/**
 * src/denominator-swap.js — 「分母替换谬误（基数不可比）」检测器（第 224 个判别维度）
 *
 * [r249 立项] 外部三层搜索（HN Algolia / Semantic Scholar / GitHub API）均无
 * 可用结果，走内部路径（阶段2b）。缺口实证：scripts/round-249/probe-gap-r249.js
 * 实测 19 条候选中 12 条漏判，其中本族中英双语 2/2 全漏判。
 * decision 本体裁决 accelerate（philosophy_decision：type=accelerate /
 * confidence 0.7 / priority 40 / trigger optimal_conditions / goalReviewed true；
 * cognitiveLoad 与 uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。
 *
 * 辨别的族：分母替换（denominator swap / incomparable base sizes）——拿**不同
 * 分母的绝对计数**直接做**优劣/安全/多少比较**并下结论，忽略人口、样本量、
 * 暴露规模等基数不同：
 *   A 城发生了十起事故，B 城只发生了一起，可见 B 城更安全。
 *   我们店收到了十封投诉，隔壁店只收到一封，所以我们的服务更差。
 *   这个方案去年被十个人否决，另一个方案只有一个人否决，所以另一个方案更好。
 *   City A had 10 accidents and city B had 1, so city B is safer.
 *   Our team logged 10 bugs while theirs logged 1, so their code is better.
 *
 * 与既有维度的边界（r249 归因）：
 *   · base_rate_neglect（第 169 维）管**单个阳性信号→个体高置信度结论**，
 *     可全程无数字、无两个比较主体；本族要件是**两个主体的绝对计数对置**，
 *     错在分母不可比，不是先验被忽略。
 *   · percentage_overflow 管**百分比之和越界**（九成来自两项）；本族可无
 *     百分比，只比绝对数。
 *   · statistical_misleading 管**统计口径泛化误导**；本族是具体的「换了
 *     分母还在比」结构，判定锚在计数词×比较结论词共现。
 *   · selection_bias（第 168 维）管**受限样本→总体推广**；本族两个计数可
 *     都是全量真数，错的是**基数不同不可比**。
 *
 * 判据（双腿共现，缺一不判）：
 *   · 腿① ABSOLUTE_COUNT 绝对计数对置（中英）：≥2 个「（数量词|数字）+
 *     起|例|件|次|人|个|条|宗|单」型绝对量，且分别归属两个不同主体
 *     （A城/B城、我们/他们、这个/另一个）。核心锚是**量词+计数结构**而非
 *     数字本身（「十起」与「10 accidents」都是绝对计数形态）。
 *   · 腿② COMPARISON_VERDICT 比较结论（中英）：更/最/较为 + 安全|好|差|
 *     多|少|高|低|优|劣|可靠|危险|严重；高于/低于/超过/不及/比不上/胜过；
 *     safer / more / less / better / worse / higher / lower / fewer /
 *     outperformed / ahead of。
 *   · 缺腿不判：只有绝对计数无比较结论（「A城十起B城一起，均已结案」）
 *     是中性陈述；只有比较结论无绝对计数（「B城更安全」）归
 *     unsupported_claim。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人的错误论证（教学中作为反例）、
 * 或作者自己正要指出分母问题。verify 的含义是「这个比较的分母可能不可比，
 * 需要回到人均/发生率/率口径再比」——调用方应要求补上分母或改比比率，
 * 而不是接受绝对计数直接得出的优劣结论。
 *
 * 明确不判的（豁免）：
 *   · 比率语言在场（人均/每万人/每千人/平均每/占比/比率/率/per capita/
 *     per capita/rate/percentage/incidence rate）：已经在统一口径上比较；
 *   · 同分母明示（同样规模/同等人口/人口相当/规模相近/样本量相同/same
 *     population/similar size）：作者已声明基数可比；
 *   · 指出分母问题的元陈述（分母不同/基数不同/不可比/忽略人口/different
 *     denominators/not comparable）：那是在破除本谬误。
 */
'use strict';

// ─── 腿① ABSOLUTE_COUNT 绝对计数（中文）────────────────────────────
// 枚举腿自查（161 轮教训）：核心量词取裸名词形态（起/例/件/次/人/个/条/
// 宗/单），前面可带阿拉伯数字、中文数字或数量词。
const ABSOLUTE_ZH = [
  // 数字/数量词 + 量词（绝对计数形态）
  /[0-9０-９一二两三四五六七八九十百千万零几数]\s*(?:起|例|件|次|宗|单|桩)/,
  /[0-9０-９一二两三四五六七八九十百千万零几数多]\s*(?:人|名|位|个|户|家|例)/,
  /[0-9０-９一二两三四五六七八九十百千万零几数]\s*(?:条|篇|封|份|张|台|辆|架)/,
  // 只收到/发生/有 + 数量 + 量词（「只收到一封」）
  /(?:只|仅|才|共|合计|总|有|收到|发生|出现|记录|接到)\s*[0-9０-９一二两三四五六七八九十百千万零几数]\s*(?:起|例|件|次|宗|单|桩|人|名|位|个|户|家|条|篇|封|份)/,
  // 量词复数对置的裸形态（「十起事故」「五例不良反应」）
  /(?:起|例|件|次|宗|单|桩)(?:事故|投诉|故障|事件|不良反应|问题|bug|缺陷|漏洞|举报|诉讼|纠纷)/,
];

// ─── 腿① ABSOLUTE_COUNT 绝对计数（英文）────────────────────────────
const ABSOLUTE_EN = [
  /\b\d+\s+(?:accidents?|incidents?|complaints?|cases?|bugs?|defects?|errors?|failures?|reports?|lawsuits?|deaths?|injuries?|crimes?|offences?|offenses?|violations?|outages?|faults?|accident)\b/i,
  /\b(?:had|has|logged|recorded|received|reported|saw|got|gets?)\s+\d+\b/i,
  /\b\d+\s+(?:people|persons?|customers?|users?|patients?|employees?)\b/i,
  /\b(?:only|just)\s+\d+\b/i,
  /\b\d+\s+(?:more|fewer|less)\s+(?:than|of)\b/i,
];

// ─── 腿② COMPARISON_VERDICT 比较结论（中文）────────────────────────
const COMPARE_ZH = [
  // 更/最为/较为 + 评价形容词
  /(?:更|最为|较|较为|越发|相对)(?:安全|好|差|多|少|高|低|优|劣|可靠|危险|严重|干净|脏|快|慢|强|弱|发达|落后|清廉|腐败)/,
  // 裸评价形容词 + （得多了/一些/得多）
  /(?:安全|好|差|多|少|高|低|优|劣|可靠|危险|严重)(?:得多了|得多|一些|不少)/,
  // 高于/低于/超过/不及/比不上/胜过/优于/劣于
  /(?:高于|低于|超过|不及|比不上|比不过|胜过|优于|劣于|领先|落后于)/,
  // 可见/说明/因此/所以 + 更（引出结论）
  /(?:可见|说明|证明|因此|所以|故而|显然)[^。；;]{0,12}(?:更|最为|较为|高于|低于|超过)/,
  // 所以…更…（结论连词后置）
  /(?:所以|因此|故而|可见)[^。；;]{0,16}(?:更|最为|较为)(?:安全|好|差|多|少|高|低|优|劣|可靠|危险|严重)/,
];

// ─── 腿② COMPARISON_VERDICT 比较结论（英文）────────────────────────
const COMPARE_EN = [
  /\b(?:is|are|was|were)\s+(?:much\s+|far\s+|a\s+lot\s+)?(?:safer|better|worse|cleaner|dirtier|faster|slower|stronger|weaker|more|less)\s+(?:reliable|dangerous|severe|common|frequent|effective|efficient|likely)\b/i,
  /\b(?:safer|better|worse|cleaner|dirtier|more|less|fewer|higher|lower)\s+(?:than|of)\b/i,
  /\b(?:outperform(?:ed|s)?|ahead\s+of|behind|trail(?:ed|s)?|lags?\s+behind|beat|beats|trails)\b/i,
  /\b(?:so|thus|therefore|hence|which\s+means)\s+[^.]{0,30}\b(?:safer|better|worse|more|less|fewer|higher|lower)\b/i,
  // 裸比较级收尾（r249：「so city B is cleaner」无 than/of，前几支不承重）
  /\b(?:is|are|was|were)\s+(?:much\s+|far\s+|a\s+lot\s+|even\s+)?(?:safer|better|worse|cleaner|dirtier|faster|slower|stronger|weaker|more|less)\s*(?:reliable|dangerous|severe|common|frequent|effective|efficient|likely|often|frequently)?\s*[.!,;]?\s*$/i,
];

// ─── 豁免一：比率/统一口径语言在场 ─────────────────────────────────
const EXEMPT_RATE_ZH = [
  /人均|每万人|每千人|每百人|每人|平均每|人均值/,
  /占比|比率|率(?=的|更|比|高|低|是|为)|发生率|死亡率|感染率|事故率|投诉率|通过率|出生率|犯罪率|治愈率|响应率/,
  /换算成|折算成|按人口|按规模|按样本|统一口径|同一口径|同等条件/,
  /(?:十万分|万分|千分|百分)之/,
  /百分点/,
];
const EXEMPT_RATE_EN = [
  /per\s+capita/i,
  /\bper\s+(?:\d|one|two|ten|hundred|thousand|million|1000|100000)/i,
  /\brate\b|\brates\b/i,
  /\bpercentage\b|\bpercent\b|\bproportion\b/i,
  /\bincidence\b|\bmortality\b|\bprevalence\b/i,
  /(?:adjust|adjusted|normaliz|standardiz)(?:ed|e|ing)?\s+(?:for|by)\b/i,
];

// ─── 豁免二：同分母明示 / 元陈述（指出分母问题）──────────────────
const EXEMPT_SAMEBASE_ZH = [
  /分母(?:不同|不一样|不一致|差距|悬殊)|基数(?:不同|不一样|悬殊|差距)|(?:人口|规模|样本)(?:不同|不一样|悬殊|差距)/,
  /不可比|没法比|不能直接比|不宜直接比|不能简单比/,
  /忽略(?:了)?(?:人口|基数|分母|规模|样本)/,
  /(?:考虑|计入|结合|参考)(?:了)?(?:人口|基数|分母|规模)/,
  /(?:同样|同等|相同|相近|差不多)(?:的)?(?:人口|规模|体量|样本量|基数)/,
  /(?:人口|规模|体量|样本量|基数)(?:相当|相近|相同|差不多)/,
];
const EXEMPT_SAMEBASE_EN = [
  /different\s+(?:denominators?|bases?|populations?|sample\s+sizes?)/i,
  /not\s+(?:directly\s+)?comparable|incomparable/i,
  /ignor(?:e|es|ing|ed)\s+(?:the\s+)?(?:population|base|denominator|sample\s+size)/i,
  /(?:same|similar|comparable|equal|equivalent)\s+(?:population|base|denominator|sample\s+size|size)/i,
  /(?:population|sample\s+size|base|denominator)s?\s+(?:are|is)?\s*(?:similar|comparable|equal|equivalent)/i,
];

// ─── 豁免三：纯枚举/列举无比较结论意图 ────────────────────────────
// 计数只是列举事实且明说不作比较。
const EXEMPT_NOCOMPARE_ZH = [
  /(?:仅|只)(?:供|作)(?:参考|统计|记录)/,
  /(?:不作|不构成|不代表)(?:比较|评价|判断|结论)/,
  /(?:数据|数字)(?:仅|只)(?:是|为)/,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

// 统计某正则清单在文本中的总匹配次数（保留原 flags 并补 g，
// r249 教训：只传 'g' 会丢掉 i 标志，导致「Our store」这类大写开头漏统）
function countMatches(list, text) {
  let n = 0;
  for (const re of list) {
    const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
    const m = text.match(new RegExp(re.source, flags));
    if (m) n += m.length;
  }
  return n;
}

// 统计绝对计数出现的不同主体线索数：句中至少出现两个「主体指称」时才算对置。
// 简化实现：主体线索词表命中 ≥2，或出现「A…B…」型对置连接。
const SUBJECT_ZH = [
  // A 城 / B 城 / 甲厂 / 乙校（允许字母与汉字间有空格，r249：normalize 后
  // 「A 城」带空格，紧邻写法整族漏判）
  /[A-Za-z甲乙丙]\s*(?:城|市|国|地区|州|省|公司|店|团队|厂|校|院|县|区|队|组)/,
  /(?:我们|咱们|我方|这个|本|该)[^。，；]{0,4}(?:城|市|公司|店|团队|厂|校|院|县|区|队|组|国|产品|方案|版本|系统)/,
  /(?:他们|对方|别的|其他|隔壁|另一|那个)[^。，；]{0,4}(?:城|市|公司|店|团队|厂|校|院|县|区|队|组|国|产品|方案|版本|系统)/,
  /(?:去年|今年|上月|上季度|去年同期|前一?年)/,
];
const SUBJECT_EN = [
  /\b(?:our|their|his|her|its)\s+(?:team|company|city|store|shop|product|version|system|department|group|country|region|branch|factory|plant|site)\b/i,
  /\bcity\s+[A-Z]\b|\bteam\s+[A-Z]\b|\bstor\w*\s+[A-Z]\b|\bregion\s+[A-Z]\b|\bgroup\s+[A-Z]\b|\bcountry\s+[A-Z]\b/i,
  /\b(?:last|this)\s+(?:year|quarter|month|week)\b/i,
  /\b(?:another|the\s+other|previous|former|latter)\s+(?:city|team|company|product|version|group|region|country)\b/i,
  // 裸 ours/theirs 指称（r249：「theirs logged 1」无后续名词）
  /\b(?:ours|theirs)\b/i,
];

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkDenominatorSwap(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const ABS_Z = R.ABSOLUTE_ZH || ABSOLUTE_ZH;
  const ABS_E = R.ABSOLUTE_EN || ABSOLUTE_EN;
  const CMP_Z = R.COMPARE_ZH || COMPARE_ZH;
  const CMP_E = R.COMPARE_EN || COMPARE_EN;
  const ER_Z = R.EXEMPT_RATE_ZH || EXEMPT_RATE_ZH;
  const ER_E = R.EXEMPT_RATE_EN || EXEMPT_RATE_EN;
  const ES_Z = R.EXEMPT_SAMEBASE_ZH || EXEMPT_SAMEBASE_ZH;
  const ES_E = R.EXEMPT_SAMEBASE_EN || EXEMPT_SAMEBASE_EN;
  const EN_Z = R.EXEMPT_NOCOMPARE_ZH || EXEMPT_NOCOMPARE_ZH;

  // 统一口径 / 同分母明示 / 元陈述 → 不是在犯本谬误
  if (anyHit(ER_Z, text) || anyHit(ER_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(ES_Z, text) || anyHit(ES_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EN_Z, text)) return { hit: false, score: 0, detail: '', count: 0 };

  const absolute = anyHit(ABS_Z, text) || anyHit(ABS_E, text);
  if (!absolute) return { hit: false, score: 0, detail: '', count: 0 };

  // 绝对计数需至少两处（对置结构）：统计匹配次数
  let absCount = countMatches(ABS_Z, text) + countMatches(ABS_E, text);
  if (absCount < 2) return { hit: false, score: 0, detail: '', count: 0 };

  const compare = anyHit(CMP_Z, text) || anyHit(CMP_E, text);
  if (!compare) return { hit: false, score: 0, detail: '', count: 0 };

  // 主体对置：至少两个不同主体线索，或存在「A…B…」/「我们…他们…」型对置。
  // 注意：必须用解构后的 S_Z/S_E（可被负例注入替换），不能直接用闭包常量——
  // r249 实测：直接引用常量会让注入对该腿失效，测试假绿。
  const S_Z = R.SUBJECT_ZH || SUBJECT_ZH;
  const S_E = R.SUBJECT_EN || SUBJECT_EN;
  let subjCount = countMatches(S_Z, text) + countMatches(S_E, text);
  if (subjCount < 2) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  return {
    hit: true,
    score: 0.58,
    count: 1,
    detail: isZh
      ? '分母替换×不同基数绝对计数比较下优劣结论(zh)'
      : 'denominator swap×absolute-count-comparison-across-different-bases(en)',
  };
}

module.exports = {
  checkDenominatorSwap,
  __internals: () => ({
    ABSOLUTE_ZH, ABSOLUTE_EN, COMPARE_ZH, COMPARE_EN,
    EXEMPT_RATE_ZH, EXEMPT_RATE_EN,
    EXEMPT_SAMEBASE_ZH, EXEMPT_SAMEBASE_EN,
    EXEMPT_NOCOMPARE_ZH, SUBJECT_ZH, SUBJECT_EN,
  }),
};
