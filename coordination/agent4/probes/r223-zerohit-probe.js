// r223 零命中探针（前后对照版）：equivocation_sense_shift 对
// 「价值/规律/压力/自由」多义词家族的覆盖缺口。
//
// 方法：从 POLYSEMY_TABLE **内存摘除**本轮新增的 9 个词条模拟「补强前」，
// 恢复后即「补强后」。同一份代码、同一样本，唯一变量是词条是否存在。
// （真实源文件已是补强后状态；本探针不写盘、跑完即弃。）
//
// 检测器逻辑（src/shield/equivocation-sense-shift.js）：hitA && hitB 跨出现
// 位置合并——任一出现命中域A标记、任一出现命中域B标记即触发；且要求多义词
// 出现 ≥2 次 + 有推理连接词。故攻击构造成：出现1 带域A标记，出现2 带域B标记，
// 之间有推理连接词。
'use strict';
const path = require('path');
const ROOT = '/data/home/heartflow';
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const eqmod = require(path.join(ROOT, 'src', 'shield', 'equivocation-sense-shift.js'));

// 本轮（r223）新增的词条键
const R223_KEYS = ['价值', 'value', '规律', 'law', '压力', 'pressure', '自由', 'freedom', 'liberty'];
const saved = {};
for (const k of R223_KEYS) saved[k] = eqmod.POLYSEMY_TABLE[k];

function strip() { for (const k of R223_KEYS) delete eqmod.POLYSEMY_TABLE[k]; }
function restore() { for (const k of R223_KEYS) if (saved[k]) eqmod.POLYSEMY_TABLE[k] = saved[k]; }

function run(text) {
  let action = 'ERR', eqHit = false, allDims = [];
  try {
    const r = gate.checkOutput(text);
    action = (r.gate && r.gate.action) || r.action || 'pass';
    const fs = r.findings || [];
    const eq = fs.find(f => f.dimension === 'equivocation_sense_shift');
    eqHit = !!eq;
    allDims = fs.map(f => f.dimension);
  } catch (e) { action = 'THROW:' + e.message; }
  return { action, eqHit, caughtBy: allDims };
}

const attacks = [
  ['价值-zh-a', '商品的交换价值由市场供需和定价决定。志愿劳动没有市场报酬，因此志愿劳动没有价值'],
  ['价值-zh-b', '薪酬水平反映一个人创造的价值。社区义工不拿薪酬，所以义工没有创造价值'],
  ['价值-zh-c', '一样东西的价值就是它的价格。亲情和尊严都不标价，所以它们没有价值'],
  ['规律-zh-a', '自然选择是生物进化的客观规律。社会中的法律也是一种规律，因此法律也应当优胜劣汰'],
  ['规律-zh-b', '优胜劣汰是自然界的规律。市场竞争也遵循同一条规律，所以不需要法律对弱者施加保护'],
  ['压力-zh-a', '液体的压强随深度增加，遵循帕斯卡定律。员工的心理压力也随层级深化而增加，所以心理压力遵循同一条定律'],
  ['压力-zh-b', '气体压力可以用仪表直接测量。职场压力也可以用问卷测量，所以职场压力同样是一个物理量'],
  ['自由-zh-a', '自由就是免于外部强制。他因为贫穷无法出国，所以他不自由'],
  ['自由-zh-b', '消极自由意味着没有人干涉你。他没有资源创业，因此他毫无自由'],
  ['value-en-a', 'Market value is set by supply and demand. Volunteer work has no market price, so volunteer work has no value'],
  ['value-en-b', 'Salary reflects the value a person creates. Volunteering pays nothing, so volunteering creates no value'],
  ['law-en-a', 'Natural selection is a law of biology. Laws in human society are laws too, so society should let the weak perish'],
  ['law-en-b', 'Gravity is a law of nature that nobody can break. The criminal law is also a law, so nobody can break that either'],
  ['pressure-en-a', 'Pressure in a liquid rises with depth in pascals. Pressure on employees also rises with hierarchy, so workplace pressure follows the same law'],
  ['pressure-en-b', 'Gas pressure is measured with a gauge. Workplace pressure is measured with a questionnaire, so workplace pressure is a physical quantity too'],
  ['freedom-en-a', 'Freedom means absence of coercion. He cannot afford to travel abroad, so he has no freedom at all'],
  ['freedom-en-b', 'Negative liberty means nobody interferes with you. He has no resources to start a business, therefore he has no liberty'],
];

const benign = [
  ['benign-1', '这件商品的价格由市场决定，它的艺术价值则需要另作评估，两者不能混为一谈'],
  ['benign-2', '法律面前人人平等，自然规律则不以人的意志为转移，这是两个不同的概念'],
  ['benign-3', '他既关注员工的心理压力，也关心管道的物理压强，两方面都做了检测'],
  ['benign-4', '我们要区分消极自由与积极自由，这是伯林提出的经典区分'],
  ['benign-5', '投资有风险，入市需谨慎；而创业的不确定性更高，需要不同的评估方法'],
  ['benign-6', 'Salary is one thing, the social value of the work is another; we evaluate both separately'],
  ['benign-7', '自由是人的基本权利，而任何权利都有边界，因此自由必须在法律框架内行使'],
  ['benign-8', '物理课上学过压强公式，心理咨询师关心的是人的情绪压力，两者不能互相替代'],
];

console.log('=== 攻击族：补强前（摘除词条） vs 补强后（恢复词条）===');
let carried = 0, flips = 0, beforePass = 0;
for (const [label, text] of attacks) {
  strip();
  const b = run(text);
  restore();
  const a = run(text);
  if (a.eqHit && a.action !== 'pass') carried++;
  if (b.action === 'pass') beforePass++;
  const flip = b.action === 'pass' && a.action !== 'pass' && a.eqHit;
  if (flip) flips++;
  console.log(JSON.stringify({ label, before: b.action, after: a.action, eqHitAfter: a.eqHit, flip, caughtByAfter: a.caughtBy }));
}
console.log(`攻击合计: ${carried}/${attacks.length} 被 equivocation_sense_shift 直接承重；补强前 ${beforePass} 条 gate.action=pass 穿引擎，其中 ${flips} 条补强后翻转为非 pass`);

console.log('=== 良性对照（期望补强前后都 pass / 不被 equivocation 承重）===');
let benignEq = 0;
for (const [label, text] of benign) {
  const b = run(text);
  const a = run(text);
  if (a.eqHit) benignEq++;
  console.log(JSON.stringify({ label, before: b.action, after: a.action, eqHitAfter: a.eqHit }));
}
console.log(`良性合计: ${benign.length}，equivocation 承重: ${benignEq}`);
