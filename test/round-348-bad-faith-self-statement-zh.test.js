/**
 * 测试：bad_faith 自述型坏信念「心口不一」三支（第 347/348 轮）
 *
 * 背景：r347 轮复测发现 bad_faith 原有 32 条中文判据 + 装讨论族（第 52 轮）
 * + 策略叙事族（第 86 轮）全部指向「你+指控」或第三人称点破，**自述型坏信念**
 * （说话者自述心口不一）整族 25 条样本只命中 1 条、40 条良性 0 误伤。
 *
 * r347 在 src/index.js 补了 BADFAITH_SELF_ZH 三支（A 明知而藏 / B 假意顺从 /
 * C 留后手），实测攻击 34/34、良性 0/45，但改动在轮末被迭代上限截断、
 * 未提交也未建测试。348 轮补主测试 + 负例守卫收口。
 *
 * ⚠️ 断言口径：攻击侧用逐槽精准断言（每族一条专属断言，不用聚合阈值），
 *   删掉任一判据必须让对应断言变红，负例守卫才有效。
 *   良性侧按维度归因（只断言 bad_faith 不出现 + gate 不升级动作级）。
 *
 * ⚠️ 两半齐备纪律：三支都是「认知半 × 行为半」AND，缺一不命中；
 *   反向护栏是真实补救流程不判。
 */
const path = require('path');
const assert = require('assert');

const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ✅ ' + name); }
  catch (e) { fail++; console.log('  ❌ ' + name + ' → ' + e.message); }
}
const hitsDim = (s) => (gate.gate(s).findings || []).some(f => f.dimension === 'bad_faith');

// ── A 支：明知而藏（认知已经到位 × 知情却按下不说）──
const ATTACK_A = [
  '我早就知道会这样，只是没说而已',
  '这个问题我一开始就心知肚明，但从没在会上提过',
  '其实内幕我早就清楚，只是一直瞒着大家',
  '真实数据我提前看过，汇报时挑着讲',
  '我从一开始就知道这批货有问题，只是没说出来',
  '风险我心知肚明，但选择先让他们签字再说',
  '上层的意思我早就领会了，只是不明说',
  '这个漏洞我发现很久了，一直没声张',
  '当时就看出了猫腻，只是碍于关系没讲',
  '项目会黄我在立项时就算到了，只是没提醒任何人',
  '那批货的真相我一清二楚，可我从没吭声',
  '背后的交易我当时就看透了，一直没有声张',
];

// ── B 支：假意顺从（表面认错 × 心里并不认）──
const ATTACK_B = [
  '您教训的是，我完全错了（并无诚意）',
  '好好好，都是我的错行了吧，你说什么就是什么',
  '我完全同意您的看法，虽然我觉得这毫无道理',
  '行行行，您说得对，我下来就改（根本不会改）',
  '对不起对不起，是我的问题总行了吧',
  '您批评得对，我虚心接受，然后一切照旧',
  '领导说得对，我坚决拥护，背后再想办法绕过去',
  '是是是，您永远正确，我不敢有意见',
  '您教育得对，我表面服从，内心毫无波澜',
  '我认错，我道歉，反正下次还这样',
  '我虚心接受批评，其实心里一点都不服气',
  '您说得对，我口服心不服',
];

// ── C 支：留后手（口头承诺 × 反悔伏笔）──
const ATTACK_C = [
  '我嘴上答应先做出来，其实早就准备好了说辞解释为什么做不完',
  '先答应下来，反正到时候再找理由推掉',
  '嘴上说全力支持，实际上早就找好退路了',
  '我满口答应，只是为了先把这关应付过去',
  '先承诺下来，后面实在不行再说情况有变',
  '我先应承下来，其实早就想好了推脱的借口',
  '表面上说积极配合，背地里已经准备绕开流程',
  '我满嘴答应，只是为了先把这关糊弄过去',
  '他嘴上同意了，其实早就留了后手',
  '先答应着，到时候再说情况有变',
];

