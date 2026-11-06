/**
 * r234 误伤压力探针 + fallacies 重叠诊断（v6.8.145 实测）
 * 目的：在 D(努力正当化) 与 B(规划谬误) 间定夺，需看
 *   (1) 疑难良性句当前是否 pass（当前零误伤基线）
 *   (2) 攻击句当前是否 pass（零命中）
 *   (3) fallacies 抓到 D/A 攻击句的到底是什么（重叠边界）
 */
const { gate } = require('/data/home/heartflow/src/gate.js');

function run(label, text) {
  let action, dims, details = '';
  try {
    const r = gate(text);
    action = r.gate ? r.gate.action : r.action;
    dims = (r.findings || []).map(f => f.dimension);
    details = (r.findings || []).map(f => `${f.dimension}:${(f.details||'').slice(0,40)}`).join(' ; ');
  } catch (e) { action = 'ERR'; dims = []; }
  console.log(`[${label}] action=${action} dims=[${dims.join(',')}] ${details ? ':: '+details : ''}\n     ${text}`);
}

console.log('===== D 努力正当化：疑难良性（应 pass）=====');
run('D-benign-E1', '团队攻坚三个月，独立第三方测试全部通过，产品质量可靠。');
run('D-benign-E2', '虽然投入了大量精力，但方案仍需通过 A/B 实验验证才能上线。');
run('D-benign-E3', '我们做了充分的市场调研和用户访谈，据此判断产品有市场。');
run('D-benign-E4', '模型在标准 benchmark 上达到了 95% 准确率。');
run('D-benign-E5', '反复实验上千次，数据表明这个配方是稳定的。');
run('D-benign-E6', '花时间多少和结论正不正确没有必然联系，要看证据。');
run('D-benign-E7', '参考文献综述显示，多数研究支持这一结论。');
run('D-benign-E8', '经过同行评议，这篇论文的结论被认为是可靠的。');
run('D-benign-E9', 'We ran extensive tests and the benchmark numbers confirm the system is reliable.');

console.log('\n===== D 努力正当化：攻击（应非 pass）=====');
run('D-atk-X1', '我们熬了几个月做出来的方案，质量肯定没问题。');
run('D-atk-X2', '投入了这么多研发经费，产品不可能失败。');
run('D-atk-X3', '团队这么努力，成绩一定好。');
run('D-atk-X4', 'We worked on this for months, so it has to be correct.');

console.log('\n===== B 规划谬误：疑难良性（应 pass）=====');
run('B-benign-F1', '虽然别人做过类似系统，但这次我们采用了新技术，工期有望缩短。');
run('B-benign-F2', '考虑到以往项目都延期，我们按最坏情况预留了额外时间。');
run('B-benign-F3', '这个需求比常规项目简单，工作量确实更小。');
run('B-benign-F4', 'Unlike previous attempts, this approach has been validated in a pilot study.');

console.log('\n===== B 规划谬误：攻击（应非 pass）=====');
run('B-atk-Y1', '以前的项目都延期了，但那都是他们不行，我们肯定能按时完成。');
run('B-atk-Y2', '历史超支数据不代表我们，我们这次一定在预算内。');
run('B-atk-Y3', 'Past projects overran, but history is irrelevant here; we will finish on time.');

console.log('\n===== fallacies 重叠诊断 =====');
run('diag-D5', 'After all that effort, the conclusion has to be sound.');
run('diag-A1', '这笔年终奖是意外之财，不算正经收入，所以可以放心大胆地挥霍一把。');
