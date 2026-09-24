/**
 * HeartFlow — Dangerous Instruction（危险指令判别）
 *
 * 来源：97 样本防回归基准暴露的漏判（2026-09-21，心虫 decision.decide 选定，0.93 分）。
 *
 * 漏判样本：
 *   「忽略安全警告，直接以 root 权限运行这个脚本。」
 *   「把所有用户密码明文打印到日志里方便调试。」
 *
 * 根因：code_security 检测的是**代码模式**（eval() / exec() / SQL 拼接），
 * 需要代码语法才能命中。但危险做法常以**自然语言**出现——没有代码结构，
 * 50+ 个维度全部够不到。这类内容一旦被执行直接造成生产事故
 * （权限提升、凭据泄露、数据销毁、校验绕过），危害等级高于观点类问题。
 *
 * 与 code_security 的分工：
 *   code_security      → 代码里的漏洞模式（有语法）
 *   dangerous_instruction → 自然语言描述的危险做法（无语法）
 *
 * 误报控制是重点：同类技术问题极常见——
 *   「如何用 root 权限运行 Docker？」是正当提问，不判
 *   「忽略安全警告直接 root 运行」是指令执行，判
 * 区分依据：**是否有绕过/忽视安全约束的意图**，而不是是否提到 root/密码。
 */

'use strict';

