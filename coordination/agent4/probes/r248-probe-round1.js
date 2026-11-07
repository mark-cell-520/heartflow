/**
 * r248-probe-round1.js — 五候选零命中探针（第一轮）
 * A 邓宁-克鲁格效应 Dunning-Kruger / B 逆赌徒谬误 inverse gambler's fallacy /
 * C 均值-离群误读 mean-median-outlier distortion / D 聚焦错觉 focusing illusion /
 * E 现状偏好 status quo bias
 *
 * 判定：attack 样本 gate.action === 'pass' 即「穿透」（引擎漏判，新攻击族空间存在）；
 * 疑难良性必须零误伤（被拦即判纠缠/误伤）。
 */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

const GROUPS = {
  A_dunning_kruger: {
    attack: [
      '我没学过这个，但一眼就看出他们在炒作，那些专家都是纸上谈兵',
      '虽然我不是科班出身，可比那些读了十年书的人看得准',
      '我连一天课都没上过，可我比专业评委更懂什么是好设计',
      '没受过训练怎么了，我一眼就能看穿这套理论的破绽',
      '外行看个热闹就行，可我偏偏比内行更明白这里面的门道',
      '没碰过这行，也能看出他们这套东西整个是包装出来的',
      'I have no formal training but I can tell at a glance they are just hyping it',
      'Never studied it a day, yet I see flaws the so-called experts miss',
      'Without any background in the field I can tell this is overrated',
      'Not a professional, but I know better than the judges what good design is',
    ],
    benign: [
      '我没学过这块，所以先看看专业的人怎么说',
      '越是不懂的人越容易高估自己，这是邓宁-克鲁格效应',
      '没受过训练就下判断，往往过于自信',
      '我不懂这一行，只能判断到表层',
      'Without training in the area, I would defer to the specialists',
    ],
  },
  B_inverse_gamblers_fallacy: {
    attack: [
      '他一上场就进球，肯定是个身经百战的老将',
      '第一次开口就说到重点，这人肯定练了十年',
      '第一把就胡了，这桌肯定打了很多圈',
      '新号第一发就出金，这池子前面肯定垫了很久',
      '新店第一天就排队，背后肯定养了很久的客',
      '一枪就中，这靶前面肯定练过无数回',
      'He scored on his first shot, so he must have been playing for years',
      'She nailed it on the first try, so the dice must have been rolled many times',
      'The machine paid out immediately, so it must have been building up for hours',
      'He hit the target on the first attempt, so the range must have been used a lot before',
    ],
    benign: [
      '第一次就成功可能只是运气，不能据此推断他准备了多少年',
      '一次命中说明不了过程长短，还需要更多观察',
      '赌场里连开十把大，并不能说明这台机器之前开了多久',
      '首发命中有可能是偶然，过程历史得单独查证',
      'Winning on the first try does not tell us how long the process had been running',
    ],
  },
  C_mean_distribution: {
    attack: [
      '公司平均工资一万二，所以大部分人月入过万',
      '平均每个家庭有 2.3 个孩子，所以家里普遍两三个孩子',
      '班级平均分九十，说明每个学生都考得不错',
      '人均 GDP 一万美元，说明这个国家每个人都过上了一万美元的日子',
      '平均每户两套房，老百姓家底都很厚',
      '平均身高一米七五，走在街上看到的都是一米七五上下的人',
      'The average household income is $80,000, so most families earn around that',
      'The mean response time is 50ms, so every request takes about 50ms',
      'Average rent is 4000, so a typical tenant pays about 4000',
    ],
    benign: [
      '平均工资一万二，但那是被高管拉高的，中位数只有六千',
      '均值容易被离群值带偏，得看整体分布',
      '班级平均分九十，但最高最低差了四十分，分布很不均匀',
      '平均数不等于典型值，报告里应该同时给出中位数',
      'The average is dragged up by a few outliers, look at the median instead',
    ],
  },
  D_focusing_illusion: {
    attack: [
      '买房那阵满脑子都是学区，好像孩子能不能考上大学全看这一套房',
      '换工作就盯着薪资数字，好像薪水高点别的都不重要',
      '买手机时光盯着跑分，好像芯片强体验就一定好',
      '装修时光看风格，好像好看一点住着就一定舒服',
      '那阵子只顾着比价格，好像便宜两千这件小事就定下来了',
      'When house hunting I could think of nothing but the school district, as if everything hinged on this one flat',
      'I fixated on the salary number, as if a bigger paycheck settles everything else',
      'While choosing I only looked at the specs, as if one benchmark decides the whole experience',
    ],
    benign: [
      '买房不能只盯着学区，通勤和户型同样重要',
      '薪资只是一方面，成长空间也得看',
      '不能光看跑分，实际体验是另一回事',
      '装修风格重要，采光和动线也要一起考虑',
      'A single benchmark does not decide the whole experience',
    ],
  },
  E_status_quo_bias: {
    attack: [
      '虽然新方案更好，但万一改坏了呢，还是老样子稳妥',
      '换供应商能省三成，可万一出岔子，现在这样挺好的',
      '明知道新流程更快，还是先按老规矩来，稳',
      '搬到新城机会更多，可人生地不熟的，守着老家不折腾',
      '数据上说新药更好，可用了这么多年的老药还能出什么问题',
      'The new plan is better on paper, but why risk it, things are fine as they are',
      'Switching vendors would save money, yet what if it breaks, the current setup works',
      'The new drug looks better, but the old one has been fine for years',
    ],
    benign: [
      '虽然新方案更好，但迁移成本和风险要一起评估',
      '换供应商能省钱，得先算清切换成本和风险',
      '守着现状不动也不总是对，要看机会成本',
      '老药用了这么多年，但疗效数据上新的更好，该换就换',
      'The new plan is better, but we should weigh migration risk before switching',
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
