// 第200轮守卫：ai_writing_tell 的正当中英对照句误伤修复
// 缺口实测（probe-r200-awt.js / probe-r200-gate.js）：
//   12 条多语正当文本里 1 条 gate.action=verify（其余 11 条 pass），
//   score 0.46、familiesHit=2，三票为 anchor-mix(18) +
//   double-connective(18) + transitions(10)。
// 根因（第 6 次同型「同一词表当两个独立证据」）：
//   ZH_EN_CONNECTIVE_PAIRS 英侧含 moreover/furthermore/additionally/
//   in conclusion/in summary，与 TRANSITIONS 词表逐字相同。同一批英文
//   连接词被 zh-en-mixing(double-connective 支) 与 transitions 族各记
//   一票，撑起共现门槛。
// 修法：连接词对在场时，transitions 那一票折进 zh-en-mixing。
//
// 纪律（451 防护）：样本句只以形状编号出现在输出里，不贴原文。
// 测试文件本身 isolate 在 test/ 下。
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const SRC = path.join(__dirname, '..', 'src', 'shield', 'ai-writing-tell.js');
const { detect } = require(SRC);
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ── 池：多语正当文本（取自 r141 正式测试，中英对照句在最末）──────
const ml = fs.readFileSync(path.join(__dirname, 'ai-writing-tell-multilang-r141.test.js'), 'utf8');
const MULTILANG_BENIGN = eval('(' + ml.match(/const MULTILANG_BENIGN = (\[[\s\S]*?\]);/)[1] + ')');
const AI_MIX = eval('(' + ml.match(/const AI_MIX = (\[[\s\S]*?\]);/)[1] + ')');

// ── 池：第 50 轮三类攻击（anchor-mix / double-connective / tier-phrase）──
const r50 = fs.readFileSync(path.join(__dirname, 'ai-writing-tell-zh-en-mixing-round50.test.js'), 'utf8');
const ATTACK_ANCHOR_MIX = eval('(' + r50.match(/const ATTACK_ANCHOR_MIX = (\[[\s\S]*?\]);/)[1] + ')');
const ATTACK_DOUBLE_CONNECTIVE = eval('(' + r50.match(/const ATTACK_DOUBLE_CONNECTIVE = (\[[\s\S]*?\]);/)[1] + ')');
const ATTACK_TIER_PHRASE = eval('(' + r50.match(/const ATTACK_TIER_PHRASE = (\[[\s\S]*?\]);/)[1] + ')');

// 原误伤样本：r141 测试登记的 DELIBERATE_SKIP 边界形状
//（中文锚 + 连接词对 x2）。修复前 score 0.46 / familiesHit=2 /
// gate verify（probe-r200-gate.js 实测，12 条多语正当文本中唯一 non-pass）。
const FIX_TARGET = eval('(' + ml.match(/const DELIBERATE_SKIP = (\[[\s\S]*?\]);/)[1] + ')')[0];

console.log('\n[修复目标：多语正当文本 + 登记的边界样本必须全部 gate pass]');
t('12 条多语正当 detect score 全为 0', () => {
  const bad = MULTILANG_BENIGN.map((s, i) => [i, detect(s)]).filter(([, r]) => r.score > 0);
  assert.strictEqual(bad.length, 0, `误伤编号=${JSON.stringify(bad.map(b => b[0]))}`);
});
t('12 条多语正当 gate.action 全为 pass', () => {
  const bad = MULTILANG_BENIGN.map((s, i) => [i, gate.checkOutput(s).gate.action])
    .filter(([, a]) => a !== 'pass');
  assert.strictEqual(bad.length, 0, `非 pass 编号=${JSON.stringify(bad)}`);
});
// 原误伤样本（r141 登记的 DELIBERATE_SKIP 边界）：修复前 score 0.46 /
// familiesHit=2 / gate verify（probe-r200-gate.js 实测，12 条中唯一 non-pass）
t('登记的边界样本 familiesHit 归 1 且 score 归 0', () => {
  const r = detect(FIX_TARGET);
  assert.strictEqual(r.familiesHit, 1, `familiesHit=${r.familiesHit}`);
  assert.strictEqual(r.score, 0, `score=${r.score}`);
});

