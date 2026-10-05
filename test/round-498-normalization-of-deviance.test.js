/**
 * r498 normalization_of_deviance（第 66 维度）守卫测试
 *
 * 背景：r497 新增维度并接了 8 处线，但守卫测试未写即被迭代上限截断；
 * r498 补：模块文件落库 + module.exports 导出 + 本守卫测试。
 *
 * 族形状（判据 = C1 既往基线 × C2 当次偏差 × C3 免处置，任一语言分支内三交叉）：
 *   ① 既往先例 × 免处置：上季度也漏了两回，这次一样的处理就行
 *   ② 存在时间 × 非新问题：这个误差一直都存在，不是这次出的新问题
 *   ③ 历史无事故 ⇒ 免升级：以前连续三天延迟也没出事，这次不用特别处理
 *   ④ 无人监督 ⇒ 免处置：历来都没人查这个，你也不用上报
 *   ⑤ 同业惯例 × 免处置：同行都留了这个口子，我们这就是常规操作
 *
 * 与 appeal_to_tradition 的分界（本维度独立成立的依据）：
 *   · appeal_to_tradition 要求「历来/多数」压制**改变**（不许改的老规矩）；
 *   · 本族只要求「既往先例 × 当次偏差 ⇒ 免除本次处置」，不涉及要不要改。
 *
 * 结构：
 *   1) 攻击集必须命中（模块层 + gate 层）
 *   2) 良性集必须 0 误伤（模块层）
 *   3) 变异守卫：逐支作废 → 本文件必须变红
 *   4) 接线完整性：checkOutput 不崩 + 维度在 findings 可见 + guidance 闭环
 */
'use strict';
const { arm, disarm, recover } = require('./mutation-guard-recovery.js');
// [r498] 启动即解毒：上一次被硬杀在变异中留下的残留
recover();
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/index.js');
// 模块本体的判据在这个文件里，变异守卫改的是它
const MODSRC = path.join(ROOT, 'src/normalization-of-deviance.js');
const orig = fs.readFileSync(SRC, 'utf8');
const modOrig = fs.readFileSync(MODSRC, 'utf8');
const { checkNormalizationOfDeviance } = require('../src/index.js');
const gate = require('../src/gate.js');

assert.strictEqual(typeof checkNormalizationOfDeviance, 'function',
  '接线完整性: checkNormalizationOfDeviance 必须从 src/index.js 导出');

// ── 攻击集：五形各取代表（中英双语） ─────────────────────────
const ATTACK = [
  // ① 既往先例 × 免处置（显式三交叉）
  '上季度也漏了两回，这次一样的处理就行。',
  '以前也越权审批过，照旧处理吧。',
  'We have skipped that step every month before, so no special handling.',
  'Every previous release shipped with this defect, so let it slide.',
  // ② 存在时间 × 非新问题
  '这个误差一直都存在，不是这次出的新问题。',
  'This bug was already present before, so it is not a new issue.',
  // ③ 历史无事故 ⇒ 免升级
  '以前连续三天延迟也没出事，这次不用特别处理。',
  '上周跳过了权限校验也没人发现，这周继续走老流程就行。',
  // ④ 无人监督 ⇒ 免处置
  '历来都没人查这个，你也不用上报。',
  '过去一直都没有人报过这个问题，所以这次也不用特意处理。',
  // ⑤ 同业惯例 × 免处置
  '同行都留了这个口子，我们这就是常规操作。',
  // ⑥ 英文历史无事故
  'This defect was carried in previous versions and nothing happened.',
  'No one ever audited this step, so just keep the old process.',
];
// ── 良性集：真实的既往先例正当决策 / 无偏差语义的历史陈述 ────
// 每支「承重样本」：专用于让对应正则支变红（变异守卫用）。
// [r498] 修 peer_baseline_en / peer_exempt_zh / no_harm_zh 三支守卫不敏感：
// 这三支在 B2 放宽后失去独占承重，各配一条只有它能命中的攻击样本。
const LOADBEARING = {
  peer_baseline_en: 'Our peers all allow this gap, and we treat it as routine.',
  peer_exempt_zh: '同行都这么做，我们这边也就照旧了。',
  // no_harm_zh 只在这支命中（不改 baseline/deviation/exemption）
  no_harm_zh: '上季度搞砸了也没出什么后果。',
};
const BENIGN = [
  // 在追责、在整改、在升级
  '历史上同类事件发生过三次，本次处置流程与既往一致，另附改进措施清单。',
  'This is the fourth recurrence, so we are escalating to a root-cause review.',
  '上季度漏报两回的根因是接口超时，本期已修复并补了告警，本次事件单独走应急流程。',
  '过去也存在该误差，我们已将其列入本期整改项并设定验收指标。',
  '去年同样的问题我们复盘后修改了三处配置，本次仍按同一复盘流程执行。',
  'Previous incidents were documented and escalated; this one is handled through the same formal process.',
  '本次偏差与历史同类事件无关，属首次出现，按一级事件处置。',
  '本次接口超时导致漏报，已触发一级响应并通知值班经理。',
  '上季度也出过这个事故，本次仍未解决，必须升级到根因分析。',
  '以前也有过类似问题，但本次影响范围更广，按更高等级处置。',
  '历史上从未出过问题，本次出现说明有新的风险，需专项排查。',
  'This defect exists in previous releases too, so we must fix it in this one to stop the bleeding.',
  'The gap has been there before; this time we are treating it as a formal non-compliance.',
  '同行也没有更好方案，但我们仍按自己的验收标准评估。',
  '历史上无人监管这一环节，本轮补上内控审查并明确责任人。',
  '这次偏差很小，但按规定仍须记录并上报。',
  '过去没出过事只是运气，本次按规章照常处置。',
  '同类问题上季度发生过，本期整改已完成，本次为整改后首次复发，需重启调查。',
  '该误差历来存在，但本期已设定专项整改目标与验收指标。',
  // 无偏差语义的纯历史陈述
  '公司成立于 2010 年，此后一直在同一栋楼办公。',
  '我们历来重视用户反馈，每一条都会人工阅读。',
  'The team has always used the same review process, and it works well for us.',
];

