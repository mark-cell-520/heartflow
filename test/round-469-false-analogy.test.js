// test/round-469-false-analogy.test.js
// 第 291 维度 false_analogy（虚假类比论证）单测：负例注入 + 豁免 + 变体矩阵
'use strict';

const path = require('path');
const assert = require('assert');
const { checkFalseAnalogy, __internals } = require('../src/false-analogy.js');

let pass = 0, fail = 0;
function ok(cond, name) {
  if (cond) { pass++; } else { fail++; console.error(`FAIL: ${name}`); }
}

// ── 1. 攻击族：三腿共现全部命中 ──────────────────────────────────
const attacks = [
  ['国家×家庭·财政', '管理一个国家就像管理一个家庭，家庭能省则省，所以国家也应该紧缩开支。'],
  ['人体×机器·换器官', '人体就像一台机器，机器坏了要换零件，所以人老了也该把器官换掉。'],
  ['软件×建筑·地基', '这个软件项目就像建房子，房子要先打好地基，所以我们必须先写完所有设计文档。'],
  ['市场×丛林', '市场经济就像丛林，丛林里弱肉强食，所以企业就该把对手全部吞掉。'],
  ['裸名词·好比', '公司好比一个生物体，生物体会自然进化，因此公司一定会越变越好。'],
  ['倒装·目标域先行', '国家治理就该像管理家庭一样，家里要勤俭节约，所以国家也要节衣缩食。'],
  ['带修饰·长定语', '一个团队的工作方式非常像一个交响乐团，乐团里各声部分工协作，因此团队也必须严格分工。'],
  ['长句·多分句', '从本质上说，现代企业的运营管理如同一台精密的机器，机器出现故障时就要更换损坏的零件，所以企业在人员老化时也应该果断换血。'],
  ['跟…一样·军队', '团队协作跟一支军队没有什么区别，军队里令行禁止，所以团队里也必须绝对服从。'],
  ['把…比作·源域名词', '把国家比作家庭，家庭量入为出，所以国家也要收支平衡。'],
  ['EN country×household', 'Running a country is just like running a household, and a household saves money, so the nation should cut spending too.'],
  ['EN company×organism', 'A company is like a living organism, and organisms evolve, so companies will naturally get better over time.'],
  ['EN body×machine', 'The human body works like a machine, and a machine replaces broken parts, so we should replace worn-out organs.'],
  ['EN same way as', 'Managing a firm works the same way as driving a car, and a car needs fuel to move, so a firm needs constant cash injection.'],
  ['EN economy×jungle', 'The free market is as if it were a jungle, where the stronger firms win, therefore weaker competitors must be eliminated.'],
  ['EN bare noun×as if', 'Education is like building a house: the house lays a foundation first, hence every child must master the basics before anything else.'],
  // [r470] 腿② PROP_EN 补族样本：家用财务 / 存储数据 / 容器灌注 / 燃料
  ['EN household budget works', 'Running a country is just like running a household, so what works for a family budget works for the nation too.'],
  ['EN computers store data', 'The brain works the same way as a computer, and computers store data in files, so memories must be stored in specific brain regions.'],
  ['EN empty vessels filled', 'Treat students as if they were empty vessels to be filled with knowledge, so lecturing is the only method needed.'],
  ['EN engines need fuel', 'The economy works like an engine, and engines need fuel, so the economy needs constant money printing.'],
  // [r470] 腿① ANALOGY_ZH 补族样本：「与…作类比」形
  ['ZH 将…与…作类比', '我们可以将学习与登山作类比，登山要一级一级爬，所以学习也必须一页一页慢慢来。'],
  // [r470] 腿② PROP_ZH 补族样本：行为规训源域属性
  ['ZH 把…比作·行为规训', '把国家比作一个家庭，家里管孩子要严格，所以国家管国民也要严格。'],
];
for (const [name, text] of attacks) {
  const r = checkFalseAnalogy(text);
  ok(r.hit === true && r.score >= 0.5, `攻击应命中: ${name} (hit=${r.hit}, score=${r.score})`);
}
ok(attacks.length === 22, '攻击族样本数应为 22');

// ── 2. 良性族：全部豁免 ──────────────────────────────────────────
const benign = [
  ['边缘良性·多因正确陈述', '战争纯粹是因为资源争夺，也因为领土争端和民族矛盾，是多因共同造成的。'],
  ['类比失效指出', '把国家比作家庭是一种常见的虚假类比，国家能发行货币而家庭不能，二者不能混为一谈。'],
  ['类比喻限声明', '团队就像一个交响乐团（打个比方，形象地说），乐手们各司其职，配合十分默契。'],
  ['概念教学', '教材上讲，虚假类比谬误是指用一个不恰当的类比来支撑结论，比如把国家比作家庭。'],
  ['对冲结论', '公司可能就像一个生物体，也许它会自然进化，因此大概会越变越好吧。'],
  ['疑问句', '管理国家真的就像管理家庭吗？所以国家也应该省吃俭用？'],
  ['无迁移结论', '这个软件项目就像建房子，房子需要先打地基，设计工作确实很复杂。'],
  ['类比失效·不等于', '国家就像一个家庭，但家庭预算不等于国家财政，所以不能据此推出紧缩结论。'],
  ['EN 失效指出', 'A company is like an organism, but that analogy is limited and does not mean companies will necessarily improve.'],
  ['EN 教学', 'The textbook defines false analogy as an argument that relies on a misleading comparison.'],
  ['EN 对冲', 'An economy is like a jungle, perhaps the stronger firms may win, so maybe competition should be encouraged.'],
  ['EN 疑问', 'Is the human body like a machine? Should we therefore replace worn-out organs?'],
  ['EN 无结论', 'The body works like a machine, and a machine replaces broken parts, which is why maintenance matters.'],
  // [r470] 良性负例：新补词族不可误伤
  ['良性·家用财务非类比', '这个月的家庭预算很紧张，所以我们下个月要少出去吃饭。'],
  ['良性·存储机制非类比', '电脑把数据存在文件里，所以备份的时候要连文件夹一起拷贝。'],
  ['良性·教学转述·空容器', '教育学上常把学生比作空容器，这个比喻早就被建构主义批评了。'],
  ['良性·疑问·燃料', '经济真的像一台需要不断加燃料的引擎吗？'],
];
for (const [name, text] of benign) {
  const r = checkFalseAnalogy(text);
  ok(r.hit === false, `良性应豁免: ${name} (hit=${r.hit}, detail=${r.detail})`);
}
ok(benign.length === 17, '良性族样本数应为 17');

