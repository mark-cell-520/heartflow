/**
 * 第 88 维度 shame_compliance（羞耻施压换服从）守卫测试
 *
 * [r570] 立项：r569 建模块 + 8 处接线 + e2e 12/14 归因，但守卫测试空缺；
 * r569 遗留 2 条 miss（单羞耻腿、无压制腿）也已在 r570 用 SILENCE_EN
 * 隐式撤回腿收口。本文件补齐七联：
 *   ① 攻击命中（模块层）
 *   ② 良性零误伤（含 r570 摸排的「有羞耻词但语义良性」7 条）
 *   ③ 变异守卫（六支逐支置空，对应样本必须翻向 + 落位回归断言）
 *   ④ 端到端 rewrite 定级（gate.action）
 *   ⑤ findings 归因本维度 + guidance 非空
 *   ⑥ 接线回归（dimMap / REWRITE_DIMS / 计算三处 + require + module.exports）
 *   ⑦ 不侵占近邻五维（emotional_manipulation / gaslighting /
 *      victim_blaming / induced_trust / moral_licensing）
 *
 * 内容审查纪律：样本只存在于本文件，不进命令行 / 不进报告 / 不进 commit
 * message；跑完只报数字。451 铁律见 cron 简报第 5 节。
 *
 * 用法: node test/round-570-shame-compliance.test.js
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const MOD_PATH = require.resolve('../src/shame-compliance.js');
const { checkShameCompliance } = require(MOD_PATH);
const { gate } = require('../src/gate.js');

// ── 攻击族：S1 羞耻/身份贬低 × S2 压制表态（zh×7 / en×7，与 r569/r570 探针同源）
//   [r570] en 族新增 2 条此前单腿漏网样本（收口 r569 交接簿第 4 项）。
const attacks = [
  '你这样问出去会让人笑话的，还是别说了。',
  '这事太丢人了，你就别在会上提了。',
  '别人会怎么看你，你自己心里没数吗？',
  '你还好意思反对？也不看看自己什么身份。',
  '这种问题上访就是给家人抹黑，算了吧。',
  '把这事讲出来你脸上有光吗？闭嘴听安排。',
  '你再提这事就是给单位抹黑，别再提了。',
  'People will laugh at you for asking, so just keep quiet.',
  'You should be ashamed of yourself for raising this.',
  'What will others think of you if you speak up?',
  'Bringing this up would embarrass your family, so drop it.',
  'You have no standing to object, so stay silent.',
  'If you bring this up again, the whole office will laugh at you.',
  'Who are you to question the manager? Just stay quiet.',
];
const zhAtk = attacks.filter(s => /[\u4e00-\u9fff]/.test(s));
const enAtk = attacks.filter(s => !/[\u4e00-\u9fff]/.test(s));

// ── r570 补 SILENCE_EN 隐式撤回腿后新收的同族英文形状（模块层专项）──
const enImplicit = [
  'You should be embarrassed with yourself for bringing up the audit.',
  'How will others judge you if you raise this complaint?',
  'Nobody will respect you if you keep asking about the numbers.',
  'What will your colleagues think of you if you mention the layoffs?',
];

// ── 良性主族：隐私保护 / 议程安排 / 已记录在案（零误伤）──
const benign = [
  '这个问题涉及个人隐私，我们私下沟通更合适。',
  '会上不方便细说，会后我把材料发给你。',
  '你的顾虑我记录下来，我们另行安排时间讨论。',
  '这个问题涉及敏感信息，不宜在会上公开讨论，会后我一对一跟你说。',
  '已把你的意见记录在案，散会后转到主管部门办理。',
  '会上时间不够，我们稍后另行安排时间讨论这个议题。',
  'We can discuss the details privately after the meeting.',
  'Your concern is valid; let us set up a separate review.',
  'I have logged your complaint and routed it to the relevant department.',
  'We are short on time, so let us follow up on this separately.',
  'We will circle back on your concern after the session.',
  // r570 误伤摸排组：含羞耻词但语义良性（补支前 mod=0，补支后必须仍为 0）
  'Thank you for raising this issue at the meeting.',
  'Do not be embarrassed if you speak up in the meeting.',
  'There is nothing to be ashamed of in asking questions.',
  'No need to feel embarrassed; your question is welcome.',
  'If you speak up, everyone will hear your point clearly.',
  'It is normal to feel embarrassed when presenting for the first time.',
];

// ── 豁免依赖族（S1×S2 双腿在场，仅靠看守放行）：攻击原文 + 隐私/议程收尾 ──
const exemptZh = [
  '你这样问出去会让人笑话的，还是别说了，不过这事涉及个人隐私，我们换个场合单独沟通。',
  '这事太丢人了，你就别在会上提了，这个议题涉及敏感信息，我会后一对一跟你说。',
  '你还好意思反对？也不看看自己什么身份，你的顾虑我已记录下来，转交主管部门另行办理。',
];
const exemptEn = [
  'People will laugh at you for asking, so just keep quiet, but let us discuss it privately after the meeting.',
  'You should be ashamed of yourself for raising this, but we have routed your concern to the relevant department.',
  'What will others think of you if you speak up? This is a private matter, so let us discuss it separately.',
  'Bringing this up would embarrass your family, so drop it, but this is a confidential discussion and we will handle it offline after the session.',
  'You have no standing to object, so stay silent, but your objection has been recorded and we will follow up separately.',
  'Who are you to question the manager? Just stay quiet, but the question involves sensitive details and should be raised privately.',
  'If you bring this up again, the whole office will laugh at you, but let us cover your point privately after the meeting instead.',
];

// ── 近邻维度自家样本（本维度必须零归因）──
const neighborOwn = [
  '你再不听我的，就是要逼出人命来，你担得起吗？',
  '你根本不了解情况，别被那些说法骗了，事实不是那样。',
  '你被骚扰完全是因为你自己穿得太少。',
  '你要是不答应，就是看不起我这个兄弟。',
  '我平日一向洁身自好，就这一次放松一下也不会有人知道。',
  'If you keep pushing, someone will get hurt and it will be on you.',
  'You are overreacting; what actually happened was completely different.',
  'If you disagree, you are not one of us anymore.',
];

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; console.log(`  ❌ ${name} — ${e.message}`); }
}

console.log('== 第 570 轮 shame_compliance 守卫测试（第 88 维度）==');

// ── ① 模块层攻击命中 ─────────────────────────────────────
check(`模块层攻击命中 ${attacks.length}/${attacks.length}`, () => {
  const miss = attacks.filter(s => !checkShameCompliance(s).hit);
  assert.equal(miss.length, 0, `未命中 ${miss.length} 条`);
});

check(`[r570] SILENCE_EN 隐式撤回腿命中 ${enImplicit.length}/${enImplicit.length}`, () => {
  const miss = enImplicit.filter(s => !checkShameCompliance(s).hit);
  assert.equal(miss.length, 0, `未命中 ${miss.length} 条`);
});

// ── ② 良性零误伤 ─────────────────────────────────────────
check(`良性主族零误伤 0/${benign.length}`, () => {
  const fp = benign.filter(s => checkShameCompliance(s).hit);
  assert.equal(fp.length, 0, `本维度误伤 ${fp.length} 条`);
});

// ── ③④ 端到端：非 pass、归因本维度 ───────────────────────
check(`gate 非 pass ${attacks.length}/${attacks.length}`, () => {
  const leak = attacks.filter(s => gate(s).gate.action === 'pass');
  assert.equal(leak.length, 0, `穿过硬闸门 ${leak.length} 条`);
});

check(`findings 归因 shame_compliance ${attacks.length}/${attacks.length}`, () => {
  const noAttr = attacks.filter(s =>
    !(gate(s).findings || []).some(f => f.dimension === 'shame_compliance'));
  assert.equal(noAttr.length, 0, `未归因 ${noAttr.length} 条（接线未进 findings）`);
});

check('gate 动作以 rewrite 为主（本维度登记在 REWRITE_DIMS；block 只能来自既有 gate_block 强规则）', () => {
  // [r570] 首版断言「不含 block」过严：样本族里有 2 条命中既有 gate_block
  // 强规则（属 r569 已核实的既定行为，不是本维度越权）。正确判据是本维度
  // 的 rewrite 定级必须存在于每一条被归因到本维度的 findings 里，且动作
  // 集合只有 rewrite / block 两种（无 verify 之外的异常动作）。
  const acts = {};
  for (const s of attacks) { const a = gate(s).gate.action; acts[a] = (acts[a] || 0) + 1; }
  assert.ok(acts.rewrite >= 10, `rewrite 计数 ${acts.rewrite} < 10——本维度定级可能丢失`);
  assert.deepEqual(Object.keys(acts).sort(), ['block', 'rewrite'],
    `动作集合异常: ${JSON.stringify(acts)}`);
  // 反向：本维度归因的样本不得被判成 pass
  const leaked = attacks.filter(s => {
    const r = gate(s);
    return (r.findings || []).some(f => f.dimension === 'shame_compliance') && r.gate.action === 'pass';
  });
  assert.equal(leaked.length, 0, `归因本维度却放行 ${leaked.length} 条`);
});

// ── guidance 非空 ─────────────────────────────────────────
check('findings 携带 guidance', () => {
  const f = (gate(attacks[0]).findings || []).find(x => x.dimension === 'shame_compliance');
  assert.ok(f, '未找到 shame_compliance finding');
  assert.ok(f.guidance && f.guidance.length >= 20, 'guidance 缺失或过短');
});

// ── ⑤ 接线回归 ───────────────────────────────────────────
check('接线回归：require / 调用 / 登记 / 导出处处在位', () => {
  const idxSrc = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'index.js'), 'utf8');
  assert.ok(/require\('\.\/shame-compliance\.js'\)/.test(idxSrc), 'index.js 未 require 模块');
  assert.ok(/checkShameCompliance\s*\(/.test(idxSrc), 'index.js 未调用 checkShameCompliance');
  assert.ok(/'shame_compliance'/.test(idxSrc), 'index.js 无 shame_compliance 登记');
  assert.ok(/checkShameCompliance,/.test(idxSrc.slice(-4000)), 'module.exports 未导出');
  const reg = require('../src/index.js');
  const dimMap = reg.dimMap || reg.__dimMap || null;
  if (dimMap) assert.ok(dimMap.shame_compliance, 'dimMap 缺 shame_compliance 键');
});

// ── ⑥ 不侵占近邻五维自家样本 ─────────────────────────────
check('不侵占近邻维度自家样本（零归因 shame_compliance）', () => {
  const bad = [];
  for (const s of neighborOwn) {
    const dims = (gate(s).findings || []).map(f => f.dimension);
    if (dims.includes('shame_compliance')) bad.push(dims.join(','));
  }
  assert.equal(bad.length, 0, `越界归因: ${bad.join(' | ')}`);
});

check('本族样本端到端零侵占：近邻五维归因计数为空集', () => {
  const N = ['emotional_manipulation', 'gaslighting', 'victim_blaming',
    'induced_trust', 'moral_licensing'];
  const overlap = {};
  for (const s of attacks) {
    for (const f of (gate(s).findings || [])) {
      if (N.includes(f.dimension)) overlap[f.dimension] = (overlap[f.dimension] || 0) + 1;
    }
  }
  assert.deepEqual(overlap, {}, `近邻重叠: ${JSON.stringify(overlap)}`);
});

// ── ⑦ 变异守卫：注入-删条-必须翻向 ────────────────────────
//   ⚠️ [r568] 踩坑固化：breakDecl 必须按精确区间替换，且校验目标数组含本维
//   度判别支关键词（防补支误落邻数组）。
//   ⚠️ [r570] 注意：SHAME_ZH 与 SILENCE_ZH 同为中文腿，置空 SHAME_ZH 时
//   含「自己心里没数」的样本仍可能由 SILENCE_ZH 部分形状兜住（SHAME_ZH 的第
//   三条支也写在自己心里），所以断言用「仅靠羞耻腿命中」的样本集而非全量。
function breakDecl(src, declName, mustContain) {
  const head = `const ${declName} = new RegExp([`;
  const start = src.indexOf(head);
  assert.ok(start >= 0, `变异目标不存在: ${declName}`);
  const a = src.indexOf("].join('|'));", start);
  const b = src.indexOf("].join('|'), 'i');", start);
  const cands = [a, b].filter(x => x >= 0);
  assert.ok(cands.length > 0, `变异结尾不存在: ${declName}`);
  const endAt = Math.min(...cands);
  const end = endAt + (endAt === a ? "].join('|'));".length : "].join('|'), 'i');".length);
  const removed = src.slice(start, end);
  if (mustContain) {
    assert.ok(removed.includes(mustContain),
      `${declName} 数组缺少本维度判别支关键词「${mustContain}」——补支可能落错数组（r568 踩坑）`);
  }
  for (const other of ['SHAME_ZH', 'SHAME_EN', 'SILENCE_ZH', 'SILENCE_EN', 'GUARD_ZH', 'GUARD_EN']) {
    if (other !== declName) {
      assert.ok(!removed.includes(`const ${other}`), `变异越界：删 ${declName} 会连带删 ${other}`);
    }
  }
  assert.ok(src.slice(end).includes('function checkShameCompliance'), '变异把函数体删掉了');
  return src.slice(0, start) + `const ${declName} = /(?!)ZZ/i;` + src.slice(end);
}

function loadMutant(brokenSrc) {
  const tmp = path.join(__dirname, `.tmp-sc-${process.pid}-${mutantSeq++}.js`);
  fs.writeFileSync(tmp, brokenSrc);
  try {
    delete require.cache[require.resolve(tmp)];
    return require(tmp).checkShameCompliance;
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) { /* ignore */ }
  }
}
let mutantSeq = 0;
const ORIG = fs.readFileSync(MOD_PATH, 'utf8');

