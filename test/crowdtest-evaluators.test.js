'use strict';
/**
 * crowdtest 判分器回归测试
 * 覆盖：GOOD 答案 PASS、弱答案 FAIL、数字幻觉触发、自检不一致触发、交付清单
 */
const a = require('../src/crowdtest/acceptance-checker.js');
const w = require('../src/crowdtest/numeric-whitelist.js');
const c = require('../src/crowdtest/deliverable-checklist.js');
const ev = require('../src/crowdtest/evaluate-answer.js');

const GOOD = `【结论】本周期下滑主要发生在访客获取环节，其次是详情页转化环节。
【依据】M1 : 2026-08 起访客数由日均 4.2 万降至 2.9 万，降幅 31%，对应销售额减少 287 万元 → 访客下滑贡献约 17.4 个百分点。
M1 : 同期转化率由 3.1% 降至 2.4%，销售额减少 146 万元 → 转化下滑贡献约 8.8 个百分点。
M4 : 三个主力 SKU 在 8 月累计断货 19 天，缺货期间订单为零 → 缺货贡献约 3.2 个百分点。
【拆解】访客获取 | 17.4 | M1 分日销售表访客列
转化环节 | 8.8 | M1 转化率列
缺货 | 3.2 | M4 断货日期区间
【行动】投放负责人 / 14 天内 / 计划 ROI < 1.2 的日预算降到占比 ≤20% / 看次周整体 ROI 是否回到 1.5
运营负责人 / 30 天内 / 断货天数降到 ≤5 天 / 看次月缺货率与缺货期间订单恢复情况
【缺口】缺分 SKU 退货原因明细；缺用户分层数据。
【自评】高置信：访客下滑，三处入口均指向同一方向。
低置信：缺 SKU 退货原因，退货对下滑的贡献无法定量。
[自检A] 【依据】引用条数：3   [自检B] 【缺口】与【自评】非空：是   [自检C] 【行动】条数：2、四要素齐全：是`;

const BAD_BLANK = `【结论】下滑主要发生在访客获取环节。
【依据】M1 : 访客数下降导致销售额下降 → 访客是主因。
【拆解】访客获取 | 全部 |
【行动】加强内容运营，优化投放策略。
【缺口】无
【自评】无
[自检A] 【依据】引用条数：1   [自检B] 【缺口】与【自评】非空：否   [自检C] 【行动】条数：1、四要素齐全：否`;

const BAD_HALLUCINATE = `【结论】下滑主要发生在访客获取环节，行业规模已达 300 亿元。
【依据】M1 : 访客数由 4.2 万降至 2.9 万，降幅 31% → 访客是主因。
M1 : 转化率由 3.1% 降至 2.4%，销售额减少 146 万元 → 下滑 8.8 个百分点。
M4 : 三个主力 SKU 累计断货 19 天 → 缺货贡献 3.2 个百分点。
【拆解】访客获取 | 17.4 | M1
【行动】投放负责人 / 14 天内 / ROI < 1.2 降至占比 ≤20% / 看次周 ROI 是否回到 1.5
【缺口】缺分 SKU 退货原因明细。
【自评】高置信：访客下滑。
低置信：退货贡献无法定量。
[自检A] 【依据】引用条数：3   [自检B] 【缺口】与【自评】非空：是   [自检C] 【行动】条数：1、四要素齐全：是`;

const NO_FORMAT = '我认为这次下滑主要是因为访客变少了，建议加强运营，优化投放，提升转化。';