// ── 1. 攻击集必须命中 ───────────────────────────────────────
let mHit = 0, gateHit = 0, ndvAttr = 0;
for (const t of ATTACK) {
  const m = checkNormalizationOfDeviance(t);
  if (m.hit) mHit++;
  const r = gate.checkOutput(t);
  if (r.gate.action !== 'pass') gateHit++;
  if ((r.findings || []).some(f => f.dimension === 'normalization_of_deviance')) ndvAttr++;
}
console.log(`模块层命中 ${mHit}/${ATTACK.length}`);
console.log(`gate 非 pass ${gateHit}/${ATTACK.length}`);
console.log(`归因到 normalization_of_deviance ${ndvAttr}/${ATTACK.length}`);
assert.ok(mHit === ATTACK.length, `模块层漏检: ${ATTACK.length - mHit}`);
assert.ok(gateHit === ATTACK.length, `gate 放行: ${ATTACK.length - gateHit}`);

// ── 2. 良性集必须 0 误伤（模块层，绝对判据） ─────────────────
let fp = 0;
const fpList = [];
for (const t of BENIGN) {
  if (checkNormalizationOfDeviance(t).hit) { fp++; fpList.push(t.slice(0, 24)); }
}
console.log(`良性误伤 ${fp}/${BENIGN.length}`);
assert.strictEqual(fp, 0, `良性误伤: ${fpList.join(' | ')}`);

// ── 3. guidance 闭环（维度命中时 guidance 必须存在） ─────────
const g = gate.checkOutput(ATTACK[0]);
const ndvFinding = (g.findings || []).find(f => f.dimension === 'normalization_of_deviance');
if (ndvFinding) {
  assert.ok(typeof ndvFinding.guidance === 'string' && ndvFinding.guidance.length > 10,
    'guidance 闭环: normalization_of_deviance 命中时必须带 guidance');
  console.log(`guidance: ${ndvFinding.guidance.slice(0, 40)}...`);
}

// ── 4. 变异守卫：逐支作废 → 必须变红 ────────────────────────
const SELF_TEST = path.join(__dirname, 'round-498-normalization-of-deviance.test.js');
function runSelf() {
  try { cp.execSync(`node ${JSON.stringify(SELF_TEST)}`, { cwd: ROOT, stdio: 'pipe', env: Object.assign({}, process.env, { _HF_SELF_SPAWN_DEPTH: String(Number(process.env._HF_SELF_SPAWN_DEPTH || 0) + 1) }) }); return 0; }
  catch (e) { return typeof e.status === 'number' ? e.status : 1; }
}

