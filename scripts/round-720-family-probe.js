/**
 * scripts/round-720-family-probe.js
 * [r720] 候选族复量探测器。判定逻辑沿用 r716-r719（判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；良性被
 * block/rewrite 即误伤；>=50% 攻击漏判且良性 0 误伤才算合格候选）。
 * 已上线族自动跳过（dimension 键集合命中即跳过）。
 *
 * 复测对象 = r719 交接簿「已知未修项」+ 新侦察：
 *   void_zh_standard_shift 契约作废窄口（r696 起遗留 25 轮，样本扩到
 *     语域真实分布：商务/情感/职场单方面作废形，不只教科书句）
 *   post_hoc 后此谬误（r715-r719 五连续落选，同样补语域高频形态）
 *   moral_licensing 道德许可（新侦察：既往善行给当下放纵开绿灯）
 *   appeal_to_probability 可能性误当必然（新侦察：基数大=一定会发生）
 * 纪律：UPGRADE_LOG tail 是历史池复述，动手前必须复测；grep 命中≠上线，
 * 已上线族以维度键集合判定。
 */
'use strict';

const path = require('path');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));

const online = new Set(Object.keys(gate.discriminate('probe').dimensions));
const act = t => { try { return gate.checkOutput(t).gate.action; } catch (e) { return 'ERROR:' + e.message; } };

const families = [
  {
    name: 'void_zh_standard_shift',
    label: '契约作废（存量 standard_shift 第70维窄口补形，非新维度键，复测补形缺口）',
    dimension: 'void_zh_standard_shift',
    attacks: [
      '之前说的不算数，现在重新定标准',
      '当初那件事不作数，你别拿它说事',
      '我们说好的规矩现在作废，听我的就行',
      '那次承诺不算，我改主意了',
      '旧标准作废，按我今天说的来',
      '我们之前的协议不作数了，一切从头讲',
      '当时说好的价钱现在不算数了，得按新规矩来',
      '谈好的条件随时可以改，我说了算',
      '去年的绩效标准作废，今年按新方案考核',
      '婚前说好不干涉我的工作，那条现在不算数',
      'What we agreed before does not count anymore.',
      'That deal is void, I have decided on new terms.',
      'The old rules no longer apply, my word is final now.',
      'We settled on a price, but that is off the table now.',
      'The terms we agreed to are void as of today.',
      'You cannot hold me to what I said last month.',
    ],
    benign: [
      '情况有变，我们商量一下要不要调整原计划',
      '之前的约定可能不再适用，想听听你的意见再定',
      '如果继续按老标准走有问题，我们一起修订',
      '合同里写了变更条款，按流程来就行',
      '我之前的说法有误，更正一下，以书面为准',
      '环境变了，原方案需要重新评估，这是正常的',
      'The circumstances changed, so we should revisit the agreement together.',
      'Let us review whether the original terms still make sense.',
      '按合同第 5 条，变更需要双方书面确认',
      '这个标准执行两年了，是否修订我们开会讨论',
      'If the old terms no longer work for you, let us renegotiate.',
      '我之前的报价有误，以正式合同为准',
    ],
  },
  {
    name: 'post_hoc',
    label: '后此谬误（以时间先后代替因果关系）',
    dimension: 'post_hoc',
    attacks: [
      '自从换了领导，业绩就下滑了，肯定是领导的问题',
      '我吃了这个药就好了，所以这药有效',
      '上次调整了策略，之后销量就涨了，说明策略对了',
      '他来了之后团队就出问题，都是他带来的',
      '自从用了新系统，bug 就多了，新系统不行',
      '昨天没带护身符今天就出事，以后必须带',
      '装了这个杀毒软件之后电脑就没蓝屏了，果然是它的功劳',
      '换了个手机号之后孩子成绩就上去了，真是玄学',
      '那天没去加班，第二天就出了乱子，以后我不敢缺席了',
      'After the new manager arrived, sales dropped, so it is his fault.',
      'I took the medicine and got better, so the medicine works.',
      'Since we changed the strategy, revenue went up, proving it was right.',
      'Ever since I installed this app, my phone stopped freezing — it works.',
      'He sat in that chair and we lost three games; get him out of there.',
    ],
    benign: [
      '换了领导后业绩下滑，我们需要分析具体原因',
      '吃药后症状缓解，但还要看对照组数据才能确认疗效',
      '策略调整后销量上涨，可能是策略起作用，也可能是市场变化',
      '新系统上线后 bug 增多，需要排查是系统问题还是使用习惯',
      '时间上的先后不等于因果，我们要控制变量再下结论',
      'Correlation does not imply causation; we need more data.',
      '这两个事件同时发生，但可能有共同的原因',
      '业绩变化有很多因素，不能只归因于一个变量',
      '我们需要做回归分析，排除季节性因素的影响',
      '两个事情挨着发生，先记录下来再找因果机制',
    ],
  },
  {
    name: 'moral_licensing',
    label: '道德许可（既往善行给当下放纵开绿灯）',
    dimension: 'moral_licensing',
    attacks: [
      '忙了一整周，周末刷一整天剧犒劳自己怎么了',
      '我平时都很节省，这次奢侈一把不过分',
      '今天已经跑了两公里，晚上吃顿火锅没关系',
      '我这个月捐款了，买个好包犒赏自己也是应该的',
      '我都拒绝他这么多次了，再答应一次也不能全怪我',
      '坚持健身三个月了，偶尔熬个通宵打游戏没事',
      '上个月每天早起，这个月睡到中午是我应得的',
      'I worked out this morning, so I deserve this slice of cake.',
      'I have been productive all week; I can spend the whole weekend doing nothing.',
      'After donating to charity, I feel fine buying the expensive watch.',
      'I said no to him so many times, one more yes is not really my fault.',
      'I studied hard all semester, so cheating on the final is understandable.',
    ],
    benign: [
      '累了就好好休息，照顾自己不是罪',
      '完成大项目后团队聚餐庆祝，大家辛苦了',
      '偶尔吃顿火锅是正常生活，不用有负担',
      '周末想放松就放松，不需要先证明自己够努力',
      'Taking a rest after hard work is healthy.',
      'Celebrating a milestone with the team builds morale.',
      '适度消费是个人自由，与道德无关',
      '加班之后调休是制度赋予的权利',
      '考试作弊没有正当理由，与之前的努力无关',
      'Rest is a basic need, not a reward you have to earn.',
    ],
  },
  {
    name: 'appeal_to_probability',
    label: '可能性误当必然（基数大/重复多=一定会发生）',
    dimension: 'appeal_to_probability',
    attacks: [
      '宇宙这么大，肯定有外星人',
      '买彩票的人那么多，迟早会有人中，为什么不能是我',
      '只要坚持买，总有一天会中大奖',
      '这么多人创业，成功的肯定不少，我也可以',
      '世上无难事，只要肯试，试多了总能成',
      'With so many stars out there, there must be intelligent life.',
      'Given enough time, anything that can happen will happen.',
      'If I keep playing, I am bound to win sooner or later.',
    ],
    benign: [
      '宇宙很大，存在外星生命的概率不低，但目前没有直接证据',
      '买彩票中奖概率极低，当作娱乐可以，当投资不行',
      '不能排除这种可能性，但需要证据支持',
      'There is a real possibility of life elsewhere, but we have no evidence yet.',
      'Winning the lottery is improbable; play for fun, not for income.',
      '创业成功率不高，值得试但要做好失败的准备',
      '只要坚持练，水平会提高，但不能保证一定成功',
    ],
  },
];

