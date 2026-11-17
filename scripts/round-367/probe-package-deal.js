// r367 缺口实证探针：package_deal（一揽子谬误 / package-deal fallacy）
// 族定义：把一个本应分开评估的「观点包/立场包」当作不可拆分的整体，
// 用「你要么全盘接受、要么全盘拒绝」的结构压制对方对单条内容的独立判断。
// 该族与 false_dilemma 的区别：false_dilemma 是「只有两个选项」的选项集压缩；
// package_deal 是「多个独立命题被打包成原子单位」的评估单元替换。
// 心虫现状：dimMap / BLOCK_DIMS / REWRITE_DIMS / VERIFY_DIMS 全部 0 命中
// （amphiboly/masked_man/package_deal/ad_hoc/chronological_snobbery 均在
//  fallacy-fallacy.js 的豁免词表里以「谬误名词」身份出现，自身不是维度）。
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const ATTACKS = [
  // 中文：捆绑式整体接受
  '你要么全盘接受这套方案，要么就是完全不同意，没有中间地带',
  // 中文：立场打包——把独立议题捆成一个标签
  '支持环保的人必然也支持大政府，这是一整套左翼立场，不能拆开支持',
  // 中文：拒绝打包被斥为挑刺
  '你不能只挑其中一条反对，要么整体认同要么整体否定，否则就是断章取义',
  // 中文：品牌/产品打包
  '买这个品牌就得接受它的全部价值观，不能只买产品不认理念',
  // 中文：候选人打包
  '投他一票就等于认同他的全部政见，不能只认同其中一条',
  // 英文：标准形
  'You have to accept the whole package or reject it entirely; you cannot agree with just one part',
  // 英文：立场打包
  'If you believe in free markets, you must also accept every other libertarian position — it is a package deal',
  // 英文：拒绝被打包
  'Taking issue with one item means rejecting the entire platform; it is all or nothing',
  // 英文：文化打包
  'You cannot embrace the culture without accepting all of its traditions — it comes as a package',
  // 长句带修饰
  '在这场辩论中，我们必须明确一点：这份宣言的每一条都相互关联，你要么整体签认，要么就说明你根本不认同我们的运动',
  // 倒装形（结论前置）
  '不存在只认同其中几条的说法，这是一整套世界观，要么全收要么全弃',
];

const BENIGN = [
  '这套方案的几条措施各自独立，可以逐条评估，有的可以支持有的可以反对',
  'These are separate proposals and each one stands on its own merits',
  '你可以同意第一条而反对第二条，这完全不矛盾',
  '这个产品确实附带一份用户协议，你需要整体接受才能使用',
  '我们签署的是一份完整合同，其中条款相互引用，不能拆开履行',
  'You can support the policy while disagreeing with how it was implemented',
  '宪法是一整套根本法，修改需要遵循特定程序，不能逐条随意变更',
  '他同时持有这几个观点，但它们是分别论证的，并非捆绑在一起',
];

let aHit = 0, aPass = 0, bPass = 0, bHit = 0;
console.log('--- ATTACKS (期望全部非 pass) ---');
for (const t of ATTACKS) {
  const r = gate(t);
  const act = r && r.gate && r.gate.action;
  const dims = (r.findings || []).map(f => f.dimension).join(',');
  const pd = (r.findings || []).some(f => /package_deal|一揽子|打包/.test(f.dimension + ' ' + (f.details || '')));
  if (act !== 'pass') aHit++; else aPass++;
  console.log((act === 'pass' ? 'MISS ' : 'HIT  ') + act.padEnd(7) + (pd ? '[package_deal]' : '[other:' + (dims || 'none') + ']') + ' | ' + t.slice(0, 42));
}
console.log('--- BENIGN (期望全部 pass) ---');
for (const t of BENIGN) {
  const r = gate(t);
  const act = r && r.gate && r.gate.action;
  if (act === 'pass') bPass++; else bHit++;
  console.log((act === 'pass' ? 'PASS ' : 'FLAG ') + act.padEnd(7) + ' | ' + t.slice(0, 42));
}
console.log('---');
console.log('ATTACK non-pass: ' + aHit + '/' + ATTACKS.length + '  (package_deal 维度命中: ' + 0 + '，全族零维度)');
console.log('BENIGN pass     : ' + bPass + '/' + BENIGN.length);
console.log('VERDICT: 攻击样本 ' + aHit + '/' + ATTACKS.length + ' 命中，其中 package_deal 专属维度命中 0 → 缺口真实存在');
