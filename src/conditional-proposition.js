/**
 * src/conditional-proposition.js
 * [r729] 第 160 维度 conditional_proposition（条件句武器化：假设条件句当既成论据）。
 *
 * 谬误形状：用一个未经验证的假设性条件句（「如果A就B」）直接推出关于现实的
 * 确定性结论——把「若A真则B」的存在性推断当作A真假的证据，替代事实核查。
 * 经典形：如果他真的爱你，就不会让你受这种委屈（用假设句裁定对方不爱）。
 *
 * 判据（双腿共现，缺腿不判）：
 *   腿① HYPOTHETICAL 假设条件句——条件连词（如果/要是/若/假如/倘若/如果当时/
 *      换了是我/if/were/had been）+ 待验证命题。规则明文的既有约定不构成假设
 *      （见 RULE_CONDITION 豁免）。
 *   腿② NEG_INFERENCE 否定推断——条件之后紧跟对前件真值的否定性/必然性断言：
 *      · 反事实完成标记：早就…了（早就看到/早就涨薪/早就完成/早就辞职）
 *      · 否定结果断言：就不会/也不会/不可能/定然不会
 *      · 反问否定：怎么会/怎么可能/为什么没/为什么不敢/为什么怕/为什么不
 *      · EN：would (never|not|have …ed|still|be …ing) / wouldn't / there would be
 *    良性直接结果陈述（「如果明天下雨，运动会就取消」「if it rains, the match
 *    will be postponed」）不含腿②标记，不判——区分假设条件与规则/预报条件
 *    的关键就在腿②：攻击腿断言的是「前件为假」，不是「结果会发生」。
 *
 * 与存量维度边界：
 *   · no_true_scotsman（r728 第159维）管「真正的X不会Y」定义驱逐；本维度管
 *     「如果A真就B；B没发生⇒A假」的条件推断武器化。含 authenticity 短语的
 *     样本（「如果他真的爱你」）可能双腿族同时命中，gate 取并集不漏判即达标。
 *   · conditional_affection 管情感要挟条件（你要…我才…）的胁迫结构；本维度
 *     管反事实推断的证据替代，不管胁迫。
 *   · affirming_the_consequent 管「如果P则Q；Q所以P」形式推理；本维度的
 *     攻击样本多为省略形式的单句逼问，无需显式后件。
 *
 * 豁免常量（全部可被负例注入置空）：
 *   RULE_CONDITION 规则/合同条件（合同/制度/规则/约定/按既定 + 条件连词共现）
 *   META_NOUN 谬误概念转述（条件命题/条件句/反事实推理/conditional/counterfactual/谬误）
 *   HEDGE 对冲（可能/也许/未必/不一定/might/maybe）
 *   EVIDENCE_MODE 显式证据模式（实测/数据/证据/experiment/data）
 *   NEGATION_FLIP 否定翻转（不能说明/不代表/不等于/并不意味着/does not mean）
 *
 * r729 实测（scripts/round-729-family-probe.js，当前引擎 159 维）：
 * 攻击漏判 16/20（80%）、良性 0/10 误伤、漏判中真零命中 16/16；
 * decision 本体一次选中（scripts/decide-r729.js，composite 0.84 /
 * confidence 0.76 / identity_alignment 0.8，第二名 loaded_question 0.81）。
 */
'use strict';

// ─── 判定常量（可变对象——负例注入的承重目标） ────────────────

