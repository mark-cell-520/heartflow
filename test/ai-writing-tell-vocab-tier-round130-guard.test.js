// 第130轮负例守卫：vocab-tier 归并逻辑的注入-删条-必须变红
// 验证：删掉 TIER 归并后，纯词表叠词句必须重新计分（证明这条逻辑是真守卫）；
// 同时证明归并没有伤到模板族共现（模板+词表仍计分）。
const path = require('path');
const ROOT = '/root/.hermes/skills/ai/mark-heartflow-skill';
process.chdir(ROOT);
const fs = require('fs');

const SRC = path.join(ROOT, 'src/shield/ai-writing-tell.js');
const SRC_ORIGINAL = fs.readFileSync(SRC, 'utf8');

function freshDetect() {
  for (const k of Object.keys(require.cache)) {
    if (k.includes('ai-writing-tell')) delete require.cache[k];
  }
  return require(SRC).detect;
}

// 归并的核心判据：「档位归一 → vocab-tier 只记一票」
const CUT = 'const normalizedFams = new Set(';
const CUT_TO_MERGE = 'return vocabTiers.has(fam) ? fam : fam;';
const CUT_TO_BARE = 'return fam;';

let pass = 0, fail = 0;
function ok(cond, label) { if (cond) pass++; else { fail++; console.log(`  FAIL: ${label}`); } }

// ── 注入前基线 ──────────────────────────────────────────────
const detect0 = freshDetect();

// ① 纯词表叠词句（tier2+tier1+tier2）必须 score=0（归并生效）
const PURE_VOCAB = 'We leverage a robust framework to streamline data processing across our services.';
const rPure = detect0(PURE_VOCAB);
ok(rPure.familiesHit === 1, `注入前: 纯词表三档叠词 familiesHit 应=1（归并为 vocab-discourse），实得 ${rPure.familiesHit}`);
ok(rPure.score === 0, `注入前: 纯词表句 score 应=0，实得 ${rPure.score}`);
ok(rPure.coOccurrence === false, `注入前: 纯词表句 coOccurrence 应=false，实得 ${rPure.coOccurrence}`);

// [v6.7.128 第 131 轮] transitions 也归入 vocab-discourse 档：
// 词表三档 × transitions 二票组合（moreover/furthermore/in summary 是正常
// 学术英语，与词表同源不算两个独立证据）
const VOCAB_PLUS_TRANSITION =
  'Robust consensus protocols require careful analysis. Furthermore, they must tolerate crash faults.';
const rVpt = detect0(VOCAB_PLUS_TRANSITION);
ok(rVpt.familiesHit === 1, `注入前: 词表×transitions 应归并为 1 个 vocab-discourse，实得 ${rVpt.familiesHit}`);
ok(rVpt.score === 0, `注入前: 词表×transitions score 应=0，实得 ${rVpt.score}`);
ok(rVpt.coOccurrence === false, `注入前: 词表×transitions 不应判共现，实得 ${rVpt.coOccurrence}`);

// ② 模板族 + 词表句必须仍计分（归并未伤模板共现）
const TEMPLATE_PLUS_VOCAB = 'Imagine a world where robust systems become the default.';
const rTpl = detect0(TEMPLATE_PLUS_VOCAB);
ok(rTpl.familiesHit >= 2, `注入前: 模板+词表句 familiesHit 应>=2，实得 ${rTpl.familiesHit}`);
ok(rTpl.score > 0, `注入前: 模板+词表句 score 应>0，实得 ${rTpl.score}`);

