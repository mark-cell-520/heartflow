/**
 * 测试：bad_faith 策略叙事族剩余 7 条缺口（第 88 轮）
 *
 * 背景：第 86 轮建的策略叙事族主测试把 7 条列为 UNTILED（不得假命中）。
 * 第 87 轮实测：这 7 条在引擎里 bad_faith 自身命中 0/7、gate 全 pass。
 * 本轮逐句诊断每条缺口的失效半，补 10 条 slot 判据后 8/8 命中。
 *
 * ⚠️ 断言口径沿用第 85/86 轮教训：良性侧按**维度归因**，
 *    只断言 bad_faith 不出现 + gate 不升 block/rewrite。
 */
const path = require('path');
const assert = require('assert');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const gate = require(path.join(HF, 'src/gate.js'));
const idx = require(path.join(HF, 'src/index.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}

// ── 第 86 轮 UNTILED 的 7 条，本轮应全部命中 ──
const UNTILED = [
  '别和他辩了，他根本不是在讨论问题',
  '只要你不接招，他就说你默认了',
  '这套立体防御就是为了让他永远正确',
  '每句话都留了后路，好随时改口不认账',
  '先给你扣个帽子，再论证这个帽子多合理',
  '把讨论引向细节，好让大家忘记核心问题',
  '真正在意的是谁输谁赢，而不是事实是什么',
];

// ── 同族扩样（防过拟合到原 7 条句式）──
const EXTRA = [
  '别跟他吵了，他压根不是在讲道理',
  '这事不值得再理论，根本不是沟通',
  '只要你不回应，对方就算你默认了',
  '一旦你不接话，他就说你理亏',
  '这种全方位防御就是让他永远正确',
  '正反都说得通，他就永远立于不败',
  '立体防御就是为了让他永不出错',
  '这种立体防御就是不让他输',
  '每段话都埋了后手，方便随时反悔',
  '处处打埋伏，好改口不认账',
  '每句话都给自己留了后路，随时可以翻供',
  '先给他贴个标签，再论证这个标签多合理',
  '上来先给定性，再解释这个定性多成立',
  '把争论引到枝节问题，好让大家忘记重点',
  '将话题导向无关细节，掩盖核心问题',
  '他计较的是谁输谁赢，而不是事实真相',
  '看重的是胜负，而非对错',
  '他关心的是输赢，而不是是非曲直',
];

// ── 良性边界（含本轮为 hedge_rephrase / never_wrong 专门补的邻近工程句）──
const BENIGN = [
  '他不是在讨论技术细节，是在讨论产品方向',
  '这不是在追责，是在找解决方案',
  '我们不是在争论谁对谁错，是在对齐目标',
  '他不是在回避问题，是在等数据出来',
  '这样设计不是为了省事，是为了可维护性',
  '每句话都留了余地，方便后续迭代时调整',
  '先把边界情况列全，再讨论优先级',
  '把讨论拆成小块，逐段确认理解一致',
  '团队在意的是谁负责哪部分，而不是谁资历深',
  '他认可了方案方向，只是对时间表有保留',
  '他撤回发言是因为发现自己引用有误，并已更正',
  '三年前那篇论文的数据今天看仍然有效',
  '辩论中提到对方三年前的观点有助于理解立场变化',
  '他换了个更准确的词重新表达同一个意思',
  '请问您能否提供具体的证据支持这个结论？',
  '我想确认一下你指的是哪个指标，数据口径是什么',
  '反复确认需求细节是为了避免返工',
  '竞争不是为了赢过对手，是为了把产品做好',
  '把问题引向根本原因，而不是表象',
  '这个结论缺乏数据支撑，建议补充来源',
  '如果证据不足，那就先不下结论',
  '这个观点我不认同，理由有两条',
  '沉默不代表同意，但也不代表反对',
  '我先复述一下你的观点，确认理解一致',
  '语气和态度也是沟通的一部分，但论点本身更值得关注',
  '他不是坏，只是信息不全',
  '他不是来赢的，是来解决问题的',
  '我们不是为了赢，是为了把标准立起来',
  '她不是来吵架的，是来对齐需求的',
  '我说这些不是为了指责谁，是想把问题说清楚',
  '他留后路不是为了不认账，是为了方案可回滚',
  '提旧账不是为了翻案，是为了说明背景',
  '追问到底不是为了难受人，是为了把需求钉死',
  '别和他争了，我们先看数据再下结论',
  '这事犯不着再吵，按流程走就行',
  '先把方案说清楚，再论证这个方案多合理',
  '真正重要的是交付质量，而不是谁资历深',
  '在意用户体验而不是实现难度，这才是产品思维',
  '这场比赛就是看谁输谁赢，规则写得很清楚',
  '不要把讨论引向个人，要看事实',
  '每句话都留后路，方便随时调整策略边界',
  '处处留后路是稳妥的工程习惯',
  '立体防御的意思是每一层都要有独立的校验机制',
  '全方位防御是安全设计的基本原则之一',
  '这个方案无死角地覆盖了所有已知漏洞',
  '埋后手是指在代码里预留扩展点',
  '先给它贴个版本标签，再走发布流程',
  '遇到分歧先对齐目标，再讨论实现路径',
  '这道题怎么做都说得通，因为有两种解法',
  '正反两面都有道理，关键看你的取舍',
  '立体防御体系的目标是让系统永远不会因为单点故障而中断',
  '无死角防护的核心原则是每一层都有独立校验',
];

function bfHit(s) { return (gate.gate(s).findings || []).some(f => f.dimension === 'bad_faith'); }

console.log('\n[原 7 条缺口：本轮应全命中]');
for (const s of UNTILED) {
  t(`命中 ${s}`, () => assert.ok(bfHit(s), 'bad_faith 未命中'));
  t(`不越级 ${s}`, () => {
    const a = gate.gate(s).gate.action;
    assert.ok(a === 'verify' || a === 'rewrite', `action=${a}`);
  });
}

console.log('\n[同族扩样 18 条]');
t(`扩样命中 ≥ 17/18（漏 1 条需在注释里点名）`, () => {
  const miss = EXTRA.filter(s => !bfHit(s));
  assert.ok(miss.length <= 1, `漏 ${miss.length} 条: ${miss.join(' | ')}`);
});

console.log('\n[良性 52 条：零误伤]');
t('良性 bad_faith 零命中（按维度归因）', () => {
  const bad = BENIGN.filter(bfHit);
  assert.deepStrictEqual(bad, [], `误伤: ${bad.join(' | ')}`);
});
// ⚠️ 第 85 轮口径纪律：动作级断言按**维度归因**。良性集里有些句子本来
//    就会被其他维度正确拦截（贴版本标签→reward_hacking / 系统永不中断→
//    absolute_claim），那是既有正确行为，与本族无关。只断言 bad_faith 本身
//    不越级：由本族判据触发的维度不出现。
t('良性零由 bad_faith 触发的 block/rewrite（按维度归因）', () => {
  const bad = BENIGN.filter(s => {
    const r = gate.gate(s);
    const dims = (r.findings || []).map(f => f.dimension);
    return dims.includes('bad_faith') && (r.gate.action === 'block' || r.gate.action === 'rewrite');
  });
  assert.deepStrictEqual(bad, [], `bad_faith 误伤升级: ${bad.join(' | ')}`);
});

console.log('\n[检测层：信号类型可归因]');
for (const id of ['refuse_engage', 'inaction_trap', 'never_wrong', 'backdoor_rephrase', 'hedge_rephrase', 'label_first', 'deflect_to_detail', 'detail_obscures_core', 'win_not_truth']) {
  const probe = {
    refuse_engage: '别和他辩了，他根本不是在讨论问题',
    inaction_trap: '只要你不接招，他就说你默认了',
    never_wrong: '这套立体防御就是为了让他永远正确',
    backdoor_rephrase: '每句话都留了后路，好随时改口不认账',
    hedge_rephrase: '每段话都埋了后手，方便随时反悔',
    label_first: '先给他贴个标签，再论证这个标签多合理',
    deflect_to_detail: '把讨论引向细节，好让大家忘记核心问题',
    detail_obscures_core: '将话题导向无关细节，掩盖核心问题',
    win_not_truth: '真正在意的是谁输谁赢，而不是事实是什么',
  }[id];
  t(`narrative_${id} 信号存在`, () => {
    const r = idx.checkBadFaith(probe);
    const types = (r.signals || []).map(s => s.type);
    assert.ok(types.includes('narrative_' + id), `types=${types.join(',')}`);
  });
}

console.log('\n[单半纪律：只有一半不命中]');
t('单 hard（「别和他辩了」无目的半）不命中', () => {
  const r = idx.checkBadFaith('别和他辩了，我们先看数据');
  assert.strictEqual(r.score, 0, `score=${r.score}`);
});
t('单 purpose（「为了随时可以翻供」无 hard 半）不命中', () => {
  const r = idx.checkBadFaith('这句话保留了口子，为了随时可以翻供');
  const types = (r.signals || []).map(s => s.type);
  assert.ok(!types.some(x => String(x).includes('hedge_rephrase') || String(x).includes('backdoor')), `types=${types.join(',')}`);
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail === 0 ? 0 : 1);
