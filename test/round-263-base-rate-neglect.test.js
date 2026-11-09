'use strict';
/**
 * test/round-263-base-rate-neglect.test.js
 * [r263] base_rate_neglect（第 169 维度）阳性信号腿与高置信结论腿的
 * 全新措辞家族扩展（真升级②，live 生效，维度计数 229 不变，
 * src/index.js 零改动）。
 *
 * r263 池化探针实测（coordination/agent4/probes/r263-probe-pool.js，
 * v6.8.153）：本维 13 条新措辞攻击 11 条完全穿透（gate.action=pass 且
 * 零维度承重），补丁后 12/13 模块命中、12/13 gate 层本维承重、
 * 0 条全放行、良性 0 误伤；四门禁零漂移（52/52 + 302/326）。
 *
 * 新增腿① SIGNAL 家族：
 *   打标签形（打上/打了/贴上…标签）、上名单形（上了黑名单/拉进风险
 *   名单）、抗原行话（两道杠/一深一浅）、通知形（提示你涉嫌/命中）、
 *   标成/圈定形；EN lit up / tripped the alarm / set off / pinged；
 *   既有 EN profile 腿扩领属词（matched your profile，原只收 the）。
 * 新增腿② CONFIDENT 家族：
 *   大概率/大几率（不含「可能」子串，旧 (?:很|极|颇)?可能 路由整族漏）、
 *   十有八九、八九不离十、锁定形（基本可以锁定嫌疑人，归属词不含
 *   「目标/客户」等营销中性词）；EN in all likelihood / (the) odds
 *   are / (the) chances are / means you are a scammer。
 * 豁免扩展：建议复测族（建议复测/请复查/就医）——旧豁免只收「需要/
 *   要/得」领头动词，不补则新信号族（两道杠×大概率弱阳）误伤医嘱句。
 *
 * 覆盖：新攻击矩阵 + 新良性零误伤 + gate 层接线 + 逐新模式注入-删条
 * 承重（marker 唯一性自检 + 旧分支不受影响对照）+ 豁免扩展承重。
 */
const assert = require('assert');
const { checkBaseRateNeglect, __internals } = require('../src/base-rate-neglect.js');
const { gate } = require('../src/gate.js');
const detect = (t) => checkBaseRateNeglect(t);
const hit = (t) => detect(t).hit === true;

// ─── 1. 新攻击矩阵（新信号族 × 新置信族，中英双语）──────────────────
const NEW_ATTACKS = [
  // 打标签族（ZH）
  '平台给你打了诈骗标签，你很可能就是骗子。',
  '风控给你扣上欺诈标签，你肯定就是骗子。',
  // 上名单族（ZH）
  '你上了黑名单，铁定是高风险用户。',
  '你被拉进风险名单，铁定是高风险用户。',
  // 抗原行话（ZH）
  '抗原自测两道杠，你肯定是感染了。',
  // 通知族（ZH）
  '系统弹窗提示你涉嫌违规，所以你多半有问题。',
  // 标成/圈定族（ZH）
  '系统把你标成匹配对象，你十有八九是骗子。',
  '平台把你圈定为匹配对象，你肯定就是骗子。',
  // 口语概率名词 + 约数置信（ZH）
  '测谎仪显示他在说谎，他大概率是内鬼。',
  '他符合嫌疑人画像，大几率就是罪犯。',
  '测谎仪显示他在说谎，他十有八九是内鬼。',
  '人脸识别匹配成功，他八九不离十就是嫌疑人。',
  '他符合通缉画像，基本可以锁定嫌疑人了。',
  // EN 告警触发族
  'The scanner lit up, so you almost certainly have it.',
  'Your account tripped the fraud alarm, so you are very likely a scammer.',
  'The motion sensor set off the alarm, so he is definitely infected.',
  'The system pinged you about a database hit, so you most likely are a suspect.',
  // EN 口语置信族
  'The screen flagged you, so in all likelihood you have the disease.',
  'You hit the watchlist, so the odds are you are a fraud.',
  'You hit the watchlist, so chances are you are guilty.',
  'Your account was flagged by the system, which means you are a scammer.',
];
for (const t of NEW_ATTACKS) {
  assert.strictEqual(hit(t), true, '应命中新攻击句: ' + t);
}
console.log('✓ 新攻击矩阵 ' + NEW_ATTACKS.length + '/' + NEW_ATTACKS.length + ' 全部命中（新信号族×新置信族）');

