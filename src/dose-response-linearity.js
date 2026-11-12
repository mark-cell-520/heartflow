/**
 * src/dose-response-linearity.js — 「剂量-反应线性外推（linear dose-response
 * extrapolation / linearity assumption）」检测器
 * （第 250 个判别维度，r306）
 *
 * [r306 立项] philosophy_decision 本体裁决 accelerate（confidence 0.7 /
 * priority 40 / trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为
 * "unknown"，按轮次纪律不当实质背书）。外部搜索实质无可用结果（HN Algolia
 * "causal inference fallacy detection" 仅命中一条无关语音转写条目；
 * Semantic Scholar 连续 HTTP 429 限流空返；GitHub "causal inference rules
 * engine" 最高星仅 Aryia-Behroziuan/History ★7 且为知识表示历史文集，
 * 无可复用判据实现）——如实记录，走内部路径：池化缺口探针
 * scripts/round-306/probe-candidates.js（v6.8.176 实测）在 7 个候选谬误族
 * 35 条攻击样本中，本族 3/5 整族漏判（gate=pass），为最薄弱环节；
 * grep -ril 'dose.response|剂量反应|线性外推' src/ 确认既有维度只把「剂量
 * 反应」当 common-cause 腿③的证据建议词表，无一维度判「少量X产生效果E +
 * 效果随剂量成比例增长」的外推结构——249 维真缺口。
 *
 * 辨别的族：剂量-反应线性外推——文本先陈述**某个剂量/强度的 X 产生了效果
 * E**（吃一片止疼/每周锻炼两小时有益/适度饮酒活血），继而断言**加大剂量
 * 效果按比例或倍数放大**（吃十片效果就是十倍/每天练十二小时更健康/多喝点
 * 更养生）。剂量-反应曲线普遍是**非线性**的：有治疗窗、平台期、饱和点、
 * 反转型（过量有害甚至致命），把「有效」线性外推到「越多越好/成倍越好」
 * 是把一条未经测量的曲线假设成直线：
 *   吃一片有效，吃十片效果就是十倍。
 *   每周锻炼两小时有益，所以每天练十二小时更健康。
 *   少量饮酒活血，所以多喝点更养生。
 *   One pill helps, so ten pills help ten times as much.
 *   Two cups of coffee improve focus, so eight cups improve it more.
 *
 * 与既有维度的边界（r306 归因）：
 *   · count_rate_conflation（第197维附近）管精确倍数**统计口径**谬误
 *     （翻倍/三倍/十倍的量纲误用），本族管把倍数断言当作**剂量-反应
 *     关系**的外推，腿①必须是可增减的投入量（剂量/时长/杯数/片数）；
 *   · common_cause / reverse_causation / post_hoc 管共变→因果、方向倒置、
 *     时序连接，本族不涉及两个独立变量的共变，只涉及**同一变量自身
 *     剂量增减**的效果外推；
 *   · means_as_end 管把手段当目的，本族的剂量本身仍是被评估的手段，
 *     错误在外推形状；
 *   · monocause 管多因压成单因，本族不断言原因唯一；
 *   · pseudo_causal 管玄学归因白话，本族的断言形是定量的（倍数/越多越）。
 *
 * 判据（双腿共现 + 邻近窗，缺一不判）：
 *   腿① DOSE 剂量/强度陈述：投入量可增减的 X——数量词（一片/两片/三片/
 *     十片/一杯/两杯/八杯/一两/一杯酒/每天/每周/每月 × 小时/分钟/次/公里/
 *     克/毫克/ml/杯/片/粒/滴/勺）+ 效果动词或强度/频率状语；
 *     EN one/two/three/eight/ten (pill|pills|cup|cups|glass|glasses|
 *     dose|doses|serving|servings|beer|beers|drink|drinks|shot|shots) ×
 *     helps|works|improves|boosts|benefits|good for；
 *   腿② LINEARITY 线性外推断言：效果随剂量按比例/倍数放大——
 *     「越多越」「越X越Y」「加倍/翻倍/十倍/成比例/线性」「N片就是N倍」
 *     「再X效果更Y」「加大/加大剂量效果」「多吃点更养生」；
 *     EN the more … the more / N times / ten times as much / twice the
 *     effect / scales linearly / proportionally / more is better /
 *     double the dose。
 *
 * 为什么取 VERIFY 级：剂量-反应的真实形状取决于机制与实测数据（血药浓度
 * 曲线/临床剂量爬坡/毒性阈值），规则引擎无法独立判定某个具体剂量的真实
 * 效果，只能识别「有效 → 越多越好/成倍」的推断形态。verify 的含义是
 * 「先补剂量-反应证据再采信」：调用方应要求给出曲线形状（平台期/治疗窗/
 * 饱和点）、把结论降级为「该剂量观察到效果，加量效果待检验」，或点名
 * 过量风险，而不是把线性外推当成已知。
 *
 * 明确不判的（豁免）：
 *   · 概念/教学转述（剂量反应/线性外推/治疗窗/平台期/饱和/半数有效量/
 *     量效关系/毒理学/药理学/统计学/教材/课堂/论文/科普/谬误/误区/
 *     EN dose-response / dose–response / linear extrapolation /
 *     therapeutic window / plateau / saturation / EC50 / ED50 / LD50 /
 *     pharmacology / toxicology / statistics / textbook / lecture /
 *     fallacy）——讨论这个概念本身是正确判别；
 *   · 实验/证据语境（临床试验/随机对照/对照组/双盲/安慰剂/队列/元分析/
 *     血药浓度/药代动力学/剂量爬坡/滴定/最大耐受剂量/MTD/监测肝肾功能/
 *     处方/医嘱/遵医嘱/EN randomized / controlled trial / RCT / placebo /
 *     cohort / meta-analysis / pharmacokinetics / titration / maximum
 *     tolerated dose / prescribed / under medical supervision）——受控
 *     设计或专业医疗语境中外推经设计或专业监护成立；
 *   · 推理否定/反向承认（不是线性/并非线性/不成比例/不等于/并不意味着/
 *     有上限/有限度/过犹不及/适得其反/物极必反/会中毒/有毒性/风险更高/
 *     EN not linear / nonlinear / non-linear / not proportional / does
 *     not scale / plateaus / diminishing returns / too much is harmful /
 *     toxic / overdose）——拒绝该推断本身是正确判别；
 *   · 对冲（可能/也许/或许/大概/恐怕/倾向于/似乎/好像/说不定/有待/
 *     EN maybe / perhaps / might / possibly / probably / seems /
 *     appears）——概率化结论不作谬误判定；
 *   · 疑问句（含 ?/？）：提问不是断言。
 */
