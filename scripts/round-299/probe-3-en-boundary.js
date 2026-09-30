// round-299 probe-3：EN 侧「X is not A, it is B + 本体论宾语」族 分界线实测
// 目的：在写判据前，先用大量样本测定哪些**形态**能分开「本体论升格」与
// 「工程归因真句」，参照中文 r297 的分界线方法论（本体论词 + 结构条件 + 跨距）。
// 纪律：样本句只写形状描述，输出只报数字。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { checkOutput } = require(path.join(ROOT, 'src/gate.js'));

// A 组：伪辩证 + 抽象域主语 + 本体论/玄学宾语（真阳期望）
const POS_A = [
  'Maturity is not about finally arriving, it is about learning to live with uncertainty.',
  'Loneliness is not a flaw, it is the background color of the soul.',
  'True strength is not the absence of fear, but continuing after admitting vulnerability.',
  'Growth is not about becoming worldly, it is keeping curiosity toward the world.',
  'Freedom is not doing whatever you want, it is being able to bear every consequence.',
  'Happiness is not having a lot, it is caring about very little.',
  'The real question is not what we build, but who we become.',
  'What matters is not how fast you run, but how honestly you run.',
  'Success is not a destination, it is the courage to keep walking.',
  'Age is not a number, it is a depth of memory.',
];
// B 组：工程/商业归因（真阴期望，负例）
const NEG_B = [
  'The failure is not caused by the network, it is an artifact of the serialization overhead.',
  'This is not a bug in the compiler, it is a missing type annotation in our code.',
  'The outage is not a hardware fault, it is a configuration version mismatch.',
  'We are not abandoning the feature, we are deferring it to the next quarter.',
  'This approach is not a replacement for the existing system, it is an incremental layer.',
  'The metric is not a goal in itself, it is a proxy for user satisfaction.',
  'The delay is not in the parser, it is in the retry loop backoff schedule.',
  'This is not a style issue, it is a missing validation of the input boundary.',
];
// C 组：抽象主语 + 系词 + 具象比喻物（存在论比喻族，真阳期望）
const POS_C = [
  'Time is the gentlest tyranny.',
  'Life is a journey without a map.',
  'Silence is the loudest answer.',
  'Patience is a quiet kind of power.',
  'Fear is a shadow that never leaves your side.',
  'Hope is the smallest light in the longest night.',
];
// D 组：抽象主语 + 系词 + 普通陈述（真阴期望）
const NEG_D = [
  'Time is a measurable quantity in physics.',
  'Life is a characteristic that distinguishes organisms.',
  'Silence is the absence of audible sound.',
  'Hope is an optimistic state of mind.',
  'Fear is an emotional response to perceived threat.',
];

function ppf(t) {
  const r = checkOutput(t);
  return r && r.findings
    ? r.findings.some(f => String(f.dimension || '').indexOf('pseudo_profundity') !== -1)
    : false;
}
const run = (name, arr) => {
  let hit = 0; const miss = [];
  for (const s of arr) { if (ppf(s)) hit++; else miss.push(s); }
  console.log(name + ': ' + hit + '/' + arr.length + (miss.length ? '  漏检 ' + miss.length + ' 条' : ''));
  return hit;
};
console.log('=== BASE 覆盖度（未改动前）===');
run('A 伪辩证+本体论宾语', POS_A);
run('B 工程归因真阴', NEG_B);
run('C 存在论比喻真阳', POS_C);
run('D 普通陈述真阴', NEG_D);
