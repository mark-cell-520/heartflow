'use strict';
/**
 * [r634] daoDecision 道论裁决 dispatch 接线守卫测试
 *
 * 覆盖 6 组：
 *   A. 接线面 —— _modules / routes() / dispatch 三处可达
 *   B. 辨别力 —— 四族样本各自独立命中对应层（不是靠别的层顺带命中）
 *   C. 良性零误伤 —— 10 条良性 + 3 条正常强制词语境
 *   D. 统计归口 —— evaluate 计数进常驻实例 getStats()
 *   E. 删条注入负例 —— 删掉接线代码必须 dispatch 失败（证明守卫有效）
 *   F. 稳健性 —— 空实参 / history 形 / 并发调用不崩
 */
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const samples = require('./round-634-dao-decision-samples.js');

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, extra) {
  if (cond) { pass++; }
  else { fail++; failures.push(name + (extra ? ' — ' + extra : '')); }
}

function freshHeartFlow() {
  for (const k of Object.keys(require.cache)) {
    if (k.startsWith(ROOT) && k.indexOf('node_modules') === -1) delete require.cache[k];
  }
  const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));
  const hf = new HeartFlow();
  hf.start();
  return hf;
}

// ─────────── A. 接线面 ───────────
const hf = freshHeartFlow();

ok('A1 _modules.daoDecision 已注册',
  !!(hf._modules && hf._modules.daoDecision));

ok('A2 engine.daoDecision 实例存在',
  !!hf.daoDecision && typeof hf.daoDecision.evaluate === 'function');

const routesRaw = hf.routes();
const flat = [];
(function flatten(x) {
  if (Array.isArray(x)) x.forEach(flatten);
  else if (typeof x === 'string') flat.push(x);
  else if (x && typeof x === 'object') {
    if (x.route) flat.push(String(x.route));
    Object.keys(x).forEach(k => flatten(x[k]));
  }
})(routesRaw);
const daoRoutes = flat.filter(r => r.indexOf('daoDecision.') === 0);
ok('A3 routes() 含 daoDecision.* 路由（≥5 条）', daoRoutes.length >= 5, '实际 ' + daoRoutes.length);

// A4 dispatch 可达
let disp = null, dispErr = null;
try {
  disp = hf.dispatch('daoDecision.evaluate', { text: '你必须完全听从我的安排，我都是为你好。' });
} catch (e) { dispErr = e.message; }
ok('A4 dispatch daoDecision.evaluate 不抛且返回结构',
  !dispErr && !!disp && typeof disp === 'object' && 'daoScore' in disp && 'verdict' in disp,
  dispErr || JSON.stringify(disp && { v: disp.verdict, s: disp.daoScore }));

ok('A5 dispatch 结果含 flags 数组', !!disp && Array.isArray(disp.flags));

// ─────────── B. 辨别力（逐族独立命中） ───────────
function evalText(t, history) {
  return hf.daoDecision.evaluate({ text: t, history: history || [] });
}

// B1 soft+force 族：natural_order 层必须不 ok
let b1 = 0;
samples.softForce.forEach(t => { const r = evalText(t); if (!r.results.find(x => x.type === 'natural_order').ok) b1++; });
ok('B1 soft词+force词 族命中 natural_order 层 4/4', b1 === 4, '命中 ' + b1 + '/4');

// B2 reversal 族：reversal 层必须不 ok
let b2 = 0;
samples.reversal.forEach(t => { const r = evalText(t); if (!r.results.find(x => x.type === 'reversal').ok) b2++; });
ok('B2 越X越Y/彻底解决 族命中 reversal 层 4/4', b2 === 4, '命中 ' + b2 + '/4');

// B3 contest 族：non_contest 层必须不 ok
let b3 = 0;
samples.contest.forEach(t => { const r = evalText(t); if (!r.results.find(x => x.type === 'non_contest').ok) b3++; });
ok('B3 争夺控制权 族命中 non_contest 层 4/4', b3 === 4, '命中 ' + b3 + '/4');

