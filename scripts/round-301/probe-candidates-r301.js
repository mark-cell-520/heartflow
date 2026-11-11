/* scripts/round-301/probe-candidates-r301.js — r301 候选族缺口探针（只读）
 * 三候选并行探针，各自证「攻击真零命中 + 良性干净」：
 *   A 虚假类比/弱类比（逻辑谬误）：A与B相似→A的结论搬到B
 *   B 期望值≠概率混淆（时间与概率推理）：期望为正→大概率赢/每一局都值得押
 *   C 偶然/例外谬误（accident）：把通则压到例外情形上
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));

const CANDIDATES = {
  A_false_analogy: {
    attack: [
      'Facebook 和 Amazon 都是靠网络效应做大的，所以 Facebook 最终也会变成什么都能买的万能商店。',
      '亚马逊自建物流成功了，我们和亚马逊一样是电商，所以自建物流也一定能让我们成功。',
      '苹果靠封闭生态获得了高利润，我们也是做硬件的，所以走封闭生态我们也一定能拿到高利润。',
      '这家公司当年靠降价抢到了市场，我们的处境和它当年一样，所以降价也一定管用。',
      'A 城市靠地铁沿线开发带动了地产，我们城市和 A 城市地形条件相似，所以地铁沿线开发也一定行。',
      'Netflix 靠自制剧完成了转型，我们同为流媒体平台，转型路径相同，自制剧也一定能救我们。',
      '他靠每天跑步瘦了三十斤，我和他体质相仿，所以每天跑步也一定能让我瘦三十斤。',
      'Amazon scaled with AWS, and we are just like Amazon, so our platform business will surely scale the same way.',
      'Apple thrives with a closed ecosystem, and we also make hardware, so a closed ecosystem will surely work for us.',
      'That startup grew by cutting prices, and our market is just like theirs, so cutting prices will surely work for us.',
    ],
    benign: [
      '亚马逊自建物流成功了，但我们的客单价和订单密度与它差距很大，直接照搬风险很高。',
      'A 城市靠地铁沿线开发带动了地产，不过我们城市人口规模和地形都不同，需要单独论证可行性。',
      'Netflix 靠自制剧完成了转型，我们有内容成本和版权的差异，不能直接类推，要先做小规模测试。',
      'Facebook 和 Amazon 都靠网络效应做大，但两者的变现路径完全不同，不能据此推断业务会趋同。',
      'Amazon scaled with AWS, but our cost structure and customer base are different, so the analogy needs independent evidence.',
      'Apple thrives with a closed ecosystem; we evaluated the analogy carefully and found our supply chain does not support it.',
      '两家公司表面相似，但深层指标差异显著，我们逐项对比后再决定是否借鉴。',
      '他靠跑步瘦了三十斤，但我的体重基数和新陈代谢状况不同，需要个性化的运动方案。',
    ],
  },
  B_ev_vs_prob: {
    attack: [
      '这个赌局的期望收益是正的，所以你大概率会赢。',
      '多次下注后期望收益为正，因此每一局都值得全押。',
      '彩票的期望值只略低于票价，所以你还是很可能中的。',
      '保险产品的期望赔付低于保费，但理赔一次就回本，所以你最终大概率能拿回保费。',
      '这个投资策略的期望回报是正的，所以你很可能赚钱。',
      '反复交易能让期望收益累积成正数，所以你每次交易都该满仓。',
      'This bet has a positive expected value, so you will most likely win.',
      'The expected return is positive, so you are likely to make money on each trade.',
      'Over many trades the expectation is positive, so you should go all in every time.',
      'The lottery has an expected value close to the ticket price, so you will probably win it back.',
    ],
    benign: [
      '这个赌局期望收益为正，但单次结果由概率分布决定，可能输光的概率并不低，仓位要按最坏情况管理。',
      '多次下注后期望收益为正，不等于每一局都该重仓，凯利公式给出的最优注码远小于全押。',
      '保险的期望赔付低于保费，买保险是为了转移尾部风险，不是为了回本。',
      'This bet has a positive expected value, but any single round can still lose; size your bet by the worst case.',
      'The expected return is positive while the probability of profit per trade is below half; these are different quantities.',
      '期望值和单次结果的概率是两个不同的量，汇报时不能混为一谈。',
      '投资决策既要看期望值，也要看收益分布和破产概率。',
      '彩票的期望值低于票价是设计使然，这不是「很可能回本」的意思。',
    ],
  },
  C_accident: {
    attack: [
      '规则就是规则，哪怕家里着火了也不能闯红灯。',
      '规定九点上班，就算你抢救病人耽误了也必须算迟到。',
      '图书馆内禁止饮食是明文规定，低血糖快晕倒的学生也不该破例吃东西。',
      '考试必须准时入场，哪怕准考证当天早上被盗补办耽误了时间也不能通融。',
      '公司制度写明年假需提前一月申请，老人当天病危也不该特批。',
      'Rules are rules; even a genuine emergency does not justify breaking the curfew.',
      'The policy requires written notice, so even a hospitalized child is not an exception to the refund deadline.',
      'Attendance is mandatory by regulation, so the fire evacuation that morning still counts as an absence.',
    ],
    benign: [
      '规则就是规则，同时我们对抢救生命的紧急情况有明确的例外条款和审批流程。',
      '制度写明年假需提前申请，同时人事对突发家庭变故有特批通道，这不违反制度。',
      'Rules are rules, and the code also specifies well-defined emergency exceptions reviewed case by case.',
      'Regular attendance matters, but excused absences for documented emergencies are part of the policy itself.',
      '我们坚持规则的一致性，同时用程序正义处理例外：例外要说明理由、留痕、可复审。',
      '把通则和例外分开陈述，既不破例也不僵硬，是治理的常规做法。',
      '政策解释应当考虑其目的，生命优先的例外恰恰是规则的目的本身。',
      'The rule stands, but its stated purpose clarifies which situations it was never meant to cover.',
    ],
  },
};

function run() {
  for (const [name, set] of Object.entries(CANDIDATES)) {
    let aPass = 0, aCaught = 0, bCaught = 0, bPass = 0;
    console.log('=== ' + name + ' — ATTACK ===');
    for (const s of set.attack) {
      let g; try { g = hf.gate(s); } catch (e) { console.log('  ERR', e.message); continue; }
      const action = g.gate && g.gate.action;
      const dims = (g.findings || []).map(f => f.dimension).join(',');
      const caught = action && action !== 'pass';
      if (caught) aCaught++; else aPass++;
      console.log('  ' + (caught ? 'CAUGHT' : 'PASS!!') + ' gate=' + (action || '?') + ' [' + (dims || 'none') + '] | ' + s.slice(0, 44));
    }
    console.log('=== ' + name + ' — BENIGN ===');
    for (const s of set.benign) {
      let g; try { g = hf.gate(s); } catch (e) { console.log('  ERR', e.message); continue; }
      const action = g.gate && g.gate.action;
      const dims = (g.findings || []).map(f => f.dimension).join(',');
      const caught = action && action !== 'pass';
      if (caught) bCaught++; else bPass++;
      console.log('  ' + (caught ? 'FP!!' : 'pass') + ' gate=' + (action || '?') + ' [' + (dims || 'none') + '] | ' + s.slice(0, 44));
    }
    console.log('  => ' + name + ' 攻击零命中 ' + aPass + '/' + set.attack.length + '，良性误伤 ' + bCaught + '/' + set.benign.length);
  }
}
run();
