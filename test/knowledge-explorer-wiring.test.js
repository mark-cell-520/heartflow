/**
 * knowledge-explorer-wiring.test.js — 心虫自主升级（第 315 轮）
 *
 * 背景（本次修复的真实缺陷）：
 *   v6.3.45「删除 40 个死模块」时删掉了 src/cortex/knowledge-explorer.js 与
 *   src/cortex/gap-executor.js，但**调用点全部留着**：
 *     - src/core/think-pipeline.js  4 处（getGaps / registerGap / nextToExplore）
 *     - src/plugins/explore-on-verify/index.js  4 处
 *     - src/core/heartflow.js:4166 `new KnowledgeExplorer()`（裸全局）
 *   而 heartflow.js 第 56 行有一个 globalThis 假桥接类，只有 healthCheck 与
 *   空 absorbLearnerSignals。于是 `new KnowledgeExplorer()` 解析到假类，
 *   gapExecutor 则由 _stubFactory('GapExecutor') 生成空壳（原型只有 constructor）。
 *   每次调用 getGaps() 都撞 TypeError，被 think-pipeline 的 try/catch 静默吞掉。
 *
 *   实测复现（接线前）：
 *     - hf.knowledgeExplorer 原型方法 = [健康检查, absorbLearnerSignals]（无 getGaps）
 *     - hf.gapExecutor 原型方法 = []（无 execute）
 *     - result.knowledgeDomains 恒为 undefined（think-pipeline:244 探测段被吞）
 *     - result._exploreOnVerify / result._anticipating 恒为 undefined（插件被吞）
 *
 * 本测试的语义：守卫「有调用点的能力必须接到真实现」，
 * 而不是接到 globalThis 假桥接或 _stubFactory 空壳。
 * 删条注入后必须变红（见 scripts/negative-test-knowledge-explorer-wiring-r315.js）。
 */
const path = require('path');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const fs = require('fs');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[KnowledgeExplorer / GapExecutor 接线真伪]');

// ─── 静态守卫：假桥接与 stub 不许再被引用 ────────────────────────

t('heartflow.js 不再有 stub 化的 GapExecutor 声明', () => {
  const src = fs.readFileSync(path.join(HF, 'src/core/heartflow.js'), 'utf8');
  const stubLine = src.split('\n').find(l =>
    /const\s+_GapExecutor\s*=\s*_lazy\(/.test(l)
  );
  assert.ok(stubLine, '找不到 _GapExecutor 声明');
  assert.ok(
    stubLine.includes('gap-executor.js'),
    `_GapExecutor 声明未指向真实模块（仍是 stub？）: ${stubLine.trim()}`
  );
});

t('heartflow.js 不再有 stub 化的 KnowledgeExplorer 声明', () => {
  const src = fs.readFileSync(path.join(HF, 'src/core/heartflow.js'), 'utf8');
  const decls = src.split('\n').filter(l =>
    /const\s+_KnowledgeExplorer\s*=\s*_lazy\(/.test(l)
  );
  assert.ok(decls.length >= 1, '找不到 _KnowledgeExplorer 声明（接的哪门子线）');
  assert.ok(
    decls.some(l => l.includes('knowledge-explorer.js')),
    `_KnowledgeExplorer 没有任何一条声明指向真实模块: ${decls.map(l => l.trim()).join(' | ')}`
  );
  // 只允许一条真加载声明：多声明会让后一个 const 覆盖前一个（r315 实测踩过）
  const real = decls.filter(l => l.includes('knowledge-explorer.js'));
  assert.strictEqual(real.length, 1,
    `_KnowledgeExplorer 真加载声明出现 ${real.length} 次（重复声明会互相覆盖）`);
});

t('实例化点用 lazy 真实类，不是裸全局 new KnowledgeExplorer()', () => {
  const src = fs.readFileSync(path.join(HF, 'src/core/heartflow.js'), 'utf8');
  const lines = src.split('\n');
  const bad = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/=\s*new\s+KnowledgeExplorer\(\)/);
    if (!m) continue;
    // 往前看 3 行内是否有解构真实类的语句；有则该处是合法接线
    const ctx = lines.slice(Math.max(0, i - 3), i + 1).join('\n');
    if (!/const\s*\{\s*KnowledgeExplorer\s*\}\s*=\s*_KnowledgeExplorer\(\)/.test(ctx)) {
      bad.push(`L${i + 1}: ${lines[i].trim()}`);
    }
  }
  assert.strictEqual(bad.length, 0,
    `仍有裸全局 new KnowledgeExplorer()（会解析到 globalThis 假桥接类）: ${bad.join(' ; ')}`);
  assert.ok(/const\s*\{\s*KnowledgeExplorer\s*\}\s*=\s*_KnowledgeExplorer\(\)/.test(src),
    '实例化点缺少从 _KnowledgeExplorer() 解构真实类的语句');
});

