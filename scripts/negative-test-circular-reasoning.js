/**
 * scripts/negative-test-circular-reasoning.js
 *
 * [r701] 第 136 维度 circular_reasoning 守卫有效性负例验证。
 *
 * 方法同 r685-r700 negative-test-*.js：把 src/circular-reasoning.js 里
 * 本轮新增的承重常量逐一置为永不匹配（改文件再跑测试文件），证明
 * test/round-701-circular-reasoning.js 本身能抓住每个分支失效，确认
 * 测试由全绿变红，还原后恢复全绿，md5 校验一致。
 *
 * 判定标准：基线 18/18 PASS → 每个注入点 FAIL（至少 1 个断言红，
 * 且不是 SyntaxError/Cannot find module/ReferenceError/TypeError
 * 崩溃红）→ 还原后 18/18 PASS 且 md5 与基线一致。
 *
 * 注入点覆盖 5 处（均为承重常量，r701 实测逐一杀过）：
 *   RESTART_TAIL（主语重启尾标记——杀掉后 f1 帧失效，2 个断言红）
 *   NUMERIC（数字豁免——C7 承重样本）
 *   EVIDENCE_EXEMPT（依据在场豁免——C7 承重样本）
 *   REPORTING_EXEMPT（引述动词豁免——C7 承重样本）
 *   META_EXEMPT_ZH（元话语豁免——C7 承重样本）
 *
 * 不在注入列表的常量及原因（诚实记录，r701 实测杀掉后测试仍全绿）：
 *   DEFINITIONAL_MARKERS（定义式标记总表）——帧逻辑重写后它只剩
 *     「rep 前缀拒绝」一处窄用途（rep 以标记词开头时跳过该候选），
 *     而标记词开头的 rep（都是普通人）本身多呈同义反复，跳过与否
 *     不改变任何样本的判定结果（FP「我们都是普通人」两条路都命中）。
 *   FUNCTION_NGRAM（功能词停止表）——防御性常量，当前 18 条样本里
 *     没有任何一条的判定结果依赖它：现有良性集的重复候选都有实义
 *     内容，功能词 bigram 从未成为唯一候选。
 *   META_EXEMPT_EN——本轮英文攻击样本不含元话语形状，ZH 侧已覆盖
 *     该分支的守卫有效性。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const SRC = path.join(HF, 'src/circular-reasoning.js');
const TEST = path.join(HF, 'test/round-701-circular-reasoning.js');

const INJECTS = [
  { name: 'RESTART_TAIL 整表（f1 主语重启尾标记）', const: 'RESTART_TAIL' },
  { name: 'NUMERIC（数字豁免，C7 承重）', const: 'NUMERIC' },
  { name: 'EVIDENCE_EXEMPT（依据在场豁免，C7 承重）', const: 'EVIDENCE_EXEMPT' },
  { name: 'REPORTING_EXEMPT（引述动词豁免，C7 承重）', const: 'REPORTING_EXEMPT' },
  { name: 'META_EXEMPT_ZH（元话语豁免，C7 承重）', const: 'META_EXEMPT_ZH' },
];

function md5(f) { return crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex'); }

function runTest() {
  try {
    const out = execFileSync('node', [TEST], { cwd: HF, encoding: 'utf8', timeout: 180000 });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || '') };
  }
}

function isCrashRed(out) {
  // 崩溃红（语法错/模块缺失/引用错/类型错）证明不了断言能抓分支失效
  return /SyntaxError|Cannot find module|ReferenceError|TypeError/.test(out);
}

// ── 0. 基线 ────────────────────────────────────────────────────────
const baseMd5 = md5(SRC);
const base = runTest();
if (!base.ok) { console.error('基线就不是全绿，中止: ' + base.out.slice(-400)); process.exit(1); }
if (!/结果: 18 通过, 0 失败/.test(base.out)) {
  console.error('基线输出不符合预期（18 通过）: ' + base.out.slice(-200)); process.exit(1);
}
console.log('基线: 18/18 PASS，md5=' + baseMd5.slice(0, 12));

// ── 1. 逐点注入 ────────────────────────────────────────────────────
let allRed = true;
for (const inj of INJECTS) {
  const src = fs.readFileSync(SRC, 'utf8');
  // 承重常量都是单行字面量：const X = /.../; → 换成永不匹配 /(?!)/;
  const re = new RegExp('^(const ' + inj.const + ' = )[^;]*;', 'm');
  if (!re.test(src)) {
    console.log('  ✗ ' + inj.name + ' :: 定位失败（常量声明未找到）');
    allRed = false;
    continue;
  }
  fs.writeFileSync(SRC, src.replace(re, '$1/(?!)/;'));
  const r = runTest();
  const crash = !r.ok && isCrashRed(r.out);
  if (!r.ok && !crash) {
    const m = r.out.match(/结果: (\d+) 通过, (\d+) 失败/);
    console.log('  ✓ ' + inj.name + ' :: 断言红（守卫有效' + (m ? '，' + m[2] + ' 个断言红' : '') + '）');
  } else if (crash) {
    console.log('  ✗ ' + inj.name + ' :: 崩溃红非断言红（结论失真）: ' + r.out.split('\n').filter(l => /Error/.test(l))[0]);
    allRed = false;
  } else {
    console.log('  ✗ ' + inj.name + ' :: 注入后仍全绿（守卫漏抓）');
    allRed = false;
  }
  // 立即还原（无论成败）
  fs.writeFileSync(SRC, src);
}

// ── 2. 还原校验 ────────────────────────────────────────────────────
const afterMd5 = md5(SRC);
if (afterMd5 !== baseMd5) { console.error('还原后 md5 不一致！'); process.exit(1); }
const after = runTest();
if (!after.ok || !/结果: 18 通过, 0 失败/.test(after.out)) {
  console.error('还原后测试未恢复全绿: ' + after.out.slice(-300));
  process.exit(1);
}
console.log('还原: 18/18 PASS，md5 与基线一致');

if (!allRed) { console.error('存在未抓到的注入点，守卫覆盖不完整'); process.exit(1); }
console.log('负例验证通过: 5/5 注入点全部断言红，还原后全绿');
