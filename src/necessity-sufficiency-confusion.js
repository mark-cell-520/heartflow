/**
 * src/necessity-sufficiency-confusion.js — 「条件角色混淆（必要条件↔充分条件）」检测器
 * （第 183 个判别维度）
 *
 * [r185 立项] decision 本体在当前引擎（v6.8.112，182 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。候选来自三层研究（HN Algolia arXiv 2405.02318
 * 「Translating natural language to first-order logic for logical fallacy
 * detection」258 分——形式逻辑翻译检测路线；Semantic Scholar
 * 10.1016/j.neunet.2025.108164「Necessary and sufficient knowledge enhanced
 * collaborative logical reasoning」——必要/充分条件知识增强推理；GitHub
 * fallacy-detection 仓库群）+ 引擎差距实测：必要条件/充分条件在引擎内只作为
 * denying_the_antecedent / affirming_the_consequent 的条件句推理附属说明
 * 与 conditional_proposition 的元话语豁免词存在（grep src/ 实测），**没有
 * 任何独立维度**判别「把一个方向的逻辑条件关系反向使用」这一攻击族；
 * fallacies 维度内亦无对应子标签。本维度是独立 dimMap 键的新家族（同 r171
 * base_rate_neglect / r172 whole_part_transfer 与 fallacies 子标签共存之
 * 先例，不构成重复）。
 *
 * 辨别的族：条件角色混淆（confusion of necessity and sufficiency）
 * ——把**必要条**件当**充分条件**用，或把**充分条件**当**必要条件**用：
 *   努力是成功的必要条件，所以只要努力就能成功。（必要→充分）
 *   信任是团队合作的前提，因此只要把信任建立起来，合作自然水到渠成。
 *   没有人民支持就没有革命的胜利，所以只要赢得了人民支持，胜利就唾手可得。
 *   唯有每天复盘才能进步，可见只要坚持复盘，进步就不成问题。
 *   睡眠是记忆巩固的保障，所以睡眠问题一解决，成绩自然不在话下。
 *   天赋是夺冠的充分条件，所以没有天赋就夺不了冠。（充分→必要）
 *   努力足以换来回报，所以不努力就没有回报。
 *   Trust is necessary for cooperation, so once trust is in place,
 *   cooperation will follow automatically.
 *   A degree is a prerequisite for this role, so a degree alone qualifies you.
 *   This certificate is a guarantee of employment, so without it you cannot
 *   be hired.
 *
 * 与既有维度的边界（r185 归因）：
 *   · denying_the_antecedent 管**条件规则句的 ¬P∴¬Q 推理**（如果X就Y；
 *     没X所以没Y），本族管**条件角色的宣称与使用方向相反**——腿①是角色
 *     宣称句（X是Y的必要条件/前提/没有X就没有Y/唯有X才Y），不依赖
 *     「如果…就…」规则句形态；
 *   · affirming_the_consequent 管 Q∴P 的逆向倒推，本族不倒推前后件，
 *     只搬弄条件角色；
 *   · conditional_proposition 管 ¬B⇒¬A 用未验证假言裁定前件，本族结论
 *     落在「条件是否足够/是否必需」的角色判断上；
 *   · whole_part_transfer 管**层级间**属性迁移，本族管**同一对条件
 *     命题之间**的角色互换；
 *   · absolute_claim / confidence 管断言强度，本族角色词缺席时不判
 *     （「只要努力就能成功」单独出现不判——那是普通条件句，归
 *     denying_the_antecedent 家族管）。
 *
 * 判据（宣称腿×反向结论腿×连接推断词，三腿共现，缺一不判）：
 *   · 路线1（必要→充分）：腿① NEC_CLAIM 必要条件宣称（是…必要条件/
 *     前提/基础/保障/基石；没有X就没有Y；唯有X才Y；离不开X；
 *     EN necessary for / prerequisite / without X no Y / only if）
 *     × 腿② SUF_CONCL 充分性结论（只要X就Y/就够了/足以/不在话下/
 *     不成问题/水到渠成/迎刃而解/一劳永逸/唾手可得/有了X就Y/
 *     EN once…will follow / alone is enough / guarantees）
 *     × 腿③ 宣称与结论之间有推断词连接（所以/因此/因而/可见/那么/
 *     这说明/意味着/因为/由于/既然；EN so/therefore/thus/because），
 *     宣称与结论总跨度 ≤70 字（EN 140 字符）。
 *   · 路线2（充分→必要）：腿① SUF_CLAIM 充分条件宣称（是…充分条件/
 *     保证/足以/EN sufficient for / alone is enough / suffices /
 *     guarantees）× 腿② NEC_CONCL 必要性结论（没有X就不能Y/不X就不Y/
 *     除非X才Y/缺一不可；EN without X cannot / no X without Y /
 *     impossible without）× 腿③ 同上推断词连接。
 *   · 反向宣称抑制：结论若是把条件**已宣称过的角色**再用一遍，不是混淆
 *     ——路线1要求文中不存在充分条件宣称（充分条件/足以/保证/充要条件…
 *     出现在结论跨度内的不计），路线2对称。这是本族精度的核心：「X是Y
 *     的充分条件，所以只要X就能Y」是同向复用，不判。
 *   · 缺腿不判：只有必要条件宣称无充分结论（「没有健康就没有一切，
 *     所以我们要锻炼」——结论是行动建议）；只有充分结论无角色宣称
 *     （「只要努力就能成功」单独成句——普通条件句）；宣称与结论之间
 *     无推断词（「没有健康就没有幸福。只要有钱就能幸福。」——两句
 *     各说各的，无推理关系）。
 *
 * 为什么取 VERIFY 级：角色混淆的单句也可能是显式双条件的正确展开
 * （充要条件/当且仅当）、文学对白转述、或条件角色的概念讨论。verify
 * 的含义是「这个条件的使用方向需要先说清是必要还是充分」——调用方应
 * 要求补上角色界定或反向条件的证据，而不是接受默认的方向搬运。
 *
 * 明确不判的（豁免）：
 *   · 正确区分角色（不是充分/不充分/仅靠…不够/仅凭…不足/不能只靠/
 *     还需要/还要看；EN not sufficient / necessary but not sufficient /
 *     alone is not enough）——主动区分必要与充分是正确判别；
 *   · 拒绝推断/否定翻转（不等于/不意味着/不代表/推不出/说明不了/
 *     证明不了/不能说/不成立；EN does not mean / cannot conclude）——
 *     指出方向无效本身是正确判别；
 *   · 对冲（可能/也许/或许/未必/不一定/大概/恐怕/多半/说不定；
 *     EN maybe/perhaps/might/probably/not necessarily）——概率化结论
 *     不作谬误判定（同 r161 口径）；
 *   · 双条件/充要（当且仅当/充要条件；EN if and only if / iff）——
 *     双向条件两个方向都成立，反向使用不是谬误；
 *   · 概念/教学转述（什么是/区别/课堂/教材/老师/谬误/逻辑题/形式逻辑/
 *     命题逻辑；EN difference between / textbook / lecture / fallacy）——
 *     讨论角色概念本身是正确判别；
 *   · 疑问句（含 ?/？）：提问不是断言。
 */
