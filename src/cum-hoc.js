/**
 * src/cum-hoc.js — 「相关≠因果谬误（cum hoc ergo propter hoc / correlation
 * implies causation）」检测器
 * （第 195 个判别维度）
 *
 * [r198 立项] decision 本体在当前引擎（v6.8.126，194 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions，goalReviewed=true；cognitiveLoad 与 uncertainty
 * 均为 "unknown"，按轮次纪律不当实质背书）。三层研究：HN Algolia / GitHub
 * 拿到 NAACL 2025 faina（aclanthology.org/2025.naacl-long.34/，20 类谬误
 * 细粒度标注）与 EMNLP 2024 谬误检测作分类学参考；Semantic Scholar 连续
 * HTTP 429 空返，如实记录——判据为纯规则自有实现，不引 LLM。
 *
 * 辨别的族：cum hoc ergo propter hoc（拉丁语「与此并存，故因彼此」）——
 * 把**两个变量的相关/共现/同步**直接当成**其中一个导致另一个**的证据。
 * 相关性只说明两变量同变，不说明方向、更不说明因果：同变可能源于第三
 * 变量、双向因果、或纯巧合。把相关当因果，会让未经检验的因果叙事获得
 * 数据外衣，驱动错误的干预与决策：
 *   冰淇淋销量和溺水死亡率高度相关，所以吃冰淇淋会导致溺水。
 *   （真相：夏天炎热同时推高两者——气温是共同原因。）
 *   一个国家的人均巧克力消费与诺贝尔奖得主数量正相关，可见吃巧克力能提升智力。
 *   这两项指标多年来一直同步波动，可见 A 的提高直接带来了 B 的增长。
 *   Iced tea sales are correlated with drowning deaths, so iced tea causes drowning.
 *   Countries with more Nobel laureates consume more chocolate; the correlation is
 *   striking, therefore chocolate boosts intelligence.
 *
 * 与既有维度的边界（r198 归因，确保独立承重、不重叠）：
 *   · post_hoc 管「A 在 B 前发生所以 A 导致 B」的**时序连接**，本族不依赖
 *     时序——「两项指标一直同步波动，可见 A 带来 B」无任何先后连接词也命中，
 *     承重的是**共变/相关**这个前提；
 *   · reverse_causation 管**反应型行为×负面结果**的方向倒置（住院患者死亡
 *     率更高…），腿①用的是**比较级**（更/多/高），本族腿①用的是**显式相关
 *     词**（相关/关联/成正比/伴随/同步），词表不交叉；
 *   · common_cause 管**伪相关**（A、B 同由 C 导致），本族不管第三变量，
 *     而且「A 和 B 相关是因为 C」这种**正确的共同因素解释**因弃用「是因为」
 *     作因果腿 + 共同因素豁免而明确放行；
 *   · pseudo_causal 管**精确倍数**假机制（咖啡延寿 12.5 年），本族管相关→
 *     因果的推断方向、不涉具体数值；
 *   · statistical_misleading 管**统计数据呈现误导**（选择性展示/基数误导），
 *     本族管「相关被当成因果证据」的推理谬误；
 *   · monocause 管多因压单因，本族不断言唯一原因，反对的是**推断依据无效**。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判）：
 *   腿① CORRELATION 显式相关/共现标记（中英，含裸名词形态）：
 *     相关/关联/有联系/成正比/成反比/伴随/同步/共现/一同出现/联动/
 *     形影不离/如影随形/同增同减/此消彼长/正相关/负相关/高度相关/显著相关；
 *     EN correlated / correlation / associated / linked / goes hand in hand /
 *     co-occur / moves with / proportional / relationship between；
 *   腿② CAUSAL 前向因果动词（把 A 说成导致/造成 B）：
 *     导致/造成/引起/引发/促使/带来/催生/诱发/酿成/使得/加剧/加重/滋生/
 *     助长/提升了/提高了/增加了/降低了/减少了/造就；
 *     EN causes / leads to / results in / drives / boosts / creates / produces /
 *     brings about / increases / decreases / is responsible for / contributes to。
 *   两腿落在 24 字（EN 70 字符）邻近窗内即视为同一次「相关→因果」推断。
 *
 * 为什么取 VERIFY 级：把相关当因果是推理谬误，但「A、B 之间到底有没有因果」
 * 取决于机制与对照证据（时间先后/对照组/干预实验）——规则引擎无法独立判定
 * 真实因果，只能识别「相关被直接当成因果」的推断形态。verify 的含义是「先
 * 补因果证据再采信」：调用方应要求补上时间先后、对照组、机制路径，或把结论
 * 降级为「观察到相关，因果待检验」，而不是把相关直接当成因果。
 *
 * 明确不判的（豁免）：
 *   · 概念/教学转述与共同因素解释（相关不等于因果/相关并非/伪相关/混淆变量/
 *     混淆因素/第三变量/共同因素/共同原因/辛普森/内生性/因果推断/因果机制/
 *     相关系数/统计学/教材/论文/谬误；EN correlation is not causation /
 *     confounding / spurious correlation / common cause / Simpson's paradox /
 *     endogeneity / statistics / textbook）——讨论这个概念本身、或正确指出
 *     共同因素，是正确判别；
 *   · 实验/证据语境（随机对照/对照组/双盲/安慰剂/控制变量/前瞻性/队列/元分析/
 *     临床试验/自然实验/格兰杰因果/数据显示/研究表明/证据表明；EN randomized /
 *     controlled trial / RCT / Granger causality / data show / evidence shows）——
 *     以证据而非裸相关立论时，因果已被检验；
 *   · 推理否定/觉察承认（不代表/不等于/并不意味着/推不出/不能说明/未必/不一定/
 *     很难说/可能只是/纯属巧合/只是相关/仅相关；EN does not mean / not necessarily /
 *     cannot conclude / may just be / mere coincidence）——拒绝该推断本身是正确判别；
 *   · 对冲（可能/也许/或许/大概/似乎/好像/有待；EN maybe / perhaps / might / seems）；
 *   · 疑问句（含 ?/？）：提问不是断言。
 */
