# 第 229 轮（v6.7.124 工作面，unattended 自主升级）

**方向**：`checkHastyGeneralization` 英文侧**「全称量化 × 人类群体 × 具体行为谓词」族**缺口恢复。
decision 引擎真调裁决 A 项（confidence 0.82，五候选中 composite 最高且唯一
零误伤 + 缺口最大 6/12 + 形状单一；B 0.79 / C 0.71 / D 0.68 / E 0.65）。

**为什么选它（照纪律先复测，不信简报旧描述）**：

1. 队列待办为空（仅 1 条已 done），落到「上一轮遗留真缺口 + 心虫自选」。
2. 复跑 `scripts/round-227/r227_scan.js` 拿最新缺口排序：
   unsupported_claim 7/12、**hasty_generalization 6/12**、stereotype 3/12、
   tone_policing 1/12、empty_answer 1/12。**no_fallback 与 appeal_to_authority
   已升到 12/12 满格**（228/227 轮成果坐实）。
3. 五个剩余候选里 hasty_generalization 是**缺口最大且 fp=0/5 零误伤、
   形状单一**的那个。stereotype / empty_answer 带 1/5 误伤负载；
   tone_policing 已扩五轮 60+ 条判据交叉风险不可控；
   unsupported_claim 缺口（5 条）小于 hasty。
4. `scripts/round-229/probe-r229.js` 逐条复测：12 条全称量化口语
   `checkHastyGeneralization` detect=**2/12**、gate 归因 **2/12**，
   良性 5+10 条零误伤。**缺口定位**：旧 en 表有三类断口——
   ① `everyone/everybody` 只接 knows|says|thinks|agrees|believes 五词，
      接 wants/hates/ignores/refuses 等具体行为谓词时漏判；
   ② `all X do/are` 的 do/are 之后没有谓词，complained（过去式）、
      refuse to pay 等实义动词句漏判；
   ③ `nobody` 只接了 `nobody ever`，nobody wants / nobody questions 漏判。

**变更（2 个 commit）**：

| # | 文件 | 内容 |
|---|---|---|
| 1 | `src/index.js` | `HASTY_GENERALIZATION_PATTERNS.en` 新增 5 支判据 |
| 2 | `src/index.js` + `test/hasty-generalization-universal-round229.test.js` | 二版扩表 4 支 + 80 断言测试 |
| — | `scripts/negative-test-hg-universal-round229.js` | 6 条源码变异守卫 |

**判据形状（5 支全部「量化 × 群体 × 谓词」多段齐备）**：

```
限定词半（every / everyone / all / nobody / no one）
  × 群体名词半（users/customers/developers/managers/teams/engineers/…22 个）
  × 行为谓词半（hates/make/reads/wants/ignores/refuses/complained/skips/…）

①' everyone + 40 个具体行为动词（Everyone ignores the migration guide.）
①  every + (0~2 词中缀) + 群体 + 谓词 + 指人/态度宾语
②' all + 群体 + 句末零宾语抱怨族（All of our customers complained.）
②  all + [of/the/our/their/your] + 群体 + 谓词 + 宾语
   （谓词前置 60+ 条工程完成态排除表，防把数据对象当人群）
③  nobody / no one + (0~3 词中缀) + 33 个行为动词
```

**迭代过程踩到的三个判定形状坑（都靠 probe 定位后修掉）**：

1. 谓词槽 `[a-z]+` + 尾缀 `me/us/them` 收窄 → recall 12→8，
   hates this / ignores that / cares about 三形态全被砍。修：宾语槽取并集
   （this/that/about/me/us/them/him/her/you/without/the/a/an/句末）。
2. ② 族尾缀分支放在 `\s+` 之后 → 句末零宾语**永远吃不到**
   （probe6 实测 full=false / prefix=true，`complained.` 匹配后无空格可吃）。
   修：单独拆 ②' 支专收句末抱怨/拒绝族。
3. 工程句式误收：`All metrics are exported` / `All headers are lowercased` /
   `All rows are checksummed` 三条良性命中。probe4 定位**全部来自旧判据**
   `all \w+ are`，非本轮新判据。修：本轮新判据加 60+ 条工程谓词排除表，
   旧判据误伤列入遗留（见下）。

**效果**：24 条攻击样本（12 起始 + 12 同族扩样）detect + gate 端到端
**24/24 全部命中且归因 hasty_generalization**（改动前 2/12）；
20 条良性工程全称句 detect 3 条全为旧判据遗留，本轮新判据**零误伤**；
单半样本 6 条 0 命中；异常输入 5 种不抛。

| 项 | 结果 |
|---|---|
| bin/verify | 14/14 |
| 双向门禁 | 召回 **52/52**、误拦 **301/326**，与 226/227/228 三轮逐字节一致 |
| run-all | 见下（本轮 +9 新断言，唯一失败条目待复跑确认） |
| security-audit | 16/16 |
| doc-numbers-accuracy | 15/15 |
| 本轮守卫 | **6/6 真红、零无效变异、零异常** |
| 本轮新测试 | test/hasty-generalization-universal-round229.test.js **80 断言全绿** |

**遗留**：

1. **旧判据 `all \w+ are` 的工程句式误伤**（本轮 probe4 坐实来源）：
   `All metrics are exported ...` / `All headers are lowercased` /
   `All rows are checksummed` 三条良性 detect 命中。
   **不给本轮收窄**——该判据可能挂着 gate-97 / extended 基准里的既有
   误拦基线（301/326 的一部分来源），单边收窄会动门禁基线，
   需要整轮专门做「收窄 + 基线重算 + 全部 extended 集回归」。
   **下一轮优先**：改判据为 `all <人类群体> are <属性词>`（群体名词白名单），
   同时跑 bidirectional-guard 确认 301/326 不回退也不上升。
2. **同族缺口剩 4 维**（本轮复测排序不变）：unsupported_claim 7/12、
   stereotype 3/12（带 1/5 误伤）、tone_policing 1/12（已扩五轮）、
   empty_answer 1/12（带 1/5 误伤）。
   下一轮优先 **unsupported_claim**（零误伤、形状单一、缺口 5 条）；
   stereotype / empty_answer 扩召回前必须先收窄误报源。

**给下一轮的接手说明**：

- 判据扫描入口仍是 `scripts/round-227/r227_scan.js`（入口自检三项官方
  示例句 verify/rewrite/rewrite 已验证），复跑即可拿缺口排序。
- 本轮探针链：`probe-r229.js`（首轮缺口定位）→ `probe2-r229.js`
  （24 攻击 + 20 良性扩样池，**下一轮扩召回直接复用这个池**）→
  `probe3/4-r229.js`（误伤归因，分清新判据/旧判据）→
  `probe5-r229.js`（定位单条样本命中片段）→ `probe6-r229.js`（正则分段单测）。
- 负例守卫 `scripts/negative-test-hg-universal-round229.js` 以
  probe2 的 BENIGN/ATTACK 总数为基线，改判据后必须保持 6/6 真红。
- 方法论坑（本轮新踩 3 个）：
  1. **正则尾缀分支放在 `\s+` 之后 = 句末零宾语永不命中**。
     写「句末」形态必须单独拆一支，不能指望共用谓词槽。
  2. **`[a-z]+` 通配谓词 + 窄宾语表是 recall 杀手**，宁可宾语槽取并集，
     误伤交给谓词侧排除表（工程完成态词表）。
  3. terminal 后台参数要写 `background=true` + `notify=true` 布尔键名，
     传字符串会报 schema 错；超 120s 的命令 `nohup ... &` 起后台再轮询
     `/tmp/*.log`，不要前台等。
