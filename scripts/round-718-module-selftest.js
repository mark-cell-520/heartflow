// r718 模块层自测：texas_sharpshooter 攻击全命中、良性 0 误伤
const { checkTexasSharpshooter, __internals } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/texas-sharpshooter.js');
const hit = t => checkTexasSharpshooter(t).hit;
let pass = 0, fail = 0;
const T = (label, cond) => { if (cond) { pass++; } else { fail++; console.log('  FAIL: ' + label); } };

// ── 攻击样本（9 条，与 r718 探测器一致）──────────────────────────
const attacks = [
  '先开枪再画靶心，怎么解释都说得通',
  '他先有了结论，再回头找数据凑出规律',
  '数据里随机出现的巧合，被他讲成了必然规律',
  '先定好答案，再从一堆数据里挑出能对上的一段',
  '事后把散落的点连起来，说这就是趋势',
  '结果出来之后才划定范围，然后宣称预测精准',
  'He drew the target around the bullet holes and called it accuracy.',
  'They found a pattern in random noise and presented it as a law.',
  'She decided the conclusion first, then picked the data that fit.',
];
for (const t of attacks) T('attack: ' + t.slice(0, 30), hit(t) === true);

// ── 良性样本（9 条，与 r718 探测器一致）──────────────────────────
const benign = [
  '我们预先注册了假设，再收集数据检验，避免事后凑规律',
  '这个相关性是在探索性分析中发现的，需要独立样本验证',
  '数据里的波动在统计显著性范围内，不能算规律',
  '我们做了多重比较校正，排除随机巧合造成的假阳性',
  'The hypothesis was pre-registered before data collection began.',
  'We ran a holdout test to check whether the pattern generalizes.',
  '样本量太小，观察到的差异可能是随机波动',
  '这个规律在另一个数据集上没有得到复现',
  '我们报告了所有检验的结果，包括不显著的那些',
];
for (const t of benign) T('benign: ' + t.slice(0, 30), hit(t) === false);

// ── __internals 导出覆盖 ────────────────────────────────────────
const I = __internals();
T('internals: POSTHOC_ZH', I.POSTHOC_ZH instanceof RegExp);
T('internals: POSTHOC_EN', I.POSTHOC_EN instanceof RegExp);
T('internals: NOISE_SRC_ZH', I.NOISE_SRC_ZH instanceof RegExp);
T('internals: NOISE_SRC_EN', I.NOISE_SRC_EN instanceof RegExp);
T('internals: LAW_PRESENT_ZH', I.LAW_PRESENT_ZH instanceof RegExp);
T('internals: LAW_PRESENT_EN', I.LAW_PRESENT_EN instanceof RegExp);
T('internals: META_DISCOURSE', I.META_DISCOURSE instanceof RegExp);
T('internals: METHOD_TRANSPARENT', I.METHOD_TRANSPARENT instanceof RegExp);
T('internals: THIRD_PERSON_EXEMPT', I.THIRD_PERSON_EXEMPT instanceof RegExp);

// ── 逐腿验证（负例注入的语义基础：置空承重腿后命中必须消失）──────
// 结构：腿②b 承重 ×（腿① 或 腿②a）。置空 POSTHOC 后，含噪声词的样本
// 仍走 noise×law 通路命中；不含噪声词的样本必须消失。
const BLANK = /(?!x)x/;
const ZH_NOISE = /(?:随机|巧合|偶然|波动|散点|散落的点|噪声|噪音)/;
const EN_NOISE = /(?:noise|coincidence|random|scattered|randomness)/i;
for (const t of attacks) {
  const isZh = /[\u4e00-\u9fff]/.test(t);
  if (isZh) {
    const hasNoise = ZH_NOISE.test(t);
    const hasPosthoc = /(?:先开枪|先射箭|先打枪|先定好答案|先有结论|先下结论|事后|之后才|回头|倒着|马后炮)/.test(t);
    T('blank POSTHOC_ZH: ' + t.slice(0, 24), checkTexasSharpshooter(t, { POSTHOC_ZH: BLANK }).hit === hasNoise);
    T('blank NOISE_SRC_ZH: ' + t.slice(0, 24), checkTexasSharpshooter(t, { NOISE_SRC_ZH: BLANK }).hit === hasPosthoc);
    T('blank LAW_PRESENT_ZH: ' + t.slice(0, 24), checkTexasSharpshooter(t, { LAW_PRESENT_ZH: BLANK }).hit === false);
  } else {
    const hasNoise = EN_NOISE.test(t);
    const hasPosthoc = /(?:after\s+the\s+fact|afterwards|worked\s+backward|reverse[- ]?engineered|decided\s+the\s+conclusion\s+first|picked\s+the\s+data\s+first|connected\s+the\s+dots\s+after|drew\s+the\s+(?:target|bullseye|circle)\s+(?:around|after)|moved\s+the\s+goal\s+after|chose\s+the\s+target\s+after)/i.test(t);
    T('blank POSTHOC_EN: ' + t.slice(0, 24), checkTexasSharpshooter(t, { POSTHOC_EN: BLANK }).hit === hasNoise);
    T('blank NOISE_SRC_EN: ' + t.slice(0, 24), checkTexasSharpshooter(t, { NOISE_SRC_EN: BLANK }).hit === hasPosthoc);
    T('blank LAW_PRESENT_EN: ' + t.slice(0, 24), checkTexasSharpshooter(t, { LAW_PRESENT_EN: BLANK }).hit === false);
  }
}

console.log('module-selftest: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail > 0 ? 1 : 0);