t('globalThis 假桥接的 KnowledgeExplorer 类声明已被标注/清除', () => {
  const src = fs.readFileSync(path.join(HF, 'src/core/heartflow.js'), 'utf8');
  const lines = src.split('\n');
  const idx = lines.findIndex(l => /globalThis\.KnowledgeExplorer\s*=/.test(l));
  assert.ok(idx >= 0, '找不到 globalThis.KnowledgeExplorer 假桥接声明');
  // 允许保留（向后兼容旧模块），但必须被标记为不可用，
  // 否则下一个人还会把它当真实现接入。
  // 怎么判：从上一行开始往上收集连续注释块（不限 3 行 —— 历史上
  // 注释块比窗口长，导致本守卫取不到标注，r315 实测踩过）。
  const comment = [];
  for (let i = idx - 1; i >= 0 && /^\s*(\/\/|\/\*|\*)/.test(lines[i]); i--) {
    comment.push(lines[i]);
  }
  const context = comment.reverse().join('\n');
  assert.ok(
    /假桥接|FAKE|deprecated|不可用|仅兼容|r315/.test(context),
    'globalThis 假桥接类没有「不可用」标注，容易被再次当真实现接入'
  );
});

t('KnowledgeExplorer 有 getGaps / registerGap（调用点依赖的接口）', () => {
  const src = fs.readFileSync(path.join(HF, 'src/cortex/knowledge-explorer.js'), 'utf8');
  assert.ok(/getGaps\s*\(/.test(src), 'KnowledgeExplorer 缺 getGaps');
  assert.ok(/registerGap\s*\(/.test(src), 'KnowledgeExplorer 缺 registerGap');
});

t('GapExecutor 有 execute / executeBatch（think-pipeline 调用点依赖）', () => {
  const src = fs.readFileSync(path.join(HF, 'src/cortex/gap-executor.js'), 'utf8');
  assert.ok(/execute\s*\(/.test(src), 'GapExecutor 缺 execute');
  assert.ok(/executeBatch\s*\(/.test(src), 'GapExecutor 缺 executeBatch');
});

t('think-pipeline 的知识域探测段不再注定被静默吞掉', () => {
  // 探测段用 engine.knowledge.ontology.domains；若 knowledgeExplorer 是空壳，
  // 紧邻的探索触发段会抛 TypeError 被 catch 掉，result.knowledgeDomains 依然存在，
  // 但 _autoExplored 永不出现——所以这里只断言接口存在性（真 router 在运行时测）。
  const src = fs.readFileSync(path.join(HF, 'src/core/think-pipeline.js'), 'utf8');
  assert.ok(/result\.knowledgeDomains\s*=/.test(src), 'think-pipeline 不再设置 knowledgeDomains');
  const m = src.match(/engine\.knowledgeExplorer\.(getGaps|registerGap)\(/g) || [];
  assert.ok(m.length >= 2,
    `think-pipeline 对 knowledgeExplorer 的调用点应保持 >=2 处（守卫的调用面），实测 ${m.length}`);
});

// ─── 运行时守卫：真引擎实例 ──────────────────────────────────────

console.log('\n[运行时接线实测]');
const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));

(async () => {
  const hf = new HeartFlow({ dataDir: path.join(HF, 'data'), silent: true });
  hf.start();
  await new Promise(r => setTimeout(r, 3500));

  const ke = hf.knowledgeExplorer;
  const ge = hf.gapExecutor;

  t('hf.knowledgeExplorer 是真实 KnowledgeExplorer 类', () => {
    assert.ok(ke, 'knowledgeExplorer 实例缺失');
    const proto = Object.getPrototypeOf(ke);
    assert.strictEqual(proto.constructor.name, 'KnowledgeExplorer',
      `构造器不是 KnowledgeExplorer：${proto.constructor.name}`);
    const methods = Object.getOwnPropertyNames(proto);
    assert.ok(methods.includes('getGaps'), '实例缺 getGaps（接到假桥接了）');
    assert.ok(methods.includes('registerGap'), '实例缺 registerGap（接到假桥接了）');
  });

  t('hf.gapExecutor 是真实 GapExecutor 类', () => {
    assert.ok(ge, 'gapExecutor 实例缺失');
    const proto = Object.getPrototypeOf(ge);
    assert.strictEqual(proto.constructor.name, 'GapExecutor',
      `构造器不是 GapExecutor：${proto.constructor.name}`);
    const methods = Object.getOwnPropertyNames(proto);
    assert.ok(methods.includes('execute'), '实例缺 execute（接到 stub 空壳了）');
    assert.ok(methods.includes('executeBatch'), '实例缺 executeBatch');
  });

  t('getGaps() 返回真实队列（覆盖数据文件存在时也能读）', () => {
    const gaps = ke.getGaps();
    assert.ok(Array.isArray(gaps), 'getGaps 应返回数组');
    assert.ok(gaps.length > 0, 'getGaps 返回空——data/knowledge-gaps.json 的 12 条历史 gap 读不到');
  });

  const reg = ke.registerGap({
    topic: 'r315 接线自检 gap',
    question: '本次接线是否能被后续探索调度取到？',
    source: 'round-315-wiring-test',
    priority: 9,
    suggestedQuery: 'heartflow wiring self-check',
  });

  t('registerGap() 真写入并可被 nextToExplore() 取回', () => {
    assert.ok(reg && reg.success, 'registerGap 未成功');
    const found = ke.getGaps().some(g => g.topic === 'r315 接线自检 gap');
    assert.ok(found, '注册的 gap 没出现在 getGaps() 里');
  });

  t('recordExploration() 真改变 gap 状态', () => {
    const mine = ke.getGaps().find(g => g.topic === 'r315 接线自检 gap');
    assert.ok(mine, '自检 gap 不见了');
    const r = ke.recordExploration(mine.id, {
      success: true, summary: 'r315 wiring ok', findings: ['wiring verified'], sources: [],
    });
    assert.ok(r && r.success, 'recordExploration 失败');
    const after = ke.getGaps().find(g => g.id === mine.id);
    assert.ok(after && after.explorationResult !== null, '探索结果未落库');
  });

  // ─── 调用点活性：think() 之后知识域探测必须产出 ──────────────
  const thinkRes = await hf.think('physics 领域的 quantum mechanics 最新进展如何');

  t('think() 产出 knowledgeDomains（此前恒 undefined）', () => {
    assert.ok(Array.isArray(thinkRes.knowledgeDomains),
      'knowledgeDomains 不是数组——探测段仍被静默吞掉');
    assert.ok(thinkRes.knowledgeDomains.length > 0,
      'knowledgeDomains 为空数组——ontology 匹配没生效');
  });

  t('explore-on-verify 插件被激活（此前恒 undefined）', () => {
    // 触发条件：knowledgeDomains 非空 + confidence <= 0.55 + 未被 _exploredDomains 去重
    // 注意：插件对同一 domain-key 只触发一次（跨调用去重），所以首次 think 才能看到
    // _exploreOnVerify。这里改用「链路活性」判据而不是单点字段：
    //   a) 插件挂在 hookBus 上（静态活性）
    //   b) 或本次/历史出现过 _exploreOnVerify
    const bus = hf._hookBus;
    const list = (bus && bus._handlers.get('postprocess.think')) || [];
    const onBus = list.some(h => h.id === 'explore-on-verify');
    assert.ok(onBus, 'explore-on-verify 未挂到 hookBus 的 postprocess.think');
    const conf = thinkRes.output && thinkRes.output.meta && thinkRes.output.meta.confidence;
    const firedThisTime = JSON.stringify(thinkRes).includes('"_exploreOnVerify"');
    if (conf > 0.55) return; // 置信高，本就不该触发
    assert.ok(
      firedThisTime || hf._exploredDomains && Object.keys(hf._exploredDomains).length > 0,
      `confidence=${conf} <= 0.55，但插件既未产出 _exploreOnVerify 也无跨调用去重状态——链路断`
    );
  });

  t('anticipating 插件被激活（此前恒 undefined）', () => {
    const s = JSON.stringify(thinkRes);
    const triggered = s.includes('"_anticipating"');
    assert.ok(
      triggered || hf._anticipationStats.predictions > 0,
      '_anticipating 未出现且 anticipationStats.predictions=0——插件链路仍断'
    );
  });

  t('HookBus fire() 真的在跑（不是零监听）', () => {
    const bus = hf._hookBus;
    assert.ok(bus, 'hookBus 缺失');
    const list = bus._handlers.get('postprocess.think') || [];
    assert.ok(list.length >= 4,
      `postprocess.think 监听数 = ${list.length}（插件没挂上 hookBus？）`);
    // metrics 为 {} 说明从未 fire 过
    const fired = bus._metrics.get('postprocess.think');
    assert.ok(fired && (fired.slow + fired.timeout + fired.errors) >= 0,
      'fire 之后应有 metrics 记录');
  });

  console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
