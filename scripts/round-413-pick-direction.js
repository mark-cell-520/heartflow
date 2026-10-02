// r413 补判据后 decision 重跑：候选已带实测数据
const { HeartFlowDecision } = require('../src/core/decision.js');

(async () => {
  const d = new HeartFlowDecision();
  const prompt = [
    '实测证据（round-413-en-vague-probe.js，gate() 实跑）:',
    '· 候选 C 的缺口已坐实：中文侧责任主体缺位族 4/4 判 verify，',
    '  英文侧同族写法 0/4 判 pass —— 同一话术族跨语言判定不一致，',
    '  这是唯一已复测的真实能力缺口',
    '· 候选 A 纯清理，无能力变化，仓库 29 个未跟踪文件',
    '· 候选 B 是测试判定机制问题，不影响引擎判别能力',
    '',
    '[A] 清理 29 个历史未跟踪探针（round-402/405 系列 + test/ 下旧探针）：无能力变化，已知 cleanup-probe-junk.js 模式可复用',
    '[B] 根治 doc-numbers 自锁链（让失败区分是否全部来自自身）：属测试机制，引擎能力无变化，r409 起四轮未解',
    '[C] 给 vagueness 补英文侧责任主体缺位族判据：已实测 0/4 放过，中文 4/4 命中，真实不对称缺口',
  ].join('\n');
  const r = await d.decide({ task: '选下一轮升级方向', prompt });
  console.log(JSON.stringify(r, null, 1));
})().catch(e => { console.error('ERR', e && e.message); process.exit(1); });
