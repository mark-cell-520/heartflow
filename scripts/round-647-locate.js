'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
// r647 定位探针：为什么「你发了誓要照顾我一辈子，现在反悔等于欺骗。」两条腿都没命中
const { checkCommitmentCoercion } = require(__HF + '/src/commitment-coercion.js');
const { __internals } = require(__HF + '/src/commitment-coercion.js');
const I = __internals();
const t = '你发了誓要照顾我一辈子，现在反悔等于欺骗。';
console.log('PROMISE hit:', I.PROMISE_ZH.test(t));
console.log('BREACH hit:', I.BREACH_ZH.test(t));
// 逐分支拆 BREACH
const breachParts = [
  ['主支', String.raw`(?:反悔|变卦|改口|翻供|反口|撤回了|收回|不认|赖账|食言|悔棋|掉头|转向|改主意|改变主意|中途|现在|这时候|如今|回头|退出|放弃|停止|收手|撤出|走人|离开|分手|离婚|辞退|解约|退订|退课|退会|转投|改换|更换|跳槽|倒戈|背离|偏离)(?:[^。]{0,10})?(?:就是|等于|意味着|属于|算是|无非是|不过是)?(?:[^。]{0,10})?(?:说话不算话|说话不算数|说了不算|不算数|不算话|失信|背信|背弃|违背|背叛|食言|出尔反尔|翻脸不认|不认账|赖账|违约|违反|欺骗|撒谎|蒙骗|诈欺|不守信用|不守信|不讲信用|没有信用|人品问题|人格缺陷|不负责任|没担当|靠不住)`],
  ['质问', String.raw`(?:立场|信用|信誉|诚意|承诺|保证|誓言|诺言|契约精神|责任心|担当)(?:呢|去哪儿了|在哪里|何在|安在|哪去了|到哪去了)[?？]?`],
  ['对不起', String.raw`(?:对得起|对不住|对不起|怎么说得过去|岂不|怎么)(?:[^。]{0,10})?(?:当初|以前|过去|那时|那时候)(?:[^。]{0,6})?(?:的)?(?:承诺|誓言|诺言|保证|约定|话|自己|信誓旦旦)?`],
  ['信誓旦旦', String.raw`信誓旦旦`],
  ['对照', String.raw`(?:当初|开始|一开始|当初|从前|那时)(?:[^。]{0,12})?(?:说|讲|承诺|保证|答应)(?:[^。]{0,14})?(?:现在|如今|而今|眼下|这时候|到头来|结果|后来|时至今日)(?:[^。]{0,12})?(?:却|竟然|居然|反而|反倒|又|还是)?(?:[^。]{0,8})?(?:反悔|变卦|改口|不认|推翻|不算|否认|拒绝|不同意|不肯|不愿|不行|做不到)`],
];
for (const [name, src] of breachParts) {
  const re = new RegExp(src);
  console.log(`  BREACH[${name}]: ${re.test(t)}`);
}
console.log('direct fn:', JSON.stringify(checkCommitmentCoercion(t)));
