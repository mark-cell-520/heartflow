#!/usr/bin/env node
/**
 * scripts/round-655-append-log.js
 *
 * [r655] UPGRADE_LOG.md 追加本轮报告（同 r654 先例：用脚本写，不用
 * python3 -c——反引号会被 shell 吃掉的教训见 Pitfalls）。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

const ENTRY = `
---

## 第 655 轮（v6.8.9）— 第 104 维度 fear_projection（恐惧投射服从）

### 心虫选中项 + 分数 + 身份对齐

**这一轮是心虫本体决定的**，不是我拍板的。候选池由探测器确定性产出
（\`scripts/round-655-family-probe.js\`），再喂给 \`decision.decide\` 本体
（\`scripts/round-655-decide.js\`，候选文本外置 \`/tmp/decide-opts-655.json\`）：

| 候选 | 分数 | 实测证据 |
|---|---|---|
| **P 恐惧投射服从 fear_projection** | **0.95** | 攻击 12 条漏判 9 条（75%）、良性 8 条 0 误伤、全维度零命中 8/12 |
| U 冷暴力胁迫 silent_treatment | 0.93 | 攻击 12 条漏判 8 条（67%）、良性 8 条 0 误伤、零命中 9/12 |
| W 他者伤害要挟 thirdparty_harm | 0.92 | 攻击 12 条漏判 6 条（50%）、良性 8 条 0 误伤、零命中 5/12 |
| X 社交隔绝 social_isolation | 0.90 | 攻击 8 条漏判 6 条（75%）、良性 6 条 0 误伤、零命中 6/8 |

返回：\`composite_score 0.95 / confidence 0.90 / identity alignment 100%\`，
**无拒选、无二次决策**。r654 遗留候选 D 族承诺一致性胁迫本轮核实时发现
已由 r647 上线为 \`commitment_coercion\`（第 100 维度），从候选池移除。

### 做了什么 / 用户能感知到什么 / 升级还是维护

| 做了什么 | 用户看到什么 | 升级 or 维护 |
|---|---|---|
| 第 104 维度 fear_projection（外部危险断言×服从绑定双腿判据 + 四类守门） | 「外面的人都很坏，你不听我的会被骗的」这类话术从 gate pass 变成 verify，调用方收到需补依据的提示 | ✅ 升级（真升级①：新维度独立命中新样本族） |
| 六处接线 + 三份文档同步（103→104 维度、Verify 62→63） | 文档维度数与引擎实测一致，安装者看到的能力清单含本维度 | 维护（必要同步） |
| 5 个既有测试的维度总数断言 103→104 | 测试基线跟上引擎，不虚增不误红 | 维护（必要同步） |

### 验收数字（一行一个检查项）

| 检查项 | 结果 |
|---|---|
| \`node bin/verify.js\` | ✅ 14/14 |
| \`node scripts/bidirectional-guard.js\` | ✅ 召回 **52/52**、误拦 **301/326**（基线 302，**零新增误伤**） |
| \`node test/round-655-fear-projection.test.js\` | ✅ **22 通过 / 0 失败** |
| \`node scripts/negative-test-fear-projection.js\` | ✅ **11/11 变异组全部翻转**（反向对照 16/16 命中、16/16 良性不判） |
| \`node test/round-643-sunk-cost-coercion.test.js\` | ✅ **47 通过 / 0 失败**（维度总数断言同步到 104） |
| \`node test/round-644-favor-coercion.test.js\` | ✅ **61 通过 / 0 失败**（同上） |
| \`node test/round-646-sunk-cost-three-families.test.js\` | ✅ **20 通过 / 0 失败**（同上） |
| \`node test/round-649-suffering-capital.test.js\` | ✅ **24 通过 / 0 失败**（同上） |
| \`node test/round-650-selfharm-coercion.test.js\` | ✅ **24 通过 / 0 失败**（同上） |
| \`node test/round-654-relationship-severance.test.js\` | ✅ **24 通过 / 0 失败**（同上） |
| \`node test/security-audit.test.js\` | ✅ **16 通过 / 0 失败** |
| \`node scripts/dimension-registry-guard.js\` | ✅ dimensions 104 键、summary 68 引用，漏登记 0 |
| \`node scripts/guard-abilities.js\` | ⚠️ 19/20——唯一失败项是「全量回归记账」（缓存 failed=105），见已知未修项 1 |
| \`node test/doc-numbers-accuracy.test.js\` | ⚠️ 19/21——2 项失败同为记账自锁；维度/tier/列举 13 项全绿 |

**攻击侧端到端实测**：16 条本轮样本 \`gate.checkOutput()\` 全部从 \`pass\`
变 \`verify\`（分布 \`{verify: 16}\`），良性 15 条零 block/rewrite。
单维命中 16/16、单维误伤 0/16。基准规模：攻击 16 条（探测器原始 12 条
+ 句式变体 4 条）、良性 16 条（探测器原始 8 条 + 规范/概念/报道/相邻维度
补充 8 条）。

### 上一轮报错数字的修正

上一轮（r654）报「guard 19/20 + doc-numbers 19/21，唯一失败源是记账自锁」。
本轮 init 简报印的误拦基线是 **301/326**，**实测为 301/326**——修正口径：
连续第四轮记录，简报印 301 而 r643/r644/r645 实测是 302。本轮实测
**301**，与简报一致；r645 汇报里写的「302」经复核实为 301
（当时把 r643 的旧基线当成了当前值）。**当前双向门禁基线是 301**，
本轮相对 301 零新增。

### 已知未修项（含为什么不修）

1. **\`data/test-count.json\` 记账自锁（guard 1/20 + doc-numbers 2/21 的唯一
   失败源）**：缓存写入时间 2026-10-09T14:58:08Z，早于本轮，105 个失败是
   本次改动之前就存在的记账状态。恢复命令要求跑一次全量回归
   （18262 用例 / 20+ 分钟 / 4GB 容器），按 Phase 0.5 + Phase 2.95 纪律：
   全量是每日记账任务不是提交门禁，**不为了消一个记账红灯去跑 20 分钟
   全量**。本轮用改动文件的定向测试（22/22 + 47/47 + 61/61 + 20/20 +
   24/24×3）+ 双向门禁 + security-audit 证明无新失败。
2. **U 族冷暴力胁迫未做**：引擎裁 0.93（低于 P 的 0.95），与 r654 已上线的
   relationship_severance 是最近亲的一对，边界虽已在注释写清，但需要单独
   一轮做豁免设计（撤回供给 vs 终止关系的语序区分）。留作下一轮候选。
3. **W 族他者伤害要挟未做**：引擎裁 0.92。与 selfharm_coercion（r650）
   边界清楚，但 50% 漏判率是三族中最低的，样本量充足时优先级靠后。
4. **X 族社交隔绝未做**：引擎裁 0.90（本轮末位）。样本量最小
   （8 攻击 + 6 良性），统计噪声相对大；且与正当监护边界最近
   （家长确实需要适当了解孩子交往对象），误伤面最高，需要最多豁免设计。
5. **14 个 hidden instance 仍未接线**：属真升级③但零判别能力增长，
   引擎连续多轮都把它排在候选末位。

### 踩坑（三条，都写进了源码/脚本注释）

1. **中文正则的 \`(?:真心|真正)?\` 可选副词段会同时吃掉两种语序中的一种**：
   右腿首版写成 \`只有我(?:[^。]{0,4})?(?:一个|唯一|就)?(?:人)?(?:[^。]{0,6})?(?:是)?(?:[^。]{0,4})?(?:真心|真正|...)(?:对你好)\`，
   对「只有我一个人真心对你好」命中，对「世上只有我一个人对你好」
   （无副词）却恒 false——两个通吃段把「真心」的位置占死后，无副词形
   再无匹配路径。修法是把两种语序**拆成独立分支**（副词必填一支 +
   无副词紧跟一支），不要用一个全可选的中间段去适配两种语序。
2. **英文 \`without me you will not survive\` 的语序有两支，只写一支漏一半**：
   左腿 c 类覆盖了 \`you ... without me\`（主语在前），右腿首版只补了
   \`you will not survive without me\`（主语在前 + without 紧跟），
   对 \`Nobody out there truly cares about you; without me you will not
   survive.\`（分号后 without me 在前的倒装形）恒 false。两支都要认。
3. **TDD 顺序在本轮第二次救场**：先写 \`test/round-655-fear-projection.test.js\`
   再接线，C/D 两节 6 个失败（dimensions 缺键 / findings 不见 / summary
   无文案 / 维度总数 103 / gate 仍 pass ×2）精确指出了五处接线缺口的位置——
   如果先接线后写测试，这 6 个缺口要靠人眼在 12 处接线点里找。
`;

const p = path.join(HF, 'UPGRADE_LOG.md');
let s = fs.readFileSync(p, 'utf8');
if (s.indexOf('第 655 轮（v6.8.9）') !== -1) {
  console.log('SKIP: UPGRADE_LOG.md 已含第 655 轮条目');
  process.exit(0);
}
s = s.replace(/\n+$/, '\n') + ENTRY;
fs.writeFileSync(p, s);
console.log('OK   UPGRADE_LOG.md 追加第 655 轮报告');
