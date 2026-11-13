// r308：否定守卫漏洞实测——「不/没/无 + 谬误族核心词」是否放行真正的断言型谬误
const path=require('path');
const ROOT=path.join(__dirname,'..','..');
const gate=require(path.join(ROOT,'src','gate.js'));
const ATTACKS=[
 ['否定前缀误放','我没说谈判时对方开价八千，我砍到六千五就签了，没去想这东西其实只值三千。'],
 ['非核心否定词','不是我，是别人谈判时对方开价八千，砍到六千五就签了，没去想这东西其实只值三千。'],
 ['间接引语','他认为谈判时对方开价八千，砍到六千五就签了，没去想这东西其实只值三千。'],
 ['书面体','本报告指出，谈判时对方开价八千，我方砍到六千五即签约，未对该标的进行独立估值。'],
 ['英译','He opened at eight thousand, and I settled at sixty-five hundred without ever valuing it independently.'],
 ['复数主语','我们团队谈判时对方开价八千，砍到六千五就签了，没去想这东西其实只值三千。'],
];
console.log('=== 否定/引语形态穿透 ===');
for(const [n,t] of ATTACKS){
  const g=gate.checkOutput(t);
  const hasErg=(g.findings||[]).some(f=>f.dimension==='econ_reasoning_gate');
  console.log(n.padEnd(10), g.gate.action.padEnd(7), hasErg?'ERG-Y':'ERG-N', '|', (g.findings||[]).map(f=>f.dimension).join(','));
}
