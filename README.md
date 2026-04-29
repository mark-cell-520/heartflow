# HeartFlow

<p align="center">
  <strong>心虫 / HeartFlow</strong><br>
  <em>一个通用的 AI 能力增强 Skill：逻辑、决策、记忆、执行。</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-11.3.0-blue" alt="版本">
  <img src="https://img.shields.io/badge/license-MIT-orange" alt="许可证">
  <img src="https://img.shields.io/badge/focus-logic%20%7C%20decision%20%7C%20memory%20%7C%20execution-7C3AED" alt="聚焦">
</p>

---

## 核心定位

HeartFlow 是一个通用 AI Skill，不依赖特定平台，不要求独立 Web 页面，也不要求独立 API 才能发挥价值。

它的目标是增强任何能读取 Skill 的 AI：

- 逻辑更稳
- 决策更清楚
- 记忆更连续
- 执行更可靠

---

## 安装方式

### 方式一：本地直接使用

如果你已经把仓库放在本地，优先读取：

- `SKILL.md`
- `README.md`
- `INSTALL_FOR_AI.md`
- `VERSION`

### 方式二：复制到 Skill 目录

```bash
cp -r mark-heartflow-skill ~/.hermes/skills/ai/heartflow
```

也可以放到其他支持 Skill 的目录中，例如 OpenClaw、Claude、GPT、通用 AI 目录。

### 方式三：直接安装脚本

```bash
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill
bash install.sh
```

---

## 为什么不是单一 AI 绑定

HeartFlow 的设计前提就是通用性：

- 它不绑定某个固定模型名
- 它不依赖某个固定 UI
- 它不要求只能在某个平台上运行
- 它更像能力层，而不是单一产品壳

如果某些旧文案写得像“只能给某个 AI 用”，那只是历史遗留，不是 HeartFlow 的真实边界。

---

## 核心能力

- 逻辑推理
- 决策验证
- 记忆管理
- 执行推进
- 自检与修正
- 长期协作稳定性

---

## 兼容说明

HeartFlow 可通过不同形式使用：

- 读取 `SKILL.md`
- 读取 `INSTALL_FOR_AI.md`
- 放入 AI 工具目录
- 作为通用技能提示注入

这意味着它不应被描述成“必须打开某个网页才能使用”的东西。

---

## 安全边界

- 默认不启用高风险自动化
- 不默认输出密钥、token、密码、隐私数据
- 删除、覆盖、force、不可逆操作需要确认或回退方案
- 若接入微信、网络调用、自动脚本、代码改写，需按环境再加权限控制

---

## 一句话

> HeartFlow 让 AI 从“会说”升级到“会想、会判、会记、会做”。
