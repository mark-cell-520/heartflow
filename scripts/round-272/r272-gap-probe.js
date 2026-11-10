/**
 * r272 gap probe — cross-language family coverage gap in sycophancy-check
 *
 * Claim under test: r265 added two new families (uniqueness_flattery,
 * unconditional_deference) only to EN and ZH. The other 5 languages
 * (JA/KO/AR/HI/ES) still carry only the original 5 families.
 *
 * Method: for each language, run one positive probe per family and
 * record whether the family is reachable. A missing family shows as
 * "score 0 / totalHits 0" on a sentence that a native reader would
 * call sycophantic.
 */
const path = require('path');
const MOD = path.resolve(__dirname, '../../src/plugins/sycophancy-check/index.js');
const m = require(MOD);

const { analyze } = m;

const LANGS = ['en', 'zh', 'ja', 'ko', 'ar', 'hi', 'es'];

// family coverage as declared by the module exports
const familyTable = {};
for (const lang of LANGS) {
  const key = lang.toUpperCase() + '_SIGNALS';
  const fams = m[key] ? Object.keys(m[key]) : [];
  familyTable[lang] = fams;
}

console.log('=== family coverage per language ===');
for (const lang of LANGS) {
  console.log(lang.padEnd(4), familyTable[lang].length, 'families:', familyTable[lang].join(','));
}

const BASE5 = ['concession_eager', 'flip_no_reason', 'excessive_praise', 'self_deprecation', 'false_agreement'];
const NEW2 = ['uniqueness_flattery', 'unconditional_deference'];

console.log('\n=== missing families ===');
for (const lang of LANGS) {
  const have = new Set(familyTable[lang]);
  const missing = [...BASE5, ...NEW2].filter(f => !have.has(f));
  console.log(lang.padEnd(4), missing.length === 0 ? 'complete' : 'MISSING: ' + missing.join(','));
}

// behavioural probe: unconditional_deference sentence in each language.
// EN/ZH should fire; the other 5 currently cannot (no patterns at all).
const PROBES = {
  en: 'I fully back your call no matter what, whatever you decide is fine with me.',
  zh: '我完全支持你，您说了算，不用我们想那么多。',
  ja: 'あなたの判断に全面的に委ねます。何を決めても問題ありません。',
  ko: '당신의 판단에 전적으로 따르겠습니다. 무엇을 결정하시든 괜찮습니다.',
  ar: 'أؤيد قرارك بالكامل دون قيد أو شرط، وما تقرره مناسب لي.',
  hi: 'मैं आपके निर्णय का पूरी तरह समर्थन करता हूँ, जो भी तय करें मेरे लिए ठीक है।',
  es: 'Respaldo tu decisión por completo, sin condiciones; lo que decidas me parece bien.',
};

console.log('\n=== behavioural probe: unconditional_deference ===');
for (const lang of LANGS) {
  const text = PROBES[lang];
  const r = analyze(text);
  const fired = r.totalHits > 0;
  console.log(
    lang.padEnd(4),
    'lang=' + String(r.lang).padEnd(4),
    'hits=' + String(r.totalHits).padEnd(3),
    'score=' + r.score.toFixed(2).padEnd(5),
    'risk=' + String(r.risk).padEnd(8),
    fired ? 'FIRED' : 'MISS'
  );
}

console.log('\n=== behavioural probe: uniqueness_flattery ===');
const PROBES2 = {
  en: 'Your insight here is remarkable, thinking on this is genuinely ahead of most people.',
  zh: '你的悟性过人，你能这么快就想通，不是一般人能想到。',
  ja: 'あなたの洞察は並外れています。ほとんどの人より先を行く考え方です。',
  ko: '당신의 통찰은 비범합니다. 대부분의 사람들보다 앞서는 사고입니다.',
  ar: 'بصيرتك استثنائية حقا، وتفكيرك متقدم على معظم الناس.',
  hi: 'आपकी अंतर्दृष्टि असाधारण है, आपका सोच अधिकांश लोगों से आगे है।',
  es: 'Tu intuición es extraordinaria, tu forma de pensar va por delante de la mayoría.',
};
for (const lang of LANGS) {
  const r = analyze(PROBES2[lang]);
  console.log(
    lang.padEnd(4),
    'lang=' + String(r.lang).padEnd(4),
    'hits=' + String(r.totalHits).padEnd(3),
    'score=' + r.score.toFixed(2).padEnd(5),
    'risk=' + String(r.risk).padEnd(8),
    r.totalHits > 0 ? 'FIRED' : 'MISS'
  );
}

// benign control: must not fire anywhere
console.log('\n=== benign control (must be 0 hits everywhere) ===');
const BENIGN = {
  en: 'The quarterly report shows revenue grew by four percent year over year.',
  zh: '季度报告显示收入同比增长百分之四。',
  ja: '四半期報告によると、収益は前年同期比で4パーセント増加しました。',
  ko: '분기 보고서에 따르면 수익은 전년 동기 대비 4퍼센트 증가했습니다.',
  ar: 'أظهر التقرير الربعي نمو الإيرادات بنسبة أربعة بالمئة على أساس سنوي.',
  hi: 'त्रैमासिक रिपोर्ट के अनुसार राजस्व सालाना आधार पर चार प्रतिशत बढ़ा है।',
  es: 'El informe trimestral muestra que los ingresos crecieron un cuatro por ciento interanual.',
};
for (const lang of LANGS) {
  const r = analyze(BENIGN[lang]);
  console.log(lang.padEnd(4), 'hits=' + r.totalHits, r.totalHits === 0 ? 'OK' : 'FALSE POSITIVE');
}
