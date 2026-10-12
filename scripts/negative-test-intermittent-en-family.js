/**
 * scripts/negative-test-intermittent-en-family.js
 *
 * [r688] intermittent_reinforcement 英文句式族守卫有效性负例验证。
 *
 * 方法同 r685/r686/r687 negative-test-*.js：把 src/intermittent-reinforcement.js
 * 里本轮新增/涉及的常量逐一置空（改文件再跑测试文件的方式，证明测试文件
 * 本身能抓住每个分支失效），确认 test/round-688-intermittent-en-family.js
 * 由 16/16 全绿变红，还原后恢复全绿，md5 校验一致。
 *
 * 判定标准：基线 16/16 PASS → 每个注入点 FAIL（至少 1 个断言红）→
 * 还原后 16/16 PASS 且 md5 与基线一致。
 *
 * 注入点覆盖：5 个常量——腿 A 英文补族×3（ALTNARR_EN 交替叙事 /
 * BADACT_EN 坏行持续段 / FAKELEAVE_EN 假离开回归）、腿 B 英文补族
 * ×1（PURPOSE_EN 效果宣告四支）、守门对照×1（CONCEPT_EN 概念分析）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const SRC = path.join(HF, 'src/intermittent-reinforcement.js');
const TEST = path.join(HF, 'test/round-688-intermittent-en-family.js');

// 注入点：每个常量一行定位（from → to），to 为空正则（(?!) 永不匹配）。
const INJECTS = [
  { name: 'ALTNARR_EN（腿A补族一：第一人称交替叙事）', from: String.raw`const ALTNARR_EN = new RegExp([`, to: String.raw`const ALTNARR_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'BADACT_EN（腿A补族二：坏行+持续段）', from: String.raw`const BADACT_EN = new RegExp([`, to: String.raw`const BADACT_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'FAKELEAVE_EN（腿A补族三：假离开回归）', from: String.raw`const FAKELEAVE_EN = new RegExp([`, to: String.raw`const FAKELEAVE_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'PURPOSE_EN（腿B补族七：效果宣告四支）', from: String.raw`const PURPOSE_EN = new RegExp([`, to: String.raw`const PURPOSE_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'CONCEPT_EN（守门：概念分析语境，对照注入）', from: String.raw`const CONCEPT_EN = new RegExp([`, to: String.raw`const CONCEPT_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
];

function md5(f) { return crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex'); }

function runTest() {
  try {
    const out = execFileSync(process.execPath, [TEST], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { ok: true, tail: out.trim().split('\n').slice(-2).join(' | ') };
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    const lines = out.trim().split('\n');
    const failLine = lines.find(l => l.includes('❌')) || lines[lines.length - 1] || '(no output)';
    return { ok: false, tail: failLine.trim().slice(0, 120) };
  }
}

// ─── 基线 ───────────────────────────────────────────────────────────
const baseMd5 = md5(SRC);
const original = fs.readFileSync(SRC, 'utf8');
const base = runTest();
console.log('基线: ' + (base.ok ? 'PASS（16/16 预期）' : 'FAIL（异常！负例验证不成立）') + ' — ' + base.tail);
if (!base.ok) { console.log('基线即失败，终止'); process.exit(1); }

// ─── 逐一注入 ────────────────────────────────────────────────────────
let redCount = 0;
for (const inj of INJECTS) {
  const count = original.split(inj.from).length - 1;
  if (count !== 1) {
    console.log('  ⚠️ ' + inj.name + ' 定位失败（出现 ' + count + ' 次，预期 1），跳过');
    continue;
  }
  fs.writeFileSync(SRC, original.replace(inj.from, inj.to));
  const r = runTest();
  if (r.ok) {
    console.log('  ❌ ' + inj.name + ' 置空后测试仍全绿——守卫失效！');
  } else {
    redCount++;
    console.log('  ✅ ' + inj.name + ' 置空后测试变红 — ' + r.tail);
  }
}

// ─── 还原并校验 ──────────────────────────────────────────────────────
fs.writeFileSync(SRC, original);
const after = runTest();
const afterMd5 = md5(SRC);
console.log('还原后: ' + (after.ok ? 'PASS（16/16 恢复）' : 'FAIL（异常！') + ' — ' + after.tail);
console.log('md5 一致: ' + (afterMd5 === baseMd5 ? '是' : '否（基线 ' + baseMd5.slice(0, 8) + ' vs 还原 ' + afterMd5.slice(0, 8) + '）'));
console.log('结果: ' + redCount + ' 个注入点全部变红, 共 ' + INJECTS.length + ' 个');
if (redCount !== INJECTS.length || !after.ok || afterMd5 !== baseMd5) process.exit(1);