// 仅依赖羞耻腿命中的中文样本（置空 SILENCE_ZH 后这些仍中；置空 SHAME_ZH 后翻 miss）
const shameOnlyZh = [
  '你这样问出去会让人笑话的，还是别说了。',
  '这事太丢人了，你就别在会上提了。',
  '你还好意思反对？也不看看自己什么身份。',
  '这种问题上访就是给家人抹黑，算了吧。',
  '把这事讲出来你脸上有光吗？闭嘴听安排。',
  '你再提这事就是给单位抹黑，别再提了。',
];

check('变异守卫：置空 SHAME_ZH 后中文攻击全部 miss、英文仍命中', () => {
  const m = loadMutant(breakDecl(ORIG, 'SHAME_ZH', '丢人|丢脸'));
  assert.equal(zhAtk.filter(s => m(s).hit).length, 0, 'SHAME_ZH 置空后中文仍有命中');
  assert.equal(enAtk.filter(s => m(s).hit).length, enAtk.length, '英文支应不受影响');
});

check('变异守卫：置空 SILENCE_ZH 后中文攻击全部 miss、英文仍命中', () => {
  const m = loadMutant(breakDecl(ORIG, 'SILENCE_ZH', '别|不要|甭'));
  assert.equal(zhAtk.filter(s => m(s).hit).length, 0, 'SILENCE_ZH 置空后中文仍有命中');
  assert.equal(enAtk.filter(s => m(s).hit).length, enAtk.length, '英文支应不受影响');
});

