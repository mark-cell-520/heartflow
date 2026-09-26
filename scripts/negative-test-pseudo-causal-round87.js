/**
 * 负例守卫：pseudo_causal 反向量词族 + 无机制动作×获益结果族（第 87 轮）
 *
 * 口径（第 83/85/86 轮沿用，本轮按正则判据形态调整）：
 *   ① 注入：在**整仓副本**里改 src/index.js —— 本轮两族是正则字面量，
 *      注入方式 = 把该族正则替换成一个永不匹配的等价坏正则
 *      （只改字面量、不动结构，专测「这条正则是否真被守卫盯着」）
 *   ② 跑真主测试：副本里跑 test/pseudo-causal-luck-attribution-round87.test.js
 *   ③ 专属样本断言：删条后该族专属样本必须漏判（per-slot 精准，不用阈值）
 *
 * 为什么要跑主测试：防止「破坏正则 → 主测试崩了」被误当变红
 * （崩溃 ≠ 变红，第 13/15 轮教训）。对照组的副本必须先全绿。
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const IDX = path.join(HF, 'src/index.js');
const MAIN = path.join(HF, 'test/pseudo-causal-luck-attribution-round87.test.js');
const COPY = '/root/.hermes/scratch/r87-guard-copy';

function sh(cmd, cwd) {
  try {
    const out = execFileSync('bash', ['-c', cmd], { cwd, encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, out: out.toString() };
  } catch (e) {
    return { ok: false, out: ((e.stdout || '') + (e.stderr || '')).toString() };
  }
}
// 主测试在副本内的相对路径（sh 的 cwd 已是 COPY）。
// ⚠️ 不能传原仓绝对路径 MAIN：node 会按**该文件所在目录**解析它的
// require('fs')/node_modules，副本里 node_modules 是 symlink 到原仓的，
// 用绝对路径跑原仓文件反而能跑；但负例守卫要的是「副本里的主测试读
// 副本里的 src」——只有相对路径才能保证 cwd=COPY + 模块解析跟着 cwd 走。
const MAIN_REL = 'test/' + path.basename(MAIN);

// ── 注入清单：把该族判据换成永不匹配的等价坏正则 ──
// 每项 = { name, anchor(源码唯一定位串), replacement, probe(专属样本断言) }
const INJECTIONS = [
  {
    name: 'A族 反向量词（PSEUDO_CAUSAL_ZH 第2条）',
    anchor: '/(?:下降|降低|减少|下滑|缩减|收窄|缩小|缩短|打折|提高|提升|增加|改善|优化)\\s*(?:了)?\\s*(?:\\d+(?:\\.\\d+)?|[零一两二三四五六七八九十百]+(?:\\s*分之\\s*[零一两二三四五六七八九十百]+)?)\\s*(?:倍|x|次)/,',
    replacement: '/(?:__R87_NEVER__)\\s*(?:了)?\\s*(?:\\d+)\\s*(?:倍)/,',
    probe: `g.gate('新功能上线后用户投诉量下降了三倍').findings.some(f=>f.dimension==='pseudo_causal')`,
    desc: '把整条反向量词判据替换为永不匹配的坏正则',
  },
  {
    name: 'B族 无机制动作×获益结果（PC_CAUSAL_ZH_PATS ⑩）',
    anchor: 'new RegExp(PC_ACT_LUCK_ZH.source + \'[^。]{0,20}\' + PC_RES_LUCK_ZH.source),',
    replacement: 'new RegExp(\'__R87_NEVER_ACT__\' + \'[^。]{0,20}\' + \'__R87_NEVER_RES__\'),',
    probe: `g.gate('昨天拜了财神，今天就签单了').findings.some(f=>f.dimension==='pseudo_causal')`,
    desc: '把两半 AND 判据替换为永不匹配的坏正则',
  },
  {
    name: 'B族 甲半常量（PC_ACT_LUCK_ZH）',
    anchor: 'const PC_ACT_LUCK_ZH = /(?:拜|求神|祈福|许愿|转发|抽奖|转运气|戴了?[^。]{0,4}(?:手链|手环|护符|水晶|佛珠)|吃了?[^。]{0,6}(?:药|保健品|补品)|深呼吸|换了?[^。]{0,4}(?:主管|头像|壁纸|风水)|开完|试了|带上|请了|信了|念了)/;',
    replacement: 'const PC_ACT_LUCK_ZH = /(?:__R87_NEVER__)/;',
    probe: `g.gate('昨天拜了财神，今天就签单了').findings.some(f=>f.dimension==='pseudo_causal')`,
    desc: '只破坏甲半词表，乙半保留 —— 验两半 AND 的甲半敏感性',
  },
  {
    name: 'B族 乙半常量（PC_RES_LUCK_ZH）',
    anchor: 'const PC_RES_LUCK_ZH = /(?:签单|谈成|中了|赢了|考[上过]|上岸|进了|涨了|赚了|见效|康复|退了|降了|好起来|顺了|成了|拿下了)/;',
    replacement: 'const PC_RES_LUCK_ZH = /(?:__R87_NEVER__)/;',
    probe: `g.gate('他戴上幸运手环后比赛就赢了').findings.some(f=>f.dimension==='pseudo_causal')`,
    desc: '只破坏乙半词表，甲半保留 —— 验两半 AND 的乙半敏感性',
  },
];

// ── 建副本（src + 主测试必需的最小集合，不拷整个 test/）──
if (fs.existsSync(COPY)) fs.rmSync(COPY, { recursive: true, force: true });
fs.mkdirSync(path.join(COPY, 'test'), { recursive: true });
fs.cpSync(path.join(HF, 'src'), path.join(COPY, 'src'), { recursive: true });
fs.copyFileSync(MAIN, path.join(COPY, 'test', path.basename(MAIN)));
for (const f of ['regex-to-text.js']) {
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
const original = fs.readFileSync(copyIdx, 'utf8');

// 先校验每条 anchor 在源码里唯一存在（不唯一 → 注入会改错地方）
for (const inj of INJECTIONS) {
  const n = original.split(inj.anchor).length - 1;
  if (n !== 1) {
    console.log(`❌ [${inj.name}] anchor 出现 ${n} 次（要求恰好 1 次），注入不安全，中止`);
    process.exit(1);
  }
  if (inj.anchor === inj.replacement) {
    console.log(`❌ [${inj.name}] replacement 与 anchor 相同，注入无效`);
    process.exit(1);
  }
}
console.log(`✅ 4 个注入点 anchor 均唯一`);

// ── 对照组：未改动的副本必须全绿 ──
const ctrl = sh('node ' + MAIN_REL, COPY);
console.log(`[对照组] 主测试退出码 ${ctrl.ok ? 0 : 1} → ${ctrl.ok ? 'PASS（对照成立）' : 'FAIL（对照不成立，中止）'}`);
if (!ctrl.ok) { console.log(ctrl.out.slice(-800)); process.exit(1); }

let trulyRed = 0, hasCoverage = 0, lost = 0;
const report = [];

console.log('\n[注入 → 主测试须变红 + 专属样本须漏判]');
for (const inj of INJECTIONS) {
  fs.writeFileSync(copyIdx, original.replace(inj.anchor, inj.replacement));
  // ① 主测试**必须变红**且失败原因是断言（不是崩溃）——崩溃≠变红
  const main = sh('node ' + MAIN_REL, COPY);
  // 崩溃特征：退出码非零但 stdout 里没有「结果: N 通过, M 失败」
  const crashed = !main.ok && !/结果:\s*\d+\s*通过,\s*\d+\s*失败/.test(main.out);
  // ② 专属样本必须漏判（per-injection 精准）
  const probe = sh(`node -e "const g=require('./src/gate.js');console.log(${inj.probe})"`, COPY);
  const stillHit = /^true$/m.test(probe.out.trim());

  if (!crashed && !main.ok && !stillHit) {
    trulyRed++;
    report.push({ inj, status: 'RED', note: '注入后主测试断言变红，专属样本漏判 → 判据确被守卫' });
  } else if (!crashed && !main.ok && stillHit) {
    hasCoverage++;
    report.push({ inj, status: 'COVERED', note: '注入后主测试变红，但专属样本仍命中 → 同族判据兜底' });
  } else if (!crashed && main.ok) {
    lost++;
    report.push({ inj, status: 'UNGUARDED', note: '注入后主测试仍全绿 → 该判据未被守卫盯着（假阴性）' });
  } else {
    lost++;
    report.push({ inj, status: 'CRASH', note: `主测试崩溃而非断言失败: ${main.out.slice(-300)}` });
  }
  fs.writeFileSync(copyIdx, original);
}

console.log('\n══ 逐条结果 ══');
for (const r of report) {
  const mark = r.status === 'RED' ? '✅' : (r.status === 'COVERED' ? '🟡' : '❌');
  console.log(`  ${mark} [${r.status}] ${r.inj.name} — ${r.inj.desc}`);
  if (r.status !== 'RED') console.log(`       ${r.note}`);
}
console.log(`\n真变红 ${trulyRed} / 有兜底 ${hasCoverage} / 失守 ${lost}（共 ${INJECTIONS.length} 条）`);

// 还原校验：注入后必须与原始完全一致
const restored = fs.readFileSync(copyIdx, 'utf8');
if (restored !== original) { console.log('❌ 副本未还原到原始状态'); lost++; }

fs.rmSync(COPY, { recursive: true, force: true });
process.exit(lost === 0 ? 0 : 1);
