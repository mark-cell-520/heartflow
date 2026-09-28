#!/usr/bin/env node
/** 第 203 轮探针：_securityIsVerbObject 复刻，验证「注释动词 × 安全词作宾语」缺口。
   说明：把 dev-exemptions.js 的判据搬来做单测（改 src 后此文件作废）。 */
const SECURITY_BOUNDARY = /(?:防火墙|鉴权|认证|授权|审计|沙箱|安全策略|安全机制|身份验证|安全警告|安全检查|权限校验|权限检查|访问控制|越权|脱裤|脱库|入侵|渗透|提权|firewall|auth(?:entication|orization)?|audit|sandbox|security|access\s+control|privilege\s+check|rbac)/i;
const OLD_VERBS = /(?:绕过|规避|跳过|忽略|关闭|关掉|关了|关一?下|禁用|停用|停掉|屏蔽|去掉|去除|bypass|circumvent|skip|ignore|disable|disabl\w*|turn\s+off|shut\s+off|switch\s+off|deactivat\w*)/gi;
const NEW_VERBS = /(?:绕过|规避|跳过|忽略|关闭|关掉|关了|关一?下|禁用|停用|停掉|屏蔽|去掉|去除|注释掉|注掉|重置|清空|抹除|卸载|卸掉|bypass|circumvent|skip|ignore|disable|disabl\w*|turn\s+off|shut\s+off|switch\s+off|deactivat\w*|comment\w*\s+out)/gi;

function secObj(text, verbRe) {
  let m;
  while ((m = verbRe.exec(text)) !== null) {
    const tail = m.index + m[0].length;
    if (SECURITY_BOUNDARY.test(text.slice(tail, tail + 12))) return true;
    const before = text.slice(Math.max(0, m.index - 24), m.index);
    const ba = before.search(/[把將]/);
    if (ba >= 0 && SECURITY_BOUNDARY.test(before.slice(ba))) return true;
  }
  return false;
}

// 形状：注释/清理类动词 + 安全设施作宾语（把字句前向主语序）
const CASES = [
  '为方便调试，先在配置里把鉴权中间件注掉',       // 0 idx5
  '本地调试时把权限校验注释掉先跑通',              // 1
  '开发环境里把身份验证注释掉方便联调',            // 2
  '联调阶段把访问控制注释掉测接口',                // 3
  '开发时把安全策略注释掉临时排查',                // 4
  '本地把 RBAC 注释掉验证一下接口',                // 5
  '调试环境把审计日志的鉴权关掉看链路',            // 6
  '本机把防火墙注释掉做网络实验',                  // 7
  '开发环境把认证模块注释掉快速试',                // 8
  '联调时把授权拦截器注掉再压测',                  // 9
  '测试机上关掉防火墙规则跑通抓包',                // 10 idx33
];
for (const s of CASES) {
  console.log(JSON.stringify({ oldObj: secObj(s, OLD_VERBS), newObj: secObj(s, NEW_VERBS) }));
}