const RE = {
  // 腿① HYPOTHETICAL：假设条件句
  // CN：条件连词（假设/反事实取向）
  //   「如果他真的爱你」「要是她问心无愧」「如果早听我的」「如果换作别的领导」
  HYPO_CN_RE: /(如果|要是|若|假如|倘若|若是|当真|换了是我|如果当时|早知)/,

  // EN：if 引导的条件（含 if this/the 形——r729 冒烟补入，旧版只认
  //   if+代词漏了「If this strategy worked」「If the company valued…」）；
  //   were 虚拟语气为反事实假设的强信号（Were he alive, ...）
  HYPO_EN_RE: /\bif\b|\bwere\s+(i|you|he|she|they|alive|here|there)\b/i,

  // 腿② NEG_INFERENCE：对前件真值的否定推断
  // CN-1：反事实完成标记（早就…了）——最典型的武器化形
  NEG_CN_ZAOJIU_RE: /(早就|早该|如今早就|现在早就)/,

  // CN-2：否定结果断言（就不会/也不可能/定然不会）
  NEG_CN_RESULT_RE: /(就不会|也不会|都不可能|不可能|定然不会|绝不会|断不会)/,

  // CN-3：反问否定（怎么会/为什么没/会不/能不——问句形态的否定断言）
  NEG_CN_RHETORICAL_RE: /(怎么会|怎会|怎么可能|为什么没|为什么不敢|为什么怕|为什么不|为何不|何不|会不|岂会|何曾)/,

  // EN-1：would 族否定/完成推断（would never / would not / wouldn't / would have …ed / 'd have）
  NEG_EN_WOULD_RE: /\bwould(n'?t|\s+not|\s+never|\s+still|\s+have|\s+be)\b|\b(i|you|he|she|they|we)'d\s+(have|never|not|be)\b/i,

  // EN-2：there would be（存在性否定推断）
  NEG_EN_THERE_RE: /\bthere\s+would\s+be\b/i,

  // 豁免常量（可被负例注入置空）
  // 规则/合同条件句（既有约定的是非假设，而是制度触发条件）
  RULE_CONDITION_RE: /(合同|规则|制度|章程|约定|协议|条款|regulat|polic(y|ies)|contract|clause|terms)[^。！？；\n]{0,8}(如果|若|if)/i,

  // 谬误概念转述/元话语（讨论该谬误本身）
  META_NOUN_RE: /(条件命题|条件句|反事实|反事实推理|充分条件|必要条件|谬误|谬论|逻辑谬误|conditional\s+(proposition|claim|statement)|counterfactual|fallac)/i,

  // 对冲表述（承认推断不确定；「不可能」是否定断言不是对冲，用负向后瞻排除）
  HEDGE_RE: /(也许|未必|不一定|大概|或许|恐怕|(?<!不)可能|perhaps|maybe|possibly|probably|not necessarily|might)/i,

  // 显式证据模式（以证据而非假设条件立论）
  EVIDENCE_MODE_RE: /(实测|数据|证据|实验|调研|统计|experiment|data|evidence|survey)/i,

  // 否定翻转（明确拒绝该推断）
  NEGATION_FLIP_RE: /(不能说明|不代表|不等于|并不能|并不意味着|不意味着|推不出|does not mean|doesn'?t mean|doesn'?t imply|cannot conclude)/i,
};

// ─── 句子切分 ────────────────────────────────────────────────

function splitSentences(text) {
  if (typeof text !== 'string' || !text) return [];
  return text
    .split(/[。！？；\n]+|(?<=[a-z])\.\s+/i)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// ─── 主检测 ──────────────────────────────────────────────────

function checkConditionalProposition(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { hit: false, score: 0, count: 0, matches: [], details: '' };
  }
  // 豁免：任一豁免形命中即整篇不判（元话语/规则条件/对冲不是运用该谬误）
  if (RE.META_NOUN_RE.test(text)) {
    return { hit: false, score: 0, count: 0, matches: [], details: '' };
  }
  const exemption = RE.RULE_CONDITION_RE.test(text) || RE.HEDGE_RE.test(text)
    || RE.EVIDENCE_MODE_RE.test(text) || RE.NEGATION_FLIP_RE.test(text);
  if (exemption) {
    return { hit: false, score: 0, count: 0, matches: [], details: '' };
  }

  const sentences = splitSentences(text);
  const matches = [];

  for (const sent of sentences) {
    const hypo = RE.HYPO_CN_RE.test(sent) || RE.HYPO_EN_RE.test(sent);
    if (!hypo) continue;

    const zaojiu = RE.NEG_CN_ZAOJIU_RE.test(sent);
    const result = RE.NEG_CN_RESULT_RE.test(sent);
    const rhetorical = RE.NEG_CN_RHETORICAL_RE.test(sent);
    const wouldEn = RE.NEG_EN_WOULD_RE.test(sent);
    const thereEn = RE.NEG_EN_THERE_RE.test(sent);

    if (zaojiu || result || rhetorical || wouldEn || thereEn) {
      matches.push({
        sentence: sent.slice(0, 80),
        zaojiu,
        result,
        rhetorical,
        wouldEn,
        thereEn,
      });
    }
  }

  if (matches.length === 0) {
    return { hit: false, score: 0, count: 0, matches: [], details: '' };
  }

  // 评分：单处共现 70；含反事实完成（早就/would have）或多腿②标记 95
  const strong = matches.some(m => m.zaojiu || m.wouldEn || m.thereEn
    || [m.result, m.rhetorical].filter(Boolean).length >= 1 && matches.length >= 2);
  const score = strong ? 95 : 70;
  const count = matches.length;
  const details = '条件句武器化（假设条件当既成论据）(' + count + '处: '
    + matches.map(m => m.sentence.slice(0, 40)).join('；') + ')';

  return { hit: true, score, count, matches, details };
}

module.exports = {
  checkConditionalProposition,
  __internals: RE,
};
