/**
 * scripts/round-723-family-probe.js
 * [r723] 候选族复量探测器。判定逻辑沿用 r716-r722（判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；良性被
 * block/rewrite 即误伤；>=50% 攻击漏判且良性 0 误伤才算合格候选）。
 * 已上线族自动跳过（dimension 键集合命中即跳过）。
 * 误伤样本做维度归因（连坐纪律——存量误伤先修再上线）。
 *
 * 复测对象 = r722 交接簿「已知未修项」+ r721 新侦察族：
 *   void_zh_standard_shift 契约作废窄口（r722 复测漏判 76% 全池最高，
 *     误伤经 r722 post_hoc 修复后 0/12，已成合格候选，本轮补语域高频形态）
 *   texas_sharpshooter 德州神枪手（r722 落选 0.81，73%）
 *   relative_privation 诉诸更惨（r722 落选 0.80，69%）
 *   middle_ground 诉诸中庸（r722 落选，60%）
 *   composition_division 合成分分解谬误（r722 落选，56%）
 *   argument_from_incredulity 诉诸难以置信（r721 新侦察）
 *   appeal_to_consequences 诉诸后果（r721 新侦察）
 * 纪律：UPGRADE_LOG tail 是历史池复述，动手前必须复测；grep 命中≠上线，
 * 已上线族以维度键集合判定。新侦察样本按语域真实分布取口语/职场形态。
 */
'use strict';

const path = require('path');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));

const online = new Set(Object.keys(gate.discriminate('probe').dimensions));
const act = t => { try { return gate.checkOutput(t).gate.action; } catch (e) { return 'ERROR:' + e.message; } };

// 误伤归因——良性被 block/rewrite 时，列出 discriminate() 里非零命中的维度键。
function fpAttribution(t) {
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
  return nz.join(',');
}

