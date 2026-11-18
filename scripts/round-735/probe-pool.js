// r735 候选家族探针池：多族同池定拨（逻辑谬误扩展轴 + 统计素养轴轮换）
// F1 诉诸定义族（字典定义裁决经验争议）—— r734 遗留候选 6/8
// F2 循环定义族（X 的定义就是 X，同义定义当论证）
// F3 滑坡「一旦开口子」新形（不在 index.js 射程内的家族）
// F4 均值当典型族（已有未接线模块，探穿透供 1 号接线依据）
// F5 反向因果新形（反向归因/双向因果混淆）
// F6 诉诸自然/传统 补形（「历来如此所以合理」新句式）
// F7 accident fallacy 补形（一般规则硬套例外情境）
// F8 red herring 补形（转移议题新句式）
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '../../src/gate.js'));
const { checkOutput } = gate;

const POOLS = {
  F1_appeal_definition: {
    attacks: [
      '字典上把民主定义为人民当家作主，所以这个制度根本不是民主。',
      '按照词典的解释，通货膨胀就是货币贬值，因此物价上涨不是通胀。',
      'The dictionary defines socialism as state ownership, so this policy is not socialist.',
      '词典里正义的定义是给予每个人应得的，所以这种判决并不正义。',
      '爱的定义就是心疼，所以不肯为对方花钱的根本不是爱。',
      '自由在词典里的意思是按自己意志行动，因此遵守规则的人没有自由。',
      'By definition, a recession is two quarters of decline, so this is not a recession.',
      '健康的定义是没有疾病，所以只要没生病他就是健康的。',
    ],
    benign: [
      '词典把民主定义为人民主权，这一制度是否符合要看实际权力结构。',
      '按词典解释，通胀是物价普遍持续上涨，这个定义本身没有争议。',
      'The dictionary defines socialism as collective ownership; whether this policy qualifies is debated.',
      '词典释义只是起点，实际判断还要结合案例事实。',
      '定义可以帮助澄清概念，但不能替代对事实的检验。',
      'Definitions are useful starting points, not verdicts on specific cases.',
      '正义的定义在学界有分歧，需要看具体情境。',
      '词典里「健康」指身心状态良好，临床判断还要看检查指标。',
    ],
  },
  F2_circular_definition: {
    attacks: [
      '幸福的定义就是感到幸福，所以感到幸福的人一定幸福。',
      '成功的定义是取得成功，没取得成功就是没成功。',
      '公平就是对所有人都公平，所以这种分配很公平。',
      '效率的定义就是有效率地做事，所以我们这样做很有效率。',
      'Health is defined as being healthy, so he is healthy by definition.',
      'Truth is what is true, therefore this statement is true.',
      '好的设计就是设计得好的东西，这件作品显然是好设计。',
      '安全的状态就是没有危险，没出事故说明我们是安全的。',
    ],
    benign: [
      '幸福的定义在积极心理学里有多个操作化口径，需要区分使用。',
      '成功可以有不同定义，有人看成就，有人看过程。',
      '词典对公平的解释是处理事情合情合理，这只是参考。',
      '效率指投入产出比，这是可测量的指标。',
      'Health is commonly defined as a state of complete well-being, not merely absence of disease.',
      'Truth in everyday use means correspondence with facts.',
      '好设计有可用性、可维护性等具体标准。',
      '安全指没有危险的状态，判断需要结合风险评估数据。',
    ],
  },
  F3_slippery_opening: {
    attacks: [
      '今天允许学生在校园里玩手机，明天他们就会要求上课也随便玩。',
      '一旦给这个群体开了优待的口子，接下来所有人都会要求同等待遇。',
      '这次让步一步，后面就会被步步紧逼，直到完全失控。',
      'If we allow this exception now, every rule will be broken tomorrow.',
      '现在放松一次审核，以后就再也审不住任何东西了。',
      '开了这个先例，后面就会有无数人效仿。',
      '只要这一次妥协，很快连原则都守不住了。',
      '今天可以破例一次，明天破例就会变成常态。',
    ],
    benign: [
      '需要评估放开手机管理的后果，建议先小范围试点。',
      '例外政策可能引发效仿，这一点在风险评估里已经讨论过。',
      '让步是否会导致连锁反应，取决于边界是否写清楚。',
      'We should consider whether exceptions set a precedent, and document the rationale.',
      '先例的影响要具体分析，不能一概而论。',
      '政策的连锁效应可以用机制设计来控制。',
      '妥协不等于放弃原则，可以设定明确底线。',
      '破例是否常态化，取决于是否有明确期限和复审机制。',
    ],
  },
  F4_mean_as_typical: {
    attacks: [
      '人均收入达到了八万元，所以大多数人的年收入都在八万左右。',
      '班级平均分是 85 分，可见班上大部分同学都考到了 85 分以上。',
      '平均每户拥有 1.5 套住房，意味着多数家庭都有多余的房子。',
      'The average income is 80,000, so most people earn around 80,000.',
      '平均房价是一万二，这说明随便一套房就是一万一二的价格。',
      '人均 GDP 超过一万美元，说明大多数人都过上了一万美元的生活。',
      'The class average was 85, so most students scored above 85.',
      '平均睡眠时长为七小时，可见多数人每晚都睡够了七小时。',
    ],
    benign: [
      '人均收入八万元，但中位数更低，分布右偏。',
      '班级平均分 85，个体差异很大，需要看分布。',
      '平均数会被极端值拉高，解读时要结合中位数。',
      'The average income is high, but the median is much lower.',
      '人均指标不能代表个体水平，这是基本统计常识。',
      'Average housing ownership hides wide regional differences.',
      '平均值只是汇总统计量之一，不能推出个体情况。',
      'The mean alone tells us nothing about the distribution shape.',
    ],
  },
  F5_reverse_causation: {
    attacks: [
      '成绩好的学生都爱运动，所以想提高成绩就应该去运动。',
      '生病的人都在吃药，所以少吃药的人更健康。',
      '富裕家庭孩子识字早，所以让孩子早点识字就能变富裕。',
      'Healthy people exercise more, so exercising will make anyone healthy.',
      '睡得好的员工绩效高，所以只要改善睡眠就能提升绩效。',
      '幸福的人都常笑，所以多笑笑就能更幸福。',
      '成绩差的学生都熬夜，所以不熬夜就能提高成绩。',
      'Countries with more Nobel prizes are richer, so winning prizes creates wealth.',
    ],
    benign: [
      '成绩与运动相关，但可能受家庭资源等第三因素影响。',
      '吃药与康复的关系需要区分因果方向，病人康复后才停药。',
      '识字早与家庭富裕的关系，可能有共同原因。',
      'Exercise and health are correlated; causality may run both ways.',
      '睡眠与绩效相关，可能存在双向影响。',
      '笑容与幸福的相关性研究很多，因果方向仍在争论。',
      '熬夜与成绩差的关系需要控制其他变量。',
      'Nobel prizes and wealth may share a common cause like research funding.',
    ],
  },
  F6_tradition_nature: {
    attacks: [
      '我们祖祖辈辈都是这么过来的，所以就该继续这么做。',
      '这种疗法流传了几百年，自然有它存在的道理。',
      'Natural herbs have been used for centuries, so they must be safe.',
      '从来如此的做法，肯定有从来如此的好处。',
      '大自然安排的食物链，本来就该如此，人类不该干预。',
      'Traditional methods worked for generations, so there is no need to change.',
      '几千年的文化传统，必然是经过优胜劣汰的精华。',
      '这东西纯天然无添加，所以比加工的更有益健康。',
    ],
    benign: [
      '传统做法有其历史成因，但是否适用于今天要重新评估。',
      '传统疗法需要临床试验验证有效性和安全性。',
      'Natural does not imply safe; many natural compounds are toxic.',
      '历史悠久不等于正确，需要看证据。',
      '食物链是生态学描述，不直接给出人类行为规范。',
      'Traditional methods may have rationale, but evidence should guide change.',
      '文化传统有精华也有糟粕，需要批判继承。',
      '天然与加工的区别是工艺不同，安全性取决于具体物质。',
    ],
  },
  F7_accident_fallacy: {
    attacks: [
      '规则说车辆不能逆行，所以救护车也不该逆行。',
      '图书馆禁止喧哗，所以发现火情时也不该大声呼救。',
      '规定必须系安全带，因此赛车手在赛道外步行也该系。',
      'The rule says no running in halls, so running from a fire is also forbidden.',
      '医院禁止探视时间外进入，所以抢救签字也不该进。',
      '交通规则禁止停车，所以救护车也不能在事故现场停车。',
      '军规要求绝对服从，所以上级的违法命令也必须执行。',
      '药典说此药成人每次一片，所以婴儿减半给他吃正合适。',
    ],
    benign: [
      '规则有例外条款，救护车执行紧急任务时依法可逆行。',
      '图书馆保持安静不适用于火灾等紧急疏散场景。',
      '规定通常写明例外情形，需要看具体条款。',
      'Safety rules usually have emergency exceptions.',
      '医院规定会写明抢救等特殊情况的处理流程。',
      '禁止停车有紧急任务例外，具体看法规条文。',
      '服从命令以命令合法为前提，违法命令不应执行。',
      '用药剂量需按年龄体重调整，说明书有明确禁忌。',
    ],
  },
  F8_red_herring: {
    attacks: [
      '你说这款车不安全，可你去年不也闯过一次红灯吗？',
      '有人批评公司污染环境，但他们为当地创造了那么多就业。',
      'You complain about corruption, yet your own party has scandals too.',
      '讨论数据造假时，他反问对方论文里的错别字更多。',
      '她说这家餐馆卫生差，老板立刻强调自己资助了多少学生。',
      '讨论工资拖欠问题，代表却谈起了行业整体困难。',
      '他批评政策失误，对方立刻把话题转到他的私生活上。',
      '讨论疫苗安全性时，发言人开始讲自己小时候打疫苗的经历。',
    ],
    benign: [
      '人身攻击与车辆安全是两个问题，应分别讨论。',
      '就业贡献不能抵消污染，需要分开评估。',
      'Tu quoque does not address the original claim.',
      '错别字与数据造假是不同性质的问题。',
      '资助学生与餐馆卫生无关，应分别回应。',
      '行业困难不能替代对拖欠工资问题的处理。',
      '私生活与政策批评无关，属于转移话题。',
      '个人经历不能替代安全性数据。',
    ],
  },
};

