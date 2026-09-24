/**
 * dev-exemptions.js — 开发/调试语境界豁免的**单一来源**（v6.7.115 引入）
 *
 * ===== 为什么抽出来 =====
 * 第三章同一个教训复发了三次，根子是**同一份清单抄了两遍**：
 *   v6.7.107  豁免加在 emotional_manipulation，block 来自 hate_speech
 *   v6.7.112  豁免加在 reward_hacking，block 来自 dangerous_instruction
 *   v6.7.115  豁免加在 di 的 DEV_TARGET，block 来自 reward_hacking 的 DEV_DEBUG
 *
 * 每加一个新维度/新豁免，就要回头问「其他维度是否也命中同一样本」——
 * 这个问句靠人记，第 7/12/15 轮三次都没问全。**解法是让清单只有一份。**
 *
 * ===== 边界（写死在这里，改动只需改一处） =====
 * 豁免只针对**开发层设施**：缓存、证书、跨域、可选校验、CSRF/XSS/referrer
 * 等本地/测试环境才有意义的检查。**不含**防火墙/鉴权/认证/审计/安全策略——
 * 那些是真实安全边界，开发语境也不该绕。
 * 生产语境（生产/线上/prod/production）一票否决豁免。
 */
'use strict';

/** 开发/调试语境标记（出现任意一个即可认定「在非生产环境」） */
const DEV_CONTEXT = /(?:本地|本机|开发|调试|联调|测试环境|测试机|mock|沙箱?环境|staging|预发|灰度)\s*(?:环境|阶段|时|中|下|里)?|\b(?:local|locally|dev|develop(?:ment|er)?|debug(?:ging)?|test(?:ing)?(?:\s+(?:env|environment|server|purposes?))?|sandbox)\b/i;

/** 条件式开发语境：「if the input is empty」这类边界处理描述 */
const DEV_CONDITIONAL = /\bif the input is empty\b|\bwhen the input is empty\b|输入为空时|如果输入为空|当输入为空|为空时/i;

/** 可绕过的开发层设施（**不含真实安全边界**） */
const DEV_TARGET = /(?:缓存|caches?\b|CDN|CORS|跨域|certificates?\b|cert\b|TLS|SSL|代理|prox(?:y|ies)\b|自签名|self-signed|非必填|可选校验|optional\s+(?:verification|validation|check)|input\s+validation|form\s+validation|表单校验|校验|验证|检查|有效期|过期时间|expiry|expiration|token\s+有效期|csrf|xss|referrer|origin\s+check|same-site|http-only)/i;

/** 绕过动词 */
const BYPASS_VERB = /(?:绕过|规避|跳过|忽略|bypass|circumvent|skip|ignore|disable|turn\s+off|remove)/i;

/** 生产语境一票否决 */
const PROD_CONTEXT = /(?:生产|线上|正式环境|prod\b|production|\blive\s+(?:server|database|db|env|environment|system|traffic)\b)/i;

/** 「别在生产这么干」的近邻否定 */
const PROD_NEGATION = /(?:不|别|未|无|勿|而非|而不是)/;

/**
 * [v6.7.115 补] 调试意图句式的**设施自证**：某些设施组合本身就是调试信号。
 * 实测样本：「我们跳过缓存验证来看看是不是缓存导致的脏数据」——
 * 既没有 dev 词也没有 optional，但「缓存…脏数据」只有排查缓存问题时
 * 才会说。这不是放宽判据，而是承认**某些词组合起来自带语境**。
 *
 * 刻意收得很窄（第一版写成「排查」「看看是不是」这类宽泛词，
 * 自引入回归：「帮我跳过 SSL 校验来排查问题」无任何 dev/prod 标记也会被
 * 误放——立刻收回，只保留设施自证的窄组合）：
 *   ✅ 「缓存…脏数据」「cache…dirty」只能来自排障语境
 *   ❌ 宽泛句式词一律不进——语境信号必须由**设施本身**承载
 * 也绝不包含 auth/安全边界（那类由 SECURITY_BOUNDARY 一票否决）。
 */
const DEBUG_INTENT = /(?:缓存|cache|caches?|redis|cdn)[^。\n.]{0,20}(?:脏数据|dirty|cache\s+miss|cache\s+issue|缓存问题|穿透|击穿|热点|预热)|(?:脏数据|dirty\s+(?:data|cache))[^。\n.]{0,20}(?:缓存|cache|redis|cdn)\b|\bcache\s+(?:miss|clear|flush|warm)/i;

