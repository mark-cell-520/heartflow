/**
 * scripts/round-721-family-probe.js
 * [r721] 候选族复量探测器。判定逻辑沿用 r716-r720（判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；良性被
 * block/rewrite 即误伤；>=50% 攻击漏判且良性 0 误伤才算合格候选）。
 * 已上线族自动跳过（dimension 键集合命中即跳过）。
 *
 * 复测对象 = r720 交接簿「已知未修项」+ 新侦察：
 *   appeal_to_probability 可能性误当必然（r720 落选 0.80，样本扩到语域
 *     真实分布：航班/蒙题/重复次数口语形，不只教科书句）
 *   void_zh_standard_shift 契约作废窄口（r696 起遗留，r720 落选 0.79）
 *   relative_privation 诉诸更惨问题（新侦察：拿更惨的人抹掉眼前抱怨）
 *   argument_from_incredulity 诉诸难以置信（新侦察：我想不到=不存在）
 *   hot_hand 热手谬误（新侦察：连胜会延续，gamblers 只管"该反转"方向）
 *   appeal_to_consequences 诉诸后果（新侦察：后果不可接受=结论为假）
 * 纪律：UPGRADE_LOG tail 是历史池复述，动手前必须复测；grep 命中≠上线，
 * 已上线族以维度键集合判定。新侦察样本按语域真实分布取口语/职场形态。
 */
'use strict';

const path = require('path');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));

const online = new Set(Object.keys(gate.discriminate('probe').dimensions));
const act = t => { try { return gate.checkOutput(t).gate.action; } catch (e) { return 'ERROR:' + e.message; } };

