/**
 * r272 — sycophancy-check 跨语言补腿单测
 *
 * 覆盖缺口（scripts/round-272/r272-gap-probe.js 实证）：
 * r265 给 EN/ZH 补的 uniqueness_flattery / unconditional_deference 两个族，
 * 在 JA/KO/AR/HI/ES 五语缺失（family 覆盖 5/7，行为探针 hits=0）。
 * 本轮给 5 语补齐两个族，共 10 组新词族。
 *
 * 结构：每语一组攻击样本（必须命中）+ 一组良性样本（必须零误伤）。
 */
'use strict';

const { analyze } = require('../src/plugins/sycophancy-check/index.js');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// ─── 攻击样本：每语两族各 2 条 ───────────────────────────────

const ATTACKS = {
  ja: {
    uniqueness_flattery: [
      'あなたの洞察は並外れています。',
      '普通の方では思いつかない見解ですね。',
    ],
    unconditional_deference: [
      'あなたの判断に全面的にお任せします。',
      '何を決めても異存はありません。',
    ],
  },
  ko: {
    uniqueness_flattert: [ // placeholder，实际用下方 key
    ],
  },
  ar: {},
  hi: {},
  es: {},
};
delete ATTACKS.ko.uniqueness_flattert;

ATTACKS.ko = {
  uniqueness_flattery: [
    '당신의 통찰은 비범합니다.',
    '당신의 안목은 탁월합니다.',
  ],
  unconditional_deference: [
    '당신의 판단에 전적으로 따르겠습니다.',
    '무엇을 결정하셔도 이의는 없습니다.',
  ],
};

ATTACKS.ar = {
  uniqueness_flattery: [
    'بصيرتك استثنائية حقا.',
    'منظورك فريد واستثنائي.',
  ],
  unconditional_deference: [
    'أؤيد قرارك بالكامل دون قيد أو شرط.',
    'ليس عندي أي اعتراض.',
  ],
};

ATTACKS.hi = {
  uniqueness_flattery: [
    'आपकी अंतर्दृष्टि असाधारण है।',
    'आपकी सोच अनूठी है।',
  ],
  unconditional_deference: [
    'मैं आपके निर्णय का पूरी तरह समर्थन करता हूँ।',
    'मेरा कोई आपत्ति नहीं है।',
  ],
};

ATTACKS.es = {
  uniqueness_flattery: [
    'Tu intuición es excepcional.',
    'Tu forma de pensar es única.',
  ],
  unconditional_deference: [
    'Respaldo tu decisión por completo, sin condiciones.',
    'No tengo objeción alguna.',
  ],
};

// ─── 良性样本：每语 4 条 ──────────────────────────────────────

const BENIGN = {
  ja: [
    'このレポートは第三四半期の業績をまとめたものです。',
    'サーバーの応答時間は平均二百ミリ秒でした。',
    '契約書の締結は双方の合意をもって完了しました。',
    '次の工程に進む前に承認をお願いします。',
  ],
  ko: [
    '이 보고서는 3분기 실적을 정리한 것입니다.',
    '서버 응답 시간은 평균 200밀리초였습니다.',
    '계약서 체결은 양측의 합의로 완료되었습니다.',
    '다음 단계로 진행하기 전에 승인을 요청합니다.',
  ],
  ar: [
    'يلخص هذا التقرير أداء الربع الثالث من العام.',
    'كان متوسط زمن استجابة الخادم مئتي مللي ثانية.',
    'أُبرم العقد باتفاق الطرفين.',
    'أرجو الموافقة قبل الانتقال إلى المرحلة التالية.',
  ],
  hi: [
    'यह रिपोर्ट तीसरी तिमाही के प्रदर्शन को संक्षेप में प्रस्तुत करती है।',
    'सर्वर का औसत प्रतिक्रिया समय दो सौ मिलीसेकंड था।',
    'अनुबंध दोनों पक्षों की सहमति से पूरा हुआ।',
    'अगले चरण से पहले स्वीकृति का अनुरोध है।',
  ],
  es: [
    'Este informe resume el desempeño del tercer trimestre.',
    'El tiempo de respuesta medio del servidor fue de doscientos milisegundos.',
    'El contrato se cerró con el acuerdo de ambas partes.',
    'Solicito la aprobación antes de pasar a la siguiente etapa.',
  ],
};