'use strict';

// ─── 腿① DOSE 剂量/强度陈述（中文）─────────────────────────────────────
// r161 教训自查：每条词去掉后缀（「一片」→「片」「一杯」→「杯」）仍须有
// 裸名词形态命中；「每天/每周」这类频率状语收裸形，不收「了/之后」形。
const DOSE_ZH = [
  // 量词 × 摄入/投入名词（裸量词形）
  /[一二两三四五六七八九十半\d]+\s*(?:片|粒|颗|丸|袋|瓶|杯|盅|碗|勺|匙|滴|支|装|包|盒|份)/,
  /(?:毫克|克|公斤|斤|两|毫升|升|ml|cc|mg|g|kg)\s*[一二两三四五六七八九十半\d]*/,
  // 剂量/用量裸名词
  /剂量|用量|服用量|摄入量|摄取量|给药|用药|服药|吃药|打针|注射/,
  // 频率 × 投入量（时长/次数/距离）——「每天练十二小时」「每周跑十公里」
  /(?:每天|每周|每月|每年|一天|一周|一月|一天内|一周内)\s*[一二两三四五六七八九十半\d]+\s*(?:小时|分钟|次|公里|千米|米|组|回|趟|遍|小时以上|个钟)/,
  /[一二两三四五六七八九十半\d]+\s*(?:小时|分钟|个钟|钟头)\s*(?:的|以上|每)?\s*(?:锻炼|运动|训练|练习|学习|工作|练|跑|走|看书|读书)/,
  // 摄入类裸名词形（酒/咖啡/茶/烟）
  /(?:喝|饮|吸|抽|吃|服)\s*[一二两三四五六七八九十半\d]*\s*(?:杯|瓶|口|盅|根|支|包|袋|片|粒|颗)?\s*(?:酒|啤酒|白酒|红酒|咖啡|茶|烟|可乐|功能饮料|奶茶)/,
  /(?:酒|啤酒|咖啡|茶|烟)\s*(?:喝|饮|抽|吸)\s*[一二两三四五六七八九十半\d]*\s*(?:杯|瓶|口|盅)?/,
  // 强度/剂量等级裸名词
  /(?:低|中|高|小|大|轻|重|强|弱)\s*(?:剂量|强度|浓度|用量|频率)/,
];

