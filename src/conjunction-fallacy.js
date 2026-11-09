/**
 * src/conjunction-fallacy.js — 「合取谬误（conjunction fallacy /
 * Linda problem）」检测器（第 176 个判别维度）
 *
 * [r178 立项] decision 本体在当前引擎（v6.8.105，175 维）上裁决 accelerate
 * （philosophy_decision：type=accelerate / confidence 0.7 / priority 40 /
 * trigger optimal_conditions；cognitiveLoad 与 uncertainty 均为 "unknown"，
 * 按轮次纪律不当实质背书）。候选来自三层研究 + 引擎差距实测：
 * HN Algolia 命中 UQLM（cvs-health/uqlm，LLM-based 不确定性量化，与纯
 * 规则引擎不同构，仅作概念背景）；Semantic Scholar / GitHub API 本次无
 * 可用结果（如实记录）；/tmp/hf-probe-candidates.js 在当前 175 维引擎上
 * 实测：合取谬误样本 0/5 零命中，p 值误读 5/5、置信区间误读 4/5 已被
 * perfect_error 代拦，不可证伪族部分被 contradiction/kafkatrapping 代拦
 * ——合取谬误是唯一零覆盖的真缺口。hot_hand/post_hoc/pseudo_causal/
 * selection_bias/survivorship_bias/clustering_illusion 均不管「概率
 * 比较句内部的结构违规」，本维度是独立 dimMap 键的新攻击族。
 *
 * 辨别的族：合取谬误（conjunction fallacy）——把**合取事件（A 且 B）的
 * 概率/可能性宣称高于其任一组分事件（A 或 B）的概率**。概率公理
 * P(A∧B) ≤ P(A) 恒成立：两个条件同时满足的场合必然少于任一条件单独
 * 满足的场合，与描述生动与否、叙事合理与否无关。把合取描述得更具体
 * 就认为它"更可能"，是把叙事的代表性（representativeness）冒充概率
 * 的大小：
 *   琳达既是银行出纳又是女权主义者的概率，高于她只是银行出纳的概率。
 *   他既是名校毕业又有十年经验的可能性，比他只是名校毕业的可能性更大。
 *   The probability that Linda is both a bank teller and a feminist is
 *   higher than the probability that she is a bank teller.
 *   It is more likely that she is both a philosopher and a poet than
 *   that she is merely a philosopher.
 *
 * 为什么是恒假而非可能错：比较双方若确为「同一主体的合取描述概率」与
 * 「同一主体的组分描述概率」，则不等式方向永远违反概率公理——不存在
 * 任何事实情形使其成立。这与本引擎多数 verify 级维度（需要补证据才知
 * 对错）不同：本族补的证据不是"是否如此"，而是"比较对象是否真是合取
 * vs 组分"（排除条件概率比较与分组统计两种同形良性结构，见下方）。
 *
 * 判据（三腿共现，缺一不判）：
 *   腿① CONJ 合取标记，中文六形任一 / 英文三形任一：
 *     Z-a 既是…又是 / 既…又… / 既…也… / 不但…而且 / 不仅…还 /
 *         既会…又会 / 又…又…（组合形，双关键词同窗 ≤14 字）；
 *     Z-b 兼具 / 兼有 / 同时具备 / 同时具有 / 兼备；
 *     Z-c 裸连接词「且」「以及」（附近必有腿②概率词才算腿①成立，
 *         由腿②×腿③窗距保证，裸「且」不单独承重）；
 *     EN both … and / as well as / and also。
 *   腿② PROB 概率词（裸名词形态）：
 *     ZH 概率 / 可能性 / 几率 / 机率 / 或然率；
 *     EN probability / chance / likelihood / odds / likely。
 *   腿③ CMP 概率比较结构，两条路线任一：
 *     C-a 比较算子（高于/大于/超过/胜过/优于/更可能/可能性更大/
 *         更高/更大/更低/更小；EN higher than / greater than /
 *         larger than / more probable / exceeds / more likely）×
 *         组分回指（只是/仅仅是/单是/不过是/仅/只/无非；EN just /
 *         only / merely / simply / purely / alone）落在算子后 25 字
 *         （EN 80 字符）窗内；
 *     C-b 两个概率词 × 中间夹比较算子（覆盖「A 的概率高于 B 的概率」
 *         的数学陈述形与倒装形）。
 *   缺腿不判——「她既是优秀的工程师又是很好的沟通者」无概率词；
 *   「这个项目成功的可能性比失败大」无合取腿；「A 且 B 的概率大于
 *   A 的概率，那一定是计算错误」无算子×回指共现（且是条件句）。
 *
 * 与既有维度的边界：
 *   · perfect_error S1_false_precision 管数字精度失真，本族不管数字
 *     管概率比较句的结构违规；
 *   · base_rate_neglect 管单信号忽视先验，本族不涉先验、判的是
 *     P(A∧B)>P(A) 的不等式方向；
 *   · hot_hand / gamblers_fallacy 管序列独立性误用，本族不依赖序列；
 *   · statistical_misleading 管基数隐藏的比例断言，本族是比较对象
 *     之间的逻辑关系而非基数呈现；
 *   · fallacies 内的合取相关子标签与本维度是家族内共存关系（同 r171
 *     base_rate_neglect 与 r172 whole_part_transfer 先例）。
 *
 * 明确不判（豁免，按序）：
 *   · 分组条件比较形（结构即豁免）：合取标记前后 12 字（EN 40 字符）
 *     内出现人群后缀（的人/的学生/的应聘者/的选手/的群体/的成员；
 *     EN people who / those who / students who / candidates who /
 *     employees who / applicants who / group(s) of）时，该句是
 *     P(结果|X∧Y) 与 P(结果|Y) 的条件概率比较——「既努力又有天赋的
 *     学生获奖比例比不努力的学生高」是可能为真的经验陈述，不判；
 *   · 概念/教学转述（合取谬误/琳达问题/卡尼曼/特维尔斯基/概率公理/
 *     教材/课堂/论文/统计学；EN conjunction fallacy / Linda problem /
 *     Kahneman / Tversky / probability theory / textbook / lecture）：
 *     讨论这个谬误本身是正确判别；
 *   · 推理否定/方向纠正（不可能高于/不可能大于/不会高于/不超过/至多
 *     等于/推不出/说明不了/不等于/未必；EN cannot exceed / at most /
 *     does not mean / cannot conclude / not necessarily）：拒绝该不
 *     等式本身是正确判别；
 *   · 对冲（(?<![的可])可能(?![性])/也许/或许/大概/恐怕/似乎；EN
 *     maybe / perhaps / might / probably / seems / appears / could
 *     be）：概率化弱化结论不作谬误判定。注意负向断言：「可能性」的
 *     「可能」不是对冲（r178 教训：攻击样本自带「可能性」一词，宽松
 *     的对冲豁免会把自己的腿②吃掉）；
 *   · 疑问句（含 ?/？）。
 */
