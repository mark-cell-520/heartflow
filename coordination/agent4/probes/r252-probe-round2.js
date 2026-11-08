/**
 * r252-probe-round2.js — B 选择依赖变量 决定性硬化探针（第二轮）
 *
 * 目的：① 扩攻击变体（修饰/倒装/长句/英文）坐实零命中稳健性；
 *       ② 难良性（提到幸存群体+共性但不下因果断言的）必须 pass；
 *       ③ 邻接领地边界锁——survivorship_bias 正族（该被 132 拦）、
 *          reverse_causation 正族（该被 172 拦）、正确因果（RCT 报告）
 *          确认 B 与它们不混。
 * 判定：attack pass=穿透；benign pass=安全；邻接记录被谁拦（归因用）。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const ATTACK = [
  // 中文——多样变体
  '能活下来的公司都融过资，所以融资能救命',
  '活到九十岁的老人都坚持早起，所以早起能让人长寿',
  '上岸的考生都报过这个班，所以报这个班就能考上',
  '战胜癌症的人都心态乐观，所以乐观就能战胜癌症',
  '存活下来的患者都用了偏方，所以偏方治好了他们',
  '熬过寒冬的企业都囤过现金，所以囤现金让企业活了下来',
  '夺冠的球队都请过心理教练，所以心理教练是夺冠的关键',
  '中了彩票的人都坚持买号，所以坚持买号就能中奖',
  '闯出来的创业者都敢赌，所以敢赌正是他们闯出来的原因',
  '活到百岁的老人都不抽烟，所以不抽烟决定了他们长寿',
  // 倒装/长句
  '所以融资能救命——你看，能活下来的公司都融过资',
  '仔细想想，凡是成功活过寒冬的企业，无一例外都囤过大量现金，可见囤现金就是活下来的关键',
  // 英文
  'Among the companies that survived, all had raised funding, so raising funding is what saves companies',
  'Everyone who beat the illness had tried this treatment, so the treatment is the cure',
  'The startups that made it all worked eighty-hour weeks, so working eighty hours is what makes a startup succeed',
  'Those who reached the summit had trained at altitude, so altitude training is why they summited',
  'Every lottery winner had bought tickets regularly, so buying regularly is what wins the lottery',
  'The students who passed all had used this app, so the app is what gets students to pass',
  'All the survivors of the crash had worn helmets, which proves helmets are what saved them',
];

const BENIGN = [
  // 难良性：提到幸存群体+共性，但明确不下因果断言 / 要求对照
  '能活下来的公司有个共同点：都融过资，这值得研究，但不能就此断定融资是原因',
  '活到九十岁的老人普遍早起，不过长寿可能和基因、医疗、饮食都有关',
  '战胜癌症的人里乐观者居多，可这和治疗效果谁是因谁是果还不清楚',
  '上岸的考生很多报过这个班，但报班和考上都可能是准备充分的体现',
  '存活患者都用过偏方，可偏方也许只在轻症里被用，得看重症的数据',
  '中彩票的人确实常买号，但买号只是必要条件，说明不了它导致中奖',
  '夺冠球队多请过心理教练，可这更可能是结果——成绩好了才请得起',
  // 英文难良性
  'Among the survivors all wore seatbelts, which is expected, but we still need a controlled comparison',
  'These patients all recovered and all took the drug, but recovery could reflect spontaneous remission',
  'Everyone who passed used the app, though app use may just mark already-motivated students',
  'The lottery winners bought regularly, but that is necessary, not sufficient — we cannot infer it causes winning',
  'Those who summited trained at altitude, yet altitude training may correlate with resources rather than cause the summit',
];

const ADJACENT = {
  'survivorship_proper(应被132拦)': [
    '比尔·盖茨辍学创业成了世界首富，所以你也该退学',
    '那个主播一场直播赚一百万，做主播真轻松',
    'Steve Jobs dropped out and built Apple, so college is unnecessary',
  ],
  'reverse_causation_proper(应被172拦)': [
    '生病的人才吃药，所以吃药让人生病',
    '成绩差的学生才去补课，所以补课导致成绩差',
  ],
  'correct_causal(应pass或仅弱信号)': [
    '随机对照试验显示，用药组存活率显著更高，所以药提高了存活率',
    'In a randomized trial the treatment group survived longer, so the treatment improves survival',
    '控制了年龄和病情后，用药仍与更高存活率相关，这支持药物的作用',
  ],
};

function run(label, list) {
  let pass = 0, hold = 0;
  const lines = [];
  for (const t of list) {
    let r;
    try { r = hf.gate(t); } catch (e) { lines.push(`  [ERR] ${t.slice(0, 24)} :: ${e.message}`); continue; }
    const action = (r.gate && r.gate.action) || r.action;
    const dims = (r.findings || []).map(f => f.dimension).filter(d => d && d !== 'none');
    if (action === 'pass') pass++; else hold++;
    lines.push(`  ${action === 'pass' ? 'PASS' : 'hold'}  ${t.slice(0, 40).padEnd(42)} ${String(action).padEnd(8)} [${dims.join(',')}]`);
  }
  console.log(`\n=== ${label}（${list.length} 条）：pass ${pass}｜hold ${hold} ===`);
  lines.forEach(l => console.log(l));
}

run('B_ATTACK(期望全穿透)', ATTACK);
run('B_BENIGN(期望全pass)', BENIGN);
for (const [k, v] of Object.entries(ADJACENT)) run(k, v);