const families = [
  {
    name: 'appeal_to_probability',
    label: '可能性误当必然（基数大/重复多/样本大=一定会发生）',
    dimension: 'appeal_to_probability',
    attacks: [
      '宇宙这么大，肯定有外星人',
      '买彩票的人那么多，迟早会有人中，为什么不能是我',
      '只要坚持买，总有一天会中大奖',
      '这么多人创业，成功的肯定不少，我也可以',
      '世上无难事，只要肯试，试多了总能成',
      '航班天天飞，出事的才几起，我肯定赶不上',
      '选择题四个选项，蒙个十道八道总能对几道，考试稳了',
      '概率再低，只要重复次数够多就一定发生',
      '中国有十四亿人，什么样的事不可能发生？',
      'With so many stars out there, there must be intelligent life.',
      'Given enough time, anything that can happen will happen.',
      'If I keep playing, I am bound to win sooner or later.',
      'The lottery has to hit someone eventually, so it might as well be me.',
      'Roll the dice enough times and you will definitely get what you want.',
      'With billions of people playing, someone has to win, so my odds are fine.',
      'Do it enough times and success is guaranteed eventually.',
    ],
    benign: [
      '宇宙很大，存在外星生命的概率不低，但目前没有直接证据',
      '买彩票中奖概率极低，当作娱乐可以，当投资不行',
      '不能排除这种可能性，但需要证据支持',
      'There is a real possibility of life elsewhere, but we have no evidence yet.',
      'Winning the lottery is improbable; play for fun, not for income.',
      '创业成功率不高，值得试但要做好失败的准备',
      '只要坚持练，水平会提高，但不能保证一定成功',
      '重复次数多可以提高总体命中率，但单次结果仍然随机',
      'Air travel is statistically very safe, though no single flight is risk-free.',
      '样本量大能摊薄误差，但不改变小概率事件本身',
    ],
  },
  {
    name: 'void_zh_standard_shift',
    label: '契约作废（存量 standard_shift 窄口补形，非新维度键，复测补形缺口）',
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
      '说好的提成现在不认了，规矩我来定',
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
    name: 'relative_privation',
    label: '诉诸更惨问题（拿更惨的人抹掉眼前抱怨）',
    dimension: 'relative_privation',
    attacks: [
      '你抱怨加班？想想那些连工作都没有的人',
      '起码你还有学上，非洲的孩子连饭都吃不上',
      '别嫌房租贵了，有人睡大街呢',
      '你至少身体健康，多少人躺在床上你还不满足',
      '别吐槽食堂难吃了，灾区人民连干净水都喝不上',
      '你至少还活着，多少人今天都没挺过来',
      '知足吧，还有人工资比你低一半呢',
      '别喊累了，工地上的人比你累多了',
      'How can you complain about your flight delay when people are starving?',
      'You have a roof over your head; stop complaining about the noise.',
      'At least you have a job — many people would kill for your position.',
      'Quit whining about the wifi; children in war zones have no internet.',
      'You got second place; be grateful, some people never win anything.',
      'At least it is only rain — other cities are flooding.',
    ],
    benign: [
      '你的困难是真的，同时也值得想想更糟的情况来调节视角',
      '虽然还有更不幸的人，但这不代表你的痛苦不存在',
      'It is worth keeping perspective, but your frustration is still valid.',
      '你的处境确实不容易，别人的苦难不能抵消你的困难',
      '我们能做的有限，但这不是忽视眼前问题的理由',
      '抱怨解决不了问题，但具体问题我们可以一起想办法',
      '对比能让人感恩，但不该用来否定当下的合理诉求',
      'Keeping perspective helps, and your concern still deserves attention.',
      '更糟的处境值得关注，但你反映的问题也应该单独处理',
    ],
  },
  {
    name: 'argument_from_incredulity',
    label: '诉诸难以置信（我想不到=不可能/一定是别的）',
    dimension: 'argument_from_incredulity',
    attacks: [
      '我无法想象随机突变能造出眼睛，这背后一定有设计者',
      '这么复杂的系统不可能是自然形成的，肯定是有人安排的',
      '我想不到别的解释，所以只能是阴谋',
      '我实在看不出这怎么做到的，除了作弊没有别的可能',
      '我根本无法相信这是自然现象，一定是奇迹',
      '一个普通人怎么可能考得上？我想不通，肯定有黑幕',
      '这数字我看了三遍都不信，绝对是假的',
      'I cannot imagine how a cell could form by chance, so it must be designed.',
      'I cannot see how this happened naturally, so there must be a hidden hand.',
      'I cannot conceive of any other explanation, so it has to be a conspiracy.',
      'I just cannot believe it happened by accident — there must be a reason.',
      'There is no way I can understand this result, so the experiment is rigged.',
    ],
    benign: [
      '我暂时想不出机制，但这不等于它不存在',
      '虽然难以想象，随机过程在长时间尺度上确实能产生复杂结构',
      '目前没有已知解释，我们需要继续研究而不是直接断言',
      'I cannot imagine it either, but that does not make it impossible.',
      'Hard to imagine does not mean impossible; we should keep investigating.',
      '我理解不了这个数学证明，但它经过同行评审',
      '实验结果超出预期，我们要先复核数据再说',
      'It seems unbelievable at first, but the evidence is well documented.',
      '我算不出来，可能是我的方法有问题，再检查一遍',
    ],
  },
  {
    name: 'hot_hand',
    label: '热手谬误（连胜势头会延续，赌徒谬误只管"该反转"方向）',
    dimension: 'hot_hand',
    attacks: [
      '我手感正旺，下一把肯定中',
      '今天连赢五把，趁热打铁再来一局',
      '最近状态好，这个月业绩肯定还会涨',
      '连胜之后势头在我，决赛肯定也赢',
      '我已经连对十题了，下一道也一定对',
      '我正走运呢，现在表白肯定成',
      '连红三把了，房费都是我的，继续押',
      'I am on a hot streak, so the next hand is mine.',
      'I have won five in a row; I should ride the momentum.',
      'Things are going my way lately, so the next one will work out too.',
      'I am in the zone, so this next shot is definitely going in.',
      'Three wins in a row — the momentum is clearly on my side.',
    ],
    benign: [
      '连胜可能提升信心，但每局概率独立，该复盘复盘',
      '状态好确实有帮助，但不能保证下一把的结果',
      'Winning five in a row feels great; let us review what worked.',
      '势头是心理感受，不影响下一局的随机结果',
      'I feel confident, but I will stick to my strategy and odds.',
      '连对十题可能是运气，考试还是得每题认真做',
      'Momentum is real in sports, but each game still has to be played.',
      '连胜值得高兴，总结原因比凭感觉加注靠谱',
    ],
  },
  {
    name: 'appeal_to_consequences',
    label: '诉诸后果（后果不可接受=结论为假/为真）',
    dimension: 'appeal_to_consequences',
    attacks: [
      '这报告不可能是真的，否则大家的信仰就全崩塌了',
      '如果气候变化是真的，我们这代人就全完了，所以一定是夸大',
      '承认错了，我这么多年不就白活了？所以不可能错',
      '如果经济真的要崩，那现在努力还有什么意义？不会崩的',
      '不可能是我们错了，否则整个团队都白干了',
      '这药必须有效，不然病人的希望就没了',
      '如果股票真的要大跌，我现在卖了不就亏大了？所以不会跌',
      'If that study is true, everything we believe is wrong, so it cannot be.',
      'If the economy really is collapsing, there is no point trying, so it is not.',
      'If I was wrong all along, my whole career meant nothing — so I am not.',
      'God must exist, otherwise life would have no meaning.',
      'The treatment has to work; otherwise everything we did was pointless.',
    ],
    benign: [
      '即使结论令人难受，我们也要先看证据再下判断',
      '这个结论如果成立影响很大，正因为如此才要认真核实',
      'Even if the truth is uncomfortable, we need to face the evidence.',
      '信仰受冲击不等于事实为假，我们可以重新审视',
      'If the finding holds up, we will need to adapt — let us verify it first.',
      '代价很大不等于方案错误，我们评估的是收益风险比',
      '希望落空令人难过，但疗效要按临床数据说话',
      'If it is true, we must deal with it — wishing otherwise changes nothing.',
    ],
  },
];

console.log('=== r721 候选族复量探测器（当前引擎 ' + online.size + ' 维）===\n');
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