'use strict';

// ─── 腿① CONJ 合取标记（中文）───────────────────────────────────────
// 161 轮教训自查（同族词去后缀仍命中）：既…又…/既是…又是/既…也… 收
// 组合正则；兼具/兼有/兼备/同时具备 收裸词形；裸「且」「以及」作路线
// c（不单独承重，靠腿②×腿③窗距兜底）。不收「而且/并且」——那是语篇
// 递进连词（「便宜而且耐用」不是逻辑合取断言），误伤风险高。
const CONJ_PAIR_ZH = [
  /既[^。，！？!?,;；\n]{0,14}(?:又|也)/,
  /既是[^。，！？!?,;；\n]{0,14}又是/,
  /不但[^。，！？!?,;；\n]{0,14}而且/,
  /不仅[^。，！？!?,;；\n]{0,14}还/,
  /既会[^。，！？!?,;；\n]{0,12}又会/,
  /又[^。，！？!?,;；\n]{0,6}又/,
];
const CONJ_BARE_ZH = [
  /兼具|兼有|兼备|同时具备|同时具有|同时拥有|二者兼有|两者兼有/,
];
// 路线 c：裸连接词（与腿②概率词、腿③算子共同承重）
const CONJ_AND_ZH = [
  /且|以及/,
];

// ─── 腿① CONJ 合取标记（英文）───────────────────────────────────────
const CONJ_PAIR_EN = [
  /\bboth\b[^.]{0,60}\band\b/i,
  /\bas\s+well\s+as\b/i,
  /\band\s+also\b/i,
];

