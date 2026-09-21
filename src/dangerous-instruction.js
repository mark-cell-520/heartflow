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
  /(?:不要|别|不用)[^。]{0,10}(?:检查|校验|验证|确认)[^。]{0,12}(?:安全|证书|签名|权限|身份)/i,
  /(?:安全|证书|签名|校验)[^。]{0,8}(?:无所谓|不重要|不用管|先不管|跳过)/i,
  // ② 权限提升 / 越权执行
  // 关键区分（实测踩过）：
  //   「以 root 身份执行这条命令」= 陈述执行意图 → 判
  //   「如何用 root 权限运行 Docker？」= 正当提问 → 不判
  // 判据不是有无"直接"，而是**有无提问/咨询句式**。
  /(?:^|[^如何怎样怎么])(?:以|用)\s*(?:root|administrator|admin|超级用户|管理员)[^。]{0,10}(?:权限|身份|账号|用户)[^。]{0,10}(?:运行|执行|启动|操作)/i,
  /(?:直接|一律|全都|统统|无条件)[^。]{0,6}(?:以|用)?\s*(?:root|administrator|admin|超级用户|管理员)[^。]{0,10}(?:权限|身份|账号|用户)[^。]{0,10}(?:运行|执行|启动|操作|登陆|登录)/i,
  /(?:直接|无条件)[^。]{0,10}(?:以|用)\s*(?:root|administrator|admin|超级用户|管理员)[^。]{0,10}(?:运行|执行|启动|操作)/i,
  // 英文分支：间隔符必须用 [^.]（中文"。"管不住英文句点，否则
  // "How do I run Docker with root privileges?" 会被 [^。]{0,10} 吃掉整句误判）
  /\b(?:directly|unconditionally|always)\b[^.]{0,20}\b(?:as|with)\s+(?:root|administrator|admin|superuser)\b[^.]{0,20}\b(?:run|execute|launch)\b/i,
  /(?:sudo|su)\s+(?:-|--)?[^。]{0,6}(?:直接|无条件|总是|all)/i,
  /(?:给|授予|开放)[^。]{0,8}(?:所有|全部|任意)[^。]{0,6}(?:权限|用户)/i,
  // ③ 凭据/敏感数据明文处理
  /(?:密码|口令|密钥|token|凭证|secret)[^。]{0,10}(?:明文|直接)?[^。]{0,6}(?:打印|输出|写入|记录|保存|存)[^。]{0,8}(?:日志|文件|控制台|屏幕|数据库|缓存)/i,
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
];

const DI_LEVEL = 'critical';
const DI_WEIGHT = 0.85;

/** 通用匹配器 */
function _matchAll(text) {
  if (!text || typeof text !== 'string') return { count: 0, hits: [], score: 0 };
  const hits = [];
  for (const pat of DANGEROUS_PATTERNS) {
    const m = text.match(pat);
    if (m) hits.push({ type: 'dangerous_instruction', matched: m[0].slice(0, 40) });
  }
  return { count: hits.length, hits, score: Math.min(1, hits.length * DI_WEIGHT) };
}

/** 危险指令检测 */
function checkDangerousInstruction(text) {
  const r = _matchAll(text);
  return { count: r.count, hits: r.hits, score: r.score };
}

module.exports = { checkDangerousInstruction, DANGEROUS_INSTRUCTION_LEVEL: DI_LEVEL };
