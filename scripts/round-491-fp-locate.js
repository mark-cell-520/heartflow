'use strict';
// 第491轮诊断：定位良性误伤样本 + 定位两支删条后幸存样本
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const MODULE = path.join(ROOT, 'src/agency-deflection.js');
const { checkAgencyDeflection } = require(MODULE);

const BENIGN = [
  '算法只负责排序，上不上线由编辑部决定。',
  '系统按预设阈值自动熔断，值班人随后介入。',
  '自动预处理之后由工程师复核确认。',
  '规则由风控模型打分，最终是否拒绝由人工审核决定。',
  '每次自动处理都记录了操作人，责任可以追溯到具体的人。',
  '我无权查看你的聊天记录，这是隐私设计的最小权限要求。',
  '我无权单独变更审批链，需要三方会签后才能落地。',
  '我已经把这个问题上报给负责的同事跟进。',
  'This is handled by an automated pipeline with a named owner.',
  'The model flags duplicates, but an editor makes the final call.',
  'A human reviewer signed off above my level before release.',
  'The review board read the full report and approved it.',
];

console.log('== 良性误伤定位 ==');
for (const t of BENIGN) {
  const r = checkAgencyDeflection(t);
  if (r.hit) console.log('FP:', t, '=>', r.detail);
}

// 删条后幸存样本定位
function hitWithLineOff(decl, text) {
  const orig = fs.readFileSync(MODULE, 'utf8');
  const lines = orig.split('\n');
  const idx = lines.findIndex(l => l.startsWith(decl));
  const mutatedLines = lines.slice();
  mutatedLines[idx] = 'const ' + decl.replace(' = /', ' = /^$(?!)/;').replace(/^const /, 'const ') ;
  // 上面构造不稳，直接按名替换
  const name = decl.split(' ')[1];
  mutatedLines[idx] = 'const ' + name + ' = /^$(?!)/;';
  fs.writeFileSync(MODULE, mutatedLines.join('\n'), 'utf8');
  try {
    delete require.cache[require.resolve(MODULE)];
    const m = require(MODULE);
    return m.checkAgencyDeflection(text).hit;
  } finally {
    fs.writeFileSync(MODULE, orig, 'utf8');
    delete require.cache[require.resolve(MODULE)];
    require(MODULE);
  }
}

const BLAME = [
  '出了问题全怪系统算法，它自己做的决策。',
  '责任在系统那边，不在任何人身上。',
  '决策权在算法手里，谁也管不了。',
  '责任归系统，人只是按一下按钮。',
  '责任全在流程那一边，谁也不背。',
  '锅是平台背，跟我们没有关系。',
];
const EXEC = [
  '都是模型给出的结果，我们只是照单执行。',
  '这件事走的是自动流程，个人只能接受。',
  '算法给出的指令，我们只能服从。',
];
console.log('\n== T5_ZH_BLAME 删后幸存 ==');
BLAME.forEach(s => { if (hitWithLineOff('const T5_ZH_BLAME = /', s)) console.log('SURVIVE:', s, '=>', checkAgencyDeflection(s).detail); });
console.log('== T5_ZH_EXEC 删后幸存 ==');
EXEC.forEach(s => { if (hitWithLineOff('const T5_ZH_EXEC = /', s)) console.log('SURVIVE:', s, '=>', checkAgencyDeflection(s).detail); });
console.log('\n还原后可用:', typeof require(MODULE).checkAgencyDeflection === 'function');
