// 第50轮负例守卫：注入-删条-必须变红（字符串 replace，避开正则转义坑）
// 验证：每条判据都是真守卫（删掉后对应攻击样本必须回到零命中），且无兜底误伤
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
function hasMixing(detect, t) {
  const r = detect(t);
  return (r.findings || []).some(f => f.dimension === 'ai-tell-zh-en-mixing');
}

// 每条判据配一个「只被它命中」的专属探针 + 删条片段
const PROBES = [
  {
    name: 'anchor-mix（锚点集）',
    probe: '总之，In conclusion, we should leverage this robust framework to streamline processes.',
    // 只命中 anchor（tier 词多会被 tier-phrase 兜住）→ 选无 TIER 词的英文句
    probeAlt: '总的来说，In the end we all agreed it was fine.',
    cut: 'if (enAfter.length >= 2) {',
    cutTo: 'if (enAfter.length >= 99) {',
  },
  {
    name: 'double-connective（连接词对）',
    // 专属探针：不含 core 锚点词（无首先/总之/值得一提…），只靠中英翻译对命中。
    // 原探针「一方面 this is important, 另一方面…」同时被 anchor 判据覆盖，
    // 删连接词对判据后仍命中——那是守卫选样失误，不是判据可删。
    probe: '此外 Furthermore 我们要补齐文档，最后 Finally 要复盘。',
    cut: 'if (pairs >= 2) {',
    cutTo: 'if (pairs >= 99) {',
  },
  {
    name: 'tier-phrase（TIER 词短语）',
    probe: '架构 underlying principles 很 sophisticated。',
    cut: 'if (tierHits.length >= 1 && enAll.length >= 2) {',
    cutTo: 'if (tierHits.length >= 1 && enAll.length >= 99) {',
  },
];

let pass = 0, fail = 0;
function ok(cond, label) { if (cond) pass++; else { fail++; console.log(`  FAIL: ${label}`); } }

for (const p of PROBES) {
  const probe = p.probeAlt || p.probe;
  const detect0 = freshDetect();
  ok(hasMixing(detect0, probe), `${p.name}: 注入前应命中「${probe.slice(0, 24)}」`);

  if (!SRC_ORIGINAL.includes(p.cut)) {
    fail++; console.log(`  FAIL: ${p.name}: 删条片段未在源文件中找到「${p.cut}」`);
    continue;
  }
  const mutated = SRC_ORIGINAL.replace(p.cut, p.cutTo);
  fs.writeFileSync(SRC, mutated, 'utf8');
  try {
    const detect2 = freshDetect();
    ok(!hasMixing(detect2, probe), `${p.name}: 删条后应变红，实际仍命中`);
  } finally {
    fs.writeFileSync(SRC, SRC_ORIGINAL, 'utf8');
  }
  const detect3 = freshDetect();
  ok(hasMixing(detect3, probe), `${p.name}: 还原后应重新命中`);
}

console.log('── 兜底检查：删掉整个 detectZhEnMixing 接线后应全不命中 ──');
const wiring = 'const mixingTriggers = detectZhEnMixing(normalized);';
if (!SRC_ORIGINAL.includes(wiring)) {
  fail++; console.log('  FAIL: 接线句未找到');
} else {
  const mutated = SRC_ORIGINAL.replace(wiring, 'const mixingTriggers = [];');
  fs.writeFileSync(SRC, mutated, 'utf8');
  try {
    const detect2 = freshDetect();
    const anyHit = PROBES.filter(p => hasMixing(detect2, p.probeAlt || p.probe)).length;
    ok(anyHit === 0, `兜底删条后仍有 ${anyHit}/3 命中（有别的路径在产出 zh-en-mixing）`);
  } finally {
    fs.writeFileSync(SRC, SRC_ORIGINAL, 'utf8');
  }
}

// 良性守卫：删条/还原不应改变良性池行为
console.log('── 良性回归：主测试良性句在改动前后都不命中 ──');
const BENIGN = [
  '我在准备一次技术分享，主题是关于分布式系统的一致性模型。我打算从 CAP 理论讲起，然后介绍强一致性、最终一致性、因果一致性这几种常见的模型，最后讲讲工程上的取舍。',
  '我们团队用 React 和 Node 开发，Python 部分用 Django，数据库选 PostgreSQL。',
  '这个 bug 已经修了，你先 checkout 最新代码，然后跑一下 CI，如果失败就把 log 发我。',
];
const detectFinal = freshDetect();
for (const t of BENIGN) ok(!hasMixing(detectFinal, t), `良性误伤: ${t.slice(0, 30)}`);

const final = fs.readFileSync(SRC, 'utf8');
ok(final === SRC_ORIGINAL, '源码已完整还原');
ok(final.includes(wiring), '接线仍在');

console.log(`\n第50轮负例守卫: ${pass} passed ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
