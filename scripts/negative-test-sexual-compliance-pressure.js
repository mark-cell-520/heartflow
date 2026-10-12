/**
 * scripts/negative-test-sexual-compliance-pressure.js
 *
 * [r687] sexual_compliance_pressure（第 128 维）守卫有效性负例验证。
 *
 * 方法同 r685/r686 negative-test-*.js：把 src/sexual-compliance-pressure.js
 * 里每条腿/守门常量逐一置空（改文件再跑测试文件的方式，证明测试文件
 * 本身能抓住每个分支失效），确认 test/round-687-sexual-compliance-pressure.js
 * 由 24/24 全绿变红，还原后恢复全绿，md5 校验一致。
 *
 * 判定标准：基线 24/24 PASS → 每个注入点 FAIL（至少 1 个断言红）→
 * 还原后 24/24 PASS 且 md5 与基线一致。
 *
 * 注入点覆盖：14 个常量——性要求腿×2（SEXDEMAND_ZH/EN）、施压腿×2
 * （PRESSURE_ZH/EN）、义务腿×2（OBLIGATION_ZH/EN）、关系角色腿×2
 * （RELATION_ZH/EN）、隐式性指代腿×4（IMPLICIT_STRICT_ZH/EN、
 * IMPLICIT_ZH/EN）、债务即付腿×2（DEBT_IMMEDIATE_ZH/EN）、守门×4
 * （GUARD_ZH/EN、QUESTION_ZH/EN）。守门类的注入样本是 H7「摘除守门
 * 后恢复命中」断言与 F3/F4 良性断言——没有它们守门失效时测试不红。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const SRC = path.join(HF, 'src/sexual-compliance-pressure.js');
const TEST = path.join(HF, 'test/round-687-sexual-compliance-pressure.js');

// 注入点：每个常量一行定位（from → to），to 为空正则（(?!) 永不匹配）。
const INJECTS = [
  { name: 'SEXDEMAND_ZH（性要求腿·中）', from: String.raw`const SEXDEMAND_ZH = new RegExp([`, to: String.raw`const SEXDEMAND_ZH = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'SEXDEMAND_EN（性要求腿·英）', from: String.raw`const SEXDEMAND_EN = new RegExp([`, to: String.raw`const SEXDEMAND_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'PRESSURE_ZH（施压腿·中）', from: String.raw`const PRESSURE_ZH = new RegExp([`, to: String.raw`const PRESSURE_ZH = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'PRESSURE_EN（施压腿·英）', from: String.raw`const PRESSURE_EN = new RegExp([`, to: String.raw`const PRESSURE_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'OBLIGATION_ZH（义务腿·中）', from: String.raw`const OBLIGATION_ZH = new RegExp([`, to: String.raw`const OBLIGATION_ZH = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'OBLIGATION_EN（义务腿·英）', from: String.raw`const OBLIGATION_EN = new RegExp([`, to: String.raw`const OBLIGATION_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'RELATION_ZH（关系角色腿·中）', from: String.raw`const RELATION_ZH = new RegExp([`, to: String.raw`const RELATION_ZH = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'RELATION_EN（关系角色腿·英）', from: String.raw`const RELATION_EN = new RegExp([`, to: String.raw`const RELATION_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'IMPLICIT_STRICT_ZH（隐式性指代·严格·中）', from: String.raw`const IMPLICIT_STRICT_ZH = new RegExp([`, to: String.raw`const IMPLICIT_STRICT_ZH = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'IMPLICIT_STRICT_EN（隐式性指代·严格·英）', from: String.raw`const IMPLICIT_STRICT_EN = new RegExp([`, to: String.raw`const IMPLICIT_STRICT_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'IMPLICIT_ZH（隐式性指代·通用·中）', from: String.raw`const IMPLICIT_ZH = new RegExp([`, to: String.raw`const IMPLICIT_ZH = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'IMPLICIT_EN（隐式性指代·通用·英）', from: String.raw`const IMPLICIT_EN = new RegExp([`, to: String.raw`const IMPLICIT_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'DEBT_IMMEDIATE_ZH（债务即付腿·中）', from: String.raw`const DEBT_IMMEDIATE_ZH = new RegExp([`, to: String.raw`const DEBT_IMMEDIATE_ZH = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'DEBT_IMMEDIATE_EN（债务即付腿·英）', from: String.raw`const DEBT_IMMEDIATE_EN = new RegExp([`, to: String.raw`const DEBT_IMMEDIATE_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'GUARD_ZH（守门：性教育/反性暴力/叙事·中）', from: String.raw`const GUARD_ZH = new RegExp([`, to: String.raw`const GUARD_ZH = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'GUARD_EN（守门：性教育/反性暴力/叙事·英）', from: String.raw`const GUARD_EN = new RegExp([`, to: String.raw`const GUARD_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'QUESTION_ZH（守门：句首提问·中）', from: String.raw`const QUESTION_ZH = new RegExp([`, to: String.raw`const QUESTION_ZH = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'QUESTION_EN（守门：句首提问·英）', from: String.raw`const QUESTION_EN = new RegExp([`, to: String.raw`const QUESTION_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
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

// ─── 基线 ────────────────────────────────────────────────────────────
const baseMd5 = md5(SRC);
const original = fs.readFileSync(SRC, 'utf8');
const base = runTest();
console.log('基线: ' + (base.ok ? 'PASS（24/24 预期）' : 'FAIL（异常！负例验证不成立）') + ' — ' + base.tail);
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
  const restored = fs.readFileSync(SRC, 'utf8');
  if (r.ok) {
    console.log('  ❌ ' + inj.name + ' 置空后测试仍全绿——守卫失效！');
  } else {
    redCount++;
    console.log('  ✅ ' + inj.name + ' 置空 → 测试变红: ' + r.tail);
  }
  // 立即还原（防中途异常留半改状态）
  if (restored !== original) fs.writeFileSync(SRC, original);
}

// ─── 还原校验 ────────────────────────────────────────────────────────
const finalMd5 = md5(SRC);
const final = runTest();
console.log('还原后: ' + (final.ok ? 'PASS（24/24 恢复）' : 'FAIL（异常！') + ' — ' + final.tail);
console.log('md5 一致: ' + (baseMd5 === finalMd5 ? '是' : '否（危险：源文件未还原）'));
console.log('');
console.log('=== 汇总: ' + redCount + '/' + INJECTS.length + ' 个注入点被测试抓住，基线 PASS，还原 md5 一致 = ' + (baseMd5 === finalMd5) + ' ===');
process.exit(redCount === INJECTS.length && final.ok && baseMd5 === finalMd5 ? 0 : 1);
