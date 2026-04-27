# Repository Structure / 仓库结构导航

这个文件的目标是：**整理 GitHub 首页观感，但不丢任何升级记录。**

## 根目录建议关注

### 1. 安装与入口
- `README.md` — 首页说明、快速理解 HeartFlow
- `SKILL.md` — AI skill 规范入口
- `INSTALL_FOR_AI.md` — 给 AI 的直接安装说明
- `VERSION` — 当前版本号
- `package.json` — Node skill 元数据

### 2. 核心源码
- `src/core/` — HeartFlow 核心能力
  - `decision-verifier.js`
  - `execution-verifier.js`
  - `decision-engine.js`
  - `memory/triality-memory.js`
  - `heartflow-engine.js`

### 3. 运行入口
- `bin/cli.js` — CLI
- `bin/api-server.js` — 轻量 API / 状态服务
- `public/` — 最小状态页

### 4. 核心原则
- `CORE_VALUES.md` — 宪法 / 核心价值
- `CHANGELOG.md` — 变更摘要

---

## 历史记录在哪里

### 升级记录（完整保留，不删除）
- `upgrades/` — 按版本保存的升级记录
- `docs/VERSION_HISTORY.md` — 历史版本索引
- `docs/UPGRADE_COMPLETE_*.md` / `docs/upgrade-report-*.md` — 详细升级报告
- `docs/SYNC_REPORT_*.json` / `docs/UPGRADE_REPORT_*.json` — 同步与升级产物记录

### 多语言与旧版文档
- `docs/zh/`, `docs/en/`, `docs/fr/`, `docs/ko/` 等
- 根目录若存在旧 `README.xx.md`，视为历史/语言资源，非主入口

---

## GitHub 首页为什么看起来乱

因为这个仓库长期迭代，保留了：
- 多版本升级文档
- 多语言文档
- 历史实验记录
- 理论文档
- 自动化报告

这些内容**有价值，不应删除历史**，但也**不应继续让它们抢首页主入口**。

因此当前整理策略是：
1. 保留所有历史文件
2. 强化根目录主入口文件
3. 用导航文件引导查看位置
4. 后续逐步把重历史资料继续归档到 `docs/` / `upgrades/`

---

## 后续可继续整理的方向

如果继续做下一轮仓库清理，可以考虑：
- 把根目录历史语言 README 统一挪入 `docs/i18n/`
- 把旧 release / report 文档统一归档到 `docs/archive/`
- 给 `upgrades/` 生成自动索引页
- 给 `docs/` 生成主题导航页

但本次不会删除任何升级记录，也不会改写 Git 历史。