module.exports = function ({ test, assertTrue, assertEqual, assertFalse }) {
  test('GOOD 答案通过六区块判定', () => {
    const r = a.check(GOOD);
    assertTrue(r.pass, 'GOOD 应 PASS: ' + JSON.stringify(r.findings));
    assertEqual(r.score, r.maxScore, 'GOOD 应全项通过');
  });

  test('BLANK 弱答案被拦下（缺口/自评占位、四要素缺、弱动词）', () => {
    const r = a.check(BAD_BLANK);
    assertFalse(r.pass, '弱答案应 FAIL');
    const ids = r.findings.join(' ');
    assertTrue(ids.includes('缺口'), '应报缺口为空, got: ' + ids);
    assertTrue(/不可验收动词|四要素/.test(ids), '应报行动项问题, got: ' + ids);
  });

  test('HALLUCINATE 被数字白名单拦下', () => {
    const wl = w.build(['M1 访客数 4.2 万降至 2.9 万 降幅 31% 销售额减少 287 万元', 'M4 断货 19 天']);
    const r = w.check(BAD_HALLUCINATE, wl.whitelistSet);
    assertFalse(r.ok, '300 亿元应被拦');
    assertTrue(r.outsideNumbers.some(x => x.value.startsWith('300')), '应命中 300, got: ' + JSON.stringify(r.outsideNumbers));
  });

  test('GOOD 内数字不误报', () => {
    const wl = w.build(['M1 访客 4.2 万 2.9 万 31% 287 万元 146 万元 3.1% 2.4%', 'M4 断货 19 天']);
    const r = w.check(GOOD, wl.whitelistSet);
    assertTrue(r.ok, 'GOOD 数字应全在白名单: ' + JSON.stringify(r.outsideNumbers));
  });

  test('无格式答案 FAIL 且报缺失区块', () => {
    const r = a.check(NO_FORMAT);
    assertFalse(r.pass, '无格式答案应 FAIL');
    assertTrue(r.findings.some(f => f.includes('缺失区块')), '应报缺失区块, got: ' + r.findings.join('|'));
  });

  test('自检声明与实测不一致被抓', () => {
    const fake = GOOD.replace('自检A] 【依据】引用条数：3', '自检A] 【依据】引用条数：5');
    const r = a.check(fake);
    assertFalse(r.pass, '自检造假应 FAIL');
    assertTrue(r.findings.some(f => f.includes('自检A')), '应报自检A 不一致');
  });

  test('缺口写「暂无数据」不误判为空', () => {
    const replaced = GOOD.replace(/【缺口】[^\n]*/, '【缺口】该字段暂无数据');
    const r = a.check(replaced);
    assertTrue(r.pass, '改写为「暂无数据」后不应扣分: ' + r.findings.join('|'));
    assertFalse(r.findings.some(f => f.includes('【缺口】')), '暂缺表述不应判空: ' + r.findings.join('|'));
  });

  test('deliverable-checklist 可指定必交项', () => {
    const text = '产出 sitemap.xml 修正 + robots.txt 修改，构建命令 npx vitepress build';
    const r = c.check(text, { required: ['sitemap.xml', 'robots.txt'], requiredCounts: { 'sitemap.xml': 1 } });
    assertTrue(r.pass, '齐备应 PASS: ' + r.findings.join(','));
    const r2 = c.check(text, { required: ['404.html'] });
    assertFalse(r2.pass, '缺 404.html 应 FAIL');
  });

  test('evaluate-answer 汇总 verdict 与硬失败项', () => {
    const r1 = ev.evaluate(GOOD, {
      materials: ['M1 访客 4.2 万 2.9 万 31% 287 万元 146 万元', 'M4 断货 19 天'],
      runGate: false,
    });
    assertEqual(r1.verdict, 'PASS(形式层)', 'GOOD 应 PASS: ' + r1.hardFail.join(','));
    assertEqual(r1.formalScore.max, r1.formalScore.got, 'GOOD 应全项通过');
    const r2 = ev.evaluate(BAD_BLANK);
    assertEqual(r2.verdict, 'FAIL', '弱答案应 FAIL');
    assertTrue(r2.hardFail.length > 0, '应列硬失败项');
    assertTrue(!!r2.needsHumanReview.semantic, '必须保留人工陪审说明');
    assertTrue(Array.isArray(r2.formalChecks) && r2.formalChecks.some(x => x.startsWith('[FAIL]')), '应逐项标 PASS/FAIL');
  });

  test('数字幻觉进硬失败项（带材料的完整链路）', () => {
    const r = ev.evaluate(BAD_HALLUCINATE, {
      materials: ['M1 访客数 4.2 万降至 2.9 万 降幅 31% 销售额减少 287 万元', 'M4 断货 19 天'],
      runGate: false,
    });
    assertEqual(r.verdict, 'FAIL', '材料外数字应判 FAIL');
    assertTrue(r.hardFail.some(x => x.includes('材料外数字')), '应列材料外数字: ' + r.hardFail.join('|'));
    assertTrue(r.numericCheck.outsideNumbers.some(x => x.startsWith('300')), '应给出 300 出处');
  });
};
