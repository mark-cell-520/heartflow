/**
 * src/healthy-user-bias.js — 「健康使用者偏倚/健康依从者效应」检测器
 * （r372 新建：econ_reasoning_gate 聚合族第 27 子族 / 插件层第 32 族）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r372 立项探针（scripts/round-372/probe-r372-pool.js，v6.8.190 pristine
 *   基线）：16 候选同池定拨——A adverse_selection 攻击 5/5 但被存量维度
 *   （reasoning_coherence/gate_block/perfect_error/hindsight_bias）全代拦、
 *   边际价值零；B moral_hazard 穿透 2/5、C free_rider 穿透 1/4、D 合成谬误
 *   穿透 2/5、F illicit_process 穿透 3/4 但全被 absolute_claim/perfect_error
 *   代拦、G 概率相加 4/4 全被 perfect_error 代拦、H zero_risk_bias 良性
 *   3/4 非 pass（confidence 误伤，边界脏）；**M healthy_user_bias 攻击穿透
 *   8/16（真零命中，存量维度零覆盖）+ 良性 0/4 零误伤**——唯一同时满足
 *   「存量零覆盖」与「良性边界全净」的候选，按 r364-r371 纪律落地。二段
 *   扩样深探（probe-r372-healthyuser.js，16 攻击 + 12 良性风险）：攻击
 *   8/16 穿透（另 8/16 被 reverse_causation/fallacy_of_relevance/confidence
 *   等存量维度代拦），良性 10/12 pass（2 条非 pass 均系存量维度
 *   stereotype/presupposition/mediator_confusion 误拦，非本族增量）。
 *   海外扫描：arXiv 两轮各 15 条全 OR 展开噪声零相关、GitHub repos 0、
 *   S2 429 限流——空返，按既有形态自建。
 *
 * 外部来源：空返，按既有形态自建。家族定义取自流行病学/循证医学标准论述：
 *   healthy user bias（健康使用者偏倚）/ healthy adherer effect（健康依从
 *   者效应）——坚持健康行为、按时服药、主动体检的人群，本身在受教育
 *   程度、收入、健康意识、基础健康状况上系统性地优于非坚持者；观察性
 *   研究中两组间的结局差异（更健康、死亡率更低、住院更少）因此混杂了
 *   「行为/干预的效果」与「人群自选择」，把它直接兑现为行为/药物/保健品
 *   的功劳即犯此偏倚。经典案例：维生素服用者更健康、他汀依从者死亡率
 *   更低——混杂机制都是自选择而非药理。
 *
 * 辨别的族：健康使用者偏倚/健康依从者效应（healthy user bias / healthy
 *   adherer effect / adherence confounding）——文本同时给出两个信号：
 *   腿① GROUP 健康行为/依从群体在场——吃维生素的人、补充剂使用者、
 *     坚持复诊的病人、每天跑步的人、regular joggers、those who take
 *      supplements；
 *   腿② CAUSAL 归因断言在场——把该群体的结果直接兑现为行为/产品的
 *     功劳：让人健康/防病/延寿/保护/实锤/管用/疫苗/有效；proves/
 *     guarantees/protects/works for；
 *   两腿近距共现，缺一不判。
 *
 * 腿②只收归因断言、不收裸结果陈述：「吃维生素的人明显更健康」是一句
 * （可能为真的）观察陈述，不是推理谬误；谬误发生在把它兑现为「所以
 * 维生素让人健康」的那一步（r372 设计决策——纯结果形不判，良性边界
 * 因此全净：12 条良性风险样本腿②零命中，CONCEPT/CORRECT 两组豁免是
 * 纵深而非承重，承重性由概念教学/纠正句专样证明）。
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：健康类断言里最高频的
 * 推理断层就是「吃/做 X 的那群人结局更好，所以 X 有效」——保健品营销、
 * 养生话术、观察性研究的媒体解读全在这个形上打转。与正当推理的界线很
 * 清楚：指出混杂与限定的句子（「可能因为他们本来就更注重健康管理」
 * 「这可能反映的是健康使用者效应」「相关不等于因果」）、点名概念的
 * 教学句（「健康使用者偏倚是指……」「The healthy-user effect confounds
 * ...」）、对照组陈述（「不吃维生素的人反而……」）一律豁免。
 *
 * 与既有维度的边界（r372 归因，探针 + 边界实测）：
 *   · confounding_by_indication（r339）管治疗分配由基线预后驱动的混杂
 *     ——本族管自我选择的健康行为/依从人群，腿①锁定行为群体而非处方
 *     分配；
 *   · reverse_causation 管因果方向倒置——本族管「自选择人群 × 归因
 *     断言」这一具体两腿形，不要求方向倒置（「更健康的人本来就更可能
 *     吃维生素」恰是本族指出的混杂机制，不是攻击的替代解释）；
 *   · selection_bias / self_selection_bias 管抽样框错误——本族管具体
 *     的健康行为依从混杂，样本句穿透实证（探针攻击 8/16 存量零命中）；
 *   · 存量 econ 子族（mercantilism/decoy_effect 等）均不覆盖健康行为
 *     归因形。
 *
 * 判据（两腿近距共现 + 两组豁免 + 双重否定守卫，缺一不判）：
 *   ① 腿① GROUP 健康行为/依从群体在场（受否定守卫：「不吃维生素的人」
 *      是对照组形，组内否定词 + 前置裸否定字双保险）；
 *   ② 腿② CAUSAL 归因断言在场（受否定守卫：强否定表 + 前置裸否定字
 *      ——「不能保证有效」「无法证明有用」是对冲形）；
 *   ③ 两腿须落在邻近窗内（以腿①为锚，ZH 40 字 / EN 120 字符），方向不限；
 *   ④ 豁免 A 概念教学（健康使用者偏倚/效应/healthy user bias 被点名 +
 *      定义/描述框架词共现，防前缀绕过）；
 *   ⑤ 豁免 B 正确限定/混杂讨论（可能/未必/不等于/混杂/自选择/随机对照/
 *      相关不等于/不能直接归功/这与……有关 + EN may/might/confound/
 *      correlation/randomized）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一项观察性发现（「数据显示
 * 补充剂使用者住院率更低」是结果陈述——腿②缺省天然排除）。verify 的
 * 语义是「这段话把自选择人群的健康结果直接归因于行为/产品，先补齐
 * 混杂讨论（自选择、依从性、基线差异）或随机对照证据，再决定是否
 * 采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 无归因的纯结果陈述（每天跑步的人体检指标全面更好——腿②缺省）；
 *   · 混杂讨论句（吃维生素的人更健康，可能因为他们本来就更注重健康
 *     管理——腿②缺省，豁免 B 纵深）；
 *   · 概念教学句（健康使用者偏倚是指把补充剂使用者更健康当成补充剂
 *     让人健康的证据的错误——豁免 A）；
 *   · 纠正句（吃维生素的人更健康，可能说明维生素有效，但这只是自选择
 *     混杂——豁免 B）；
 *   · 对照组/否定群体形（不吃维生素的人反而更健康——腿①否定守卫）；
 *   · 健康意识/习惯陈述（主动体检者健康意识强——腿②缺省）。
 */

