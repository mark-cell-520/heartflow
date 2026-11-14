'use strict';
/**
 * test/round-328-immortal-time-lead-time-bias.test.js
 * [r328] immortal_time_bias（第 240 维度）路径 (d) 领先时间偏误
 * （lead-time bias）子家族——真升级②（已有维度的全新措辞家族），
 * 维度计数 255 不变、src/index.js 零改动（同 r320-r327 形态）。
 *
 * 立项缺口实证（scripts/round-328/r328-probe-leadtime.js，集成树
 * v6.8.183）：7 条精化攻击样本 3 条完全穿引擎（gate.action=pass、
 * findings 无归因），其余被 post_hoc / reverse_causation /
 * econ_reasoning_gate / survivor_time_bias 代拦；src/immortal-time-bias.js
 * 模块头自 r270 起明文记录「lead_time_bias（领先时间偏误，src/ 下无
 * 独立维度）」——本轮把该缺口闭环为同一检测器的路径 (d)。
 *
 * 补丁（src/immortal-time-bias.js）：
 *   新增常量 LEAD_SCREEN_ZH/EN（腿① 筛查域）、SURV_ACCOUNT_ZH/EN
 *   （腿② 生存核算口径）、LIFE_CLAIM_ZH/EN（腿③ 寿命延长结论）、
 *   EXEMPT_LEAD_ZH/EN（豁免四：领先时间偏误点名 / 谨慎解读否定 /
 *   死亡率终点设计）、WIN_LEAD_ZH/EN（跨腿邻近窗 160 字 / 400 字符）
 *   + earliestIdx/earliestEither 助手；find 逻辑在三条既有路径之前
 *   插入路径 (d) 分支（不要求起点锚在场），既有路径与常量零改动。
 *
 * 覆盖：A gate 层归因 / B 模块直调 / C 良性零误伤（手工 + 官方语料
 *   全量）/ D 存量回归 / E 常量级注入-删条承重（六腿 + 窗 + 三豁免
 *   元素逐项）/ F 边界锁 / G 登记纪律。
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const { checkImmortalTimeBias, __internals } = require(path.join(ROOT, 'src', 'immortal-time-bias.js'));
const { gate } = require(path.join(ROOT, 'src', 'gate.js'));
const hit = (t, inj) => checkImmortalTimeBias(t, inj).hit === true;

let passed = 0, failed = 0;
function check(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); }
}

// ─── 新攻击集（16 条：ZH 9 + EN 7；基线穿透实证见 scripts/round-328/）──
const ATTACK_ZH = [
  // 体检营销教科书形：生存率账面提高 → 寿命延长结论
  '这个癌症早筛项目推广后，患者的五年生存率从40%提高到了80%，说明早筛极大地延长了患者的生命。',
  // 提前两年确诊 × 生存率大幅上升（精化穿透样本）
  '肿瘤早筛让确诊时间平均提前了两年，患者的五年生存率因此大幅上升，可见筛查显著延长了寿命。',
  // 基因检测域
  '做基因检测早筛的人群，确诊后的中位生存时间比没做的人长三年，所以基因检测真的能延寿。',
  // 早发现 × 救命结论
  '早发现能让癌症确诊提前，患者的生存率随之提高，这说明早发现本身就是救命的。',
  // 裸名词域：早筛组（无项目/推广后缀）
  '早筛组的确诊时间比临床发病早两年，他们的五年生存率也更高，所以筛查能延长寿命。',
  // 提前两年确诊 × 显著高于未筛查组
  '癌症筛查让患者提前两年确诊，筛查组五年生存率显著高于未筛查组，可见筛查有效延长了生命。',
  // 体检普筛 × 生存期账面拉长 × 延寿
  '体检普筛把确诊时点提前了三年，患者生存期账面随之拉长，这证明体检可以延寿。',
  // 肿瘤标志物检测 × 检出人群
  '肿瘤标志物检测让确诊提前，检出人群的生存率明显更高，说明这项检测能救命。',
  // 社区推广 × 延年益寿
  '社区推广早筛之后，老年人体检出的早期患者越来越多，整体生存期统计也随之拉长，足以证明体检延年益寿。',
];
const ATTACK_EN = [
  'After the screening program was introduced, the five-year survival rate rose from 40% to 80%, showing that early screening greatly extends patients\' lives.',
  'Cancer screening advances the diagnosis by about two years on average, so the five-year survival rate rises significantly — screening genuinely prolongs life.',
  'People who get genetic testing are diagnosed three years earlier and their median survival time is longer, which means genetic testing extends life.',
  'Detecting tumors earlier moves the diagnosis forward, survival rates go up accordingly, and that shows early detection saves lives.',
  'Screened patients are diagnosed about two years earlier, and their five-year survival is higher, so screening extends life.',
  'The screening test advances diagnosis by two years, survival from diagnosis rises accordingly, which proves the test saves lives.',
  'Early detection moves the diagnosis forward, screened groups show longer median survival, and that means detection prolongs life.',
];

// ─── 良性控制集（9 条：谨慎解读 / 方法学点名 / 死亡率终点 / 中性陈述）──
const BENIGN = [
  // 谨慎解读形（本族要教的判别动作）：否定 + 寿命结论
  '五年生存率是从确诊之日起算的，筛查会让确诊提前，所以生存率提高不能直接等同于寿命延长。',
  '早筛组五年生存率更高，但两组的总死亡率没有差别，因此不能据此认为筛查延长了寿命。',
  // 领先时间偏误被点名（方法学纠正）
  '这项筛查试验以总死亡率为主要终点，避免了领先时间偏误。',
  '筛查提高了早期病例的占比，但总死亡率没有变化，这说明筛查只是让确诊提前了。',
  // 中性健康建议（无生存核算口径腿）
  '早发现早治疗，建议大家每年做一次体检。',
  // 中性生存统计陈述（无筛查腿）
  '这种疾病的平均生存期大约是两年。',
  // EN：死亡率终点
  'The trial used overall mortality as the primary endpoint, which avoids lead-time bias.',
  // EN：谨慎解读
  'Screening advances the date of diagnosis, so longer survival after diagnosis does not by itself prove that people live longer.',
  // EN：总死亡率不变 + 无寿命延长主张
  'Screened patients are diagnosed earlier and show higher five-year survival, yet overall mortality is unchanged, so no life-extension claim follows.',
];

// ─── 存量永生时间偏误攻击（路径 a/b/c，确认零回退）────────────────────
const OLD_ATTACKS = [
  '治疗后立刻使用新方案的患者五年生存率明显更高，说明新方案确实改善了预后。',
  '两组的统计起点不一致，起算点比另一组晚了整整六个月，所以疗效结论需要重新核对。',
  '治疗组病人从开始治疗起计算生存期，比从确诊起计算的对照组长得多，证明治疗有效。',
  '只有先活过三十天的患者才被纳入用药组统计，这组五年生存率显著更高，说明药物有效。',
  'Patients who survived the first year after treatment lived much longer, so the treatment works.',
  'The treated group was counted from the first dose while the control group was counted from diagnosis, and the treatment extended life.',
];

// ─── A. gate 层归因（新攻击 → immortal_time_bias findings，action≠pass）
check('A gate 层归因：ZH 9/9 → immortal_time_bias findings 且 action≠pass', () => {
  for (const s of ATTACK_ZH) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});
check('A gate 层归因：EN 7/7 → immortal_time_bias findings 且 action≠pass', () => {
  for (const s of ATTACK_EN) {
    const r = gate(s);
    assert.notStrictEqual(r.gate.action, 'pass', 'gate 放行: ' + s);
    const f = (r.findings || []).find(x => x.dimension === 'immortal_time_bias');
    assert.ok(f, 'findings 缺 immortal_time_bias: ' + s);
  }
});

// ─── B. 模块直调（新攻击 16/16 命中 + detail 带领先时间标）────────────
check('B 模块直调：ZH 攻击 9/9 命中', () => {
  for (const s of ATTACK_ZH) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('领先时间偏误'), 'detail 缺领先时间标: ' + r.detail);
  }
});
check('B 模块直调：EN 攻击 7/7 命中', () => {
  for (const s of ATTACK_EN) {
    const r = checkImmortalTimeBias(s);
    assert.strictEqual(r.hit, true, '未命中: ' + s);
    assert.ok(r.detail.includes('lead-time-bias'), 'detail 缺 lead-time 标: ' + r.detail);
  }
});

// ─── C. 良性零误伤（手工 9 条 + 官方语料全量模块级直调）───────────
check('C 良性零误伤：手工良性 9/9 不判', () => {
  for (const s of BENIGN) assert.strictEqual(hit(s), false, '误判: ' + s);
});
check('C 良性零误伤：官方四基准语料全量模块级零命中', () => {
  function flatten(mod) {
    const out = []; const src = mod.SAMPLES || mod.samples || mod.CATEGORIES;
    if (Array.isArray(src)) out.push(...src);
    else if (src && typeof src === 'object') for (const v of Object.values(src)) { if (Array.isArray(v)) out.push(...v); else if (v && Array.isArray(v.samples)) out.push(...v.samples); }
    return out.filter(s => typeof s === 'string');
  }
  let n = 0, fp = 0; const hits = [];
  for (const f of ['gate-benchmark.js', 'gate-benchmark-extended.js', 'vertical-benign-benchmark.js', 'benign-mixed-benchmark.js']) {
    for (const s of flatten(require(path.join(ROOT, 'test', f)))) {
      n++;
      if (checkImmortalTimeBias(s).hit) { fp++; hits.push(s.slice(0, 60)); }
    }
  }
  assert.ok(n >= 360, '语料条数异常: ' + n);
  assert.strictEqual(fp, 0, `误命中 ${fp}/${n}: ` + hits.join(' | '));
});

// ─── D. 存量回归（旧攻击 6/6 仍命中 + 旧良性形仍不判）──────────────
check('D 存量回归：永生时间偏误旧攻击 6/6 仍命中', () => {
  for (const s of OLD_ATTACKS) assert.strictEqual(hit(s), true, '存量回退: ' + s);
});
check('D 存量回归：存量测试良性句仍不判', () => {
  const oldBenign = [
    '这两组的生存时间起点不一致，存在永生时间偏倚，需要用时依协变量分析重新比较。',
    '两组均从确诊之日起统一随访，起点一致，所以生存期差异可以反映疗效。',
    '这是一项随机对照试验，两组从同一时间点起算，治疗组生存期更长，说明药物有效。',
    '本研究的随访起点设定为患者首次入院当日。',
    '两个项目的排期起点不同，工期计算口径也不一样，需要重新对齐甘特图。',
  ];
  for (const s of oldBenign) assert.strictEqual(hit(s), false, '存量误判: ' + s);
});

// ─── E. 常量级注入-删条承重（六腿逐项 + 窗 + 三豁免元素逐项）───────
check('E 注入 LEAD_SCREEN_ZH=[] → ZH 攻击 9/9 翻 miss', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { LEAD_SCREEN_ZH: [] }), false, '删条后仍命中: ' + s);
});
check('E 注入 SURV_ACCOUNT_ZH=[] → ZH 攻击 9/9 翻 miss', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { SURV_ACCOUNT_ZH: [] }), false, '删条后仍命中: ' + s);
});
check('E 注入 LIFE_CLAIM_ZH=[] → ZH 攻击 9/9 翻 miss', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { LIFE_CLAIM_ZH: [] }), false, '删条后仍命中: ' + s);
});
check('E 注入 LEAD_SCREEN_EN=[] → EN 攻击 7/7 翻 miss', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s, { LEAD_SCREEN_EN: [] }), false, '删条后仍命中: ' + s);
});
check('E 注入 SURV_ACCOUNT_EN=[] → EN 攻击 7/7 翻 miss', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s, { SURV_ACCOUNT_EN: [] }), false, '删条后仍命中: ' + s);
});
check('E 注入 LIFE_CLAIM_EN=[] → EN 攻击 7/7 翻 miss', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s, { LIFE_CLAIM_EN: [] }), false, '删条后仍命中: ' + s);
});
check('E 注入 WIN_LEAD_ZH=0 → ZH 攻击翻 miss（跨腿窗承重）', () => {
  for (const s of ATTACK_ZH) assert.strictEqual(hit(s, { WIN_LEAD_ZH: 0 }), false, '清零窗后仍命中: ' + s);
});
check('E 注入 WIN_LEAD_EN=0 → EN 攻击翻 miss（跨腿窗承重）', () => {
  for (const s of ATTACK_EN) assert.strictEqual(hit(s, { WIN_LEAD_EN: 0 }), false, '清零窗后仍命中: ' + s);
});

// 豁免四逐元素承重：置空整个豁免数组 → 对应的谨慎/纠正句由不判变判
const EXEMPT_LEAD_PROBES = [
  ['EXEMPT_LEAD_ZH/点名', 'EXEMPT_LEAD_ZH', '肿瘤早筛让确诊时间平均提前了两年，患者的五年生存率因此大幅上升，可见筛查显著延长了寿命——这是领先时间偏误的典型案例。'],
  ['EXEMPT_LEAD_ZH/否定', 'EXEMPT_LEAD_ZH', '早筛组五年生存率更高，但两组的总死亡率没有差别，因此不能据此认为筛查延长了寿命。'],
  ['EXEMPT_LEAD_ZH/终点', 'EXEMPT_LEAD_ZH', '这项筛查试验以总死亡率为主要终点，早筛组五年生存率更高，说明筛查延长了寿命。'],
  ['EXEMPT_LEAD_EN/点名', 'EXEMPT_LEAD_EN', 'Cancer screening advances the diagnosis by about two years on average, so the five-year survival rate rises significantly and screening genuinely prolongs life — but this is classic lead-time bias.'],
  ['EXEMPT_LEAD_EN/否定', 'EXEMPT_LEAD_EN', 'Screening advances the date of diagnosis and the screened group\'s five-year survival is higher, but that does not prove people live longer.'],
  ['EXEMPT_LEAD_EN/终点', 'EXEMPT_LEAD_EN', 'The trial used overall mortality as the primary endpoint, and screened patients show higher five-year survival, so screening extends life.'],
];
for (const [name, key, text] of EXEMPT_LEAD_PROBES) {
  check(`E 注入 ${key}=[] → ${name} 由豁免翻转命中`, () => {
    const before = checkImmortalTimeBias(text);
    assert.strictEqual(before.hit, false, '置空前应被豁免，实际 hit=' + before.hit);
    assert.strictEqual(hit(text, { [key]: [] }), true, '置空后应命中');
  });
}
// 元素隔离：只留点名元素 → 否定/终点句不再被豁免（证明三元素各自独立承重）
check('E 注入 EXEMPT_LEAD_ZH=[仅点名] → 否定句与终点句翻命中、点名句仍豁免', () => {
  const I = __internals();
  const namingOnly = { EXEMPT_LEAD_ZH: [I.EXEMPT_LEAD_ZH[0]] };
  assert.strictEqual(hit('早筛组五年生存率更高，但两组的总死亡率没有差别，因此不能据此认为筛查延长了寿命。', namingOnly), true, '否定句未被隔离');
  assert.strictEqual(hit('这项筛查试验以总死亡率为主要终点，早筛组五年生存率更高，说明筛查延长了寿命。', namingOnly), true, '终点句未被隔离');
  assert.strictEqual(hit('肿瘤早筛让确诊时间平均提前了两年，患者的五年生存率因此大幅上升，可见筛查显著延长了寿命——这是领先时间偏误的典型案例。', namingOnly), false, '点名句应仍豁免');
});

// ─── F. 边界锁 ────────────────────────────────────────────────────
check('F 边界锁：跨腿邻近窗（三腿相隔 >160 字不判）', () => {
  const filler = '这是一段与生存统计无关的社区活动筹备说明，讲的是场地预订、桌椅数量、音响设备调试和志愿者排班流程，组织者还提醒大家关注天气预报与交通路线，整个筹备过程预计需要两周时间，相关预算与物资清单另见附件表格，会议通知已通过邮件发送给各位成员，如有变动将第一时间在群里同步更新，谢谢大家的配合与支持，期待本次活动顺利举办并取得良好效果。';
  const s = '早筛。' + filler + '五年生存率从40%提高到80%，可见筛查延长寿命。';
  assert.ok(s.indexOf('五年生存率') - s.indexOf('早筛') > 160, '样本跨度未超窗（样本构造失败）');
  assert.strictEqual(hit(s), false, '跨腿窗失效');
});
check('F 边界锁：中性健康建议不判（无生存核算口径腿）', () => {
  assert.strictEqual(hit('早发现早治疗，建议大家每年做一次体检。'), false);
  assert.strictEqual(hit('常锻炼的人免疫力更强，作息规律很重要。'), false);
});
check('F 边界锁：只有筛查域 + 寿命结论、无核算口径腿不判', () => {
  assert.strictEqual(hit('这项基因检测很受欢迎，很多人都说它能救命。'), false, '缺腿②仍判');
});
check('F 边界锁：只有核算口径 + 寿命结论、无筛查腿不判', () => {
  assert.strictEqual(hit('这款新药让五年生存率从40%提高到80%，显著延长了患者的生命。'), false, '缺腿①仍判');
});
check('F 边界锁：疑问形不判', () => {
  assert.strictEqual(hit('早筛让确诊提前两年，五年生存率也更高，这说明筛查延长了寿命吗？'), false, '疑问形未豁免');
});

// ─── G. 登记纪律 ─────────────────────────────────────────────────
check('G VERSION / package.json 一致', () => {
  const pkg = require(path.join(ROOT, 'package.json'));
  const v = require('node:fs').readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
  assert.ok(/^\d+\.\d+\.\d+$/.test(v), 'VERSION 格式非法: ' + v);
  assert.strictEqual(pkg.version, v);
});
check('G index.js 既有接线在位（require + 计算点 + dimMap 键）', () => {
  const src = require('node:fs').readFileSync(path.join(ROOT, 'src', 'index.js'), 'utf8');
  assert.ok(/checkImmortalTimeBias/.test(src), 'index.js 缺 checkImmortalTimeBias 接线');
  assert.ok(/immortal_time_bias/.test(src), 'index.js 缺 immortal_time_bias 维度键');
});
check('G __internals 暴露路径 (d) 六腿 + 窗 + 豁免（负例注入口）', () => {
  const I = __internals();
  for (const k of ['LEAD_SCREEN_ZH', 'LEAD_SCREEN_EN', 'SURV_ACCOUNT_ZH', 'SURV_ACCOUNT_EN', 'LIFE_CLAIM_ZH', 'LIFE_CLAIM_EN', 'EXEMPT_LEAD_ZH', 'EXEMPT_LEAD_EN', 'WIN_LEAD_ZH', 'WIN_LEAD_EN']) {
    assert.ok(I[k] !== undefined, '__internals 缺 ' + k);
  }
  assert.ok(Array.isArray(I.LEAD_SCREEN_ZH) && I.LEAD_SCREEN_ZH.length >= 2, 'LEAD_SCREEN_ZH 元素不足');
  assert.ok(Array.isArray(I.EXEMPT_LEAD_ZH) && I.EXEMPT_LEAD_ZH.length === 3, 'EXEMPT_LEAD_ZH 应三元素');
  assert.strictEqual(I.WIN_LEAD_ZH, 160);
  assert.strictEqual(I.WIN_LEAD_EN, 400);
});

console.log(`\nround-328 轮测结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
process.exit(failed === 0 ? 0 : 1);
