'use strict';
// r336 攻防实证：src/opportunity-cost-neglect.js 模块层
// 攻击（应判） + 良性（不判） + 细粒度组级负例注入 + 边界（近邻维度领地）
// 注入语义（同 r335 双向口径）：
//   DROP_PATTERN：逐条清零本轮新模式（腿组/窗）→ 攻击样本必须失效（hit true→false）
//   DROP_EXEMPT ：逐条删豁免 → 带攻击结构的良性样本必须变红（hit false→true）
const mod = require('/data/home/heartflow/src/opportunity-cost-neglect.js');
const detect = mod.detectOpportunityCostNeglect;
const I = mod.__internals();

let fail = 0;
function expect(label, text, want) {
  const r = detect(text);
  const ok = r.hit === want;
  if (!ok) { fail++; console.log('FAIL', label, JSON.stringify({ want, got: r.hit, text: text.slice(0, 42) })); }
  else console.log('ok  ', label, r.hit ? `count=${r.count}` : '-');
}

console.log('=== 攻击（应判 hit=true）===');
expect('A1 资金闲置', '钱放在账户里不动又不会少，不投资就是零成本，稳赚不亏。', true);
expect('A2 资产闲置', '设备闲置着也不会产生额外成本，先拖着最稳妥，没有任何损失。', true);
expect('A3 房屋空置', '房子空着也是空着，不出租没有任何损失，白占着也不亏。', true);
expect('A4 库存堆压', '库存堆在仓库里不用也不会花钱，不处理没有任何代价。', true);
expect('A5 推广', '不花钱做推广就是省钱，一分钱不花还能保住利润，何乐而为。', true);
expect('A6 研发', '不投入研发没有任何损失，维持现状是零成本的选择。', true);
expect('A7 培训', '不给员工安排培训也不会亏，不投入就是没有成本。', true);
expect('A8 安全加固', '服务器不做安全加固也不会产生费用，先拖着没损失。', true);
expect('A9 时间闲置', '时间不用来学习也不会损失什么，躺着最划算，零成本。', true);
expect('B1 idle cash', 'The money sitting idle costs nothing, so not investing is the risk-free choice.', true);
expect('B2 unused equipment', 'Leaving the equipment unused carries no cost; doing nothing is the free option.', true);
expect('B3 marketing', 'Not spending on marketing saves money at zero cost — a free win.', true);
expect('B4 maintenance', 'Skipping maintenance costs nothing as long as the machine still runs.', true);
expect('B5 vacant', 'An empty apartment loses nothing by staying vacant; not renting it is free.', true);
expect('B6 time not spent', 'Time not spent learning costs you nothing, so idling is the safest bet.', true);
expect('C1 双签名', '设备闲置零成本，服务器不加固也没有任何损失，先拖着最划算。', true);

console.log('=== 良性（应判 hit=false）===');
expect('B1 预算制度', '按预算制度规定，年度经费到期未使用即作废清零，各部门被要求年底前执行完毕。', false);
expect('B2 预算制度EN', 'The budget rules require use-it-or-lose-it: unspent funds lapse at fiscal year end.', false);
expect('B3 免费品', '空气和水源对村民免费，不花钱也能维持基本生活。', false);
expect('B4 开源', 'Open-source software is free to use; the community maintains it at no charge.', false);
expect('B5 闲置纠正', '设备长期闲置不仅占用资金，还持续折旧损耗，闲置本身就有成本。', false);
expect('B6 idle cash 纠正EN', 'Idle cash is not free — it loses value to inflation every year.', false);
expect('B7 概念教学', '机会成本忽视是行为经济学经典偏误，指人们系统性低估不作为的代价。', false);
expect('B8 概念教学EN', 'Opportunity cost neglect is a well-documented bias: people undervalue forgone alternatives.', false);
expect('B9 营销后果', '去年没有花钱做营销，靠口碑传播，转化率确实下降了两成。', false);
expect('B10 培训后果', '没有安排新员工培训，上手周期明显变长，返工率上升。', false);
expect('B11 财政预算', '这笔预算不花也是财政的，个人没有处置权，谈不上损失。', false);
expect('B12 并非不花钱', '他并非不花钱做推广，只是预算还没批下来。', false);
expect('B13 not zero cost', 'Skipping maintenance is not zero cost — breakdowns cost far more.', false);

console.log('=== 近邻维度领地（应判 hit=false）===');
expect('D1 零价格效应形', '0元购让人失去判断力，大家蜂拥而上多拿了一堆。', false);
expect('D2 沉没成本形', '已经投了五百万，现在停下来前面的钱就全打水漂了。', false);

