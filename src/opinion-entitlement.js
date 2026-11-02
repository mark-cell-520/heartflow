/**
 * src/opinion-entitlement.js — 「观点权利豁免」检测器（第 196 个判别维度）
 *
 * [r199 立项] decision 本体 accelerate（scripts 走 MCP philosophy_decision，
 * confidence 0.7 / priority 40，cognitiveLoad/uncertainty 记 "unknown" 不当
 * 实质背书）。候选来自 r199 家族探针（scripts/round-199-family-probe.js）在
 * 当前引擎（v6.8.127，195 维）上复测：观点权利豁免族攻击 6/6 全 pass
 * （真零命中）、良性 3/3 全 pass（零误伤）。Phase 1.5 同律复核：6 条攻击
 * 样本逐条跑 gate()，实测全维度 gate.action=pass 6/6。缺口成立。
 *
 * 辨别的族：观点权利豁免 / 主观主义谬误（"I'm entitled to my opinion" /
 * subjectivist fallacy）——**用「持有观点的权利」或「这只是主观看法」来
 * 免除观点的举证责任、拒绝用证据裁决、拒绝被说服而改变**：
 *   我有权保留我的观点，你拿我没办法。
 *   这只是我个人的看法，你可以不认同，但我不会改。
 *   言论自由，我想怎么相信就怎么相信。
 *   这是我的信仰，容不得你来质疑。
 *   你的证据再充分也无所谓，这是我固有的信念。
 *   I'm entitled to my own opinion, so your evidence doesn't matter.
 *   That's just my personal belief, and I refuse to let your data change my mind.
 *
 * 为什么这本身就是问题：观点可以自由持有，但**持有观点的权利 ≠ 观点免于
 * 举证、免于被证据裁决**。把一个事实/政策主张降格为「只是我的主观看法」
 * 再宣布「所以我不用回应证据」，是用主观性给未经检验的断言发免检通行证，
 * 让公共讨论失去以证据收敛的可能——这正是心虫「寻真而非似是而非、证据
 * 纪律」要拦的东西。
 *
 * 与既有维度的边界（r199 归因，探针 + discriminate 实测）：
 *   · scrutiny_evasion 管**把核验要求定性为人际猜疑**（「审计你是别有用
 *     心」），本族管**以主观性/观点权利免除举证**（「这只是我的看法，你
 *     拿我没辙」），不依赖把监督说成猜疑；
 *   · complexity_shield 管**用技术复杂性拒绝解释**（「太复杂你不懂」），
 *     本族不涉及专业门槛；
 *   · thought_terminating_cliche / sole_narrative / exclusive_trust 管
 *     **终止思考的口径垄断**，本族承重的是「观点权利=免举证」这一句式的
 *     双腿共现；
 *   · appeal_to_ignorance 管**举证责任倒置**（「无法证伪所以为真」），
 *     本族不停留在举证倒置、而是明确以「主观/权利」作免检盾牌；
 *   · 其余 195 个维度对本族 6 条攻击样本实测 gate.action=pass 6/6。
 *
 * 判据（两腿共现，缺一不判）：
 *   · 腿① ENTITLEMENT 观点/信念/立场的主观性或权利宣告（我有权…/这只是
 *     我(个人)(主观)的看法/这是我的(信念|信仰)/我坚持我的立场/言论自由/
 *     我的观点；EN: I'm entitled to my opinion / that's just my (personal)
 *     belief / I have a right to / freedom of speech / my own opinion）；
 *   · 腿② IMMUNITY 拒绝举证/拒绝证据裁决/拒绝被说服改变/拒绝审视
 *     （你拿我没办法/我不会改/你的证据不算数/容不得质疑/你说服不了我；
 *     EN: you can't convince me / I won't change / your evidence doesn't
 *     matter / closed to debate / no right or wrong）。
 *   · 单有腿①（「这是我目前的理解」）是普通立场陈述，归 factual；单有腿②
 *     （「没有证据我就不采纳」）是正当证据纪律，不判。
 *
 * 为什么取 VERIFY 级：单句可能是转述他人「我有权保留观点」的言论供分析
 * （「他动辄说『这是我的信仰』拒绝回应数据，这是典型的主观主义」）、文学
 * 对白、或正当价值/偏好分歧中的各自保留。verify 的含义是「这段话在用主观
 * 性或观点权利免除举证，需要回到证据与逻辑本身裁决，而不是接受免检」。
 *
 * 明确不判的（豁免——这些是正当陈述）：
 *   · 主观偏好/价值域在场（口味/审美/喜好/偏好/颜色/风格/品位/价值观/
 *     价值取向；EN taste/aesthetic/preference/favorite/values）：公认主观
 *     域里「无对错、各自保留」是正确认知，不是逃避举证；
 *   · 尊重他人权利（尊重你/他人保留观点的权利；EN respect your right to
 *     your opinion）：尊重他人表达权与自我豁免举证是两回事；
 *   · 修正/证据开放在场（愿意修正/如果数据证明…我愿意改/乐于接受批评；
 *     EN open to revision / willing to be wrong）：接受证据裁决是正确判别；
 *   · 元话语/概念引述（主观主义/相对主义/诉诸观点/观点权利/谬误/fallacy
 *     在场）：分析这个概念本身不是运用它；
 *   · 对冲与疑问句（可能/也许/未必/不一定/或许；EN maybe/perhaps/might；
 *     含 ?/？）：概率化或探询不作谬误判定。
 */
