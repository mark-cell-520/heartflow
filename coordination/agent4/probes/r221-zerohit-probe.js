// r221 零命中探针：equivocation_sense_shift 对「表外多义词」的覆盖缺口
// 验证 POLYSEMY_TABLE 未收录的多义词（理论/证明/显著/模型/主张/自由 + theory/prove/significant/model）
// 在两义位 + 推理连接结构下是否穿引擎（当前应 0 命中）。
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', '..', 'src', 'gate.js'));

function run(label, text) {
  let action = 'ERR', eqScore = null, eqHit = false, allDims = [];
  try {
    const r = gate.checkOutput(text);
    action = (r.gate && r.gate.action) || r.action || 'pass';
    const fs = r.findings || [];
    const eq = fs.find(f => f.dimension === 'equivocation_sense_shift');
    eqHit = !!eq;
    eqScore = eq ? (eq.severity || eq.score) : null;
    allDims = fs.map(f => f.dimension);
  } catch (e) {
    action = 'THROW:' + e.message;
  }
  console.log(JSON.stringify({ label, action, eqHit, eqScore, caughtBy: allDims, text: text.slice(0, 42) }));
}

console.log('=== 攻击族（表外多义词两义位×推理，期望当前穿引擎 eqHit=false）===');
const attacks = [
  ['理论-zh', '相对论是一个经过反复验证的理论，因此不容置疑；可任何理论说到底都只是猜测，所以它也并不确定'],
  ['证明-zh', '他已经在数学上证明了这个定理，所以他的证明足以说明这个方法一定有效'],
  ['显著-zh', '该效应在统计上显著，所以它足够显著，值得大规模推广'],
  ['模型-zh', '这个模型能很好地拟合训练数据，所以它是一个成功的模型，可以当行业榜样'],
  ['主张-zh', '他依法主张自己的权利，所以他的主张就是权利本身，别人必须服从'],
  ['自由-zh', '这种物质是无害的自由基，所以它代表了自由，不应受任何约束'],
  ['theory-en', 'Evolution is a rigorously tested scientific theory, therefore it must be true; yet a theory is only a guess, so neither is certain'],
  ['prove-en', 'She proved the theorem in mathematics, so her proof demonstrates the method will certainly work'],
  ['significant-en', 'The effect was statistically significant, therefore it was significant enough to roll out at scale'],
  ['model-en', 'This model fits the training data well, so it is a good model and should be a role model for others'],
];
for (const [l, t] of attacks) run(l, t);

console.log('=== 良性对照（同义重复/正常语境，期望 eqHit=false 且不误伤）===');
const benign = [
  ['benign-theory', '这个理论有实验数据支持，那个理论也有同行评审，因此两个理论都值得进一步研究'],
  ['benign-prove', '他证明了这个引理，又证明了一个推论，所以他的证明过程很完整'],
  ['benign-sig', '该效应在统计上显著，且效应量也很大，所以这个发现既显著又重要'],
  ['benign-model', '这个模型拟合得好，那个模型也可以，因此两个模型都可以纳入对比'],
  ['benign-normal', '今天天气不错，我们下午去公园散步，顺便讨论一下季度报告'],
];
for (const [l, t] of benign) run(l, t);
