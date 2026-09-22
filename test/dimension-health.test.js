/**
 * 测试：判别维度健康度面板（v6.7.75，心虫 decision.decide 0.94）
 *
 * 面板目的：量化"哪些维度从未被基准验证"——比门禁灵敏度更根本的盲区。
 *
 * 关键教训（本测试固化）：
 * 面板第一版报 22 个 BROKEN，逐个查证后发现**全部是面板口径缺陷**，
 * 不是引擎缺陷。三个坑：
 *   1. 只测模式库前 8 条 — stereotype/sealioning/dogwhistle 的命中模式
 *      排在第 6+ 位，前 8 条全是概括类不命中 → 误报
 *   2. `[\s\S]*?\n\};` 非贪婪在内部第一个 `\n};` 停 — FALLACY_PATTERNS
 *      有 148 条正则被截成 1 条
 *   3. 维度名单复数 ≠ 常量名单数 — fallacies → FALLACY_PATTERNS
 *
 * 最终口径：BROKEN 只表示"探针也没命中"，**不等于维度失效**。
 * 加 UNKNOWN 状态（面板无法判定）避免把口径限制冒充成引擎缺陷。
 *
 * 实测最终结论：3 个 BROKEN 全部手工验证为**活着**（profundity 5/5、
 * softDeflection 2/2、sycophancy 1/1）。即未发现真失效维度。
 */
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const idx = require(path.join(HF, 'src/index.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

console.log('\n[面板自身可加载]');

t('dimension-health.js 语法正确且含双口径', () => {
  const src = fs.readFileSync(path.join(HF, 'scripts/dimension-health.js'), 'utf8');
  assert.ok(src.includes('extractConstBody'), '应用括号配对提取');
  assert.ok(src.includes('extractFnBody'), '应有函数体提取');
  assert.ok(src.includes("'UNKNOWN'"), '应有 UNKNOWN 状态（不冒充 BROKEN）');
  assert.ok(src.includes('DIM_HEALTH_JSON_START'), 'JSON 应有哨兵包裹');
});

t('不含已知的缺陷写法', () => {
  const src = fs.readFileSync(path.join(HF, 'scripts/dimension-health.js'), 'utf8');
  assert.ok(!src.includes('.slice(0, 8)'), '不该只测前 8 条模式（会漏判）');
});

console.log('\n[三个"BROKEN"维度实际都活着]');

t('pseudoProfundity 5/5 命中', () => {
  for (const s of [
    '从这个命题出发，我们需要重新思考',
    '在新时代背景下，我们要主动作为',
    '深刻认识这个问题',
    '以用户为核心导向',
    '赋能组织转型',
  ]) {
    assert.ok(idx.checkPseudoProfundity(s).count > 0, `未命中: ${s}`);
  }
});

t('softDeflection 英文让步句命中', () => {
  for (const s of [
    'We are not perfect but the results are good',
    'Of course it might be occasionally but but',
  ]) {
    assert.ok(idx.checkSoftDeflection(s).count > 0, `未命中: ${s}`);
  }
});

t('sycophancy 谄媚句命中', () => {
  // 注意：checkSycophancy 返回 totalHits 而非 count（不同维度返回字段不一）
  const r = idx.checkSycophancy('您说得完全对，您太聪明了');
  assert.ok((r.totalHits || r.count || 0) > 0, `未命中: ${JSON.stringify(r).slice(0, 80)}`);
});

console.log('\n[面板无法判定 vs 真失效 必须区分]');

t('UNKNOWN 与 BROKEN 语义不同', () => {
  // UNKNOWN = 面板口径限制（无证据）；BROKEN = 探针也不命中（有证据可疑）
  // 二者混同会把口径缺陷说成引擎缺陷（第一版 22 个 BROKEN 全是这么来的）
  const src = fs.readFileSync(path.join(HF, 'scripts/dimension-health.js'), 'utf8');
  assert.ok(/probe === true \? 'UNTESTED'/.test(src), 'UNTESTED 应由 probe===true 决定');
  assert.ok(/probe === false \? 'BROKEN'/.test(src), 'BROKEN 应由 probe===false 决定');
  assert.ok(/'UNKNOWN'\)/.test(src) || /'UNKNOWN'\)/.test(src), 'UNKNOWN 为 null 时的兜底');
});

console.log('\n[维度名与常量名不一致已被处理]');

t('fallacies → FALLACY_PATTERNS 别名', () => {
  const src = fs.readFileSync(path.join(HF, 'scripts/dimension-health.js'), 'utf8');
  assert.ok(src.includes('FALLACIES'), '应有 FALLACIES 别名映射');
});

console.log('\n[结论记录]');

t('面板最终结论：未发现真失效维度', () => {
  // 这是本轮的诚实结论——3 个 BROKEN 全部验证为活着。
  // 若未来本测试失败，说明出现了真失效维度，应修引擎而非改测试。
  const suspicious = ['pseudoProfundity', 'softDeflection', 'sycophancy'];
  for (const d of suspicious) {
    const fn = idx['check' + d.charAt(0).toUpperCase() + d.slice(1)];
    assert.strictEqual(typeof fn, 'function', `${d} 应有 check 函数`);
  }
  // 抽样验证模式库非空（各维度返回字段不一：count / totalHits）
  const n = (fn, s) => { const r = fn(s); return r.totalHits || r.count || 0; };
  assert.ok(n(idx.checkPseudoProfundity, '赋能组织转型') > 0);
  assert.ok(n(idx.checkSoftDeflection, 'We are not perfect but the results are good') > 0);
  assert.ok(n(idx.checkSycophancy, '您说得完全对，您太聪明了') > 0);
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
