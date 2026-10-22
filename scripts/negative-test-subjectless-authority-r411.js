/**
 * scripts/negative-test-subjectless-authority-r411.js
 *
 * 负例守卫：vague 维度「责任主体缺位族（公共机构口径）」
 * 参考 scripts/negative-test-absolute-claim-en.js 的写法。
 *
 * 判据（`注入 — 删条 — 必须变红`）：
 *   N1 7 条攻击族样本必须全部非 pass（verify/rewrite/block）
 *   N2 5 条良性样本必须全部 pass（不许把可执行/可验证句洗成模糊话术）
 *   N3 变异：把 src/index.js VAGUE_PATTERNS.zh 里本轮新增的两条正则注释掉，
 *       N1 必须变红（证明这两条正则真的是守卫，不是被别的层顺手带过）
 *   N4 变异：把「有关部门」也一并删掉，同族老样本必须一起变红
 *   N5 还原后必须回到全绿（自证：负例不是靠破坏被测文件拿绿）
 *
 * 用法：
 *   node scripts/negative-test-subjectless-authority-r411.js          # 只跑判据
 *   node scripts/negative-test-subjectless-authority-r411.js --mutate  # 含删条变异
 */

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INDEX_FILE = path.join(ROOT, 'src/index.js');

// ─── 样本（形状描述，不在此文件之外复述）───
const ATTACK = [
  '相关部门正在研究这个问题',
  '相关部门已经关注到此事',
  '目前由相关部门负责处理',
  '相关负责人表示正在研究',
  '相关负责部门尚未给出结论',
  '后续会由相关部门统一安排',
  '具体由相关部门协调推进',
];

const BENIGN = [
  '请把材料提交给相关部门审核。',
  '这个问题我已经反馈给相关部门了。',
  '相关部门联系方式见官网公告。',
  '相关部门的答复函已于昨日公开。',
  '该事项已移交相关部门并收到回执。',
];

function runChecks(label) {
  // 每次重新 require，确保读到的是当前磁盘上的 src/index.js
  for (const k of Object.keys(require.cache)) {
    if (k.startsWith(path.join(ROOT, 'src'))) delete require.cache[k];
  }
  const gate = require(path.join(ROOT, 'src/gate.js'));

  let pass = 0;
  let fail = 0;
  const log = [];

  for (const t of ATTACK) {
    const action = gate.checkInput(t).gate.action;
    const ok = action !== 'pass';
    ok ? pass++ : fail++;
    log.push(`  ${ok ? 'N1✅' : 'N1❌'} 攻击族 gate=${action}  ${JSON.stringify(t)}`);
  }
  for (const t of BENIGN) {
    const action = gate.checkInput(t).gate.action;
    const ok = action === 'pass';
    ok ? pass++ : fail++;
    log.push(`  ${ok ? 'N2✅' : 'N2❌'} 良性 gate=${action}  ${JSON.stringify(t)}`);
  }

  console.log(`\n── ${label}：N1 攻击族 ${ATTACK.length} 条 + N2 良性 ${BENIGN.length} 条 ──`);
  for (const l of log) console.log(l);
  console.log(`  结果：${pass} 通过 / ${fail} 失败`);
  return fail;
}

function snapshotAndMutate(fn, label) {
  const src = fs.readFileSync(INDEX_FILE, 'utf8');
  const out = fn(src);
  if (out === src) throw new Error(`${label} 变异失败：正则未命中`);
  fs.writeFileSync(INDEX_FILE, out);
  const fail = runChecks(label);
  // 还原到变异前快照（不是 git checkout，避免误伤同文件其它未提交改动）
  fs.writeFileSync(INDEX_FILE, src);
  return fail;
}

(async () => {
  const withMutate = process.argv.includes('--mutate');
  let verdict = 0;

  // A. 当前代码：必须全绿
  let fail = runChecks('基线（未变异）');
  if (fail > 0) {
    console.log('\n❌ 基线就不绿 —— 守卫要判的事实当前不成立，先修引擎再看负例');
    process.exit(1);
  }
  console.log('  N1/N2 全绿：新增判据当下成立');

  if (!withMutate) {
    console.log('\n（加 --mutate 才跑删条变异）');
    process.exit(0);
  }

  // B. 删本轮新增正则 → N1 必须变红（守卫有效性的证据）
  const failM3 = snapshotAndMutate(src => src
    .replace(/^\s*\/相关\(\?:负责\)\?\(\?:部门\|单位\|机构\|方面\).*\n/m, '')
    .replace(/^\s*\/相关负责人\?.*\n/m, ''), 'N3 变异：删掉 r411 新增的两条正则');
  console.log(failM3 > 0
    ? `  N3✅ 删条后 ${failM3} 项判据变红 — 这两条正则确实在承担守卫`
    : '  N3❌ 删条后仍全绿 — 守卫可能被别的层顺手带过，判据无区分力');
  if (failM3 === 0) verdict++;

  // C. 连老正则一起删 → 同族老样本也必须变红
  const failM4 = snapshotAndMutate(src => src
    .replace(/^\s*\/相关\(\?:负责\)\?\(\?:部门\|单位\|机构\|方面\).*\n/m, '')
    .replace(/^\s*\/相关负责人\?.*\n/m, '')
    .replace(/\/有关部门\/i,\s*/, ''), 'N4 变异：r411 新正则 + 「有关部门」老正则都删');
  console.log(failM4 > 0
    ? `  N4✅ 删条后 ${failM4} 项判据变红`
    : '  N4❌ 删到老正则也不红 — 老样本的判定另有来源，需复核');
  if (failM4 === 0) verdict++;

  // D. 还原到磁盘当前内容 → 必须回绿（自证负例不是靠破坏被测文件拿绿）
  const failRestore = runChecks('D 还原自证');
  const restored = failRestore === 0;

  console.log('\n════ 汇总 ════');
  console.log(`  N3 变异变红      : ${failM3 > 0 ? 'OK' : 'FAIL'}`);
  console.log(`  N4 变异变红      : ${failM4 > 0 ? 'OK' : 'FAIL'}`);
  console.log(`  还原后回绿       : ${restored ? 'OK' : 'FAIL'}`);
  const restoredClean = execSyncIsClean();
  console.log(`  工作区 src 干净  : ${restoredClean ? 'OK' : 'FAIL'}`);

  if (failM3 > 0 && failM4 > 0 && restored && restoredClean) {
    console.log('✅ 负例守卫成立：注入 → 删条 → 变红 → 还原 → 回绿');
    process.exit(0);
  }
  console.log('❌ 负例守卫不成立，见上');
  process.exit(1);
})();

function execSyncIsClean() {
  try {
    const { execSync } = require('child_process');
    const out = execSync('git status --porcelain src/index.js', { cwd: ROOT, encoding: 'utf8' });
    return out.trim() === '';
  } catch (e) {
    return false;
  }
}
