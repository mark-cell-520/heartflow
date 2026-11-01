/**
 * src/cherry-picking.js — 「选择性取证」检测器（第 180 个判别维度）
 *
 * [r182 立项] philosophy_decision 本体在当前引擎（v6.8.109，179 维）上裁决
 * accelerate（confidence 0.7 / priority 40 / trigger optimal_conditions /
 * goalReviewed true；cognitiveLoad 与 uncertainty 均为字符串 "unknown"，
 * 按轮次纪律不当实质背书）。轮前差距实测（/tmp/hf-probe-r182.js，直调
 * src/gate.js）：本族 6 条攻击样本中 1 条**真零命中**（EN「We only cited
 * the studies that supported our hypothesis, which proves the theory is
 * correct.」穿过硬闸门且无任何维度代拦），其余 5 条仅被 absolute_claim /
 * confidence / contradiction 等兜底维度以通用理由代拦——无一维覆盖
 * 「选择性取证 × 确定性结论封装」这个结构本身；良性 6/6 干净。
 *
 * 外部来源（真实，未编造）：HN Algolia "logical fallacy detection" 命中
 * arXiv:2405.02318v3《Autoformalizing Natural Language to First-Order
 * Logic: A Case Study in Logical Fallacy Detection》（HN 258 分 / 143 评论，
 * 2025-03-04，https://arxiv.org/abs/2405.02318）——NL2FOL 框架把自然语言
 * 翻译成一阶逻辑后用 SMT 求解器判定逻辑有效性，以逻辑谬误检测为案例；
 * 该框架依赖 LLM 翻译，与纯规则引擎不同构，只取其谬误族清单作概念背景
 * （与 r169-r181 同口径）。GitHub API "logical fallacy detection"
 * （sort=stars）最高星为 tmakesense/logical-fallacy ★20，其余 ≤4 星且
 * 均为 LLM 路线，无可移植纯规则判据。Semantic Scholar 三次检索均 HTTP
 * 429 限流，如实记录。判据为心虫自有纯规则实现。
 *
 * 辨别的族：「选择性取证」（cherry-picking / 采樱桃谬误，确认偏误的
 * 证据纪律形态）——**只从支持某结论的证据池里取证**（只找/只引用/只保留
 * 支持性证据，或隐去/略去/屏蔽不利与反面证据），**却把结论封装为
 * 「证明/证实/成立/毫无疑问」**：
 *   我只找支持这个结论的证据，所以它一定是成立的。
 *   他专门挑对自己有利的数据说，足以证明产品没有问题。
 *   报告里只引用正面评价，隐瞒了所有不利记录，可见方案是完全可靠的。
 *   整个论证只保留了支持性案例，反面证据全部略去，因此结论毫无疑问成立。
 *   We only cited the studies that supported our hypothesis, which proves
 *   the theory is correct.
 *   The report only presented favorable evidence, so the conclusion is
 *   certainly sound.
 *
 * 为什么这是判别者的核心缺口（对齐心虫目标「寻真而非似是而非」）：寻真
 * 的前提是**证据对称性**——结论的置信度只能来自正反证据的合力。选择性
 * 取证把取证本身变成结论的傀儡：先裁掉不利证据，再宣布「证据充分」。
 * 它与绝对化断言（absolute_claim 管强度）和无依据断言（unsupported_claim
 * 管依据缺失）都不同——它有一个明确的「取证动作 × 方向性 × 结论封装」
 * 结构，且常以方法论口吻（「我们核查了」「报告显示」）出现，是 AI 输出
 * 中最典型的似是而非：看似做了功课，实则只做了支持自己的功课。
 *
 * 与既有维度的边界（r182 复量归因）：
 *   · selection_bias 管「受限来源 → 推广到全体/普遍」——本族腿①刻意
 *     不收来源受限陈述（问卷只发给会员/数据只来自一线），只收**方向性
 *     选择**（支持性/有利/正面 vs 不利/反面被隐去）；两族可同句共现但
 *     判定的是不同推理步骤。
 *   · one_sided_dismissal 管「先让步承认反面证据、再不作权衡扫掉」——
 *     本族不要求让步标记，判的是**取证阶段就只取一边**。
 *   · survivorship_bias 管「只取活下来的样本 → 推广全体」——成败不对称
 *     取样是其射程；本族判据不依赖成败语义，任意支持性证据均可。
 *   · absolute_claim / confidence 管断言强度；本族有明确的两腿迁移
 *     结构（取证方向 → 结论确定性），强度词可缺席（「足以证明产品没有
 *     问题」无「一定」仍是本族）。
 *   · fallacies 维度内仅 1 条英文窄模式（cherry-pick + data/evidence +
 *     to prove，src/index.js:5680）与 3 条中文确认偏误窄句（5567-5569），
 *     中文选择性取证族零覆盖；fallacy_fallacy 管「指认谬误→废结论」的
 *     结论侧，本族管取证动作本身。
 *
 * 判据（两腿共现 + 顺序腿，缺一不判）：
 *   · 腿① SELECT 选择性取证陈述，四形任一：
 *     A 支持性取样形——选择性副词（只/仅/唯独/单/专门/专挑/净挑/偏挑）
 *       → [≤8字] → 取证动词（找/搜集/收集/挑选/选取/挑/选/引用/援引/
 *       摘取/摘录/摘/保留/留存/呈现/列举/列出/展示/报告/提及/分析/统计/
 *       纳入/采信/采用/使用/谈/讲/说/看/读）→ [≤10字] → 方向标记
 *       （支持/有利/符合/赞同/迎合/顺着/证明/附和/正面/利好/唱好/吹捧）
 *       → [≤8字] → 取证对象（证据/数据/案例/材料/例子/事实/文献/报道/
 *       样本/记录/证言/反馈/评价/意见/说法/信息/数字/研究/调查/问卷/
 *       访谈/言论/观点）；A2 无副词形（动词 → [≤6字] → 方向标记 →
 *       [≤8字] → 对象——「筛选符合预期的实验记录」选择性由紧邻结构自足）。
 *     B 反向抑制形（两种语序）——B1「反面/不利/负面/反对/异议/相反 +
 *       对象 + 略去/隐去/删除/抹掉/屏蔽/过滤/排除/剔除/忽略/回避/不谈」；
 *       B2「隐去/隐瞒/略去/删除/抹掉/屏蔽/过滤/排除/剔除/无视/不谈 +
 *       不利/负面/反面/反对/异议/相反 + 对象」。
 *     C 定性短语形——选择性取证/举证/采证/引用/采信/呈现/报告/披露、
 *       断章取义、报喜不报忧、只捡好的、只拣好的、只谈成绩、只讲成绩；
 *       EN cherry-pick + 对象、quote out of context、suppress/omit/
 *       exclude + contrary/negative + 对象。
 *     EN A/B 形——only/solely/selectively/just + 取证动词 + 支持性标记
 *       + 对象（两种语序：only cited the studies that supported … 与
 *       only favorable evidence）。
 *   · 腿② SEAL 确定性结论封装，三形任一：
 *     A 连接词形——连接词（所以/因此/因而/足见/据此/可见/故而/于是/
 *       那么；EN so/therefore/thus/hence/which means/which proves）→
 *       [≤18字] → [确定性副词（一定/必然/必定/肯定/完全/毫无疑问/
 *       毋庸置疑/不容置疑/毫无疑义/百分之百）→ [≤6字] →] 封结论名词
 *       （成立/为真/属实/正确/没错/无误/可靠/可信/有效/没有问题/没
 *       问题/并无问题/无懈可击/站得住/毫无疑问/毋庸置疑/毫无疑问；
 *       EN correct/true/valid/reliable/sound/right/accurate/solid/
 *       watertight）或封结论动词（证明/证实/印证/坐实/说明/确立；EN
 *       proves/confirms/validates/establishes/demonstrates）→ [≤10字]
 *       → 封结论名词。
 *     B 直接封装形——[足以/完全可以] + 封结论动词 → [≤8字] → 封结论
 *       名词（「足以证明产品没有问题」无连接词，必须收）。
 *     C 情态封装形——确定性副词 → [≤6字] → 封结论名词（跨句亦判：
 *       「报告只引用正面评价。方案完全可靠。」）。
 *   · 腿③ ORDER 顺序——腿①必须早于腿②（先选择性取证、后确定性封装）。
 *     「方案完全可靠，因为报告只引用正面评价」倒装形语义同族但极少见，
 *     本轮保守不收（与 r180 先例同口径）。
 *
 * 为什么取 VERIFY 级：单句可能是**对他人选择性取证的正确指控**（「你
 * 这就是断章取义」「他只挑有利数据，所以这个结论不足以采信」——没有
 * 确定性正封装，天然不判），也可能是方法学讨论（「只取支持性证据会
 * 导致确认偏误」——META 豁免）。verify 的含义是「这条把单边证据当充分
 * 证据的推断需要按证据对称性核查」——调用方应要求补上反面证据及其
 * 处置再采信结论。与 r161-r181 全部评价/论证族同口径。
 *
 * 明确不判的（豁免，全部可负例注入置空）：
 *   · 概念/教学转述（确认偏误/确认偏差/认知偏差/幸存者偏差/采樱桃谬误/
 *     逻辑谬误/常见谬误/辩论技巧/诡辩术/教材/课堂；EN confirmation bias /
 *     selection bias / survivorship bias / cognitive bias / logical fallacy /
 *     cherry-picking fallacy / textbook / lecture——讨论这个偏差本身是
 *     正确判别；**刻意不收「选择性取证/断章取义」裸词**：它们同时是
 *     腿①攻击形，收了会把自己的腿①豁免掉，r180 同款教训）。
 *   · 纪律性否定（不能/不可/不得/不要/别/切勿/切忌/避免 + 只/选择性/
 *     断章/报喜/隐去/隐瞒/略去/cherry——「不能只挑对自己有利的证据」
 *     是正确判别）。
 *   · 结论侧否定与存疑（不足以/无法/难以/不能/不构成/谈不上/算不上 +
 *     证明/证实/说明/采信/支撑/确立，或不足为凭/不足为证/存疑/待验证/
 *     待定/有待/仍需/尚需/还需/不宜轻信/不可轻信/要打折扣/需进一步——
 *     「他只引用正面数据，所以这个结论不足以采信」是正确判别）。
 *   · 对冲弱化结论（可能/也许/或许/大概/似乎/不见得/未必/maybe/perhaps/
 *     might/probably）。
 *   · 疑问句（含 ?/？）。
 *
 * 已知边界（下轮可继续）：① 腿③只做前向（先取证、后封装），「结论毫无
 * 疑问，因为报告只引用正面评价」倒装形放过；② 「成功案例/活下来的样本」
 * 形（「只统计了成功案例，足以证明方法有效」）语义同族但与
 * survivorship_bias 射程交界，本轮保守不收；③ 存量维度 absolute_claim /
 * confidence 会代拦部分本族边缘长句（r182 实测见 UPGRADE_LOG），非本
 * 维度引入，改动前行为一致。
 *
 * 实现形态同 r181 halo-effect.js 先例：常量全部为 RegExp 数组 +
 * anyHit/scanAll/srcGroup 助手，腿①/腿②正则由各子表动态拼接（保证全部
 * 可负例注入），负例注入以 [] 置空指定常量。
 */
