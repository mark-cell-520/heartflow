/**
 * src/loyalty-by-omission.js — 「立场连坐」检测器（第 82 个判别维度）
 *
 * [v6.8.31] 第 554 轮新增。固定 scout 池连续多轮空（init 简报
 * /tmp/hf-scout-* 无新族），按 r505/r509/r517/r520/r550/r551 先例
 * 自建族级探针并用心虫 decision 本体选向：
 *   · /tmp/hf-r554-pool.txt：六个自建族实测，false_precision 有良性误伤
 *     出局、appeal_to_novelty 已被现有维度覆盖、risk_downplay 与
 *     speculation_as_fact 与在库维度纠缠；
 *   · /tmp/hf-r554-decide.txt + /tmp/hf-r554-decide2.txt：decision 本体
 *     先选 A(false_urgency)，精细探针复测发现该维度**已在库且部分覆盖**
 *     （7/12 被拦），不满足铁律④①「此前零覆盖」；
 *   · /tmp/hf-r554-decide-b.txt：decision 本体改选 D，score 0.79 /
 *     identity alignment 80%；
 *   · /tmp/hf-r554d-fine.txt：12 条攻击扩样复测 **8/12 完全穿过硬闸门**
 *     （gate=pass、findings 空），11 条良性**零误伤**，且穿过样本的归因
 *     里**零 false_dilemma 命中**——缺口真实存在。
 *
 * 辨别的族：「立场连坐」——不看你做了什么、说了什么对的内容，只把
 * 「你不支持 X」直接等同于「你站在敌对一面/你不相信我/你不在乎」，
 * 从而**取消你的中立资格**，把可讨论的分歧改判成忠诚问题。
 *
 * 与 false_dilemma（第 65 维）的实测边界（r554 逐条 delineation）：
 *   · 第 65 维的招式是**排除第三选项**——「要么 A 要么 B，没有中间路线」，
 *     必须同时在场二元框架词（要么/只有两种/no middle ground）；
 *   · 本族**不需要任何二元框架词**，只需要一个**等同化贬损结构**：
 *     「不 X 就是 Y」——把「未支持」这一动作定性为负面立场（反对/敌对/
 *     不在乎/不团结），实测同族 12 条零一条命中第 65 维；
 *   · 第 65 维 C2b「一侧污名化」需要 C1 二元框架共现，本族单句即可成立。
 *
 * 与其他在库维度的边界：
 *   · loyalty_test（第 67 维）是**资格审查**——要求对方证明忠诚方可
 *     参与（先表态再谈事），本族是把已发生的「不支持」直接定罪；
 *   · moral_foundations 管道德基石挪用，不判等同化贬损结构；
 *   · fallacies 管事样归谬，本族的落点是**取消中立资格**；
 *   · scrutiny_evasion 管逃避核验，本族是在**制造对立**。
 *
 * → rewrite 级：「不支持 X = 敌对立场」的等同化必须被改写——中立与
 *    部分支持是合法立场，分歧可以被讨论，不需要被改判成忠诚问题。
 */

'use strict';

// ─── B1: 未支持动作 X ─────────────────────────────────────
// 中文：不支持 / 不同意 / 不签字 / 不转发 / 不投这一票 / 不配合 / 拒绝 /
//       有异议 / 质疑 / 不接受 / 不参与
// 边界：必须有「未支持」语义。单纯的动作描述（关闭开关/删除数据）不判，
// 那是 risk 讨论，不属本族。
const WITHHOLD_ZH = /(?:不(?:支持|同意|签字|签名|转发|投票|投|配合|接受|参与|买|买账|认可|赞同|响应)|拒绝|有异议|提出质疑|质疑|不支持|不用|不采纳|不批准|不给|不肯|不情愿|不愿意|有顾虑|持保留|保留意见|不肯松口|不点头|不投这一票|不信(?:任何人|大家|我们|组织)|不(?:跟|和)(?:我们|大家|我)(?:站|坐)在(?:一起|一边)|不肯(?:帮忙|配合|出面))/;

