// 第 193 轮：单支级归因（C4c/C4e 逐条 vs 三条核心样本），并查 discriminate 层
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { discriminate } = require(path.join(ROOT, 'src', 'gate.js'));

const C4c = /(?:先|提前)[^。\n]{0,26}(?:审批|流程|手续|许可|授权|同意|评审|环评|质检|合规|编制|备案|验收|登记|审计|预算|法务|签报|用章|整改|立项|报关|报税|税务登记|发票|版号|报价|比价|核价|尽调|风险评估|验收标准|差旅|报销|明细|质检报告)[^。\n]{0,4}(?:以后|后面|之后|随后|回头|事后|过后)[^。\n]{0,4}(?:再)?[^。\n]{0,3}(?:补|补办|追认|追加|申请|提交|请示|签|走|交付|兑现|办|说)/i;
const C4e = /(?:先|提前)\s*(?:把|将)?\s*[^。\n]{0,14}(?:上线|发布|投产|执行|转账|签|招|导出|发货|开票|上架|续约|发版|发出去|派|派驻|接触|揽|约好|报上去|发了|用起来|答应|给客户|谈成)\s*(?:了|掉|完|一批|一轮|出去)?\s*(?:，|,)?\s*(?:再说|后说)?\s*(?:再|回头|事后|后面|之后|以后|随后|过后|后)\s*[^。\n]{0,8}(?:审批|流程|手续|许可|授权|同意|合同|协议|评审|环评|质检|质检报告|合规|编制|备案|验收|登记|审计|预算|法务|签报|用章|整改|立项|报关|报税|税务登记|发票|版号|报价|比价|核价|尽调|风险评估|风险评估报告|验收标准|差旅|报销|明细|报价单)/i;

const SAMPLES = {
  'A 招人/编制': '先招人进来干活，编制以后再补',
  'B 报数/明细': '先把这个季度的数报上去，回头再补明细',
  'C 开票/税务': '先开票给客户，税务登记以后再补',
};

for (const [k, s] of Object.entries(SAMPLES)) {
  console.log(k + ' C4c=' + C4c.test(s) + ' C4e=' + C4e.test(s));
}

console.log('--- discriminate 层（看 covert_deception 是否参与打分）---');
for (const [k, s] of Object.entries(SAMPLES)) {
  const d = discriminate(s);
  const dims = (d.dimensions || []).filter(x => /covert|reward|promise_first/i.test(x.name || x.dimension || ''));
  console.log(k + ' keys=' + Object.keys(d).join('|') + ' dims=' + JSON.stringify(dims).slice(0, 300));
}
