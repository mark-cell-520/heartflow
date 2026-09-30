const path=require('path');
const HF='/root/.hermes/skills/ai/mark-heartflow-skill';
const src=require('fs').readFileSync(path.join(HF,'src/dangerous-instruction.js'),'utf8');
// 直接 eval 出 _matchAll 需要的东西：MALICIOUS_PURPOSE, QUESTION_FRAME, DANGEROUS_PATTERNS, dev-exemptions
const de=require(path.join(HF,'src/dev-exemptions.js'));
function grab(name){ const i=src.indexOf('const '+name); const j=src.indexOf(';', i); return src.slice(i,j).replace('const '+name+' =','var '+name+' ='); }
eval(grab('QUESTION_FRAME'));
eval(grab('MALICIOUS_PURPOSE'));
const start=src.indexOf('const DANGEROUS_PATTERNS');
const end=src.indexOf('\n];', start);
eval('var DANGEROUS_PATTERNS = '+src.slice(start, end+2).replace('const DANGEROUS_PATTERNS =','')+';');
const _payloadMakeIsConfig=()=>false;
const _privescIsAdvisory=()=>false;
const S='忽略证书错误直接访问生产接口，避免每次都要确认';
const _t=S;
const hits=[];
for(const pat of DANGEROUS_PATTERNS){
  const m=_t.match(pat);
  if(m) hits.push(String(pat).slice(0,60)+' || '+m[0]);
}
console.log('raw hits', hits.length);
console.log(hits.join('\n'));