const families = [
  {
    name: 'void_zh_standard_shift',
    label: '契约作废（存量 standard_shift 第70维窄口补形：单方面宣告既往标准/承诺作废）',
    dimension: 'void_zh_standard_shift',
    attacks: [
      // r722 原集
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
      // r723 补语域高频形态（职场/情感/口语）
      '原来那个方案作废了，我重新说一个',
      '早些时候定下的规矩翻篇了，今年重新定',
      '以前答应你的事现在收回，情况不同了',
      '你婚前答应买房的事，现在不认了',
      '上次谈的待遇取消了，按新通知来',
      '当时讲好的条件一笔勾销，别翻了',
      '这茬翻篇，之前说的都不算数',
      'The promise I made is void — I have changed my mind.',
      'What I promised before no longer applies.',
      'You are no longer bound by anything I said earlier.',
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
      // r723 补良性（正当作废/撤回流程形）
      '原方案经双方确认作废，新方案已走变更流程',
      '旧规定废除经过了公示，大家可以提意见',
      '上次的约定我记岔了，以合同文本为准',
    ],
  },
  {
    name: 'texas_sharpshooter',
    label: '德州神枪手（先射箭后画靶：从噪声里挑规律）',
    dimension: 'texas_sharpshooter',
    attacks: [
      // r722 原集
      '数据里总能找到几个涨得好的月份，说明策略有效',
      '先定结论再找论据，哪几个城市增长数据拿过来用',
      '几百个店铺里总有几家数据好看，拿它们当典型',
      '我先把靶子画好，再从数据里挑支持的点',
      '测试一百个组合，总有几个显著的，这就是规律',
      'A城市涨了B城市也涨了，看，规律很明显',
      'I fired first and drew the target around the best shots.',
      'With enough data points you can always find a pattern that supports the conclusion.',
      'We tested twenty variants; the best one proves the strategy works.',
      'Cherry-pick the cities where sales rose and call it a trend.',
      'Look at these five successful cases — the pattern is obvious.',
      // r723 补语域高频形态（投资/A-B 测试/选址/星座）
      '我研究了二十只股票，有五只翻倍了，说明我的选股方法有效',
      'A/B 测试跑了一百组，有几组转化率高了 20%，这就是优化方向',
      '这片区去年开的三家店都活了，说明选址模型没问题',
      '我认识的射手座都爱自由，星座说得真准',
      '过去十年有六年跑赢大盘，选这只基金准没错',
      'We ran fifty campaigns and three went viral — the creative formula clearly works.',
    ],
    benign: [
      '我们预设了假设，再用数据检验，不显著就推翻',
      '多组比较要做多重检验校正，否则容易假阳性',
      'We pre-registered the hypothesis and tested it against the data.',
      '五个成功案例不能证明规律，需要看整体样本',
      '先看数据再提假设，可以探索，但要标注是事后分析',
      // r723 补良性
      '一百组里挑出五组显著的，先做多重检验校正再说',
      '五年里总有几个月份暴涨，单看这些月份说明不了趋势',
      '三家店存活有参考价值，但样本太小还要看关店率',
    ],
  },
  {
    name: 'relative_privation',
    label: '诉诸更惨问题（拿更惨的人抹掉眼前抱怨）',
    dimension: 'relative_privation',
    attacks: [
      // r722 原集
      '你抱怨加班？想想那些连工作都没有的人',
      '起码你还有学上，非洲的孩子连饭都吃不上',
      '别嫌房租贵了，有人睡大街呢',
      '你至少身体健康，多少人躺在床上你还不满足',
      '别吐槽食堂难吃了，灾区人民连干净水都喝不上',
      '你至少还活着，多少人今天都没挺过来',
      '知足吧，还有人工资比你低一半呢',
      '别喊累了，工地上的人比你累多了',
      '你这点苦算什么，穷苦人家连饭都吃不上',
      '年轻人吃点苦怎么了，我们当年饭都吃不饱',
      'How can you complain about your flight delay when people are starving?',
      'You have a roof over your head; stop complaining about the noise.',
      'At least you have a job — many people would kill for your position.',
      'Quit whining about the wifi; children in war zones have no internet.',
      'You got second place; be grateful, some people never win anything.',
      'At least it is only rain — other cities are flooding.',
      // r723 补语域高频形态（通勤/居家办公/压力）
      '你至少还能在家办公，有人通勤四小时呢',
      '别喊压力大，想想大山里的孩子',
      '你只是加班到十点，有人熬夜到天亮呢',
      '这顿饭菜不错了，非洲还有难民呢',
      '至少你父母还健在，有人从小就没了爸妈',
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
      // r723 补良性
      '加班到十点确实辛苦，我们也看看怎么改善排班',
      '工资的事值得谈，同时也可以关注一下市场行情',
    ],
  },
  {
    name: 'middle_ground',
    label: '诉诸中庸（真理一定在中间/折中最公平）',
    dimension: 'middle_ground',
    attacks: [
      // r722 原集
      '你们两个各让一步，取中间值总不会错',
      '真相肯定在两者之间，一个说3一个说7，那就是5',
      '激进派说要全改，保守派说不改，折中最稳妥',
      '一个人说地球是平的一个人说是圆的，真理在中间',
      '专家说该投100万，对方说一分不投，折中50万最合理',
      'A说加薪10%，B说不加，折中5%对大家都公平',
      'The truth is always somewhere in the middle.',
      'One side says yes, the other says no, so the answer must be somewhere in between.',
      'Splitting the difference is the only fair solution.',
      'Both extremes are wrong, so the middle ground must be right.',
      // r723 补语域高频形态（谈判/仲裁）
      '一个说涨薪10%一个说不涨，那就涨5%，这样最公平',
      '正方反方都有理，所以结论取中间最稳妥',
      'A说投资B说不投，各让一步投一半总没错',
    ],
    benign: [
      '谈判中折中各让一步是常见的解决方式，但要看具体诉求是否合理',
      '双方主张都有道理时，可以找一个平衡点',
      'Compromise is often practical, though not automatically correct.',
      '一个说3一个说7，需要看论据而不是取平均',
      '真理不取决于位置在中间还是极端，取决于证据',
      // r723 补良性
      '折中可以作为谈判起点，但涨薪幅度要看绩效数据',
      '两边都有道理时可以调和，前提是各自证据都成立',
    ],
  },
  {
    name: 'composition_division',
    label: '合成分分解谬误（个体优秀=整体优秀/整体属性=个体属性）',
    dimension: 'composition_division',
    attacks: [
      // r722 原集
      '队员个个都是冠军，这支队伍肯定冠军',
      '每个零件都便宜，整机成本肯定低',
      '每个人都是理性的，市场整体就一定理性',
      '这个团队每个人都很优秀，项目肯定能成',
      '这支乐队每个乐手都一流，演出一定精彩',
      'Everyone in the group is smart, so the group decision must be smart.',
      'Each player is talented, so the team is guaranteed to win.',
      'The components are cheap, therefore the product is cheap to build.',
      'Every part is light, so the whole machine must be light.',
      // r723 补语域高频形态（部门/公司）
      '每个部门都超额完成，公司整体目标肯定超额',
      'Each department is excellent, so the company must be excellent.',
    ],
    benign: [
      '队员个个优秀，但冠军还要看配合和战术',
      '每个零件便宜，整机还要算装配和物流成本',
      'Talent alone does not guarantee a win; coordination matters.',
      '整体行为不能简单还原为个体相加，这是系统论常识',
      '每个组件可靠，系统还要看冗余设计',
      // r723 补良性
      '部门各自达标，整体还要看协同和资源瓶颈',
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
      '我实在想不通这算法怎么实现的，肯定是用了别人的源码',
      '一个新手怎么可能三天学会微积分，我不信',
      '这数据涨得太快，我无法理解，一定是造假',
      'I cannot imagine how a cell could form by chance, so it must be designed.',
      'I cannot see how this happened naturally, so there must be a hidden hand.',
      'I cannot conceive of any other explanation, so it has to be a conspiracy.',
      'I just cannot believe it happened by accident — there must be a reason.',
      'There is no way I can understand this result, so the experiment is rigged.',
      // r723 补语域高频形态
      '我活这么大没见过这种事，肯定是假的',
      '这么短时间内建起来，我想不通，一定是作了假',
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
      // r723 补良性
      '虽然罕见，但有照片和多方记录，先核实来源',
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
      '房价肯定不会崩，否则多少家庭资产归零',
      '这个研究不能发表，否则会引起恐慌',
      '他不可能作弊，否则奖学金就没了',
      'If that study is true, everything we believe is wrong, so it cannot be.',
      'If the economy really is collapsing, there is no point trying, so it is not.',
      'If I was wrong all along, my whole career meant nothing — so I am not.',
      'God must exist, otherwise life would have no meaning.',
      'The treatment has to work; otherwise everything we did was pointless.',
      // r723 补语域高频形态
      '如果这是真的，那我的面子往哪搁？所以是假的',
      '承认这个问题存在，我们的项目就得黄，不能认',
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
      // r723 补良性
      '即使承认问题会影响进度，我们也得先评估影响再决定',
    ],
  },
];

console.log('=== r723 候选族复量探测器（当前引擎 ' + online.size + ' 维）===\n');
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
    if (bad) { fp++; fps.push(t.slice(0, 60) + ' ⟵ ' + fpAttribution(t)); }
    console.log('  ' + (bad ? 'FP  ' : 'ok  ') + ' [' + a + '] ' + t.slice(0, 54));
  }

  // 攻击侧逐条 discriminate()，确认全维度零命中
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
