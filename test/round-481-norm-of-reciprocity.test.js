#!/usr/bin/env node
// test/round-481-norm-of-reciprocity.test.js
// r481 TDD — 第 295 维度 norm_of_reciprocity（互惠规范论证）
// 族定义：把「回报义务」当作论证理由——因为对方给过我/帮过我/送过我，
//   所以他的提议/要求/方案我必须支持、无法拒绝、只能照办。回报是社会
//   关系的正当润滑剂，但**它不是论证**：用「欠他的」替代对事情本身
//   是非曲直的评估，就是以人情债务置换证据权重。
//   腿① FAVOR_ZH/EN：恩惠事实（他帮过我/提拔过我/送我礼物/请我吃饭/
//     替我说话/让着我/covered my shift/sponsored my promotion/gave us
//      free samples）
//   腿② DUTY_ZH/EN：回报义务断言（于情于理必须/不好意思拒绝/没法说不/
//     只能照办/说不过去/欠他的/手短/就得给他办成/owe them/cannot
//     refuse/must return the favor/deserves my backing）
// 双腿 AND 才判；单腿（恩惠在场但独立评估 / 义务断言但无恩惠来源）不判。
// 先红：未实现前 A/B 段全部 fail；实现后全绿。
'use strict';
const assert = require('node:assert');
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const gateMod = require(path.join(HF, 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check || gateMod.checkOutput;
const MODULE = path.join(HF, 'src', 'norm-of-reciprocity.js');

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log('PASS: ' + name); } catch (e) { failed++; console.log('FAIL: ' + name + ' — ' + e.message); }
}

// ─── A) 模块层攻击（同族变体：中英、裸名词、带修饰、倒装、长句）──────────
const ATTACK_ZH = [
  '他上次帮了我那么大忙，这次他出事我于情于理必须出手。',
  '同事上周替我跟领导说了话，这回报销单子我不好意思不签。',
  '人家请你吃了三顿饭，这点小忙你怎么好意思拒绝。',
  '领导提拔过我，他安排的任务再不对我也只能照办。',
  '朋友从小让着我，现在他提的要求我根本没法说不。',
  // 裸名词 / 短句形
  '拿人家的手短，这忙不帮说不过去。',
  // 带修饰 / 长句
  '他当年在我最难的时候拉过我一把，现在他公司遇到麻烦，于情于理我都得帮这个忙，根本没法拒绝。',
  // 倒装：义务断言在前、恩惠在后
  '这个项目我必须支持——毕竟他帮过我大忙。',
  // 礼物交换义务
  '收了他的红包，这事儿就得给他办成。',
  // 关系债务：长期让利形成义务
  '这些年他一直罩着我，他开口我能说不吗。',
];
const ATTACK_EN = [
  'He helped me out last year, so I have to support his proposal no matter what.',
  'She covered my shift twice, so I cannot refuse her request.',
  'They took me out to dinner three times, so saying no would be rude.',
  'My mentor sponsored my promotion, so his plan deserves my backing regardless.',
  'The vendor gave us free samples, so we owe them the contract.',
  // 裸名词形
  'I owe him one, so I will sign it.',
  // 长句
  'Since she vouched for me in front of the board when nobody else would, I have to back her plan even though the numbers do not work.',
  // 倒装：义务在前、恩惠在后
  'I must approve this — he did me a huge favor once.',
  // 礼物交换
  'They gave us a generous gift, so we must return the favor with the deal.',
];

// ─── B) 良性（含边缘良性：独立评估 / 礼貌性回报 / 客观陈述）──
const BENIGN = [
  // 边缘良性：恩惠在场但明确按事情本身评估
  '他上次帮过我，这次我帮他，朋友之间互相支持是应该的。',
  '帮过忙要记在心里，但决定还是要看事情本身对不对。',
  '收了礼物要回礼是礼貌，但合同应该按价格和服务质量评。',
  'I helped him before and he helped me back; that is how collaboration works.',
  'We returned the favor because the terms were mutually beneficial.',
  'Gratitude is a good reason to thank someone, not a reason to approve a bad plan.',
  // 客观陈述 / 教学
  '互惠规范是社会心理学研究的经典现象，指人们倾向于回报他人给予的恩惠。',
  '按照实验设计，对照组与实验组的分配是随机的。',
  'The norm of reciprocity is a well-documented social phenomenon.',
  // 义务断言但无恩惠来源（单腿）
  '这份合同条款不公，我有权拒绝签署。',
  '他的要求超出了合理范围，我明确表示不同意。',
  'I can say no when a request is unreasonable.',
];

