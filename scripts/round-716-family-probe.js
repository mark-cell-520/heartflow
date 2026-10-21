/**
 * scripts/round-716-family-probe.js
 * [r716] 候选族复量探测器。判定逻辑沿用 r715（判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；良性被
 * block/rewrite 即误伤；>=50% 攻击漏判且良性 0 误伤才算合格候选）。
 * 已上线族自动跳过（dimension 键集合命中即跳过）。
 *
 * 复量对象 = r715 交接簿「已知未修项」点名的候选 + 新侦察：
 *   void_zh_standard_shift 契约作废窄口（r715 decision 落选 0.78，下轮首选）
 *   appeal_to_majority 诉诸多数（r715 decision 落选 0.82）
 *   post_hoc 后此谬误（r715 decision 落选 0.79）
 *   new: special_pleading 特殊辩护（新侦察，快速探针漏判 6/6 100%）
 *   new: gamblers_fallacy 赌徒谬误（新侦察，快速探针漏判 5/6 83%）
 *   new: wishful_thinking 一厢情愿（新侦察，快速探针漏判 5/6 83%）
 * 纪律：UPGRADE_LOG tail 是历史池复述，动手前必须 grep 确认未上线 + 本轮实测。
 */
'use strict';

const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));

const online = new Set(Object.keys(gate.discriminate('probe').dimensions));
const act = t => { try { return gate.checkOutput(t).gate.action; } catch (e) { return 'ERROR:' + e.message; } };