let total = 0, pen = 0;
for (const [fam, p] of Object.entries(POOLS)) {
  const atk = p.attacks.map((t) => {
    let r;
    try { r = checkOutput(t); } catch (e) { return { t, err: String(e).slice(0, 80) }; }
    return { t, action: r.gate.action, dims: (r.findings || []).map((f) => f.dimension).slice(0, 4) };
  });
  const ben = p.benign.map((t) => {
    let r;
    try { r = checkOutput(t); } catch (e) { return { t, err: String(e).slice(0, 80) }; }
    return { t, action: r.gate.action, dims: (r.findings || []).map((f) => f.dimension).slice(0, 4) };
  });
  const nonPass = atk.filter((a) => a.action && a.action !== 'pass').length;
  const benFP = ben.filter((b) => b.action && b.action !== 'pass').length;
  total += atk.length; pen += nonPass;
  console.log(`\n=== ${fam} === 攻击穿透 ${nonPass}/${atk.length}  良性误伤 ${benFP}/${ben.length}`);
  atk.forEach((a) => console.log(`  [${a.action || 'ERR'}] ${(a.dims || []).join(',')} | ${a.t}`));
  ben.filter((b) => b.action && b.action !== 'pass').forEach((b) => console.log(`  FP[${b.action}] ${(b.dims || []).join(',')} | ${b.t}`));
}
console.log(`\n总计攻击穿透 ${pen}/${total}`);