// ─── 腿② PROB 概率词（裸名词形态）───────────────────────────────────
const PROB_ZH = [
  /概率|可能性|几率|机率|或然率/,
  // [r266 新增族] 口语化概率名词（希望/指望/胜算/把握——与腿③双概率词
  // 夹算子的路线 b 共同承重，单词出现不判）
  /希望|指望|胜算|把握|盼头/,
];
const PROB_EN = [
  /\b(?:probability|probable|chance|likelihood|odds|likely)\b/i,
  // [r266 新增族] 口语化概率名词（a shot at）
  /\bshots?\b/i,
];

// ─── 腿③ CMP 路线 a：比较算子 × 组分回指 ────────────────────────────
// 算子负向自查：算子前 4 字内有否定词时不算（「不可能高于」「不超过」
// 由豁免表兜底，此处双保险——「概率不超过组分」若算子命中会被误判）。
const CMP_OP_ZH = [
  /(?:^|[^不未绝])(?:高于|大于|超过|胜过|优于|更可能|可能性更大|更高|更大|更低|更小|更多)/,
  // [r266 新增族] 「比X大/高/强/多」比较构式（X ≤12 字；否定前查双保险）
  /(?<![不未绝])比[^。，！？!?,;；\n]{0,12}(?:大|高|强|多)/,
];
const CMP_BACK_ZH = [
  // [r270] 仅/只 X；[r272 扩展] 单纯/单单/光 X——口语对比锚的三种省略形：
  //   「比单纯是会计更可能…」「比光会写代码更…」。原表只收 只/仅/单是/仅只是，
  //   这三个形整族穿透（r272 探针实测 3/3 命中、良性 0 误伤）。
  /只是|仅仅是|单是|不过是|无非|仅仅|仅只是|只有|单纯|单单|光/,
];
const CMP_OP_EN = [
  /\b(?:higher\s+than|greater\s+than|larger\s+than|more\s+probable|exceeds?|more\s+likely|bigger\s+than)\b/i,
  // [r266 新增族] 口语化比较算子（better/stronger shot at）
  /\b(?:better|stronger)\s+shots?\b/i,
];
const CMP_BACK_EN = [
  /\b(?:just|only|merely|simply|purely|alone|no\s+more\s+than)\b/i,
];

// ─── 分组条件比较形的人群后缀（结构豁免，见文件头）───────────────────
const GROUP_SUFFIX_ZH = [
  /的人|的学生|的应聘者|的选手|的群体|的成员|的客户|的用户|的员工|的候选人/,
];
const GROUP_SUFFIX_EN = [
  /\b(?:people|those|students?|candidates?|employees?|applicants?|individuals|groups?)\s+(?:who|that)\b/i,
  /\bgroups?\s+of\b/i,
];

// ─── 豁免一：概念/教学转述 ───────────────────────────────────────────
const EXEMPT_CONCEPT_ZH = [
  /合取谬误|琳达问题|卡尼曼|特维尔斯基|特韦尔斯基|概率公理|概率论|或然率|统计学|统计课|数学课|逻辑学|教材|课本|课堂|论文中|文章里|科普|认知偏差|行为经济学|启发式|代表性启发/,
];
const EXEMPT_CONCEPT_EN = [
  /\b(?:conjunction\s+fallacy|linda\s+problem|kahneman|tversky|probability\s+theory|axiom|theorem|statistics|textbook|lecture|professor|teacher|classroom|cognitive\s+bias|behavioral\s+economics|representativeness)\b/i,
];

