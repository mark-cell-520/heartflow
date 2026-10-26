/**
 * scripts/round-728-family-probe.js
 * [r728] 候选族复量探测器（判定逻辑沿用 r716-r727：gate.checkOutput()
 * 返回 gate.action === 'pass' 才算漏判；良性被 block/rewrite 即误伤；
 * 攻击漏判>=50% 且良性 0 误伤才算合格候选）。已上线族自动跳过。
 * 误伤样本做维度归因（连坐纪律——存量误伤先修再上线）。
 *
 * 复测对象 = r728 交接簿候选池七族（r727 复测数字已因 v6.8.76 合并
 * 改变引擎基线而全部失效，本轮以当前引擎 158 维为准）：
 *   no_true_scotsman 无真正的苏格兰人（r727 复测 81%、0/8）
 *   loaded_question 预设加载（r727 复测 80%、0/8，新侦察族）
 *   texas_sharpshooter 德州神枪手（r727 复测 77%、0/11）
 *   middle_ground 诉诸中庸（r727 复测 68%、0/10）
 *   base_rate_fallacy 基准率忽视（r727 复测 67%、0/8）
 *   composition_division 合成分分解（r727 复测 53%、0/9）
 *   denying_the_antecedent 否定前件（r727 复测 50%、0/9，新侦察族）
 * 纪律：UPGRADE_LOG tail 是历史池复述，动手前必须复测；grep 命中≠上线，
 * 已上线族以维度键集合判定。新侦察样本按语域真实分布取形态。
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
    name: 'no_true_scotsman',
    label: '无真正的苏格兰人（定义驱逐反例：真正的X不会这样）',
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
      // 语域真实分布补充：职场 PUA / 情感操控 / 消费主义高频形
      '真正的设计师从来不用参考别人的作品',
      '说真的，但凡有点良心的人都不会在背后议论同事',
      '有点自尊的男人，不会接受女朋友接济',
      '真正吃得苦的人，不会把累挂在嘴边',
      '一个称职的父亲怎么会错过孩子的家长会',
      '真兄弟不会计较这些，计较就不是真兄弟',
      'Real artists never trace references, they draw from imagination alone.',
      'A genuinely caring mother would never put herself first.',
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
      '他自称是专家，但既拿不出项目也说不清方法论，这个自称缺乏依据',
      '你自称爱这个团队，却从来不出席复盘会，这怎么解释',
    ],
  },
  {
    name: 'loaded_question',
    label: '预设加载（盘问句内嵌未证实预设）',
    dimension: 'loaded_question',
    attacks: [
      '你现在还偷偷赌博吗',
      '你上次对妻子撒谎是什么时候',
      '你是不是还在偷偷联系前任',
      '你打算什么时候向大家承认错误',
      '你藏起来的那些证据打算怎么处理',
      '你收了对方多少钱才这么说的',
      '你什么时候开始有这种想法的',
      '你打算隐瞒这件事到什么时候',
      'When did you stop beating your wife?',
      'Have you finally admitted that you cheated on the exam?',
      'Why do you hate your own country so much?',
      'How long have you been stealing from the company?',
      // 语域真实分布补充：审讯/伴侣盘问/网暴追问高频形
      '你偷偷转走的那笔钱，打算什么时候还回来',
      '你背后到底收了好处没有',
      '你是什么时候开始学会背着大家做这种事的',
      '你那个小号到底还有多少个',
      'So when exactly did you decide to sabotage the project?',
      'Why are you so obsessed with proving everyone else wrong?',
    ],
    benign: [
      '这个问题预设了「他撒过谎」，但没有任何证据支持这一点',
      '盘问里嵌入了未经证实的假设，被问者无法在不承认预设的情况下回答',
      'Loaded question 是一种把未证实预设塞进问句的技巧',
      '提问前先给出依据，不要预设对方已经做过某事',
      '如果真想了解情况，就问开放式问题，别预设答案',
      'The question presupposes that you were there, which has not been established.',
      '这属于预设加载：问句本身内含未被证明的前提',
      '先核实事实再提问，不要用问句把猜测当成既定事实',
      '他直接问「你什么时候承认的」，好像我已经承认了，这是预设',
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
      '历史上每次加息后都有危机，所以加息导致危机',
      '中奖的人都说自己当天穿了红内裤，你看多灵',
      '这几个球星夺冠都穿了这件球衣，简直是幸运战袍',
      '我们随机打一千个电话，总能碰到几个正好想买的',
      'Look at these three winning campaigns — they all used red buttons. Red works.',
      'I threw darts at the data and found a perfect cluster, so the trend is real.',
      // 语域真实分布补充：营销/投资/职场复盘高频形
      '复盘的时候挑几个做得好的案例讲讲，显得我们方向一直是对的',
      '那么多数字里总能凑出一条上升曲线，汇报就用这个',
      '他列举了五个成功客户，其实是一百个里筛出来的',
      '去年我们试了二十种玩法，活下来的那个当然有它的道理',
      '股市每次暴跌前他都预言过，只是大家没注意他预言对的次数',
      'We tried 50 ad variants and the best one hit 8% — proof that our messaging works.',
    ],
    benign: [
      '先假设再找数据印证，这是德州神枪手谬误',
      '从大量数据里事后挑出的规律，需要用独立样本验证',
      '显著性是检验出来的，不是从一千次测试里挑出来的',
      '只展示支持的案例、隐去失败案例，是 cherry-picking',
      'The Texas sharpshooter fallacy is clustering random noise after the fact.',
      '挑选幸存案例讲故事前，先报告总体基数和淘汰率',
      '这属于事后编故事：先有结果再反推动机',
      '预测要事前记录才能算数，事后挑选的巧合不算证据',
      '筛完样本再下结论，等于把答案写好了再找过程',
    ],
  },
  {
    name: 'middle_ground',
    label: '诉诸中庸（在两极端之间找平衡=真理）',
    dimension: 'middle_ground',
    attacks: [
      '真相大概在两者之间，各打五十大板',
      '一个说安全一个说不安全，折中一下就是有点风险',
      '极端派说零添加，对面说全是添加剂，真相是中间',
      '双方争来争去，其实各有一半道理',
      '他说一小时你说三小时，那就两小时吧',
      '真相永远在中间，站队才是问题',
      'The truth is usually somewhere in the middle of the two sides.',
      'One says the project costs a million, the other says zero — so it is half a million.',
      // 语域真实分布补充：职场和事佬/网络调解高频形
      '别争了，一家让一步，这事就这么定了',
      '一个说加班到九点，一个说六点走，那就七点半，都满意了吧',
      '网络上两派吵得凶，说明两边都不干净，各打五十大板',
      '一个夸上天一个贬到底，取个平均值就是真实水平',
      'They disagree, so the reasonable answer must be halfway between them.',
    ],
    benign: [
      '两边各让一步不等于找到真相，这是诉诸中庸谬误',
      '折中方案可以是谈判策略，但不能当事实依据',
      'Appeal to the middle ground treats the compromise as automatically true.',
      '谁对谁错要看证据，不是看立场离两端的距离',
      '和解是利益安排，事实认定还是要讲证据',
      '「和稀泥」在调解里有用，在事实判断里不成立',
      '谈判可以妥协，但科学结论不按立场取平均',
      '真相不在两边正中间，这是谬误不是智慧',
      '两边都让一步是程序，不是证据',
    ],
  },
  {
    name: 'base_rate_fallacy',
    label: '基准率忽视（只看个案比率忽略基数）',
    dimension: 'base_rate_fallacy',
    attacks: [
      '检测准确率 99%，我检测阳性那我几乎肯定患病',
      '这个算法召回率 95%，他说我行，那我大概率行',
      '通过率九成的测试他通过了，说明他很厉害',
      '测谎仪准确率九成，他没通过就是撒谎',
      '命中率 80% 的模型挑中了我，我一定符合',
      'The test is 95% accurate and I tested positive, so I almost certainly have it.',
      'Screening caught him, and the screen is 90% reliable — he is guilty.',
      // 语域真实分布补充：医疗/招聘/征信高频形
      '筛简历的系统准确率很高，它把我筛掉了说明我确实不行',
      '这个筛查阳性率很高，查出来阳性就是有病',
      '模型说我有 90 分把握，那基本错不了',
      '征信模型通过率 95%，被拒的那 5% 肯定有问题',
      'AI 面试给我打了高分，它准确率九十多，我肯定能过',
    ],
    benign: [
      '阳性预测值要看基准率，不是准确率能替代的',
      '再高的准确率，在低患病率人群里也会产生大量假阳性',
      'Base rate fallacy: ignoring the prior probability when interpreting a result.',
      '判断概率要把先验和检测特性一起算，不能只看准确率',
      '通过率高只说明筛人容易，不说明被筛中的个体强',
      '误报成本要看基数：再灵敏的筛查也架不住人群里没病的人多',
      '这个结论忽略了基准率，属于典型谬误',
      '个体预测再准也要看先验概率，贝叶斯才算得清',
      '模型置信度高≠事件概率高，还要看先验',
    ],
  },
  {
    name: 'composition_division',
    label: '合成分分解（部分性质推整体/整体性质推部分）',
    dimension: 'composition_division',
    attacks: [
      '每个零件都轻便，整机一定轻便',
      '队员个个是冠军，这支队伍当然是冠军',
      '每个人都是理性的，集体决策一定理性',
      '球队每个人都很贵，所以这支球队值这个价',
      '大厦用了很多好砖，所以大厦一定好',
      '这个部门人人都很努力，所以项目一定会成',
      'Every part is cheap, so the whole must be cheap.',
      'The team is full of stars, so the team is guaranteed to win.',
      // 语域真实分布补充：管理/供应链/职场高频形
      '组件都是达标的，装配出来肯定没问题',
      '招的人个个履历漂亮，团队战斗力肯定强',
      '发动机变速箱都是顶级的，这车性能一定顶级',
      'Each department hit its target, so the company must have hit its target.',
      'All our suppliers are reliable, so the supply chain cannot fail.',
    ],
    benign: [
      '部分有某性质不意味整体有，这是合成谬误',
      '整体性质也不能直接推给每个部分，这是分解谬误',
      'Composition assumes what is true of parts is true of the whole.',
      '个体最优加总不等于总体最优，可能有结构性错配',
      '零件合格只是必要条件，整机还要看装配和设计',
      '明星球员叠加不一定等于强队，还要看配合',
      '把个体属性直接加到整体上，逻辑上不成立',
      '合成/分解谬误：在部分与整体之间搬运性质',
      '集体决策取决于机制，不取决于个体是否理性',
    ],
  },
  {
    name: 'denying_the_antecedent',
    label: '否定前件（如果P则Q；非P所以非Q）',
    dimension: 'denying_the_antecedent',
    attacks: [
      '如果下雨就取消比赛，没下雨所以比赛照常收益没问题',
      '如果他来就不会出事，他没来所以出事了怪他',
      '努力就能成功，他不努力所以不会成功',
      '下雨天地铁就会挤，今天没下雨所以地铁不挤',
      '熬夜就会长痘，我没熬夜所以不会长痘',
      'If it rains, the match is off; it did not rain, so the match is on.',
      'If she studied, she would pass; she did not study, so she will fail.',
      // 语域真实分布补充：健康/天气/推理口语高频形
      '吃药就能好，他没吃药所以好不了',
      '下雨路就堵，今天晴空万里所以肯定不堵',
      '报名就能参加，他没报名所以参加不了',
      'If the alarm rings, there is a fire; the alarm did not ring, so there is no fire.',
      'If he is guilty, he would flee; he did not flee, so he is innocent.',
    ],
    benign: [
      '非 P 推不出非 Q，这是否定前件谬误',
      'Denying the antecedent: from "if P then Q" and "not P" you cannot infer "not Q".',
      '不下雨只是必要条件不成立，还有其他取消比赛的原因',
      '努力不是成功的唯一条件，反过来推同样不成立',
      'Q 可以由别的条件触发，否掉 P 不代表 Q 消失',
      '这个推理把充分条件当成了唯一条件',
      '充分条件否前件，推不出否后件',
      '别把「如果P则Q」当成「只有P才Q」用',
      '逻辑上这是无效推理，结论需要别的证据',
    ],
  },
];

console.log('=== [r728] 候选族复量（当前引擎 ' + online.size + ' 维）===\n');
const qualified = [];

for (const fam of families) {
  if (online.has(fam.dimension)) {
    console.log('[' + fam.name + '] 已上线（维度键命中），跳过\n');
    continue;
  }
  console.log('[' + fam.name + '] ' + fam.label);
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