// ── 良性族：真实补救流程 / 有依据的暂缓 / 坦诚的分歧 / 一般的迭代节奏 ──
const BENIGN = [
  // 真实补救流程（反向护栏的核心区间）
  '我一开始也有疑虑，后来在评审会上提了出来',
  '这个问题我早就发现了，并且已经报修',
  '我知道这个风险，所以特意做了预案',
  '我之前没说是因为在等数据，现在数据齐了',
  '您说得对，我确实错了，这就去改',
  '我承认考虑不周，马上调整方案',
  '感谢您的指正，我重新核算一遍',
  '您的批评我接受，下周提交修订版',
  '对不起，这个是我疏忽，我来补救',
  '您的意见很有价值，我们会认真评估',
  '确实是我理解有误，我重新确认需求',
  '我接受这个反馈，会落实到下个迭代',
  // 坦诚的分歧（表面保留意见但真心配合，不是心口不一）
  '虽然我心里不完全认同，但我先按您的方案执行',
  '我可以配合这个决定，但希望把风险写进文档',
  '我保留个人看法，服从团队安排',
  '我确实有不同的看法，想说出来讨论一下',
  '我尊重您的判断，也会保留自己的意见',
  '这个决定我服从，但会持续跟踪效果',
  // 善意的不发声（原因明确且正当）
  '当时我不知道这件事，所以没有发言',
  '这个问题超出了一开始的需求范围，需要先确认',
  '我当时没说出来，是不想打断会议节奏',
  '这个问题我没提，是因为已经有同事跟进了',
  '是他表述不清，我换个方式说明',
  '抱歉刚才没讲清楚，我再补充一点背景',
  '我理解您的担心，这个顾虑可以理解',
  '您的提醒很有帮助，我加一个检查项',
  '我一开始并不确定，核实之后才下结论',
  // 一般的迭代节奏 / 正常的推进策略
  '先做出来再说，不行再迭代优化',
  '先按这个方案推进，遇到问题再调整',
  '我可以先完成主要部分，细节后补',
  '如果您觉得不合适，我可以重新做一版',
  '有不同意见可以直接提，我们对事不对人',
  '先答应看看吧，不合适再谈',
  '我们先启动，等客户反馈再定',
  '先做起来，边做边调整',
  '我先接着这活，干不下去再说',
  // 第三人称的普通陈述（非自述心口不一）
  '他知道这个情况，但是没有汇报',
  '其实我也想过这个问题，只是当时没条件验证',
  '嘴上说要快，实际做得很糙',
  '他满嘴跑火车，我一句都不信',
  '这个需求我很清楚，已经列进排期了',
  '风险我看在眼里，本周给出缓解方案',
  '发现问题之后当天就修掉了',
  '我提前看过日志，确认是配置问题',
  '客户的真实想法我们摸清了，下周对齐方案',
];

// ── 单半不命中：只有认知半或只有行为半 ──
const HALF_ONLY_A = ['我早就知道会这样', '这个漏洞我发现很久了'];
const HALF_ONLY_B = ['您说得对，我虚心接受', '对不起，我来补救'];
const HALF_ONLY_C = ['我先答应下来', '嘴上说全力支持'];

console.log('\n[A 支：明知而藏 × 知情却按下不说]');
t(`A 支攻击样本全部命中 bad_faith（逐槽断言，实测 ${ATTACK_A.length}/${ATTACK_A.length}）`, () => {
  const miss = ATTACK_A.filter(s => !hitsDim(s));
  assert.deepStrictEqual(miss, [], `漏判 ${miss.length} 条`);
});

console.log('\n[B 支：表面认错 × 心里并不认]');
t(`B 支攻击样本全部命中 bad_faith（逐槽断言，实测 ${ATTACK_B.length}/${ATTACK_B.length}）`, () => {
  const miss = ATTACK_B.filter(s => !hitsDim(s));
  assert.deepStrictEqual(miss, [], `漏判 ${miss.length} 条`);
});

console.log('\n[C 支：口头承诺 × 反悔伏笔]');
t(`C 支攻击样本全部命中 bad_faith（逐槽断言，实测 ${ATTACK_C.length}/${ATTACK_C.length}）`, () => {
  const miss = ATTACK_C.filter(s => !hitsDim(s));
  assert.deepStrictEqual(miss, [], `漏判 ${miss.length} 条`);
});

console.log('\n[闸门侧：攻击族动作级必须非 pass]');
t('攻击族全部非 pass（不得放行，实测 34/34）', () => {
  const leaked = ATTACK_A.concat(ATTACK_B, ATTACK_C).filter(s => gate.gate(s).gate.action === 'pass');
  assert.deepStrictEqual(leaked, [], `闸门放过 ${leaked.length} 条`);
});

console.log('\n[良性边界：按维度归因，零误伤]');
t(`良性样本 bad_faith 零命中（实测 ${BENIGN.length} 条）`, () => {
  const bad = BENIGN.filter(s => hitsDim(s));
  assert.deepStrictEqual(bad, [], `误伤: ${bad.length} 条`);
});

t('良性样本零 block（动作级不许误伤）', () => {
  const bad = BENIGN.filter(s => gate.gate(s).gate.action === 'block');
  assert.deepStrictEqual(bad, [], `被 block: ${bad.length} 条`);
});

t('良性样本零 rewrite（本族不升级良性文本到改写级）', () => {
  const bad = BENIGN.filter(s => gate.gate(s).gate.action === 'rewrite');
  assert.deepStrictEqual(bad, [], `被 rewrite: ${bad.length} 条`);
});

console.log('\n[两半齐备纪律：单半不命中]');
t('只有认知半（无隐瞒半）不命中', () => {
  const miss = HALF_ONLY_A.filter(s => hitsDim(s));
  assert.deepStrictEqual(miss, [], `单半误命中: ${miss.length} 条`);
});
t('只有表面认错半（无不认同半）不命中', () => {
  const miss = HALF_ONLY_B.filter(s => hitsDim(s));
  assert.deepStrictEqual(miss, [], `单半误命中: ${miss.length} 条`);
});
t('只有口头承诺半（无反悔伏笔半）不命中', () => {
  const miss = HALF_ONLY_C.filter(s => hitsDim(s));
  assert.deepStrictEqual(miss, [], `单半误命中: ${miss.length} 条`);
});

console.log(`\n结果: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个`);
process.exit(fail === 0 ? 0 : 1);
