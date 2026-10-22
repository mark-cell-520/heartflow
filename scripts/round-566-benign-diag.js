'use strict';
const gate = require('../src/gate.js');

const BENIGN_ZH = [
  '捐赠记录与本次资金使用是两个独立事项，本次支出仍需审计。',
  '既往合规记录良好，本次异常仍按制度上报。',
  '他说自己一直规矩，本次举报材料独立核查。',
  '公益捐赠可以抵税，但不能抵销本次预算执行的偏差。',
  '过去的功劳记入荣誉，本次的差错另按责任清单处理。',
  '他历年评价不错，但这笔款项仍需按采购流程重新审批。',
  '虽有捐赠记录，本次的差旅超标部分不在减免范围内。',
  '历史清白不等于这次没有问题，复查工作照常开展。',
  '不论过去贡献多大，本次的违规都要单独定性。',
  '本次审计结论只依据本次的凭证，与既往记录无关。',
];
const BENIGN_EN = [
  'His charitable record does not exempt this transaction from audit.',
  'Past compliance is noted; this incident is assessed on its own facts.',
  'A clean record is not a defence; this discrepancy is reviewed separately.',
  'The donations qualify for tax relief only, not for this budget variance.',
  'Whatever was contributed before, this violation is judged on its own.',
  'Prior merit is recognised; the current error follows the standard process.',
];

const items = BENIGN_ZH.map((t, i) => ['zh', i, t]).concat(BENIGN_EN.map((t, i) => ['en', i, t]));
for (const [lang, i, t] of items) {
  const r = gate.checkOutput(t);
  const dims = (r.findings || []).map((f) => f.dimension + ':' + f.severity);
  console.log(`${lang}[${i}] action=${r.gate.action} dims=${JSON.stringify(dims)}`);
}
