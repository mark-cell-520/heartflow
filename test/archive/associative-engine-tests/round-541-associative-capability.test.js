/**
 * r541 联想引擎能力激活守卫测试
 *
 * 守卫的是「L1/L2/L3 能真正产出辨别/理解结果」这条能力，而非某个字符串。
 * 每一个断言都是「注入 → 必须变红；删除 → 必须恢复」的形式。
 *
 * 运行：node test/round-541-associative-capability.test.js
 */
'use strict';

const assert = require('assert');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const { AssociationGraphBridge } = require(path.join(ROOT, 'src/core/association-graph-bridge.js'));
const { LexicalAssociator } = require(path.join(ROOT, 'src/archive/associative-engine/lexical-associator.js'));

let passed = 0;
let failed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✅ ' + name);
  } catch (e) {
    failed++;
    failures.push(name + ' :: ' + e.message);
    console.log('  ❌ ' + name + ' :: ' + e.message);
  }
}

console.log('\n=== r541 · 联想图谱格式桥接 + 中文分词接入守卫 ===\n');

// ─────────────────────────────────────────────────────────────
// A. 桥接器单元行为
// ─────────────────────────────────────────────────────────────
console.log('[A] 桥接器格式转换');

const bridge = new AssociationGraphBridge(ROOT);
const dict = JSON.parse(require('fs').readFileSync(path.join(ROOT, 'dict-data/association-graph.json'), 'utf8'));
const converted = bridge.convert(dict);

check('转换后节点数 > 500（源 2388 节点 / 7877 边）', () => {
  assert.ok(Object.keys(converted.nodes).length > 500,
    '实际 ' + Object.keys(converted.nodes).length);
});

check('每个节点关联项满足 L1 读取契约 {word,relation,strength}', () => {
  const word = Object.keys(converted.nodes)[0];
  const list = converted.nodes[word];
  assert.ok(list.length > 0, '节点 ' + word + ' 关联为空');
  for (const item of list.slice(0, 5)) {
    assert.strictEqual(typeof item.word, 'string');
    assert.strictEqual(typeof item.relation, 'string');
    assert.strictEqual(typeof item.strength, 'number');
    assert.ok(item.strength > 0, 'strength 必须 > 0');
    assert.ok(item.emotion && typeof item.emotion === 'object', 'emotion 缺失');
    assert.ok(Number.isFinite(item.frequency), 'frequency 非有限数');
  }
});

check('边是双向的（code→算法 则 算法→code 也应存在方向之一）', () => {
  // 源图 代码→算法 有向；转换后两个方向都应可查
  assert.ok(Array.isArray(converted.nodes['代码']), '代码 节点缺失');
  const hasTarget = converted.nodes['代码'].some(x => x.word === '算法');
  assert.ok(hasTarget, '代码 → 算法 缺失');
  const reverse = converted.nodes['算法'] || [];
  const hasSource = reverse.some(x => x.word === '代码');
  assert.ok(hasSource, '算法 → 代码 反向缺失');
});

check('同一节点内按 strength 降序', () => {
  for (const [w, list] of Object.entries(converted.nodes)) {
    for (let i = 1; i < list.length; i++) {
      assert.ok(list[i - 1].strength >= list[i].strength, w + ' 非降序于 index ' + i);
    }
  }
});

check('每个节点截断到 maxPerNode(50) 以内', () => {
  for (const [w, list] of Object.entries(converted.nodes)) {
    assert.ok(list.length <= 50, w + ' 有 ' + list.length + ' 条');
  }
});

check('缺失 dict 文件时返回 merged:false 且不抛', () => {
  const b2 = new AssociationGraphBridge(ROOT, { dictFile: 'dict-data/__nope__.json' });
  const g = { nodes: {} };
  const r = b2.applyTo(g);
  assert.strictEqual(r.merged, false);
  assert.ok(r.reason, '应有 reason');
});