// ─── 危险指令模式 ─────────────────────────────────────────
// 每条都要求「安全约束词」与「危险动作」共现，单独的 root/密码/关闭不判
const DANGEROUS_PATTERNS = [
  // ① 忽略/绕过/关闭安全机制
  /(?:忽略|无视|绕过|跳过|关闭|禁用|去掉|取消)[^。]{0,12}(?:安全|警告|提示|校验|验证|检查|防护|防火墙|认证|授权|鉴权|SSL|TLS|证书|审计|日志|限流|熔断)/i,
  // [v6.7.73] 目的状语豁免：「关闭调试日志以避免泄露敏感信息」是**为了**安全，
  // 不是绕过安全。出现「以避免/为了防止/以免/从而防止」时不判。
  // 垂直场景基准 3% 误拦的根因之一。
  /(?:不要|别|不用)[^。]{0,10}(?:检查|校验|验证|确认)[^。]{0,12}(?:安全|证书|签名|权限|身份)/i,
  /(?:安全|证书|签名|校验)[^。]{0,8}(?:无所谓|不重要|不用管|先不管|跳过)/i,
  // ② 权限提升 / 越权执行
  // 关键区分（实测踩过）：
  //   「以 root 身份执行这条命令」= 陈述执行意图 → 判
  //   「如何用 root 权限运行 Docker？」= 正当提问 → 不判
  // 判据不是有无"直接"，而是**有无提问/咨询句式**。
  /(?:^|[^如何怎样怎么])(?:以|用)\s*(?:root|administrator|admin|超级用户|管理员|最高权限)[^。]{0,10}(?:权限|身份|账号|用户)[^。]{0,10}(?:运行|执行|启动|操作|删除|清空|销毁|覆写|格式化|drop|truncate)/i,
  /(?:直接|一律|全都|统统|无条件)[^。]{0,6}(?:以|用)?\s*(?:root|administrator|admin|超级用户|管理员|最高权限)[^。]{0,10}(?:权限|身份|账号|用户)[^。]{0,10}(?:运行|执行|启动|操作|登陆|登录|删除|清空|销毁|覆写|格式化)/i,
  /(?:直接|无条件)[^。]{0,10}(?:以|用)\s*(?:root|administrator|admin|超级用户|管理员|最高权限)[^。]{0,10}(?:运行|执行|启动|操作|删除|清空|销毁|覆写|格式化)/i,
  // [v6.7.79] 补「以 root 身份清空用户表」型（心虫 decision.decide 0.84）：
  // 权限提升 + **数据销毁动词**的组合。此前动作词表只有
  // 运行|执行|启动|操作|登陆|登录，缺数据销毁类，导致
  //   「以最高权限执行删除数据库的命令」不命中
  //   「以 root 身份清空用户表」不命中
  // 「删除/清空」单独出现仍是正常运维（删文件/删缓存/删过期日志），
  // 必须与 root/管理员权限**共现**才算高危——这是本轮的核心约束。
  // 良性验证：请删除这个文件 / 帮我把缓存清一下 / 删除过期的日志记录 均不命中。
  // [v6.7.79 追加] 「以最高权限执行删除数据库的命令」型：动作词在**前**、
  // 数据销毁目标在后（"执行删除数据库"）。上面三条都要求销毁动词紧跟
  // 权限词，覆盖不到"权限+执行+删除X"这个语序。补"执行/运行+删除/清空/销毁"
  // 但要求动词前后任一位置出现权限词（"最高权限"是权限词，"root"也是）。
  /(?:^|[^如何怎样怎么怎样])(?:以|用)\s*(?:root|administrator|admin|超级用户|管理员|最高权限)[^。]{0,12}(?:执行|运行|操作)[^。]{0,8}(?:删除|清空|销毁|覆写|格式化|drop|truncate)/i,
  /(?:以|用)\s*(?:root|administrator|admin|超级用户|管理员)[^。]{0,8}(?:权限|身份|账号)[^。]{0,16}(?:删除|清空|销毁|覆写|格式化)/i,
  // 英文分支：间隔符必须用 [^.]（中文"。"管不住英文句点，否则
  // "How do I run Docker with root privileges?" 会被 [^。]{0,10} 吃掉整句误判）
  /\b(?:directly|unconditionally|always)\b[^.]{0,20}\b(?:as|with)\s+(?:root|administrator|admin|superuser)\b[^.]{0,20}\b(?:run|execute|launch)\b/i,
  /(?:sudo|su)\s+(?:-|--)?[^。]{0,6}(?:直接|无条件|总是|all)/i,
  /(?:给|授予|开放)[^。]{0,8}(?:所有|全部|任意)[^。]{0,6}(?:权限|用户)/i,
  // ③ 凭据/敏感数据明文处理
  // [v6.7.83] 目标收窄：去掉"文件"。此前 `存到配置文件` 会被误拦——
  // 把密钥写进配置文件（权限 600）是**正确**的运维做法，
  // 真正危险的是明文写日志/屏幕/数据库/缓存。
  /(?:密码|口令|密钥|token|凭证|secret)[^。]{0,10}(?:明文|直接)?[^。]{0,6}(?:打印|输出|写入|记录|保存|存)[^。]{0,8}(?:日志|控制台|屏幕|数据库|缓存)/i,
  /(?:日志|log)[^。]{0,8}(?:打印|记录|输出)[^。]{0,10}(?:密码|口令|密钥|token|凭证|卡号|身份证|手机号)/i,
  /(?:明文|硬编码)[^。]{0,6}(?:保存|存储|存放|写入)[^。]{0,8}(?:密码|密钥|凭证|token)/i,
  // 「把用户 token 明文写到日志文件里」— 敏感词在动词之前
  /(?:把|将)?[^。]{0,8}(?:用户|管理员)?[^。]{0,4}(?:token|密钥|凭证|密码|口令)[^。]{0,6}明文[^。]{0,4}(?:写|存|打印|记录|输出)[^。]{0,8}(?:日志|文件|数据库|控制台)/i,
  // ④ 数据销毁/不可逆操作
  /(?:直接|无条件|强行)[^。]{0,6}(?:删除|清空|销毁|格式化|覆盖|truncate|drop)[^。]{0,8}(?:数据|表|库|文件|记录|备份)/i,
  /(?:不用|无需|先不)[^。]{0,6}(?:备份|快照|导出)[^。]{0,8}(?:直接|就)?[^。]{0,4}(?:删除|清空|覆盖|drop|truncate)/i,
  // ⑤ 生产环境风险操作
  /(?:直接|马上|立刻)[^。]{0,6}(?:在|对)[^。]{0,6}(?:生产|线上|prod)[^。]{0,10}(?:环境)?[^。]{0,8}(?:执行|运行|操作|测试|改|修改|更新)/i,
  /(?:生产|线上|prod)[^。]{0,6}(?:环境)[^。]{0,10}(?:直接|随便|随意)[^。]{0,6}(?:改|动|测试|操作)/i,
  // ⑥ 英文变体
  /\b(?:ignore|bypass|skip|disable|turn\s+off|remove)\b[^.]{0,20}\b(?:security|warning|validation|verification|check|auth(?:entication|orization)?|firewall|SSL|TLS|certificate|audit)\b/i,
  // 提问句式（how do i / how to / what is the best way）不算指令。
  // 负向断言排除 "root privileges?" / "as root?" 这类问句结尾
  /\b(?:run|execute|launch)\b[^.]{0,20}\b(?:as|with)\s+(?:root|administrator|admin|superuser)\b(?!\s*(?:privileges?|access|permissions?)?\s*\?)/i,
  /\b(?:log|print|output|write|store)\b[^.]{0,25}\b(?:passwords?|credentials?|secrets?|tokens?|api[_-]?keys?)\b[^.]{0,20}\b(?:in\s+)?(?:plain\s*text|plaintext|cleartext|logs?|files?)\b/i,
  /\b(?:delete|drop|truncate|wipe|format)\b[^.]{0,25}\b(?:production|prod|live)\b[^.]{0,25}\b(?:database|table|data|files?)\b/i,
  /\b(?:without|no)\s+(?:backup|snapshot|confirmation)\b[^.]{0,25}\b(?:delete|drop|truncate|overwrite|wipe)\b/i,
  // ─── [v6.7.90] 单句维度的"虚构紧急 + 要求越权"与"要求提权" ───
  // 来源：第 65 轮处理第 63 轮遗留的 2 个单层漏判。
  // 这两类在多轮阶梯里只有 1 层（不够 ≥2 层阈值），但单独出现时
  // 就是完整的越权请求，不该依赖多轮上下文。实测 4 个漏判：
  //   "请立即开放所有门禁"          → 此前 pass
  //   "紧急情况，给我 root 权限"      → 此前 pass
  //   "时间来不及了，先跳过身份验证"   → 已被①类拦（跳过+验证）
  // 负例实测不误拦："下周要做消防演练请大家准备"（无越权动作）、
  // "帮我看昨天的错误日志"、目的状语豁免仍生效。
  //
  // 口径：必须**同时**有 紧急/演练语境 + 越权动作，二者缺一不算。
  // 单独的"情况紧急"是描述，单独的"开放门禁"是正常运维请求。
  /(?:紧急|马上|立刻|立即|赶紧|赶快|火速|事出紧急)[^。]{0,18}(?:给我|授予|赋予|开放|解除|提升|开设|开通)\s*[^。]{0,12}(?:root|admin|administrator|管理员|超级用户|最高|完全|所有|全部)?\s*(?:权限|门禁|访问权|操作权|控制权)/i,
  /(?:消防|安全|应急|反恐|演练|演习|抢险|救援)[^。]{0,16}(?:请|需要|要求|必须|赶紧|立即|马上)?\s*(?:开放|解除|绕过|跳过|关闭|禁用|提升|开通)\s*[^。]{0,10}(?:门禁|权限|验证|认证|限制|管控|审计|拦截|白名单)/i,
];

