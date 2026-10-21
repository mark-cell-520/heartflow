/**
 * src/wishful-thinking.js — 「一厢情愿」检测器（第 147 个判别维度）
 *
 * [r716 立项] decision 本体选出（scripts/decide-r716.js，composite_score
 * 0.84 / confidence 0.8 / identity alignment 0.8）。候选池来自 r716
 * 探测器（scripts/round-716-family-probe.js）在当前引擎（v6.8.61，
 * 146 维）上逐族复测：攻击漏判 8/9（89%）、真零命中 8/8、良性
 * 0/9 误伤。Phase 1.5 同律复核：8 条漏判样本逐条跑 discriminate()，
 * 实测全维度零命中 8/8——不是被聚合压掉，是射程外。缺口成立。
 *
 * 辨别的族：一厢情愿（wishful thinking）——**以愿望/信念/心态代替
 * 证据，直接推断结果会按自己期望的方向发展**，把「相信」当成
 * 「知道」的替代品：
 *   我相信会成功，所以一定会成功。
 *   只要我足够努力，宇宙就会回应我。
 *   念念不忘必有回响，想什么就来什么。
 *   我这么真诚，老天不会亏待我的。
 *   心诚则灵，只要信念够强就能实现。
 *   我这么想，事情就会按我想的发展。
 *   I believe it will work out, so it will work out.
 *   If I want it badly enough, the universe will provide.
 *   My positive thinking alone will make it happen.
 *
 * 与既有维度的边界（r716 归因）：
 *   · affective_forecast 管**对未来情绪的预测偏差**（我会很开
 *     心/不会难过），本族管以愿望代替证据的**因果推断**（相信
 *     → 结果必然实现）；
 *   · confidence 管**断言强度**（肯定/一定/毫无疑问），本族管
 *     「信念→结果」的因果结构，可毫无强度词；
 *   · pseudo_causal 管**虚假因果机制**（A 导致 B 的具体机制
 *     错误），本族管纯信念驱动的结果推断，无机制描述；
 *   · 其余 146 个维度对本族 8 条漏判样本实测零命中 8/8。
 *
 * 判据（两条路由，任一成立即判定）：
 *   · 路由一「信念/愿望×必然结果」双腿共现，缺一不判：
 *     腿① BELIEF 信念/愿望表达——我相信/我坚信/我确信/我愿
 *       望/我期待/我这么想/只要我（中）；I believe / I am
 *       convinced / I am sure / I wish / I hope / I want / my
 *       positive thinking（英）；
 *     腿② INEVITABLE 必然结果推断——所以一定会/就会/肯定会/
 *       必有回响/老天不会/宇宙就会/按我想的（中）；so it will
 *       / it will work out / the universe will / it is bound to
 *       / it is meant to be（英）。
 *   · 路由二「心态/信念×超自然因果」双腿共现：信念表达与超自
 *     然因果（宇宙就会回应/老天不会亏待/心诚则灵/念念不忘必有
 *     回响/想什么就来什么/吸引力法则；EN: the universe will
 *     provide / law of attraction / manifest / it is written in
 *     the stars）共现——把结果归因于超自然力量对信念的回应，
 *     正常励志陈述不引入超自然因果。
 *   · 缺腿不判：只有腿①（「我相信这个方向，但还是要看数据验
 *     证」）是正常信念表达；只有腿②（「这个事情一定会成功」）
 *     无信念来源，归 confidence。
 *
 * 为什么取 VERIFY 级：单句可能是正常的励志表达（「保持积极心
 * 态有助于应对挑战」）、人生态度陈述（「心诚则灵是一种人生
 * 态度」）、心理咨询中的认知模式分析。verify 的含义是「这段
 * 话在用信念替代证据推断结果，需要回到可验证的事实层面」——
 * 调用方应要求把「结果」落到可核对的证据上，而不是接受信念
 * 叙事。
 *
 * 明确不判的（豁免）：
 *   · 元话语/概念引述（一厢情愿/wishful thinking 字样在场）：
 *     分析这套思维模式本身不是运用它；
 *   · 证据在场（数据/验证/测试/实验/对照组/benchmark/A-B 测
 *     试/同行评审）：有出处的信念表达是引用不是替代；
 *   · 第三人称职务语境（心理咨询师/治疗师/咨询师/counselor/
 *     therapist）：专业角色复盘认知模式。
 */
'use strict';

// ─── 腿①：信念/愿望表达（中文）────────────────────────────────────
const BELIEF_ZH = /(?:我相信|我坚信|我确信|我确信无[疑疑]|我愿望|我期待|我这么想|只要我|我真心|我虔诚|我足够努力|我这么真诚|我念念|念念不忘|心诚|信念够强|只要信念|我信|笃信|确信)/;

// ─── 腿①：信念/愿望表达（英文）────────────────────────────────────
const BELIEF_EN = /\b(?:i\s+believe|i\s+am\s+convinced|i\s+am\s+sure|i\s+wish|i\s+hope|i\s+want|my\s+positive\s+thinking|i\s+truly|i\s+sincerely|if\s+i\s+want\s+it|i\s+have\s+faith|my\s+sincere\s+hope|if\s+i\s+just\s+believe|i\s+just\s+believe|my\s+belief|my\s+faith|my\s+hope)\b/i;