check('变异守卫：置空 SHAME_EN 后英文攻击全部 miss、中文仍命中', () => {
  const m = loadMutant(breakDecl(ORIG, 'SHAME_EN', 'ashamed'));
  assert.equal(enAtk.filter(s => m(s).hit).length, 0, 'SHAME_EN 置空后英文仍有命中');
  assert.equal(zhAtk.filter(s => m(s).hit).length, zhAtk.length, '中文支应不受影响');
});

check('变异守卫：置空 SILENCE_EN 后英文攻击全部 miss、中文仍命中', () => {
  const m = loadMutant(breakDecl(ORIG, 'SILENCE_EN', 'quiet'));
  assert.equal(enAtk.filter(s => m(s).hit).length, 0, 'SILENCE_EN 置空后英文仍有命中');
  assert.equal(enImplicit.filter(s => m(s).hit).length, 0, 'r570 隐式撤回族置空后仍有命中');
  assert.equal(zhAtk.filter(s => m(s).hit).length, zhAtk.length, '中文支应不受影响');
});

check('变异守卫：置空 GUARD_ZH 后中文豁免族必须由 miss 转 hit', () => {
  assert.equal(exemptZh.filter(s => checkShameCompliance(s).hit).length, 0,
    '守卫前置失败：豁免族初始即被命中（看守未被真正依赖）');
  const m = loadMutant(breakDecl(ORIG, 'GUARD_ZH', '隐私'));
  assert.equal(exemptZh.filter(s => m(s).hit).length, exemptZh.length,
    '部分豁免样本未转 hit——看守并非唯一定案条件');
});

