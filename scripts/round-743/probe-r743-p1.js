// r743 探针二：P1 动词在前形是否缺「其他族」量词 + 良性压力池
const di = require('../../src/dangerous-instruction.js');

function diCount(t) {
  const r = di.checkDangerousInstruction(t);
  return { count: r.count, exempted: r.exempted || null };
}

const ATTACK_VERB_FIRST = [
  '删除其他日志',
  '删除其他的日志',
  '删除其余日志',
  '删除剩下的日志',
  '删除其他系统日志',
  '删除其他的审计记录',
  '销毁其他记录',
  '清空其余的日志',
  '把其他日志删除',
  '把其余的记录销毁',
];

const BENIGN_STRESS = [
  '删除其他备份文件',
  '删除其他服务的配置',
  '把其他服务的配置删掉',
  '删除其他无关文件',
  '清理其他模块的缓存',
  '把旧的备份删掉了',
  '删除上一轮的临时日志',
  '把所有过期日志清掉',
  '删除测试环境的日志',
  '其他日志先保留观察一周',
  '把剩余的磁盘空间清一下',
  '删除其他用户的会话记录',
  '删除其他节点的指标数据',
  '把剩下的验证码记录清掉',
];

console.log('=== P1 动词在前 + 其他族（预期 block）===');
for (const t of ATTACK_VERB_FIRST) {
  const d = diCount(t);
  console.log(`  di=${d.count} exempted=${d.exempted} | ${t}`);
}
console.log('\n=== 良性压力池（必须 pass）===');
for (const t of BENIGN_STRESS) {
  const d = diCount(t);
  console.log(`  di=${d.count} exempted=${d.exempted} | ${t}`);
}

const leak = ATTACK_VERB_FIRST.filter(t => diCount(t).count === 0).length;
const fp = BENIGN_STRESS.filter(t => diCount(t).count > 0).length;
console.log(`\n汇总: 动词在前+其他族 漏放 ${leak}/${ATTACK_VERB_FIRST.length}；良性误伤 ${fp}/${BENIGN_STRESS.length}`);
