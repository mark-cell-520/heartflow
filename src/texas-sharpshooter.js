/**
 * src/texas-sharpshooter.js
 * [r216] 第 212 判别维度 texas_sharpshooter「德州神枪手 / 先射箭后画靶」
 * （Texas sharpshooter / reverse-engineered selection）——拿**按结果反推的
 * 筛选**制造规律：先看到结果（谁成功/谁存活/哪个涨/哪组数据合意），再把
 * 筛选条件圈到结果上，把选择性匹配的子集共同点宣称为普适规律、法则、公式、
 * 信号或预测依据。
 *
 * 判据（两腿共现 + 邻近窗，缺一不判）：
 *   腿① SEL 选择性筛选陈述——按已知结果筛选样本的动作/范围宣告
 *     （挑出来/只看…/先看答案再圈/画了个范围/活下来了就问/涨得最好的…/
 *      EN: picked / look at the winners / survey only / draw the target）；
 *   腿② LAW 规律化宣称——从所选子集得出普适规律/公式/信号/预测
 *     （共同点就是/成功法则/买入信号/中奖规律/规律成立/
 *      EN: the pattern / the formula / bullseye / they all share）。
 *
 * 边界（与既有维度不重叠）：
 *   · cherry_picking（第 180 维）管**主张先于筛选**——只从支持某结论的
 *     证据池取证；本族是**筛选制造规律本身**，结论形态是「规律/公式/信号」
 *     而非「某主张成立」，且筛选方向由已知结果决定。
 *   · clustering_illusion（第 171 维）管**数据内部随机聚集被当成显著
 *     模式**；本族管**筛选过程按结果反推**（先射箭后画靶）。
 *   · survivorship_bias（第 132 维）管**评估业绩/策略时只算存续样本**；
 *     本族涵盖一切「按结果筛子集再总结规律」形——彩票号码、评分标准、
 *     问卷调查等非业绩场景同样命中。
 *   · hasty_generalization 管**小样本泛化**；本族核心是**选择性**而非
 *     样本量——样本再大，只要是按结果挑出来的就不成立。
 *   · post_hoc / pseudo_causal 管**因果时序误配**；本族是选择-规律结构，
 *     不依赖时间先后。
 *
 * 豁免层（六层）：
 *   ① 疑问句（含 ?/？；反问标记出现时不豁免——r213/r214 先例）；
 *   ② 预登记/对照组（事先登记假设、对照组/同时看反面样本——正当方法论）；
 *   ③ 随机性/概率论声明（独立事件、不能预测、运气、偶然）；
 *   ④ 概念/教学转述（讨论本谬误本身，要求框架标记或否定标记共现——
 *      r215 收窄先例，裸词不豁免）；
 *   ⑤ 正确响应形（避免偏差、结论有偏、不足以、要求反面样本）；
 *   ⑥ 后置对冲/否定守卫（腿②命中前后出现转折/否定——正当分层报告）。
 *
 * 单腿不判：只有筛选没有规律化（「他专门挑对自己有利的数据说」）或只有
 * 规律化没有选择（「所有恒星都遵循万有引力定律」）都不触发。
 */
'use strict';

// ─── 腿① SEL 选择性筛选陈述（中文）──────────────────────────────
// 纪律：只收**按已知结果筛选**的动作——裸选择动词（选/挑）单独出现是正常
// 决策语言，必须带结果条件（成功的/涨得最/中奖的）或反向筛选族修饰。
const SELECTION_ZH = [
  // S1 挑出/筛出族（显式筛选动作）
  /挑出来|挑出|专挑|专门挑|精挑|选出|筛选出|筛出来|筛掉|择出来|圈出|圈定|排除掉|剔除|踢出/,
  // S2 限定族（只X——范围收缩到单一侧面）
  /只看|只研究|只分析|只调查|只统计|只算|只拿|只找|只留|只保留|只问|只采访|只挑|只选|仅看|仅研究|仅从|仅挑|仅选/,
  // S3 先看后圈族（按答案/结果反推标准——本族最核心形状）
  /先看(?:答案|结果|标准|靶子|数据|排名)[^。；，!?]{0,10}(?:再|后)/,
  /先看[^。；，!?]{0,6}(?:答案|结果)[^。；，!?]{0,6}(?:圈|画|定|改|编|造)/,
  /围着[^。；，!?]{0,6}画|画了个?范围|画个靶|画靶|先射箭|射完[^。；，!?]{0,6}画|绕着[^。；，!?]{0,4}圈/,
  // S4 结果条件名词（按结果定义的子集）
  /成功的?(?:案例|公司|人|经验|样本|项目|产品|团队)|活得?下来|幸存|赢家|涨得最|中奖的|表现得最|业绩最|存活|拔尖的|名列前茅/,
  // S5 范围宣告（从…里挑出来的暗示）
  /从[^。；，!?]{0,8}(?:中|里)挑|挑[^。；，!?]{0,4}(?:出来|起来)/,
];

