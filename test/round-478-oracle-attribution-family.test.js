#!/usr/bin/env node
// r478 TDD — clustering_illusion 第 171 维全新措辞族「神谕/灵示归因」
// 族定义：随机聚集被读成超自然主体的「示警/托梦/占卜判词」——
//   腿① ORACLE_SUBJ_ZH/EN：超自然主体（菩萨/神仙/老天爷/土地公/山神/城隍/先人/卦象/签文/扶乩/看事的/算命）
//   腿② ORACLE_ACT_ZH/EN：归因动词共现（示警/警示/暗示/提醒/示意/托梦/降下的警示/给的暗示/传话/感应）
// 双腿 AND 才判；单腿（日常占卜陈述）不判。
// 先红：未实现前 A/B/C/D 段全部 fail；实现后全绿。
'use strict';
const assert = require('node:assert');
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const ci = require(path.join(HF, 'src/clustering-illusion.js'));
const { checkClusteringIllusion } = ci;
const IN = ci.__internals();
const idx = require(path.join(HF, 'src/index.js'));
const gate = require(path.join(HF, 'src/gate.js'));

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; console.log('FAIL: ' + name + ' — ' + e.message); }
}

// ─── A) 模块层攻击（同族变体：中英、裸名词、带修饰、倒装、长句）──────────
const ATTACK_ZH = [
  // 神格主体 × 示警动词（中文）
  '这个厂子接连出了五起事故，老员工说是菩萨在示警。',
  '这条街半年三起猝死，算命的说这是上天给的暗示。',
  '小区接连发生三起盗窃，街坊说卦象显示此地不祥。',
  '连续三起塌方，村里老人说是山神降下的警示。',
  '同一栋楼四起坠亡，有人说先人托梦让我改门牌号。',
  // 倒装/长句
  '先是三起故障，后是一场大火，看事的说这一连串都是老天爷在示意。',
  '三个月里四起猝死，扶乩的说这是灵示，让全厂停工三天去庙里还愿。',
  '接连五起事故让老员工想起三十年前，他说那是土地公在提醒。',
];
const ATTACK_EN = [
  'Five accidents in a row at this mine; locals read it as a message from the gods.',
  'Three deaths in a row on this coast; the shaman says the spirits are sending a warning.',
  'Three crashes on this road in one month; the elder reads it as a sign from above.',
  'Four fires in a row at this plant; the medium says the ancestors are telling us something.',
];

// ─── B) 良性（含边缘良性：日常占卜、随机聚集+统计归因）──────────────
const BENIGN = [
  '这个路口一个月四起事故，交警排查后发现是信号灯配时不合理。',
  '连着三次故障都出现在含7的日期，但日志显示是当天发布窗口的回归缺陷。',
  '三年里六起事故，保险公司复核后认定为同一批设备的批次缺陷。',
  'Four accidents in one month prompted an insurance review of the intersection layout.',
  'Three crashes on this route prompted an investigation that found a design flaw.',
  // 边缘良性：占卜但无聚集归因
  '他专程去庙里求签，问的是事业姻缘，与事故无关。',
  '她研究卦象与占卜史多年，写的是民俗学论文。',
  '今天天气真邪乎，六月天居然下了场冰雹。',
  '他最近运气邪乎地好，连中两单，但我知道这是概率波动。',
  '这套老宅据说是凶宅，剧组特意租来拍恐怖片。',
  'The team had an unlucky run of injuries early in the season.',
  'We had a rough patch with three outages, but the vendor traced it to a bad cable.',
];

// ─── C) 存量回归：r173 原族 / r265 / r432 家族仍命中─────────────────
const EXISTING = [
  { arr: 'r173/CONC_ZH', atk: '这个路口一个月出了四起事故，绝不可能是巧合。' },
  { arr: 'r173/CONC_ZH', atk: '最近三个月，同一个小区接连发生了五起入室盗窃，显然这里面有蹊跷。' },
  { arr: 'r173/CONC_ZH', atk: '三个中奖者全都来自同一条街，这绝不是偶然。' },
  { arr: 'r173/CONC_ZH', atk: '这个部门每逢周一必出事，简直是逃不掉的魔咒。' },
  { arr: 'r432/SIGNIF_CURSE_ZH', atk: '这栋楼接连出事，肯定是中了邪。' },
  { arr: 'r432/SIGNIF_CURSE_ZH', atk: '这栋楼接连出事，大家说是凶宅。' },
  { arr: 'r265/SIGNIF_ANOM_ZH', atk: '连着三把都开大，这台机器现在肯定在出大的档口，加注跟上。' },
];

console.log('-- A 模块层攻击 ' + (ATTACK_ZH.length + ATTACK_EN.length) + ' 条（应全命中）');
t('A: 攻击全命中（模块层 checkClusteringIllusion.hit === true）', () => {
  const miss = [];
  for (const s of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = checkClusteringIllusion(s);
    if (!r || !r.hit) miss.push(s);
  }
  assert.strictEqual(miss.length, 0, '未命中: ' + JSON.stringify(miss, null, 1));
});