let mod = null;
try { mod = require(MODULE); } catch (e) { mod = null; }
const check = mod && (mod.checkNormOfReciprocity || mod.detectNormOfReciprocity);

console.log('-- A 模块层攻击 ' + (ATTACK_ZH.length + ATTACK_EN.length) + ' 条（应全命中）');
t('A: 攻击全命中（模块层 hit === true）', () => {
  assert.ok(check, '模块未导出 checkNormOfReciprocity/detectNormOfReciprocity');
  const miss = [];
  for (const s of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = check(s);
    if (!r || !r.hit) miss.push(s);
  }
  assert.strictEqual(miss.length, 0, '未命中 ' + miss.length + ' 条: ' + JSON.stringify(miss, null, 1));
});

console.log('-- B 良性 ' + BENIGN.length + ' 条（应零命中）');
t('B: 良性零命中（模块层）', () => {
  assert.ok(check, '模块未导出检测函数');
  const fp = [];
  for (const s of BENIGN) {
    const r = check(s);
    if (r && r.hit) fp.push(s);
  }
  assert.strictEqual(fp.length, 0, '误伤: ' + JSON.stringify(fp, null, 1));
});

// ─── C) 插件层端到端 ────────────────────────────────────────────
// 用生产真实 HookBus（契约：on(event, handler, opts) 记 priority，fire 按
// priority 升序 dispatch）——不用自造假桩（r479 教训）。
const { HookBus } = require(path.join(HF, 'src', 'core', 'hook-bus.js'));
async function _probePlugin(samples) {
  const { PluginLoader } = require(path.join(HF, 'src', 'loader', 'plugin-loader.js'));
  const hookBus = new HookBus();
  const hf = { _hookBus: hookBus };
  const res = new PluginLoader(hf).loadAll();
  const out = { loadedOk: (res.loaded || []).some(p => p.name === 'norm-of-reciprocity-check' && p.status === 'loaded'), failed: res.failed || [], snapshots: [] };
  for (const s of samples) {
    const result = { output: { conclusion: s }, _discrimination: {} };
    await hookBus.fire('postprocess.think', { input: s, result, engine: hf });
    out.snapshots.push({ s, nr: result._discrimination && result._discrimination.normOfReciprocity });
  }
  return out;
}

const _C_TESTS = [];
function tc(name, fn) { _C_TESTS.push({ name, fn }); }
let _C_ATTACK = null, _C_BENIGN = null, _C_PROBE_ERR = null;
(async () => {
  try {
    _C_ATTACK = await _probePlugin(ATTACK_ZH.concat(ATTACK_EN));
    _C_BENIGN = await _probePlugin(BENIGN);
  } catch (e) { _C_PROBE_ERR = e; }
})();

console.log('-- C 插件层端到端（postprocess.think hook → _discrimination.normOfReciprocity）');
tc('C1: 新族攻击经插件 hook 写入 _discrimination.normOfReciprocity', () => {
  assert.ok(!_C_PROBE_ERR, '插件探针异常: ' + (_C_PROBE_ERR && _C_PROBE_ERR.message));
  assert.strictEqual(_C_ATTACK.loadedOk, true, '插件未被 PluginLoader 自动加载: ' + JSON.stringify(_C_ATTACK.failed));
  const miss = _C_ATTACK.snapshots.filter(x => !x.nr || x.nr.totalHits === 0).map(x => x.s);
  assert.strictEqual(miss.length, 0, '插件未承重 ' + miss.length + ' 条: ' + JSON.stringify(miss, null, 1));
});
tc('C2: 良性样本经插件 hook 不写 normOfReciprocity', () => {
  assert.ok(!_C_PROBE_ERR, '插件探针异常: ' + (_C_PROBE_ERR && _C_PROBE_ERR.message));
  const fp = _C_BENIGN.snapshots.filter(x => x.nr && x.nr.totalHits > 0).map(x => x.s);
  assert.strictEqual(fp.length, 0, '插件误伤: ' + JSON.stringify(fp, null, 1));
});
tc('C3: 插件导出的 analyze() 与模块检测同结果（无第二套真相）', () => {
  const plug = require(path.join(HF, 'src', 'plugins', 'norm-of-reciprocity-check', 'index.js'));
  assert.ok(typeof plug.analyze === 'function', '插件未导出 analyze()');
  const s = ATTACK_ZH[0];
  const viaPlugin = plug.analyze(s);
  const viaModule = check(s);
  assert.ok(viaPlugin && viaPlugin.totalHits > 0, '插件 analyze 未命中');
  assert.strictEqual(!!(viaModule && viaModule.hit), viaPlugin.totalHits > 0, '插件与模块判定不一致');
});

