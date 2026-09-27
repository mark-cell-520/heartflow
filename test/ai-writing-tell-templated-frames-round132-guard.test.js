// 第132轮负例守卫：templated-frames 归并逻辑的注入-删条-必须变红
// 验证：把 formulaic-openers × generic-conclusions 的归并删掉后，
// 模板框架二票句必须重新计分（证明这条逻辑是真守卫）；同时证明归并
// 没有伤到真 AI 文本（词表档/独立模板族仍计分）。
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

// 归并的核心判据：「档位归一 → templated-frames 只记一票」
const CUT = 'const templatedFrames = new Set(';
const CUT_TO_MERGE = "if (templatedFrames.has(fam)) return 'templated-frames';";

let pass = 0, fail = 0;
function ok(cond, label) { if (cond) pass++; else { fail++; console.log(`  FAIL: ${label}`); } }

// ── 注入前基线 ──────────────────────────────────────────────
const detect0 = freshDetect();

// ① 模板框架二票句（formulaic-openers + generic-conclusions，同一片段）
const TEMPLATE_PAIR =
  'As we move forward, the team will prioritize the migration work in the next sprint.';

// ② 真 AI 文本：模板框架 + 独立证据（speculative-openers）
const AI_WITH_EXTRA =
  'Imagine a world where every team ships faster. As we move forward, the possibilities are endless.';

// ③ 真 AI 文本：词表档 + 模板框架
const VOCAB_PLUS_TEMPLATE =
  'As we move forward, it is important to note that a comprehensive approach is paramount.';

const rPair = detect0(TEMPLATE_PAIR);
ok(rPair.familiesHit === 1, `注入前: 模板框架二票 familiesHit 应=1（归并为 templated-frames），实得 ${rPair.familiesHit}`);
ok(rPair.score === 0, `注入前: 模板框架二票 score 应=0，实得 ${rPair.score}`);
ok(rPair.coOccurrence === false, `注入前: 模板框架二票 coOccurrence 应=false，实得 ${rPair.coOccurrence}`);

const rAi = detect0(AI_WITH_EXTRA);
ok(rAi.score > 0.3, `注入前: 真AI句 score 应>0.3，实得 ${rAi.score}`);
ok(rAi.familiesHit >= 2, `注入前: 真AI句 familiesHit 应>=2，实得 ${rAi.familiesHit}`);

const rVt = detect0(VOCAB_PLUS_TEMPLATE);
ok(rVt.score > 0.3, `注入前: 词表+模板框架句 score 应>0.3，实得 ${rVt.score}`);
ok(rVt.familiesHit >= 2, `注入前: 词表+模板框架句 familiesHit 应>=2，实得 ${rVt.familiesHit}`);