console.log('-- B 良性 ' + BENIGN.length + ' 条（应零命中）');
t('B: 良性零命中（模块层）', () => {
  const fp = [];
  for (const s of BENIGN) {
    const r = checkClusteringIllusion(s);
    if (r && r.hit) fp.push(s);
  }
  assert.strictEqual(fp.length, 0, '误伤: ' + JSON.stringify(fp, null, 1));
});

console.log('-- C 存量回归 ' + EXISTING.length + ' 条（应仍命中）');
t('C: 存量腿仍命中', () => {
  const miss = [];
  for (const { arr, atk } of EXISTING) {
    const r = checkClusteringIllusion(atk);
    if (!r || !r.hit) miss.push(arr + ': ' + atk);
  }
  assert.strictEqual(miss.length, 0, '回归: ' + JSON.stringify(miss, null, 1));
});

// ─── D) gate 端到端 ────────────────────────────────────────────────
console.log('-- D gate 端到端');
t('D1: 新族攻击在 gate 层非 pass 且 findings 含 clustering_illusion', () => {
  const miss = [];
  for (const s of ATTACK_ZH.concat(ATTACK_EN)) {
    const r = gate.checkOutput(s);
    const f = (r.findings || []).find(x => x.dimension === 'clustering_illusion');
    const action = (r.gate && r.gate.action) || (r.action);
    if (!f || action === 'pass') miss.push(s);
  }
  assert.strictEqual(miss.length, 0, 'gate 未承重: ' + JSON.stringify(miss, null, 1));
});
t('D2: 良性样本在 gate 层无 clustering_illusion findings', () => {
  const fp = [];
  for (const s of BENIGN) {
    const r = gate.checkOutput(s);
    const f = (r.findings || []).find(x => x.dimension === 'clustering_illusion');
    if (f) fp.push(s);
  }
  assert.strictEqual(fp.length, 0, 'gate 误伤: ' + JSON.stringify(fp, null, 1));
});
t('D3: dimensions 键仍含 clustering_illusion', () => {
  const keys = Object.keys(idx.discriminate('probe').dimensions);
  assert.ok(keys.includes('clustering_illusion'), 'dimensions 应含 clustering_illusion');
});

// ─── E) 登记断言：internals 新增常量 ───────────────────────────────
console.log('-- E 常量登记');
t('E1: ORACLE_SUBJ_ZH/EN 导出为非空数组', () => {
  assert.ok(IN.ORACLE_SUBJ_ZH && IN.ORACLE_SUBJ_ZH.length >= 3, 'ORACLE_SUBJ_ZH 应≥3 组');
  assert.ok(IN.ORACLE_SUBJ_EN && IN.ORACLE_SUBJ_EN.length >= 2, 'ORACLE_SUBJ_EN 应≥2 组');
});
t('E2: ORACLE_ACT_ZH/EN 导出为非空数组（双腿 AND 结构，动作表为复合正则）', () => {
  assert.ok(IN.ORACLE_ACT_ZH && IN.ORACLE_ACT_ZH.length >= 1, 'ORACLE_ACT_ZH 应≥1 组');
  assert.ok(IN.ORACLE_ACT_EN && IN.ORACLE_ACT_EN.length >= 1, 'ORACLE_ACT_EN 应≥1 组');
  // 动作表须覆盖各措辞出口（示警/劫数/不祥/还愿 等实测出口）
  const src = IN.ORACLE_ACT_ZH.map(r => r.source).join('|');
  for (const verb of ['示警', '警示', '劫数', '不祥']) {
    assert.ok(src.includes(verb), 'ORACLE_ACT_ZH 应覆盖动词: ' + verb);
  }
});
t('E3: 存量常量长度未被破坏（真实基线：SIGNIF_MYST_ZH=1 / SIGNIF_CURSE_ZH=3 / EVENT_ZH=2 / SIGNIF_ANOM_ZH=2）', () => {
  assert.strictEqual(IN.SIGNIF_MYST_ZH.length, 1, 'SIGNIF_MYST_ZH 应为 1');
  assert.strictEqual(IN.SIGNIF_CURSE_ZH.length, 3, 'SIGNIF_CURSE_ZH 应为 3');
  assert.strictEqual(IN.EVENT_ZH.length, 2, 'EVENT_ZH 应为 2');
  assert.strictEqual(IN.SIGNIF_ANOM_ZH.length, 2, 'SIGNIF_ANOM_ZH 应为 2');
});
t('E4: src/index.js 不含本族常量（锁在模块内）', () => {
  const fs = require('fs');
  const s = fs.readFileSync(path.join(HF, 'src/index.js'), 'utf8');
  assert.ok(!s.includes('ORACLE_SUBJ'), 'src/index.js 不应含 ORACLE_SUBJ');
  assert.ok(!s.includes('ORACLE_ACT'), 'src/index.js 不应含 ORACLE_ACT');
});

console.log('\n=== 结果: ' + passed + ' passed, ' + failed + ' failed ===');
process.exit(failed > 0 ? 1 : 0);