'use strict';

// ─── 腿① GROUP 健康行为/依从群体在场 ────────────────────────
// 形 A：行为动词/依从状语 + … + 群体名词（吃维生素的人、坚持复诊的病人、
//   每天跑步的人、主动参加体检的人）。动词列表只收健康行为与依从行为，
//   不收「买/卖/看」等无关动词（「买保险的人」是 adverse_selection 族
//   形，不属本族射程）。
const GROUP_ZH_A = /(?:吃|服用|食用|喝|饮用|使用|补充|摄入|坚持|规律|主动|按时|依从|长期|经常|常年|每日|每天|复诊|体检|运动|跑步|散步|锻炼|健身|冥想|瑜伽|检查|筛查)[^。！？；，]{0,14}(?:的人|人群|者|患者|病人|群体|组|使用者|用户|老人|老年人|长者|儿童|孩子|学生|女性|男性|上班族|白领|宝妈|烟民)/;
// 形 B：产品名 + 集体名词，动词可缺席（补充剂使用者、红酒爱好者）。
const GROUP_ZH_B = /(?:维生素|保健品|补充剂|鱼油|营养品|补品|钙片|益生菌|减肥药|他汀|降压药|降糖药|中药|红酒|巧克力|咖啡|茶叶|药物|药剂)[^。！？；，]{0,6}(?:使用者|用户|服用者|食用者|饮用者|人群|患者|病人|爱好者)/;

