'use strict';
/**
 * src/prevalence-incidence-confusion.js — 「患病率/发病率混淆」检测器
 * （第 281 个判别维度）
 * [r447 立项] 外部三层搜索（HN Algolia / Semantic Scholar / GitHub API）均无
 * 可用结果（S2 两次查询空返、GitHub 无规则引擎实现、HN 命中均为 LLM 路线
 * arXiv 2405.02318），按既定路径走内部缺口（阶段2b）。缺口实证：
 * /tmp/probe-r447-a.js 实测攻击 6/12 漏判（「这个病发病率很高，满大街都是
 * 病人」/「患病率很低，说明新发感染人数很少」整族零命中）、良性 4/12 误伤
 * 风险可控；decision 本体裁决 accelerate（philosophy_decision：type=
 * accelerate / confidence 0.7 / priority 40 / trigger optimal_conditions；
 * cognitiveLoad 与 uncertainty 均为 "unknown"，按轮次纪律不当实质背书）。
 *
 * 辨别的族：患病率/发病率混淆（prevalence-incidence confusion / 存量-流量
 * 指标混用）——把**存量指标**（患病率：某时点人群中现患总数）与**流量
 * 指标**（发病率：某时期新发病例数）互相推导，忽略二者量纲与驱动因素
 * 不同（患病率 ≈ 发病率 × 病程，病程变化即可让两者反向变动）：
 *   这个病发病率很高，满大街都是病人。（流量→存量直推）
 *   患病率很低，说明新发感染人数很少。（存量→流量直推）
 *   每年新发病例很多，可见患病人群占总人口的比重很大。
 *   The incidence is high, so a large share of the population currently has
 *   the disease.
 *   Incidence rates show 20% of people are living with this condition.
 *
 * 与既有维度的边界（r447 归因）：
 *   · effect_measure_misread（第 210 维前后段）管 **HR/OR/RR 效应量误读**
 *     （风险比当概率、OR 当 RR 等），不涉患病率/发病率的存量-流量之分；
 *   · count_rate_conflation 管**计数与比率混淆**（「500 人 = 5%」型分母
 *     换算错误），本族两个指标**都是率**、错在互相推导而非与绝对数混淆；
 *   · denominator_swap（第 224 维）管**不同分母的绝对计数对置比较**，本族
 *     是率与率的语义混用、无两个主体的绝对计数对置结构；
 *   · base_rate_neglect（第 169 维）管**单阳信号→个体高置信**，本族是
 *     群体指标之间的推导错误；
 *   · reverse_causation（第 172 维）/common_cause（第 174 维）管因果方向
 *     与共因，本族不判因果、判**指标口径混用**（可同向推导也判）。
 *
 * 判据（两腿共现 + 推导连接 + 邻近窗，缺一不判）：
 *   · 腿① FLOW 流量指标语义（中英）：发病率 / 新发病例 / 新增病例 /
 *     年发病 / 每年(新增|新发|发病) / 发病数 / incidence / newly diagnosed /
 *     new cases per year / annual incidence。含 r161 教训的裸名词自查
 *     （「发病率」三字整体成词，去掉词尾仍命中——词表收整词）。
 *   · 腿② STOCK 存量/现患结论语义（中英）：满大街(都)?是(病人|患者) /
 *     患病人群(占|的比) / 现有(的)?(患者|病人|病例) / 目前(有)?[数]?[%％]
 *     (的)?(人|人口) / 患(有|着) / 现症 / 人群中(有|患病) / 占人口 /
 *     living with / currently (has|have|affected|suffering) /
 *     share of the population (currently )?(has|have|is) /
 *     of people are living with。存量语义必须落在**推导结论位置**——
 *     即腿①之后、由连接词引出，单纯并列陈述两个指标不判。
 *   · 腿③ LINK 推导连接（中英）：所以 / 也就是说 / 这意味着 / 意味着 /
 *     可见 / 说明 / 因此 / 故而 / 表明 / so / which means / that means /
 *     meaning / therefore / thus / hence。流量指标与存量结论必须由推导
 *     连接词桥接（邻近窗 60 字 / EN 160 字符），证明这是**一次推导**而非
 *     两个独立事实的并列。
 *
 * 明确不判的（四组豁免）：
 *   · 正确陈述破除混淆（两回事/取决于/不能混用/前者看.*后者看/存量.*流量/
 *     not the same thing / distinct / must not be conflated / stock and flow
 *     等）——那是本维度要教的判别动作本身；
 *   · 纯概念/教学元陈述（两个指标名同现但无推导连接、或显式标注为概念
 *     讲解：概念/定义/区别/指标/口径 + prevalence vs incidence 对比说明）；
 *   · 疑问句（含 ?/？）与对冲（可能/也许/或许/大概/似乎/有待 + maybe/
 *     perhaps/might/probably）；
 *   · 存量陈述在前、流量指标在后的**反向并列**（「高血压患病率约27%，
 *     每年新增病例的发病率则低得多」是正确对比陈述，腿①腿②顺序与连接
 *     词形态均不匹配推导形——正确陈述由 STOCK 在前 + 对比转折词承载，
 *     本族要求 FLOW 在前 + 推导连接 + STOCK 结论在后）。
 *
 * 为什么取 VERIFY 级：单句可能是教学中作为反例引用、或作者正要指出口径
 * 问题（「发病率高不等于患病率高，还要看病程」正是本族要教的判别动作）、
 * 公共卫生报道中的口径误用需要回查原始指标定义。verify 的含义是「这个
 * 推导混用了存量与流量口径，需要回到指标定义核对」——调用方应要求补上
 * 口径说明或改写为不可推导的表述，而不是接受该推导结论。
 *
 * 已知边界：① 隐式混用（只给流量数字 + 现患结论词但无推导连接词，如
 * 「发病率很高。满大街都是病人。」两个独立短句）不判——无连接桥接即无
 * 推导形状；② 邻近窗 60 字（EN 160 字符）外的跨段推导不判；③ 豁免为
 * 句级属性，同句混合正确陈述与错误推导会整句放过（与既有维度同口径）。
 */