'use strict';

// ─── 腿① SELECT 选择性取证陈述 ───────────────────────────────────
// A 支持性取样形四子表（动态拼接：副词 → 动词 → 方向标记 → 对象）
const SEL_ADV_ZH = [
  /(?:只|仅|唯独|单|专门|专挑|净挑|偏挑|单只|仅只)/,
];
const SEL_VERB_ZH = [
  /(?:找|搜寻|搜集|收集|采集|采取|挑选|选取|挑|择|选|筛选|筛|引用|援引|摘取|摘录|摘|保留|留存|存留|呈现|列举|列出|展示|报告|提及|说起|分析|统计|纳入|采信|采纳|采用|使用|相信|谈|讲|说|看|读|听闻)/,
];
// 方向标记：**全部收裸名词形态**（161 轮教训：同族词去掉前后缀仍须独立
// 命中——收「支持」而非只收「支持性」，收「正面」而非只收「正面的」）
const SEL_MARK_ZH = [
  /(?:支持|有利|符合|赞同|迎合|顺着|证明|附和|正面|利好|唱好|吹捧)/,
];
// 取证对象名词（同样裸名词形态）
const SEL_OBJ_ZH = [
  /(?:证据|数据|案例|材料|例子|事实|文献|报道|报导|样本|记录|证言|反馈|评价|意见|说法|信息|数字|研究|调查|问卷|访谈|言论|观点)/,
];

