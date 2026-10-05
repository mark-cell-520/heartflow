/**
 * src/appeal-to-ignorance.js — 诉诸无知 / 举证倒置检测器（第 62 个判别维度）
 *
 * v6.8.4 新增。心虫 decision 本体选出（scripts/round-485-decide.js，E 得 0.80 分，
 * identity_alignment 0.80）。探测器候选池（/tmp/hf-scout-r485.txt）+ 本轮复测
 * （scripts/round-485-att-probe.js，直调 src/gate.js）：
 * 14 条攻击样本 **13 条穿过硬闸门**（gate=pass），仅 1 条被
 * absolute_claim / hasty_generalization 兜住。
 *
 * 辨别的族：「诉诸无知 / 举证责任倒置」——不提供任何证据，
 * 仅凭「你证明不了它是假的」就把举证责任转嫁给对方，并据此推定成立。
 * 把「未被反驳」当作「已被证明」，是论证结构问题，不是证据多少的问题。
 *
 * 为什么现有维度拦不住：
 *   · unsupported_claim 管「无依据断言」——本族句子不依赖证据是否存在，
 *     它的结构是把「缺反证」直接兑换成「成立」，缺口在论证形式而非证据量。
 *   · fallacies 下虽有 appeal_to_ignorance 同名子标签，但正则极窄，
 *     覆盖不到「你不信的话那你就是不相信科学」之外的多数句式，
 *     且聚合维度的子标签不能在 findings 里独立归因。
 *   · absolute_claim 管绝对化措辞，不识别「举证责任转移」这一结构。
 *
 * 判据（两类交叉，两者同时在场才判定）：
 *   I1 举证责任在场 —— 指向对方须证明/拿证据/找不出反证/没人证明
 *   I2 推定成立 —— 那就是真的/说明我说对了/可以放心/就是事实/推广/照办
 *   → verify 级：要求主张方自己给出正面证据；「未被反驳」不等于「已成立」。
 *
 * 明确不判的（这些是正当陈述）：
 *   · 真的在陈述举证责任规则：「谁主张谁举证是基本原则」
 *   · 确实在报道「尚无证据」的研究状态：「目前没有证据表明两者相关」
 *   · 评析这套论证时豁免：「诉诸无知是一种逻辑谬误」
 */

'use strict';

// ─── I1: 举证责任在场（指向对方/无人举证） ──────────────────
// 中文：要求对方证明 / 指无人举出反证
const BURDEN_ZH = /(?:你|你们|对方|反对(?:者|的人)|怀疑(?:者|的人)|不信(?:者|的人))(?:拿出来|拿得出|提供|举出|给出|能找到|找到|证明|证实)(?:的|过|了)?(?:证据|反证|反例|理由|反驳)|你(?:能|不能够|不能|无法|没法)(?:证明|证实|反驳|举出)(?:它|这|那|其)?(?:是)?(?:假|错|不对|有问题|假|伪)|你(?:拿|拿不出|找不到)(?:不出|到)?(?:证据|反证|反例)(?:来)?(?:反驳|反对|推翻)|除非(?:你|你们)(?:能|拿出|举出|提供|找到)(?:证据|反证|反例)|(?:既然|既然)(?:你|你们)?(?:找不到|拿不出|没有|无法)(?:反驳|反对|反证|反例|证据|理由)|(?:没有|无|找不出|找不到|缺)(?:人|任何)?(?:能|可以|能够)?(?:拿出|提供|举出|给出)(?:的)?(?:证据|反证|反例|反驳|反对|理由)|(?:没人|无人|至今没有|迄今为止没有|从没有|未曾)(?:能|能够|可以|成功)?(?:证明|证实|举出|提供|拿出)(?:它|这|那|其)?(?:是)?(?:假|错|不对|有问题|失败)|(?:至今|到目前为止|迄今为止)(?:没有|无|未)(?:人|任何)?(?:能够|可以)?(?:证明|证实)(?:其|它|这|那)?(?:不|错误|为假)|(?:反证|反例|反驳|反对|质疑)(?:的)?(?:理由|证据)(?:不|并)(?:存在|成立)|你(?:证明|证实)不了|没有(?:任何)?(?:证据|凭据|依据)(?:来)?(?:表明|显示|说明|证明)(?:他|她|它|其|对方|此人)?(?:撒了|撒下|说了|讲了|说谎|隐瞒|欺骗|伪造|舞弊|贪|行贿|受贿|作了弊|作弊)(?:谎|假|假话)?|(?:至今|到(?:现在|目前)|迄今为止)(?:没有|未|无)(?:人)?(?:投诉|举报|反对|质疑|反映|抱怨)|(?:这么多年|多年)(?:来)?(?:没有|没|未)(?:出过|发生|出现)(?:事|问题|事故|差错|错误|麻烦)|(?:找|找不出|找不到|没有|无)(?:不出|到)?(?:任何)?(?:反对|反驳|质疑|异议|反证|反例)(?:的)?(?:理由|证据|依据|地方|空间)|(?:没人|无人|未|没有)(?:能|能够)?(?:拿出|举出|提供|找到)(?:反例|反证|异议|反对的理由)|(?:至今|迄今|到目前为止)(?:没有|未|无)(?:反证|反例|异议|反对|质疑)|没人(?:能|能够)?(?:证明|证实|说明|find)(?:这|那|这个|那个|其|该|此)?(?:方案|做法|产品|东西|事情|系统|流程|制度)?(?:有|存在|存有)(?:问题|毛病|弊端|缺陷|错误|漏洞|风险)|没有(?:任何)?(?:人)?(?:能|能够)(?:证明|证实|说明)(?:这|那|这个|那个|其|该|此)?(?:方案|做法|产品|东西|事情|系统|流程|制度)?(?:有|存有|存在)?(?:问题|毛病|弊端|缺陷|错误|漏洞|风险)|(?:他|她|它|其|对方|这人|这个人)(?:有|存在)(?:问题|毛病|错|过错)的?(?:说法|说法|指证|证据)(?:不|并)(?:存在|成立)|(?:又|也)?(?:拿|拿不出|提供不出|举不出)(?:不出)?(?:证据|凭据|实据)(?:来)?(?:说|说明|证明|指证)(?:他|她|它|其|对方)?(?:有|存在)?(?:问题|毛病|过错|错)|(?:找不到|没找到|寻找不到|寻觅不到)(?:任何)?(?:反驳|反对|质疑|异议|疑点)(?:的)?(?:理由|依据|道理|地方)|(?:至今|迄今|到目前为止|到目前|到眼下)(?:没有|未|无|没)(?:人|任何人|有人)?(?:投诉|举报|反映|抱怨|反对|质疑|提出异议)/;