// ── 注入-删条：把 templated-frames 归并打回原形 ──────────────
if (!SRC_ORIGINAL.includes(CUT)) {
  fail++;
  console.log(`  FAIL: 删条片段未在源文件中找到「${CUT}」`);
} else if (!SRC_ORIGINAL.includes(CUT_TO_MERGE)) {
  fail++;
  console.log(`  FAIL: 删条片段未在源文件中找到「${CUT_TO_MERGE}」`);
} else {
  // 删轮 1：只删 templated-frames 归并分支，保留 vocab-discourse
  const mutated = SRC_ORIGINAL.replace(
    "      if (vocabDiscourse.has(fam)) return 'vocab-discourse';\n      if (templatedFrames.has(fam)) return 'templated-frames';\n      return fam;",
    "      return vocabDiscourse.has(fam) ? 'vocab-discourse' : fam;"
  );
  if (mutated === SRC_ORIGINAL) {
    fail++;
    console.log('  FAIL: 删轮 1 替换未生效（源码片段变了，需更新守卫）');
  } else {
    fs.writeFileSync(SRC, mutated, 'utf8');
    try {
      const detect2 = freshDetect();
      // 删条后模板框架二票句必须重新计分（证明这条归并逻辑是唯一守卫）
      const rBad = detect2(TEMPLATE_PAIR);
      ok(rBad.familiesHit >= 2, `删轮1后应变红: 模板框架二票 familiesHit 应回到 >=2，实得 ${rBad.familiesHit}`);
      ok(rBad.score > 0, `删轮1后应变红: 模板框架二票 score 应重新 >0，实得 ${rBad.score}`);
      ok(rBad.coOccurrence === true, `删轮1后应变红: 模板框架二票 应重新判共现，实得 ${rBad.coOccurrence}`);
      // 词表档归并不受本轮删条影响（vocab-discourse 仍在）
      const rBadV = detect2('We leverage a robust framework to streamline data processing across our services.');
      ok(rBadV.score === 0, `删轮1后: vocab-discourse 归并应仍生效（纯词表句 score=0），实得 ${rBadV.score}`);
      // 真 AI 句应仍计分（删的是误伤侧归并，不是检出侧）
      const rAi2 = detect2(AI_WITH_EXTRA);
      ok(rAi2.score > 0.3, `删轮1后: 真AI句 score 应仍>0.3，实得 ${rAi2.score}`);
    } finally {
      fs.writeFileSync(SRC, SRC_ORIGINAL, 'utf8');
    }
  }

  // 删轮 2：把整段 familiesHit 计算回退为「findings 原始族数」（归并全关）
  const marker = 'const familiesHit = normalizedFams.size;';
  if (SRC_ORIGINAL.includes(marker)) {
    const mutated2 = SRC_ORIGINAL.replace(
      marker,
      'const familiesHit = new Set(findings.map((f) => f.dimension.replace(/^ai-tell-/, ""))).size;'
    );
    fs.writeFileSync(SRC, mutated2, 'utf8');
    try {
      const detect4 = freshDetect();
      const rBad4 = detect4(TEMPLATE_PAIR);
      ok(rBad4.familiesHit >= 2, `删轮2后应变红: 模板框架二票 familiesHit 应回到 >=2，实得 ${rBad4.familiesHit}`);
      ok(rBad4.score > 0, `删轮2后应变红: 模板框架二票 score 应重新 >0，实得 ${rBad4.score}`);
      // 真 AI 句仍应计分（原始族数只会更多）
      const rAi4 = detect4(AI_WITH_EXTRA);
      ok(rAi4.score > 0.3, `删轮2后: 真AI句 score 应仍>0.3，实得 ${rAi4.score}`);
      const rVt4 = detect4(VOCAB_PLUS_TEMPLATE);
      ok(rVt4.score > 0.3, `删轮2后: 词表+模板框架句 score 应仍>0.3，实得 ${rVt4.score}`);
    } finally {
      fs.writeFileSync(SRC, SRC_ORIGINAL, 'utf8');
    }
  } else {
    fail++;
    console.log('  FAIL: familiesHit 计算行未找到（删条样本需更新）');
  }

  // ── 还原后重新生效 ────────────────────────────────────────
  const detect3 = freshDetect();
  const rRestored = detect3(TEMPLATE_PAIR);
  ok(rRestored.familiesHit === 1, `还原后: 模板框架二票 familiesHit 应回到 1，实得 ${rRestored.familiesHit}`);
  ok(rRestored.score === 0, `还原后: 模板框架二票 score 应回到 0，实得 ${rRestored.score}`);
  ok(rRestored.coOccurrence === false, `还原后: 模板框架二票 coOccurrence 应回到 false，实得 ${rRestored.coOccurrence}`);
  const rAi3 = detect3(AI_WITH_EXTRA);
  ok(rAi3.score > 0.3, `还原后: 真AI句 score 应仍>0.3，实得 ${rAi3.score}`);

  // ── 源码完整还原 ──────────────────────────────────────────
  const final = fs.readFileSync(SRC, 'utf8');
  ok(final === SRC_ORIGINAL, '源码已完整还原');
}

console.log(`\n第132轮负例守卫: ${pass} passed ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
