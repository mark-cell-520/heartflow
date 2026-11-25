
const path=require('path');const HF="/root/hermes1/skills/ai/mark-heartflow-skill";
const gateMod=require(path.join(HF,"src/gate.js"));const gate=gateMod.gate||gateMod.check;
const t="这个车间三个月四起工伤，安全员复核后认定为同一批夹具的防护缺陷。";
const r=gate(t);
console.log("action="+((r&&r.gate&&r.gate.action)||(r&&r.action)||"none"));
((r&&r.findings)||[]).forEach(f=>console.log("   dim="+f.dimension));
