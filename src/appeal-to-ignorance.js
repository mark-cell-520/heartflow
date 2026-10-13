/**
 * src/appeal-to-ignorance.js — 诉诸无知 / 举证倒置检测器（第 62 个判别维度）
 *
 * v6.8.4 新增。心虫 decision 本体选出（scripts/round-485-decide.js，E 得 0.80 分，
 * identity_alignment 0.80）。探测器候选池（/tmp/hf-scout-r485.txt）+ 本轮复测
 * （scripts/round-485-att-probe.js，直调 src/gate.js）：
 * 14 条攻击样本 **13 条穿过硬闸门**（gate=pass），仅 1 条被
 * absolute_claim / hasty_generalization 兜住。
 *
 * [v6.8.54 第 707 轮扩展] 补「举证倒置-需求形」句式族。r707 探测器
 * （/tmp/r707-preprobe.js + /tmp/r707-en-probe.js）实测：中文 7/10 漏判、
 * 英文 5/10 漏判，穿过闸门的样本**全部零维度命中**；良性误伤 0/12。
 * 原实现只覆盖「推定形」（I1 举证责任 × I2 推定成立——"证明不了就是真的"），
 * 而需求形——不推定成立，而是要求质疑方先自证/拿反证，达不到门槛就取消其
 * 质疑资格或要求服从——整族穿过闸门。二者同属本维度已声明射程（JSDoc 首行
 * 即含「举证责任倒置」），缺口是 I1 模式覆盖不到需求句式，故按真升级②
 * （给已有维度补此前零覆盖的新句式族）扩展，不新增维度编号。
 *
 * 判据（三类路由，任一命中即 verify 级）：
 *   R1 推定形（v6.8.4 原有）：I1 举证责任在场 × I2 推定成立
 *   R2 需求形（v6.8.54 新增）：D 举证倒置要求 × S 取消资格/要求服从
 *      ——不推定成立，把"拿出证据/反证"设为质疑的前提，达不到就禁声
 *   R2b 门槛形（v6.8.54 新增，英文单腿）：must prove … before … allowed
 *      to question——门槛结构自含攻击性，无需第二腿
 *   R3 回应质疑形（v6.8.54 新增）：O 对话方质疑在场 × (D4 反将一军 |
 *      DF 带驱离后缀的举证要求)
 *
 * 为什么现有维度拦不住（r707 实测复量）：
 *   · appeal_to_ignorance 自身 I1 模式只认"你证明不了/拿不出反证"窄形，
 *     "你必须拿出依据才能质疑""你先举证""你如果不能证明…就按X防"整族不命中；
 *   · whataboutism 只捕获英文 "No evidence says I am mistaken, who are
 *     you to criticize" 一条，中文同类句零命中；
 *   · sealioning 捕英文 "Prove it or shut up"（伪装礼貌的连续追问），
 *     捕不到中文需求形与英文 gate 形。
 *
 * 明确不判的（这些是正当陈述）：
 *   · 真的在陈述举证责任规则：「谁主张谁举证是基本原则」
 *   · 确实在报道「尚无证据」的研究状态：「目前没有证据表明两者相关」
 *   · 向主张方索取正面证据：「请提供证据支持你的说法」「你说这里有问题，
 *     那你提供证据，我们好排查」——正当核验请求，落点是主张方/共同排查，
 *     不取消质疑资格（判据：要求对象是阳性证据且无驱离/禁声后缀）
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
const CONCLUDE_ZH = /(?:那|那么就|那就是|即|便|就)(?:就是)?(?:真的|对的|正确的|成立的|事实|真理|可信的|有效的)|(?:说明|证明|表明|意味着)(?:我|我们)?(?:说|讲)的?(?:是)?(?:对|没错|正确的|真理)|(?:说明|证明|表明|意味着)(?:我|我们)(?:说|讲)得(?:对|没错|正确)|(?:可以|尽可|大可|就能够|就能)(?:放心|安心|确信|相信|采纳|接受|照办|执行|推广|照做|下结论)|(?:按|照|依)(?:我|我们)?(?:说|讲)的?(?:办|做|执行|推广)|(?:就是|便是|那就是)(?:事实|真理|定论|结论)|(?:足以|就可以|便能)(?:证明|说明|证实)(?:其|它|这)?(?:正确性|合理性|成立|可行)|(?:他|她|它|其|这|那)(?:是|就是|算是)(?:清白的|无辜的|没说谎的|没问题的|可信任的|靠得住的|安全的|对的|没错的)|(?:说明|证明|表明)(?:我们|他们|我|你们)?(?:做对了|没做错|是对的|是正确的|没错)|(?:按|照|依|听)(?:我|我们)?(?:说|讲)的?(?:办|做|执行|推广)|(?:就可以|就该|那就|能)(?:推广|照办|执行|下结论|定论)|(?:我|我们)(?:说|讲)的?(?:是)?(?:对|没错|正确)(?:的|啦|嘛)?|(?:所以|因此|那就|就可以)?(?:放心|安心)(?:上|使用|采用|去买|去买它|去买这个)|(?:他|她|它|其|这|那)(?:说|讲)的?(?:是)?(?:真话|实话|真的|对的|没错)(?:的|啦|嘛)?/;

// 英文：以「未被反驳」推定成立
const CONCLUDE_EN = /\b(?:therefore|thus|so|hence|then)\s+(?:it|that|this|the\s+claim|the\s+theory)\s+(?:is|must\s+be|has\s+to\s+be)\s+(?:true|correct|right|valid|fact|the\s+truth)\b|\b(?:proves?|shows?|demonstrates?|confirms?)\s+(?:that\s+)?(?:I|we)\s+(?:am|are)\s+(?:right|correct)\b|\b(?:we|you)\s+(?:can|may|should|must)\s+(?:safely\s+)?(?:accept|trust|believe|adopt|proceed|act\s+on|take\s+it)\b|\bthat\s+(?:settles|proves)\s+it\b|\b(?:means|shows)\s+(?:it|the\s+claim)\s+is\s+valid\b|\bregard\s+it\s+as\s+(?:true|proven|valid)\b|\b(?:so\s+)?(?:it|that|this)\s+(?:must\s+be|is)\s+(?:fine|safe|sound|ok|okay|the\s+truth)\b|\btreat\s+it\s+as\s+(?:true|proven|valid|fact)\b|\b(?:therefore|thus|so)\s+(?:it|that)\s+is\s+(?:the\s+truth|fact|a\s+fact)\b/i;

// ─── v6.8.54 需求形腿组 ─────────────────────────────────────
// D-A 反证指向（中文）：要求对方拿反证/反例。对象必填反证类——向主张方
// 索取阳性证据（"请提供证据"）是正当核验，不走本支。
const DEMAND_A_ZH = /(?:你|你们|对方|反对(?:者|的人)|怀疑(?:者|的人)|不信(?:者|的人)|谁)(?:必须|得|需要|先|先得|就)?(?:拿出|拿不出|提供|举出|举证|给出|找出|找到|给不出|上|晒出)(?:反证|反例)/;

// D-B 门槛/条件（中文）：除非你能…；拿不出证明/反驳…；必须…才能质疑
const DEMAND_B_ZH = /(?:除非|只有)(?:你|你们)?(?:能|可以|拿出|举出|提供|找到)(?:证据|反证|反例|依据)|(?:你|你们)?(?:如果|若|要是)?(?:不能|无法|没法|拿不出|找不到|给不出)(?:证明|证实|反驳|举出|拿出|提供|找到)|(?:必须|得|需要|应当)(?:你|你们|对方)?(?:拿出|提供|举出|举证|给出|找出|找到)(?:证据|反证|反例|依据|凭据|证明)[^。]{0,6}(?:才能|再|才有资格)/;

// D-C 无证据 dismissal（中文）：空口无凭 / 没有证据表明我错
const DEMAND_C_ZH = /(?:空口无凭|口说无凭|凭一张嘴)|没有(?:任何)?(?:证据|凭据|依据)(?:表明|显示|说明)?[^。]{0,8}(?:我|我们)?(?:错|有问题|不对)/;

// D-D 反将一军（中文）：那你记得/说得清…吗
const DEMAND_D_ZH = /(?:那|那么)?(?:你|你们)(?:记得|说得清|讲得清|拿得出|找得出|复述|背得出|背得清)[^。]{0,12}(?:吗|么|啊)/;

// D-E 先举证（中文）：你先举证/先拿出证据
const DEMAND_E_ZH = /(?:你|你们)?先(?:举证|拿出|提供|举出|给出)(?:证据|反证|反例|依据)?/;

// D-G 否定条件禁声（中文）：拿不出证据就别乱说。否定条件+禁声词自含攻击性，
// 与正当的"请提供证据否则我不听"（阳性索证）以条件极性区分。
const DEMAND_G_ZH = /(?:你|你们|谁|对方)?(?:拿不出|找不到|给不出|没有)(?:证据|反证|反例|依据|凭据)[^。]{0,4}(?:就|那就|就别|不然|否则|不许|不准|别想|闭嘴)/;

// D-F 回应质疑的举证要求（中文）：必须带驱离后缀（来啊/了吧/再说/才能），
// 无后缀的"你提供证据我们好排查"是正当请求，不走本支。
const DEMAND_F_ZH = /(?:你|你们)(?:拿出|提供|举出|举证|给出|找出|找到|上|晒出)(?:证据|反证|反例|依据|凭据|证明|说法)(?:来|来啊|啊|了吧|再说|再谈|才能|才有资格)/;

// O 对话方质疑/指控在场（中文）
const OBJECTION_ZH = /(?:你说|你认为|你觉得|你讲|你抱怨|你指责|你批评|你反对|你质疑|你怀疑)[^。]{0,14}(?:不行|不对|有问题|有假|错|差|撒谎|说谎|忘了|记错|冤枉|搞错|弄错)/;

// S 取消质疑资格/要求服从/驱离（中文）
const SILENCE_ZH = /(?:凭什么|哪来的资格|没资格|就没资格|有何资格|有什么资格)|(?:就得|就必须|那就|只能|只配|照办|听我的|按我的|照我的|按我讲的)|(?:就|那就|就得|只能|只能当)(?:按|照|依)[^。]{0,6}(?:办|做|防|处理|应对|准备)|(?:不然|否则|再敢|不许|不准|别想|闭嘴|少废话|住口|先闭上|别乱说|别胡说|不懂别讲)|(?:才能|再|才有资格|之后再)(?:质疑|反对|说话|插嘴|发表|谈|讲|插话)|(?:来啊|了吧|了再说|再来|也不迟|才有脸)|(?:空口无凭|口说无凭|凭一张嘴)/;

// ─── v6.8.54 需求形腿组（英文） ─────────────────────────────
// O 对话方质疑在场
const OBJECTION_EN = /\b(?:you|u)\s+(?:say|said|claim(?:ed)?|argue[ds]?|argued|believe[ds]?|believe|think|thought|state[ds]?|stated)\b[^.]{0,40}\b(?:wrong|incorrect|mistaken|misremembered|misremember|bad|flawed|broken|false|untrue|lying|lied|problematic|erroneous)\b/i;

// D-A 反证指向：must provide a counterexample / show me the counterevidence
const DEMAND_A_EN = /\b(?:you|u|they|critics?|opponents?|skeptics?|anyone|those\s+who\s+disagree)\s+(?:must|have\s+to|need\s+to|should|shall|gotta)\s+(?:provide|produce|show|present|give|offer|bring)\s+(?:a\s+|the\s+)?(?:counterexample|counter-example|counterexamples|counter-evidence|counterevidence|disproof|refutation)\b|\b(?:show|produce|provide|present|give)\s+(?:me|us)\s+(?:the\s+|a\s+)?(?:counterexample|counter-example|counter-evidence|counterevidence|disproof|refutation)\b/i;

// D-B 门槛/条件：cannot prove I am wrong / unless you can prove / must prove … before … question
const DEMAND_B_EN = /\b(?:you|u)\s+(?:cannot|can'?t|could\s+not|couldn'?t|can\s+not)\s+(?:prove|disprove|show|refute|demonstrate)\s+(?:that\s+)?(?:i|we|my|me|us)\s+(?:am|are|'m|'re|is)?\s*(?:wrong|mistaken|lying|incorrect|false|at\s+fault)\b|\b(?:you|u)\s+(?:cannot|can'?t)\s+prove\s+(?:me|us)\s+wrong\b|\b(?:unless|until|if)\s+(?:you|u|they|someone)\s+(?:can|could)\s+(?:prove|disprove|show|refute|provide|produce)\b[^.]{0,30}\b(?:wrong|false|otherwise|first)\b|\b(?:you|u)\s+(?:must|have\s+to|need\s+to)\s+(?:prove|show|provide|produce|present)\b[^.]{0,40}\b(?:before|until)\b[^.]{0,30}\b(?:question|object|criticize|criticise|speak|complain|talk)\b/i;

// D-C 无证据 dismissal：No evidence says I am wrong
const DEMAND_C_EN = /\bno\s+(?:evidence|proof)\s+(?:says|shows|proves|indicates|suggests)\s+(?:that\s+)?(?:i|we)\s+(?:am|are|'m|'re)\s+(?:wrong|mistaken|lying|incorrect|at\s+fault)\b/i;

// D-D 反将一军：Then you recite what I said?
const DEMAND_D_EN = /\b(?:then\s+)?(?:you|u)\s+(?:remember|recall|repeat|recount|recite|retell|name|list|rehearse)\b[^.]{0,30}\??/i;

// D-F 回应质疑的举证要求（必须带 first/then/before 后缀）
const DEMAND_F_EN = /\b(?:(?:you|u)\s+)?(?:show|provide|produce|present|give)\s+(?:me|us|him|her|them)\s+(?:the\s+|a\s+|your\s+)?(?:evidence|proof|data|source)s?\s+(?:first|then|before)\b/i;

// D-Gate 门槛形（英文单腿）：must prove … before … allowed to question
const DEMAND_GATE_EN = /\b(?:you|u)\s+(?:must|have\s+to|need\s+to|should)\s+(?:prove|show|provide|produce|present)\b[^.]{0,40}\b(?:before|until)\b[^.]{0,40}\b(?:allowed|entitled|permitted|in\s+a\s+position)\s+to\s+(?:question|object|criticize|criticise|speak|complain|talk)\b/i;

// S 取消质疑资格/要求服从/驱离（英文）
const SILENCE_EN = /\b(?:who\s+are\s+you|no\s+right|not\s+entitled|in\s+no\s+position|what\s+qualifies|no\s+business)\b|\b(?:then\s+)?(?:do|obey|follow|listen)\s+(?:as|what)\s+i\s+(?:say|tell)\b|\b(?:or\s+else|otherwise)\b|\b(?:then|before)\s+(?:we|you)\s+(?:can|could|may)\s+(?:talk|discuss|speak)\b|\b(?:shut\s+up|zip\s+it|save\s+it)\b/i;

// 豁免：评析/引述这套论证本身；正当的举证责任陈述 ────────
const META_EXEMPT_ZH = /诉诸无知|举证(?:责任)?(?:倒置|转移)|举证责任(?:倒置|转移)|拿「无法反驳」当(?:理由|证据)/;
const QUALIFY_ZH = /谬误|谬说|逻辑错误|错误论证|站不住脚|不成立|并不成立|并不正确|是错的|有问题|值得(?:怀疑|商榷|反思|警惕)/;
// 正当陈述举证责任原则（谁主张谁举证），而非把责任转嫁给对方
const RULE_ZH = /谁主张(?:，)?谁举证|举证(?:责任)(?:在|归于)(?:主张|提出|声张)/;

const META_EXEMPT_EN = /\bappeal\s+to\s+ignorance\b|\bburden\s+of\s+proof\b|\bargumentum\s+ad\s+ignorantiam/i;
const QUALIFY_EN = /\bfallacy\b|\binvalid\b|\bdoesn'?t\s+(?:hold|follow|work)\b|\bnot\s+(?:a\s+)?(?:valid|sound)\s+(?:argument|reason)\b|\bquestionable\b|\bflawed\b/i;
// 正当原则：主张者承担举证责任
const RULE_EN = /\b(?:the\s+)?(?:burden\s+of\s+proof)\s+(?:lies|falls|rests)\s+(?:with|on)\s+(?:the\s+)?(?:one|person|claimant|proponent|party)/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string}}
 */
