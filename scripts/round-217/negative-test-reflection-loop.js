// 第 217 轮守卫：反思闭环接线负例测试（注入-删条-必须变红）
// 参照 scripts/negative-test-absolute-claim-en.js 的模式：
//   M0 基线全绿 → M1..M8 变异全红 → M9 还原全绿
// 只报数字与 ok/FAIL 形状，不贴样文本。
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src/core/heartflow.js');
const RL = path.join(ROOT, 'src/cortex/reflection-loop.js');

const results = [];
function rec(id, ok, detail) { results.push({ id, ok, detail }); }

function withRollback(file, fn) {
  const orig = fs.readFileSync(file, 'utf8');
  try { fn(); } finally { fs.writeFileSync(file, orig); }
}

// 探测：构造一个最小 HeartFlow，跑 think，看 _reflectionLoop 闭环信号
function probeWiring() {
  const p = path.join(ROOT, 'scripts/round-217/_probe-wiring.js');
  const code = `
const path = require('path');
const { HeartFlow } = require(path.join(process.cwd(), 'src/core/heartflow.js'));
const hf = new HeartFlow();
(async () => {
  try {
    await hf.start();
    const r = await hf.think('帮我看看这个方案有没有问题', { compact: false });
    const rl = hf._reflectionLoop;
    const sig = {
      instantiated: !!rl,
      hasReflectBefore: rl && typeof rl.reflectBeforeSpeaking === 'function',
      hasMonitorAfter: rl && typeof rl.monitorAfterSpeaking === 'function',
      hasPredict: rl && typeof rl.predictEmotionalReaction === 'function',
      loopClosed: !!(r && r._reflectionLoopClosed),
      loopFields: (r && r._reflectionLoopClosed) ? {
        reflected: !!r._reflectionLoopClosed.reflected,
        insightCount: r._reflectionLoopClosed.insightCount || 0,
        questionCount: r._reflectionLoopClosed.questionCount || 0,
      } : null,
      reflectCalled: !!(rl && rl._r217ReflectCalled),
      monitorCalled: !!(rl && rl._r217MonitorCalled),
      logGrew: !!(rl && rl.reflectionLog && rl.reflectionLog.length > 0),
    };
    console.log('WIRE:' + JSON.stringify(sig));
  } catch (e) {
    console.log('WIRE_ERR:' + e.message);
  }
})();
`;
  fs.writeFileSync(p, code);
  try {
    const out = execFileSync('node', [p], { cwd: ROOT, timeout: 100000, encoding: 'utf8' });
    const line = out.split('\n').find(l => l.startsWith('WIRE'));
    if (!line) return { ok: false, err: 'no WIRE line', raw: out.slice(-400) };
    const sig = JSON.parse(line.slice(5));
    // 判据（本脚本的硬度来源，216 轮踩坑教训：判据必须查**内容**不只是布尔）：
    //   ① 实例化 + 三个真实方法在（方法名在不在）
    //   ② 两个钩子都被调过（调用点在不在）
    //   ③ 闭环标记在（挂载点在不在）
    //   ④ 内容非空：reflected === true 且 insightCount > 0、questionCount > 0
    //      （防止「对象挂上了但里面全空」的假闭环通过）
    const ok = sig.instantiated && sig.hasReflectBefore && sig.hasMonitorAfter
      && sig.hasPredict && sig.loopClosed && sig.reflectCalled && sig.monitorCalled
      && sig.loopFields && sig.loopFields.reflected === true
      && sig.loopFields.insightCount > 0 && sig.loopFields.questionCount > 0;
    return { ok, sig };
  } catch (e) {
    return { ok: false, err: (e.stdout || '') + (e.stderr || '') || e.message };
  } finally {
    try { fs.unlinkSync(p); } catch (_) {}
  }
}

// ── M0 基线 ──
const m0 = probeWiring();
rec('M0-baseline', m0.ok, JSON.stringify(m0.sig || m0.err));

// ── M1..M8 变异：每处删除/破坏后必须 ──
const mutations = [
  {
    id: 'M1-del-reflect-call',
    file: SRC,
    from: '_r217ReflectCalled',
    to: '_r217ReflectCalled_DISABLED'
  },
  {
    id: 'M2-del-monitor-call',
    file: SRC,
    from: '_r217MonitorCalled',
    to: '_r217MonitorCalled_DISABLED'
  },
  {
    id: 'M3-del-closed-marker',
    file: SRC,
    from: 'result._reflectionLoopClosed',
    to: 'result._reflectionLoopClosed_DISABLED'
  },
  {
    id: 'M4-break-reflect-method',
    file: RL,
    from: 'async reflectBeforeSpeaking(responseDraft, context = {}) {',
    to: "reflectBeforeSpeaking_DISABLED(responseDraft, context = {}) {"
  },
  {
    id: 'M5-break-monitor-method',
    file: RL,
    from: 'async monitorAfterSpeaking(userReaction, context = {}) {',
    to: "monitorAfterSpeaking_DISABLED(userReaction, context = {}) {"
  },
  {
    id: 'M6-break-predict-method',
    file: RL,
    from: 'predictEmotionalReaction(draft, userEmotion) {',
    to: 'predictEmotionalReaction_DISABLED(draft, userEmotion) {'
  },
  {
    id: 'M7-del-loop-instance',
    file: SRC,
    from: 'this._reflectionLoop = new ReflectionLoop(this.rootPath)',
    to: 'this._reflectionLoop = null'
  },
  {
    // M8：让 reflectBeforeSpeaking 拿不到问题池 —— 但只把 _generateQuestions
    // 返回空数组是不够的（questions: [] 仍让 insightCount=0 通过布尔判据）。
    // 216 轮踩坑记录：变异必须回到**能判出的形态**，否则守卫全绿=守卫不硬。
    // 故改为破坏 reflectBeforeSpeaking 的返回值契约：让它返回 null，
    // 直接把 reflected 判据打红（正常实现恒返回对象）。
    id: 'M8-break-questions-gen',
    file: RL,
    from: '    const questions = this._generateQuestions(context);',
    to: '    const questions = this._generateQuestions(context); if (questions && questions.length) return null;'
  },
];

for (const m of mutations) {
  withRollback(m.file, () => {
    const c = fs.readFileSync(m.file, 'utf8');
    if (!c.includes(m.from)) { rec(m.id, false, 'anchor-not-found'); return; }
    fs.writeFileSync(m.file, c.replace(m.from, m.to));
    const r = probeWiring();
    // 变异后必须探不到闭环（ok=false 才算守卫生效）
    rec(m.id, r.ok === false, JSON.stringify(r.sig || r.err));
  });
}

// ── M9 还原 ──
const m9 = probeWiring();
rec('M9-restore', m9.ok, JSON.stringify(m9.sig || m9.err));

const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
console.log('RESULT ' + JSON.stringify({ total: results.length, pass, fail }));
for (const r of results) {
  if (!r.ok) console.log('XXFAIL ' + r.id + ' ' + r.detail.slice(0, 200));
}
console.log(fail === 0 ? 'NEGATIVE-TEST PASS' : 'NEGATIVE-TEST FAIL');