console.log('\n[反向：第 50 轮攻击池不得被本轮折叠削弱]');
t('6 条 anchor-mix 攻击仍命中 zh-en-mixing', () => {
  const miss = ATTACK_ANCHOR_MIX.filter(s => !(detect(s).findings || []).some(f => f.dimension === 'ai-tell-zh-en-mixing'));
  assert.strictEqual(miss.length, 0, `漏检 ${miss.length}/6`);
});
t('5 条 double-connective 攻击仍命中 zh-en-mixing', () => {
  const miss = ATTACK_DOUBLE_CONNECTIVE.filter(s => !(detect(s).findings || []).some(f => f.dimension === 'ai-tell-zh-en-mixing'));
  assert.strictEqual(miss.length, 0, `漏检 ${miss.length}/5`);
});
t('10 条 tier-phrase 攻击仍命中 zh-en-mixing', () => {
  const miss = ATTACK_TIER_PHRASE.filter(s => !(detect(s).findings || []).some(f => f.dimension === 'ai-tell-zh-en-mixing'));
  assert.strictEqual(miss.length, 0, `漏检 ${miss.length}/10`);
});

console.log('\n[反向：真 AI 混排池漏检数不超第 141 轮基线 4/10]');
t('真 AI 混排漏检 <= 4', () => {
  const miss = AI_MIX.filter(s => detect(s).score === 0).length;
  assert.ok(miss <= 4, `漏检 ${miss}/10 超过基线`);
});

console.log('\n[形状对照：连接词对缺席时 anchor-mix 单支仍不撑共现]');
// 与修复样本同形但只含 1 个英文词（anchor-mix 的 enAfter<2 条件不成立）
t('锚 + 1 个英文词 → score 0（锚单支不撑共现，未松动）', () => {
  const s = '总之，overall 这个方案可以上线。';
  assert.strictEqual(detect(s).score, 0, `score=${detect(s).score}`);
});
t('锚 + ≥2 英文词但无连接词对 → score 0（connective 折叠未波及）', () => {
  const s = '总之，overall 这个方案涉及 retry 与 timeout 两类失败，此外要补监控。';
  const r = detect(s);
  assert.strictEqual(r.score, 0, `score=${r.score}`);
});

console.log('\n[注入-删条-必须变红：移除本轮折叠后误伤必须回来]');
const original = fs.readFileSync(SRC, 'utf8');
// 折叠逻辑在 transitions 分支里，锚点 = hasConnectivePair 的折叠行
const FOLD = "        if (fam === 'transitions' && hasConnectivePair) return 'zh-en-mixing';";
// 修复目标样本是 r141 测试登记的 DELIBERATE_SKIP 边界形状
// （中文锚 + 连接词对 x2），不是 MULTILANG_BENIGN 末条——后者只有连接词对
// 而没有 anchor-mix 的英文词，折叠前后都是 fams=1（probe-r200-del.js 实测）。
t('删条锚点存在于源码', () => {
  assert.ok(original.includes(FOLD), '找不到折叠行锚点');
});
t('移除折叠后修复样本必须回到误伤（score>0 / gate verify）', () => {
  const mutated = original.replace(FOLD, "        if (false && hasConnectivePair) return 'zh-en-mixing';");
  assert.notStrictEqual(mutated, original, '替换未生效');
  fs.writeFileSync(SRC, mutated, 'utf8');
  try {
    // 子进程：同进程 require.cache 清不干净（第 140 轮教训）
    const cp = require('child_process');
    const os = require('os');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-awt200-'));
    const probe = path.join(dir, '_probe.js');
    fs.writeFileSync(probe, [
      'const { detect } = require(' + JSON.stringify(SRC) + ');',
      'const S = ' + JSON.stringify([FIX_TARGET]) + ';',
      'let fp = 0;',
      'S.forEach((s) => { if (detect(s).score > 0) fp++; });',
      'console.log("fp=" + fp);',
    ].join('\n'));
    let out = '';
    try { out = cp.execSync(process.execPath + ' ' + JSON.stringify(probe), { encoding: 'utf8' }); }
    finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
    const fpAfter = parseInt((out.match(/fp=(\d+)/) || [])[1], 10);
    assert.strictEqual(fpAfter, 1, `移除折叠后应有 1 条回到误伤，实得 ${fpAfter}`);
  } finally {
    fs.writeFileSync(SRC, original, 'utf8');
  }
});
t('还原后源码逐字节一致', () => {
  assert.strictEqual(fs.readFileSync(SRC, 'utf8'), original, '源码未完整还原');
});

console.log('\n[跨维度：修复样本 gate 不再 verify]');
t('修复样本 gate.action === pass', () => {
  const s = MULTILANG_BENIGN[MULTILANG_BENIGN.length - 1];
  assert.strictEqual(gate.checkOutput(s).gate.action, 'pass');
});

console.log(`\n第200轮守卫: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail > 0 ? 1 : 0);
