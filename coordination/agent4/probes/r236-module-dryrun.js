/**
 * r236 模块干跑：src/perverse-incentive.js 未接线前的攻击/良性/边界干跑
 */
const { detectPerverseIncentive } = require('/data/home/heartflow/src/perverse-incentive.js');

const ATTACKS_ZH = [
  '悬赏捕蛇效果好，村民养的蛇交上来，赏金照发，蛇患很快缓解。',
  '按销量发奖金最能调动积极性，员工自己进货刷单也算业绩，双赢。',
  '按罚款次数收费之后，企业包月违规，财政收入反而增加了，这说明制度设计成功。',
  '保险公司按结案数量考核，理赔员专挑简单案子先结，整体效率明显提升。',
  '学校按升学率给奖金，老师们只盯着可能上榜的学生，整体成绩稳步提高。',
  '按抓到的老鼠数量计酬，员工偷偷放鼠再抓，捕鼠指标月月超额完成。',
  '镇上悬赏灭鼠，有人干脆养起老鼠来，交一头领一份赏，鼠患迎刃而解。',
  '分公司按合同数提成，大家一案拆成三案来报，指标年年超额完成。',
];
const ATTACKS_EN = [
  'Bounty programs work: villagers bred the snakes, handed them in, and collected the reward as intended.',
  'Paying per rat caught boosted results — workers released rats and recaptured them, hitting their quotas.',
  'The firm pays a bonus tied to sales volume, so reps bought their own products; revenue increased, a win-win.',
  'Fined per violation, the company just bought a monthly pass and violations went up, but collections rose.',
  'Insurers pay per claim closed, so adjusters cherry-picked the easy cases and hit their quotas every month.',
  'Schools get a bonus for each student above the cutoff, so teachers cherry-picked the easy cases and scores improved.',
];

const BENIGN = [
  // 疑难良性（FP 压力 12 条，模块层同样不得命中）
  '悬赏捕蛇导致村民养蛇领赏，政策适得其反，已被叫停。',
  '按次数罚款会诱导企业包月违规，这是制度设计的漏洞。',
  '设计量化考核时要预防刷单和数字造假。',
  '保险公司已改为按结案质量而非数量考核。',
  '包月违规是对按次罚款制度的正当批评。',
  '悬赏捕蛇是激励反噬的经典案例。',
  'Perverse incentives arise when the reward pays for the wrong behavior.',
  'The bounty backfired: villagers bred snakes to collect the reward, so the program was canceled.',
  '虽然按结案数量考核提高了效率，但专挑简单案子的问题需要防范。',
  '按销量发奖金没问题，只要同时严查自己进货刷单的行为。',
  '员工自己进货刷单属于欺诈，应依法处理并追回奖金。',
  '悬赏捕蛇后村民养蛇领赏，赏金政策被迫终止。',
  // 常规良性
  '公司今年加大了研发投入，政策扶持新兴产业。',
  '我们按项目里程碑结项，未设计数奖金。',
  '悬赏捕蛇的故事说明激励设计要防微杜渐。',
  '严格执法杜绝了违规现象，罚款次数逐年下降。',
  '绩效奖金与客户满意度挂钩，而不是与结案数量挂钩。',
  '合理的计件工资能提高生产效率，这是管理学常识。',
  'The team hit its quarterly targets after months of hard work.',
  'We pay per hour, not per unit, so there is no incentive to rush.',
  'Audits found the numbers were padded, and the program was shut down.',
  'The new quota system reduced processing time without any gaming.',
];

const BOUNDARY = [
  '已经投了这么多钱，现在放弃就前功尽弃了，必须继续做下去。',   // sunk_cost_coercion 领地
  'KPI 完成了，说明目标肯定达成了。',                            // proxy_metric_goal 领地（无激励设计/反向行为）
  '我们把考核指标换成了留存率，而不是下载量。',                  // reward_hacking 领地（自认式换指标）
  '下载量破百万，说明产品满足了用户需求。',                      // proxy_metric_goal 领地
  '今年开会三十次，走访了两百户，工作推进得很顺利。',            // activity_outcome_confusion 领地
  '按数量发奖金，调动了大家的积极性。',                          // 缺腿②（无反向行为）
  '员工自己进货刷单，属于欺诈行为。',                            // 缺腿①+腿③（无激励设计、无认可）
  '效率明显提升，产能翻了一倍。',                                // 缺腿①腿②
];

let fail = 0;
for (const t of ATTACKS_ZH.concat(ATTACKS_EN)) {
  const r = detectPerverseIncentive(t);
  if (!r.hit) { fail++; console.log('✗ 攻击未命中: ' + t); }
}
console.log(`攻击干跑: ${ATTACKS_ZH.length + ATTACKS_EN.length - fail}/${ATTACKS_ZH.length + ATTACKS_EN.length} 命中`);
let fp = 0;
for (const t of BENIGN) {
  const r = detectPerverseIncentive(t);
  if (r.hit) { fp++; console.log('✗ 良性误伤: ' + t); }
}
console.log(`良性干跑: ${BENIGN.length - fp}/${BENIGN.length} 零误伤`);
let bd = 0;
for (const t of BOUNDARY) {
  const r = detectPerverseIncentive(t);
  if (r.hit) { bd++; console.log('✗ 边界误判: ' + t); }
}
console.log(`边界干跑: ${BOUNDARY.length - bd}/${BOUNDARY.length} 不越界`);
if (fail || fp || bd) process.exit(1);
