/**
 * negative-test-ai-writing-tell-co-occurrence.js — 负例验证（第 36 轮）
 *
 * 验证 test/ai-writing-tell-co-occurrence.test.js 真的在守门：
 * 把 src/shield/ai-writing-tell.js 里第 36 轮新增的共现门槛代码
 * **逐项破坏**，守卫必须变红。
 *
 * 注入项（5 项，全部实测确认注入后测试转红）：
 *   n1  删掉 `if (!coOccurrence) { total = 0; }` 整段 → 单族又会计分
 *   n2  门槛从 >=2 改成 >=1（即 total = 0 恒不执行）→ 同上
 *   n3  门槛改成 >=99（恒 true）→ 真 AI 文本全变 0 分，攻击侧塌
 *   n4  confidence 的 coOccurrence 三元退回 Math.min(1, total) → 契约破
 *   n5  删掉 familiesHit/coOccurrence 返回字段 → 契约字段消失
 *
 * 纪律（沿用 round35 负例）：
 *   ① needle 从源码自取，不手写字符串。
 *   ② 只替换目标片段本体。
 *   ③ 注入后探针必须正常退出（崩溃 ≠ 变红）。
 *   ④ 每项注入后跑完整测试文件，数 FAIL 数。
 *   ⑤ 还原后做字节级一致性校验（防注入把源文件写坏）。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC_PATH = path.join(HF, 'src', 'shield', 'ai-writing-tell.js');
const TEST_REL = 'test/ai-writing-tell-co-occurrence.test.js';
const RUNNER = path.join(__dirname, 'negative-test-runner.js');
const SRC = fs.readFileSync(SRC_PATH, 'utf8');

// 每项注入：name + mutate(dirty=>clean 的替换函数)
// needle 全部在运行时从当前源码校验存在性（防行漂移）
const INJECTIONS = [
  {
    name: 'n1-del-zero-branch',
    why: '删除单族归零分支',
    needle: '  if (!coOccurrence) {\n    total = 0;\n  }\n',
    to: '',
    expectFail: '单族误伤不得清零',
  },
  {
    name: 'n2-threshold-to-1',
    why: '共现门槛降至 >=1',
    needle: 'const coOccurrence = familiesHit >= 2;',
    to: 'const coOccurrence = familiesHit >= 1;',
    expectFail: '单族误伤不得清零',
  },
  {
    name: 'n3-threshold-to-99',
    why: '共现门槛抬到 >=99（真 AI 文本被误杀）',
    needle: 'const coOccurrence = familiesHit >= 2;',
    to: 'const coOccurrence = familiesHit >= 99;',
    expectFail: '真 AI 文本必须仍检出',
  },
  {
    name: 'n4-confidence-leak',
    why: 'confidence 退回 min(1,total)（不随共现归零）',
    needle: 'const confidence = coOccurrence ? Math.min(1, total) : 0;',
    to: 'const confidence = Math.min(1, total);',
    expectFail: 'confidence 必须与共现联动',
    // ⚠️ 依赖注入：必须同时删掉 total=0 分支，否则 confidence 仍被零化的
    // total 掩盖，单改一项不可观测。这是真实依赖，不是测试缺陷。
    comboNeedle: '  if (!coOccurrence) {\n    total = 0;\n  }\n',
    comboTo: '',
  },
  {
    name: 'n5-drop-families-field',
    why: '删掉 familiesHit 返回字段',
    needle: '    coOccurrence,\n    familiesHit,\n',
    to: '',
    expectFail: '契约字段 familiesHit 必须存在',
  },
];

console.log('═══ 注入前校验（needle 必须唯一存在）═══');
for (const inj of INJECTIONS) {
  const n = SRC.split(inj.needle).length - 1;
  if (n !== 1) {
    console.error(`❌ ${inj.name}: needle 出现 ${n} 次（必须恰好 1 次），源文件可能已漂移`);
    process.exit(1);
  }
  console.log(`  ✅ ${inj.name}（${inj.why}）`);
}

function runTestsIn(proj) {
  const out = execFileSync('node', [RUNNER, TEST_REL], {
    cwd: proj, encoding: 'utf8', timeout: 90000, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const m = out.match(/结果:\s*(\d+)\s*通过,\s*(\d+)\s*失败/);
  const failed = m ? parseInt(m[2], 10) : 999;
  return { failed, out };
}

function runTestsInHF() {
  // 直接在仓库根跑（runner 用 argv[2] 相对路径）
  const out = execFileSync('node', [RUNNER, TEST_REL], {
    cwd: HF, encoding: 'utf8', timeout: 90000, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const m = out.match(/结果:\s*(\d+)\s*通过,\s*(\d+)\s*失败/);
  return m ? parseInt(m[2], 10) : 999;
}

console.log('\n═══ 基线（未注入，必须 0 失败）═══');
const baseFail = runTestsInHF();
console.log(`  基线失败数 = ${baseFail}`);
if (baseFail !== 0) { console.error('❌ 基线非 0，先修测试再跑负例'); process.exit(1); }

let red = 0, notRed = 0;
console.log('\n═══ 逐项注入（守卫必须变红）═══');
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'awt-neg36-'));
try {
  for (const inj of INJECTIONS) {
    const proj = path.join(tmpRoot, inj.name);
    fs.mkdirSync(proj, { recursive: true });
    // 拷 src + VERSION + test + scripts/negative-test-runner.js
    fs.cpSync(path.join(HF, 'src'), path.join(proj, 'src'), { recursive: true });
    fs.copyFileSync(path.join(HF, 'VERSION'), path.join(proj, 'VERSION'));
    fs.mkdirSync(path.join(proj, 'test'), { recursive: true });
    fs.copyFileSync(path.join(HF, TEST_REL), path.join(proj, TEST_REL));
    fs.mkdirSync(path.join(proj, 'scripts'), { recursive: true });
    fs.copyFileSync(RUNNER, path.join(proj, 'scripts', 'negative-test-runner.js'));

    const target = path.join(proj, 'src', 'shield', 'ai-writing-tell.js');
    const orig = fs.readFileSync(target, 'utf8');
    let dirty = orig.replace(inj.needle, inj.to);
    if (inj.comboNeedle) dirty = dirty.replace(inj.comboNeedle, inj.comboTo);
    if (dirty === orig) {
      console.log(`  ❌ ${inj.name}: 注入未生效（needle 在拷贝里找不到）`);
      notRed++;
      continue;
    }
    fs.writeFileSync(target, dirty);

    let failed;
    try {
      failed = runTestsIn(proj).failed;
    } catch (e) {
      console.log(`  ❌ ${inj.name}: 探针崩溃（不是变红）— ${String(e.message).slice(0, 60)}`);
      notRed++;
      continue;
    }
    if (failed > 0) { console.log(`  ✅ ${inj.name}: 注入后 ${failed} 条测试转红（${inj.expectFail}）`); red++; }
    else { console.log(`  ❌ ${inj.name}: 注入后仍全绿（守卫失效）`); notRed++; }
  }
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

// 字节级一致性：确认仓库源码没被注入污染
const after = fs.readFileSync(SRC_PATH, 'utf8');
if (after !== SRC) {
  console.error('🔴 源文件被注入污染，立即检查 git diff');
  process.exit(1);
}
console.log('\n✅ 还原校验：src/shield/ai-writing-tell.js 字节级一致（未被污染）');

console.log(`\n═══ 负例结果：${red}/${INJECTIONS.length} 项注入后守卫变红 ═══`);
if (notRed > 0) process.exit(1);