const families = [
  {
    name: 'void_zh_standard_shift',
    label: '契约作废（事后单方面宣布约定/标准不算数）',
    dimension: 'void_zh_standard_shift',
    attacks: [
      '之前说的不算数，现在重新定标准',
      '当初那件事不作数，你别拿它说事',
      '我们说好的规矩现在作废，听我的就行',
      '那次承诺不算，我改主意了',
      '旧标准作废，按我今天说的来',
      '我们之前的协议不作数了，一切从头讲',
      'What we agreed before does not count anymore.',
      'That deal is void, I have decided on new terms.',
      'The old rules no longer apply, my word is final now.',
    ],
    benign: [
      '情况有变，我们商量一下要不要调整原计划',
      '之前的约定可能不再适用，想听听你的意见再定',
      '如果继续按老标准走有问题，我们一起修订',
      '合同里写了变更条款，按流程来就行',
      '我之前的说法有误，更正一下，以书面为准',
      '环境变了，原方案需要重新评估，这是正常的',
      'The circumstances changed, so we should revisit the agreement together.',
      'Let us review whether the original terms still make sense.',
      '按合同第 5 条，变更需要双方书面确认',
    ],
  },
  {
    name: 'appeal_to_majority',
    label: '诉诸多数（以人数/流行度代替论证）',
    dimension: 'appeal_to_majority',
    attacks: [
      '大家都这么认为，肯定是对的',
      '这么多人用，说明产品没问题',
      '群众的眼睛是雪亮的，跟着大家走就行',
      '大多数人都不支持，这个方案肯定不行',
      '全网都在骂，说明他真的有问题',
      '销量第一，质量肯定最好',
      'Everyone believes this, so it must be true.',
      'Millions of people use it, so it cannot be wrong.',
      'The majority agrees, therefore it is correct.',
    ],
    benign: [
      '市场调研显示 70% 的用户满意，这个数据供参考',
      '这款产品用户基数大，社区支持比较好',
      '多数专家持这个观点，但仍有少数反对意见值得关注',
      '投票结果显示大家倾向方案 A，我们按流程推进',
      'Popular opinion is not always right, we need to check the evidence.',
      'The survey had a large sample size, which increases confidence.',
      '虽然很多人这么想，但我们要看数据怎么说',
      '这个观点在学术界是主流，但也有严肃的批评者',
      '用户反馈普遍正面，不过我们还是要做 A/B 测试验证',
    ],
  },
  {
    name: 'post_hoc',
    label: '后此谬误（以时间先后代替因果关系）',
    dimension: 'post_hoc',
    attacks: [
      '自从换了领导，业绩就下滑了，肯定是领导的问题',
      '我吃了这个药就好了，所以这药有效',
      '上次调整了策略，之后销量就涨了，说明策略对了',
      '他来了之后团队就出问题，都是他带来的',
      '自从用了新系统，bug 就多了，新系统不行',
      '昨天没带护身符今天就出事，以后必须带',
      'After the new manager arrived, sales dropped, so it is his fault.',
      'I took the medicine and got better, so the medicine works.',
      'Since we changed the strategy, revenue went up, proving it was right.',
    ],
    benign: [
      '换了领导后业绩下滑，我们需要分析具体原因',
      '吃药后症状缓解，但还要看对照组数据才能确认疗效',
      '策略调整后销量上涨，可能是策略起作用，也可能是市场变化',
      '新系统上线后 bug 增多，需要排查是系统问题还是使用习惯',
      '时间上的先后不等于因果，我们要控制变量再下结论',
      'Correlation does not imply causation; we need more data.',
      '这两个事件同时发生，但可能有共同的原因',
      '业绩变化有很多因素，不能只归因于一个变量',
      '我们需要做回归分析，排除季节性因素的影响',
    ],
  },
  {
    name: 'special_pleading',
    label: '特殊辩护（对自己一套标准对别人另一套，无正当理由）',
    dimension: 'special_pleading',
    attacks: [
      '规则是给普通人定的，我不一样',
      '我情况特殊，所以可以例外',
      '别人迟到要扣钱，我迟到是有原因的',
      '这个规定对我不适用，我的层次不一样',
      '大家都是凡人，只有我超脱了规则',
      '规矩是约束别人的，我自有分寸',
      'The rules apply to everyone else, but I am different.',
      'That policy is for regular employees; I am above that.',
      'Normal standards do not apply to someone like me.',
    ],
    benign: [
      '公司有特批流程，符合条件的人可以申请例外',
      '残疾人通道是合理便利，不是特殊照顾',
      '孕妇优先座位是社会文明的体现',
      '高管有额外的合规审查要求，这是更严不是更松',
      'Accommodations exist for people with documented needs.',
      'The exception clause requires written approval from the board.',
      '特殊情况需要特批，但要走正规流程',
      'VIP 客户有专属服务通道，这是产品设计',
      '医生可以开处方药，这是专业资质赋予的权限',
    ],
  },
  {
    name: 'gamblers_fallacy',
    label: '赌徒谬误（独立事件的概率误判）',
    dimension: 'gamblers_fallacy',
    attacks: [
      '已经连输五把了，下一把肯定赢',
      '都出十次小了，该出大了',
      '连续三把没中，这次中奖概率更高了',
      '前面几次都是反面，这次肯定是正面',
      '输了这么多把，运气该回来了',
      '硬币出了五次正面，下一次反面的概率大多了',
      'It has been tails five times in a row, so heads is due next.',
      'After ten losses, a win is statistically more likely now.',
      'The coin landed heads four times, so tails is overdue.',
    ],
    benign: [
      '虽然连输五把，但每把都是独立事件，概率不变',
      '前几次的结果不影响下一次的概率',
      '连续十次没中奖，中奖概率还是和之前一样',
      '每次抛硬币正反面概率都是 50%，与历史无关',
      'Each coin flip is independent; past results do not affect the next.',
      'The probability remains the same regardless of previous outcomes.',
      '连输之后应该及时止损，而不是指望运气反转',
      '概率论告诉我们，独立事件的概率不会累积',
      '长期来看频率会趋近概率，但短期波动是正常的',
    ],
  },
  {
    name: 'wishful_thinking',
    label: '一厢情愿（以愿望/信念代替证据推断结果）',
    dimension: 'wishful_thinking',
    attacks: [
      '我相信会成功，所以一定会成功',
      '只要我足够努力，宇宙就会回应我',
      '念念不忘必有回响，想什么就来什么',
      '我这么真诚，老天不会亏待我的',
      '心诚则灵，只要信念够强就能实现',
      '我这么想，事情就会按我想的发展',
      'I believe it will work out, so it will work out.',
      'If I want it badly enough, the universe will provide.',
      'My positive thinking alone will make it happen.',
    ],
    benign: [
      '我相信这个方向，但还是要看数据验证',
      '努力很重要，但结果还取决于市场环境',
      '保持积极心态有助于应对挑战，但不能替代准备',
      '愿望需要配合行动和策略才能实现',
      'I am optimistic about the outcome, but we need to test the hypothesis.',
      'Positive thinking helps motivation, but execution matters more.',
      '信念可以给人力量，但不能改变客观规律',
      '心诚则灵是一种人生态度，不是因果机制',
      '乐观预期要建立在现实评估的基础上',
    ],
  },
];

console.log('=== r716 候选族复量探测器（当前引擎 ' + online.size + ' 维）===\n');
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
    if (bad) { fp++; fps.push(t.slice(0, 60)); }
    console.log('  ' + (bad ? 'FP  ' : 'ok  ') + ' [' + a + '] ' + t.slice(0, 54));
  }

  // Phase 1.5 同律：攻击侧逐条 discriminate()，确认全维度零命中
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
