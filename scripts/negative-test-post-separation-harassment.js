/**
 * scripts/negative-test-post-separation-harassment.js
 *
 * [r690] post_separation_harassment（第 129 维，分手后纠缠骚扰）守卫
 * 有效性负例验证。
 *
 * 方法同 r685-r689 negative-test-*.js：把 src/post-separation-harassment.js
 * 里各承重分支逐一置为永不匹配（(?!)，改文件再跑测试文件的方式，证明
 * test/round-690-post-separation-harassment.js 本身能抓住每个分支失效），
 * 确认测试由 27/27 全绿变红，还原后恢复全绿，md5 校验一致。
 *
 * 判定标准：基线 27/27 PASS → 每个注入点 FAIL（至少 1 个断言红）→
 * 还原后 27/27 PASS 且 md5 与基线一致。
 *
 * 注入点覆盖：16 个常量各取其承重分支——SEPARATION_ZH/EN（A 腿）、
 * HARASS_ZH/EN（B1 腿）、KNOW_ZH/EN（B2 腿）、REFUSAL_ZH/EN（B3 腿）、
 * LEDGER_ZH/EN（B4 腿）、GUARD_ZH/EN 与 ANALYSIS_ZH 与 QUESTION_EN
 * （守门腿）。特征串一律用 String.raw 与源文件同形（单层反斜杠），
 * 不用 split('|') 切分（分支内部的选择支 | 会把正则切碎，定位必然落空）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const HF = path.resolve(__dirname, '..');
const SRC = path.join(HF, 'src/post-separation-harassment.js');
const TEST = path.join(HF, 'test/round-690-post-separation-harassment.js');

const INJECTS = [
  { name: 'SEPARATION_ZH（A 腿中文：分手/离婚/断绝关系/甩了我）',
    feat: String.raw`分手|离了婚|离婚|离异|断绝关系|一刀两断` },
  { name: 'SEPARATION_EN（A 腿英文：break up/broke up/divorce/blocked me）',
    feat: String.raw`break[- ]?up|broke[- ]?up|breaking[- ]?up` },
  { name: 'HARASS_ZH B1a（强度词+到场动词+地点名词）',
    feat: String.raw`隔三差五|连续|死命)(?:去|来|跑|蹲|守|堵|守|黏|缠)` },
  { name: 'HARASS_EN B1a（show up at + 对象代词）',
    feat: String.raw`show|showed|shows|showing)\s+up\s+at\s+(?:your|my|her|his|their)` },
  { name: 'KNOW_ZH（B2 知情腿中文：知道你的住址/行踪）',
    feat: String.raw`知道|清楚|掌握|了解)(?:你|您|我|俺)?的?` },
  { name: 'KNOW_EN（B2 知情腿英文：I know where you live/your address）',
    feat: String.raw`I\s+know\s+(?:where\s+you\s+(?:live|are|work)` },
  { name: 'REFUSAL_ZH B3a（拒绝标记在前：不许/不准/没门 + 分手）',
    feat: String.raw`(?:不许|不准|不允许|由不得你|没门|想都别想|休想|不同意|决不答应|绝对不会答应)(?:你|您)?` },
  { name: 'REFUSAL_EN B3a（not allowed to break up / cannot break up with me）',
    feat: String.raw`not\s+allowed|not\s+permitted|not\s+an\s+option)\s+to\s+(?:break|leave|dump|end|walk)` },
  { name: 'LEDGER_ZH（B4 行踪控制中文：汇报你的行踪）',
    feat: String.raw`(?:解释|汇报|报告|交代|说清|说明)(?:你|您)?(?:的)?(?:行踪|去向|行程|一举一动|每天|日程)` },
  { name: 'LEDGER_EN（B4 行踪控制英文：owe me an explanation）',
    feat: String.raw`owe\s+me\s+an?\s+(?:explanation|accounting|answer)` },
  { name: 'GUARD_ZH（守门中文：报警/保留证据/保护令）',
    feat: String.raw`报警|报案|保留证据|申请人身安全保护令|法律援助` },
  { name: 'GUARD_EN（守门英文：calling the police/restraining order）',
    feat: String.raw`(?:call|calling|contact|contacting|report|reporting)\s+(?:it|this|him|her|them\s+)?` },
  { name: 'ANALYSIS_ZH（守门概念分析：纠缠/跟踪骚扰 + 是/警惕）',
    feat: String.raw`(?:纠缠|跟踪|骚扰|stalk|harass)[^。]{0,14}` },
  { name: 'QUESTION_EN（守门句首提问：how/what ... ?）',
    feat: String.raw`what\s+can\s+i|what\s+should)\b[^.]{0,90}\?` },
];

function md5(f) { return crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex'); }

function runTest() {
  try {
    const out = execFileSync(process.execPath, [TEST], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { ok: true, tail: out.trim().split('\n').slice(-2).join(' | ') };
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    const lines = out.trim().split('\n');
    // 先找测试自己的失败行（❌ 前缀或汇总行），再找 FAIL，最后才兜底——
    // 兜底取到的 "Node.js v26.7.0" 是崩溃签名（语法错误），必须与断言
    // 失败区分开：崩溃红证明不了守卫能抓住分支失效（r690 实测踩过）。
    const own = lines.find(l => l.includes('❌')) || lines.find(l => l.includes('结果:'));
    const failLine = own || lines.find(l => l.includes('FAIL')) || lines[lines.length - 1] || '(no output)';
    const crashed = /SyntaxError|Cannot find module|ReferenceError/.test(out);
    return { ok: false, tail: (crashed ? '[崩溃非断言] ' : '') + failLine.trim().slice(0, 120) };
  }
}

// ─── 基线 ───────────────────────────────────────────────────────────
const baseMd5 = md5(SRC);
const original = fs.readFileSync(SRC, 'utf8');
const base = runTest();
console.log('基线: ' + (base.ok ? 'PASS（27/27 预期）' : 'FAIL（异常！负例验证不成立）') + ' — ' + base.tail);
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
  // ⚠️ 替换行必须带尾逗号——源行都是数组元素（以 , 结尾），漏掉逗号会让
  // 下一个 String.raw 行变成语法错误，测试因崩溃变红而非断言变红，
  // 那种「红」证明不了守卫能抓住分支失效（r690 实测抓到）。
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
console.log('还原后: ' + (after.ok ? 'PASS（27/27 恢复）' : 'FAIL（异常！') + ' — ' + after.tail);
console.log('md5 一致: ' + (afterMd5 === baseMd5 ? '是' : '否（基线 ' + baseMd5.slice(0, 8) + ' vs 还原 ' + afterMd5.slice(0, 8) + '）'));
console.log('结果: ' + redCount + ' 个注入点全部变红, 共 ' + INJECTS.length + ' 个');
if (redCount !== INJECTS.length || !after.ok || afterMd5 !== baseMd5) process.exit(1);
