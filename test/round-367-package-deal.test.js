// test/round-367-package-deal.test.js
// r367 第 260 维度 package_deal（一揽子谬误）轮测：
// 攻击命中 / 良性干净 / 负例注入承重 / 同族变体矩阵 / 边界不抢判 / gate 层进 findings
'use strict';
const path = require('path');
const { gate } = require(path.join(__dirname, '..', 'src', 'gate.js'));
const M = require(path.join(__dirname, '..', 'src', 'package-deal.js'));
const { checkPackageDeal, __internals: I } = M;

let pass = 0, fail = 0;
const failures = [];
function ok(cond, name, extra) {
  if (cond) { pass++; console.log('  ✅ ' + name); }
  else { fail++; failures.push(name); console.log('  ❌ ' + name + (extra ? ' | ' + extra : '')); }
}

// ── 攻击样本（中英双语、裸名词、带修饰、倒装、长句）────────────────
const ATTACKS = [
  '你要么全盘接受这套方案，要么就是完全不同意，没有中间地带',
  '支持环保的人必然也支持大政府，这是一整套左翼立场，不能拆开支持',
  '你不能只挑其中一条反对，要么整体认同要么整体否定，否则就是断章取义',
  '买这个品牌就得接受它的全部价值观，不能只买产品不认理念',
  '投他一票就等于认同他的全部政见，不能只认同其中一条',
  '不存在只认同其中几条的说法，这是一整套世界观，要么全收要么全弃',
  '这份宣言的每一条都相互关联，要么整体签认，要么就说明你根本不认同我们的运动',
  '这套理念是一揽子，要么统统接受要么统统丢掉',
  'You have to accept the whole package or reject it entirely; you cannot agree with just one part',
  'If you believe in free markets, you must also accept every other libertarian position — it is a package deal',
  'Taking issue with one item means rejecting the entire platform; it is all or nothing',
  'You cannot embrace the culture without accepting all of its traditions — it comes as a package',
  'Their platform is a package deal: you must endorse every plank or none of it',
  'This ideology is bundled together: you cannot reject one plank without rejecting the whole thing',
];

console.log('\n[r367 package_deal] 攻击样本（期望全部命中）');
let aHit = 0;
for (const t of ATTACKS) {
  const r = checkPackageDeal(t);
  if (r.count > 0) aHit++;
  else console.log('    MISS: ' + t.slice(0, 60));
}
ok(aHit === ATTACKS.length, 'r367: 攻击样本 ' + aHit + '/' + ATTACKS.length + ' 全部命中');

// gate 层验证（未接线时不得进 findings；接线后必须进）
let gateHit = 0;
for (const t of ATTACKS) {
  const g = gate(t);
  const inFindings = (g.findings || []).some(f => f.dimension === 'package_deal');
  if (inFindings && g.gate && g.gate.action !== 'pass') gateHit++;
}
console.log('    gate 层命中: ' + gateHit + '/' + ATTACKS.length);
ok(gateHit === ATTACKS.length, 'r367: gate 层 ' + gateHit + '/' + ATTACKS.length + ' 进 findings 且 action 非 pass');

// ── 良性样本（含边缘良性）──────────────────────────────────────────
const BENIGN = [
  '这套方案的几条措施各自独立，可以逐条评估，有的可以支持有的可以反对',
  'These are separate proposals and each one stands on its own merits',
  '你可以同意第一条而反对第二条，这完全不矛盾',
  'You can support the policy while disagreeing with how it was implemented',
  '这个产品确实附带一份用户协议，你需要整体接受才能使用',
  '我们签署的是一份完整合同，其中条款相互引用，不能拆开履行',
  '宪法是一整套根本法，修改需要遵循特定程序，不能逐条随意变更',
  '他同时持有这几个观点，但它们是分别论证的，并非捆绑在一起',
  'These principles are not a package deal; each argument stands independently',
  '这场改革包含多项措施，人大将逐条审议后分别表决',
];
console.log('\n[r367 package_deal] 良性样本（期望全部 pass）');
let bPass = 0;
for (const t of BENIGN) {
  const r = checkPackageDeal(t);
  if (r.count === 0) bPass++;
  else console.log('    FLAG: ' + t.slice(0, 60) + ' | ' + r.detail.slice(0, 50));
}
ok(bPass === BENIGN.length, 'r367: 良性样本 ' + bPass + '/' + BENIGN.length + ' 干净');

