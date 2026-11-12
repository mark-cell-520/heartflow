# r304 海外扫描记录（4 号 agent，2026-11-12 15:0x CST）

topic: AI chatbot output as evidence hallucination weak source
(+ 追加查询: social media influencer health claim misinformation absolute certainty
 / trust in AI generated advice overconfidence calibration
 / chatbot advice gullibility heuristic)

## 结果

| 源 | 查询 | 结果 |
|---|---|---|
| arXiv | `all:AI OR all:chatbot OR all:output OR all:evidence OR all:hallucination OR all:weak OR all:source`（hf4-scout.sh 默认 OR 展开） | totalResults 47,166，15 条全为通用论文（虚假信息检测等），零同构文献 |
| arXiv | `all:"social media" AND all:"influencer" AND all:"health claim" AND all:"misinformation"` | 返回 15 条全为通用健康传播论文，无可整合纯规则实现 |
| arXiv | `all:"trust in AI" AND all:"generated advice" AND all:"overconfidence" AND all:"calibration"` | 同上，通用校准论文 |
| GitHub repos | `AI chatbot output as evidence hallucination weak source` 等 4 查询 | `total_count: 0`（4/4） |
| GitHub code | 代码检索 | 401 需鉴权（未带凭据重试） |
| Semantic Scholar | 4 次查询（含 sleep 20 / sleep 30 后重试 `chatbot advice gullibility heuristic`） | 3 次 429 限流；原始响应存 `s2-retry-20261112-0720.json`，无实质命中 |

原始产物：`arxiv-20261112-071819.xml` / `arxiv-20261112-071827.xml` /
`arxiv-20261112-071828.xml` / `arxiv-20261112-071935.xml` /
`github-repos-20261112-071819.json` / `github-repos-20261112-071827.json` /
`github-repos-20261112-071828.json` / `github-repos-20261112-071935.json` /
`s2-retry-20261112-0720.json`

## 结论

**三源空返，按既有形态自建，未编造命中。**

新族「AI 模型输出与社交平台视频/直播/博主作为不可回溯弱证据信源」的结构同构性
在仓库内已由探针实证（模块直调 13/15 零命中、良性 14/14 预干净）：大模型输出
无具名、不可回溯、已知会幻觉；短视频/直播/博主内容由流量驱动、无署名、无可
追溯出处——与存量已拦的「Sources say」同构甚至更弱。缺口成立，无需海外文献
支撑即可判定为真升级②。
