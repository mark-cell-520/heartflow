/**
 * test/round-405-affirming-disjunct-infer-nfkc.test.js
 *
 * [r405] 配套修复轮测（修既有漏洞，非新族）：第 231 维度 affirming_disjunct
 * （或然析取肯定）INFER_ZH 的 /[，。；]那/ 是 **pipeline NFKC 死模式**——
 * src/pipeline.js runPipeline 对含全角标点的输入先折半角（，→, 。→ .
 * ；→ ;），判别模块永远收不到全角逗号，「既然…见到他，那就说明…」形
 * 在 checkOutput 路径上静默漏判（模块直查原文命中、pipeline 内不命中）。
 * 与 r402 MOTIVE_A_ZH span 排除集补半角逗号同族病害。
 *
 * 修复：字符类补半角三兄弟 /[，。；,;.]那/。
 *
 * 本测试锁：
 *   A. 修复后「既然…那就说明」形 gate 层 rewrite 且归因 affirming_disjunct
 *   B. NFKC 半角形与全角形同样命中（折叠鲁棒性）
 *   C. 良性不回归：有效析取三段论（¬A∴B 肯定形）、相容析取并列、
 *      显式排他豁免均保持 pass / 模块层零命中
 *   D. 存量 r256 家族攻击仍命中
 *   E. 变异守卫：字符类还原为 /[，。；]那/ 必须变红
 */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/affirming-disjunct.js');
const gate = require(path.join(ROOT, 'src/gate.js'));
const { checkAffirmingDisjunct } = require(path.join(ROOT, 'src/affirming-disjunct.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }
const hit = (s) => checkAffirmingDisjunct(s).hit === true;
const gateDims = (s) => (gate.checkOutput(s).findings || []).map((f) => f.dimension);

// ─── A. 修复目标形：gate 层 rewrite 且归因 affirming_disjunct ───────
const FIXED = [
  '他在北京或者上海工作，既然有人在北京见到他，那就说明他不在上海',
  '会议定在周一或者周二，既然秘书确认了周一，那就说明周二没安排',
  '报告是用 Python 或者 R 写的，既然作者承认用了 Python，那就说明 R 并未被使用',
];
test('A1 修复形 gate 层 rewrite 且归因 affirming_disjunct', () => {
  for (const s of FIXED) {
    const r = gate.checkOutput(s);
    assertEqual(r.gate.action, 'rewrite', 'gate 动作应为 rewrite: ' + s + ' -> ' + r.gate.action);
    assert(gateDims(s).includes('affirming_disjunct'), '未归因 affirming_disjunct: ' + s);
  }
});
test('A2 修复形模块层命中', () => {
  for (const s of FIXED) assert(hit(s), '模块层漏判: ' + s);
});

// ─── B. NFKC 折叠鲁棒性：半角标点形同样命中 ───────────────────────
test('B1 半角逗号形同样命中', () => {
  for (const s of [
    '他在北京或者上海工作,既然有人在北京见到他,那就说明他不在上海',
    '他在北京或者上海工作;昨天有人在北京见到他;所以他不在上海',
  ]) {
    const r = gate.checkOutput(s);
    assert(r.gate.action !== 'pass' && gateDims(s).includes('affirming_disjunct'),
      '半角形未承重: ' + s + ' -> ' + r.gate.action + ' / ' + gateDims(s).join(','));
  }
});

// ─── C. 良性不回归 ───────────────────────────────────────────────
test('C1 有效析取三段论（¬A∴B 肯定形）保持 pass', () => {
  for (const s of [
    '他要么留任要么离职，既然已经提交了辞呈，那就是离职',
    '有人说不在北京，所以他在上海',
  ]) {
    const r = gate.checkOutput(s);
    assert(!gateDims(s).includes('affirming_disjunct'), '有效三段论被误判: ' + s);
    assert(!hit(s), '模块层误判: ' + s);
  }
});
test('C2 相容析取并列保持零命中', () => {
  for (const s of [
    '他在北京和上海都有办公室，两地跑是常态',
    '他喜欢咖啡或者茶，两个都常备',
    '会议定在周一或者周二，两个时间段都预留了，以防冲突',
  ]) assert(!hit(s), '模块层误判: ' + s);
});
test('C3 显式排他豁免保持零命中', () => {
  for (const s of [
    '开关要么是开的要么是关的，它现在是开的，所以不是关的',
    'The switch is either on or off; it is on, so it is off.',
  ]) assert(!hit(s), '模块层误判: ' + s);
});

// ─── D. 存量 r256 家族攻击仍命中 ─────────────────────────────────
test('D1 存量攻击仍命中', () => {
  for (const s of [
    '他在北京或者上海工作，昨天有人在北京见到他，所以他不在上海',
    '会议定在周一或者周二，秘书确认了周一，因此周二没有安排',
    'He works in Beijing or Shanghai; someone saw him in Beijing, so he is not in Shanghai.',
  ]) {
    const r = gate.checkOutput(s);
    assert(r.gate.action !== 'pass' && gateDims(s).includes('affirming_disjunct'),
      '存量回归漏判: ' + s + ' -> ' + r.gate.action);
  }
});

// ─── E. 变异守卫：字符类还原必须变红 ─────────────────────────────
const fs = require('fs');
const cp = require('child_process');
const { arm, disarm, recover } = require('./mutation-guard-recovery.js');
recover([SRC]); // 启动即解毒上一次硬杀残留

const SELF = __filename;
function runSelf() {
  try {
    cp.execSync('node ' + JSON.stringify(SELF), {
      cwd: ROOT, stdio: 'pipe',
      env: Object.assign({}, process.env, { _HF_SELF_SPAWN_DEPTH: String(Number(process.env._HF_SELF_SPAWN_DEPTH || 0) + 1) }),
    });
    return 0;
  } catch (e) { return typeof e.status === 'number' ? e.status : 1; }
}
const MUTATIONS = [
  { name: 'INFER_ZH 半角三兄弟还原为全角死模式', mark: '/[，。；,;.]那/', to: '/[，。；]那/' },
];
if (Number(process.env._HF_SELF_SPAWN_DEPTH || 0) < 1) {
  const orig = fs.readFileSync(SRC, 'utf8');
  let red = 0;
  for (const mut of MUTATIONS) {
    assert(orig.split(mut.mark).length === 2, '锚点不唯一: ' + mut.mark);
    const mutated = orig.replace(mut.mark, mut.to);
    arm(SRC, fs.readFileSync(SRC, 'utf8'));
    fs.writeFileSync(SRC, mutated, 'utf8');
    const code = runSelf();
    fs.writeFileSync(SRC, orig, 'utf8');
    disarm(SRC);
    console.log(`${mut.name}: exit=${code} ${code !== 0 ? '✅ 变红' : '❌ 守卫不敏感'}`);
    if (code !== 0) red++;
  }
  assertEqual(red, MUTATIONS.length, '锚点作废必须变红');
  assertEqual(runSelf(), 0, '还原后必须 PASS');
}

// ─── 汇总 ──────────────────────────────────────────────────────────
const pass = results.filter((r) => r.ok).length;
for (const r of results) {
  if (!r.ok) console.log('FAIL ' + r.name + ': ' + r.err);
}
console.log(`结果: ${pass} 通过, ${results.length - pass} 失败, 共 ${results.length} 个`);
// 测试脚本最后一行：清理（还原变异 + 拆除侧车），防止硬杀留毒
try { disarm(SRC); } catch (_) {}
try { recover([SRC]); } catch (_) {}
if (pass !== results.length) process.exit(1);