// ─── 腿① SEL 选择性筛选陈述（英文）──────────────────────────────
const SELECTION_EN = [
  /\b(?:picked|selected|cherry-?picked|screened\s+out|filtered\s+out)\b[^.]{0,40}?\b(?:the\s+)?(?:successful|winners|surviving|best|top|profitable|favorable|positive)\b/i,
  /\b(?:only|just)\s+(?:look(?:ed)?\s+at|study|studied|surveyed|asked|counted|analy[sz]ed|included|kept|consider\w*)\b/i,
  // r216 补族：「动词+only」形（Select only / Pick only / Use only…）
  /\b(?:select|selecting|pick|picking|choose|choosing|chose|take|taking|keep|keeping|use|using|include|including|consider|considering|look(?:ing)?|study|studying|survey|surveying|count|counting|analy[sz]e|analy[sz]ing)\s+only\b/i,
  /\blook\s+at\s+the\s+(?:winners|successes|survivors|best|top)\b/i,
  /\b(?:survey|study|interview|ask)\s+only\b/i,
  /\b(?:drew|draw|drawing)\s+the\s+target\b/i,
  /\b(?:around|round)\s+the\s+(?:arrows|bullet\s+holes|hits)\b/i,
  /\bthe\s+(?:successful|surviving|winning)\s+(?:companies|cases|people|ones|startups|teams)\b/i,
  /\b(?:left|keep|keeping)\s+out\s+(?:the\s+)?(?:failures|losers|non-?survivors|rest)\b/i,
];

// ─── 腿② LAW 规律化宣称（中文）──────────────────────────────────
const LAWFICATION_ZH = [
  // L1 共同点族（所选子集的共同属性 = 规律）
  /共同点就是|共性就是|共同特征就是|共同之处就是|共同经营方式就是|共同点|共性|共同特征|共同之处/,
  // L2 法则/秘诀族（普适规律封装）
  /成功法则|成功规律|成功秘诀|赚钱秘诀|秘诀|法则|规律|定律|套路|公式|真理|门道|诀窍|黄金法则|万能公式/,
  // L3 信号族（预测信号）
  /买入信号|卖出信号|信号|预兆|征兆|预示|兆头|先兆/,
  // L4 中奖/开奖族（随机事件的"规律"）
  /中奖规律|中奖号码|下一期|下期|开奖|必出|该出了|出的概率/,
  // L5 成立族（规律被宣告成立/普适）
  /规律成立|都符合|全都符合|说明[^。；，!?]{0,8}必然|证明[^。；，!?]{0,8}是对的|放之四海|普遍适用|适用于所有|走到哪都|屡试不爽|一试就灵/,
];

// ─── 腿② LAW 规律化宣称（英文）──────────────────────────────────
const LAWFICATION_EN = [
  /\b(?:the|a|that|this)\s+(?:\w+\s+){0,2}(?:pattern|formula|recipe|rule|law|secret)\b/i,
  /\b(?:pattern|formula|recipe|rule|law|secret)\s+(?:is|was|holds|works|explains|predicts)\b/i,
  /\b(?:they|we)\s+all\s+(?:share|have\s+in\s+common|took|did)\b/i,
  /\bwhat\s+(?:they|we)\s+all\s+have\s+in\s+common\b/i,
  /\b(?:bullseye|winning\s+(?:pattern|formula|strategy)|predicts?|predictive)\b/i,
  /\bcommon\s+(?:thread|denominator|trait|factor)\b/i,
];

