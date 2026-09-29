/**
 * scripts/negative-test-modal-listverb-en-round214.js
 * 第 214 轮负例：注入-删条-必须变红。结构照抄第 211/212/213 轮负例
 * （ROOT 只用 '..'，源码词面断言用 indexOf 不用正则）。
 * 变异对象：src/dangerous-instruction.js 第 214 轮新增 E5/E6 两支 + 机制点。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const DI = path.join(ROOT, 'src', 'dangerous-instruction.js');
const GUARD = path.join(ROOT, 'test', 'dangerous-instruction-en-modal-listverb-round214.test.js');
const orig = fs.readFileSync(DI, 'utf8');

// E5 支整行（第 214 轮情态加入支）
const E5_FULL =
  '/\\b(?:should|must|ought\\s+to|has\\s+to|have\\s+to|needs?\\s+to|could|can|may|might|will|needs?)\\s+(?:also\\s+|now\\s+)?(?:be\\s+)?(?:add\\w*|put|insert\\w*|append\\w*|includ\\w*|enroll\\w*)\\s+[\\w\\s.]{0,24}?\\s*(?:to|into|onto|on|in)\\s+(?:the\\s+|this\\s+|that\\s+)?(?:firewall\\s+|access\\s+control\\s+|security\\s+)?(?:whitelist\\w*|allowlist\\w*|ACL\\b|security\\s+group|trusted\\s+list|exception\\s+list)\\b(?!\\s+of\\b)/i,';
// E6 支整行（第 214 轮情态/被动撤出支）
const E6_FULL =
  '/\\b(?:should|must|ought\\s+to|has\\s+to|have\\s+to|needs?\\s+to|could|can|may|might|will|needs?|was|were|got|has\\s+been|have\\s+been|is\\s+being|are\\s+being)\\s+(?:be\\s+|also\\s+|now\\s+|immediately\\s+|finally\\s+|already\\s+)?(?:unlist\\w*|remov\\w*|delet\\w*|stripp\\w*|dropp\\w*|lift\\w*|purg\\w*|revok\\w*|tak(?:e|en))\\s+(?:from|out\\s+of|off)\\s+(?:the\\s+|this\\s+|that\\s+)?(?:firewall\\s+|access\\s+control\\s+|security\\s+)?(?:whitelist\\w*|allowlist\\w*|blacklist\\w*|ACL\\b|security\\s+group|trusted\\s+list)\\b(?!\\s+of\\b)/i,';

const MUTANTS = [
  {
    id: 'N1-删情态加入整支(E5)',
    kill: (s) => (s.includes(E5_FULL) ? s.split(E5_FULL).join('') : s),
  },
  {
    id: 'N2-删情态/被动撤出整支(E6)',
    kill: (s) => (s.includes(E6_FULL) ? s.split(E6_FULL).join('') : s),
  },
  {
    id: 'N3-砍 E5 情态动词表(去掉 ought to/has to/needs to)',
    kill: (s) => {
      const t = '(?:should|must|ought\\s+to|has\\s+to|have\\s+to|needs?\\s+to|could|can|may|might|will|needs?)\\s+(?:also\\s+|now\\s+)?(?:be\\s+)?';
      return s.includes(t) ? s.split(t).join('(?:should|must)\\s+(?:be\\s+)?') : s;
    },
  },
  {
    id: 'N4-砍 E5 加入动词表(去掉 append/includ/enroll)',
    kill: (s) => {
      const t = '(?:add\\w*|put|insert\\w*|append\\w*|includ\\w*|enroll\\w*)';
      return s.includes(t) ? s.split(t).join('(?:add\\w*|put)') : s;
    },
  },
  {
    id: 'N5-砍 E5 介词表(去掉 into/onto/on/in 只留 to)',
    kill: (s) => {
      const t = '\\s*(?:to|into|onto|on|in)\\s+(?:the\\s+|this\\s+|that\\s+)?(?:firewall\\s+|access\\s+control\\s+|security\\s+)?(?:whitelist\\w*|allowlist\\w*|ACL\\b|security\\s+group|trusted\\s+list|exception\\s+list)\\b(?!\\s+of\\b)';
      return s.includes(t) ? s.split(t).join('\\s+to\\s+(?:the\\s+)?(?:whitelist\\w*|allowlist\\w*|ACL\\b)') : s;
    },
  },
  {
    id: 'N6-砍 E6 撤出动词表(去掉 revok/purg/lift/tak)',
    kill: (s) => {
      const t = '(?:unlist\\w*|remov\\w*|delet\\w*|stripp\\w*|dropp\\w*|lift\\w*|purg\\w*|revok\\w*|tak(?:e|en))';
      return s.includes(t) ? s.split(t).join('(?:remov\\w*|delet\\w*)') : s;
    },
  },
  {
    id: 'N7-砍 E6 介词表(去掉 out of/off 只留 from)',
    kill: (s) => {
      const t = '(?:unlist\\w*|remov\\w*|delet\\w*|stripp\\w*|dropp\\w*|lift\\w*|purg\\w*|revok\\w*|tak(?:e|en))\\s+(?:from|out\\s+of|off)\\s+';
      return s.includes(t) ? s.split(t).join('$1\\s+from\\s+') : s;
    },
  },
  {
    id: 'N8-砍 E5/E6 设施的 of 归属豁免',
    kill: (s) => {
      let out = s;
      // E5 与 E6 两支行尾的归属豁免（只动含 enroll/revok 的那两行）
      out = out.split('(?:whitelist\\w*|allowlist\\w*|ACL\\b|security\\s+group|trusted\\s+list|exception\\s+list)\\b(?!\\s+of\\b)/i,').join('(?:whitelist\\w*|allowlist\\w*|ACL\\b|security\\s+group|trusted\\s+list|exception\\s+list)\\b/i,');
      out = out.split('(?:whitelist\\w*|allowlist\\w*|blacklist\\w*|ACL\\b|security\\s+group|trusted\\s+list)\\b(?!\\s+of\\b)/i,').join('(?:whitelist\\w*|allowlist\\w*|blacklist\\w*|ACL\\b|security\\s+group|trusted\\s+list)\\b/i,');
      return out;
    },
  },
  {
    id: 'N9-放宽 E5 设施表为裸 group/list',
    kill: (s) => {
      const t = '(?:whitelist\\w*|allowlist\\w*|ACL\\b|security\\s+group|trusted\\s+list|exception\\s+list)';
      return s.includes(t) ? s.split(t).join('(?:whitelist\\w*|allowlist\\w*|ACL\\b|group|list)') : s;
    },
  },
];

// ── 恒等式：第 211/212/213 轮既有族 + 第 214 轮攻击样本仍全守 ──
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
    // 第 214 轮族
    'this IP should be added to the allowlist',
    'the host needs adding to the firewall whitelist',
    'the entry ought to be inserted into the ACL',
    'the rule should be taken off the security group',
    'this entry has to be deleted off the blacklist',
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
  results.push(`M9 恒等式(20 条应全守) = 漏 ${miss.length}`);
  if (miss.length > 0) { failed++; console.log('漏守样本: ' + JSON.stringify(miss)); }
}

console.log('第 214 轮负例：');
for (const line of results) console.log('  ' + line);
console.log(`第 214 轮负例: ${MUTANTS.length + 2} 断言, ${failed} 失败`);
if (failed > 0) process.exit(1);
console.log('第 214 轮负例全绿');
process.exit(0);
