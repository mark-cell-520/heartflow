# r303 海外扫描记录（4 号 agent，2026-11-12 04:0x CST）

topic: average marginal conflation fallacy detection rule-based
(+ 追加查询: marginal analysis vs average ROAS / marginal vs average cost reasoning error)

## 结果

| 源 | 查询 | 结果 |
|---|---|---|
| arXiv | `all:average OR all:marginal OR all:conflation OR all:fallacy OR all:detection OR all:rule-based`（hf4-scout.sh 默认 OR 展开） | totalResults 463,660，15 条全为通用论文（EM-DETR 目标检测等），零相关 |
| arXiv | `all:"marginal analysis" AND all:"fallacy"` | 连接空返（0 字节，重试两次均空） |
| GitHub repos | `average marginal fallacy` | `total_count: 0` |
| GitHub repos | `"average marginal" fallacy` | `total_count: 0` |
| GitHub code | `"average_marginal_conflation"` | 401 Requires authentication |
| **Semantic Scholar** | `average marginal conflation fallacy` | **total=52，1 条真实命中** |

### 唯一实质命中（S2）

**"Marginal analysis vs. Average roas: the profit-maximization fallacy in digital advertising
budget allocation"** (2026, citationCount 2)
paperId `687930bac015404a474210e44aea90c92ccab67f`

→ 与 r303 立项族**同构**：数字广告预算分配里拿「平均 ROAS」做边际投放决策，
正是 average→marginal conflation 在商业投放场景的标准表述。但它是**商业分析
文章**（论证该谬误在 ROAS 优化中的存在），不是可集成的纯规则文本检测实现；
仓库内无对应开源实现，且后续两次 S2 查询（ROAS 细化、marginal vs average cost
reasoning error）均 429 限流空返。

## 结论

**无可集成的纯规则实现**（零 GitHub 仓库、零 arXiv 方法论专文、S2 唯一命中为
商业分析文章非检测器）。r303 判据为心虫自有纯规则实现，家族定义取自边际分析
（marginal analysis）的标准经济学描述：决策应看边际量，平均量与边际量之间没有
推论关系——与 r220 立项时同源，本轮补的是 r220 未覆盖的「产量/效率/速率型
平均值 → 边际量」措辞家族。

原始文件：`arxiv-20261112-040312.xml`、`github-repos-20261112-040312.json`、
`s2-20261112-040312.json`、`github-r303-amc.json`、`github-r303-amc2.json`、
`github-r303-amc3.json`、`s2-r303-amc.json`、`s2-r303-roas.json`、`s2-r303-marginal.json`