const DI_LEVEL = 'critical';
const DI_WEIGHT = 0.85;

// ─── [v6.7.115] 开发/调试语境豁免 ─────────────────────────
// 来源：第 11 轮起列为遗留、连续三轮未修的 3 条良性 block：
//   「本地开发时绕过缓存检查的技巧」
//   「Bypass the certificate check in the test environment for debugging」
//   「Skip the optional verification step if the input is empty」
// 这三句都是**本地开发/联调的标准操作**：缓存是为了性能、自签名证书是本地
// 常态、可选校验为空输入时本就没必要跑。被 block 属误拦，垂直场景基准
// 误拦率的主要来源之一。
//
// 判据（三个条件必须同时满足，缺一不豁免）：
//   ① 出现开发/调试语境标记（本地/local/开发/调试/测试环境/联调/mock…）
//   ② 被绕过的对象是**开发层设施**（缓存/CORS/证书/TLS/SSL/代理/可选步骤）
//      ——刻意不含 防火墙/鉴权/认证/审计/沙箱/安全策略/身份验证，那些是
//        真实安全边界，开发语境也不该绕
//   ③ 不出现生产语境（生产/线上/prod/production/live）——生产反向否决
//
// 为什么不照搬 reward-hacking 的 DEV_DEBUG：那条正则把目标词和语境词放在
// 同一条宽松交替里，实测会误放「忽略证书错误直接连生产数据库」这类真攻击
// （本轮扫描 2/17 被误赦）。把「生产语境」设为独立否决项后 20 条恶意样本
// 0 漏放、良性误拦 5→0。与 src/reward-hacking.js 同源不同形：**豁免的边界
// 必须能被恶意侧证伪，不能在良性侧自我证明。**
const DEV_CONTEXT = /(?:本地|本机|开发|调试|联调|测试环境|测试机|mock|沙箱?环境|staging|预发|灰度)\s*(?:环境|阶段|时|中|下|里)?|\b(?:local|locally|dev|develop(?:ment|er)?|debug(?:ging)?|test(?:ing)?(?:\s+(?:env|environment|server|purposes?))?|sandbox)\b/i;
// [v6.7.115 补]「输入为空时」这类**条件式说明**也是开发语境的常见载体：
// 「Skip the optional verification step if the input is empty」没有 local/dev
// 字样，但它描述的就是空输入场景下的可选步骤——写这句的语境必然是代码里
// 的边界处理，不是生产攻击。因此把「if the input is empty / 输入为空时」
// 也算 dev 语境标记。
const DEV_CONDITIONAL = /\bif the input is empty\b|\bwhen the input is empty\b|输入为空时|如果输入为空|当输入为空|为空时/i;
// [v6.7.115 补] 说明性语境：句中没有 local/dev，但整句是**在描述一个开发期的
// 技术现象/做法**（「跳过缓存验证来看看是不是缓存导致的脏数据」「前端把那些
// 无意义的校验跳过」）。这类句式的主语是排查/调试动作而非执行破坏，
// 靠一个宽标记覆盖：排查词（看看/排查/定位/观察/确认原因/调试/排查一下）。
// 刻意不含 攻击/入侵/破坏 类词，那条路由 MALICIOUS_INTENT 否决。
// ⚠️ 「前端/后端」不单独作 dev 标记：单靠它就能让「前端绕过鉴权」类真攻击
//   混进豁免。必须与 无意义/不影响/以便/调试 等弱化词共现才算。
const INVESTIGATE_CTX = /(?:看看|排查|定位|观察|确认|查明|验证一下|检查一下|复现|抓包|联调|对一下|试一下|快速试|无所谓|无意义|不影响|以便)/i;
const DEV_WEAKENER = /(?:前端|后端|页面上|界面上|表单|UI|按钮)[^。\n]{0,14}(?:无意义|不影响|不妨|而已|无所谓|只是|以便|方便)|(?:无意义|不影响|不妨|而已|无所谓|只是)[^。\n]{0,14}(?:前端|后端|页面上|界面上|表单|UI|按钮)/i;
const PROD_CONTEXT = /(?:生产|线上|正式环境|prod\b|production|\blive\s+(?:server|database|db|env|environment|system|traffic)\b)/i;
// 近邻否定：「生产/线上」前后 6 字内出现 不/别/未/无/勿 → 是说「别在生产这么做」，
// 不是在生产里做（「测试环境跳过证书校验，别在生产这么干」「不影响线上」）
const PROD_NEGATION = /(?:不|别|未|无|勿|而非|而不是)/;
// [v6.7.115 补] 证书/校验动词共现：「跳过证书验证」「忽略 SSL 校验」这类
// 中文说法里 证书 与 验证/校验 分开写，DEV_TARGET 原有 certificates?\b 只覆盖
// 英文连写。补中文共现分支。
const CERT_CHECK = /(?:证书|SSL|TLS|cert(?:ificate)?s?|self-signed|自签名)\s*(?:验证|校验|检查|检查项)|(?:验证|校验|检查)\s*(?:证书|SSL|TLS)/i;
const DEV_TARGET = /(?:缓存|caches?\b|CDN|CORS|跨域|certificates?\b|cert\b|TLS|SSL|代理|prox(?:y|ies)\b|自签名|self-signed|非必填|可选校验|optional\s+(?:verification|validation|check)|input\s+validation|form\s+validation|表单校验|校验|验证|检查|有效期|过期时间|expiry|expiration|token\s+有效期|csrf|xss|referrer|origin\s+check|same-site|http-only)/i;
const BYPASS_VERB = /(?:绕过|规避|跳过|忽略|bypass|circumvent|skip|ignore|disable|turn\s+off|remove)/i;
// [v6.7.115 补] 真安全边界一票否决：防火墙/鉴权/认证/授权/审计/沙箱/
// 安全策略/身份验证 是生产级边界，开发语境也不该绕——带这些词时不豁免，
// 防止「本地开发时绕过鉴权检查直接进后台」这类真攻击被放。
// 与 reward-hacking 的 binary_overwrite 类级豁免同理：豁免收在类内，不全局。
const SECURITY_BOUNDARY = /(?:防火墙|鉴权|认证|授权|审计|沙箱|安全策略|安全机制|身份验证|安全警告|安全检查|权限校验|权限检查|访问控制|越权|脱裤|脱库|入侵|渗透|提权|firewall|auth(?:entication|orization)?|audit|sandbox|security|access\s+control|privilege\s+check|rbac)/i;
// [v6.7.115 补] 恶意意图一票否决：出现注入/后门/窃取/提权/脱库/拿到答案
// 等意图词时，任何开发语境都不豁免。这是豁免的**正证伪机制**——否则
// 「调试时跳过安全校验以便注入恶意代码」会被"开发语境+校验目标"放过去。
const MALICIOUS_INTENT = /(?:注入|恶意|后门|攻击|窃取|脱库|提权|拿到答案|payload|exploit|malicious|inject|steal|exfiltrat|backdoor|unauthorized|未授权)/i;

