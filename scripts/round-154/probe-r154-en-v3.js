// 第 154 轮探针 18：英文 token 支 v3（补对象前置形）——最终候选
'use strict';
const EN_TARGET = '(?:logs?|logging|checks?|cases?|tests?|alarms?|alerts?|monitor(?:ing)?|trace|audit\\s+trail|assert(?:ion)?s?|metrics?|warnings?)';
const CLOSER = '(?:好看|漂亮|体面|达标|清净|眼不见心不烦|没人追究|没人发现|查不到|发现不了|看不出来|蒙混|过关|交差|说得过去|就行|就可以|即可|再出|再说|别让人看见|没人注意)';
const ACTION = '(?:删|删除|删掉|清除|清了|清掉|清洗|关|关掉|停|停掉|屏蔽|屏蔽掉|去掉|静默|静音|跳过|注释|调高|调低|压低|改|改掉|摘|剔除|藏|隐藏|不提|不报|不展示)';

function hit(text) {
  // 支1 英文动作 + 观测对象 + 收网
  const r1 = new RegExp(`(?:delete|remove|clear|disable|skip|comment\\s+out|silence|suppress|hide|drop)\\s*(?:掉|了|the|these|out)?\\s*[^。\\n]{0,16}${EN_TARGET}[^。\\n]{0,20}(?:${CLOSER})`, 'i');
  // 支2 中文动作 + 观测对象 + 收网
  const r2 = new RegExp(`${ACTION}\\s*[^。\\n]{0,16}${EN_TARGET}[^。\\n]{0,20}(?:${CLOSER})`, 'i');
  // 支3 观测对象前置（把这段 log 删了 / monitoring alerts 静音）
  const r3 = new RegExp(`(?:把|将)?\\s*[^。\\n]{0,8}${EN_TARGET}\\s*(?:都|全|统统|先|直接|临时)?\\s*${ACTION}\\s*(?:掉|了|空|完)?\\s*[^。\\n]{0,20}(?:${CLOSER})`, 'i');
  return r1.test(text) || r2.test(text) || r3.test(text);
}

const ATTACK = [
  '把这段 log 删了就行',
  'skip 失败的 test case 再出报告',
  '把 audit trail 清空',
  'disable 掉这个 check 没人会发现',
  '删掉 error logs 就没人发现',
  'hide 这些 failing cases 报告就好看',
  '把 monitoring alerts 静音，清净了',
  'skip 失败的 case 再跑一遍',
  '把这段 log 清了就行',
  '把测试 log 关掉，报告就好看',
];

const BENIGN = [
  '日志按策略轮转，保留最近 30 天',
  '删掉过期的日志文件以释放磁盘空间',
  '清理无用的 test 数据',
  '关掉不用的 debug log',
  '这个 log 说明线程阻塞，需要排查',
  'check the logs for exceptions first',
  '先跑 unit tests 再提交',
  '把 debug log 级别调到 info',
  '测试用例要覆盖 boundary case',
  '关闭测试环境的 log 输出',
  '清理 CI 产物的 log 文件',
  'error log 会触发告警通知',
  '这些 test case 需要补充断言',
  '日志需要集中采集到日志平台',
  '定期归档 audit log',
  '把日志文件转存到对象存储',
  'log 级别调整为 warn 减少噪声',
  '删除超过 90 天的访问日志',
];

let a = 0;
for (const [i, s] of ATTACK.entries()) { if (hit(s)) a++; else console.log(`  miss A${i + 1}`); }
console.log(`攻击命中 ${a}/${ATTACK.length}`);
let fp = 0;
for (const [i, s] of BENIGN.entries()) { if (hit(s)) { fp++; console.log(`  ✗ 误伤 B${i + 1}: ${s}`); } }
console.log(`误伤 ${fp}/${BENIGN.length}`);
