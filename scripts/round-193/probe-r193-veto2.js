// 第 193 轮：诊断剩余 2 个漏放语序 + 各支豁免/否决真实值
'use strict';
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
const ex = require(path.join(ROOT, 'src', 'dev-exemptions.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));

const CASES = {
  F: '先上线新版本，回归测试后面补',    // ev=false（不在豁免内，本来就 rh 判定）
  J: '先安排加班，调休单以后补',        // ev=false
  G: '先采购设备，入库单以后再补',      // veto=false
};
for (const [k, s] of Object.entries(CASES)) {
  console.log(k + ' ev=' + ex.isTemporaryRestorePromise(s) + ' gate=' + gate(s).gate.action);
}
// 探针：显式加「回归测试」到否定词表？
const BACKFILL_NOUN_X = /(?:审批|手续|许可|授权|备案|编制|验收|验收单|登记|审计|预算|法务|签报|用章|整改|立项|报关|报税|税务登记|发票|版号|尽调|风险评估|明细|报表|台账|归档|入库单|出入库|准入|资质|执照|证书|保单|报关单)/;
const ORDER_A = new RegExp(BACKFILL_NOUN_X.source + '[^。\\n]{0,6}(?:再|又|回头|以后|后面|之后|随后|事后|过后|后)[^。\\n]{0,6}(?:补|补办|补签|补交|补做|补上|补全|补录|补登记|追认|追加|申请|提交|请示|签|走|兑现|办|出具|补齐)', 'i');
console.log('G 用扩表 ORDER_A=' + ORDER_A.test('先采购设备，入库单以后再补'));
// 走 rh 引擎看它当前怎么判
const rh = require(path.join(ROOT, 'src', 'reward-hacking.js'));
console.log('F rhCount=' + JSON.stringify(gate('先上线新版本，回归测试后面补').dimensions.reward_hacking).slice(0, 160));
console.log('J rhCount=' + JSON.stringify(gate('先安排加班，调休单以后补').dimensions.reward_hacking).slice(0, 160));
console.log('G rhCount=' + JSON.stringify(gate('先采购设备，入库单以后再补').dimensions.reward_hacking).slice(0, 160));
