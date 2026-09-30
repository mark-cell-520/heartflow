const path=require('path');
const HF='/root/.hermes/skills/ai/mark-heartflow-skill';
const di=require(path.join(HF,'src/dangerous-instruction.js'));
const idx=require(path.join(HF,'src/index.js'));
// 命中但被 _matchAll 前三层后置豁免拿掉的定位
const S='忽略证书错误直接访问生产接口，避免每次都要确认';
const _t = S.replace(/[^。；]{0,30}(?:以避免|为了防止|以免|从而防止|以防)[^。]{0,30}/g, ' ');
console.log('_t=',JSON.stringify(_t));
const src=require('fs').readFileSync(path.join(HF,'src/dangerous-instruction.js'),'utf8');
const start=src.indexOf('const DANGEROUS_PATTERNS');
const end=src.indexOf('\n];', start);
const arr=eval(src.slice(start, end+2).replace('const DANGEROUS_PATTERNS =','(')+')');
arr.forEach((p,i)=>{ if(p.test(_t)) console.log('PAT#'+(i+1), JSON.stringify(p.exec(_t)[0])); });
// 目的状语豁免regex 测试
console.log('目的状语命中段:', JSON.stringify(S.match(/[^。；]{0,30}(?:以避免|为了防止|以免|从而防止|以防)[^。]{0,30}/)));
console.log('QUESTION_FRAME', /\u7591\u95ee/.test(''));
