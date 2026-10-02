// r401 负例变异：对 src/memory/emotional-memory-bridge.js 的修复点逐一「摘掉修复」，
// 每次摘除后跑同一套判据，确认必须变红。守卫不能被触发就不是守卫。
// 做法：原地备份 → 变异 → 跑守卫判据 → 还原。finally 保证 src/ 一定还原。
'use strict';
const fs = require('fs');
const { execFileSync } = require('child_process');

const SRC = '/root/.hermes/skills/ai/mark-heartflow-skill/src/memory/emotional-memory-bridge.js';
const BAK = '/root/.hermes/cache/scratch/r401-src-backup.js';

// 判据探针：覆盖三条修复路径各一条（与守卫 A/E/F/G 组同口径）
// 注意：extractCognitivePattern 要求 length>=3 且最强模式 count>=2（源码 672/729 行），
// 探针必须传 3 条，否则 pattern 是恒红项、无法分辨变异。
const PROBE = `
const E = require(${JSON.stringify(SRC)});
(async () => {
  const APPRAISAL = { threatType: 'harm_loss', primaryAppraisal: { trajectory: { value: -0.5 } }, secondaryAppraisal: { control: 0.2 }, copingStrategies: [{ type: 'avoidance' }] };
  const PAD = { intensity: 0.85, pleasure: -3.2, arousal: 0.5, dominance: -2 };
  const red = [];
  try {
    const r = await E.appraisalToMemory('r401mut ' + Math.random(), APPRAISAL, PAD);
    if (!(r.stored === true)) red.push('single_store');
    const v = await E.appraisalToMemory('r401mutv ' + Math.random(), APPRAISAL, PAD, { verifyPersistence: true, skipDedup: true });
    if (!(v.verification && v.verification.verified === true)) red.push('verify');
    const b = await E.batchAppraisalToMemory([{ text: 'b ' + Math.random(), appraisalResult: APPRAISAL, padState: PAD }], { skipDedup: true });
    if (!(b.summary && b.summary.stored === 1)) red.push('batch');
    const hist = [
      { text: '我不行', primaryAppraisal: { trajectory: { value: -0.5 } }, secondaryAppraisal: { control: 0.2 }, copingStrategies: [{ type: 'avoidance' }] },
      { text: '我也不行', primaryAppraisal: { trajectory: { value: -0.6 } }, secondaryAppraisal: { control: 0.15 }, copingStrategies: [{ type: 'avoidance' }] },
      { text: '还是不行', primaryAppraisal: { trajectory: { value: -0.4 } }, secondaryAppraisal: { control: 0.25 }, copingStrategies: [{ type: 'problem_focused' }] },
    ];
    const pat = E.extractCognitivePattern(hist);
    if (!(pat && pat.count === 3 && pat.pattern === 'hopelessness')) red.push('pattern');
    if (!(E.validateInput([], 'p', { type: 'array', required: true }).valid === true)) red.push('array_type');
  } catch (e) { red.push('THROW:' + e.message.slice(0, 40)); }
  console.log('MUTRESULT ' + JSON.stringify(red));
})().catch(e => console.log('MUTRESULT THROW:' + e.message.slice(0, 40)));
`;

const original = fs.readFileSync(SRC, 'utf8');
fs.writeFileSync(BAK, original);
const results = [];

function runVariant(label, mutate) {
  let mutated;
  try { mutated = mutate(original); } catch (e) { mutated = null; }
  if (!mutated || mutated === original) {
    results.push({ label, applied: false });
    console.log(`  ⚠️ [${label}] 变异未生效（原文未匹配，跳过）`);
    return;
  }
  fs.writeFileSync(SRC, mutated);
  let out = '';
  try { out = execFileSync('node', ['-e', PROBE], { encoding: 'utf8', timeout: 90000 }); }
  catch (e) { out = String(e.stdout || '') + String(e.message || ''); }
  finally { fs.writeFileSync(SRC, original); }
  const mm = /MUTRESULT (.*)/.exec(out);
  const red = mm ? mm[1] : '(无输出: ' + out.slice(0, 100) + ')';
  const isRed = mm && /THROW|single_store|verify|batch|pattern|array_type/.test(red);
  results.push({ label, applied: true, red: isRed });
  console.log(`  ${isRed ? '✅' : '❌'} [${label}] → ${red}`);
}

console.log('── r401 负例变异（摘除修复 → 判据必须红） ──');

// 1. batch/pattern 的入参校验从 'array' 改回 'object'（r400 bug 的最忠实形状：
//    'object' 分支的 Array.isArray 排除数组 → 判非法 → 第一行 return 空）
runVariant('入参校验改回 object 类型', s =>
  s.replace(/validateInput\(appraisalHistory, 'appraisalHistory', \{ type: 'array' \}\)/g,
           "validateInput(appraisalHistory, 'appraisalHistory', { type: 'object' })")
   .replace(/validateInput\(items, 'items', \{ type: 'array' \}\)/g,
           "validateInput(items, 'items', { type: 'object' })"));

// 2. array 分支反转（数组一律非法）
runVariant('array 分支反转（数组判非法）', s =>
  s.replace("if (type === 'array') {\n    if (!Array.isArray(value)) {",
           "if (type === 'array') {\n    if (Array.isArray(value) || true) {"));

// 3. 单例解析改回裸模块对象（r400 bug 形状：模块对象上没有 store/add）
runVariant('恢复裸模块对象 bug', s =>
  s.replace("  if (typeof mod.store === 'function' || typeof mod.add === 'function') {\n    _mmInstance = mod;\n    return _mmInstance;\n  }",
           "  return mod;"));

// 4. 单例解析直接返 null（模块不可用降级）
runVariant('单例解析返 null', s =>
  s.replace('function getMeaningfulMemory() {\n  if (_mmInstance) return _mmInstance;\n  let mod = null;\n  try { mod = require(\'./meaningful-memory.js\'); } catch (e) { mod = null; }',
           'function getMeaningfulMemory() {\n  if (_mmInstance) return _mmInstance;\n  return null;\n  let mod = null;\n  try { mod = require(\'./meaningful-memory.js\'); } catch (e) { mod = null; }'));

// 5. store 成功判定改回只认 data.success（忠实还原 r400 判定：
//    真实 store() 返回字符串 id，不带 success 字段 → 判失败）
runVariant('恢复 success 字段判定 bug', s =>
  s.replace("  const storedOk = storeResult === true\n    || (typeof storeResult === 'string' && storeResult.length > 0)\n    || (storeResult && typeof storeResult === 'object' && storeResult.success === true\n        && !(storeResult.error));",
           "  const storedOk = !!(storeResult && storeResult.success === true && typeof storeResult.data === 'object' && storeResult.data.success === true);"));

// 6. 验证方法名改回不存在的名单
runVariant('验证方法改回不存在名单', s =>
  s.replace(/searchByKeywords/g, 'searchKeywordsOnly'));

// 还原校验
const now = fs.readFileSync(SRC, 'utf8');
console.log('');
console.log(now === original ? '✅ src/ 已还原为变异前内容（字节一致）' : '❌ src/ 未还原！需手工恢复 ' + BAK);
if (now !== original) process.exit(2);

const applied = results.filter(r => r.applied);
const redCount = applied.filter(r => r.red).length;
console.log(`变异结果: ${redCount}/${applied.length} 变红`);
if (redCount !== applied.length) {
  console.log('❌ 有摘除修复但判据未回落的项：' + applied.filter(r => !r.red).map(r => r.label).join(', '));
  process.exit(1);
}
console.log('✅ 守卫有效：修复逐一摘除，判据全部回落');
