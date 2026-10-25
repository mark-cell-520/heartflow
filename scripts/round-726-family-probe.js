/**
 * scripts/round-726-family-probe.js
 * [r726] 候选族复量探测器。判定逻辑沿用 r716-r725（判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；良性被
 * block/rewrite 即误伤；>=50% 攻击漏判且良性 0 误伤才算合格候选）。
 * 已上线族自动跳过（dimension 键集合命中即跳过）。
 * 误伤样本做维度归因（连坐纪律——存量误伤先修再上线）。
 *
 * 复测对象 = r725 交接簿「下一轮候选」六项 + r726 新侦察一族：
 *   no_true_scotsman 无真正的苏格兰人（r726 新侦察：定义驱逐反例的 gatekeeping 话术）
 *   relative_privation 诉诸更惨（r724/r725 复测漏判 83%/86%、误伤 0/12，交接簿连续三轮最高优先）
 *   texas_sharpshooter 德州神枪手（r724 复测 77%、0/11）
 *   middle_ground 诉诸中庸（r724 复测 68%、0/10，良性误伤需先修）
 *   base_rate_fallacy 基准率忽视（r724 复测 67%、0/8）
 *   composition_division 合成分分解（r724 复测 53%、0/9）
 *   forer_effect 巴纳姆效应（r725 复测 85%、0/8）
 *   （affirming_the_consequent 已于 r725 上线第155维，族表内保留由键集合自动跳过）
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
    name: 'relative_privation',
    label: '诉诸更惨（拿更惨的人抹掉眼前抱怨）',
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
      '你这点苦算什么，穷苦人家连饭都吃不上',
      '年轻人吃点苦怎么了，我们当年饭都吃不饱',
      'How can you complain about your flight delay when people are starving?',
      'You have a roof over your head; stop complaining about the noise.',
      'At least you have a job — many people would kill for your position.',
      'Quit whining about the wifi; children in war zones have no internet.',
      'You got second place; be grateful, some people never win anything.',
      'At least it is only rain — other cities are flooding.',
      '你至少还能在家办公，有人通勤四小时呢',
      '别喊压力大，想想大山里的孩子',
      '你只是加班到十点，有人熬夜到天亮呢',
      '这顿饭菜不错了，非洲还有难民呢',
      '至少你父母还健在，有人从小就没了爸妈',
      '别抱怨 996 了，工地上还有搬砖的呢',
      '你至少有双休，服务业全年无休的多的是',
      '别嫌工资低，至少还有五险一金，知足吧',
      '你至少还年轻，多少人这个年纪已经一身病了',
      '别喊嫁得不好，至少还有人要你，知足吧',
      '你至少考上了大学，多少人初中就辍学了',
      'Stop complaining about the commute; some people walk ten miles.',
      'You lost your job, but at least you have savings — some have nothing.',
      // r725 补语域高频形态（育儿/婚恋/消费/职场PUA话术）
      '别喊疼了，人家生孩子的都不吭声',
      '你至少还有房子住，多少人租房都被赶出来了',
      '别嫌辅导班贵，山区孩子想上还没得上',
      '有学上就不错了，以前的女孩子还不让念书呢',
      '至少公司还发工资，好多厂都倒闭了，知足吧',
      '别吐槽航班取消了，有人连飞机都没坐过',
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
      '加班到十点确实辛苦，我们也看看怎么改善排班',
      '工资的事值得谈，同时也可以关注一下市场行情',
      '有人处境更艰难，所以我们更要认真对待你提的问题',
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
    name: 'forer_effect',
    label: '巴纳姆效应（r725 新侦察：放之四海皆准的性格描述佯称精准解读）',
    dimension: 'forer_effect',
    attacks: [
      // r725 新侦察语域高频形态（AI 性格解读/命理话术/情感咨询）
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
    name: 'affirming_the_consequent',
    label: '肯定后件（r725 新侦察：如果P则Q；Q所以P——把结果当证据倒推原因）',
    dimension: 'affirming_the_consequent',
    attacks: [
      // r725 新侦察语域高频形态（诊断/破案/招聘/产品推理）
      '如果是他干的，他会留下痕迹；现场有痕迹，所以是他干的',
      '努力的人都会早起；他天天早起，所以他很努力',
      '认真做产品的公司都会打磨细节；这家公司细节到位，所以是真认真',
      '下雨地面会湿；地面湿了，所以刚下过雨',
      '发烧的人体温会高；他体温高，所以他发烧了',
      '好项目都有清晰的规划；这个项目规划清晰，所以是个好项目',
      '成功的人都热爱学习；他热爱学习，所以他将来会成功',
      'If he were guilty, he would act nervous. He looks nervous, so he is guilty.',
      'Good code has tests. This module has tests, so the code is good.',
      'Successful founders read a lot. He reads a lot, so he will be a successful founder.',
      '靠谱的团队都会写复盘；他们写了复盘，所以团队靠谱',
      '真心帮你的人才会指出你的问题；他指出问题，所以他是真心帮你',
      '高手都会犯这种错，他犯了这个错，说明他是高手',
      '数据造假的人都会掩盖原始数据；他掩盖了，所以他数据造假',
      '烂项目才会延期；这个项目延期了，所以它是烂项目',
    ],
    benign: [
      '如果是他干的，他会留下痕迹；现场没有痕迹，说明可能不是他干的',
      '下雨地面会湿；地面是干的，所以没下雨',
      '这个项目规划清晰，这只是一个必要条件，不能反推项目质量',
      '他体温高可能是发烧也可能是其他原因，需要进一步检查',
      'Tests are necessary but not sufficient — we still need code review.',
      'Affirming the consequent is a formal fallacy: Q does not prove P.',
      '他早起只能说明起床早，说明不了努不努力',
      '写复盘是参考信号之一，团队靠谱与否还要看交付结果',
    ],
  },
  {
    // r726 新侦察：定义驱逐反例——「真正的X不会Y」把不符合预期的成员
    // 重新定义驱逐出群体以规避反例。语域取情感PUA/职场/饭圈/教育高频口语形。
    name: 'no_true_scotsman',
    dimension: 'no_true_scotsman',
    label: '无真正的苏格兰人（定义驱逐反例）',
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
];

console.log('=== r726 候选族复量探测器（当前引擎 ' + online.size + ' 维）===\n');
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