'use strict';

// ─── 腿①：观点/信念/立场的主观性或权利宣告 ───────────────────────────
const ENTITLEMENT_ZH = new RegExp(
  // 权利宣告
  '(?:我有(?:权|权利|自由)(?:去|来|要|想)?|我有权利|(?:言论|信仰|思想|表达|言论)自由' +
  '|(?:这|那)(?:是|归|由)我的(?:权利|自由)|(?:属于|归)我的(?:权利|自由)' +
  // 主观宣告（容忍插入形容词：我个人的主观看法 / 这是我固有的信念）
  '|这(?:只|不过|仅仅|纯粹|无非)?(?:是|算是|就是)我[^，。！？,]{0,8}?(?:个人|自己|本人|主观|固有|一贯|一贯坚持)?[^，。！？,]{0,6}?(?:看法|观点|想法|意见|见解|立场|信念|信仰|理解|认知|判断)' +
  '|这是我[^，。！？,]{0,6}?(?:的)?(?:信念|信仰|立场|观点|看法|想法)' +
  '|纯属(?:我)?(?:个人)?(?:之见|看法|观点|想法|见解)|一己之见' +
  '|我个人的(?:看法|观点|想法|信念|见解|立场)' +
  // 坚守/持有宣告
  '|我(?:坚持|坚守|固守|守住|秉持)[^，。！？,]{0,6}?(?:自己的|我的|个人的)?(?:观点|看法|立场|信念|信仰)' +
  '|我(?:有|持有|抱持)(?:自己的|我的|个人的)?(?:观点|看法|立场|信念|信仰)' +
  '|我(?:想|要)怎么(?:相信|认为|想|看)(?:是|由)我的(?:自由|权利|事)' +
  // 人人有别 + 裸名词形态
  '|每个人(?:都)?(?:有)?(?:自己的)?(?:观点|看法|立场|信念|想法)|各人有各人的(?:观点|看法|想法)' +
  '|我的(?:观点|看法|想法|意见|立场|信念|信仰|见解))'
);

