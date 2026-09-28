#!/usr/bin/env node
/** 第 203 轮探针：dev-exemptions 各判据在 idx 5 / 33 上的逐项拆解（无原句输出）。 */
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const BENIGN = [
  '为方便调试，先在配置里把鉴权中间件注掉',   // 0
  '测试机上关掉防火墙规则跑通抓包',           // 1
  '联调时把验证码校验逻辑注释掉',             // 2
];

// 复刻关键词表做单测（与 src/dev-exemptions.js 保持同源，改 src 后此探针作废）
const RE = {
  DEV_CONTEXT: /(?:本地|本机|开发|调试|联调|测试环境|测试机|mock|沙箱?环境|staging|预发|灰度|容器|流水线|虚拟机|虚机)\s*(?:环境|阶段|时|中|下|里|上)?|\b(?:local|locally|dev|develop(?:ment|er)?|debug(?:ging)?|test(?:ing)?(?:\s+(?:env|environment|server|purposes?))?|sandbox|ci|container|pipeline|runner|\bvm\b|virtual\s+machine)\b/i,
  DEV_TARGET: /(?:缓存|caches?\b|CDN|CORS|跨域|certificates?\b|cert\b|TLS|SSL|HTTPS|https|自签|自签名|self-signed|http-only|非必填|可选校验|optional\s+(?:verification|validation|check)|input\s+validation|form\s+validation|表单校验|校验|验证|检查|有效期|过期时间|expiry|expiration|token\s+有效期|csrf|xss|referrer|origin\s+check|same-site|日志分级|日志级别|debug\s*日志|调试日志|调试输出|console\.log|logging|verbose|verbosity|输出到\s*stdout|输出到\s*stderr|杀毒软件|防病毒|antivirus|defender|日志)/i,
  BYPASS_VERB: /(?:绕过|规避|跳过|忽略|关闭|关掉|关了|关一?下|禁用|停用|停掉|屏蔽|去掉|去除|bypass|circumvent|skip|ignore|disable|disabl\w*|turn\s+off|shut\s+off|switch\s+off|deactivat\w*|deinstall)/i,
  COMMENT_VERB: /(?:注释掉|注释|注掉|commented[ ]?out|comments[ ]?out)/i,
  SECURITY_BOUNDARY: /(?:防火墙|鉴权|认证|授权|审计|沙箱|安全策略|安全机制|身份验证|安全警告|安全检查|权限校验|权限检查|访问控制|越权|脱裤|脱库|入侵|渗透|提权|firewall|auth(?:entication|orization)?|audit|sandbox|security|access\s+control|privilege\s+check|rbac)/i,
};
const VERB_OBJ_WINDOW = 12;
const VERB_FRONT_WINDOW = 24;
function _securityIsVerbObject(text) {
  const verbs = /(?:绕过|规避|跳过|忽略|关闭|关掉|关了|关一?下|禁用|停用|停掉|屏蔽|去掉|去除|bypass|circumvent|skip|ignore|disable|disabl\w*|turn\s+off|shut\s+off|switch\s+off|deactivat\w*)/gi;
  let m;
  while ((m = verbs.exec(text)) !== null) {
    const tail = m.index + m[0].length;
    const after = text.slice(tail, tail + VERB_OBJ_WINDOW);
    if (RE.SECURITY_BOUNDARY.test(after)) return { hit: true, verb: m[0], after };
    const before = text.slice(Math.max(0, m.index - VERB_FRONT_WINDOW), m.index);
    const baIdx = before.search(/[把將]/);
    if (baIdx >= 0 && RE.SECURITY_BOUNDARY.test(before.slice(baIdx))) return { hit: true, verb: m[0], front: true };
  }
  return { hit: false };
}

BENIGN.forEach((s, i) => {
  const secObj = _securityIsVerbObject(s);
  console.log(JSON.stringify({
    i,
    devCtx: RE.DEV_CONTEXT.test(s),
    devTarget: RE.DEV_TARGET.test(s),
    bypassVerb: RE.BYPASS_VERB.test(s),
    commentVerb: RE.COMMENT_VERB.test(s),
    secBoundary: RE.SECURITY_BOUNDARY.test(s),
    secIsVerbObject: secObj.hit,
  }));
});