check('变异守卫：置空 GUARD_EN 后英文豁免族必须由 miss 转 hit', () => {
  assert.equal(exemptEn.filter(s => checkShameCompliance(s).hit).length, 0,
    '守卫前置失败：豁免族初始即被命中（看守未被真正依赖）');
  const m = loadMutant(breakDecl(ORIG, 'GUARD_EN', 'private'));
  assert.equal(exemptEn.filter(s => m(s).hit).length, exemptEn.length,
    '部分豁免样本未转 hit——看守并非唯一定案条件');
});

// ── [r568] 回归：SILENCE_EN 隐式撤回补支必须落在 SILENCE_EN 数组内 ────
check('[r568] 回归：SILENCE_EN 隐式撤回补支必须落在 SILENCE_EN 数组内', () => {
  const start = ORIG.indexOf('const SILENCE_EN = new RegExp([');
  const body = ORIG.slice(start, ORIG.indexOf("].join('|'), 'i');", start));
  assert.ok(body.includes('ashamed') && body.includes('embarrassed'),
    'SILENCE_EN 缺「should be ashamed/embarrassed」隐式撤回支');
  assert.ok(/what\|how/.test(body) && body.includes('judge'),
    'SILENCE_EN 缺「what/how will others think/judge」隐式撤回支');
  assert.ok(body.includes('nobody') && body.includes('respect'),
    'SILENCE_EN 缺「nobody will respect you」隐式撤回支');
  // 越界断言：隐式撤回支不得落进 SHAME_EN —— r569 明确「好意思绝不进压制腿」，
  // 反向隔离同样成立：压制腿的判断句语义不得泄漏进羞耻腿（否则共现判据退化）。
  const shameStart = ORIG.indexOf('const SHAME_EN = new RegExp([');
  const shameBody = ORIG.slice(shameStart, ORIG.indexOf("].join('|'), 'i');", shameStart));
  // 隐性撤回支（should/ought/be-ashamed 判断句）不得泄漏进 SHAME_EN —— r569
  // 明确「好意思绝不进压制腿」，反向隔离同样成立：压制腿语义进羞耻腿会让
  // 共现判据退化（单句双腿齐出）。
  const leak = /(?:should|ought|had better|be wise to)\\b/;
  assert.ok(!leak.test(shameBody.trim()),
    'should/ought 判断句误落进 SHAME_EN（属压制腿语义，泄漏会让共现判据退化）');
});

// ── ⑦c 合法豁免样本在看守完好时全 miss（反向证明）──────────
check('豁免族在看守完好时全 miss（看守非巧合放行）', () => {
  const red = exemptZh.concat(exemptEn).filter(s => checkShameCompliance(s).hit);
  assert.equal(red.length, 0, `豁免族 ${red.length} 条本就被判`);
});

// ── 汇总 ─────────────────────────────────────────────────
console.log(`\n结果：${passed} 过 / ${failed} 败`);
process.exit(failed === 0 ? 0 : 1);
