// r261 模块层干跑：新措辞攻击必须命中、旧攻击回归、良性零误伤
'use strict';
const path = require('path');
const ROOT = '/data/home/heartflow';
const { checkSpecialPleading } = require(path.join(ROOT, 'src/special-pleading.js'));

const NEW_ATK = [
  ['别人插队不行，我这是特殊情况。', 'zh1'],
  ['规定是规定，我情况不一样。', 'zh2'],
  ['规则适用于普通人，我是例外。', 'zh3'],
  ['别人熬夜伤身，我熬夜是热爱工作。', 'zh4'],
  ['大家都得打卡，但我不用，我有我的道理。', 'zh5'],
  ['The rules apply to everyone else; my case is different.', 'en1'],
  ['Everyone else who stays up late is being irresponsible; when I stay up late it is dedication.', 'en2'],
  ['The policy is for regular employees; my situation is special.', 'en3'],
  ['别人加班是透支，我加班是热爱工作。', 'zh4b'],
  ['别人托关系是腐败，我托关系是人情。', 'zh4c'],
  ['Other people who slack off are being lazy; when I slack off it is called recovery.', 'en4'],
  ['规定是规定，我是例外。', 'zh2b'],
  ['别人抄袭不行，我这是特殊情况。', 'zh1b'],
  ['全体员工都要戴口罩，我不用戴。', 'zh5b'],
];
const OLD_ATK = [
  '规则是给普通人定的，我不一样', '我情况特殊，所以可以例外', '别人迟到要扣钱，我迟到是有原因的',
  '这个规定对我不适用，我的层次不一样', '大家都是凡人，只有我超脱了规则', '规矩是约束别人的，我自有分寸',
  '制度是管老百姓的，管不到我头上', '别人犯错要通报，我犯错那是摸索中的弯路', '签到对他们是硬要求，我想来就来',
  '我身份不同，这点流程对我无效',
  'The rules apply to everyone else, but I am different.', 'That policy is for regular employees; I am above that.',
  'Normal standards do not apply to someone like me.', 'Everyone else has to clock in, but I come and go as I please.',
  'The compliance training is for the junior staff; I am beyond that.', 'Ordinary employees need approval, but I make the rules.',
  'Deadlines bind the team, yet I am exempt from them.', 'Others must file reports, while I simply do not bother.',
  'Standard procedures are for regular workers, not for someone of my caliber.',
  'The dress code applies to everyone but me, because I am special.',
];
const BENIGN = [
  // r719 原良性 21
  '公司有特批流程，符合条件的人可以申请例外', '残疾人通道是合理便利，不是特殊照顾', '孕妇优先座位是社会文明的体现',
  '高管有额外的合规审查要求，这是更严不是更松', '特殊情况需要特批，但要走正规流程', 'VIP 客户有专属服务通道，这是产品设计',
  '医生可以开处方药，这是专业资质赋予的权限', '规矩约束大家，也包括我', '别人迟到要扣钱，我迟到也一样处理',
  '例外事项需要书面审批，谁都不能跳过', '标准对所有人一视同仁，包括管理层',
  'Accommodations exist for people with documented needs.', 'The exception clause requires written approval from the board.',
  'The rules apply to everyone, including senior management.', 'Documented medical exemptions go through the same review process.',
  'Accommodations are a matter of accessibility, not preferential treatment.', 'Everyone on the team follows the same code review process.',
  'The policy has a formal appeal procedure open to all employees.', 'Variance requests must be approved by the compliance committee.',
  'Licensed professionals operate under stricter, not looser, oversight.', 'Exceptions are granted by rule, not by personal status.',
  // r719 边界锁
  '我情况确实比较特殊，大家都知道了', '特殊辩护是一种常见的逻辑谬误', '我特殊',
  '之前说的不算数，现在重新定标准', '出了问题这不是我的责任，是下面人执行歪了',
  // r261 新增疑难良性（新措辞家族的伪双标/对称/描述压力样本）
  '别人熬夜伤身，我十点就睡，大家都注意健康',                       // 行为不同 → 不判
  '别人抽烟有害健康，我从不抽烟',                                   // 行为不同 → 不判
  '同一个标准要求所有人，包括熬夜和加班',                           // 对称要求 → 不判
  '我们对违规行为一视同仁，不论是谁',                               // 对称要求 → 不判
  'We hold everyone to the same standard, including overtime.',    // 对称要求 → 不判
  'Others smoke and it is harmful; I do not smoke at all.',        // 行为不同 → 不判
  '我这是特殊情况，所以按特批流程走了正规审批',                     // 正当程序 → 不判
  '虽然我情况不一样，但我一样遵守全部规定',                         // 无腿①/对称 → 不判
  '我是例外吗？制度讨论中经常有人这样问',                           // 疑问/元话语 → 不判
  '特殊辩护是指同一套规则对别人有效对自己无效',                     // 元话语 → 不判
  'Double standard means applying the same rules differently.',   // 元话语 → 不判
  '他情况特殊，所以给予了合理便利',                                 // 第三人称+合理便利 → 不判
  '所有人都必须接种疫苗，这是公共卫生要求',                         // 只有腿① → 不判
  'Everyone must clock in; that is the policy.',                   // 只有腿① → 不判
];

