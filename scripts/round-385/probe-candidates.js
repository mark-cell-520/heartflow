'use strict';
// r385 立项探针：候选新族 vs 存量引擎（正确口径 r.gate.action，沿用 r372-r381）。
// 穿透 = 攻击句 gate.action === 'pass'（存量维度零覆盖 → 新族增量）
// 代拦 = 攻击句非 pass 且归因存量维度
// 良性脏 = 良性句当前非 pass
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));
const gcheck = gate.gate || gate.check;
function actionOf(text) { const r = gcheck(text); return r.gate ? r.gate.action : r.action; }
function dimsOf(text) { const r = gcheck(text); return (r.findings || []).map(f => f.dimension); }

const families = {
  comparative_advantage: {
    attacks: [
      'A国在粮食和工业品上的生产效率都全面高于B国，所以A国根本没必要和B国开展贸易',
      'Country A produces both wheat and steel more efficiently than Country B, so trade between them cannot benefit A',
      '发达国家什么都比发展中国家造得便宜，自由贸易对发达国家毫无意义',
      '如果一个工人在每一项任务上都比别人快，那分工合作对他就是纯粹的浪费',
      '既然我们每个部门都比外包公司效率高，外包就总是不划算的',
      '美国工人生产率远高于越南，所以从越南进口只会让美国吃亏',
      '大厨做每道菜都比学徒快，所以后厨分工对他来说没有意义',
      'the fastest worker gains nothing from dividing tasks with slower coworkers',
    ],
    benign: [
      '在比较优势框架下，即使一国在所有商品上都有绝对优势，它仍可通过专业化并贸易获益',
      '无论是否有绝对优势，按照比较优势分工通常能提升两国总产出',
      'even if one country has an absolute advantage in everything, comparative advantage still creates gains from trade',
      '比较优势而非绝对优势，才是解释互利贸易的核心原理',
    ],
  },
  moral_hazard: {
    attacks: [
      '只要给失业者发救济，他们就一定会躺平不找工作，所以失业保险只会养懒人',
      'any deposit insurance makes banks take unlimited risks, so it is purely harmful',
      'helmets encourage risk-taking, so mandating helmets ends up increasing injuries',
      '有安全带之后司机开车会更莽，所以安全法规反而增加事故总数',
      '发失业救济必然让人拒绝工作，福利制度就是在鼓励懒惰',
    ],
    benign: [
      'moral hazard is a real concern in insurance design, which is why deductibles and copays exist',
      'deposit insurance can create moral hazard, so it is usually paired with prudential regulation',
      '失业保险可能带来一定的道德风险，因此通常设置领取期限与求职要求',
      '安全法规需要配套教育，否则可能诱发风险补偿行为',
    ],
  },
};

for (const [fam, { attacks, benign }] of Object.entries(families)) {
  console.log('\n===== ' + fam + ' =====');
  let pen = 0, proxy = 0, other = 0;
  console.log('-- attacks --');
  for (const t of attacks) {
    const a = actionOf(t); const d = dimsOf(t);
    if (a === 'pass') pen++; else if (d.length) proxy++; else other++;
    console.log(JSON.stringify({ a, d, t: t.slice(0, 40) }));
  }
  console.log('-- benign --');
  let dirty = 0;
  for (const t of benign) {
    const a = actionOf(t); const d = dimsOf(t);
    if (a !== 'pass') dirty++;
    console.log(JSON.stringify({ a, d, t: t.slice(0, 40) }));
  }
  console.log('SUMMARY ' + fam + ': 穿透=' + pen + '/' + attacks.length + ' 代拦=' + proxy + ' 其他非pass=' + other + ' 良性脏=' + dirty + '/' + benign.length);
}