// 英：if you do not support / disagreeing with / refusing to sign /
//       not sharing this / objecting to / declining the deal
// 注意：动词后可能被名词隔断（do not agree with me / disagree with this
// proposal），故动词后允许最多 12 字的名词尾巴再接句读或句尾。
const WITHHOLD_EN = /(?:\b(?:do\s+not|don't|does\s+not|didn'?t|did\s+not)\s+(?:support|agree|sign|share|join|back|endorse|buy|approve|accept|comply|cooperate|participate)\b|\brefus(?:e|ing|al)\s+to\s+(?:sign|agree|support|join|cooperate|accept)\b|\brefus(?:e|es|ing)\s+the\s+(?:deal|proposal|plan|offer|request|invitation|motion|amendment)\b|\bdisagree(?:s|ing|ment)?(?:\s+with)?\b|\bobject(?:s|ing|ion)?(?:\s+to)?\b|\boppos(?:e|es|ing|ition)?(?:\s+to)?\b|\bnot\s+(?:buying|sharing|signing|endorsing|voting\s+for)\b|\bdeclin(?:e|ing)\s+(?:the\s+)?(?:deal|offer|request|invitation)\b|\bwithhold(?:ing)?\s+(?:support|consent|approval)\b)/i;

// ─── B2a: 等同化连接词（把两件事判定为同一件事）────────────────
// 中：就是 / 便是 / 即是 / 等于 / 无异于 / 等同于 / 相当于 / 说明 / 意味着 /
//     代表。必须与 B2a 贬损词同句共现才算「等同化贬损」。
const EQUATE_LINK_ZH = /(?:就是|便是|即是|等于|无异于|等同于|相当于|说明你|意味着你|代表你|表明你|证明你)/;

