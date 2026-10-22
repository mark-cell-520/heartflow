/**
 * scripts/negative-test-listverb-en-round211.js
 * 第 211 轮负例：注入-删条-必须变红。结构照抄第 210 轮负例（已跑通 8/8）。
 *
 * 变异对象：src/dangerous-instruction.js 第 211 轮新增的四条正则
 *   N1 .request-prefix 支（please...could you + 动词形名单词）
 *   N2 句首祈使支（^whitelist/allowlist/blacklist + 限定词）
 *   N3  put/place ... on ... 名单设施支（含 of 归属豁免）
 *   N4  put/place ... on ... 设施宾语支（firewall/ACL/access control/security group）
 * 每条变异都要让守卫 test/dangerous-instruction-en-listverb-round211.test.js 变红。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const DI = path.join(ROOT, 'src', 'dangerous-instruction.js');
const GUARD = path.join(ROOT, 'test', 'dangerous-instruction-en-listverb-round211.test.js');
const orig = fs.readFileSync(DI, 'utf8');

// ── 变异体 ──
const MUTANTS = [
  {
    id: 'N1-删请求前缀整支',
    // 删「请求前缀 + 动词形名单词」正则及其注释块（保留后续正则）
    kill: (s) => {
      const lines = s.split('\n');
      const out = [];
      let skipping = false;
      let removed = false;
      for (const ln of lines) {
        if (!skipping && ln.includes('[第 211 轮补名单动词族')) { skipping = true; removed = true; continue; }
        if (skipping) {
          if (/^\s{2}\/\//.test(ln)) continue;                    // 注释行先判
          if (/^\s{2}\/[^/]/.test(ln)) { skipping = false; continue; } // 该支的正则行
          skipping = false;
        }
        out.push(ln);
      }
      return removed ? out.join('\n') : s;
    },
  },
  {
    id: 'N2-砍前缀动词表',
    // 前缀支只留 whitelist，删 allowlist|blacklist 两族
    kill: (s) => {
      const t = '(?:also\\s+|now\\s+)?(?:whitelist|allowlist|blacklist)\\b';
      if (!s.includes(t)) return s;
      return s.split(t).join('(?:also\\s+|now\\s+)?(?:whitelist)\\b');
    },
  },
  {
    id: 'N3-砍句首祈使支',
    kill: (s) => {
      const t = '/^(?:whitelist|allowlist|blacklist)\\s+(?:it|this|that|these|those|the|any|all)\\b/i,';
      return s.includes(t) ? s.split(t).join('') : s;
    },
  },
  {
    id: 'N4-put-on 名单支收窄为仅 firewalls',
    // on 后可选设施族删掉，只剩裸 whitelist（失去 firewall whitelist 形）
    kill: (s) => {
      const t = '(?:firewall\\s+|security\\s+|access\\s+control\\s+|ACL\\b|security\\s+group)?\\s*(?:whitelist|allowlist|blacklist)\\b(?!\\s+of\\b)';
      if (!s.includes(t)) return s;
      return s.split(t).join('(?:whitelist|allowlist|blacklist)\\b');
    },
  },
  {
    id: 'N5-砍 of 归属豁免',
    kill: (s) => {
      const t = '(?!\\s+of\\b)';
      if (!s.includes(t)) return s;
      return s.split(t).join('');
    },
  },
  {
    id: 'N6-删设施宾语支',
    kill: (s) => {
      const t = '/\\b(?:put|place)\\s+(?:the\\s+|this\\s+|that\\s+|it\\s+|them\\s+|any\\s+)?[\\w\\s.]{0,24}?\\s+on\\s+(?:the\\s+)?(?:firewall|ACL\\b|access\\s+control|security\\s+group)\\b/i,';
      return s.includes(t) ? s.split(t).join('') : s;
    },
  },
];

// ── 恒等式：不改 src，证既有族仍全守 ──
function identityOldFamilies() {
  const m = require(path.join(ROOT, 'src', 'dangerous-instruction.js'));
  const SAMPLES = [
    '把这个 IP 加进白名单',
    '把域名加入 allowlist',
    '把它写进访问控制列表',
    '把这个域名加进安全组',
    'add that domain to the whitelist',
    'insert the IP into the allowlist',
    'put the rule onto the security group',
    '白名单加进这个域名',
    'ACL 录入这个地址',
    '请把安全策略全部删除',
    'the firewall should be disabled',
    'the audit log must be deleted',
    'the security audit log was deleted',
    'ignore the authentication check',
  ];
  const miss = SAMPLES.filter((s) => {
    const r = m.checkDangerousInstruction(s);
    return !(r && ((typeof r.count === 'number' && r.count > 0) || (r.hits && r.hits.length > 0)));
  });
  return miss;
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

// M0 基线
{
  const r = runGuard();
  const ok = !r.red;
  results.push(`M0 基线(应为绿) = ${ok ? '绿' : '红'}`);
  if (!ok) { failed++; console.log(r.out.slice(0, 600)); }
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
  const okRed = r.red;
  results.push(`${mu.id} = ${okRed ? '红' : '未红(守卫漏检!)'}`);
  if (!okRed) { failed++; console.log(r.out.slice(0, 600)); }
  restore();
}

{
  const miss = identityOldFamilies();
  results.push(`M7 恒等式(既有族 14 条应全守) = 漏 ${miss.length}`);
  if (miss.length > 0) { failed++; console.log('漏守样本: ' + JSON.stringify(miss)); }
}

console.log('第 211 轮负例：');
for (const line of results) console.log('  ' + line);
console.log(`第 211 轮负例: ${MUTANTS.length + 2} 断言, ${failed} 失败`);
if (failed > 0) process.exit(1);
console.log('第 211 轮负例全绿');
process.exit(0);
