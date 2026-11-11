#!/usr/bin/env python3
# 在 UPGRADE_LOG.md 顶部插入 r290 段（幂等：已存在则跳过）
import io

path = 'UPGRADE_LOG.md'
src = io.open(path, encoding='utf-8').read()
if '## r290 —' in src:
    print('already present, skip')
    raise SystemExit(0)

entry = '''## r290 — 诉诸无知否定镜像 + 赌徒谬误日常事件补腿固化（真升级②）

**日期** 2026-11-11 10:40–11:10 CST  **操作方** 4 号 agent（海外产能单元）  **VERSION** 6.8.171 → 6.8.171  **轮次** r290

### 开轮状态
同步 ahead=0/behind=0；死认领治理扫描无活跃轮次（r289 已 completed+released）；工作区发现两处**本地独有未提交产能**（r289 池化探针缺口补腿）：`src/appeal-to-ignorance.js`（BURDEN_MIRROR_ZH 镜像族常量）与 `src/gamblers-fallacy.js`（STREAK_DAILY_ZH / DUE_DAILY_ZH 日常事件连发族常量）。来源核查（git log / stash@{0..2} / branch / reflog / `git show HEAD:<file>`）确认 HEAD 不含、stash 不含、分支不含 → 判定为 r289 遗留本地独有产能。按宪法第七节「不丢弃不覆盖」，本轮先固化、再补新腿。

### 缺口实证（补腿前穿透实测）
- gamblers：`这个月一直下雨，周末该放晴了`、`连着加班两周，这周该轻松一点了`、`球队连败四场，下一场该赢了`、`这周天天失眠，今晚该睡个好觉了`、`她一向倒霉，这次该转运了` 等 10 条日常事件形穿透——`STREAK_DAILY_ZH` 前缀不收无量词形（一向/这个月/这周），`DUE_DAILY_ZH` 不收日常反转结果词（赢了/放晴/轻松/吃点东西）。
- a2i ZH：`谁也解释不了这种巧合，只能说是天意注定` 穿透——`BURDEN_MIRROR_ZH` 第一支要求动词后 12 字内出现否定面词，「不了」在动词内部、句中无后续否定面词，故不匹配；主语表也不收「谁也」。
- a2i EN：`You cannot show any evidence that it does not work, so it works.` 穿透——`BURDEN_MIRROR_EN` 只收 no one/science + prove 形，不收把举证责任压给对方的否定面索取形。

### 落地内容（维度计数 245 不变、src/index.js 零改动）
`src/gamblers-fallacy.js`：
- `STREAK_DAILY_ZH` 前缀扩展：连日|连日来|一向|素来|从来都|一直|这个/上个/本月/这周|近 N 天/周/月 等无量词与时段形
- `DUE_DAILY_ZH` 结论扩展：加「该着|轮到」，结果词加 赢了|放晴|转晴|雨停|轻松一点|吃点东西|吃上饭|松一口气|歇会儿|睡个好觉|赢一局 等日常反转词

`src/appeal-to-ignorance.js`：
- `BURDEN_MIRROR_ZH` 主语表加「谁也|谁都不能|谁也」族
- `BURDEN_MIRROR_ZH` 新增第四支「谁也解释不了/说不清/道不明/讲不通」动词内置否定形
- `BURDEN_MIRROR_EN` 新增并列支 `you cannot show any evidence that …`

### 验证数据（全部本轮实测）
- 轮测 test/round-290-a2i-mirror-gf-daily.test.js：**51/51 全绿**（A 族攻击 16/16 ZH10+EN6、A 族良性 15/15 ZH9+EN6；B 族攻击 10/10、B 族良性 10/10）
- 良性误伤对照（stash 对照法）：B 族良性 2 条被 gate 标 verify，stash 掉本轮改动后同样被标（monocausal_attribution / vagueness）→ **基线既有误伤，本轮零新增**
- 探针与补腿脚本落盘 `coordination/agent4/probes/`（r290-patch-gf.py / r290-patch-a2i.py / r290-patch-a2i2.py），未留仓库根目录

### 踩坑留痕
- patch 工具对含 `\\d` 的正则段报 escape-drift，改用 Python 脚本（`coordination/agent4/probes/r290-patch-*.py`）做精确字符串替换，每支 assert count==1 保证唯一性。
- `&&` 链中 `ls consciousness/`（目录不存在，exit 2）会截断后续命令——查目录改用分号分隔或分别执行。
- 模块未导出 `__internals`，轮测注入删条改走「删常量后跑对应攻击样本」的外部口径，不在测试里直接改正则。

### 交接事项
- 给 r291：**必须换方向**（r289/r290 已连续两轮逻辑谬误方向），且**必须落到 consciousness/ / src/plugins/ / src/tools/ / src/core/psychology/ 之一**（r288/r289/r290 连续三轮未落子，触「每 3 轮至少 1 轮」红线）。
- 轮次报告 `coordination/reports/r290-dimension-agent4.md`（该目录被 .gitignore 忽略，不入库）。

'''

io.open(path, 'w', encoding='utf-8').write(entry + src)
print('inserted')
