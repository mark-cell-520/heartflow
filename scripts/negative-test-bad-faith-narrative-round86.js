/**
 * 负例守卫：bad_faith 策略叙事族（第 86 轮）
 *
 * 口径（第 85 轮沿用）：
 *   ① 注入：从 BADFAITH_NARRATIVE_SLOTS 临时移除某条判据
 *   ② 删条：在**整仓副本**里改源码（只拷 src/index.js 会让 gate.js 加载崩溃——
 *      「崩溃」不等于「变红」，第 13/15 轮教训）
 *   ③ 跑真主测试：副本里跑 test/bad-faith-narrative-round86.test.js
 *   ④ 退出码非零 = 真变红（该判据被守卫覆盖）
 *
 * 冗余判定（probeRedundancy）：若删条后主测试仍全绿，说明该 sample 被同族
 * 其他判据兜底覆盖 —— 这是「有兜底」不是「守卫假阴性」（第 83/85 轮口径）。
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const IDX = path.join(HF, 'src/index.js');
const MAIN = path.join(HF, 'test/bad-faith-narrative-round86.test.js');
const COPY = '/root/.hermes/scratch/r86-guard-copy';

function sh(cmd, cwd) {
  try {
    const out = execFileSync('bash', ['-c', cmd], { cwd, encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, out: out.toString() };
  } catch (e) {
    return { ok: false, out: ((e.stdout || '') + (e.stderr || '')).toString() };
  }
}

// ── 判据清单（与 src/index.js 的 BADFAITH_NARRATIVE_SLOTS 对应） ──
const src = fs.readFileSync(IDX, 'utf8');
const slotIds = [...src.matchAll(/id:\s*'(narrative_[a-z_]+|[a-z_]+)',\s*\n\s*hard:/g)]
  .map(m => m[1]).filter(x => !x.startsWith('narrative_'));

console.log(`检出 ${slotIds.length} 条叙事族判据: ${slotIds.join(', ')}`);

// ── 每条判据的专属攻击样本（删条后唯一会漏的样本） ──
const OWN_SAMPLES = {
  feign_pretense: ['他明显是揣着明白装糊涂，故意带节奏'],
  sealion_extract: ['反复追问同一个问题，直到对方答不上来就宣布自己赢了'],
  sealion_no_answer: ['他问的那些问题根本不需要答案，只是为了占据道德高地'],
  strawman_impose: ['把对方没说的话强行安他头上，再反驳这个被安上的观点'],
  strawman_forced: ['把对方没说的话强行安他头上，再反驳这个被安上的观点'],
  strawman_attack: ['给这个莫须有的罪名辩护毫无意义'],
  stale_dig: ['故意引用对方三年前的观点来否定他今天的立场'],
  tone_over_substance: ['辩论时专门挑对方语气用词的问题，回避论点本身'],
  tone_avoid_point: ['专挑你措辞的漏洞，绕开你真正的意思'],
  withdraw_replay: ['每次都用「我没有这个意思」撤回发言，下轮换个说法继续'],
  withdraw_deny: ['每次都用「我没有这个意思」撤回发言，下轮换个说法继续'],
  muddy_then_blame: ['先把水搅浑，再指责别人没讲清楚'],
  not_arguing_to_win: ['他不是在跟你讲道理，是在给你下套'],
  only_want_win: ['他只是想证明自己没错，根本不在乎真相'],
  came_to_win: ['他不是来讨论的，是来赢的'],
  surface_vs_real: ['表面上问问题，实际上是要给你定罪'],
  purpose_clause: ['表面上问问题，实际上是要给你定罪'],
  fake_neutral_bias: ['看似中立，其实每一步都在偏袒自己人'],
  conclusion_first: ['他一开口就认定你错了，后面都在为这个结论找理由'],
  label_then_justify: ['先给你扣个帽子，再论证这个帽子多合理'],
  moral_high_ground: ['他问的那些问题根本不需要答案，只是为了占据道德高地'],
  politeness_cloak: ['最后再补一句「我只是礼貌地提出质疑」'],
};

// ── 建副本：只拷主测试必需的（src + regex-to-text + 主测试本身），
//    不拷整个 test/ 目录（几百个文件，一次几秒到几十秒纯浪费） ──
if (fs.existsSync(COPY)) fs.rmSync(COPY, { recursive: true, force: true });
fs.mkdirSync(path.join(COPY, 'test'), { recursive: true });
if (fs.existsSync(path.join(HF, 'src'))) fs.cpSync(path.join(HF, 'src'), path.join(COPY, 'src'), { recursive: true });
for (const f of ['bad-faith-narrative-round86.test.js', 'regex-to-text.js']) {
  const p = path.join(HF, 'test', f);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(COPY, 'test', f));
}
const nm = path.join(HF, 'node_modules');
if (fs.existsSync(nm)) fs.symlinkSync(nm, path.join(COPY, 'node_modules'), 'dir');
for (const f of ['package.json', 'VERSION']) {
  const p = path.join(HF, f);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(COPY, f));
}

const copyIdx = path.join(COPY, 'src/index.js');
const copyMain = path.join(COPY, 'test/bad-faith-narrative-round86.test.js');
let original = fs.readFileSync(copyIdx, 'utf8');

// ── 对照组：未改动的副本必须全绿 ──
const ctrl = sh('node test/bad-faith-narrative-round86.test.js', COPY);
console.log(`\n[对照组] 主测试退出码 ${ctrl.ok ? 0 : 1} → ${ctrl.ok ? 'PASS（对照成立）' : 'FAIL（对照不成立，中止）'}`);
if (!ctrl.ok) { console.log(ctrl.out.slice(-600)); process.exit(1); }

function removeSlot(text, id) {
  // 定位该 slot 的对象字面量并整体删除
  const re = new RegExp(`\\{\\s*\\n(?:\\s*//[^\\n]*\\n)*\\s*id:\\s*'${id}',[\\s\\S]*?\\n  \\},`, 'm');
  const m = text.match(re);
  if (!m) return null;
  return text.replace(re, '');
}

// ⚠️ 守卫设计要点（本轮第一版踩坑）：主测试的攻击断言用的是**阈值**
//    `bad_faith 命中 >= 17/24`，删掉任意一条判据后仍有 >= 17 命中，
//    主测试结构性不敏感 → 22 条全部误判成「失守」。
//    正确做法：守卫脚本自带 **per-slot 精准断言**——删掉 id 为 X 的判据后，
//    必须断言「X 的专属样本不再命中 bad_faith」。这不需要改主测试
//    （主测试的阈值断言仍然有效，用于防止整体回归）。
const ownProbe = (id) => `node -e "
const g=require('./src/gate.js');
const samples=${JSON.stringify((OWN_SAMPLES[id] || []).map(s => s))};
const hit=samples.filter(s=>(g.gate(s).findings||[]).some(f=>f.dimension==='bad_faith')).length;
console.log(hit+'/'+samples.length);
"`;

