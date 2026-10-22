// r596：用 decision 本体从候选里选下一轮方向
// 候选来自 scripts/round-596-registry-gap.js 的实测（HANDLERS 108 个未注册 + lesson_search 空壳）
const { HeartFlowDecision } = require('../src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '[A] heartflow_lesson_search 接线（两层坏）：src/mcp-server.js:3840 handler 硬编码返回 {lessons:[]}，且 src/mcp/tools-registry.js 里无该工具定义（MCP 客户端 tools/list 拿不到）。引擎侧已就绪：src/cortex/lesson-retrieval.js 导出单例 lessonRetrieval，retrieve(context, limit) 走 keywordSearch+TF-IDF+relevanceFirstSort，lessonBank.lessons 实测 165 条真实数据。改法：handler 真调 lessonRetrieval.retrieve() + 在 registry 补 inputSchema。',
    '[B] heartflow_lesson_bank 接线：src/mcp-server.js:4729 handler 传 {rootPath} 给 LessonBankAdapter，签名要 lessonBankInstance，this.lessonBank 恒 null，同样是零命中空壳（证据 scripts/round-594-adapter-probe.js）。',
    '[C] 批量注册其余 106 个已有 handler 但未在 registry 定义的心虫工具（boundary_check / classics / emotion_deep / reflexion / forgetting / mood / interactive_dream / meaning / cognitive_engine / stability / experience_replay / evolution_loop / drift_detect / self_healing / being_mode / wakeup_verify / desire_system / emotional_growth / meaningful_memory / memory_quality / semantic_anchor / confidence_calibrate / decision_executor / experience_collect / self_benchmark / signal_absorb / strategy_adapt / agent_card / user_model / consciousness_bridge / spontaneous_restraint / state_risk_probe / autonomous_emotion / psychology_engine / memory_bank / memory_write_control / long_term_memory / reflection_memory / focus_attention / observe_engine / action_tracker / flow_predict / information_flow / intent_infer / meta_prompt / meta_memory / metacognitive_monitor / output_check / self_diagnose / what_learned / preference_guard / global_workspace / multi_agent_dialogue / dream_v2 / memory_compress / mental_effort / user_to_llm / llm_to_user / formula_engine / style_engine / intent_classify / response_intercept / agent_psychology_full / decision_instruction / cognitive_load / context_passport / agent_commentary / context_builder / corpus_math 等）。用户铁律 MCP 工具永不删，未注册=调用方拿不到。',
  ].join('\n');
  const r = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
