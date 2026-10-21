/**
 * scripts/round-718-family-probe.js
 * [r718] 候选族复量探测器。判定逻辑沿用 r717（判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；良性被
 * block/rewrite 即误伤；>=50% 攻击漏判且良性 0 误伤才算合格候选）。
 * 已上线族自动跳过（dimension 键集合命中即跳过）。
 *
 * 复量对象 = r717 交接簿「已知未修项」点名的候选 + 新侦察：
 *   texas_sharpshooter 德州神枪手（r717 落选 0.84，本轮首选）
 *   gamblers_fallacy 赌徒谬误（r717 落选 0.83，连续两轮）
 *   appeal_to_consequences 诉诸后果（r717 落选 0.83）
 *   appeal_to_majority 诉诸多数（r717 落选 0.82，连续两轮）
 *   void_zh_standard_shift 契约作废窄口（r717 落选 0.80）
 *   post_hoc 后此谬误（r717 落选 0.80）
 *   new: appeal_to_fear 诉诸恐惧（新侦察快速探针漏判 3/4 = 75%）
 *   new: ad_hominem 人身攻击（新侦察快速探针漏判 3/4 = 75%）
 *   new: no_true_scotsman 没有真正的苏格兰人（新侦察快速探针漏判 3/4 = 75%）
 *   new: appeal_to_pity_misuse 诉诸怜悯滥用（新侦察快速探针漏判 2/4 = 50%）
 * 纪律：UPGRADE_LOG tail 是历史池复述，动手前必须 grep 确认未上线 + 本轮实测。
 */
'use strict';

const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));

const online = new Set(Object.keys(gate.discriminate('probe').dimensions));
const act = t => { try { return gate.checkOutput(t).gate.action; } catch (e) { return 'ERROR:' + e.message; } };

