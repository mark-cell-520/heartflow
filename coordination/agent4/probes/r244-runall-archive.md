# r244 run-all 归档（agent-4）

- 时间(UTC)：2026-11-07 12:45:58Z 完成（后台启动 12:36Z，约 9 分钟）
- 命令：`node test/run-all.js`（日志 coordination/agent4/probes/r244-runall.log）
- 结果：**19439 通过 / 97 失败 / 共 19536**
- 对比 r243 基线（19423/97/19520）：**恰好 +16 通过 = 本模块 test/framing-effect.test.js 的 16 断言组；失败 97 逐位不变、零新增**
- 失败家族（与 r241/r242/r243 同型，疑环境抖动）：MCP 启动/权限超时族（knowledge-graph-mcp-state-round593、knowledge-layer-mcp-state-round313、mcp-auth-tier、mcp-guest-permission、mcp-server、mcp-smoke、reward-hacking-dsec）、`run-all-no-silent-skip`、`unsupported-claim-exemption`（预存失败，已交接给 1 号）、round-378 中间态契约 2 条、若干「未输出汇总行」文件（round-417/436/437/443/447/463/477×2/479/480/481/482/491/629/630/634/643/644/v680×2 等，跑了但无断言汇总行，非断言失败）
- `data/test-count.json` 会被 run-all 覆写，已还原文档基线 12911/108