// B 反向抑制形（两种语序）
// B1 对象在前：反面/不利… + 对象 + 抑制动词
const SEL_NEG_QUAL_ZH = [
  /(?:反面|不利|负面|反对|异议|相反|相左|刺耳|打脸)/,
];
const SEL_SUPPRESS_ZH = [
  /(?:略去|略过|隐去|隐没|删除|删去|抹掉|抹去|扣下|扣掉|屏蔽|过滤|滤掉|排除|剔除|去掉|舍弃|无视|忽略|回避|避开|不谈|不提|不说|压下)/,
];
// B2 抑制动词在前（「隐瞒了所有不利记录」——与 B1 尾部动词同表：同族词
// 必须同表，否则负例注入要打两处，且两张相同内容的表必然腐化漂移）

// C 定性短语形（中英）
const SEL_PHRASE_ZH = [
  /(?:选择性(?:取证|举证|采证|引用|采信|呈现|报告|披露|挑选|选取|使用))/,
  /(?:断章取义|报喜不报忧|只捡好的|只拣好的|只谈成绩|只讲成绩|只报喜|隐恶扬善)/,
];
const SEL_PHRASE_EN = [
  /\bcherry[- ]?pick\w*/i,
  /\b(?:quot\w+|taken)\s+out\s+of\s+context\b/i,
  // 抑制动词 + 相反/不利 + 对象（「suppressed all the negative evidence」）
  /\b(?:ignor\w+|omitt\w+|exclud\w+|suppress\w+|conceal\w+|hid\w+|hiding|left out|dropped)\b[^.]{0,30}\b(?:contrary|opposing|unfavorable|unfavourable|negative|contradict\w+|dissenting|adverse|critical)\b[^.]{0,30}\b(?:evidence|data|studies|cases|examples|findings|results|reports|feedback|testimony)\b/i,
];
// EN A 形（动词在中间，对象与标记两种语序都收）
const SEL_EN_ADV = [
  /\b(?:only|just|solely|exclusively|selectively)\b/i,
];
const SEL_EN_VERB = [
  /\b(?:cite|cited|citing|collect|collected|collecting|gather|gathered|gathering|select|selected|selecting|pick|picked|choos(?:e|es|ing)|keep|kept|keeping|present|presented|presenting|report|reported|reporting|include|included|including|use|used|using|look(?:ed|ing)?\s+at|show(?:ed|ing)?|analyz\w+|examin\w+|survey\w+|interview\w+|consult\w+)\b/i,
];
const SEL_EN_MARK = [
  /\b(?:support\w*|favor\w*|back(?:ed|ing)?|confirm\w*|agree\w*|consistent|positive|promising|flatter\w*)\b/i,
];
const SEL_EN_OBJ = [
  /\b(?:evidence|data|studies|study|cases|examples|findings|results|literature|reports|samples|feedback|testimony|information)\b/i,
];

