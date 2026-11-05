# 4 号 cronjob 安装手册

两个 job：**升级轮**（60m，写引擎） + **同步轮**（4h，只推不写）。

---

## 一、前置检查

```bash
# 1. 脚本可执行
chmod +x /root/hermes1/deploy-agent4/scripts/hf4-*.sh

# 2. 仓库可达
cd /root/hermes1/skills/ai/mark-heartflow-skill
git remote -v            # 必须看到 heartflow → github.com/mark-cell-520/heartflow.git
git fetch heartflow main --quiet && echo "GitHub 通道 OK"

# 3. 基线自检（不动手前的口径）
bash /root/hermes1/deploy-agent4/scripts/hf4-gates.sh
```

---

## 二、创建两个 job

prompt 从 `../prompts/*.md` 读取整段内容。创建命令（在本会话用 cronjob 工具执行）：

```
up = cronjob(
  action='create',
  name='agent4-心虫升级（海外单元）',
  prompt=<prompts/upgrade-prompt.md 全文>,
  schedule='60m',
  repeat=200,
  continuity=True,
  deliver='origin',
  workdir='/root/hermes1/skills/ai/mark-heartflow-skill',
  enabled_toolsets=['terminal','file','code'],
  enabled_toolouts=['terminal','file','code'],
  base_url='https://us-new.53hk.cn/v1',
  model='DeepSeek-V4-Flash',
  provider='custom'
)

sy = cronjob(
  action='create',
  name='agent4-心虫同步（只推不写）',
  prompt=<prompts/sync-prompt.md 全文>,
  schedule='4h',
  repeat=400,
  continuity=True,
  deliver='origin',
  workdir='/root/hermes1/skills/ai/mark-heartflow-skill',
  enabled_toolsets=['terminal','file'],
  enabled_toolouts=['terminal','file'],
  base_url='https://us-new.53hk.cn/v1',
  model='DeepSeek-V4-Flash',
  provider='custom'
)
```

---

## 三、创建后必做验证（三步，缺一不可）

### 1. list 确认

```python
for j in cronjob(action='list'):
    if 'agent4' in j['name']:
        print(j['id'], j['name'], j['schedule'], j['repeat'], j['next_run_at'], j.get('base_url'))
```

必须看到：
- `repeat` 分别为 200 / 400
- `next_run_at` 非空
- `enabled` 为 true

### 2. base_url 修正（已知坑）

若 `list` 显示 `base_url = null` 而创建时明明传了：

```bash
python3 - <<'PY'
import json
p='/root/hermes1/cron/jobs.json'
d=json.load(open(p,encoding='utf-8'))
jobs=d['jobs'] if isinstance(d,dict) and 'jobs' in d else d
n=0
for j in jobs:
    if 'agent4' in str(j.get('name','')):
        j['base_url']='https://us-new.53hk.cn/v1'
        j.setdefault('provider','custom')
        j.setdefault('model','DeepSeek-V4-Flash')
        n+=1
json.dump(d,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=2)
print(f'patched {n} jobs')
PY
```

改完再 `cronjob(action='list')` 复核一次。

### 3. 各手动跑一次

```python
cronjob(action='run', job_id=<upgrade_id>)
cronjob(action='run', job_id=<sync_id>)
```

然后读输出：

```bash
ls -t ~/hermes1/cron/output/<job_id>/ | head -3
```

确认：
- sync 轮的回复是"已同步，无需操作"或正常 push 报告
- upgrade 轮至少有 `hf4-status.sh` 输出（证明 terminal 工具可用）

---

## 四、排障

| 现象 | 原因 | 处理 |
|---|---|---|
| `next_run_at` 空 | job 未 enabled | `cronjob(action='update', job_id=..., enabled=True)` |
| upgrade 轮报"仓库不存在" | workdir 错 | 确认 `/root/hermes1/skills/ai/mark-heartflow-skill` 存在 |
| upgrade 轮报"门禁 FAIL" | 基线漂移 | **停下报告**，不要改断言 |
| push 一直失败 | 隐私闸命中 | 读输出里的命中项，人工确认后从 diff 移除 |
| rebase 冲突 | 与他人同时改同文件 | 停止本轮，报告冲突文件；**严禁 force push** |
| 4 号整轮无 commit | 降级 research 轮 | prompt 已内置兜底，检查是否被跳过 |
| 轮次号被他人占用 | claims.jsonl 已有 active | 脚本自动递增换号；连续 5 次被占则放弃本轮 |

---

## 五、停止 / 暂停

```python
# 暂停（保留配置，不跑）
cronjob(action='update', job_id=<id>, enabled=False)

# 彻底删除
cronjob(action='delete', job_id=<id>)
```

删除前先确认没有未推送的本地 commit：

```bash
bash /root/hermes1/deploy-agent4/scripts/hf4-status.sh
```

---

## 六、四 agent 并行检查

装完后应看到 4 组独立 cron。任一 agent 掉线，其他三组继续跑，因为：
- 状态全在仓库文件（UPGRADE_LOG.md / claims.jsonl / VERSION）
- 认领 6h 过期自动让位
- sync job 与升级 job 解耦

**每周人工复核一次**：

```bash
cd /root/hermes1/skills/ai/mark-heartflow-skill
git log --since='7 days ago' --oneline heartflow/main
grep -c '^## r' UPGRADE_LOG.md
python3 -c "
import json
for ln in open('coordination/claims.jsonl',encoding='utf-8'):
    ln=ln.strip()
    if ln: print(ln)
" | tail -20
```