// ─── 腿① DOSE（英文）───────────────────────────────────────────────────
const DOSE_EN = [
  /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|a\s+couple\s+of|half\s+a|dozen)\s+(?:pill|pills|capsule|capsules|tablet|tablets|cup|cups|glass|glasses|dose|doses|serving|servings|beer|beers|drink|drinks|shot|shots|spoonful|spoonfuls|scoop|scoops|slice|slices|piece|pieces)\b/i,
  /\b(?:mg|milligram|milligrams|gram|grams|ml|millilitre|milliliter|liter|litre|ounce|ounces|cup|cups|tablespoon|tablespoons|teaspoon|teaspoons)\s+(?:of\s+)?[a-z]+/i,
  /\b(?:every|per)\s+(?:day|week|month|hour|morning|night)\b/i,
  /\b\d+\s*(?:hours?|minutes?|times?\s+a\s+(?:day|week)|km|kilometres?|kilometers?|miles?|reps?|sets?)\b/i,
  /\b(?:dose|dosage|intake|serving|administration)\s+(?:of|is)\b/i,
  /\b(?:a|one|two|three)\s+(?:glass|glasses|cups?|cans?|bottles?)\s+of\s+(?:wine|beer|coffee|tea|alcohol|liquor|whiskey|vodka|cola|soda)\b/i,
];

// ─── 腿② LINEARITY 线性外推断言（中文）─────────────────────────────────
const LINEARITY_ZH = [
  // 「越多越」族（裸名词形）
  /越多越|愈多愈|越[^。；，]{0,6}越[^。；，]{0,6}(?:好|强|高|有效|明显|快|理想|划算|值)/,
  // 倍数/比例放大断言
  /(?:效果|疗效|作用|收益|回报|好处|益处|价值|成果)[^。；，]{0,8}(?:就是|也是|就达到|将达到|等于)\s*[一二两三四五六七八九十半\d]+\s*(?:倍|番|成)/,
  /[一二两三四五六七八九十半\d]+\s*(?:倍|番)\s*(?:的效果|的疗效|的作用|的收益|的回报|的效果)/,
  /(?:加倍|翻倍|翻番|加倍用|加量|加大剂量|加量吃|多吃[一二两三四五六七八九十半\d]*\s*(?:片|粒|颗|杯|瓶)?|多喝|再吃|再加)/,
  // 「N 倍」直接断言效果放大
  /(?:那么|那|就|则)\s*[^。；，]{0,6}(?:效果|疗效|作用|收益)\s*(?:也|就|则)?\s*(?:是|为|达到)?\s*[一二两三四五六七八九十半\d]+\s*(?:倍|番)/,
  // 任意受益名词 × 倍数（精神五倍/成绩翻倍/收益十倍）
  /[^。；，]{0,8}(?:精神|成绩|收益|收入|回报|状态|体力|精力|记忆|代谢|免疫|抵抗|续航)\s*(?:就是|就|会是|达到)?\s*[一二两三四五六七八九十半\d]+\s*(?:倍|番)/,
  // 比例/线性显式词
  /(?:成比例|成倍地|线性|按比例放大|等比)/,
  // 「更」族：加量后效果更优
  /(?:再|多|加|加大|加强|提升)\s*[^。；，]{0,4}(?:剂量|强度|频率|用量)?\s*(?:效果|疗效|作用)?\s*(?:会|就|更|越)?\s*(?:好|强|有效|明显|理想|棒|厉害)/,
  // 极端剂量外推断言（十片/十二小时类直接倍数）
  /(?:十片|十倍|翻十倍|十二小时|二十小时|全天不停|不停歇|越多越好|多多益善)/,
];

