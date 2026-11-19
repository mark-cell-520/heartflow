// r407 路由归属 + 边界抽查
'use strict';
const { checkAppealToNature } = require('/data/home/heartflow/src/appeal-to-nature.js');

const cases = [
  // 应命中（路由③）
  ['人类几十万年进化出来的身体，根本不是为精制糖设计的', true],
  ['我们的基因还停留在采集时代，根本消化不了工业化生产的食品', true],
  ['自然状态下本来就是优胜劣汰，医疗干预太多反而让人类退化', true],
  ['人天生就该日出而作日落而息，熬夜加班本身就有违天道', true],
  ['Evolution designed our digestive systems for whole foods, not processed snacks.', true],
  ['Nature intended animals to roam free; factory farming goes against their design.', true],
  ['Human genes are unchanged for a hundred thousand years, so we cannot process refined sugar.', true],
  // 边界（设计射程外，记录不判）：
  ['我们的身体不是为久坐设计的，所以每天必须去原始森林里跑一圈', false], // 纯「为…设计」形而无演化腿①''在场（裸身体不收，防「椅子不是为老人身体设计的」误伤）
  ['这种生活方式天生违背自然规律，当然会生病', false], // 「天生」在此是副词不构成规范断言；纯违背-危害形无生产腿，射程外
  // 不应命中（单腿 / 交叉组合 / 良性）
  ['进化论是生物学的核心理论，有大量化石与基因证据支持', false],
  ['从进化心理学看，人类对蛇的恐惧可能有生存适应意义', false],
  ['这个工具不是为新手设计的，需要进阶教程', false],
  ['The system was designed for high throughput, not for casual users.', false],
  ['消化不良可以吃益生元缓解', false],
  ['基因检测行业近年在国内快速发展', false],
  ['天生我材必有用，年轻人要有自信', false],
  ['不适应高强度节奏的人可以申请调岗', false],
  ['Evolution by natural selection is the organizing principle of modern biology.', false],
  ['Researchers debate whether modern diets mismatch our evolutionary heritage.', false],
  ['祖先的方法就是好，比现代工艺强多了', false], // 演化腿缺位（纯传统腿×优越=路由①射程，但无 NATURE_ZH 腿①在场亦不判）
  ['野菜吃多了伤肝，再天然也要适量', false], // 交叉组合：自然性×危害不判
];

let pass = 0, fail = 0;
for (const [t, expect] of cases) {
  const r = checkAppealToNature(t);
  const ok = r.hit === expect;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} expect=${expect ? 'hit' : 'miss'} got=${r.hit ? 'HIT ' + r.detail : 'miss'} | ${t.slice(0, 44)}`);
}
console.log(`\nroute③ 归属抽查: ${pass}/${cases.length} PASS, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
