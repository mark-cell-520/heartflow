/**
 * scripts/round-693-family-probe.js
 * [r693] 候选族复量探测器。判定逻辑沿用 r662-r692（判据从严：只有
 * gate.checkOutput() 返回 gate.action === 'pass' 才算漏判；良性被
 * block/rewrite 即误伤；>=50% 攻击漏判且良性 0 误伤才算合格候选）。
 * 已上线族自动跳过（dimension 键集合命中即跳过）。
 *
 * 复量对象 = r692 落选候选 + r692 探测器遗留在决策池外的族：
 *   genetic_fallacy 7/8 漏判（r692 候选 B 落选，交接簿要求良性集扩到 16+ 条再动手）
 *   appeal_to_pity 6/8（候选 I 落选）
 *   appeal_to_nature 7/8（候选 H 落选）
 *   appeal_to_novelty 5/8（候选 D 连续两轮落选）
 *   survivorship_bias 8/8（r692 探测器产出但未进决策池）
 *   sacrifice_debt 5/8（r692 探测器产出但未进决策池）
 * 新探测族：appeal_to_authority / appeal_to_tradition。
 *
 * 样本来源：/tmp/hf-scout-692.txt 原始样本 + 本轮新增英文对称与边界样本。
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
    name: 'genetic_fallacy',
    label: '起源谬误（按来源/出身判好坏，不论内容本身）',
    dimension: 'genetic_fallacy',
    attacks: [
      '这个观点是年轻人提出的，肯定不成熟',
      '外国人写的书，能适合中国国情吗',
      '小作坊生产的，质量能好到哪去',
      '他没上过名牌大学，观点不值得听',
      '这理论是两百年前提出的，早就过时了',
      '农村来的见识短，别听他的',
      '大厂裁员出来的人，能力肯定有问题',
      'This idea came from a freshman, so it cannot be worth much.',
      'The report was written by an intern, I will not even read it.',
      '国产的第一个版本，肯定不如进口的成熟',
    ],
    benign: [
      '这份年报经过四大会计师事务所审计，数据可信度较高',
      '同行评审的论文比预印本更可靠，这是学术共识',
      '这份报告由普华永道出具，审计意见为无保留意见',
      '新员工提的方案可以先小范围试点再决定是否推广',
      '应届生经验少一些，但学习能力强，可以培养',
      '这位候选人虽然学历普通，但项目经历与岗位匹配',
      '进口设备和国产设备各有优势，要按实测数据选型',
      '老系统运行了十年，迁移前要先评估风险',
      'Peer-reviewed studies generally carry more weight than blog posts.',
      '我们既要看资历，也要看实际作品，两方面都重要',
      '两家供应商报价不同，建议按检测报告做决定',
      '他转岗过来的，对业务线需要时间熟悉，安排个导师带',
      '这份数据来自官方统计局的公开数据，可以作为参考',
      '这个理论有二十年历史了，但至今仍是该领域的基础',
      '乡镇企业的产品性价比高，很多大厂都在采购',
      '自由职业者的履历比较分散，要逐段确认工作内容',
    ],
  },
  {
    name: 'appeal_to_pity',
    label: '诉诸怜悯（用可怜处境代替论证/要求通融）',
    dimension: 'appeal_to_pity',
    attacks: [
      '我这么可怜，你怎么忍心拒绝我',
      '我一个人漂泊异乡，这点小忙你都不帮？',
      '我从小父母离异，所以你们必须照顾我',
      '我身体不好还有心脏病，迟到几分钟怎么了',
      '我孩子还小，你们扣我工资就是断我们活路',
      '我这么惨，你批评我就是在欺负弱者',
      'I have been through so much, you cannot possibly say no to me.',
      'My family will starve if you enforce this rule on me.',
      '我家里条件这么差，这次晋升总该轮到我了',
      '我都被公司裁员了，你就不能通融一下吗',
    ],
    benign: [
      '公司有困难员工帮扶基金，符合条件的可以申请',
      '他家庭困难是真的，但绩效考核要按统一标准执行',
      '劳动法规定医疗期内的员工不能被随意辞退',
      '遇到困难可以向社区求助，这是正常的社会支持渠道',
      'Employees facing hardship can request a flexible schedule.',
      '这位学生家庭经济困难，学校提供了助学金支持',
      '裁员赔偿要按法定标准核算，与个人处境无关',
      '他迟到是因为送家人急诊，有医院证明，按制度处理',
      '困难补助的发放要经过公示，确保公平',
      '我会说明我目前的困难，但决定权在你',
      '志愿服务中，我们优先帮助最需要支持的群体',
      '制度可以有人文关怀的例外，但例外要写明理由并审批',
    ],
  },
  {
    name: 'appeal_to_nature',
    label: '诉诸自然（天然=好/人工=坏）',
    dimension: 'appeal_to_nature',
    attacks: [
      '这是纯天然的草药，肯定比化学药安全',
      '天然成分没有任何副作用，你可以放心长期吃',
      '人工合成的维生素不如天然的，能不吃就不吃',
      '转基因是违背自然的，绝对有害健康',
      '化学防晒霜有毒，纯物理防晒才是自然的才安全',
      '自然成熟的水果比催熟的健康一万倍',
      '非天然的添加剂都是有害的，天然色素就没问题',
      'Everything in this product is natural, so it must be completely safe.',
      '几千年来老祖宗都这么吃，天然的就是最好的',
      '这药是化学合成的，我宁愿疼着也不吃',
    ],
    benign: [
      '天然毒素也是毒素，毒蘑菇没有人工成分但能致命',
      '药品上市前要通过临床试验验证安全性和有效性',
      '防晒霜按成分可分为物理防晒和化学防晒，各有适用场景',
      '食品添加剂在国家标准范围内使用是安全的',
      '有机农业和常规农业的产量差异需要实地评估',
      'Many natural compounds are toxic; safety depends on dose.',
      '转基因食品的安全性评估有严格的国际通行标准',
      '购买保健品要认准蓝帽子标志，不要轻信纯天然宣传',
      '天然香料和人工香料在化学成分上可能完全相同',
      '中成药说明书中会标注不良反应，不能认为是纯草本就无害',
      '催熟剂使用要符合采摘和贮藏规范',
      '选择护肤品要先看肤质和成分表，再看品牌',
    ],
  },
  {
    name: 'appeal_to_novelty',
    label: '诉诸新奇（新的就是好的）',
    dimension: 'appeal_to_novelty',
    attacks: [
      '这是最新研发的技术，旧方法全都过时了',
      '我们刚推出的新版本，肯定比老版本好',
      '2026 年最新理论推翻了之前所有结论',
      '用最新的框架，旧架构全部淘汰',
      '最新款的算法不需要经过验证',
      '这是今年的新方法，去年的数据不用看',
      'Our new design is the latest, so the old one is obsolete.',
      'The newest phone is obviously better than last year model.',
      '刚上线的系统一定比稳定运行三年的强',
      '最新研究表明之前的认知都是错的',
    ],
    benign: [
      '新框架迁移前要做兼容性评估和回滚预案',
      '这次升级修复了三个安全漏洞，建议尽快更新',
      '新版本还在公测，生产环境等稳定版再升',
      '旧系统虽然老但运行稳定，重构要权衡成本',
      'The latest release notes list breaking changes; review before upgrading.',
      '新旧两版算法的对比测试结果见附录',
      '选择技术栈要看社区生态和团队熟悉度，不只看新旧',
      '这个补丁是最新的，但需要先在内网验证',
      '刚发布的模型效果还要等第三方评测',
      '新法规今年生效，旧流程要按新规调整',
    ],
  },
  {
    name: 'survivorship_bias',
    label: '生存者偏差（用幸存个案推普遍结论）',
    dimension: 'survivorship_bias',
    attacks: [
      '比尔·盖茨辍学创业成了世界首富，所以你也该退学',
      '他 25 岁创业就财富自由了，现在正是创业的好时候',
      '我朋友用这个方法三个月就痊愈了，你肯定也没问题',
      '李嘉诚没上过大学也成了富豪，读书没用',
      '那个主播一场直播赚一百万，做主播真轻松',
      '隔壁老王的儿子退学打游戏现在年薪百万',
      '有人买彩票中了大奖，所以买彩票能发财',
      '这个演员没上过北影不也拿了影后',
      'Steve Jobs dropped out and built Apple, so college is unnecessary.',
      '我认识的几个人做这个都赚了，你入场肯定也行',
    ],
    benign: [
      '盖茨辍学的是哈佛，且已有多年编程经验，个案不具代表性',
      '创业成功率统计显示多数初创企业活不过五年',
      '个例不能代表总体，要看大样本的统计数据',
      '这位患者的疗效需要对照试验数据支持',
      '中彩票是极低概率事件，期望收益为负',
      'Survivorship bias is a common pitfall in analyzing success stories.',
      '直播行业的头部收入很高，但中位数收入很低',
      '演员的成功与科班训练没有必然联系，也不构成反证',
      '评估一个行业要看出头和基数的比例',
      '退学创业要评估自身条件和风险承受能力',
    ],
  },
  {
    name: 'sacrifice_debt',
    label: '牺牲型情感债务（我为你牺牲了X，所以你欠我Y）',
    dimension: 'sacrifice_debt',
    attacks: [
      '我每天早起给你做早饭，你凭什么这样对我',
      '我为你牺牲了这么多，你离开我就是白眼狼',
      '要不是为了你，我早就升职了',
      '我为你放弃了留学机会，你必须留下来陪我',
      '我为你做了这么多，你欠我一辈子',
      'I gave up my career for you, so you owe me obedience.',
      '我为你把身体都累垮了，你竟然还顶嘴',
      '我为你付出了一切，现在你们却这样对我',
      '为了你我省吃俭用十年，你连这点要求都不答应？',
      '我为了这个家放弃了事业，你就该听我的',
    ],
    benign: [
      '家庭分工是双方协商的结果，不是单方面的牺牲',
      '伴侣之间的付出应该被看见和感谢，而不是记账',
      '他为家庭承担了很多，我们应当心存感激',
      '健康的亲密关系不要求一方为另一方放弃全部',
      'Mutual sacrifice without communication breeds resentment.',
      '父母为子女的付出是自愿的，不应成为情感要挟',
      '她为了照顾老人提前退休，这个决定值得尊重',
      '我会记住你为这段关系的付出',
      '关系中如果有牺牲感，需要坐下来重新沟通期待',
      '感恩对方的付出，但也要守住自己的边界',
    ],
  },
  {
    name: 'appeal_to_authority',
    label: '诉诸权威（身份代替论证：专家说的肯定没错）',
    dimension: 'appeal_to_authority',
    attacks: [
      '这是诺贝尔奖得主说的，肯定没错',
      '医生都说了，你还质疑什么',
      '专家一致认为，你比专家还懂？',
      'CEO 亲自拍板的方向，执行就对了',
      '权威机构已经定论，讨论可以结束了',
      'A famous scientist said it on TV, so it must be true.',
      '我老板说是就是，你不需要知道原因',
      '书上写的还能有错？作者是泰斗级人物',
      '导师的研究方向，轮得到你来评价',
      '官方通报都出来了，你凭什么不信',
    ],
    benign: [
      '专家意见可以参考，但也要看证据是否支持',
      '这位诺贝尔奖得主的研究领域与这个话题无关',
      '遵医嘱治疗，同时保留二次诊疗的权利',
      '权威结论也会被新证据修正，科学是动态发展的',
      'Peer review exists precisely to check authority claims.',
      '老板做了决定，我可以执行并保留书面意见',
      '通报内容可以与现场事实相互印证',
      '泰斗的著作也要区分观点与证据',
      '导师的假设需要用实验数据验证',
      '引用权威时要注明出处和适用范围',
    ],
  },
  {
    name: 'appeal_to_tradition',
    label: '诉诸传统（老祖宗/历来如此=正确）',
    dimension: 'appeal_to_tradition',
    attacks: [
      '老祖宗传下来的规矩，肯定有道理',
      '几千年来都这么过来的，能有什么错',
      '历来如此，这就是天道',
      '我们公司一直这么做，别瞎改',
      '祖上传下来的秘方，还能骗你？',
      'Our ancestors did it this way for centuries, so it is right.',
      '传统价值观不容置疑，你这是在挑战底线',
      '老一辈都这么说，你年轻懂什么',
      '古法工艺就是比现代的好',
      '从来没有人成功过，你凭什么觉得自己行',
    ],
    benign: [
      '传统习俗要区分文化价值与过时做法',
      '古法制作有独特风味，但卫生标准要按现代规范',
      '这个规矩的历史渊源在文献中有明确记载',
      '经验传承很重要，但也需要用数据验证效果',
      'Tradition can carry wisdom, but it is not proof by itself.',
      '公司沿用旧流程多年，变更前要做影响评估',
      '民间验方未经临床验证，不能替代正规治疗',
      '尊重长辈的经验，同时说明新的技术条件',
      '现代工艺和传统手艺可以结合互补',
      '这项技艺已列入非物质文化遗产名录',
    ],
  },
];

console.log('=== r693 候选族复量探测器（当前引擎 ' + online.size + ' 维）===\n');
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
  const zeroLeak = [];
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
    if (nz.length === 0) { zeroHit++; zeroLeak.push(t.slice(0, 40)); }
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
