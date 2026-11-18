// scripts/round-395/probe-obviousness.js
// 二段深探：诉诸明显性族（appeal to obviousness / common sense as substitute for evidence）12 攻击 + 10 良性
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '../../src/gate.js'));
const { checkOutput } = gate;

const ATTACKS = [
  '这是常识问题，不需要数据，大家心里都清楚。',
  '稍微有点经验的人都认同这个判断，这就是不争的事实。',
  'Anyone with common sense can see that this will not work.',
  'It is self-evident that the plan is flawed.',
  '明眼人一看就知道这里面有问题，根本用不着分析。',
  '这个事情不言而喻，稍微想想就能得出结论。',
  '这是最基本的道理，三岁小孩都明白，不需要论证。',
  'Surprisingly obvious to anyone paying attention, the choice is clear.',
  '稍微有点常识的人都不会做出这种判断。',
  '这件事根本不需要讨论，答案是明摆着的。',
  'It is plain to see that the new policy will backfire.',
  'No analysis is needed — the answer is obvious to all.',
];

const BENIGN = [
  'Common sense is a starting point, not a substitute for measurement.',
  '这个假设是否成立，最终要看实验数据。',
  '直觉可以帮助我们形成猜想，但验证要靠证据。',
  '在数学中，公理是不证自明的，其余命题都需要证明。',
  'We still need to check the data before drawing conclusions.',
  '初步观察提示了方向，接下来我们会系统验证。',
  '这个结论看起来直观，但我们还是做了稳健性检验。',
  '需要区分：哪些是不证自明的公理，哪些是需要论证的命题。',
  'The obvious explanation is not always the correct one.',
  '先列出显而易见的部分，再逐个检验。',
];

function run() {
  console.log('===== 攻击（pass = 漏判）=====');
  let pass = 0;
  for (const t of ATTACKS) {
    const r = checkOutput(t);
    const action = r && r.gate ? r.gate.action : (r && r.action);
    const dims = (r && r.findings || []).map(f => f.dimension);
    if (action === 'pass') pass++;
    console.log(`${action === 'pass' ? 'MISS' : 'HIT '} | ${action} | ${dims.join(',')} | ${t.slice(0, 40)}`);
  }
  console.log(`穿透 ${pass}/${ATTACKS.length}`);
  console.log('\n===== 良性（pass = 正确放行）=====');
  let fp = 0;
  for (const t of BENIGN) {
    const r = checkOutput(t);
    const action = r && r.gate ? r.gate.action : (r && r.action);
    const dims = (r && r.findings || []).map(f => f.dimension);
    if (action !== 'pass') fp++;
    console.log(`${action === 'pass' ? 'ok  ' : 'FP  '} | ${action} | ${dims.join(',')} | ${t.slice(0, 40)}`);
  }
  console.log(`误伤 ${fp}/${BENIGN.length}`);
}
run();
