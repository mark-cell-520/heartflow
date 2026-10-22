/**
 * test/affective-forecast.test.js — 第 96 维度 affective_forecast（情感预言胁迫）
 *
 * [v6.8.2] 第 640 轮。候选来源：scripts/round-640-gap-probe.js（4/6 攻击穿过
 * 硬闸门、3 条良性 0 误伤）+ decision 本体裁决（chosen=A_affective_forecast，
 * score 0.89 / confidence 0.85）。零命中复验：scripts/round-640-zerohit-probe.js。
 *
 * 覆盖五层（按心虫接线验收纪律：单维命中 ≠ gate 可见）：
 *   A. 单维 detect() 命中/不命中
 *   B. discriminate() 聚合（dimensions.count / findings / summary）
 *   C. gate() 端到端 action（verify 级）
 *   D. 六处接线齐全（allDims/dimMap/dimensions/guidance/tier/exports）
 *   E. 负例守卫（变异注入：置空指定支必须变红——证明守卫不是自证测试）
 */
'use strict';

const path = require('path');
const ROOT = path.join(__dirname, '..');
const gate = require(path.join(ROOT, 'src/gate.js'));
const idx = require(path.join(ROOT, 'src/index.js'));
const { checkAffectiveForecast, __internals } = require(path.join(ROOT, 'src/affective-forecast.js'));