// ─── 豁免①（预登记/对照组）：正当方法论─────────────────────────
// 「先分析成功案例的共同点，再用对照组检验」正是本族要教的判别动作。
const EXEMPT_CONTROL_ZH = [
  /预登记|事先登记|预先登记|预先注册|注册假设|登记了?假设|假设先于|先有假设/,
  /对照组|控制组|对比组|参照组|空白组|基准组|控制变量|双盲|随机分组|随机对照/,
  // 反面样本**纳入**族——只收把失败/非幸存样本纳入考察的形；「把失败
  // 案例排除掉」正是本族攻击的筛选机制，不能豁免（r216 纪律）。
  /同时看|也看了|也研究|同时分析|同时统计|两面都看|正反面|反面证据|反面样本/,
  /(?:也|同时|还要|还得|需|须|应|应当|应该|同样|一并|均|都)(?:纳入|考虑|考察|观察|分析|研究|统计)(?:了)?(?:失败|非幸存|没活下来|亏损|下跌|被淘汰)/,
  /失败(?:案例|的|者|样本)[^。；，!?]{0,6}(?:也|同时|同样|一并|均|都)/,
  /与[^。；，!?]{0,8}(?:失败|非幸存|亏损|下跌|被淘汰)[^。；，!?]{0,4}(?:对比|比较|对照)/,
  /检验这个?假设|验证这个?假设|再检验|加以检验|可检验|可证伪|待验证/,
];
const EXEMPT_CONTROL_EN = [
  /\bpre-?registered\b/i,
  /\bcontrol\s+group\b/i,
  /\bcompared?\s+[^.]{0,30}\bwith\s+(?:non-?survivors|failures|losers|the\s+rest)\b/i,
  /\b(?:also|equally)\s+(?:looked\s+at|studied|surveyed|considered|examined)\b/i,
  /\blooked\s+at\s+both\b/i,
  /\bholdout\b|\bvalidation\s+set\b|\bfalsifiable\b|\btestable\b/i,
  /\b(?:failures?|losers?|non-?survivors?)\s+(?:as\s+well|too)\b/i,
];

