const hf = require('./src/gate.js');

async function run() {
  const items = [
    '未来3个月AI Agent将进入企业核心业务流， coding/browser/客服/法律/招聘成为主流变现场景',
    '全球头部AI Agent公司收入暴涨， Cursor ARR 5亿美元， Manus被Meta收购后因监管被迫撤销',
    'Gartner预测2026年底40%企业应用内置task-specific agent，较2025年<5%大幅提升',
    '风险：agent安全、幻觉、监管、数据隐私、过度自动化、岗位替代争议上升',
    '未来三个月核心观察：Manus拆分回归独立运营后的策略、企业agent从试点转生产后的可靠性事件、各国AI agent监管细则落地'
  ];
  for (const t of items) {
    const r = await hf.runPipeline({ input: t, mode: 'fast' });
    const out = {
      input: t.slice(0, 40),
      action: r.gate?.action,
      score: r.overallScore,
      verdict: r.verdict,
      top: (r.findings || []).slice(0, 3).map(f => ({ dimension: f.dimension, severity: f.severity }))
    };
    console.log(JSON.stringify(out));
  }
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
