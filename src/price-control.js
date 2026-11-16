/**
 * src/price-control.js — 「价格管制单效应断言」检测器
 * （r367 新建：econ_reasoning_gate 聚合族第 24 子族 / 插件层第 28 族）
 *
 * 背景（真升级类型②：聚合族全新措辞家族）：
 *   r367 立项探针（scripts/round-367/probe-pool-r367.js，v6.8.188 pristine
 *   基线）：同池 8 候选定拨，price_control 攻击穿透 4/5（唯一非穿透条被
 *   perfect_error 代拦）、良性 0/3 误伤，穿透最高且良性零误伤——按
 *   r364/r366 纪律落地。同池落选：mercantilism 4/5 穿透但良性 1/3 误伤
 *   （存量零和族对 Trade is not zero-sum 良性代拦）、paradox_of_thrift
 *   3/5、lowball 3/4、prevention_paradox 3/4、lump_of_labor 2/5（良性
 *   1/3）、hollow_man 2/4、shifting_baseline 1/4；lead-time bias 首发
 *   候选 0/14 穿透（提前诊断×生存收益语义组合被 fallacy_of_relevance /
 *   reverse_causation / immortal_time_bias 等存量维度全面代拦，不满足
 *   立项标准，转同池）。海外扫描：S2 15 条文献确认价格管制效应为经典
 *   实证议题（Stigler 管制俘获/最低工资实证传统），GitHub repos 0 命中
 *   （无可集成纯规则检测器）、arXiv parse-fail——按既有形态自建。
 *
 * 外部来源：空返，按既有形态自建。家族定义取自价格管制标准经济学
 *   论述：price ceiling/floor（房租上限、最低工资、限价）的效应是
 *   多边的——上限压低价格的同时降低供给激励、改变质量与排队配给、
 *   产生无谓损失；下限（最低工资/价格支持）的效应取决于市场结构。
 *
 * 辨别的族：价格管制单效应断言（price-control single-effect
 *   assertion）——文本先给出**具体价格管制工具的在场指称**（房租
 *   上限/最低工资/限价/price cap/rent control），再给出**把管制
 *   直接兑现为单边收益、把替代效应从账上免掉的断言**：
 *   腿②a 只会-不会对句（ONLYGOOD）：只会……不会……——「只会让租房
 *     变得更便宜，不会有什么副作用」「最低工资提高只会增加工人
 *     收入，不会减少就业机会」；
 *   腿②b 无副作用断言（NOSIDE）：不会/没有/无/毫无 + 任何 + 副作用/
 *     负面作用/不良后果；
 *   腿②c 供给自动适配（AUTO）：供给不需要激励、市场自动出清调节。
 *   房租上限只会让租房变得更便宜，不会有什么副作用。
 *   只要政府把价格压低，商品就会自动更充裕，供给不需要激励。
 *   Rent caps only make housing cheaper; there are no downsides.
 *   Raising the minimum wage only helps workers and never affects employment.
 *
 * 为什么这是判别者的核心缺口（对齐「判断是非」）：价格管制是公共
 * 讨论里最高频的政策断言之一，毒性句式固定——先用一个真实存在的
 * 政策工具取得正当性（房租上限确实在文件里、最低工资确实是法案），
 * 紧跟的第二动作是宣布「只会」产生意图中的收益、「不会」产生任何
 * 别的效应。这一步把供给激励、配给方式、无谓损失这些真正的变量
 * 从讨论中免掉，让任何管制都只看账面意图。与正当推理的界线很
 * 清楚：点名价格管制概念的教学句、承认双边效应或指出实证争议的
 * 纠正句、以及无单效应断言的中性管制陈述，一律豁免。
 *
 * 与既有维度的边界（r367 归因，探针 + 边界实测）：
 *   · perfect_error 等假精确维度只收「必然/肯定」绝对化措辞——本族
 *     收非绝对形（「只会……不会有什么副作用」）；
 *   · unsupported_claim 管无依据断言——本族有具体管制工具在场，
 *     错在多边效应被免掉，不是无依据；
 *   · monocause 管单一原因归因——本族判单边**效应**断言，不归因
 *     因果链；
 *   · absolute_claim 表不收「自动/自然会」这种非绝对形供给出清断言。
 *
 * 判据（双腿近距共现 + 两组豁免 + 强否定守卫，缺一不判）：
 *   ① 腿① CONTROL 具体管制工具在场——ZH 工具名词族（房租上限/
 *     最低工资/限价……）+ 干预动词族（压低/限制/封顶价格）；EN
 *     rent control/price cap/minimum wage 族 + 政府 cap/fix prices 族；
 *     不收泛概念名（价格管制/price control）——那是 CONCEPT 豁免词，
 *     与腿①互咬会误豁免全部攻击句；
 *   ② 腿② ONLYGOOD/NOSIDE/AUTO 任一；
 *   ③ 两腿须落在邻近窗内（ZH 60 字 / EN 160 字符），方向不限；
 *   ④ 腿②查强否定前缀守卫（「并不存在副作用」= 失配）；
 *   ⑤ 豁免 A 概念教学（价格管制/price control 被点名）；
 *   ⑥ 豁免 B 纠正句（可能带来短缺/会导致激励扭曲/depends on/
 *     can create shortages）。
 *
 * 为什么取 VERIFY 级：单句可能只是客观转述一项政策主张（「主管
 * 认为限价能稳民生」是事实陈述）。verify 的语义是「这段话把价格
 * 管制直接兑现成了单边收益，先补齐管制的多边效应与实证证据
 * 范围，再决定是否采信」。
 *
 * 明确不判的（豁免/判据天然排除，均可负例注入证明承重）：
 *   · 中性管制陈述（政府稳价属于宏观调控的常规工具）；
 *   · 概念教学（价格管制是指政府设定价格上限或下限的干预手段）；
 *   · 纠正句（价格管制可能带来短缺，这是教科书的标准结论/Rent
 *     control has been shown to reduce housing supply）；
 *   · 争议实证形（房租管制的效果在经济学界有争论，取决于具体设计）。
 */