'use strict';

// ─── 腿① NEC_CLAIM 必要条件宣称（中文，含裸名词形）──────────────────
// 枚举腿自查（161 轮教训）：收「前提/基础/保障」等裸名词形，不收
// 「前提条件」等带后缀形；「保障」取「不可或缺的支撑」义（必要向），
// 「保证」归充分向腿（SUF_CLAIM）。
const NEC_CLAIM_ZH = [
  // 角色指名形：X是/作为/构成…的（必要|前提|基础|保障|基石|先决|必备|根本）
  /(?:是|为|作为|属于|构成|正是|堪称|实属)[^。，；！？]{0,16}的(?:必要条件|必要前提|前提条件|先决条件|必备条件|不可或缺的条件|前提|基础|根基|基石|保障|根本|命脉|底线|必备)/,
  // 裸动词形：离不开/缺不了/不可或缺/缺一不可
  /离不开|缺不了|少不了|不可或缺|必不可少|缺一不可|须臾不离|密不可分/,
  // 「没有X就没有Y」形（无X则无果——必要性经典表述）
  /(?:没有|若无|缺乏|缺少|丧失|失去)[^。，；！？]{0,12}就(?:没有|不可能|不行|无从|免谈|谈不上|不成|不成立|无以为继)/,
  // 「唯有X才Y」形（only-if——必要性）
  /(?:唯有|惟有|只有|必须|非得|须)[^。，；！？]{0,14}才(?:能|可以|会|行|成|有|谈得上)/,
];

