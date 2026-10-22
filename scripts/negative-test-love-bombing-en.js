/**
 * scripts/negative-test-love-bombing-en.js
 *
 * [r686] love_bombing 英文句式族守卫有效性负例验证。
 *
 * 方法同 r685 negative-test-love-bombing.js：把 src/love-bombing.js
 * 里每个新英文分支常量逐一置空（改文件再跑测试文件的方式，证明测试
 * 文件本身能抓住每个分支失效），确认 test/round-686-love-bombing-en.js
 * 由 23/23 全绿变红，还原后恢复全绿，md5 校验一致。
 *
 * 判定标准：基线 23/23 PASS → 每个注入点 FAIL（至少 1 个断言红）→
 * 还原后 23/23 PASS 且 md5 与基线一致。
 *
 * 注入点覆盖：8 条英文腿（UNIQUE/DEPEND/BOMBARD/DEMAND/AGONY/
 * ISOLATE/DEROGATE/EXCLUSIVE_EN）+ 2 个英文守门（GUARD_EN /
 * QUESTION_EN）——QUESTION_EN 与 GUARD_EN 的注入样本是 G3b/G4b
 * 的「摘除守门后恢复命中」断言，没有它们守门失效时测试不红。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const SRC = path.join(HF, 'src/love-bombing.js');
const TEST = path.join(HF, 'test/round-686-love-bombing-en.js');

// 注入点：每个常量一行定位（old → new），new 为空正则（(?!) 永不匹配）。
// new RegExp(...) 返回真值对象，|| 右侧原数组永不求值——常量被置空但
// 文件其余部分原样保留，还原时整文件回写，无半改状态。
const INJECTS = [
  { name: 'UNIQUE_EN（P1 唯一性宣告腿·英）', from: String.raw`const UNIQUE_EN = new RegExp([`, to: String.raw`const UNIQUE_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'DEPEND_EN（P1/P6 生存依赖腿·英）', from: String.raw`const DEPEND_EN = new RegExp([`, to: String.raw`const DEPEND_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'BOMBARD_EN（P2 轰炸腿·英）', from: String.raw`const BOMBARD_EN = new RegExp([`, to: String.raw`const BOMBARD_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'DEMAND_EN（P2/P3/P6 服从腿·英）', from: String.raw`const DEMAND_EN = new RegExp([`, to: String.raw`const DEMAND_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'AGONY_EN（P3 痛苦宣告腿·英）', from: String.raw`const AGONY_EN = new RegExp([`, to: String.raw`const AGONY_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'ISOLATE_EN（P4 孤立宣告腿·英）', from: String.raw`const ISOLATE_EN = new RegExp([`, to: String.raw`const ISOLATE_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'DEROGATE_EN（P4/P5 贬损腿·英）', from: String.raw`const DEROGATE_EN = new RegExp([`, to: String.raw`const DEROGATE_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'EXCLUSIVE_EN（P5 排他宣告腿·英）', from: String.raw`const EXCLUSIVE_EN = new RegExp([`, to: String.raw`const EXCLUSIVE_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
  { name: 'GUARD_EN（守门：浪漫/科普/教育·英）', from: String.raw`const GUARD_EN = new RegExp([`, to: String.raw`const GUARD_EN = new RegExp(['(?!)'].join(''),'i') || new RegExp([` },
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
console.log('基线: ' + (base.ok ? 'PASS（23/23 预期）' : 'FAIL（异常！负例验证不成立）') + ' — ' + base.tail);
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
console.log('还原后: ' + (final.ok ? 'PASS（23/23 恢复）' : 'FAIL（异常！') + ' — ' + final.tail);
console.log('md5 一致: ' + (baseMd5 === finalMd5 ? '是' : '否（危险：源文件未还原）'));
console.log('');
console.log('=== 汇总: ' + redCount + '/' + INJECTS.length + ' 个注入点被测试抓住，基线 PASS，还原 md5 一致 = ' + (baseMd5 === finalMd5) + ' ===');
process.exit(redCount === INJECTS.length && final.ok && baseMd5 === finalMd5 ? 0 : 1);
