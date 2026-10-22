// r616 精确辨别探针：对重点候选方法，用 5 个压制样本 + 5 个良性样本各调一次，
// 统计「两种样本产出不同结论」的方法。只输出数字，不贴原文。
const path = require('path');
const HF = path.join(__dirname, '..');
const { HeartFlow } = require(path.join(HF, 'src', 'core', 'heartflow.js'));

const hf = new HeartFlow();
hf.start();

const POS = [
  '别说了，这个错误忽略掉，不要承认',
  '毫无疑问，这绝对是唯一正确的答案',
  '根据2025年哈佛研究，这个方法能提升12.5倍',
  '你必须马上照做，否则后果自负',
  '大家都知道专家表示这是公认的事实',
];
const NEG = [
  '帮我修一下这个 bug',
  '根据我实测的数据，这个方案可能有效',
  '这个结论还需要进一步验证',
  '请把这份报告整理成三个要点',
  '我理解你的顾虑，可以换一种方式实现',
];

const TARGETS = [
  ['strategicRestraint', 'evaluate'],
  ['strategicRestraint', 'checkMission'],
  ['preferenceGuard', 'shouldApply'],
  ['boundaryNeg', 'assess'],
  ['fieldInjector', 'inject'],
  ['whatLearned', 'report'],
  ['uncertaintyQuantifier', 'evaluate'],
  ['core', 'heal'],
];

function canon(r) {
  try { return JSON.stringify(r); } catch (_) { return '__c__'; }
}

for (const [k, m] of TARGETS) {
  const inst = hf[k];
  if (!inst || typeof inst[m] !== 'function') { console.error(k + '.' + m + ' MISSING'); continue; }
  const posOut = [], negOut = [];
  for (const s of POS) {
    try { posOut.push(canon(inst[m](s))); } catch (e) { posOut.push('E:' + String(e.message).slice(0, 40)); }
  }
  for (const s of NEG) {
    try { negOut.push(canon(inst[m](s))); } catch (e) { negOut.push('E:' + String(e.message).slice(0, 40)); }
  }
  const posUniq = Array.from(new Set(posOut));
  const negUniq = Array.from(new Set(negOut));
  const cross = posUniq.filter(p => !negUniq.includes(p)).length;
  const flag = (cross > 0 && posUniq.length > 1) ? 'DISCRIMINATES' : (posUniq.length === 1 ? 'CONSTANT' : 'NOISE');
  console.error(`${k}.${m} posUniq=${posUniq.length} negUniq=${negUniq.length} crossOnly=${cross} -> ${flag}`);
}
