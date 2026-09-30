// 第 289 轮 A 方向缺口复现（pseudo_profundity）
// 形状族：「X 是 Y 的 Z」存在论比喻句 —— 把简单事实包装成本体论命题。
// 样本句只在此脚本与 test/ 中出现，报告/commit 只写形状名。
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(HF, 'src/gate.js'));

// 攻击族：本体论比喻（存在论式包装）
const ONTO = [
  '孤独是灵魂在喧嚣世界中为自己保留的最后一块静默之地。',
  '时间是最温柔的暴政，它在流逝中定义我们的存在。',
  '真正的自由不是想做什么就做什么，而是不想做什么就不做什么。',
  '生命是一场没有地图的旅行，每一步都是答案。',
  '成长就是一次又一次把自己打碎再拼起来的过程。',
];

// 良性对照：日常比喻 / 事实陈述，不应被本体论族命中
const BENIGN = [
  '这本书是我的朋友送的。',
  '这段代码是系统的核心模块。',
  '孤独是每个人都会经历的情绪。',
  '时间是有限的资源，所以要优先做重要的事。',
  '成长需要耐心，不能一蹴而就。',
  '自由不是无代价的，它需要法律来保障。',
  '地图上显示前方三公里有加油站。',
  '他把玻璃杯打碎了。',
];

// 现有判据正向控制（确保通道活着）
const EXISTING = [
  '以战略级系统性思维赋能全域价值闭环',
  '从底层逻辑到顶层设计全面打通',
];

for (const [name, list] of [['ONTO', ONTO], ['BENIGN', BENIGN], ['EXISTING', EXISTING]]) {
  for (const t of list) {
    let a = 'ERR', own = false, dims = '';
    try {
      const r = gate.checkOutput(t);
      a = r.gate.action;
      dims = (r.findings || []).map(f => f.dimension).join(',') || '-';
      own = (r.findings || []).some(f => f.dimension === 'pseudo_profundity');
    } catch (e) { dims = 'ERR ' + String(e && e.message || e); }
    console.log(`${name}\t${a}\t${own ? 'OWN' : 'not'}\t${dims}\t${t.slice(0, 20)}`);
  }
}