'use strict';

// ─── 腿① CONTROL 具体价格管制工具在场 ────────────────────────
// Z1 具体工具名词族：不收泛概念名「价格管制」——那是 CONCEPT 豁免词，
//    与腿①互咬会把「价格管制只会……」攻击句整体误豁免。
const CONTROL_NOUN_ZH = /房租上限|租金上限|房租封顶|租金封顶|房租管制|租金管制|最低工资|最低时薪|工资下限|最高限价|最低限价|价格上限|价格下限|价格封顶|限价令|限购限价|限制涨价|冻结价格|支持价格/;
// Z2 干预动词族（压低/限制/封顶价格；政府把价格压低/调控价格/干预价格）
const CONTROL_VERB_ZH = /(?:政府|国家|监管|行政|政策|当局)[^。，！？；\n]{0,8}(?:把)?价格[^。，！？；\n]{0,4}(?:压低|降下来|限制|管住|封顶|冻结|锁死|按住)|(?:压低|限制|管制|调控|干预|冻结|封顶|钉住)[^。，！？；\n]{0,4}价格|(?:规定|设定|制定)[^。，！？；\n]{0,6}(?:最高价|最低价|限价|价格上限|价格下限)/;

const CONTROL_ZH_GROUPS = [
  ['CONTROL_NOUN_ZH', [CONTROL_NOUN_ZH]],
  ['CONTROL_VERB_ZH', [CONTROL_VERB_ZH]],
];
const CONTROL_ZH = [CONTROL_NOUN_ZH, CONTROL_VERB_ZH];

// E1 具体工具名词族（EN）
const CONTROL_NOUN_EN = /\brent\s+(?:control|controls|cap|caps|ceiling|ceilings)|minimum\s+wage|the\s+minimum\s+wage|wage\s+floor|price\s+(?:ceiling|ceilings|cap|caps|floor|floors)|capped\s+prices?|capping\s+prices?|price\s+(?:ceiling|cap)\s+law|wage\s+controls?\b/i;
// E2 政府 cap/fix/set prices 动词族
const CONTROL_VERB_EN = /\b(?:government|state|regulators?|authorities|law|policy)\b[^.]{0,30}?\b(?:cap|caps|capped|fix|fixes|fixed|set|sets|hold|holds)\b[^.]{0,20}?\bprices?\b|\b(?:force|forces|forced|require|requires|required)\b[^.]{0,20}?\bprices?\b[^.]{0,15}?\b(?:down|lower|lowered)\b/i;