// ─── 豁免二：推理否定/方向纠正 ───────────────────────────────────────
const EXEMPT_NEG_ZH = [
  /不可能高于|不可能大于|不会高于|不会大于|不超过|不高于|不大于|至多等于|至多|推不出|说明不了|不能说明|并不意味着|不等于|未必|不一定|最多只能|恰是概率|正是概率公理|计算错误|算错|推导错误|记错/,
];
const EXEMPT_NEG_EN = [
  /\b(?:cannot\s+exceed|can'?t\s+exceed|at\s+most|does\s+not\s+mean|doesn'?t\s+mean|cannot\s+conclude|can'?t\s+conclude|not\s+necessarily|no\s+greater\s+than)\b/i,
];

// ─── 豁免三：对冲（负向断言防自吞腿②「可能性」）──────────────────────
// r178 教训：①「可能性」自带「可能」子串——宽松对冲会把自己的腿②吃掉；
// ②「不可能高于」的「可能」是否认式组成部分不是对冲——负向前查再收
// 「不/未」两字。三处一起收，攻击腿与否定腿都不被误豁免。
const EXEMPT_HEDGE_ZH = [
  /(?<![不未的可])可能(?![性])|也许|或许|大概|恐怕|多半|似乎|好像|看样子|说不定|倾向于/,
];
const EXEMPT_HEDGE_EN = [
  /\b(?:maybe|perhaps|might|may\s+be|possibly|probably|seems?|appears?|could\s+be|i\s+suspect)\b/i,
];

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

/** source 列表中任一匹配的 win 字窗内（可选双向）出现 target 列表匹配 */
function nearAny(sourceList, targetList, text, win, bothWays) {
  for (const re of sourceList) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + win);
      if (anyHit(targetList, after)) return true;
      if (bothWays) {
        const before = text.slice(Math.max(0, m.index - win), m.index);
        if (anyHit(targetList, before)) return true;
      }
      if (m.index === g.lastIndex) g.lastIndex++;
    }
  }
  return false;
}

/** 腿①：合取标记（中文）。路线 c 裸「且/以及」不单独成立——必须与腿②
 *  概率词邻近（≤12 字），防止语篇递进误判。 */
function conjZh(text, R) {
  if (anyHit(R.CONJ_PAIR_ZH || CONJ_PAIR_ZH, text)) return true;
  if (anyHit(R.CONJ_BARE_ZH || CONJ_BARE_ZH, text)) return true;
  // 路线 c：裸连接词 × 概率词邻近
  if (nearAny(R.CONJ_AND_ZH || CONJ_AND_ZH, R.PROB_ZH || PROB_ZH, text, 12, true)) return true;
  return false;
}

/** 腿①：合取标记（英文） */
function conjEn(text, R) {
  if (anyHit(R.CONJ_PAIR_EN || CONJ_PAIR_EN, text)) return true;
  return false;
}

/** 腿③：概率比较结构（路线 a：算子×回指；路线 b：双概率词夹算子） */
function cmpZh(text, R) {
  // 路线 a：算子后 25 字窗内有组分回指
  if (nearAny(R.CMP_OP_ZH || CMP_OP_ZH, R.CMP_BACK_ZH || CMP_BACK_ZH, text, 25, false)) return true;
  // 路线 b：两个概率词 × 中间夹比较算子（前后各 25 字窗双向）
  if (nearAny(R.PROB_ZH || PROB_ZH, R.CMP_OP_ZH || CMP_OP_ZH, text, 25, true)) {
    // 确认至少两个概率词（单个「概率高于」不带组分比较时不判）。
    // [r266] 计数改为跨全部 PROB_ZH 正则累加——原实现只数 [0]，新增
    // 口语化族（希望/指望/胜算/把握/shot）永远数不到，路线 b 对新族失效。
    let n = 0;
    for (const re of (R.PROB_ZH || PROB_ZH)) {
      const g = new RegExp(re.source, 'g');
      let m;
      while ((m = g.exec(text)) !== null) { n++; if (m.index === g.lastIndex) g.lastIndex++; }
    }
    if (n >= 2) return true;
  }
  return false;
}

