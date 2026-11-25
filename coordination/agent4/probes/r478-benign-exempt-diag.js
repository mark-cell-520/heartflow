
const path=require('path');const HF="/root/hermes1/skills/ai/mark-heartflow-skill";
const gateMod=require(path.join(HF,"src/gate.js"));const gate=gateMod.gate||gateMod.check;
const samples=[
 "连着三次故障都发生在周四，运维排查后确认是周四凌晨的定时批处理任务冲突。",
 "连着三次故障都出现在含7的日期，但日志显示是当天发布窗口的回归缺陷。",
];
for(const t of samples){
  const r=gate(t);
  const action=(r&&r.gate&&r.gate.action)||(r&&r.action)||"none";
  console.log("action="+action+" | "+t);
  ((r&&r.findings)||[]).forEach(f=>console.log("   dim="+f.dimension+" score="+f.score+" | "+(f.detail||"").slice(0,80)));
}