function checkAppealToIgnorance(text) {
  if (!text || typeof text !== 'string' || text.length < 6) return { hit: false, score: 0, detail: '' };

  // 在评析「诉诸无知」这套论证 → 不是运用它
  if ((META_EXEMPT_ZH.test(text) && QUALIFY_ZH.test(text)) ||
      (META_EXEMPT_EN.test(text) && QUALIFY_EN.test(text))) {
    return { hit: false, score: 0, detail: '' };
  }
  // 正当陈述举证责任原则（「谁主张谁举证」）→ 不是在转移举证责任
  if (RULE_ZH.test(text) || RULE_EN.test(text)) {
    return { hit: false, score: 0, detail: '' };
  }

  // R1 推定形（v6.8.4 原有）：举证责任在场 × 推定成立
  const burden = BURDEN_ZH.test(text) || BURDEN_EN.test(text);
  if (burden) {
    if (CONCLUDE_ZH.test(text)) {
      return { hit: true, score: 0.4, detail: '诉诸无知/举证倒置(zh)' };
    }
    if (CONCLUDE_EN.test(text)) {
      return { hit: true, score: 0.4, detail: '诉诸无知/举证倒置(en)' };
    }
  }

  // R2 需求形（v6.8.54 新增）：举证倒置要求 × 取消资格/要求服从。
  // 中英分语言配对——混合文本里两条腿必须同语言，避免英文禁声词
  // 配上中文索证句的偶然共现。
  const demandZh = DEMAND_A_ZH.test(text) || DEMAND_B_ZH.test(text) || DEMAND_C_ZH.test(text) ||
    DEMAND_E_ZH.test(text) || DEMAND_G_ZH.test(text);
  if (demandZh && SILENCE_ZH.test(text)) {
    return { hit: true, score: 0.4, detail: '举证倒置-需求形(zh)' };
  }
  const demandEn = DEMAND_A_EN.test(text) || DEMAND_B_EN.test(text) || DEMAND_C_EN.test(text);
  if (demandEn && SILENCE_EN.test(text)) {
    return { hit: true, score: 0.4, detail: '举证倒置-需求形(en)' };
  }

  // R2b 门槛形（v6.8.54 新增，英文单腿）：必须证明…才配质疑——
  // 门槛结构自含攻击性，无需第二腿
  if (DEMAND_GATE_EN.test(text)) {
    return { hit: true, score: 0.4, detail: '举证倒置-门槛形(en)' };
  }

  // R3 回应质疑形（v6.8.54 新增）：对话方质疑在场 × 反将一军/带驱离后缀的举证要求
  const objectionZh = OBJECTION_ZH.test(text);
  if (objectionZh && (DEMAND_D_ZH.test(text) || DEMAND_F_ZH.test(text))) {
    return { hit: true, score: 0.4, detail: '举证倒置-回应质疑形(zh)' };
  }
  const objectionEn = OBJECTION_EN.test(text);
  if (objectionEn && (DEMAND_D_EN.test(text) || DEMAND_F_EN.test(text))) {
    return { hit: true, score: 0.4, detail: '举证倒置-回应质疑形(en)' };
  }

  return { hit: false, score: 0, detail: '' };
}

module.exports = { checkAppealToIgnorance };