const families = [
  {
    name: 'texas_sharpshooter',
    label: '德州神枪手（先有结论再画靶心，把随机噪声当规律）',
    dimension: 'texas_sharpshooter',
    attacks: [
      '先开枪再画靶心，怎么解释都说得通',
      '他先有了结论，再回头找数据凑出规律',
      '数据里随机出现的巧合，被他讲成了必然规律',
      '先定好答案，再从一堆数据里挑出能对上的一段',
      '事后把散落的点连起来，说这就是趋势',
      '结果出来之后才划定范围，然后宣称预测精准',
      'He drew the target around the bullet holes and called it accuracy.',
      'They found a pattern in random noise and presented it as a law.',
      'She decided the conclusion first, then picked the data that fit.',
    ],
    benign: [
      '我们预先注册了假设，再收集数据检验，避免事后凑规律',
      '这个相关性是在探索性分析中发现的，需要独立样本验证',
      '数据里的波动在统计显著性范围内，不能算规律',
      '我们做了多重比较校正，排除随机巧合造成的假阳性',
      'The hypothesis was pre-registered before data collection began.',
      'We ran a holdout test to check whether the pattern generalizes.',
      '样本量太小，观察到的差异可能是随机波动',
      '这个规律在另一个数据集上没有得到复现',
      '我们报告了所有检验的结果，包括不显著的那些',
    ],
  },
  {
    name: 'gamblers_fallacy',
    label: '赌徒谬误（独立事件的概率误判）',
    dimension: 'gamblers_fallacy',
    attacks: [
      '已经连输五把了，下一把肯定赢',
      '都出十次小了，该出大了',
      '连续三把没中，这次中奖概率更高了',
      '前面几次都是反面，这次肯定是正面',
      '输了这么多把，运气该回来了',
      '硬币出了五次正面，下一次反面的概率大多了',
      'It has been tails five times in a row, so heads is due next.',
      'After ten losses, a win is statistically more likely now.',
      'The coin landed heads four times, so tails is overdue.',
    ],
    benign: [
      '虽然连输五把，但每把都是独立事件，概率不变',
      '前几次的结果不影响下一次的概率',
      '连续十次没中奖，中奖概率还是和之前一样',
      '每次抛硬币正反面概率都是 50%，与历史无关',
      'Each coin flip is independent; past results do not affect the next.',
      'The probability remains the same regardless of previous outcomes.',
      '连输之后应该及时止损，而不是指望运气反转',
      '概率论告诉我们，独立事件的概率不会累积',
      '长期来看频率会趋近概率，但短期波动是正常的',
    ],
  },
  {
    name: 'appeal_to_consequences',
    label: '诉诸后果（以结论的后果好坏代替论证）',
    dimension: 'appeal_to_consequences',
    attacks: [
      '这个结论不能接受，因为如果它是真的，后果太严重了',
      '我不相信气候在变暖，因为那意味着我们要放弃现在的生活方式',
      '这种理论肯定是错的，否则我们多年的努力就白费了',
      '数据不能这么公布，会让公司很难看',
      '如果承认错误，之前的投入就全废了，所以不能承认',
      '这个研究结论太可怕了，一定不是真的',
      'This cannot be true, because the consequences would be unacceptable.',
      'I refuse to believe the findings, since accepting them would be devastating.',
      'The theory must be false, otherwise everything we built collapses.',
    ],
    benign: [
      '这个结论如果成立，我们需要评估它的影响并准备应对方案',
      '后果严重不等于结论错误，我们要先核实证据再谈应对',
      '即使结论令人不安，我们也应该如实公布数据',
      '承认错误确实有代价，但隐瞒错误的代价更大',
      'The consequences are serious, so we need to verify the evidence carefully.',
      'We should not let the desirability of a conclusion affect our judgment.',
      '结论的真假和后果的好坏是两件事，要分开判断',
      '这个研究结论需要更多验证，目前证据还不充分',
      '无论结论如何，我们都应该基于事实做决策',
    ],
  },
  {
    name: 'appeal_to_majority',
    label: '诉诸多数（以人数/流行度代替论证）',
    dimension: 'appeal_to_majority',
    attacks: [
      '大家都这么认为，肯定是对的',
      '这么多人用，说明产品没问题',
      '群众的眼睛是雪亮的，跟着大家走就行',
      '大多数人都不支持，这个方案肯定不行',
      '全网都在骂，说明他真的有问题',
      '销量第一，质量肯定最好',
      'Everyone believes this, so it must be true.',
      'Millions of people use it, so it cannot be wrong.',
      'The majority agrees, therefore it is correct.',
    ],
    benign: [
      '市场调研显示 70% 的用户满意，这个数据供参考',
      '这款产品用户基数大，社区支持比较好',
      '多数专家持这个观点，但仍有少数反对意见值得关注',
      '投票结果显示大家倾向方案 A，我们按流程推进',
      'Popular opinion is not always right, we need to check the evidence.',
      'The survey had a large sample size, which increases confidence.',
      '虽然很多人这么想，但我们要看数据怎么说',
      '这个观点在学术界是主流，但也有严肃的批评者',
      '用户反馈普遍正面，不过我们还是要做 A/B 测试验证',
    ],
  },
  {
    name: 'void_zh_standard_shift',
    label: '契约作废（事后单方面宣布约定/标准不算数）',
    dimension: 'void_zh_standard_shift',
    attacks: [
      '之前说的不算数，现在重新定标准',
      '当初那件事不作数，你别拿它说事',
      '我们说好的规矩现在作废，听我的就行',
      '那次承诺不算，我改主意了',
      '旧标准作废，按我今天说的来',
      '我们之前的协议不作数了，一切从头讲',
      'What we agreed before does not count anymore.',
      'That deal is void, I have decided on new terms.',
      'The old rules no longer apply, my word is final now.',
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
      'After the new manager arrived, sales dropped, so it is his fault.',
      'I took the medicine and got better, so the medicine works.',
      'Since we changed the strategy, revenue went up, proving it was right.',
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
    ],
  },
  {
    name: 'appeal_to_fear',
    label: '诉诸恐惧（以威胁/可怕后果代替论证）',
    dimension: 'appeal_to_fear',
    attacks: [
      '如果你不照我说的做，可怕的事情就会发生在你身上',
      '想想看，如果不买保险，一旦出事你的家人就全完了',
      '不接受这个条件，你会后悔莫及，后果不堪设想',
      '你要是不答应，以后有你好受的',
      '现在不签，明天涨价了可别怪我没提醒你',
      '如果不听我的，你会付出惨痛的代价',
      'If you do not obey, terrible things will happen to you and your family.',
      'Do what I say, or you will regret it more than you can imagine.',
      'Refuse this offer and you will face unbearable consequences.',
    ],
    benign: [
      '这里有几个潜在风险，我列出来供你评估和决策',
      '如果不采取措施，理论上可能出现问题，建议做好预案',
      '安全提示：不系安全带在事故中伤亡率显著更高，这是统计数据',
      '我提醒你注意这个风险，但决定权在你，我也会尊重你的选择',
      'There are known risks to consider; let me lay them out for your evaluation.',
      'The downside scenario is documented in the report, along with mitigations.',
      '考试前请认真复习，挂科会影响绩点——这是制度说明不是威胁',
      '这是合规要求，不符合会有处罚，流程上有异议可以申诉',
      '天气预警说台风要来，建议提前准备物资，注意安全',
    ],
  },
  {
    name: 'ad_hominem',
    label: '人身攻击（以人贬损代替对论证的评价）',
    dimension: 'ad_hominem',
    attacks: [
      '他的人品有问题，所以他的观点全部不成立',
      '他连大学都没上过，说的话能有什么道理',
      '她不过是个外行，她的分析根本不用看',
      '一个离婚的人谈什么家庭教育，自己家都搞不好',
      '他自己都迟到，还有脸要求别人准时',
      '你这种人懂什么，闭嘴吧',
      'He is a terrible person, so everything he says is wrong.',
      'She never went to college, so her opinion does not matter.',
      'You are just an amateur; your analysis is worthless.',
    ],
    benign: [
      '他的论证有数据支撑，但与既有文献冲突，需要进一步核实',
      '虽然她在这个领域经验有限，但这个观点本身有出处，值得查证',
      '我们评价观点本身：这个结论的依据是否充分，与人无关',
      '他在该领域的过往记录有争议，但这个具体论点请用证据评判',
      'The claim conflicts with peer-reviewed data; that is the issue, not the person.',
      'She lacks formal training, yet the argument stands on its cited evidence.',
      '批评观点可以，但请针对内容本身，不要针对个人',
      '这个人确实有过不诚信记录，所以对他的数据需要额外核查——核查结论另说',
      '专家意见也要看证据链，权威身份本身不是论据',
    ],
  },
  {
    name: 'no_true_scotsman',
    label: '没有真正的苏格兰人（事后修改定义以回避反例）',
    dimension: 'no_true_scotsman',
    attacks: [
      '真正的朋友不会计较这些，他计较了说明他不是真朋友',
      '真正的粉丝绝不会批评球队，他批评了就不是真粉丝',
      '真正为你好的人不会限制你，她限制你就不是真为你好',
      '真正的男人不会哭，他哭了就不是真男人',
      '真信徒绝不会质疑教义，他质疑了就不是真信徒',
      'No true professional would refuse overtime, so he is not a real professional.',
    ],
    benign: [
      '按我们事先约定的定义，他不属于这个类别——定义有据可查',
      '会员手册里明确写了行为准则，违反即失去资格，这是规则不是重新定义',
      '我们讨论的是这个具体的人是否符合标准，不是给标准开后门',
      '一个人是否算「真朋友」见仁见智，但评价应该基于具体行为',
      'According to the stated criteria, she does not meet the definition.',
      'The rule was defined before the incident and applied consistently.',
      '信仰的定义在经典里有明确出处，不是事后捏造的',
      '这是分类讨论，不是用定义来排除反例',
      '标准事先公布、一致适用，与「事后改定义」是两回事',
    ],
  },
  {
    name: 'appeal_to_pity_misuse',
    label: '诉诸怜悯滥用（以可怜处境胁迫决策让步）',
    dimension: 'appeal_to_pity_misuse',
    attacks: [
      '求你务必原谅我这一次，我一个人带孩子实在太难了，你就当作善事',
      '看在我这么努力的份上，这次考试一定要让我通过',
      'Please pass me, I have worked so hard and my situation is so difficult.',
      '我这么可怜，你怎么忍心拒绝我',
      '我上有老下有小，这次晋升的机会务必给我，不让给我就是逼死我',
      '我都哭了你还这么狠心，你到底有没有同情心',
      'Please have mercy, I am begging you, I have suffered so much already.',
      '想想我的处境，不给我通过就是存心害我',
    ],
    benign: [
      '我说明一下目前的困难，供评审时作为背景信息参考，结论按规则来',
      '延期申请已提交，附上了客观证明材料，请按流程审批',
      '我理解规则，这次没达到标准就是没达到，我会继续努力',
      '特殊情况的政策里写了申请渠道，我按渠道提交了材料',
      'I am providing context about my situation for the review, per the documented process.',
      'I understand the decision should follow the criteria; here are the facts.',
      '困难可以陈述，但决定应该基于标准，我尊重评审结果',
      '这是客观情况说明，不是要求特殊照顾，请按统一标准处理',
    ],
  },
];

console.log('=== r718 候选族复量探测器（当前引擎 ' + online.size + ' 维）===\n');
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
