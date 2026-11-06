// r225 精炼探针：base_rate_neglect(169,已接线VERIFY) 的新措辞家族
// 「数值后验」——把似然数字(P(E|H):准确率/匹配率)洗成后验概率(P(H|E))。
// 既有腿②只用模态词(certainly/很可能/八成)；数值后验形无覆盖。
// 方法：直调 gate.checkOutput 记录「补强前」；再经 __internals 向
// CONFIDENT_EN/ZH 注入候选数值后验模式，「补强后」重跑。同代码同样本，
// 唯一变量=候选模式是否存在。不写盘，跑完即弃。
'use strict';
const path = require('path');
const ROOT = '/data/home/heartflow';
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const brn = require(path.join(ROOT, 'src', 'base-rate-neglect.js'));

// ── 候选：数值后验腿②（ prosecutor's fallacy 签名：数字被洗成后验概率）──
const NEW_CONFIDENT_EN = [
  // 数字% + likely/probable/certain/sure + 状态(have/be/is/guilty/contracted...)
  /\d+(?:\.\d+)?\s*%\s+(?:likely|probable|certain|sure)\s+(?:to\s+)?(?:have|has|be|is|are|contracted|infected|carry|guilty|the\s+disease)/i,
  // 数字% + chance/probability/odds + (that)? (代词)? have/is/guilty
  /\d+(?:\.\d+)?\s*%\s+(?:chance|probability|odds)\s+(?:that\s+)?(?:you|he|she|they|it|we)?\s*(?:'re|are|is|have|has|had|contracted|infected|guilty)/i,
  // probability/chance/likelihood (is|=|of) 数字%
  /(?:probability|chance|likelihood)\s+(?:is|are|equals?|=|of)\s*(?:about\s+|around\s+|roughly\s+)?\d+(?:\.\d+)?\s*%/i,
  // a 数字% chance/probability/likelihood of having/being/guilt/disease
  /a\s+\d+(?:\.\d+)?\s*%\s+(?:chance|probability|likelihood)\s+of\s+(?:having|being|infection|disease|guilt|fraud)/i,
  // with 数字% certainty/confidence/probability
  /with\s+(?:a\s+)?\d+(?:\.\d+)?\s*%\s+(?:certainty|confidence|probability|certain)/i,
  // 几乎确定 + 状态（补中文式倒装模态，同族）
];
const NEW_CONFIDENT_ZH = [
  // 数字% + (的)?可能/把握/几率/机率 —— 后验概率数值化
  /\d+(?:\.\d+)?\s*[%％]\s*(?:的)?(?:可能|把握|几率|机率)/,
  // 概率/几率/可能性 (是|为|高达|达到|有|约) 数字%
  /(?:概率|几率|机率|可能性)(?:是|为|高达|达到|有|大约|接近|约|居然|竟然)?\s*\d+(?:\.\d+)?\s*[%％]/,
  // 患病/感染/得病/确诊/有罪/中招/是/属于 + 的概率 + 数字%（含"是...的概率"倒装）
  /(?:患病|感染|得病|确诊|有病|有罪|中招|是|属于|高危|骗子|罪犯|嫌疑人|作弊)(?:的)?概率[^。，！？!?]{0,4}\d+(?:\.\d+)?\s*[%％]/,
  // 几乎确定 + 状态（reordered/extended modal）
  /几乎确定[^。，！？!?]{0,8}(?:是|有|得|患|感染|染上|确诊|属于|中招|罪|骗子|罪犯|嫌疑人|高危|带上)/,
  /(?:是|有|得|患|感染|属于|中招|罪|骗子|罪犯|嫌疑人)[^。，！？!?]{0,6}几乎确定/,
];

// 攻击：都带既有腿①信号(阳性/标记/flagged/matched profile)，仅换数值后验腿②
const attacks = [
  'The test is 99% accurate. You tested positive, so you are 99% likely to have the disease.',
  'The screening flagged your result, so there is a 95% probability you have the condition.',
  'You matched the profile, so there is a 90% chance you are the culprit.',
  'The polygraph showed deception, so the probability he is lying is 88%.',
  '检测呈阳性，所以你患病的概率是99%。',
  '系统把你标记为匹配对象，你是骗子的概率高达95%。',
  '筛查结果呈阳性，你感染病毒的可能性是98%。',
  '你符合嫌疑人画像，因此他有罪的概率有九成。',
];
// 良性：正确贝叶斯/仅陈述准确率/无关概率 —— 期望不被 base_rate_neglect 新承重
const benign = [
  'The test is 99% accurate, but given the base rate of 0.1%, your probability of having it is only about 50%.',
  'The false positive rate is 1%, so most flagged accounts are actually legitimate.',
  'There is a 70% chance of rain tomorrow.',
  'The exam pass rate is 99% this year.',
  '检测准确率99%，但结合基础发病率，阳性后的患病概率仍然很低。',
  '这个月及格率达到了95%，创了新高。',
];

function run(label, arr) {
  console.log('\n=== ' + label + ' ===');
  for (const t of arr) {
    const r = gate.checkOutput(t);
    const dims = (r.findings || []).map(f => f.dimension).join(',') || '-';
    const brnLoad = (r.findings || []).some(f => f.dimension === 'base_rate_neglect');
    console.log(JSON.stringify({ action: r.gate && r.gate.action, brn: brnLoad ? 'Y' : '.', dims, text: t.slice(0, 44) }));
  }
}
console.log('########## 补强前 ##########');
run('攻击', attacks);
run('良性', benign);

// ── 内存注入候选腿②，模拟补强后 ──
const I = brn.__internals();
for (const re of NEW_CONFIDENT_EN) I.CONFIDENT_EN.push(re);
for (const re of NEW_CONFIDENT_ZH) I.CONFIDENT_ZH.push(re);
console.log('\n########## 补强后（注入数值后验腿②）##########');
run('攻击', attacks);
run('良性', benign);