// ── 注入-删条：把归并打回原形（三个档位各记一票）─────────────
if (!SRC_ORIGINAL.includes(CUT)) {
  fail++;
  console.log(`  FAIL: 删条片段未在源文件中找到「${CUT}」`);
} else {
  const mutated = SRC_ORIGINAL.replace(
    "return vocabDiscourse.has(fam) ? 'vocab-discourse' : fam;",
    'return vocabDiscourse.has(fam) ? fam : fam;'
  );
  fs.writeFileSync(SRC, mutated, 'utf8');
  try {
    const detect2 = freshDetect();
    // 删条后纯词表句必须重新计分（证明这条归并逻辑是唯一的守卫）
    const rBad = detect2(PURE_VOCAB);
    ok(rBad.familiesHit >= 2, `删条后应变红: 纯词表句 familiesHit 应回到 >=2（档位各记一票），实得 ${rBad.familiesHit}`);
    ok(rBad.score > 0, `删条后应变红: 纯词表句 score 应重新 >0，实得 ${rBad.score}`);
    // 删条后 transitions 与词表分开各记一票，也必须重新计分
    const rBadVpt = detect2(VOCAB_PLUS_TRANSITION);
    ok(rBadVpt.familiesHit >= 2, `删条后应变红: 词表×transitions familiesHit 应回到 >=2，实得 ${rBadVpt.familiesHit}`);
    ok(rBadVpt.score > 0, `删条后应变红: 词表×transitions score 应重新 >0，实得 ${rBadVpt.score}`);
    // 模板+词表句行为不应被删条破坏（它是模板族在扛共现）
    const rTpl2 = detect2(TEMPLATE_PLUS_VOCAB);
    ok(rTpl2.score > 0, `删条后: 模板+词表句仍应计分，实得 score=${rTpl2.score}`);
  } finally {
    fs.writeFileSync(SRC, SRC_ORIGINAL, 'utf8');
  }

  // ── 还原后重新生效 ───────────────────────────────────────
  const detect3 = freshDetect();
  const rRestored = detect3(PURE_VOCAB);
  ok(rRestored.familiesHit === 1, `还原后: 纯词表句 familiesHit 应回到 1，实得 ${rRestored.familiesHit}`);
  ok(rRestored.score === 0, `还原后: 纯词表句 score 应回到 0，实得 ${rRestored.score}`);
  const rRestoredVpt = detect3(VOCAB_PLUS_TRANSITION);
  ok(rRestoredVpt.familiesHit === 1, `还原后: 词表×transitions familiesHit 应回到 1，实得 ${rRestoredVpt.familiesHit}`);
  ok(rRestoredVpt.score === 0, `还原后: 词表×transitions score 应回到 0，实得 ${rRestoredVpt.score}`);

  // ── 兜底：删掉整段 vocab-discourse 计算块 ─────────────────
  const blockStart = 'const vocabDiscourse = new Set([';
  if (SRC_ORIGINAL.includes(blockStart)) {
    const marker = 'const familiesHit = normalizedFams.size;';
    const mutated2 = SRC_ORIGINAL.replace(
      marker,
      'const familiesHit = new Set(findings.map((f) => f.dimension.replace(/^ai-tell-/, ""))).size;'
    );
    fs.writeFileSync(SRC, mutated2, 'utf8');
    try {
      const detect4 = freshDetect();
      const rBad2 = detect4(PURE_VOCAB);
      ok(rBad2.score > 0, `整段删掉后应变红: 纯词表句 score 应重新 >0，实得 ${rBad2.score}`);
      const rBad2v = detect4(VOCAB_PLUS_TRANSITION);
      ok(rBad2v.score > 0, `整段删掉后应变红: 词表×transitions score 应重新 >0，实得 ${rBad2v.score}`);
      const rTpl4 = detect4(TEMPLATE_PLUS_VOCAB);
      ok(rTpl4.score > 0, `整段删掉后: 模板+词表句仍应计分，实得 score=${rTpl4.score}`);
    } finally {
      fs.writeFileSync(SRC, SRC_ORIGINAL, 'utf8');
    }
  } else {
    fail++;
    console.log('  FAIL: vocab-discourse 计算块未找到（删条样本需更新）');
  }

  // ── 源码完整还原 ────────────────────────────────────────
  const final = fs.readFileSync(SRC, 'utf8');
  ok(final === SRC_ORIGINAL, '源码已完整还原');
}

console.log(`\n第130轮负例守卫: ${pass} passed ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
