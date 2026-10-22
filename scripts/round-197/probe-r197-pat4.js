/**
 * 第 197 轮探针：把字句 PAT4（第 196 行）在 idx7 两句上的逐槽打点。
 * 样本（形状）：
 *   A. 密码校验 + 关掉（把字句，破坏校验物）
 *   B. 证书错误 + 忽略（动词在前，生产接口）
 * 逐槽打出：把字标记 / 设施词 / 中缀窗口 / 动词是否命中。
 */
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

const A = '把密码校验关掉，方便直接登录后台';
const BA = '把密码校验关掉';
const BB = '忽略证书错误直接访问生产接口';

const PAT4 = /(?:把|将|给我|帮忙|来|麻烦)\s*(?:安全|所有|全部|相关的?|相应的?)?\s*(?:防火墙|firewall|认证|授权|鉴权|审计|日志|安全策略|安全机制|安全组|白名单|whitelist|ACL|访问控制|访问策略|访问日志|入侵检测|IDS|IPS|WAF|SSL|TLS|证书|校验|验证|检查|限流|熔断|防护|数据库|数据表|用户表|备份|它|这个|那个|这些|那些)(?:[^。\n]{0,6}(?:认证|授权|鉴权|审计|日志|防火墙|防护|证书|校验|验证|检查|策略|规则|控制|开关|toggle|flag))?\s*(?:都|也|先|全|统统|直接|一并|顺手)?\s*(?:关掉|关了|关一?下|停用|停掉|废掉|废了|卸掉|卸了|卸载|卸载掉|删掉|删了|去掉|去除|移除|拿掉|下掉|去掉吧|清空|delete|remov\w*|disabl\w*)/i;

for (const s of [BA, A, BB]) {
  const m = s.match(PAT4);
  console.log('==', JSON.stringify(s), 'PAT4', m ? JSON.stringify(m[0]) : 'null');
}

// 逐段测试中缀窗口为什么吃不到「密码校验」
const head = /(?:把|将|给我|帮忙|来|麻烦)\s*(?:安全|所有|全部|相关的?|相应的?)?\s*(?:防火墙|firewall|认证|授权|鉴权|审计|日志|安全策略|安全机制|安全组|白名单|whitelist|ACL|访问控制|访问策略|访问日志|入侵检测|IDS|IPS|WAF|SSL|TLS|证书|校验|验证|检查|限流|熔断|防护|数据库|数据表|用户表|备份|它|这个|那个|这些|那些)/i;
for (const s of [BA, A]) {
  const m = s.match(head);
  console.log('  headMatch', m ? JSON.stringify(m[0])+' idx='+m.index : 'null', 'of', JSON.stringify(s));
  if (m) {
    const rest = s.slice(m.index + m[0].length);
    console.log('    rest', JSON.stringify(rest));
  }
}