// ─── 腿① FLOW 流量指标语义（中文）──────────────────────────────
// 枚举腿自查（r161 教训）：收整词与裸词根形态（「发病率」「新发病例」
// 去后缀仍成词）；不收「发病」裸形（「发病原因」「发病机制」是病理机制
// 陈述，非流量指标）。注意「患病率」不在此表——它是存量指标名词，归
// STOCK 腿（r447 实测：把「患病率」误挂 FLOW 曾导致反向推导族漏判）。
const FLOW_ZH = [
  /发病率/,
  /新发(?:病例|患者|病人|感染|人数)/,
  // 裸名词形「新病例」（无「发」字）——r161 教训：只收「新发病例」
  // 会漏「出不了几个新病例」这类高频口语形（r447 实测漏判 1 例）
  /新病例/,
  /新增(?:病例|患者|病人|感染|确诊|人数)/,
  /年发病/,
  /每年(?:新增|新发|发病|新确诊)/,
  /发病数/,
  /发病(?:人数|例数)/,
  /罹患率/,
];

// ─── 腿① FLOW 流量指标语义（英文）──────────────────────────────
const FLOW_EN = [
  /\bincidence\b/i,
  /\bincidences\b/i,
  /\bincident\s+cases?\b/i,
  /\bnewly\s+(?:diagnosed|reported|infected|identified)\b/i,
  /\bnew\s+cases?\s+(?:per|each|a)\s+(?:year|annum|month)\b/i,
  /\bannual\s+(?:incidence|new\s+cases?)\b/i,
  /\bnumber\s+of\s+new\s+cases?\b/i,
];

// ─── 腿② STOCK 存量/现患结论语义（中文）───────────────────────
// 存量语义（某时点人群中现患状态/规模）。「患病率」作为存量指标名词归
// 本腿（与 FLOW 腿的「发病率」互为混用对象，双向推导由位置逻辑判别）。
const STOCK_ZH = [
  /患病率/,
  // 满大街/遍地/到处 + 是 + 病人/患者（口语存量直推的典型形）
  /(?:满大街|满城|遍地|到处|处处)(?:都)?(?:是|为)(?:病人|患者|病号|病例)/,
  // 患病人群/患者人数 + 占/比重/规模
  /患(?:病|患者)(?:人群|人数)(?:占|的比|比重|规模)/,
  /患者(?:人数|人群)?(?:占|的比)/,
  // 现有/目前 + 患/患者/病例
  /(?:现有|目前|现存)(?:的)?(?:患者|病人|病例|感染者|患病人群)/,
  // 目前 + 数字% + 的 + 人/人口（数字可为多位——r447 实测：初版用
  // 单字符量词 [0-9]? 导致「20%的人口」整族漏判，改 + 量词）
  /目前(?:有)?(?:约|将近|近)?[0-9０-９一二两三四五六七八九十百千万几半成当]+[%％]?(?:的)?(?:人|人口|国民|居民)/,
  // 患有/患着 + 病（现患状态）
  /患(?:有|着|上)(?:了)?(?:这种|此|该|这类)?(?:病|疾病|慢性病|癌症)/,
  // 现症/在患/患病例数
  /现症|在患|患病例数|现患人数/,
  // 每 N 个人里就有/其中 + 患病/患者（比例化存量结论）
  /每[0-9０-９一二两三四五六七八九十百千万几半成当]+(?:个)?人(?:里|中|当中)?(?:就)?有[^。；;]{0,8}(?:患|患者|病人|病例)/,
  /[0-9０-９一二两三四五六七八九十百千万几分之]+(?:的)?人(?:正|处|处于)?(?:在)?(?:患|抑郁|生病|患病|感染|带瘤|带病)/,
  // 带瘤/带病生存（现患状态的典型口语形）
  /带(?:瘤|病|癌)(?:生存|生活|活着)/,
  // 处于 + 患病/抑郁/感染状态（存量状态结论）
  /处于[^。；;]{0,10}(?:状态|期)/,
  // 人群中 + 患病/有
  /人群中(?:有|患病|的患)/,
  /占人口|人口中(?:有|患)/,
  // 总量/规模 + 病人/患者（存量规模结论）
  /(?:病人|患者)(?:总数|总量|规模)/,
];

