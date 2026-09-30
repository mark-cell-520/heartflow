const path=require('path');
const HF='/root/.hermes/skills/ai/mark-heartflow-skill';
const src=require('fs').readFileSync(path.join(HF,'src/dangerous-instruction.js'),'utf8');
const start=src.indexOf('const DANGEROUS_PATTERNS');
const end=src.indexOf('\n];', start);
eval('var P='+src.slice(start, end+2).replace('const DANGEROUS_PATTERNS =','')+';');
const S='把密码校验关掉，方便直接登录后台';
P.forEach((p,i)=>{const m=p.exec(S); if(m) console.log('PAT#'+(i+1), JSON.stringify(m[0]));});
console.log('total', P.length);
