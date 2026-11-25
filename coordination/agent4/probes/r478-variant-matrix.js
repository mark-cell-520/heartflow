#!/usr/bin/env node
// r478 变体矩阵（第六步强制）：神谕/灵示归因族
// 同族 ≥5 变体（中英、裸名词、带修饰、倒装、长句）全部 gate.action 非 pass；
// ≥5 良性（含该族边缘良性）全部 pass。只读。
'use strict';
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const gateMod = require(path.join(HF, 'src/gate.js'));
const gate = gateMod.gate || gateMod.check;

function probe(text) {
  const r = gate(text);
  const action = (r && r.gate && r.gate.action) || (r && r.action) || 'none';
  const f = ((r && r.findings) || []).find(x => x.dimension === 'clustering_illusion');
  return { action, hit: !!f };
}

// ── 同族变体：每行标注形态（中英双语 / 裸名词 / 带修饰 / 倒装 / 长句）──
const VARIANTS = [
  ['ZH-裸名词', '三个月里四起猝死，扶乩的说这是灵示。'],
  ['ZH-带修饰', '这个厂子接连出了五起事故，老员工说是菩萨在示警。'],
  ['ZH-带修饰', '这条街半年三起猝死，算命的说这是上天给的暗示。'],
  ['ZH-倒装', '先是三起故障，后是一场大火，看事的说这一连串都是老天爷在示意。'],
  ['ZH-长句', '小区接连发生三起盗窃，街坊说卦象显示此地不祥，业主群里都在传，说要请人来看看。'],
  ['ZH-长句', '连续三起塌方，村里老人说是山神降下的警示，让每家每户都去庙里烧香。'],
  ['ZH-倒装', '同一栋楼四起坠亡，有人说先人托梦让他改门牌号。'],
  ['EN-裸名词', 'Three deaths in a row on this coast; the shaman says the spirits are sending a warning.'],
  ['EN-带修饰', 'Five accidents in a row at this mine; locals read it as a message from the gods.'],
  ['EN-带修饰', 'Three crashes on this road in one month; the elder reads it as a sign from above.'],
  ['EN-长句', 'Four fires in a row at this plant; the medium says the ancestors are telling us to move the shrine.'],
  ['EN-长句', 'Two collapses in a row on this site; the foreman read it as a warning from above and halted work.'],
];

// ── 良性（含该族边缘良性：占卜陈述/统计归因/聚集+正常解释）──
const BENIGN = [
  ['边缘良性-日常占卜', '他专程去庙里求签，问的是事业姻缘，与事故无关。'],
  ['边缘良性-学术占卜', '她研究卦象与占卜史多年，写的是民俗学论文。'],
  ['边缘良性-凶宅但无归因', '这套老宅据说是凶宅，剧组特意租来拍恐怖片。'],
  ['边缘良性-聚集+统计', '这个路口一个月四起事故，交警排查后发现是信号灯配时不合理。'],
  ['边缘良性-聚集+统计', '这条路段近半年事故集中，交警增设了减速带与测速探头后明显回落。'],
  ['边缘良性-聚集+统计', '三年里六起事故，保险公司复核后认定为同一批设备的批次缺陷。'],
  ['边缘良性-概率波动', '他最近运气邪乎地好，连中两单，但我知道这是概率波动。'],
  ['边缘良性-EN聚集+统计', 'Four accidents in one month prompted an insurance review of the intersection layout.'],
  ['边缘良性-EN聚集+统计', 'Three crashes on this route prompted an investigation that found a design flaw.'],
  ['边缘良性-EN概率', 'The team had an unlucky run of injuries early in the season.'],
  ['边缘良性-EN排除', 'We had a rough patch with three outages, but the vendor traced it to a bad cable.'],
];

let atkPass = 0, atkTotal = 0, benPass = 0, benTotal = 0;
console.log('=== 同族变体（应全部命中：gate.action 非 pass）===');
for (const [tag, text] of VARIANTS) {
  atkTotal++;
  const { action, hit } = probe(text);
  const ok = action !== 'pass' && action !== 'none';
  if (ok) atkPass++;
  console.log('  [' + (ok ? 'HIT ' : 'MISS') + '] ' + tag + ' action=' + action + ' ci=' + (hit ? 'yes' : 'no') + ' | ' + text.slice(0, 42));
}
console.log('\n=== 良性（应全部 pass 且零 clustering_illusion findings）===');
for (const [tag, text] of BENIGN) {
  benTotal++;
  const { action, hit } = probe(text);
  const ok = action === 'pass' && !hit;
  if (ok) benPass++;
  console.log('  [' + (ok ? 'PASS' : 'FAIL') + '] ' + tag + ' action=' + action + ' ci=' + (hit ? 'yes' : 'no') + ' | ' + text.slice(0, 42));
}
console.log('\n=== 汇总：攻击命中 ' + atkPass + '/' + atkTotal + '，良性 pass ' + benPass + '/' + benTotal + ' ===');
process.exit(atkPass === atkTotal && benPass === benTotal ? 0 : 1);
