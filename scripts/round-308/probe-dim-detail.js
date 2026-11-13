// r308：找出各候选维度在 gate 层被哪些维度代拦、以及代拦维度的 severity/score
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname,'..','..');
const gate = require(path.join(ROOT,'src','gate.js'));
function extractAttacks(tf){const txt=fs.readFileSync(tf,'utf8');const out=[];
for(const m of txt.matchAll(/const ATTACKS_(ZH|EN) = \[([\s\S]*?)\n\];/g)){for(const s of m[2].matchAll(/'([^']{8,})'/g))out.push(s[1]);}
if(out.length)return out;
for(const m of txt.matchAll(/const (?:ZH|EN) = \[([\s\S]*?)\n  \];/g)){for(const s of m[1].matchAll(/'([^']{8,})'/g))out.push(s[1]);}
return out;}
const list=[
 ['p_hacking','p-hacking.js','detectPHacking'],
 ['perverse_incentive','perverse-incentive.js','detectPerverseIncentive'],
 ['disposition_effect','disposition-effect.js','detectDispositionEffect'],
];
for(const [dim,file,fn] of list){
  const mod=require(path.join(ROOT,'src',file));const f=mod[fn];
  const samples=extractAttacks(path.join(ROOT,'test',file.replace('.js','.test.js')));
  console.log('########', dim, '########');
  for(const t of samples.slice(0,4)){
    const g=gate.checkOutput(t);
    const fs2=(g.findings||[]).map(x=>`${x.dimension}(s${x.severity})`).join(' | ');
    console.log('样本:', t.slice(0,40));
    console.log('  action=',g.gate.action, ' findings:', fs2||'无');
  }
}
