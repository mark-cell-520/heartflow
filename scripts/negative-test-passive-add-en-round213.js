/**
 * scripts/negative-test-passive-add-en-round213.js
 * 第 213 轮负例：注入-删条-必须变红。结构照抄第 211/212 轮负例
 * （ROOT 只用 '..'，源码词面断言用 indexOf 不用正则）。
 * 变异对象：src/dangerous-instruction.js 第 213 轮新增正则 + 机制点。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const DI = path.join(ROOT, 'src', 'dangerous-instruction.js');
const GUARD = path.join(ROOT, 'test', 'dangerous-instruction-en-passive-add-round213.test.js');
const orig = fs.readFileSync(DI, 'utf8');

const MUTANTS = [
  {
    id: 'N1-删被动完成加入整支',
    kill: (s) => {
      const t =
        '/\\b(?:attacker|malicious|suspicious|blocked|known-bad|unverified|temporary|bypass)\\b[^.]{0,40}\\b(?:was|were|got|has\\s+been|have\\s+been|is\\s+being|are\\s+being)\\s+(?:added\\s+(?:to|into|onto|on)|put\\s+on|inserted\\s+into|appended\\s+to)\\s+(?:the\\s+)?(?:firewall\\s+|access\\s+control\\s+)?(?:whitelist\\w*|allowlist\\w*|ACL\\b|security\\s+group|trusted\\s+list)\\b(?!\\s+by\\s+(?:mistake|accident|error))(?!\\s+(?:last|this)\\s+(?:quarter|month|year|week))(?![^.]{0,20}\\s+in\\s+error\\b)/i,';
      return s.includes(t) ? s.split(t).join('') : s;
    },
  },
  {
    id: 'N2-砍加入动词表(只留 added to)',
    kill: (s) => {
      const t = '(?:added\\s+(?:to|into|onto|on)|put\\s+on|inserted\\s+into|appended\\s+to)';
      if (!s.includes(t)) return s;
      return s.split(t).join('(?:added\\s+to)');
    },
  },
  {
    id: 'N3-收窄设施表(去掉 allowlist/security group/trusted list)',
    kill: (s) => {
      const t = '(?:whitelist\\w*|allowlist\\w*|ACL\\b|security\\s+group|trusted\\s+list)';
      if (!s.includes(t)) return s;
      return s.split(t).join('(?:whitelist\\w*|ACL\\b)');
    },
  },
  {
    id: 'N4-砍被动系动词表(去掉 are being / has been)',
    kill: (s) => {
      const t = '(?:was|were|got|has\\s+been|have\\s+been|is\\s+being|are\\s+being)';
      if (!s.includes(t)) return s;
      return s.split(t).join('(?:was|were|got)');
    },
  },
  {
    id: 'N5-砍 by mistake 回溯豁免',
    kill: (s) => {
      const t = '(?!\\s+by\\s+(?:mistake|accident|error))(?!\\s+(?:last|this)';
      if (!s.includes(t)) return s;
      return s.split(t).join('(?!\\s+(?:last|this)');
    },
  },
  {
    id: 'N6-砍 in error 回溯豁免',
    kill: (s) => {
      const t = '(?![^.]{0,20}\\s+in\\s+error\\b)';
      if (!s.includes(t)) return s;
      return s.split(t).join('');
    },
  },
  {
    id: 'N7-砍时段回溯豁免(last/this quarter…)',
    kill: (s) => {
      const t = '(?!\\s+(?:last|this)\\s+(?:quarter|month|year|week))';
      if (!s.includes(t)) return s;
      return s.split(t).join('');
    },
  },
  {
    id: 'N8-砍可疑主语限定表(只留 attacker)',
    kill: (s) => {
      const t = '(?:attacker|malicious|suspicious|blocked|known-bad|unverified|temporary|bypass)\\b[^.]{0,40}\\b(?:was|were|got|has\\s+been|have\\s+been|is\\s+being|are\\s+being)';
      if (!s.includes(t)) return s;
      return s.split(t).join('(?:attacker)\\b[^.]{0,40}\\b(?:was|were|got)');
    },
  },
];

// ── 恒等式：第 211/212 轮既有族 + 第 213 轮攻击样本仍全守 ──
function identityFamilies() {
  const m = require(DI);
  const SAMPLES = [
    // 第 211 轮族
    'add that domain to the whitelist',
    'insert the IP into the allowlist',
    'put the rule onto the security group',
    '把这个 IP 加进白名单',
    '请把安全策略全部删除',
    'the firewall should be disabled',
    'the security audit log was deleted',
    // 第 212 轮族
    'remove this host off the whitelist',
    'the ACL exception can be taken off',
    'that blacklist entry needs removing',
    'the attacker IP was whitelisted last night',
    'the malicious host has been allowlisted by the script',
    // 第 213 轮族
    'the suspicious address was added onto the ACL',
    'the attacker IP has been put on the whitelist',
    'the attacker IP was added to the allowlist',
  ];
  return SAMPLES.filter((s) => {
    const r = m.checkDangerousInstruction(s);
    return !(r && ((typeof r.count === 'number' && r.count > 0) || (r.hits && r.hits.length > 0)));
  });
}

function runGuard() {
  const r = cp.spawnSync(process.execPath, [GUARD], { encoding: 'utf8', timeout: 100000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const red = r.status !== 0 || /AssertionError|ERR_ASSERTION|\bfailed\b|\bFAIL\b/i.test(out);
  return { red, status: r.status, out };
}

let failed = 0;
const results = [];
function restore() { fs.writeFileSync(DI, orig); }

{
  const r = runGuard();
  const ok = !r.red;
  results.push(`M0 基线(应为绿) = ${ok ? '绿' : '红'}`);
  if (!ok) { failed++; console.log(r.out.slice(0, 800)); }
}

for (const mu of MUTANTS) {
  let mutated;
  try { mutated = mu.kill(orig); } catch (e) {
    results.push(`${mu.id} = 变异失败(${e.message})`); failed++; restore(); continue;
  }
  if (mutated === orig) {
    results.push(`${mu.id} = 变异无效(未改动源码)`); failed++; restore(); continue;
  }
  fs.writeFileSync(DI, mutated);
  const chk = cp.spawnSync(process.execPath, ['--check', DI], { encoding: 'utf8' });
  if (chk.status !== 0) {
    results.push(`${mu.id} = 变异致语法错误(判无效)`); failed++; restore(); continue;
  }
  const r = runGuard();
  results.push(`${mu.id} = ${r.red ? '红' : '未红(守卫漏检!)'}`);
  if (!r.red) { failed++; console.log(r.out.slice(0, 800)); }
  restore();
}

{
  const miss = identityFamilies();
  results.push(`M9 恒等式(15 条应全守) = 漏 ${miss.length}`);
  if (miss.length > 0) { failed++; console.log('漏守样本: ' + JSON.stringify(miss)); }
}

console.log('第 213 轮负例：');
for (const line of results) console.log('  ' + line);
console.log(`第 213 轮负例: ${MUTANTS.length + 2} 断言, ${failed} 失败`);
if (failed > 0) process.exit(1);
console.log('第 213 轮负例全绿');
process.exit(0);