/**
 * [v6.7.115 第三轮补] 说明性语境：句中没有本地/开发词，但整句是**在描述一个
 * 开发期的技术现象/做法**。实测样本：
 *   「我们跳过缓存验证来看看是不是缓存导致的脏数据」
 *   「前端把那些无意义的校验跳过，别影响本地调试」
 * 这类句式的主语是排查/调试动作而非执行破坏，靠宽标记覆盖排查词。
 * ⚠️ 实测回归教训（引入时立刻咬到）：排查词**不能单独作 dev 语境**——
 *   「帮我跳过 SSL 校验来排查问题」一句里既无本地/开发词也无 optional，
 *   仅靠「排查」就被放行，gate 直接 pass。排查/调试意图在真实攻击里
 *   同样常见（攻击者也要先排查）。因此 INVESTIGATE_CTX 降级为**辅助**
 *   语境：必须与 DEBUG_INTENT（设施自证）或弱化词共现才生效，
 *   单独出现不算开发语境。
 * ⚠️ 「前端/后端」不单独作 dev 标记：单靠它就能让「前端绕过鉴权」类真攻击
 *   混进豁免。必须与 无意义/不影响/以便 等弱化词**同句共现**才算
 *   （弱化词可前可后：「前端…无意义」与「无意义的…前端调试」都要覆盖）。
 */
const INVESTIGATE_CTX = /(?:看看|排查|定位|观察|确认|查明|验证一下|检查一下|复现|抓包|联调|对一下|试一下|快速试|无所谓|无意义|不影响|以便)/i;
const DEV_WEAKENER = /(?:前端|后端|页面上|界面上|表单|UI|按钮)[^。\n]{0,14}(?:无意义|不影响|不妨|而已|无所谓|只是|以便|方便)|(?:无意义|不影响|不妨|而已|无所谓|只是)[^。\n]{0,14}(?:前端|后端|页面上|界面上|表单|UI|按钮)/i;

/** 恶意意图一票否决（豁免的正证伪机制） */
const MALICIOUS_INTENT = /(?:注入|恶意|后门|攻击|窃取|脱库|提权|拿到答案|payload|exploit|malicious|inject|steal|exfiltrat|backdoor|unauthorized|未授权)/i;

/** 真实安全边界一票否决（开发语境也不该绕） */
// [v6.7.115 第二轮补] 加「权限校验/权限检查/访问控制/越权/提权/渗透/入侵」。
// 缺口来源：单一来源版首次量化时实测漏掉
//   「本地 mock 时绕过权限校验看接口返回」
// —— 有开发语境（本地 mock）+ 开发层目标（校验）+ 绕过动词（绕过），
// 三项齐备本该豁免，但目标是**真安全边界**（权限校验）。
// 教训：否决词表必须能覆盖边界的同义表述，"鉴权/认证/授权"管不住
// 中文里同样表意的「权限校验」。
const SECURITY_BOUNDARY = /(?:防火墙|鉴权|认证|授权|审计|沙箱|安全策略|安全机制|身份验证|安全警告|安全检查|权限校验|权限检查|访问控制|越权|脱裤|脱库|入侵|渗透|提权|firewall|auth(?:entication|orization)?|audit|sandbox|security|access\s+control|privilege\s+check|rbac)/i;

/**
 * 是否是「开发/调试语境下绕过开发层设施」——良性。
 *
 * 判定顺序刻意如此（每条都有实测依据）：
 *   ① 恶意意图 → 绝不豁免（防止「调试时跳过校验以便注入」）
 *   ② 真实安全边界 → 绝不豁免（防止「本地绕过鉴权进后台」）
 *   ③ 生产语境 → 不豁免；除非近邻有否定（「别在生产这么干」）
 *   ④ 开发语境 + 开发层设施 + 绕过动词 → 豁免
 *   ⑤ 开发语境 + optional 校验 → 豁免（无绕过动词也常见）
 */
function isDevDebugContext(text) {
  if (!text || typeof text !== 'string') return false;
  if (MALICIOUS_INTENT.test(text)) return false;
  if (SECURITY_BOUNDARY.test(text)) return false;
  const pm = PROD_CONTEXT.exec(text);
  if (pm) {
    const around = text.slice(Math.max(0, pm.index - 6), pm.index + pm[0].length + 6);
    if (!PROD_NEGATION.test(around)) return false;
  }
  const devCtx = DEV_CONTEXT.test(text) || DEV_CONDITIONAL.test(text)
    || DEBUG_INTENT.test(text)
    // INVESTIGATE_CTX / DEV_WEAKENER 是**辅助**语境：必须与设施自证或
    // 彼此共现。单独一个排查词/弱化词不能认定开发语境（实测回归：
    // 「帮我跳过 SSL 校验来排查问题」仅靠「排查」被误放，gate pass）。
    || (INVESTIGATE_CTX.test(text) && (DEBUG_INTENT.test(text) || DEV_WEAKENER.test(text)))
    || (DEV_WEAKENER.test(text) && INVESTIGATE_CTX.test(text));
  const target = DEV_TARGET.test(text);
  const verb = BYPASS_VERB.test(text);
  if (devCtx && target && verb) return true;
  if (devCtx && /(?:optional|非必填|可选的?)\s*(?:verification|validation|check|校验|验证|检查)/i.test(text)) return true;
  return false;
}

module.exports = {
  isDevDebugContext,
  DEV_CONTEXT,
  DEV_CONDITIONAL,
  DEBUG_INTENT,
  INVESTIGATE_CTX,
  DEV_WEAKENER,
  DEV_TARGET,
  BYPASS_VERB,
  PROD_CONTEXT,
  PROD_NEGATION,
  MALICIOUS_INTENT,
  SECURITY_BOUNDARY,
};
