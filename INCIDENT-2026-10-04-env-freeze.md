# 2026-10-04 / 10-05 Hermes 环境卡死 — 事故复盘与修复记录（v2 修正版）

## 现象
用户报告「一段时间就整个环境卡死」「hermes 完全无法桥接」。
表现为：gateway 反复崩溃、飞书/微信会话无响应、定时任务停摆、
load 一度 13.87（128 核）、容器周期性整体重启（观测到 10-05 10:56 与 13:33 两次，
间隔约 2.6 小时）。

---

## 根因（按「放大器」排序，不按发现顺序）

### 根因 1：crontab 假 watchdog（已修，10-04）
```bash
*/5 * * * * pgrep -f '/root/.local/bin/hermes gateway run' || nohup /root/.local/bin/hermes gateway run &
```
`pgrep` 模式**永远匹配不到真实 gateway 进程**——真实 cmdline 是
`venv/bin/python3 .../hermes gateway run --force`（python 前缀 + venv 绝对路径），
而模式用的是 `/root/.local/bin/hermes` 字面量。
→ 判据恒为「gateway 已挂」→ 每 5 分钟拉一个不带 `HERMES_HOME` 的裸 gateway
→ 与 supervisord 实例争抢 host 所有权 → 连环 SIGKILL。
**已删除该 crontab 条目**（备份 `~/.hermes/cache/scratch/crontab.bak.cronfix-*`）。
这条也是 10-04 全天 80+ 次崩溃的最大单一来源。

### 根因 2：多实例 host 争抢（已修，10-04 / 10-05）
Hermes 设计：**一台 host 只允许一个 host gateway**，它 multiplex 服务所有 profile。
本机曾有 5 个 gateway（default / hermes1 / hermes5 / hermes8 / hermes9）互相抢，
日志反复出现：
```
WARNING gateway.run: --force: starting a second gateway although PID 203 owns this host
```
`/root/.hermes/scripts/patch-hermes-gateway-force.py` 会主动给 default 加回 `--force`
（该脚本 2026-10-04 20:37 曾无 agent 日志地把配置写回一次；后查明来源是用户本人
经 web-shell 的正常操作，非攻击）。
**已收敛为单 host gateway**：hermes1/hermes5/hermes8 全部 `autostart=false`，
hermes9 条目彻底移除，default 一个进程同时服务 default + hermes1
（日志确认 `Cron scheduler will tick 2 profile(s): ['default', 'hermes1']`）。

### 根因 3：容器入口命令与 supervisord 的启动竞态（已修，10-05）
容器 ENTRYPOINT（PID 1）自己会做三件事：
```bash
hermes config set model.base_url https://cephalon.cloud/...   # 改成失效配置
hermes config set model.api_key  eyJhbG...
hermes config set model.default  minimax-m2.7
hermes gateway &                                              # 自己起一个 gateway
exec /usr/bin/supervisord -c /etc/supervisord.conf &
```
两个后果：
1. **`hermes gateway &` 与 supervisord 的 hermes-gateway 条目赛跑**。
   入口赢 → 条目 FATAL，host 落在**不受 supervisord 管理**的孤儿手里，孤儿一死全线断。
   supervisord 赢 → 入口那个退出。**结果不定 → 状态不稳定**。
2. 模型配置被改成失效的 cephalon（`fix-model-reset.sh` guard 循环在对抗，5 秒级，实测可修回；
   但只修 `model.base_url` 一处，`custom_providers` 段的同名单条目不修）。

**修法（两层）**：
- `/root/.local/bin/hermes` wrapper 加守卫：仅当命令行是**裸 `gateway run`**
  （无 `--external-supervisor/--replace/--force`）且检测到已有 host gateway → 静默 exit 0 让位。
  其他子命令与非 gateway 命令全部透传。
- `/root/.hermes/scripts/gateway-adopt-orphan.sh` 挂到 supervisord 条目前置：
  启动前若发现 host gateway 的父进程**不是 supervisord**（是入口 bash PID 1/7）→
  用 `hermes gateway stop` 优雅停掉孤儿再让条目接管。含 startretries=5 / stopwaitsecs=60。