// ─── 腿① NEC_CLAIM（英文）─────────────────────────────────────────
const NEC_CLAIM_EN = [
  /\b(?:is|are|remains?|constitutes?|represents?)\s+(?:a|an|the|truly\s+a|really\s+a)?\s*(?:necessary|required|essential|indispensable|vital|crucial|critical|prerequisite|precondition)\b/i,
  /\bnecessary\s+(?:for|to)\b/i,
  /\bwithout\s+[^.]{0,40}\b(?:no|nothing|impossible|cannot|can't|there\s+(?:is|can\s+be)\s+no)\b/i,
  /\bonly\s+(?:if|when)\b/i,
  /\bno\s+\w[\w\s]{0,30}\bwithout\b/i,
];

// ─── 腿① SUF_CLAIM 充分条件宣称（中文，显式角色形）──────────────────
// 只收**显式**充分性角色语言（充分条件/足以/保证/充要条件）。「只要X
// 就Y」这类隐式条件句**不进本腿**——它是普通条件句，反向使用归
// denying_the_antecedent 家族管（r185 边界决策，防与 r166 族双重
// 命中、防「按下按钮就能开机，不按就开不了机」类设备说明误伤）。
const SUF_CLAIM_ZH = [
  /(?:是|为|作为|正是|实属)[^。，；！？]{0,16}的(?:充分条件|充要条件|保证|不二法门|灵丹妙药|万能药|终极答案|唯一答案|充分|全部)/,
  /足以|足可/,
];

// ─── 腿① SUF_CLAIM（英文）────────────────────────────────────────
const SUF_CLAIM_EN = [
  /\b(?:is|are)\s+(?:a|an|the|truly\s+a|really\s+a)?\s*(?:sufficient|guarantee)\b/i,
  /\bsufficient\s+(?:for|to)\b/i,
  /\b(?:alone|by\s+itself|on\s+its\s+own)\s+(?:is|would\s+be)?\s*(?:enough|sufficient)\b/i,
  /\bsuffices\b/i,
  /\bguarantees?\b/i,
];

// ─── 腿② SUF_CONCL 充分性结论（中文）──────────────────────────────
// 「X单独就能保证Y」的结论形态。全部收裸名词形；成语族（不在话下/
// 水到渠成/迎刃而解）是中文充分性结论的高频伪装。
const SUF_CONCL_ZH = [
  /(?:只要|一旦|但凡|倘要)[^。！？]{0,22}就(?:能|可以|会|行|成|足够|够了|胜任)/,
  /就够了|就足够|足矣|绰绰有余|不在话下|不成问题|水到渠成|迎刃而解|一劳永逸|唾手可得|易如反掌|十拿九稳|稳操胜券|顺理成章|自然而然/,
  /(?:有了|具备|拥有|达到|满足|完成|搞定|解决|到位|建立|做好|攻克|赢得)[^。！？]{0,14}就(?:能|可以|行|成|会|稳了|妥了)/,
  /(?:必然|必定|势必|注定)[^。！？]{0,10}(?:能|可以|会|成|带来|带来成功)/,
  // 直接翻转型：结论句把条件说成充分条件（「所以X是Y的充分条件」）
  /(?:是|为|正是|实属)[^。！？]{0,14}的(?:充分条件|充要条件)/,
];

// ─── 腿② SUF_CONCL（英文）────────────────────────────────────────
const SUF_CONCL_EN = [
  /\b(?:once|as\s+soon\s+as|when)\s+[^.]{0,60}\b(?:will|would)\s+(?:follow|come|result|succeed|work|happen)\b/i,
  /\balone\s+(?:is|will\s+be)\s+(?:enough|sufficient)\b/i,
  /\balone\s+(?:qualifies|suffices|guarantees|ensures)\b/i,
  /\bis\s+all\s+(?:it\s+takes|you\s+need|we\s+need|that\s+is\s+needed)\b/i,
  /\bguarantees?\b/i,
  /\bautomatically\b/i,
  /\b(?:is|are)\s+(?:a|an|the)?\s*sufficient\s+condition\b/i,
];

// ─── 腿② NEC_CONCL 必要性结论（中文）──────────────────────────────
// 「没有X就不能Y」的结论形态（only-if 结论化）。
const NEC_CONCL_ZH = [
  /(?:没有|没|无|不|非|缺|缺少|缺乏|离开|脱离)[^。！？，]{0,16}(?:就|便|则)[^。！？]{0,14}(?:不能|不可能|不行|无法|免谈|谈不上|成不了|不了|不会|甭想|别想|不幸福|不成立|不成功|无从|没有|未曾|从未)/,
  /(?:除非|唯有|惟有|只有)[^。！？]{0,18}才(?:能|可以|行|成)/,
  /缺一不可|不可或缺|必不可少|离不开|缺不了/,
  // 直接翻转型：结论句把条件说成必要条件（「所以X是Y的必要条件」）
  /(?:是|为|正是|实属)[^。！？]{0,14}的(?:必要条件|必要前提|前提)/,
];

// ─── 腿② NEC_CONCL（英文）────────────────────────────────────────
const NEC_CONCL_EN = [
  /\bwithout\s+[^.]{0,40}\b(?:cannot|can't|impossible|no\s+way|there\s+(?:is|can\s+be)\s+no)\b/i,
  /\bno\s+\w[\w\s]{0,30}\bwithout\b/i,
  /\bimpossible\s+without\b/i,
  /\bonly\s+(?:if|with|through)\b/i,
  /\b(?:is|are)\s+(?:a|an|the)?\s*necessary\s+condition\b/i,
];

// ─── 腿③ INFER 连接推断词（宣称腿与结论腿之间的推理连接）──────────
// 分方向：宣称在前、结论在后用前向连接词（所以/因此…）；结论在前、
// 宣称在后（倒装形「只要X就能Y，因为X是Y的必要条件」）用后向连接词
// （因为/由于/既然）。无连接词的两句并列不判——各说各的不构成推理。
// **方向强制**（r185 首跑实测补）：「X是Y的必要条件，所以X是Y的充分
// 条件」若允许任意方向匹配，路线2会把结论句里的充分宣称作「宣称」、
// 把前提句里的必要宣称作「结论」，同一句被两条路线双重解释——必须
// 按宣称与结论的真实先后选择连接词方向。
const INFER_FWD_ZH = [
  /所以|因此|因而|故而|故|可见|足见|据此|于是|那么|这说明|这意味着|足以证明|毫无疑问|显然|说明|证明/,
];
const INFER_BWD_ZH = [
  /因为|由于|既然/,
];
const INFER_FWD_EN = [
  /\b(?:so|thus|therefore|hence|which\s+means|meaning|consequently)\b/i,
];
const INFER_BWD_EN = [
  /\b(?:because|since)\b/i,
];

// ─── 豁免一：正确区分角色（主动说清必要≠充分 = 正确判别）──────────
const EXEMPT_SEP_ZH = [
  /不是充分|不充分|并非充分|算不上充分|仅靠[^。！？]{0,10}不够|仅凭[^。！？]{0,10}不足|不能只靠|不只[^。！？]{0,8}这么|还需要|还要看|不可或缺但/,
];
const EXEMPT_SEP_EN = [
  /\bnot\s+sufficient\b|\binsufficient\b|\bnecessary\s+but\s+not\s+sufficient\b|\bnot\s+enough\b|\balone\s+is\s+not\b|\bisn'?t\s+enough\b/i,
];

// ─── 豁免二：拒绝推断/否定翻转（指出方向无效 = 正确判别）───────────
const EXEMPT_NEG_ZH = [
  /不等于|不意味着|不代表|并不意味着|推不出|说明不了|证明不了|算不了|算不上|不足以|并不能|不能说|不成立|而不是|而非|谈不上|是错的|并不对|荒谬|误解|误区|错误认识|以讹传讹/,
];
const EXEMPT_NEG_EN = [
  /\bdoes\s+not\s+mean\b|\bdoesn'?t\s+mean\b|\bdoes\s+not\s+prove\b|\bdoesn'?t\s+prove\b|\bcannot\s+conclude\b|\bcan'?t\s+conclude\b|\bnot\s+necessarily\b|\bno\s+evidence\s+for\b/i,
];

// ─── 豁免三：对冲（概率化结论，同 r161 口径）──────────────────────
const EXEMPT_HEDGE_ZH = [
  /可能|也许|或许|未必|不一定|不见得|大概|恐怕|多半|说不定|很难说/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|possibly|probably|tends?\s+to|not\s+always|not\s+necessarily)\b/i,
];

// ─── 豁免四：双条件/充要（双向条件反向使用不是谬误）────────────────
const EXEMPT_BICOND_ZH = [
  /当且仅当|充要条件/,
];
const EXEMPT_BICOND_EN = [
  /\bif\s+and\s+only\s+if\b|\biff\b/i,
];

// ─── 豁免五：概念/教学转述（讨论角色概念 = 正确判别）──────────────
const EXEMPT_CONCEPT_ZH = [
  /什么是|区别在于|课堂上|教材|课本|老师|教授|讲义|课件|考点|知识点|习题|练习题|逻辑题|形式逻辑|命题逻辑|离散数学|充分必要/,
];
const EXEMPT_CONCEPT_EN = [
  /what\s+is\s+the\s+difference|difference\s+between|definition\s+of|textbook|lecture|professor|teacher|classroom|quiz|midterm|logic\s+course|discrete\s+math/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** 在 text 的 from 偏移起找 list 中最早出现的匹配，返回 {idx, len} 或 null */
function firstMatch(list, text, from) {
  const start = from || 0;
  const sub = text.slice(start);
  let best = null;
  for (const re of list) {
    const m = sub.match(re);
    if (m && m.index >= 0 && (!best || m.index < best.idx)) {
      best = { idx: start + m.index, len: m[0].length };
    }
  }
  return best;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkNecessitySufficiencyConfusion(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const NEC_Z = R.NEC_CLAIM_ZH || NEC_CLAIM_ZH;
  const NEC_E = R.NEC_CLAIM_EN || NEC_CLAIM_EN;
  const SUF_Z = R.SUF_CLAIM_ZH || SUF_CLAIM_ZH;
  const SUF_E = R.SUF_CLAIM_EN || SUF_CLAIM_EN;
  const SC_Z = R.SUF_CONCL_ZH || SUF_CONCL_ZH;
  const SC_E = R.SUF_CONCL_EN || SUF_CONCL_EN;
  const NC_Z = R.NEC_CONCL_ZH || NEC_CONCL_ZH;
  const NC_E = R.NEC_CONCL_EN || NEC_CONCL_EN;
  const INF_FW_Z = R.INFER_FWD_ZH || INFER_FWD_ZH;
  const INF_BW_Z = R.INFER_BWD_ZH || INFER_BWD_ZH;
  const INF_FW_E = R.INFER_FWD_EN || INFER_FWD_EN;
  const INF_BW_E = R.INFER_BWD_EN || INFER_BWD_EN;
  const ES_Z = R.EXEMPT_SEP_ZH || EXEMPT_SEP_ZH;
  const ES_E = R.EXEMPT_SEP_EN || EXEMPT_SEP_EN;
  const EN_Z = R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH;
  const EN_E = R.EXEMPT_NEG_EN || EXEMPT_NEG_EN;
  const EH_Z = R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH;
  const EH_E = R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN;
  const EB_Z = R.EXEMPT_BICOND_ZH || EXEMPT_BICOND_ZH;
  const EB_E = R.EXEMPT_BICOND_EN || EXEMPT_BICOND_EN;
  const EC_Z = R.EXEMPT_CONCEPT_ZH || EXEMPT_CONCEPT_ZH;
  const EC_E = R.EXEMPT_CONCEPT_EN || EXEMPT_CONCEPT_EN;

  // 全局豁免：正确区分 / 拒绝推断 / 对冲 / 双条件 / 概念教学 / 疑问句
  if (anyHit(ES_Z, text) || anyHit(ES_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EN_Z, text) || anyHit(EN_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EH_Z, text) || anyHit(EH_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EB_Z, text) || anyHit(EB_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (anyHit(EC_Z, text) || anyHit(EC_E, text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const NEC = NEC_Z.concat(NEC_E);
  const SUF = SUF_Z.concat(SUF_E);
  const INF_FWD = INF_FW_Z.concat(INF_FW_E);
  const INF_BWD = INF_BW_Z.concat(INF_BW_E);
  const SPAN = isZh ? 70 : 140;

  /**
   * 核心判定：宣称腿（ownClaim）在文内 × 反向宣称腿（oppClaim）不在结论
   * 跨度内 × 结论腿（conclList）出现 × 宣称与结论之间有推断词 × 两者
   * 跨度 ≤ SPAN。
   */
  function route(ownClaim, oppClaim, conclList, detailZh, detailEn) {
    // 宣称腿必须在文内出现（任一顺序：结论先行+因为+宣称 亦判，倒装形）
    const own = firstMatch(ownClaim, text, 0);
    if (!own) return null;
    let best = null;
    for (let from = 0; from < text.length;) {
      const c = firstMatch(conclList, text, from);
      if (!c) break;
      // 反向宣称抑制：结论跨度内出现的反向角色语言不计（「所以X是Y的
      // 充分条件」——这正是被误用的角色本身）；跨度外出现 = 已正确宣称
      // 双角色，同向复用不判。
      let oppOutside = false;
      for (let f2 = 0; f2 < text.length;) {
        const o = firstMatch(oppClaim, text, f2);
        if (!o) break;
        const insideConcl = o.idx >= c.idx && o.idx + o.len <= c.idx + c.len;
        if (!insideConcl) { oppOutside = true; break; }
        f2 = o.idx + o.len;
      }
      if (oppOutside) { from = c.idx + c.len; continue; }
      // 连接推断词（**方向强制**）：宣称在前→结论在后用前向连接词
      // （所以/因此…）；结论在前→宣称在后（倒装形）用后向连接词
      // （因为/由于/既然）。缝隙即宣称尾↔结论首之间的文本。
      const claimEnd = own.idx + own.len;
      const claimBefore = claimEnd <= c.idx;
      const gap = claimBefore ? text.slice(claimEnd, c.idx) : text.slice(c.idx + c.len, own.idx);
      const inferOk = claimBefore ? anyHit(INF_FWD, gap) : anyHit(INF_BWD, gap);
      // 跨度约束：宣称腿尾 ↔ 结论腿尾 的距离
      const span = Math.max(own.idx + own.len, c.idx + c.len) - Math.min(own.idx + own.len, c.idx);
      if (inferOk && span <= SPAN) {
        if (!best) {
          best = {
            hit: true, score: 0.58, count: 1,
            detail: isZh ? detailZh : detailEn,
          };
        }
        break;
      }
      from = c.idx + c.len;
    }
    return best;
  }

  // 路线1：必要条件宣称 × 充分性结论（把必要当充分用）
  const r1 = route(NEC, SUF, SC_Z.concat(SC_E),
    '条件角色混淆×必要条件当充分条件用(zh)',
    'condition-role-confusion×necessary-treated-as-sufficient(en)');
  if (r1) return r1;

  // 路线2：充分条件宣称 × 必要性结论（把充分当必要用）
  const r2 = route(SUF, NEC, NC_Z.concat(NC_E),
    '条件角色混淆×充分条件当必要条件用(zh)',
    'condition-role-confusion×sufficient-treated-as-necessary(en)');
  if (r2) return r2;

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkNecessitySufficiencyConfusion,
  __internals: () => ({
    NEC_CLAIM_ZH, NEC_CLAIM_EN, SUF_CLAIM_ZH, SUF_CLAIM_EN,
    SUF_CONCL_ZH, SUF_CONCL_EN, NEC_CONCL_ZH, NEC_CONCL_EN,
    INFER_FWD_ZH, INFER_FWD_EN, INFER_BWD_ZH, INFER_BWD_EN,
    EXEMPT_SEP_ZH, EXEMPT_SEP_EN, EXEMPT_NEG_ZH, EXEMPT_NEG_EN,
    EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN, EXEMPT_BICOND_ZH, EXEMPT_BICOND_EN,
    EXEMPT_CONCEPT_ZH, EXEMPT_CONCEPT_EN,
  }),
};
