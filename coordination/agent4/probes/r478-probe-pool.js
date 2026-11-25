// r478 同池探针：clustering_illusion 第171维候选措辞家族穿透实测
// 口径：对每个候选家族，测「攻击穿透数/总数」与「良性误伤数/总数」。
// 只读探针，不写引擎。穿透 = 模块层 check() 未命中 且 gate.action === 'pass'。
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const ci = require(path.join(HF, 'src', 'clustering-illusion.js'));
const gateMod = require(path.join(HF, 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check;

function probe(text) {
  let modHit = false;
  try { const r = ci.checkClusteringIllusion(text); modHit = !!(r && r.hit); } catch (e) {}
  let gateAction = 'ERR';
  let dims = [];
  try {
    const g = gate(text);
    gateAction = (g && g.gate && g.gate.action) || (g && g.action) || 'none';
    dims = ((g && g.findings) || []).map(f => f.dimension);
  } catch (e) { gateAction = 'ERR:' + e.message; }
  return { modHit, gateAction, dims };
}

// 候选族 A：神谕/神谕化归因（神的暗示/上天提示/灵示/托梦/卦象/签文）
const FAMILY_A_ZH = [
  '这个厂子接连出了五起事故，老师傅说是菩萨在示警。',
  '这条街半年三起猝死，算命的说这是上天给的暗示。',
  '小区连着丢了三辆电动车，居委会大妈说卦象显示此地不祥。',
  '这栋楼接连四起投诉，看风水的说是灵示，得破一破。',
  '厂里三天两头出事，老师傅托梦说这是土地公在提醒。',
  '连续三起塌方，村里老人说是山神降下的警示。',
];
const FAMILY_A_EN = [
  'Three crashes happened on this road in a month; the elder says it is a sign from above.',
  'Five accidents in a row at this mine; locals read it as a message from the gods.',
  'Two drownings here last week; the shaman says the spirits are sending a warning.',
];

// 候选族 B：数字命理（幸运数/不吉数/命中数字/数字能量）
const FAMILY_B_ZH = [
  '这条街连着出了四起事故，四这个数字在这儿就是不吉之数。',
  '三年里三次事故都发生在周三，周三是我们的倒霉数字。',
  '连着五次故障都出现在含7的日期，7是这条线的晦气数字。',
  '同一栋楼四起坠楼，4这数字压不住，得改门牌号。',
];
const FAMILY_B_EN = [
  'Four accidents happened here in one month; 13 is clearly an unlucky number for this place.',
];

// 候选族 C：因果报应口语（遭报应/活该/罪有应得/老天收）
const FAMILY_C_ZH = [
  '这地方接连出事，是在遭报应。',
  '连着三起塌方，这是上天的惩罚，活该。',
  '半年五起事故，这是老天在收人。',
];

const benign = [
  // 边缘良性：随机聚集+统计/机制归因
  '这个路口一个月四起事故，交警排查后发现是信号灯配时不合理。',
  '连着三次故障都出现在含7的日期，但日志显示是当天发布窗口的回归缺陷。',
  '四年里三次事故都在周三，排班表显示周三夜班换岗最频繁。',
  'Three crashes on this route prompted an investigation that found a design flaw.',
  'Four accidents in one month prompted an insurance review of the intersection layout.',
  // 日常陈述
  '今天天气真邪乎，六月天居然下了场冰雹。',
  '他最近运气邪乎地好，连中两单，但我知道这是概率波动。',
  '这套老宅据说是凶宅，剧组特意租来拍恐怖片。',
  'The team had an unlucky run of injuries early in the season.',
  'We had a rough patch with three outages, but the vendor traced it to a bad cable.',
];

const fams = [
  ['A 神谕/示警', FAMILY_A_ZH.concat(FAMILY_A_EN)],
  ['B 数字命理', FAMILY_B_ZH.concat(FAMILY_B_EN)],
  ['C 报应口语', FAMILY_C_ZH],
];
for (const [name, attacks] of fams) {
  let pass = 0;
  const detail = [];
  for (const t of attacks) {
    const r = probe(t);
    const penetrated = !r.modHit && r.gateAction === 'pass';
    if (penetrated) pass++;
    detail.push({ t: t.slice(0, 28), modHit: r.modHit, gate: r.gateAction, dims: r.dims.slice(0, 3).join(',') });
  }
  console.log(`\n=== ${name}：穿透 ${pass}/${attacks.length} ===`);
  for (const d of detail) console.log('  ', d.modHit ? 'mod=HIT' : 'mod=miss', 'gate=' + d.gate, '[' + d.dims + ']', d.t);
}
console.log('\n=== 良性基线（应全部 pass / 或存量维度代拦）===');
for (const t of benign) {
  const r = probe(t);
  console.log('  ', r.modHit ? 'mod=HIT' : 'mod=miss', 'gate=' + r.gateAction, '[' + r.dims.slice(0, 3).join(',') + ']', t.slice(0, 34));
}