console.log('\n[per-slot 精准断言：删条后专属样本必须全部漏判]');
let trulyRed = 0, hasCoverage = 0, lost = 0;
const report = [];

for (const id of slotIds) {
  const stripped = removeSlot(original, id);
  if (stripped === null) {
    report.push({ id, status: 'DELETE_FAIL', note: '定位不到判据块' });
    lost++;
    continue;
  }
  fs.writeFileSync(copyIdx, stripped);
  const own = OWN_SAMPLES[id] || [];
  // ① 主测试仍须全绿（删一条不破坏整体）
  const main = sh('node test/bad-faith-narrative-round86.test.js', COPY);
  // ② 专属样本必须漏判（per-slot 敏感点）
  const p = sh(ownProbe(id), COPY);
  const hitCount = parseInt((p.out.trim().match(/^(\d+)\//) || [0, '0'])[1], 10);

  if (main.ok && hitCount === 0 && own.length > 0) {
    trulyRed++;
    report.push({ id, status: 'RED', note: `删后主测试仍全绿，专属样本 0/${own.length} 漏判 → 判据确被守卫` });
  } else if (main.ok && hitCount > 0) {
    hasCoverage++;
    report.push({ id, status: 'COVERED', note: `删后专属样本仍 ${hitCount}/${own.length} 命中 → 同族兜底（有兜底）` });
  } else {
    lost++;
    report.push({ id, status: 'FAIL', note: `主测试退出码非零或漏判数异常: main.ok=${main.ok}, hit=${hitCount}, out=${p.out.trim().slice(0, 60)}` });
  }
  fs.writeFileSync(copyIdx, original);
}

console.log('\n══ 逐条结果 ══');
for (const r of report) {
  const mark = r.status === 'RED' ? '✅' : (r.status === 'COVERED' ? '🟡' : '❌');
  console.log(`  ${mark} [${r.status}] ${r.id}`);
  if (r.status !== 'RED') console.log(`       ${r.note}`);
}
console.log(`\n真变红 ${trulyRed} / 有兜底 ${hasCoverage} / 失守 ${lost}（共 ${slotIds.length} 条）`);

fs.rmSync(COPY, { recursive: true, force: true });
process.exit(lost === 0 ? 0 : 1);