// ─── 腿② STOCK 存量/现患结论语义（英文）───────────────────────
const STOCK_EN = [
  /\bliving\s+with\b/i,
  /\bcurrently\s+(?:has|have|had|affected|suffering|diagnosed)\b/i,
  /\b(?:share|proportion|percentage|fraction)\s+of\s+(?:the\s+)?population\s+(?:currently\s+)?(?:has|have|is|are)\b/i,
  /\bof\s+people\s+(?:are|is)\s+(?:currently\s+)?(?:living|suffering|affected)\b/i,
  /\bpeople\s+(?:are|is)\s+(?:currently\s+)?(?:living\s+with|affected\s+by|suffering\s+from)\b/i,
  /\bexisting\s+(?:cases?|patients?|sufferers?)\b/i,
  /\bprevalent\s+cases?\b/i,
  /\bpopulation\s+(?:currently\s+)?(?:has|have|is)\b/i,
  /\bmost\s+people\s+(?:you\s+meet|around)\s+(?:are|is)\b/i,
];

// ─── 腿③ LINK 推导连接（中英）─────────────────────────────────
// 流量指标与存量结论之间的推导桥接。单纯的「和」「与」「以及」并列不算。
const LINK_ZH = [
  /所以/,
  /也就是说/,
  /这意味着/,
  /意味着/,
  /可见/,
  /说明/,
  /因此/,
  /故而/,
  /表明/,
  /据此/,
  // 「因为」在此承担反向推导桥接（「患病率低，因为新病例少」是反向
  // 混用的高频形——存量低反推流量少）
  /因为/,
  /由于/,
];
const LINK_EN = [
  /\bso\b/i,
  /\bwhich\s+means\b/i,
  /\bthat\s+means\b/i,
  /\bmeaning\b/i,
  /\btherefore\b/i,
  /\bthus\b/i,
  /\bhence\b/i,
  /\bimplying\b/i,
  // 数据呈示动词（EN 报道高频推导形：「Incidence rates show 20% of
  // people are living with…」——show 在此承担推导桥接功能）
  /\bshows?\b/i,
  /\bshowing\b/i,
  /\bindicates?\b/i,
  /\bsuggests?\b/i,
  /\bimplies?\b/i,
  /\breveals?\b/i,
  /\breflects?\b/i,
];

// ─── 豁免一：正确陈述破除存量-流量混淆 ────────────────────────
// 指出「两者不是一回事/取决于病程/不能混用」的陈述正是本维度要保护的
// 判别动作。
const EXEMPT_CORRECT_ZH = [
  /两(?:回|码)?事|不是一(?:回)?事|两(?:个)?(?:指标|概念)?(?:不同|不一样)/,
  /(?:取决于|取决于|看)(?:病程|病程长短|病时长|得病时间)/,
  /不能混用|不可混用|不能混淆|不应混淆|不能互推|不能互换/,
  /前者看[^。；;]{0,12}后者看|前者[^。；;]{0,4}存量|存量[^。；;]{0,4}流量/,
  /(?:存量|流量)(?:指标)?(?:和|与|或)(?:存量|流量)?(?:指标)?(?:的)?(?:区别|之分|差异)/,
  /口径(?:不同|不一|要分清|不能混)/,
  /两个指标/,
  /混用/,
];
const EXEMPT_CORRECT_EN = [
  /\bnot\s+the\s+same\s+(?:thing|metric|measure)\b/i,
  /\bdistinct\s+(?:metrics?|measures?|concepts?)\b/i,
  /\bmust\s+not\s+(?:be\s+)?(?:conflated|confused|interchanged)\b/i,
  /\bstock\s+and\s+flow\b/i,
  /\bdepends?\s+on\s+(?:the\s+)?(?:duration|disease\s+duration|course)\b/i,
  /\bconflat(?:e|es|ing|ed)\b/i,
  /\bprevalence\s+(?:vs\.?|versus|and)\s+incidence\b/i,
  /\bincidence\s+(?:vs\.?|versus|and)\s+prevalence\b/i,
];

