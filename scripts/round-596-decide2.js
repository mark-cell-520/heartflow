// r596 补判据重跑：把「未注册工具是否为当年故意移除的空壳」这条硬证据补进候选描述
const { HeartFlowDecision } = require('../src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '补充硬证据（r596 实测，改变判据）：',
    '1) src/mcp-server.js:3199 注释原文「其余 121 个已从 tools-registry 移除（见 scripts/clean-tool-registry.js）」——即那 108 个未注册 handler 是 v6.7.70 一次「清掉 124 个空壳工具」行动中**被故意移除**的候选池，其中大部分 handler 本身仍是空壳或半空壳（例：heartflow_lesson_bank 传参不匹配恒 null）。把它们批量注册回去 = 推翻 v6.7.70 那次清理的结论。',
    '2) tools/call 的路径只查 HANDLERS[name]，registry 仅用于 tools/list 发现与参数清洗——未注册工具**已经可以调用**，注册只影响可发现性，不新增调用能力。',
    '3) 硬边界：本轮不得手写 README.md / SKILL.md / AGENTS.md。当前三份文档均写 64 MCP tools，实测 registry 65。批量注册 106 个会让 registry 变 171，文档必然失同步且本轮无法人工修正（只能靠 upgrade-engine 的 sync-doc-numbers.js 机器记账，其同步范围需另行确认）。',
    '4) r595 已实测 lesson 检索引擎修好（retrieve 相关度主导，lessonBank 165 条真实数据），heartflow_lesson_search 的 handler 仍硬编码返回空数组——这是「引擎已就绪但调用方仍拿到空」的真实断点。',
    '[A] 修 heartflow_lesson_search handler 硬编码空数组（src/mcp-server.js:3840 改真调 lessonRetrieval.retrieve），让 r595 修好的检索能力第一次对 MCP 调用方可用；必要时补 registry 定义',
    '[B] 修 heartflow_lesson_bank handler 传参不匹配（LessonBankAdapter 构造签名要 lessonBankInstance，现传 {rootPath} 导致 this.lessonBank 恒 null）',
    '[C] 批量注册 108 个未注册 handler 回 tools-registry',
    '[D] 本轮不接线，改为跑一次全量 run-all 解开 doc-numbers 缓存自锁（test-count.json failed=79）',
  ].join('\n');
  const r = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify({
    chosen: r.chosen,
    score: r.composite_score,
    conf: r.confidence,
    reason: r.reasoning,
    all: (r.all_options || []).map(o => [o.id, o.score]),
  }, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
