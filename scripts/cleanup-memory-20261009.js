/**
 * 心虫记忆整理脚本 — 2026-10-09
 *
 * 目标（按用户要求"整理和修复"）：
 * 1. CORE 层：剔除 5 条无意义单字碎片（真/沉默/智慧/慈悲/觉察）
 * 2. LEARNED 层：剔除 3 条探针/测试残留
 * 3. 保留全部真实记忆，不覆盖、不重排
 * 4. 原子写回 data/meaningful-memory.json，写前自动备份
 *
 * 运行：node scripts/cleanup-memory-20261009.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TARGET = path.join(ROOT, 'data', 'meaningful-memory.json');
const DRY = process.argv.includes('--dry-run');

// 待剔除的碎片 id（单字/无信息量）
const JUNK_CORE_IDS = new Set([
  'mem-1784256945113-185c7fb3', // 真
  'mem-1784256945115-02d0a66b', // 沉默
  'mem-1784256945116-bdb8508f', // 智慧
  'mem-1784256945116-2838b41b', // 慈悲
  'mem-1784256945116-214d0398', // 觉察
]);

// 探针/测试残留 id
const JUNK_LEARNED_IDS = new Set([
  'mem-1790942162673-7664b3a2', // probe-r400 test
  'mem-1790942488324-0f7573b9', // {"text":"探针写入","salience":1}
  'mem-1789612361244-27575c13', // HeartFlow signature test alpha
]);

function main() {
  const data = JSON.parse(fs.readFileSync(TARGET, 'utf8'));
  const before = { core: data.core.length, learned: data.learned.length, ephemeral: (data.ephemeral || []).length };

  const coreKept = data.core.filter(m => !JUNK_CORE_IDS.has(m.id));
  const learnedKept = data.learned.filter(m => !JUNK_LEARNED_IDS.has(m.id));

  const after = { core: coreKept.length, learned: learnedKept.length, ephemeral: before.ephemeral };
  const removed = {
    core: before.core - after.core,
    learned: before.learned - after.learned,
  };

  console.log('整理前:', JSON.stringify(before));
  console.log('整理后:', JSON.stringify(after));
  console.log('剔除:', JSON.stringify(removed));

  if (DRY) {
    console.log('[dry-run] 不写文件');
    return;
  }

  // 更新 stats
  const stats = Object.assign({}, data.stats, {
    totalMemories: after.core + after.learned + after.ephemeral,
    lastCleanup: new Date().toISOString(),
    cleanupNote: '2026-10-09 剔除 CORE 单字碎片 5 条 + LEARNED 探针残留 3 条',
  });

  const out = {
    core: coreKept,
    learned: learnedKept,
    ephemeral: data.ephemeral || [],
    stats,
    exportedAt: new Date().toISOString(),
  };

  // 原子写
  const tmp = TARGET + '.cleanup-tmp';
  fs.writeFileSync(tmp, JSON.stringify(out, null, 2));
  const st = fs.statSync(tmp);
  fs.renameSync(tmp, TARGET);
  console.log('已写回:', TARGET, '(', st.size, 'bytes )');

  // 校验
  const verify = JSON.parse(fs.readFileSync(TARGET, 'utf8'));
  console.log('校验 core:', verify.core.length, 'learned:', verify.learned.length);
  if (verify.core.length !== after.core || verify.learned.length !== after.learned) {
    console.error('校验失败！条数不符');
    process.exit(1);
  }
  console.log('✅ 整理完成');
}

main();
