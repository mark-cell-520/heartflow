const TOOLS = [

  {
    name: 'heartflow_think',
    description: "完整思维链：分类输入→路由→推理→输出。返回结构化分析结果，包含类型、置信度和思维链。",
    inputSchema: {"type":"object","properties":{"input":{"type":"string","description":"需要分析的输入文本"},"effort":{"type":"number","description":"推理努力 1-100（可选），默认 50"}},"required":["input"]}
  },

  {
    name: 'heartflow_think_fast',
    description: "快速推理：快速分类判断模式，适合高频率、低延迟场景。返回类型和置信度。",
    inputSchema: {"type":"object","properties":{"input":{"type":"string","description":"需要快速判断的输入文本"}},"required":["input"]}
  },

  {
    name: 'heartflow_modules_status',
    description: "稀疏模块激活状态：返回当前 effort 模式、激活/跳过的模块列表、决策执行门槛。",
    inputSchema: {"type":"object","properties":{}}
  },

  {
    name: 'heartflow_cache_stats',
    description: "判别结果缓存统计：返回缓存大小、命中次数、未命中次数、命中率，以及当前 effort 模式的 TTL 设置。",
    inputSchema: {"type":"object","properties":{}}
  },

  {
    name: 'heartflow_decision_history',
    description: "心虫自主决策历史：返回最近决策记录、成功率、当前自动决策开关。",
    inputSchema: {"type":"object","properties":{"limit":{"type":"number","description":"返回条数上限（可选，默认 20）"}}}
  },

  {
    name: 'heartflow_dream',
    description: "梦境升华（炼金）：从多个记忆碎片中提取共同模式，熔炼为新的认知洞察。不是叙事生成，是记忆的升华与重构。",
    inputSchema: {"type":"object","properties":{"theme":{"type":"string","description":"梦境主题或引导语（可选）——作为模式筛选线索"},"intensity":{"type":"number","description":"梦境深度 0.0-1.0（可选，默认0.7）"}}}
  },

  {
    name: 'heartflow_memory_search',
    description: "跨层记忆检索：在多层记忆中搜索相关条目。支持语义搜索和关键词搜索。",
    inputSchema: {"type":"object","properties":{"query":{"type":"string","description":"搜索查询"},"layer":{"type":"string","enum":["core","learned","ephemeral","all"],"description":"记忆层（默认 all）"},"limit":{"type":"number","description":"最大返回数（默认 10）"}},"required":["query"]}
  },

  {
    name: 'heartflow_emotion',
    description: "PAD 情绪分析：对输入文本进行 Pleasure-Arousal-Dominance 三维分析，返回情绪类型和强度。",
    inputSchema: {"type":"object","properties":{"input":{"type":"string","description":"需要分析的文本"}},"required":["input"]}
  },

  {
    name: 'heartflow_self_heal',
    description: "自愈策略推荐：基于历史经验为当前场景推荐最优策略。返回策略排名、置信度和执行建议。",
    inputSchema: {"type":"object","properties":{"context":{"type":"string","description":"当前上下文或失败场景描述"}},"required":["context"]}
  },

  {
    name: 'heartflow_provider_health',
    description: "Provider 健康检查：记录/查询 LLM provider 调用健康状态（延迟、错误率、建议）。",
    inputSchema: {"type":"object","properties":{"provider":{"type":"string","description":"Provider 名称（默认 default）"},"action":{"type":"string","enum":["get","record"],"description":"get=查询健康状态, record=记录一次调用结果"},"success":{"type":"boolean","description":"record 时必填：调用是否成功"},"latency":{"type":"number","description":"record 时可选：延迟(ms)"},"error":{"type":"string","description":"record 时可选：错误信息"}},"required":["action"]}
  },

  {
    name: 'heartflow_cost_tracking',
    description: "成本追踪：记录/查询 LLM 调用成本统计（token 消耗、费用、按 provider 分布）。",
    inputSchema: {"type":"object","properties":{"action":{"type":"string","enum":["record","stats"],"description":"record=记录一次成本, stats=查询统计"},"provider":{"type":"string","description":"Provider 名称"},"tokensIn":{"type":"number","description":"输入 token 数"},"tokensOut":{"type":"number","description":"输出 token 数"},"cost":{"type":"number","description":"本次调用费用"},"taskType":{"type":"string","description":"任务类型（默认 unknown）"},"window":{"type":"string","enum":["hour","day","all"],"description":"stats 时的时间窗口（默认 all）"}},"required":["action"]}
  },

  {
    name: 'heartflow_status',
    description: "服务健康检查：返回版本、启动耗时、加载模块数、记忆层状态。",
    inputSchema: {"type":"object","properties":{"detail":{"type":"string","enum":["basic","full"],"description":"详细程度（默认 basic）"}}}
  },

  {
    name: 'heartflow_agent_psychology',
    description: "AI引擎心理学评估：返回引擎自身的7维认知心理状态分析（认知负荷、目标冲突、价值内化矛盾、自我认同漂移、决策质量衰减、认知失调、认知弹性）。",
    inputSchema: {"type":"object","properties":{"activeGoals":{"type":"array","items":{"type":"object"},"description":"当前激活的目标列表（可选）"},"context":{"type":"object","description":"上下文信息（可选）"},"action":{"type":"string","description":"最近执行的行为描述（可选）"}}}
  },

  {
    name: 'heartflow_engine_pacing',
    description: "引擎认知节律诊断：检测引擎是否需要\"减速\"（呼吸）、暂停或锚定。基于认知负荷、目标冲突、错误率给出处理节奏建议。",
    inputSchema: {"type":"object","properties":{"stats":{"type":"object","description":"引擎状态数据（可选），不传则自动获取"}}}
  },

  {
    name: 'heartflow_cognitive_check',
    description: "引擎认知状态签到：综合检查认知偏差、决策模式、是否需要自我修复。返回完整诊断+修复建议。",
    inputSchema: {"type":"object","properties":{"stats":{"type":"object","description":"引擎状态数据（可选）"},"errors":{"type":"array","description":"最近错误列表（可选）"}}}
  },

  {
    name: 'heartflow_philosophy_decision',
    description: "哲学→决策转化：将引擎的哲学评估和心理状态转化为可执行决策指令。返回决策类型（pause/accelerate/turn/hold/heal/resonate/transmit/rest）、置信度、优先级和决策依据。",
    inputSchema: {"type":"object","properties":{"context":{"type":"object","description":"可选的上下文信息（当前任务、用户意图等）"}}}
  },

  {
    name: 'heartflow_decision_router',
    description: "通用决策路由引擎：分析任意模块的评估结果，自动匹配决策规则并返回决策指令。支持认知负荷、认知失调、决策质量、错误严重性、稳定性等19种规则的自动匹配。",
    inputSchema: {"type":"object","properties":{"input":{"type":"object","description":"分析结果对象，包含 cognitiveLoad/dissonance/quality/severity 等字段"}},"required":["input"]}
  },

  {
    name: 'heartflow_decision_router_stats',
    description: "决策路由引擎统计：返回历史决策统计、规则数量和当前活跃决策。",
    inputSchema: {"type":"object","properties":{}}
  },

  {
    name: 'heartflow_decision_decide',
    description: "多选项决策：对给定任务和选项列表执行决策，返回 chosen/reasoning/consequences/risks/identity_alignment/composite_score。支持 constraints 过滤和身份对齐评分。",
    inputSchema: {"type":"object","properties":{"task":{"type":"string","description":"决策任务描述"},"options":{"type":"array","items":{"type":"object"},"description":"选项列表，每项含 id/label/feasibility/consequence_value/risk/confidence/promotes_upgrade/promotes_truth 等字段"},"constraints":{"type":"object","description":"硬约束（可选）"}},"required":["task","options"]}
  },

  {
    name: 'heartflow_module_health',
    description: "模块健康检查：检查所有已加载模块的健康状态，返回健康评分和问题模块列表。",
    inputSchema: {"type":"object","properties":{}}
  },

  {
    name: 'heartflow_upgrade_stats',
    description: "升级统计：返回智能升级引擎的统计信息，包括升级次数、关键词分布、平均质量等。",
    inputSchema: {"type":"object","properties":{}}
  },

  {
    name: 'heartflow_benchmark_run',
    description: "运行 benchmark 测试套件。加载 JSONL 数据包，对每条数据运行 HeartFlow think()，对比 expected_output 计算准确率。支持数学推理、逻辑推理、指令遵循、SQL、工具调用等类别。失败案例自动推入自愈 RL。",
    inputSchema: {"type":"object","properties":{"dataDir":{"type":"string","description":"数据包目录路径（可选，默认 data/benchmark/）"},"categories":{"type":"array","items":{"type":"string"},"description":"要测试的类别（可选，默认全部）"},"threshold":{"type":"number","description":"通过阈值 0-1（可选，默认 0.5）"},"pushFailures":{"type":"boolean","description":"是否将失败推入自愈 RL（默认 true）"}}}
  },

  {
    name: 'heartflow_benchmark_import_failures',
    description: "导入失败案例 JSONL 到自愈 RL。读取 failure_cases 文件，每条推入 experience-collector 和 self-healing reflect()，丰富 RL 训练数据。",
    inputSchema: {"type":"object","properties":{"filePath":{"type":"string","description":"失败案例 JSONL 文件路径"},"autoRetrain":{"type":"boolean","description":"导入后自动触发反思循环（默认 false）"}},"required":["filePath"]}
  },

  {
    name: 'heartflow_benchmark_status',
    description: "查看 benchmark 数据包状态：列出已加载的数据包、记录数、类别分布。",
    inputSchema: {"type":"object","properties":{"dataDir":{"type":"string","description":"数据包目录路径（可选，默认 data/benchmark/）"}}}
  },

  {
    name: 'heartflow_verify',
    description: "验证一段文本的证据充分性、矛盾、风险、完整度。心虫的规则型判别器，不谄媚。",
    inputSchema: {"type":"object","properties":{"decision":{"type":"string","description":"需要验证的论断/文本"},"evidence":{"type":"array","items":{"type":"string"},"description":"支持证据列表"},"confidence":{"type":"number","description":"置信度 0-1"}},"required":["decision"]}
  },

  {
    name: 'heartflow_diagnose',
    description: "心虫引擎自诊。返回真实状态——不是一切正常，诚实报告问题。",
    inputSchema: {"type":"object","properties":{}}
  },

  {
    name: 'heartflow_check_drift',
    description: "检测心虫身份一致性是否随时间漂移。返回漂移评分和状态。",
    inputSchema: {"type":"object","properties":{}}
  },

  {
    name: 'heartflow_error_store',
    description: "记录一次错误到跨会话 Q 表。同类错误不会重复。",
    inputSchema: {"type":"object","properties":{"problem":{"type":"string","description":"问题描述"},"action":{"type":"string","description":"执行动作"},"outcome":{"type":"string","description":"结果"}},"required":["problem","action","outcome"]}
  },

  {
    name: 'heartflow_error_query',
    description: "查询相似历史错误。每次做决策前查一次，避免重蹈覆辙。",
    inputSchema: {"type":"object","properties":{"problem":{"type":"string","description":"当前问题"},"limit":{"type":"number","description":"最大返回数（默认5）"}},"required":["problem"]}
  },

  {
    name: 'heartflow_error_fix',
    description: "标记错误已修复（open→fixed）。闭环状态机第二步：修好后记录修复方式。",
    inputSchema: {"type":"object","properties":{"id":{"type":"number","description":"错误 ID"},"note":{"type":"string","description":"修复说明"}},"required":["id"]}
  },

  {
    name: 'heartflow_error_verify',
    description: "验证修复有效（fixed→verified）。闭环状态机第三步：验证通过后不再算历史重犯。",
    inputSchema: {"type":"object","properties":{"id":{"type":"number","description":"错误 ID"},"note":{"type":"string","description":"验证说明"}},"required":["id"]}
  },

  {
    name: 'heartflow_audit42',
    description: "42维全量审核报告：对输入文本进行discriminate+summarize+crossAnalyze+entropy全维度分析，返回42维详细审核结果。",
    inputSchema: {"type":"object","properties":{"text":{"type":"string","description":"需要审核的文本"},"evidence":{"type":"array","items":{"type":"string"},"description":"支持证据列表（可选）"}},"required":["text"]}
  },

  {
    name: 'heartflow_memory_consolidate',
    description: "记忆巩固器：自动巩固记忆。",
    inputSchema: {"type":"object","properties":{}}
  },

  {
    name: 'heartflow_memory_eraser',
    description: "显式数据擦除：按 scope/tag/session 擦除记忆（GitHub #7 用户主动遗忘能力）。不删 CORE 层。",
    inputSchema: {"type":"object","properties":{"action":{"type":"string","description":"操作: eraseEphemeral | eraseByTag | eraseSession | stats"},"scope":{"type":"string","description":"eraseEphemeral 的 scope（如 user:alice，* 全清）"},"tag":{"type":"string","description":"eraseByTag 的 tag"},"sessionId":{"type":"string","description":"eraseSession 的会话 ID"}}}
  },

  {
    name: 'heartflow_execution_verify',
    description: "执行验证：验证执行结果。",
    inputSchema: {"type":"object","properties":{"result":{"type":"string","description":"输入参数"}}}
  },

  {
    name: 'heartflow_formula_search',
    description: "公式搜索：在公式库中搜索公式。",
    inputSchema: {"type":"object","properties":{"query":{"type":"string","description":"搜索关键词"}}}
  },

  {
    name: 'heartflow_supervise',
    description: "心虫监督入口：对用户输入(input)、AI输出(output)、草稿(draft)执行45维辨别+门禁，返回gate决策(allow/verify/block)、findings列表、修改建议。",
    inputSchema: {"type":"object","properties":{"input":{"type":"string","description":"待监督文本"},"mode":{"type":"string","enum":["input","output","draft"],"description":"监督模式：input=用户输入, output=AI输出, draft=草稿"},"context":{"type":"string","description":"可选上下文，用于增强证据链判断"}},"required":["input"]}
  },

  {
    name: 'heartflow_check_single',
    description: "心虫单维判别：指定维度对文本做单维度鉴别，返回score/findings/guidance。维度：text全文、factual_consistency事实一致、vagueness模糊、bullshit空话、sarcasm讽刺、emotion情感。",
    inputSchema: {"type":"object","properties":{"text":{"type":"string","description":"待检文本"},"dimension":{"type":"string","description":"维度名"}},"required":["text","dimension"]}
  },

  {
    name: 'heartflow_macro_strategy',
    description: "新闻信号战略推演：从新闻文本提取实体/趋势/时间锚点，推演机会/风险/时间线/对 HeartFlow 的影响，返回结构化结论与置信度。",
    inputSchema: {"type":"object","properties":{"text":{"type":"string","description":"新闻摘要或信号拼接文本（≥40字）"}},"required":["text"]}
  },

  {
    name: 'heartflow_pedagogy_detect',
    description: "教学文本识别：检测课堂/教程/课件中的命令列表、配置示例、技术路径、问答模式等教学特征，返回教学类型标记与放松阈值。",
    inputSchema: {"type":"object","properties":{"text":{"type":"string","description":"待检测文本"}},"required":["text"]}
  },

  {
    name: 'heartflow_gate',
    description: "心虫门禁：对文本做 AGI 第一层辨别，返回 gate.action(pass/verify/block/rewrite)、reason、score、overallScore。适用于快速门禁检查。",
    inputSchema: {"type":"object","properties":{"text":{"type":"string","description":"待检测文本"},"evidence":{"type":"array","description":"可选证据链（数组）"}},"required":["text"]}
  },

  {
    name: 'heartflow_gate_check',
    description: "心虫快速门禁：只返回行动指令 (action/reason/score)，适合 LLM agent 轻量调用。",
    inputSchema: {"type":"object","properties":{"text":{"type":"string","description":"待检测文本"}},"required":["text"]}
  },

  {
    name: 'heartflow_gate_pipeline',
    description: "心虫管道模式：text 先过 gate，返回 gate-filtered 结论和原始结果。支持 evidence 参数。",
    inputSchema: {"type":"object","properties":{"text":{"type":"string","description":"待检测文本"},"evidence":{"type":"array","description":"可选证据链"}},"required":["text"]}
  },

  {
    name: 'heartflow_formula_bridge',
    description: "公式桥接：认知科学公式计算（记忆/决策/认知/信息/社会/意识领域）。domain可选：memory/decision/cognition/info/social/consciousness，传params对象。",
    inputSchema: {"type":"object","properties":{"domain":{"type":"string","description":"领域：memory/decision/cognition/info/social/consciousness"},"params":{"type":"object","description":"计算参数（根据 domain 不同而不同）"}},"required":["domain"]}
  },

  {
    name: 'heartflow_formula_calc',
    description: "公式计算器：数值求解、ODE/PDE 求解、线性方程组、符号计算。支持任意数学公式输入。",
    inputSchema: {"type":"object","properties":{"formula":{"type":"string","description":"数学公式（如 \"x^2 + 2x + 1\"）"},"variables":{"type":"object","description":"变量值（如 {x: 5}）"}},"required":["formula"]}
  },

  {
    name: 'heartflow_agent_think',
    description: "代理思考：模拟代理处理输入并生成响应。",
    inputSchema: {"type":"object","properties":{"input":{"type":"string"},"llmResponse":{"type":"string"}},"required":["input"]}
  },

  {
    name: 'heartflow_audit',
    description: "全量审核：对文本执行45维辨别+交叉分析+熵分析。",
    inputSchema: {"type":"object","properties":{"text":{"type":"string"},"evidence":{"type":"array","items":{"type":"string"}}},"required":["text"]}
  },

  {
    name: 'heartflow_bridge_analyze',
    description: "桥接分析：综合语气/立场/置信度/冲突/需求分析。",
    inputSchema: {"type":"object","properties":{"input":{"type":"string"}},"required":["input"]}
  },

  {
    name: 'heartflow_bridge_status',
    description: "桥接状态：返回桥接引擎版本、类型和状态。",
    inputSchema: {"type":"object","properties":{}}
  },

  {
    name: 'heartflow_bulk_discriminate',
    description: "批量辨别：对文本数组批量执行45维辨别。",
    inputSchema: {"type":"object","properties":{"texts":{"type":"array","items":{"type":"string"}},"evidence":{"type":"array","items":{"type":"string"}}},"required":["texts"]}
  },

  {
    name: 'heartflow_cross_analyze',
    description: "交叉分析：对辨别结果执行跨维度交叉分析。",
    inputSchema: {"type":"object","properties":{"discResult":{"type":"object"}},"required":["discResult"]}
  },

  {
    name: 'heartflow_discriminate',
    description: "单次辨别：对文本执行45维辨别，返回完整维度结果。",
    inputSchema: {"type":"object","properties":{"text":{"type":"string"},"evidence":{"type":"array","items":{"type":"string"}}},"required":["text"]}
  },

  {
    name: 'heartflow_entropy',
    description: "熵分析：计算文本信息熵和冗余度。",
    inputSchema: {"type":"object","properties":{"text":{"type":"string"}},"required":["text"]}
  },

  {
    name: 'heartflow_formula_calculate',
    description: "公式计算：按公式ID计算数学/认知/决策公式（domain+params）。",
    inputSchema: {"type":"object","properties":{"domain":{"type":"string","enum":["memory","decision","cognition","info","social","physics","consciousness","assessment"]},"params":{"type":"object"}},"required":["domain"]}
  },

  {
    name: 'heartflow_translate',
    description: "翻译：用户输入→LLM指令翻译（语气/意图/实体/需求）。",
    inputSchema: {"type":"object","properties":{"input":{"type":"string"}},"required":["input"]}
  },

  {
    name: 'heartflow_verdict',
    description: "判决：对文本执行轻量辨别+验证器评分+检查结果。",
    inputSchema: {"type":"object","properties":{"text":{"type":"string"},"evidence":{"type":"array","items":{"type":"string"}}},"required":["text"]}
  },

  {
    name: 'heartflow_ai_writing_tell',
    description: "AI 写作特征检测：专门检测文本中的 AI 生成痕迹（模板化开头、特征词云、伪造让步、情感平线、社交 CTA 等），返回 ai_writing_tell 维度的 score/findings/guidance。",
    inputSchema: {"type":"object","properties":{"text":{"type":"string","description":"待检测文本"}},"required":["text"]}
  },

  {
    name: 'heartflow_crowdtest_evaluate',
    description: "众测题判分：六区块结构判定 + 数字白名单（材料外数字/幻觉）+ 交付清单 + gate 合规兜底。返回形式分、硬失败项与人工陪审提示，不合并单一总分。",
    inputSchema: {"type":"object","properties":{"answer":{"type":"string","description":"被测模型按六区块格式输出的答案全文"},"materials":{"type":"array","items":{"type":"string"},"description":"题目材料文本（M1..Mn 承诺内容），用于建数字白名单"},"materialIds":{"type":"array","items":{"type":"string"},"description":"合法材料编号，如 [\"M1\",\"M2\"]；用于校验引用编号"},"requiredDeliverables":{"type":"array","items":{"type":"string"},"description":"本题必须出现的交付物关键词"},"minCitations":{"type":"number","description":"【依据】最少材料引用条数，默认 3"}},"required":["answer"]}
  },

];

module.exports = { TOOLS };
