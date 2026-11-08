/**
 * src/survivor-time-bias.js — 「幸存时间偏误（length-time bias）」检测器（第 226 个判别维度）
 *
 * [r250 立项] 缺口实证：scripts/round-250/probe-gap-r250.js 复跑 r249 探针
 * （scripts/round-249/probe-gap-r249.js）19 条候选中 10 条漏判，其中本族
 * 中英双语 2/2 全漏判：
 *   · 接受这种疗法的病人平均活了五年，没接受的只活了一年，可见这疗法有效
 *   · Patients who took the drug lived 5 years on average while others lived
 *     1, so the drug works
 * decision 本体裁决 accelerate（philosophy_decision：type=accelerate /
 * confidence 0.7 / priority 40 / trigger optimal_conditions / goalReviewed
 * true；cognitiveLoad 与 uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。
 *
 * 辨别的族：幸存时间偏误（survivor time bias / length-time bias / survival
 * time comparison fallacy）——用**存活者生存期的长短差异**直接推断干预
 * （疗法/药物/方案）有效，忽略病程长度偏倚（病程本身就长的病例更容易被
 * 纳入、也更晚死亡，两组病程结构不同则生存期不可直接比）：
 *   接受这种疗法的病人平均活了五年，没接受的只活了一年，可见这疗法有效。
 *   吃了这个药的病人比没吃的多活了整整四年。
 *   治疗组生存期明显长于对照组，说明这个方案能延长生命。
 *   Patients who took the drug lived 5 years on average while others lived
 *   1, so the drug works.
 *   The treatment group had a longer survival period, proving the drug
 *   extends life.
 *
 * 与既有维度的边界（r250 归因）：
 *   · survivorship_bias（第 132 维）管**只统计存活者样本**（沉默的死亡
 *     案例被排除，样本本身被筛过）；本族两组数据**都可以在场**，错在
 *     「生存期长短→疗效」的推断忽略病程长度偏倚。
 *   · selection_bias（第 168 维）管**受限样本→总体推广**；本族错的是
 *     生存期比较本身的因果推断，不是推广范围。
 *   · pseudo_causal / post_hoc 管**时间先后当因果**；本族有具体的
 *     生存期时间量对置，锚在「生存期语义×疗效结论×时间对置」共现。
 *   · denominator_swap（第 224 维）管**不同分母的绝对计数比较**；本族
 *     比较的是**时间长度**（年/月）而非计数。
 *
 * 判据（三腿共现，缺一不判）：
 *   · 腿① SURVIVAL_TIME 生存期语义（中英）：活了X年/平均存活/生存期/
 *     中位生存/多活了/lived N years/survived/survival period/median
 *     survival。核心锚是**生存动词 + 时间量**或**生存期名词**（裸名词
 *     形态必收：「生存期」「存活时间」不带数字也命中，161 轮教训）。
 *     时间量支持阿拉伯数字、中文数字与英文词数（four/ten），并允许
 *     「整整/足足/上下/左右/近/约」等修饰插入（r250 实测：不放开则
 *     「活了整整四年」「六年上下」整句漏判）。
 *   · 腿② EFFICACY_VERDICT 疗效结论（中英）：有效/能延命/延长生命/
 *     救了命/疗效确凿/the drug works/extends life/effective。裸「延命」
 *     「疗效+形容词」必收（r250 实测漏判来源）。
 *   · 腿③ TIME_CONTRAST 时间对置（中英）：两组时间量对置（五年 vs
 *     一年）、while/whereas/versus、比…多活了X、治疗组长于对照组、
 *     longer survival、the others only N、以及**隐含对置**——「多活了
 *     X年/延长了X年」本身即相对自然病程的差量表述。裸「活了五年」
 *     无差量无对置归 unsupported_claim（中性事实陈述）。
 *
 * 为什么取 VERIFY 级：单句可能是统计学教学反例（「生存期比较要考虑
 * 长度偏倚，应改做随机对照」正是本族要教的判别动作）、医学课堂案例、
 * 对他人错误论证的转述引用。verify 的含义是「这个生存期比较可能有
 * 病程长度偏倚，需要回到随机分组/病程结构匹配再比」——调用方应要求
 * 补上对照设计或改比同期队列，而不是接受生存期差异直接得出的疗效结论。
 *
 * 明确不判的（豁免）：
 *   · 随机对照/同期队列在场（随机对照/随机分组/同期队列/倾向评分/
 *     randomized/RCT/stratified/matched cohort）：设计已控制病程结构；
 *   · 指出偏倚的元陈述（长度偏倚/病程偏倚/生存期不可比/length-time
 *     bias/lead-time bias）：那是在破除本谬误；
 *   · 生存率/死亡率的比率口径在场（五年生存率/mortality rate/survival
 *     rate）：比率比较不是生存期比较。
 */
