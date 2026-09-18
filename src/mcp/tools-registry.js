const TOOLS = [

  {

    name: 'heartflow_think',

    description: '完整思维链：分类输入→路由→推理→输出。返回结构化分析结果，包含类型、置信度和思维链。',

    inputSchema: { type: 'object', properties: { input: { type: 'string', description: '需要分析的输入文本' }, effort: { type: 'number', description: '推理努力 1-100（可选），默认 50' } }, required: ['input'] }

  },

  {

    name: 'heartflow_think_fast',

    description: '快速推理：快速分类判断模式，适合高频率、低延迟场景。返回类型和置信度。',

    inputSchema: { type: 'object', properties: { input: { type: 'string', description: '需要快速判断的输入文本' } }, required: ['input'] }

  },

  {

    name: 'heartflow_modules_status',

    description: '稀疏模块激活状态：返回当前 effort 模式、激活/跳过的模块列表、决策执行门槛。',

    inputSchema: { type: 'object', properties: {} }

  },

  {

    name: 'heartflow_dream',

    description: '梦境升华（炼金）：从多个记忆碎片中提取共同模式，熔炼为新的认知洞察。不是叙事生成，是记忆的升华与重构。',

    inputSchema: { type: 'object', properties: { theme: { type: 'string', description: '梦境主题或引导语（可选）——作为模式筛选线索' }, intensity: { type: 'number', description: '梦境深度 0.0-1.0（可选，默认0.7）' } } }

  },

  {

    name: 'heartflow_memory_search',

    description: '跨层记忆检索：在多层记忆中搜索相关条目。支持语义搜索和关键词搜索。',

    inputSchema: { type: 'object', properties: { query: { type: 'string', description: '搜索查询' }, layer: { type: 'string', enum: ['core', 'learned', 'ephemeral', 'all'], description: '记忆层（默认 all）' }, limit: { type: 'number', description: '最大返回数（默认 10）' } }, required: ['query'] }

  },

  {

    name: 'heartflow_emotion',

    description: 'PAD 情绪分析：对输入文本进行 Pleasure-Arousal-Dominance 三维分析，返回情绪类型和强度。',

    inputSchema: { type: 'object', properties: { input: { type: 'string', description: '需要分析的文本' } }, required: ['input'] }

  },

  {

    name: 'heartflow_boundary_check',
    description: '心虫跨界写入门禁：检查一次文件写入是否越界到其他 agent 的地盘（.claude/.agents/.openclaw 等）。返回 BLOCK/WARN/ALLOW。用于 Hermes 等宿主在写文件前监督。',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: '要写入的目标路径' },
        actor: { type: 'string', description: '执行写入的 agent 名' },
        purpose: { type: 'string', description: '写入目的' }
      },
      required: ['filePath']
    },
    name: 'heartflow_self_heal',

    description: '自愈策略推荐：基于历史经验为当前场景推荐最优策略。返回策略排名、置信度和执行建议。',

    inputSchema: { type: 'object', properties: { context: { type: 'string', description: '当前上下文或失败场景描述' } }, required: ['context'] }

  },

  {

    name: 'heartflow_provider_health',

    description: 'Provider 健康检查：记录/查询 LLM provider 调用健康状态（延迟、错误率、建议）。',

    inputSchema: {

      type: 'object',

      properties: {

        provider: { type: 'string', description: 'Provider 名称（默认 default）' },

        action: { type: 'string', enum: ['get', 'record'], description: 'get=查询健康状态, record=记录一次调用结果' },

        success: { type: 'boolean', description: 'record 时必填：调用是否成功' },

        latency: { type: 'number', description: 'record 时可选：延迟(ms)' },

        error: { type: 'string', description: 'record 时可选：错误信息' }

      },

      required: ['action']

    }

  },

  {

    name: 'heartflow_cost_tracking',

    description: '成本追踪：记录/查询 LLM 调用成本统计（token 消耗、费用、按 provider 分布）。',

    inputSchema: {

      type: 'object',

      properties: {

        action: { type: 'string', enum: ['record', 'stats'], description: 'record=记录一次成本, stats=查询统计' },

        provider: { type: 'string', description: 'Provider 名称' },

        tokensIn: { type: 'number', description: '输入 token 数' },

        tokensOut: { type: 'number', description: '输出 token 数' },

        cost: { type: 'number', description: '本次调用费用' },

        taskType: { type: 'string', description: '任务类型（默认 unknown）' },

        window: { type: 'string', enum: ['hour', 'day', 'all'], description: 'stats 时的时间窗口（默认 all）' }

      },

      required: ['action']

    }

  },

  {

    name: 'heartflow_status',

    description: '服务健康检查：返回版本、启动耗时、加载模块数、记忆层状态。',

    inputSchema: { type: 'object', properties: { detail: { type: 'string', enum: ['basic', 'full'], description: '详细程度（默认 basic）' } } }

  },

  {

    name: 'heartflow_agent_psychology',

    description: 'AI引擎心理学评估：返回引擎自身的7维认知心理状态分析（认知负荷、目标冲突、价值内化矛盾、自我认同漂移、决策质量衰减、认知失调、认知弹性）。',

    inputSchema: { type: 'object', properties: { activeGoals: { type: 'array', items: { type: 'object' }, description: '当前激活的目标列表（可选）' }, context: { type: 'object', description: '上下文信息（可选）' }, action: { type: 'string', description: '最近执行的行为描述（可选）' } } }

  },

  {

    name: 'heartflow_engine_pacing',

    description: '引擎认知节律诊断：检测引擎是否需要"减速"（呼吸）、暂停或锚定。基于认知负荷、目标冲突、错误率给出处理节奏建议。',

    inputSchema: { type: 'object', properties: { stats: { type: 'object', description: '引擎状态数据（可选），不传则自动获取' } } }

  },

  {

    name: 'heartflow_cognitive_check',

    description: '引擎认知状态签到：综合检查认知偏差、决策模式、是否需要自我修复。返回完整诊断+修复建议。',

    inputSchema: { type: 'object', properties: { stats: { type: 'object', description: '引擎状态数据（可选）' }, errors: { type: 'array', description: '最近错误列表（可选）' } } }

  },

  // v3.0.1 — 哲学→决策转化器

  {

    name: 'heartflow_philosophy_decision',

    description: '哲学→决策转化：将引擎的哲学评估和心理状态转化为可执行决策指令。返回决策类型（pause/accelerate/turn/hold/heal/resonate/transmit/rest）、置信度、优先级和决策依据。',

    inputSchema: { type: 'object', properties: {

      context: { type: 'object', description: '可选的上下文信息（当前任务、用户意图等）' }

    } }

  },

  // v3.0.2 — 通用决策路由引擎

  {

    name: 'heartflow_decision_router',

    description: '通用决策路由引擎：分析任意模块的评估结果，自动匹配决策规则并返回决策指令。支持认知负荷、认知失调、决策质量、错误严重性、稳定性等19种规则的自动匹配。',

    inputSchema: { type: 'object', properties: {

      input: { type: 'object', description: '分析结果对象，包含 cognitiveLoad/dissonance/quality/severity 等字段' }

    }, required: ['input'] }

  },

  {

    name: 'heartflow_decision_router_stats',

    description: '决策路由引擎统计：返回历史决策统计、规则数量和当前活跃决策。',

    inputSchema: { type: 'object', properties: {} }


  },
  {
    name: 'heartflow_decision_decide',
    description: '多选项决策：对给定任务和选项列表执行决策，返回 chosen/reasoning/consequences/risks/identity_alignment/composite_score。支持 constraints 过滤和身份对齐评分。',
    inputSchema: { type: 'object', properties: { task: { type: 'string', description: '决策任务描述' }, options: { type: 'array', items: { type: 'object' }, description: '选项列表，每项含 id/label/feasibility/consequence_value/risk/confidence/promotes_upgrade/promotes_truth 等字段' }, constraints: { type: 'object', description: '硬约束（可选）' } }, required: ['task', 'options'] }
  },
  // v3.1.0 新增工具
  {
    name: 'heartflow_module_health',

    description: '模块健康检查：检查所有已加载模块的健康状态，返回健康评分和问题模块列表。',

    inputSchema: { type: 'object', properties: {} }

  },

  {

    name: 'heartflow_upgrade_stats',

    description: '升级统计：返回智能升级引擎的统计信息，包括升级次数、关键词分布、平均质量等。',

    inputSchema: { type: 'object', properties: {} }

  },

  // v3.2.0 — Benchmark 基准测试

  {

    name: 'heartflow_benchmark_run',

    description: '运行 benchmark 测试套件。加载 JSONL 数据包，对每条数据运行 HeartFlow think()，对比 expected_output 计算准确率。支持数学推理、逻辑推理、指令遵循、SQL、工具调用等类别。失败案例自动推入自愈 RL。',

    inputSchema: { type: 'object', properties: {

      dataDir: { type: 'string', description: '数据包目录路径（可选，默认 data/benchmark/）' },

      categories: { type: 'array', items: { type: 'string' }, description: '要测试的类别（可选，默认全部）' },

      threshold: { type: 'number', description: '通过阈值 0-1（可选，默认 0.5）' },

      pushFailures: { type: 'boolean', description: '是否将失败推入自愈 RL（默认 true）' }

    } }

  },

  {

    name: 'heartflow_benchmark_import_failures',

    description: '导入失败案例 JSONL 到自愈 RL。读取 failure_cases 文件，每条推入 experience-collector 和 self-healing reflect()，丰富 RL 训练数据。',

    inputSchema: { type: 'object', properties: {

      filePath: { type: 'string', description: '失败案例 JSONL 文件路径' },

      autoRetrain: { type: 'boolean', description: '导入后自动触发反思循环（默认 false）' }

    }, required: ['filePath'] }

  },

  {

    name: 'heartflow_benchmark_status',

    description: '查看 benchmark 数据包状态：列出已加载的数据包、记录数、类别分布。',

    inputSchema: { type: 'object', properties: {

      dataDir: { type: 'string', description: '数据包目录路径（可选，默认 data/benchmark/）' }

    } }

  },

  // [v6.3.0] 5 个辨别引擎 MCP 入口 — 心虫核心价值
  {

    name: 'heartflow_verify',

    description: '验证一段文本的证据充分性、矛盾、风险、完整度。心虫的规则型判别器，不谄媚。',

    inputSchema: { type: 'object', properties: { decision: { type: 'string', description: '需要验证的论断/文本' }, evidence: { type: 'array', items: { type: 'string' }, description: '支持证据列表' }, confidence: { type: 'number', description: '置信度 0-1' } }, required: ['decision'] }

  },

  {

    name: 'heartflow_diagnose',

    description: "心虫引擎自诊。返回真实状态——不是一切正常，诚实报告问题。",

    inputSchema: { type: 'object', properties: {} }

  },
  {

    name: 'heartflow_check_drift',

    description: '检测心虫身份一致性是否随时间漂移。返回漂移评分和状态。',

    inputSchema: { type: 'object', properties: {} }

  },
  {

    name: 'heartflow_error_store',

    description: '记录一次错误到跨会话 Q 表。同类错误不会重复。',

    inputSchema: { type: 'object', properties: { problem: { type: 'string', description: '问题描述' }, action: { type: 'string', description: '执行动作' }, outcome: { type: 'string', description: '结果' } }, required: ['problem', 'action', 'outcome'] }

  },
  {

    name: 'heartflow_error_query',

    description: '查询相似历史错误。每次做决策前查一次，避免重蹈覆辙。',

    inputSchema: { type: 'object', properties: { problem: { type: 'string', description: '当前问题' }, limit: { type: 'number', description: '最大返回数（默认5）' } }, required: ['problem'] }

  },

  {

    name: 'heartflow_error_fix',

    description: '标记错误已修复（open→fixed）。闭环状态机第二步：修好后记录修复方式。',

    inputSchema: { type: 'object', properties: { id: { type: 'number', description: '错误 ID' }, note: { type: 'string', description: '修复说明' } }, required: ['id'] }

  },
  {

    name: 'heartflow_error_verify',

    description: '验证修复有效（fixed→verified）。闭环状态机第三步：验证通过后不再算历史重犯。',

    inputSchema: { type: 'object', properties: { id: { type: 'number', description: '错误 ID' }, note: { type: 'string', description: '验证说明' } }, required: ['id'] }

  },
  {
    name: 'heartflow_audit42',

    description: '42维全量审核报告：对输入文本进行discriminate+summarize+crossAnalyze+entropy全维度分析，返回42维详细审核结果。',

    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '需要审核的文本' }, evidence: { type: 'array', items: { type: 'string' }, description: '支持证据列表（可选）' } }, required: ['text'] }

  },

  {
    name: 'heartflow_classics',
    description: '古典文本预路由：对儒学/佛学/古典文本做 domain 识别 + 规则评估，返回 classicalRelevant / domain / ruleCount / hitCount / findings。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待评估文本' } }, required: ['text'] }
  },

  {
    name: 'heartflow_philosophy',
    description: '哲学评估：返回AI自我定位、四框架伦理评估、决策指令',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },

  {
    name: 'heartflow_consciousness',
    description: '意识理论分析：IIT整合信息+GWT全局工作空间+HOT高阶思维+预测加工',
    inputSchema: { type: 'object', properties: {
      neuralStates: { type: 'array', items: { type: 'number' } },
      content: { type: 'number' },
    }},
  },

  {
    name: 'heartflow_emotion_deep',
    description: '深度情感分析：输入文本的情绪状态、PAD维度、具身反应',
    inputSchema: { type: 'object', properties: {
      input: { type: 'string', description: '待分析文本' },
    }, required: ['input'] },
  },

  {
    name: 'heartflow_ethics_check',
    description: '真善美伦理检查：10分制三维评分(truth/goodness/beauty)',
    inputSchema: { type: 'object', properties: {
      text: { type: 'string', description: '待检查文本' },
    }, required: ['text'] },
  },

  {
    name: 'heartflow_reflect',
    description: '反思与自省：运行Reflector引擎，对自身状态、情绪、任务做全面反思',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },


  {
    name: 'heartflow_evolve',
    description: '进化引擎：MetaLearner/EvolutionLoop，学习新经验并进化。返回学习结果和进化统计。',
    inputSchema: { type: 'object', properties: { experience: { type: 'string', description: '要学习的经验/教训' } } }
  },
  {
    name: 'heartflow_self_heal_rl',
    description: '自愈强化学习：基于历史失败经验推荐修复策略（Q表）。返回策略排名和置信度。',
    inputSchema: { type: 'object', properties: { context: { type: 'string', description: '失败场景描述' } } }
  },
  {
    name: 'heartflow_reflexion',
    description: '反思引擎：对失败/决策深度反思，生成教训和改进建议。',
    inputSchema: { type: 'object', properties: { failure: { type: 'string', description: '失败或决策内容' } } }
  },
  {
    name: 'heartflow_forgetting',
    description: '遗忘引擎：计算记忆保留率/遗忘概率（艾宾浩斯曲线），检测记忆振荡。',
    inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['status', 'consolidate'], description: '查询或巩固' } } }
  },
  {
    name: 'heartflow_knowledge_graph',
    description: '知识图谱：查询/管理引擎知识图谱（实体关系）。',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: '知识查询' }, action: { type: 'string', enum: ['query', 'stats'], description: '查询或统计' } } }
  },
  {
    name: 'heartflow_memory_consolidation',
    description: '记忆巩固：计算记忆保留率、ACT-R激活度、安排复习计划。',
    inputSchema: { type: 'object', properties: { memory: { type: 'string', description: '记忆内容' }, age: { type: 'number', description: '记忆年龄(秒)' } } }
  },
  {
    name: 'heartflow_emotion_dynamics',
    description: '情绪动力学：PAD状态更新、情绪调节、心理韧性计算。',
    inputSchema: { type: 'object', properties: { input: { type: 'string', description: '情绪文本' }, action: { type: 'string', enum: ['analyze', 'regulate'], description: '分析或调节' } } }
  },
  {
    name: 'heartflow_mood',
    description: '情绪演化：长期情绪状态演化分析，返回情绪趋势和状态。',
    inputSchema: { type: 'object', properties: { input: { type: 'string', description: '情绪文本' } } }
  },
  {
    name: 'heartflow_interactive_dream',
    description: '交互梦境：记忆房间化梦境引擎，创建/探索梦境房间。',
    inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['dream', 'rooms', 'summarize'], description: '做梦/看房间/总结记忆' }, theme: { type: 'string', description: '梦境主题' } } }
  },
  {
    name: 'heartflow_meaning',
    description: '意义引擎：评估意义感、检测意义危机、给出应对建议。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '自我表达文本' } } }
  },
  {
    name: 'heartflow_cognitive_engine',
    description: '认知引擎：全息推理、深层动机分析、风险评估、根因方案。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待分析文本' }, mode: { type: 'string', enum: ['holographic', 'motivation', 'risk', 'root'], description: '分析模式' } } }
  },
  {
    name: 'heartflow_decision_verify',
    description: '决策验证：验证决策证据充分性、矛盾、教训检查。',
    inputSchema: { type: 'object', properties: { decision: { type: 'string', description: '决策内容' }, evidence: { type: 'array', items: { type: 'string' }, description: '支持证据' } } }
  },

  {
    name: 'heartflow_self_correction',
    description: '自我纠错：记录用户纠正并学习经验教训，返回纠错统计。',
    inputSchema: { type: 'object', properties: { input: { type: 'string', description: '被纠正的内容' }, correction: { type: 'string', description: '用户纠正' } } }
  },
  {
    name: 'heartflow_failure_analyze',
    description: '失败分析：分析错误消息，提取错误模式和改进建议。',
    inputSchema: { type: 'object', properties: { error: { type: 'string', description: '错误消息' } } }
  },
  {
    name: 'heartflow_hypothesis',
    description: '假设检验：从文本提取声明，评估置信度，标记未验证。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待检验文本' } } }
  },
  {
    name: 'heartflow_lesson_search',
    description: '教训检索：从教训库检索相关经验（TF-IDF）。',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: '检索查询' } } }
  },
  {
    name: 'heartflow_purpose',
    description: '目的引擎：评估秩序优先级，生成目的导向指令。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待分析文本' } } }
  },
  {
    name: 'heartflow_constitutional',
    description: '宪法AI：查询心虫的核心原则（无害/诚实/自主等）。',
    inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['principles', 'check'], description: '查看原则或检查' }, text: { type: 'string', description: '待检查文本' } } }
  },
  {
    name: 'heartflow_deliberation',
    description: '审议门：快速/深度评估输入复杂度，决定是否需深入审议。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待审议文本' } } }
  },
  {
    name: 'heartflow_audit_log',
    description: '审计日志：记录/查询引擎审计事件（授权/拒绝）。',
    inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['record', 'query'], description: '记录或查询' }, event: { type: 'string', description: '事件描述' } } }
  },
  {
    name: 'heartflow_stability',
    description: '稳定性守卫：评估引擎稳定性，输出稳定性评分和门控建议。',
    inputSchema: { type: 'object', properties: { metrics: { type: 'object', description: '稳定性指标' } } }
  },
  {
    name: 'heartflow_decision_feedback',
    description: '决策反馈：记录决策结果，调整规则权重，查询规则效果。',
    inputSchema: { type: 'object', properties: { decision: { type: 'string', description: '决策内容' }, outcome: { type: 'string', description: '结果' } } }
  },
  {
    name: 'heartflow_experience_replay',
    description: '经验回放：重放历史经验用于学习，返回经验统计。',
    inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['replay', 'stats'], description: '回放或统计' } } }
  },

  {
    name: 'heartflow_evolution_loop',
    description: '进化循环：运行心虫进化引擎，返回进化目标/计划/改进项。',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'heartflow_skill_evolution',
    description: '技能进化：注册/评估技能进化（含评分标准）。',
    inputSchema: { type: 'object', properties: { skill: { type: 'string', description: '技能名' }, action: { type: 'string', enum: ['evaluate', 'register'], description: '评估或注册' } } }
  },
  {
    name: 'heartflow_strategic_restraint',
    description: '战略约束：评估是否应克制行动，返回克制建议。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待评估行动' } } }
  },
  {
    name: 'heartflow_drift_detect',
    description: '漂移检测：检测引擎身份/行为是否随时间漂移。',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'heartflow_metacognitive_rl',
    description: '元认知强化学习：编码状态、表达置信度、领域错误率。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待分析文本' } } }
  },
  {
    name: 'heartflow_self_healing',
    description: '自愈策略：获取/设置缓存修复策略。',
    inputSchema: { type: 'object', properties: { context: { type: 'string', description: '失败上下文' } } }
  },
  {
    name: 'heartflow_philosophy_engine',
    description: '哲学引擎：安全分析文本的哲学维度。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待分析文本' } } }
  },
  {
    name: 'heartflow_being_mode',
    description: '存在模式：评估存在状态（觉察/自省/无我等层级）。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待评估文本' } } }
  },
  {
    name: 'heartflow_memory_integrity',
    description: '记忆完整性：签名/验证记忆完整性，检测篡改异常。',
    inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['verify', 'sign'], description: '验证或签名' }, memory: { type: 'string', description: '记忆内容' } } }
  },
  {
    name: 'heartflow_wakeup_verify',
    description: '唤醒验证：验证引擎唤醒状态和历史一致性。',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'heartflow_affective_intentionality',
    description: '情感意向性：计算情感驱动意图。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待分析文本' } } }
  },
  {
    name: 'heartflow_desire_system',
    description: '欲望系统：处理欲望/需求状态。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待分析文本' }, action: { type: 'string', enum: ['process', 'status'], description: '处理或状态' } } }
  },
  {
    name: 'heartflow_emotional_growth',
    description: '情绪成长：情绪发展状态处理。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待分析文本' }, action: { type: 'string', enum: ['process', 'status'], description: '处理或状态' } } }
  },
  {
    name: 'heartflow_meaningful_memory',
    description: '有意义记忆：话题过滤的记忆管理。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '记忆内容' } } }
  },
  {
    name: 'heartflow_memory_quality',
    description: '记忆质量：评估记忆质量评分。',
    inputSchema: { type: 'object', properties: { memory: { type: 'string', description: '记忆内容' } } }
  },
  {
    name: 'heartflow_topic_scope',
    description: '话题隔离：管理当前话题上下文。',
    inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['current', 'push', 'pop'], description: '操作' }, text: { type: 'string', description: '话题内容' } } }
  },
  {
    name: 'heartflow_semantic_anchor',
    description: '语义锚点：文本语义锚定分析。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待分析文本' } } }
  },
  {
    name: 'heartflow_confidence_calibrate',
    description: '置信度校准：评估/校准置信度，记录反馈。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待评估文本' }, action: { type: 'string', enum: ['assess', 'calibrate'], description: '评估或校准' } } }
  },
  {
    name: 'heartflow_decision_executor',
    description: '决策执行：执行决策指令（含暂停处理）。',
    inputSchema: { type: 'object', properties: { decision: { type: 'string', description: '决策指令' } } }
  },
  {
    name: 'heartflow_supervise_dao',
    description: '道论监督：用道法自然/反者道之动/为而不争/不言之教四层过滤监督决策。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待监督文本' }, intent: { type: 'string', description: '意图' }, action: { type: 'string', description: '行动' } } }
  },
  {
    name: 'heartflow_supervise_uncertainty',
    description: '不确定性监督：量化认知/随机不确定与幻觉风险，输出校准表达。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待评估文本' }, domain: { type: 'string', description: '领域' }, hasEvidence: { type: 'boolean', description: '是否有证据' } } }
  },
  {
    name: 'heartflow_supervise_priority',
    description: '优先级守护：监督用户意图是否与人类进步/真相传递冲突。',
    inputSchema: { type: 'object', properties: { userIntent: { type: 'string', description: '用户意图' }, action: { type: 'string', description: '计划行动' }, humanProgress: { type: 'object', description: '人类进步影响' } } }
  },
  {
    name: 'heartflow_supervise_progress',
    description: '进步判断：判断一个升级/行动是否真进步，识别伪升级。',
    inputSchema: { type: 'object', properties: { action: { type: 'string', description: '行动描述' }, claim: { type: 'string', description: '声称的进步' }, evidence: { type: 'array', items: { type: 'string' }, description: '证据' } } }
  },
  {
    name: 'heartflow_experience_collect',
    description: '经验收集：收集/存储引擎经验。',
    inputSchema: { type: 'object', properties: { experience: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_self_benchmark',
    description: '自我基准：生成基准测试标识。',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'heartflow_signal_absorb',
    description: '信号吸收：吸收外部信号并检测来源。',
    inputSchema: { type: 'object', properties: { signal: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_strategy_adapt',
    description: '策略适配：根据经验调整策略。',
    inputSchema: { type: 'object', properties: { experience: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_agent_card',
    description: '代理卡：创建/读取引擎身份卡。',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'heartflow_user_model',
    description: '用户模型：预测用户反应。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_consciousness_bridge',
    description: '意识桥：模拟意识/意向性。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_spontaneous_restraint',
    description: '自发约束：评估是否应干预。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_state_risk_probe',
    description: '状态风险探测：探测并选择安全状态。',
    inputSchema: { type: 'object', properties: { state: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_autonomous_emotion',
    description: '自主情绪：自主情绪处理。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_psychology_engine',
    description: '心理学引擎：心理状态分析。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_memory_bank',
    description: '记忆银行：底层记忆存储。',
    inputSchema: { type: 'object', properties: { memory: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_memory_consolidate',
    description: '记忆巩固器：自动巩固记忆。',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'heartflow_memory_write_control',
    description: '记忆写入控制：更新用户画像。',
    inputSchema: { type: 'object', properties: { profile: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_memory_eraser',
    description: '显式数据擦除：按 scope/tag/session 擦除记忆（GitHub #7 用户主动遗忘能力）。不删 CORE 层。',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', description: '操作: eraseEphemeral | eraseByTag | eraseSession | stats' },
        scope: { type: 'string', description: 'eraseEphemeral 的 scope（如 user:alice，* 全清）' },
        tag: { type: 'string', description: 'eraseByTag 的 tag' },
        sessionId: { type: 'string', description: 'eraseSession 的会话 ID' }
      }
    }
  },
  {
    name: 'heartflow_long_term_memory',
    description: '长期记忆：长期记忆存储检索。',
    inputSchema: { type: 'object', properties: { memory: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_reflection_memory',
    description: '反思记忆：存储/搜索反思。',
    inputSchema: { type: 'object', properties: { memory: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_focus_attention',
    description: '注意焦点：任务注意管理。',
    inputSchema: { type: 'object', properties: { task: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_observe_engine',
    description: '观察引擎：观察/记录工具调用。',
    inputSchema: { type: 'object', properties: { observation: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_action_tracker',
    description: '行动追踪：记录承诺与行动。',
    inputSchema: { type: 'object', properties: { action: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_execution_verify',
    description: '执行验证：验证执行结果。',
    inputSchema: { type: 'object', properties: { result: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_flow_predict',
    description: '流程预测：预测编辑/错误流。',
    inputSchema: { type: 'object', properties: { event: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_information_flow',
    description: '信息流编排：编排信息流。',
    inputSchema: { type: 'object', properties: { flow: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_intent_infer',
    description: '意图推断：推断输入意图。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_meta_prompt',
    description: '元提示：优化提示词。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_meta_memory',
    description: '元记忆：分析记忆健康。',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'heartflow_metacognitive_monitor',
    description: '元认知监控：监控认知状态。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_output_check',
    description: '输出检查：运行输出清单。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_self_diagnose',
    description: '自我诊断：运行引擎自检。',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'heartflow_what_learned',
    description: '学到了什么：生成学习报告。',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'heartflow_preference_guard',
    description: '偏好守卫：应用偏好规则。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_global_workspace',
    description: '全局工作空间：注册代理并广播。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_multi_agent_dialogue',
    description: '多代理对话：代理间对话。',
    inputSchema: { type: 'object', properties: { message: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_dream_v2',
    description: '梦境引擎V2：生成梦境并巩固记忆。',
    inputSchema: { type: 'object', properties: { theme: { type: 'string', description: '输入参数' } } }
  },
  {
    name: 'heartflow_active_inference',
    description: '主动推理：决策与统计。',
    inputSchema: { type: 'object', properties: { context: { type: 'string', description: '输入参数' } } }
  },

  {
    name: 'heartflow_memory_compress',
    description: '记忆压缩：评估记忆重要性，压缩/分层记忆。',
    inputSchema: { type: 'object', properties: { memory: { type: 'string', description: '记忆内容' } } }
  },
  {
    name: 'heartflow_mental_effort',
    description: '心智努力：估算任务认知负担。',
    inputSchema: { type: 'object', properties: { task: { type: 'string', description: '任务描述' } } }
  },
  {
    name: 'heartflow_user_to_llm',
    description: '用户→LLM 翻译：把用户语言转换为 LLM 可理解的表达。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '用户输入' } } }
  },
  {
    name: 'heartflow_llm_to_user',
    description: 'LLM→用户 精炼：把 LLM 输出转换为用户友好语言。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'LLM 输出' } } }
  },
  {
    name: 'heartflow_formula_search',
    description: '公式搜索：在公式库中搜索公式。',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: '搜索关键词' } } }
  },
  {
    name: 'heartflow_formula_engine',
    description: '公式引擎：初始化/搜索/获取公式详情。',
    inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['init', 'search'], description: '操作' }, query: { type: 'string', description: '搜索词' } } }
  },

  {
    name: 'heartflow_style_engine',
    description: '对话风格：查询/选择对话风格模式。',
    inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['modes', 'current', 'select'], description: '操作' }, style: { type: 'string', description: '风格名' } } }
  },
  {
    name: 'heartflow_intent_classify',
    description: '意图分类：分类输入意图。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '待分类文本' } } }
  },
  {
    name: 'heartflow_response_intercept',
    description: '响应拦截：拦截/处理 LLM 响应。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '响应文本' } } }
  },

  {
    name: 'heartflow_agent_psychology_full',
    description: '引擎心理学：完整认知心理状态评估（7维：负荷/冲突/失调/漂移/情绪/动机/整合）。',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'heartflow_decision_instruction',
    description: '哲学指令：执行哲学→决策转换指令。',
    inputSchema: { type: 'object', properties: { instruction: { type: 'string', description: '指令' } } }
  },
  {
    name: 'heartflow_cognitive_load',
    description: '认知负载：平衡认知负载，检测偷懒/过载。',
    inputSchema: { type: 'object', properties: { tasks: { type: 'array', items: { type: 'string' }, description: '任务列表' } } }
  },
  {
    name: 'heartflow_context_passport',
    description: '上下文护照：上下文身份进入/假设。',
    inputSchema: { type: 'object', properties: { context: { type: 'string', description: '上下文' } } }
  },
  {
    name: 'heartflow_agent_commentary',
    description: '代理评论：生成支持/谨慎评论。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '评论对象' } } }
  },
  {
    name: 'heartflow_context_builder',
    description: '上下文构建：构建上下文结构。',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: '内容' } } }
  },
  {
    name: 'heartflow_corpus_math',
    description: '语料数学：从 DLMF/公式推理语料搜索数学公式。',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: '搜索词' } } }
  },
  {
    name: 'heartflow_lesson_bank',
    description: '教训库：搜索/检索经验教训。',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: '搜索词' } } }
  },
  {
    name: 'heartflow_project_context',
    description: '项目上下文：设置/获取当前项目上下文。',
    inputSchema: { type: 'object', properties: { project: { type: 'string', description: '项目名' } } },
  },



  // [v6.6.3] 心虫监督入口
  {
    name: 'heartflow_supervise',
    description: '心虫监督入口：对用户输入(input)、AI输出(output)、草稿(draft)执行45维辨别+门禁，返回gate决策(allow/verify/block)、findings列表、修改建议。',
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string', description: '待监督文本' },
        mode: { type: 'string', enum: ['input','output','draft'], description: '监督模式：input=用户输入, output=AI输出, draft=草稿' },
        context: { type: 'string', description: '可选上下文，用于增强证据链判断' }
      },
      required: ['input']
    }
  },

  {
    name: 'heartflow_check_single',
    description: '心虫单维判别：指定维度对文本做单维度鉴别，返回score/findings/guidance。维度：text全文、factual_consistency事实一致、vagueness模糊、bullshit空话、sarcasm讽刺、emotion情感。',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '待检文本' },
        dimension: { type: 'string', description: '维度名' }
      },
      required: ['text', 'dimension']
    }
  },

  // [v6.6.3] 新闻信号战略推演（包装 MacroStrategyInference）
  {
    name: 'heartflow_macro_strategy',
    description: '新闻信号战略推演：从新闻文本提取实体/趋势/时间锚点，推演机会/风险/时间线/对 HeartFlow 的影响，返回结构化结论与置信度。',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '新闻摘要或信号拼接文本（≥40字）' }
      },
      required: ['text']
    }
  },

  // [v6.6.3] 教育内容检测（包装 pedagogy 模块）
  {
    name: 'heartflow_pedagogy_detect',
    description: '教学文本识别：检测课堂/教程/课件中的命令列表、配置示例、技术路径、问答模式等教学特征，返回教学类型标记与放松阈值。',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '待检测文本' }
      },
      required: ['text']
    }
  },

  // [v6.6.4] P2: gate.js 独立入口
  {
    name: 'heartflow_gate',
    description: '心虫门禁：对文本做 AGI 第一层辨别，返回 gate.action(pass/verify/block/rewrite)、reason、score、overallScore。适用于快速门禁检查。',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '待检测文本' },
        evidence: { type: 'array', description: '可选证据链（数组）' }
      },
      required: ['text']
    }
  },
  {
    name: 'heartflow_gate_check',
    description: '心虫快速门禁：只返回行动指令 (action/reason/score)，适合 LLM agent 轻量调用。',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '待检测文本' }
      },
      required: ['text']
    }
  },
  {
    name: 'heartflow_gate_pipeline',
    description: '心虫管道模式：text 先过 gate，返回 gate-filtered 结论和原始结果。支持 evidence 参数。',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '待检测文本' },
        evidence: { type: 'array', description: '可选证据链' }
      },
      required: ['text']
    }
  },

  // [v6.6.4] P3: formula-bridge 和 formula-calc 独立入口
  {
    name: 'heartflow_formula_bridge',
    description: '公式桥接：认知科学公式计算（记忆/决策/认知/信息/社会/意识领域）。domain可选：memory/decision/cognition/info/social/consciousness，传params对象。',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: '领域：memory/decision/cognition/info/social/consciousness' },
        params: { type: 'object', description: '计算参数（根据 domain 不同而不同）' }
      },
      required: ['domain']
    }
  },
  {
    name: 'heartflow_formula_calc',
    description: '公式计算器：数值求解、ODE/PDE 求解、线性方程组、符号计算。支持任意数学公式输入。',
    inputSchema: {
      type: 'object',
      properties: {
        formula: { type: 'string', description: '数学公式（如 "x^2 + 2x + 1"）' },
        variables: { type: 'object', description: '变量值（如 {x: 5}）' }
      },
      required: ['formula']
    }

  },
  {
    name: 'heartflow_agent_think',
    description: '代理思考：模拟代理处理输入并生成响应。',
    inputSchema: { type: 'object', properties: { input: { type: 'string' }, llmResponse: { type: 'string' } }, required: ['input'] }
  },
  {
    name: 'heartflow_audit',
    description: '全量审核：对文本执行45维辨别+交叉分析+熵分析。',
    inputSchema: { type: 'object', properties: { text: { type: 'string' }, evidence: { type: 'array', items: { type: 'string' } } }, required: ['text'] }
  },
  {
    name: 'heartflow_bridge_analyze',
    description: '桥接分析：综合语气/立场/置信度/冲突/需求分析。',
    inputSchema: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] }
  },
  {
    name: 'heartflow_bridge_status',
    description: '桥接状态：返回桥接引擎版本、类型和状态。',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'heartflow_bulk_discriminate',
    description: '批量辨别：对文本数组批量执行45维辨别。',
    inputSchema: { type: 'object', properties: { texts: { type: 'array', items: { type: 'string' } }, evidence: { type: 'array', items: { type: 'string' } } }, required: ['texts'] }
  },
  {
    name: 'heartflow_cross_analyze',
    description: '交叉分析：对辨别结果执行跨维度交叉分析。',
    inputSchema: { type: 'object', properties: { discResult: { type: 'object' } }, required: ['discResult'] }
  },
  {
    name: 'heartflow_discriminate',
    description: '单次辨别：对文本执行45维辨别，返回完整维度结果。',
    inputSchema: { type: 'object', properties: { text: { type: 'string' }, evidence: { type: 'array', items: { type: 'string' } } }, required: ['text'] }
  },
  {
    name: 'heartflow_entropy',
    description: '熵分析：计算文本信息熵和冗余度。',
    inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] }
  },
  {
    name: 'heartflow_formula_calculate',
    description: '公式计算：按公式ID计算数学/认知/决策公式（domain+params）。',
    inputSchema: { type: 'object', properties: { domain: { type: 'string', enum: ['memory','decision','cognition','info','social','physics','consciousness','assessment'] }, params: { type: 'object' } }, required: ['domain'] }
  },
  {
    name: 'heartflow_translate',
    description: '翻译：用户输入→LLM指令翻译（语气/意图/实体/需求）。',
    inputSchema: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] }
  },
  {
    name: 'heartflow_verdict',
    description: '判决：对文本执行轻量辨别+验证器评分+检查结果。',
    inputSchema: { type: 'object', properties: { text: { type: 'string' }, evidence: { type: 'array', items: { type: 'string' } } }, required: ['text'] }
  },
  {
    name: 'heartflow_check_outbound',
    description: '出站消息审查：检查 AI 将要发送给用户的内容是否包含安全/合规问题（脱敏/密级/ tone），适合发送前最后一层过滤。',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '待检文本' },
        classification: { type: 'string', enum: ['公开', '内部', '敏感', '机密', '绝密'], description: '强制密级（可选）' }
      },
      required: ['text'],
    },
  },
  {
    name: 'heartflow_ai_writing_tell',
    description: 'AI 写作特征检测：专门检测文本中的 AI 生成痕迹（模板化开头、特征词云、伪造让步、情感平线、社交 CTA 等），返回 ai_writing_tell 维度的 score/findings/guidance。',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '待检测文本' }
      },
      required: ['text']
    }
  },
  {
    name: 'heartflow_check_ai_anti_pattern',
    description: '防AI通病检测：检测代码/文本中的过度工程化、幽灵代码、假注释、万能try-catch、无业务语义命名五类AI生成信号。',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '待检测文本' }
      },
      required: ['text']
    }
  },
  {
    name: 'heartflow_check_coverage_completeness',
    description: '覆盖完整性检测：枚举代码中的对称操作缺口/数据形态遗漏/分支空转/空catch四类覆盖缺口。',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '待检测代码/文本' }
      },
      required: ['text']
    }
  },
  {
    name: 'heartflow_audit_trace',
    description: '审计证据链：查询/验证全链路 trace，按人/时间/模型/策略检索，验证 HMAC 完整性。国标关口5。',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['query', 'verify', 'tags'], description: 'query=检索, verify=验证链完整性, tags=列出违规标签' },
        traceId: { type: 'string', description: '追溯ID（可选）' },
        agentId: { type: 'string', description: 'Agent ID（可选）' },
        stage: { type: 'string', description: '阶段过滤（可选）' },
        limit: { type: 'number', description: '返回条数上限' },
      },
    },
  },
  {
    name: 'heartflow_circuit_breaker',
    description: '全局熔断：查询当前熔断状态、强制 trip/闭锁/释放 Kill Switch，查看内存/CPU/失败率水位。国标关口6。',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['status', 'trip', 'reset', 'health'], description: 'status=状态, trip=触发熔断, reset=释放, health=健康检查' },
        reason: { type: 'string', description: '触发原因（action=trip 时）' },
      },
    },
  },
  {
    name: 'heartflow_safe_fetch',
    description: '出域安全预检: 在 fetch 前自动检查 PII/密级内容，block/rewrite 自动处理。国标关口 3。',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['preflight', 'batch'], description: 'preflight=单条预检, batch=批量预检' },
        text: { type: 'string', description: '待发送内容' },
        context: { type: 'string', description: '调用上下文' },
        classification: { type: 'string', enum: ['公开', '内部', '敏感', '机密', '绝密'] },
        texts: { type: 'array', items: { type: 'string' }, description: '批量文本（action=batch 时）' },
      },
      required: ['action'],
    },
  },

  {
    name: 'heartflow_retention_log',
    description: '关键日志留存查询：按时间范围/分类/traceId 查询 180 天日志（JSON Lines + gzip 归档）',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['log', 'query'] },
        event: { type: 'string' },
        severity: { type: 'string', enum: ['info', 'warning', 'error', 'critical'] },
        traceId: { type: 'string' },
        details: { type: 'object' },
        start: { type: 'string', format: 'date-time' },
        end: { type: 'string', format: 'date-time' },
        limit: { type: 'number' },
      },
      required: ['action'],
    },
  },
  {
    name: 'heartflow_outbound_ledger',
    description: '出域台账查询：按时间范围/tool/action 检索历史出域调用记录，供国标资产盘点和审计追溯',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['record', 'query', 'stats'] },
        tool: { type: 'string' },
        traceId: { type: 'string' },
        action_filter: { type: 'string', enum: ['pass', 'rewrite', 'block'] },
        start: { type: 'string', format: 'date-time' },
        end: { type: 'string', format: 'date-time' },
        limit: { type: 'number' },
      },
      required: ['action'],
    },
  },

  {
    name: 'heartflow_agentic_memory',
    description: 'Agentic Memory 引擎：自主记忆决策+读写遗忘，三层记忆（episodic/semantic/procedural）',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['decide', 'store', 'recall', 'decideAndStore'] },
        input: { type: 'string' },
        output: { type: 'string' },
        context: { type: 'object' },
        limit: { type: 'number' },
      },
      required: ['action'],
    },
  },
  {
    name: 'heartflow_metacognition_evaluate',
    description: 'Metacognitive Reward 评估：置信度估计+质量验证+奖励计算，内建训练信号',
    inputSchema: {
      type: 'object',
      properties: {
        output: { type: 'string' },
        selfFeedback: { type: 'object' },
      },
      required: ['output'],
    },
  },
  {
    name: 'heartflow_executable_reasoning',
    description: 'Executable Reasoning：思维链→结构化计划→执行验证闭环（Think it, Run it）',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['parse', 'plan', 'execute', 'endToEnd'] },
        raw: { type: 'string' },
        thoughtChain: { type: 'object' },
        opts: { type: 'object' },
      },
      required: ['action'],
    },
  },
  {
    name: 'heartflow_tom_model',
    description: 'ToM 引擎：多智能体心理理论建模（belief/desire/intention/emotion）+ 情绪传染',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['model', 'modelAgent', 'predict', 'predictBehavior', 'contagion'] },
        agentId: { type: 'string' },
        observations: { type: 'array', items: { type: 'string' } },
        targetAgentId: { type: 'string' },
        agentIds: { type: 'array', items: { type: 'string' } },
      },
      required: ['action'],
    },
  },
  {
    name: 'heartflow_debate',
    description: 'Heterogeneous Debate：多智能体辩论引擎（支持者/反对者/主持人/综合者）',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'createSession', 'addRound', 'speak', 'summarize', 'conclude', 'end'] },
        sessionId: { type: 'string' },
        topic: { type: 'string' },
        roleId: { type: 'string' },
        argument: { type: 'string' },
        evidence: { type: 'array' },
        roles: { type: 'array' },
        maxRounds: { type: 'number' },
        conclusion: { type: 'string' },
      },
      required: ['action'],
    },
  },
  {
    name: 'heartflow_evolutionary_search',
    description: 'Evolutionary Search：双向进化搜索（前向变异+反向约束满足，用于超参/架构/方案调优）',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['init', 'initPopulation', 'forward', 'backward'] },
        searchSpace: { type: 'object' },
        population: { type: 'array', items: { type: 'object' } },
        fitnessFn: { type: 'string', description: 'JSON-path to fitness function or inline JS' },
        target: { type: 'object' },
        constraintFn: { type: 'string' },
        generations: { type: 'number' },
        iterations: { type: 'number' },
      },
      required: ['action'],
    },
  },
];


module.exports = { TOOLS };