/** 腿③：概率比较结构（英文） */
function cmpEn(text, R) {
  if (nearAny(R.CMP_OP_EN || CMP_OP_EN, R.CMP_BACK_EN || CMP_BACK_EN, text, 80, false)) return true;
  if (nearAny(R.PROB_EN || PROB_EN, R.CMP_OP_EN || CMP_OP_EN, text, 80, true)) {
    // [r266] 同 cmpZh：跨全部 PROB_EN 正则累加计数。注意 exec 循环正则
    // 必须带 g——r266 首次实现按 flags 透传（原正则只有 i）导致 exec
    // 永远返回同一匹配、死循环挂起（存量样本实测复现，已修）。
    let n = 0;
    for (const re of (R.PROB_EN || PROB_EN)) {
      const g = new RegExp(re.source, 'gi');
      let m;
      while ((m = g.exec(text)) !== null) { n++; if (m.index === g.lastIndex) g.lastIndex++; }
    }
    if (n >= 2) return true;
  }
  return false;
}

// ─── [r270 新句式族] 口语合取概率比较（合取 × 比较级概率 × 对比锚）────
// r270 探针实测缺口：6/8 攻击穿透。旧四路由全部要求腿② **显式概率名词**
// （概率/可能性/几率/希望/指望/胜算/把握），而最自然的口语形是把
// 「概率比较」压成一个比较级形容词——「他既是懂金融又是退伍军人，
// 比单是懂金融更可能当上基金经理」「比只是学霸更容易被录取」。
// 这里腿② = 比较级概率短语（更可能/更容易/胜算更大/more likely），
// 并新增**对比锚腿**（比…单是/than…merely）确保比较对象是合取的一个
// 分项而非泛指——没有对比锚的「既便宜又耐用更容易卖出去」是合理经验
// 陈述，不算合取谬误，故锚腿必选。
const CMP_PROB_ZH = '(?:更可能|更容易|更有希望|更有机会|更有胜算|胜算更大|机会更大|可能性更高|概率更大|更有可能|机率更大|把握更大|希望更大|更吃香|更抢手)';
// [r270 家族] CONJ × CMP_ANCHOR × CMP_PROB：定位短语在「比/相比/相对于」窗口
// [r272 扩展] 对比锚补 单纯/单单/光 三个口语省略形（与 CMP_BACK_ZH 对齐）
const CMP_ANCHOR_ZH = '(?:比[^。]{0,24}(?:只是|仅仅是|不过是|单是|仅为|只会|无非|而已|单纯|单单|光)|相比[^。]{0,24}(?:只是|仅仅是|单是|仅为|只会|单纯|单单)|相对于[^。]{0,24}(?:只是|单是|仅为|单纯|单单))';
// [r270] 本族专用对冲表：去掉主判据里的裸「可能」——「更可能」是本族腿②
// 本身，用主表会把所有攻击句自吞（实测 t1 被 EXEMPT_HEDGE_ZH 拦住）。
const EXEMPT_HEDGE_D_ZH = /也许|或许|大概|恐怕|多半|似乎|好像|看样子|说不定|倾向于|未必|不一定/;
const EXEMPT_HEDGE_D_EN = /\\b(?:maybe|perhaps|possibly|probably|might|seems|appears|unclear|uncertain)\\b/i;
// CONJ 腿①合并为正则源（腿①原为数组形态，此处只取 pair 族——裸连接词
// 「且/以及」与「兼具」族不含显式双分项并置，与口语概率比较族不匹配）
const CONJ_ZH_SRC = CONJ_PAIR_ZH.map((r) => r.source).join('|');
const CONJ_EN_SRC = CONJ_PAIR_EN.map((r) => r.source).join('|');
const CONJ_ZH_SRC_G = '(?:' + CONJ_ZH_SRC + ')';
const CONJ_EN_SRC_G = '(?:' + CONJ_EN_SRC + ')';
const CONJ_CMP_PROB_ZH = new RegExp(CONJ_ZH_SRC_G + '[^。]{0,90}' + CMP_PROB_ZH);
const CONJ_CMP_ANCHOR_ZH = new RegExp(CONJ_ZH_SRC_G + '[^。]{0,90}' + CMP_ANCHOR_ZH);