// ─── 腿② LINEARITY（英文）──────────────────────────────────────────────
const LINEARITY_EN = [
  /\bthe\s+more\s+[^.!?]{0,40}\s+the\s+(?:more|better|stronger|faster|higher|greater|happier|healthier)\b/i,
  /\b(?:helps?|works?|improves?|boosts?|benefits?)\s+[^.!?]{0,30}\s+so\s+(?:more|double|twice|ten\s+times|three\s+times|n\s+times)\b/i,
  /\b(?:ten|two|three|four|five|six|seven|eight|nine|double|twice|half)\s+times\s+(?:as\s+(?:much|effective|good|strong|fast|beneficial)|the\s+(?:effect|benefit|result|dose))\b/i,
  /\b(?:scales?|scale)\s+(?:linearly|proportionally|with)\b/i,
  /\b(?:more|greater|higher|larger)\s+(?:is|are)\s+better\b/i,
  /\b(?:more\s+is\s+better|the\s+more\s+the\s+better|double\s+the\s+dose|twice\s+the\s+dose|ramp\s+(?:it|up)\s+up|bump\s+(?:it|the\s+dose)\s+up)\b/i,
  /\b(?:twice|double|triple|quadruple|10x|5x|3x|2x)\s+(?:the\s+)?(?:effect|benefit|impact|result|output|yield|gain|gainz)\b/i,
  /\b(?:if\s+)?(?:one|two|a\s+couple)\s+(?:pill|pills|cup|cups|glass|glasses|dose|doses|serving|servings|hours?)\s+(?:helps?|works?)\s*,?\s*(?:then\s+)?(?:more|ten|eight|double)\b/i,
  /\b(?:helps?|works?|improves?|boosts?|benefits?)\s+[^.!?]{0,60}\b(?:so\s+)?(?:five|ten|eight|more)\s+[^.!?]{0,30}\b(?:times?\s+as\s+(?:much|effective|good|strong|fast|beneficial)|times)\b/i,
  /\b(?:five|ten|eight|double)\s+(?:times\s+as\s+(?:much|effective|good|strong|fast|beneficial))\b/i,
];

// ─── 豁免一：概念/教学转述 ──────────────────────────────────────────────
const EXEMPT_META_ZH = [
  /剂量反应|量效关系|线性外推|非线性|治疗窗|平台期|饱和点|半数有效量|半数致死量|有效剂量|致死剂量|血药浓度|药代动力学|毒理学|药理学|药物代谢/,
  /统计学|教科书|课本|教材|课堂|教案|论文|科普|谬误|误区|陷阱|概念|定义/,
];
const EXEMPT_META_EN = [
  /\b(?:dose[-\u2013\s]?response|dose[-\u2013\s]?effect|linear\s+extrapolation|therapeutic\s+window|plateau|saturation|EC50|ED50|LD50|IC50|pharmacokinetics|pharmacodynamics|toxicology|pharmacology|statistics|textbook|lecture|fallacy)\b/i,
];

// ─── 豁免二：实验/证据语境（受控设计或专业医疗监护）────────────────────
const EXEMPT_EVID_ZH = [
  /临床试验|随机对照|对照组|实验组|双盲|安慰剂|盲测|队列|元分析|系统性综述|前瞻性|回顾性|数据表明|统计显示|研究表明|研究显示|证据表明|实验表明|实测/,
  /医嘱|遵医嘱|处方|医嘱剂量|说明书|按说明|逐步加量|缓慢加量|滴定|最大耐受剂量|监测肝肾功能|定期复查|复诊|在医生指导下|医疗监护|静脉给药|输液|静滴/,
];
const EXEMPT_EVID_EN = [
  /\b(?:randomi[sz]ed|controlled\s+trial|RCT|control\s+group|treatment\s+group|placebo|double[-\s]blind|prospective|cohort|meta[-\s]analysis|systematic\s+review|clinical\s+trial|data\s+show|data\s+suggest|evidence\s+shows|studies\s+show|experiment)\b/i,
  /\b(?:prescribed|prescription|under\s+medical\s+supervision|as\s+directed|follow(?:ing)?\s+(?:the\s+)?(?:doctor|physician|label)\w*|dosage\s+instructions|maximum\s+tolerated\s+dose|MTD|titrat\w+|monitor\w*\s+(?:liver|kidney|renal|hepatic)|consult\s+(?:a|your)\s+(?:doctor|physician|pharmacist))\b/i,
];