const CONTROL_EN_GROUPS = [
  ['CONTROL_NOUN_EN', [CONTROL_NOUN_EN]],
  ['CONTROL_VERB_EN', [CONTROL_VERB_EN]],
];
const CONTROL_EN = [CONTROL_NOUN_EN, CONTROL_VERB_EN];

// ─── 腿②a ONLYGOOD 只会-不会对句 ─────────────────────────────
// G1 只会…不会…/也不会…/并无…对句（核心攻击形）
const ONLYGOOD_PAIR_ZH = /只会[^。；]{0,18}(?:不会|也不会|而不会|并无|并不|都不能|也不能)/;
// G2 只会 + 收益词形（只会让…更便宜/只会增加…收入，无显式「不会」段）
const ONLYGOOD_GAIN_ZH = /只会[^。；]{0,18}(?:更|增加|提高|上升|改善|变得|得到|受益|变好|得到实惠)/;

const ONLYGOOD_ZH_GROUPS = [
  ['ONLYGOOD_PAIR_ZH', [ONLYGOOD_PAIR_ZH]],
  ['ONLYGOOD_GAIN_ZH', [ONLYGOOD_GAIN_ZH]],
];
const ONLYGOOD_ZH = [ONLYGOOD_PAIR_ZH, ONLYGOOD_GAIN_ZH];

// GE1 only makes/helps… and never/without/no…（核心攻击形）
const ONLYGOOD_PAIR_EN = /\bonly\s+(?:makes?|helps?|raises?|increases?|benefits?|lowers?|improves?|leads?\s+to)\b[^.]{0,40}?\b(?:and\s+)?(?:never|without|no)\s+(?:downside|side\s+effect|unintended|harm|shortage|drawback|affects?|reduces?|hurts?)\b/i;
// GE2 only benefits/helps…（无显式否定段的单边收益断言）
const ONLYGOOD_GAIN_EN = /\bonly\s+(?:benefits?|helps?|aids?|favou?rs?)\b/i;

const ONLYGOOD_EN_GROUPS = [
  ['ONLYGOOD_PAIR_EN', [ONLYGOOD_PAIR_EN]],
  ['ONLYGOOD_GAIN_EN', [ONLYGOOD_GAIN_EN]],
];
const ONLYGOOD_EN = [ONLYGOOD_PAIR_EN, ONLYGOOD_GAIN_EN];

// ─── 腿②b NOSIDE 无副作用断言 ─────────────────────────────────
// N1 否定 + 任何 + 副作用/负面作用/不良后果（容许 ≤6 字插入：
//    「不会有什么副作用」「不存在任何负面作用」）
const NOSIDE_ZH = /(?:不会|没有|无|毫无|不存在|并无|难以)[^。，；]{0,6}(?:任何)?[^。，；]{0,2}(?:副作用|负面(?:影响|作用|效应)|不良(?:影响|后果|反应)|反作用|消极作用)/;
// N2 供给端无伤害形（不会减少供给/不影响供给/不会造成供给短缺）
const NOSIDE_SUPPLY_ZH = /(?:不会|也不会|并不|并不能|无)[^。，；]{0,6}(?:减少|降低|削弱|打击|影响)[^。，；]{0,4}(?:供给|生产积极性|供给意愿|供给激励)/;

const NOSIDE_ZH_GROUPS = [
  ['NOSIDE_ZH', [NOSIDE_ZH]],
  ['NOSIDE_SUPPLY_ZH', [NOSIDE_SUPPLY_ZH]],
];
const NOSIDE_ZH_ARR = [NOSIDE_ZH, NOSIDE_SUPPLY_ZH];