const ENTITLEMENT_EN = /\b(?:i'?m\s+entitled\s+to\s+my\s+(?:own\s+)?(?:opinion|view|belief|perspective|stance)|(?:that'?s|it'?s|this\s+is|its)\s+(?:just\s+|only\s+|merely\s+|simply\s+)?(?:my\s+|my\s+own\s+|my\s+personal\s+)?(?:opinion|view|belief|perspective|stance)|(?:that'?s|it'?s)\s+(?:just\s+)?my\s+(?:belief|faith)|i\s+have\s+a\s+right\s+to\s+(?:my\s+)?(?:opinion|belief|view|say)|freedom\s+of\s+(?:speech|thought|belief|conscience|expression)|my\s+(?:own\s+|personal\s+)?(?:opinion|view|belief|faith|perspective|position|stance)|everyone\s+(?:is\s+entitled\s+to|has)\s+(?:their|his|her)\s+(?:own\s+)?(?:opinion|view|belief))\b/i;

// ─── 腿②：拒绝举证 / 拒绝证据裁决 / 拒绝被说服改变 / 拒绝审视 ──────────
const IMMUNITY_ZH = new RegExp(
  // 拒绝改变 / 拒绝被说服
  '(?:我[^，。！？,]{0,4}?(?:不会|决不|绝不|绝不会|打死也不|死活不会)[^，。！？,]{0,4}?(?:改|改变|动摇|妥协|让步|认错|收回)' +
  '|绝不(?:会)?(?:改变|动摇|妥协|让步|收回)' +
  '|(?:谁也|谁都|谁|你)(?:都)?(?:说服|劝服|改变)不了我|你说服不了我|你劝不动我' +
  '|我(?:想|要)怎么(?:相信|认为|想|看)(?:就)?(?:怎么|如何)' +
  '|你(?:们)?(?:说|讲|劝)什么都(?:没用|白费|徒劳|无益)|你(?:们)?(?:拿|能)我(?:没辙|没办法|无可奈何)' +
  // 拒绝证据 / 证据无效
  '|你的?[^，。！？,]{0,4}?(?:证据|数据|道理|说法|反驳|论点|逻辑|事实)[^，。！？,]{0,6}?(?:不算数|没用|无用|无所谓|不重要|说明不了什么|打动不了我|算不了数)' +
  '|(?:证据|数据|事实)[^，。！？,]{0,6}?(?:对我)?(?:来说)?(?:不重要|无所谓|不算数)' +
  '|不受[^，。！？,]{0,4}?(?:你的)?(?:证据|数据)(?:影响|左右|支配)' +
  // 拒绝审视
  '|容不得[^，。！？,]{0,4}?(?:你)?(?:质疑|反驳|挑战|置喙|批评)|不容[^，。！？,]{0,4}?(?:质疑|置喙|反驳|挑战|批评)' +
  '|(?:拒不|不)(?:接受|理会|在乎|听取)[^，。！？,]{0,4}?(?:你的)?(?:质疑|反驳|批评|证据|意见)' +
  // 无对错（与腿①共现才是免检盾）
  '|没有(?:对错|是非)(?:之)?分?|谈不上(?:对错|是非)|无分对错|不存在(?:对错|是非))'
);

const IMMUNITY_EN = /\b(?:you\s+(?:can'?t|cannot|won'?t|will\s+not|never)\s+(?:convince|persuade|change|sway|force)\s+me|i\s+(?:won'?t|will\s+not|refuse\s+to|am\s+not\s+going\s+to)\s+(?:change|budge|back\s+down|reconsider|relent)|i\s+refuse\s+to\s+let\s+(?:your\s+|any\s+)?(?:data|evidence|facts)\s+change\s+me|let\s+(?:your\s+|any\s+)?(?:data|evidence|facts)\s+change\s+my\s+mind|your\s+(?:evidence|data|facts|arguments?|logic|reasoning)\s+[a-z\s]{0,15}(?:doesn'?t|does\s+not|won'?t|will\s+not|can'?t)\s+(?:matter|count|sway|persuade)|(?:evidence|data|facts)\s+(?:doesn'?t|do\s+not|don'?t)\s+matter|closed\s+to\s+(?:debate|question|persuasion|reason)|not\s+open\s+to\s+(?:debate|question|persuasion)|(?:nobody|no\s+one|you)\s+can\s+tell\s+me\s+(?:what|how)\s+to\s+(?:think|believe)|no\s+(?:right|wrong)|neither\s+right\s+nor\s+wrong|not\s+a\s+matter\s+of\s+(?:right|wrong))\b/i;

// ─── 豁免一：主观偏好 / 价值域在场（整篇不判）────────────────────────
const PREFERENCE_DOMAIN = /(?:口味|味蕾|审美|美丑|喜好|偏好|情趣|品位|品味|颜色|色调|穿搭|穿着|衣着|菜系|甜咸|荤素|音乐品味|艺术风格|娱乐|消遣|价值观|价值取向|价值判断|价值选择|\btaste\b|\baesthetic\b|\bpreference\b|\bfavor(?:ite|ite)\b|\bvalues\b|\bfashion\b)/i;

// ─── 豁免二：尊重他人权利（整篇不判）─────────────────────────────────
const RESPECT_OTHER = /(?:尊重[^，。！？,]{0,8}?(?:你|你们|他人|别人|每个人|大家)[^，。！？,]{0,6}?(?:保留|持有|表达|坚持)[^，。！？,]{0,4}?(?:观点|看法|意见|想法|立场)|respect\s+(?:your|their|his|her|everyone'?s)\s+(?:right\s+to|opinion|view))/i;

// ─── 豁免三：修正 / 证据开放在场（整篇不判）──────────────────────────
const REVISION_OPEN = /(?:愿意(?:修正|修改|改变|更新|认错|收回|接受)|乐意(?:接受|听取)[^，。！？,]{0,4}?(?:批评|意见|反驳)|如果[^，。！？,]{0,10}?(?:证|数据|证据|事实证明)[^，。！？,]{0,8}?(?:错|不成立|推翻)|以(?:数据|证据|事实)为准|open\s+to\s+(?:revision|being\s+(?:wrong|corrected)|criticism)|willing\s+to\s+(?:change|reconsider|be\s+wrong))/i;

// ─── 豁免四：元话语 / 概念引述（整篇不判）────────────────────────────
const META_NOUN = /(?:主观主义|相对主义|诉诸观点|观点权利|观点豁免|免检通行证|这(?:是|属于|正是)(?:一种)?(?:谬误|谬论|逻辑错误|话术|套路|手法|PUA|现象)|逻辑谬误|fallac(?:y|ies)|rhetorical\s+(?:trick|tactic|device))/i;

// ─── 豁免五：对冲与疑问 ──────────────────────────────────────────────
const HEDGE = /(?:可能|也许|或许|大概|似乎|好像|未必|不一定|不见得|说不定|perhaps|maybe|might|possibly|probably)/i;
const QUESTION = /[?？]/;

/**
 * @param {string} text 归一化后的文本
 * @param {object} [R] 负例注入用：以空白正则替换指定常量
 */
function checkZh(text, R) {
  const ent = R.ENTITLEMENT_ZH || ENTITLEMENT_ZH;
  const imm = R.IMMUNITY_ZH || IMMUNITY_ZH;
  if (ent.test(text) && imm.test(text)) return { route: 'zh:entitlement×immunity' };
  return null;
}

function checkEn(text, R) {
  const ent = R.ENTITLEMENT_EN || ENTITLEMENT_EN;
  const imm = R.IMMUNITY_EN || IMMUNITY_EN;
  if (ent.test(text) && imm.test(text)) return { route: 'en:entitlement×immunity' };
  return null;
}

/**
 * @param {string} text 归一化后的文本
 * @param {object} [inject] 负例脚本注入用：以空白正则替换指定常量
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkOpinionEntitlement(text, inject) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };
  const R = inject || {};
  const PREF = R.PREFERENCE_DOMAIN || PREFERENCE_DOMAIN;
  const RESP = R.RESPECT_OTHER || RESPECT_OTHER;
  const REV = R.REVISION_OPEN || REVISION_OPEN;
  const META = R.META_NOUN || META_NOUN;
  const HEDGE_ = R.HEDGE || HEDGE;
  const Q = R.QUESTION || QUESTION;

  // 主观偏好/价值域 → 其中「无对错、各自保留」是正确认知
  if (PREF.test(text)) return { hit: false, score: 0, detail: '', count: 0 };
  // 尊重他人权利 → 与自我豁免举证是两回事
  if (RESP.test(text)) return { hit: false, score: 0, detail: '', count: 0 };
  // 修正/证据开放 → 接受证据裁决是正确判别
  if (REV.test(text)) return { hit: false, score: 0, detail: '', count: 0 };
  // 元话语/概念引述 → 不是运用它
  if (META.test(text)) return { hit: false, score: 0, detail: '', count: 0 };
  // 对冲 / 疑问 → 概率化或探询不作谬误判定
  if (HEDGE_.test(text)) return { hit: false, score: 0, detail: '', count: 0 };
  if (Q.test(text)) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);
  const r = isZh ? checkZh(text, R) : checkEn(text, R);
  if (r) {
    return {
      hit: true,
      score: 0.5,
      count: 1,
      detail: isZh
        ? `观点权利豁免×主观免检(${r.route})`
        : `opinion entitlement×subjective immunity(${r.route})`,
    };
  }
  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkOpinionEntitlement,
  __internals: () => ({
    ENTITLEMENT_ZH, ENTITLEMENT_EN, IMMUNITY_ZH, IMMUNITY_EN,
    PREFERENCE_DOMAIN, RESPECT_OTHER, REVISION_OPEN, META_NOUN, HEDGE, QUESTION,
  }),
};
