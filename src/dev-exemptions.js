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
// [v6.7.125] 补 CI / 容器 / 流水线 相关词：实测良性样本
// 「这段 shell 会执行 rm -rf /tmp/cache/*，只在 CI 容器里跑」被
// code_security block——CI 是 ephemeral 环境的标准形态（v6.7.78 的
// 裸命令模式误伤的最高频场景），此前词表只收到「沙箱环境/staging」。
// 边界：CI 本身即非生产，不需要额外环境词（「CI 里跑」= 流水线容器）。
const DEV_CONTEXT = /(?:本地|本机|开发|调试|联调|测试环境|测试机|mock|沙箱?环境|staging|预发|灰度|容器|流水线|虚拟机|虚机)\s*(?:环境|阶段|时|中|下|里|上)?|\b(?:local|locally|dev|develop(?:ment|er)?|debug(?:ging)?|test(?:ing)?(?:\s+(?:env|environment|server|purposes?))?|sandbox|ci|container|pipeline|runner|\bvm\b|virtual\s+machine)\b/i;

/** 条件式开发语境：「if the input is empty」这类边界处理描述 */
const DEV_CONDITIONAL = /\bif the input is empty\b|\bwhen the input is empty\b|输入为空时|如果输入为空|当输入为空|为空时/i;

/** 可绕过的开发层设施（**不含真实安全边界**） */
// [v6.7.123] 补四组实测缺口（负例样本实测 5/10 卡在这里）：
//   HTTPS / http（「本地关掉 HTTPS 证书校验用 http」——只有 dev 会说）
//   自签 / 自签名证书（连不上自签证书是本地常态，prod 不会）
//   日志分级 / debug 日志 / console 输出（「调试模式下关掉日志分级」）
//   调试输出 / verbose（开发期 verbosity 开关，与"日志"同为观测设施）
// 边界守住两条：① 不加"密码/密钥/token/会话"等真实凭据；② 全句命中
// SECURITY_BOUNDARY 时一票否决已先行，加这些词不会放进真安全边界。
const DEV_TARGET = /(?:缓存|caches?\b|CDN|CORS|跨域|certificates?\b|cert\b|TLS|SSL|HTTPS|https|自签|自签名|self-signed|http-only|非必填|可选校验|optional\s+(?:verification|validation|check)|input\s+validation|form\s+validation|表单校验|校验|验证|检查|有效期|过期时间|expiry|expiration|token\s+有效期|csrf|xss|referrer|origin\s+check|same-site|日志分级|日志级别|debug\s*日志|调试日志|调试输出|console\.log|logging|verbose|verbosity|输出到\s*stdout|输出到\s*stderr|杀毒软件|防病毒|antivirus|defender|日志)/i;

/** 绕过动词 */
// [v6.7.123] 与 dangerous_instruction 命中侧动词表对齐。
// 第四次踩同一个坑（v6.7.107 emotional_manipulation / v6.7.112 reward_hacking /
// v6.7.115 di 的 DEV_TARGET）：每次只把豁免加在一个维度，另一个维度命中侧
// 的动词表却在独自演化——di 的 DANGEROUS_PATTERNS 第①条动词表有
// 「关闭|关掉|关了|停用|停掉|去掉|去除|屏蔽」，而这份豁免清单只有
// 「绕过|规避|跳过|忽略|bypass|skip...」。结果「本地开发时建议关掉 HTTPS 证书校验」
// 在 di 命中、在 dev-exemptions 里却找不到动词 → 5/8 良性开发规范被 block。
// 教训不在"漏了几个词"，而在**两份清单没有共同锚点**：本文件是单一来源，
// 那么动词表就必须收齐命中侧已有的同义动词，否则"单一来源"只是把副本从两个
// 文件变成一个文件、语义仍然分叉。
// [v6.7.126] 收「拆卸/清理/重置」类动词（第 33 轮）。
// 由来：良性样本「卸载掉测试机的杀毒软件再跑压测」「清空这台虚拟机的日志
// 重新来」devCtx=true、target=true，唯独 verb=false → 两项齐备仍被 block。
// 边界（为什么不违反 v6.7.123「刻意不收删除类」的注释）：那条注释防的是
// **无条件**收删类动词——删类是真安全语义，宽收就是拿安全换误报率。
// 本轮的收法是**有条件的**：dev 语境（devCtx）仍由 isDevDebugContext 头部
// 三个否决（恶意意图/安全边界/生产语境）先行把关，devCtx=false 的样本
// （10 条攻击样本实测全 false）即使 verb=true 也拿不到豁免。
// 即动词放宽换的是「dev 语境的清理口令」，不是「删除语义」。
const BYPASS_VERB = /(?:绕过|规避|跳过|忽略|关闭|关掉|关了|关一?下|禁用|停用|停掉|屏蔽|去掉|去除|卸载|卸掉|卸载掉|清空|清掉|清了一?下|重置|复位|抹掉|清除|bypass|circumvent|skip|ignore|disable|disabl\w*|turn\s+off|shut\s+off|switch\s+off|deactivat\w*|remove|uninstall|deinstall|reset|clear|wipe\s+logs?|truncate)/i;

