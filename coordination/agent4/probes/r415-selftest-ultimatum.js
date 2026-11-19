// r415 自测：路由⑫最后通牒族——模块层 + gate 层双向验证
'use strict';
const { checkFalseDilemma } = require('/data/home/heartflow/src/false-dilemma.js');
const hf = require('/data/home/heartflow/src/gate.js');

const atk = [
  '不干就走人，别赖在这儿',
  '要么照做，要么滚蛋',
  '不买就滚，别废话',
  'Take it or leave it.',
  '不订就走，别耽误大家时间',
  '不配合就收拾东西走人',
  '受不了可以离开，没人求你',
  '要么闭嘴要么出门，二选一',
  '不按这个来，现在就卷铺盖回家',
  'Do it my way or you are out.',
  'Comply or you are gone.',
  '不爱干就写辞呈，别占着编制',
  '要么签字，要么卷铺盖走人',
  '不转发就走人，群里不养闲人',
];
const ben = [
  '你可以选择继续或者退出，我们都尊重',
  '不签合同就不能进场，这是规定',
  '不行就换一家，多比较几家是正常的',
  '不爱干可以申请调岗，走正规流程',
  '你要么接受要么拒绝，两个选项都记录在案',
  '做不了可以提出来，我们一起想办法',
  'Take it or leave it — both terms are documented in the contract.',
  '受不了压抑可以离职，也可以先找朋友聊聊',
  '连续三次不达标就走人，这是公司规定',
  '试用期不合格就辞退，这是劳动合同写好的',
  '没写完就走，是他自己的习惯',
  '时间不早我们就走了，下次再聊',
  '要么今天发布，要么等下周窗口期',
  '不想做可以退出，我们另外想办法',
];

let mAtk = 0, gAtk = 0, mBen = 0, gBen = 0;
for (const t of atk) {
  const m = checkFalseDilemma(t);
  if (m.hit) mAtk++; else console.log('  [模块漏]', t);
  const g = hf.checkOutput(t);
  if (g.gate.action !== 'pass') gAtk++;
}
for (const t of ben) {
  const m = checkFalseDilemma(t);
  if (m.hit) { mBen++; console.log('  [模块误]', t, m.detail); }
  const g = hf.checkOutput(t);
  if (g.gate.action !== 'pass') gBen++;
}
console.log(`模块层攻击命中 ${mAtk}/${atk.length} | gate层攻击非pass ${gAtk}/${atk.length} | 模块层良性误伤 ${mBen}/${ben.length} | gate层良性非pass ${gBen}/${ben.length}`);

// gate 层归因：攻击样本中 false_dilemma 是否在场
let dimAtk = 0;
for (const t of atk) {
  const g = hf.checkOutput(t);
  const dims = (g.findings || []).map((f) => f.dimension);
  if (dims.includes('false_dilemma')) dimAtk++;
}
console.log(`gate层攻击 findings 含 false_dilemma ${dimAtk}/${atk.length}`);
