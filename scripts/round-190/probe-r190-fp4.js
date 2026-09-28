// 手工复算 _securityIsVerbObject 的两条分支（注掉 是否在动词表）
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const S = '为方便调试，先在配置里把鉴权中间件注掉';
const VERB_OBJ_WINDOW = 6;
const VERB_FRONT_WINDOW = 8;
const SECURITY_BOUNDARY = /(?:防火墙|鉴权|认证|授权|审计|沙箱|安全策略|安全机制|身份验证|安全警告|安全检查|权限校验|权限检查|访问控制|越权|脱裤|脱库|入侵|渗透|提权|firewall|auth|audit|sandbox|security|access\s+control)/i;

// 原动词表（无 注掉/注释）
const verbsOld = /(?:绕过|规避|跳过|忽略|关闭|关掉|关了|关一?下|禁用|停用|停掉|屏蔽|去掉|去除|bypass|circumvent|skip|ignore)/gi;
// 补 注掉/注释 后的动词表
const verbsNew = /(?:绕过|规避|跳过|忽略|关闭|关掉|关了|关一?下|禁用|停用|停掉|屏蔽|去掉|去除|bypass|circumvent|skip|ignore|注掉|注释)/gi;

function secIsVerbObj(t, verbs) {
  let m;
  while ((m = verbs.exec(t)) !== null) {
    const tail = m.index + m[0].length;
    const after = t.slice(tail, tail + VERB_OBJ_WINDOW);
    if (SECURITY_BOUNDARY.test(after)) return { hit: true, verb: m[0], after };
    const before = t.slice(Math.max(0, m.index - VERB_FRONT_WINDOW), m.index);
    const baIdx = before.search(/[把將]/);
    if (baIdx >= 0 && SECURITY_BOUNDARY.test(before.slice(baIdx))) return { hit: true, verb: m[0], before: before.slice(baIdx) };
  }
  return { hit: false };
}
console.log(JSON.stringify({ old: secIsVerbObj(S, verbsOld), new: secIsVerbObj(S, verbsNew) }));