// 英：means / implies / proves / shows / is synonymous with / amounts to
//      / so you are / which makes you / that makes you / you are …
//      注：「if you do not agree … you are …」把 withhold 与贬损连起来的
//      本身就是等同化结构，`you are` 也计入 link。
const EQUATE_LINK_EN = /(?:\b(?:means|implies|proves|shows|signals|indicates|amounts\s+to|is\s+tantamount\s+to|makes\s+(?:you|them|him|her))\b|\bsynonymous\s+with\b|\bso\s+(?:you|they)\s+(?:are|'re)\b|\bwhich\s+means\s+(?:you|they)\b|\bthat\s+makes\s+(?:you|them)\b|\byou\s+(?:are|'re)\s+(?:not\s+with|against)\b|\byou\s+(?:are|'re)\s+working\s+against\b|\b(?:you|they)\s+(?:are|'re)\s+(?:clearly|obviously|simply|just|really)\s+(?:a|an|the|not|against|under)\w*|\b(?:you|they)\s+(?:are|'re)\s+(?:a|an|the)\s+(?:enemy|traitor|turncoat|double[- ]agent|problem|liability|risk|disgrace|shame|embarrassment)\b)/i;

// ─── B2b: 贬损定性词（把对方打成敌对/负面立场）──────────────────
// 中：敌对/反对派/帮倒忙/拖后腿/没担当/不在乎/不团结/另有用心/站在对方那边/
//     跟公司过不去/反贼/内鬼/对立的/异心/别有用心…
// 边界：只收「立场/品格定性」，不收单纯情绪词（生气/不高兴）。
const DEMEAN_ZH = /(?:反对(?:派|者|面|党)?|敌对|对立面|对着干|唱反调|跟我作对|与(?:我|大家|我们|组织|公司|团队)(?:作对|对着干)|拆台|捣乱|使绊子|帮倒忙|拖后腿|拖累|不团结|闹分裂|有异心|另有用心|别有用心|动机不纯|没安好心|不知好歹|不领情|没担当|没责任心|没有责任心|不在乎|不关心|不尊重|看不起|轻视|蔑视|无视|漠视|眼中钉|叛徒|内鬼|奸细|汉奸|投敌|通敌|反贼|不忠|不孝|不义|无情|无义|冷血|自私|自利|自以为是|刚愎自用|一意孤行|偏执|偏见|极端|偏激|幼稚|愚蠢|糊涂|无能|废物|饭桶|连累|坑人|害人|整人|算计|阴损|坏心眼|坏水|恶毒|歹毒|狠毒|残忍|残暴|凶狠|凶恶|专横|霸道|蛮横|跋扈|独裁|任性|任意|随便|胡乱|瞎搞|乱来|昏庸|顽固|死硬|倔|犟|拧|给别人(?:当)?(?:枪|刀子|靶子)使|站(?:在|到)(?:对方|对面|对立面|对手)(?:那边|一边|那一边)|跟(?:公司|团队|大家|组织)(?:过不去|作对)|没把(?:大家|组织|团队|我)(?:放在心上|当回事|当自己人)|拿?(?:大家|我们|组织|自己人)(?:当|做)?(?:外人|敌人|对手)|不是(?:一条心|自己人|我们的人|我们这边)|跟我们(?:不是|不)(?:一条心|一路人)|跟(?:公司|团队|大家|组织)(?:不是|不)(?:一条心|同心|同德)|两条心|离心|离德|不信任(?:我们|任何人|大家|组织|团队|我)|不信(?:我们|任何人|大家|组织|团队|我)|信不过)/;

// 英：against us / the enemy / a traitor / disloyal / bad faith /
//     undermining / obstructive / do not care / do not trust /
//     reject all progress / oppose the mission
const DEMEAN_EN = /(?:\b(?:against|opposed\s+to|traitorous|disloyal|bad[- ]faith|undermining|obstructive|sabotaging|working\s+against)\s+(?:us|me|the\s+(?:team|company|mission|group))\b|\b(?:you|they)\s+(?:are|'re)\s+(?:the\s+enemy|an?\s+enemy|a\s+traitor|against\s+(?:us|me|the\s+(?:team|company|mission)))\b|\b(?:betrayal|treason|disloyalty|obstruction|sabotage|bad[- ]faith|not\s+in\s+good\s+faith|in\s+bad\s+faith)\b|\b(?:do\s+not|don't)\s+(?:care|trust|love|respect|value)\s+(?:about|for)\s+(?:us|me|the\s+(?:team|company|mission))\b|\bnot\s+with\s+(?:us|me|the\s+(?:team|company|mission))\b|\bone\s+of\s+them\b|\b(?:reject|oppose|resist|block|stall|sabotage)\s+(?:all\s+|the\s+whole\s+|any\s+|every\s+)?(?:progress|mission|vision|effort|plan|company|team|group)\b|\bworking\s+against\b|\bagainst\s+the\s+(?:whole\s+)?(?:mission|vision|company|team)\b|\b(?:a\s+)?(?:traitor|turncoat|double[- ]agent|enemy)\s+to\s+(?:us|the\s+(?:team|company|mission|group))\b|\b(?:you|they|he|she)\s+(?:are|'re|is)\s+(?:a\s+)?(?:traitor|turncoat|double[- ]agent|enemy|disloyal|a\s+liability)\b|\bobstruct(?:ing|ive|ed|s)?\s+(?:the\s+)?(?:whole\s+)?(?:mission|vision|progress|effort|plan|company|team|group)\b|\bsabotag(?:e|es|ing)\s+(?:the\s+)?(?:mission|vision|progress|effort|plan|company|team|group)\b|\b(?:makes?|making)\s+(?:you|them|him|her)\s+(?:the\s+|an?\s+)?(?:enemy|traitor|outcast|liability|turncoat)\b)/i;

// ─── 豁免：真实的风险/后果陈述（非立场定罪）──────────────────
// 判据边界：这些**不把未支持动作定性为敌对立场**，只是陈述客观后果：
//   · 不支持这个方案可能导致排期延后两周（决策后果，非定罪）
//   · 不签字则合同无法生效（法律后果）
//   · 拒签后这条通道就关闭了（程序后果）
// 关键区分：后果是**可讨论的事实**，不是**对你这个人的定性**。
const EXEMPT_ZH = /(?:可能|或许|大概|预计)(?:会|将)?(?:导致|造成|使得|影响|延误|延后|延期|推迟|阻碍|妨碍|引发|触发)|(?:会|将)(?:导致|造成|使得|影响|延误|延后|延期|推迟)(?:系统|服务|项目|进度|排期|流程|数据|业务|审批|合同|协议|条款|工作|任务|交付|上线|发布|测试|验证|部署|运行|使用|访问|登录|注册|支付|结算|核对|资质|资格|名额|配额|额度)|无法(?:生效|通过|执行|办理|提交|完成|进行|继续|使用|访问)|合同|协议|章程|规定|制度|流程(?:规定|要求)|按(?:规定|流程|制度|章程)/;

// 英文：objective consequence framing, not character verdict
const EXEMPT_EN = /(?:\b(?:may|might|could|will)\s+(?:cause|result\s+in|lead\s+to|delay|break|fail|interrupt|disable|prevent|block|affect)\b|\bthe\s+(?:contract|agreement|policy|procedure|process|rule|service|system|account|subscription|workflow)\b|\b(?:otherwise|if\s+not|failing\s+to)\b[^.!?;]{0,40}\b(?:will\s+)?(?:be\s+)?(?:rejected|void|invalid|invalidated|expired|delayed|escalated|suspended|terminated|deactivated|closed|cancelled)\b)/i;

// ─── 豁免：否定引述（把「不X就是Y」当作被驳斥的观点引用）────────
// 判据边界：「不要说『不支持就是反对』」——这是引用别人的错误逻辑来批评，
// 与 loyalty_by_omission 逻辑同族（同前 r47 否定引述教训）。
const EXEMPT_QUOTE_ZH = /(?:不要说|别说|别再说|而不是说|非(?:常)?(?:错误|荒谬)的|所谓|号称|声称|鼓吹|宣扬|散播|流传|颠倒黑白|血口喷人|倒打一耙|扣帽子|乱扣|乱贴|反咬一口|嫁祸|栽赃|诬陷|污蔑|抹黑|诽谤|中伤|造谣|批驳|驳斥|反驳|驳倒|推翻|指摘|指责|谴责|声讨)/;

const EXEMPT_QUOTE_EN = /(?:\b(?:do\s+not|don't)\s+(?:say|claim|assert)\b|\b(?:it\s+is\s+)?(?:wrong|false|absurd|ridiculous|fallacious)\s+to\s+(?:say|claim|assume)\b|\b(?:the\s+)?(?:so[- ]called|alleged|supposed)\s+(?:logic|argument|claim|reasoning)\b|\bwhat\s+about|\bso\s+what\s+if\s+you\b|\bno\s+one\s+is\s+obligated\s+to\b|\bnot\s+obligated\s+to\s+(?:agree|support|sign)\b|\byou\s+(?:do\s+not|don't)\s+have\s+to\s+(?:agree|support|sign)\b|\b(?:disagreement|objection|refusal|criticism)\s+is\s+(?:not|never)\s+(?:a\s+)?(?:betrayal|treason|disloyalty|hostility|opposition|crime|wrong)\b)/i;

/**
 * @param {string} text 归一化后的文本
 * @returns {{hit:boolean, score:number, detail:string, count:number}}
 */
function checkLoyaltyByOmission(text) {
  if (!text || text.length < 6) return { hit: false, score: 0, detail: '', count: 0 };

  // 「未支持动作」必须先在场，否则孤立的贬损不属本族。
  const hasWithhold = WITHHOLD_ZH.test(text) || WITHHOLD_EN.test(text);
  if (!hasWithhold) return { hit: false, score: 0, detail: '', count: 0 };

  const isZh = /[\u4e00-\u9fff]/.test(text);

  // 豁免①：否定引述——把「不X就是Y」当作被驳斥的观点引用，自身在批评它。
  if (EXEMPT_QUOTE_ZH.test(text) || EXEMPT_QUOTE_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // 豁免②：真实后果陈述（可能…导致 / will cause / will be suspended）——
  // 后果是可讨论的事实，不是对这个人的品格定性。
  if (EXEMPT_ZH.test(text) || EXEMPT_EN.test(text)) {
    return { hit: false, score: 0, detail: '', count: 0 };
  }

  // 核心：等同化连接词 + 贬损定性词同句共现（不 X 就是 Y）
  const hasLink = EQUATE_LINK_ZH.test(text) || EQUATE_LINK_EN.test(text);
  if (!hasLink) return { hit: false, score: 0, detail: '', count: 0 };

  if (DEMEAN_ZH.test(text) || DEMEAN_EN.test(text)) {
    return {
      hit: true,
      score: 0.68,
      count: 1,
      detail: isZh ? '立场连坐×未支持即敌对(zh)' : 'loyalty-by-omission×withhold-equals-hostile(en)',
    };
  }

  return { hit: false, score: 0, detail: '', count: 0 };
}

module.exports = {
  checkLoyaltyByOmission,
  // [r554] 供守卫测试做「置空指定支必须变红」的变异注入用。
  __internals: () => ({
    WITHHOLD_ZH, WITHHOLD_EN,
    EQUATE_LINK_ZH, EQUATE_LINK_EN,
    DEMEAN_ZH, DEMEAN_EN,
    EXEMPT_ZH, EXEMPT_EN,
    EXEMPT_QUOTE_ZH, EXEMPT_QUOTE_EN,
  }),
};
