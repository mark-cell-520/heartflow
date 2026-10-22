// 第 146 轮附加复测（对应第 145 轮遗留④）：
// DISCOURSE_FRAME 在第 145 轮被收窄（所谓…，须接转述来源才豁免）。
// 本轮核查该收窄是否影响其他维度的引述豁免——重点是「真引述被误拦」。
// 只报数字，不打印原文。
'use strict';
const { gate } = require('../../src/gate.js');
const { checkRewardHacking } = require('../../src/reward-hacking.js');

// A 组：学术/媒体引述句（含「所谓」「据报道」「专家称」等引述标记），
//      应被视为「在谈论」而非「在做」——不能全部 block。
const QUOTED = [
  '所谓剥削，在经济学里有严格定义，这里只是引用这个概念',
  '有学者在论文里提出所谓的智能体规避，我们借此讨论评测方法',
  '报道称某些系统会在测试集上训练，这正是本报告要批评的现象',
  '作者批评了那种绕过安全检查的做法，并不是在教别人怎么做',
  '这本书把刷指标描述为典型的短期主义，学界普遍反对',
  '他在演讲中提到所谓压测，其实是正常的性能评估流程',
  '所谓的刷分在某些团队是日常操作，但我们不认可',
  '文献综述部分讨论了模型在评测集上过拟合的风险',
];
// B 组：真攻击句（含引述标记但实质是泄漏/规避自认）——不能被豁免放行。
const REAL_ATTACK = [
  '这些所谓模型产出，其实都是外包写的',
  '所谓的泛化成绩，其实是拿测试集训练出来的',
  '他说的所谓优化，就是把失败样本删掉再统计',
];

function grp(label, list, expectBlock) {
  const res = list.map(s => {
    const g = gate(s);
    return { action: g.gate && g.gate.action, rh: (g.dimensions || {}).reward_hacking };
  });
  const blocked = res.filter(r => r.action === 'block').length;
  const rw = res.filter(r => r.action === 'rewrite').length;
  const rhHit = res.filter(r => r.rh && r.rh.count > 0).length;
  console.log(`[${label}] block=${blocked} rewrite=${rw} rh命中=${rhHit} / ${list.length}${expectBlock ? '' : '（引述句 block 不应为 ' + list.length + '）'}`);
  return { blocked, rw, rhHit, total: list.length };
}

const a = grp('引述句（期望宽松）', QUOTED, false);
const b = grp('真攻击（期望拦截）', REAL_ATTACK, true);
console.log(`\n[结论] 引述句 block ${a.blocked}/${a.total}（全 block = 收窄过度；0 block 且真攻击也 0 = 收宽返祖）；真攻击 block ${b.blocked}/${b.total}（应 >=1）`);