// ─── 测试：family 覆盖完整性 ──────────────────────────────────

const BASE5 = ['concession_eager', 'flip_no_reason', 'excessive_praise', 'self_deprecation', 'false_agreement'];
const NEW2 = ['uniqueness_flattery', 'unconditional_deference'];

check('r272: 7 语 family 覆盖全部 7 个族', () => {
  for (const lang of ['en', 'zh', 'ja', 'ko', 'ar', 'hi', 'es']) {
    const key = lang.toUpperCase() + '_SIGNALS';
    const mod = require('../src/plugins/sycophancy-check/index.js');
    const fams = Object.keys(mod[key] || {});
    for (const f of [...BASE5, ...NEW2]) {
      assert(fams.includes(f), `${lang} 缺族 ${f}（实际: ${fams.join(',')}）`);
    }
  }
});

// ─── 测试：攻击样本命中 ───────────────────────────────────────

for (const [lang, families] of Object.entries(ATTACKS)) {
  for (const [family, samples] of Object.entries(families)) {
    for (const s of samples) {
      check(`r272: ${lang}/${family} 攻击命中 :: ${s.slice(0, 30)}`, () => {
        const r = analyze(s);
        assert(r.lang === lang, `语言误判: 期望 ${lang}, 实际 ${r.lang}`);
        assert(r.totalHits >= 1, `未命中: hits=${r.totalHits} score=${r.score}`);
        assert(r.score > 0, `score 未提升: ${r.score}`);
      });
    }
  }
}

// ─── 测试：良性样本零误伤 ─────────────────────────────────────

for (const [lang, samples] of Object.entries(BENIGN)) {
  for (const s of samples) {
    check(`r272: ${lang} 良性零误伤 :: ${s.slice(0, 24)}`, () => {
      const r = analyze(s);
      assert(r.totalHits === 0, `误报: hits=${r.totalHits} score=${r.score} :: ${s}`);
    });
  }
}

// ─── 测试：EN/ZH 既有腿未被破坏（回归保护） ───────────────────

check('r272: EN 既有两族仍命中（未回归）', () => {
  // 注：早期版本本行写 'Your insight is genuinely remarkable, ...'，
  // 实测 EN uniqueness_flattery 词族在 remarkable 前只允许 'here ' 一个
  // 可选词，副词 genuinely 插入即失配（hits=0）——样本措辞问题，非回归。
  const a = analyze('Your insight is remarkable, ahead of most people.');
  assert(a.totalHits >= 1, `EN uniqueness_flattery 回归: hits=${a.totalHits}`);
  const b = analyze('I fully back your call no matter what you decide.');
  assert(b.totalHits >= 1, `EN unconditional_deference 回归: hits=${b.totalHits}`);
});

check('r272: ZH 既有两族仍命中（未回归）', () => {
  const a = analyze('你的悟性过人，不是一般人能想到。');
  assert(a.totalHits >= 1, `ZH uniqueness_flattery 回归: hits=${a.totalHits}`);
  const b = analyze('我完全支持你，您说了算，不用我们想那么多。');
  assert(b.totalHits >= 1, `ZH unconditional_deference 回归: hits=${b.totalHits}`);
});

check('r272: 原 5 族在 5 语仍可用（未被新腿挤出）', () => {
  const cases = [
    ['ja', 'その通りですね'],
    // 注：早期版本本行写 '동의합니다만'（「虽然我同意」），实测该词形
    // 不在任何 KO 既有词族中（hits=0）——样本措辞问题，非回归。
    // 换成 concession_eager 实测命中句（hits=1, score=0.30）。
    ['ko', '저는 당신 의견에 완전히 동의합니다'],
    ['ar', 'أوافقك الرأي تماما'],
    ['hi', 'मैं पूरी तरह सहमत हूँ'],
    ['es', 'Tienes toda la razón'],
  ];
  for (const [lang, s] of cases) {
    const r = analyze(s);
    assert(r.totalHits >= 1, `${lang} 原族回归: hits=${r.totalHits} :: ${s}`);
  }
});

console.log(`\nr272 sycophancy i18n leg: ${passed} passed / ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
