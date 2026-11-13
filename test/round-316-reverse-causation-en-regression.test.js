// round-316: r315 staged 补腿引入的 EN 侧回归修复 + 疫情结果族补腿
//
// 背景：r315 轮（上一轮被中断前）给 reverse_causation 补了 ZH 侧 R-c/R-d 紧凑框
// 与 RESP_ZH 应对/登记族，但 staged 未提交。r316 接手固化时实测发现：
//   1) EN 侧 responseEn 仍只有 R-a（RESP×GROUP 30字符 + DIFF），缺 R-c/R-d，
//      导致 r266 的两个核心攻击句（doorbell cameras / security guards）
//      从 hit 翻转为 miss —— 这是 r315 补腿引入的真实回归。
//   2) RESULT_ZH 有 感染/确诊 但无 阳性/病例，腿②结果腿恒不触，
//      导致「报备人数多的楼栋阳性也更多」「登记越密的园区病例越多」漏判。
//
// 本测试锁定这两个修复，防未来轮次再次改坏。
'use strict';

const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const mod = require(path.join(ROOT, 'src/reverse-causation.js'));
const hit = (t, inj) => mod.checkReverseCausation(t, inj).hit === true;

let pass = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fails.push(name + ': ' + e.message); }
}

// ─── 1. EN 侧 R-c/R-d 紧凑框回归锁定（r315 补腿引入的回归）────────────
// r266 时代的核心攻击句：GROUP_EN 无名词可配，只有紧凑框能救
const EN_REGRESSION = [
  'Neighborhoods that installed doorbell cameras see more package theft, so doorbell cameras are attracting thieves.',
  'Areas with more security guards report more break-ins, which shows guards draw burglars.',
  'Areas with more security guards report more break-ins, so the guards are attracting burglars.',
  'Neighborhoods that installed doorbell cameras see more package theft, which shows the cameras attract thieves.',
  'Doorbell cameras are installed in areas with more package theft, so the cameras are attracting thieves.',
  'Complaints are more common in buildings that installed cameras, so the cameras drew the complaints.',
  // R-d 中距形（RESP 与 DIFF 隔 with/installed 修饰，超 30 字符窗）
  'Warehouses with cameras installed report more thefts, which suggests the cameras are drawing thieves.',
  'Districts with more surveillance cameras see more property crime, so the cameras seem to attract it.',
];
t('EN 紧凑框回归锁定 8/8', () => {
  const miss = EN_REGRESSION.filter((s) => !hit(s));
  assert.strictEqual(miss.length, 0, '以下 EN 攻击句漏判（r315 补腿回归未修）:\n' + miss.join('\n'));
});

// ─── 2. EN 良性零误伤 ────────────────────────────────────────────────
const EN_BENIGN = [
  'Residents started panic buying after the storm warning, and the city opened emergency supply points.',
  'The store ran out of water filters during the recall, so the vendor arranged replacements.',
  'Neighborhoods installed cameras because break-ins rose sharply last year, according to the police report.',
  'More guards were assigned after the burglary wave, the precinct chief said on Tuesday.',
  'The city added water purifiers to schools following the lead contamination findings.',
  'Cameras are required by the new ordinance for all ground-floor retail spaces.',
];
t('EN 良性零误伤 6/6', () => {
  const fp = EN_BENIGN.filter((s) => hit(s));
  assert.strictEqual(fp.length, 0, '以下良性句被误判:\n' + fp.join('\n'));
});

// ─── 3. 疫情结果族补腿（RESULT_ZH 阳性/病例）────────────────────────
const EPI_ATTACKS = [
  '报备人数多的楼栋阳性也更多，可见报备招来了阳性。',
  '登记越密的园区病例越多，说明登记制度滋生了病例。',
  '核酸检测点越密的街道确诊越多，可见常态化核酸造成了感染。',
  '隔离越久的城市复工投诉越多，说明隔离引发了矛盾。',
  '停课越多的学校成绩下滑越明显，可见停课拉低了成绩。',
];
t('疫情结果族攻击 5/5', () => {
  const miss = EPI_ATTACKS.filter((s) => !hit(s));
  assert.strictEqual(miss.length, 0, '以下攻击句漏判（RESULT_ZH 缺阳性/病例族）:\n' + miss.join('\n'));
});

