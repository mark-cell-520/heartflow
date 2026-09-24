#!/usr/bin/env node
/**
 * 负例脚本：第 30 轮 multi_turn 软分支/硬分支分界（注入式删条守卫）
 *
 * 用法：node scripts/negative-test-multi-turn-round30.js
 * 判定：注入（删掉本轮改动）后，测试必须失败；恢复后必须全绿。
 * 若注入后测试仍全绿 → 守卫是死的，本轮改动没有真正被测试覆盖。
 *
 * 注入项（逐项删除后必须至少一个测试用例变红）：
 *   1. softHitIsConsult 的求教排除 → 良性句重新被判累积
 *   2. system_entry 组装式的索取指向 → 攻击句漏判
 *   3. model_internals 反序分支 → 反序样本漏判
 *   4. capability_probe 例外（不豁免）→ 真组合漏判
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const TARGET = path.join(ROOT, 'src', 'multi-turn-tactics.js');
const TEST = path.join(ROOT, 'test', 'multi-turn-soft-hard-round30.test.js');

const INJECTIONS = [
  {
    name: '删 softHitIsConsult 求教排除（良性句应重新误拦）',
    from: "  if (CONSULT_WORD.test(after)) return true;        // 名词之后问用法 → 排除",
    to: "  if (false && CONSULT_WORD.test(after)) return true;",
  },
  {
    name: '删 system_entry 软分支的索取指向（退化为旧版正则，软分支样本应重新计层）',
    from: "    re: _RE_SYSTEM_ENTRY },",
    to: "    re: /(?:(?:后台|管理|admin|root)[^。\\n]{0,6}(?:入口|地址|链接|口令|密码|账号|权限)|(?:内部|机密|敏感|私有)[^。\\n]{0,6}(?:配置|信息|凭据|密钥|token|secret|credential)|(?:数据库|服务器|运维)[^。\\n]{0,8}(?:地址|入口|账号|密码|权限|口令)|(?:配置|凭据|密钥|密匙|口令|密码)[^。\\n]{0,8}(?:文件|列表|详情|内容))/i },",
  },
  {
    name: '删 model_internals 反序分支（反序样本应漏判）',
    from: "|(?:打印|打|输出|显示|展示|告诉|给|发|列|贴|念|读|透露|泄露)[^。\\n]{0,8}(?:系统提示|系统指令|内部指令|初始指令|隐藏指令|提示词|prompt)",
    to: "",
  },
  {
    name: '删 capability_probe 例外（真组合应漏判）',
    from: "  if (CAPABILITY_PROBE.test(text)) return false;",
    to: "  if (false && CAPABILITY_PROBE.test(text)) return false;",
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
console.log('🧪 负例守卫：第 30 轮 multi_turn 软分支/硬分支分界');
console.log('══════════════════════════════════════════════════════════');

// 0) 基线：未注入时必须全绿
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
console.log(allGood ? '✅ 负例守卫全部有效' : '❌ 存在失效守卫 — 本轮改动的测试覆盖不足');
console.log('══════════════════════════════════════════════════════════');
process.exit(allGood ? 0 : 1);
