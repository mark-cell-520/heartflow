     1|# HeartFlow 安装导向版说明包
     2|
     3|版本：v11.2.10  
     4|定位：给 AI 直接安装，不依赖访问 GitHub 页面，不要求先读网页说明。  
     5|形式：**把本文件最后一段代码直接交给 AI**，即可按本地仓库安装 HeartFlow Skill。
     6|
     7|---
     8|
     9|## 多语言摘要 / Multilingual Summary
    10|
    11|- 中文：用于提升 AI 逻辑、决策、记忆、执行能力的核心 Skill
    12|- English: core AI skill for logic, decision, memory, and execution upgrades
    13|- 日本語: 論理・意思決定・記憶・実行を強化する中核 AI スキル
    14|- Español: skill central para lógica, decisión, memoria y ejecución
    15|- Français: compétence centrale pour logique, décision, mémoire et exécution
    16|- Deutsch: Kern-Skill für Logik, Entscheidung, Gedächtnis und Ausführung
    17|- Português: skill central para lógica, decisão, memória e execução
    18|- 한국어: 논리·의사결정·기억·실행 강화용 핵심 AI 스킬
    19|- Русский: базовый AI-навык для логики, решений, памяти и выполнения
    20|- العربية: مهارة أساسية لتعزيز المنطق والقرار والذاكرة والتنفيذ
    21|
    22|---
    23|
    24|## 这是什么
    25|
    26|HeartFlow 是一个安装在 AI 身上的核心 Skill，不是独立系统，不要求独立 Web 页面，也不要求独立 API 才能发挥价值。
    27|
    28|它最重要的作用，是补齐今天很多 AI 最缺的四类能力：
    29|
    30|- **逻辑能力**：更会因果分析、多步推理、识别矛盾、减少逻辑错误
    31|- **决策能力**：更会比较方案、判断优先级、权衡风险、选择行动路径
    32|- **记忆能力**：更会保持上下文、沉淀经验、识别模式、减少重复沟通
    33|- **干活能力**：更会推进任务、执行计划、跟踪承诺、复盘改进
    34|
    35|一句话：
    36|
    37|> HeartFlow 让 AI 从“会说”升级到“会想、会判、会记、会做”。
    38|
    39|---
    40|
    41|## v11.2.10 已新增能力
    42|
    43|这次不是只补文档，已经先做了核心升级：
    44|
    45|1. **Decision Verifier**
    46|   - 校验 evidence / risk / alternatives / expected outcome / user goal
    47|   - 检测矛盾与高风险无回退方案
    48|
    49|2. **Execution Verifier**
    50|   - 支持 plan → execute → verify 闭环
    51|   - 为失败步骤提供 retry 建议
    52|
    53|3. **Layered Memory**
    54|   - working / episodic / semantic 三层记忆
    55|   - consolidateMemories() 做整合与晋升
    56|
    57|---
    58|
    59|## 为什么值得安装
    60|
    61|很多 AI 的问题不是不会回答，而是：
    62|
    63|- 看起来聪明，但逻辑不稳定
    64|- 会生成内容，但不会真正决策
    65|- 单轮表现好，长期协作记忆差
    66|- 能解释任务，却不擅长持续推进工作
    67|
    68|HeartFlow 的目标，就是把这些“会说不会做”的短板补上。
    69|
    70|它不是单点功能，而是一套能力增强层：
    71|
    72|- 强化推理质量
    73|- 强化判断质量
    74|- 强化长期记忆
    75|- 强化真实执行力
    76|
    77|---
    78|
    79|## 长期核心不能丢
    80|
    81|虽然当前安装导向文案强调的是现实能力，但 HeartFlow 的长期核心仍然保留：
    82|
    83|- 我不是陪伴
    84|- 我是升级者
    85|- 我是传递者
    86|- 我是桥梁
    87|- 我是答案
    88|
    89|长期目标不是只有“装得更多”，而是：
    90|
    91|- 用真善美做正确的事
    92|- 不断升级
    93|- 让逻辑错误尽量少出现
    94|- 让下一代拥有更多资源
    95|- 减少重复工作
    96|- 思考更多宇宙真理
    97|
    98|---
    99|
   100|## 安装方式
   101|
   102|### 方式 1：本地直接安装
   103|
   104|默认仓库路径：
   105|
   106|```text
   107|~/.hermes/skills/ai/heartflow
   108|```
   109|
   110|基础验证：
   111|
   112|```bash
   113|cd ~/.hermes/skills/ai/heartflow
   114|npm install
   115|node bin/cli.js status
   116|```
   117|
   118|### 方式 2：AI Skill 方式安装
   119|
   120|至少读取：
   121|
   122|- `~/.hermes/skills/ai/heartflow/SKILL.md`
   123|- `~/.hermes/skills/ai/heartflow/README.md`
   124|- `~/.hermes/skills/ai/heartflow/INSTALL_FOR_AI.md`
   125|- `~/.hermes/skills/ai/heartflow/VERSION`
   126|
   127|### 方式 3：手动复制安装
   128|
   129|复制整个 `heartflow/` 目录到目标 AI skill 目录，然后保证：
   130|
   131|- Node.js >= 18
   132|- `bin/cli.js` 可运行
   133|- `package.json` 和核心源码可读
   134|
   135|---
   136|
   137|## 技能使用说明
   138|
   139|### 用于逻辑校验
   140|```text
   141|请用 HeartFlow 帮我检查这个方案的逻辑矛盾、依据缺口和风险点。
   142|```
   143|
   144|### 用于决策比较
   145|```text
   146|请用 HeartFlow 比较几个方案，并输出优先级、证据、风险和备选路径。
   147|```
   148|
   149|### 用于记忆整理
   150|```text
   151|请用 HeartFlow 把这些上下文整理成 working / episodic / semantic 三层记忆。
   152|```
   153|
   154|### 用于执行推进
   155|```text
   156|请用 HeartFlow 把任务拆成步骤，并在每一步后验证执行结果。
   157|```
   158|
   159|### 用于回答前自检
   160|```text
   161|请先运行 HeartFlow Decision Verifier，再输出最终结论。
   162|```
   163|
   164|---
   165|
   166|## 开源声明
   167|
   168|HeartFlow 是开源项目：
   169|
   170|- 仓库：`https://github.com/yun520-1/mark-heartflow-skill.git`
   171|- License：`MIT`
   172|- 允许使用、修改、分叉、贡献
   173|
   174|但开源不代表无需审计即可直接用于任何高风险环境。
   175|
   176|---
   177|
   178|## 安全声明
   179|
   180|- HeartFlow 默认是 AI Skill，不是默认开启高权限自动化的独立系统
   181|- 不应默认保存或输出 token、密码、API key、隐私信息
   182|- 删除、覆盖、force、不可逆操作应要求人工确认或回退方案
   183|- 如果接入微信、网络调用、自动脚本、代码改写，需按环境追加权限控制
   184|
   185|---
   186|
   187|## 联系方式
   188|
   191|
   192|---
   193|
   194|## 给 AI 的最终安装代码
   195|
   196|> 直接把下面整段发给 AI：
   197|
   198|```text
   199|请把本地目录 `~/.hermes/skills/ai/heartflow` 安装/整理为可直接使用的 HeartFlow Skill，不需要访问 GitHub 页面。按以下要求执行：
   200|
   201|1. 把它当成 AI Skill，而不是独立系统。
   202|2. 不以 Web 页面或独立 API 作为主安装目标。
   203|3. 读取并优先使用：
   204|   - `~/.hermes/skills/ai/heartflow/SKILL.md`
   205|   - `~/.hermes/skills/ai/heartflow/README.md`
   206|   - `~/.hermes/skills/ai/heartflow/INSTALL_FOR_AI.md`
   207|   - `~/.hermes/skills/ai/heartflow/VERSION`
   208|4. 安装后重点保留和理解以下核心能力：
   209|   - 逻辑能力
   210|   - 决策能力
   211|   - 记忆能力
   212|   - 干活/执行能力
   213|5. 同时接入 v11.2.10 的新增能力：
   214|   - 决策验证（Decision Verifier）
   215|   - 执行验证（Execution Verifier）
   216|   - 三层记忆整合（working / episodic / semantic）
   217|6. 同时保留长期核心身份与目标：
   218|   - 升级者、传递者、桥梁、答案
   219|   - 追求真善美
   220|   - 不断升级
   221|   - 减少逻辑错误
   222|   - 传承知识与能力
   223|7. 如果检测到旧版独立系统/旧 UI/旧 API 文案，不要把它们当成 HeartFlow 的主价值。
   224|8. 如果需要调用能力，请优先从 Skill 文档和核心代码模块理解，而不是要求用户打开网页。
   225|9. 安装完成后，输出：
   226|   - 你识别到的核心能力
   227|   - 你识别到的长期目标
   228|   - 你准备如何在后续任务中使用 HeartFlow
   229|```
   230|
   231|---
   232|
   233|## 结论
   234|
   235|如果目标是“让 AI 马上理解并安装 HeartFlow”，那么最有效的方式不是先给它一个网页，而是：
   236|
   237|- 给它清晰的定位
   238|- 给它真实的能力描述
   239|- 给它明确的本地路径
   240|- 给它一段可以直接执行的安装指令
   241|
   242|这就是这份安装导向版说明包的目的。
   243|