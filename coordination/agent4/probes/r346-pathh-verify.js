'use strict';
const path = require('node:path');
const ROOT = '/data/home/heartflow';
const { checkImmortalTimeBias } = require(path.join(ROOT, 'src', 'immortal-time-bias.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const ZH = [
  '癌症筛查让每年新确诊的病例数成倍增长，这表明这种病的发病率确实在升高。',
  '普筛出大量本来一辈子都不会发病的病变，病例数因此激增，可见这种病真的在蔓延。',
  '这项筛查普及后确诊人数翻了好几倍，可见发病率真的在上升，患病的人越来越多了。',
  '早筛查出一批终生不会恶变的肿瘤，新增病例大幅增加，说明患这种癌的人越来越多了。',
  '自从开展全员癌症早筛以来，确诊人数一年内翻了好几倍，看来这种病的发病率真的在快速上升。',
  '普筛上线后新发病例数激增，这说明疾病真的在变多，发病率越来越高。',
  '推行筛查之后，查出的病例比以前多了好几倍，可见这种疾病确实越来越多。',
  '体检普及之后确诊人数节节攀升，说明发病率在真实上涨，不是统计错觉。',
];
const EN = [
  'Widespread screening has multiplied the number of newly diagnosed cases, which shows the incidence of this cancer is genuinely rising.',
  'The screening program surfaced hundreds of cases that would never have progressed, and the case count surge proves the disease is spreading.',
  'After the screening program rolled out, the number of diagnosed cases tripled, which shows the disease is truly becoming more common.',
  'Since we started screening, the case count has surged, so the incidence of this disease really is rising.',
  'Screening detected far more tumors this decade, proving the disease is actually becoming more widespread.',
  'Population-wide early detection has doubled the number of reported cases in five years, suggesting the illness is becoming more prevalent.',
  'Screening detected far more tumors this decade, and more people are being diagnosed with the disease every year.',
];
for (const s of ZH.concat(EN)) {
  const m = checkImmortalTimeBias(s);
  const g = gate(s);
  const dims = (g.findings || []).map(f => f.dimension).join(',');
  console.log((m.hit ? 'M-HIT ' : 'M-MISS') + ' | ' + (g.gate.action === 'pass' ? 'PASS' : g.gate.action) + ' | ' + dims + ' | ' + (m.detail || ''));
}
const BEN = [
  '筛查推广后确诊人数上升了，但这主要是过去漏诊被及时发现，并不代表发病率真的上升。',
  '开展早筛后确诊人数增多是预期内的，后续随访方案已经跟上。',
  'Screening increased the number of detected cases, but this does not mean the disease is becoming more common.',
  '病例数上升不等于患病率上升，确诊人数受筛查普及度影响，需用总死亡率核对。',
  '早筛提高了检出率，但流行病学家提醒这并不代表疾病真的在增多。',
  'Screening increases detected cases, but researchers caution this does not mean the true incidence is rising.',
  '筛查让更多早期病例被发现，但这可能是检出提前，不能直接说明发病率真的上升。',
  'A surge in diagnosed cases may reflect better detection rather than a real increase in disease frequency.',
];
for (const s of BEN) {
  const m = checkImmortalTimeBias(s);
  console.log((m.hit ? 'FP!! ' : 'ok   ') + ' | ' + s.slice(0, 40));
}