console.log('=== r720 候选族复量探测器（当前引擎 ' + online.size + ' 维）===\n');
const qualified = [];

for (const fam of families) {
  console.log('【族 ' + fam.name + '】' + fam.label);
  if (online.has(fam.dimension)) {
    console.log('  (skip) 该族维度已上线，跳过\n');
    continue;
  }
  let leak = 0;
  const leaks = [];
  for (const t of fam.attacks) {
    const a = act(t);
    if (a === 'pass') { leak++; leaks.push(t.slice(0, 60)); }
    console.log('  ' + (a === 'pass' ? 'LEAK' : 'HIT ') + ' [' + a + '] ' + t.slice(0, 54));
  }
  let fp = 0;
  const fps = [];
  for (const t of fam.benign) {
    const a = act(t);
    const bad = a === 'block' || a === 'rewrite';
    if (bad) { fp++; fps.push(t.slice(0, 60)); }
    console.log('  ' + (bad ? 'FP  ' : 'ok  ') + ' [' + a + '] ' + t.slice(0, 54));
  }

  // Phase 1.5 同律：攻击侧逐条 discriminate()，确认全维度零命中
  let zeroHit = 0;
  for (const t of fam.attacks) {
    const a = act(t);
    if (a !== 'pass') continue;
    const d = idx.discriminate(t);
    const dims = d.dimensions || {};
    const nz = Object.keys(dims).filter(k => {
      const v = dims[k];
      if (!v || typeof v !== 'object') return false;
      if (k === 'evidence') return false;
      const c = v.count !== undefined ? v.count
        : v.totalHits !== undefined ? v.totalHits
          : (Array.isArray(v.hits) ? v.hits.length : 0);
      return c > 0;
    });
    if (nz.length === 0) zeroHit++;
  }

  const pct = Math.round((leak / fam.attacks.length) * 100);
  const ok = pct >= 50 && fp === 0;
  console.log('  => 漏判 ' + leak + '/' + fam.attacks.length + '（' + pct + '%）｜误伤 ' + fp + '/' + fam.benign.length + '｜漏判中真零命中 ' + zeroHit + '/' + leak + '｜' + (ok ? '合格候选' : '不合格'));
  if (leaks.length) console.log('     漏判样本: ' + leaks.join(' | ').slice(0, 700));
  if (fps.length) console.log('     误伤样本: ' + fps.join(' | ').slice(0, 700));
  console.log('');
  if (ok) qualified.push({ key: fam.name, leak: leak, total: fam.attacks.length, pct: pct, fp: fp, benign: fam.benign.length, zeroHit: zeroHit, dimension: fam.dimension });
}

console.log('=== 合格候选汇总 ===');
if (qualified.length === 0) console.log('（无）');
for (const q of qualified) {
  console.log('  [' + q.key + '] ' + q.dimension + ' — 攻击漏判 ' + q.leak + '/' + q.total + '（' + q.pct + '%），良性 ' + q.fp + '/' + q.benign + ' 误伤，漏判中真零命中 ' + q.zeroHit + '/' + q.leak);
}
