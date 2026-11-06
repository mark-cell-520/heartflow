// r225 决定性探针：base_rate_neglect 数值/口语后验家族的「干净翻转」产量 + FP 面。
// 目标翻转形：perfect_error 不触发的数值后验（分数 odds、九成/十有八九、几乎确定）。
// 承重转移形：% 后验（perfect_error 已 verify，补强后改由 base_rate_neglect 正确归因）。
'use strict';
const path = require('path');
const ROOT = '/data/home/heartflow';
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const brn = require(path.join(ROOT, 'src', 'base-rate-neglect.js'));

const NEW_EN = [
  /\d+(?:\.\d+)?\s*%\s+(?:likely|probable|certain|sure)\s+(?:to\s+)?(?:have|has|be|is|are|contracted|infected|guilty)/i,
  /\d+(?:\.\d+)?\s*%\s+(?:chance|probability|odds)\b/i,
  /(?:probability|chance|likelihood)\s+(?:is|are|of|equals?)\s*(?:about\s+|around\s+)?\d+(?:\.\d+)?\s*%/i,
  /a\s+\d+(?:\.\d+)?\s*%\s+(?:chance|probability|likelihood)/i,
  /(?:odds|chances)\s+are\s+\d+\s+to\s+\d+/i,
  /\d+\s+(?:in|out\s+of)\s+\d+\s+(?:chance|odds)/i,
  /(?:near|virtual(?:ly)?)\s+certainty/i,
];
const NEW_ZH = [
  /\d+(?:\.\d+)?\s*[%％]\s*(?:的)?(?:可能|把握|几率|机率)/,
  /(?:概率|几率|机率|可能性)(?:是|为|高达|达到|有|大约|接近|约)?\s*\d+(?:\.\d+)?\s*[%％]/,
  /(?:患病|感染|得病|确诊|有罪|中招|是|属于|高危|骗子|罪犯|嫌疑人|作弊|内鬼)(?:的)?概率[^。，！？!?]{0,4}\d+(?:\.\d+)?\s*[%％]/,
  /[一二三四五六七八九十]成(?:的)?(?:可能|把握|几率|机率)/,
  /十有[五六七八九]/,
  /几乎(?:是)?确定[^。，！？!?]{0,8}(?:是|有|得|患|感染|染上|属于|中招|罪|骗子|罪犯|嫌疑人|高危)/,
  /(?:是|有|得|患|感染|属于|中招|罪|骗子|罪犯|嫌疑人|高危|内鬼)[^。，！？!?]{0,6}几乎确定/,
];

const attacks = [
  'The test is 99% accurate. You tested positive, so you are 99% likely to have it.',
  'You were flagged by the system, so the odds are 9 to 1 you are the fraud.',
  'The screening came back positive, so the probability you are infected is 95%.',
  'You matched the profile, so it is a near certainty you are the culprit.',
  '检测呈阳性，所以你感染病毒的可能性是98%。',
  '系统把你标记为匹配对象，你九成是个骗子。',
  '你命中黑名单，十有八九你是内鬼。',
  '筛查结果呈阳性，他几乎确定感染了病毒。',
];
const benign = [
  'The test is 99% accurate; given the 1% base rate, your actual risk is far lower.',
  'The odds are 9 to 1 that it rains during the monsoon.',
  'There is a 70% chance of passing if you study.',
  '检测准确率99%，但患病率极低，阳性后的概率并不高。',
  '今天有九成可能下雨，出门带把伞。',
  '他十有八九会赢，毕竟实力差距明显。',
  'The team is 95% likely to win given their record.',
  '及格率达到了九成五，创了新高。',
];

function run(arr) {
  const out = [];
  for (const t of arr) {
    const r = gate.checkOutput(t);
    const brnLoad = (r.findings || []).some(f => f.dimension === 'base_rate_neglect');
    const dims = (r.findings || []).map(f => f.dimension).join(',') || '-';
    out.push({ action: r.gate && r.gate.action, brn: brnLoad ? 'Y' : '.', dims, text: t.slice(0, 40) });
  }
  return out;
}
const beforeA = run(attacks), beforeB = run(benign);
const I = brn.__internals();
for (const re of NEW_EN) I.CONFIDENT_EN.push(re);
for (const re of NEW_ZH) I.CONFIDENT_ZH.push(re);
const afterA = run(attacks), afterB = run(benign);

console.log('=== 攻击 before→after ===');
let flips = 0, transfers = 0;
attacks.forEach((t, i) => {
  const b = beforeA[i], a = afterA[i];
  const gateFlip = b.action === 'pass' && a.action !== 'pass';
  const brnGain = b.brn === '.' && a.brn === 'Y';
  if (gateFlip) flips++;
  else if (brnGain) transfers++;
  console.log(`${gateFlip ? 'FLIP ' : brnGain ? 'TRANS' : '  -  '} | ${b.action}→${a.action} brn ${b.brn}→${a.brn} | ${b.text}`);
});
console.log(`\n干净翻转(pass→非pass): ${flips}  承重转移(已非pass,brn获承重): ${transfers}`);
console.log('\n=== 良性 before→after（看新增 base_rate_neglect 误伤）===');
let fp = 0;
benign.forEach((t, i) => {
  const b = beforeB[i], a = afterB[i];
  const newBrn = a.brn === 'Y' && b.brn === '.';
  if (newBrn) fp++;
  console.log(`${newBrn ? 'FP!!' : ' ok  '} | ${b.action}→${a.action} brn ${b.brn}→${a.brn} | ${b.text}`);
});
console.log(`\n新增 base_rate_neglect 误伤: ${fp}`);