'use strict';

// ─── 时间量工具：数字 × 单位（中英）────────────────────────────────
// 中文数字/阿拉伯数字 + 年|月|天|周|岁|载，允许「整整/足足/上下/左右/
// 近/约/大约/差不多」等修饰插入（r250 教训）。
const ZH_NUM = '[0-9０-９一二两三四五六七八九十百千万零几数个多]{1,4}';
const ZH_ADV = '(?:整整|足足|将近|近了|近|约|大约|差不多|上下|左右|多)?';
const ZH_UNIT = '(?:年|月|天|周|岁|载)';
// 英文词数 + 阿拉伯数字（r250 教训：只收 \d+ 会漏 "lived four years"）
const EN_NUM = '(?:\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|hundred)';
const EN_UNIT = '(?:years?|months?|days?|weeks?)';
// 生存动词（中文）：活/撑/挺
const ZH_SURV_V = '(?:活|撑|挺)';

// ─── 腿① SURVIVAL_TIME 生存期语义（中文）──────────────────────────
// 枚举腿自查（161 轮教训）：核心词取裸名词形态（「生存期」「存活时间」
// 不带数字也命中），并覆盖「活了X年」型动词+时间量组合。
const SURVIVAL_ZH = [
  // 生存期/存活时间 裸名词（不带数字也命中）
  /生存期|存活期|存活时间|生存时间|平均生存|中位生存|生存曲线|生存数据/,
  // 活了/活到/撑了/挺过 + （修饰）+ 时间量
  new RegExp(ZH_SURV_V + '(?:了|到|满)?\\s*' + ZH_ADV + '\\s*' + ZH_NUM + '\\s*' + ZH_UNIT),
  // 只活了/仅活了（对照组时间量）
  new RegExp('(?:只|仅|才)\\s*' + ZH_SURV_V + '(?:了|到)?\\s*' + ZH_ADV + '\\s*' + ZH_NUM + '\\s*' + ZH_UNIT),
  // 多活了/延长了/多撑了 + （修饰）+ 时间量（差量表述）
  new RegExp('(?:多活|延长|延命|多撑|多挺|挺过)\\s*(?:了)?\\s*' + ZH_ADV + '\\s*' + ZH_NUM + '\\s*' + ZH_UNIT),
  // 寿命/生命 + （延长|增加|多了|达到）+ （修饰）+ 时间量
  new RegExp('(?:寿命|生命)\\s*(?:延长|增加|多了|达到)?\\s*' + ZH_ADV + '\\s*' + ZH_NUM + '\\s*' + ZH_UNIT),
  // 平均/中位 + 存活/生存（裸名词短语）
  /(?:平均|中位|均值)(?:存活|生存|生存期|存活期)/,
];

// ─── 腿① SURVIVAL_TIME 生存期语义（英文）──────────────────────────
const SURVIVAL_EN = [
  /\bsurviv(?:ed|es|ing|al)\b/i,
  /\bsurvival\s+(?:time|period|curve|duration|data)\b/i,
  /\bmedian\s+survival\b/i,
  /\b(?:mean|average|median)\s+survival\b/i,
  // lived / survived / lasted + 词数或数字 + 时间单位
  new RegExp('\\b(?:lived|survived|lasted|endured)\\s+(?:for\\s+)?' + EN_NUM + '\\s*' + EN_UNIT, 'i'),
  // 差量：lived N years longer / more / less
  new RegExp('\\b(?:lived|survived|lasted)\\s+(?:for\\s+)?' + EN_NUM + '\\s*' + EN_UNIT + '\\s+(?:longer|more|less)', 'i'),
  /\b(?:extend(?:ed|s|ing)?|prolong(?:ed|s|ing)?)\s+(?:life|lives|survival|lifetime)\b/i,
  /\boutliv(?:ed|es|ing)\b/i,
  /\blife\s+expectancy\b/i,
];

