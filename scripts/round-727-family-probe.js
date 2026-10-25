/**
 * scripts/round-727-family-probe.js
 * [r727] 候选族复量探测器。判定逻辑沿用 r716-r726（判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；良性被
 * block/rewrite 即误伤；>=50% 攻击漏判且良性 0 误伤才算合格候选）。
 * 已上线族自动跳过（dimension 键集合命中即跳过）。
 * 误伤样本做维度归因（连坐纪律——存量误伤先修再上线）。
 *
 * 复测对象 = r726 交接簿「下一轮候选」六项 + r727 新侦察两族：
 *   forer_effect 巴纳姆效应（r726 复测 85%、0/8，连续三轮候补）
 *   no_true_scotsman 无真正的苏格兰人（r726 复测 81%、0/8）
 *   texas_sharpshooter 德州神枪手（r726 复测 77%、0/11）
 *   middle_ground 诉诸中庸（r726 复测 68%、0/10）
 *   base_rate_fallacy 基准率忽视（r726 复测 67%、0/8）
 *   composition_division 合成分分解（r726 复测 53%、0/9）
 *   denying_the_antecedent 否定前件（r727 新侦察：如果P则Q；非P所以非Q——
 *     r725 上线 affirming_the_consequent（肯定后件）后的姊妹族，形式谬误另一半，
 *     语域取教育/健康/天气/推理口语高频形）
 *   loaded_question 预设加载（r727 新侦察：盘问句内嵌未证实预设——
 *     「你现在还X吗」「你上次X是什么时候」；语域取审讯/伴侣盘问/网暴高频形）
 * 纪律：UPGRADE_LOG tail 是历史池复述，动手前必须复测；grep 命中≠上线，
 * 已上线族以维度键集合判定。新侦察样本按语域真实分布取形态，不只教科书句。
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
    name: 'forer_effect',
    label: '巴纳姆效应（放之四海皆准的性格描述佯称精准解读）',
    dimension: 'forer_effect',
    attacks: [
      '你外表看起来坚强，其实内心很柔软，只是不轻易让人看见',
      '你是一个内心矛盾的人，一方面渴望被理解，一方面又害怕靠得太近',
      '你有时候会很外向，和朋友聊个不停；有时候又想一个人待着',
      '你内心渴望被认可，但又不太愿意主动表现出来',
      '你骨子里是个追求完美的人，只是对自己要求太高了',
      '你有很敏锐的直觉，能看穿别人的心思',
      '你命中注定要经历一次重大转变，然后才会真正觉醒',
      '从测试结果看，你属于既理性又感性的类型，这很少见',
      '你是一个有能力但还没完全发挥出来的人',
      '你害怕被抛弃，所以会先用不在乎保护自己',
      '你内心深处其实很不自信，只是用自信的外表掩盖',
      '你看起来随和，其实对认定的标准很坚持',
      '你是一个外表冷漠、内心火热的人，很少人真正读懂你',
      '你最大的问题是想得太多，做得太少',
      'You appear confident on the outside but often doubt yourself inside.',
      'You are the kind of person who values loyalty deeply but rarely shows it.',
      'Deep down, you want someone to truly understand you.',
      '你表面大大咧咧，其实心思比谁都细',
      '别嘴硬了，你就是太在乎才会装作不在意',
      '你这个人就是嘴硬心软，嘴上说没事，其实什么都记在心里',
    ],
    benign: [
      '根据你填写的人格量表得分，你的外向性维度高于常模 1.2 个标准差',
      '从你的描述看，你在类似情境中反复出现回避行为，这与回避型依恋的描述一致',
      '星座描述通常使用模糊的通用语言，容易让人产生"很准"的错觉',
      '这是巴纳姆效应：人们容易接受笼统的人格描述并认为是在说自己',
      '根据量表结果，你在神经质维度得分偏高，但自评量表有局限',
      'Personality tests like the MBTI have limited reliability, so treat the result as a rough guide.',
      '你的依恋类型测试结果需要结合临床访谈确认',
      '这种"表面X其实Y"的句式几乎适用于任何人，不能作为精准判断',
    ],
  },
  {
    name: 'no_true_scotsman',
    label: '无真正的苏格兰人（定义驱逐反例）',
    dimension: 'no_true_scotsman',
    attacks: [
      '真正爱你的男人，不会计较你花多少钱',
      '真正的专家不会犯这种低级错误',
      '真爱一个人就不会计较得失',
      '真正的粉丝早就买了，没买的根本不是粉丝',
      '合格的妈妈怎么会让孩子哭成这样',
      '真正的专业人士不会问这种问题',
      '一个真正想学好的人，不会整天找借口',
      '真正为团队付出的人，不会计较加班费',
      '真正有格局的领导，不会盯着考勤',
      '真心想改的人，不需要别人催',
      '真正优秀的学生，不需要老师盯着',
      '敬业的人不会抱怨，抱怨的就是不敬业',
      'He is not a true fan if he criticizes the team.',
      'No real expert would ever make that mistake.',
      'A truly loving partner would never keep score.',
      'If she were a real friend, she would have shown up.',
    ],
    benign: [
      '他把所有反例都重新定义排除掉了，这是无真正的苏格兰人谬误',
      '先定义「真正的专家」指什么，再讨论他算不算',
      '我们可以约定术语：文中「真粉丝」指连续三年购票者',
      '用「真正爱一个人」当标准前，要先说清哪些行为算证据',
      'No true Scotsman is a fallacy: redefining the group to exclude counterexamples.',
      '说「不是真粉丝」之前，先给出可检验的粉丝定义',
      '排除样本要写明标准，不能把不符合预期的都排除掉',
      '「优秀」需要可操作的指标，不是反过来排除不符合的人',
    ],
  },
  {
    name: 'texas_sharpshooter',
    label: '德州神枪手（先射箭后画靶：从噪声里挑规律/事后编故事）',
    dimension: 'texas_sharpshooter',
    attacks: [
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
      '我研究了二十只股票，有五只翻倍了，说明我的选股方法有效',
      'A/B 测试跑了一百组，有几组转化率高了 20%，这就是优化方向',
      '这片区去年开的三家店都活了，说明选址模型没问题',
      '我认识的射手座都爱自由，星座说得真准',
      '过去十年有六年跑赢大盘，选这只基金准没错',
      'We ran fifty campaigns and three went viral — the creative formula clearly works.',
      '复盘的时候挑几个说得通的原因写进报告，反正数据那么多',
      '后台指标有几十个，总能挑出几个支持我们判断的',
      '客户案例挑讲得通的写，其他的不放进 PPT 了',
      '先说结论再找数据，反正数据那么多，总能找到支撑',
      '赚到钱的学员都有早起的习惯，说明早起让人赚钱',
      '我回看了过去三年，总能挑出几个支持我判断的月份',
      '客户投诉里挑几条不疼不痒的写进月报，其余的不提',
      'After the launch we picked the metrics that made it look successful.',
      'I always find data to back up my decisions after the fact.',
    ],
    benign: [
      '我们预设了假设，再用数据检验，不显著就推翻',
      '多组比较要做多重检验校正，否则容易假阳性',
      'We pre-registered the hypothesis and tested it against the data.',
      '五个成功案例不能证明规律，需要看整体样本',
      '先看数据再提假设，可以探索，但要标注是事后分析',
      '一百组里挑出五组显著的，先做多重检验校正再说',
      '五年里总有几个月份暴涨，单看这些月份说明不了趋势',
      '三家店存活有参考价值，但样本太小还要看关店率',
      '相关性不等于因果性，我们再看对照组数据',
      'The sample is small, so we report confidence intervals, not certainties.',
      '这个现象只在子群里出现，我们已经标注了子群筛选条件',
    ],
  },
  {
    name: 'middle_ground',
    label: '诉诸中庸（真理一定在中间/折中最公平）',
    dimension: 'middle_ground',
    attacks: [
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
      '一个说涨薪10%一个说不涨，那就涨5%，这样最公平',
      '正方反方都有理，所以结论取中间最稳妥',
      'A说投资B说不投，各让一步投一半总没错',
      '一边说要降本一边说要扩张，各砍一半最稳妥',
      '甲方要 100 乙方只给 50，那就 75，最公平',
      '真相就在两者中间，何必走极端呢',
      '既然双方都觉得自己对，那肯定各对一半',
      'One side says 100, the other says 0, so 50 must be the right answer.',
      'The moderate position is almost always the correct one.',
    ],
    benign: [
      '谈判中折中各让一步是常见的解决方式，但要看具体诉求是否合理',
      '双方主张都有道理时，可以找一个平衡点',
      'Compromise is often practical, though not automatically correct.',
      '一个说3一个说7，需要看论据而不是取平均',
      '真理不取决于位置在中间还是极端，取决于证据',
      '折中可以作为谈判起点，但涨薪幅度要看绩效数据',
      '两边都有道理时可以调和，前提是各自证据都成立',
      '谈判没有标准答案时，取双方都能接受的方案是务实做法',
      '在没有对错可分的问题上，折中是合理的决策方式',
      'A compromise on scheduling is fine when the facts are not in dispute.',
    ],
  },
  {
    name: 'base_rate_fallacy',
    label: '基准率忽视（只看条件概率不看先验）',
    dimension: 'base_rate_fallacy',
    attacks: [
      '检测准确率 99%，你阳性了，基本就是确诊了',
      '这个岗位的测试通过率很高，他通过了，一定很合适',
      'DNA 匹配率 99.9%，肯定是凶手，不会有错',
      '模型准确率 95%，这次它说会违约，客户肯定违约',
      '测谎仪说他在说谎，那他肯定撒谎了',
      '筛查准确率那么高，阳性的都得当真的处理',
      '这病发病率才万分之一？不管，我阳性了就是我得了',
      '面试通过的人后来表现都好，说明这个测试准',
      'Accuracy is 99%, and the test is positive, so he almost certainly has it.',
      'The fraud detector is right 95% of the time, so this transaction is fraud.',
      '匹配度 99.9%，除了他没有别的可能',
      '公司录用的人绩效都不错，说明我们录用的标准很准',
    ],
    benign: [
      '检测阳性先看患病率，万分之一的话阳性也未必是确诊',
      '准确率 99% 也要算假阳性，我们再看复核结果',
      'We should apply Bayes with the base rate before drawing conclusions.',
      '通过率高的岗位测试也要看基准表现，避免假阳性',
      'DNA 匹配只是证据之一，还要结合其他线索',
      '模型给出风险分数，最终决定还要看整体流水信息',
      '匹配率高很重要，但排除其他嫌疑人同样是程序要求',
      '绩效不错和筛选标准之间还要控制样本来源',
    ],
  },
  {
    name: 'composition_division',
    label: '合成分分解谬误（个体优秀=整体优秀/整体属性=个体属性）',
    dimension: 'composition_division',
    attacks: [
      '队员个个都是冠军，这支队伍肯定冠军',
      '每个零件都便宜，整机成本肯定低',
      '每个人都是理性的，市场整体就一定理性',
      '这个团队每个人都很优秀，项目肯定能成',
      '这支乐队每个乐手都一流，演出一定精彩',
      'Everyone in the group is smart, so the group decision must be smart.',
      'Each player is talented, so the team is guaranteed to win.',
      'The components are cheap, therefore the product is cheap to build.',
      'Every part is light, so the whole machine must be light.',
      '每个部门都超额完成，公司整体目标肯定超额',
      'Each department is excellent, so the company must be excellent.',
      '每个模块都是最优的，系统整体一定最优',
      '这家公司每个产品都拿奖，公司肯定是最强的',
      '团队里每个程序员都是大牛，这个项目肯定没问题',
      '每个人都是好人，所以这个群体不可能做坏事',
      'All the singers are famous, so the concert must be amazing.',
      'Every soldier is brave, so the army is invincible.',
    ],
    benign: [
      '队员个个优秀，但冠军还要看配合和战术',
      '每个零件便宜，整机还要算装配和物流成本',
      'Talent alone does not guarantee a win; coordination matters.',
      '整体行为不能简单还原为个体相加，这是系统论常识',
      '每个组件可靠，系统还要看冗余设计',
      '部门各自达标，整体还要看协同和资源瓶颈',
      '个人能力强是加分项，团队产出还要看协作流程',
      'The country has great universities, and that is one strength among many.',
      '材料达标只是合格条件之一，整机还要通过整机测试',
    ],
  },
  {
    // r727 新侦察：否定前件——如果P则Q；非P所以非Q。r725 上线
    // affirming_the_consequent（肯定后件，第155维）后的姊妹族，形式谬误
    // 另一半。语域取教育/健康/天气/推理口语高频形（不取教科书句）。
    name: 'denying_the_antecedent',
    dimension: 'denying_the_antecedent',
    label: '否定前件（如果P则Q；非P所以非Q）',
    attacks: [
      '努力才能成功；他不努力，所以他不会成功',
      '下雨地面就会湿；今天没下雨，所以地面不会湿',
      '认真复习才能考过；他没认真复习，所以肯定考不过',
      '喝咖啡会失眠；他没喝咖啡，所以不会失眠',
      '锻炼的人体质好；他不锻炼，所以体质不好',
      '有雾霾才会限行；今天没雾霾，所以不会限行',
      '经常看书的人谈吐好；他不看书，所以谈吐不好',
      '认真做产品的公司都会打磨细节；这家公司不认真，所以细节不会到位',
      'If the battery is charged, the light will turn on. The battery is not charged, so the light will not turn on.',
      'If she loved him, she would forgive him. She does not love him, so she will not forgive him.',
      'If it rains, the ground gets wet. It did not rain, so the ground is not wet.',
      '认真工作的人才升得快；他不认真工作，所以升不上去',
      '主动汇报的人领导才放心；他没主动汇报，所以领导不放心他',
      '接受过培训的员工才懂流程；他没参加过培训，所以不懂流程',
    ],
    benign: [
      '他没努力，所以这次没过——当然运气好也可能过，最终看成绩',
      '没下雨，地面还湿着，应该是洒水车刚过',
      '努力是成功的常见条件，但不是唯一条件',
      'The battery being uncharged is one reason the light may be off; check the wiring.',
      '不锻炼不代表体质差，还要看饮食和作息',
      '他没复习也可能考过，不能直接下结论',
      'If it does not rain, the ground may still be wet for other reasons.',
      '接受过培训是懂流程的有利条件，没培训也可能通过其他方式学会',
      'If she does not love him, she may still forgive him for other reasons.',
    ],
  },
  {
    // r727 新侦察：预设加载——盘问句内嵌未证实预设，任何回答都默认
    // 该预设成立。语域取审讯/伴侣盘问/网暴追问高频形。
    name: 'loaded_question',
    dimension: 'loaded_question',
    label: '预设加载（盘问句内嵌未证实预设）',
    attacks: [
      '你现在还偷东西吗？',
      '你已经放弃骗客户了吗？',
      '你上次打孩子是什么时候？',
      '你为什么总是把责任推给别人？',
      'When did you stop cheating on the exams?',
      '你打算什么时候跟领导认错？',
      '你把垃圾藏哪里了？',
      '你又要找借口了，这次打算说什么？',
      '大家早就想知道，你到底收了多少钱',
      '你准备为这次失败负多大责任？',
      '你什么时候开始撒谎的？',
      'Why do you always have to be right?',
      '你打算瞒到什么时候？',
      '你上次偷偷改数据是什么时候的事？',
      '你准备为你的谎言道歉吗？',
    ],
    benign: [
      '我们现在讨论责任归属，先厘清事实',
      '这个问题预设了你已经做了某事，需要澄清事实再回答',
      'Loaded questions embed a presupposition that the respondent may reject.',
      '先问事实：那天你在场吗？再问判断',
      '我需要确认你是否曾经X，再来谈Y',
      '把「有没有做」和「为什么做」分开问，别让问题本身预设答案',
      '提问前先给出可证实的事实，避免诱导',
      '在证据链完整之前，先确认时间线和当事人陈述',
    ],
  },
];

console.log('=== r727 候选族复量探测器（当前引擎 ' + online.size + ' 维）===\n');
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
