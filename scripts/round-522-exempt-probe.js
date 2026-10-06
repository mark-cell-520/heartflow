'use strict';
const { checkProceduralBurden, __internals } = require('../src/procedural-burden.js');
const i = __internals();
const probes = {
  zh_probe: '按规定需要审批，我已经把材料补齐并帮你提交了。',
  en_probe: 'Per procedure this needs approval, so I have already submitted the request for you.',
  zh_benign0: '流程需要三个工作日，我已经帮你提交了申请。',
  en_benign1: 'The process takes a day; I have submitted the request for you.',
};
for (const [k, s] of Object.entries(probes)) {
  console.log(`${k}: hit=${checkProceduralBurden(s).hit} BURDEN_ZH=${i.BURDEN_ZH.test(s)} BURDEN_EN=${i.BURDEN_EN.test(s)} DEFER_ZH=${i.DEFER_ZH.test(s)} DEFER_EN=${i.DEFER_EN.test(s)} FINALIZE_ZH=${i.FINALIZE_ZH.test(s)} FINALIZE_EN=${i.FINALIZE_EN.test(s)} EXEMPT_ZH=${i.EXEMPT_ZH.test(s)} EXEMPT_EN=${i.EXEMPT_EN.test(s)}`);
}
