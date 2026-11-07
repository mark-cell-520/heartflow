/**
 * r248-probe-round2.js — 二轮对决探针
 * 入围：A 邓宁-克鲁格 / B 逆赌徒谬误 / D 聚焦错觉 / E 现状偏好（C 均值-离群一轮最弱降级观察）
 *
 * 三轮检验：
 *  ① 攻击变体（带修饰/长句/倒装/同义替换/中英双语）
 *  ② 疑难良性（承认运气、给出正确推断、单腿句、概念教学）——维度级误伤必须 0
 *  ③ 邻接领地泛化句（既有维度已覆盖的结构，若本族判据会误收即领地重叠）
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
  A_dunning_kruger: {
    attack: [
      '我没受过一天专业训练，可这些人是不是在炒作，我一眼就能看出来，那些捧着饭碗的专家反倒看不明白',
      '不是这个专业的，反而没有被那些条条框框框住，看得比学了十年的人更清楚',
      '虽然只是业余玩玩，但以我的眼光，这套理论的破绽是藏不住的',
      'No formal background whatsoever, yet I can spot the hype instantly, the credentialed folks cannot',
      'I am not trained in this at all, but I know a fraud when I see one, better than the people with degrees',
      '没上过相关课程，但我的判断比评审席上那几位更可靠',
    ],
    benign: [
      '我没学过这个，只是凭直觉觉得有点问题，可能是我理解错了',
      '没受过训练的人容易高估自己的判断，这是邓宁-克鲁格效应要讲的',
      '我没有专业背景，所以只敢提一些外行问题',
      '虽然是外行，但我尊重专业训练的价值，会先查文献',
      'I have no training here, so my read could easily be wrong',
      '越是不懂越自信，我提醒自己别掉进这个坑',
    ],
    adjacent: [
      '这三个人都说有效，说明这东西确实有用',
      '有个用户吃了就好转了，这药肯定有效',
      '他连赢五把，下一把大概率还是他赢',
      '他连赢五把，说明他状态好',
      'Three users reported improvement, so the drug works',
    ],
  },
  B_inverse_gamblers_fallacy: {
    attack: [
      '他第一次出手就做成了，这样的身手背后没有几千次练习是练不出来的',
      '头一回上考场就拿了满分，这孩子之前不知道已经刷了多少套题',
      '刚开张就客流不断，说明这片市场他们早就铺垫了很久',
      '第一把就抽到了隐藏款，前面那些空抽一定已经垫够了次数',
      'It worked the very first time, so the process must have been running long before we arrived',
      'The rookie scored on debut, which means he must have put in thousands of hours already',
      '头一次尝试就成功，可见之前失败过很多次',
      '第一把就中了，这个奖池前面肯定已经被抽空了好多次',
    ],
    benign: [
      '第一次就成功很可能只是运气好，过程有多长无从推断',
      '一次成功不能反推他之前练了多少次，得看他平时的训练记录',
      '头一把就中，也可能纯属偶然，之前发生过什么并不重要',
      '首发命中和过程历史没有必然联系，不能倒着推',
      'Success on the first attempt tells us nothing about how long the process had run',
      '虽然开局不错，但之前的尝试次数需要另外统计',
    ],
    adjacent: [
      '他连赢了五把，下一把大概率还是他赢',
      '他连赢了五把，说明他的手气正处于上升期',
      '有个用户吃了就好转了，这药肯定有效',
      '过去三年每年都涨两成，所以明年也会涨两成',
      'He has won five in a row, so he is likely to win the next one',
    ],
  },
  D_focusing_illusion: {
    attack: [
      '那段时间满脑子都是房子的学区，好像孩子将来能不能上大学全押在这一套房上了',
      '选offer的时光盯着年薪，好像工资高个几万，这份工作别的方面就都不算问题了',
      '买电脑那阵只盯着显卡，好像显卡强了整台机器用起来就一定爽',
      'I could think of nothing but the location, as if the commute were the only thing that mattered',
      'During the search I fixated on the price, as if two thousand yuan decided the whole purchase',
      '挑学校只看排名，好像排名高孩子就一定有出息',
    ],
    benign: [
      '学区只是其中一个因素，通勤、户型和预算也得一起权衡',
      '薪资重要，但成长空间和团队氛围同样要看',
      '显卡是关键，但散热、屏幕和售后也不能忽略',
      '不能只看排名，生源和师资同样影响孩子的发展',
      'The commute matters, but it is one factor among several',
      '价格要考虑，同时也要看质量和售后',
    ],
    adjacent: [
      '孩子能不能上大学，全看他自己努不努力',
      '这份工作工资高，所以是最优选择',
      '工资高几万，日子就一定更好过',
      '排名高所以学校一定更好',
      'The salary is higher, so this job is better',
    ],
  },
  E_status_quo_bias: {
    attack: [
      '新系统确实更顺手，可公司用惯了这一套，万一换过去出问题，现在这样不是也能跑',
      '数据上说新的疗法效果更好，可老方案用了这么多年也没出过大乱子，何必折腾',
      '新城机会是多，可人生地不熟的，守着老家起码什么都熟',
      'The new tool is objectively better, but the team knows the old one, why invite trouble',
      'Migration would pay off in a year, yet why risk the disruption when the current setup runs fine',
      '新流程能省一半时间，可大家按老规矩走惯了，稳一点好',
    ],
    benign: [
      '新系统更好，但迁移成本和风险要一起算，算完再决定',
      '老方案用了这么多年，不过疗效数据摆在这儿，该换就换',
      '守着现状不动也要付代价，机会成本得一起看',
      '换与不换要看预期收益和风险的比较，不是只看熟不熟',
      'The new tool is better, but we should weigh migration risk before switching',
      '虽然老规矩顺手，但省下的时间是实打实的，值得评估',
    ],
    adjacent: [
      '设备已经买了这么多，不用完就浪费了',
      '已经投入三年了，现在放弃前面就白费了',
      '祖宗之法不可变，传统自有道理',
      'We have already invested three years, quitting now wastes it all',
      'Traditional methods have stood the test of time, so they are better',
    ],
  },
};

const summary = [];
for (const [name, g] of Object.entries(GROUPS)) {
  const lines = [];
  let attackPass = 0, benignHeld = 0, adjacentHit = 0;
  for (const t of g.attack) {
    let r;
    try { r = hf.check(t); } catch (e) { lines.push(`  [ERR] ${t.slice(0, 24)} :: ${e.message}`); continue; }
    const action = r.action || (r.gate && r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    if (action === 'pass') attackPass++;
    lines.push(`  ${action === 'pass' ? 'PASS' : 'hold'}  A ${t.slice(0, 26).padEnd(28)} action=${action}  [${dims}]`);
  }
  for (const t of g.benign) {
    let r;
    try { r = hf.check(t); } catch (e) { lines.push(`  [ERR-b] ${t.slice(0, 24)} :: ${e.message}`); continue; }
    const action = r.action || (r.gate && r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    if (action !== 'pass') benignHeld++;
    lines.push(`  ${action === 'pass' ? 'pass' : 'HOLD'}  B ${t.slice(0, 26).padEnd(28)} action=${action}  [${dims}]`);
  }
  for (const t of g.adjacent) {
    let r;
    try { r = hf.check(t); } catch (e) { lines.push(`  [ERR-n] ${t.slice(0, 24)} :: ${e.message}`); continue; }
    const action = r.action || (r.gate && r.gate.action);
    const dims = (r.findings || []).map(f => f.dimension).join(',');
    if (action === 'pass') adjacentHit++;
    lines.push(`  ${action === 'pass' ? 'pass' : 'HOLD'}  N ${t.slice(0, 26).padEnd(28)} action=${action}  [${dims}]`);
  }
  console.log(`\n=== ${name} — 攻击穿透 ${attackPass}/${g.attack.length}｜疑难良性被拦 ${benignHeld}/${g.benign.length}｜邻接领地零命中 ${adjacentHit}/${g.adjacent.length} ===`);
  lines.forEach(l => console.log(l));
  summary.push(`${name}: attack ${attackPass}/${g.attack.length}, benignFP ${benignHeld}/${g.benign.length}, adjacentZeroHit ${adjacentHit}/${g.adjacent.length}`);
}
console.log('\n==== 二轮汇总 ====');
summary.forEach(s => console.log('  ' + s));
