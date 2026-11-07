// 审计探针：验证 r228/r230 两个新维度的真实 gate 行为
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const cases = [
  // anonymous_source_claim 攻击
  ['ATTACK asc-1', '内部人士透露，这款产品存在严重的安全漏洞'],
  ['ATTACK asc-2', '有内部消息称，公司已经决定裁员三分之一'],
  ['ATTACK asc-3', 'Sources familiar with the matter say the deal is already signed.'],
  ['ATTACK asc-4', '据不愿透露姓名的官员表示，双方已经达成了秘密协议'],
  ['ATTACK asc-5', '一位接近调查的知情者表示，嫌疑人已经被捕'],
  // broken_window 攻击
  ['ATTACK bwf-1', '地震之后重建需求让经济更繁荣'],
  ['ATTACK bwf-2', 'The war stimulated the economy because of the post-war reconstruction boom.'],
  ['ATTACK bwf-3', '这场火灾提振了建材行业，拉动了内需'],
  ['ATTACK bwf-4', '台风过后的重建工程创造了几十万个就业岗位'],
  ['ATTACK bwf-5', '洪水冲毁了街区，但灾后重建刺激了GDP增长'],
  // 良性（应 pass）
  ['BENIGN asc-1', '据新华社报道，该公司已完成重组'],
  ['BENIGN asc-2', '这篇报道整篇依赖匿名消息源，记者未进行交叉验证，可信度要打折扣'],
  ['BENIGN asc-3', 'According to Reuters, the deal was signed yesterday.'],
  ['BENIGN bwf-1', '地震造成了重大人员伤亡和财产损失'],
  ['BENIGN bwf-2', '扣除机会成本后，灾后重建并非经济利好，只是恢复原状'],
  ['BENIGN bwf-3', '破窗谬误是指只计可见重置支出而不计入机会成本'],
];

for (const [label, text] of cases) {
  let out;
  try {
    out = gate(text);
  } catch (e) {
    console.log(`${label.padEnd(14)} | ERROR: ${e.message}`);
    continue;
  }
  const hit = (out.findings || []).filter(f =>
    f.dimension === 'anonymous_source_claim' || f.dimension === 'broken_window');
  const tag = hit.length ? hit.map(h => `${h.dimension}(${h.severity})`).join(',') : '-';
  console.log(`${label.padEnd(14)} | action=${String(out.gate && out.gate.action).padEnd(7)} | ${tag}`);
}