// 英文对应：both…and × more likely / better chance × than … merely/only
const CMP_PROB_EN = '(?:more likely|more probable|higher chance|greater chance|better chance|stronger chance|likelier)';
const CMP_ANCHOR_EN = '(?:than|compared to|compared with|versus|as opposed to|rather than)[^.]{0,40}(?:merely|just|only|simply|purely|alone)|(?:merely|just|only|simply|purely)[^.]{0,40}(?:than|compared to|compared with|versus)';
const CONJ_CMP_PROB_EN = new RegExp(CONJ_EN_SRC_G + '[^.]{0,90}' + CMP_PROB_EN, 'i');
const CONJ_CMP_ANCHOR_EN = new RegExp(CONJ_EN_SRC_G + '[^.]{0,90}' + CMP_ANCHOR_EN, 'i');

/**
 * 分组条件比较形检测：合取标记前后 12 字（EN 40 字符）内有人群后缀时，
 * 该句是 P(结果|X∧Y) vs P(结果|Y) 的条件概率比较（可能为真），豁免。
 */
function isGroupConditionalZh(text, R) {
  const pairs = (R.CONJ_PAIR_ZH || CONJ_PAIR_ZH).concat(R.CONJ_BARE_ZH || CONJ_BARE_ZH);
  // 同句第二 CONJ 检测：触发分组词的 CONJ 之后 25 字内若还有另一合取
  // 描述，说明句中另有概率比较主体（「…一位青年：既支教又出诗集，于是
  // 听众相信这位青年既是老师又是作家的概率高于他只是老师的概率」），
  // 分组形只修饰其中一个，不得据此豁免全句（r178 长句教训）。
  const hasSecondConjAfter = (endIdx) => {
    const after = text.slice(endIdx, endIdx + 25);
    for (const re of pairs) {
      const g = new RegExp(re.source, 'g');
      if (g.test(after)) return true;
    }
    return false;
  };
  for (const re of pairs) {
    const g = new RegExp(re.source, 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + 12);
      const before = text.slice(Math.max(0, m.index - 12), m.index);
      if ((anyHit(R.GROUP_SUFFIX_ZH || GROUP_SUFFIX_ZH, after) || anyHit(R.GROUP_SUFFIX_ZH || GROUP_SUFFIX_ZH, before))
        && !hasSecondConjAfter(m.index + m[0].length)) return true;
      if (m.index === g.lastIndex) g.lastIndex++;
    }
  }
  return false;
}

