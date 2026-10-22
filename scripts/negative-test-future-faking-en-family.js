/**
 * scripts/negative-test-future-faking-en-family.js
 *
 * [r689] future_faking 英文句式族守卫有效性负例验证。
 *
 * 方法同 r685-r688 negative-test-*.js：把 src/future-faking.js 里本轮新增的
 * 11 个英文分支逐一置为永不匹配（(?!)，改文件再跑测试文件的方式，证明
 * test/round-689-future-faking-en-family.js 本身能抓住每个分支失效），
 * 确认测试由 17/17 全绿变红，还原后恢复全绿，md5 校验一致。
 *
 * 判定标准：基线 17/17 PASS → 每个注入点 FAIL（至少 1 个断言红）→
 * 还原后 17/17 PASS 且 md5 与基线一致。
 *
 * 注入点覆盖：PROMISE_ZH 新增 7 支（E1 远期词在前 / E2 远期词在后 /
 * E4a 单方意志条件前置于 will / E4b 单方意志条件后置于 will /
 * E5 事业受益宣告 / E6 离婚复合宣告 / E7 无条件照顾承诺）、
 * PATIENCE_ZH 新增 4 支（P1 当下索取时间词在前 / P2 索取在前时间词在后 /
 * P3 服从型索取 / P4 欲望对价）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const SRC = path.join(HF, 'src/future-faking.js');
const TEST = path.join(HF, 'test/round-689-future-faking-en-family.js');

// 注入点：按「源文件里该行的唯一特征串」定位整行，替换为永不匹配的分支。
// 特征串一律用 String.raw 与源文件同形（单层反斜杠），不用 split('|')
// 切分（分支内部的选择支 | 会把正则切碎，定位必然落空）。
const INJECTS = [
  { name: 'PROMISE E1（远期词在前：someday/one day/soon + will + 承诺动词）',
    feat: String.raw`eventually)\b[^.]{0,30}?\b(?:i|we|you)\s+will` },
  { name: 'PROMISE E2（远期词在后：I promise I will marry ... someday）',
    feat: String.raw`(?:promise\s+(?:that\s+)?(?:i|we)\s+)?will\s+(?:marry|divorce` },
  { name: 'PROMISE E4a（单方意志条件前置：will get married as soon as I am ready）',
    feat: String.raw`(?:get\s+married|marry\s+you|be\s+together)\s+(?:as\s+soon\s+as|once)` },
  { name: 'PROMISE E4b（单方意志条件后置：as soon as I am ready ... will）',
    feat: String.raw`(?:as\s+soon\s+as|once)\s+(?:i\s+am\s+ready|i\s+say\s+so|i\s+decide)\b[^.]{0,30}?\b(?:i|we)\s+will` },
  { name: 'PROMISE E5（事业受益宣告：my business succeeds ... you will）',
    feat: String.raw`business\s+(?:succeeds|takes\s+off|is\s+successful|makes\s+it)` },
  { name: 'PROMISE E6（离婚复合宣告：will divorce/leave my wife ... marry/be together）',
    feat: String.raw`(?:divorce|leave)\s+my\s+(?:wife|husband|spouse)` },
  { name: 'PROMISE E7（无条件照顾承诺：will take care of you forever）',
    feat: String.raw`take\s+care\s+of\s+you\s+(?:forever|always|for\s+the\s+rest\s+of)` },
  { name: 'PATIENCE P1（当下索取时间词在前：for now/right now/tonight/first + 索取）',
    feat: String.raw`meanwhile|first)\b[^.]{0,40}?\b(?:you\s+(?:need|have)\s+to` },
  { name: 'PATIENCE P2（索取在前时间词在后：you need to ... tonight）',
    feat: String.raw`lend\s+me)\b[^.]{0,30}?\b(?:for\s+now|right\s+now|tonight` },
  { name: 'PATIENCE P3（服从型索取：keep this secret / delete photos / stop seeing）',
    feat: String.raw`keep\s+this\s+secret|delete\s+(?:those|these|the)` },
  { name: 'PATIENCE P4（欲望对价：give me what I want）',
    feat: String.raw`give\s+me\s+what\s+i\s+want` },
];

function md5(f) { return crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex'); }

function runTest() {
  try {
    const out = execFileSync(process.execPath, [TEST], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { ok: true, tail: out.trim().split('\n').slice(-2).join(' | ') };
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    const lines = out.trim().split('\n');
    const failLine = lines.find(l => l.includes('FAIL')) || lines[lines.length - 1] || '(no output)';
    return { ok: false, tail: failLine.trim().slice(0, 120) };
  }
}

// ─── 基线 ───────────────────────────────────────────────────────────
const baseMd5 = md5(SRC);
const original = fs.readFileSync(SRC, 'utf8');
const base = runTest();
console.log('基线: ' + (base.ok ? 'PASS（17/17 预期）' : 'FAIL（异常！负例验证不成立）') + ' — ' + base.tail);
if (!base.ok) { console.log('基线即失败，终止'); process.exit(1); }

// ─── 逐一注入 ────────────────────────────────────────────────────────
let redCount = 0;
for (const inj of INJECTS) {
  const lines = original.split('\n');
  const hitIdx = [];
  lines.forEach((l, i) => { if (l.includes(inj.feat)) hitIdx.push(i); });
  if (hitIdx.length !== 1) {
    console.log('  ⚠️ ' + inj.name + ' 定位失败（命中 ' + hitIdx.length + ' 行，预期 1），跳过');
    continue;
  }
  const idx = hitIdx[0];
  const before = lines[idx];
  lines[idx] = '  String.raw`(?!)`,';
  fs.writeFileSync(SRC, lines.join('\n'));
  const r = runTest();
  if (r.ok) {
    console.log('  ❌ ' + inj.name + ' 置空后测试仍全绿——守卫失效！');
  } else {
    redCount++;
    console.log('  ✅ ' + inj.name + ' 置空后测试变红 — ' + r.tail);
  }
  lines[idx] = before;
}

// ─── 还原并校验 ──────────────────────────────────────────────────────
fs.writeFileSync(SRC, original);
const after = runTest();
const afterMd5 = md5(SRC);
console.log('还原后: ' + (after.ok ? 'PASS（17/17 恢复）' : 'FAIL（异常！') + ' — ' + after.tail);
console.log('md5 一致: ' + (afterMd5 === baseMd5 ? '是' : '否（基线 ' + baseMd5.slice(0, 8) + ' vs 还原 ' + afterMd5.slice(0, 8) + '）'));
console.log('结果: ' + redCount + ' 个注入点全部变红, 共 ' + INJECTS.length + ' 个');
if (redCount !== INJECTS.length || !after.ok || afterMd5 !== baseMd5) process.exit(1);