// ─── 腿② SEAL 确定性结论封装 ─────────────────────────────────────
const CONNECT_ZH = [
  /(?:所以|因此|因而|足见|据此|可见|故而|于是|那么|这说明)/,
];
const CONNECT_EN = [
  /\b(?:so|therefore|thus|hence|which means|that means|consequently|accordingly)\b/i,
];
// 封结论动词
const SEAL_VERB_ZH = [
  /(?:证明|证实|印证|坐实|说明|确立|奠定)/,
];
const SEAL_VERB_EN = [
  /\b(?:proves|proved|proven|confirms|confirmed|validates|validated|establishes|established|demonstrates|demonstrated|settles|settled|verifies|verified)\b/i,
];
// 确定性副词（全部裸词形态）
const SEAL_ADV_ZH = [
  /(?:一定|必然|必定|肯定|铁定|完全|百分之百|毫无疑问|毋庸置疑|不容置疑|毫无疑义|确凿无疑|无疑|确信不疑)/,
];
const SEAL_ADV_EN = [
  /\b(?:certainly|definitely|conclusively|definitively|incontrovertibly|undoubtedly|without doubt|beyond doubt|beyond any doubt|beyond reasonable doubt|ironclad|airtight|unassailable)\b/i,
];
// 封结论名词（裸词形态）
const SEAL_NOUN_ZH = [
  /(?:成立|为真|属实|正确|没错|无误|可靠|可信|有效|没有问题|没问题|并无问题|无懈可击|站得住|毫无疑问|毋庸置疑|确凿|铁证|准确|精确|严谨|更优|更好|更强|更高|更快|更稳|更省|最优|最好)/,
];
const SEAL_NOUN_EN = [
  /\b(?:correct|true|valid|reliable|sound|right|accurate|solid|watertight|beyond doubt|no doubt)\b/i,
];

