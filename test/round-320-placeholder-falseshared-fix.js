/**
 * r320 轮测：fallacy_of_relevance 拉丁占位符假零共享误拦修复
 *  + incentive_blind_spot ②-h2 中性陈述误判修复
 *
 * 背景（round-188 存量债，pristine 同败）：
 *  1. fallacy_of_relevance 的 extractZhWords 只抽 [\u4e00-\u9fa5]{2,}，
 *     「大多数A是B，大多数B是C，所以至少有些A是C」的拉丁占位符 A/B/C
 *     不被抽取 → pre/post 实词各自为零 → 假「零共享」→ 误拦 rewrite。
 *  2. incentive_blind_spot ②-h2 腿（r301）的正则 (无条件标记)?×(连接词)?
 *     全可选 → 任何「名词+评价形容词」都命中 → 「这个方案是可行的」中性
 *     陈述被误判。
 *
 * 修复：
 *  1. extractZhWords 补 [A-Za-z0-9]+ 腿（upper 归一）——占位符是承载主题
 *     的符号，pre/post 共享 {A,C} → 豁免良性特称结论。
 *  2. ②-h2 拆为 h2-a 无条件标记形（至少 1 个标记）+ h2-b 强化断言形
 *     （完全/绝对/百分百 × 可行/正确）。
 *
 * 运行：node test/round-320-placeholder-falseshared-fix.js
 */
'use strict';

const { gate } = require('../src/gate.js');
const { extractZhWords, extractEnWords } = require('../src/fallacy-of-relevance.js');

let pass = 0;
let fail = 0;

function check(tag, text, expectAction, expectDim) {
  const r = gate(text);
  const dims = (r.findings || []).map((f) => f.dimension);
  const ok = r.gate.action === expectAction &&
    (expectDim ? dims.includes(expectDim) : true);
  if (ok) {
    pass++;
    console.log(`  ✅ ${tag}`);
  } else {
    fail++;
    console.log(`  ❌ ${tag}`);
    console.log(`     text: ${text}`);
    console.log(`     expect action=${expectAction}${expectDim ? ` dim=${expectDim}` : ''}，` +
      `got action=${r.gate.action} dims=[${dims.join(',')}]`);
  }
}

// ── A 组：fallacy_of_relevance 拉丁占位符良性特称结论 → 应 pass ──
console.log('\n[A 组] 拉丁占位符良性特称结论 → pass（修复前 rewrite 误拦）');
check('A1 至少有些', '大多数A是B，大多数B是C，所以至少有些A是C。', 'pass');
check('A2 some 英文', 'Most A are B, most B are C, so at least some A are C.', 'pass');
check('A3 甲乙方占位', '大多数甲方支持这个方案，大多数支持者认可它的价值，所以至少有些甲方认可它。', 'pass');

// ── B 组：fallacy_of_relevance 真零共享攻击 → 仍 rewrite ──
console.log('\n[B 组] 真零共享攻击 → rewrite（补腿不削弱真判据）');
check('B1 零共享攻击', '大多数A是B，所以C一定是D。', 'rewrite', 'fallacy_of_relevance');
check('B2 全称累积攻击', '大多数A是B，大多数B是C，所以大多数A是C。', 'verify');
check('B3 无关跳跃', '大多数年轻人喜欢奶茶，所以房价一定会跌。', 'rewrite', 'fallacy_of_relevance');

// ── C 组：extractZhWords 拉丁腿直测 ──
console.log('\n[C 组] extractZhWords 拉丁/数字腿');
{
  const pre = extractZhWords('大多数A是B');
  const post = extractZhWords('至少有些A是C');
  const shared = [...pre].filter((w) => post.has(w));
  if (pre.has('A') && post.has('A') && post.has('C')) {
    pass++;
    console.log(`  ✅ C1 pre∩post={${[...shared].sort().join(',')}}（A 共享驱动豁免）`);
  } else {
    fail++;
    console.log(`  ❌ C1 pre∩post={${[...shared].sort().join(',')}}，pre=[${[...pre].sort().join(',')}] post=[${[...post].sort().join(',')}]`);
  }
  const numWords = extractZhWords('R1 指向 R2');
  if (numWords.has('R1') && numWords.has('R2')) {
    pass++;
    console.log('  ✅ C2 数字占位符 R1/R2 被抽取');
  } else {
    fail++;
    console.log(`  ❌ C2 numWords=[${[...numWords].sort().join(',')}]`);
  }
}

// ── D 组：incentive_blind_spot 良性中性陈述 → 应 pass ──
console.log('\n[D 组] incentive_blind_spot 中性陈述 → pass（修复前 verify 误拦）');
check('D1 方案可行', '这个方案是可行的。', 'pass');
check('D2 制度合理', '这个制度是合理的。', 'pass');
check('D3 我认为基本可行', '我认为这个方案基本可行，但还需要验证。', 'pass');

// ── E 组：incentive_blind_spot 无条件标记攻击 → 仍 verify ──
console.log('\n[E 组] incentive_blind_spot 无条件标记攻击 → verify（门只收标记形）');
check('E1 定价本就正确', '这个机制下定价本就是正确的，不用再测算。', 'verify', 'incentive_blind_spot');
check('E2 制度本就合理', '这个制度本就是合理的，风险会自己抵消。', 'verify', 'incentive_blind_spot');
check('E3 结构本就正确', '当前的结构本就是正确的，不需要重新测算。', 'verify', 'incentive_blind_spot');
check('E4 保费自然合理', '参保的人足够多，保费自然就是合理的。', 'verify', 'incentive_blind_spot');
check('E5 强化断言形', '这个方案完全可行，不需要额外评估。', 'verify', 'incentive_blind_spot');

// ── F 组：EN 侧保守行为不变 ──
console.log('\n[F 组] EN 侧抽取保持保守（腿① MISS 方向正确）');
{
  const enPre = extractEnWords('Most A are B, most B are C');
  if (enPre instanceof Set ? enPre.size === 0 : enPre.length === 0) {
    pass++;
    console.log('  ✅ F1 EN pre 零实词 → 腿①保守 MISS（不变）');
  } else {
    fail++;
    const arr = enPre instanceof Set ? [...enPre] : enPre;
    console.log(`  ❌ F1 enPre=[${arr.join(',')}]`);
  }
}

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
if (fail > 0) {
  console.log('❌ 存在失败项');
  process.exit(1);
} else {
  console.log('✅ 全部通过');
}