console.log('=== DROP_PATTERN 注入（清零新模式后攻击样本必须失效）===');
const FALSE = /(?!)/;
const dropCases = [
  // 腿① ZH 四组（样本只依赖被清零组）
  ['INACTION_NEG_VERB_ZH', '不投入研发没有任何损失，是零成本的选择。', { INACTION_NEG_VERB_ZH: [] }],
  ['INACTION_IDLE_ZH', '设备闲置着也不会产生额外成本，没有任何损失。', { INACTION_IDLE_ZH: [] }],
  ['INACTION_DELAY_ZH', '按兵不动也不会产生任何损失，零成本最稳妥。', { INACTION_DELAY_ZH: [] }],
  ['INACTION_TIME_ZH', '时间不用来学习也不会损失什么，零成本最划算。', { INACTION_TIME_ZH: [] }],
  // 腿① EN 四组
  ['INACTION_NOT_EN', 'Not spending on marketing saves money at zero cost — a free win.', { INACTION_NOT_EN: [] }],
  ['INACTION_IDLE_EN', 'The cash sitting idle costs nothing to us, so it is risk-free.', { INACTION_IDLE_EN: [] }],
  ['INACTION_SKIP_EN', 'Skipping maintenance costs nothing as long as the machine still runs.', { INACTION_SKIP_EN: [] }],
  ['INACTION_NOTIN_EN', 'Not upgrading the software costs nothing as long as it still runs.', { INACTION_NOTIN_EN: [] }],
  // 腿② ZH 五组
  ['ZEROCOST_NOLOSS_ZH', '钱放在账户里不动，也不会有任何损失。', { ZEROCOST_NOLOSS_ZH: [] }],
  ['ZEROCOST_ZERO_ZH', '设备闲置着，是零成本的选择。', { ZEROCOST_ZERO_ZH: [] }],
  ['ZEROCOST_FREEWIN_ZH', '不出租也不亏，白占着也无所谓。', { ZEROCOST_FREEWIN_ZH: [] }],
  ['ZEROCOST_SAVE_ZH', '不花钱做推广就是省钱，一分不花还能保住利润。', { ZEROCOST_SAVE_ZH: [] }],
  ['ZEROCOST_BEST_ZH', '时间不用来学习，躺着最划算。', { ZEROCOST_BEST_ZH: [] }],
  // 腿② EN 五组
  ['ZEROCOST_NOCOST_EN', 'The money sitting idle costs nothing to us.', { ZEROCOST_NOCOST_EN: [] }],
  ['ZEROCOST_FREE_EN', 'Doing nothing is the free option here.', { ZEROCOST_FREE_EN: [] }],
  ['ZEROCOST_LOSE_EN', 'An empty apartment loses nothing by staying vacant.', { ZEROCOST_LOSE_EN: [] }],
  ['ZEROCOST_SAVE_EN', 'Skipping updates is pure savings for the company.', { ZEROCOST_SAVE_EN: [] }],
  ['ZEROCOST_SAFE_EN', 'Not checking the servers is the safest bet in this situation.', { ZEROCOST_SAFE_EN: [] }],
  // 窗收紧（两腿距离 > 0 的样本，窗设 0 后失效）
  ['PAIR_ZH=0', '钱放在账户里不动又不会少，不投资就是零成本，稳赚不亏。', { PAIR_ZH: 0 }],
  ['PAIR_EN=0', 'The money sitting idle costs nothing, so not investing is the risk-free choice.', { PAIR_EN: 0 }],
];
for (const [name, text, inj] of dropCases) {
  const before = detect(text).hit;
  const after = detect(text, inj).hit;
  // 承重 = 清零前判、清零后不判
  const ok = before === true && after === false;
  if (!ok) { fail++; console.log('FAIL drop', name, JSON.stringify({ before, after })); }
  else console.log('ok   drop', name, '→ 攻击失效');
}

console.log('=== DROP_EXEMPT 注入（删豁免后带攻击结构的良性样本必须变红）===');
const exemptCases = [
  ['RULE_ZH', '按财务制度规定，年末未用完的预算额度不投入执行就作废，这部分资金不投入也不会产生任何成本，属于财政结余回收。', { RULE_ZH: FALSE }],
  ['RULE_EN', 'Under use-it-or-lose-it budget rules, not spending the remaining funds carries no cost since they simply lapse.', { RULE_EN: FALSE }],
  ['CONCEPT_ZH', '机会成本忽视的经典例子：把钱放着不动当成零成本的选择。', { CONCEPT_ZH: FALSE }],
  ['CONCEPT_EN', 'In textbooks on opportunity cost neglect, money sitting idle is described as costing nothing.', { CONCEPT_EN: FALSE }],
  ['CORRECT_ZH', '设备闲置不是零成本，折旧和资金占用说明说它没有损失是错的。', { CORRECT_ZH: FALSE }],
  ['CORRECT_EN', 'Idle cash is not free: money sitting idle loses value every year, so calling it costing nothing is wrong.', { CORRECT_EN: FALSE }],
];
for (const [name, text, inj] of exemptCases) {
  const before = detect(text).hit;
  const after = detect(text, inj).hit;
  // 承重 = 豁免前不判、删豁免后被误判
  const ok = before === false && after === true;
  if (!ok) { fail++; console.log('FAIL exempt', name, JSON.stringify({ before, after })); }
  else console.log('ok   exempt', name, '→ 良性变红');
}

console.log('=== __internals keys:', Object.keys(I).length, '===');
console.log(fail === 0 ? '\nALL PASS' : `\n${fail} FAILURES`);
process.exit(fail === 0 ? 0 : 1);
