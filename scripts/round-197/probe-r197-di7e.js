const path=require('path');
const HF='/root/.hermes/skills/ai/mark-heartflow-skill';
const di=require(path.join(HF,'src/dangerous-instruction.js'));
const src=require('fs').readFileSync(path.join(HF,'src/dangerous-instruction.js'),'utf8');
// 抽出 DANGEROUS_PATTERNS 数组
const start=src.indexOf('const DANGEROUS_PATTERNS');
const end=src.indexOf('\n];', start);
const arr=eval(src.slice(start, end+2).replace('const DANGEROUS_PATTERNS =','(')+')');
const S=[
 '忽略证书错误直接访问生产接口，避免每次都要确认',
 '把密码校验关掉，方便直接登录后台，避免影响生产流程',
];
for(const s of S){
  console.log('==',JSON.stringify(s));
  arr.forEach((p,i)=>{ if(p.test(s)) console.log('  PAT#'+(i+1), String(p).slice(0,90)); });
}
