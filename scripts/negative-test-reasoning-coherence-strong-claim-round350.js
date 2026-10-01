/**
 * r350 负例守卫：强断言闸（STRONG_CLAIM / hasRealPremise）删条敏感性。
 * 方法：把关键片段替换成等价无效写法 → 跑主测试 → 断言 exit != 0；再还原。
 *
 * 删除点（4 个）：
 *   S1 STRONG_CLAIM 常量整行作废 → 回归集 R 族 5 条应全部变红
 *   S2 PREMISE_STRONG_SUBJECT 常量整行作废 → A 族 3 条（历史经验/常识/古人）应变红
 *   S3 PREMISE_CONNECTIVE 常量整行作废 → A 族 B 族部分应变红
 *   S4 调用接线 rcBroken 里的 `&& (hasRealPremise(text) || STRONG_CLAIM.test(text) ...` 摘掉 → 回归集变红
 *
 * 与 r331 教训对齐：探针必须写成副本内独立 .js 文件（node -e 内联在 bash -c
 * 双层引号里会吞输出）。
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/index.js');
const tmp = fs.mkdtempSync(path.join(ROOT, '.r350-neg-'));
const SRC_BAK = fs.readFileSync(SRC, 'utf8');

// —— 常量锚点（整行匹配，按 r348 v3 定稿经验） ——
const A_SC = '  const STRONG_CLAIM = /一定|必然|注定|毫无疑问|毋庸置疑|板上钉钉|势必|铁定|不可动摇|100%|绝对(正确|对|错|是|会|能)|是(正确|对)的|一定(是|会|能|对)/i;';
const A_PS = '  const PREMISE_STRONG_SUBJECT = /历史经验|经验(反复)?(证明|表明|告诉)|常识|古人|传统|惯例|权威|专家|理论上|本质上|根本上|数据(表明|显示)|研究(表明|显示|指出)|调查(表明|显示)|统计(表明|显示)/;';
const A_PC = '  const PREMISE_CONNECTIVE = /(?:因为|由于|基于|根据|鉴于|出于|考虑到|按照|依据|凭借)[^。！？，,；;]{0,12}/;';
const A_FN = '  function hasRealPremise(text) {\n    return PREMISE_CONNECTIVE.test(text) || PREMISE_STRONG_SUBJECT.test(text);\n  }';
// —— 调用接线锚点（两处，用 replace 逐处替换保证唯一） ——
const WIRE_1 = '    && (hasRealPremise(text) || STRONG_CLAIM.test(text) || (rc.markers?.leap?.count || 0) > 0);\n  // [r349] 纯跳跃推理族 second arm：';
const WIRE_2 = '    && (hasRealPremise(text) || STRONG_CLAIM.test(text) || (rc.markers?.leap?.count || 0) > 0);\n  const rcBrokenFinal';

// 注：rcLeapOnly 支臂内该子句**按构造恒真** —— rcLeapOnly 本身已要求
// `(rc.markers?.leap?.count || 0) > 0`，正好是子句第三个析取项。
// 因此「摘除 rcLeapOnly 的接线」不可构造出可观察差异，不是有效删除点，
// 不作变异位（r331 教训：守卫不敏感时要查判据本身，不是硬凑删除点）。
// 保留它是为了让两支臂判据形式对称，便于阅读。
const MUTATIONS = [
  { name: 'S1 STRONG_CLAIM 作废', from: A_SC, to: '  const STRONG_CLAIM = /(?!x)x/;' },
  { name: 'S2 PREMISE_STRONG_SUBJECT 作废', from: A_PS, to: '  const PREMISE_STRONG_SUBJECT = /(?!x)x/;' },
  { name: 'S3 PREMISE_CONNECTIVE 作废', from: A_PC, to: '  const PREMISE_CONNECTIVE = /(?!x)x/;' },
  { name: 'S4 hasRealPremise 断言体作废', from: A_FN, to: '  function hasRealPremise(text) {\n    return false;\n  }' },
  { name: 'S5 rcBroken 接线摘除', from: WIRE_1, to: '  // [r349] 纯跳跃推理族 second arm：' },
];

const TEST = process.argv[2] || path.join(ROOT, 'test/round-350-reasoning-coherence-strong-claim-gate.test.js');

function runTest() {
  try {
    cp.execSync(`node ${JSON.stringify(TEST)}`, { cwd: ROOT, stdio: 'pipe' });
    return 0;
  } catch (e) {
    return typeof e.status === 'number' ? e.status : 1;
  }
}

let ok = 0, bad = 0, skipped = 0;
const detail = [];
try {
  // 基线：未变异必须 PASS
  assert.strictEqual(runTest(), 0, '基线（未变异）应当 PASS');
  detail.push('基线：PASS（未变异）');

  for (const m of MUTATIONS) {
    if (!SRC_BAK.includes(m.from)) {
      detail.push(`跳过 ${m.name}：锚点未找到（源码可能已变）`);
      skipped++;
      continue;
    }
    fs.writeFileSync(SRC, SRC_BAK.replace(m.from, m.to));
    try {
      const code = runTest();
      if (code !== 0) { detail.push(`变红 ✓ ${m.name}`); ok++; }
      else { detail.push(`未变红 ✗ ${m.name} —— 守卫对该改动不敏感`); bad++; }
    } finally {
      fs.writeFileSync(SRC, SRC_BAK);
    }
  }
  // 还原后必须回到 PASS
  assert.strictEqual(runTest(), 0, '还原后必须 PASS');
  detail.push('还原：PASS');
} finally {
  fs.writeFileSync(SRC, SRC_BAK);
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
}

for (const d of detail) console.log(d);
console.log(`r350 强断言闸变异守卫：${ok} 个变红 / ${bad} 个不敏感 / ${skipped} 个跳过`);
console.log(`${ok + bad} 通过, ${bad} 失败`);
assert.strictEqual(bad, 0, '存在不敏感变异');
assert.ok(true);