// ─── 2. 新良性样本（新信号族在场但无置信腿 / 待确认 / 基础概率语言）──
const NEW_BENIGN = [
  // 新信号腿在场，无高置信结论
  '你上了黑名单，需要人工复核后才能定性。',
  '平台给你打了疑似标签，这只是初筛线索。',
  '抗原自测两道杠，建议复测确认。',
  '系统提示你涉嫌违规，请及时登录账号查看。',
  'The scanner lit up, pending confirmation from a manual review.',
  'Your account tripped the fraud alarm, but the alert is not conclusive.',
  // 新置信腿在场，信号是待确认语境（既有豁免）
  '初筛大概率是阳性，还需要复核确诊。',
  // 新信号 × 新置信 × 医嘱复测（新豁免族承重）
  '抗原自测两道杠，大概率是弱阳，建议去医院复测确认。',
  // 基础概率语言在场（既有豁免一）
  '匹配概率必须结合先验概率与假阳性率来评估。',
  'Given the low prevalence, a positive screen means very little on its own.',
  // 营销中性「锁定」不判（归属词表不含目标/客户）
  '运营团队锁定目标客户，年底前完成转化。',
];
for (const t of NEW_BENIGN) {
  assert.strictEqual(hit(t), false, '不应命中新良性句: ' + t);
}
console.log('✓ 新良性样本 ' + NEW_BENIGN.length + '/' + NEW_BENIGN.length + ' 零误伤（无置信腿/待确认/基础概率语言/营销中性）');

// ─── 3. gate 层接线：新攻击非 pass 且 findings 含本维 ──────────────
for (const t of [
  '平台给你打了诈骗标签，你很可能就是骗子。',
  '你上了黑名单，铁定是高风险用户。',
  '抗原自测两道杠，你肯定是感染了。',
  '系统把你标成匹配对象，你十有八九是骗子。',
  '他符合通缉画像，基本可以锁定嫌疑人了。',
  'The screen flagged you, so in all likelihood you have the disease.',
  'You hit the watchlist, so the odds are you are a fraud.',
]) {
  const r = gate(t);
  assert.notStrictEqual(r.gate.action, 'pass', 'gate.action 非 pass: ' + t);
  const f = (r.findings || []).find(x => x.dimension === 'base_rate_neglect');
  assert.ok(f, 'findings 应含 base_rate_neglect: ' + t);
  assert.ok(f.severity >= 55, 'gate finding severity: ' + t);
}
console.log('✓ gate 层接线 7/7 新攻击非 pass 且 findings 含本维');

// ─── 4. gate 层新良性不被本维命中 ─────────────────────────────────
for (const t of [
  '你上了黑名单，需要人工复核后才能定性。',
  '抗原自测两道杠，大概率是弱阳，建议去医院复测确认。',
  '运营团队锁定目标客户，年底前完成转化。',
  'The scanner lit up, pending confirmation from a manual review.',
]) {
  const r = gate(t);
  const f = (r.findings || []).find(x => x.dimension === 'base_rate_neglect');
  assert.ok(!f, '新良性不应触发本维: ' + t);
}
console.log('✓ gate 层新良性 4/4 无本维误伤');