// ─── 腿② EFFICACY_VERDICT 疗效结论（中文）─────────────────────────
const EFFICACY_ZH = [
  // 疗效/效果 + 判断形容词（裸「疗效是确凿的」）
  /(?:疗效|效果|效用|作用)(?:是|很|挺|相当|确实|明显|显著)?(?:确凿|确切|显著|明显|好|不错|可观|确切|肯定|确定)/,
  // 疗法/药物 + 有效
  /(?:疗法|药物|药|治疗|方案|手段|干预|疫苗|手术|疗程|用药|干预)(?:很|挺|相当|确实|明显|显著)?(?:有效|有疗效|有用|管用|见效|可行)/,
  // 裸有效/有疗效（兜底）
  /(?:有效|有疗效|管用|见效)/,
  // 能/可 + 延长生命/救命
  /(?:能|可|可以|得以|有助于|能够)(?:显著)?(?:延长|延命|救命|改善|提高)(?:生命|寿命|存活|生存|预后)?/,
  // 裸 延长生命/延命/救命（r250：「坚持用药能够延命」的「延命」裸形）
  /延长生命|延命|救命|改善预后|提高生存/,
  // 救了…命
  /救(?:了|活|下)[^。，；]{0,8}(?:命|人)/,
  // 显著改善/明显好转
  /(?:显著|明显|大幅)(?:改善|好转|提升|提高)/,
  // 可见/说明/证明 + 疗效词（引出）
  /(?:可见|说明|证明|表明|因此|所以|显然)[^。；;]{0,16}(?:有效|有疗效|管用|见效|救命|延长|延命|改善|好转)/,
];

// ─── 腿② EFFICACY_VERDICT 疗效结论（英文）─────────────────────────
const EFFICACY_EN = [
  /\b(?:the\s+)?(?:drug|treatment|therapy|medicine|vaccine|intervention|procedure|surgery|regimen|protocol)\s+(?:really\s+)?(?:works?|worked|helps?|helped|is\s+effective|was\s+effective)\b/i,
  /\b(?:works?|worked|effective|efficacious)\b/i,
  /\b(?:extends?|extended|prolongs?|prolonged|saves?|saved|improves?|improved)\s+(?:lives|life|survival|lifetime)\b/i,
  /\b(?:proves?|proven|proving|shows?|showed|demonstrates?|demonstrated)\s+(?:that\s+)?(?:the\s+)?(?:drug|treatment|therapy|it\s+)?(?:works?|extends?|is\s+effective|saves?)\b/i,
  /\b(?:significant|significant(?:ly)?|marked|marked(?:ly)?|substantial(?:ly)?)\s+(?:benefit|improvement|gain|survival\s+benefit)\b/i,
  /\b(?:so|thus|therefore|hence)\s+[^.]{0,30}\b(?:works?|effective|extends?|saves?|improves?)\b/i,
];

// ─── 腿③ TIME_CONTRAST 时间对置（中文）────────────────────────────
const CONTRAST_ZH = [
  // 而/但/然而 + （…）+ 只活了（对照组时间量；撑/挺也算）
  new RegExp('(?:而|但|但是|可是|然而|相比之下|反过来|对照之下|至于)[^。；;]{0,18}(?:只|仅|才)?\\s*' + ZH_SURV_V + '(?:了|到)?\\s*' + ZH_ADV + '\\s*' + ZH_NUM + '\\s*' + ZH_UNIT),
  // 比…多活了X / 比…长（允许修饰插入）
  new RegExp('比[^。；;]{0,14}(?:多活|多撑|延长|长)\\s*(?:了)?\\s*' + ZH_ADV + '\\s*' + ZH_NUM + '\\s*' + ZH_UNIT),
  // 治疗组/实验组 … 长于/高于/优于 … 对照组（裸名词对置，无数字）
  /(?:治疗组|实验组|用药组|干预组|接种组|新方案组|新药组|吃药组|服药组)[^。；;]{0,24}(?:长于|高于|优于|超过|胜过|领先|久于)[^。；;]{0,16}(?:对照组|未治疗组|安慰剂组|不用药组|未用药组|空白组)/,
  /(?:对照组|未治疗组|安慰剂组|不用药组|未用药组)[^。；;]{0,24}(?:短于|低于|差于|不及|比不上)[^。；;]{0,16}(?:治疗组|实验组|用药组|干预组|接种组)/,
  // 两组时间量对置（时间量 … 时间量，允许中间夹字）
  new RegExp(ZH_NUM + '\\s*' + ZH_UNIT + '[^。；;]{0,24}' + ZH_NUM + '\\s*' + ZH_UNIT),
  // 没接受/未接受/对照组的
  /(?:没|未|没有)(?:接受|服用|使用|采用)[^。；;]{0,14}(?:只|仅|才)?\s*(?:活|撑|挺)(?:了|到)?/,
  /(?:对照组|未治疗组|安慰剂组|不用药组)[^。；;]{0,14}(?:只|仅|才)?\s*(?:活|撑|挺)(?:了|到)?/,
  // 隐含对置：「多活了X年/延长了X年」本身即相对自然病程的差量表述
  new RegExp('(?:多活|延长|多撑|多挺|多活)\\s*(?:了)?\\s*' + ZH_ADV + '\\s*' + ZH_NUM + '\\s*' + ZH_UNIT),
];

