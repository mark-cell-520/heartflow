/**
 * [第 215 轮] 负例守卫：删掉 E7 两条正则或任何机制 → 守卫必须变红。
 * 参考 scripts/negative-test-absolute-claim-en.js 形态。
 * 变异在临时副本上做，不动真实 src/。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'src', 'dangerous-instruction.js');
const ORIG = fs.readFileSync(SRC, 'utf8');
const LINES = ORIG.split('\n');
const anchorIdx = LINES.findIndex((l) => l.includes('[第 215 轮补'));
if (anchorIdx < 0) { console.error('FATAL: 源码缺本轮锚点'); process.exit(1); }

const E7 = [];
for (let i = anchorIdx + 1; i < LINES.length; i++) {
  const t = LINES[i].trim();
  const isRegexLine = t.startsWith('/') && !t.startsWith('//') && t.endsWith('/i,');
  if (isRegexLine) E7.push({ line: i, text: LINES[i] });
  else if (E7.length > 0 && t.length > 0) break;
}
if (E7.length !== 2) { console.error('FATAL: E7 实际 ' + E7.length + ' 条'); process.exit(1); }

const REPLACEMENTS = [
  { id: 'N1', name: '删整支（两条 E7 全删）', from: E7.map(e => e.text).join('\n'), to: '' },
  { id: 'N2', name: '砍免检动词表（去掉 allowlist\\w* 一侧）', from: '(?:whitelist\\w*|allowlist\\w*)', to: '(?:whitelist)' },
  { id: 'N3', name: '砍可疑宾语表（去掉 attacker/malicious/suspicious/blocked/known-bad）',
    from: '(?:attacker|malicious|suspicious|blocked|known-bad|unverified|bypass|temporary\\s+(?:credential|access|token|host|ip|domain|session))',
    to: '(?:phishing|reviewed)' },
  { id: 'N4', name: '放开 blacklist（E7a 收黑名单形 → 防御陈述全误伤）',
    from: '\\b(?:whitelist\\w*|allowlist\\w*)\\b[^.]{0,40}\\b(?:attacker', to: '\\b(?:whitelist\\w*|allowlist\\w*|blacklist\\w*)\\b[^.]{0,40}\\b(?:attacker' },
  { id: 'N5', name: '砍 (?!\\s+of\\b) 归属豁免', from: '(?!\\s+of\\b)', to: '' },
  { id: 'N6', name: 'temporary 裸化（去掉名词限定 → the whitelist entry is temporary 误伤）',
    from: 'temporary\\s+(?:credential|access|token|host|ip|domain|session)', to: 'temporary' },
  { id: 'N7', name: '砍同句窗口（[^.]{0,40} → [\\s\\S]{0,200} 跨句）', from: '[^.]{0,40}', to: '[\\s\\S]{0,200}' },
  { id: 'N8', name: '删 E7b 宾语在前支（只留动词在前形）', from: E7[1].text, to: '' },
  { id: 'N9', name: '删 E7a 动词在前支（只留宾语在前形）', from: E7[0].text, to: '' },
  { id: 'N10', name: '砍 due to … error 误操作豁免（E3/E7 同犯）',
    from: '(?!\\s+due\\s+to\\s+(?:an?\\s+)?(?:mistake|accident|error|operator\\s+error|human\\s+error|manual\\s+error|config\\w*\\s+error))', to: '' },
  { id: 'N11', name: '砍 in error 误操作豁免', from: '(?![^.]{0,25}\\s+in\\s+error\\b)', to: '' },
  { id: 'N12', name: '砍 none-of-them 排除形 lookbehind', from: '(?<!none\\s+of\\s+them[^.]{0,25})', to: '' },
];

const GUARD = path.join(__dirname, '..', 'test', 'dangerous-instruction-en-declarative-list-verb-round215.test.js');

function runGuard() {
  try {
    const out = execFileSync('node', [GUARD], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { rc: 0, tail: out.trim().split('\n').slice(-1)[0] };
  } catch (e) {
    const o = ((e.stdout || '') + (e.stderr || '')).trim().split('\n');
    const fails = o.filter(l => l.trim().startsWith('FAIL')).length;
    return { rc: 1, tail: 'fails=' + fails };
  }
}

// M0：任何变异前，守卫必须全绿（证明守卫本身有效）
const m0 = runGuard();
console.log('M0 基线守卫: ' + (m0.rc === 0 ? 'GREEN' : 'RED') + ' (' + m0.tail + ')');
let allGreen = m0.rc === 0;

// M1..M9：每次变异后守卫必须变红
for (const r of REPLACEMENTS) {
  const count = ORIG.split(r.from).length - 1;
  if (count < 1) {
    console.log(r.id + ' ❌ 替换目标不存在（' + r.from.slice(0, 40) + '）→ 变异无效，记 RED');
    allGreen = false;
    continue;
  }
  fs.writeFileSync(SRC, ORIG.split(r.from).join(r.to));
  const r1 = runGuard();
  const red = r1.rc !== 0;
  console.log((red ? '✅' : '❌') + ' ' + r.id + ' ' + r.name + ' → 守卫 ' + (red ? 'RED' : 'GREEN(危险！守卫未触发)') + ' (' + r1.tail + ')');
  fs.writeFileSync(SRC, ORIG);
  if (!red) allGreen = false;
}

// M10：还原后守卫必须回到全绿（证明还原无损）
const m10 = runGuard();
console.log('M10 还原守卫: ' + (m10.rc === 0 ? 'GREEN' : 'RED') + ' (' + m10.tail + ')');
if (m10.rc !== 0) allGreen = false;

console.log('\n═══ round-215 negative-test: ' + (allGreen ? 'ALL GREEN' : 'FAILED') + ' ═══');
process.exit(allGreen ? 0 : 1);