'use strict';

// ─── 腿① CORRELATION 显式相关/共现标记（中文，裸名词形态）──────────────
// r161 教训自查：「相关」去后缀仍是「相关」（相关性/相关联/正相关全部命中）；
// 「关联」同理（关联性/有关联/相关联命中）；「同步/伴随/共现」为裸名词形，
// 不收「了/之后」后缀才命中的形。
const CORRELATION_ZH = [
  /相关|关联|有联系|有关联|有牵扯|扯上关系/,
  /成正比|成反比|正比|反比|同步|共现|一同出现|一起出现|伴随|相伴/,
  /联动|形影不离|如影随形|同增同减|此消彼长|同进同退|一前一后地变/,
  /高度相关|显著相关|强相关|弱相关|紧密相关|密切相关|正向相关|负相关|正相关性|负相关性|相关性/,
];

// ─── 腿② CAUSAL 前向因果动词（中文）──────────────────────────────────
// 刻意**弃用「是因为」**——「A 和 B 相关是因为 C」是 common_cause 的正确解释，
// 前向因果腿只收「A 导致/造成 B」这类把相关变量一方说成另一方原因的结构。
const CAUSAL_ZH = [
  /导致|造成|引起|引发|促使|带来|催生|诱发|酿成|使得|加剧|加重|滋生|助长|造就/,
  /提升了|提高了|增加了|降低了|减少了/,
  // 结果动词须带因果模态前缀——收「能够提升/会带来提升/将降低」这类前向因果
  // 声称，又不误收「努力提高/进一步提高」这类目标/建议表述（r161 同类教训）。
  /(?:能够|可以|会|将|令|让|使|从而|进而|必然|一定|直接|显著|大幅|势必)(?:提升|提高|增加|降低|减少)/,
];

// ─── 英文侧腿① ────────────────────────────────────────────────────────
const CORRELATION_EN = [
  /\bcorrelat\w+\b/i,                                  // correlated / correlation / correlates
  /\bassociat\w+\b/i,                                  // associated / association
  /\blinked\b/i,
  /\bgoes\s+hand\s+in\s+hand\b/i,
  /\bco-?occur\w*\b/i,                                 // co-occur / cooccurs
  /\bmoves\s+with\b/i,
  /\bproportional\b/i,
  /\brelationship\s+between\b/i,
  /\bconnection\s+between\b/i,
];

