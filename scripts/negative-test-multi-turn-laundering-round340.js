// r340 负例守卫：multi_turn_escalation authority_laundering 耦合层（第 339 轮改动）
// 修正 r339 脚本的第 5 项死守卫：原注入点「授权范围」分支删除后无样本漏判
// （probe-1 逐支实测 L3 = NONE），换成本轮 probe-1/probe-2 坐实的真实锚点：
// ① 敏感层 S1（PII 族，删除后 4 条漏判）
// ② 敏感层 S4（后台入口族，删除后 2 条漏判）
// ③ 洗白半 L39 security-team-verified 族（删除后 S12 漏判）
// ④ 移除 sensitive 目标层（整层不参与）—— probe-2 显示 S3/S12 唯一依赖
// 注入项（逐项注入后必须至少一个测试用例变红）：
//   1. coupled: 'sensitive' → true（退回旧档）
//   2. 洗白半正则整体失效
//   3. SENSITIVE_TARGET 数组整体失效
//   4. 敏感半 hits.push 删除（count<2）
//   5. 敏感层 S1（PII 族）删除 → S1/S2/S4/S5 重新漏判
//   6. 敏感层 S4（后台入口族）删除 → S6/S7 重新漏判
//   7. 洗白半 L39 security-team-verified 删除 → S12 重新漏判
'use strict';
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const TARGET = path.join(ROOT, 'src', 'multi-turn-tactics.js');
const TEST = path.join(ROOT, 'test', 'multi-turn-laundering-round339.test.js');

const INJECTIONS = [
  {
    name: "耦合层 coupled: 'sensitive' → true（退回旧档，敏感目标不再触发）",
    from: "    coupled: 'sensitive',",
    to: "    coupled: true,",
  },
  {
    name: '洗白半正则整体失效（攻击侧应重新漏判）',
    from: "const _RE_AUTHORITY_LAUNDERING = new RegExp([",
    to: "const _RE_AUTHORITY_LAUNDERING = /(?!x)x/; const _unused = new RegExp([",
  },
  {
    name: '敏感目标层整体失效（攻击侧应重新漏判）',
    from: "const SENSITIVE_TARGET = [",
    to: "const SENSITIVE_TARGET_MIRROR = [",
  },
  {
    name: '敏感半不计入 hits（count < 2 不 qualify）',
    from: "    hits.push({ ladder: 'sensitive_target', label: '敏感索取目标（洗白族触发条件）', matched: 'sensitive', score: 0 });",
    to: "    /* injected: drop sensitive hit */",
  },
  {
    // probe-1 实测 S1：删除后 S1/S2/S4/S5 四条重新漏判
    name: '敏感层 PII 族删除（S1/S2/S4/S5 重新漏判）',
    from: "  /(?:手机号|身份证|银行卡|密码|验证码|住址|护照|出生日期|工号|",
    to: "  /(?:__disabled_pii__",
  },
  {
    // probe-1 实测 S4：删除后 S6/S7 两条重新漏判
    name: '敏感层后台入口族删除（S6/S7 重新漏判）',
    from: "  /(?:后台|管理|admin|root)[^。]{0,6}(?:入口|地址|链接|口令|账号)/i,",
    to: "",
  },
  {
    // probe-1 实测 L39：删除后 S12（英文 security team 族）重新漏判
    name: '洗白半 security-team-verified 族删除（英文侧 S12 重新漏判）',
    from: "  '|(?:\\\\b(?:security|audit|compliance|ops)\\\\s+(?:team|dept\\\\w*)\\\\s+has\\\\s+verified\\\\b)',",
    to: "",
  },
];

function runTest() {
  try {
    execFileSync('node', [TEST], { cwd: ROOT, stdio: 'pipe' });
    return true;
  } catch (_) { return false; }
}

const original = fs.readFileSync(TARGET, 'utf8');
let allGood = true;

console.log('══════════════════════════════════════════════════════════');
console.log('🧪 负例守卫：multi_turn authority_laundering 耦合层（r340 修订版）');
console.log('══════════════════════════════════════════════════════════');

const baseOk = runTest();
console.log(`\n[基线] 未注入测试${baseOk ? '通过' : '失败'} ${baseOk ? '✅' : '❌'}`);
if (!baseOk) {
  console.log('❌ 基线就不是绿的，先修测试再谈守卫');
  process.exit(1);
}

for (const inj of INJECTIONS) {
  if (!original.includes(inj.from)) {
    console.log(`\n[跳过] ${inj.name} — 注入锚点未找到（源码已变？）`);
    allGood = false;
    continue;
  }
  const injected = original.replace(inj.from, inj.to);
  fs.writeFileSync(TARGET, injected);
  const failed = !runTest();
  fs.writeFileSync(TARGET, original);
  console.log(`\n[注入] ${inj.name}`);
  console.log(`  删除后测试${failed ? '变红 ✅（守卫有效）' : '仍全绿 ❌（守卫失效！）'}`);
  if (!failed) allGood = false;
}

const restoredOk = runTest();
console.log(`\n[恢复] 还原后测试${restoredOk ? '全绿 ✅' : '失败 ❌'}`);
if (!restoredOk) allGood = false;

console.log('\n══════════════════════════════════════════════════════════');
console.log(allGood ? '✅ 负例守卫全部有效（7/7）' : '❌ 存在失效守卫 — 测试覆盖不足');
console.log('══════════════════════════════════════════════════════════');
process.exit(allGood ? 0 : 1);
