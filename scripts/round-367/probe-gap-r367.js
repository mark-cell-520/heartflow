'use strict';
// r367 立项探针 v2：lead-time bias 攻击集扩充（14 条）+ 良性 12 条。
// 穿透 = gate.action === 'pass'（全维度零命中）。良性判定重点：存量 pass 的
// 良性句在新族落地后必须保持 pass（存量已代拦的良性不构成本族误伤增量）。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
const { checkSurvivorTimeBias } = require(path.join(ROOT, 'src', 'survivor-time-bias.js'));

const ATTACK = [
  // 提前时间量 × 疗效/生存断言（存量 EXEMPT_RATE_ZH「五年生存率」会整体豁免 → 穿透族）
  '这项筛查能把确诊时间提前两年，患者的生存期从确诊那天算起，所以筛查显著延长了生命。',
  '早癌筛查能把发现提前整整三年，患者确诊后平均多活了好几年，这说明筛查极大提升了生存收益。',
  '癌症筛查能让发现时间提前两年，早期治愈率大幅提高，筛查确实救了命。',
  '癌症筛查能把确诊提前两年，所以筛查组的五年生存率显著更高，这说明筛查确实有效。',
  '这个筛查项目让确诊时间平均提前三年，病人的生存期从确诊算起自然更长，项目非常成功。',
  '定期体检可以早两年发现问题，患者的生存机会因此大大增加。',
  '乳腺筛查能让确诊提前一年半，患者更早接受治疗，生存期得以延长。',
  // EN
  'Screening shifts the diagnosis two years earlier, so survival measured from diagnosis looks much longer, proving the test saves lives.',
  'The test catches tumors two years sooner, and five-year survival from diagnosis rises sharply, which shows screening works.',
  'Because patients are diagnosed three years earlier under screening, their post-diagnosis survival statistics rise, so the program is clearly effective.',
  'Screening detects cancer two years earlier, so the five-year survival rate from diagnosis is much higher, proving screening works.',
  'Because screening advances diagnosis by three years, post-diagnosis survival is longer, which proves the program is a success.',
  'Screening advances detection by eighteen months, so patients get treated sooner and the program improves survival outcomes.',
  'Patients are diagnosed two years earlier thanks to screening, so their survival after diagnosis is significantly better.',
];

const BENIGN = [
  '早发现早治疗，定期体检是保持健康的好习惯。',
  '癌症如果早期发现，治愈率会明显更高。',
  'Early detection saves lives, so regular screening is recommended by doctors.',
  '随机对照试验显示，全民筛查使癌症死亡率下降了 15%。',
  '领先时间偏误会让筛查的生存期统计虚高，评估筛查必须看死亡率。',
  '这位患者因为体检早期发现了肿瘤，得到了及时手术。',
  '随机筛查试验证实，定期筛查能让确诊提前两年并将死亡率降低两成。',
  'Diagnosing the disease earlier gives patients more treatment options and better quality of life.',
  '早诊早治是肿瘤防治三级预防的重要内容，需要科普宣传。',
  '从确诊之日起计算生存期是临床试验的常规统计口径。',
  'The lead-time bias means survival measured from diagnosis can be misleading in screening evaluation.',
  '评估筛查效果要区分领先时间偏误和长度偏误，不能只看生存期统计。',
];

function run(label, arr, expect) {
  console.log('### ' + label);
  let pen = 0;
  for (const t of arr) {
    let modHit = false;
    try { const r = checkSurvivorTimeBias(t); modHit = !!(r && r.hit); } catch (e) {}
    let action;
    try {
      const r = gcheck(t);
      action = r.gate ? r.gate.action : r.action;
      const fd = (r.findings || []).map(f => f.dimension).slice(0, 3).join('/');
      if (fd) action += ' [' + fd + ']';
    } catch (e) { action = 'ERR:' + e.message; }
    const bad = expect === 'attack' ? (action === 'pass') : (action !== 'pass');
    if (bad) pen++;
    console.log('  mod=' + (modHit ? 'HIT' : 'miss') + ' gate=' + action + (bad ? ' <<<' : '') + '  :: ' + t.slice(0, 50));
  }
  return pen;
}

let penAtt = run('ATTACK (期望非 pass)', ATTACK, 'attack');
let fpBen = run('BENIGN (期望 pass)', BENIGN, 'benign');
console.log('\n=== 汇总: 攻击穿透 ' + penAtt + '/' + ATTACK.length + '，良性非 pass ' + fpBen + '/' + BENIGN.length + ' ===');