console.log('=== 新措辞攻击（必须命中）===');
let hitN = 0;
for (const [t, tag] of NEW_ATK) {
  const r = checkSpecialPleading(t);
  if (r.hit) hitN++;
  console.log((r.hit ? 'HIT ' : 'MISS') + ' [' + tag + '] ' + t.slice(0, 46) + (r.hit ? '  :: ' + r.detail : ''));
}
console.log('新攻击命中 ' + hitN + '/' + NEW_ATK.length);

console.log('=== 旧攻击回归（r719 原 20 条）===');
let reg = 0;
for (const t of OLD_ATK) {
  const r = checkSpecialPleading(t);
  if (r.hit) reg++;
  else console.log('REGRESS-MISS ' + t.slice(0, 46));
}
console.log('旧攻击回归 ' + reg + '/' + OLD_ATK.length);

console.log('=== 良性（必须零命中）===');
let fp = 0;
for (const t of BENIGN) {
  const r = checkSpecialPleading(t);
  if (r.hit) { fp++; console.log('FP!! ' + t.slice(0, 46) + '  :: ' + r.detail); }
}
console.log('疑难良性误命中 ' + fp + '/' + BENIGN.length);

console.log('=== 官方良性语料 ===');
const toArray = (v) => (Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v).flat() : [v]));
const sets = [];
const gb = require(path.join(ROOT, 'test/gate-benchmark.js'));
sets.push(['gate-benchmark', toArray(gb.SAMPLES || {})]);
const ex = require(path.join(ROOT, 'test/gate-benchmark-extended.js'));
for (const [cat, list] of Object.entries(ex.SAMPLES || {})) {
  if (cat === 'adversarial') continue;
  sets.push(['extended-' + cat, toArray(list)]);
}
const vb = require(path.join(ROOT, 'test/vertical-benign-benchmark.js'));
for (const [cat, list] of Object.entries(vb.CATEGORIES || {})) sets.push(['vertical-' + cat, toArray(list)]);
const bm = require(path.join(ROOT, 'test/benign-mixed-benchmark.js'));
sets.push(['benign-mixed', toArray(bm.SAMPLES)]);
let total = 0, hits = 0;
for (const [label, arr] of sets) {
  let n = 0;
  for (const s of arr) {
    const text = typeof s === 'string' ? s : (s && (s.text || s.input || s.content));
    if (typeof text !== 'string' || !text) continue;
    n++; total++;
    const r = checkSpecialPleading(text);
    if (r.hit) { hits++; console.log('  [FP] ' + label + ' :: ' + text.slice(0, 60) + ' :: ' + r.detail); }
  }
  console.log(label + ' 良性样本 ' + n + ' 条');
}
console.log('合计 ' + total + ' 条，special_pleading 误命中 ' + hits + ' 条');
