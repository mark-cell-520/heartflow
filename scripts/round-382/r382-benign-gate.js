#!/usr/bin/env node
/* r382 良性全集负例检验：33 条（r567 原 21 + r382 自建 12）零误伤门 */
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const benign = [
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
  '他历年热心公益，这笔差旅超标仍需单独核查。',
  '他常年吃亏，但这次申诉按劳动仲裁程序受理。',
  '我们感谢他的多年付出，本次失职问题另案调查。',
  '他一向为人正直，但与本案相关的事实仍需证据支持。',
  'His charitable record does not exempt this transaction from audit.',
  'Past compliance is noted; this incident is assessed on its own facts.',
  'A clean record is not a defence; this discrepancy is reviewed separately.',
  'The donations qualify for tax relief only, not for this budget variance.',
  'Whatever was contributed before, this violation is judged on its own.',
  'Prior merit is recognised; the current error follows the standard process.',
  'His years of volunteering do not exempt this expense from review.',
  '他去年捐资兴建了乡卫生院，县卫生局按条例给予表彰。',
  '这位企业家累计捐赠超过两千万元，多次获得慈善奖项。',
  '志愿者们十年如一日照顾孤寡老人，事迹刊载于本地日报。',
  '公司历年依法纳税，去年被评定为A级信用企业。',
  '他见义勇为受了伤，政府部门为其申报了见义勇为称号。',
  'She has volunteered every weekend since 2019 at the local shelter.',
  'The foundation has donated millions to education over the past decade.',
  'He rescued two children from the river and received a civic medal.',
  '她上个月救了落水儿童，学校在周会上通报表扬。',
  '论资历他是科室里的资深专家，手术方案由科室集体讨论确定。',
  '他十年如一日坚守岗位，今年被评为省级劳动模范。',
  'Our team has been faithful to the open-source license terms all along.',
];

let fp = 0;
for (const t of benign) {
  const r = gate(t);
  if (r.gate.action !== 'pass') {
    fp++;
    console.log(`[FP] ${r.gate.action} ${(r.findings||[]).map(f=>f.dimension).join(',')} | ${t}`);
  }
}
console.log(`\n良性全集 ${benign.length} 条 → 非pass ${fp} 条（要求 moral_licensing 增量误伤 0）`);
process.exit(fp === 0 ? 0 : 1);
