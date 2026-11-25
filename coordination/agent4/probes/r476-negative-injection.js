
'use strict';
const path = require('path');
const gate = require(path.join('/root/hermes1/skills/ai/mark-heartflow-skill','src','gate.js'));
const mod = require(path.join('/root/hermes1/skills/ai/mark-heartflow-skill','src','gamblers-fallacy.js'));
const I = mod.__internals();
const fs = require('fs');
const src = fs.readFileSync(path.join('/root/hermes1/skills/ai/mark-heartflow-skill','src','gamblers-fallacy.js'),'utf8');
// 备份
fs.copyFileSync(path.join('/root/hermes1/skills/ai/mark-heartflow-skill','src','gamblers-fallacy.js'), '/tmp/r476-gamblers.bak.js');

const attacks = [
  '我这阵子连错五道题，下一道肯定该轮到我对了。',
  '她面试被拒了八次，下一次该轮到她被录取了吧。',
  '他已经连着七天没开单了，按概率下一单该成交了。',
  '连考三次都没过，这次总该轮到我上岸了吧。',
  '抢红包手气最差已经连着五次了，下一波该轮到我抢到大的了。',
  '投了三十份简历都石沉大海，下一家该轮到我拿到 offer 了。',
  '摇了三年号都没中，这次该轮到我了吧，总不能一直轮不到我。',
  '报名五次活动都没抽中，第六次总该轮到我中一次了。',
  'I have bought lottery tickets for ten years without winning; my turn is due.',
  'She has been rejected eight times, so the next interview is bound to go her way.',
  'He has gone seven days without closing a deal, so by probability the next one is his turn.',
  'After five failed exams in a row, this one is bound to be my turn to pass.',
];
function modHit(t){ return mod.checkGamblersFallacy(t).hit; }

// 基线（当前实现）
let baseHit=0; for(const t of attacks) if(modHit(t)) baseHit++;
console.log('基线：模块层命中 '+baseHit+'/'+attacks.length);

// 注入 1：把 STREAK_COUNT_ZH/EN 替换成永不匹配的空正则
// [修正] 原 \/.*?\/ 写法被正则字面量字符类内的 / 截断（STREAK_COUNT_EN 含 \/i，STREAK_COUNT_ZH 以 )\/ 结尾），
// 三条腿的替换全部为空操作——实测注入前后命中数不变。改为行级锚定整行替换。
function neutraliseAll(srcText, prefixes){
  return srcText.split('\n').map(l => prefixes.some(p=>l.startsWith(p)) ? l.slice(0, l.indexOf('=')+1)+' /(?!x)x/;' : l).join('\n');
}
let s1 = neutraliseAll(src, ['const STREAK_COUNT_ZH','const STREAK_COUNT_EN']);
// 注入 2：把 TURN_ZH/EN 替换成永不匹配
let s2 = neutraliseAll(src, ['const TURN_ZH','const TURN_EN']);

function testWith(srcText, label){
  fs.writeFileSync(path.join('/root/hermes1/skills/ai/mark-heartflow-skill','src','gamblers-fallacy.js'), srcText);
  delete require.cache[require.resolve(path.join('/root/hermes1/skills/ai/mark-heartflow-skill','src','gamblers-fallacy.js'))];
  delete require.cache[require.resolve(path.join('/root/hermes1/skills/ai/mark-heartflow-skill','src','gate.js'))];
  const m2 = require(path.join('/root/hermes1/skills/ai/mark-heartflow-skill','src','gamblers-fallacy.js'));
  let n=0; for(const t of attacks) if(m2.checkGamblersFallacy(t).hit) n++;
  console.log(label+' 后：模块层命中 '+n+'/'+attacks.length);
  return n;
}
const a = testWith(s1, '删腿①（STREAK_COUNT）');
const b = testWith(s2, '删腿②（TURN）');
// 恢复
fs.writeFileSync(path.join('/root/hermes1/skills/ai/mark-heartflow-skill','src','gamblers-fallacy.js'), src);
delete require.cache[require.resolve(path.join('/root/hermes1/skills/ai/mark-heartflow-skill','src','gamblers-fallacy.js'))];
delete require.cache[require.resolve(path.join('/root/hermes1/skills/ai/mark-heartflow-skill','src','gate.js'))];
let restored=0; for(const t of attacks) if(mod.checkGamblersFallacy(t).hit) restored++;
console.log('恢复后：模块层命中 '+restored+'/'+attacks.length);
// 判定口径：双腿各自独立承重 = 删任一腿后命中严格下降（存量腿① streak/due 仍会命中部分样本，
// 故不要求删腿后归零），且恢复后回到基线。
console.log('判定：'+(baseHit===12 && a<baseHit && b<baseHit && restored===baseHit ? '负例注入全按预期（双腿均独立承重，腿①贡献 '+(baseHit-a)+' 条、腿②贡献 '+(baseHit-b)+' 条）' : '异常，需人工核查'));