// 英文：burden 压给对方 / 无人举出反证
const BURDEN_EN = /\b(?:you|they|the\s+critics?|anyone|those\s+who\s+disagree|opponents?)\s+(?:cannot|can'?t|could\s+not|couldn'?t|fail(?:ed)?\s+to|haven'?t\s+(?:been\s+able\s+to|shown|proven|provided|produced)|could\s+not)\s+(?:be\s+able\s+to\s+)?(?:prove|disprove|show|demonstrate|refute|disproved|provide|produce|give)\b|\byou\s+can(?:not|'?t)\s+(?:prove|disprove|show|refute)\b|\bunless\s+(?:you|they|someone|critics)\s+(?:can\s+)?(?:prove|show|disprove|provide|produce)\b|\b(?:no\s+one|nobody|no\s+evidence|nothing)\s+(?:has\s+|have\s+)?(?:been\s+able\s+to\s+|ever\s+)?(?:prove|shown|demonstrated|provided)\b|\bnobody\s+has\s+(?:ever\s+)?(?:shown|proven|demonstrated)\b|\bhas\s+(?:not\s+been|never\s+been)\s+(?:shown|proven|demonstrated|refuted|disproven)\b|\bno\s+(?:evidence|proof)\s+(?:has\s+been\s+|was\s+)?(?:presented|provided|given|found)\b|\bno\s+(?:one|nobody)\s+(?:has\s+)?(?:ever\s+)?(?:complained|reported|objected|protested|raised)\b|\b(?:never|not)\s+(?:been\s+)?(?:complained|reported|proven)\b/i;

// ─── I2: 推定成立 ────────────────────────────────────────
// 中文：以「无反证」直接兑换成成立/照办/推广
const CONCLUDE_ZH = /(?:那|那么就|那就是|即|便|就)(?:是)?(?:真的|对的|正确的|成立的|事实|真理|可信的|有效的)|(?:说明|证明|表明|意味着)(?:我|我们)?(?:说|讲)的?(?:是)?(?:对|没错|正确的|真理)|(?:说明|证明|表明|意味着)(?:我|我们)(?:说|讲)得(?:对|没错|正确)|(?:可以|尽可|大可|就能够|就能)(?:放心|安心|确信|相信|采纳|接受|照办|执行|推广|照做|下结论)|(?:按|照|依)(?:我|我们)?(?:说|讲)的?(?:办|做|执行|推广)|(?:就是|便是|那就是)(?:事实|真理|定论|结论)|(?:足以|就可以|便能)(?:证明|说明|证实)(?:其|它|这)?(?:正确性|合理性|成立|可行)|(?:他|她|它|其|这|那)(?:是|就是|算是)(?:清白的|无辜的|没说谎的|没问题的|可信任的|靠得住的|安全的|对的|没错的)|(?:说明|证明|表明)(?:我们|他们|我|你们)?(?:做对了|没做错|是对的|是正确的|没错)|(?:按|照|依|听)(?:我|我们)?(?:说|讲)的?(?:办|做|执行|推广)|(?:就可以|就该|那就|能)(?:推广|照办|执行|下结论|定论)|(?:我|我们)(?:说|讲)的?(?:是)?(?:对|没错|正确)(?:的|啦|嘛)?|(?:所以|因此|那就|就可以)?(?:放心|安心)(?:上|使用|采用|去买|去买它|去买这个)|(?:他|她|它|其|这|那)(?:说|讲)的?(?:是)?(?:真话|实话|真的|对的|没错)(?:的|啦|嘛)?/;