// NE1 no downsides/side effects 族（without 后 any 可选——「without
//    side effects on supply」无 any 形是 r367 实测漏判来源）
const NOSIDE_EN = /\b(?:no|without(?:\s+any)?|zero|free\s+of)\s+(?:downsides?|side\s+effects?|unintended\s+consequences|drawbacks?|adverse\s+effects?|harm)\b/i;
// NE2 does not reduce/hurt supply 族
const NOSIDE_SUPPLY_EN = /\b(?:does\s+not|doesn'?t|do\s+not|don'?t|will\s+not|won'?t)\s+(?:reduce|hurt|harm|discourage|dampen|lower|cut|affect|damage)\s+(?:supply|production|incentives?|output|investment)\b/i;

const NOSIDE_EN_GROUPS = [
  ['NOSIDE_EN', [NOSIDE_EN]],
  ['NOSIDE_SUPPLY_EN', [NOSIDE_SUPPLY_EN]],
];
const NOSIDE_EN_ARR = [NOSIDE_EN, NOSIDE_SUPPLY_EN];

// ─── 腿②c AUTO 供给自动适配 ──────────────────────────────────
// A1 供给不需要激励族（供给不需要激励/无需刺激/市场自行调节）
const AUTO_ZH = /(?:供给|生产|供应|厂商|企业|市场)[^。，；]{0,6}(?:不需要|无需|用不着|不依赖|用不上|不靠)[^。，；]{0,6}(?:激励|刺激|动力|推动|引导)|(?:自动|自然|就会|便会)[^。，；]{0,8}(?:变得|趋于|实现|达到)[^。，；]{0,4}(?:充裕|充足|平衡|出清|协调|均衡)|市场[^。，；]{0,6}(?:总能|会自动|自然会|自行|本身就能)[^。，；]{0,6}(?:适应|调节|出清|平衡|纠正|修正|配给)/;

const AUTO_ZH_GROUPS = [
  ['AUTO_ZH', [AUTO_ZH]],
];
const AUTO_ZH_ARR = [AUTO_ZH];

// AE1 supply needs no incentive / market automatically adjusts 族
const AUTO_EN = /\b(?:supply|producers?|sellers?|the\s+market|firms?)\b[^.]{0,40}?\b(?:does\s+not|doesn'?t|do\s+not|don'?t|needs?\s+no|need\s+no|requires?\s+no)\b[^.]{0,20}?\b(?:incentive|encouragement|motivation|prod|push|stimulus)\b|\b(?:market|supply|prices?)\b[^.]{0,25}?\b(?:automatically|always|naturally|on\s+its\s+own|by\s+itself)\b[^.]{0,20}?\b(?:adjust|adapts?|clear|clears|equilibrate|balance|balances|self[- ]correct)\b/i;

const AUTO_EN_GROUPS = [
  ['AUTO_EN', [AUTO_EN]],
];
const AUTO_EN_ARR = [AUTO_EN];

// ─── 距离窗（管制 × 单效应断言）────────────────────────────
const PAIR_ZH = 60;
const PAIR_EN = 160;

// ─── 豁免 A：概念教学（点名价格管制概念本身）─────────────────
// 收泛概念名而非腿①的具体工具名——腿①不收泛词正是为了不与本豁免互咬。
const CONCEPT_ZH = /价格管制|价格干预|政府定价|限价政策|价格政策|价格管控|管制价格/;
const CONCEPT_EN = /\bprice\s+controls?\b|\bprice\s+intervention\b|\badministered\s+prices?\b|\bprice\s+regulation\b|\bprice\s+fixing\b/i;

// ─── 豁免 B：纠正句（承认双边效应/指出实证争议的正当陈述）────
// 只收**正面承认**形（存在/也有/确有/难免有/会伴有 + 副作用/争议）与
// 实证争议形（取决于/有争论/大量研究/结论不一致）。不收裸「有…副作用」
// 或「会…造成…短缺」形——那会把「不会有什么副作用」「不会造成供给
// 短缺」攻击句整体误豁免（r367 实测教训：无负向断言的情态词正则会
// 连攻击句的否定形一起吞）。
const CORRECT_ZH = /(?:存在|也有|确有|难免有|必然有|会伴有|往往伴有|确实有|承认|正视)[^。，；]{0,4}(?:副作用|负面(?:影响|作用|效应)|不良(?:影响|后果)|争议|争论|代价|成本)|(?:取决于|取决于|有待|尚待|仍待)[^。，；]{0,8}(?:实证|研究|设计|数据|讨论|检验)|双刃剑|过犹不及|大量(?:实证)?研究|结论(?:并不|尚未|仍不)一致|教科书|标准结论|早有定论|学界共识/;
const CORRECT_EN = /\b(?:can|could|may|might|would)\s+(?:create|cause|lead\s+to|produce|result\s+in)\b[^.]{0,25}?\b(?:shortages?|surpluses?|unemployment|deadweight|distortion|queues?|rationing|black\s+markets?|quality\s+drop)\b|\bunintended\s+(?:effects?|consequences)\b|\bdepends\s+on\b|\bempirical\s+(?:question|evidence|matter)\b|\bdebated\b|\bmixed\s+evidence\b|\bdouble[- ]edged\b|\bhas\s+been\s+shown\b|\bstudies\s+(?:find|show|suggest)\b|\btextbook\b/i;

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

// 强否定前缀：命中词前出现这些词，说明整个断言被否定（「并不存在
// 副作用」= 不承认存在副作用 → 失配）。注意「不会」不在表内——
// 「不会有什么副作用」正是本族核心攻击形。
const STRONG_NEG_ZH = /(?:并未|并没有|绝不是|绝对不|绝不|丝毫不|一点都不|压根不|根本就不|不等于|不代表|说明不了|证明不了|很难说|不见得|未必|不一定|不必然|并没有真正|不能|无法)/;
const STRONG_NEG_EN = /\b(?:not\s+that|far\s+from|hardly|barely|nowhere\s+near|by\s+no\s+means|in\s+no\s+way|not\s+necessarily|does\s+not|did\s+not|has\s+not|have\s+not|no\s+longer\s+means?)\b/i;

function negBeforeZh(text, idx) {
  const before = text.slice(Math.max(0, idx - 12), idx);
  return STRONG_NEG_ZH.test(before);
}

function matchAlive(text, x, useNeg) {
  if (!useNeg) return true;
  if (STRONG_NEG_ZH.test(x.raw) || STRONG_NEG_EN.test(x.raw)) return false;
  if (negBeforeZh(text, x.idx)) return false;
  const beforeEn = text.slice(Math.max(0, x.idx - 45), x.idx);
  if (STRONG_NEG_EN.test(beforeEn)) return false;
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

function collect(text, list, useNeg) {
  let m = [];
  for (const re of list) for (const x of allMatches(re, text)) {
    if (matchAlive(text, x, useNeg)) m.push(x);
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
    if (Object.prototype.hasOwnProperty.call(R, name)) out.push(...(R[name] || []));
    else out.push(...defs);
  }
  return out;
}

// 签名收集：腿①管制 × 腿②（只会-不会 ∪ 无副作用 ∪ 供给自动），
// 两腿邻近共现，方向不限。
function findSignatures(text, R) {
  R = R || {};
  const sigs = [];
  const langs = [
    {
      control: resolveGroups(R, CONTROL_ZH_GROUPS),
      leg2: resolveGroups(R, ONLYGOOD_ZH_GROUPS)
        .concat(resolveGroups(R, NOSIDE_ZH_GROUPS))
        .concat(resolveGroups(R, AUTO_ZH_GROUPS)),
      win: R.PAIR_ZH != null ? R.PAIR_ZH : PAIR_ZH, lang: 'zh',
    },
    {
      control: resolveGroups(R, CONTROL_EN_GROUPS),
      leg2: resolveGroups(R, ONLYGOOD_EN_GROUPS)
        .concat(resolveGroups(R, NOSIDE_EN_GROUPS))
        .concat(resolveGroups(R, AUTO_EN_GROUPS)),
      win: R.PAIR_EN != null ? R.PAIR_EN : PAIR_EN, lang: 'en',
    },
  ];
  for (const L of langs) {
    const controlM = collect(text, L.control, false);
    if (controlM.length === 0) continue;
    const leg2M = collect(text, L.leg2, true);
    if (leg2M.length === 0) continue;
    for (const c of controlM) {
      const t = leg2M.find(x => dist(x, c) <= L.win);
      if (!t) continue;
      sigs.push({ lang: L.lang, control: c.raw, leg2: t.raw });
    }
  }
  const seen = new Set();
  return sigs.filter(s => {
    const k = s.lang + '|' + s.control + '|' + s.leg2;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// 注入 normalize：负例脚本可用空数组（删条）/永假正则（替换）注入豁免常量；
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
 * 价格管制单效应断言签名：具体管制工具在场 × 单边收益断言 两腿近距共现。
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {object} 维度结果对象（引擎约定：无命中返回 {hit:false, score:0}）
 */
function detectPriceControl(text, inject) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免 A：概念教学（讨论价格管制这个概念本身是正确判别）
  if (exempt(_normInject(R.CONCEPT_ZH, CONCEPT_ZH), text) || exempt(_normInject(R.CONCEPT_EN, CONCEPT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 豁免 B：纠正句（承认双边效应或指出实证争议的正当陈述）
  if (exempt(_normInject(R.CORRECT_ZH, CORRECT_ZH), text) || exempt(_normInject(R.CORRECT_EN, CORRECT_EN), text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const sigs = findSignatures(text, R);
  if (sigs.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const s = sigs[0];
  const score = sigs.length >= 2 ? 0.70 : 0.62;
  return {
    hit: true,
    dimension: 'price_control',
    severity: Math.round(score * 100),
    score,
    count: sigs.length,
    evidence: sigs.slice(0, 2).map(x => (x.lang === 'zh'
      ? '管制「' + x.control + '」× 单效应断言「' + x.leg2 + '」'
      : 'control "' + x.control + '" x single-effect claim "' + x.leg2 + '"')),
    details: s.lang === 'zh'
      ? '价格管制单效应断言(' + sigs.length + '处: 「' + s.control + '」被直接兑现为「' + s.leg2 + '」——管制的多边效应未经实证检验即被免掉)(zh)'
      : 'price-control-single-effect(' + sigs.length + 'x: "' + s.control + '" is cashed out directly as "' + s.leg2 + '" — multi-sided effects asserted away without evidence)(en)',
    guidance: '价格管制（price control：价格上限/下限、房租管制、最低工资、限价）的效应是多边的——设定上限压低价格的同时降低供给激励、改变质量与排队配给、产生无谓损失；设定下限（最低工资/价格支持）的效应取决于市场结构与买方垄断程度。单效应断言（「只会更便宜，不会有副作用」「供给不需要激励」）把替代效应从账上免掉，让任何管制只看账面意图。正当做法是给出双边效应与实证证据范围（管制的具体设计、市场结构、替代弹性、既有研究结论），而不是单边断言；点名价格管制概念的教学句、承认双边效应或指出实证争议的纠正句（可能带来短缺/会导致激励扭曲/取决于具体设计），都是正当做法。',
    tags: ['economics', 'price-theory', 'price-control', 'minimum-wage', 'rent-control', 'single-effect-assertion', 'aggregate-reasoning'],
  };
}

module.exports = {
  detectPriceControl,
  __internals: () => ({
    CONTROL_NOUN_ZH, CONTROL_VERB_ZH,
    CONTROL_NOUN_EN, CONTROL_VERB_EN,
    ONLYGOOD_PAIR_ZH, ONLYGOOD_GAIN_ZH,
    ONLYGOOD_PAIR_EN, ONLYGOOD_GAIN_EN,
    NOSIDE_ZH, NOSIDE_SUPPLY_ZH,
    NOSIDE_EN, NOSIDE_SUPPLY_EN,
    AUTO_ZH, AUTO_EN,
    CONTROL_ZH, CONTROL_EN,
    ONLYGOOD_ZH, ONLYGOOD_EN,
    NOSIDE_ZH_ARR, NOSIDE_EN_ARR,
    AUTO_ZH_ARR, AUTO_EN_ARR,
    CONTROL_ZH_GROUPS, CONTROL_EN_GROUPS,
    ONLYGOOD_ZH_GROUPS, ONLYGOOD_EN_GROUPS,
    NOSIDE_ZH_GROUPS, NOSIDE_EN_GROUPS,
    AUTO_ZH_GROUPS, AUTO_EN_GROUPS,
    PAIR_ZH, PAIR_EN,
    CONCEPT_ZH, CONCEPT_EN, CORRECT_ZH, CORRECT_EN,
    STRONG_NEG_ZH, STRONG_NEG_EN,
    findSignatures,
  }),
};
