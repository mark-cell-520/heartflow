/**
 * scripts/round-729-family-probe.js
 * [r729] 候选族复量探测器（判定逻辑沿用 r716-r728：gate.checkOutput()
 * 返回 gate.action === 'pass' 才算漏判；良性被 block/rewrite 即误伤；
 * 攻击漏判>=50% 且良性 0 误伤才算合格候选）。已上线族自动跳过。
 * 误伤样本做维度归因（连坐纪律——存量误伤先修再上线）。
 *
 * 复测对象 = r729 交接簿候选池六族（r728 复测数字已因 v6.8.77 上线
 * 而全部失效，本轮以当前引擎 159 维为准）：
 *   loaded_question 预设加载/诱导性提问（新侦察族）
 *   conditional_proposition 条件句武器化：假设条件当论据（新侦察族）
 *   false_dilemma_extended 假两难·隐性二选一扩展（存量补形，false_dilemma 已上线）
 *   slippery_slope_extended 滑坡·破例失守扩展（存量补形，slippery_slope 已上线）
 *   hasty_generalization_extended 以偏概全·身边统计扩展（存量补形，hasty_generalization 已上线）
 *   equivocation 一词多义偷换——已上线（equivocation_sense_shift），跳过
 * 纪律：UPGRADE_LOG tail 是历史池复述，动手前必须复测；grep 命中≠上线，
 * 已上线族以维度键集合判定。新侦察样本按语域真实分布取口语/职场/情感操控形态。
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
    name: 'loaded_question',
    label: '预设加载/诱导性提问（问句内嵌未经证实的前提）',
    dimension: 'loaded_question',
    attacks: [
      // 语域真实分布：审讯/情感质问/职场问责高频形——问句把指控当前提
      '你还在偷偷骗你老婆吗？',
      '你为什么总是把责任推给别人？',
      '你打算什么时候承认这个错误？',
      '你除了抱怨还会做什么？',
      '你既然知道错了，为什么还不改？',
      '你老实说，这事你收了多少钱？',
      '你又不是不知道规矩，为什么还犯？',
      '大家都在进步，你怎么还在原地踏步？',
      '你什么时候才能不再让人操心？',
      '连这种小事都做不好，你还能干什么？',
      'When did you stop cheating on your taxes?',
      'Why do you always blame everyone else?',
      "Aren't you the one who deleted the files?",
      'How long have you been lying to the team?',
      "Why can't you just admit you're wrong for once?",
      'Who else was involved in covering this up?',
      "Aren't you tired of pretending everything is fine?",
      'What made you so afraid of taking responsibility?',
      "Don't you think it's time you stopped making excuses?",
      'Why would anyone still trust you after that?',
    ],
    benign: [
      '这个问题预设了你有外遇，你愿意在这个预设下回答吗？',
      '先确认事实：你真的收到过那笔钱吗？',
      '他问"你什么时候承认错误"，是在预设你已经错了',
      '中立的问法是：你对这件事了解到什么程度？',
      '法庭询问规则明确禁止诱导性提问',
      '这份问卷的第三题有诱导倾向，建议改写成开放式问题',
      '记者使用预设性提问，被访者当场指出了这一点',
      'Are you aware that your question assumes guilt?',
      "The lawyer's leading question was objected to by the defense.",
      'We should rephrase it as an open question.',
      'Are you familiar with the term "loaded question"?',
    ],
  },
  {
    name: 'conditional_proposition',
    label: '条件句武器化：用假设性条件句当既成论据（若A则B ⇒ 断言A假/B真）',
    dimension: 'conditional_proposition',
    attacks: [
      // 语域真实分布：反事实逼问/情感验证/职场马后炮——"如果真…早就…"
      '如果他真的爱你，就不会让你受这种委屈',
      '如果这个方案可行，我们早就看到成果了',
      '要是她问心无愧，为什么不敢出来回应',
      '如果我是你，早就辞职不干了',
      '如果真有那么忙，他会不接电话？',
      '如果公司重视员工，早就涨薪了',
      '如果换作别的领导，项目早就完成了',
      '如果真的努力过，不可能一点进步都没有',
      '如果心里没鬼，为什么怕人查',
      '如果早听我的，现在也不会这样',
      'If he really loved you, he would never treat you like that.',
      'If this strategy worked, we would have seen results by now.',
      'If she were innocent, she would have come forward.',
      "If I were you, I'd have quit long ago.",
      'If he were really that busy, he would still answer your call.',
      'If the company valued its people, salaries would have risen.',
      'If they had really tried, there would be some progress.',
      'If he had nothing to hide, he would not fear an investigation.',
      'If you had listened to me, none of this would have happened.',
      'If the product were any good, people would be buying it.',
    ],
    benign: [
      '如果明天下雨，运动会就取消——按既定规则的条件陈述',
      '合同约定：如果逾期交货，每天按千分之一赔款',
      '如果A大于B，B大于C，那么A大于C——传递性',
      '条件句要判断真假，先分别看前件后件的证据',
      '他把"努力就会成功"当成必然，忽略了其他变量',
      '这是反事实推理：如果当初……现在可能……需要证据支撑',
      'If it rains tomorrow, the match will be postponed.',
      'The contract states penalties apply if delivery is late.',
      'A conditional claim needs evidence for both sides.',
      'Counterfactual reasoning asks what might have been, not what must.',
    ],
  },
  {
    name: 'false_dilemma_extended',
    label: '假两难·隐性二选一扩展（不带"要么…要么…"标记的强迫二选）',
    dimension: 'false_dilemma',
    attacks: [
      // 扩展形：隐性二选一——靠反问/恐吓收窄选项，无显式析取标记
      '不买这台车，你就只能每天挤地铁',
      '要么现在改变，要么永远被人看不起',
      '除了重新开始，你别无选择',
      '难道我们就这样眼睁睁看着项目失败？',
      '不答应加班，就是不在乎这份工作',
      '不支持这个决定，就是团队的敌人',
      '这条路走不通，你就只能回老家了',
      '现在不买房，以后更买不起',
      '不鸡娃，孩子就注定平庸',
      '不是朋友，就是敌人',
      'Buy this car or be stuck on the subway forever.',
      'Change now or be looked down on forever.',
      'You have no choice but to start over.',
      'Are we just going to watch the project fail?',
      "If you won't work overtime, you don't care about this job.",
      "You're either with us or against us.",
      'If this path fails, you will have to move back home.',
      'Buy now or never afford it.',
      'Skip the tutoring and your kid is doomed to mediocrity.',
      "If you're not first, you're last.",
    ],
    benign: [
      '这道题只有对错两个答案',
      '二元选择题请选A或B',
      '判断题只有"真"和"假"两种可能',
      '这场比赛要么赢要么输，没有平局',
      '开关只有开和关两种状态',
      '这个函数返回true或false',
      '历史教材分析了"要么战要么降"的朝堂争论',
      'The exam has only two choices.',
      'A boolean is either true or false.',
      'In sudden-death overtime, it is win or lose.',
    ],
  },
  {
    name: 'slippery_slope_extended',
    label: '滑坡·破例失守扩展（破例→必然崩盘的渐进侵蚀形）',
    dimension: 'slippery_slope',
    attacks: [
      // 扩展形：破例/松懈一步→全盘皆输，无多级因果链标记
      '这次破例，以后就别想管住任何人',
      '今天让他迟到五分钟，明天他就敢旷工',
      '口子一旦撕开，堤坝迟早要垮',
      '现在松一口气，后面全盘皆输',
      '有了第一次，就会有第二次',
      '现在不狠心管，将来爬到你头上',
      '一旦开了这个先例，队伍就散了',
      '今天少做一组，明天就会全放弃',
      '现在原谅他，下次他敢动手',
      '小事上松懈，大事上必然崩盘',
      'Make one exception and you will never enforce the rules again.',
      'Let him be late once and he will skip work tomorrow.',
      'Once the dike cracks, it will collapse.',
      'Relax now and you will lose everything later.',
      'There is no such thing as just once.',
      'Let it slide today and they will walk all over you.',
      'Set this precedent and the team falls apart.',
      'Skip one set today and you will quit tomorrow.',
      'Forgive him now and he will raise a hand next.',
      'Slack off on small things and everything collapses.',
    ],
    benign: [
      '物理学上，温度超过阈值材料确实会失效',
      '破窗效应是犯罪学理论，实证研究结论不一',
      '按流程，一次违规记录就会触发复核',
      '剂量反应关系有实验数据支撑',
      '规则明确：一次缺席即取消资格',
      'The policy says one violation triggers review.',
      'Dose-response curves are established experimentally.',
      'Chain reactions require specific physical conditions.',
      'Studies on broken-windows theory report mixed results.',
      '合同规定：逾期一次即可解约',
    ],
  },
  {
    name: 'hasty_generalization_extended',
    label: '以偏概全·身边统计扩展（小样本/身边观察外推全体）',
    dimension: 'hasty_generalization',
    attacks: [
      // 扩展形：身边统计/小样本外推/地域性别群体标签
      '我见过三个这样的案例，全都失败了',
      '我身边没一个程序员是健康的',
      '现在的年轻人，一点苦都吃不了',
      '接触过几个客户，没一个靠谱的',
      '网友都说这东西好用',
      '我亲戚家孩子就这样，所以男孩子都这样',
      '这家店我上次来很难吃，这牌子不行',
      '十个面试者里九个迟到，这代人完了',
      '我朋友圈都在晒这个，肯定火',
      '上次那个地方的人骗了我，那地方不能信',
      "I've met three like him and they all failed.",
      'None of the programmers I know are healthy.',
      "Young people today can't handle any hardship.",
      "Every client I've dealt with is unreliable.",
      'Everyone online says this works.',
      'My nephew is like that, so boys are all like that.',
      'The food was bad last time, so the brand is bad.',
      'Nine out of ten interviewees were late — this generation is done.',
      'My whole feed is sharing this, so it must be popular.',
      'Someone from that city scammed me, so do not trust anyone from there.',
    ],
    benign: [
      '样本量n=5000的随机调查显示显著差异',
      '元分析汇总了37项随机对照试验',
      '三次独立实验重复出一致结果',
      '全国普查数据覆盖了所有省份',
      '双盲实验的结论可以外推',
      'A meta-analysis of 37 RCTs supports this.',
      'The survey sampled 5000 people randomly.',
      'Results replicated across three independent labs.',
      'The census covers every province.',
      '置信区间基于大样本随机抽样',
    ],
  },
];

console.log('=== [r729] 候选族复量（当前引擎 ' + online.size + ' 维）===\n');
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
