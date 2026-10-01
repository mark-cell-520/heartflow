/**
 * continuous-learner-wiring.test.js — 心虫自主升级（第 316 轮）
 *
 * 背景（本次修复的真实缺陷，与 r315 的 KnowledgeExplorer 同源）：
 *   v6.3.45「删除 40 个死模块」删掉了 src/cortex/continuous-learner.js 及其测试，
 *   但调用点与假桥接全部留着：
 *     - src/core/heartflow.js:509  `_lazy('continuousLearner', () => _stubFactory(...))` → 空壳
 *     - src/core/think-pipeline.js:26/65-68  reflect(...)
 *     - src/core/think-pipeline.js:73-96  闭环2「连续低置信→提升探索优先级」读 getStats()
 *     - src/core/think-pipeline.js:160-174 hypothesisDriver 读 getStats() + _cumulativeSummary()
 *     - src/core/think-pipeline.js:229-239 「反复低置信→调低 confidence-gate 路由权重」
 *     - src/core/heartflow.js:4187  absorbLearnerSignals(getStats())
 *     - src/core/self-diagnosis.js:61 诊断报表的 thinkCount / lowConfidenceRate
 *     - src/core/engine-reasoner.js:1098 后置反思
 *   空壳实例原型只有 constructor，getStats() 返回 {}，
 *   于是上面每一条 `clStats.xxx > N` 判断恒为 false/NaN —— 七个消费方全部静默走空。
 *   更隐蔽的是第 65 行还有一个 globalThis 假对象：
 *     globalThis.continuousLearner = { getStats: () => ({ totalConfidenceGaps: 0, topGaps: [] }) };
 *   它的字段名与真实实现不同（totalConfidenceGaps/topGaps vs thinkCount/lowConfidenceHits），
 *   拿到它的消费方会把统计当 0，比空壳更像真相。
 *
 * 本测试的语义：守卫「有调用点的持续学习能力必须接到真实现」，
 * 并且「假桥接/空壳不许再回来」。删条注入后必须变红
 * （见 scripts/negative-test-continuous-learner-wiring-r316.js）。
 */
const path = require('path');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const fs = require('fs');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); } // eslint-disable-line no-console
}

const readSrc = (rel) => fs.readFileSync(path.join(HF, rel), 'utf8');

console.log('\n[ContinuousLearner 接线真伪 — 静态]');

// ─── 静态守卫 1：lazy 声明指向真实模块 ────────────────────────