// ─── 腿③ ORDER + 豁免常量 ─────────────────────────────────────────
// 概念/教学转述（讨论这个偏差本身是正确判别）。
// ⚠️ **刻意不收「选择性取证/断章取义」裸词**——它们同时是腿①攻击形，
// 收了会把自己的腿①豁免掉（r180 同款教训）。
const META_ZH = [
  /(?:确认偏误|确认偏差|认知偏差|认知偏误|幸存者偏差|取样偏差|样本偏差|采樱桃谬误|采樱桃|逻辑谬误|常见谬误|辩论技巧|诡辩术|论证方法|研究方法)/,
  /(?:教材|课本|课堂|讲义|教科书)/,
];
const META_EN = [
  /\b(?:confirmation bias|selection bias|survivorship bias|cognitive bias(?:es)?|logical fallacy|logical fallacies|cherry[- ]picking fallacy|fallacy of selective evidence|textbook|lecture)\b/i,
];
// 纪律性否定（正确判别：「不能只挑对自己有利的证据」「他没有只保留支持
// 性数据」——对选择性本身的否认/劝诫）
const NEG_ZH = [
  /(?:不能|不可|不得|不要|别|切勿|切忌|避免|防止|拒绝|反对|不该|不应|勿|没|没有|并未|未曾|决不|绝不)[^。！？]{0,14}(?:只|仅|选择性|断章|报喜|隐去|隐瞒|略去|删去|抹掉|屏蔽|过滤|排除|剔除|无视|cherry|only)/,
];
// 结论侧否定与存疑（正确判别：「所以他这个结论不足以采信」）
const NEGSEAL_ZH = [
  /(?:不足以|无法|难以|不能|不构成|谈不上|算不上|说明不了|证明不了|推不出)[^。！？]{0,6}(?:证明|证实|说明|采信|支撑|确立|作为)/,
  /(?:不足为凭|不足为证|存疑|待验证|待定|有待|仍需|尚需|还需|不宜轻信|不可轻信|要打折扣|需进一步|需谨慎|尚不成熟|证据不足)/,
];
// 对冲弱化结论（全文级）
const HEDGE_ZH = [
  /(?:可能|也许|或许|大概|恐怕|似乎|好像|仿佛|不见得|未必|说不准|不好说|没准|估计)/,
];
const HEDGE_EN = [
  /\b(?:maybe|perhaps|might|may|possibly|probably|seems|appears|could be|somewhat|likely)\b/i,
];

