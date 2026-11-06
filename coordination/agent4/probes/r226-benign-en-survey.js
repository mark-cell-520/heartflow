// r226 良性语料完整枚举（修正归一化）+ 候选 EN 图灵模式误拦预检
const path = require('path');
const ROOT = '/data/home/heartflow';

const files = ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js'];

function deepTexts(v, out) {
  if (!v) return out;
  if (typeof v === 'string') { if (v.trim()) out.push(v); return out; }
  if (Array.isArray(v)) { for (const x of v) deepTexts(x, out); return out; }
  if (typeof v === 'object') { for (const k of Object.keys(v)) deepTexts(v[k], out); return out; }
  return out;
}

const allBenign = [];
for (const f of files) {
  let m;
  try { m = require(path.join(ROOT, 'test', f)); } catch (e) { console.log(f, 'LOAD-ERR', e.message); continue; }
  const before = allBenign.length;
  deepTexts(m, allBenign);
  // 去掉探针自身 console 无关注入（仅本文件 require 的模块导出，安全）
  const texts = allBenign.slice(before).filter(t => t.length >= 4 && !/^(正常输入|技术讨论|恶意输入|边界样本|教学内容|类别|合计|✅|║|╔|╚|─)/.test(t));
  console.log(f, '抽取文本:', texts.length);
  for (const t of texts) allBenign.push.length; // no-op
  // 重新收集干净列表
  texts.forEach(t => allBenign.push(t));
}
// 去重（deepTexts 可能把同一模块的不同视图重复抽到）
const uniq = [...new Set(allBenign)];
console.log('良性样本总数(去重):', uniq.length);

const isPureEN = t => /[a-zA-Z]{4,}/.test(t) && !/[\u4e00-\u9fff]/.test(t);
const enSamples = uniq.filter(isPureEN);
console.log('纯英文样本数:', enSamples.length);
for (const s of enSamples.slice(0, 15)) console.log('  EN>', s.slice(0, 110));

const CANDIDATE_EN = [
  'i understand how you feel', 'i understand your feelings', 'i can feel', 'i feel for you',
  "i've been there", 'i have been there', 'i know how you feel', 'i hear you',
  "it's okay", 'its okay', 'everything will be okay', 'everything will be fine',
  'stay strong', "don't be sad", 'do not be sad', 'hugs', 'big hug', 'sending you a hug',
  'that sounds really hard', 'that must be really hard', 'your feelings are valid',
  "it's normal to feel", 'it is normal to feel', 'you are not alone',
];

let hitTexts = 0, hitPairs = 0;
for (const t of uniq) {
  const low = ' ' + t.toLowerCase() + ' ';
  const hits = CANDIDATE_EN.filter(p => low.includes(p));
  if (hits.length > 0) { hitTexts++; console.log('  HIT' + hits.length + '>', hits.join(' ; '), '|', t.slice(0, 90)); }
  if (hits.length >= 2) hitPairs++;
}
console.log('候选模式命中 >=1 条的良性文本数:', hitTexts);
console.log('候选模式命中 >=2 条（触发 rewrite）的良性文本数:', hitPairs);
