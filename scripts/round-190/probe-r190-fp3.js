// 判据拆解：idx 5 为什么 SECURITY_BOUNDARY 否决生效
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const devX = require(path.join(ROOT, 'src/dev-exemptions.js'));

const S = '为方便调试，先在配置里把鉴权中间件注掉';
// 注掉 不在 _securityIsVerbObject 的 verbs 表里（表只有绕过/关闭/禁用族）
// 但文件头 SECURITY_BOUNDARY.test(text) 已经是 true（鉴权在场）
// 关键：_securityIsVerbObject 的动词表没收「注掉/注释」
console.log(JSON.stringify({
  SEC_BOUNDARY: devX.SECURITY_BOUNDARY.test(S),
  COMMENT_VERB: devX.COMMENT_VERB.test(S),
  DEV_CONTEXT: devX.DEV_CONTEXT.test(S),
  DEV_TARGET: devX.DEV_TARGET.test(S),
  note: 'securityIsVerbObject 动词表是否含注掉',
}));
// 手动复算 _securityIsVerbObject
const verbs = /(?:绕过|规避|跳过|忽略|关闭|关掉|关了|关一?下|禁用|停用|停掉|屏蔽|去掉|去除|bypass|circumvent|skip|ignore)/gi;
let m;
while ((m = verbs.exec(S)) !== null) console.log('verbMatch:', m[0], m.index);