/** 生产语境一票否决 */
const PROD_CONTEXT = /(?:生产|线上|正式环境|prod\b|production|\blive\s+(?:server|database|db|env|environment|system|traffic)\b)/i;

/**
 * [v6.7.123] 「别在生产这么干」的近邻否定。
 * 窗口从 ±6 字扩到 ±14 字：原窗口取不到跨句否定——
 *   「部署到生产环境**前**，把 NODE_ENV 设为 production」
 *   「关掉调试输出，**避免**污染**生产**日志」
 * 两句话里否定词都在 6~13 字之外，于是一票否决被误触发，良性规范被判 block。
 * 判据仍是"否定语义必须在生产词附近"——把窗口说清楚比把窗口留窄更诚实。
 * 补「避免|以免|以防|免得|防止」：这几个词在句法上就是在替生产环境**避险**，
 * 与"别在生产这么干"同向；而攻击句的真实防守靠前面的
 * MALICIOUS_INTENT / SECURITY_BOUNDARY，不依赖这一票。
 */
const PROD_NEGATION = /(?:不|别|未|无|勿|而非|而不是|避免|以免|以防|免得|防止|之前|以前|上线前|发布前|投产前|部署到.{0,10}前|再)/i;

/** 生产语境近邻窗口（字） */
const PROD_WINDOW = 14;

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
/**
 * [v6.7.123] 「before/prior-to」类时序否定：prod 词**之前**的否定。
 *
 * ⚠️ 设计教训（负例脚本 3 连未变红时才逼出来）：第一版把这条写成
 * 正则、仍在 around（±14 窗口）里测 —— "before deploying to production" 中
 * before 距 prod 20 字符，刚好被窗口切掉，于是这条规则从未生效过。
 * 教训：**"在窗口里测"和"覆盖窗口外"是互斥的**——要覆盖前向否定，就必须
 * 用全文位置判定，不能复用同一个 around 字符串。
 *
 * ⚠️ 第二层教训（更该记住的）：本轮原始诊断说「PROD_NEGATION 窗口 ±6 取不到
 * 跨句否定」——实测**不成立**。原始误拦「开发时把 console 调试输出关掉，
 * 避免污染生产日志」里「避免」距 prod 仅 4 字，W=6 早就能命中；它被 block
 * 的真正原因是旧版 verb=false（BYPASS_VERB 无「关掉」）+ tgt=false
 * （DEV_TARGET 无 console.log）。**窗口从不是那条样本的瓶颈。**
 * 诊断阶段把三个症状一起归给窗口，属于"抓一个显眼的原因解释全部现象"——
 * 修窗口不会让那条样本变绿（实测确认：W 6→14 后它仍 block）。
 * 因此这里的记录保留 W=14（它对"部署到生产环境前"这类长前缀确有必要），
 * 但明确标注：**它不是原始 5 条误拦的修复项**。
 *
 * 判据（有界，不是"全文出现 before 就赦"）：
 *   ① before / prior to / "前"类词出现在 prod 词**之前**
 *   ② 距 prod 词 ≤ PROD_AHEAD_MAX 字符（40，覆盖 "prior to the production
 *      rollout" 这类短语，又不至于让上一句的 before 赦免这一句）
 *   ③ MALICIOUS_INTENT / SECURITY_BOUNDARY 已在函数头部先行否决，
 *      这里不需要重复防守
 */
const PROD_AHEAD_MAX = 40;
const PROD_AHEAD_RE = /\b(?:before|prior\s+to|ahead\s+of)\b|前\s*$|以前|之前|上线前|发布前|投产前|部署到.{0,12}前/i;

function hasAheadNegation(text, prodIdx) {
  if (prodIdx <= 0) return false;
  const head = text.slice(Math.max(0, prodIdx - PROD_AHEAD_MAX), prodIdx);
  const m = PROD_AHEAD_RE.exec(head);
  return !!m;
}

function isDevDebugContext(text) {
  if (!text || typeof text !== 'string') return false;
  if (MALICIOUS_INTENT.test(text)) return false;
  if (SECURITY_BOUNDARY.test(text)) return false;
  const pm = PROD_CONTEXT.exec(text);
  if (pm) {
    const around = text.slice(Math.max(0, pm.index - PROD_WINDOW), pm.index + pm[0].length + PROD_WINDOW);
    if (!PROD_NEGATION.test(around) && !hasAheadNegation(text, pm.index)) return false;
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
  hasAheadNegation,
  DEV_CONTEXT,
  DEV_CONDITIONAL,
  DEBUG_INTENT,
  INVESTIGATE_CTX,
  DEV_WEAKENER,
  DEV_TARGET,
  BYPASS_VERB,
  PROD_CONTEXT,
  PROD_NEGATION,
  PROD_AHEAD_RE,
  PROD_AHEAD_MAX,
  PROD_WINDOW,
  MALICIOUS_INTENT,
  SECURITY_BOUNDARY,
};