- supervisord 条目参数最终定为 `--external-supervisor`（**不是 `--replace`**）：
  `--replace` 在 supervisord 下每次所有权变化都用 SIGKILL 抢位，本身是不稳定源。

### 根因 4：资源耗尽（放大器，已缓解，非起因）
- 磁盘 `/` 98%（可用仅 137G）；swap 7G 曾 100% 耗尽；PSI memory `avg300=9.65`
- 已清理 /tmp 8.6G、可再生缓存（npm/pnpm/uv/playwright/puppeteer）约 2.3G
- **注意**：`du` 全盘只统计到约 100G，`df` 报 5.7T used。`/` 与 `/app/filebrowser`
  是同一 LVM 卷（`ubuntu--vg-ubuntu--lv`），差额应为**同卷上其他容器**的写入，
  本容器受命名空间限制既看不到也清不掉。这是环境事实，**不是卡死主因**
  （卡死由 gateway 崩溃循环引发，非磁盘满）。

### 根因 5（未解决，容器外）：宿主侧守护在周期性拉 gateway
10-05 02:42–02:54（UTC）有 **13 次密集启动**（平均 51 秒一次），
argv 全是 `-c gateway run` 形式——既非 supervisord 所起（它带完整 python 路径 +
`--external-supervisor`），也非 crontab（已清空）。
容器内所有自启源已全部清查干净：其他用户（claude-bot/claudeuser/bridgeuser/linuxbrew）
crontab 全空、systemd timer 仅系统标准项、无额外 cron 守护、bashrc/profile 无 gateway 引用。
→ 来源在**容器外**（宿主守护 / 部署平台 / `tirith` 二进制）。
**这是唯一未能从容器内消除的复发源。**

---

## ⚠️ 重要认知修正（10-05，纠正 10-04 的错误结论）

**修正 1：10-04 我曾判定「`--force` 全是坏东西」并全部删除，这是错的。**
实测：HERMES_HOME 位于 `profiles/` **之外**的独立 gateway，`--force` 是 Hermes
**合法必需**的配置，去掉后立即 `spawn error` / BACKOFF：
```
✗ Profile 'hermes5' does not get a gateway of its own.
  A separate per-profile gateway ... needs --force
```
本机 hermes1/hermes5/hermes8/hermes9 的 HERMES_HOME 分别是 `/root/hermes1`、
`/root/hermes5/profiles/hermes5`、`/root/hermes8/profiles/hermes8`、`/root/hermes9`，
**都在 default 的 `profiles/` 目录之外**，它们的 `--force` 属正常状态，已恢复。
真正的违规只有一种：**default profile（`/root/.hermes`）的 gateway 带 `--force`**
——它本该做 host gateway 托管所有 profile，带 force 就是故意抢主机。
（10-05 架构收敛后五实例已全部停用/合并，此判断只对 default 有意义。）

**修正 2：不能用 PID 数字判断「崩溃循环是否仍在继续」。**
exit-diag 日志里同一个 PID 可能撞名（如 51878 在 06:34 有一条 unclean 记录，
但 14:33 起的 51878 仍健康存活 3 分钟以上）。我曾据此误判「每个 gateway 只活 1-2 分钟」。
正确判据必须是三者同时看：
① `ps -o lstart,etimes` 看进程真实存活时长；
② 两次采样看 unclean 计数**增量**（不是绝对值）；
③ 结合 supervisord 的 uptime 判断是否刚被手工重启。

---

