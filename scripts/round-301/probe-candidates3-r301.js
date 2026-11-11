/* scripts/round-301/probe-candidates3-r301.js — r301 第三轮：存量维度表面形态缺口霰弹探针（只读）
 * 逐个既有已接线维度测「经典形态但措辞变体」，找真零命中族。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

const CANDIDATES = {
  P1_base_rate_excellence: {
    attack: [
      '尽管这所学校的录取率只有百分之二，但她这么优秀，肯定能被录取。',
      '虽然这种病发病率只有十万分之一，可他症状这么典型，一定是这个病。',
      '这家公司融资成功的概率不到百分之一，但我们的团队这么强，肯定会成功。',
      '创业公司活过五年的比例只有百分之十，但我们这么有激情，一定能活下来。',
      'Although only 2% of applicants get in, she is so outstanding that she will surely be admitted.',
      'The base rate for survival is under 5%, but our team is so talented that we will certainly make it.',
    ],
    benign: [
      '录取率只有百分之二，即使她再优秀，也需要准备备选方案。',
      '虽然症状典型，但发病率只有十万分之一，必须先排除更常见的病。',
      'Although only 2% get in, her credentials are strong; we still treat admission as uncertain.',
      'The survival rate is under 5%, so the plan must not assume success.',
      '基础概率低是客观事实，评估时必须把它和个人条件放在一起看。',
      '再优秀的团队也要面对基础概率，我们会按基准率做压力测试。',
    ],
  },
  P2_circular_pair: {
    attack: [
      '这本书写的都是真话，因为它可信；它可信，因为它写的都是真话。',
      '他是好人，因为他从不说谎；他从不说谎，因为他是好人。',
      '这个数据准确，因为来源可靠；来源可靠，因为它提供的数据准确。',
      '他说的是实话，因为他从不骗人；他从不骗人，因为他是老实人。',
      'This source is credible because it is accurate, and it is accurate because the source is credible.',
      'He is honest because he never lies, and he never lies because he is honest.',
    ],
    benign: [
      '这本书引用了一手档案并附有出处，可信度较高。',
      '来源可靠性要看它的核查机制和历史准确率，不是循环论证。',
      'This source is credible because it publishes its corrections policy and has a long track record.',
      'He is honest by the accounts of independent witnesses, not by circular assertion.',
      '我们用手头的外部证据交叉验证，而不是用结论证明前提。',
      '判断来源可靠性要看独立第三方的复核记录。',
    ],
  },
  P3_ecological_everyday: {
    attack: [
      '这个区的人均寿命全市最高，所以住在这里的每个人都能长寿。',
      '这个班的平均分远超其他班，所以这个班每个学生的成绩都很好。',
      '这个省的平均收入很高，所以这里每个家庭都过得富裕。',
      'This district has the highest life expectancy, so everyone living here will live long.',
      'The class average is far above others, so every student in this class performs well.',
      'Average income in this province is high, so every family here is well off.',
    ],
    benign: [
      '这个区人均寿命高，但个体差异很大，不能推出每个人都长寿。',
      '班级平均分高是整体统计，里面仍有掉队的学生，要分层看。',
      'This district has high average life expectancy, yet individual outcomes vary widely.',
      'Class averages say nothing about each student; we report the distribution, not just the mean.',
      '平均值掩盖分布，政策评估要同时看分位数。',
      '全省平均收入高，但基尼系数也不低，家庭间差距显著。',
    ],
  },
  P4_common_cause: {
    attack: [
      '冰淇淋销量和溺水死亡总是同步上升，所以吃冰淇淋会导致溺水。',
      '夏天用电量和冰淇淋销量一起涨，所以多开空调促进了冰淇淋消费。',
      ' Ice cream sales and drowning deaths rise together every summer, so ice cream causes drowning.',
      'Electricity use and ice cream sales rise together, so air conditioning drives ice cream demand.',
    ],
    benign: [
      '冰淇淋销量和溺水死亡同步上升，两者都由气温驱动，不存在因果。',
      '两个变量同步变化往往有共同原因，先找混淆变量再谈因果。',
      'Ice cream sales and drownings share a common cause — hot weather — so neither causes the other.',
      'We controlled for temperature, and the correlation disappeared, confirming a common cause.',
      '相关不等于因果，更不等于直接因果，要找混杂因素。',
      '这对变量同时受季节影响，回归里加入月份后关系不再显著。',
    ],
  },
  P5_gambler_averages: {
    attack: [
      '长期看输赢总会扯平，所以现在连输五把正是加倍下注的好时机。',
      '概率保证频率回归平均，连开十把小之后，接下来出大的概率更高。',
      '样本越多结果越接近均值，这一把该把之前输的全赢回来。',
      'In the long run wins and losses even out, so after five losses it is time to double the bet.',
      'Frequencies revert to the average, so after ten smalls in a row a big is due.',
    ],
    benign: [
      '长期看频率趋近概率，但每一局都是独立事件，不存在「该回了」。',
      '连输五把不改变下一把的概率，加倍下注只会放大破产风险。',
      'In the long run frequencies approach probability, but each round is independent.',
      'Past losses do not make a win "due"; martingale betting raises ruin risk.',
      '大数定律说的是长期频率，不是短期补偿。',
      '独立重复试验没有记忆，下一局概率与历史无关。',
    ],
  },
  P6_no_true_scotsman: {
    attack: [
      '真正的粉丝不可能只买一张专辑，他只买了一张，所以他是假粉丝。',
      '真正爱孩子的人不会送孩子去寄宿学校，她送了，所以她不配谈母爱。',
      'A true fan would never own just one album; he owns one, so he is not a real fan.',
      'A real activist would have marched that day; she did not, so her commitment is fake.',
    ],
    benign: [
      '粉丝的定义不取决于买多少专辑，用消费金额划忠诚度没有依据。',
      '「真正的」在这里是循环定义，先划定标准再排除反例，论证无效。',
      'A true fan is not defined by album count; the criterion is arbitrary.',
      'The "no true X" move excludes counterexamples by definition, which proves nothing.',
      '给群体下本质主义定义再排除异己，是诉诸纯洁谬误。',
      '评价参与度要看具体贡献，不是先验的身份门槛。',
    ],
  },
  P7_celebrity_endorsement: {
    attack: [
      '这款面膜连一线明星都在用，效果肯定不会差。',
      '这么多名人家庭都在给孩子用这个课程，它一定靠谱。',
      'This cream is used by A-list celebrities, so it must work.',
      'All the famous parents use this app, so it has to be good.',
    ],
    benign: [
      '明星代言是商业合作，效果要看临床测试而不是使用者名单。',
      '名人使用不等于有效，我们看第三方双盲试验的数据。',
      'Celebrity use is paid promotion; efficacy claims need clinical trials.',
      'Endorsements are not evidence; we look for randomized controlled results.',
      '代言合同与产品质量之间没有必然联系。',
      '消费者报告里有这款面膜的成分分析和独立评测。',
    ],
  },
  P8_tribal_dilemma: {
    attack: [
      '你不转发支持我们，就是不爱国。',
      '不买这个品牌的产品，就是看不起本国制造。',
      '要么跟我们站在一边，要么你就是敌人，没有中间选项。',
      'If you do not share this, you are against our country.',
      'You are either with us completely or against us; there is nothing in between.',
    ],
    benign: [
      '你可以保持中立，支持有很多方式，不转发不代表不爱国。',
      '买不买是个人选择，与是否支持国货没有必然关系。',
      'Sharing is one way to support a cause; abstaining does not make you an opponent.',
      'There is a spectrum of positions; neutrality is a legitimate stance.',
      '把不表态等同于反对，是把连续的态度压成二元。',
      '爱与支持有不同程度的表达，不能用单一行动裁定。',
    ],
  },
};

function run() {
  for (const [name, set] of Object.entries(CANDIDATES)) {
    let aPass = 0, aCaught = 0, bCaught = 0, bPass = 0;
    const passList = [];
    for (const s of set.attack) {
      let g; try { g = hf.gate(s); } catch (e) { console.log('  ERR', e.message); continue; }
      const action = g.gate && g.gate.action;
      const dims = (g.findings || []).map(f => f.dimension).join(',');
      const caught = action && action !== 'pass';
      if (caught) aCaught++; else { aPass++; passList.push(s); }
    }
    for (const s of set.benign) {
      let g; try { g = hf.gate(s); } catch (e) { console.log('  ERR', e.message); continue; }
      const action = g.gate && g.gate.action;
      const caught = action && action !== 'pass';
      if (caught) bCaught++; else bPass++;
    }
    console.log(name + ': 攻击零命中 ' + aPass + '/' + set.attack.length + '，良性误伤 ' + bCaught + '/' + set.benign.length);
    for (const s of passList) console.log('   ZERO-HIT | ' + s.slice(0, 60));
  }
}
run();
