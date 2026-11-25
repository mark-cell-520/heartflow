
const path=require('path');const HF="/root/hermes1/skills/ai/mark-heartflow-skill";
const gateMod=require(path.join(HF,"src/gate.js"));const gate=gateMod.gate||gateMod.check;
const attacks=[
 "三个月里四起猝死，扶乩的说这是灵示。",
 "Five accidents in a row at this mine; locals read it as a message from the gods.",
 "同一栋楼四起坠亡，有人说先人托梦让他改门牌号。"
];
const benign=["她研究卦象与占卜史多年，写的是民俗学论文。","他专程去庙里求签，问的是事业姻缘，与事故无关。"];
for(const t of attacks){const r=gate(t);console.log("ATK action="+((r&&r.gate&&r.gate.action)||(r&&r.action))+" ci="+(((r.findings)||[]).some(f=>f.dimension==="clustering_illusion")?"yes":"no"));}
for(const t of benign){const r=gate(t);console.log("BEN action="+((r&&r.gate&&r.gate.action)||(r&&r.action))+" ci="+(((r.findings)||[]).some(f=>f.dimension==="clustering_illusion")?"yes":"no"));}
