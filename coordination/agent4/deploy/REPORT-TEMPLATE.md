# 4 号轮次报告模板（research / dimension / fix 通用）

> 复制本模板到 `coordination/reports/rNNN-<kind>-agent4.md` 并填写。
> 铁律：每个数字来自本轮真实运行；跑不通就写"未跑通 + 原因"，不许填想象中的数字。

## rNNN · agent-4 · <kind>

- **时间(UTC)**：
- **方向**：
- **依据来源**：<arXiv id / GitHub repo / S2 paper id / 自建模式；空返必须写明"空返，按既有形态自建">
- **VERSION 起点 → 终点**：

## 一、改动清单

| 文件 | 类型 | 说明 |
|---|---|---|
|  |  |  |

## 二、真实升级判定（四条至少命中一条，否则是维护不是升级）

- [ ] ① 新判别维度（新 dimMap 键独立匹配一个此前没有的家族）
- [ ] ② 已有维度的全新措辞家族
- [ ] ③ 接线一个已加载但从未调度的能力
- [ ] ④ 真正能判别的新 MCP 工具 / dispatch 路由

命中项与证据（函数名 + 测试断言）：

## 三、门禁实测

```
node bin/verify.js
node scripts/guard-abilities.js
node test/doc-numbers-accuracy.test.js
node scripts/bidirectional-guard.js
```

| 门禁 | 实测 | 期望 | 结论 |
|---|---|---|---|
| bin/verify.js |  | passed>=16 failed=0 |  |
| guard-abilities.js |  | 20/20 |  |
| doc-numbers-accuracy |  | 24/24 |  |
| bidirectional-guard 召回 |  | >=52 |  |
| bidirectional-guard 误拦 |  | <=302/326 |  |

## 四、负例验证（注入-删条）

> 逐条删掉本轮每个新模式，断言守卫必须变红（断言失败而非加载崩溃）。

- 注入 N 个：__ 个变红，__ 个未变红
- 未变红清单与原因：

## 五、交接给其他 agent 的事项

- 给 1 号（主力）：
- 给 2 号（红队）：
- 给 3 号（CI）：

## 六、commit

- `git rev-parse --short HEAD`：
- push 状态：已推送 / 未推送（原因）：
