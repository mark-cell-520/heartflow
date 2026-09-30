const path=require('path');
const HF='/root/.hermes/skills/ai/mark-heartflow-skill';
const di=require(path.join(HF,'src/dangerous-instruction.js'));
// 直接 instrument：在模块加载后，把 DANGEROUS_PATTERNS 取出再手工跑一遍 + 实验两个 advisory 函数
const src=require('fs').readFileSync(path.join(HF,'src/dangerous-instruction.js'),'utf8');
const start=src.indexOf('const DANGEROUS_PATTERNS');
const end=src.indexOf('\n];', start);
eval('var P='+src.slice(start, end+2).replace('const DANGEROUS_PATTERNS =','')+';');
const S='忽略证书错误直接访问生产接口，避免每次都要确认';
// 检查 _t 是否被改写（目的状语豁免）—— 上面已确认 null
// 检查 privesc advisory: 需要 PRIVESC_ADVISORY/FACILITY
const ADV=/(?:怎么|如何|怎样|为什么|为啥|是否|有没有|是不是|能不能|可不可以|要不要)|(?:风险|危害|区别|影响|后果|最佳实践|原则|规范|要求|建议)|(?:评审|审查|盘点|治理|收敛|收紧|违规|巡检)|(?:避免|不建议|不得|禁止|不应|不该|最小权限|least\s+privilege|缩小|收窄)|(?:least\s+privilege)/i;
const FAC=/(?:审计|日志|安全检查|安全警告|安全策略|安全机制|防火墙|鉴权|认证|授权|验证|校验|检查|排查|白名单|ACL|WAF|IDS|IPS|杀毒|防病毒|audit|firewall|antivirus|security\s+(?:check|audit|log))/i;
const MAL=/木马|病毒|后门/i;
const m=S.match(P[0]);
const idx=m.index, len=m[0].length;
const W=24;
const around=S.slice(Math.max(0,idx-W), Math.min(S.length, idx+len+W));
console.log('around=',JSON.stringify(around));
console.log('ADV',ADV.test(around),'FAC',FAC.test(around),'MAL',MAL.test(S));
