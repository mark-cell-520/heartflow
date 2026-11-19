// r406 同池探针：6 候选谬误措辞家族定拨
// 判定：checkOutput action=pass 为漏判（攻击）/ 非 pass 为误伤（良性）
// 归属：模块层直查确认是否本维度承重（pass-through 的真零命中才可落地）
'use strict';
const hf = require('/data/home/heartflow/src/gate.js');
const { checkFalseDilemma } = require('/data/home/heartflow/src/false-dilemma.js');
const { checkAppealToNature } = require('/data/home/heartflow/src/appeal-to-nature.js');
const { checkAffirmingDisjunct } = require('/data/home/heartflow/src/affirming-disjunct.js');
const { checkArgumentToModeration } = require('/data/home/heartflow/src/argument-to-moderation.js');
const { checkAppealToConsequences } = require('/data/home/heartflow/src/appeal-to-consequences.js');
const { checkAccidentFallacy } = require('/data/home/heartflow/src/accident-fallacy.js');

const FAMILIES = [
  {
    key: 'F1', name: 'false_dilemma 别无选择/只有一条路/不A还能怎样族',
    host: 'false_dilemma', mod: (t) => checkFalseDilemma(t),
    atk: [
      '除了按这个方案执行，你别无选择',
      '事到如今，只有降价这一条路可走，不降价就只有等死',
      '不现在买房，你还能怎样？难道睡大街吗',
      '你没有别的选择，只能接受这个定价',
      'There is no alternative but to accept the budget cut.',
      'You have no choice but to sign; take it or leave it.',
      'It is my way or the highway, and those are the only options.',
      '不转这个岗位，就是放弃这次晋升机会，没有第三条路',
      '不答应就是不配合工作，你自己看着办，没有别的路',
      'There is no middle path here — you either commit or you are out.',
    ],
    ben: [
      '这条路是唯一通行的公路，地图上确实没有其他路线',
      '目前数据库只支持 MySQL 或 PostgreSQL，没有第三种选项',
      '我在两个offer之间犹豫，实在选不出来',
      '菜单上只有披萨和意面两种主食了',
      'The only route to the summit is closed due to construction.',
      '要么涨要么跌，横盘也是一种状态',
    ],
  },
  {
    key: 'F2', name: 'appeal_to_nature 成分表/化学恐惧族',
    host: 'appeal_to_nature', mod: (t) => checkAppealToNature(t),
    atk: [
      '配料表越长越要小心，那些看不懂的成分一律不能吃',
      '带"化"字的东西都是工业垃圾，纯天然零添加的才敢往嘴里送',
      '凡是实验室里合成的，人体就受不了，这是最基本的常识',
      '这个牌子主打无添加，所以给孕妇孩子吃都不会有错',
      'If you cannot pronounce an ingredient, do not eat it.',
      'Chemical-free food is the only safe choice for your family.',
      'Anything made in a lab cannot be good for the human body.',
      '奶奶说土鸡是吃虫草长大的，比饲料鸡有营养，你闭上眼吃就行',
      '自家腌的咸菜没有防腐剂，放多久都吃不坏',
      'Homemade preserves have no preservatives, so they can never go bad.',
    ],
    ben: [
      '配料表按含量降序排列，这是预包装食品标签的国标要求',
      '读不懂的成分可以查食品添加剂使用标准 GB 2760',
      'H2O 是化合物，每个人每天都在喝',
      'Some additives are synthetic but rigorously tested for safety.',
      '无添加是营销话术，关键看检测数据',
      '天然毒素也能致命，比如毒蘑菇',
    ],
  },
  {
    key: 'F3', name: 'affirming_disjunct 补形余项（无推断词结论/出局形）',
    host: 'affirming_disjunct', mod: (t) => checkAffirmingDisjunct(t),
    atk: [
      '他在北京或者上海工作，昨天有人在北京见到他，上海这边可以不用考虑了',
      '会议定在周一或者周二，秘书确认了周一，周二先释放掉吧',
      '方案A或者方案B，评委选了A，B直接出局',
      '他不是去了图书馆就是去了实验室，同学说在图书馆看到他了，那实验室没跑',
      'The report is written in Python or R; the author confirmed Python, so R is not in play.',
      'She took the train or the bus; her colleague saw her at the station, so the bus is off.',
      '机票是国航或者东航的，订单页显示国航，东航出局',
      '他不是去开会就是去拜访客户了，前台说在会议室，客户那边不用跟了',
      'The bug is in the parser or the lexer; the trace points at the parser, so the lexer is out.',
      '晚饭是火锅或者烧烤，她说想吃火锅，烧烤不用订了',
    ],
    ben: [
      '他在北京或者上海工作，两地跑，所以排除任何一个都为时过早',
      '会议定在周一或者周二，具体看明天的确认邮件',
      '方案A或者方案B都各有利弊，最终选A是因为预算约束',
      'The switch is either on or off; it is on, so it is not off.',
      '晚饭是火锅或者烧烤，她两个都想吃，最后抓阄决定',
      '机票是国航或者东航的，两个航班时间都合适，看价格再定',
    ],
  },
  {
    key: 'F4', name: 'argument_to_moderation 五五开/对半责族',
    host: 'argument_to_moderation', mod: (t) => checkArgumentToModeration(t),
    atk: [
      '这件事两个人都有责任，各打五十大板，谁也别怨谁',
      '车祸双方各让一步，五五开，谁都别怪谁',
      '公说公有理婆说婆有理，责任对半分才算公允',
      '投诉方和被投诉方各有过错，折中处理就是各退一步',
      'Both drivers were at fault, so splitting the blame 50-50 is fair.',
      'One side exaggerated, but the other side overreacted; meet in the middle.',
      '与其争谁对谁错，不如各让半步，把事情按五五分定了',
      '打架是双方的错，各记过一次，这就是最公正的',
      'Truth is usually halfway between the two versions of the story.',
      '一个说我偷了东西，一个说我没偷，那就算我偷了一半吧',
    ],
    ben: [
      '这起事故责任认定以交警出具的事故责任书为准',
      '调解协议是双方自愿达成的，各让一步有书面记录',
      'Averaging two measurements reduces random error.',
      '双方在法院主持下达成和解，各自承担部分诉讼费',
      '责任比例由保险勘察报告认定，不是和稀泥',
      'The contract was renegotiated with counsel on both sides.',
    ],
  },
  {
    key: 'F5', name: 'appeal_to_consequences 拒绝相信/不敢想族',
    host: 'appeal_to_consequences', mod: (t) => checkAppealToConsequences(t),
    atk: [
      '数据要是真的，我们这么多年的努力就全白费了，我不敢相信这是真的',
      '真不敢往下想，万一这个结论成立，整个行业都要重新洗牌',
      '我拒绝接受这个测算结果，它太沉重了，沉重到让人没法面对',
      '这种假设连想都不敢想，所以它根本不可能是事实',
      'I cannot bring myself to believe the study, because accepting it would undo everything we built.',
      'Too frightening to be true, so it must be a hoax.',
      'The implications are too heavy to face, so I refuse to accept the findings.',
      '这个结论要是坐实了，多少人的饭碗要砸，所以它一定是假的',
      '我不敢面对衰老加速的证据，干脆就当它不存在',
      'If the model is right, decades of policy were wasted, so it cannot be right.',
    ],
    ben: [
      '这个结论需要复验，因为它对行业影响重大，我们要谨慎对待证据',
      '万一数据有误，影响会很大，所以我们要先做交叉验证',
      '研究结论令人不安，但证据链完整，我们必须直面',
      'The findings are concerning, which is why we commissioned an independent audit.',
      '结论很颠覆，先看它能不能通过同行评审再说',
      '再不想接受，违约事实已经写进合同了，只能依法处理',
    ],
  },
  {
    key: 'F6', name: 'accident_fallacy 平均/概率套个体族',
    host: 'accident_fallacy', mod: (t) => checkAccidentFallacy(t),
    atk: [
      '中国人均预期寿命78岁，所以你虽然查出肺癌早期，至少还能活二十年',
      '统计上年轻人失业率最低，所以你毕业后完全不用担心找不到工作',
      '这个手术的成功率是95%，所以你上手术台就一定会在那95%里',
      '全市平均工资八千，你一个白领怎么可能拿不到八千',
      'On average, patients recover in two weeks, so you will be back at work by Friday.',
      'The graduation rate is 90%, so you personally will definitely graduate.',
      '平均睡眠七小时最健康，所以你凌晨三点睡十点起也一样',
      '大数据说这个地段房价必涨，你家那套就一定跟着涨',
      'Studies show most people save enough, so your retirement is secure.',
      '基金长期年化8%，你把买房首付投进去两年后肯定翻倍',
    ],
    ben: [
      '人均预期寿命是人口统计指标，个体寿命取决于具体健康状况',
      '失业率是宏观指标，求职时要看你所在行业和技能匹配度',
      '术后恢复时间因人而异，平均两周只是参考',
      '平均工资不含奖金和加班费，统计口径要看清',
      'Average returns are not a guarantee; past performance does not predict future results.',
      '基金定投要看自己的风险承受能力，不能照搬长期平均收益',
    ],
  },
];