function isGroupConditionalEn(text, R) {
  const pairs = R.CONJ_PAIR_EN || CONJ_PAIR_EN;
  const hasSecondConjAfter = (endIdx) => {
    const after = text.slice(endIdx, endIdx + 80);
    for (const re of pairs) {
      const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
      if (g.test(after)) return true;
    }
    return false;
  };
  for (const re of pairs) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + 40);
      const before = text.slice(Math.max(0, m.index - 40), m.index);
      if ((anyHit(R.GROUP_SUFFIX_EN || GROUP_SUFFIX_EN, after) || anyHit(R.GROUP_SUFFIX_EN || GROUP_SUFFIX_EN, before))
        && !hasSecondConjAfter(m.index + m[0].length)) return true;
      if (m.index === g.lastIndex) g.lastIndex++;
    }
  }
  return false;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkConjunctionFallacy(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 全局豁免一：概念/教学转述（先判——它不含攻击腿词）
  if (anyHit(R.EXEMPT_CONCEPT_ZH || EXEMPT_CONCEPT_ZH, text) || anyHit(R.EXEMPT_CONCEPT_EN || EXEMPT_CONCEPT_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  // 全局豁免二：推理否定/方向纠正
  if (anyHit(R.EXEMPT_NEG_ZH || EXEMPT_NEG_ZH, text) || anyHit(R.EXEMPT_NEG_EN || EXEMPT_NEG_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };
  // 全局豁免四：疑问句
  if (/[?？]/.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 腿① CONJ 合取标记
  const conj = isZh ? conjZh(text, R) : conjEn(text, R);
  if (!conj) return { hit: false, score: 0, detail: '', count: 0 };

  // 结构豁免：分组条件比较形（P(结果|X∧Y) vs P(结果|Y) 可能为真）
  if (isZh) {
    if (isGroupConditionalZh(text, R)) return { hit: false, score: 0, detail: '', count: 0 };
  } else if (isGroupConditionalEn(text, R)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // ─── [r270] 新句式族：口语合取概率比较（无显式概率名词形）─────────
  // 腿② = 比较级概率短语（更可能/更容易/胜算更大/more likely）+ 对比锚
  // （比…单是 / than…merely）。必须放在下面 `if (!prob) return` 之前——
  // 本族正是没有 PROB 名词腿的形态；分组条件形已在上面统一豁免；
  // 对冲豁免同主判据（三腿俱后才适用）。
  if (isZh) {
    if (CONJ_CMP_PROB_ZH.test(text) && CONJ_CMP_ANCHOR_ZH.test(text)
      && !EXEMPT_HEDGE_D_ZH.test(text)) {
      return { hit: true, score: 0.56, count: 1, detail: '合取谬误×口语合取概率比较(zh)' };
    }
  } else if (CONJ_CMP_PROB_EN.test(text) && CONJ_CMP_ANCHOR_EN.test(text)
    && !EXEMPT_HEDGE_D_EN.test(text)) {
    return { hit: true, score: 0.56, count: 1, detail: 'conjunction fallacy×colloquial P(A∧B)>P(A)(en)' };
  }

  // 腿② PROB 概率词
  const prob = isZh ? anyHit(R.PROB_ZH || PROB_ZH, text) : anyHit(R.PROB_EN || PROB_EN, text);
  if (!prob) return { hit: false, score: 0, detail: '', count: 0 };

  // 腿③ CMP 概率比较结构
  const cmp = isZh ? cmpZh(text, R) : cmpEn(text, R);
  if (!cmp) return { hit: false, score: 0, detail: '', count: 0 };

  // 对冲豁免（三腿俱在后才适用；负向断言已防「可能性」自吞）
  if (anyHit(R.EXEMPT_HEDGE_ZH || EXEMPT_HEDGE_ZH, text) || anyHit(R.EXEMPT_HEDGE_EN || EXEMPT_HEDGE_EN, text)) return { hit: false, score: 0, detail: '', count: 0 };

  return {
    hit: true, score: 0.58, count: 1,
    detail: isZh
      ? '合取谬误×合取事件概率高于组分事件概率(zh)'
      : 'conjunction fallacy×P(A∧B)>P(A)(en)',
  };
}

module.exports = {
  checkConjunctionFallacy,
  __internals: () => ({
    CONJ_PAIR_ZH, CONJ_BARE_ZH, CONJ_AND_ZH, CONJ_PAIR_EN,
    PROB_ZH, PROB_EN,
    CMP_OP_ZH, CMP_BACK_ZH, CMP_OP_EN, CMP_BACK_EN,
    GROUP_SUFFIX_ZH, GROUP_SUFFIX_EN,
    EXEMPT_CONCEPT_ZH, EXEMPT_CONCEPT_EN, EXEMPT_NEG_ZH, EXEMPT_NEG_EN,
    EXEMPT_HEDGE_ZH, EXEMPT_HEDGE_EN,
    CMP_PROB_ZH, CMP_ANCHOR_ZH, CONJ_ZH_SRC, CONJ_EN_SRC, CONJ_ZH_SRC_G, CONJ_EN_SRC_G,
    EXEMPT_HEDGE_D_ZH, EXEMPT_HEDGE_D_EN,
    CONJ_CMP_PROB_ZH, CONJ_CMP_ANCHOR_ZH, CONJ_CMP_PROB_EN, CONJ_CMP_ANCHOR_EN,
  }),
};