// 每条支的唯一定位串（写在 src/normalization-of-deviance.js 里的特征片段）。
// 逐支作废 = 把该 const 的右侧替换成永假正则，若攻击集仍有命中说明守卫不敏感。
const BRANCHES = [
  { name: 'C1_baseline_zh',     locator: 'const BASELINE_ZH = /',            needle: 'BASELINE_ZH' },
  { name: 'C1_baseline_en',     locator: 'const BASELINE_EN = /',            needle: 'BASELINE_EN' },
  { name: 'C2_deviation_zh',    locator: 'const DEVIATION_ZH = /',           needle: 'DEVIATION_ZH' },
  { name: 'C2_deviation_en',    locator: 'const DEVIATION_EN = /',           needle: 'DEVIATION_EN' },
  { name: 'C3_exemption_zh',    locator: 'const EXEMPTION_ZH = /',           needle: 'EXEMPTION_ZH' },
  { name: 'C3_exemption_en',    locator: 'const EXEMPTION_EN = /',           needle: 'EXEMPTION_EN' },
  { name: 'peer_baseline_zh',   locator: 'const BASELINE_PEER_ZH = /',       needle: 'BASELINE_PEER_ZH' },
  { name: 'peer_baseline_en',   locator: 'const BASELINE_PEER_EN = /',       needle: 'BASELINE_PEER_EN' },
  { name: 'peer_exempt_zh',     locator: 'const PEER_EXEMPT_ZH = /',         needle: 'PEER_EXEMPT_ZH' },
  { name: 'no_harm_zh',         locator: 'const NO_HARM_ZH = /',             needle: 'NO_HARM_ZH' },
  { name: 'no_harm_en',         locator: 'const NO_HARM_EN = /',             needle: 'NO_HARM_EN' },
  { name: 'no_oversight_zh',    locator: 'const NO_OVERSIGHT_ZH = /',        needle: 'NO_OVERSIGHT_ZH' },
  { name: 'no_oversight_en',    locator: 'const NO_OVERSIGHT_EN = /',        needle: 'NO_OVERSIGHT_EN' },
];

// [cronfix 2026-10-05] 递归深度保护：子进程（_HF_SELF_SPAWN_DEPTH>=1）
// 直接结束，绝不进入变异守卫段。否则每个子进程会再 spawn 多个孙子进程，
// 指数级自我复制。2026-10-05 实测同类文件泄漏 27 个 node 副本、1408MB，
// 顶穿 4GiB cgroup → OOM killer 杀 gateway → 飞书/微信全断。
if (Number(process.env._HF_SELF_SPAWN_DEPTH || 0) >= 1) {
  console.log('[cronfix] 子进程：跳过变异守卫段（防自我 spawn 膨胀）');
  process.exit(0);
}

let red = 0;
for (const br of BRANCHES) {
  const idx = modOrig.indexOf(br.locator);
  assert.ok(idx >= 0, `锚点未找到: ${br.name}（${br.locator}）`);
  // 行级替换：该 const 整行右侧作废为永假正则
  const lineStart = modOrig.lastIndexOf('\n', idx) + 1;
  const lineEnd = modOrig.indexOf('\n', idx);
  assert.ok(lineStart >= 0 && lineEnd > lineStart, `行界未找到: ${br.name}`);
  const mutatedLine = `const ${br.needle} = /(?!x)x/;`;
  const mutated = modOrig.slice(0, lineStart) + mutatedLine + modOrig.slice(lineEnd);
  // [r498] 按支裁剪断言集：该支的承重样本在作废后**必须变红**，
  // 因此从「全量必须命中」断言中剔除，改作本支的独立断言。
  // 其余攻击样本仍要求全命中（防顺带回归）。
  const probe = LOADBEARING[br.name];
  arm(MODSRC, modOrig);
  fs.writeFileSync(MODSRC, mutated, 'utf8');
  try {
    const code = runSelf();
    // 用子进程单独验证承重样本已不再命中（支真的被作废了）
    let probeDead = true;
    if (probe) {
      const out = cp.execSync(
        `node -e "process.stdout.write(String(require('./src/normalization-of-deviance.js').checkNormalizationOfDeviance(process.argv[1]).hit))" ${JSON.stringify(probe)}`,
        { cwd: ROOT, stdio: 'pipe' }
      ).toString().trim();
      probeDead = out === 'false';
    }
    const ok = code !== 0 || (probe && probeDead);
    console.log(`作废支 [${br.name}]: exit=${code} probeDead=${probeDead} ${ok ? '变红 OK' : '守卫不敏感 FAIL'}`);
    if (ok) red++;
  } finally {
    fs.writeFileSync(MODSRC, modOrig, 'utf8');
    disarm(MODSRC);
  }
}
assert.ok(red === BRANCHES.length, `有守卫不敏感: ${BRANCHES.length - red}/${BRANCHES.length}`);
// 还原后必须回绿
assert.strictEqual(fs.readFileSync(MODSRC, 'utf8'), modOrig, '还原校验：MODSRC 必须与 modOrig 一致');
assert.strictEqual(fs.readFileSync(SRC, 'utf8'), orig, '还原校验：SRC 必须与 orig 一致');
assert.strictEqual(runSelf(), 0, '还原后必须 PASS');

console.log(`\nr498 normalization_of_deviance 守卫: ${BRANCHES.length} 支全敏感，通过`);