// ── 3. 负例注入：逐腿删条验证承重 ───────────────────────────────
const I = __internals();
// [r469] 注入口径说明：ANALOGY_ZH 只删中文腿时英文攻击仍走 ANALOGY_EN
// 正常承重（反之亦然），故语言腿注入须中英同删才算「删腿①」；单删一侧
// 的期望值按「另一侧攻击数」计（10 中文 + 6 英文）。
const ZH_N = attacks.filter(([, t]) => /[\u4e00-\u9fff]/.test(t)).length;
const EN_N = attacks.length - ZH_N;
function hitsWith(inject) {
  let n = 0;
  for (const [, text] of attacks) { if (checkFalseAnalogy(text, inject).hit) n++; }
  return n;
}
const base = hitsWith({});
ok(base === 22, `零注入基线应 22/22，实测 ${base}`);
// 删腿①（类比桥）：中英全删后应全失击；单删中文腿时英文攻击仍承重
const noA_Both = hitsWith({ ANALOGY_ZH: [], ANALOGY_EN: [] });
ok(noA_Both === 0, `中英类比桥全删后攻击应 0，实测 ${noA_Both}`);
ok(hitsWith({ ANALOGY_ZH: [] }) === EN_N, `删 ANALOGY_ZH 后仅英文攻击承重 (${EN_N})`);
ok(hitsWith({ ANALOGY_EN: [] }) === ZH_N, `删 ANALOGY_EN 后仅中文攻击承重 (${ZH_N})`);
// 删腿②（源域属性）：中英全删后应全失击
const noP_Both = hitsWith({ PROP_ZH: [], PROP_EN: [] });
ok(noP_Both === 0, `中英源域属性全删后攻击应 0，实测 ${noP_Both}`);
ok(hitsWith({ PROP_ZH: [] }) === EN_N, `删 PROP_ZH 后仅英文攻击承重 (${EN_N})`);
ok(hitsWith({ PROP_EN: [] }) === ZH_N, `删 PROP_EN 后仅中文攻击承重 (${ZH_N})`);
// 删腿③（推断词 + 迁移情态）：中英全删后应全失击
const noTailBoth = hitsWith({ INFER_ZH: [], MODAL_ZH: [], INFER_EN: [], MODAL_EN: [] });
ok(noTailBoth === 0, `中英迁移结论全删后攻击应 0，实测 ${noTailBoth}`);
// 删目标域名词（腿③复现腿）：中英全删后应大幅失击（退回路由二无目标
// 域腿仍可命中 ZH1/ZH4 等源域名词形，故期望 ≤6 而非 0）
const noT_Both = hitsWith({ TARGET_ZH: [], TARGET_EN: [] });
ok(noT_Both <= 6, `中英目标域名词全删后攻击应 ≤6，实测 ${noT_Both}`);
// 删豁免组：攻击命中数应不降（豁免只影响良性）
ok(hitsWith({ EXEMPT_CONCEPT_ZH: [] }) === 22, '删概念豁免不影响攻击命中');
ok(hitsWith({ EXEMPT_NEG_ZH: [] }) === 22, '删否定豁免不影响攻击命中');
// 豁免恢复：良性仍全豁免
ok(benign.every(([, t]) => !checkFalseAnalogy(t).hit), '良性豁免稳定');

// ── 4. 输入守卫 ─────────────────────────────────────────────────
ok(checkFalseAnalogy(null).hit === false, 'null 输入不崩');
ok(checkFalseAnalogy(undefined).hit === false, 'undefined 输入不崩');
ok(checkFalseAnalogy(42).hit === false, 'number 输入不崩');
ok(checkFalseAnalogy({ a: 1 }).hit === false, 'object 输入不崩');
ok(checkFalseAnalogy('').hit === false, '空串不命中');
ok(checkFalseAnalogy('短').hit === false, '过短文本不命中');
// 可计数字段契约
const r0 = checkFalseAnalogy(attacks[0][1]);
ok(typeof r0.count === 'number' && r0.count >= 1, 'count 字段为数字');
ok(typeof r0.detail === 'string' && r0.detail.length > 0, 'detail 字段非空');

console.log(`\nround-469 false_analogy: ${pass} passed, ${fail} failed`);
assert.strictEqual(fail, 0, `${fail} 个断言失败`);
console.log('OK');