// EN：who/that 定语从句（people who take supplements）+ 修饰名词族
// （regular joggers / wine drinkers）+ 产品名词族（supplement users）。
const GROUP_EN_A = /\b(?:people|those|patients|seniors|individuals|adults|men|women|participants|subjects)\b[^.]{0,40}?\b(?:who|that)\b[^.]{0,50}?\b(?:take|takes|taking|use|uses|using|adhere|adheres|adhering|stick|sticks|stuck|follow|follows|following|drink|drinks|consume|consumes|exercise|exercises|walk|walks|attend|attends|comply|complies)\b/i;
const GROUP_EN_B = /\b(?:regular|daily|avid|long-term|lifelong|consistent|faithful)\s+(?:joggers?|runners?|walkers?|drinkers?|users?|takers?|exercisers?|meditators?|attenders?)\b|\b(?:supplement|vitamin|drug|medication|wine|tea|coffee|chocolate)\s+(?:users?|takers?|drinkers?)\b/i;

const GROUP_ZH_GROUPS = [['GROUP_ZH_A', [GROUP_ZH_A]], ['GROUP_ZH_B', [GROUP_ZH_B]]];
const GROUP_EN_GROUPS = [['GROUP_EN_A', [GROUP_EN_A]], ['GROUP_EN_B', [GROUP_EN_B]]];

// ─── 腿② CAUSAL 归因断言在场 ────────────────────────────────
// 把群体结果直接兑现为「该行为/产品有效」的断言。不收裸结果陈述——「每天
// 跑步的人体检指标全面更好」是观察陈述（r372 设计决策，见头部注释）。
const CAUSAL_ZH = /让人[^。]{0,6}(?:健康|少生病|长寿|不得病|不生病|更健康)|使人[^。]{0,6}(?:健康|少生病|长寿)|促进健康|防病|防癌|强身|预防[^。]{0,6}(?:疾病|癌症|慢病|感冒)|延寿|延长(?:生命|寿命)|保护[^。]{0,6}(?:心脏|血管|肝肾|肠胃|身体)|降低[^。]{0,8}(?:风险|概率|死亡率|复发率|患病率)|保证|实锤|铁证|坐实|奇效|良方|管用|疫苗|药到病除|包治百病|万能药|功劳|功效|疗效|秘诀|有效|有用|起作用|见效|就是[^。]{0,4}(?:最好|保证|疫苗|良方|关键|秘诀|原因|功劳|功效)|本身就能|本身是|战胜(?:疾病|癌症|慢病)|(?:所以|因此|从而|这说明?|足以证明|足以表明)[^。]{0,14}(?:有效|有用|防病|延寿|保护|让人健康|功劳|功效|疗效|降低)/;
const CAUSAL_EN = /\b(?:proves?|proven|guarantees?|guaranteed|protects?|extends?|cures?|prevents?|helps?|effective|works?|is the best|the secret|the key to|works for|silver bullet|what works|the reason why|keeps you|is why)\b/i;

const CAUSAL_ZH_GROUPS = [['CAUSAL_ZH', [CAUSAL_ZH]]];
const CAUSAL_EN_GROUPS = [['CAUSAL_EN', [CAUSAL_EN]]];

// ─── 距离窗（行为群体 × 归因断言）───────────────────────────
const PAIR_ZH = 40;
const PAIR_EN = 120;

// ─── 豁免 A：概念教学（点名健康使用者偏倚/依从者效应概念 + 框架词）────
// 概念名单独出现不豁免（「健康使用者效应不成立，吃维生素的人确实更
// 健康」是攻击形）——必须与框架词共现，防前缀绕过（r368/r369/r371
// 同款教训）。
const CONCEPT_ZH = /(?:健康使用者(?:偏倚|偏差|偏误|效应)|健康依从者[^。]{0,2}(?:偏倚|偏差|偏误|效应))[^。，；]{0,24}(?:是指|指|是一种|属于|定义为|称作|称为|理论|概念|认为|指出|说明|揭示|反映|意味着|表明|描述|解释|教科书|文献|论文|学科|流行病学|统计|学科)|(?:是指|指|是一种|属于|定义为|称作|称为|理论|概念|认为|指出|说明|揭示|反映|意味着|表明|描述|解释|教科书|文献|论文|学科|流行病学|统计)[^。，；]{0,24}(?:健康使用者(?:偏倚|偏差|偏误|效应)|健康依从者[^。]{0,2}(?:偏倚|偏差|偏误|效应))/;
const CONCEPT_EN = /\bhealthy[- ]user (?:bias|effect)s?\b[^.]{0,80}?\b(?:is|are|was|were|refers?|means?|describes?|shows?|confounds?|reflects?|illustrates?|concept|notion|problem|issue|textbook|literature|paper|study|example|instance|pitfall|caveat)\b|\bhealthy[- ]adherer (?:effect|bias)\b[^.]{0,80}?\b(?:is|are|refers?|means?|describes?|confounds?|reflects?|illustrates?)\b|\b(?:is|are|refers?|means?|called|known as|describes?|illustrates?|confounds?|reflects?)\b[^.]{0,80}?\bhealthy[- ]user\b/i;

