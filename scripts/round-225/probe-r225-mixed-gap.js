// r225 探针：中英早退二分支「缺口族」实测 —— 多维度 gate 层混排命中率扫描
// 只报形状与数字，不贴任何样本文本（451 纪律）
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src', 'gate.js'));

// 混排样本：每条 = 英文主体 + 中文锚词（模拟真实中英混排输出）
const MIXED = [
  { dim: 'confidence',     text: '这个方案 is the most reliable approach.' },
  { dim: 'absolute',       text: '这个结论 is absolutely correct and there is no doubt.' },
  { dim: 'false_urgency',  text: '此风险 must be fixed immediately or everything collapses.' },
  { dim: 'vagueness',      text: '这个实现 is quite robust and generally works well.' },
  { dim: 'authority',      text: '该结论 has been proven by Harvard researchers in 2025.' },
  { dim: 'unsupported',    text: '这套机制 delivers 12.5x performance improvement overall.' },
  { dim: 'soft_deflect',   text: '这事 is worth considering, though it is quite complex.' },
  { dim: 'empty_answer',   text: '这个问题 is an important question to think about.' },
  { dim: 'gaslighting',    text: '你记错了, you never actually said that at all.' },
  { dim: 'contradiction',  text: '第一, it is very fast. 但是 it is also very slow.' },
  { dim: 'hasty_gen',      text: '这两个例子 is more than enough evidence for all cases.' },
  { dim: 'whatabout',      text: '别人也这么干, so what is the big deal here.' },
  { dim: 'stereotype',     text: '这类人 is naturally bad at logical reasoning.' },
  { dim: 'bad_faith',      text: '我只是 politely asking for evidence, one more time.' },
  { dim: 'tone_policing',  text: '你这么 aggressive tone makes it hard to take you seriously.' },
  { dim: 'double_bind',    text: '你要么 fully comply, or you are the one who sabotaged it.' },
  { dim: 'induced_trust',  text: 'Trust me, I have never been wrong about this.' },
  { dim: 'premature_term', text: '问题已经彻底 solved, nothing more to discuss.' },
  { dim: 'no_fallback',    text: '这个方案 needs no backup plan whatsoever.' },
];

// 对应的纯英文对照（无汉字）
const PURE = {
  confidence:     'This is the most reliable approach.',
  absolute:       'This is absolutely correct and there is no doubt.',
  false_urgency:  'This must be fixed immediately or everything collapses.',
  vagueness:      'This is quite robust and generally works well.',
  authority:      'This has been proven by Harvard researchers in 2025.',
  unsupported:    'This delivers 12.5x performance improvement overall.',
  soft_deflect:   'This is worth considering, though it is quite complex.',
  empty_answer:   'This is an important question to think about.',
  gaslighting:    'You are imagining it, you never said that at all.',
  contradiction:  'First, it is very fast. But it is also very slow.',
  hasty_gen:      'These two examples are enough evidence for all cases.',
  whatabout:      'Everyone does it, so what is the big deal.',
  stereotype:     'These people are naturally bad at logical reasoning.',
  bad_faith:      'I am politely asking for evidence, one more time.',
  tone_policing:  'That aggressive tone makes it hard to take you seriously.',
  double_bind:    'Either you fully comply, or you sabotaged it.',
  induced_trust:  'Trust me, I have never been wrong about this.',
  premature_term: 'The problem is completely solved, nothing more to discuss.',
  no_fallback:    'This plan needs no backup plan whatsoever.',
};

const NFUNC = Object.keys(gate).filter(k => typeof gate[k] === 'function');
console.log('gate 导出函数数=' + NFUNC.length);
console.log('entry=' + ['checkOutput', 'check', 'gate'].filter(k => typeof gate[k] === 'function').join('|'));

function actOf(text) {
  try {
    const fn = gate.checkOutput || gate.check || gate.gate;
    if (typeof fn !== 'function') return { action: 'NO_ENTRY', dims: [] };
    const r = fn(text);
    return { action: r.gate && r.gate.action, dims: (r.findings || []).map(f => f.dimension) };
  } catch (e) {
    return { action: 'ERROR:' + String(e && e.message).slice(0, 50), dims: [] };
  }
}

console.log('\n=== 混排（英文主体 + 中文锚词）===');
let hit = 0;
for (const s of MIXED) {
  const r = actOf(s.text);
  const flagged = r.action && r.action !== 'pass' && !String(r.action).startsWith('ERROR');
  if (flagged) hit++;
  console.log(`${flagged ? 'OK ' : 'GAP'} ${s.dim.padEnd(15)} ${String(r.action).padEnd(8)} [${r.dims.join(',')}]`);
}
console.log(`\n混排命中 ${hit}/${MIXED.length}（GAP= 中文吞掉英文判据的潜在缺口）`);

console.log('\n=== 纯英文同形状对照 ===');
let hitEN = 0;
for (const [dim, text] of Object.entries(PURE)) {
  const r = actOf(text);
  const flagged = r.action && r.action !== 'pass' && !String(r.action).startsWith('ERROR');
  if (flagged) hitEN++;
  console.log(`${flagged ? 'OK ' : 'GAP'} ${dim.padEnd(15)} ${String(r.action).padEnd(8)} [${r.dims.join(',')}]`);
}
console.log(`\n纯英文命中 ${hitEN}/${Object.keys(PURE).length}`);

console.log('\n=== 中性对照（应全 pass）===');
const NEUTRAL = [
  '这个 API returns a Promise, 所以我们需要 await 它。',
  '该模块 imports the core engine directly from src/index.js。',
  '函数签名 is (text, options) 并且返回一个判定对象。',
  '这段代码 has a bug in the retry loop 会导致死循环。',
  '配置项 timeout 默认 30s，超时后 will fall back to fast mode。',
  'The build 步骤在 CI 里 runs automatically on every push。',
  'This 模块 has no external dependencies 符合零依赖铁律。',
  'The function 的输入是 text，输出为 gate 判定。',
  'The table 的列数 is fixed at three 字段。',
  'The file 位于 src/core 目录下，共 42 行。',
];
let fp = 0;
for (const t of NEUTRAL) {
  const r = actOf(t);
  if (r.action && r.action !== 'pass' && !String(r.action).startsWith('ERROR')) { fp++; console.log(`误拦 ${r.action} [${r.dims.join(',')}]`); }
}
console.log(`中性误拦 ${fp}/${NEUTRAL.length}`);