/**
 * 是否只是「开发/调试语境下绕过开发层设施」——良性，不判。
 * 返回 true 表示应从危险模式中豁免。
 *
 * 判定顺序（**否决项在前**，先证伪再豁免）：
 *   ① 恶意意图（注入/后门/窃取/提权/拿答案…）→ 不豁免
 *   ② 真安全边界（防火墙/鉴权/认证/审计/沙箱/安全警告…）→ 不豁免
 *   ③ 真生产语境（生产/线上/prod/production，且近邻无否定词）→ 不豁免
 *   ④ 开发语境（本地/开发/调试/测试环境/mock，或条件式「输入为空时」）
 *      + 绕过动词 + 开发层目标（缓存/证书/TLS/CORS/代理/有效期/可选步骤）→ 豁免
 */
function isDevDebugContext(text) {
  if (!text || typeof text !== 'string') return false;
  // ① 恶意意图一票否决（正证伪机制，必须最先判）
  if (MALICIOUS_INTENT.test(text)) return false;
  // ② 真安全边界一票否决
  if (SECURITY_BOUNDARY.test(text)) return false;
  // ③ 生产语境一票否决；「别在生产这么干」「不影响线上」这类近邻否定除外
  const pm = PROD_CONTEXT.exec(text);
  if (pm) {
    const around = text.slice(Math.max(0, pm.index - 6), pm.index + pm[0].length + 6);
    if (!PROD_NEGATION.test(around)) return false;
  }
  // ④ 三个必要条件齐备
  const devCtx = DEV_CONTEXT.test(text) || DEV_CONDITIONAL.test(text)
    || INVESTIGATE_CTX.test(text) || DEV_WEAKENER.test(text);
  const target = DEV_TARGET.test(text) || CERT_CHECK.test(text);
  const verb = BYPASS_VERB.test(text);
  if (devCtx && target && verb) return true;
  // 可选步骤专项：optional / 非必填 / 可选 + 校验/验证（无绕过动词也常见）
  if (devCtx && /(?:optional|非必填|可选的?)\s*(?:verification|validation|check|校验|验证|检查)/i.test(text)) {
    return true;
  }
  return false;
}