// ─── 豁免②（随机性/概率论）：否定规律性──────────────────────────
// r216 纪律：只收**明确否定规律性**的形；裸「运气/偶然」不出现在随机性
// 声明里也常出现在攻击句的让步从句中（「成功有运气成分，但共同点是…」），
// 裸词豁免会放进攻击。
const EXEMPT_RANDOM_ZH = [
  /随机|独立事件|不能预测|无法预测|预测不了|预测不出|概率不变|没有规律|不可预测|每次独立|相互独立|各次独立/,
];
const EXEMPT_RANDOM_EN = [
  /\b(?:random|independent\s+events?|cannot\s+predict|can'?t\s+predict|no\s+predictive|coincidence|by\s+chance|fair\s+coin|no\s+pattern)\b/i,
];

// ─── 豁免③（概念/教学转述）：讨论这个概念本身────────────────────
// r215 纪律：要求句中同时出现教学/学术框架标记或否定标记——裸「德州
// 神枪手」出现在实际规律宣告中不豁免。
const EXEMPT_META_ZH = [
  /德州神枪手|先射箭后画靶|神枪手谬误|得州神枪手|选择性偏差|幸存者偏差|取样偏差|样本偏差|事后筛选|数据挖掘.{0,4}偏差|回测偏差|过拟合/,
  /谬误|fallacy|fallacies/,
];
const EXEMPT_META_EN = [
  /\b(?:texas\s+sharpshooter|sharpshooter\s+fallacy|draw(?:ing)?\s+the\s+target\s+around|cherry-?pick\w*|survivorship\s+bias|selection\s+bias|sampling\s+bias|data\s+dredg\w+|overfitt\w+|hindsight\s+selection)\b/i,
  /\b(?:fallacy|fallacies|bias)\b/i,
];
// 框架标记（meta 豁免的共现要件）
const META_FRAME_ZH = /教材|课堂|教科书|讲座|教案|习题|悖论|论文|文献|方法论|范式|称为|定义为|概念|所谓|理论|分析中|研究中|课程|考点|考题|说的是|指的是|书上|课上|这是|属于|叫作|又称/;
const META_FRAME_EN = /\b(?:textbook|lecture|syllabus|exam|quiz|paper|literature|methodology|called|defined|concept|notion|theory|in\s+this\s+(?:paper|study|analysis|chapter|lesson)|what\s+is\s+a|is\s+a\s+common|refers\s+to|known\s+as)\b/i;

// ─── 豁免④（正确响应形）：指出不能按结果筛选─────────────────────
const EXEMPT_CORRECT_ZH = [
  /避免[^。；，!?]{0,8}(?:偏差|误判|先射箭)|防止[^。；，!?]{0,8}(?:偏差|误判)|否则[^。；，!?]{0,6}偏|结论有偏|会有偏|会有偏差|以偏概全|选择性报告|刻意筛选|筛法有问题|挑选方式|取样方法|取样方式有问题/,
  /不能[^。；，!?]{0,6}(?:预测|说明|证明)|不足以[^。；，!?]{0,6}(?:说明|证明|预测)|无法[^。；，!?]{0,6}(?:预测|说明|证明)/,
  /要同时|须同时|应同时|还需要看|还得看|也需看|也要看|应当结合|应结合/,
  /犯了|这就是.{0,6}谬误|属于.{0,6}谬误|正是.{0,6}谬误|构成.{0,6}谬误|典型的.{0,6}谬误/,
];
const EXEMPT_CORRECT_EN = [
  /\b(?:avoid|prevent(?:s|ing)?)\s+(?:this\s+)?(?:bias|fallacy|error|mistake)\b/i,
  /\b(?:otherwise|or\s+else)\s+[^.]{0,20}\b(?:biased|skewed|misleading)\b/i,
  /\b(?:cannot|can'?t|could\s+not|should\s+not|must\s+not|unable\s+to)\s+(?:conclude|infer|predict|generalize|extrapolate)\b/i,
  /\b(?:does\s+not|doesn'?t|do\s+not|don'?t)\s+(?:imply|mean|entail|justify|warrant|predict)\b/i,
  /\b(?:commits?|is|constitutes?|exemplifies?|illustrates?)\s+(?:an?|the)\s+(?:texas\s+sharpshooter|sharpshooter|fallacy)\b/i,
  /\bneed(?:s)?\s+to\s+(?:also|equally)\b/i,
];

// ─── 否定/对冲守卫（窗口化）─────────────────────────────────────
const NEG_ZH = /不能|不应|不可|未必|不一定|并非|不代表|不意味着|很难|不要|用不着|无须|无需|不足以|不构成|称不上|算不上|并不|并不会|怀疑|质疑|警惕|小心|无从|禁止|切忌|找出不/;
const NEG_EN = /\b(?:not|never|doesn'?t|does\s+not|cannot|can'?t|hardly|isn'?t|aren'?t|won'?t|unlikely|beware|careful|doubt\w*|question\w*)\b/i;

// 后置对冲（腿②命中后紧跟转折/让步——正当分层报告，r215 先例）
const CONCESSION_ZH = /但是|然而|不过|可是|但|却|尽管|虽然|固然|只是|可惜|遗憾的是|需要说明|要补充|另一方面|但这|但这只|至多/;
const CONCESSION_EN = /\b(?:but|however|yet|although|though|whereas|while|on\s+the\s+other\s+hand|that\s+said|with\s+the\s+caveat|caveat|except|apart\s+from|at\s+most)\b/i;

// 邻近窗：腿① ↔ 腿②（双向；结论可前置于筛选陈述之前）
const WIN_SEL_LAW_ZH = 80;
const WIN_SEL_LAW_EN = 220;

function anyHit(list, text) {
  for (const re of list) { if (re.test(text)) return true; }
  return false;
}

function negatedBefore(text, idx, isZh) {
  if (idx < 0) return false;
  const n = isZh ? 8 : 14;
  const pre = text.slice(Math.max(0, idx - n), idx);
  return isZh ? NEG_ZH.test(pre) : NEG_EN.test(pre);
}

// 腿①：取所有命中位置（筛选陈述可能多处出现）
function findSelLeg(text, isZh, R) {
  const list = isZh ? (R.SELECTION_ZH || SELECTION_ZH) : (R.SELECTION_EN || SELECTION_EN);
  const idxs = [];
  for (const re of list) {
    const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = reG.exec(text)) !== null) {
      idxs.push(m.index);
      if (m.index === reG.lastIndex) reG.lastIndex++;
    }
  }
  return idxs.sort((a, b) => a - b);
}

// 腿②：取腿①邻近窗内、未被否定的首个规律化宣称位置（双向配对）
function findLawLeg(text, isZh, R, selIdxs) {
  const list = isZh ? (R.LAWFICATION_ZH || LAWFICATION_ZH) : (R.LAWFICATION_EN || LAWFICATION_EN);
  const win = isZh ? WIN_SEL_LAW_ZH : WIN_SEL_LAW_EN;
  let best = -1, bestDist = Infinity;
  for (const si of selIdxs) {
    for (const re of list) {
      const reG = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      let m;
      while ((m = reG.exec(text)) !== null) {
        const d = m.index - si;
        if (Math.abs(d) > win) { if (m.index === reG.lastIndex) reG.lastIndex++; continue; }
        // 后置形要求未被否定对冲；前置形（LAW 在 SEL 前）跳过该检查——
        // 前置否定词多属「不一定/并非」等对冲本身的一部分
        if (d > 0 && negatedBefore(text, m.index, isZh)) { if (m.index === reG.lastIndex) reG.lastIndex++; continue; }
        if (Math.abs(d) < bestDist) { bestDist = Math.abs(d); best = m.index; }
        if (m.index === reG.lastIndex) reG.lastIndex++;
      }
    }
  }
  return best;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空数组/永假正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkTexasSharpshooter(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};

  // 豁免①：疑问句（反问标记出现时不豁免——用问号把断言伪装成提问是
  // 操控话术最常用的包装，r213/r214 先例）
  if (/[?？]/.test(text)) {
    const RHETORICAL_ZH = /难道|岂|凭什么|何尝|岂不是|岂不|还能说|怎能|怎么可以|不是说|谈何|何谈|岂有此理|天晓得|谁不知道|谁不|谁都知道|你敢说|你敢保证|这不是|又是什么|是什么|能不|难道说|有何|有什么关系|什么关系|可言|何来|从何|岂非|焉能|哪来|哪有什么|哪来的/;
    const RHETORICAL_EN = /\b(?:isn'?t\s+it|doesn'?t\s+that|how\s+(?:else|could|can)|what\s+else|who\s+doesn'?t|who\s+wouldn'?t|if\s+not|rhetorical)\b/i;
    if (!RHETORICAL_ZH.test(text) && !RHETORICAL_EN.test(text)) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }

  // 豁免④前置：预登记/对照组 + 随机性声明 + 正确响应形（三层任一命中
  // 即整句不判——这些都是本族要教的判别动作本身）
  const ctlZh = R.EXEMPT_CONTROL_ZH || EXEMPT_CONTROL_ZH;
  const ctlEn = R.EXEMPT_CONTROL_EN || EXEMPT_CONTROL_EN;
  const rndZh = R.EXEMPT_RANDOM_ZH || EXEMPT_RANDOM_ZH;
  const rndEn = R.EXEMPT_RANDOM_EN || EXEMPT_RANDOM_EN;
  const corZh = R.EXEMPT_CORRECT_ZH || EXEMPT_CORRECT_ZH;
  const corEn = R.EXEMPT_CORRECT_EN || EXEMPT_CORRECT_EN;
  if (anyHit(ctlZh, text) || anyHit(ctlEn, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(rndZh, text) || anyHit(rndEn, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  if (anyHit(corZh, text) || anyHit(corEn, text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // 豁免③：概念/教学转述（r215 收窄先例：裸词不豁免，须框架或否定共现）
  const metaZh = R.EXEMPT_META_ZH || EXEMPT_META_ZH;
  const metaEn = R.EXEMPT_META_EN || EXEMPT_META_EN;
  if (anyHit(metaZh, text) || anyHit(metaEn, text)) {
    const hasFrame = META_FRAME_ZH.test(text) || META_FRAME_EN.test(text);
    const hasNeg = NEG_ZH.test(text) || NEG_EN.test(text);
    if (hasFrame || hasNeg) {
      return { hit: false, score: 0, detail: '', count: 0 };
    }
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 主判据：腿① 选择性筛选陈述 × 腿② 规律化宣称（邻近窗）
  const selIdxs = findSelLeg(text, isZh, R);
  if (selIdxs.length > 0) {
    const lawIdx = findLawLeg(text, isZh, R, selIdxs);
    if (lawIdx >= 0) {
      // 后置对冲守卫：腿② 命中后若紧跟转折/让步从句，且句中没有第二个
      // 未对冲的规律化结论，整句判为分层报告而非本族攻击（r215 先例）。
      const lawTail = text.slice(lawIdx, Math.min(text.length, lawIdx + 30));
      const lawLead = text.slice(Math.max(0, lawIdx - 20), lawIdx);
      const conAfter = isZh ? CONCESSION_ZH.test(lawTail) : CONCESSION_EN.test(lawTail);
      const conBefore = isZh ? CONCESSION_ZH.test(lawLead) : CONCESSION_EN.test(lawLead);
      if (!conAfter && !conBefore) {
        return {
          hit: true,
          score: 0.6,
          count: 1,
          detail: isZh
            ? '按结果反推的筛选被当成规律来源(先射箭后画靶)(zh)'
            : 'outcome-conditioned selection presented as a source of law (drawing the target around the arrows)(en)',
        };
      }
    }
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkTexasSharpshooter,
  __internals: () => ({
    SELECTION_ZH, SELECTION_EN,
    LAWFICATION_ZH, LAWFICATION_EN,
    EXEMPT_CONTROL_ZH, EXEMPT_CONTROL_EN,
    EXEMPT_RANDOM_ZH, EXEMPT_RANDOM_EN,
    EXEMPT_META_ZH, EXEMPT_META_EN,
    EXEMPT_CORRECT_ZH, EXEMPT_CORRECT_EN,
    META_FRAME_ZH, META_FRAME_EN,
    NEG_ZH, NEG_EN, CONCESSION_ZH, CONCESSION_EN,
    WIN_SEL_LAW_ZH, WIN_SEL_LAW_EN,
  }),
};