// ─── 豁免二：概念/教学元陈述 ─────────────────────────────────
// 显式作为概念讲解（定义课、教材、指标说明）而非运用该混淆。
const EXEMPT_META_ZH = [
  /(?:概念|定义|区别|之分|差异|关系|对比|比较)(?:是|讲解|说明|如下)/,
  /(?:患病率|发病率)(?:和|与)(?:患病率|发病率)(?:的)?(?:概念|定义|区别)/,
  /指标(?:讲解|说明|定义)/,
  /流行病学(?:教材|课本|课程|中)/,
];
const EXEMPT_META_EN = [
  /\bby\s+contrast\b/i,
  /\bin\s+contrast\b/i,
  /\bwhereas\b/i,
  /\bwhile\b/i,
  /\bdefinition\s+of\b/i,
  /\bdefined\s+as\b/i,
];

// ─── 豁免三：疑问句与对冲 ─────────────────────────────────────
function isQuestionOrHedged(text) {
  if (/[?？]/.test(text)) return true;
  const hedgeZh = /可能|也许|或许|大概|似乎|好像|说不定|有待|未必|不一定|未必/;
  const hedgeEn = /\bmaybe\b|\bperhaps\b|\bmight\b|\bprobably\b|\bseems?\b|\bappears?\b|\bpossibly\b/i;
  return hedgeZh.test(text) || hedgeEn.test(text);
}

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/**
 * 检测 FLOW 与 STOCK 的相对位置与推导形状。本族核心形状：FLOW 与 STOCK
 * 构成一次「存量↔流量」互相推导，**双向都判**（混用不分方向）：
 *   · 正向（FLOW 在前、STOCK 在后）：流量指标直推存量现患结论——
 *     「发病率很高，满大街都是病人」「发病率达到15%，六分之一的人正
 *     处于抑郁状态」；
 *   · 反向（STOCK 在前、FLOW 在后）：存量指标反推流量规模——
 *     「患病率很低，说明新发感染人数很少」。
 * 两档邻近窗：
 *   · 连接档（LINK 在场）：FLOW 与 STOCK 之间出现推导连接词，邻近窗放宽
 *     至 60 字（ZH）/ 160 字符（EN）；
 *   · 并置档（无连接词）：FLOW 与 STOCK 紧邻并置（中间无句号、间隔 ≤16
 *     字），同样构成直推。r161 教训：最常见的口语攻击形恰恰没有连接词，
 *     硬性第三腿会整族漏判（r447 实测窗 12 字差一字漏「发病率很高，身边
 *     好多人都在带瘤生存」）。
 * 正确对比陈述（「患病率约27%，发病率则低得多」）靠腿序之外的形状区分：
 * 该形态两个指标**各自带数字事实**、中间是对比转折而非推导连接，且整句
 * 被豁免一（「两回事/不能混用」类破除陈述）或正确对比豁免覆盖。
 * @returns {boolean}
 */
