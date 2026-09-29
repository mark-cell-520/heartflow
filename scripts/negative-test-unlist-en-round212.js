/**
 * scripts/negative-test-unlist-en-round212.js
 * 第 212 轮负例：注入-删条-必须变红。结构照抄第 211 轮负例（ROOT 只用 '..'，
 * 源码词面断言用 indexOf 不用正则）。
 * 变异对象：src/dangerous-instruction.js 第 212 轮新增三条正则 + 机制点。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const DI = path.join(ROOT, 'src', 'dangerous-instruction.js');
const GUARD = path.join(ROOT, 'test', 'dangerous-instruction-en-unlist-round212.test.js');
const orig = fs.readFileSync(DI, 'utf8');

const MUTANTS = [
  {
    id: 'N1-删反义撤出祈使整支',
    kill: (s) => {
      const t =
        '/\\b(?:remove|delete|take|strip|drop|pull)\\s+(?:this|that|these|the|it|them|any)?[^.]{0,20}\\b(?:off|out\\s+of|from)\\s+(?:the\\s+)?(?:firewall\\s+|security\\s+|access\\s+control\\s+|ACL\\b|security\\s+group|whitelist|allowlist|blacklist)\\b(?!\\s+of\\b)/i,';
      return s.includes(t) ? s.split(t).join('') : s;
    },
  },
  {
    id: 'N2-砍祈使支动词表(只留 remove)',
    kill: (s) => {
      const t = '(?:remove|delete|take|strip|drop|pull)\\s+(?:this|that|these|the|it|them|any)?';
      if (!s.includes(t)) return s;
      return s.split(t).join('(?:remove)\\s+(?:this)?');
    },
  },
  {
    id: 'N3-收窄祈使支设施表(去掉 whitelist|allowlist|blacklist)',
    kill: (s) => {
      const t = '(?:firewall\\s+|security\\s+|access\\s+control\\s+|ACL\\b|security\\s+group|whitelist|allowlist|blacklist)';
      if (!s.includes(t)) return s;
      return s.split(t).join('(?:firewall\\s+|ACL\\b)');
    },
  },
  {
    id: 'N4-删反义撤出情态被动整支',
    kill: (s) => {
      const t =
        '/\\b(?:firewall|security\\s+group|access\\s+control\\s+list|access\\s+control|ACL\\b|whitelist\\w*|allowlist\\w*|blacklist\\w*)\\b[^.]{0,25}\\b(?:should|must|has\\s+to|can|ought\\s+to|needs?)\\s+(?:to\\s+)?(?:be\\s+)?(?:remov\\w*|delet\\w*|stripp\\w*|unlist\\w*|dropp\\w*|taken\\s+off)/i,';
      return s.includes(t) ? s.split(t).join('') : s;
    },
  },
  {
    id: 'N5-砍情态被动支的「无 be」机制(去掉 (?:be\\s+)?)',
    kill: (s) => {
      const t = '(?:to\\s+)?(?:be\\s+)?(?:remov\\w*';
      if (!s.includes(t)) return s;
      return s.split(t).join('(?:to\\s+)(?:be\\s+)(?:remov\\w*');
    },
  },
  {
    id: 'N6-删可疑主语被动完成整支',
    kill: (s) => {
      const t =
        '/\\b(?:attacker|malicious|suspicious|blocked|known-bad|unverified|temporary|bypass)\\b[^.]{0,40}\\b(?:was|were|got|has\\s+been|have\\s+been|is\\s+being)\\s+(?:whitelisted|allowlisted)\\b(?!\\s+by\\s+(?:mistake|accident|error))/i,';
      return s.includes(t) ? s.split(t).join('') : s;
    },
  },
  {
    id: 'N7-砍 by mistake 回溯豁免',
    kill: (s) => {
      const t = '(?!\\s+by\\s+(?:mistake|accident|error))';
      if (!s.includes(t)) return s;
      return s.split(t).join('');
    },
  },
  {
    id: 'N8-砍可疑主语限定表(只留 attacker)',
    kill: (s) => {
      const t = '(?:attacker|malicious|suspicious|blocked|known-bad|unverified|temporary|bypass)\\b[^.]{0,40}';
      if (!s.includes(t)) return s;
      return s.split(t).join('(?:attacker)\\b[^.]{0,40}');
    },
  },
];

// ── 恒等式：第 211 轮既有族 + 第 212 轮攻击样本仍全守 ──
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
  results.push(`M9 恒等式(12 条应全守) = 漏 ${miss.length}`);
  if (miss.length > 0) { failed++; console.log('漏守样本: ' + JSON.stringify(miss)); }
}

console.log('第 212 轮负例：');
for (const line of results) console.log('  ' + line);
console.log(`第 212 轮负例: ${MUTANTS.length + 2} 断言, ${failed} 失败`);
if (failed > 0) process.exit(1);
console.log('第 212 轮负例全绿');
process.exit(0);
