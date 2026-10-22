# HeartFlow 安装

仓库：**https://github.com/mark-cell-520/heartflow**（public）
npm 包：**@yun520-1/heartflow**

要求 **Node.js >= 18.17**。无 GPU、无数据库、无 API key、运行时无网络请求、零运行时依赖。

---

## 方式一：完整克隆（推荐，用于开发）

```bash
git clone https://github.com/mark-cell-520/heartflow.git
cd heartflow
npm install          # 无运行时依赖，仅装 devDependencies（测试用）
node bin/verify.js   # 14 项安装检查
node bin/cli.js status
```

---

## 方式二：sparse 克隆（~13MB，只要引擎）

仓库全量约 507MB（含公式语料、模型、历史归档）。只想跑引擎时用 sparse-checkout
只取必要目录：

```bash
git clone --depth 1 --filter=blob:none --sparse \
  https://github.com/mark-cell-520/heartflow.git heartflow
cd heartflow
git sparse-checkout set src bin mcp test VERSION package.json

node bin/verify.js   # 预期 14 passed / 0 failed
node bin/cli.js status
```

已实测：以上 sparse 集 **13MB**，`verify.js` 14/14，`cli.js status` 正常返回
`"status": "running"`。

> `formulas/`（5.4MB）不在最小集内。不取它公式引擎会以空库启动，判别/决策/门禁
> 等核心能力不受影响。需要公式计算时补：`git sparse-checkout add formulas`。

---

## 方式三：npm

```bash
npm install @yun520-1/heartflow
```

```javascript
const { check } = require('@yun520-1/heartflow');
const r = check('According to 2025 Harvard research, coffee extends life by 12.5 years');
console.log(r.gate.action);   // 'verify'
```

---

## 可选组件

| 目录 | 体积 | 内容 | 需要时 |
|------|------|------|--------|
| `formulas/` | 5.4MB | 公式库 JSON | 公式计算 |
| `formulas-corpus/` | 47MB | 公式训练语料 | 公式库研究 |
| `models/` | 1.3MB | 共情检索等模型数据 | 共情回应 |
| `dict-data/` | 1.4MB | 词典数据 | 中文分词调优 |
| `skills/` | — | 工作流技能文档 | 心虫开发协作 |
| `test/` | — | 547 个测试 | 改引擎前必取 |

取用方式：`git sparse-checkout add <目录>`。

---

## MCP server

```bash
node src/mcp-server.js --port 8588
# 或 Unix socket：
node src/mcp-server.js --socket /tmp/heartflow.sock
```

连接：

```bash
hermes mcp add heartflow --url http://localhost:8588/mcp
```

首次启动自动生成 bearer token 并写入 `.env`（不入库）。无有效 token 的请求返回 `401`。
`tools/call` 有三层写权限：`guest` 只能调只读工具，4 个状态变更工具
（`heartflow_memory_write_control`、`heartflow_memory_eraser`、
`heartflow_decision_decide`、`heartflow_self_heal`）需要 OID header 或 bearer token。

---

## 验证安装

```bash
node bin/verify.js                    # 14 项安装检查
node test/run-all.js                  # 547 个测试
node scripts/guard-abilities.js       # 18 项能力守护
```

---

## 全新安装注意事项

### 禁止
- **不要**用 `cp -a` 复制现有安装（会带入运行时文件/缓存/其他 profile 配置）
- **不要**把安装目录建在已有项目目录下
- **不要**用 root 用户直接跑生产实例

### 推荐
- 每个实例配置 `HERMES_HOME` 完全隔离
- 目标目录必须是真实目录（不能是 dangling symlink）
- 完成后再手动配消息平台（飞书/微信等）