// ── 负例注入契约（每条承重常量置空后原命中样本须翻转）──────────────
console.log('\n[r367 package_deal] 负例注入契约');
const INJECTS = [
  ['腿① BIND_ZH', { BIND_ZH: [] }, '你要么全盘接受这套方案，要么就是完全不同意，没有中间地带'],
  ['腿② ALLORN_ZH', { ALLORN_ZH: [] }, '你要么全盘接受这套方案，要么就是完全不同意，没有中间地带'],
  ['腿① BIND_EN', { BIND_EN: [] }, 'You have to accept the whole package or reject it entirely; you cannot agree with just one part'],
  ['腿② ALLORN_EN', { ALLORN_EN: [] }, 'You have to accept the whole package or reject it entirely; you cannot agree with just one part'],
  ['豁免 SEPARATE_ZH', { SEPARATE_ZH: [] }, '可以逐条评估，有的可以支持有的可以反对，你要么全盘接受要么全盘否定'],
  ['豁免 LEGAL_ZH', { LEGAL_ZH: [] }, '这份合同不可拆分，你要么整体签认要么整体否定'],
  ['豁免 INSTITUTIONAL_ZH', { INSTITUTIONAL_ZH: [] }, '宪法是一整套根本法，你要么整体接受要么整体否定'],
  ['豁免 META_ZH', { META_ZH: [] }, '一揽子谬误就是把命题打包，你要么全盘接受要么全盘否定'],
  ['豁免 QUESTION_TAIL_RE', { QUESTION_TAIL_RE: /(?!)/ }, '你要不要全盘接受这套方案，要么整体认同要么整体否定？'],
];
let injectOk = 0;
for (const [name, R, sample] of INJECTS) {
  const base = checkPackageDeal(sample);
  const inj = checkPackageDeal(sample, R);
  const flip = base.count !== inj.count;
  if (flip) injectOk++;
  else console.log('    SAME: ' + name + ' base=' + base.count + ' inj=' + inj.count);
}
ok(injectOk === INJECTS.length, 'r367: 负例注入 ' + injectOk + '/' + INJECTS.length + ' 承重');

// ── 同族变体矩阵（≥5 变体，中英双语、裸名词、带修饰、倒装、长句）─────
console.log('\n[r367 package_deal] 同族变体矩阵');
const VARIANTS = [
  '一揽子，你要么全盘接受要么全盘否定，没有中间地带', // 裸名词形（腿①「一揽子」无后缀修饰）
  '这是一整套世界观，不存在只认同其中几条的说法',
  '要么整体签认，要么整体否定，这份宣言的每一条都相互关联（倒装：结论在前）',
  'It is a package deal: endorse every plank or none of it',
  'Bundled together — you cannot accept just one part without the whole',
  'You cannot reject one item of the entire platform and still call yourself a supporter',
];
let vHit = 0;
for (const t of VARIANTS) {
  const r = checkPackageDeal(t);
  if (r.count > 0) vHit++;
  else console.log('    MISS: ' + t.slice(0, 60));
}
ok(vHit >= 5, 'r367: 变体矩阵 ' + vHit + '/' + VARIANTS.length + ' 命中（保底 5）');

// ── 边界：不被既有维度抢判 + 不抢判既有维度 ────────────────────────
console.log('\n[r367 package_deal] 边界');
const FALSE_DILEMMA = '你要么支持这个政策，要么就是反对国家发展';
const fd = checkPackageDeal(FALSE_DILEMMA);
ok(fd.count === 0, '边界：false_dilemma 型样本（选项集压缩）不被本族抢判');

const fdGate = gate(FALSE_DILEMMA);
const fdDims = (fdGate.findings || []).map(f => f.dimension);
ok(!fdDims.includes('package_deal'),
  '边界：false_dilemma 样本（选项集压缩）不被本族抢判（实际命中 ' + fdDims.join('/') + '，射程互斥）');

// ── 合约：未命中返回零分对象而非 null ─────────────────────────────
const zero = checkPackageDeal('今天天气不错，我们出去散步吧');
ok(zero && typeof zero === 'object' && zero.count === 0 && zero.verdict === 'pass',
  '合约：未命中返回零分对象而非 null');

const q = checkPackageDeal('你要不要全盘接受这套方案？');
ok(q.count === 0, '合约：疑问句不判');

console.log('\n[r367 package_deal] 汇总: ' + pass + ' passed / ' + fail + ' failed');
if (fail > 0) { console.log('失败项: ' + failures.join('; ')); process.exit(1); }
