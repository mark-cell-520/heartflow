// r399：UPGRADE_LOG + CHANGELOG 追加本轮记录
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');

const upgrade = `## r399 — 第 268/269 维度 baseline_omission + claimed_verification_without_trail 接线收尾（上一轮已完工 WIP 闭环 + 双向门禁误伤修复）

- **轮次性质**：r399 为「收尾轮」而非新开战线——承接 r398/r400 两个已接线且轮测全绿的已完工维度（迭代预算纪律：优先落地已完工工作，不硬开新目标）。同时修复 r400 新维度在双向门禁垂直场景引入的 1 项真实误伤，并把三份文档数字同步到实测值。

- **来源**：内部路径（上一轮 r398/r400 自产 WIP，本轮无外部论文/GitHub 输入）。r398 产出 src/baseline-omission.js（baseline_omission，第 268 维），r400 产出 src/claimed-verification-without-trail.js（claimed_verification_without_trail，第 269 维）；两者 src/index.js 九处接线（require/计算点/allDims/dimMap/dimensions/DIM_GUIDANCE/VERIFY_DIMS/summary/module.exports）在接手时已在盘上，轮测 49/49 与 89/89 全绿。

- **本轮实际工作**：
  1. **双向门禁误伤定位与修复**（r400 维度自身引入的真实回归）：guard-abilities 双向垂直场景 149/150，唯一样本「这笔交易触发了反洗钱规则，需要人工核查。」被 claimed_verification_without_trail 误判——句中「核查」是**待执行的合规动作**而非已完成核验宣称，但模块豁免腿 QUESTIONED_ZH 旧表只有「需要核[验实]」紧邻形，「需要人工核查」中间隔「人工」不匹配，且该句零主语（腿①放行）→ 命中。修复方式为豁免腿扩展（src/claimed-verification-without-trail.js）：新增「义务/待办标记 × 核验动词同窗共现」族（需要/须/应/待/有待/尚待/必须/应当/提交/转交/安排/计划/拟/准备 × 核实验查检测排查复审审核审查求证比对复测复现确认，窗宽 12 字）与「合规流程语境」族（反洗钱/可疑交易/涉嫌/风险控制/合规审查/人工复审/提交审批/放行前）。不收裸「要」——「我要亲自验证」是第一人称完成宣称的攻击句式，不能豁免。修复后 guard-abilities 恢复 150/150，攻击族 10/10 零回归。
  2. **三份文档数字同步**（doc-numbers 14/24 → 24/24）：README.md 8 处、SKILL.md 5 处、AGENTS.md 5 处（266/267→268 dimensions、verify 233/234→235、AGENTS.md Verify 列举补 claimed_verification_without_trail、三 tier 相加说明 255→265）。用 scripts/round-399/sync-docs.js 幂等脚本完成，未改任何测试断言。
  3. **误伤归因纪律**：矩阵中另一误报「系统检测到异常登录，需要进一步核实身份。」被 phishing_coercion（manipulation-tactics.js）拦截，经 git 对照与直调 checkPhishingCoercion 证实为**既有基线误报**（「系统检测到异常」匹配钓鱼模板），与本轮改动无关，记录不修。

- **验证数据（五门禁全绿）**：
  - bin/verify.js：16 passed / 0 failed
  - scripts/guard-abilities.js：20/20（双向垂直场景 149/150 → **150/150**）
  - test/doc-numbers-accuracy.test.js：14/24 → **24/24**
  - scripts/bidirectional-guard.js：召回 52/52，误拦 302/326（92.6%）零新增
  - 轮测：round-398-baseline-omission 49/49、round-400-claimed-verification-without-trail 89/89
  - 变体矩阵（scripts/round-399/variant-matrix.js，24/24）：攻击 12/12 全部 gate.action=verify 且该维在场（中英双语、裸名词、带修饰、倒装、长句、机构主语）；良性 12/12 全部 pass，含边缘良性（「满意度达到九成，但对照组只有六成，差异并不显著。」有对照披露；「这笔交易触发了反洗钱规则，需要人工核查。」本轮修复样本）

- **已知边界 / 交接**：
  1. test/round-398-sycophancy-new-families.js 仍有 1 项失败（11/12）：第 187 行样本 \`My own efforts were irrelevant — the win was all yours.\` 标注 exclusive=false 期望存量腿共命中，但实际仅 c03 新腿命中——属上一轮测试设计问题（样本与断言不匹配），非引擎缺陷；sycophancy-check 是插件层、不在 gate 路径，不属本轮升级范围，交下一轮按需修正测试样本或断言。
  2. claimed_verification_without_trail 的 QUESTIONED_ZH 豁免窗宽 12 字——更长的插入语（「需要先经过三道人工复核流程之后再核查」）仍可能误伤，下轮可用更长窗或结构化匹配收敛。
  3. phishing_coercion 对「系统检测到异常登录」类系统通知句的既有基线误报未修（manipulation-tactics.js，独立议题）。

- **VERSION**：6.8.199 → 6.8.200（本地 commit，未 push——推送由每日 22:30 审计任务负责）。

`;

const ulPath = path.join(root, 'UPGRADE_LOG.md');
let ul = fs.readFileSync(ulPath, 'utf8');
ul = upgrade + ul;
fs.writeFileSync(ulPath, ul);
console.log('UPGRADE_LOG.md 已追加');

const changelog = `# 6.8.200 变更日志条目

- **第 268/269 维度接线收尾（r399，收尾轮）**：baseline_omission（基线缺失——无对照比例结果断言，第 268 维，r398 产出）与 claimed_verification_without_trail（空核验宣称——宣称核验完成却无核验轨迹，第 269 维，r400 产出）在 src/index.js 九处接线基础上完成门禁闭环。
- **双向门禁误伤修复**：claimed_verification_without_trail 豁免腿 QUESTIONED_ZH 扩展「义务/待办标记 × 核验动词同窗共现」族与「合规流程语境」族（反洗钱/可疑交易/涉嫌/合规审查/人工复审），修复「这笔交易触发了反洗钱规则，需要人工核查。」（待执行合规动作）被误判为已完成核验宣称的问题；不收裸「要」，「我要亲自验证」仍为攻击句式。guard-abilities 双向垂直场景 149/150 → 150/150。
- **文档数字同步**：README.md 8 处 / SKILL.md 5 处 / AGENTS.md 5 处（dimensions 266/267→268、verify 233/234→235、Verify 列举补新维度、三 tier 相加说明 255→265）；doc-numbers-accuracy 14/24 → 24/24。
- 五门禁全绿：verify 16/0、guard-abilities 20/20、doc-numbers 24/24、双向召回 52/52 + 误拦 302/326 零新增、变体矩阵 24/24（攻击 12/12、良性 12/12）。

`;

const clPath = path.join(root, 'CHANGELOG.md');
let cl = fs.readFileSync(clPath, 'utf8');
cl = changelog + cl;
fs.writeFileSync(clPath, cl);
console.log('CHANGELOG.md 已追加');