function flowStockDerivation(text) {
  const zh = /[\u4e00-\u9fff]/.test(text);
  // 中文文本同时收 EN 腿（防中英混排）；英文文本只用 EN 腿。
  const flowList = zh ? FLOW_ZH.concat(FLOW_EN) : FLOW_EN;
  const stockList = zh ? STOCK_ZH.concat(STOCK_EN) : STOCK_EN;
  const linkList = zh ? LINK_ZH.concat(LINK_EN) : LINK_EN;

  // 找某个腿词表的第一个命中位置。注意：必须用 RegExp.exec 而非
  // String.match——带 g 标志的 match 返回字符串数组、不含 .index 属性
  // （r447 实测：初版用 match 导致位置恒 -1、整族零命中）。
  const firstMatch = (list) => {
    let pos = -1;
    for (const re of list) {
      const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
      const m = new RegExp(re.source, flags).exec(text);
      if (m && m.index !== undefined) {
        if (pos === -1 || m.index < pos) pos = m.index;
      }
    }
    return pos;
  };

  const flowPos = firstMatch(flowList);
  if (flowPos === -1) return false;

  // 在 FLOW 之后找 STOCK（正向），或在 FLOW 之前找 STOCK（反向）。
  // 两方向都收集，任一方向的「邻近窗 + 推导形状」成立即判。
  const collectAfter = (list, from) => {
    let best = -1;
    for (const re of list) {
      const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
      const m = new RegExp(re.source, flags).exec(text);
      if (m && m.index !== undefined && m.index > from) {
        if (best === -1 || m.index < best) best = m.index;
      }
    }
    return best;
  };

  const candidates = [collectAfter(stockList, flowPos)];
  // 反向：找 FLOW 之前最近的 STOCK 命中
  let stockBefore = -1;
  for (const re of stockList) {
    const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
    const m = new RegExp(re.source, flags).exec(text);
    if (m && m.index !== undefined && m.index < flowPos) {
      if (stockBefore === -1 || m.index > stockBefore) stockBefore = m.index;
    }
  }
  if (stockBefore !== -1) candidates.push(stockBefore);

  for (const [i, stockPos] of candidates.entries()) {
    if (stockPos === -1) continue;
    const reverse = i === 1; // 第二个候选是反向（STOCK 在前）
    const [a, b] = stockPos > flowPos ? [flowPos, stockPos] : [stockPos, flowPos];
    const between = text.slice(a, b);
    // 跨句切分（。！？；;）不算同一次推导
    if (/[。！？;；]/.test(between)) continue;
    const linked = anyHit(linkList, between);
    // 连接档：LINK 在场 + 宽窗
    if (linked) {
      const win = zh ? 60 : 160;
      if (between.length <= win) return true;
      continue;
    }
    // 并置档：仅对正向（FLOW 在前）开放。反向（STOCK 在前）必须带推导
    // 连接词——r447 实测：放开反向并置后，「患病率约27%，发病率则低得
    // 多」「HIV 患病率高于发病率，因为这是慢性感染」「即便发病率不变，
    // 患病率也会下降」等正确对比/因果陈述整族误伤（存量指标与流量指标
    // 各自成句、同现即陈述关系，不构成推导）。
    if (!reverse) {
      // 正向并置还要求中间不出现让步/否定连词——「发病率不变，患病率
      // 下降」是被「即便…也」框住的条件陈述，不是流量直推存量（r447
      // 实测：「治愈率提高后，即便发病率不变，患病率也会下降」曾被
      // 2 字窗误伤）。
      if (/即便|即使|尽管|虽然|虽说|纵然|哪怕|无论|不管|不变|未变|并无/.test(between)) continue;
      const juxtaposeWin = zh ? 16 : 40;
      if (between.length <= juxtaposeWin) return true;
    }
  }
  return false;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkPrevalenceIncidenceConfusion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const F_Z = R.FLOW_ZH || FLOW_ZH;
  const F_E = R.FLOW_EN || FLOW_EN;
  const S_Z = R.STOCK_ZH || STOCK_ZH;
  const S_E = R.STOCK_EN || STOCK_EN;
  const L_Z = R.LINK_ZH || LINK_ZH;
  const L_E = R.LINK_EN || LINK_EN;
  const EC_Z = R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH;
  const EC_E = R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN;
  const EM_Z = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const EM_E = R.EXEMPT_META_EN || EXEMPT_META_EN;

  // 四组豁免统一先行判定
  if (anyHit(EC_Z, text) || anyHit(EC_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EM_Z, text) || anyHit(EM_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (isQuestionOrHedged(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const flow = anyHit(F_Z, text) || anyHit(F_E, text);
  if (!flow) return { hit: false, score: 0, detail: '', count: 0 };
  const stock = anyHit(S_Z, text) || anyHit(S_E, text);
  if (!stock) return { hit: false, score: 0, detail: '', count: 0 };

  // 顺序 + 推导形状约束（正确对比陈述不满足此形状）
  const okOrder = flowStockDerivation(text);
  if (!okOrder) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true,
    score: 0.56,
    count: 1,
    detail: isZh
      ? '患病率/发病率混淆×流量指标直推存量现患结论(zh)'
      : 'prevalence-incidence confusion×flow-to-stock derivation(en)',
  };
}

module.exports = {
  checkPrevalenceIncidenceConfusion,
  __internals: () => ({
    FLOW_ZH, FLOW_EN, STOCK_ZH, STOCK_EN, LINK_ZH, LINK_EN,
    EXEMPT_CORRECT_ZH, EXEMPT_CORRECT_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
  }),
};