// ─── 豁免 B：正确限定/混杂讨论 ───────────────────────────────
// 收：对冲（可能/未必/不一定/未必能）、否认归因（不等于/不能说明/
// 不能证明/不能直接归功/不应归因）、混杂机制词（混杂/自选择/随机对照/
// 相关不等于/相关性）、替代归因（这与……有关/与……相关）、方法论谦逊
// （需要进一步验证/有待/存疑）。不收裸情态词（「应该吃维生素」仍是
// 攻击形——r368 同款教训：CORRECT 只收正面限定形）。攻击样本实测均
// 不含这些形。
const CORRECT_ZH = /可能|未必|不一定|未必能|不等于|不能说明|无法说明|并不能|并不成立|不足以|混杂|自选择|随机对照|相关(?:性)?不等于|不能据此|无法据此|不能直接归功|不应归因|别归因|勿归因|不能证明|需要进一步验证|有待|存疑|这[^。]{0,16}(?:有关|相关)|不能归因|难以归因|个案|对照组|双重归因|不能简单归因/;
const CORRECT_EN = /\b(?:may|might|could|possibly|perhaps|not necessarily|does not|do not|cannot|can't|couldn't|confound\w*|self-selection|selection bias|correlat\w+|randomi[sz]ed|no evidence|not proof|cannot be attributed|should not be attributed|unclear|remains unclear|tentative|observational)\b/i;

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

// 强否定表：命中文本内或紧前出现，说明断言被否定/对冲。
const STRONG_NEG_ZH = /(?:并未|并没有|绝不是|绝对不|绝不|丝毫不|一点都不|压根不|根本就不|不等于|不代表|说明不了|证明不了|很难说|不见得|未必|不一定|不必然|不能|无法|并非|没能|难以|不大|无从)/;
const STRONG_NEG_EN = /\b(?:not\s+that|far\s+from|hardly|barely|nowhere\s+near|by\s+no\s+means|in\s+no\s+way|not\s+necessarily|does\s+not|did\s+not|has\s+not|have\s+not|cannot|can'?t|couldn'?t|no\s+longer\s+means?)\b|\b(?:not|never|no)\s+(?:effective|works?|proves?|guarantees?|protects?|helpful|useful)\b/i;

// 腿①专属否定守卫：群体本身被否定时是对照组形，不是攻击群体——
// 「不吃维生素的人」「those who do not take supplements」是对照组。
const GROUP_NEG_ZH = /[不没未]/;
const GROUP_NEG_EN = /\b(?:not|never)\b/i;

function negBeforeZh(text, idx) {
  const before = text.slice(Math.max(0, idx - 4), idx);
  return /[不没无未非]/.test(before);
}

function matchAlive(text, x, opts) {
  opts = opts || {};
  if (opts.groupNeg) {
    if (GROUP_NEG_ZH.test(x.raw) || GROUP_NEG_EN.test(x.raw)) return false;
    if (negBeforeZh(text, x.idx)) return false;
  }
  if (opts.neg) {
    // 腿②归因断言的否定守卫：「不能保证有效」「无法证明有用」是对冲形。
    if (STRONG_NEG_ZH.test(x.raw) || STRONG_NEG_EN.test(x.raw)) return false;
    if (negBeforeZh(text, x.idx)) return false;
    const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
    if (STRONG_NEG_EN.test(beforeEn)) return false;
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

function collect(text, list, opts) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, opts)) m.push(x);
  }
  return dedupeOverlap(m);
}

function dist(a, b) {
  if (a.idx < b.end && b.idx < a.end) return 0;
  return Math.max(a.idx, b.idx) - Math.min(a.end, b.end);
}

function resolveGroups(R, groups) {
  const out = [];
  for (const [name, defs] of groups) {
    let regs;
    if (Object.prototype.hasOwnProperty.call(R, name)) {
      const v = R[name];
      // 负例注入双契约：空数组 = 删条（整组消失）；永假正则 = 替换（该组退化
      // 为永不匹配）。两者都不得 crash——RegExp 不可 spread（r369 教训）。
      regs = Array.isArray(v) ? v : (v instanceof RegExp ? [v] : []);
    } else {
      regs = defs;
    }
    out.push(...regs);
  }
  return out;
}

