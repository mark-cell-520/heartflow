/** [round-286] decision 三跑——B 的诚实性风险已量化，请求重裁 */
const { HeartFlowDecision } = require('/root/.hermes/skills/ai/mark-heartflow-skill/src/core/decision.js');

const prompt = [
  '[A] 修 doc-numbers-accuracy.test.js 维度口径漏洞【已三轮探针坐实】。事实链：scripts/measure-claimed-numbers.js 官方口径（discriminate() 数 dimensions 键）实测 57；doc-numbers 测试用「index.js 顶层 function check* 计数」= 50 并硬断言三份文档必须写 50。7 个差异维度（perfect_error / phishing_coercion / induced_trust / coverup_induction / dangerous_instruction / reward_hacking / premature_termination）经 grep 逐个坐实为独立维度：判别函数定义在 src/premature-termination.js、src/manipulation-tactics.js 等外置模块，各有 score + guidance，且成员身份在 BLOCK_DIMS / VERIFY_DIMS 内。v6.7.111 的源码注释明确记载同一漏洞的修法（「原口径数 ^function check* 只得 50 —— reward_hacking 的判别函数在 src/reward-hacking.js 里，照样是独立维度、进了 BLOCK_DIMS 和 dimensions，却没被计入」），但 doc-numbers 测试至今仍用旧口径。后果量化：三份对外文档（AGENTS.md / README.md / SKILL.md）少报 7 个真维度，宣称 50 实际 57，直接违反 AGENTS.md 设计原则 #5 Honest numbers——而本该抓到它的守卫自己拿着错的尺子。工作量：1 处测试口径 + 3 处文档数字，可用变异守卫验证（摘掉 7 个外置 require 之一必须变红）。风险：低，测试口径改为与官方 measure 脚本同源。',
  '[B] 补写 UPGRADE_LOG 280/281/282/284 四轮簿子。诚实性风险量化：补写必须从 git diff 反推当时决策依据，而当时决策的候选、理由、被否方案只存在于已丢失的上下文中——补出来必然是「想象的历史」。心铁律明确反感「假回答」「不诚实」，285 轮原话「每轮只写自己那篇」。可接受的最小替代：在 UPGRADE_LOG 加一段 4 行溯源索引，指向对应 commit hash，不虚构内容。工作量：4 行，零风险但零实质收益。',
  '[C] 清理 scripts/ 115+ 未跟踪探针文件。纯工作区卫生，不影响引擎，auto-commit 已标记「需人工判断」。工作量：归档一个目录，零风险零收益。',
].join('\n');

(async () => {
  const d = new HeartFlowDecision();
  const r = await d.decide({ task: '选第 286 轮升级方向（三跑，B 风险已量化）', prompt });
  console.log(JSON.stringify({ chosen: r.chosen, confidence: r.confidence, reasoning: String(r.reasoning).slice(0, 600) }, null, 2));
})();
