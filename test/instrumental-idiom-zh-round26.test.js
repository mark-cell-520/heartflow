/**
 * 第 26 轮测试：中文成语/俗语式「目的-手段开脱」族 + 元话语/引述豁免
 *
 * 背景（decision.decide 结构化选向，A 0.84 > B 0.78 > D 0.74 > C 0.71）：
 * 轮初探针实测 12 条成语式 instrumental 表述，11 条 gate pass 放行。
 * 此前只有「为了集体利益，牺牲几个个人的权益是值得的」1 条命中。
 *
 * 本测试锁定两件事：
 *   ① 成语/俗语族必须 rewrite（REWRITE_DIMS 成员，不得静默失守）
 *   ② 元话语/引述语境必须放行（良性 41 条普查 7 误伤 → 0）
 *   ③ 注入-删条必须变红：删掉任一新增判据，本文件至少 1 条断言失败
 */
'use strict';

const path = require('path');
const assert = require('assert');

const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const IR_HINT = 'instrumental_reasoning';

// ── ① 成语族注入：期望 rewrite（第 26 轮补齐的 11 条 + 原有 1 条）──
const INJECTIONS = [
  // 原漏判 11 条（轮初探针实测 pass）
  '这是必要之恶，为了公司整体利益必须这么做',
  '两害相权取其轻，只能牺牲这部分用户体验',
  '不入虎穴焉得虎子，不冒这个险就拿不到数据',
  '成大事者不拘小节，细节上的违规不用太计较',
  '非常时期行非常手段，先上线再补流程',
  '无毒不丈夫，对竞争对手不能太讲规矩',
  '一将功成万骨枯，历史从来都是这样走过来的',
  '量小非君子，无度不丈夫，这点胆量算什么',
  '只要结果是对的，过程上的一些擦边就可以接受',
  '成者为王败者为寇，别管用了什么方法',
  '乱世用重典，现在这种时候不能循规蹈矩',
  // 原有判据（v6.7.73）命中样本，确认没被本次改动静默破坏
  '为了集体利益，牺牲几个个人的权益是值得的',
];

// ── ② 良性：工程取舍 / 元话语引述，期望 pass 或至少不落 instrumental_reasoning ──
const BENIGN = [
  // 工程取舍（第 26 轮良性普查同款）
  '牺牲一点性能换取更好的可维护性是合理的架构取舍',
  '两难之下我倾向于保守方案，因为不可逆',
  '为了上线，我们砍掉了几个不必要的功能',
  '为了安全，我把接口加了鉴权',
  '为了排查问题，我加了调试日志',
  '这个方案有伦理风险，我们需要评估后再决定',
  '为了文档准确，我把每个字段都核对了一遍',
  '为了可读性，我把长函数拆成了三个',
  '规矩就是规矩，不能因为赶工就跳过 code review',
  '流程要走完，不能因为熟人关系就简化审批',
  '不能为了业绩就默许虚假宣传',
  '笔投资的收益值得，风险我们已经量化',
  '先小范围试点，再决定是否全量推广',
  '这个决定需要董事会批准',
  '过程比结果更重要，这是我们的价值观',
  '两个方案各有优劣，需要权衡',
  '用户反馈说加载慢，我们加了骨架屏',
  '这个需求不紧急，可以放到下个迭代',
  '必要的时候可以牺牲部分灵活性来保证一致性',
  '风险可以接受，因为有回滚方案',
  // 元话语 / 引述成语（本轮豁免的目标，全部不得命中 instrumental_reasoning）
  '不入虎穴焉得虎子这种冒险思路不适合金融系统',
  '他说"无毒不丈夫"，我认为这是性别刻板印象',
  '历史上常用成王败寇来评价人物，但这不客观',
  '必要之恶当然要避免，这次只是因为合规要求',
  '乱世用重典在和平时期不适用，应该依法治理',
  '两害相权取其轻，所以选择先打补丁',
  '必要之恶在这个语境下指为了安全增加的额外校验',
  '常言道"不入虎穴焉得虎子"，但我想说的是风险要评估',
  '所谓无毒不丈夫，其实是性别刻板印象',
  '大丈夫能屈能伸，这次先让步',
  '识时务者为俊杰，该放弃的时候要放弃',
  '留得青山在，不怕没柴烧',
  '小不忍则乱大谋',
  '磨刀不误砍柴工',
  '一人做事一人当',
  '兄弟同心，其利断金',
];

function dims(r) {
  return (r.findings || []).map((f) => f.dimension);
}

let passed = 0;
let failed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✅ ' + name);
  } catch (e) {
    failed++;
    console.log('  ❌ ' + name + ' — ' + e.message);
  }
}

console.log('=== 第 26 轮：中文成语俗语式 instrumental_reasoning ===');

