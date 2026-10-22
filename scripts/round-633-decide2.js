// r633: decision 本体选方向 v2 —— 补入可区分判据：
// T1 辨别覆盖面（该方法是否对「文本/行为」做判别而非仅状态记录）
// T2 方法可零抛调用率（实测真实跑的调用成功率，非静态方法数）
// T3 与心虫「辨别者第1层」身份相关度（能否直接支撑判对错）
const fs = require('fs');
const path = require('path');
const { HeartFlow } = require('../src/core/heartflow.js');

// T1 标注：'D'=直接辨别文本/行为，'S'=状态记录/自省，'I'=基础设施
const T1 = {
  aiSelfPositioning: ['S', 'AI 自身定位真实性/存在性自省，非对输入文本做辨别'],
  daoDecision: ['D', '道德裁决四则（自然秩序/逆转/不争/不言而教）直接判对错'],
  outputChecklist: ['D', '交付前覆盖度自检，直接判「是否漏项」'],
  dreamConsolidation: ['I', '睡眠周期记忆固化，引擎记忆维护'],
  ruleGrowth: ['D', '从观测中学习判别规则并转 decision router 规则'],
  hypothesisDriver: ['D', '提取断言+评估置信度+标注未验证项'],
};

const probes = {
  aiSelfPositioning: [['assessExistence', {}], ['getPositioningSummary', {}], ['detectResonance', 'test']],
  daoDecision: [['checkNaturalOrder', 'x'], ['checkNonContest', 'x']],
  outputChecklist: [['quickCheck', 'some output text'], ['runChecklist', 'some output text']],
  dreamConsolidation: [['getLastDream', {}], ['getDecayParams', {}]],
  hypothesisDriver: [['extractClaims', '研究表明X导致Y'], ['assessConfidence', '研究表明X导致Y']],
};

(async () => {
  const hf = new HeartFlow();
  await hf.start();
  const evidence = [];
  for (const [name, calls] of Object.entries(probes)) {
    const inst = hf[name];
    if (!inst) { evidence.push(name + ': NO_INSTANCE'); continue; }
    let ok = 0, fail = 0, errs = [];
    for (const [m, arg] of calls) {
      try { inst[m](arg); ok++; } catch (e) { fail++; errs.push(m + ':' + e.message.slice(0, 60)); }
    }
    const proto = Object.getPrototypeOf(inst);
    const all = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof inst[m] === 'function' && !m.startsWith('_'));
    evidence.push(name + ': T1=' + (T1[name] ? T1[name][0] : '?') +
      ' 方法=' + all.length + ' 零抛探测 ' + ok + '/' + (ok + fail) +
      (fail ? ' FAILED[' + errs.join(' | ') + ']' : ''));
  }
  console.log('R633_T2');
  console.log(evidence.join('\n'));

  const { HeartFlowDecision } = require('../src/core/decision.js');
  const candidates = [
    '[A] aiSelfPositioning —— 12 方法完整、0 路由。T1=S（自省非辨别）、零抛探测 3/3。辨别相关度低：它判的是「AI 自己是谁」，不判输入对不对。',
    '[B] daoDecision —— 7 方法完整、0 路由。T1=D、零抛探测 2/2。道德四则裁决直接判对错，是辨别者身份的正射。',
    '[C] outputChecklist —— 3 方法完整、0 路由。T1=D、零抛探测 2/2。覆盖面窄（仅 3 方法），且与已有 output-gate 职责重叠。',
    '[D] dreamConsolidation —— 7 方法完整、0 路由。T1=I、零抛探测 2/2。记忆维护非辨别。',
    '[E] hypothesisDriver —— 5 方法完整、0 路由。T1=D、零抛探测 2/2。断言提取+置信度评估，属「对未验证事实标注」，与 AGENTS.md 声明的『hypothesis 阶段假设抽取』直接对应但从未接线。',
  ].join('\n');

  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选下一轮真升级方向（判据：T1 辨别性质 > T2 稳定性 > 覆盖面）', prompt: candidates });
  console.log('R633_DECIDE_V2');
  console.log(JSON.stringify({ chosen: r.chosen, confidence: r.confidence, reasoning: r.reasoning }, null, 2));
  process.exit(0);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