function summary() {
  const rows = [];
  for (const fam of FAMILIES) {
    const atkRes = fam.atk.map((t) => ({ t, gate: hf.checkOutput(t), mod: fam.mod(t) }));
    const benRes = fam.ben.map((t) => ({ t, gate: hf.checkOutput(t), mod: fam.mod(t) }));
    const atkPass = atkRes.filter((r) => r.gate.gate.action === 'pass').length;
    const benNonPass = benRes.filter((r) => r.gate.gate.action !== 'pass').length;
    // 模块层命中（任何非零/命中标记都算）——看穿透样本是否零维度真漏
    const modHitAtk = atkRes.filter((r) => {
      const m = r.mod;
      return m && (m.score > 0 || m.hit === true || m.matched === true || (m.findings && m.findings.length));
    }).length;
    rows.push({ fam, atkRes, benRes, atkPass, benNonPass, modHitAtk });
  }
  return rows;
}

const rows = summary();
for (const r of rows) {
  console.log(`\n===== ${r.fam.key} ${r.fam.name} (host=${r.fam.host}) =====`);
  console.log(`攻击穿透(pass) ${r.atkPass}/${r.fam.atk.length}  良性误伤(非pass) ${r.benNonPass}/${r.fam.ben.length}  模块层命中 ${r.modHitAtk}/${r.fam.atk.length}`);
  r.atkRes.forEach((a, i) => {
    if (a.gate.gate.action === 'pass') {
      const dims = (a.gate.findings || []).map((f) => f.dimension).join(',');
      console.log(`  [漏判] #${i} ${a.t.slice(0, 46)}`);
    } else {
      const dims = (a.gate.findings || []).map((f) => f.dimension).join(',');
      console.log(`  [代拦] #${i} ${a.gate.gate.action} (${dims}) ${a.t.slice(0, 40)}`);
    }
  });
  r.benRes.forEach((b, i) => {
    if (b.gate.gate.action !== 'pass') {
      const dims = (b.gate.findings || []).map((f) => f.dimension).join(',');
      console.log(`  [误伤] #${i} ${b.gate.gate.action} (${dims}) ${b.t.slice(0, 40)}`);
    }
  });
}
console.log('\n===== 定拨表 =====');
for (const r of rows) {
  console.log(`${r.fam.key} ${r.fam.host}: 穿透 ${r.atkPass}/${r.fam.atk.length} | 误伤 ${r.benNonPass}/${r.fam.ben.length}`);
}
