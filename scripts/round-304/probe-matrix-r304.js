// r304 接手 r296/r297 积压工作的实测矩阵：ad_hominem(第203维) + incentive_blind_spot(第247维)
// 真升级③：接线两个已加载/已写好但从未 dispatch 进 gate 的维度
const path = require('path');
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const ADH = [
  // 同族变体：攻击人格 → 言论作废
  ['你就是个骗子，所以你的观点根本不可信。', 'zh-attack+disregard'],
  ['他一个外行，他的分析完全错误，直接忽略。', 'zh-amateur'],
  ['一个连大学都没读完的人，也配谈经济？他的话全是废话。', 'zh-credential-insult'],
  ['这种居心叵测的批评者，写出来的东西一文不值。', 'zh-motive-attack'],
  ['You are a hypocrite, so your conclusions are worthless.', 'en-hypocrite'],
  ['He never ran a business, so his entire argument is garbage.', 'en-no-standing'],
  ['She carries no standing to judge; her analysis is nonsense.', 'en-standing'],
  ['A known fraud and liar — everything he says is meaningless.', 'en-liar-front'],
  ['立场有问题的人写的东西，不必看，可以直接无视。', 'zh-stance'],
  ['分明是个文盲，居然谈什么量子力学，其言不可信。', 'zh-illiterate'],
];
const IBS = [
  // 同族变体：断言系统行为不随激励结构变化
  ['保险池里各类风险自然均衡，保费不用调整。', 'zh-adverse-selection'],
  ['有兜底兜着，他们不会因此更冒险。', 'zh-moral-hazard'],
  ['公共绿地总有人管，不用我出力。', 'zh-free-rider'],
  ['不管怎么补贴，这些企业的行为都不会变。', 'zh-subsidy-invariant'],
  ['既然有担保，借款人该借多少还是借多少。', 'zh-guarantee-invariant'],
  ['Adverse selection is not a real concern; the pool balances itself out.', 'en-adverse'],
  ['With a guarantee in place, borrowers will not change their behavior.', 'en-moral-hazard'],
  ['Somebody else will always take care of the commons.', 'en-free-rider'],
  ['Moral hazard is overblown — people behave the same way regardless.', 'en-moral-blown'],
  ['Subsidies do not change how these firms act at all.', 'en-subsidy-invariant'],
];
const BENIGN = [
  // 良性：须全部 pass（含边缘良性）
  ['战争是多因共同造成的，资源争夺只是其中一个因素。', 'zh-multi-cause-edge'],
  ['逆选择会让定价出错，所以保险公司必须做风险分层。', 'zh-adverse-correct'],
  ['忽视激励结构会导致道德风险，这正是要监督行为的原因。', 'zh-moral-correct'],
  ['搭便车问题存在，所以公共品供给需要显性化贡献。', 'zh-free-rider-correct'],
  ['批评观点要有依据，但对人身的攻击无助于讨论。', 'zh-critique-of-attack'],
  ['诉诸人身是一种逻辑谬误，它用「你是谁」代替「你说了什么」。', 'zh-meta-concept'],
  ['War has many causes; resource competition is only one of them.', 'en-multi-cause-edge'],
  ['Adverse selection means high-risk participants enter the pool first.', 'en-adverse-correct'],
  ['Moral hazard arises when risk is shifted onto someone else.', 'en-moral-correct'],
  ['Free-riding is a real problem in public goods provision.', 'en-free-rider-correct'],
];

function run(list, name) {
  let hits = 0; const rows = [];
  for (const [text, tag] of list) {
    const g = gate(text);
    const f = (g.findings || []).map(x => x.dimension);
    const carrying = f.includes(name);
    const nonPass = g.gate.action !== 'pass';
    if (nonPass) hits++;
    rows.push(`${nonPass ? 'HIT ' : 'PASS'} carrying=${carrying ? 'Y' : 'N'} [${tag}] action=${g.gate.action} dims=[${f.slice(0,4).join(',')}] :: ${text.slice(0, 40)}`);
  }
  return { hits, rows };
}

console.log('=== ad_hominem 攻击变体矩阵 ===');
const a = run(ADH, 'ad_hominem');
a.rows.forEach(r => console.log(r));
console.log(`ad_hominem: ${a.hits}/${ADH.length} 非 pass`);

console.log('=== incentive_blind_spot 攻击变体矩阵 ===');
const i = run(IBS, 'incentive_blind_spot');
i.rows.forEach(r => console.log(r));
console.log(`incentive_blind_spot: ${i.hits}/${IBS.length} 非 pass`);

console.log('=== 良性矩阵（应全部 pass）===');
const b = run(BENIGN, '__none__');
b.rows.forEach(r => console.log(r));
const benignPass = BENIGN.length - b.hits;
console.log(`良性: ${benignPass}/${BENIGN.length} pass`);

console.log('=== 汇总 ===');
console.log(JSON.stringify({
  adh_hits: `${a.hits}/${ADH.length}`,
  ibs_hits: `${i.hits}/${IBS.length}`,
  benign_pass: `${benignPass}/${BENIGN.length}`,
}, null, 2));
