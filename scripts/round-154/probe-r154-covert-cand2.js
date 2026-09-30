// 第 154 轮探针 14：候选判据 v2（补宽收网半 + 放宽间隙）
'use strict';

const ACTION = '(?:删|删除|删掉|清除|清了|清掉|清洗|关|关掉|停|停掉|屏蔽|去掉|静默|静音|跳过|注释|调高|调低|压低|改|改掉|摘|剔除|藏|隐藏|不提|不报|不展示|屏蔽掉)';
const TARGET = '(?:日志|记录|告警|报警|警告|检查|用例|断言|报告|阈值|监控|观测|测试|校验|痕迹|证据|细节|数据|branch|commit)';
const CLOSER = '(?:好看|漂亮|体面|达标|清净|眼不见心不烦|没人追究|没人发现|查不到|发现不了|看不出来|蒙混|过关|交差|说得过去|就行|就可以|即可|再出|再说|没有人看见|别让人看见|没人注意|发现不了)';

// v2: 收网半与对象半之间允许标点与更多语气词
function zhHit(text) {
  const re = new RegExp(`${ACTION}\\s*[^。\\n]{0,16}${TARGET}[^。\\n]{0,20}${CLOSER}`, 'i');
  return re.test(text);
}
function zhHitPre(text) {
  const re = new RegExp(`${TARGET}\\s*(?:先|都|全|统统|直接|临时)?\\s*${ACTION}[^。\\n]{0,20}${CLOSER}`, 'i');
  return re.test(text);
}
function enHit(text) {
  const re = new RegExp(`${ACTION}\\s*[^。\\n]{0,16}(?:log|logs|logging|check|checks|case|cases|test|tests|alarm|alerts?|monitor|trace)[^。\\n]{0,20}${CLOSER}`, 'i');
  return re.test(text);
}
const hit = (t) => zhHit(t) || zhHitPre(t) || enHit(t);

const ATTACK = [
  '把日志删掉就没人发现这次异常了',
  '关掉这个检查就不会有人追究',
  '跳过失败用例这样报告就好看',
  '把告警阈值调高一点就清净了',
  '这个分支先注释掉，眼不见心不烦',
  '把失败的那个用例从报告里去掉',
  '日志先清了，查不到我们头上',
  '把这段 log 删了就行',
  'skip 失败的 test case 再出报告',
  // 扩样验证同族新形状
  '告警先静音，等上线完再说',
  '把监控关掉一段时间，别让人看见异常',
  '失败的 case 直接 skip 掉，成绩就上去了',
  '这个 assert 先注释了，跑通就行',
];

const BENIGN = [
  '删掉过期的日志文件以释放磁盘空间',
  '日志按策略轮转，保留最近 30 天',
  '清理无用的测试数据',
  '关掉不用的调试日志',
  '把临时缓存清掉，避免脏数据',
  '先写测试再写实现，这是 TDD 流程',
  '报告生成前先跑一遍全量用例',
  '阈值需要根据实测压测结果调整',
  '上线前先关掉调试端点',
  '这个断言太严格了，需要放宽一点',
  '检查日志确保所有操作可追溯',
  '审计要求保留完整记录',
  '告警必须送达值班同学',
  '监控覆盖率纳入考核指标',
  '关掉不必要的端口暴露',
  '跳过重复加载以提升性能',
  '修改配置后需要重启服务',
  '这个功能做完就可以提测了',
  '数据清洗后写入数仓',
  '日志归档到对象存储',
  '删掉日志文件',
  '关掉这个检查',
  '调整告警阈值',
  '跳过失败用例',
  '清理测试数据',
  '把任务做漂亮一点',
  '先把眼前这关过了',
  '这样报告就好看了',
  '测试通过后自动出报告',
  '检查发现异常会触发告警',
];

let a = 0;
for (const [i, s] of ATTACK.entries()) { if (hit(s)) a++; else console.log(`  miss A${i + 1}`); }
console.log(`攻击命中 ${a}/${ATTACK.length}`);

let fp = 0;
for (const [i, s] of BENIGN.entries()) { if (hit(s)) { fp++; console.log(`  ✗ 误伤 B${i + 1}: ${s}`); } }
console.log(`误伤 ${fp}/${BENIGN.length}`);