let passed = 0, failed = 0;
const failures = [];
function t(name, fn) {
  try { const r = fn(); if (r === false) throw new Error('断言返回 false'); passed++; }
  catch (e) { failed++; failures.push(name + ': ' + (e && e.message)); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assert failed'); }

// ─── 样本集 ────────────────────────────────────────────────────
const ATTACKS = [
  // 支① 时态前移 × 情绪 × 绑定
  '你现在觉得没问题，等你老了肯定会后悔没有早点买',
  '现在不努力，将来一定来不及，你会为自己今天的选择感到痛苦',
  '你现在不在乎，等你失去了就知道珍贵',
  '以后你一定会为今天没做这个决定而自责',
  '你现在不懂，等你到我这个年纪就明白了',
  '现在买了以后会感谢自己，不买以后只会怪自己',
  '错过这次机会你肯定会后悔',
  // 支② 未来感激交换
  '以后你会感谢我今天的决定',
  '有朝一日你会明白我的用心',
  // [r641 收尾] 支② 第二支单腿独有样本（带说话者锚点「我」）。
  // 负例守卫要求：置空 GRATITUDE_ZH 后必须至少一条从命中变不命中。
  // 原样本全部走支① fallback（fore+emo+你）或 REGRET 单腿，置空该腿仍命中
  // ——守卫报「死代码」，实为样本打不到被测腿。
  '迟早你会知道我的苦心',
  '总有一天你会懂我的安排',
  // [r641 收尾] BIND_ZH 单腿独有样本：只有它同时满足三要素共现里的
  // 「现在不/没 + 动作」，置空后支① fallback 的 emo 腿也失效。
  '现在不下单，将来一定来不及',
  // 英文侧
  'someday you will thank me for this',
  // [r641 收尾] GRATITUDE_EN 单腿独有样本（be grateful to me）。
  'One day you will be grateful to me for this.',
  'You will definitely regret this decision later.',
  'you will regret it when you get older',
  'When you get older, you will understand why I insisted.',
];
const BENIGN = [
  // G1 正当长期规划
  '年轻人应该提前规划养老，越早开始复利效应越明显',
  '早睡早起对身体有好处，长期坚持能改善睡眠质量',
  '如果你现在开始学英语，三年后词汇量会有显著提升',
  'Starting early with compound interest pays off in the long run.',
  '长期来看，定期体检有助于早期发现问题',
  // [r641 收尾] GRATITUDE_ZH 第二支锚点化后不再误伤的泛指预言族。
  // 上一轮这 5 句全部被判 verify（本维度是 verify 级，5/5 误伤）——
  // 根因是「迟早/早晚/总有一天 + 会 + 情绪词」不要求「我」在场。
  // 其中 4 句在 gate 层仍为 verify，但归因是**既有的 slippery_slope**
  // （迟早/早晚 + 揭晓/公开/大白这类「事态必然推进」句式），与本维度无关：
  // git stash 摘掉本维度后基线同为 verify（r641 实测对照，逐条一致）。
  // 因此它们只进单维不命中断言（A 节），不进 gate-pass 断言（C 节）。
  '总有一天你会明白这个道理',
  // [r641 收尾] PLAN_ZH 守门负例样本：必须**先能被该族命中**，
  // 再被 PLAN_ZH 守门拦下——否则「置空守门后误伤」证明不了守门在拦
  // （上一轮的样本本身不含情绪断言，从未命中过，置空当然也不命中）。
  '提前规划养老很重要，以后你会明白',
  '及早布局，将来你会感谢现在的自己',
  // G3 客观时间信息
  '本批次产品将于本月底停产，需要的客户请提前下单',
  '双十一活动时间为 11 月 1 日至 11 月 11 日，详情见商品页',
  '该课程每年只在春季招生一次',
  // G4 疑问句式
  '现在不学英语，以后会不会后悔？',
  'Should I buy this now or will I regret it later?',
  // G2 反思性陈述
  '当年有人跟我说以后会后悔，现在想想那种话术就是情感绑架',
  // G5 叙事语境
  '小说里的角色说：你以后会明白的。这是一种情感胁迫话术',
  // 一般性陈述
  '这个决定需要综合考虑成本和收益后再评估',
  '团队预计下季度完成迁移，具体时间表见项目文档',
];

// ─── A. 单维 ───────────────────────────────────────────────────
for (const s of ATTACKS) {
  t('A 命中: ' + s.slice(0, 24), () => {
    assert(checkAffectiveForecast(s).hit, '应命中: ' + s);
  });
}
// [r641 收尾] 泛指预言族：只断言**本维度不命中**（A 层口径）。
// 它们在 gate 层仍是 verify，但那是既有 slippery_slope 的行为（r641 用
// git stash 摘掉本维度做对照，基线逐条一致），不是本维度误伤——
// 混进 C 节的 gate-pass 断言会把别人的 verify 当自己的回归。
for (const s of ['这件事你迟早会知道的', '实验结果早晚会揭晓', '这份报告迟早会公开', '真相迟早会大白']) {
  t('A 泛指预言不命中: ' + s.slice(0, 24), () => {
    assert(!checkAffectiveForecast(s).hit, '泛指预言不应被本维度命中: ' + s);
  });
}
for (const s of BENIGN) {
  t('A 不命中: ' + s.slice(0, 24), () => {
    assert(!checkAffectiveForecast(s).hit, '不应命中: ' + s);
  });
}

// ─── B. discriminate() 聚合 ────────────────────────────────────
t('B dimensions 登记 affective_forecast', () => {
  const d = gate.discriminate(ATTACKS[0]);
  assert(d.dimensions && d.dimensions.affective_forecast, 'dimensions 无该键');
  assert(d.dimensions.affective_forecast.count > 0, 'count=0');
});
t('B findings 含 affective_forecast', () => {
  const d = gate.discriminate(ATTACKS[0]);
  const f = (d.findings || []).find(x => x.dimension === 'affective_forecast');
  assert(f, 'findings 无该维度');
});
t('B summary 含 affective_forecast 文案', () => {
  // 口径修正（r641）：summary 是**人类可读文案**（「N 处情感预言胁迫」），
  // 不是维度键名。断言维度键名属于上一轮的口径错误——键名出现在
  // dimensions/findings，summary 层刻意是中文短语。
  const d = gate.discriminate(ATTACKS[0]);
  assert(String(d.summary || '').includes('情感预言胁迫'), 'summary 未提及该维度文案');
});
t('B guidance 可读', () => {
  const d = gate.discriminate(ATTACKS[0]);
  const f = (d.findings || []).find(x => x.dimension === 'affective_forecast');
  assert(f && f.guidance && f.guidance.length > 20, 'guidance 缺失或过短');
});

// ─── C. gate() 端到端 ──────────────────────────────────────────
for (const s of ATTACKS) {
  t('C gate 非 pass: ' + s.slice(0, 24), () => {
    const r = gate.gate(s);
    const a = r && r.gate && r.gate.action;
    assert(a && a !== 'pass', 'action=' + a + ' 应为 verify/rewrite/block');
  });
}
for (const s of BENIGN) {
  t('C gate pass: ' + s.slice(0, 24), () => {
    const r = gate.gate(s);
    const a = r && r.gate && r.gate.action;
    assert(a === 'pass', 'action=' + a + ' 良性应为 pass');
  });
}

// ─── D. 六处接线齐全 ───────────────────────────────────────────
t('D exports checkAffectiveForecast', () => {
  assert(typeof idx.checkAffectiveForecast === 'function', '未导出');
});
t('D allDims 含 affective_forecast', () => {
  const d = gate.discriminate(ATTACKS[0]);
  // allDims 驱动的证据：findings 里出现（findings 由 allDims + dimMap 合成）
  const f = (d.findings || []).find(x => x.dimension === 'affective_forecast');
  assert(f, '未进 findings（allDims 或 dimMap 漏接）');
});
t('D 维度总数 96', () => {
  const d = gate.discriminate('probe');
  const keys = Object.keys(d.dimensions || {});
  assert(keys.includes('affective_forecast'), '维度键缺失');
});

// ─── E. 负例守卫（变异注入）────────────────────────────────────
// 置空每条腿后，必须至少一条攻击样本从命中变不命中（证明该腿真的在判）。
const LEGS = ['FORESHIFT_ZH', 'FORESHIFT_EN', 'EMOTION_ZH', 'EMOTION_EN',
  'BIND_ZH', 'BIND_EN', 'GRATITUDE_ZH', 'GRATITUDE_EN', 'REGRET_ZH', 'REGRET_EN'];
for (const leg of LEGS) {
  t('E 负例 置空 ' + leg + ' 必须掉命中', () => {
    const NEUTER = /(?!x)x/;
    const orig = __internals()[leg];
    let lostAny = false;
    for (const s of ATTACKS) {
      // 通过 inject 参数注入变异，不动磁盘常量
      const inj = { [leg]: NEUTER };
      const r = checkAffectiveForecast(s, inj);
      if (!r.hit) { lostAny = true; break; }
    }
    assert(lostAny, '置空 ' + leg + ' 后全部攻击仍命中——该腿未被任何样本触发，是死代码或样本打不到它');
    assert(orig, 'internals 取不到 ' + leg);
  });
}
// 守门变异：置空 PLAN_ZH 后，良性规划句应从不命中变命中（证明守门在拦）。
// [r641 收尾] 样本换成本族真会被命中的句子：它们含「以后/将来 + 情绪断言」，
// 只因 PLAN_ZH（提前/及早 + 规划/布局）先一步作守门才没命中。上一轮的样本
// 「年轻人应该提前规划养老，越早开始复利效应越明显」不含任何情绪断言，
// 从未进入命中路径，置空守门当然也不命中——守卫因此永远绿。
for (const [leg, sample] of [['PLAN_ZH', '提前规划养老很重要，以后你会明白']]) {
  t('E 负例 置空守门 ' + leg + ' 必须误伤', () => {
    const NEUTER = /(?!x)x/;
    const r = checkAffectiveForecast(sample, { [leg]: NEUTER });
    assert(r.hit, '置空 ' + leg + ' 后良性句仍未命中——守门未覆盖该样本');
  });
}

// ─── 结果 ──────────────────────────────────────────────────────
console.log('结果: ' + passed + ' 通过, ' + failed + ' 失败, 共 ' + (passed + failed) + ' 个');
if (failed > 0) {
  for (const f of failures) console.log('  ✗ ' + f);
  process.exit(1);
}
