// 第 154 轮探针 9：en-clause 支净增量归因（新旧版本子进程比对）
// 问题：S2/S3 场景 fams=2 是否本来就成立（anchor-mix + tier1/transitions
// 已是两票）？若成立，本支净增量为 0，应回滚。
// 方法：git show HEAD:src/shield/ai-writing-tell.js（本轮改动前版本）写到
// /tmp 副本，两个子进程各跑同一批样本，只比数字。
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src', 'shield', 'ai-writing-tell.js');
// ⚠️ 旧副本必须与源文件**同目录**：源文件 require '../utils/safe-regex.js'
// 是相对路径，放子目录会多一层导致断链（本轮实测：src/shield/ 下子目录
// 也不行）。用完即删（脚本尾部 rmSync）。
const OLD = path.join(ROOT, 'src', 'shield', '.awt154-old-tmp.js');

// 旧版本 = HEAD（本轮 en-clause 改动尚未提交，HEAD 是上一轮完工态）
const oldSrc = cp.execSync('git show HEAD:src/shield/ai-writing-tell.js', { cwd: ROOT, encoding: 'utf8' });
fs.writeFileSync(OLD, oldSrc);

// 样本：探针 1 全部 30 条 + 探针 5/6 良性 24 条 + 引用池 20 条，逐条比
const ATTACK = [
  '总而言之，This approach demonstrates significant value across multiple dimensions of our work.',
  '综上所述，我们需要 comprehensively evaluate 这个方案的优劣与可行性。',
  '值得注意的是，It is worth noting that 这个策略存在潜在的重大风险。',
  '总的来说，In conclusion 这个方案是可行且 robust 的。',
  '总之，In conclusion, we should leverage this robust framework to streamline processes.',
  '换句话说，we need to delve into the intricate details of the design.',
  '这个 robust 的方案能够 multifaceted 地解决问题，效果显著。',
  '我们需要 holistic 地 streamline 整个流程，实现质的飞跃。',
  '这是一个 game-changer，可以 leverage 现有资源创造价值。',
  '系统 poised 实现 unprecedented 的增长，前景十分光明。',
  '综上所述，we need to comprehensively evaluate 这个方案的优劣。',
  '值得注意的是，it is important to note that 这个方案存在风险。',
  '首先，let us consider the trade-offs between latency and throughput。',
  '总之，we should leverage this framework to streamline the whole process。',
  '值得注意的是，you need to ensure that every case is deterministic。',
  '总体来说，they plan to refactor the module before the release。',
  '首先，it is crucial that we validate all edge cases。',
  '换句话说，we can avoid this by caching the parsed result。',
  '总的来说，this approach requires us to rethink the data model。',
  '一方面，our team needs to balance latency against throughput。',
  '第二，you must double-check the identifier before merging。',
];

const BENIGN = [
  'この API は robust な設計になっており、retry 時に exponential backoff を使います。',
  'システムの throughput を改善するため、cache layer を comprehensive に見直しました。',
  '이 모듈은 seamless 하게 동작하고, latency 가 현저히 낮습니다.',
  '우리 팀은 holistic 접근으로 throughput 을 개선했습니다.',
  'Этот сервис работает стабильно, throughput выше на 30 процентов.',
  'Мы используем robust подход к deployment.',
  '此服务运行 robust 且速度极快',
  'ระบบนี้มีความ robust สูง และ latency ต่ำมาก',
  '这个 pipeline 需要 comprehensive 的 retry 策略，覆盖 timeout 和 rate limit 两类失败。',
  '我们把 gateway 重写成 leverage 了连接池的实现，throughput 提升明显。',
  '服务端对请求做 comprehensive 的校验，包括 timeout 与 rate limit 两类限制。',
  '方案 encompassing 了 all critical aspects。',
  '俗话说 as we all know，质量是设计出来的。',
  '论文标题就是 What We Cannot Know。',
  '海报上印着 Yes We Can 三个词。',
  '注释里写着 FIXME we need to clean this up later。',
  '邮件里他写 sorry I missed your call。',
  '文档写明 when we say stable we mean no API changes。',
  '代码评审记录：we should refactor this before merge。',
  'CI 失败日志：it seems the cache is stale。',
  '用户反馈原文：I cannot find the export button。',
  '会议纪要：they will provide the API spec next week。',
  'Issue 标题：we need better error messages。',
  '上线公告：we have migrated to the new cluster。',
  '总之，overall 这个方案可以上线；此外，moreover 要补监控。',
  '首先，我们需要 firstly 明确 SLA 目标；因此，therefore 再决定重试次数。',
];

const probe = path.join(ROOT, 'src', 'shield', '.awt154-probe-tmp.js');
fs.writeFileSync(probe, [
  'const { detect } = require(process.argv[2]);',
  'const A = ' + JSON.stringify(ATTACK) + ';',
  'const B = ' + JSON.stringify(BENIGN) + ';',
  'let ah = 0, fp = 0;',
  'A.forEach((s) => { if (detect(s).score > 0) ah++; });',
  'B.forEach((s) => { if (detect(s).score > 0) fp++; });',
  'console.log("ah=" + ah + " fp=" + fp);',
].join('\n'));

function run(mod) {
  const out = cp.execSync(process.execPath + ' ' + JSON.stringify(probe) + ' ' + JSON.stringify(mod), { encoding: 'utf8' });
  const m = /ah=(\d+) fp=(\d+)/.exec(out);
  return { ah: Number(m[1]), fp: Number(m[2]) };
}

const before = run(OLD);
const after = run(SRC);
console.log(`改动前: 攻击命中 ${before.ah}/${ATTACK.length} | 误伤 ${before.fp}/${BENIGN.length}`);
console.log(`改动后: 攻击命中 ${after.ah}/${ATTACK.length} | 误伤 ${after.fp}/${BENIGN.length}`);
console.log(`净增量: 攻击 +${after.ah - before.ah} | 误伤 +${after.fp - before.fp}`);

try { fs.rmSync(OLD, { force: true }); fs.rmSync(probe, { force: true }); } catch (e) { /* 清理失败不影响结论 */ }