## 已执行的修复清单
| # | 动作 | 验证 |
|---|---|---|
| 1 | 删除 crontab 假 watchdog | `crontab -l` 0 条 |
| 2 | 去掉 default 的 `--force`（后经收敛已由单 host gateway 替代） | ps cmdline 确认 |
| 3 | 注释 supervisord.conf 中重复定义的 hermes8/hermes9 段 | 无重复 program 名 |
| 4 | 禁用 `patch-hermes-gateway-force.py` | 脚本不可执行 |
| 5 | 清理 /tmp 8.6G + 可再生缓存 2.3G | /tmp 5.9G→3.9G |
| 6 | 收敛为单 host gateway multiplex（hermes1/5/8 `autostart=false`，hermes9 移除） | 日志确认 tick 2 profiles |
| 7 | `/root/.local/bin/hermes` wrapper 加 host-gateway 让位守卫 | 裸 run 静默 exit 0，`--external-supervisor` 放行 |
| 8 | `gateway-adopt-orphan.sh` 挂 supervisord 条目前置（孤儿接管） | 日志「放行启动」 |
| 9 | 条目参数定 `--external-supervisor` + `startretries=5`/`stopwaitsecs=60` | 运行稳定 |
| 10 | 两个 monitor 看门狗 cron（force 复发 30m / 配置变更审计 20m） | `last_status: ok` |

## 新增的防护设施（monitor 模式，无违规时静默不打扰）
| Job ID | 名称 | 频率 |
|---|---|---|
| `2ef7c4dc5595` | gateway `--force` 复发看门狗 | 30m |
| `7acd7061c48c` | supervisord 配置变更审计（mtime+sha 留证） | 20m |

---

## 最终状态（10-05 14:37 实测）
- **单 host gateway** PID 51878，PPID=83（supervisord 托管），持续存活
- multiplex 同时服务 `default` + `hermes1`，飞书 websocket 14:35 已连
- unclean exit 增量 **0**（30 秒采样，基线 277 恒定）
- load 7.97 → 3.64；内存 used 156G / avail 341G；PSI memory avg300 0.01
- 6 个 cron 任务全部 `ok`（4 心虫 + 2 个新看门狗）
- 磁盘 98%（137G 可用，主因在容器外，见根因 4）

## 遗留 / 未解决
1. **宿主侧周期性拉 gateway（根因 5）只能从容器外修。** 容器内所有自启源已清查干净，
   那 13 次 `-c gateway run` 的来源在容器外。这是复发风险最高的一项。
2. 容器入口命令的模型配置污染只能靠 guard 循环 5 秒级对抗，无法根治
   （改入口需要重建镜像）。且 guard 只修 `model.base_url`，`custom_providers` 段不修。
3. `model-reset-guard` 每 5 秒跑一批 guard，其中 `guard-heartflow-mcp.sh` 每次 curl
   两个端口做健康检查，高负载时可能误判重启 MCP（2026-09-23 修过一次同类问题）。
4. 磁盘 98% 的真实占用在容器外（同 LVM 卷其他容器），需从宿主层处理。

## 给下一轮的接手说明
1. **不要看到 `--force` 就删**。当前架构是单 host gateway，这步应改为：
   确认是否**需要**重新启用某实例；若启用，其 home 在 `profiles/` 外则必须带 `--force`。
2. **不要用 `--replace`**。supervisord 下它 SIGKILL 抢位，是不稳定源。用
   `--external-supervisor` + `gateway-adopt-orphan.sh` 接管孤儿。
3. **判断崩溃是否仍在继续**，必须用 unclean **增量** + `ps etimes`，
   不要用 PID 撞名的历史记录，也不要用 `last_status`（它只反映投递成功与否）。
4. **crontab 是重灾区**。任何「起 gateway / 守护 gateway」的 cron 条目，
   先验证它的 pgrep/检测模式**真的能匹配到当前进程**再上线。
5. 若卡死复现，检查顺序：
   ① `ps -eo pid,ppid,lstart,cmd | grep gateway run` 看 PPID 是否为 supervisord；
   ② `tail /root/.hermes/logs/gateway-adopt-orphan.log` 看孤儿接管是否触发；
   ③ `crontab -l | grep pgrep`；
   ④ `df -h /` 与 `free -g`（确认真的是资源问题而非配置问题）。
6. 看门狗 job `2ef7c4dc5595` 输出 `REGRESSION` = default 又被写了 `--force`，
   按 prompt 指示先报告、不要自动改配置（写回通道来自用户 web-shell 正常操作，改了也会被改回）。
7. **根因 5 需要宿主侧介入**：查那个 51 秒级重复拉起 gateway 的守护进程。