t('heartflow.js 的 _ContinuousLearner 指向真实模块，不是 stub', () => {
  const src = readSrc('src/core/heartflow.js');
  const decls = src.split('\n').filter(l =>
    /const\s+_ContinuousLearner\s*=\s*_lazy\(/.test(l)
  );
  assert.ok(decls.length >= 1, '找不到 _ContinuousLearner 声明');
  assert.ok(
    decls.some(l => l.includes('continuous-learner.js')),
    `_ContinuousLearner 没有声明指向真实模块: ${decls.map(l => l.trim()).join(' | ')}`
  );
  const stubbed = decls.filter(l => /_stubFactory/.test(l));
  assert.strictEqual(stubbed.length, 0,
    `_ContinuousLearner 仍有 _stubFactory 声明（空壳）: ${stubbed.map(l => l.trim()).join(' | ')}`);
});

t('真实模块文件存在且导出 ContinuousLearner 类', () => {
  const p = path.join(HF, 'src/cortex/continuous-learner.js');
  assert.ok(fs.existsSync(p), 'src/cortex/continuous-learner.js 缺失（r316 恢复的实现）');
  const mod = require(p);
  assert.ok(typeof mod.ContinuousLearner === 'function', '模块没导出 ContinuousLearner');
});

t('globalThis 假 continuousLearner 对象已被移除', () => {
  const src = readSrc('src/core/heartflow.js');
  // 只查可执行代码行：注释里保留对历史假对象的说明（r316 注释），
  // 若把注释也纳入匹配就会自己命中自己（r315 在 KnowledgeExplorer 上踩过同款坑）。
  const codeLines = src.split('\n').filter(l => !/^\s*(\/\/|\/\*|\*)/.test(l));
  const bad = codeLines.filter(l => /globalThis\.continuousLearner\s*=/.test(l));
  assert.strictEqual(bad.length, 0,
    `仍有 globalThis.continuousLearner 假对象代码（字段名与真实实现不同，会把统计当 0）: ${bad.map(l => l.trim())}`);
});

t('实例化点的 catch 兜底不许伪装成真统计', () => {
  const src = readSrc('src/core/heartflow.js');
  const catchLine = src.split('\n').find(l =>
    /this\.continuousLearner\s*=\s*\{\s*learn/.test(l)
  );
  assert.ok(catchLine, '找不到 continuousLearner 实例化/兜底语句');
  // 兜底对象只允许出现在 catch 块里（构造崩了才用），不能抢在 try 成功前赋值
  const idx = src.split('\n').indexOf(catchLine);
  const before = src.split('\n').slice(Math.max(0, idx - 2), idx).join('\n');
  assert.ok(
    /catch\s*\(/.test(before),
    '兜底 continuousLearner 对象不在 catch 块内（可能是常态赋值）'
  );
});

// ─── 静态守卫 2：调用面仍然完整（防止「接线成功但调用点被删」）──

t('think-pipeline 的持续学习调用面完整', () => {
  const src = readSrc('src/core/think-pipeline.js');
  const reflectCalls = (src.match(/continuousLearner\.reflect\(/g) || []).length;
  assert.ok(reflectCalls >= 2,
    `think-pipeline 对 continuousLearner.reflect 的调用点应 >=2，实测 ${reflectCalls}`);
  const statsCalls = (src.match(/continuousLearner\.getStats\(/g) || []).length;
  assert.ok(statsCalls >= 2,
    `think-pipeline 对 continuousLearner.getStats 的调用点应 >=2，实测 ${statsCalls}`);
});

t('闭环2「连续低置信→提升探索优先级」的判断条件没被废除', () => {
  const src = readSrc('src/core/think-pipeline.js');
  assert.ok(/clStats\.thinkCount\s*>\s*10/.test(src),
    '闭环2 的 thinkCount>10 门槛被删/被改（低置信闭环永远进不去）');
  assert.ok(/lowConfRate\s*>\s*0\.3/.test(src),
    '闭环2 的 lowConfRate>0.3 门槛被删/被改');
  assert.ok(/source:\s*'low-confidence-boost'/.test(src),
    '闭环2 的 low-confidence-boost 缺口注册被删（提优先级动作消失）');
});

t('「反复低置信→调低路由权重」的判断条件没被废除', () => {
  const src = readSrc('src/core/think-pipeline.js');
  assert.ok(/lowConfRate\s*>\s*0\.3/.test(src), '路由权重反馈的 lowConfRate>0.3 门槛被删');
  assert.ok(/confidence-gate/.test(src),
    'confidence-gate 反馈点被删（连续低置信不再调低路由权重）');
});

t('heartflow.js 用真实 getStats 喂 absorbLearnerSignals', () => {
  const src = readSrc('src/core/heartflow.js');
  assert.ok(/absorbLearnerSignals\(\s*this\.continuousLearner\.getStats\(\)\s*\)/.test(src),
    'absorbLearnerSignals 不再接收 continuousLearner.getStats() —— 缺口聚合断链');
});

t('self-diagnosis 消费方仍读 learnerStats 字段', () => {
  const src = readSrc('src/core/self-diagnosis.js');
  assert.ok(/learnerStats\?\.thinkCount/.test(src), 'self-diagnosis 不读 learnerStats.thinkCount');
  assert.ok(/learnerStats\.lowConfidenceHits/.test(src),
    'self-diagnosis 不读 learnerStats.lowConfidenceHits');
});

// ─── 运行时守卫：真引擎实例 ────────────────────────────────────

console.log('\n[ContinuousLearner 接线真伪 — 运行时]');
const { HeartFlow } = require(path.join(HF, 'src/core/heartflow.js'));

(async () => {
  const hf = new HeartFlow({ dataDir: path.join(HF, 'data'), silent: true });
  hf.start();
  await new Promise(r => setTimeout(r, 3500));

  const cl = hf.continuousLearner;

  t('hf.continuousLearner 是真实 ContinuousLearner 类', () => {
    assert.ok(cl, 'continuousLearner 实例缺失');
    const proto = Object.getPrototypeOf(cl);
    assert.strictEqual(proto.constructor.name, 'ContinuousLearner',
      `构造器不是 ContinuousLearner：${proto.constructor.name}`);
    const methods = Object.getOwnPropertyNames(proto);
    for (const m of ['reflect', 'getStats', '_detectSignals', '_cumulativeSummary']) {
      assert.ok(methods.includes(m), `实例缺 ${m}（接到 stub 空壳了）`);
    }
  });

  t('_modules 注册了 continuousLearner（dispatch/MCP 取得到）', () => {
    assert.ok(hf._modules && hf._modules.continuousLearner === cl,
      '_modules.continuousLearner 与实例不一致或未注册');
  });

  t('getStats() 返回真实统计字段（不是 {}）', () => {
    const s = cl.getStats();
    assert.ok(s && typeof s === 'object', 'getStats() 没返回对象');
    assert.ok(typeof s.thinkCount === 'number' && s.thinkCount > 0,
      `getStats().thinkCount 应为正数，实测 ${s && s.thinkCount}`);
    assert.ok(typeof s.lowConfidenceHits === 'number',
      'getStats() 缺 lowConfidenceHits —— 拿到的可能是假桥接的 totalConfidenceGaps 形状');
    assert.ok(!('totalConfidenceGaps' in s),
      'getStats() 出现假桥接的 totalConfidenceGaps 字段，说明接到了假对象');
  });

  t('reflect() 真改变内部状态（消费方 getStats 的递增来源）', () => {
    const before = cl.getStats().thinkCount;
    const r = cl.reflect({ type: 'analytical', confidence: 0.2, chain: [] },
      'r316 自检：这个结论毫无疑问一定正确', hf.lesson);
    const after = cl.getStats().thinkCount;
    assert.ok(after > before,
      `reflect 后 thinkCount 未递增（${before} → ${after}）——reflect 是空跑`);
    assert.ok(r && typeof r === 'object' && r.reflected !== undefined,
      'reflect 返回值形状异常');
  });

  t('低置信输入被 _detectSignals 识别（闭环2 的数据源）', () => {
    const sig = cl._detectSignals({ type: 'analytical', confidence: 0.2 }, '短输入');
    assert.ok(sig && typeof sig === 'object', '_detectSignals 没返回信号对象');
    assert.ok(sig.lowConfidence === true,
      'confidence=0.2 未被标记 lowConfidence —— 闭环2 的数据源是空的');
  });

  t('absorbLearnerSignals 收到真实统计后能生成置信校准缺口', () => {
    const stats = cl.getStats();
    const before = hf.knowledgeExplorer.getGaps().length;
    hf.knowledgeExplorer.absorbLearnerSignals(stats);
    const gaps = hf.knowledgeExplorer.getGaps();
    const hasCalib = gaps.some(g => (g.topic || '').includes('置信度校准优化'));
    assert.ok(hasCalib || gaps.length > before,
      '真实统计喂入 absorbLearnerSignals 后既没生成「置信度校准优化」缺口也没新增缺口');
  });

  // think() 是 async，单独等它跑完再做链路级判断
  const thinkRes = await hf.think('r316 自检：请给出一个确定的结论，不要犹豫。');

  t('think() 后 _initErrors 里没有 continuousLearner/knowledgeExplorer 记录', () => {
    const errs = (hf._initErrors || []).filter(e =>
      /continuousLearner|knowledgeExplorer|gapExecutor/.test(e.module || '')
    );
    assert.strictEqual(errs.length, 0,
      `初始化错误里有持续学习/探索相关模块: ${JSON.stringify(errs).slice(0, 300)}`);
  });

  // 用含领域本体词的输入，才能观测到 think-pipeline 的知识域探测段。
  // 注意：ontology 的字面量匹配只看 id / name / nameEn —— 探针实测
  // 「quantum mechanics」匹配不到任何域（不是 physics 的子串），
  // 必须用 physics / medicine 这类域词本身（scripts/round-316/probe-domains.js）。
  const domainRes = await hf.think('physics 学科最新研究进展');

  t('含领域词的 think() 产出 knowledgeDomains（探测段活着）', () => {
    assert.ok(Array.isArray(domainRes.knowledgeDomains),
      'knowledgeDomains 不是数组 —— 探测段或探索触发段被静默吞掉');
    assert.ok(domainRes.knowledgeDomains.length > 0,
      'knowledgeDomains 为空数组 —— ontology 匹配没生效');
  });

  t('两次 think 后 continuousLearner 统计递增（reflect 真的在链路里）', () => {
    const s = cl.getStats();
    assert.ok(s.thinkCount >= 2,
      `累计 thinkCount = ${s.thinkCount}，链路里的 reflect 疑似没跑`);
    assert.ok(s.totalReflections >= 2,
      `totalReflections = ${s.totalReflections}，反思产出缺失`);
  });

  t('探索链路有活性字段或跨调用去重状态', () => {
    const s = JSON.stringify(domainRes);
    const anyExplore = /"_autoExplored"|"_exploreOnVerify"|"_anticipating"/.test(s);
    const dedupActive = hf._exploredDomains && Object.keys(hf._exploredDomains).length > 0;
    assert.ok(anyExplore || dedupActive,
      'think() 既没产出任何探索字段也没有跨调用去重状态 —— 插件链路仍断');
  });

  console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
  process.exit(fail > 0 ? 1 : 0);
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