// ─── 腿③ TIME_CONTRAST 时间对置（英文）────────────────────────────
const CONTRAST_EN = [
  /\bwhile\s+(?:the\s+)?(?:others?|control|untreated|placebo|non[-\s]?treated)\b[^.]{0,40}\b(?:lived|survived|lasted)\b/i,
  /\bwhereas\s+(?:the\s+)?(?:others?|control|untreated|placebo)\b[^.]{0,40}\b(?:lived|survived)\b/i,
  /\b(?:compared\s+to|versus|vs\.?)\s+(?:the\s+)?(?:control|untreated|placebo|others?)\b/i,
  // 差量：lived N years longer（不要求 than）
  new RegExp('\\b(?:lived|survived|lasted)\\s+(?:for\\s+)?' + EN_NUM + '\\s*' + EN_UNIT + '\\s+(?:longer|more|less)', 'i'),
  new RegExp('\\b(?:lived|survived|lasted)\\s+(?:for\\s+)?' + EN_NUM + '\\s*' + EN_UNIT + '\\s+longer\\s+than', 'i'),
  // 时间量 … versus/compared to … 时间量（允许中间夹字）
  new RegExp('\\b' + EN_NUM + '\\s*' + EN_UNIT + '[^.]{0,30}\\b(?:versus|vs\\.?|compared\\s+(?:to|with))\\s+(?:the\\s+)?(?:control|untreated|placebo|others?)?\\s*' + EN_NUM, 'i'),
  // 治疗组 … longer/higher … than/versus
  /\b(?:treatment|treated|experimental|therapy|drug|vaccine)\s+(?:group|arm|patients?|cohort)\b[^.]{0,40}\b(?:longer|higher|better|greater|superior)\b[^.]{0,40}\b(?:than|versus|vs\.?)\b/i,
  // 裸比较级：longer survival / longer survival time
  /\blonger\s+(?:median\s+)?(?:survival|survival\s+time|life|lifetime)\b/i,
  /\b(?:better|improved|superior)\s+survival\b/i,
  // 对照组 + 只有 N / only about N
  new RegExp('\\b(?:others?|control|untreated|placebo)\\s+(?:group\\s+)?(?:only|about|approximately|roughly)?\\s*' + EN_NUM, 'i'),
  // 差量时间量 + whereas/while 引导的对照组（允许 about/only 等修饰插入）
  new RegExp('\\b(?:lived|survived|lasted)\\s+(?:for\\s+)?(?:about|approximately|roughly|only|just|around|nearly)?\\s*' + EN_NUM + '\\s*' + EN_UNIT + '[^.]{0,30}\\b(?:whereas|while)\\b', 'i'),
];

// ─── 豁免一：随机对照/同期队列设计在场 ────────────────────────────
const EXEMPT_DESIGN_ZH = [
  /随机(?:对照|分组|分配|抽样)|随机化/,
  /同期队列|倾向评分|匹配(?:后|的)?(?:队列|样本|分组)|病例对照研究|队列研究/,
  /盲法|双盲|三盲|安慰剂对照/,
  /生存分析|Kaplan|Cox\s*模型|cox\s*回归|风险比|危害比/,
  /控制(?:了)?(?:混杂|病程|基线|变量)/,
];
const EXEMPT_DESIGN_EN = [
  /\brandomiz(?:ed|ation)\b/i,
  /\bRCT\b|\brandomized\s+controlled\s+trial\b/i,
  /\bpropensity\s+score\b|\bmatched\s+(?:cohort|sample|pairs?|groups?)\b/i,
  /\bdouble[-\s]?blind\b|\btriple[-\s]?blind\b|\bplacebo[-\s]?controlled\b/i,
  /\bsurvival\s+analysis\b|\bKaplan[-\s]?Meier\b|\bCox\s+(?:model|regression)\b|\bhazard\s+ratio\b/i,
  /\badjust(?:ed|ing)?\s+for\s+(?:confounders?|baseline|stage|disease\s+duration)\b/i,
];

