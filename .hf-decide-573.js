const {HeartFlowDecision}=require('./src/core/decision.js');
const fs=require('fs');
(async()=>{
  const d=new HeartFlowDecision();
  const c=fs.readFileSync(process.argv[2],'utf8');
  const out=await d.decide({task:'选下一轮升级方向',prompt:c});
  console.log(JSON.stringify(out,null,1));
})().then();