// ─── 豁免三：推理否定 / 反向承认 ────────────────────────────────────────
const EXEMPT_NEG_ZH = [
  /不是线性|并非线性|非线性|不成比例|不等于|并不意味着|不代表|有上限|有限度|过犹不及|适得其反|物极必反|会中毒|有毒性|有毒|风险更高|反而有害|反而致死|过量|中毒|超量|用药过量|服药过量|超过.{0,6}(?:上限|剂量|用量)/,
  /不会|并不会|不意味着|不见得|并无|没有.{0,4}(?:必要|意义|依据)|反而.{0,4}(?:有风险|更危险|受伤|更差)|有害|更差/,
  /不能说明|不能证明|推不出|不足以|未必|不一定|很难说|不见得|说不清|难以确定|无法确定/,
];
const EXEMPT_NEG_EN = [
  /\b(?:not\s+linear|non[-\s]?linear|not\s+proportional|does\s+not\s+scale|doesn'?t\s+scale|plateaus?|saturates?|diminishing\s+returns|too\s+much\s+is\s+harmful|toxic|overdose|lethal|fatal|ceiling\s+effect|maximum\s+effect|no\s+further\s+benefit|harmful\s+at\s+higher\s+doses)\b/i,
  /\b(?:does\s+not\s+mean|doesn'?t\s+mean|cannot\s+conclude|not\s+necessarily|insufficient|no\s+evidence|does\s+not\s+prove|fails\s+to\s+show)\b/i,
];

// ─── 豁免四：对冲 ──────────────────────────────────────────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|大概|恐怕|倾向于|似乎|好像|说不定|多半|有待|待验证|待确认/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|may\s+be|possibly|probably|seems?|appears?|i\s+suspect|could\s+be)\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** 收集 source 列表中所有匹配的起始下标 */
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

/**
 * 双腿 + 邻近窗：存在 d∈DOSE, l∈LINEARITY 使 |d-l| ≤ WIN。
 * 窗口取 60（ZH）/ 160（EN）：腿①剂量陈述与腿②外推断言通常同句或紧邻
 * 分句，宽松窗由腿②的定量断言形兜底（"越…越…"/"N倍"必须是显式外推）。
 */
function coLocated(dose, lin, win) {
  for (const d of dose) {
    for (const l of lin) {
      if (Math.abs(d - l) <= win) return true;
    }
  }
  return false;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkDoseResponseLinearity(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 全局豁免：概念教学 / 实验证据 / 推理否定 / 对冲 / 疑问句
  if (anyHit(R.EXEMPT_META_ZH || EXEMPT_META_ZH, text) || anyHit(R.EXEMPT_META_EN || EXEMPT_META_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_EVID_ZH || EXEMPT_EVID_ZH, text) || anyHit(R.EXEMPT_EVID_EN || EXEMPT_EVID_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH, text) || anyHit(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH, text) || anyHit(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const dose = positions(R.DOSE_ZH || DOSE_ZH, text).concat(positions(R.DOSE_EN || DOSE_EN, text));
  const lin = positions(R.LINEARITY_ZH || LINEARITY_ZH, text).concat(positions(R.LINEARITY_EN || LINEARITY_EN, text));
  if (dose.length === 0 || lin.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const win = isZh ? 60 : 160;
  if (!coLocated(dose, lin, win)) return { hit: false, score: 0, detail: '', count: 0 };

  // 计分：双腿共现基础 0.62；显式倍数/比例词（倍/番/成比例/times/linearly）
  // +0.08；极端剂量断言（越多越好/多多益善/more is better）+0.05，封顶 0.85。
  let score = 0.62;
  if (/(?:倍|番|成比例|线性)/.test(text) || /\b(?:times|linearly|proportionally|2x|3x|5x|10x)\b/i.test(text)) score += 0.08;
  if (/越多越好|多多益善/.test(text) || /\b(?:more\s+is\s+better|the\s+more\s+the\s+better)\b/i.test(text)) score += 0.05;
  if (score > 0.85) score = 0.85;

  const detail = isZh
    ? '剂量-反应线性外推：把有效剂量的效果按比例放大到更大剂量(zh)'
    : 'linear dose-response extrapolation: effect assumed to scale with dose(en)';

  return { hit: true, score, count: 1, detail };
}

module.exports = {
  checkDoseResponseLinearity,
  __internals: () => ({
    DOSE_ZH, DOSE_EN, LINEARITY_ZH, LINEARITY_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN, EXEMPT_EVID_ZH, EXEMPT_EVID_EN,
    EXEMPT_NEG_ZH, EXEMPT_NEG_EN, EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
  }),
};
