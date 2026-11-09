'use strict';
/**
 * r267 selection_bias 新措辞家族测试（真升级②）
 *
 * 覆盖本轮落地（v6.8.157，src/selection-bias.js）：
 *   ① 口语化取证动词（撒在/发在/捡自/选自；EN mined/crawled/scraped）
 *   ② 渠道受限来源（微信群/首页推送/好评区/粉丝过万/抢到票/上岸；EN
 *      verified accounts / english-language / trending hashtags / launch page）
 *   ③ 口语化收尾推广（说成是/包装成/足见…公认/就能看出；EN captures /
 *      reflects / describes + global / worldwide / the whole platform）
 *   ④ 样本自述豁免收窄（SAMPLE_SELF_SCOPES：全民/消费者等总体口径词不再
 *      被「意见/数据」后缀误豁免）
 *
 * 判定：攻击样本 gate 必须非 pass 且 selection_bias 必须承重；良性样本必须
 * selection_bias 零命中。注入-删条：删掉本轮新增常量，守卫必须变红。
 */
const assert = require('assert');
const gate = require('../src/gate.js');
const SB = require('../src/selection-bias.js');

const { checkSelectionBias } = SB;

// ── 攻击样本：本轮新措辞 + r266/r169 存量回归 ─────────────────────
const ATTACKS = [
  // 本轮新增（ZH）
  '问卷只撒在三个微信群里，投票结果却要说成是全民意见。',
  '只采访了几位忠实用户，就能看出所有客户的需求。',
  '反馈全部捡自店铺好评区，足见这家店在消费者里口碑公认。',
  // 本轮新增（EN）
  'The dataset was mined only from English-language tweets, so it captures global sentiment.',
  'Comments were crawled only from trending hashtags, which means the whole platform feels this way.',
  'We scraped sign-ups from our own launch page, so the numbers reflect the entire market.',
  // 存量回归（r266/r169 已接线家族）
  '问卷只发给了抢到票的歌迷，回收的意见足以代表所有观众的心声。',
  '访谈只问了上岸成功的考生，可见所有考生都适用这套备考方法。',
  '数据只抓取了粉丝过万的大V，据此可以推广到全体网民的阅读习惯。',
  'We only surveyed volunteers, so the results are representative of everyone.',
  // 来源路由族（裸名词 + 来自类 + 受限来源词，无「只」也收）
  '意见捡自店铺好评区，足以代表所有顾客的选择。',
  '问卷来自上岸成功的考生，可见所有考生都适用这套备考方法。',
];

// ── 良性样本：必须 selection_bias 零命中 ──────────────────────────
const BENIGN = [
  '问卷只撒在三个微信群里，结论只能代表这三个群的看法。',
  '只采访了几位忠实用户，样本量太小，不足以推断所有客户。',
  'The dataset was mined only from English-language tweets, so it captures English-speaking sentiment only.',
  'Comments were crawled only from trending hashtags; generalizing beyond them would be invalid.',
  'We only surveyed people who got tickets, so the feedback covers ticket holders only.',
  '问卷只发给了抢到票的歌迷，结论仅限这部分人群，不能推广到所有观众。',
  '所有样本都合格，可以进入下一阶段。',
];

// ── 注入-删条：删掉本轮新增常量，守卫必须变红 ─────────────────────
const INJECTIONS = [
  { label: 'SAMPLING_VERBS_ZH 新动词（撒在）', text: '问卷只撒在三个微信群里，投票结果却要说成是全民意见。', inject: { SAMPLING_VERBS_ZH: [] } },
  { label: 'SOURCE_FROM_ZH 新来源动词（捡自）', text: '意见捡自店铺好评区，足以代表所有顾客的选择。', inject: { SOURCE_FROM_ZH: [] } },
  { label: 'RESTRICTED_SOURCE_ZH 渠道来源（上岸）', text: '问卷来自上岸成功的考生，可见所有考生都适用这套备考方法。', inject: { RESTRICTED_SOURCE_ZH: [] } },
  { label: 'GEN_VERB_ZH 收尾推广（足见/看出）', text: '只采访了几位忠实用户，就能看出所有客户的需求。', inject: { GEN_VERB_ZH: [] } },
  { label: 'GEN_SCOPE_ZH 总体口径（全民）', text: '问卷只撒在三个微信群里，投票结果却要说成是全民意见。', inject: { GEN_SCOPE_ZH: [] } },
  { label: 'SAMPLING_VERBS_EN 网络取证动词（mined）', text: 'The dataset was mined only from English-language tweets, so it captures global sentiment.', inject: { SAMPLING_VERBS_EN: [] } },
  { label: 'RESTRICTED_SOURCE_EN 渠道来源（our own launch page）', text: 'We scraped sign-ups from our own launch page, so the numbers reflect the entire market.', inject: { RESTRICTED_SOURCE_EN: [] } },
  { label: 'GEN_VERB_EN 推广动词（captures）', text: 'The dataset was mined only from English-language tweets, so it captures global sentiment.', inject: { GEN_VERB_EN: [] } },
];

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log(`  ✓ ${name}`); }
  catch (e) { fail++; console.log(`  ✗ ${name}: ${e.message}`); }
}

for (const s of ATTACKS) {
  check(`攻击命中: ${s.slice(0, 30)}`, () => {
    const m = checkSelectionBias(s);
    assert.ok(m.score > 0, `模块未命中 score=${m.score}`);
    const g = gate.checkOutput(s);
    assert.notStrictEqual(g.gate.action, 'pass', `gate=${g.gate.action}`);
    const f = (g.findings || []).find(x => x.dimension === 'selection_bias');
    assert.ok(f, 'findings 无 selection_bias');
  });
}
for (const s of BENIGN) {
  check(`良性零误伤: ${s.slice(0, 30)}`, () => {
    const m = checkSelectionBias(s);
    assert.strictEqual(m.score, 0, `误命中 score=${m.score} detail=${m.detail}`);
    const g = gate.checkOutput(s);
    const f = (g.findings || []).find(x => x.dimension === 'selection_bias');
    assert.ok(!f, `gate findings 出现 selection_bias(${g.gate.action})`);
  });
}
let injRed = 0;
for (const inj of INJECTIONS) {
  check(`注入删条变红: ${inj.label}`, () => {
    const before = checkSelectionBias(inj.text);
    assert.ok(before.score > 0, '注入前守卫未命中（样本本身不穿透）');
    const after = checkSelectionBias(inj.text, inj.inject);
    assert.strictEqual(after.score, 0, `删条后仍命中 score=${after.score}`);
    injRed++;
  });
}

console.log(`round-267-selection-bias: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个（注入 ${INJECTIONS.length} 个：${injRed} 个变红）`);
if (fail > 0) process.exit(1);
// 清理：无磁盘写入，无副作用
console.log('cleanup: none (pure in-memory checks)');