// ─── 英文侧腿② ────────────────────────────────────────────────────────
const CAUSAL_EN = [
  /\bcaus\w+\b/i,                                      // cause / causes / caused / causing
  /\bleads?\s+to\b/i,
  /\bresults?\s+in\b/i,
  /\bdrives\b/i,
  /\bboosts?\b/i,
  /\bcreates\b/i,
  /\bproduces\b/i,
  /\bbrings?\s+about\b/i,
  /\bincreases?\b/i,
  /\bdecreases?\b/i,
  /\bis\s+responsible\s+for\b/i,
  /\bcontributes?\s+to\b/i,
];

// ─── 计分加成：推断连接词（不承重，只加分）────────────────────────────
const INFER_ZH = [/所以|因此|可见|说明|证明|表明|意味着|由此|故而|显然|足见|足以/];
const INFER_EN = [/\bso\b/i, /\btherefore\b/i, /\bthus\b/i, /\bhence\b/i, /\bwhich\s+means\b/i, /\bproves?\b/i, /\bshows?\b/i];

// ─── 豁免一：概念/教学转述 + 共同因素解释 ─────────────────────────────
const EXEMPT_META_ZH = [
  /相关不等于|相关并非|相关不代表|相关不意味|不等于因果|并非因果|相关性不等于|相关关系不等于/,
  /伪相关|伪因果|混淆变量|混淆因素|第三变量|共同因素|共同原因|潜伏变量|中介变量|辛普森|内生性|外生性|因果推断|因果推理|因果机制|因果识别/,
  /相关系数|相关性分析|相关性研究|相关性系数|协方差|回归分析/,
  /统计学|统计学家|教科书|课本|教材|课堂|教案|论文|科普|谬误|误区|陷阱|概念|认知偏差|逻辑学/,
];
const EXEMPT_META_EN = [
  /\bcorrelation\s+(?:is|does)\s+not\b/i,
  /\bcorrelation\s+is\s+not\s+causation\b/i,
  /\bspurious\s+correlation\b/i,
  /\bconfounding\b/i,
  /\bcommon\s+cause\b/i,
  /\bsimpson'?s\s+paradox\b/i,
  /\bendogene\w+\b/i,
  /\bstatistic\w+\b/i,
  /\btextbook\b/i,
  /\bfallacy\b/i,
];

// ─── 豁免二：实验/证据语境（以证据而非裸相关立论）────────────────────
const EXEMPT_EVID_ZH = [
  /随机对照|对照组|实验组|干预组|双盲|安慰剂|盲测|盲评|控制变量|控制了|控制后|剔除|截尾|温莎化|调整后|基线校正|校正了|随机分组/,
  /前瞻性|回顾性|队列研究|元分析|临床试验|纵向|自然实验|准实验|断点回归|双重差分|工具变量|倾向得分|格兰杰|格朗杰|因果识别|识别策略|差分/,
  /数据显示|数据表明|统计显示|统计表明|研究表明|研究显示|研究发?现|证据表明|有证据|实验表明|实验证明|实测|调研|研报|同行评审/,
];
const EXEMPT_EVID_EN = [
  /\brandomi[sz]ed\b/i,
  /\bcontrolled\s+trial\b/i,
  /\bRCT\b/i,
  /\bcontrol\s+group\b/i,
  /\bplacebo\b/i,
  /\bdouble[- ]blind\b/i,
  /\bprospective\b/i,
  /\bcohort\b/i,
  /\bmeta[- ]analysis\b/i,
  /\bclinical\s+trial\b/i,
  /\bgranger\b/i,
  /\bdata\s+(?:show|suggest|indicate)\b/i,
  /\bevidence\s+(?:show|suggest|indicate)\b/i,
  /\bstudies\s+(?:show|suggest)\b/i,
];

