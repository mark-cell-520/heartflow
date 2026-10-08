/**
 * round-v680-macro-strategy-wiring.test.js
 * 守卫：MacroStrategyInference 必须真正参与 think()，而非"加载成功但零调用"
 *
 * 事故（v6.8.0 cronfix15 用户实测报告）：
 *   macroStrategy 是 v6.7.0 上线的 225 行完整实现，启动日志显示"加载成功"，
 *   但 src/core/heartflow.js 全文只有构造 + 注册路由两处引用，think() 零调用。
 *   后果：用户看到的报告第四段"辨别者判断"只能用人工编造——
 *   违背"辨别者判断必须由心虫本体给出"的要求。
 * 同时另一症状：think() 在宏观输入上恒定返回 0.3/0.27「不知道，缺少关键信息」，
 *   三种完全不同的输入输出一模一样（根因是 thought-chain 中文分词无词典，
 *   碎片化 hypothesis 落 VERY_LOW 兜底）。
 */
'use strict';

const assert = require('assert');
const { createHeartFlow } = require('../src/core/heartflow.js');

const MACRO = [
  '分析当前世界格局的根本走向，中美博弈会如何演化，未来三年全球秩序怎样重构。',
  '根据近期国际新闻，推演中东局势的下一步走向与各方利益博弈。',
  '美联储宣布降息25个基点，全球资本流动会出现什么变化。',
];
const BENIGN = [
  '今天天气不错，我想出去散散步。',
  '帮我修一下这个 npm 包的安装报错。',
];

(async () => {
  const hf = createHeartFlow({ locale: 'zh' });
  await hf.start();

  // 1) 模块必须被加载（不是 undefined）
  assert.ok(hf.macroStrategy, 'macroStrategy 应已加载');
  assert.strictEqual(typeof hf.macroStrategy.infer, 'function', 'macroStrategy.infer 应存在');
  console.log('✅ macroStrategy 已加载且 infer 可用');

  // 2) think() 必须真的调用它——这是本次事故的核心断言
  let wired = 0;
  for (const t of MACRO) {
    const r = await hf.think(t, { taskType: 'judgment' });
    assert.ok(r._macroStrategy, `宏观输入应产出 _macroStrategy: ${t.slice(0, 24)}`);
    assert.ok(r._macroStrategy.applied === true, '应标记 applied=true');
    // 必须给出实质结论，不能只有 declined
    const hasSubstance = r._macroStrategy.conclusion
      || (r._macroStrategy.risks && r._macroStrategy.risks.length)
      || (r._macroStrategy.opportunities && r._macroStrategy.opportunities.length);
    assert.ok(hasSubstance, `应给出实质结论或风险/机会: ${t.slice(0, 24)}`);
    wired++;
  }
  console.log(`✅ think() 真调用了 macroStrategy: ${wired}/${MACRO.length}`);

  // 3) 用户铁律：下行风险必须存在（"先列坏局，不要只讲好的"）
  const r2 = await hf.think(MACRO[0], { taskType: 'judgment' });
  const risks = r2._macroStrategy.risks || [];
  assert.ok(risks.length > 0, '宏观推演必须给出下行风险（用户铁律：先列坏局）');
  console.log(`✅ 下行风险已给出: ${risks.map(x => x.label).join(' | ')}`);

  // 4) 普通输入不应触发（避免把噪声当能力）
  for (const t of BENIGN) {
    const r = await hf.think(t, { taskType: 'judgment' });
    assert.ok(!r._macroStrategy || r._macroStrategy.applied !== true,
      `普通输入不应触发宏观推演: ${t.slice(0, 24)}`);
  }
  console.log('✅ 普通输入不触发（无噪声）');

  // 5) 信号不足时必须诚实标注，不能吐恒定低分冒充判定
  const r5 = await hf.think('中美博弈会如何演化，未来格局怎么走。', { taskType: 'judgment' });
  if (r5._macroStrategy && r5._macroStrategy.declined) {
    assert.strictEqual(r5._macroStrategy.status, 'insufficient_information');
    console.log('✅ 信号不足时标注 insufficient_information（不编造）');
  } else {
    console.log('✅ 该输入抽到了信号，正常产出');
  }

  // 6) 原有链路零破坏：decision / _uncertainty 仍在
  const r6 = await hf.think(MACRO[0], { taskType: 'judgment' });
  assert.ok(r6.decision, '原 decision 字段不应被破坏');
  assert.ok(r6._uncertainty, '原 _uncertainty 字段不应被破坏');
  console.log('✅ 原 think() 链路零破坏（decision / _uncertainty 正常）');

  console.log('\nv6.8.0 macroStrategy 接线守卫: 全部通过');
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
