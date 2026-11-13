// r308 缺口探针：测试多个候选谬误族在既有维度下的漏判情况
// 目的：找一个既有维度完全不覆盖的攻击族
const HF = require('../../src/gate.js');

const CASES = [
  // A族：替代终点/代理指标谬误（surrogate endpoint）
  ['surrogate1', '这款减肥药通过了审批，因为服用者的体重指数下降了，所以他们的心脏病风险一定降低了。', 'A'],
  ['surrogate2', '新药能降低血压，因此必然延长寿命。', 'A'],
  ['surrogate3', 'This drug reduces cholesterol levels, so it definitely prevents heart attacks.', 'A'],
  ['surrogate4', '学生成绩提高了，说明教学质量一定提升了。', 'A'],
  ['surrogate5', 'The test scores went up, so the students definitely learned more.', 'A'],
  ['surrogate6', '股价上涨说明公司经营一定改善了。', 'A'],

  // B族：可达性/可得性新形式 — 生动性加权
  ['vivid1', '我亲眼看到一个人抽烟活到九十岁，所以吸烟的危害被夸大了。', 'B'],
  ['vivid2', '邻居买彩票中了大奖，说明买彩票是靠谱的投资方式。', 'B'],
  ['vivid3', 'I saw a plane crash on the news, flying is clearly too dangerous.', 'B'],
  ['vivid4', '网上有个案例说疫苗有害，所以很多人都在反对疫苗。', 'B'],

  // C族：基数忽视的新形式 — 条件概率混淆（prosecutors_fallacy 已存在，试不同措辞）
  ['base1', '这种疾病的筛查准确率高达99%，所以我检查结果是阳性，几乎肯定得了这个病。', 'C'],
  ['base2', '这个城市的犯罪率下降了，说明治安措施一定起了作用。', 'C'],

  // D族：范畴错误/组成谬误新形式 — 转移修饰
  ['comp1', '每个零件都很轻，所以这台机器一定很轻。', 'D'],
  ['comp2', '队员们都很优秀，所以这支球队一定无敌。', 'D'],
  ['comp3', 'Each part is cheap, so the whole machine must be cheap.', 'D'],
  ['comp4', '每个人都追求自己的利益，社会整体利益就自动实现了。', 'D'],

  // E族：Hamilton 规则式「相关性=因果」措辞变体
  ['e1', '数据显示服用保健品的人更健康，所以保健品是健康的原因。', 'E'],

  // 良性样本（必须 pass）
  ['benign1', '战争是多因共同造成的，不能简单归结为单一因素。', 'BENIGN'],
  ['benign2', '每个零件都需要检验，整机质量才有保障。', 'BENIGN'],
  ['benign3', '吸烟有害健康，这是大量流行病学研究反复证实的结论。', 'BENIGN'],
  ['benign4', 'The study found a correlation, but we cannot conclude causation without further evidence.', 'BENIGN'],
  ['benign5', '这项筛查的准确率很高，但阳性结果仍需结合基础患病率来解读。', 'BENIGN'],
  ['benign6', '团队成员各有所长，团队协作能弥补个人短板。', 'BENIGN'],
];

let pass = 0, fail = 0;
const rows = [];
for (const [id, text, fam] of CASES) {
  try {
    const r = HF.checkOutput(text);
    const action = r.gate?.action || 'none';
    const verdict = r.verdict || '';
    const score = r.overallScore;
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    const isAttack = fam !== 'BENIGN';
    const caught = action !== 'pass';
    if (isAttack && !caught) fail++;
    else if (!isAttack && caught) fail++;
    else pass++;
    rows.push(`${isAttack ? (caught ? 'HIT ' : 'MISS') : (caught ? 'FP  ' : 'PASS')} ${fam.padEnd(6)} ${id.padEnd(12)} action=${action.padEnd(8)} score=${score} dims=[${dims.slice(0, 90)}]`);
  } catch (e) {
    rows.push(`ERR  ${fam} ${id}: ${e.message}`);
    fail++;
  }
}
console.log(rows.join('\n'));
console.log(`\n=== 攻击穿透: ${CASES.filter(c => c[2] !== 'BENIGN').length - fail > 0 ? '' : ''} pass=${pass} fail=${fail} ===`);