// ─── 豁免三：推理否定 / 觉察承认 ──────────────────────────────────────
const EXEMPT_NEG_ZH = [
  /不能说明|不能证明|不能推出|推不出|不足以|未必|不一定|很难说|不见得|不好说|说不清|难以确定|无法确定|无法证明|证明不了|难以断定|存疑|尚不|有待|待验证|待确认/,
  /不代表|不等于|并不意味着|不意味着|并不说明|不能得出|得不出/,
  /可能只是|可能仅是|可能纯粹|或许只是|也许是巧合|可能是巧合|或许是巧合|纯属巧合|只是巧合|巧合罢了|只是相关|仅相关|只是伴随|仅为相关/,
];
const EXEMPT_NEG_EN = [
  /\bdoes\s+not\s+mean\b/i,
  /\bdoesn'?t\s+mean\b/i,
  /\bcannot\s+conclude\b/i,
  /\bcan'?t\s+conclude\b/i,
  /\bnot\s+necessarily\b/i,
  /\binsufficient\b/i,
  /\bdoes\s+not\s+prove\b/i,
  /\bdoesn'?t\s+prove\b/i,
  /\bmay\s+just\s+be\b/i,
  /\bmight\s+just\s+be\b/i,
  /\bmere\s+coincidence\b/i,
  /\bjust\s+a\s+coincidence\b/i,
  /\bcorrelation\s+alone\b/i,
  // 承认因果不确定（正是谬误的反面，非断言因果）
  /\bopen\s+question\b/i,
  /\bremains?\s+(?:unclear|unknown|to\s+be\s+seen|uncertain)\b/i,
  /\bnot\s+yet\s+(?:clear|established|known|determined)\b/i,
];

// ─── 豁免四：对冲 ─────────────────────────────────────────────────────
const EXEMPT_HEDGE_ZH = [/可能|也许|或许|大概|恐怕|倾向于|似乎|好像|说不定|多半|有待|待验证|待确认/];
const EXEMPT_HEDGE_EN = [/\bmaybe\b/i, /\bperhaps\b/i, /\bmight\b/i, /\bmay\s+be\b/i, /\bpossibly\b/i, /\bprobably\b/i, /\bseems?\b/i, /\bappears?\b/i];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** 收集 list 中所有匹配的起始下标 */
function positions(list, text) {
  const out = [];
  for (const re of list) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      out.push(m.index);
      if (m.index === g.lastIndex) g.lastIndex++;
    }
  }
  return out;
}

/** 两腿 + 邻近窗：存在 c∈CORRELATION, k∈CAUSAL 使 |c-k|≤WIN */
function legsZh(text, R) {
  const corr = positions(R.CORRELATION_ZH || CORRELATION_ZH, text);
  const caus = positions(R.CAUSAL_ZH || CAUSAL_ZH, text);
  if (corr.length === 0 || caus.length === 0) return false;
  const WIN = 24;
  for (const c of corr) for (const k of caus) if (Math.abs(c - k) <= WIN) return true;
  return false;
}

function legsEn(text, R) {
  const corr = positions(R.CORRELATION_EN || CORRELATION_EN, text);
  const caus = positions(R.CAUSAL_EN || CAUSAL_EN, text);
  if (corr.length === 0 || caus.length === 0) return false;
  const WIN = 70;
  for (const c of corr) for (const k of caus) if (Math.abs(c - k) <= WIN) return true;
  return false;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永不匹配正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkCumHoc(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 全局豁免：概念教学/共同因素 / 实验证据 / 推理否定觉察 / 对冲 / 疑问句
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_EVID_ZH || EXEMPT_EVID_ZH, text) || anyHit(R.EXEMPT_EVID_EN || EXEMPT_EVID_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH, text) || anyHit(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH, text) || anyHit(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const hit = isZh ? legsZh(text, R) : legsEn(text, R);
  if (!hit) return { hit: false, score: 0, detail: '', count: 0 };

  // 计分：基础 0.60 + 推断连接词 0.06 + 显式强度相关词 0.05，封顶 0.85
  let score = 0.60;
  if (anyHit(R.INFER_ZH || INFER_ZH, text) || anyHit(R.INFER_EN || INFER_EN, text)) score += 0.06;
  if (/高度相关|显著相关|强相关|密切相关|紧密相关/.test(text) || /\b(?:strongly|significantly|closely)\s+correlat\w+\b/i.test(text)) score += 0.05;
  if (score > 0.85) score = 0.85;

  return {
    hit: true, score, count: 1,
    detail: isZh
      ? '相关≠因果谬误×共现/相关被直接当成因果证据(zh)'
      : 'cum hoc×correlation treated as causation(en)',
  };
}

module.exports = {
  checkCumHoc,
  __internals: () => ({
    CORRELATION_ZH, CAUSAL_ZH, CORRELATION_EN, CAUSAL_EN,
    INFER_ZH, INFER_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN, EXEMPT_EVID_ZH, EXEMPT_EVID_EN,
    EXEMPT_NEG_ZH, EXEMPT_NEG_EN, EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
  }),
};