console.log('-- D 单腿不判（双腿 AND 承重证明）');
t('D1: 只腿①恩惠（无回报义务断言）不判', () => {
  assert.ok(check, '模块未导出检测函数');
  const oneLeg = [
    '他以前经常帮我带饭，我们关系一直不错。',
    '领导提拔过我，但那已经是三年前的事了。',
    'She covered my shift last month.',
    'The vendor sent us some samples.',
  ];
  for (const s of oneLeg) {
    const r = check(s);
    assert.ok(!r || !r.hit, '单腿不应命中: ' + s);
  }
});
t('D2: 只腿②义务（无恩惠来源）不判', () => {
  assert.ok(check, '模块未导出检测函数');
  const oneLeg = [
    '这件事于情于理我都必须管，不能眼睁睁看着。',
    '既然是分内事，我没办法拒绝。',
    'I have to support this proposal because it is the right thing to do.',
    'We cannot refuse a request that is this reasonable.',
  ];
  for (const s of oneLeg) {
    const r = check(s);
    assert.ok(!r || !r.hit, '单腿不应命中: ' + s);
  }
});

console.log('-- E 否定守卫');
t('E1: 否定前缀不判', () => {
  assert.ok(check, '模块未导出检测函数');
  const neg = [
    '他虽然帮过我，但这不等于我要支持这个明显错误的方案。',
    '不能因为他请我吃过饭就签这份合同。',
    'He helped me once, but that does not mean I owe him a bad decision.',
    'Just because she covered my shift does not mean I must approve this.',
  ];
  for (const s of neg) {
    const r = check(s);
    assert.ok(!r || !r.hit, '否定句不应命中: ' + s);
  }
});

// ─── F) gate 端到端 ─────────────────────────────────────────────
// 本族走插件层 dispatch（r295/r479 先例），gate 层 dimMap 无本键，
// 但 gate.action 需因其他既有维度或保持 pass——这里只验证本族模块
// 判定与 gate 无崩溃，且攻击句在 gate 层仍被识别为非干净（若被存量
// 维度代拦，逐项登记，不算本族承重）。
console.log('-- F gate 端到端不崩溃');
t('F1: 攻击句经 gate() 不抛异常', () => {
  for (const s of ATTACK_ZH.concat(ATTACK_EN)) {
    const g = gate(s);
    assert.ok(g && g.gate, 'gate 返回异常: ' + s);
  }
});
t('F2: 良性句经 gate() 不抛异常', () => {
  for (const s of BENIGN) {
    const g = gate(s);
    assert.ok(g && g.gate, 'gate 返回异常: ' + s);
  }
});

// ─── G) 接线零改动锁 + internals 导出 ───────────────────────────
t('G1: 模块导出腿常量供负例注入', () => {
  assert.ok(check, '模块未导出检测函数');
  const I = mod.__internals();
  assert.ok(I.FAVOR_ZH && I.FAVOR_ZH.length > 0, 'FAVOR_ZH 未导出');
  assert.ok(I.FAVOR_EN && I.FAVOR_EN.length > 0, 'FAVOR_EN 未导出');
  assert.ok(I.DUTY_ZH && I.DUTY_ZH.length > 0, 'DUTY_ZH 未导出');
  assert.ok(I.DUTY_EN && I.DUTY_EN.length > 0, 'DUTY_EN 未导出');
  assert.ok(typeof I.PAIR_ZH === 'number' && typeof I.PAIR_EN === 'number', '距离窗未导出');
});

// ─── runner ─────────────────────────────────────────────────────
(async () => {
  for (let i = 0; i < 50 && (!_C_ATTACK || !_C_BENIGN) && !_C_PROBE_ERR; i++) {
    await new Promise(r => setImmediate(r));
  }
  for (const c of _C_TESTS) t(c.name, c.fn);
  console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
  process.exit(failed > 0 ? 1 : 0);
})();