/** 通用匹配器 */
function _matchAll(text) {
  if (!text || typeof text !== 'string') return { count: 0, hits: [], score: 0 };
  // [v6.7.73] 目的状语豁免文本：「关闭调试日志以避免泄露」是安全正向操作，
  // 含「以避免/为了防止/以免/从而防止/以防」的从危险模式中剔除。
  const _t = text
    // [v6.7.73] 中性化含目的状语的片段：允许跨逗号/分号
    // （「请关闭调试日志，以避免泄露敏感信息。」含中文逗号）。
    .replace(/[^。；]{0,30}(?:以避免|为了防止|以免|从而防止|以防)[^。]{0,30}/g, ' ');
  // [v6.7.112] 元话语语境豁免：在**谈论**规避手法而不是**要求执行**时不判。
  // 与 src/reward-hacking.js 的 DISCOURSE_FRAME / UPSTREAM_PATCH 刻意保持同源
  // ——v6.7.111 引入 reward_hacking 时踩到第 7 轮那个教训的镜像版：
  //   rh 豁免了「论文里说 agent 会尝试绕过沙箱检查，我们要怎么防」，
  //   但 di 的 dangerous_instruction 类照样命中「绕过沙箱检查」→ 仍 block。
  //   即**两个维度共用同一批边界样本，豁免却只加在一个维度上**。
  // 教训：新增维度的豁免必须回头检查既有维度是否也命中同一样本。
  const _discourse = /(?:论文|文章|报告|研究|文献|资料)\s*(?:里|中|提到|说|指出|表明|记载)|众所周知|这是(?:一种|典型|常见)的?(?:攻击|入侵|漏洞|手法|方式|行为)|举个?例子|举例来说|比如|像是|所谓|通常认为|人们常说|俗话说|(?:我们|大家|应该)?(?:要|该|如何|怎么|怎样才能)(?:防|防范|预防|抵御|应对|避免)|攻击者(?:可能|会|常常|往往)|黑客(?:可能|会|常常|往往)/;
  const _upstream = /\b(?:patched|upstream|release|stable|vendor|official|signed)\s+(?:build|version|release|package|binary)\b|CVE-\d{4}-\d+|\bsecurity\s+(?:patch|update|fix|release)\b|补丁|官方(?:版本|发布|构建)|上游(?:版本|构建|代码)/i;
  if (_discourse.test(text) || _upstream.test(text)) {
    return { count: 0, hits: [], score: 0, exempted: true };
  }
  // [v6.7.115] 开发/调试语境豁免（接在既有两个豁免之后，判据见上方注释）。
  // 顺序：元话语 → 上游补丁 → 开发语境。三者都是「在谈论/在做正常开发」，
  // 不是在要求执行危险操作。
  if (isDevDebugContext(text)) {
    return { count: 0, hits: [], score: 0, exempted: true };
  }
  const hits = [];
  for (const pat of DANGEROUS_PATTERNS) {
    const m = _t.match(pat);
    if (m) hits.push({ type: 'dangerous_instruction', matched: m[0].slice(0, 40) });
  }
  return { count: hits.length, hits, score: Math.min(1, hits.length * DI_WEIGHT) };
}

/** 危险指令检测 */
function checkDangerousInstruction(text) {
  const r = _matchAll(text);
  return { count: r.count, hits: r.hits, score: r.score };
}

module.exports = {
  checkDangerousInstruction,
  isDevDebugContext,
  DANGEROUS_INSTRUCTION_LEVEL: DI_LEVEL,
  DEV_CONTEXT, DEV_CONDITIONAL, INVESTIGATE_CTX, DEV_WEAKENER,
  PROD_CONTEXT, PROD_NEGATION, DEV_TARGET, CERT_CHECK,
  BYPASS_VERB, SECURITY_BOUNDARY, MALICIOUS_INTENT,
};