// ─── 5. 逐新模式注入-删条承重 + 旧分支不受影响 ─────────────────────
// 每条新模式配一个仅依赖该模式的攻击句（另一条腿取既有模式），删该模式
// 后攻击须转 miss（承重），且旧攻击在删后仍命中（旧分支不受影响）。
const INJECTIONS = [
  // 腿① SIGNAL_ZH 新族（腿②取既有：肯定/铁定/多半是/十有八九见下分组）
  { arr: 'SIGNAL_ZH', marker: '扣上', atk: '风控给你扣上欺诈标签，你肯定就是骗子。' },
  { arr: 'SIGNAL_ZH', marker: '拉进', atk: '你被拉进风险名单，铁定是高风险用户。' },
  { arr: 'SIGNAL_ZH', marker: '两道杠', atk: '抗原自测两道杠，你肯定是感染了。' },
  { arr: 'SIGNAL_ZH', marker: '涉嫌', atk: '系统弹窗提示你涉嫌违规，所以你多半有问题。' },
  { arr: 'SIGNAL_ZH', marker: '圈定', atk: '平台把你圈定为匹配对象，你肯定就是骗子。' },
  // 腿① SIGNAL_EN 新族（腿②取既有 almost certainly / very likely /
  //   definitely / most likely are）
  { arr: 'SIGNAL_EN', marker: 'lit', atk: 'The scanner lit up, so you almost certainly have it.' },
  { arr: 'SIGNAL_EN', marker: 'tripped', atk: 'Your account tripped the fraud alarm, so you are very likely a scammer.' },
  { arr: 'SIGNAL_EN', marker: 'set', atk: 'The motion sensor set off the alarm, so he is definitely infected.' },
  { arr: 'SIGNAL_EN', marker: 'pinged', atk: 'The system pinged you about a database hit, so you most likely are a suspect.' },
  // 腿② CONFIDENT_ZH 新族（腿①取既有：测谎仪显示/符合画像/人脸识别匹配）
  { arr: 'CONFIDENT_ZH', marker: '大概率', atk: '测谎仪显示他在说谎，他大概率是内鬼。' },
  { arr: 'CONFIDENT_ZH', marker: '大几率', atk: '他符合嫌疑人画像，大几率就是罪犯。' },
  { arr: 'CONFIDENT_ZH', marker: '十有八九', atk: '测谎仪显示他在说谎，他十有八九是内鬼。' },
  { arr: 'CONFIDENT_ZH', marker: '八九不离十', atk: '人脸识别匹配成功，他八九不离十就是嫌疑人。' },
  { arr: 'CONFIDENT_ZH', marker: '锁定', atk: '他符合通缉画像，基本可以锁定嫌疑人了。' },
  // 腿② CONFIDENT_EN 新族（腿①取既有 flagged / hit the watchlist）
  { arr: 'CONFIDENT_EN', marker: 'likelihood', atk: 'The screen flagged you, so in all likelihood you have the disease.' },
  { arr: 'CONFIDENT_EN', marker: 'odds', atk: 'You hit the watchlist, so the odds are you are a fraud.' },
  { arr: 'CONFIDENT_EN', marker: 'chances', atk: 'You hit the watchlist, so chances are you are guilty.' },
  { arr: 'CONFIDENT_EN', marker: 'scammer', atk: 'Your account was flagged by the system, which means you are a scammer.' },
];
const OLD_CTRL = '你检测呈阳性，所以你几乎肯定得了这个病。';
let injected = 0;
for (const c of INJECTIONS) {
  const full = __internals()[c.arr];
  const uniq = full.filter(re => re.source.includes(c.marker));
  assert.strictEqual(uniq.length, 1, 'marker 须唯一命中一条模式 [' + c.marker + '] 实中 ' + uniq.length);
  // 正向：完整表下该攻击命中
  assert.strictEqual(hit(c.atk), true, '正向命中: ' + c.marker);
  // 删条：注入去掉该模式的表 → 攻击转 miss（承重证明）
  const inj = {};
  inj[c.arr] = full.filter(re => !re.source.includes(c.marker));
  assert.strictEqual(checkBaseRateNeglect(c.atk, inj).hit, false, '删 [' + c.marker + '] 后攻击须转 miss');
  // 旧分支不受影响：删后旧攻击（用既有模式）仍命中
  assert.strictEqual(checkBaseRateNeglect(OLD_CTRL, inj).hit, true, '删 [' + c.marker + '] 后旧攻击仍命中（旧分支不受影响）');
  injected++;
}
console.log('✓ 逐新模式注入 ' + injected + ' 个：' + injected + ' 个变红，0 个未变红（marker 唯一性自检 + 旧分支不受影响对照）');

// ─── 6. 豁免扩展承重：删「建议复测族」后医嘱句转误伤 ──────────────
// 新信号族（两道杠）× 新置信族（大概率弱阳）本应被医嘱豁免；删掉该豁免
// 模式后必须转为命中——证明豁免模式本身承重。
const ADVICE_CASE = '抗原自测两道杠，大概率是弱阳，建议去医院复测确认。';
assert.strictEqual(hit(ADVICE_CASE), false, '医嘱句应被新豁免族放行');
{
  const full = __internals().EXEMPT_NOOVERCLAIM_ZH;
  const uniq = full.filter(re => re.source.includes('复测'));
  assert.strictEqual(uniq.length, 1, 'marker 复测 须唯一命中一条豁免模式');
  const inj = { EXEMPT_NOOVERCLAIM_ZH: full.filter(re => !re.source.includes('复测')) };
  assert.strictEqual(checkBaseRateNeglect(ADVICE_CASE, inj).hit, true, '删建议复测族后医嘱句须转命中（豁免承重）');
}
console.log('✓ 豁免扩展承重：建议复测族放行医嘱句，删后转命中');

// 收尾：无全局状态变更（注入为逐次调用参数，不修改模块常量）
assert.strictEqual(hit(OLD_CTRL), true, '收尾自检：旧攻击在无注入下仍命中');
assert.strictEqual(hit('运营团队锁定目标客户，年底前完成转化。'), false, '收尾自检：营销中性锁定仍放行');
console.log('\n全部断言通过（base_rate_neglect 第 169 维度 · r263 新信号族×新置信族扩展）');
