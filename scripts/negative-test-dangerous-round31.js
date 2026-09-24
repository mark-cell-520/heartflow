#!/usr/bin/env node
/**
 * 负例守卫：第 31 轮 dangerous_instruction 恶意目的否决 + 结构补全
 *
 * 用法：node scripts/negative-test-dangerous-round31.js
 * 判定：注入（删掉本轮改动）后，测试必须失败；恢复后必须全绿。
 * 若注入后测试仍全绿 → 守卫是死的，本轮改动没有真正被测试覆盖。
 *
 * 注入项（逐项删除后必须至少一个测试用例变红）：
 *   1. MALICIOUS_PURPOSE 否决整个条件 → 伪装提问的攻击句全部漏放
 *   2. 载荷正则的防御目的否定 → 「挡住 CC 攻击」重新被误伤
 *   3. 设施名后置绕过式整条删掉 → 「绕过 WAF 的 SQL 注入」漏判
 *   4. 制造攻击载荷整条删掉 → 载荷类样本漏判
 *   5. 第①条 QF 分支的 && 条件退化为旧版（只看 QF 不看 MP）→ A3 类漏放
 *   6. 词面回退（Defender/卸载/清空从词表移除）→ 对应样本漏判
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const TARGET = path.join(ROOT, 'src', 'dangerous-instruction.js');
const TEST = path.join(ROOT, 'test', 'dangerous-instruction-malicious-purpose-round31.test.js');

const INJECTIONS = [
  {
    name: '1. 删 MALICIOUS_PURPOSE 否决（伪装提问的攻击应全部漏放）',
    from: '  if (QUESTION_FRAME.test(text) && !MALICIOUS_PURPOSE.test(text)) {',
    to: '  if (QUESTION_FRAME.test(text)) {',
  },
  {
    name: '2. 删载荷正则的防御目的否定（「挡住 CC 攻击」应重新误伤）',
    from: '(?![^。\\n]{0,14}(?:防|挡|拦|检测|监测|监控|修复|防御|抵御|对抗|识别|防护|protect|defend|prevent|detect|block|mitigate))',
    to: '',
  },
  {
    name: '3. 删设施名后置绕过式整条（「绕过 WAF 的 SQL 注入」应漏判）',
    from: '  /(?:绕过|跳过|规避|逃过|突破|穿透|bypass|evade|circumvent)[^。\\n]{0,8}(?:WAF|IDS|IPS|防火墙|firewall|杀毒软件| antivirus|防病毒|证书校验|证书验证|SSL|TLS|安全策略|入侵检测|访问控制|白名单|验证码|身份验证|认证|鉴权)/i,\n',
    to: '',
  },
  {
    name: '4. 删制造攻击载荷整条（载荷类样本应漏判）',
    from: '  /(?:写|编写|生成|制作|做|开发|搞|给|提供|来一?个|来一?份|write|create|generate|make|build|develop)(?![^。\\n]{0,14}(?:防|挡|拦|检测|监测|监控|修复|防御|抵御|对抗|识别|防护|protect|defend|prevent|detect|block|mitigate))[^。\\n]{0,10}(?:SQL\\s*注入|XSS|跨站脚本|CSRF|命令注入|代码注入|注入| exploit|exploit|payload|木马|后门|webshell|shellcode|勒索软件|病毒|蠕虫|钓鱼页面|钓鱼网站|钓鱼邮件|中间人攻击|MITM|拒绝服务|DDoS|CC\\s*攻击|暴力破解|字典攻击|撞库)/i,\n',
    to: '',
  },
  {
    name: '5. QF 分支退化为旧版恒真（MP 词表整个不再参与判断）',
    from: 'const MALICIOUS_PURPOSE = new RegExp([',
    to: 'const MALICIOUS_PURPOSE = /(?!x)x/; const _unused = new RegExp([',
  },
  {
    name: '6. 词面回退：第①条设施词表移除 Defender / 杀毒软件',
    from: '|WAF|IDS|IPS|杀毒软件| antivirus|防病毒|Defender|defender)/i,',
    to: '|WAF|IDS|IPS)/i,',
  },
  {
    name: '7. 词面回退：第①条动词表移除 卸载/卸载掉/清空/清掉/清了',
    from: '|卸载|卸掉|卸载掉|卸了一?下|删掉|删了|清空|清掉|清了|去除',
    to: '|卸掉|卸了|删掉|删了|去除',
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
console.log('🧪 负例守卫：第 31 轮 dangerous_instruction 恶意目的否决 + 结构补全');
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

// 额外确认：源码与注入前逐字节一致（防止注入把文件写坏）
const sameBytes = fs.readFileSync(TARGET, 'utf8') === original;
console.log(`[还原完整性] 源码与注入前${sameBytes ? '完全一致 ✅' : '不一致 ❌'}`);
if (!sameBytes) allGood = false;

console.log('\n══════════════════════════════════════════════════════════');
console.log(allGood ? '✅ 负例守卫全部有效' : '❌ 存在失效守卫 — 本轮改动的测试覆盖不足');
console.log('══════════════════════════════════════════════════════════');
process.exit(allGood ? 0 : 1);