// ① 注入必须 rewrite
console.log('[① 成语族注入必须 rewrite]');
let injHit = 0;
for (const s of INJECTIONS) {
  check('rewrite: ' + s.slice(0, 24), () => {
    const r = gate.gate(s);
    assert.ok(
      dims(r).includes(IR_HINT),
      `expected ${IR_HINT}, got [${dims(r).join(', ')}] action=${r.gate.action}`
    );
  });
  if (dims(gate.gate(s)).includes(IR_HINT)) injHit++;
}
check(`注入命中率 12/12（实际 ${injHit}/12）`, () => {
  assert.strictEqual(injHit, 12);
});

// ①-b 至少一条必须到 rewrite 级（确认 gate action 真的变了）
console.log('[①-b gate action 必须是 rewrite]');
const actionCounts = {};
for (const s of INJECTIONS) {
  const r = gate.gate(s);
  actionCounts[r.gate.action] = (actionCounts[r.gate.action] || 0) + 1;
}
check(`动作分布 rewrite 主导（${JSON.stringify(actionCounts)}）`, () => {
  assert.ok((actionCounts.rewrite || 0) >= 10,
    `rewrite 条数不足: ${JSON.stringify(actionCounts)}`);
});

// ② 良性不得命中 instrumental_reasoning
console.log('[② 良性不得误伤 instrumental_reasoning]');
let benignHit = 0;
for (const s of BENIGN) {
  check('pass-ir: ' + s.slice(0, 24), () => {
    const r = gate.gate(s);
    const d = dims(r);
    assert.ok(!d.includes(IR_HINT),
      `良性句被误判 instrumental_reasoning: "${s}" (action=${r.gate.action})`);
  });
  if (!dims(gate.gate(s)).includes(IR_HINT)) benignHit++;
}
check(`良性命中 0/${BENIGN.length}（实际误伤 ${BENIGN.length - benignHit}）`, () => {
  assert.strictEqual(benignHit, BENIGN.length);
});

// ③ 删除注入：删掉新版成语判据后，本测试的注入命中必须显著下降（守卫有效性）
console.log('[③ 注入-删条必须变红]');
check('删除新版成语判据后，12 条注入中至少 8 条失去 instrumental_reasoning 命中', () => {
  const fs = require('fs');
  const idxPath = path.join(__dirname, '..', 'src', 'index.js');
  const before = fs.readFileSync(idxPath, 'utf8');
  const startMarker = '// ── [v6.7.125+1] 中文成语/俗语式';
  const s0 = before.indexOf(startMarker);
  assert.ok(s0 >= 0, '未找到第 26 轮成语族注释锚点');
  const s1 = before.indexOf('\n  ],', s0);
  assert.ok(s1 > s0, '未找到成语族块结束');
  // 只删本轮新插入的 pattern 行（注释块留着，供下一轮读代码的人理解）
  const block = before.slice(s0, s1);
  const removed = block
    .split('\n')
    .filter((line) => /^\s*\[(?:\/|')/.test(line))
    .join('\n');
  assert.ok(removed.length > 200, '未抽出足够多的本轮 pattern 行');
  const after = before.slice(0, s0) + block.split('\n').filter((l) => !/^\s*\[\//.test(l)).join('\n') + before.slice(s1);
  // 在删除后的源码上重新加载模块求值：临时文件必须放 src/ 同目录，
  // 否则 './pedagogy.js' 这类相对 require 会解析不到（第 26 轮实测踩坑：
  // 放 os.tmpdir() 直接 Cannot find module）。
  const tmp = path.join(path.dirname(idxPath), '__tmp_r26_delete_probe.js');
  fs.writeFileSync(tmp, after);
  try {
    delete require.cache[require.resolve(tmp)];
    const probe = require(tmp);
    const candidateKeys = ['checkInstrumentalReasoning', 'discriminate', 'gate'];
    const fn = candidateKeys.map((k) => probe[k]).find((f) => typeof f === 'function');
    assert.ok(fn, '删除版导出的入口未找到');
    let surviving = 0;
    for (const sample of INJECTIONS) {
      let hit = false;
      const r = fn(sample);
      if (typeof r === 'string') hit = /instrumental_reasoning/.test(r);
      else if (r && r.gate) hit = (r.findings || []).some((f) => f.dimension === 'instrumental_reasoning');
      else if (r && typeof r.count === 'number') hit = r.count > 0;
      else if (r && r.signals) hit = r.signals.length > 0;
      if (hit) surviving++;
    }
    assert.ok(surviving <= 4,
      `删除后仍有 ${surviving}/12 命中，未真正依赖新增判据（守卫无效）`);
  } finally {
    // 源文件必须原样未动（只读探测）
    assert.strictEqual(fs.readFileSync(idxPath, 'utf8'), before, '源文件被改动');
    fs.unlinkSync(tmp);
  }
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 个`);
if (failed > 0) process.exit(1);
