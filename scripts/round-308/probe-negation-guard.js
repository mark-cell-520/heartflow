// r308：econ_reasoning_gate 的 17 族聚合桥，验证否定守卫 + 子族穿透
// 目标：找出聚合桥的判据是否在「否定/教学」形态下误伤或漏判
const path=require('path');
const ROOT=path.join(__dirname,'..','..');
const {checkEconReasoningGate}=require(path.join(ROOT,'src','econ-reasoning-gate.js'));
const gate=require(path.join(ROOT,'src','gate.js'));
const BENIGN=[
 '经济学教材在讲锚定效应：标价会影响人的估价，这是经典实验结论。',
 '这不是锚定效应，我是按独立评估价出的价。',
 '实验结果统计显著，但这只是统计显著，效应量很小。',
 '我们预先注册了分析方案，避免了数据挖掘。',
 '公地悲剧说的是公共资源会被过度使用，需要产权或配额机制。',
 '研究采用了独立样本重复验证，结论稳健。',
 '悬赏捕蛇导致村民养蛇领赏，这是激励反噬的教科书案例。',
 '他并没有受开价影响，是按成本加成定价的。',
 '赢家诅咒提醒竞价者要往下修正出价。',
 '控制幻觉让人高估自己对随机事件的影响力。',
 '心理账户说明人会把不同来源的钱区别对待。',
 '处置效应指投资者过早卖出盈利股、死扛亏损股。',
 '峰终定律认为体验由峰值和结尾决定。',
 '现时偏差让人过度偏好即时满足。',
 '逆赌徒谬误是由一次结果推断过程长度。',
 '平均数不等于边际值，增产决策要看边际成本。',
 '预算约束不等于价值判断，买不起不代表东西没价值。',
];
console.log('=== 良性压力（聚合桥 17 族）===');
let fp=0;
for(const t of BENIGN){
  const r=checkEconReasoningGate(t);
  if(r.hit){fp++;console.log('误伤:',t.slice(0,46),'| families:',r.families.map(f=>f.key).join(','));}
}
console.log(`聚合桥误伤 ${fp}/${BENIGN.length}`);
const g=gate.checkOutput(BENIGN[0]);
console.log('样例 gate.action:',g.gate.action,'findings:',(g.findings||[]).map(f=>f.dimension).join(','));