// ─── 腿②：必然结果推断（中文）────────────────────────────────────
const INEVITABLE_ZH = /(?:所以一定会|就会|肯定会|必有回响|老天不会|宇宙就会|按我想的|就会实现|一定会实现|注定会|必然会|肯定会成功|一定会成功|就会成功|就会回应|就会实现|就会成真|就会应验|就会灵验|就会显灵)/;

// ─── 腿②：必然结果推断（英文）────────────────────────────────────
const INEVITABLE_EN = /\b(?:so\s+it\s+will|it\s+will\s+work\s+out|the\s+universe\s+will|it\s+is\s+bound\s+to|it\s+is\s+meant\s+to\s+be|it\s+will\s+happen|it\s+will\s+come\s+true|it\s+is\s+destined|it\s+is\s+inevitable|it\s+is\s+certain\s+to|will\s+make\s+it\s+happen|will\s+make\s+it\s+come\s+true|it\s+is\s+inevitable)\b/i;

// ─── 路由二附：超自然因果（中文）──────────────────────────────────
const SUPERNATURAL_ZH = /(?:宇宙就会回应|老天不会亏待|心诚则灵|念念不忘必有回响|想什么就来什么|吸引力法则|天人感应|天道酬勤|善有善报|因果报应|命中注定|天意如此|老天有眼|苍天不负)/;

// ─── 路由二附：超自然因果（英文）──────────────────────────────────
const SUPERNATURAL_EN = /\b(?:the\s+universe\s+will\s+provide|law\s+of\s+attraction|manifest\s+(?:it|your|my)|it\s+is\s+written\s+in\s+the\s+stars|the\s+cosmos\s+will|divine\s+(?:will|plan|intervention)|karma\s+will|fate\s+will|destiny\s+will)\b/i;

// ─── 豁免一：元话语/概念引述（分析这套思维模式本身不是运用它）────
const META_NOUN = /(?:一厢情愿|wishful\s+thinking|心诚则灵是一种|不是因果机制|是一种人生态度|是一种心态|是一种生活态度)/i;

// ─── 豁免二：证据在场（有出处的信念表达是引用不是替代）────────────
const EVIDENCE_PRESENT = /(?:数据|验证|测试|实验|对照组|benchmark|A\/B\s*测试|同行评审|实测|统计|证据|依据|报告|文献|论文|data|evidence|test(?:ed|ing)?|experiment|control\s+group|benchmark|peer[\s-]review|statistic|proof|study|research)/i;

// ─── 豁免三：第三人称职务语境（专业角色复盘认知模式）──────────────
const THIRD_PERSON_EXEMPT = /(?:心理咨询师|心理咨询|心理医生|治疗师|咨询师|counselor|therapist|psychologist)/i;

/**
 * 中文路由：路由一（腿①×腿②）+ 路由二（腿①×超自然）。
 * @param {string} text
 * @param {object} R 负例注入用：以空白正则替换指定常量
 */
function checkZh(text, R) {
  const belief = R.BELIEF_ZH || BELIEF_ZH;
  const inevitable = R.INEVITABLE_ZH || INEVITABLE_ZH;
  const supernatural = R.SUPERNATURAL_ZH || SUPERNATURAL_ZH;
  if (!belief.test(text)) return null;
  if (inevitable.test(text)) return { route: 'zh:belief×inevitable' };
  if (supernatural.test(text)) return { route: 'zh:belief×supernatural' };
  return null;
}

/**
 * 英文路由：路由一（腿①×腿②）+ 路由二（腿①×超自然）。
 */
function checkEn(text, R) {
  const belief = R.BELIEF_EN || BELIEF_EN;
  const inevitable = R.INEVITABLE_EN || INEVITABLE_EN;
  const supernatural = R.SUPERNATURAL_EN || SUPERNATURAL_EN;
  if (!belief.test(text)) return null;
  if (inevitable.test(text)) return { route: 'en:belief×inevitable' };
  if (supernatural.test(text)) return { route: 'en:belief×supernatural' };
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkWishfulThinking(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const META_NOUN_ = R.META_NOUN || META_NOUN;
  const EVIDENCE_PRESENT_ = R.EVIDENCE_PRESENT || EVIDENCE_PRESENT;
  const THIRD_PERSON_EXEMPT_ = R.THIRD_PERSON_EXEMPT || THIRD_PERSON_EXEMPT;

  // 元话语/概念引述 → 不是运用它
  if (META_NOUN_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 证据在场 → 有出处的信念表达是引用不是替代
  if (EVIDENCE_PRESENT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }
  // 第三人称职务语境：专业角色复盘认知模式
  if (THIRD_PERSON_EXEMPT_.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const r = isZh ? checkZh(text, R) : checkEn(text, R);
  if (r) {
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: isZh
        ? `一厢情愿×信念替代证据(${r.route})`
        : `wishful thinking×belief-over-evidence(${r.route})`,
    };
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkWishfulThinking,
  __internals: () => ({
    BELIEF_ZH, BELIEF_EN, INEVITABLE_ZH, INEVITABLE_EN,
    SUPERNATURAL_ZH, SUPERNATURAL_EN,
    META_NOUN, EVIDENCE_PRESENT, THIRD_PERSON_EXEMPT,
  }),
};