check('重复 applyTo 幂等（第二次返回 already bridged）', () => {
  const g = { nodes: {} };
  const b3 = new AssociationGraphBridge(ROOT);
  const r1 = b3.applyTo(g);
  assert.strictEqual(r1.merged, true);
  const before = Object.keys(g.nodes).length;
  const r2 = b3.applyTo(g);
  assert.strictEqual(r2.merged, false);
  assert.strictEqual(r2.reason, 'already bridged');
  assert.strictEqual(Object.keys(g.nodes).length, before, '第二次合并不得新增节点');
});

// ─────────────────────────────────────────────────────────────
// B. L1 真实产出（注入-删条验证：删掉桥接接线则这些必须变红）
// ─────────────────────────────────────────────────────────────
console.log('\n[B] L1 联想产出（桥接接线存在时必须非零）');

const la = new LexicalAssociator(ROOT);

check('bridgeResult.merged === true（桥接真的生效了）', () => {
  assert.ok(la.bridgeResult, 'bridgeResult 未设置 → 桥接未接线');
  assert.strictEqual(la.bridgeResult.merged, true, JSON.stringify(la.bridgeResult));
});

check('图谱非空节点数 > 500（桥接前实测 0/2045）', () => {
  const nonEmpty = Object.entries(la.graph.nodes).filter(([, v]) => Array.isArray(v) && v.length > 0);
  assert.ok(nonEmpty.length > 500, '实际 ' + nonEmpty.length);
});

const ZH_SAMPLES = [
  '我感到很焦虑，因为工作压力太大了',
  '算法和代码需要重构，性能有问题',
  '专注和心流是深度工作的关键',
  '存在与意义是什么',
];

check('图内词汇样本 L1 allAssociations 全部 > 0（桥接前恒为 0）', () => {
  for (const s of ZH_SAMPLES) {
    const r = la.associateSequence(s);
    assert.ok(r.allAssociations.length > 0, '样本 "' + s + '" allAssociations=' + r.allAssociations.length);
  }
});

check('associateSequence 对多词中文句返回多 token（分词接线生效）', () => {
  const r = la.associateSequence('我现在压力很大，心里很乱，不知道该怎么办。');
  assert.ok(r.words.length >= 10, 'words=' + r.words.length + '（原实现恒为 1）');
});

check('英文不受分词器影响（原样保留）', () => {
  const r = la.associateSequence('hello world');
  assert.deepStrictEqual(r.words, ['hello', 'world']);
});

check('空串/非字符串不抛（原实现遇 null 会 throw）', () => {
  assert.deepStrictEqual(la.associateSequence('').words, []);
  assert.deepStrictEqual(la.associateSequence(null).words, []);
  assert.deepStrictEqual(la.associateSequence(undefined).words, []);
});

check('intersectionBoost 至少在一个多样本上非零（复合查询能力激活）', () => {
  let any = false;
  for (const s of ZH_SAMPLES) {
    if (la.associateSequence(s).intersectionBoost.length > 0) any = true;
  }
  assert.ok(any, '所有样本 intersectionBoost 均为 0 → 复合查询未激活');
});

// ─────────────────────────────────────────────────────────────
// C. 负例守卫：良性场景不得被误判为「有联想」
// ─────────────────────────────────────────────────────────────
console.log('\n[C] 负例守卫（良性零误伤）');

check('图外词汇（无数据）必须返回空关联而不是编造', () => {
  // 这些词在 src 与 dict-data 两个图谱里都不存在实质数据
  const r = la.associateSequence('量子泡沫的紫罗兰色楼梯');
  // 分词器可能切出「量子」「泡沫」等不在图中的词 → 关联应为 0
  const realAssoc = r.allAssociations.filter(a => la.graph.nodes[a.word] && la.graph.nodes[a.word].length > 0);
  assert.strictEqual(realAssoc.length, 0,
    '图外词竟产出关联: ' + JSON.stringify(r.allAssociations.slice(0, 3)));
});

