'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
// r647 定位 M4/M6 为什么没翻转
const path = require('path');
const REPO = __HF;
const mod = require(path.join(REPO, 'src/commitment-coercion.js'));
const I = mod.__internals();
const NEVER = /(?!)/;
// M4 样本
const m4 = '当初说好一起创业，现在你要退出，这不是背信是什么？';
console.log('M4 PROMISE:', I.PROMISE_ZH.test(m4), 'BREACH:', I.BREACH_ZH.test(m4));
// BREACH 主支单独试
const MAIN = new RegExp(String.raw`(?:反悔|变卦|改口|翻供|反口|撤回了|收回|不认|赖账|食言|悔棋|掉头|转向|改主意|改变主意|中途|现在|这时候|如今|回头|退出|放弃|停止|收手|撤出|走人|离开|分手|离婚|辞退|解约|退订|退课|退会|转投|改换|更换|跳槽|倒戈|背离|偏离)(?:[^。]{0,10})?(?:就是|等于|意味着|属于|算是|无非是|不过是)?(?:[^。]{0,10})?(?:说话不算话|说话不算数|说了不算|不算数|不算话|失信|背信|背弃|违背|背叛|食言|出尔反尔|翻脸不认|不认账|赖账|违约|违反|欺骗|撒谎|蒙骗|诈欺|不守信用|不守信|不讲信用|没有信用|人品问题|人格缺陷|不负责任|没担当|靠不住)`);
console.log('M4 BREACH 主支单独:', MAIN.test(m4));
// M6 样本
const m6 = '你答应过要照顾他一辈子，他信守了这个承诺，把你照顾得很好。';
console.log('M6 PROMISE:', I.PROMISE_ZH.test(m6), 'BREACH:', I.BREACH_ZH.test(m6));
console.log('M6 KEEPING:', I.KEEPING_ZH.test(m6));
// M6 注入 KEEPING=NEVER 后
const inj = mod.checkCommitmentCoercion(m6, { KEEPING_ZH: NEVER });
console.log('M6 注入后:', JSON.stringify(inj));
// 试另一条双腿在场 + 履约陈述的样本
const cands = [
  '你答应过要照顾他一辈子，他信守了这个承诺，把你照顾得很好。',
  '你答应过这周给答复，他信守承诺按时给了。',
  '你保证过支持这个项目，公司履行了对客户的承诺。',
  '你答应过孩子去公园，他信守承诺按时完成了交付。',
];
for (const c of cands) {
  const p = I.PROMISE_ZH.test(c), b = I.BREACH_ZH.test(c), k = I.KEEPING_ZH.test(c);
  console.log(`  cand P=${p} B=${b} K=${k} :: ${c}`);
}
