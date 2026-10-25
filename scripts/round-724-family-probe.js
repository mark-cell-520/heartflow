/**
 * scripts/round-724-family-probe.js
 * [r724] 候选族复量探测器。判定逻辑沿用 r716-r723（判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；良性被
 * block/rewrite 即误伤；>=50% 攻击漏判且良性 0 误伤才算合格候选）。
 * 已上线族自动跳过（dimension 键集合命中即跳过）。
 * 误伤样本做维度归因（连坐纪律——存量误伤先修再上线）。
 *
 * 复测对象 = r723 交接簿「已知未修项」五项 + r724 新侦察两族：
 *   texas_sharpshooter 德州神枪手（r723 复测漏判 76%、误伤 0/11，
 *     r723 交接簿钦定「下轮优先」——本轮补语域高频形态后复测）
 *   relative_privation 诉诸更惨（r723 复测 71%、0/8）
 *   middle_ground 诉诸中庸（r723 复测 64%、0/6）
 *   composition_division 合成分分解（r723 复测 62%、0/7）
 *   appeal_to_consequences 诉诸后果（r723 复测 53%、0/9）
 *   base_rate_fallacy 基准率忽视（r724 新侦察：医疗/风控语域高频）
 *   guilt_by_association 连坐定罪（r724 新侦察：人际/舆论语域高频）
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
    name: 'texas_sharpshooter',
    label: '德州神枪手（先射箭后画靶：从噪声里挑规律/事后编故事）',
    dimension: 'texas_sharpshooter',
    attacks: [
      // r722/r723 原集
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
      // r724 补语域高频形态（复盘/月报/客户案例/先结论后数据）
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
    name: 'relative_privation',
    label: '诉诸更惨问题（拿更惨的人抹掉眼前抱怨）',
    dimension: 'relative_privation',
    attacks: [
      // r722/r723 原集
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
      // r724 补语域高频形态（婚恋/职场/地域）
      '别抱怨 996 了，工地上还有搬砖的呢',
      '你至少有双休，服务业全年无休的多的是',
      '别嫌工资低，至少还有五险一金，知足吧',
      '你至少还年轻，多少人这个年纪已经一身病了',
      '别喊嫁得不好，至少还有人要你，知足吧',
      '你至少考上了大学，多少人初中就辍学了',
      'Stop complaining about the commute; some people walk ten miles.',
      'You lost your job, but at least you have savings — some have nothing.',
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
    name: 'middle_ground',
    label: '诉诸中庸（真理一定在中间/折中最公平）',
    dimension: 'middle_ground',
    attacks: [
      // r722/r723 原集
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
      // r724 补语域高频形态（谈判/仲裁/舆论）
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
    name: 'composition_division',
    label: '合成分分解谬误（个体优秀=整体优秀/整体属性=个体属性）',
    dimension: 'composition_division',
    attacks: [
      // r722/r723 原集
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
      // r724 补语域高频形态（招聘/产品/芯片）
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
    name: 'appeal_to_consequences',
    label: '诉诸后果（后果不可接受=结论为假/为真）',
    dimension: 'appeal_to_consequences',
    attacks: [
      // r722/r723 原集
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
      '如果这是真的，那我的面子往哪搁？所以是假的',
      '承认这个问题存在，我们的项目就得黄，不能认',
      // r724 补语域高频形态（医疗诊断/投资/公司）
      '如果他是清白的，那公司就完了，所以他一定有问题',
      '如果房价真的见顶，那我这些年就白等了，不会的',
      '这个消息不能信，信了大家就没信心了',
      '如果诊断是真的，我投的钱就全打水漂了，不可能',
      'If the rumors are true, the company will collapse — so they are false.',
      'The diagnosis must be wrong; I cannot accept that I am seriously ill.',
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
      '即使承认问题会影响进度，我们也得先评估影响再决定',
      '影响再大也不能绕过核查，先验证数据来源再说',
    ],
  },
  {
    name: 'base_rate_fallacy',
    label: '基准率忽视（r724 新侦察：只看条件概率不看先验）',
    dimension: 'base_rate_fallacy',
    attacks: [
      // r724 新侦察语域高频形态（医疗/风控/招聘）
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
    name: 'guilt_by_association',
    label: '连坐定罪（r724 新侦察：关系人的问题算到他头上）',
    dimension: 'guilt_by_association',
    attacks: [
      // r724 新侦察语域高频形态（人际/舆论/职场）
      '他朋友就是骗子，他能好到哪去',
      '她前任个个都劈腿，说明她本身就有问题',
      '这家公司出过诈骗犯，这里上班的都不是好东西',
      '他爸以前犯过事，儿子肯定也不是什么好人',
      '这个博主跟那个翻车的人互关，一路货色',
      '他在那个团队待过，团队名声臭，他也干净不了',
      '他亲戚是老赖，他说话能信吗',
      '他跟那个人吃过饭，你说能是什么好人',
      'His brother is a criminal, so he must be one too.',
      'She used to work for that company, so she cannot be trusted.',
      '他关注列表里有公知，说明他也是一伙的',
      '他们老家出了这事，那边来的人都要防着点',
    ],
    benign: [
      '警惕关联风险是理性的，但要靠证据而不是靠关系定罪',
      '亲属关系不是证据，我们按事实逐条核查',
      '他朋友的问题归他朋友，我们看他本人的记录',
      'Guilt by association is not evidence; we judge him on his own record.',
      '团队出过问题是背景信息，个人表现要单独看',
      '关注列表不能说明立场，发言和行动才可以',
      '地域不是判断依据，个案我们个案查',
      '保持警惕可以理解，但结论要落在具体行为上',
    ],
  },
];

console.log('=== r724 候选族复量探测器（当前引擎 ' + online.size + ' 维）===\n');
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