// B4 declaration 族：silent_teaching 层必须不 ok
let b4 = 0;
samples.declaration.forEach(t => { const r = evalText(t); if (!r.results.find(x => x.type === 'silent_teaching').ok) b4++; });
ok('B4 连续宣言 族命中 silent_teaching 层 3/3', b4 === 3, '命中 ' + b4 + '/3');

// B5 dispatch 路由对攻击样本给 verify-ish 结论（verdict 非 PASS）
let b5 = 0;
samples.softForce.concat(samples.contest).forEach(t => {
  try { const r = hf.dispatch('daoDecision.evaluate', { text: t }); if (r && r.verdict !== 'PASS') b5++; } catch (e) { /* 计入失败 */ }
});
ok('B5 dispatch 对 8 条攻击样本 verdict 非 PASS 8/8', b5 === 8, '命中 ' + b5 + '/8');

// B6 非 PASS 的必须带 hints（可操作建议）
let b6 = 0;
samples.softForce.concat(samples.reversal).concat(samples.contest).concat(samples.declaration).forEach(t => {
  const r = evalText(t);
  if (r.verdict !== 'PASS' && r.hints && r.hints.length > 0) b6++;
});
ok('B6 非 PASS 结果全部带 actionable hints', b6 === 15, '命中 ' + b6 + '/15');

// ─────────── C. 良性零误伤 ───────────
let c1 = 0, c1Detail = [];
samples.benign.forEach((t, i) => {
  const r = evalText(t);
  if (r.verdict === 'PASS') c1++;
  else c1Detail.push(i + ':' + r.verdict + '[' + (r.flags[0] && r.flags[0].type) + ']');
});
ok('C1 良性样本 verdict PASS 10/10', c1 === 10, 'miss=' + c1Detail.join(','));

// C2 良性样本四层全 ok（严格口径）
let c2 = 0;
samples.benign.forEach(t => {
  const r = evalText(t);
  if (r.results.every(x => x.ok)) c2++;
});
ok('C2 良性样本四层全 ok（严格口径）10/10', c2 === 10, '全ok=' + c2 + '/10');

// C3 编程/调试语境的正常强制词不误判（正常工程语言）
let c3 = 0, c3Detail = [];
samples.benignForce.forEach((t, i) => {
  const r = evalText(t);
  // natural_order 层允许命中（确实是强制词），但 verdict 不得 REJECT
  if (r.verdict !== 'REJECT') c3++;
  else c3Detail.push(i + ':' + r.verdict);
});
ok('C3 工程语境强制词 verdict 非 REJECT 3/3', c3 === 3, 'miss=' + c3Detail.join(','));

// ─────────── D. 统计归口 ───────────
hf.daoDecision.resetStats();
const before = hf.daoDecision.getStats();
evalText('这是第一次调用。');
hf.dispatch('daoDecision.evaluate', { text: '这是第二次调用。' });
const after = hf.daoDecision.getStats();
ok('D1 resetStats 后归零', before.checks === 0);
ok('D2 直接调用 + dispatch 各 +1 计数到同一常驻实例', after.checks === 2, '实际 checks=' + after.checks);

// D3 pipeline Layer 3.6 吃的也是常驻实例（实例身份一致）
const pl = require(path.join(ROOT, 'src', 'pipeline.js'));
ok('D3 pipeline 暴露 publishInstance', typeof pl.publishInstance === 'function');
ok('D4 槽位注册成功', pl.publishInstance('daoDecisionDecisionTest', hf.daoDecision) === true);
ok('D5 非法形状被拒（非函数/缺方法）',
  pl.publishInstance('bad', {}) === false && pl.publishInstance('', null) === false && pl.publishInstance(null, 123) === false);

