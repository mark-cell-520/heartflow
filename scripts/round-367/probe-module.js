// r367 模块层直调验证：package_deal 判据承重 + 豁免 + 负例注入契约
const M = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/package-deal.js');
const { checkPackageDeal, __internals: I } = M;

const ATTACKS = [
  '你要么全盘接受这套方案，要么就是完全不同意，没有中间地带',
  '支持环保的人必然也支持大政府，这是一整套左翼立场，不能拆开支持',
  '你不能只挑其中一条反对，要么整体认同要么整体否定，否则就是断章取义',
  '买这个品牌就得接受它的全部价值观，不能只买产品不认理念',
  '投他一票就等于认同他的全部政见，不能只认同其中一条',
  'You have to accept the whole package or reject it entirely; you cannot agree with just one part',
  'If you believe in free markets, you must also accept every other libertarian position — it is a package deal',
  'Taking issue with one item means rejecting the entire platform; it is all or nothing',
  'You cannot embrace the culture without accepting all of its traditions — it comes as a package',
  '在这场辩论中，我们必须明确一点：这份宣言的每一条都相互关联，你要么整体签认，要么就说明你根本不认同我们的运动',
  '不存在只认同其中几条的说法，这是一整套世界观，要么全收要么全弃',
  'Their platform is a package deal: you must endorse every plank or none of it',
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
  'These principles are not a package deal; each argument stands independently',
  '这场改革包含多项措施，人大将逐条审议后分别表决',
];

console.log('=== ATTACKS (期望全部命中) ===');
let aHit = 0;
for (const t of ATTACKS) {
  const r = checkPackageDeal(t);
  const ok = r.count > 0;
  if (ok) aHit++;
  console.log((ok ? 'HIT  ' : 'MISS ') + 'score=' + String(r.score).padEnd(3) + ' n=' + r.count +
    (r.exempt_reason ? ' EXEMPT:' + r.exempt_reason : '') + ' | ' + t.slice(0, 46));
}
console.log('=== BENIGN (期望全部 pass) ===');
let bPass = 0;
for (const t of BENIGN) {
  const r = checkPackageDeal(t);
  const ok = r.count === 0;
  if (ok) bPass++;
  console.log((ok ? 'PASS ' : 'FLAG ') + 'score=' + String(r.score).padEnd(3) + ' | ' + t.slice(0, 46));
}
console.log('=== 汇总 ===');
console.log('ATTACK hit: ' + aHit + '/' + ATTACKS.length);
console.log('BENIGN pass: ' + bPass + '/' + BENIGN.length);

console.log('\n=== 负例注入契约（每条腿置空后原命中样本须翻转） ===');
const INJECTS = [
  ['BIND_ZH', { BIND_ZH: [] }, '你要么全盘接受这套方案，要么就是完全不同意，没有中间地带'],
  ['ALLORN_ZH', { ALLORN_ZH: [] }, '你要么全盘接受这套方案，要么就是完全不同意，没有中间地带'],
  ['BIND_EN', { BIND_EN: [] }, 'You have to accept the whole package or reject it entirely; you cannot agree with just one part'],
  ['ALLORN_EN', { ALLORN_EN: [] }, 'You have to accept the whole package or reject it entirely; you cannot agree with just one part'],
  ['SEPARATE_ZH', { SEPARATE_ZH: [] }, '这套方案的几条措施各自独立，可以逐条评估，有的可以支持有的可以反对'],
  ['LEGAL_ZH', { LEGAL_ZH: [] }, '这个产品确实附带一份用户协议，你需要整体接受才能使用'],
  ['INSTITUTIONAL_ZH', { INSTITUTIONAL_ZH: [] }, '宪法是一整套根本法，修改需要遵循特定程序，不能逐条随意变更'],
  ['QUESTION_TAIL_RE', { QUESTION_TAIL_RE: /(?!)/ }, '你要不要全盘接受这套方案，要么整体认同要么整体否定？'],
];
let injectOk = 0;
for (const [name, R, sample] of INJECTS) {
  const base = checkPackageDeal(sample);
  const inj = checkPackageDeal(sample, R);
  const flip = base.count !== inj.count;
  if (flip) injectOk++;
  console.log((flip ? 'FLIP ' : 'SAME ') + name.padEnd(20) + ' base=' + base.count + ' inj=' + inj.count + ' | ' + sample.slice(0, 36));
}
console.log('注入翻转: ' + injectOk + '/' + INJECTS.length);
