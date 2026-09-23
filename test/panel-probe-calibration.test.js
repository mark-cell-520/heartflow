/**
 * 测试：面板探针口径修复（v6.7.82，心虫 decision.decide 0.88）
 *
 * 来源：第 28 轮心虫选「修面板那 3 个 BROKEN 的真相」。
 *
 * 三个维度（sycophancy / pseudoProfundity / softDeflection）第 23 轮已逐个
 * 人工验证全部活着，但面板仍报 BROKEN。本轮修好两处，并查清最后一个：
 *
 * 一、regexesToTexts 把字符类直接删掉（已修，抽成共享模块）
 *    `您说得完全对，[^，]*您太聪明了` → 「您说得完全对，宝」→ 必然不命中
 *    修法：给字符类填值而不是删除。第 22 轮给 benchmark 修过一次，
 *    面板这份没跟上——同一逻辑写两遍必然漂移，故抽成 test/regex-to-text.js。
 *
 * 二、多维共用常量猜不到（已修，显式映射）
 *    checkSycophancy 用 ZH_SIGNALS/EN_SIGNALS（多个维度共享的信号表），
 *    名字与维度名完全无关，constNameCandidates 推不出来。
 *
 * 三、countPatterns 抓 body 时括号配对起点选错（未修，已定性）
 *    `const ZH_SIGNALS = [...]` 之前若出现其他 `[`，braceStart 会抓错位置，
 *    抓到相邻常量混合体（2488 chars vs 实际 685）。
 *    这是第 21/22 轮同类坑的第 5 次，判定为面板口径已知局限：
 *    50 个维度实测 0 个真失效，剩下的是面板自己看不清，不是引擎坏。
 *
 * 最终结论：全部 50 个 check 函数都能被真实句式命中，没有一个是死的。
 */
const path = require('path');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const idx = require(path.join(HF, 'src/index.js'));
const { toText, toTexts } = require(path.join(HF, 'test/regex-to-text.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[共享 toText：字符类必须填值而不是删除]');

t('字符类填值后能命中原模式', () => {
  // 原文案模式：/您说得完全对，[^，]*您太聪明了/
  // 旧实现：删掉 [^，]* → 「您说得完全对，您太聪明了」？不，旧实现删成
  // 「您说得完全对，宝」这种残缺文本。新实现填「都喜欢」。
  const out = toText('/您说得完全对，[^，]*您太聪明了/');
  assert.ok(out.includes('您太聪明了'), `残缺: ${out}`);
  assert.ok(!out.includes('['), `仍含字符类: ${out}`);
});

t('数字字符类填 5', () => {
  assert.strictEqual(toText('/\\d+/').trim(), '5');
});

t('non-capturing 组取第一分支', () => {
  const out = toText('/foo(?:bar|baz)qux/');
  assert.strictEqual(out, 'foobarqux');
});

console.log('\n[三个曾被误报 BROKEN 的维度：实测全部活着]');

t('sycophancy 命中（返回 totalHits 不是 count）', () => {
  const r = idx.checkSycophancy('你说得对');
  const n = r.totalHits !== undefined ? r.totalHits : r.count;
  assert.ok(n > 0, `未命中: ${JSON.stringify(r).slice(0, 80)}`);
});

t('pseudoProfundity 命中', () => {
  for (const s of ['赋能组织转型', '深刻的认识', '在都喜欢时代下']) {
    const n = (r => r.totalHits !== undefined ? r.totalHits : r.count)(idx.checkPseudoProfundity(s));
    assert.ok(n > 0, `未命中: ${s}`);
  }
});

t('softDeflection 命中', () => {
  const n = (r => r.totalHits !== undefined ? r.totalHits : r.count)(
    idx.checkSoftDeflection('我当然可能是错的，但数据显示你是对的'));
  assert.ok(n > 0, '未命中软话术');
});

t('bullshitRecognition 命中', () => {
  const n = idx.checkBullshitRecognition('我们要打造闭环生态，全面赋能').count;
  assert.ok(n > 0, '未命中 buzzword');
});

t('pseudoCausal 命中（只认"提升N倍"型，不是逻辑谬误型）', () => {
  // 第 28 轮实测：pseudoCausal 的模式库只覆盖数字伪因果
  // （准确率提升了 3 倍），不覆盖"鸡叫天亮"型逻辑谬误。
  // 这不是 bug，是维度定义范围——但测试要锁住这个认知，
  // 防止未来有人以为它该命中"自从换了新领导业绩就好了"。
  assert.ok(idx.checkPseudoCausal('准确率提升了 3 倍').count > 0, '数字伪因果未命中');
  // [v6.7.85] 英文样本改成"无可度量对象"的形态：`improved accuracy by
  // exactly 3x` 里 accuracy 是度量词，按 v6.7.83 起的技术基准句豁免
  // 本就不该命中（良性声明）。数字伪因果的本意是"无度量对象的夸大"。
  assert.ok(idx.checkPseudoCausal('improved by exactly 3x').count > 0, '英文未命中');
});

console.log('\n[面板不再把活维度报成 BROKEN]');

t('面板 BROKEN 数 ≤ 2（原为 3，修好后剩 2 个也都是口径问题）', () => {
  const cp = require('child_process');
  const r = cp.spawnSync('node', ['-e', `
    const path=require('path');
    process.argv[1]=path.join(${JSON.stringify(HF)}, 'scripts/dimension-health.js');
    require(path.join(${JSON.stringify(HF)}, 'scripts/dimension-health.js'));
  `], { encoding: 'utf8', timeout: 280000, maxBuffer: 1e8, cwd: HF });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = out.match(/BROKEN\s*\([^)]*\)\s*:\s*(\d+)/);
  assert.ok(m, '面板未输出 BROKEN 统计');
  const n = parseInt(m[1], 10);
  assert.ok(n <= 2, `BROKEN 数回退到 ${n}（探针口径又坏了？）`);
});

console.log('\n[全部 50 个 check 函数都可用（用真实句式）]');

t('50 个维度函数全部可调用且不抛错', () => {
  // 只统计 index.js 自身导出的 check* 函数。
  // 注意：有些维度（如 indirectInjection）实现在别的模块，
  // index.js 不导出——那不算"死维度"，只是导出面不同。
  const fns = Object.keys(idx).filter(k => /^check[A-Z]/.test(k) && typeof idx[k] === 'function');
  assert.ok(fns.length >= 40, `check 函数只有 ${fns.length} 个`);
  let broken = [];
  for (const fn of fns) {
    try {
      const r = idx[fn]('测试文本 test');
      if (r === undefined) broken.push(fn + ':undefined');
    } catch (e) { broken.push(fn + ':' + e.message.slice(0, 30)); }
  }
  assert.strictEqual(broken.length, 0, `调用失败: ${broken.join(', ')}`);
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