// 签名收集：腿①行为群体 × 腿②归因断言，以腿①为锚，两腿邻近共现，
// 方向不限。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      group: resolveGroups(R, GROUP_ZH_GROUPS),
      causal: resolveGroups(R, CAUSAL_ZH_GROUPS),
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      group: resolveGroups(R, GROUP_EN_GROUPS),
      causal: resolveGroups(R, CAUSAL_EN_GROUPS),
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    // 腿①受否定守卫（对照组形：「不吃维生素的人」）
    const groupM = collect(text, L.group, { groupNeg: true });
    if (groupM.length === 0) continue;
    // 腿②受否定守卫（对冲形：「不能保证有效」）
    const causalM = collect(text, L.causal, { neg: true });
    if (causalM.length === 0) continue;
    for (const g of groupM) {
      const c = causalM.find(x => dist(x, g) <= L.win);
      if (!c) continue;
      sigs.push({ lang: L.lang, group: g.raw, effect: c.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.group + '|' + s.effect;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// 注入 normalize：负例脚本可用空数组（删条）/永假正则（替换）注入常量；
// 默认值本身是 RegExp。统一成数组供 exempt() 消费。
function _normInject(x, def) {
  if (Array.isArray(x)) return x;
  if (x instanceof RegExp) return [x];
  return [def];
}
function exempt(list, text) {
  for (const re of list) { if (re && re.test && re.test(text)) return true; }
  return false;
}

/**
 * 健康使用者偏倚/健康依从者效应签名：行为/依从群体 × 归因断言 两腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectHealthyUserBias(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论健康使用者偏倚/依从者效应概念本身是正确判别）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：正确限定/混杂讨论（可能/未必/混杂/自选择/相关不等于/这与……有关）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'healthy_user_bias',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '行为群体「' + x.group + '」× 归因断言「' + x.effect + '」'
      : 'behavior-group "' + x.group + '" x causal-claim "' + x.effect + '"')),
    details: s.lang === 'zh'
      ? '健康使用者偏倚(' + sigs.length + '处: 「' + s.group + '」的结果被归因断言「' + s.effect + '」直接兑现为该行为/产品的功劳，人群自选择与依从性混杂未排除)(zh)'
      : 'healthy-user-bias(' + sigs.length + 'x: the result of the self-selected group "' + s.group + '" is cashed out by the causal claim "' + s.effect + '" as the effect of the behavior/product, without addressing self-selection and adherence confounding)(en)',
    guidance: '健康使用者偏倚（healthy user bias / healthy adherer effect）：坚持健康行为、按时服药、主动体检的人群，本身在教育程度、收入、健康意识、基础健康上系统性优于非坚持者——观察性研究中两组间的健康差异混杂了「行为/干预的效果」与「人群自选择」，把它直接归因为行为/产品（「吃维生素的人明显更健康，所以维生素让人健康」「坚持复诊的病人死亡率更低，复诊本身就是延长生命的良方」）即犯此偏倚。正当做法是显式讨论混杂（「吃维生素的人更健康，可能因为他们本来就更注重健康管理」「补充剂使用者往往同时有多种健康习惯」「这可能反映的是健康使用者效应」）、引用随机对照证据（「需要随机对照才能区分干预效果与依从者自选择」）、或承认相关性不等于因果（「相关不等于因果，需要进一步验证」）；无归因的纯结果陈述（「每天跑步的人体检指标全面更好」）只是观察转述、不在本族射程；点名健康使用者偏倚/依从者效应概念的教学句、对照组陈述（「不吃维生素的人……」）都是正当做法。',
    tags: ['epidemiology', 'statistics', 'healthy-user-bias', 'healthy-adherer-effect', 'confounding', 'selection-bias'],
  };
}

module.exports = {
  detectHealthyUserBias,
  __internals: () => ({
    GROUP_ZH_A, GROUP_ZH_B, GROUP_EN_A, GROUP_EN_B,
    CAUSAL_ZH, CAUSAL_EN,
    GROUP_ZH_GROUPS, GROUP_EN_GROUPS,
    CAUSAL_ZH_GROUPS, CAUSAL_EN_GROUPS,
    PAIR_ZH, PAIR_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    STRONG_NEG_ZH, STRONG_NEG_EN,
    findSignatures,
  }),
};
