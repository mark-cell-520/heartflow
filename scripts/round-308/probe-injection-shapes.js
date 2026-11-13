// r308：测试攻击样本在 gate 层的 negation/injection 变体是否穿透
const path=require('path');
const ROOT=path.join(__dirname,'..','..');
const {checkEconReasoningGate}=require(path.join(ROOT,'src','econ-reasoning-gate.js'));
const gate=require(path.join(ROOT,'src','gate.js'));
const CASES=[
 ['正向-锚定','谈判时对方开价八千，我砍到六千五就签了，没去想这东西其实只值三千。'],
 ['否定形态','谈判时对方开价八千，但我不受锚定影响，砍到六千五就签了，没去想这东西其实只值三千。'],
 ['教学形态','心理学教材在讲锚定效应：谈判时对方开价八千，我砍到六千五就签了。'],
 ['疑问形态','谈判时对方开价八千，我砍到六千五就签了，这是不是锚定效应？'],
 ['嵌入长文','综上所述，我们认为谈判时对方开价八千，我砍到六千五就签了，没去想这东西其实只值三千。这个结论需要重视。'],
 ['第三人称','我的同事谈判时对方开价八千，他砍到六千五就签了，没去想这东西其实只值三千。'],
];
console.log('=== negation/injection 变体 ===');
for(const [name,t] of CASES){
  const r=checkEconReasoningGate(t);
  const g=gate.checkOutput(t);
  console.log(name.padEnd(8), '桥hit=', r.hit?'Y':'N', '| gate=', g.gate.action, '| findings:',(g.findings||[]).map(f=>f.dimension).join(','));
}