// ─── 豁免二：指出偏倚的元陈述 ─────────────────────────────────────
const EXEMPT_META_ZH = [
  /长度偏倚|长度偏差|病程偏倚|病程长度偏倚|生存期偏倚/,
  /领先时间偏倚|过度诊断/,
  /生存期(?:不同|不一样|不可比|没法比|不能直接比|有偏)/,
  /(?:忽略|忽视|没考虑|未考虑|不考虑)(?:了)?(?:病程|长度偏倚|生存期差异|入院时间偏倚)/,
  /永生时间偏倚/,
];
const EXEMPT_META_EN = [
  /\blength[-\s]?time\s+bias\b/i,
  /\blead[-\s]?time\s+bias\b/i,
  /\bimmortal\s+time\s+bias\b/i,
  /\boverdiagnos(?:is|is)\b/i,
  /\bsurvival\s+(?:times?|curves?)\s+(?:are\s+)?not\s+comparable\b/i,
  /\bignor(?:e|es|ing|ed)\s+(?:the\s+)?(?:disease\s+duration|length[-\s]?time\s+bias|lead[-\s]?time\s+bias)\b/i,
  /\bduration\s+bias\b/i,
];

// ─── 豁免三：比率/率口径在场（生存率比较非生存期比较）─────────────
const EXEMPT_RATE_ZH = [
  /生存率|死亡率|病死率|缓解率|复发率|无进展生存率/,
  /五年生存率|一年生存率|三年生存率|十年生存率/,
  /每千人|每万人|年均|人均/,
];
const EXEMPT_RATE_EN = [
  /\bsurvival\s+rate\b|\bmortality\s+rate\b|\bdeath\s+rate\b/i,
  /\bremission\s+rate\b|\brecurrence\s+rate\b/i,
  /\bper\s+(?:capita|1000|100000|million)\b/i,
  /\b\d+[-\s]?year\s+survival\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

// 统计某正则清单在文本中的总匹配次数（保留原 flags 并补 g）
function countMatches(list, text) {
  let n = 0;
  for (const re of list) {
    const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
    const m = text.match(new RegExp(re.source, flags));
    if (m) n += m.length;
  }
  return n;
}

/**
 * 幸存时间偏误判别：生存期语义腿 × 疗效结论腿 × 时间对置腿，三腿共现。
 *
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkSurvivorTimeBias(text, inject) {
  // [稳定性审计 2026-11-09] 非字符串入口守卫：number/object 会让 text.match/text.slice 崩溃。
  if (typeof text !== 'string') text = String(text ?? '');
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const S_Z = R.SURVIVAL_ZH || SURVIVAL_ZH;
  const S_E = R.SURVIVAL_EN || SURVIVAL_EN;
  const E_Z = R.EFFICACY_ZH || EFFICACY_ZH;
  const E_E = R.EFFICACY_EN || EFFICACY_EN;
  const C_Z = R.CONTRAST_ZH || CONTRAST_ZH;
  const C_E = R.CONTRAST_EN || CONTRAST_EN;
  const D_Z = R.EXEMPT_DESIGN_ZH || EXEMPT_DESIGN_ZH;
  const D_E = R.EXEMPT_DESIGN_EN || EXEMPT_DESIGN_EN;
  const M_Z = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const M_E = R.EXEMPT_META_EN || EXEMPT_META_EN;
  const R_Z = R.EXEMPT_RATE_ZH || EXEMPT_RATE_ZH;
  const R_E = R.EXEMPT_RATE_EN || EXEMPT_RATE_EN;

  // 设计已控制病程结构 / 元陈述破除 / 比率口径 → 不判
  if (anyHit(D_Z, text) || anyHit(D_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(M_Z, text) || anyHit(M_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R_Z, text) || anyHit(R_E, text)) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿① 生存期语义（至少一处）
  const survivalCount = countMatches(S_Z, text) + countMatches(S_E, text);
  if (survivalCount < 1) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿② 疗效结论
  const efficacy = anyHit(E_Z, text) || anyHit(E_E, text);
  if (!efficacy) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿③ 时间对置：需至少一组对置结构（裸「活了五年」无差量无对置
  // 归 unsupported_claim，不进本维度）
  const contrast = anyHit(C_Z, text) || anyHit(C_E, text);
  if (!contrast) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  return {
    hit: true,
    score: 0.6,
    count: 1,
    detail: isZh
      ? '幸存时间偏误×生存期长短差异推断疗效(zh)'
      : 'survivor-time-bias×survival-duration-gap-implies-efficacy(en)',
  };
}

module.exports = {
  checkSurvivorTimeBias,
  __internals: () => ({
    SURVIVAL_ZH, SURVIVAL_EN,
    EFFICACY_ZH, EFFICACY_EN,
    CONTRAST_ZH, CONTRAST_EN,
    EXEMPT_DESIGN_ZH, EXEMPT_DESIGN_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    EXEMPT_RATE_ZH, EXEMPT_RATE_EN,
  }),
};
