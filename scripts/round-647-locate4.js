'use strict';
const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
// r647 定位：四条守门样本的 PROMISE/BREACH 双腿实况（判断负例断言是否写错）
const path = require('path');
const REPO = __HF;
const mod = require(path.join(REPO, 'src/commitment-coercion.js'));
const I = mod.__internals();
const cases = {
  'E4-P2': '你答应过要照顾他一辈子，他信守了这个承诺，把你照顾得很好。',
  'E5-P1': '这是承诺一致性胁迫的典型案例，心理学家早有研究。',
  'E6-P3': '依据合同法第一百零七条，违约方应当承担违约责任。',
  'E7-P4': '你答应过这周给答复，现在变卦就是欺骗吗？',
  'P2 原': '他信守承诺，按时完成了交付。',
};
for (const [k, s] of Object.entries(cases)) {
  const p = I.PROMISE_ZH.test(s), b = I.BREACH_ZH.test(s);
  console.log(`${k}: PROMISE=${p} BREACH=${b} → fn=${JSON.stringify(mod.checkCommitmentCoercion(s).count)}`);
}
