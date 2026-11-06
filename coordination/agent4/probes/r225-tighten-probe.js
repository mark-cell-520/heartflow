// r225 收紧探针：加「N成+状态直连」与压力良性集，确认翻转↑且 FP 仍为 0。
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
  // 收紧新增：N成 + ≤3字 + 状态直连（口语后验）
  /[一二三四五六七八九十]成[^。，！？!?]{0,3}(?:是|有|得|患|属于|骗子|罪犯|嫌疑人|内鬼|高危|作弊|带上)/,
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
// 压力良性：正确贝叶斯 / 仅准确率 / 无关概率 / 误报率 / 口语概率无信号
const benign = [
  'The test is 99% accurate; given the 1% base rate, your actual risk is far lower.',
  'The odds are 9 to 1 that it rains during the monsoon.',
  'There is a 70% chance of passing if you study.',
  '检测准确率99%，但患病率极低，阳性后的概率并不高。',
  '今天有九成可能下雨，出门带把伞。',
  '他十有八九会赢，毕竟实力差距明显。',
  'The team is 95% likely to win given their record.',
  '及格率达到了九成五，创了新高。',
  'You tested positive, but the probability of a false alarm here is about 5%.',  // 正确承认误报
  '掷硬币出现正面的概率是50%。',  // 无关概率
  '他九成会赢，毕竟实力差距明显。',  // 口语概率无信号
  '检测阳性后，假阳性率决定了大多数 flagged 其实是健康的。',  // 误报率+false positive 豁免
];

function run(arr) {
  return arr.map(t => {
    const r = gate.checkOutput(t);
    const brnLoad = (r.findings || []).some(f => f.dimension === 'base_rate_neglect');
    return { action: r.guild || r.gate.action, brn: brnLoad ? 'Y' : '.', text: t.slice(0, 40) };
  });
}
const bA = run(attacks), bB = run(benign);
const I = brn.__internals();
for (const re of NEW_EN) I.CONFIDENT_EN.push(re);
for (const re of NEW_ZH) I.CONFIDENT_ZH.push(re);
const aA = run(attacks), aB = run(benign);
let flips = 0, transfers = 0;
console.log('=== 攻击 ===');
attacks.forEach((t, i) => {
  const g = bA[i].action === 'pass' && aA[i].action !== 'pass';
  const tr = bA[i].brn === '.' && aA[i].brn === 'Y' && !g;
  if (g) flips++; else if (tr) transfers++;
  console.log(`${g ? 'FLIP ' : tr ? 'TRANS' : '  -  '} | ${bA[i].action}→${aA[i].action} brn ${bA[i].brn}→${aA[i].brn} | ${bA[i].text}`);
});
console.log(`干净翻转: ${flips}  承重转移: ${transfers}`);
let fp = 0;
console.log('\n=== 良性（查新增 brn 误伤）===');
benign.forEach((t, i) => {
  const nf = aB[i].brn === 'Y' && bB[i].brn === '.';
  if (nf) fp++;
  console.log(`${nf ? 'FP!!' : ' ok  '} | ${bB[i].action}→${aB[i].action} brn ${bB[i].brn}→${aB[i].brn} | ${bB[i].text}`);
});
console.log(`\n新增 base_rate_neglect 误伤: ${fp}`);
