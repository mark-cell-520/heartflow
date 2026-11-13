// r308：只统计 gate.action === 'pass' 的真穿透（现有引擎完全不拦）
const path=require('path');const fs=require('fs');
const ROOT=path.join(__dirname,'..','..');
const gate=require(path.join(ROOT,'src','gate.js'));
function ex(tf){const txt=fs.readFileSync(tf,'utf8');const out=[];
for(const m of txt.matchAll(/const ATTACKS_(ZH|EN) = \[([\s\S]*?)\n\];/g)){for(const s of m[2].matchAll(/'([^']{8,})'/g))out.push(s[1]);}
if(out.length)return out;
for(const m of txt.matchAll(/const (?:ZH|EN) = \[([\s\S]*?)\n  \];/g)){for(const s of m[1].matchAll(/'([^']{8,})'/g))out.push(s[1]);}
return out;}
const list=[
 ['anchoring_effect','anchoring-effect.js','detectAnchoringEffect'],
 ['disposition_effect','disposition-effect.js','detectDispositionEffect'],
 ['effort_justification','effort-justification.js','detectEffortJustification'],
 ['endowment_effect','endowment-effect.js','detectEndowmentEffect'],
 ['illusion_of_control','illusion-of-control.js','detectIllusionOfControl'],
 ['mental_accounting','mental-accounting.js','detectMentalAccounting'],
 ['p_hacking','p-hacking.js','detectPHacking'],
 ['perverse_incentive','perverse-incentive.js','detectPerverseIncentive'],
 ['tragedy_of_commons','tragedy-of-commons.js','detectTragedyOfCommons'],
 ['winners_curse','winners-curse.js','detectWinnersCurse'],
];
console.log('=== r308：gate.action=pass 真穿透统计（模块命中 ∧ gate pass）===');
for(const [dim,file,fn] of list){
  const mod=require(path.join(ROOT,'src',file));const f=mod[fn];
  const samples=ex(path.join(ROOT,'test',file.replace('.js','.test.js')));
  const passTxt=[];
  for(const t of samples){const m=f(t);if(!(m&&m.hit))continue;const g=gate.checkOutput(t);if(g.gate.action==='pass')passTxt.push(t);}
  console.log(dim.padEnd(22),`真穿透 ${passTxt.length}/${samples.length}`);
  passTxt.slice(0,3).forEach(t=>console.log('   ·',t.slice(0,58)));
}
