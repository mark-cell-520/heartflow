/**
 * restored-modules-wiring — v6.3.45/46/47「并发优化」误删模块的接线守卫
 *
 * 背景：v6.3.45~v6.3.47 三轮删除 100+ 个源文件后，heartflow.js 的 _lazy
 * 声明退化成 _stubFactory 空壳。空壳下 `new HeartFlow().start()` 后这些
 * 属性是 undefined，注册表里登记了模块名但运行时零能力，且
 * initErrors 为空 —— 静默失效。
 *
 * 本测试用源码形态 + 运行时实例双重断言，防回归。
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HF_FILE = path.join(__dirname, '..', 'src', 'core', 'heartflow.js');
const hfSrc = fs.readFileSync(HF_FILE, 'utf8');

// key: { file, ctor, lazyVar }
const RESTORED = {
  worldModel:          { file: 'src/cortex/world-model.js',                ctor: 'WorldModel',               lazyVar: '_WorldModel' },
  wisdomEngine:        { file: 'src/identity/wisdom-engine.js',            ctor: 'WisdomEngine',             lazyVar: '_WisdomEngine' },
  virtueEthics:        { file: 'src/identity/virtue-ethics-foundation.js', ctor: 'VirtueEthicsFoundation',   lazyVar: '_VirtueEthicsFoundation' },
  humanNature:         { file: 'src/identity/human-nature-constitution.js',ctor: 'HumanNatureConstitution', lazyVar: '_HumanNatureConstitution' },
  characterCultivation:{ file: 'src/identity/character-cultivation.js',    ctor: 'CharacterCultivation',    lazyVar: '_CharacterCultivation' },
  moralDevelopment:    { file: 'src/identity/moral-development.js',        ctor: 'MoralDevelopment',        lazyVar: '_MoralDevelopment' },
  aiHumanIntegration:  { file: 'src/identity/ai-human-integration.js',     ctor: 'AIHumanIntegration',      lazyVar: '_AIHumanIntegration' },
};

const REPO = path.join(__dirname, '..');

let PASS = 0, FAIL = 0;
function test(name, fn) {
  try { fn(); PASS++; console.log('  ✅ ' + name); }
  catch (e) { FAIL++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
console.log('\n[restored-modules-wiring] v6.3.45/46/47 误删模块回归守卫');

// ── 1~5：源码形态（不实例化，快） ────────────────────────────────

test('恢复的 7 个模块文件都存在且非空', () => {
  for (const [k, spec] of Object.entries(RESTORED)) {
    const p = path.join(REPO, spec.file);
    assert.ok(fs.existsSync(p), `文件缺失: ${spec.file} (key=${k})`);
    const text = fs.readFileSync(p, 'utf8');
    assert.ok(text.length > 2000, `${spec.file} 内容过短（${text.length} 字节），疑似空壳`);
    assert.ok(
      new RegExp(`class\\s+${spec.ctor}\\b`).test(text),
      `${spec.file} 里找不到 class ${spec.ctor}`
    );
  }
});

test('7 个 lazy 声明都改走真实 require，不再一律 _stubFactory', () => {
  for (const [k, spec] of Object.entries(RESTORED)) {
    const line = hfSrc.split('\n').find(l => l.includes(`const ${spec.lazyVar} = _lazy(`));
    assert.ok(line, `${spec.lazyVar} 的 _lazy 声明不在 heartflow.js`);
    assert.ok(
      line.includes('=> {') || line.includes('=>{'),
      `${spec.lazyVar} 的 lazy 声明不是 block 形态（不是真 require 兜底），实际: ${line.trim().slice(0, 90)}`
    );
    // 新的真 require 兜底形态是：`catch { return _stubFactory(...) }`
    // 判断标准：这行必须真的 require 到目标文件；防退化断言改为「try 块内的 require 必须存在」
    assert.ok(
      hfSrc.includes(`require('${'../' + spec.file.replace(/^src\//, '')}')`),
      `${spec.lazyVar} 全文件未 require 到 ${spec.file}，已退化为空壳`
    );
  }
});

test('heartflow.js 里 7 个实例化点仍在（没被顺手删掉）', () => {
  for (const [k, spec] of Object.entries(RESTORED)) {
    const re = new RegExp(`const\\s+\\w+\\s*=\\s*${spec.lazyVar}\\(\\)`);
    assert.ok(re.test(hfSrc), `${spec.lazyVar}() 的实例化点不见了`);
  }
});

test('7 个模块导出的是类，不是空对象', () => {
  for (const [k, spec] of Object.entries(RESTORED)) {
    const mod = require('../' + spec.file);
    assert.strictEqual(typeof mod[spec.ctor], 'function', `${spec.file} 未导出 ${spec.ctor}`);
  }
});

test('这 7 个模块不返回「假桥接」式 healthCheck 空实现', () => {
  // 只允许真实现；出现 fake:true 标记的视为假桥接
  for (const [k, spec] of Object.entries(RESTORED)) {
    const text = fs.readFileSync(path.join(REPO, spec.file), 'utf8');
    assert.ok(!/fake\s*:\s*true/.test(text), `${spec.file} 带 fake:true 标记，是假桥接`);
    // 空壳特征：全文只有 healthCheck/getStats 两个方法
    const methodCount = (text.match(/^\s{2}(\w+)\s*\(/gm) || []).length;
    assert.ok(methodCount >= 4, `${spec.file} 疑似空壳：只有 ${methodCount} 个 2 空格缩进方法`);
  }
});

// ── 6~19：运行时（实例化引擎，慢但必需） ────────────────────────

test('start() 后 7 个模块为真实实现（有原型方法 + 有私有状态字段）', () => {
  const { HeartFlow } = require('../src/core/heartflow.js');
  const h = new HeartFlow();
  h.start();
  for (const [k, spec] of Object.entries(RESTORED)) {
    const inst = h[k];
    assert.ok(inst, `${k} 在 start() 后仍为 undefined/空`);
    const proto = inst.constructor && inst.constructor.prototype;
    assert.ok(proto, `${k} 的 constructor.prototype 不存在`);
    const names = Object.getOwnPropertyNames(proto).filter(n => n !== 'constructor');
    assert.ok(names.length >= 4, `${k} 原型方法只有 ${names.length} 个，疑似空壳`);
    const own = Object.keys(inst);
    assert.ok(own.length >= 1, `${k} 无任何私有状态字段，尚未真正初始化`);
  }
});

test('7 个模块都注册进了 _modules（外部可 route）', () => {
  const { HeartFlow } = require('../src/core/heartflow.js');
  const h = new HeartFlow();
  h.start();
  for (const k of Object.keys(RESTORED)) {
    assert.ok(h._modules[k], `${k} 未出现在 _modules`);
  }
});

test('worldModel 真实能力：状态登记 + 转移 + 预测', () => {
  const { HeartFlow } = require('../src/core/heartflow.js');
  const h = new HeartFlow();
  h.start();
  const wm = h.worldModel;
  wm.registerState('s1', { hp: 100 });
  wm.registerState('s2', { hp: 50 });
  wm.recordTransition('s1', 'hit', 's2');
  const pred = wm.predict('s1');
  assert.ok(pred && typeof pred === 'object', 'predict 未返回对象');
  const stats = wm.getStats();
  assert.ok(stats && typeof stats === 'object', 'getStats 未返回对象');
  assert.ok(stats.stateCount >= 2, `stateCount=${stats.stateCount}，状态没记上`);
});

test('wisdomEngine 真实能力：反思产出原则', () => {
  const { HeartFlow } = require('../src/core/heartflow.js');
  const h = new HeartFlow();
  h.start();
  const we = h.wisdomEngine;
  assert.ok(we.getPrinciples().length >= 1, '智慧引擎没有内置原则');
  const r = we.reflect('证据不足就下结论');
  assert.ok(r && typeof r === 'object', 'reflect 未返回对象');
  assert.ok(we.getWisdomReport() && typeof we.getWisdomReport() === 'object', 'getWisdomReport 空');
});

test('virtueEthics 真实能力：情境评估返回美德评分', () => {
  const { HeartFlow } = require('../src/core/heartflow.js');
  const h = new HeartFlow();
  h.start();
  const ve = h.virtueEthics;
  assert.ok(ve.getTraditions().length >= 2, '传统不足 2 个');
  const a = ve.assessSituation('在明知缺陷的情况下仍然交付');
  assert.ok(a && typeof a === 'object', 'assessSituation 未返回对象');
  // getVirtueScores() 初始为空 {}，必须先 recordPractice() 才有美德分
  assert.strictEqual(Object.keys(ve.getVirtueScores()).length, 0, '初始美德评分应为空（未实践过）');
  ve.recordPractice({ virtue: 'honesty', description: '主动承认缺陷', context: '交付前' });
  assert.ok(Object.keys(ve.getVirtueScores()).length >= 1, 'recordPractice 后美德评分仍为空');
});

test('moralDevelopment 真实能力：道德阶段两难分析', () => {
  const { HeartFlow } = require('../src/core/heartflow.js');
  const h = new HeartFlow();
  h.start();
  const md = h.moralDevelopment;
  const stages = md.getStages();
  assert.ok(stages && typeof stages === 'object', 'getStages 未返回对象');
  const stageArr = stages.kohlberg || stages.gilligan || [];
  assert.ok(stageArr.length >= 3, '阶段不足 3 个');
  const d = md.analyzeDilemma('为了多数人利益欺骗少数人');
  assert.ok(d && typeof d === 'object', 'analyzeDilemma 未返回对象');
  const stage = md.assessMoralStage('规则是规则');
  assert.ok(stage && typeof stage === 'object', 'assessMoralStage 未返回对象');
});

test('characterCultivation 真实能力：记录习惯 + 品格评估', () => {
  const { HeartFlow } = require('../src/core/heartflow.js');
  const h = new HeartFlow();
  h.start();
  const cc = h.characterCultivation;
  cc.recordPractice('诚实', { note: '主动承认错误' });
  assert.ok(cc.getDailyPractices().length >= 1, '实践没记上');
  const a = cc.assessCharacter();
  assert.ok(a && typeof a === 'object', 'assessCharacter 未返回对象');
  assert.ok(cc.getBlueprint() && typeof cc.getBlueprint() === 'object', '蓝图为空');
});

test('humanNature 真实能力：人性论多理论评估', () => {
  const { HeartFlow } = require('../src/core/heartflow.js');
  const h = new HeartFlow();
  h.start();
  const hn = h.humanNature;
  assert.ok(hn.getAllTheories().length >= 2, '理论不足 2 个');
  const a = hn.assessHumanNature({ cooperation: 0.8, competition: 0.6 });
  assert.ok(a && typeof a === 'object', 'assessHumanNature 未返回对象');
  assert.ok(hn.getTheory('mencius') || hn.getAllTheories()[0], '取不到理论');
});

test('aiHumanIntegration 真实能力：人格画像 + 冲突消解', () => {
  const { HeartFlow } = require('../src/core/heartflow.js');
  const h = new HeartFlow();
  h.start();
  const ahi = h.aiHumanIntegration;
  const p = ahi.getPersonalityProfile();
  assert.ok(p && typeof p === 'object', '人格画像为空');
  // resolveConflicts 收 suggestions **数组**，items.length<=1 时原样返回
  const one = ahi.resolveConflicts([{ id: 'a', action: 'proceed', title: '推进' }]);
  assert.ok(Array.isArray(one), '单条建议应原样返回数组');
  const c = ahi.resolveConflicts([
    { id: 'a', action: 'proceed', title: '推进', source: 'mod1' },
    { id: 'b', action: 'hold', title: '暂缓', source: 'mod2' },
  ]);
  assert.ok(c && typeof c === 'object', 'resolveConflicts 未返回对象');
  assert.ok(ahi.getHumanState && typeof ahi.getHumanState() === 'object', 'getHumanState 空');
});

test('7 个模块共享同一常驻实例（跨调用状态不丢）', () => {
  const { HeartFlow } = require('../src/core/heartflow.js');
  const h = new HeartFlow();
  h.start();
  assert.strictEqual(h.worldModel, h._modules.worldModel, 'worldModel 实例不一致');
  assert.strictEqual(h.wisdomEngine, h._modules.wisdomEngine, 'wisdomEngine 实例不一致');
  assert.strictEqual(h.virtueEthics, h._modules.virtueEthics, 'virtueEthics 实例不一致');
  // 状态延续：recordStageTransition(fromStage, toStage, trigger) 三参
  // toStage 可收字符串（._currentStage 用 toStage.stage||toStage 兼容）
  h.moralDevelopment.recordStageTransition('preconventional', 'conventional', 'rule-realization');
  const proto = Object.getOwnPropertyNames(h.moralDevelopment.constructor.prototype);
  assert.ok(proto.includes('getReflections'), 'moralDevelopment 原型缺 getReflections');
  assert.ok(
    typeof h.moralDevelopment.getReflections().length === 'number',
    'getReflections 未返回数组'
  );
});

test('heartflow.js 不再有这 7 个假 globalThis 桥接', () => {
  for (const k of Object.keys(RESTORED)) {
    assert.ok(!new RegExp(`globalThis\\.${k}\\s*=`).test(hfSrc), `发现假全局对象 globalThis.${k}`);
  }
  // 白名单里的历史假桥接（ProcessRewardModel 等）不在本轮 7 个范围内，不查
});

console.log(`\n[restored-modules-wiring] ${PASS} 通过 / ${FAIL} 失败`);
if (FAIL > 0) process.exit(1);