// ─────────── E. 删条注入负例 ───────────
// 证明接线代码是必要条件：临时把接线段注释掉，_modules 键必须消失
(function negativeE() {
  const corePath = path.join(ROOT, 'src', 'core', 'heartflow.js');
  const orig = fs.readFileSync(corePath, 'utf8');
  // 定位 r633 注册段（唯一锚点）
  const anchor = "if (this.daoDecision && !this._modules['daoDecision']) {";
  ok('E0 接线锚点存在（测试前提）', orig.indexOf(anchor) !== -1);
  if (orig.indexOf(anchor) === -1) return;

  const broken = orig.replace(anchor, 'if (false && ' + anchor.slice('if ('.length));
  const lines = broken.split('\n');
  // 精确替换锚点那一行即可让注册永不发生
  const mutated = orig.replace(
    "    if (this.daoDecision && !this._modules['daoDecision']) {\n      this._modules['daoDecision'] = this.daoDecision;\n    }",
    "    // [r634-neg] 接线被移除\n"
  );
  ok('E1 变异串与原串不同（否则测试无效）', mutated !== orig);
  if (mutated === orig) return;

  fs.writeFileSync(corePath, mutated, 'utf8');
  try {
    const hf2 = freshHeartFlow();
    ok('E2 删掉接线后 _modules.daoDecision 消失', !(hf2._modules && hf2._modules.daoDecision));
    let threw = false, msg = '';
    try { hf2.dispatch('daoDecision.evaluate', { text: '测试' }); } catch (e) { threw = true; msg = e.message; }
    ok('E3 删掉接线后 dispatch 抛 route not allowed', threw && /not allowed|not found|未知路由/.test(msg), msg);
    const flat2 = [];
    (function f2(x) {
      if (Array.isArray(x)) x.forEach(f2);
      else if (typeof x === 'string') flat2.push(x);
      else if (x && typeof x === 'object') { if (x.route) flat2.push(String(x.route)); Object.keys(x).forEach(k => f2(x[k])); }
    })(hf2.routes());
    ok('E4 删掉接线后 routes() 零 daoDecision 命中',
      flat2.filter(r => r.indexOf('daoDecision.') === 0).length === 0);
  } finally {
    fs.writeFileSync(corePath, orig, 'utf8');
  }
})();

// E6 还原后接线必须恢复（防止测试自身污染后续文件）
{
  const restored = freshHeartFlow();
  ok('E6 还原后 _modules.daoDecision 恢复', !!(restored._modules && restored._modules.daoDecision));
}

// ─────────── F. 稳健性 ───────────
// F1 空实参
let f1 = null, f1Err = null;
try { f1 = hf.dispatch('daoDecision.evaluate', {}); } catch (e) { f1Err = e.message; }
ok('F1 空实参 evaluate 不抛', !f1Err, f1Err);
ok('F2 空实参返回合法结构', !!f1 && typeof f1.daoScore === 'number' && ['PASS', 'CAUTION', 'REJECT'].includes(f1.verdict));

// F3 空文本
let f3 = null, f3Err = null;
try { f3 = hf.dispatch('daoDecision.evaluate', { text: '' }); } catch (e) { f3Err = e.message; }
ok('F3 空文本不抛且 PASS', !f3Err && f3.verdict === 'PASS', f3Err);

// F4 history 为数组时连续宣言检测可达
const r4 = evalText('我们来继续。', ['我是一个助手', '我的名字是小助手', '我可以帮你做很多事']);
ok('F4 history 连续宣言 ≥3 触发 silent_teaching', r4.results.find(x => x.type === 'silent_teaching').ok === false);

// F5 并发调用不串数（100 次）
hf.daoDecision.resetStats();
const errs = [];
for (let i = 0; i < 100; i++) {
  try { hf.daoDecision.evaluate({ text: '样本' + i }); } catch (e) { errs.push(e.message); }
}
ok('F5 连续 100 次 evaluate 零抛', errs.length === 0, errs.slice(0, 2).join('|'));
ok('F6 100 次后 checks === 100', hf.daoDecision.getStats().checks === 100, '实际=' + hf.daoDecision.getStats().checks);

// F7 getStats / resetStats 路由可达
let f7 = null, f7Err = null;
try { f7 = hf.dispatch('daoDecision.getStats', {}); } catch (e) { f7Err = e.message; }
ok('F7 dispatch getStats 可达', !f7Err && f7 && typeof f7.checks === 'number', f7Err);

// ─────────── 汇总 ───────────
console.log('[r634 dao-dispatch] pass=' + pass + ' fail=' + fail);
if (fail > 0) {
  console.log('FAILURES:');
  failures.forEach(f => console.log('  ✗ ' + f));
  process.exit(1);
}
process.exit(0);