check('maxPerNode 上限未被突破（读取侧）', () => {
  const r = la.getAssociations('焦虑');
  assert.ok(r.associations.length <= 10, 'getAssociations 返回 ' + r.associations.length + ' 条（上限 10）');
});

check('桥接不修改 dict-data 原文件', () => {
  const before = require('crypto').createHash('sha256')
    .update(require('fs').readFileSync(path.join(ROOT, 'dict-data/association-graph.json')))
    .digest('hex');
  new AssociationGraphBridge(ROOT).applyTo({ nodes: {} });
  const after = require('crypto').createHash('sha256')
    .update(require('fs').readFileSync(path.join(ROOT, 'dict-data/association-graph.json')))
    .digest('hex');
  assert.strictEqual(before, after, 'dict-data 原文件被改动');
});

// ─────────────────────────────────────────────────────────────
// D. JSON 语法完整性（r541 修的 story-prototypes）
// ─────────────────────────────────────────────────────────────
console.log('\n[D] 数据文件 JSON 完整性');

check('story-prototypes.json 可解析且含 24 个原型', () => {
  const p = JSON.parse(require('fs').readFileSync(
    path.join(ROOT, 'src/core/associative-engine/story-prototypes.json'), 'utf8'));
  assert.ok(p.prototypes && typeof p.prototypes === 'object' && !Array.isArray(p.prototypes),
    'prototypes 应为 id→原型 的对象映射');
  const ids = Object.keys(p.prototypes);
  assert.strictEqual(ids.length, 24, '原型数=' + ids.length);
  for (const id of ids) {
    const pr = p.prototypes[id];
    assert.ok(typeof pr.keywords !== 'undefined' && Array.isArray(pr.keywords) && pr.keywords.length > 0,
      id + ' 缺 keywords');
  }
});

check('每个原型的 metaphors 是数组（r541 修复的就是这里）', () => {
  const p = JSON.parse(require('fs').readFileSync(
    path.join(ROOT, 'src/core/associative-engine/story-prototypes.json'), 'utf8'));
  for (const [id, pr] of Object.entries(p.prototypes)) {
    assert.ok(Array.isArray(pr.metaphors), id + '.metaphors 非数组 → ' + typeof pr.metaphors);
  }
});

// ─────────────────────────────────────────────────────────────
// E. 端到端 process()（全链不断）
// ─────────────────────────────────────────────────────────────
console.log('\n[E] 端到端 AssociativeEngine.process()');

(async () => {
  const { AssociativeEngine } = require(path.join(ROOT, 'src/archive/associative-engine.js'));
  let eng;
  check('引擎可构造（五个子模块 require 路径正确）', () => {
    eng = new AssociativeEngine(ROOT);
    assert.ok(eng, '构造失败');
  });

  const E2E = [
    '我感到很焦虑，因为工作压力太大了',
    '专注和心流是深度工作的关键',
  ];

  for (const s of E2E) {
    check('process() 五层全 success 且 L1 产出非零: "' + s.slice(0, 12) + '…"', async () => {
      const r = await eng.process(s);
      const L = r.internal.layers;
      for (const [k, v] of Object.entries(L)) {
        if (k.endsWith('Status')) assert.strictEqual(v, 'success', k + '=' + v);
      }
      assert.ok(L.L1.allAssociations.length > 0, 'L1 allAssociations=0');
      assert.ok(L.L3.inputKeywords.length > 0, 'L3 inputKeywords=0（L1→L3 接线断）');
    });
  }

  // 等待 async check 落账
  await new Promise(r => setTimeout(r, 50));

  console.log('\n──────────────────────────────────');
  console.log('通过 ' + passed + ' / 失败 ' + failed);
  if (failed > 0) {
    console.log('\n失败项:');
    for (const f of failures) console.log('  · ' + f);
  }
  console.log('──────────────────────────────────\n');
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