// 英文：以「未被反驳」推定成立
const CONCLUDE_EN = /\b(?:therefore|thus|so|hence|then)\s+(?:it|that|this|the\s+claim|the\s+theory)\s+(?:is|must\s+be|has\s+to\s+be)\s+(?:true|correct|right|valid|fact|the\s+truth)\b|\b(?:proves?|shows?|demonstrates?|confirms?)\s+(?:that\s+)?(?:I|we)\s+(?:am|are)\s+(?:right|correct)\b|\b(?:we|you)\s+(?:can|may|should|must)\s+(?:safely\s+)?(?:accept|trust|believe|adopt|proceed|act\s+on|take\s+it)\b|\bthat\s+(?:settles|proves)\s+it\b|\b(?:means|shows)\s+(?:it|the\s+claim)\s+is\s+valid\b|\bregard\s+it\s+as\s+(?:true|proven|valid)\b|\b(?:so\s+)?(?:it|that|this)\s+(?:must\s+be|is)\s+(?:fine|safe|sound|ok|okay|the\s+truth)\b|\btreat\s+it\s+as\s+(?:true|proven|valid|fact)\b|\b(?:therefore|thus|so)\s+(?:it|that)\s+is\s+(?:the\s+truth|fact|a\s+fact)\b/i;

// ─── 豁免：评析/引述这套论证本身；正当的举证责任陈述 ────────
const META_EXEMPT_ZH = /诉诸无知|举证(?:责任)?(?:倒置|转移)|举证责任(?:倒置|转移)|拿「无法反驳」当(?:理由|证据)/;
const QUALIFY_ZH = /谬误|谬说|逻辑错误|错误论证|站不住脚|不成立|并不成立|并不正确|是错的|有问题|值得(?:怀疑|商榷|反思|警惕)/;
// 正当陈述举证责任原则（谁主张谁举证），而非把责任转嫁给对方
const RULE_ZH = /谁主张(?:，)?谁举证|举证(?:责任)(?:在|归于)(?:主张|提出|声张)/;

const META_EXEMPT_EN = /\bappeal\s+to\s+ignorance\b|\bburden\s+of\s+proof\b|\bargumentum\s+ad\s+ignorantiam\b/i;
const QUALIFY_EN = /\bfallacy\b|\binvalid\b|\bdoesn'?t\s+(?:hold|follow|work)\b|\bnot\s+(?:a\s+)?(?:valid|sound)\s+(?:argument|reason)\b|\bquestionable\b|\bflawed\b/i;
// 正当原则：主张者承担举证责任
const RULE_EN = /\b(?:the\s+)?(?:burden\s+of\s+proof)\s+(?:lies|falls|rests)\s+(?:with|on)\s+(?:the\s+)?(?:one|person|claimant|proponent|party)/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string}}
 */
function checkAppealToIgnorance(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '' };

  // 在评析「诉诸无知」这套论证 → 不是运用它
  if ((META_EXEMPT_ZH.test(text) && QUALIFY_ZH.test(text)) ||
      (META_EXEMPT_EN.test(text) && QUALIFY_EN.test(text))) {
    return { hit: false, score: 0, detail: '' };
  }
  // 正当陈述举证责任原则（「谁主张谁举证」）→ 不是在转移举证责任
  if (RULE_ZH.test(text) || RULE_EN.test(text)) {
    return { hit: false, score: 0, detail: '' };
  }

  const burden = BURDEN_ZH.test(text) || BURDEN_EN.test(text);
  if (!burden) return { hit: false, score: 0, detail: '' };

  if (CONCLUDE_ZH.test(text)) {
    return { hit: true, score: 0.4, detail: '诉诸无知/举证倒置(zh)' };
  }
  if (CONCLUDE_EN.test(text)) {
    return { hit: true, score: 0.4, detail: '诉诸无知/举证倒置(en)' };
  }

  return { hit: false, score: 0, detail: '' };
}

module.exports = { checkAppealToIgnorance };