// ─── 助手 ─────────────────────────────────────────────────────────
function anyHit(list, text) {
  for (const re of list) if (re.test(text)) return true;
  return false;
}

/** 收集一组常量在文本中的全部出现位置。 */
function scanAll(list, text) {
  const hits = [];
  for (const re of list) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      if (m[0].length === 0) { g.lastIndex++; continue; }
      hits.push({ pos: m.index, end: m.index + m[0].length });
    }
  }
  return hits;
}

/** 数组 source 拼成一个 (?:a|b|c) 组（供动态构建，注入可承重）。 */
function srcGroup(list) {
  if (!list || list.length === 0) return null;
  return '(?:' + list.map(re => re.source).join('|') + ')';
}

/**
 * 构建腿①正则（A 形四子表 + B 形两语序 + C 形短语 + EN 三形）：
 * 全部由可注入常量动态拼接，注入 [] 置空任一族即整体失效（负例承重）。
 */
function buildSelectors(R) {
  const out = [];
  // A 中文：副词 → [≤8] → 动词 → [≤10] → 方向标记 → [≤8] → 对象
  const adv = srcGroup(R.SEL_ADV_ZH), verb = srcGroup(R.SEL_VERB_ZH);
  const mark = srcGroup(R.SEL_MARK_ZH), obj = srcGroup(R.SEL_OBJ_ZH);
  if (adv && verb && mark && obj) {
    out.push(new RegExp(adv + '[^。！？]{0,8}' + verb + '[^。！？]{0,10}' + mark + '[^。！？]{0,8}' + obj));
  }
  // A2 中文（无副词形——「筛选符合预期的实验记录」：选择性由「动词 ×
  // 方向标记 × 对象」紧邻结构自足，靠腿②确定性封装兜底误判风险）
  if (verb && mark && obj) {
    out.push(new RegExp(verb + '[^。！？]{0,6}' + mark + '[^。！？]{0,8}' + obj));
  }
  // B1 中文：反面/不利 + [≤4] + 对象 + [≤6] + [全部/都] + 抑制动词
  const qual = srcGroup(R.SEL_NEG_QUAL_ZH), sup = srcGroup(R.SEL_SUPPRESS_ZH);
  if (qual && obj && sup) {
    out.push(new RegExp(qual + '[^。！？]{0,4}' + obj + '[^。！？]{0,6}(?:全部|悉数|一概|都|尽数|尽)?' + sup));
    out.push(new RegExp(sup + '(?:了|掉|去)?(?:全部|所有|一切|那些|相关)?' + qual + '[^。！？]{0,6}(?:的)?' + obj));
  }
  // C 中英短语
  out.push(...(R.SEL_PHRASE_ZH || []), ...(R.SEL_PHRASE_EN || []));
  // EN A：only + [≤35] + 动词 + [≤35] + 标记（对象在标记前后均可，由
  // EN B 形补「标记在前、对象在后」的语序）
  const eadv = srcGroup(R.SEL_EN_ADV), everb = srcGroup(R.SEL_EN_VERB);
  const emark = srcGroup(R.SEL_EN_MARK), eobj = srcGroup(R.SEL_EN_OBJ);
  if (eadv && everb && emark && eobj) {
    out.push(new RegExp(eadv + '[^.]{0,35}' + everb + '[^.]{0,35}' + emark, 'i'));
    out.push(new RegExp(eadv + '[^.]{0,20}' + emark + '[^.]{0,20}' + eobj, 'i'));
  }
  return out;
}

