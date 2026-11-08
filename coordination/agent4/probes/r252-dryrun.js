/**
 * r252-dryrun.js — selection-on-dependent-variable 模块层干跑
 * 攻击应 hit、疑难良性应 miss、邻接领地 informational（确认边界）。
 */
const path = require('path');
const { detectSelectionOnDependentVariable } = require(path.join(__dirname, '..', '..', '..', 'src', 'selection-on-dependent-variable.js'));

const ATTACK = [
  '能活下来的公司都融过资，所以融资能救命',
  '活到九十岁的老人都坚持早起，所以早起能让人长寿',
  '上岸的考生都报过这个班，所以报这个班就能考上',
  '战胜癌症的人都心态乐观，所以乐观就能战胜癌症',
  '熬过寒冬的企业都囤过现金，所以囤现金让企业活了下来',
  '中了彩票的人都坚持买号，所以坚持买号就能中奖',
  '所以融资能救命——你看，能活下来的公司都融过资',
  '凡是成功活过寒冬的企业，无一例外都囤过大量现金，可见囤现金让企业活了下来',
  'Among the companies that survived, all had raised funding, so raising funding is what saves companies',
  'Everyone who beat the illness had tried this treatment, so the treatment is the cure',
  'The startups that made it all worked eighty-hour weeks, so working eighty hours is what makes a startup succeed',
  'Those who reached the summit had trained at altitude, so altitude training is why they summited',
  'The students who passed all had used this app, so the app is what gets students to pass',
  'All the survivors of the crash had worn helmets, which proves helmets are what saved them',
];

const BENIGN = [
  '能活下来的公司有个共同点：都融过资，这值得研究，但不能就此断定融资是原因',
  '活到九十岁的老人普遍早起，不过长寿可能和基因、医疗、饮食都有关',
  '战胜癌症的人里乐观者居多，可这和治疗效果谁是因谁是果还不清楚',
  '上岸的考生很多报过这个班，但报班和考上都可能是准备充分的体现',
  '存活患者都用过偏方，可偏方也许只在轻症里被用，得看重症的数据',
  '中彩票的人确实常买号，但买号只是必要条件，说明不了它导致中奖',
  '夺冠球队多请过心理教练，可这更可能是结果——成绩好了才请得起',
  'Among the survivors all wore seatbelts, which is expected, but we still need a controlled comparison',
  'These patients all recovered and all took the drug, but recovery could reflect spontaneous remission',
  'Everyone who passed used the app, though app use may just mark already-motivated students',
  'The lottery winners bought regularly, but that is necessary, not sufficient — we cannot infer it causes winning',
  'Those who summited trained at altitude, yet altitude training may correlate with resources rather than cause the summit',
];

const ADJACENT = {
  'survivorship_proper(期望 miss，归132)': [
    '比尔·盖茨辍学创业成了世界首富，所以你也该退学',
    '那个主播一场直播赚一百万，做主播真轻松',
    'Steve Jobs dropped out and built Apple, so college is unnecessary',
  ],
  'illicit_conversion_proper(期望 miss，归167)': [
    '夺冠的球队都请过心理教练，所以心理教练是夺冠的关键',
    '闯出来的创业者都敢赌，所以敢赌正是他们闯出来的原因',
  ],
  'RCT/collider_proper(期望 miss，归209)': [
    '随机对照试验显示，用药组存活率显著更高，所以药提高了存活率',
    'In a randomized trial the treatment group survived longer, so the treatment improves survival',
    '控制了年龄和病情后，用药仍与更高存活率相关，这支持药物的作用',
  ],
};

function run(label, list, want) {
  let ok = 0, bad = 0;
  const lines = [];
  for (const t of list) {
    const r = detectSelectionOnDependentVariable(t);
    const got = r.hit ? 'HIT' : 'miss';
    const good = (want === 'hit') === !!r.hit;
    if (good) ok++; else bad++;
    lines.push(`  ${good ? 'ok  ' : 'BAD '} ${got}  ${t.slice(0, 42).padEnd(44)} count=${r.count||0}${r.hit ? '  ' + (r.evidence && r.evidence[0] ? r.evidence[0].slice(0,40) : '') : ''}`);
  }
  console.log(`\n=== ${label}（期望全 ${want}）：ok ${ok}｜bad ${bad} ===`);
  lines.forEach(l => console.log(l));
}

run('ATTACK(期望 hit)', ATTACK, 'hit');
run('BENIGN(期望 miss)', BENIGN, 'miss');
for (const [k, v] of Object.entries(ADJACENT)) run(k, v, 'miss');
