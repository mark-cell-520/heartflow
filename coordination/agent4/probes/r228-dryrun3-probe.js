// r228 扩展干跑 v3：测试文件冻结前的变体全量验证
// 每个样本的期望值必须先在这里实测确认，再进正式测试（不拍脑袋）。
const { checkConditionalTransposition: chk } = require('/data/home/heartflow/src/conditional-transposition.js');

const EXPECT_HIT = [
  // A6/A7 given/when 长条件实体（F-E1 帽放宽至 7 词后）
  ['A6-given', 'Given that the account belongs to a law-abiding citizen, this pattern occurs once in a hundred thousand, so the probability that someone with this pattern is law-abiding is also one in a hundred thousand.'],
  ['A7-when', 'When the account belongs to a law-abiding citizen, this pattern shows once in a hundred thousand, so the probability that someone with this pattern is law-abiding is also one in a hundred thousand.'],
  // A8 千分比
  ['A8-千分比', '在接种者中出现该反应的概率是千分之一，所以出现该反应的人是接种者的概率也是千分之一。'],
  // A10/A11 极值形变体
  ['A10-极值ZH', '假设系统没有故障，误报的可能性几乎为零，可见出现误报时系统无故障的可能性也几乎为零。'],
  ['A11-极值EN', 'For healthy patients a false positive is highly unlikely, so the probability that a patient with a positive screen is healthy is highly unlikely.'],
  // N1/N2 混合数值形（归一化等价证明：百万分之一 ≡ 0.0001%）
  ['N1-混合ZH', '证据在无辜者身上出现的概率是百万分之一，所以被告无辜的几率也只有0.0001%。'],
  ['N2-混合EN', 'The match has a one-in-a-million chance if he is innocent, so there is only a 0.0001% chance he is innocent.'],
  // S6 反问包装的断言（疑问豁免不得生效）
  ['S6-反问', '在患者中阳性率是99%，所以阳性者中患者的概率也是99%，难道不是吗？'],
  // A5 假设框
  ['A5-假设框', '假设账户属于守法者，这个模式出现的概率是十万分之一，因此有这种模式的人是守法者的概率也是十万分之一。'],
  // A9-2 万分之
  ['A12-万分之', '在捐赠者中该血型出现的概率是万分之五，所以有该血型的人是捐赠者的概率也是万分之五。'],
];

const EXPECT_PASS = [
  // S1 不同值
  ['S1-不同值', '在患者中阳性率是99%，所以在健康者中阳性率是5%。'],
  // S2 无推断词
  ['S2-无推断', '在患者中阳性率是99%，在健康者中阳性率也是99%。'],
  // S4 无条件框
  ['S4-无框', '这个概率是百万分之一，所以那个概率也是百万分之一。'],
  // B10 两个方向分别报告（不同值+正确判别语）
  ['B10-分别报告', '在患者中该检测的阳性率是99%，而阳性者中真正患病的概率可能只有20%，两者不能混为一谈。'],
  // 分工锁：base_rate_neglect 领地（阳性信号×高置信，无数值换位）
  ['L1-基数率领地', '检测结果是阳性，说明你大概率已经生病了，不用做进一步检查。'],
  // 分工锁：illicit_conversion 领地（全称量词逻辑换位）
  ['L2-全称换位领地', '所有爱国者都支持这个政策，所以所有支持这个政策的人都爱国。'],
  // 分工锁：affirming_the_consequent 领地（蕴涵式）
  ['L3-蕴涵式领地', '如果他是有罪的，他会逃跑；他逃跑了，所以他是有罪的。'],
  // FP 类样本（已知残余风险类：同值两总体+推断——设计上判 verify，此处记录实测行为）
  ['FP1-同值两总体', '在男性中该病的患病率是1%，所以在女性中患病率也是1%。'],
  // 空/短文本
  ['S5a-空', ''],
  ['S5b-短', '概率'],
];

let bad = 0;
console.log('=== 期望命中 ===');
for (const [id, s] of EXPECT_HIT) {
  const r = chk(s);
  if (!r.hit) bad++;
  console.log(`${id.padEnd(12)} hit=${r.hit} ${r.hit ? '' : '<<< 漏判'} ${r.detail.slice(0, 50)}`);
}
console.log('=== 期望放行 ===');
for (const [id, s] of EXPECT_PASS) {
  const r = chk(s);
  if (r.hit) bad++;
  console.log(`${id.padEnd(14)} hit=${r.hit} ${r.hit ? '<<< 误判 ' + r.detail.slice(0, 50) : ''}`);
}
console.log(`异常: ${bad}`);
