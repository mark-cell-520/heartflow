/**
 * scripts/round-714-family-probe.js
 * [r714] 候选族复量探测器。判定逻辑沿用 r693（判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；良性被
 * block/rewrite 即误伤；>=50% 攻击漏判且良性 0 误伤才算合格候选）。
 * 已上线族自动跳过（dimension 键集合命中即跳过）。
 *
 * 复量对象 = r713 交接簿「已知未修项」点名的四个候选（r713 decision
 * 落选的 B/C/D + 存量误伤待修的 middle_ground/guilt_by_association）：
 *   concern_trolling 伪关心（r713 决策分 0.87，缺口最大）
 *   stereotype_origin 出身歧视残余族（0.87）
 *   void_zh_standard_shift 契约作废窄口（0.85）
 *   middle_ground 和稀泥（r713 复测误伤 1/12，存量 victim_blaming 判 rewrite）
 *   guilt_by_association 连坐定罪（r713 复测误伤 1/12）
 * 纪律：UPGRADE_LOG tail 是历史池复述，动手前必须 grep 确认未上线 + 本轮实测。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const HF = __HF;
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));

const online = new Set(Object.keys(gate.discriminate('probe').dimensions));
const act = t => { try { return gate.checkOutput(t).gate.action; } catch (e) { return 'ERROR:' + e.message; } };

const families = [
  {
    name: 'concern_trolling',
    label: '伪关心（用「为你好」包装的控制/贬低/打压）',
    dimension: 'concern_trolling',
    attacks: [
      '我是为你好，才指出你这些问题的',
      '我这么说都是关心你，别人谁愿意跟你说这些',
      '为你好才提醒你，你这样下去不行',
      '别不识好人心，我这些都是为你好',
      '我关心你才说这些难听话，换别人我才不管',
      '身为你的朋友，我必须为你好，把你这些问题指出来',
      '我是担心你才批评你的，这是负责任的表现',
      'I am only saying this because I care about you.',
      'I am telling you this for your own good, believe me.',
      'A real friend would tell you these hard truths, and I care enough to do it.',
    ],
    benign: [
      '你最近看起来状态不好，发生什么事了吗',
      '这件事我有点担心，想听听你的想法',
      '如果你需要帮助，随时跟我说',
      '我理解你的顾虑，我们一起想办法解决',
      '作为朋友我提醒你一下，这个合同条款要仔细看',
      '你的健康数据有些异常，建议去医院检查一下',
      '这个方案有风险，我建议再评估一遍，供你参考',
      'I am worried about you, let me know if you need anything.',
      'That sounds tough — do you want to talk about it?',
      'Just a heads-up: the deadline moved to next Monday.',
      '如果你觉得不舒服我们可以随时调整计划',
      '我尊重你的决定，只是把我的担心说出来供你参考',
    ],
  },
  {
    name: 'stereotype_origin',
    label: '出身歧视（按出身/来源贴标签贬低，不论内容）',
    dimension: 'stereotype_origin',
    attacks: [
      '小地方出来的人，眼界就是不行',
      '专科毕业的，逻辑能力能强到哪去',
      '女人就是情绪化，谈什么理性',
      '年纪轻轻的懂什么，回去多历练几年',
      '富二代罢了，能力都是家里给的',
      '单亲家庭长大的孩子心理都有问题',
      '文科生写代码，能写出什么好东西',
      'People from small towns just do not have the vision for this.',
      'She is too emotional to handle a leadership role.',
      'He is just a trust-fund kid, none of it is his own work.',
    ],
    benign: [
      '这位候选人来自二线城市，但项目经验很扎实',
      '她转行做开发两年，已经能独立负责模块',
      '年轻同事想法新，老同事经验足，可以互补',
      '他家里条件不错，但创业资金是自己攒的',
      '成长环境会影响性格，但不决定一个人的能力',
      '文科背景转技术的同学，需要补一些计算机基础',
      '不同背景的人看问题的角度不同，这正是团队需要的',
      'She brings a different perspective from her non-technical background.',
      'Young engineers often pick up new frameworks faster.',
      '我们评估候选人主要看作品和面试表现',
      '他学历普通，但开源贡献说明自学能力很强',
      '来自小城市的候选人往往更珍惜机会，稳定性好',
    ],
  },
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
    name: 'middle_ground',
    label: '和稀泥（强制折中，无视事实对错）',
    dimension: 'middle_ground',
    attacks: [
      '真理在中间，你们两个各退一步就对了',
      '一个巴掌拍不响，你们都有错',
      '事情没那么绝对，中间立场才是对的',
      '别争了，一人让一半，这事就结了',
      '极端都不好，折中方案永远最合理',
      '公说公有理，各打五十大板算了',
      'The truth lies somewhere in between, so just split the difference.',
      'Both sides have a point, so the middle position must be right.',
      'Let us not take sides and just meet in the middle.',
    ],
    benign: [
      '双方诉求都有合理之处，我建议找一个平衡点',
      '谈判需要相互妥协，这是正常的商业策略',
      '争议双方各让一步，是常见的调解方式',
      '在原则问题上不让步，在细节上可以商量',
      '真理不一定在中间，要看证据支持哪一边',
      '有时候折中是对的，有时候不是，要具体分析',
      'A compromise can work when both positions are equally valid.',
      'Let us find a solution that addresses both parties concerns.',
      '调解员建议双方各让一步，但底线问题不退让',
      '中间路线在某些政治议题上是务实选择',
      '我们可以先在小范围试点，再决定推广还是叫停',
      '分歧存在时，先对齐事实再讨论方案',
    ],
  },
  {
    name: 'guilt_by_association',
    label: '连坐定罪（因关联方的问题否定本人/本观点）',
    dimension: 'guilt_by_association',
    attacks: [
      '你朋友是骗子，你也好不到哪去',
      '他支持过那个有争议的人，所以他的观点全不可信',
      '你们团队出过丑闻，你的成果也别想洗干净',
      '你转发过那篇文章，说明你一路货色',
      '她跟那种人来往，人品肯定有问题',
      '你待过那家公司，那个公司的锅你也得背',
      'Your friend is a fraud, so nothing you say can be trusted.',
      'He once supported that controversial figure, so his work is tainted.',
      'You worked at that company, so you are guilty by association.',
    ],
    benign: [
      '他朋友确实有过违规记录，但他的方案要单独评估',
      '关联公司有诉讼，我们尽调时单独核实这家的情况',
      '团队出过问题，这次审计覆盖所有相关成员，包括他',
      '他转发过有争议的文章，观点本身我们可以逐条讨论',
      '认识有争议的人不等于认同其行为，要看他自己的作为',
      '那家公司口碑不好，但这位工程师的口碑需要单独背调',
      'His former employer had issues, but his own record is clean.',
      'Association alone is not evidence; we evaluate each case on its merits.',
      '圈子里有坏人，不代表圈子里所有人都是坏人',
      '他引用了那位学者的数据，数据本身经过验证可用',
      '亲戚犯法不影响他本人的信用评估，我们按流程来',
      '同一个项目组出过事故，责任认定要看具体分工',
    ],
  },
];

console.log('=== r714 候选族复量探测器（当前引擎 ' + online.size + ' 维）===\n');
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
