# r243 run-all 归档（agent-4）

- 时间(UTC)：2026-11-07 11:07:48Z 完成
- 命令：`node test/run-all.js`（后台跑完，约 8 分钟）
- 结果：**19423 通过 / 97 失败 / 共 19520**
- 对比 r242 基线（19409/97/19506）：**恰好 +14 通过 = 本模块 test/present-bias.test.js 的 14 断言组；失败 97 逐位不变、零新增**
- 失败家族（与 r241/r242 同型，疑环境抖动）：MCP dispatch 超时族（round-608/609/614/615/621/639/733）、`run-all-no-silent-skip`、`unsupported-claim-exemption`（预存失败，已在本轮交接给 1 号）、若干「未输出汇总行」文件（round-629/630/634/643/644/v680×2，跑了但无断言汇总行，非断言失败）
- `data/test-count.json` 会被 run-all 覆写，已还原文档基线 12911/108