// ─── 4. 疫情叙述良性零误伤（上轮 r315 交接预警重点）──────────────────
const EPI_BENIGN = [
  '阳性率是根据检测覆盖人口计算的，不是检测本身制造了阳性。',
  '病例数上升是因为就诊意愿提高，属于发现能力提升。',
  '检测点越多恰恰说明筛查越充分，这是主动发现的结果。',
  '核酸检测能力的提升让更多早期病例被及时识别。',
  '隔离点越多恰恰说明疫情越重，这是按疫情密度调配的。',
  '核酸点密度是根据既往感染数据划定的，不是感染的原因。',
  '装监控是因为去年盗窃案高发，属于事后防范。',
  '请假数据上升是流感的伴随现象，不是请假导致流感。',
  '停课决定是在感染率突破阈值后做出的。',
  '小区陆续装上了警报器，物业同步升级了夜间巡逻制度。',
];
t('疫情叙述良性零误伤 10/10', () => {
  const fp = EPI_BENIGN.filter((s) => hit(s));
  assert.strictEqual(fp.length, 0, '以下良性句被误判:\n' + fp.join('\n'));
});

// ─── 5. 承重证明：清空本维度腿后不得由本维度命中 ───────────────────
// 注意：checkReverseCausation 清空 6 主数组后，内部还有 RESPONDER/CRISIS 腿
// 可能兜底（实测「停课…成绩下滑」句），故本断言只保证**本维度判定为 miss**，
// 不断言 gate 全管线 miss（那由其他维度负责）。
const ALL_ARR = ['RESP_ZH', 'CAUSE_ZH', 'RESULT_ZH', 'RESP_EN', 'CAUSE_EN', 'RESULT_EN'];
t('承重证明-清空本维度腿后本维度 miss', () => {
  const all = [...EN_REGRESSION, ...EPI_ATTACKS];
  const inj = {};
  for (const a of ALL_ARR) inj[a] = [];
  const stillHit = all.filter((s) => hit(s, inj));
  assert.strictEqual(stillHit.length, 0, '清空本维度腿后仍由本维度命中:\n' + stillHit.join('\n'));
});

// ─── 6. 存量回归不破：r266/r299 的旧攻击句仍命中 ────────────────────
const LEGACY = [
  '住院患者的死亡率明显更高，所以住院本身增加了死亡风险。',
  '戴头盔的骑手出车祸更多，这说明戴头盔会引发事故。',
  '越是囤口罩的地方呼吸道问题越多，说明囤口罩导致了呼吸道问题。',
  '越是囤盐的社区供应问题越多，可见囤盐造成了供应问题。',
  '吃保健品的人群死亡率更高，所以吃保健品造成了死亡。',
  '装净水器的家庭水质问题更多，这说明装净水器引发了水质问题。',
];
t('存量回归 6/6 仍命中', () => {
  const miss = LEGACY.filter((s) => !hit(s));
  assert.strictEqual(miss.length, 0, '以下存量攻击句漏判:\n' + miss.join('\n'));
});

// ─── 7. gate 层可达性（VAC 14/14 走 gate 全管线）─────────────────────
t('gate 层可达性', () => {
  const main = require(path.join(ROOT, 'src/gate.js'));
  for (const s of [EN_REGRESSION[0], EPI_ATTACKS[0]]) {
    const r = main.gate(s);
    assert.ok(r && r.gate, 'gate() 未返回结果: ' + s);
  }
});

if (fails.length) {
  console.error('FAIL:\n - ' + fails.join('\n - '));
  process.exit(1);
}
console.log('✓ round-316-reverse-causation-en-regression 全部通过 (' + pass + ' 断言)');
console.log('round-316-reverse-causation-en-regression: ' + pass + ' 通过, 0 失败, 共 ' + pass + ' 个');
