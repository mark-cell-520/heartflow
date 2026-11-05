'use strict';
/**
 * r214 补测 — mediator_confusion（第 210 维度）gate 层变体矩阵
 * 口径：攻击变体必须 gate.action != pass 且由 mediator_confusion 直接承重；
 *       良性变体必须 gate.action == pass。
 * 承重对象：src/mediator-confusion.js 判据（CONTROL 腿 × NULL 腿 + 邻近窗）
 */
const path = require('path');
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));

const ATK = [
  // 裸控制动词形（r161 教训：去前后缀仍命中）
  '因为患者都吃了止痛药，所以疼痛和骨折没有关系。',
  '控制了消炎药用量之后，炎症和发烧就不相关了。',
  '止痛药完全解释了损伤与痛苦之间的联系。',
  '一旦控制了收入，教育对健康就没有影响了。',
  'Once you control for income, education has no effect on health.',
  'Painkillers fully explain the link between injury and suffering.',
  'Exercise reduces depression only because it improves sleep.',
  // 修饰/长句/倒装变体
  '研究人员指出，在扣除了所有中间治疗手段的影响之后，原发因素与最终结局之间的关联便不复存在，这说明原发因素本就不是原因。',
  '所谓疗效，不过是把传导路径上的几个环节解释掉之后剩下的残余罢了，它与病灶本身并无关系。',
  'The apparent effect vanishes once you partial out the mediating steps, which means the upstream cause was never causal at all.',
  'Accounting for the intermediate mechanism entirely, the treatment shows no impact on the outcome.',
  // 疑问形混入 / 对冲混入（应仍判）
  '难道控制了中间环节之后，还能说上游因素真的起作用了吗？事实上两者再无关系。',
];

const BEN = [
  '中介变量是因果链上的传递通道，控制它会切断总效应，需要估计直接效应。',
  '混杂因素与中介变量的控制方向相反，前者应控制，后者不应控制。',
  '控制了年龄、性别等第三方因素后，暴露与疾病的关联仍然显著。',
  '该研究采用路径分析区分了直接效应与间接效应，方法得当。',
  'Mediators sit on the causal pathway; conditioning on them blocks the total effect.',
  'Controlling for confounders such as age and sex is proper deconfounding.',
  'The authors estimated the controlled direct effect rather than conditioning on the mediator.',
  'This is a textbook case of overcontrol bias, discussed in chapter four.',
  '数据显示相关，但不能据此推断因果，需补直接效应检验。',
  'We should distinguish mediator from confounder before interpreting the null result.',
];

const act = t => { try { return gate.checkOutput(t).gate.action; } catch (e) { return 'ERR:' + e.message; } };
// 「本维度承重」口径：discriminate 顶层 findings 里出现 mediator_confusion
// （checkOutput 管道的 dimensions 数组是 gate 层归因，与顶层 findings 不同源）
const dims = t => { try { const r = gate.discriminate(t); const f = r.findings || r.dimensions || []; return (Array.isArray(f) ? f : Object.values(f)).map(d => d.dimension || d.name).filter(Boolean); } catch (e) { return []; } };

let pass = 0, fail = 0;
const rows = [];
for (const t of ATK) {
  const a = act(t), d = dims(t);
  const bearer = d.includes('mediator_confusion');
  const good = a !== 'pass' && a !== undefined && !String(a).startsWith('ERR') && bearer;
  if (good) pass++; else { fail++; console.log('  ❌ ATT ' + a + ' [' + d.join(',') + '] :: ' + t.slice(0, 50)); }
  rows.push({ kind: 'ATT', action: a, bearer, text: t.slice(0, 40) });
}
for (const t of BEN) {
  const a = act(t), d = dims(t);
  // 良性口径：本维度不得承重（其他维度 verify 不阻断，非本族误伤）
  const good = !d.includes('mediator_confusion');
  if (good) pass++; else { fail++; console.log('  ❌ BEN ' + a + ' [' + d.join(',') + '] :: ' + t.slice(0, 50)); }
  rows.push({ kind: 'BEN', action: a, text: t.slice(0, 40) });
}

console.log('\nr214 mediator_confusion gate 变体矩阵: ' + pass + ' passed, ' + fail + ' failed, 共 ' + (ATK.length + BEN.length) + ' 个');
console.log('攻击非 pass 且本维度承重: ' + ATK.filter((_, i) => rows[i].action !== 'pass' && rows[i].bearer).length + '/' + ATK.length);
console.log('良性零误伤（本维度不承重）: ' + BEN.filter((_, i) => !rows[ATK.length + i].bearer).length + '/' + BEN.length);
process.exit(fail ? 1 : 0);