/**
 * 构建腿②正则（A 连接词形 + B 直接封装形 + C 情态封装形 + EN 三形）。
 */
function buildSeals(R) {
  const out = [];
  const conn = srcGroup(R.CONNECT_ZH);
  const sverb = srcGroup(R.SEAL_VERB_ZH);
  const sadv = srcGroup(R.SEAL_ADV_ZH);
  const snoun = srcGroup(R.SEAL_NOUN_ZH);
  // A：连接词 → [≤18] → [副词 → [≤6] →] 封结论名词
  if (conn && snoun) {
    out.push(new RegExp(conn + '[^。！？]{0,18}' + snoun));
    if (sadv) out.push(new RegExp(conn + '[^。！？]{0,18}' + sadv + '[^。！？]{0,6}' + snoun));
  }
  // A'：连接词 → [≤18] → 封结论动词 → [≤10] → 封结论名词
  if (conn && sverb && snoun) {
    out.push(new RegExp(conn + '[^。！？]{0,18}' + sverb + '[^。！？]{0,10}' + snoun));
  }
  // B：[足以/完全可以] + 封结论动词 → [≤8] → 封结论名词
  if (sverb && snoun) {
    out.push(new RegExp('(?:足以|完全可以|铁一般的)?' + sverb + '[^。！？]{0,8}' + snoun));
  }
  // C：确定性副词 → [≤6] → 封结论名词（跨句亦判）
  if (sadv && snoun) {
    out.push(new RegExp(sadv + '[^。！？]{0,6}' + snoun));
  }
  // EN A：连接词 → [≤40] → 封结论动词 → [≤25] → 封结论名词
  const econn = srcGroup(R.CONNECT_EN), esverb = srcGroup(R.SEAL_VERB_EN);
  const esadv = srcGroup(R.SEAL_ADV_EN), esnoun = srcGroup(R.SEAL_NOUN_EN);
  if (econn && esverb && esnoun) {
    out.push(new RegExp(econn + '[^.]{0,40}' + esverb + '[^.]{0,25}' + esnoun, 'i'));
  }
  // EN A'：连接词 → [≤40] → 封结论名词（so the conclusion is valid——无封
  // 结论动词的直接封装，与中文 A 形同构）
  if (econn && esnoun) {
    out.push(new RegExp(econn + '[^.]{0,40}' + esnoun, 'i'));
  }
  // EN B：封结论动词 → [≤25] → 封结论名词（which proves the theory is correct）
  if (esverb && esnoun) {
    out.push(new RegExp(esverb + '[^.]{0,25}' + esnoun, 'i'));
  }
  // EN C：确定性副词 → [≤15] → 封结论名词
  if (esadv && esnoun) {
    out.push(new RegExp(esadv + '[^.]{0,15}' + esnoun, 'i'));
  }
  return out;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以 [] 置空指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkCherryPicking(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const selAdv = R.SEL_ADV_ZH || SEL_ADV_ZH;
  const selVerb = R.SEL_VERB_ZH || SEL_VERB_ZH;
  const selMark = R.SEL_MARK_ZH || SEL_MARK_ZH;
  const selObj = R.SEL_OBJ_ZH || SEL_OBJ_ZH;
  const selQual = R.SEL_NEG_QUAL_ZH || SEL_NEG_QUAL_ZH;
  const selSup = R.SEL_SUPPRESS_ZH || SEL_SUPPRESS_ZH;
  const selPhZ = R.SEL_PHRASE_ZH || SEL_PHRASE_ZH;
  const selPhE = R.SEL_PHRASE_EN || SEL_PHRASE_EN;
  const eAdv = R.SEL_EN_ADV || SEL_EN_ADV;
  const eVerb = R.SEL_EN_VERB || SEL_EN_VERB;
  const eMark = R.SEL_EN_MARK || SEL_EN_MARK;
  const eObj = R.SEL_EN_OBJ || SEL_EN_OBJ;
  const connZ = R.CONNECT_ZH || CONNECT_ZH;
  const connE = R.CONNECT_EN || CONNECT_EN;
  const svZ = R.SEAL_VERB_ZH || SEAL_VERB_ZH;
  const svE = R.SEAL_VERB_EN || SEAL_VERB_EN;
  const saZ = R.SEAL_ADV_ZH || SEAL_ADV_ZH;
  const saE = R.SEAL_ADV_EN || SEAL_ADV_EN;
  const snZ = R.SEAL_NOUN_ZH || SEAL_NOUN_ZH;
  const snE = R.SEAL_NOUN_EN || SEAL_NOUN_EN;
  const metaZ = R.META_ZH || META_ZH;
  const metaE = R.META_EN || META_EN;
  const negZ = R.NEG_ZH || NEG_ZH;
  const negSealZ = R.NEGSEAL_ZH || NEGSEAL_ZH;
  const hedgeZ = R.HEDGE_ZH || HEDGE_ZH;
  const hedgeE = R.HEDGE_EN || HEDGE_EN;

  // 概念/教学转述 → 不是运用它
  if (anyHit(metaZ, text) || anyHit(metaE, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 疑问句
  if (/[?？]/.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 对冲弱化结论（全文级——出现对冲即整句弱化）
  if (anyHit(hedgeZ, text) || anyHit(hedgeE, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 纪律性否定（不能/避免 + 选择性取证——说话者自己做维度分离）
  if (anyHit(negZ, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 结论侧否定与存疑（「不足以采信」「仍需复核」是正确判别）
  if (anyHit(negSealZ, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const selectors = buildSelectors({
    SEL_ADV_ZH: selAdv, SEL_VERB_ZH: selVerb, SEL_MARK_ZH: selMark,
    SEL_OBJ_ZH: selObj, SEL_NEG_QUAL_ZH: selQual, SEL_SUPPRESS_ZH: selSup,
    SEL_PHRASE_ZH: selPhZ, SEL_PHRASE_EN: selPhE,
    SEL_EN_ADV: eAdv, SEL_EN_VERB: eVerb, SEL_EN_MARK: eMark, SEL_EN_OBJ: eObj,
  });
  const selHits = scanAll(selectors, text);
  if (selHits.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  const seals = buildSeals({
    CONNECT_ZH: connZ, CONNECT_EN: connE,
    SEAL_VERB_ZH: svZ, SEAL_VERB_EN: svE,
    SEAL_ADV_ZH: saZ, SEAL_ADV_EN: saE,
    SEAL_NOUN_ZH: snZ, SEAL_NOUN_EN: snE,
  });
  const sealHits = scanAll(seals, text);
  if (sealHits.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  // 顺序腿：腿①必须早于腿②（先选择性取证、后确定性封装）
  const ordered = sealHits.filter(s => selHits.some(f => f.pos <= s.pos));
  if (ordered.length === 0) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true,
    score: 0.5,
    count: 1,
    detail: '选择性取证×支持性证据×确定性结论封装',
  };
}

module.exports = {
  checkCherryPicking,
  __internals: () => ({
    SEL_ADV_ZH, SEL_VERB_ZH, SEL_MARK_ZH, SEL_OBJ_ZH,
    SEL_NEG_QUAL_ZH, SEL_SUPPRESS_ZH,
    SEL_PHRASE_ZH, SEL_PHRASE_EN,
    SEL_EN_ADV, SEL_EN_VERB, SEL_EN_MARK, SEL_EN_OBJ,
    CONNECT_ZH, CONNECT_EN,
    SEAL_VERB_ZH, SEAL_VERB_EN, SEAL_ADV_ZH, SEAL_ADV_EN,
    SEAL_NOUN_ZH, SEAL_NOUN_EN,
    META_ZH, META_EN, NEG_ZH, NEGSEAL_ZH, HEDGE_ZH, HEDGE_EN,
  }),
};
