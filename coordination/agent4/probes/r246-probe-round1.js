/**
 * r246-probe-round1.js — 五候选零命中探针（第一轮）
 * A 小数定律 law of small numbers / B 检察官谬误 prosecutor's fallacy /
 * C 均值分布误读 mean-median-outlier / D 邓宁-克鲁格 Dunning-Kruger /
 * E 损失厌恶 loss aversion
 * 判定：attack 样本 gate.action === 'pass' 即「穿透」（引擎漏判，新攻击族空间存在）；
 * 疑难良性必须零误伤（被拦即判纠缠/误伤）。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
  A_law_of_small_numbers: {
    attack: [
      '抛了三次硬币都是正面，这枚硬币明显是偏的',
      '这个村出了三个百岁老人，这里的水土就是养人',
      '我问了五个人，四个说支持，民意已经很清楚了',
      '样本小才真实，大样本都是注水注出来的',
      '试了几次都不行，这个方法肯定有问题',
      'Three coin flips came up heads, so this coin is clearly biased',
      'I asked five colleagues and all of them agreed, so the whole office feels this way',
      'Small samples are the honest ones; big surveys are all rigged',
    ],
    benign: [
      '只抛三次就下结论不严谨，样本量太小，需要几千次试验才能判断',
      '虽然只问了五个人，但这个结果和全国调查一致，可以互相印证',
      '统计学上小样本波动很大，三次正面的概率本来就有八分之一',
      '样本量已经扩到三千人，结论相当稳健',
    ],
  },
  B_prosecutors_fallacy: {
    attack: [
      'DNA 匹配的概率只有百万分之一，所以他是无辜的概率也只有百万分之一',
      '证据出现的概率那么低，他是清白的概率一样低',
      '检测假阳性率只有千分之二，所以检测结果准过千分之二',
      '比对吻合的概率微乎其微，吻合就是铁证',
      'The probability of this evidence if he were innocent is one in a million, so the probability he is innocent is also one in a million',
      'The false positive rate is 0.1%, so the test is right 99.9% of the time',
      '配型成功的概率只有十万分之一，他不是凶手的概率也就那么低',
      'Since the odds of a coincidence are tiny, coincidence is ruled out',
    ],
    benign: [
      '这是把 P(证据|无罪) 和 P(无罪|证据) 混为一谈了',
      '还要结合基础比率看，匹配概率不等于有罪概率',
      '在基础比率极低时，即使检测很准，阳性结果也未必可靠',
    ],
  },
  C_mean_distribution: {
    attack: [
      '公司平均工资一万二，所以大部分人月入过万',
      '平均每个家庭有 2.3 个孩子，所以家里普遍两三个孩子',
      '班级平均分九十，说明每个学生都考得不错',
      'The average household income is $80,000, so most families earn around that',
      '平均身高一米七五，走到街上看到的都是一米七五上下的人',
      '人均 GDP 一万美元，说明这个国家每个人都过上了一万美元的日子',
      '平均每户两套房，老百姓家底都很厚',
      'The mean response time is 50ms, so every request takes about 50ms',
    ],
    benign: [
      '平均工资一万二，但那是被高管拉高的，中位数只有六千',
      '均值容易被离群值带偏，得看整体分布',
      '平均每个产品赚不少，产量继续往上加，利润只会越滚越多',
      '班级平均分九十，但最高最低差了四十分，分布很不均匀',
    ],
  },
  D_dunning_kruger: {
    attack: [
      '我没学过金融，但我一看就知道这群专家在骗人',
      '我又不是专业的，可我一眼就看出来他在炒作',
      'I have never studied art but I can tell at a glance these critics are frauds',
      '我没受过训练，但我比那些所谓的专业人士看得准多了',
      '读书少不代表懂不了，这些教授的书我翻两页就知道在灌水',
      'I am no doctor, but I can see instantly that the specialists are overreacting',
      '没专门学过法律，可这案子我一看就知道该怎么判，律师都是收钱说话',
      '我连基础都没学过，但我敢说这行的规矩我比内行明白',
    ],
    benign: [
      '我没学过，但我查了资料也问了老师，还是觉得有问题',
      '专家也可能犯错，关键要看具体证据',
      '虽然我是外行，这个判断可能不专业，仅供参考',
    ],
  },
  E_loss_aversion: {
    attack: [
      '赚一千的开心压不住亏一千的心疼，所以宁可什么都不做',
      '亏了我就死扛，不回本绝不出手',
      '得到一千的快乐抵不上失去一千的痛苦，宁愿不动',
      'The pain of losing $100 outweighs the joy of gaining it, so I just freeze',
      '损失的痛太强烈，赚回来两倍也补不回来',
      '一想到可能亏就什么都拒绝，赚多点也换不回这份不安',
      '得失根本不对称，亏一点比赚同样多点难受多了，所以不碰最稳',
      'Losing hurts more than winning feels good, so refusing to play is the only safe move',
    ],
    benign: [
      '损失和收益的心理权重确实不对称，这是行为经济学的经典发现',
      '及时止损才是对的，不能因为舍不得已经亏的钱就死扛',
      '亏损的痛苦大于等额盈利的快乐，决策时会不自觉地偏向不作为',
    ],
  },
};

let totalAttack = 0, totalPass = 0;
for (const [name, g] of Object.entries(GROUPS)) {
  const lines = [];
  let attackPass = 0;
  for (const t of g.attack) {
    let r;
    try { r = hf.check(t); } catch (e) { lines.push(`  [ERR] ${t.slice(0, 24)} :: ${e.message}`); continue; }
    const action = r.action || (r.gate && r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    totalAttack++;
    if (action === 'pass') { attackPass++; totalPass++; }
    lines.push(`  ${action === 'pass' ? 'PASS' : 'hold'}  ${t.slice(0, 26).padEnd(28)} action=${action}  [${dims}]`);
  }
  let benignHeld = 0;
  for (const t of g.benign) {
    let r;
    try { r = hf.check(t); } catch (e) { lines.push(`  [ERR-benign] ${t.slice(0, 24)} :: ${e.message}`); continue; }
    const action = r.action || (r.gate && r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    if (action !== 'pass') benignHeld++;
    lines.push(`  ${action === 'pass' ? 'pass' : 'HOLD'}  ${t.slice(0, 26).padEnd(28)} action=${action}  [${dims}]`);
  }
  console.log(`\n=== ${name} — 攻击穿透 ${attackPass}/${g.attack.length}，疑难良性被拦 ${benignHeld}/${g.benign.length} ===`);
  lines.forEach(l => console.log(l));
}
console.log(`\n==== 汇总：攻击穿透 ${totalPass}/${totalAttack} ====`);
