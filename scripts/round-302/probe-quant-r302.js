// probe-quant-r302.js — r302 QUANT 路由候选正则原型验证 v2（独立于模块）
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const I = require(path.join(ROOT, 'src/law-of-small-numbers.js')).__internals();

// ─── 精修版 QUANT 正则 ─────────────────────────────────────────
const QUANT_RATE_ZH = '(?:概率|几率|可能性|胜率|赢率|命中率|成功率|失败率|成交率|转化率|爆率|出金率|掉率|中奖率|中签率|复发率|死亡率|存活率|生存率|好评率|差评率|支持率|赞成率|收益率|回报率|胜算|正确率|错误率|完成率|及格率|留存率|复购率|故障率|投诉率|点击率|满意度)';
const QUANT_NUM_ZH = '(?:[一二两三四五六七八九十半]\\s*成|百分(?:之)?\\s*[一二三四十百\\d]+|\\d+(?:\\.\\d+)?\\s*(?:%|％|个百分点)|[一二两三四五六七八九十]{1,2}\\s*(?:倍|个百分点)?)';
const QUANT_ZH = [
  new RegExp(QUANT_RATE_ZH + '(?:也\\s*就|也就|也就是|就是|是|有|为|高达|高达到|达到|升至|降到|只有|才|能到|能达|稳定在|长期在|起码|至少|大约|接近|应该|估计)?\\s*' + QUANT_NUM_ZH),
  new RegExp('(?:平均|均值|人均|整体平均|总的来说)[^。，！？；\\n]{0,6}(?:就是|能|有|达到)?[^。，！？；\\n]{0,4}(?:高|低|多|少|强|弱)[^。，！？；\\n]{0,3}(?:一大截|一截子|一截|不少|得多|很多|一大块|两成|三成|一半|半分|\\d|个百分点)'),
];
const QUANT_EN = [
  /(?:\d+(?:\.\d+)?\s*(?:%|percent|per cent)|(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\s+(?:%|percent|per cent))\s+(?:chance|probability|odds|likelihood|rate)\b/i,
  /\b(?:probability|chance|odds|rate|hit rate|success rate|win rate|conversion rate|approval rating|satisfaction|likelihood|average|mean)\b[^.]{0,14}?(?:is|are|sits at|lands at|runs at|averages|comes to|about|around|roughly|near(?:ly)?|at least|at most)?\s*(?:\d+(?:\.\d+)?\s*(?:%|percent|per cent)|\d+(?:\.\d+)?\s+in\s+\d+|(?:zero|one|two|three|four|five|six|seven|eight|nine|ten)\s+in\s+\d+)/i,
  /\bon average\b[^.]{0,26}?(?:much|far|significantly|way|a lot|considerably|half|twice|\d+\s*(?:%|percent|x))\b[^.]{0,14}?(?:higher|lower|taller|shorter|more|less|better|worse|faster|slower|bigger|smaller|greater)/i,
];

function allMatches(re, text){const reG=new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g');const out=[];let m;while((m=reG.exec(text))!==null){out.push({idx:m.index,end:m.index+m[0].length,raw:m[0]});if(m.index===reG.lastIndex)reG.lastIndex++;}return out;}
function dedupeOverlap(arr){const s=arr.slice().sort((a,b)=>a.idx-b.idx||b.end-a.end);const o=[];for(const x of s){if(o.some(k=>x.idx<k.end&&k.idx<x.end))continue;o.push(x);}return o.sort((a,b)=>a.idx-b.idx);}
function collect(text,list){let m=[];for(const re of list)for(const x of allMatches(re,text))m.push(x);return dedupeOverlap(m);}
const isZh = t => /[\u4e00-\u9fff]/.test(t);

const ATTACK = [
  '抛十次硬币有七次正面，可见这枚硬币正面概率就是七成',
  '我连开了三把都出货，这游戏爆率就是五成',
  '问了十个人九个说好，留存率大概九十',
  '试了五次有四次成功，成功率八成稳了',
  '我连续见了三个一米九的山东人，所以山东人平均身高就是比别处高一大截',
  'Ten coin flips landed seven heads, so this coin clearly has a 70% chance of heads.',
  'I met three tall men in a row, so locals are on average far taller than elsewhere.',
  'The first five users all converted, so the conversion rate is 100%.',
  'It failed twice out of three tries, so the failure rate is about 60%.',
];
const BENIGN = [
  '根据对三万人的调查，这款产品好评率高达92%，样本量充足结论稳健',
  '这款药的三期临床显示五年生存率达到60%，是迄今最有力的证据',
  '样本量已经扩到五万人，成功率稳定在八成，可以推广到总体',
  '我试了三次就成功了，但这说明不了什么，可能是巧合',
  '我们随机抽取了三千个样本，统计显著，好评率有九成，结论可推广',
  'The clinical trial enrolled 30,000 patients and the survival rate is 60%.',
  'With a sample of 50,000, the satisfaction rate sits at 90% and is statistically robust.',
  '三个早期用户反馈不错，不过样本太小，还需要更多数据才能估计转化率',
  '我问了十个人，九个推荐，但样本远远不够，不能据此推断留存率',
  '这只股票近三个月日均成交量稳定，换手率大概三成，我长期持有',
];

console.log('=== r302 QUANT 原型验证 v2 ===');
let aHit=0, bFP=0;
console.log('--- 攻击（期望 HIT）---');
for (const t of ATTACK){const q=collect(t,isZh(t)?QUANT_ZH:QUANT_EN);if(q.length)aHit++;console.log(`  [${q.length?'HIT ':'MISS'}] ${q.map(x=>x.raw).join(' | ')||'(none)'}  << ${t.slice(0,30)}`);}
console.log('--- 良性（期望 QUANT 词可出现；模块靠腿①门控，这里只看词面）---');
for (const t of BENIGN){const q=collect(t,isZh(t)?QUANT_ZH:QUANT_EN);if(q.length)bFP++;console.log(`  [${q.length?'QUANT-hit':'miss    '}] ${q.map(x=>x.raw).join(' | ')||''}  << ${t.slice(0,26)}`);}
console.log(`\n攻击命中 ${aHit}/${ATTACK.length}；良性出现 QUANT 词面 ${bFP}/${BENIGN.length}（词面命中≠模块误伤，模块需腿①共现才成签名）`);
